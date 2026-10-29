"""Read-only mapping of semantic stitch spans to actual CLO internal shapes."""
import json
import math
from garment_engine import deserialize
from clo_curves import encode
from contour_engine import simplify_closed, SegmentChain
from clo_adapter import production_lines
from sewing_plan import compile_plan


TITLES = {
    'shoulder_right': (10, 'Плечи', 'Правый плечевой шов'),
    'shoulder_left': (11, 'Плечи', 'Левый плечевой шов'),
    'front_cap_right': (20, 'Рукава', 'Правый рукав — передняя часть оката'),
    'back_cap_right': (21, 'Рукава', 'Правый рукав — задняя часть оката'),
    'front_cap_left': (22, 'Рукава', 'Левый рукав — передняя часть оката'),
    'back_cap_left': (23, 'Рукава', 'Левый рукав — задняя часть оката'),
    'side_right': (30, 'Боковые швы', 'Правый боковой шов'),
    'side_left': (31, 'Боковые швы', 'Левый боковой шов'),
    'sleeve_underarm_right': (32, 'Боковые швы', 'Правый рукав — нижний шов'),
    'sleeve_underarm_left': (33, 'Боковые швы', 'Левый рукав — нижний шов'),
    'neckband_ring': (40, 'Горловина', 'Замкнуть бейку в кольцо'),
    'neck_front': (41, 'Горловина', 'Бейка — горловина переда'),
    'neck_back': (42, 'Горловина', 'Бейка — горловина спинки'),
}


def _points(shape):
    points = [[float(p['Point positionX']), float(p['Point positionY'])]
              for p in shape.get('PointList', []) if 'Point positionX' in p]
    if any(not math.isfinite(v) for p in points for v in p):
        raise ValueError('CLO вернул некорректные координаты внутренней линии')
    return points


def _lines(shape):
    rows = [v for v in shape.get('LineList', []) if 'Line length' in v and 'Line index' in v]
    indices = [int(v['Line index']) for v in rows]
    lengths = [float(v['Line length']) for v in rows]
    if indices != list(range(len(indices))) or any(not math.isfinite(v) or v <= 0 for v in lengths):
        raise ValueError('Не удалось однозначно прочитать индексы и длины внутренних сегментов CLO')
    return lengths


def _error(actual, expected):
    if not actual or len(actual) != len(expected):
        return float('inf')
    return max(math.hypot(a[0] - b[0], a[1] - b[1]) for a, b in zip(actual, expected))


def _native(points, offset):
    return [[x + offset[0], -y + offset[1]] for x, y in points]


def _piece_source(api, index, piece):
    raw = api.GetPatternInputInformation(index)
    root = (json.loads(raw) if isinstance(raw, str) else raw)['Pattern InputInformation'][0]
    actual = _points(root)
    cut = deserialize(piece['cut_contour'])
    local = encode(cut, True)['anchors']
    if len(actual) != len(local):
        local = [[x, y] for x, y, _ in simplify_closed(cut.clo_points(.1), .08)]
    if not actual or len(actual) != len(local):
        raise ValueError('Срез CLO не соответствует сохранённой модели')
    offset = [actual[0][0] - local[0][0], actual[0][1] + local[0][1]]
    if _error(actual, _native(local, offset)) > .06:
        raise ValueError('Координаты среза CLO не соответствуют сохранённой модели')
    children = [c for c in root.get('Children Information', []) if 'Shape index' in c]
    if len({int(c['Shape index']) for c in children}) != len(children):
        raise ValueError('Повторяются индексы внутренних линий CLO')
    return {'offset': offset, 'children': children, 'piece': piece}


def _match(source, contour=None, internal=None):
    offset, children = source['offset'], source['children']
    options = []
    if contour is not None:
        anchors = [[s.start.x, s.start.y] for s in contour.segments]
        options.append(('native_bezier', anchors, [s.length() for s in contour.segments],
                        [[i] for i in range(len(anchors))]))
        flat, lengths, groups, cursor = [], [], [], 0
        for segment in contour.segments:
            points = segment.flatten(.1)
            flat.extend([[p.x, p.y] for p in points[:-1]])
            lengths.extend(a.distance(b) for a, b in zip(points, points[1:]))
            groups.append(list(range(cursor, cursor + len(points) - 1)))
            cursor += len(points) - 1
        # Straight contours have the same two representations; do not match twice.
        if len(flat) != len(anchors):
            options.append(('legacy_polyline', flat, lengths, groups))
    else:
        lengths = [math.hypot(b[0] - a[0], b[1] - a[1]) for a, b in zip(internal, internal[1:])]
        options.append(('open_polyline', internal, lengths, [list(range(len(lengths)))]))
    matches = []
    for child in children:
        for encoding, local, expected_lengths, groups in options:
            actual = _points(child)
            if _error(actual, _native(local, offset)) > .06:
                continue
            lengths = _lines(child)
            if len(lengths) != len(expected_lengths):
                continue
            if any(abs(a - b) > max(.06, b * .0002) for a, b in zip(lengths, expected_lengths)):
                continue
            matches.append({'shape_index': int(child['Shape index']), 'encoding': encoding,
                            'points': actual, 'lengths': lengths, 'groups': groups,
                            'coordinate_error_mm': _error(actual, _native(local, offset))})
    if len(matches) != 1:
        raise ValueError('Не найдена однозначная внутренняя линия стачивания' if not matches else
                         'Найдено несколько одинаковых внутренних линий; выбор неоднозначен')
    return matches[0]


