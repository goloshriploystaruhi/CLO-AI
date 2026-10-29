"""CLO AI set-in knit block 1.0. Own experimental method, not a named standard.

Formulae, sources, limits and acceptance criteria: PATTERN_ENGINEERING.md.
AI supplies scalar design parameters only. All coordinates are derived here.
Python 3.7 compatible; local coordinates x right, y down, millimetres.
"""
import copy
import math
import uuid
from datetime import datetime, timezone

from contour_engine import Point, Segment, Contour, number
from garment_engine import serialize, deserialize, offset, grain_guide, validate_garment
from geometry_validation import require_valid

METHOD = 'tshirt_setin_engineering_v1'
REQUIRED = ['chest', 'shoulder_width', 'chest_width', 'back_width',
            'armhole_depth', 'biceps', 'head']
PARAMETERS = {
    'length_mm': (400, 1000), 'chest_ease_mm': (40, 240),
    'hem_circumference_mm': (600, 1800), 'sleeve_length_mm': (150, 400),
    'cuff_circumference_mm': (180, 650), 'neck_width_mm': (100, 260),
    'front_neck_depth_mm': (40, 180), 'back_neck_depth_mm': (10, 60),
    'shoulder_drop_mm': (10, 60), 'biceps_ease_mm': (30, 140),
    'armhole_ease_mm': (0, 40), 'rib_stretch_percent': (5, 150),
    'rib_recovery_percent': (90, 100), 'rib_application_extension_percent': (1, 40),
    'body_stretch_percent': (0, 100),
}
DEFAULTS = {'seam_allowance_mm': 7, 'binding_width_mm': 15}
OPTIONAL_PARAMETERS = {'shoulder_width_mm': (250, 600)}
SPEC = {
    'id': METHOD, 'name': 'Футболка с втачным рукавом', 'category': 'tshirt',
    'variant': 'Короткий втачной рукав, круглая горловина и сложенная рибана',
    'status': 'experimental', 'implementation_version': '1.0.0',
    'coordinate_system': 'x_right_y_down_mm', 'fit_verified': False,
    'required_measurements': REQUIRED, 'required_parameters': list(PARAMETERS),
    'required_roles': ['front', 'back', 'sleeve_left', 'sleeve_right', 'neckband'],
    'parameter_ranges': dict(PARAMETERS, **OPTIONAL_PARAMETERS), 'defaults': DEFAULTS,
    'sources': [
        'https://freesewing.eu/docs/designs/library/options/',
        'https://freesewing.eu/docs/designs/onyx/options/neckbandlength/',
        'https://freesewing.eu/docs/designs/teagan/',
    ],
    'formulas': {
        'body_chest_half': '(chest + chest_ease_mm) / 4',
        'shoulder_end_x': 'shoulder_width_mm / 2; initial value = measured shoulder_width',
        'front_pitch_x': 'chest_width / 2 + chest_ease_mm / 8',
        'back_pitch_x': 'back_width / 2 + chest_ease_mm / 8',
        'armhole_y': 'armhole_depth + armhole_ease_mm',
        'sleeve_solver': 'L(cap_front) = L(front_armhole); L(cap_back) = L(back_armhole); front_span + back_span = biceps + biceps_ease_mm',
        'neckband_length': 'L(front_neck + back_neck) / (1 + rib_application_extension_percent / 100)',
        'neckband_width': '2 * binding_width_mm + 2 * seam_allowance_mm (cut width)',
    },
    'limits': ['Собственная экспериментальная основа; не Müller, ЕМКО или ЦОТШЛ',
               'Без вытачек, отрицательных прибавок и индивидуальной коррекции осанки',
               'Плечевой баланс требует примерки; перед и спинка одинаковой длины',
               'Равномерный припуск; подгибку низа определить отдельно',
               'Долевая и надсечки CLO требуют ручного назначения',
               'Максимальная растяжимость не заменяет пробу притачивания рибаны'],
    'length_tolerance_mm': .2, 'curve_tolerance_mm': .1,
    'solver_tolerance_mm': .005,
}


def reverse(s):
    return Segment(s.end, s.start, s.c2, s.c1)


def mirrored(s):
    return s.mapped(lambda p: Point(-p.x, p.y))


