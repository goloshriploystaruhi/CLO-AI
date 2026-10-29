"""Bounded declarative pattern construction; no Python code or body-value guessing.

The design is a replayable geometric hypothesis, not a certificate of fit.
Expressions use a small arithmetic AST, never eval/exec or attribute access.
"""
import ast
import copy
import hashlib
import json
import math
import re
import sys
from urllib.parse import urlsplit

from contour_engine import Point, Segment, Contour
from category_constructors import Kit
from garment_engine import deserialize, grain_guide, validate_garment, validate_assembly_groups

METHOD = 'parametric_design_v1'
MAX_PIECES, MAX_SEGMENTS, MAX_POINTS = 64, 64, 128
IDENT = re.compile(r'^[a-z][a-z0-9_]{0,63}$')
MEASUREMENT_IDENT = re.compile(r'^[a-z][a-z0-9_-]{0,95}$')


def portable_hypot(*values):
    # CLO 7 embeds Python 3.7, whose math.hypot accepts exactly two values.
    # Keep the declared arithmetic language identical to the newer worker.
    length = 0.0
    for value in values:
        length = math.hypot(length, value)
    return length


FUNCTIONS = {'sqrt': math.sqrt, 'sin': math.sin, 'cos': math.cos,
             'tan': math.tan, 'asin': math.asin, 'acos': math.acos,
             'atan': math.atan, 'atan2': math.atan2, 'abs': abs, 'min': min, 'max': max,
             'hypot': portable_hypot, 'rad': math.radians, 'deg': math.degrees,
             'radians': math.radians, 'degrees': math.degrees}
DESIGN_KEYS = {'version', 'name', 'category', 'parameters', 'measurements',
               'variables', 'seam_allowance_mm', 'pieces', 'relations',
               'operations', 'sources', 'intended_sex', 'parameter_labels',
               'material', 'notes', 'checks', 'pattern_checks', 'recipe', 'assembly_groups'}
PIECE_KEYS = {'role', 'name', 'primitive', 'points', 'segments', 'seams',
              'grainline', 'mirror', 'rotate_deg', 'translate', 'cut_quantity'}


def strict(value, allowed, required=(), section='конструкция'):
    if not isinstance(value, dict):
        raise ValueError(section + ': требуется объект')
    extra, missing = set(value) - set(allowed), set(required) - set(value)
    if extra:
        raise ValueError(section + ': неизвестные поля ' + ', '.join(sorted(extra)))
    if missing:
        raise ValueError(section + ': не указаны поля ' + ', '.join(sorted(missing)))


def finite(value, section, limit=10000):
    if isinstance(value, bool) or not isinstance(value, (int, float)) or not math.isfinite(value) or abs(value) > limit:
        raise ValueError(section + ': требуется конечное число в допустимом диапазоне')
    return float(value)


def identifier(value, section):
    if not isinstance(value, str) or not IDENT.fullmatch(value):
        raise ValueError(section + ': недопустимый идентификатор')
    return value


def text(value, section, maximum=300):
    if not isinstance(value, str) or not value.strip() or len(value) > maximum:
        raise ValueError(section + ': требуется непустой текст')
    return value.strip()


def expression(value, variables, section='формула'):
    if isinstance(value, (int, float)):
        return finite(value, section)
    if not isinstance(value, str) or not 0 < len(value) <= 256:
        raise ValueError(section + ': формула должна быть строкой не длиннее 256 символов')
    try:
        tree = ast.parse(value, mode='eval')
    except (SyntaxError, RecursionError):
        raise ValueError(section + ': некорректная арифметическая формула')
    if sum(1 for _ in ast.walk(tree)) > 96:
        raise ValueError(section + ': слишком сложная формула')

    legacy_number_type = vars(ast).get('Num')

    def number_node(node):
        # Before Python 3.8 ast.parse emits Num, not Constant. Accept the two
        # numeric AST encodings only; finite() still rejects bool/string/complex.
        if isinstance(node, ast.Constant):
            return True, node.value
        if legacy_number_type is not None and type(node) is legacy_number_type:
            return True, node.n
        return False, None

    def run(node, depth=0):
        if depth > 16:
            raise ValueError(section + ': превышена глубина формулы')
        if isinstance(node, ast.Expression):
            return run(node.body, depth + 1)
        numeric, literal = number_node(node)
        if numeric:
            return finite(literal, section, 1000000)
        if isinstance(node, ast.Name) and node.id in variables:
            return variables[node.id]
        if isinstance(node, ast.Name):
            raise ValueError(section + ': не объявлена переменная '+node.id)
        if isinstance(node, ast.UnaryOp) and isinstance(node.op, (ast.UAdd, ast.USub)):
            result = run(node.operand, depth + 1)
            return result if isinstance(node.op, ast.UAdd) else -result
        if isinstance(node, ast.BinOp) and isinstance(node.op, (ast.Add, ast.Sub, ast.Mult, ast.Div, ast.Pow)):
            left, right = run(node.left, depth + 1), run(node.right, depth + 1)
            if isinstance(node.op, ast.Add): result = left + right
            elif isinstance(node.op, ast.Sub): result = left - right
            elif isinstance(node.op, ast.Mult): result = left * right
            elif isinstance(node.op, ast.Div): result = left / right
            else:
                constant = number_node(node.right)[0] or isinstance(node.right, ast.UnaryOp) and isinstance(node.right.op, (ast.USub, ast.UAdd)) and number_node(node.right.operand)[0]
                if not constant or not -4 <= right <= 4:
                    raise ValueError(section + ': степень должна быть числовой константой от -4 до 4')
                result = left ** right
            return finite(result, section, 1000000000)
        if isinstance(node, ast.Call) and isinstance(node.func, ast.Name) and node.func.id in FUNCTIONS and not node.keywords and 1 <= len(node.args) <= 8:
            return finite(FUNCTIONS[node.func.id](*(run(v, depth + 1) for v in node.args)), section, 1000000000)
        raise ValueError(section + ': разрешены только числа, объявленные переменные и арифметические функции')
    try:
        return finite(run(tree), section, 1000000000)
    except (ZeroDivisionError, OverflowError, TypeError, ValueError) as exc:
        if isinstance(exc, ValueError) and section in str(exc):
            raise
        raise ValueError(section + ': арифметика не определена для заданных значений')


