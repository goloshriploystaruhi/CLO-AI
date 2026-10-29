"""Explicit construction checks; independent math, no fitting or geometry mutation.

Coordinates and distances are millimetres. A within transform maps the final
stored child contour into the final stored parent frame: mirror at origin,
rotate at origin, then translate. Even identity alignment must be explicit.
Concepts: MIT Pattern Making Skill's fold/within checks; no upstream code copied.
"""
import math

from contour_engine import Point, validate_polygon
from garment_engine import deserialize

MAX_CHECKS, MAX_VERTICES, MAX_PAIRS = 64, 2048, 1000000


def _strict(value, allowed, required, label):
    if not isinstance(value, dict) or set(value)-set(allowed) or set(required)-set(value):
        raise ValueError(label+': неверные поля проверки')


def _number(value, minimum, maximum, label):
    if isinstance(value, bool) or not isinstance(value, (int, float)) or not math.isfinite(value) or not minimum <= value <= maximum:
        raise ValueError(label+': значение вне допустимого диапазона')
    return float(value)


def _name(value, label):
    if not isinstance(value, str) or not value or len(value) > 100:
        raise ValueError(label+': нужен идентификатор')
    return value


def _contour(piece):
    try:
        contour = deserialize(piece['seam_contour'])
        if len(contour.segments) > 128:
            raise ValueError()
        for segment in contour.segments:
            for point in (segment.start, segment.end, segment.c1, segment.c2):
                if point and max(abs(point.x), abs(point.y)) > 10000:
                    raise ValueError()
        return contour
    except (ValueError, TypeError, KeyError, IndexError):
        raise ValueError('Деталь «'+str(piece.get('name', piece.get('role', '?')))+'»: некорректный контур стачивания')


def _vector(a, b):
    return b.x-a.x, b.y-a.y


def _unit(vector, label):
    length = math.hypot(*vector)
    if length <= 1e-10:
        raise ValueError(label+': направление касательной не определено')
    return vector[0]/length, vector[1]/length


def _tangent(segment, start, label):
    # The first non-zero derivative determines the one-sided endpoint tangent,
    # including a repeated control point. No finite chord approximation.
    if not segment.c1:
        return _unit(_vector(segment.start, segment.end), label)
    vectors = ([_vector(segment.start, segment.c1), _vector(segment.start, segment.c2), _vector(segment.start, segment.end)] if start else
               [_vector(segment.c2, segment.end), _vector(segment.c1, segment.end), _vector(segment.start, segment.end)])
    for vector in vectors:
        if math.hypot(*vector) > 1e-10:
            return _unit(vector, label)
    raise ValueError(label+': направление касательной не определено')


def _fold(piece, spec):
    _strict(spec, {'type', 'piece', 'seam', 'tolerance_deg'}, {'type', 'piece', 'seam'}, 'Сгиб')
    seam = _name(spec['seam'], 'Участок сгиба')
    label = 'Деталь «'+piece.get('name', piece['role'])+'», сгиб «'+seam+'»'
    tolerance = _number(spec.get('tolerance_deg', 1), 0, 2, label+' / допуск угла')
    contour = _contour(piece)
    indices = piece.get('seams', {}).get(seam)
    n = len(contour.segments)
    if not isinstance(indices, list) or not indices or any(type(i) is not int or not 0 <= i < n for i in indices) or len(set(indices)) != len(indices) or len(indices) >= n:
        raise ValueError(label+': участок не найден или неверно задан')
    if any((a+1) % n != b for a, b in zip(indices, indices[1:])):
        raise ValueError(label+': участки сгиба должны идти подряд по контуру')
    a, b = contour.segments[indices[0]].start, contour.segments[indices[-1]].end
    axis = _unit(_vector(a, b), label)
    for i in indices:
        segment = contour.segments[i]
        if segment.c1:
            raise ValueError(label+': сгиб должен состоять из прямых сегментов')
        tangent = _unit(_vector(segment.start, segment.end), label)
        if tangent[0]*axis[0]+tangent[1]*axis[1] < 1-1e-10:
            raise ValueError(label+': сгиб не является одной прямой')
    adjacent = [(_tangent(contour.segments[(indices[0]-1) % n], False, label), 'начало'),
                (_tangent(contour.segments[(indices[-1]+1) % n], True, label), 'конец')]
    angles = []
    for tangent, endpoint in adjacent:
        dot = min(1., max(0., abs(tangent[0]*axis[0]+tangent[1]*axis[1])))
        angle = math.degrees(math.acos(dot)); angles.append(angle)
        if abs(90-angle) > tolerance+1e-9:
            raise ValueError(label+' / '+endpoint+': касательная образует {:.4f}°, требуется 90° ± {:.4f}°'.format(angle, tolerance))
    return {'type': 'fold', 'piece': piece['role'], 'piece_name': piece.get('name'), 'seam': seam,
            'angles_deg': angles, 'tolerance_deg': tolerance, 'passed': True}