def requirements(profile, parameters):
    measurements = profile.get('measurements', {})
    return {
        'method': METHOD,
        'missing_measurements': [k for k in REQUIRED if measurements.get(k, {}).get('value') is None],
        'unverified_measurements': [k for k in REQUIRED if measurements.get(k, {}).get('value') is not None and measurements[k].get('status') != 'verified'],
        'missing_parameters': [k for k in PARAMETERS if k not in parameters],
        'defaults': DEFAULTS, 'experimental': True,
    }


def checked_parameters(profile, parameters):
    if not isinstance(parameters, dict):
        raise ValueError('Ожидался объект параметров футболки')
    unknown = set(parameters) - set(PARAMETERS) - set(DEFAULTS) - set(OPTIONAL_PARAMETERS) - {'material'}
    if unknown:
        raise ValueError('Футболка / неизвестный параметр: ' + ', '.join(sorted(unknown)))
    g = dict(DEFAULTS, **parameters)
    g.setdefault('shoulder_width_mm', profile['measurements']['shoulder_width']['value'])
    for k, bounds in dict(PARAMETERS, **dict(OPTIONAL_PARAMETERS, seam_allowance_mm=(3, 15), binding_width_mm=(8, 20))).items():
        try:
            v = number(g[k])
        except (ValueError, TypeError):
            raise ValueError('Футболка / требуется конечное число: ' + k)
        if not bounds[0] <= v <= bounds[1]:
            raise ValueError('Футболка / {}: допустимо {}–{}'.format(k, *bounds))
    material = g.get('material', {})
    if not isinstance(material, dict) or set(material) - {'fabric_index'}:
        raise ValueError('Футболка / материал: разрешён только индекс ткани CLO')
    if 'fabric_index' in material and (type(material['fabric_index']) is not int or material['fabric_index'] < 0):
        raise ValueError('Футболка / индекс ткани CLO должен быть целым неотрицательным числом')
    for k in REQUIRED:
        item = profile['measurements'][k]
        if item.get('unit') != 'mm' or not 50 <= number(item['value']) <= 2000:
            raise ValueError('Футболка / мерка {} должна быть 50–2000 мм'.format(k))
    if g['rib_application_extension_percent'] > g['rib_stretch_percent']:
        raise ValueError('Рибана / рабочее растяжение превышает измеренную растяжимость')
    if g['front_neck_depth_mm'] <= g['back_neck_depth_mm']:
        raise ValueError('Горловина / глубина переда должна превышать глубину спинки')
    return g


def bodice(m, g, front):
    """One cubic through the measured pitch point, split exactly at that point.

    Pitch positions use separately measured front/back widths. Shape fractions
    are explicit experimental design constants, not anthropometric standards.
    """
    n = g['neck_width_mm'] / 2
    shoulder = Point(g['shoulder_width_mm'] / 2, g['shoulder_drop_mm'])
    depth = m('armhole_depth') + g['armhole_ease_mm']
    underarm = Point((m('chest') + g['chest_ease_mm']) / 4, depth)
    pitch = Point(m('chest_width' if front else 'back_width') / 2 + g['chest_ease_mm'] / 8,
                  shoulder.y + (depth - shoulder.y) * (.55 if front else .48))
    neck_depth = g['front_neck_depth_mm' if front else 'back_neck_depth_mm']
    hem = Point(g['hem_circumference_mm'] / 4, g['length_mm'])
    if not n + 30 < shoulder.x < underarm.x - 10:
        raise ValueError(('Перед' if front else 'Спинка') + ' / ширина плеч не совместима с грудью и горловиной')
    if not n + 10 < pitch.x < underarm.x - 10 or pitch.x > shoulder.x + 20:
        raise ValueError(('Перед' if front else 'Спинка') + ' / ширина груди или спины не совместима с проймой')
    if not shoulder.y + 60 < depth < hem.y - 150 or neck_depth >= depth - 40:
        raise ValueError('Корпус / неверное положение горловины, проймы или низа')
    shoulder_line = Segment(Point(n, 0), shoulder)
    dx, dy = shoulder.x - n, shoulder.y
    length = math.hypot(dx, dy)
    nx,ny = -dy/length,dx/length
    t = .5 if front else .45
    u = 1-t
    base_y = shoulder.y*(u**3+3*u*u*t) + depth*(3*u*t*t+t**3)
    handle_a = (pitch.y-base_y)/(3*u*u*t*ny)
    base_x = shoulder.x*(u**3+3*u*u*t) + underarm.x*(3*u*t*t+t**3)
    handle_b = (base_x+3*u*u*t*handle_a*nx-pitch.x)/(3*u*t*t)
    if not 2 < handle_a < depth or not 2 < handle_b < 1.5*(depth-shoulder.y):
        raise ValueError(('Перед' if front else 'Спинка')+' / мерки требуют пройму за пределами реализованной основы; скрытой коррекции ширин нет')
    arm = Segment(shoulder,underarm,Point(shoulder.x+handle_a*nx,shoulder.y+handle_a*ny),Point(underarm.x-handle_b,depth))
    arm_upper,arm_lower = arm.split(t)
    side = Segment(underarm, hem)
    k = 4 * (math.sqrt(2) - 1) / 3
    neck_right = Segment(Point(0, neck_depth), Point(n, 0), Point(k*n, neck_depth), Point(n, k*neck_depth))
    c = Contour((shoulder_line, arm_upper, arm_lower, side,
                 Segment(hem, Point(-hem.x, hem.y)),
                 reverse(mirrored(side)), reverse(mirrored(arm_lower)),
                 reverse(mirrored(arm_upper)), reverse(mirrored(shoulder_line)),
                 mirrored(reverse(neck_right)), neck_right))
    return c, {'neck_right': [n, 0], 'shoulder_right': [shoulder.x, shoulder.y],
               'pitch_right': [pitch.x, pitch.y], 'underarm_right': [underarm.x, depth],
               'chest_center': [0, depth], 'neck_center': [0, neck_depth],
               'hem_center': [0, hem.y]}