def point(value, variables, section):
    if not isinstance(value, list) or len(value) != 2:
        raise ValueError(section + ': точка задаётся парой формул [x, y]')
    return Point(*(finite(expression(v, variables, section), section) for v in value))


def arc(radius, start, stop):
    count = max(1, int(math.ceil(abs(stop - start) / (math.pi / 2))))
    result = []
    for i in range(count):
        a, b = start + (stop-start)*i/count, start + (stop-start)*(i+1)/count
        k = 4 * math.tan((b-a)/4) / 3
        first, last = Point(radius*math.cos(a), radius*math.sin(a)), Point(radius*math.cos(b), radius*math.sin(b))
        result.append(Segment(first, last, Point(first.x-radius*k*math.sin(a), first.y+radius*k*math.cos(a)), Point(last.x+radius*k*math.sin(b), last.y-radius*k*math.cos(b))))
    return result


def primitive(spec, variables):
    kind = spec.get('type') if isinstance(spec, dict) else None
    if kind == 'rectangle':
        strict(spec, {'type', 'width', 'height'}, {'type', 'width', 'height'}, 'прямоугольник')
        w, h = [expression(spec[k], variables, 'прямоугольник / '+k) for k in ('width', 'height')]
        if not 1 <= w <= 10000 or not 1 <= h <= 10000:
            raise ValueError('Прямоугольник: размеры должны быть 1–10000 мм')
        contour = Contour.polygon([(0, 0), (w, 0), (w, h), (0, h)])
        return contour, {'top': [0], 'right': [1], 'bottom': [2], 'left': [3]}
    if kind == 'trapezoid':
        strict(spec, {'type', 'top', 'bottom', 'height', 'offset'}, {'type', 'top', 'bottom', 'height'}, 'трапеция')
        top, bottom, height = [expression(spec[k], variables, 'трапеция / '+k) for k in ('top', 'bottom', 'height')]
        off = expression(spec.get('offset', (bottom-top)/2), variables)
        if not all(1 <= v <= 10000 for v in (top, bottom, height)):
            raise ValueError('Трапеция: размеры должны быть 1–10000 мм')
        contour = Contour.polygon([(off, 0), (off+top, 0), (bottom, height), (0, height)])
        return contour, {'top': [0], 'right': [1], 'bottom': [2], 'left': [3]}
    if kind == 'annular_sector':
        strict(spec, {'type', 'inner_radius', 'width', 'angle_deg'}, {'type', 'inner_radius', 'width', 'angle_deg'}, 'сектор')
        radius, width, angle = [expression(spec[k], variables, 'сектор / '+k) for k in ('inner_radius', 'width', 'angle_deg')]
        if not 5 <= radius <= 4000 or not 1 <= width <= 5000 or not 5 <= angle <= 355:
            raise ValueError('Сектор: радиус 5–4000 мм, ширина 1–5000 мм, угол 5–355°. Полное кольцо с отверстием делите на секторы.')
        end = math.radians(angle)
        inner, outer = arc(radius, 0, end), arc(radius+width, end, 0)
        contour = Contour(inner + [Segment(inner[-1].end, outer[0].start)] + outer + [Segment(outer[-1].end, inner[0].start)])
        n = len(inner)
        return contour, {'waist': list(range(n)), 'radial_end': [n], 'hem': list(range(n+1, 2*n+1)), 'radial_start': [2*n+1]}
    raise ValueError('Неизвестный математический примитив: '+str(kind))


def contour_for(spec, variables):
    if 'primitive' in spec:
        if 'points' in spec or 'segments' in spec:
            raise ValueError('Деталь должна использовать либо примитив, либо именованные точки и сегменты')
        return primitive(spec['primitive'], variables)
    points, segments = spec.get('points'), spec.get('segments')
    if not isinstance(points, dict) or not 3 <= len(points) <= MAX_POINTS or not isinstance(segments, list) or not 3 <= len(segments) <= MAX_SEGMENTS:
        raise ValueError('Деталь требует 3–128 именованных точек и 3–64 сегмента')
    pts = {identifier(name, 'имя точки'): point(value, variables, 'точка '+name) for name, value in points.items()}
    result, seams = [], {}
    for i, value in enumerate(segments):
        strict(value, {'type', 'from', 'to', 'control', 'controls', 'name'}, {'type', 'from', 'to', 'name'}, 'сегмент '+str(i))
        name = identifier(value['name'], 'имя участка')
        if name in seams: raise ValueError('Имена участков детали должны быть уникальными')
        try:
            a, b = pts[value['from']], pts[value['to']]
            if value['type'] == 'line':
                if 'control' in value or 'controls' in value: raise ValueError('Прямая не имеет управляющих точек')
                segment = Segment(a, b)
            elif value['type'] == 'quadratic':
                if 'controls' in value or 'control' not in value: raise ValueError('Квадратичная кривая требует одну управляющую точку')
                c = pts[value['control']]
                segment = Segment(a, b, a.mix(c, 2/3), b.mix(c, 2/3))
            elif value['type'] == 'cubic':
                controls = value.get('controls')
                if 'control' in value or not isinstance(controls, list) or len(controls) != 2: raise ValueError('Кубическая кривая требует две управляющие точки')
                segment = Segment(a, b, pts[controls[0]], pts[controls[1]])
            else: raise ValueError('Допустимы line, quadratic и cubic')
        except (KeyError, TypeError):
            raise ValueError('Сегмент '+name+': ссылка на несуществующую точку')
        seams[name] = [i];result.append(segment)
    return Contour(result), seams