def _position(segments, distance):
    chain = SegmentChain(tuple(segment for _, segment in segments))
    local_index, t, point = chain.position(distance)
    return segments[local_index][0], t, [point.x, point.y]


def _guide(source, point):
    if 'guides' not in source:
        source['guides'] = [g for g in production_lines(source['piece']) if g['kind'] == 'alignment_guide']
    guides = source['guides']
    possible = [g for g in guides if _error([g['points'][0]], [point]) <= .06]
    matches = set()
    for guide in possible:
        expected = _native(guide['points'], source['offset'])
        for child in source['children']:
            points = _points(child)
            if min(_error(points, expected), _error(points, list(reversed(expected)))) <= .06:
                matches.add(int(child['Shape index']))
    return {'verified': len(matches) == 1, 'shape_index': next(iter(matches)) if len(matches) == 1 else None,
            'note': 'Вспомогательная внутренняя метка; не нативная надсечка'}


def _endpoint(piece, ref, source, target, pattern_index, reverse):
    contour = deserialize(piece['seam_contour'])
    ids = ref.get('segments')
    if ids is not None:
        if any(b != (a + 1) % len(contour.segments) for a, b in zip(ids, ids[1:])):
            raise ValueError('Участки шва не образуют непрерывную цепочку')
        if 'stitch_shape' not in source:
            source['stitch_shape'] = _match(source, contour=contour)
        shape = source['stitch_shape']
        line_indices = [n for j in ids for n in shape['groups'][j]]
        segments = [(j, contour.segments[j]) for j in ids]
        path = [piece['seam_contour'][j] for j in ids]
        start, end = shape['points'][line_indices[0]], shape['points'][(line_indices[-1] + 1) % len(shape['points'])]
        source_name = 'Внутренняя линия стачивания'
    else:
        from contour_engine import Point, Segment
        line = piece['internal_lines'][ref['internal_line']]
        shape = _match(source, internal=line)
        line_indices = shape['groups'][0]
        segments = [(i, Segment(Point(*a), Point(*b))) for i, (a, b) in enumerate(zip(line, line[1:]))]
        path = [{'start': {'x': a[0], 'y': a[1]}, 'end': {'x': b[0], 'y': b[1]}} for a, b in zip(line, line[1:])]
        start, end = shape['points'][0], shape['points'][-1]
        source_name = 'Внутренняя конструктивная линия'
    length = sum(shape['lengths'][i] for i in line_indices)
    return {'piece_id': piece['id'], 'piece_name': piece['name'], 'piece_role': piece['role'],
            'pattern_id': target['pattern_id'], 'pattern_index': pattern_index, 'fingerprint': target['fingerprint'],
            'verified': True, 'source_name': source_name, 'semantic_segments': ids,
            'shape_index': shape['shape_index'], 'native_line_indices': list(reversed(line_indices)) if reverse else line_indices,
            'encoding': shape['encoding'], 'reverse': reverse, 'length_mm': length,
            'start': end if reverse else start, 'end': start if reverse else end,
            'coordinate_error_mm': shape['coordinate_error_mm'], 'path': path}, segments