def cap_half(width, height, front):
    """Apex -> underarm; horizontally tangent at apex, monotone x/y.

    Two halves differ in handle proportions. Width is solved, never scaled
    after construction. Splitting preserves the original exact cubic.
    """
    return Segment(Point(0, 0), Point(width, height),
                   Point(width * (.52 if front else .56), 0),
                   Point(width * (.84 if front else .88), height * (.68 if front else .62)))


def sleeve_solution(front_length, back_length, width, maximum_height):
    # 16-point Gauss-Legendre integration for the bounded monotone cap family.
    # Every accepted result is independently remeasured by adaptive subdivision.
    nodes = (.09501250983763744, .2816035507792589, .4580167776572274,
             .6178762444026438, .755404408355003, .8656312023878318,
             .9445750230732326, .9894009349916499)
    weights = (.1894506104550685, .1826034150449236, .1691565193950025,
               .1495959888165767, .1246289712555339, .09515851168249278,
               .06225352393864789, .02715245941175409)
    def fast_length(w, h, front):
        x1, x2 = w*(.52 if front else .56), w*(.84 if front else .88)
        y2 = h*(.68 if front else .62)
        result = 0
        for node, weight in zip(nodes, weights):
            for t in ((1-node)/2, (1+node)/2):
                u = 1-t
                dx = 3*(u*u*x1 + 2*u*t*(x2-x1) + t*t*(w-x2))
                dy = 3*(2*u*t*y2 + t*t*(h-y2))
                result += weight*math.hypot(dx, dy)/2
        return result
    def span(target, height, front):
        if target <= height:
            return 0
        lo, hi = 0., target
        for _ in range(26):
            w = (lo + hi) / 2
            if fast_length(w, height, front) < target:
                lo = w
            else:
                hi = w
        return (lo + hi) / 2
    lo, hi = 25., min(front_length, back_length, maximum_height) - .1
    def total(h):
        return span(front_length, h, True) + span(back_length, h, False)
    if hi <= lo or not total(hi) <= width <= total(lo):
        raise ValueError('Рукав / окат не согласуется с обхватом бицепса, длиной рукава и проймой. Измените прибавку бицепса, глубину проймы или длину рукава; детали не масштабировались')
    for _ in range(26):
        h = (lo + hi) / 2
        if total(h) > width:
            lo = h
        else:
            hi = h
    h = (lo + hi) / 2
    wf, wb = span(front_length, h, True), span(back_length, h, False)
    if max(abs(cap_half(wf,h,True).length()-front_length), abs(cap_half(wb,h,False).length()-back_length), abs(wf+wb-width)) > SPEC['solver_tolerance_mm']:
        raise ValueError('Рукав / расчёт оката не достиг точности 0,005 мм; передача в CLO остановлена')
    return h, wf, wb