def mapped_point(p, spec, variables):
    if spec.get('mirror'):
        p = Point(-p.x, p.y) if spec['mirror'] == 'y' else Point(p.x, -p.y)
    angle = math.radians(expression(spec.get('rotate_deg', 0), variables, 'поворот'))
    p = Point(p.x*math.cos(angle)-p.y*math.sin(angle), p.x*math.sin(angle)+p.y*math.cos(angle))
    shift = point(spec.get('translate', [0, 0]), variables, 'перемещение')
    return Point(p.x+shift.x, p.y+shift.y)


def source_urls(values):
    if not isinstance(values, list) or len(values) > 8: raise ValueError('Допустимо до восьми ссылок на источники')
    for value in values:
        if not isinstance(value, str) or len(value) > 2000: raise ValueError('Некорректная ссылка на источник')
        u = urlsplit(value)
        if u.scheme not in ('http', 'https') or not u.hostname or u.username or u.password:
            raise ValueError('Источники должны быть обычными HTTP(S)-ссылками без учётных данных')
    return values


def metric(piece, kind, seam=None):
    contour = deserialize(piece['seam_contour'])
    if kind in ('width', 'height'):
        if seam is not None: raise ValueError('Для габарита не указывайте участок шва')
        points = contour.clo_points(.05);axis = 0 if kind == 'width' else 1
        return max(p[axis] for p in points)-min(p[axis] for p in points)
    if kind != 'seam_length' or seam not in piece['seams']:
        raise ValueError('Для длины нужен существующий именованный шов')
    ids = piece['seams'][seam]
    return sum(contour.segments[i].length(.001/max(1, len(ids))) for i in ids)


def dimension_checks(pieces, checks, variables):
    if not isinstance(checks, list) or len(checks) > 128: raise ValueError('Допустимо до 128 проверок размеров')
    by_role = {p['role']: p for p in pieces};results = []
    for item in checks:
        strict(item, {'piece', 'metric', 'seam', 'expected', 'tolerance_mm'}, {'piece', 'metric', 'expected'}, 'проверка размера')
        role = identifier(item['piece'], 'деталь проверки размера')
        if role not in by_role: raise ValueError('Проверка размера: деталь не найдена')
        expected = finite(expression(item['expected'], variables, 'ожидаемый размер'), 'ожидаемый размер', 100000)
        tolerance = finite(item.get('tolerance_mm', .25), 'допуск размера')
        if not 0 <= tolerance <= 1: raise ValueError('Допуск проверки размера должен быть 0–1 мм')
        actual = metric(by_role[role], item['metric'], item.get('seam'))
        passed = abs(actual-expected) <= tolerance
        record = {'piece': role, 'metric': item['metric'], 'seam': item.get('seam'), 'expected_mm': expected, 'actual_mm': actual, 'tolerance_mm': tolerance, 'passed': passed}
        results.append(record)
        if not passed: raise ValueError('{} / {}: ожидалось {:.3f} мм, рассчитано {:.3f} мм, допуск {:.3f} мм'.format(by_role[role]['name'], item.get('seam') or item['metric'], expected, actual, tolerance))
    return results


def pattern_constraints(pieces, checks, variables):
    """Resolve only the existing arithmetic language, never source instructions."""
    if not isinstance(checks, list) or len(checks) > 64:
        raise ValueError('Допустимо до 64 конструктивных проверок')
    if not checks:
        return [], []
    resolved = []
    for item in checks:
        kind = item.get('type') if isinstance(item, dict) else None
        if kind == 'fold':
            strict(item, {'type', 'piece', 'seam', 'tolerance_deg'}, {'type', 'piece', 'seam'}, 'проверка сгиба')
        elif kind == 'within':
            strict(item, {'type', 'piece', 'parent', 'translate', 'rotate_deg', 'mirror', 'tolerance_mm'}, {'type', 'piece', 'parent', 'translate'}, 'проверка вложенной детали')
        else:
            raise ValueError('Неизвестная конструктивная проверка: допустимы fold и within')
        value = copy.deepcopy(item)
        identifier(value['piece'], 'деталь конструктивной проверки')
        if kind == 'within':
            identifier(value['parent'], 'основная деталь конструктивной проверки')
            shift = point(value['translate'], variables, 'положение вложенной детали')
            value['translate'] = [shift.x, shift.y]
            if 'rotate_deg' in value:
                value['rotate_deg'] = expression(value['rotate_deg'], variables, 'поворот вложенной детали')
        resolved.append(value)
    from engineering.pattern_constraints import check
    return resolved, check(pieces, resolved)