def resolve_map(garment, targets, api):
    from clo_operations import locate
    plan = compile_plan(garment)
    if len(targets) != len(garment['pieces']):
        raise ValueError('Нужны привязки всех деталей для карты сборки')
    indices = []
    for p, target in zip(garment['pieces'], targets):
        if target.get('id') != p['id']:
            raise ValueError('Привязка карты не соответствует детали «' + p['name'] + '»')
        indices.append(locate(api, target))
    if len(set(indices)) != len(indices):
        raise ValueError('В карте повторяется нативная деталь')
    sources, source_errors = {}, {}
    for i, p in enumerate(garment['pieces']):
        try:
            sources[i] = _piece_source(api, indices[i], p)
        except (ValueError, KeyError, TypeError, IndexError) as error:
            source_errors[i] = str(error)
    seams = []
    for n, (ref, canonical) in enumerate(zip(garment['sewing_graph'], plan['seams'])):
        priority, phase, title = TITLES.get(ref.get('name'), (100 + n, 'Соединения', 'Соединение №' + str(n + 1))) if garment['method'] == 'tshirt_setin_engineering_v1' else (n, 'Соединения', 'Соединение №' + str(n + 1))
        ends, spans, issues = [], [], []
        for side, endpoint in enumerate((ref['a'], ref['b'])):
            i = endpoint['piece']
            piece = garment['pieces'][i]
            try:
                if i in source_errors:
                    raise ValueError(source_errors[i])
                end, segments = _endpoint(piece, endpoint, sources[i], targets[i], indices[i], side == 1 and ref['direction'] == 'reverse')
                ends.append(end)
                spans.append(segments)
            except (ValueError, KeyError, IndexError) as error:
                issues.append(piece['name'] + ': ' + str(error))
                ends.append({'piece_id': piece['id'], 'piece_name': piece['name'], 'verified': False,
                             'length_mm': None, 'reason': str(error)})
                spans.append(None)
        marks = []
        if all(e['verified'] for e in ends):
            alignment = ref['alignment']
            # The existing engineering audit explicitly permits historical ring
            # joins with a generic midpoint but no required midpoint guide.
            if garment['method'] == 'tshirt_setin_engineering_v1' and ref.get('name') == 'neckband_ring':
                alignment = [0, 1]
            for fraction in alignment:
                pair = {'fraction': fraction, 'label': 'Начало' if fraction == 0 else 'Конец' if fraction == 1 else 'Контрольная метка', 'ends': []}
                for side, endpoint in enumerate((ref['a'], ref['b'])):
                    f = 1 - fraction if side == 1 and ref['direction'] == 'reverse' else fraction
                    total = SegmentChain(tuple(segment for _, segment in spans[side])).length()
                    segment, t, point = _position(spans[side], total * f)
                    i = endpoint['piece']
                    p = garment['pieces'][i]
                    code = next((m.get('code') for m in p.get('notches', []) if m.get('sewing_id') == ref['id'] and m['segment'] == segment and abs(m['t'] - t) < .0001 and m.get('code')), None)
                    if code:
                        pair['label'] = code
                    mark = {'segment': segment, 't': t, 'model_point': point,
                            'clo_point': _native([point], sources[i]['offset'])[0]}
                    if 0 < fraction < 1 and 'segments' in endpoint:
                        mark['native_guide'] = _guide(sources[i], point)
                        if not mark['native_guide']['verified']:
                            issues.append(p['name'] + ': контрольная метка не подтверждена однозначно в CLO')
                    pair['ends'].append(mark)
                marks.append(pair)
        lengths = [e['length_mm'] for e in ends]
        residual = lengths[0] - lengths[1] - canonical['ease_mm'] if all(v is not None for v in lengths) else None
        passed = abs(residual) <= canonical['tolerance_mm'] if residual is not None else None
        if passed is False:
            issues.append('Фактические длины не укладываются в допуск сопряжения')
        seams.append({'id': ref['id'], 'priority': priority, 'phase': phase, 'title': title,
                      'direction': ref['direction'], 'ends': ends, 'marks': marks,
                      'ease_mm': canonical['ease_mm'], 'tolerance_mm': canonical['tolerance_mm'],
                      'residual_mm': residual, 'lengths_passed': passed, 'issues': issues,
                      'status': 'verified' if passed is True and not issues else 'unresolved',
                      'pairing': 'А1 совместить с Б1, А2 — с Б2; стрелки показывают порядок обхода',
                      'native_seams_created': 0})
    seams.sort(key=lambda s: s['priority'])
    for order, seam in enumerate(seams, 1):
        seam['order'] = order
    return {'schema_version': 1, 'garment_id': garment['id'], 'garment_version': garment['version'],
            'status': 'verified' if all(s['status'] == 'verified' for s in seams) else 'partial',
            'seam_count': len(seams), 'verified_count': sum(s['status'] == 'verified' for s in seams),
            'mapped_count': sum(all(e['verified'] for e in s['ends']) for s in seams),
            'native_seams_created': 0, 'read_only': True, 'seams': seams,
            'pieces': [{'id': p['id'], 'name': p['name'], 'outline': p['seam_contour']} for p in garment['pieces']],
            'sequence': garment.get('operations', []),
            'note': 'Схема показывает линии стачивания. А1 и Б1 — начало выбранного обхода, А2 и Б2 — конец. Номера сегментов в интерфейсе начинаются с 1. Контрольные метки являются внутренними линиями, а не нативными надсечками. Швы и размещение не изменены; посадка не проверена.'}