def arc_mark(contour, indices, distance):
    for i in indices:
        s = contour.segments[i]
        length = s.length()
        if distance <= length:
            lo, hi = .000001, .999999
            for _ in range(30):
                t = (lo + hi) / 2
                if s.split(t)[0].length() < distance:
                    lo = t
                else:
                    hi = t
            return i, (lo + hi) / 2
        distance -= length
    raise ValueError('Надсечка / расстояние выходит за пределы шва')


def construct(profile, parameters, previous=None):
    # Reject code/coordinates even in incomplete requests, before reporting missing data.
    if not isinstance(parameters, dict) or set(parameters) - set(PARAMETERS) - set(DEFAULTS) - set(OPTIONAL_PARAMETERS) - {'material'}:
        raise ValueError('Футболка / неизвестные параметры; произвольные координаты запрещены')
    check = requirements(profile, parameters)
    if any(check[k] for k in ('missing_measurements', 'unverified_measurements', 'missing_parameters')):
        return {'needs_input': check}
    g = checked_parameters(profile, parameters)
    if previous and previous['method'] != METHOD:
        raise ValueError('Нельзя незаметно заменить методику существующего изделия')
    m = lambda k: profile['measurements'][k]['value']
    front, front_marks = bodice(m, g, True)
    back, back_marks = bodice(m, g, False)
    lf = sum(front.segments[i].length() for i in (1, 2))
    lb = sum(back.segments[i].length() for i in (1, 2))
    width = m('biceps') + g['biceps_ease_mm']
    h, wf, wb = sleeve_solution(lf, lb, width, min(g['sleeve_length_mm'] - 40, (m('armhole_depth') + g['armhole_ease_mm']) * .95))
    if not m('biceps') <= g['cuff_circumference_mm'] <= width:
        raise ValueError('Рукав / низ должен быть не уже бицепса и не шире рукава по бицепсу')
    cf = cap_half(wf, h, True).mapped(lambda p: Point(-p.x, p.y))
    cb = cap_half(wb, h, False)
    taper = (wf + wb - g['cuff_circumference_mm']) / 2
    hem_f = Point(-wf + taper, g['sleeve_length_mm'])
    hem_b = Point(wb - taper, g['sleeve_length_mm'])
    f1, f2 = reverse(cf).split()
    b1, b2 = cb.split()
    sleeve = Contour((f1, f2, b1, b2, Segment(cb.end, hem_b),
                      Segment(hem_b, hem_f), Segment(hem_f, cf.end)))
    nf = sum(front.segments[i].length() for i in (9, 10))
    nb = sum(back.segments[i].length() for i in (9, 10))
    ratio = 1 + g['rib_application_extension_percent'] / 100
    band_f, band_b = nf / ratio, nb / ratio
    band_length, bw = band_f + band_b, g['binding_width_mm']
    # Necessary head-passage estimate on the inner finished opening, not a fit certificate.
    inner_neck = nf + nb - 2 * math.pi * bw
    inner_band = band_length - 2 * math.pi * bw
    head_capacity = min(inner_neck * (1 + g['body_stretch_percent']/100),
                        inner_band * (1 + g['rib_stretch_percent']/100))
    if head_capacity < m('head') + 10:
        raise ValueError('Горловина / расчётный проход головы {:.1f} мм меньше требуемых {:.1f} мм. Увеличьте горловину или задайте измеренную растяжимость; требуется проба материала'.format(head_capacity, m('head') + 10))
    band = Contour.polygon([(0, 0), (band_f, 0), (band_length, 0),
                            (band_length, 2*bw), (0, 2*bw)])
    garment_id = previous['id'] if previous else str(uuid.uuid4())
    version = previous['version'] + 1 if previous else 1
    old = {p['role']: p for p in previous['pieces']} if previous else {}
    pieces, contours, graph = [], [], []

    def add(role, name, c, landmarks, seams, mirror=False, internal=None):
        if mirror:
            c = c.reflected('y')
            landmarks = {k: [-v[0], v[1]] for k, v in landmarks.items()}
        try:
            cut = offset(c, g['seam_allowance_mm'])
        except ValueError as error:
            message={'Self-intersecting contour':'припуск самопересекается; уменьшите припуск или измените конструкцию',
                     'Duplicate adjacent points':'совпадают соседние точки припуска'}.get(str(error),str(error))
            raise ValueError(name+' / припуск: '+message)
        piece = {'id': old.get(role, {}).get('id', str(uuid.uuid4())), 'role': role, 'name': name,
                 'seam_contour': serialize(c), 'cut_contour': serialize(cut),
                 'seams': seams, 'landmarks': {k: {'x': v[0], 'y': v[1]} for k, v in landmarks.items()},
                 'grainline': grain_guide(c), 'notches': [], 'internal_lines': internal or [],
                 'allowance_mm': g['seam_allowance_mm'], 'cut_quantity': 1, 'mirror_cut': mirror,
                 'material': g.get('material', {}), 'construction_version': version,
                 'internal_line_kinds': ['fold'] if internal else []}
        pieces.append(piece)
        contours.append(c)
        return len(pieces) - 1

    body_seams = {'shoulder_right': [0], 'armhole_right': [1, 2], 'side_right': [3],
                  'hem': [4], 'side_left': [5], 'armhole_left': [6, 7],
                  'shoulder_left': [8], 'neck': [9, 10]}
    add('front', 'Футболка — перед', front, front_marks, body_seams)
    add('back', 'Футболка — спинка', back, back_marks, body_seams)
    sl_marks = {'apex': [0, 0], 'front_underarm': [-wf, h], 'back_underarm': [wb, h], 'hem_center': [(wb-wf)/2, g['sleeve_length_mm']]}
    sl_seams = {'cap_front': [0, 1], 'cap_back': [2, 3], 'underarm_back': [4], 'hem': [5], 'underarm_front': [6]}
    add('sleeve_left', 'Футболка — левый рукав', sleeve, sl_marks, sl_seams)
    add('sleeve_right', 'Футболка — правый рукав', sleeve, sl_marks, sl_seams, True)
    band_index = add('neckband', 'Футболка — рибана горловины', band,
                    {'front_back_join': [band_f, 0], 'fold': [0, bw]},
                    {'front_attachment': [0], 'back_attachment': [1], 'ring_end': [2, 4]},
                    internal=[[[0, bw], [band_length, bw]]])
    pieces[band_index]['grainline'] = [[band_length/2, 3], [band_length/2, 2*bw-3]]
    pieces[band_index]['stretch_direction'] = [[0, bw/2], [band_length, bw/2]]
    pieces[band_index]['attachment_layers'] = 2

    def join(key, a, sa, b, sb, direction='reverse', ease=0, marks=()):
        relation_id = str(uuid.uuid5(uuid.NAMESPACE_URL, garment_id + '/' + key))
        graph.append({'id': relation_id, 'name': key, 'a': {'piece': a, 'segments': sa},
                      'b': {'piece': b, 'segments': sb}, 'direction': direction,
                      'type': 'растяжение рибаны' if ease else 'стачной',
                      'ease_mm': ease, 'tolerance_mm': .2, 'alignment': [0]+sorted({f for f,code in marks})+[1]})
        # Marks are ordered by seam traversal. Reverse matching uses 1-f.
        for f, code in marks:
            for endpoint, indices, fraction in ((a, sa, f), (b, sb, 1-f if direction == 'reverse' else f)):
                total = sum(contours[endpoint].segments[i].length() for i in indices)
                seg, t = arc_mark(contours[endpoint], indices, total * fraction)
                pieces[endpoint]['notches'].append({'segment': seg, 't': t, 'kind': 'alignment_mark',
                                                   'code': code, 'sewing_id': relation_id})

    for side, shoulder_idx, side_idx, arm_idx in (('right', [0], [3], [1, 2]), ('left', [8], [5], [6, 7])):
        join('shoulder_' + side, 0, shoulder_idx, 1, shoulder_idx, 'same', marks=[(.5, 'плечо')])
        join('side_' + side, 0, side_idx, 1, side_idx, 'same', marks=[(.5, 'бок')])
        sleeve_index = 2 if side == 'left' else 3
        # front cap traverses underarm -> apex; back cap apex -> underarm.
        join('front_cap_' + side, 0, arm_idx, sleeve_index, [0, 1],
             'reverse' if side == 'right' else 'same', marks=[(.4, 'передняя пройма')])
        join('back_cap_' + side, 1, arm_idx, sleeve_index, [2, 3],
             'same' if side == 'right' else 'reverse', marks=[(.4, 'задняя пройма 1'), (.42, 'задняя пройма 2')])
        join('sleeve_underarm_' + side, sleeve_index, [4], sleeve_index, [6], marks=[(.5, 'низ рукава')])
    join('neck_front', 0, [9, 10], 4, [0], 'same', nf - band_f, [(.5, 'середина переда')])
    join('neck_back', 1, [9, 10], 4, [1], 'reverse', nb - band_b, [(.5, 'середина спинки')])
    join('neckband_ring', 4, [2], 4, [4])
    for i in (2, 3):
        # Apex is a segment boundary. A near-boundary mark avoids split(0/1).
        pieces[i]['notches'].append({'segment': 1, 't': .999999, 'kind': 'alignment_mark', 'code': 'вершина оката — плечевой шов'})

    now = datetime.now(timezone.utc).isoformat()
    garment = {
        'id': garment_id, 'name': SPEC['name'], 'category': 'tshirt', 'subcategory': SPEC['variant'],
        'method': METHOD, 'method_spec': copy.deepcopy(SPEC), 'construction_revision': 'setin_knit_1.0.0',
        'coordinate_system': 'x_right_y_down_mm', 'version': version, 'profile_id': profile['id'],
        'measurement_snapshot': copy.deepcopy({k: profile['measurements'][k] for k in REQUIRED}),
        'parameters': g, 'material': g.get('material', {}), 'pieces': pieces, 'sewing_graph': graph,
        'construction_lines': {'chest_y_mm': m('armhole_depth') + g['armhole_ease_mm'], 'hem_y_mm': g['length_mm']},
        'derived': {'front_armhole_mm': lf, 'back_armhole_mm': lb, 'cap_height_mm': h,
                    'front_cap_span_mm': wf, 'back_cap_span_mm': wb, 'biceps_width_mm': wf + wb,
                    'neckline_mm': nf + nb, 'neckband_length_mm': band_length,
                    'neckband_extension_percent': g['rib_application_extension_percent'],
                    'estimated_head_capacity_mm': head_capacity},
        'dependencies': {'shoulder_width_mm': ['body.shoulder', 'body.armhole', 'sleeve.cap'],
                         'chest': ['body.width', 'body.armhole', 'sleeve.cap'],
                         'armhole_depth': ['body.armhole', 'sleeve.cap'],
                         'neck_width_mm': ['body.neck', 'body.shoulder', 'neckband', 'sleeve.cap'],
                         'length_mm': ['body.hem', 'body.side'],
                         'rib_application_extension_percent': ['neckband']},
        'operations': ['Сначала выполнить пробу горловины и проверить проход головы',
                       'Стачать плечевые швы, совместить вершины окатов с плечами',
                       'Втачать рукава: одинарная метка — перед, двойная — спинка',
                       'Стачать боковые швы и швы рукавов по карте соединений',
                       'Замкнуть рибану, сложить по линии сгиба и притачать в два слоя с заданным растяжением',
                       'Определить подгибку и обработку срезов, проверить баланс и выполнить примерку'],
        'readiness': {'geometry': False, 'construction': 'experimental', 'production': 'requires_review',
                      '3d': 'not_assembled', 'fit_verified': False, 'sewing_ready': False},
        'history': (previous.get('history', []) + [{'version': previous['version'], 'parameters': previous['parameters'], 'at': now}]) if previous else [],
        'created_at': previous.get('created_at', now) if previous else now, 'updated_at': now,
    }
    report = validate_engineering(garment)
    if not report['valid']:
        raise ValueError('; '.join('{piece} / {section}: {message}'.format(**e) for e in report['errors']))
    garment['engineering_report'] = report
    garment['readiness']['geometry'] = True
    garment['quality'] = {'geometry': {'passed': True},
                          'construction': {'seams_length_checked': True, 'method_status': 'experimental'},
                          'production': {'requires_review': True, 'native_grainlines_configured': False,
                                         'native_notches_configured': False},
                          '3d': {'sewing_applied': False, 'simulation_run': False, 'fit_verified': False}}
    patterns = [{'type': 'garment_piece', 'name': p['name'], 'production': p, 'segments': p['cut_contour'],
                 'semantic': {'id': p['id'], 'name': p['name'], 'type': 'garment_piece', 'role': p['role'],
                              'garment_id': garment_id, 'version': version, 'relations': []}} for p in pieces]
    return {'garment': garment, 'patterns': patterns, 'garment_generated': True, 'semantic_edit': True}