def construct(profile, design, previous=None):
    strict(design, DESIGN_KEYS, {'version', 'name', 'category', 'parameters', 'measurements', 'pieces'}, 'параметрическая схема')
    if 'recipe' in design:
        from patternmaking_recipes import validate_recipe
        validate_recipe(design)
    if len(json.dumps(design, ensure_ascii=True)) > 350000: raise ValueError('Слишком большая схема конструкции')
    if type(design['version']) is not int or design['version'] != 1: raise ValueError('Неизвестная версия схемы конструкции')
    name, category = text(design['name'], 'название'), identifier(design['category'], 'категория')
    params = design['parameters']
    if not isinstance(params, dict) or len(params) > 64: raise ValueError('Допустимо до 64 числовых параметров')
    params = {identifier(k, 'имя параметра'): finite(v, 'параметр '+k) for k, v in params.items()}
    needed = design['measurements']
    if not isinstance(needed, list) or len(needed) > 64 or any(not isinstance(k, str) or not MEASUREMENT_IDENT.fullmatch(k) for k in needed) or len(set(needed)) != len(needed): raise ValueError('Мерки должны быть уникальным списком идентификаторов')
    if not isinstance(profile, dict): raise ValueError('Не задан профиль мерок')
    profile = copy.deepcopy(profile);measurements = profile.get('measurements', {})
    if not isinstance(measurements, dict) or any(not isinstance(measurements.get(k, {}), dict) for k in needed): raise ValueError('Профиль должен содержать объекты значений мерок')
    if not isinstance(profile.get('metadata', {}), dict): raise ValueError('Метаданные профиля должны быть объектом')
    if profile.get('id') is not None and (not isinstance(profile['id'], str) or len(profile['id']) > 300): raise ValueError('Некорректный идентификатор профиля')
    missing = [k for k in needed if measurements.get(k, {}).get('value') is None]
    disputed = [k for k in needed if k not in missing and measurements[k].get('status') == 'disputed']
    if not profile.get('id') or missing or disputed:
        return {'needs_input': {'method': METHOD, 'missing_profile': not bool(profile.get('id')), 'missing_measurements': missing, 'unverified_measurements': disputed, 'disputed_measurements': disputed, 'missing_parameters': []}, 'message': 'Нужны отсутствующие мерки или уточнение значений с явной отметкой «Спорная». Записанные обычные мерки можно использовать для рабочего построения; неизвестные значения не подставлены.'}
    env = {'pi': math.pi}
    for key in needed:
        entry = measurements[key];unit = entry.get('unit')
        factor = {'mm': 1, 'cm': 10, 'in': 25.4, 'deg': 1}.get(unit)
        value = finite(entry['value'], 'мерка '+key)
        if factor is None or value < 0 or value == 0 and unit != 'deg': raise ValueError('Мерка '+key+': нужны реальные линейные размеры или угол в корректных единицах')
        entry['value'], entry['unit'] = value*factor, 'deg' if unit == 'deg' else 'mm'
        alias = 'm_'+key.replace('-', '_')
        if alias in env: raise ValueError('Идентификаторы мерок создают одинаковые имена формул')
        env[alias] = entry['value']
    if 'recipe' in design:
        from patternmaking_recipes import expand, decorate
        result = construct(profile, expand(profile, design), previous)
        if result.get('needs_input'): return result
        decorate(result, profile, design)
        result['garment']['pattern_design'] = copy.deepcopy(design)
        result['garment']['design_dependencies']['recipe'] = design['recipe']
        return result
    env.update({'p_'+key: value for key, value in params.items()})
    variables = design.get('variables', {})
    if not isinstance(variables, dict) or len(variables) > 128: raise ValueError('Допустимо до 128 зависимых переменных')
    for key, formula in variables.items():
        identifier(key, 'имя переменной')
        if key in env or key in FUNCTIONS or key.startswith(('m_', 'p_')): raise ValueError('Переменная не может заменять мерку, параметр или функцию: '+key)
        env[key] = expression(formula, env, 'переменная '+key)
    allowance = finite(expression(design.get('seam_allowance_mm', params.get('seam_allowance_mm', 10)), env, 'припуск'), 'припуск')
    if not 3 <= allowance <= 25: raise ValueError('Равномерный припуск должен быть 3–25 мм')
    if 'seam_allowance_mm' in params and abs(params['seam_allowance_mm']-allowance) > .000001: raise ValueError('Припуск задан противоречиво: используйте одну формулу или ссылку p_seam_allowance_mm')
    params['seam_allowance_mm'] = allowance
    material = design.get('material', {})
    strict(material, {'fabric_index'}, section='материал')
    if 'fabric_index' in material and (type(material['fabric_index']) is not int or material['fabric_index'] < 0): raise ValueError('Нужен индекс существующей ткани CLO')
    if material: params['material'] = copy.deepcopy(material)
    pieces = design['pieces']
    if not isinstance(pieces, list) or not 1 <= len(pieces) <= MAX_PIECES: raise ValueError('В конструкции допустимо 1–64 детали')
    roles = [p.get('role') if isinstance(p, dict) else None for p in pieces]
    if any(not isinstance(v, str) for v in roles) or len(set(roles)) != len(roles): raise ValueError('Роли деталей должны быть уникальными')
    assembly_groups=validate_assembly_groups(design['assembly_groups'],roles) if 'assembly_groups' in design else None
    intended = design.get('intended_sex', 'unspecified')
    if intended not in ('unspecified', 'male', 'female'): raise ValueError('Неизвестное назначение конструкции по полу')
    if previous is not None and (not isinstance(previous, dict) or previous.get('method') != METHOD or previous.get('profile_id') != profile['id']): raise ValueError('Предыдущая конструкция принадлежит другой методике или профилю')
    meta = {'id': METHOD, 'name': name, 'category': category, 'variant': 'Параметрическая авторская схема: '+name, 'status': 'experimental', 'implementation_version': '1.0.0', 'required_measurements': needed, 'required_parameters': list(design['parameters']), 'required_roles': roles, 'fit_verified': False}
    kit = Kit(METHOD, profile, params, previous, meta)
    for spec in pieces:
        strict(spec, PIECE_KEYS, {'role', 'name'}, 'деталь')
        role, piece_name = identifier(spec['role'], 'роль детали'), text(spec['name'], 'имя детали')
        if spec.get('mirror') not in (None, 'x', 'y'): raise ValueError('Отражение задаётся осью x или y')
        contour, seams = contour_for(spec, env)
        contour = contour.mapped(lambda p: mapped_point(p, spec, env))
        if any(abs(v) > 10000 for segment in contour.segments for p in (segment.start, segment.end, segment.c1, segment.c2) if p for v in (p.x, p.y)): raise ValueError('Координаты детали выходят за пределы ±10000 мм: '+piece_name)
        piece = kit.add(role, piece_name, contour)
        if 'seams' in spec:
            if not isinstance(spec['seams'], dict) or len(spec['seams']) > MAX_SEGMENTS: raise ValueError('Некорректные именованные швы')
            for seam_name, ids in spec['seams'].items():
                identifier(seam_name, 'имя шва')
                if not isinstance(ids, list) or not ids or len(set(ids)) != len(ids) or any(type(i) is not int or not 0 <= i < len(contour.segments) for i in ids): raise ValueError('Шов '+seam_name+': неверные индексы сегментов')
                for a, b in zip(ids, ids[1:]):
                    if contour.segments[a].end.distance(contour.segments[b].start) > .001: raise ValueError('Шов '+seam_name+': участки не образуют непрерывную линию')
                seams[seam_name] = ids
        piece['seams'] = seams
        quantity = spec.get('cut_quantity', 1)
        if type(quantity) is not int or not 1 <= quantity <= 8: raise ValueError('Количество кроя должно быть целым от 1 до 8')
        piece['cut_quantity'], piece['mirror_cut'] = quantity, bool(spec.get('mirror'))
        if 'grainline' in spec:
            if not isinstance(spec['grainline'], list) or len(spec['grainline']) != 2: raise ValueError('Долевая задаётся двумя точками')
            grain = [mapped_point(point(p, env, 'долевая'), spec, env) for p in spec['grainline']]
            if grain[0].distance(grain[1]) < 1: raise ValueError('Долевая должна иметь ненулевую длину')
            piece['grainline'] = [[p.x, p.y] for p in grain]
        else:
            piece['grainline'] = grain_guide(contour)
    relations = design.get('relations', [])
    if not isinstance(relations, list) or len(relations) > 128: raise ValueError('Допустимо до 128 соединений')
    occupied = set()
    for relation in relations:
        strict(relation, {'a', 'b', 'ease_mm', 'tolerance_mm', 'direction', 'type', 'alignment'}, {'a', 'b'}, 'соединение')
        endpoints = []
        for side in ('a', 'b'):
            endpoint = relation[side];strict(endpoint, {'piece', 'seam'}, {'piece', 'seam'}, 'конец шва')
            identifier(endpoint['piece'], 'роль соединяемой детали');identifier(endpoint['seam'], 'имя соединяемого участка')
            if endpoint['piece'] not in kit.roles: raise ValueError('Шов ссылается на отсутствующую деталь')
            p = kit.pieces[kit.roles[endpoint['piece']]]
            if endpoint['seam'] not in p['seams']: raise ValueError('Шов '+str(endpoint['seam'])+' не объявлен в детали '+p['name'])
            indices = p['seams'][endpoint['seam']]
            for index in indices:
                key = (p['role'], index)
                if key in occupied: raise ValueError('Один участок детали нельзя соединять дважды: '+p['name'])
                occupied.add(key)
            endpoints.append((p['role'], indices))
        if endpoints[0] == endpoints[1]: raise ValueError('Нельзя соединять участок с самим собой')
        ease = finite(expression(relation.get('ease_mm', 0), env), 'посадка шва')
        tolerance = finite(relation.get('tolerance_mm', 1), 'допуск шва')
        if not 0 <= tolerance <= 1: raise ValueError('Допуск шва должен быть 0–1 мм')
        direction = relation.get('direction', 'reverse')
        if direction not in ('same', 'reverse'): raise ValueError('Направление шва должно быть same или reverse')
        alignment = relation.get('alignment', [0, .5, 1])
        if not isinstance(alignment, list) or not 2 <= len(alignment) <= 16 or any(isinstance(v, bool) or not isinstance(v, (int, float)) or not math.isfinite(v) or not 0 <= v <= 1 for v in alignment) or alignment[0] != 0 or alignment[-1] != 1 or any(a >= b for a, b in zip(alignment, alignment[1:])):
            raise ValueError('Контрольные позиции шва: 2–16 возрастающих долей от 0 до 1, включая оба конца')
        kit.join(endpoints[0][0], endpoints[0][1], endpoints[1][0], endpoints[1][1], kind=text(relation.get('type', 'стачной'), 'тип шва'), direction=direction, ease=ease)
        kit.graph[-1]['tolerance_mm'] = tolerance
        kit.graph[-1]['alignment'] = copy.deepcopy(alignment)
    checked_dimensions = dimension_checks(kit.pieces, design.get('checks', []), env)
    resolved_constraints, checked_patterns = pattern_constraints(kit.pieces, design.get('pattern_checks', []), env)
    result = kit.finish(assembly_groups=assembly_groups);garment = result['garment']
    garment['dimension_checks'] = checked_dimensions
    if resolved_constraints:
        garment['pattern_constraints'] = resolved_constraints
        garment['pattern_check_results'] = checked_patterns
    labels = design.get('parameter_labels', {})
    if not isinstance(labels, dict) or set(labels)-set(design['parameters']): raise ValueError('Подписи допускаются только для объявленных параметров')
    for key, label in labels.items(): text(label, 'подпись параметра')
    ops = design.get('operations', [])
    if not isinstance(ops, list) or len(ops) > 64: raise ValueError('Допустимо до 64 технологических шагов')
    for step in ops: text(step, 'технологический шаг', 1000)
    garment['operations'] = ops + garment['operations']
    garment['pattern_design'] = copy.deepcopy(design)
    garment['design_dependencies'] = {'measurements': needed, 'parameters': list(design['parameters']), 'variables': copy.deepcopy(variables), 'rebuild': 'Повторное вычисление точек и кривых по формулам; масштабирование готовых деталей не применяется'}
    garment['profile_context'] = {'id': profile['id'], 'name': profile.get('name'), 'sex': profile.get('metadata', {}).get('sex', 'unspecified'), 'metadata': copy.deepcopy(profile.get('metadata', {}))}
    garment['development_sources'] = source_urls(design.get('sources', []))
    notes = design.get('notes', [])
    if not isinstance(notes, list) or len(notes) > 32: raise ValueError('Допустимо до 32 пояснений конструкции')
    garment['design_notes'] = [text(note, 'пояснение конструкции', 1000) for note in notes]
    garment['readiness']['construction'] = 'requires_review'
    return result