def _distance(p, a, b):
    dx, dy = b.x-a.x, b.y-a.y
    denominator = dx*dx+dy*dy
    t = max(0., min(1., ((p.x-a.x)*dx+(p.y-a.y)*dy)/denominator)) if denominator else 0.
    return math.hypot(p.x-a.x-t*dx, p.y-a.y-t*dy)


def _cross(a, b):
    return a[0]*b[1]-a[1]*b[0]


def _cuts(a, b, c, d):
    u, v, w = _vector(a, b), _vector(c, d), _vector(a, c)
    denominator = _cross(u, v)
    if abs(denominator) > 1e-12:
        t, q = _cross(w, v)/denominator, _cross(w, u)/denominator
        return [max(0., min(1., t))] if -1e-10 <= t <= 1+1e-10 and -1e-10 <= q <= 1+1e-10 else []
    if abs(_cross(w, u)) > 1e-8:
        return []
    length2 = u[0]*u[0]+u[1]*u[1]
    if length2 <= 1e-20:
        return []
    values = [((p.x-a.x)*u[0]+(p.y-a.y)*u[1])/length2 for p in (c, d)]
    lo, hi = max(0., min(values)), min(1., max(values))
    return [lo, hi] if lo <= hi else []


def _inside(point, edges):
    inside = False
    for a, b in edges:
        if _distance(point, a, b) <= 1e-8:
            return True
        if (a.y > point.y) != (b.y > point.y) and point.x < (b.x-a.x)*(point.y-a.y)/(b.y-a.y)+a.x:
            inside = not inside
    return inside


def _polyline(contour, error):
    points = []
    for segment in contour.segments:
        points.extend(segment.flatten(error)[:-1])
        if len(points) > MAX_VERTICES:
            raise ValueError('Контур слишком сложен для ограниченной проверки вложенности')
    try:
        validate_polygon(points)
    except ValueError:
        raise ValueError('Проверка вложенности требует простого замкнутого контура')
    return points


def _outside_upper(a, b, edges, tolerance, label, work, depth=0):
    # Distance to one line segment is convex. Its endpoint maximum bounds the
    # entire interval; taking the best parent edge is still an upper bound.
    work[0] -= len(edges)*3
    if work[0] < 0:
        raise ValueError(label+': превышен предел сложности проверки')
    upper = min(max(_distance(a, c, d), _distance(b, c, d)) for c, d in edges)
    middle = a.mix(b, .5)
    actual = min(_distance(middle, c, d) for c, d in edges)
    if actual > tolerance+1e-9:
        raise ValueError(label+': контур выходит за родительскую деталь минимум на {:.4f} мм (допуск {:.4f} мм)'.format(actual, tolerance))
    if upper <= tolerance+1e-9:
        return upper
    if depth >= 20:
        raise ValueError(label+': не удалось подтвердить вложенность с заданным допуском')
    return max(_outside_upper(a, middle, edges, tolerance, label, work, depth+1), _outside_upper(middle, b, edges, tolerance, label, work, depth+1))