def validate_engineering(garment):
    """Recalculate from contours rather than trusting stored derived dimensions."""
    pieces, g = garment['pieces'], garment['parameters']
    specs = [{'type': 'contour', 'name': p['name'], 'segments': p['seam_contour']} for p in pieces]
    relations = [{k: v for k, v in r.items() if k in ('a', 'b', 'ease_mm', 'tolerance_mm')} for r in garment['sewing_graph']]
    from geometry_validation import validate
    base = validate(specs, relations)
    errors, checks = list(base['errors']), []

    def check(piece, section, actual, expected, tolerance=.2, unit='мм'):
        passed = abs(actual - expected) <= tolerance
        checks.append({'piece': piece, 'section': section, 'actual': actual,
                       'expected': expected, 'tolerance': tolerance, 'unit': unit, 'passed': passed})
        if not passed:
            errors.append({'piece': piece, 'section': section,
                           'message': '{:.3f} {} вместо {:.3f} {} (допуск {} {})'.format(actual, unit, expected, unit, tolerance, unit)})

    try:
        checked_parameters({'measurements': garment['measurement_snapshot']}, g)
        if garment['method'] != METHOD or [p['role'] for p in pieces] != SPEC['required_roles']:
            raise ValueError('Комплект не соответствует методике футболки с втачным рукавом')
        required_seams = {name+'_'+side for side in ('left','right') for name in ('shoulder','side','front_cap','back_cap','sleeve_underarm')} | {'neck_front','neck_back','neckband_ring'}
        if len(garment['sewing_graph']) != len(required_seams) or {r.get('name') for r in garment['sewing_graph']} != required_seams:
            raise ValueError('Карта сборки / отсутствуют обязательные швы футболки')
        validate_garment(garment)
        require_valid([{'type': 'garment_piece', 'name': p['name'], 'segments': p['cut_contour']} for p in pieces])
        cs = [deserialize(p['seam_contour']) for p in pieces]
        m = lambda k: garment['measurement_snapshot'][k]['value']
        for i in (0, 1):
            c, p = cs[i], pieces[i]
            check(p['name'], 'обхват груди / половина', c.segments[3].start.x - c.segments[5].end.x, (m('chest') + g['chest_ease_mm'])/2)
            check(p['name'], 'ширина низа', c.segments[4].length(), g['hem_circumference_mm']/2)
            check(p['name'], 'уровень низа', c.segments[4].start.y, g['length_mm'])
            check(p['name'], 'положение плеча', c.segments[0].end.x, g['shoulder_width_mm']/2)
            for a, b in ((1, 2), (6, 7), (9, 10)):
                s, t = c.segments[a], c.segments[b]
                angle = tangent_angle(s, t)
                check(p['name'], 'плавность {}→{}'.format(a, b), angle, 0, .05, '°')
            for a,b in ((1,2),(6,7)):
                check(p['name'],'непрерывность кривизны проймы {}→{}'.format(a,b),
                      curvature(c.segments[a],True)-curvature(c.segments[b],False),0,1e-6,'1/мм')
            if not all(k in p['landmarks'] for k in ('shoulder_right', 'pitch_right', 'underarm_right', 'chest_center', 'hem_center')):
                raise ValueError(p['name'] + ' / отсутствуют конструктивные точки')
        check('Рукав', 'ширина по бицепсу', cs[2].segments[3].end.x - cs[2].segments[0].start.x, m('biceps') + g['biceps_ease_mm'])
        check('Рукав', 'длина', cs[2].segments[5].start.y, g['sleeve_length_mm'])
        check('Рукав', 'ширина низа', cs[2].segments[5].length(), g['cuff_circumference_mm'])
        for i in (2, 3):
            for a, b in ((0, 1), (1, 2), (2, 3)):
                check(pieces[i]['name'], 'плавность оката {}→{}'.format(a, b), tangent_angle(cs[i].segments[a], cs[i].segments[b]), 0, .05, '°')
        neck = sum(cs[i].segments[j].length() for i in (0, 1) for j in (9, 10))
        band = sum(cs[4].segments[j].length() for j in (0, 1))
        check('Рибана', 'длина с рабочим растяжением', band*(1+g['rib_application_extension_percent']/100), neck)
        head_capacity = min((neck-2*math.pi*g['binding_width_mm'])*(1+g['body_stretch_percent']/100),
                            (band-2*math.pi*g['binding_width_mm'])*(1+g['rib_stretch_percent']/100))
        if head_capacity < m('head')+10:
            raise ValueError('Горловина / недостаточный расчётный проход головы после изменения')
        for p, c in zip(pieces, cs):
            if min(s.length() for s in c.segments) < .5:
                raise ValueError(p['name'] + ' / микросегмент линии стачивания меньше 0,5 мм')
            if not p['grainline'] or p['cut_quantity'] != 1 or not p['notches']:
                raise ValueError(p['name'] + ' / отсутствует долевая, количество или метки')
        seam_checks = []
        for r in garment['sewing_graph']:
            lengths = [sum(cs[e['piece']].segments[j].length() for j in e['segments']) for e in (r['a'], r['b'])]
            expected_ease = lengths[0]*(1-1/(1+g['rib_application_extension_percent']/100)) if r['name'] in ('neck_front','neck_back') else 0
            check(r['name'], 'заданная посадка / растяжение', r['ease_mm'], expected_ease)
            marks = []
            for endpoint, total in zip((r['a'],r['b']),lengths):
                p,c = pieces[endpoint['piece']],cs[endpoint['piece']]
                ids = endpoint['segments']
                group = {}
                for mark in p['notches']:
                    if mark.get('sewing_id') != r['id'] or mark['segment'] not in ids:
                        continue
                    length = sum(c.segments[j].length() for j in ids[:ids.index(mark['segment'])]) + c.segments[mark['segment']].split(mark['t'])[0].length()
                    group[mark['code']] = length / total
                marks.append(group)
            if set(marks[0]) != set(marks[1]):
                raise ValueError(r['name'] + ' / не совпадают контрольные метки')
            for code, fraction in marks[0].items():
                other = 1-marks[1][code] if r['direction']=='reverse' else marks[1][code]
                check(r['name'], 'совмещение метки '+code, fraction*lengths[0], other*lengths[0])
            seam_checks.append({'name': r['name'], 'a_mm': lengths[0], 'b_mm': lengths[1],
                                'ease_mm': r['ease_mm'], 'residual_mm': lengths[0]-lengths[1]-r['ease_mm']})
    except (ValueError, KeyError, IndexError, TypeError) as exc:
        errors.append({'piece': 'Футболка', 'section': 'конструкция', 'message': str(exc)})
        seam_checks = []
    return {'valid': not errors, 'errors': errors, 'checks': checks, 'seams': seam_checks,
            'method_status': 'experimental', 'fit_verified': False, 'sewing_ready': False,
            'warnings': SPEC['limits']}


def tangent_angle(a, b):
    u = Point(a.end.x - (a.c2 or a.start).x, a.end.y - (a.c2 or a.start).y)
    v = Point((b.c1 or b.end).x - b.start.x, (b.c1 or b.end).y - b.start.y)
    d = math.hypot(u.x, u.y) * math.hypot(v.x, v.y)
    if d < 1e-9:
        return 180
    return math.degrees(math.acos(max(-1, min(1, (u.x*v.x + u.y*v.y)/d))))


def curvature(s, end):
    if end:
        dx,dy=3*(s.end.x-s.c2.x),3*(s.end.y-s.c2.y)
        ddx,ddy=6*(s.end.x-2*s.c2.x+s.c1.x),6*(s.end.y-2*s.c2.y+s.c1.y)
    else:
        dx,dy=3*(s.c1.x-s.start.x),3*(s.c1.y-s.start.y)
        ddx,ddy=6*(s.c2.x-2*s.c1.x+s.start.x),6*(s.c2.y-2*s.c1.y+s.start.y)
    return (dx*ddy-dy*ddx)/(dx*dx+dy*dy)**1.5