def audit(garment, reconstruct=True):
    from engineering.geometry import audit_piece, inside
    from engineering.assembly import audit as audit_assembly
    from engineering.quality import fingerprint
    issues, parts, assembly, dimensions, constraints = [], [], {'valid': False, 'links': [], 'issues': []}, [], []
    geometry_fingerprint = None
    def error(code, section, message, piece='Комплект'):
        issues.append({'code': code, 'severity': 'error', 'piece': piece, 'section': section, 'message': str(message)})
    try:
        if garment.get('method') != METHOD: raise ValueError('Неизвестная методика параметрической схемы')
        if not isinstance(garment.get('pieces'), list) or not 1 <= len(garment['pieces']) <= MAX_PIECES: raise ValueError('Некорректное количество деталей')
        ids = [p.get('id') for p in garment['pieces']]
        if any(not isinstance(i, str) or not i for i in ids) or len(set(ids)) != len(ids): raise ValueError('Идентификаторы деталей отсутствуют или повторяются')
        validate_garment(garment)
        if garment.get('pattern_constraints'):
            from engineering.pattern_constraints import check as check_pattern_constraints
            try:
                constraints = check_pattern_constraints(garment['pieces'], garment['pattern_constraints'])
            except ValueError as exc:
                error('PATTERN_CONSTRAINT', 'конструктивные проверки', exc)
        geometry_fingerprint = fingerprint(garment)
        if garment.get('pattern_design', {}).get('recipe') == 'patternmaking_skirt_v1':
            # This new recipe's native evidence includes uncut darts and their
            # sewing references. Keep legacy/shared fingerprint semantics intact.
            details = {'base_fingerprint': geometry_fingerprint,
                       'pieces': [{key: piece.get(key) for key in ('id', 'role', 'internal_lines', 'dart_details', 'grainline', 'seams', 'notches')}
                                  for piece in garment['pieces']],
                       'sewing_graph': garment['sewing_graph']}
            canonical = json.dumps(details, sort_keys=True, ensure_ascii=True, separators=(',', ':'), allow_nan=False)
            geometry_fingerprint = hashlib.sha256(canonical.encode('ascii')).hexdigest()
        for piece in garment['pieces']:
            if len(piece.get('seam_contour', [])) > MAX_SEGMENTS or len(piece.get('cut_contour', [])) > 4096: raise ValueError('Превышено число сегментов детали')
            row = audit_piece(piece);parts.append(row);issues.extend(row['issues'])
            poly = [(x, y) for x, y, _ in deserialize(piece['seam_contour']).clo_points(.1)]
            grain = piece.get('grainline')
            if not isinstance(grain, list) or len(grain) != 2 or Point(*grain[0]).distance(Point(*grain[1])) < 1:
                error('GRAIN_MISSING', 'долевая', 'Не задана корректная долевая', piece['name'])
            else:
                for t in (0, .25, .5, .75, 1):
                    p = Point(*grain[0]).mix(Point(*grain[1]), t)
                    if not inside((p.x, p.y), poly):
                        error('GRAIN_OUTSIDE', 'долевая', 'Указатель долевой выходит за пределы детали', piece['name']);break
            for index, line in enumerate(piece.get('internal_lines', [])):
                if not isinstance(line, list) or not 2 <= len(line) <= 64: raise ValueError('Некорректная внутренняя линия')
                vertices = [point(v, {}, 'внутренняя линия') for v in line]
                if sum(a.distance(b) for a,b in zip(vertices,vertices[1:])) < .5: raise ValueError('Нулевая или слишком короткая внутренняя линия')
                for a,b in zip(vertices,vertices[1:]):
                    if any(not inside((a.mix(b,t).x,a.mix(b,t).y),poly) for t in (0,.25,.5,.75,1)):
                        error('INTERNAL_OUTSIDE','внутренняя линия '+str(index),'Внутренняя линия выходит за контур детали',piece['name'])
            if type(piece.get('cut_quantity')) is not int or not 1 <= piece['cut_quantity'] <= 8: error('CUT_QUANTITY', 'раскрой', 'Некорректное количество кроя', piece['name'])
        assembly = audit_assembly(garment);issues.extend(assembly['issues'])
        if reconstruct:
            profile = {'id': garment['profile_id'], 'metadata': garment.get('profile_context', {}).get('metadata', {}), 'measurements': garment['measurement_snapshot']}
            expected = construct(profile, garment['pattern_design'])
            if expected.get('needs_input'): raise ValueError('Сохранённая схема не содержит подтверждённых исходных мерок')
            from engineering.validation import equivalent
            if not equivalent(garment.get('parameters'), expected['garment']['parameters']): error('DESIGN_PARAMETERS', 'параметры', 'Параметры не соответствуют сохранённой схеме')
            if not equivalent(garment.get('assembly_groups'), expected['garment'].get('assembly_groups')):
                error('DESIGN_ASSEMBLY_GROUPS', 'независимые сборки', 'Группы сборки отличаются от сохранённой схемы')
            if not equivalent(garment.get('pattern_constraints', []), expected['garment'].get('pattern_constraints', [])):
                error('DESIGN_CONSTRAINTS', 'конструктивные проверки', 'Ограничения не соответствуют сохранённой схеме')
            by_role = {p['role']: p for p in expected['garment']['pieces']}
            if set(by_role) != {p['role'] for p in garment['pieces']}: raise ValueError('Состав деталей отличается от сохранённой схемы')
            actual_roles = {p['role']: p for p in garment['pieces']}
            for check in expected['garment'].get('dimension_checks', []):
                row = dict(check);row['actual_mm'] = metric(actual_roles[row['piece']], row['metric'], row.get('seam'))
                row['passed'] = abs(row['actual_mm']-row['expected_mm']) <= row['tolerance_mm'];dimensions.append(row)
                if not row['passed']: error('DESIGN_DIMENSION', row.get('seam') or row['metric'], 'Размер не соответствует заданному ограничению: {:.3f} вместо {:.3f} мм'.format(row['actual_mm'], row['expected_mm']), actual_roles[row['piece']]['name'])
            for piece in garment['pieces']:
                for field in ('seam_contour', 'cut_contour', 'grainline', 'seams', 'cut_quantity', 'mirror_cut', 'internal_lines', 'dart_details'):
                    if not equivalent(piece.get(field), by_role[piece['role']].get(field)):
                        error('DESIGN_CONFORMITY', field, 'Геометрия или свойства детали отличаются от расчёта сохранённой схемы', piece['name'])
                def marks(p): return sorted((n.get('segment'), n.get('t'), n.get('kind')) for n in p.get('notches', []))
                if not equivalent(marks(piece), marks(by_role[piece['role']])): error('DESIGN_MARKS', 'контрольные метки', 'Метки отличаются от расчёта сопрягаемых участков', piece['name'])
            def topology(g):
                def endpoint(e): return (g['pieces'][e['piece']]['role'], 'outline' if 'segments' in e else 'internal', tuple(e['segments']) if 'segments' in e else (e['internal_line'],))
                return sorted((endpoint(r['a']), endpoint(r['b']), r['direction'], r['ease_mm'], r['tolerance_mm'], r['type'], tuple(r.get('alignment', []))) for r in g['sewing_graph'])
            if not equivalent(topology(garment), topology(expected['garment'])): error('DESIGN_ASSEMBLY', 'карта швов', 'Соединения отличаются от сохранённой схемы')
            if not equivalent(garment.get('recipe_details'), expected['garment'].get('recipe_details')): error('RECIPE_DETAILS','методика','Расчётные сведения основы отличаются от сохранённого рецепта')
    except (ValueError, KeyError, TypeError, IndexError, OverflowError) as exc:
        error('DESIGN_INVALID', 'схема конструкции', exc)
    warnings = [{'code': 'PARAMETRIC_PROTOTYPE', 'severity': 'warning', 'piece': 'Комплект', 'section': 'посадка', 'message': 'Математическая проверка не подтверждает конструктивный баланс, технологию и посадку. Нужны проверка и примерка макета.'}]
    unverified = [key for key, value in garment.get('measurement_snapshot', {}).items() if value.get('status') != 'verified']
    if unverified: warnings.append({'code': 'UNVERIFIED_MEASUREMENTS', 'severity': 'warning', 'piece': 'Профиль', 'section': 'мерки', 'measurement_ids': unverified, 'message': 'Для рабочего построения использованы записанные мерки без подтверждения. Их исходный статус сохранён; перед раскроем перепроверьте значения профиля.'})
    intended = garment.get('pattern_design', {}).get('intended_sex', 'unspecified')
    sex = garment.get('profile_context', {}).get('sex', 'unspecified')
    if intended != 'unspecified' and sex not in ('unspecified', intended): warnings.append({'code': 'PROFILE_SEX_REVIEW', 'severity': 'warning', 'piece': 'Комплект', 'section': 'профиль', 'message': 'Назначение схемы по полу отличается от профиля. Мерки не заменены средними значениями; проверьте выбранный конструктивный принцип.'})
    valid = not issues
    return {'schema_version': 1, 'garment_id': garment.get('id'), 'garment_version': garment.get('version'), 'profile_id': garment.get('profile_id'), 'method': {'id': METHOD, 'name': garment.get('name', 'Параметрическая схема'), 'version': '1.0.0', 'professional_standard_verified': False, 'source': garment.get('development_sources', [])}, 'valid': valid, 'issues': issues, 'warnings': warnings, 'parts': parts, 'assembly': assembly, 'dimension_checks': dimensions, 'pattern_checks': constraints, 'measurements': garment.get('measurement_snapshot', {}), 'parameters': garment.get('parameters', {}), 'quality': {'geometry': valid, 'geometry_fingerprint': geometry_fingerprint, 'labels': ['Расчёт проверен' if valid else 'Найдены ошибки', 'Требуется макет и примерка']}, 'native_export': {'status': 'not_measured', 'note': 'Проверена математическая модель; фактический экспорт CLO ещё не измерен.'}, 'fit': {'level_A': {'risks': ['Посадка и технология новой конструкции не подтверждены']}, 'level_B': {'instructions': ['Соберите макет из подходящего по свойствам материала и проверьте баланс и свободу движения']}}, 'fit_verified': False, 'sewing_ready': False}