def _within(piece, parent, spec):
    _strict(spec, {'type', 'piece', 'parent', 'translate', 'rotate_deg', 'mirror', 'tolerance_mm'}, {'type', 'piece', 'parent', 'translate'}, 'Вложенность')
    label = 'Деталь «'+piece.get('name', piece['role'])+'» внутри «'+parent.get('name', parent['role'])+'»'
    if piece['role'] == parent['role']:
        raise ValueError(label+': родительская и дочерняя детали должны различаться')
    translate = spec['translate']
    if not isinstance(translate, list) or len(translate) != 2:
        raise ValueError(label+': явно задайте перенос в систему координат родительской детали')
    x, y = [_number(value, -10000, 10000, label+' / перенос') for value in translate]
    angle = _number(spec.get('rotate_deg', 0), -36000, 36000, label+' / поворот')
    tolerance = _number(spec.get('tolerance_mm', .1), 0, 1, label+' / допуск')
    mirror = spec.get('mirror')
    if mirror not in (None, 'x', 'y'):
        raise ValueError(label+': отражение должно быть x или y')
    child, host = _contour(piece), _contour(parent)
    if mirror:
        child = child.reflected(mirror)
    child = child.rotated(angle).translated(x, y)
    flat_error = min(.01, max(.0001, tolerance/8))
    budget = flat_error*sum(any(segment.c1 for segment in contour.segments) for contour in (child, host))
    child_points, parent_points = _polyline(child, flat_error), _polyline(host, flat_error)
    if len(child_points)*len(parent_points) > MAX_PAIRS:
        raise ValueError(label+': превышен предел сложности проверки')
    edges = list(zip(parent_points, parent_points[1:]+parent_points[:1]))
    worst, clearance, work = 0., float('inf'), [3000000-len(child_points)*len(parent_points)]
    for a, b in zip(child_points, child_points[1:]+child_points[:1]):
        cuts = [0., 1.]
        for c, d in edges:
            crossing = _cuts(a, b, c, d);cuts.extend(crossing)
            clearance = min(clearance, 0. if crossing else min(_distance(a, c, d), _distance(b, c, d), _distance(c, a, b), _distance(d, a, b)))
        cuts = sorted(set(round(value, 13) for value in cuts))
        for lo, hi in zip(cuts, cuts[1:]):
            if hi-lo < 1e-12:
                continue
            start, end = a.mix(b, lo), a.mix(b, hi)
            if not _inside(start.mix(end, .5), edges):
                worst = max(worst, _outside_upper(start, end, edges, tolerance, label, work))
    bound = 0. if worst == 0 and clearance >= budget else worst+budget
    if bound > tolerance+1e-9:
        raise ValueError(label+': погрешность кривых не позволяет подтвердить допуск {:.4f} мм; верхняя граница выхода {:.4f} мм'.format(tolerance, bound))
    return {'type': 'within', 'piece': piece['role'], 'parent': parent['role'], 'piece_name': piece.get('name'),
            'parent_name': parent.get('name'), 'translate': [x, y], 'rotate_deg': angle, 'mirror': mirror,
            'max_outside_mm': bound, 'curve_error_mm': budget, 'tolerance_mm': tolerance,
            'coordinate_frame': 'stored_child_to_stored_parent', 'passed': True}


def check(pieces, checks):
    """Validate resolved numeric checks and return measured records; never mutate."""
    if not isinstance(checks, list) or len(checks) > MAX_CHECKS:
        raise ValueError('Допустимо до 64 конструктивных проверок')
    if not isinstance(pieces, list) or len(pieces) > 64:
        raise ValueError('Некорректный комплект деталей для конструктивных проверок')
    roles = {}
    for piece in pieces:
        if not isinstance(piece, dict):
            raise ValueError('Некорректная деталь для конструктивной проверки')
        role = _name(piece.get('role'), 'Роль детали')
        if role in roles:
            raise ValueError('Роли деталей в конструктивной проверке должны быть уникальными')
        roles[role] = piece
    records = []
    for spec in checks:
        if not isinstance(spec, dict) or spec.get('type') not in ('fold', 'within'):
            raise ValueError('Неизвестная конструктивная проверка')
        role = _name(spec.get('piece'), 'Проверяемая деталь')
        if role not in roles:
            raise ValueError('Конструктивная проверка: деталь «'+role+'» отсутствует')
        if spec['type'] == 'fold':
            records.append(_fold(roles[role], spec))
        else:
            parent = _name(spec.get('parent'), 'Родительская деталь')
            if parent not in roles:
                raise ValueError('Конструктивная проверка: родительская деталь «'+parent+'» отсутствует')
            records.append(_within(roles[role], roles[parent], spec))
    return records