def build(profile, design, previous=None):
    result = construct(profile, design, previous)
    if result.get('needs_input'): return result
    garment = result['garment'];report = audit(garment)
    from engineering.report import markdown
    result['qa_report'], result['qa_markdown'] = report, markdown(report)
    garment['qa_report'] = report;garment['quality_status'] = report['quality']
    garment['readiness']['geometry'] = report['valid']
    if not report['valid']:
        return {'qa_blocked': True, 'qa_report': report, 'qa_markdown': result['qa_markdown'], 'message': 'Не удалось проверить конструкцию: '+ '; '.join(i['piece']+' / '+i['section']+': '+i['message'] for i in report['issues'])}
    return result


def describe():
    from patternmaking_recipes import catalog
    return {'method': METHOD, 'version': 1, 'name': 'Параметрическая авторская схема',
            'patternmaking_recipes': catalog(),
            'units': 'mm', 'design_keys': sorted(DESIGN_KEYS), 'piece_keys': sorted(PIECE_KEYS), 'identifier_pattern': '^[a-z][a-z0-9_]{0,63}$',
            'variables': 'm_<measurement> (hyphens become underscores), p_<parameter>, pi; declared variables are evaluated in order',
            'measurement_policy': 'Present measured values including unverified manual entries can be used with a warning; source status is preserved. Missing or disputed values require clarification, never invented body values.',
            'functions': sorted(FUNCTIONS), 'operators': ['+', '-', '*', '/', '** constant exponent -4..4'],
            'primitives': {'rectangle': ['width', 'height'], 'trapezoid': ['top', 'bottom', 'height', 'offset optional'], 'annular_sector': ['inner_radius', 'width', 'angle_deg']},
            'segments': {'line': ['name', 'from', 'to'], 'quadratic': ['name', 'from', 'to', 'control'], 'cubic': ['name', 'from', 'to', 'controls:[first,second]']},
            'seam_names': {'rectangle': ['top', 'right', 'bottom', 'left'], 'trapezoid': ['top', 'right', 'bottom', 'left'], 'annular_sector': ['waist', 'radial_end', 'hem', 'radial_start']},
            'relation': {'a': {'piece': 'role', 'seam': 'named seam'}, 'b': {'piece': 'role', 'seam': 'named seam'}, 'ease_mm': 0, 'tolerance_mm': 1, 'direction': 'reverse', 'alignment': [0, .25, .5, .75, 1]},
            'assembly_groups': {'example': [['left_panel', 'left_cuff'], ['right_panel', 'right_cuff']], 'rules': ['Optional explicit partition of every piece role exactly once; 1–64 nonempty groups', 'Every group must be connected by real declared seams; a single standalone piece is allowed', 'No relations between independent groups; never add fictitious sewing links', 'Without this field the legacy single connected assembly rule remains in force', 'cut_quantity does not create additional native pieces or assemblies']},
            'pattern_checks': {
                'fold': {'type': 'fold', 'piece': 'role', 'seam': 'named straight seam', 'tolerance_deg': 1},
                'within': {'type': 'within', 'piece': 'child_role', 'parent': 'host_role', 'translate': ['x expression', 'y expression'], 'rotate_deg': 'optional angle expression', 'mirror': 'optional x or y', 'tolerance_mm': .1},
                'rules': ['До 64 явных проверок; формулы используют те же мерки и параметры', 'fold проверяет прямую ось и перпендикулярность соседних касательных; не меняет припуск и не объявляет деталь кроем на сгиб', 'within сравнивает контуры стачивания после явно заданного размещения дочерней детали в системе основной: отражение, поворот, перенос', 'Не применять вложенность к подкладке без конструктивного обоснования; проверка не означает правильную посадку', 'alignment — 2–16 строго возрастающих долей длины шва от 0 до 1; промежуточные позиции создают парные вспомогательные метки, не нативные надсечки']},
            'limits': {'pieces': MAX_PIECES, 'segments_per_piece': MAX_SEGMENTS, 'coordinate_abs_mm': 10000, 'seam_allowance_mm': [3, 25]},
            'schema': {'design': {'required': ['version', 'name', 'category', 'parameters', 'measurements', 'pieces'], 'allowed': sorted(DESIGN_KEYS)}, 'piece': {'required': ['role', 'name'], 'allowed': sorted(PIECE_KEYS), 'exclusive_geometry': ['primitive', 'points+segments']}, 'parameters': 'flat finite numeric map, abs<=10000', 'measurements': 'up to64 canonical/custom IDs; values only from profile', 'variables': 'ordered expression map', 'points': {'point_name': ['x expression', 'y expression']}, 'seams': {'seam_name': ['zero-based connected segment indices']}, 'grainline': [['x expression', 'y expression'], ['x expression', 'y expression']], 'notes': 'up to32 Russian technical hypothesis notes', 'checks': {'piece': 'role', 'metric': 'width|height|seam_length', 'seam': 'required for seam_length only', 'expected': 'expression', 'tolerance_mm': '0..1, default0.25'}, 'material': {'fabric_index': 'existing nonnegative integer'}},
            'limitations': ['Нет выполнения произвольного кода', 'Неизвестные мерки не подставляются', 'Припуск пока равномерный; особая обработка сгибов и низа требует отдельной проверки', 'Отверстия делятся на отдельные открытые секторы/панели', 'Универсальная корректная посадка и готовность к пошиву не гарантируются', 'Нативное автоматическое шитьё CLO не выполняется'],
            'example': circle_skirt_example()}


def circle_skirt_example():
    panel = {'name': 'Полотнище юбки', 'primitive': {'type': 'annular_sector', 'inner_radius': 'radius', 'width': 'p_length_mm', 'angle_deg': 180}}
    return {'version': 1, 'name': 'Юбка-солнце из двух полотнищ', 'category': 'skirt', 'parameters': {'length_mm': 600, 'waist_ease_mm': 20}, 'measurements': ['waist'], 'variables': {'radius': '(m_waist+p_waist_ease_mm)/(2*pi)'}, 'seam_allowance_mm': 10, 'pieces': [dict(panel, role='front'), dict(panel, role='back')], 'relations': [{'a': {'piece': 'front', 'seam': side}, 'b': {'piece': 'back', 'seam': side}, 'direction': 'reverse'} for side in ('radial_start', 'radial_end')], 'checks': [{'piece': role, 'metric': 'seam_length', 'seam': seam, 'expected': expected, 'tolerance_mm': tolerance} for role in ('front', 'back') for seam, expected, tolerance in [('waist', '(m_waist+p_waist_ease_mm)/2', .2), ('radial_start', 'p_length_mm', .01)]], 'operations': ['Определить и технологически оформить застёжку в боковом шве; проверить примеркой до основного раскроя']}


def main():
    try:
        if '--describe' in sys.argv:
            result = describe()
        else:
            raw = sys.stdin.read(500001)
            if len(raw) > 500000: raise ValueError('Слишком большой запрос конструкции')
            request = json.loads(raw)
            strict(request, {'profile', 'design', 'previous', 'operation', 'garment', 'describe', 'id', 'parameters'})
            if request.get('describe'): result = describe()
            elif request.get('operation') == 'patternmaking_recipe':
                from patternmaking_recipes import make_recipe, catalog
                result = {'design': make_recipe(request['id'], request.get('parameters')), 'recipe': catalog()[0]}
            elif request.get('operation') == 'qa': result = {'qa_report': audit(request['garment'])}
            elif request.get('operation') not in (None, 'build'): raise ValueError('Неизвестная операция конструкции')
            else: result = build(request['profile'], request['design'], request.get('previous'))
        print(json.dumps(result, ensure_ascii=True, allow_nan=False))
    except (ValueError, KeyError, TypeError, IndexError, RecursionError) as exc:
        print(json.dumps({'error': 'Параметрическая схема: '+str(exc)}, ensure_ascii=True))


if __name__ == '__main__':
    main()
