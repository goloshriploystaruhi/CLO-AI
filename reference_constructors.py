"""Own bounded woven prototypes inspired by published silhouettes, not brand patterns.

All coordinates are computed in millimetres. The AI can supply only catalogued
scalars. The sleeve solver is shared numerical geometry, not the knit T-shirt
construction (no ribana, negative ease or fabric assumptions are reused).
"""
import copy
import math
import uuid
from contour_engine import Point, Segment, Contour
from garment_engine import construct as trousers, deserialize, grain_guide
from category_constructors import Kit, adopt, rect, reverse
from tshirt_engine import bodice, sleeve_solution, cap_half, mirrored
from utility_constructors import pocket_placement


def trouser_pair(base, front_extension, back_extension, allowance):
    """Calibrate upper inseams without stretching handles past the knee/fork.

    Preserve the knee tangent and all y coordinates. Solve only the fork-side
    x handle, avoiding the loops produced by uniformly lengthening both handles
    on very wide knees. This is a bounded local correction, not panel scaling.
    """
    from dataclasses import replace
    from garment_engine import offset
    pair = [type(base)(replace(base.parameters,crotch_extension_mm=e)).contour() for e in (front_extension,back_extension)]
    target = max(c.segments[7].length(.0005) for c in pair)
    result = []
    for c in pair:
        curve = c.segments[7]
        if target-curve.length(.0005) > .001:
            def candidate(dx):return Segment(curve.start,curve.end,curve.c1,Point(curve.c2.x+dx,curve.c2.y))
            lo,hi = 0., min(80.,base.parameters.hip_width_mm*.25)
            if candidate(hi).length(.0005)<target:raise ValueError('Шаговой шов: разница выступов сидения не согласуется с выбранной шириной колена')
            for _ in range(35):
                mid = (lo+hi)/2
                if candidate(mid).length(.0005)<target:lo=mid
                else:hi=mid
            curve = candidate((lo+hi)/2)
        updated = Contour(c.segments[:7]+(curve,)+c.segments[8:])
        try:offset(updated,allowance)
        except ValueError as error:
            raise ValueError('Брюки, '+('передняя' if not result else 'задняя')+' половинка: небезопасный припуск у шагового шва. Проверьте ширины колена, низа и припуск.') from error
        result.append(updated)
    return tuple(result)

PANTS = 'balloon_tapered_v1'
JACKET = 'workwear_zip_jacket_v1'
SUIT = 'women_baggy_boilersuit_v1'
METHODS = (PANTS, JACKET, SUIT)


class ReferenceKit(Kit):
    def add(self, role, name, c, mirror=False, internal=None):
        try:return super().add(role,name,c,mirror,internal)
        except ValueError as error:
            translated = {'Self-intersecting contour':'контур припуска пересекает сам себя',
                          'Contour is not closed':'контур не замкнут',
                          'Duplicate adjacent points':'совпадают соседние точки'}.get(str(error),str(error))
            raise ValueError('Деталь «'+name+'»: '+translated+'. Проверьте размеры и припуск.') from error


def prepare(method, profile, parameters, previous):
    from engineering.methods import method as metadata
    meta = metadata(method)
    measurements = profile.get('measurements', {})
    check = dict(method=method,
                 missing_measurements=[k for k in meta['required_measurements'] if measurements.get(k, {}).get('value') is None],
                 unverified_measurements=[k for k in meta['required_measurements'] if measurements.get(k, {}).get('value') is not None and measurements[k].get('status') != 'verified'],
                 missing_parameters=[k for k in meta['required_parameters'] if k not in parameters])
    if any(check[k] for k in ('missing_measurements', 'unverified_measurements', 'missing_parameters')):
        return None, {'needs_input': check}
    if set(parameters) - set(meta['parameter_ranges']) - {'material'}:
        raise ValueError('Неизвестный параметр конструкции: ' + ', '.join(sorted(set(parameters) - set(meta['parameter_ranges']) - {'material'})))
    g = dict(meta['defaults'], **parameters)
    if 'loop_count' in g and type(g['loop_count']) is not int:
        raise ValueError('Количество шлёвок должно быть целым числом')
    for key, value in g.items():
        if key == 'material':
            if not isinstance(value, dict) or set(value) - {'fabric_index'} or ('fabric_index' in value and (type(value['fabric_index']) is not int or value['fabric_index'] < 0)):
                raise ValueError('Материал: разрешён только целый неотрицательный индекс ткани CLO')
            continue
        lo, hi = meta['parameter_ranges'][key]
        if type(value) not in (int, float) or not math.isfinite(value) or not lo <= value <= hi:
            raise ValueError('{}: нужно конечное число в пределах {}–{} мм'.format(key, lo, hi))
    for key in meta['required_measurements']:
        item = measurements[key]; value = item['value']
        if item.get('unit') != 'mm' or type(value) not in (int, float) or not math.isfinite(value) or not 1 <= value <= 3000:
            raise ValueError('Мерка «{}»: нужно положительное значение в миллиметрах'.format(key))
    return ReferenceKit(method, profile, g, previous, metadata=meta), None


def stitch_lines(kit, role, a, b, kind):
    """Explicit folded dart legs / stitch guides. Not native CLO dart attributes."""
    p = kit.pieces[kit.roles[role]]; i = len(p['internal_lines'])
    p['internal_lines'].extend((a, b))
    kinds = p.setdefault('internal_line_kinds', ['stitch_attachment'] * i)
    kinds.extend(('dart_leg', 'dart_leg'))
    kit.graph.append(dict(id=str(uuid.uuid4()), a=dict(piece=kit.roles[role], internal_line=i),
                          b=dict(piece=kit.roles[role], internal_line=i+1), direction='same',
                          type=kind, ease_mm=0, tolerance_mm=.1, alignment=[0, 1]))


def lower(kit, darts=False, excluded=()):
    g = kit.g; m = lambda k: kit.profile['measurements'][k]['value']
    keys = ('length_mm', 'waist_drop_mm', 'hip_ease_mm', 'waist_ease_mm', 'knee_flat_mm', 'hem_flat_mm',
            'seam_allowance_mm', 'belt_width_mm', 'pocket_width_mm', 'pocket_depth_mm', 'zipper_mm',
            'fly_width_mm', 'guard_width_mm', 'loop_count', 'loop_width_mm', 'back_raise_mm', 'material')
    core = {k: g[k] for k in keys if k in g}
    intake = g['hem_dart_intake_mm'] if darts else 0
    # One front + one back form a leg. hem_flat_mm denotes HALF its finished
    # circumference, matching the pre-existing trouser parameter convention.
    core['hem_flat_mm'] += intake
    hip = (m('hips') + g['hip_ease_mm']) / 4
    if not g['hem_flat_mm'] < g['knee_flat_mm'] <= hip + hip * .16:
        raise ValueError('Брюки: низ должен быть уже колена; колено не должно превышать ширину у сидения')
    source = trousers(kit.profile, core, _panel_pair=lambda base: trouser_pair(base, max(20, hip*.16), max(20, hip*.17), g['seam_allowance_mm']))
    if source.get('needs_input'):raise ValueError('Не хватает исходных данных брюк')
    adopt(kit, source, excluded=excluded)
    # Preserve semantics that the legacy adoption helper does not copy.
    original = {p['role']: p for p in source['garment']['pieces']}
    for p in kit.pieces:
        q = original[p['role']]
        for key in ('seams', 'grainline', 'internal_line_kinds'):
            if key in q:p[key] = copy.deepcopy(q[key])
        if p['role'].startswith(('front_', 'back_')):
            p['material_panel'] = 'перед — светлый деним' if p['role'].startswith('front_') and darts else 'зад — контрастный деним' if darts else 'основной материал'
            p['finished_hem_panel_mm'] = g['hem_flat_mm']
            if intake:
                c = deserialize(p['seam_contour']); hem = c.segments[5]
                center = hem.start.mix(hem.end, .5)
                if g['hem_dart_length_mm'] >= g['length_mm'] - m('waist_knee') + g['waist_drop_mm'] - 15:
                    raise ValueError('Нижняя вытачка должна заканчиваться ниже линии колена')
                apex = [center.x, center.y-g['hem_dart_length_mm']]
                stitch_lines(kit, p['role'], [[center.x-intake/2, center.y], apex],
                             [[center.x+intake/2, center.y], apex], 'нижняя вытачка — сложить и стачать вручную')
                p['dart_spec'] = dict(intake_mm=intake, length_mm=g['hem_dart_length_mm'],
                                      finished_hem_mm=hem.length()-intake, native_dart=False)
    return source['garment']['construction_lines']


def pocket(kit, host_role, name, width, height, y, zipper=False):
    host = kit.pieces[kit.roles[host_role]]
    x = pocket_placement(host, y, width, height, margin=20)
    idx = len(host['internal_lines']); host['internal_lines'].append([[x, y], [x+width, y]])
    host.setdefault('internal_line_kinds', ['stitch_attachment'] * idx).append('pocket_slit_manual')
    roles = []
    label = 'нагрудного кармана' if zipper else 'левого нижнего кармана' if name.endswith('left') else 'правого нижнего кармана'
    for half in ('inner', 'outer'):
        role = name+'_'+half; kit.add(role, 'Мешковина ' + label + (' — внутренняя' if half=='inner' else ' — наружная'), rect(width, height)); roles.append(role)
        kit.graph.append(dict(id=str(uuid.uuid4()), a=dict(piece=kit.roles[role], segments=[0]),
                              b=dict(piece=kit.roles[host_role], internal_line=idx), direction='same',
                              type='вход кармана с молнией' if zipper else 'вход прорезного кармана',
                              ease_mm=0, tolerance_mm=.5, alignment=[0, 1]))
    kit.join(roles[0], [1, 2, 3], roles[1], [1, 2, 3])
    welt = name+'_welt'; kit.add(welt, 'Обтачка входа ' + label, rect(width, 30))
    kit.graph.append(dict(id=str(uuid.uuid4()), a=dict(piece=kit.roles[welt], segments=[0]),
                          b=dict(piece=kit.roles[host_role], internal_line=idx), direction='same',
                          type='обтачка входа кармана', ease_mm=0, tolerance_mm=.5, alignment=[0, 1]))


def upper(kit, front_length, back_length, hem_circumference, prefix='', bust_darts=False, pockets=True):
    g = kit.g; m = lambda k: kit.profile['measurements'][k]['value']
    def role(s):return prefix+s
    design = dict(g, length_mm=front_length, hem_circumference_mm=hem_circumference,
                  shoulder_width_mm=g.get('shoulder_width_mm', m('shoulder_width')))
    front, _ = bodice(m, design, True)
    back, _ = bodice(m, dict(design, length_mm=back_length), False)
    # Open full front at centre. Preserve measured armhole cubics unchanged.
    half = Contour((front.segments[10],) + front.segments[:4] +
                   (Segment(front.segments[4].start, Point(0, front_length)),
                    Segment(Point(0, front_length), front.segments[10].start)))
    dart = None
    if bust_darts and front_length-back_length > .01:
        side = half.segments[4]; target = back.segments[3].length()
        intake = side.length()-target
        if not .5 <= intake <= 65:raise ValueError('Баланс переда: раствор боковой вытачки должен быть 0,5–65 мм; нужна индивидуальная корректировка')
        apex = Point(m('bust_spacing')/2, m('bust_height'))
        dx, dy = side.end.x-side.start.x, side.end.y-side.start.y
        t = ((apex.x-side.start.x)*dx+(apex.y-side.start.y)*dy)/(dx*dx+dy*dy)
        dt = intake/(2*side.length())
        if not .05 < t-dt < t+dt < .95 or apex.x >= side.start.x-30:
            raise ValueError('Нагрудная вытачка не помещается на боковом шве: проверьте высоту и расстояние центров груди')
        a, b = side.start.mix(side.end, t-dt), side.start.mix(side.end, t+dt)
        foot = side.start.mix(side.end,t); distance = apex.distance(foot)
        if distance < g['bust_dart_tip_offset_mm']+20:raise ValueError('Нагрудная вытачка: недостаточно места между центром груди и боковым швом')
        # The sewing tip stops before the measured bust apex, preventing a
        # pointed bust. Moving along the same normal preserves equal dart legs.
        apex = apex.mix(foot,g['bust_dart_tip_offset_mm']/distance)
        dart = (a, b, apex, intake)
        half = Contour(half.segments[:4]+(Segment(side.start, a), Segment(a, b), Segment(b, side.end))+half.segments[5:])
    elif abs(front_length-back_length) > .01:
        raise ValueError('Эта основа поддерживает длину переда не меньше длины спины; требуется отдельная коррекция баланса')
    # Split back hem into left/right attachment sections (no geometric change).
    h1, h2 = back.segments[4].split()
    back = Contour(back.segments[:4]+(h1, h2)+back.segments[5:])
    back_map = dict(shoulder_left=9,side_right=[3],side_left=[6],arm_left=[7,8],neck=[10,11],hem_right=4,hem_left=5)
    if dart:
        # Pair each continuous side section separately. A [4,6] path would
        # jump over an open dart and cannot be resolved as one native CLO seam.
        before = half.segments[4].length(); after = half.segments[6].length()
        r1,r2 = back.segments[3].split(before/(before+after))
        l1,l2 = back.segments[6].split(after/(before+after))
        back = Contour(back.segments[:3]+(r1,r2)+back.segments[4:6]+(l1,l2)+back.segments[7:])
        back_map = dict(shoulder_left=11,side_right=[3,4],side_left=[8,7],arm_left=[9,10],neck=[12,13],hem_right=5,hem_left=6)
    kit.add(role('back'), 'Спинка корпуса', back)
    side_indices, hem_index, closure_index = ([4, 6], 7, 8) if dart else ([4], 5, 6)
    for side_name, mirror in (('right', False), ('left', True)):
        front_role = role('front_'+side_name)
        kit.add(front_role, 'Полочка ' + ('правая' if side_name=='right' else 'левая'), half, mirror)
        if dart:
            a, b, apex, intake = dart; sign = -1 if mirror else 1
            to_xy = lambda p: [p.x*sign, p.y]
            stitch_lines(kit, front_role, [to_xy(a), to_xy(apex)], [to_xy(b), to_xy(apex)], 'нагрудная вытачка — сложить и стачать вручную')
            kit.pieces[kit.roles[front_role]]['dart_spec'] = dict(intake_mm=intake, native_dart=False, side_gap_segment=5)
        kit.join(front_role, [1], role('back'), [0 if side_name=='right' else back_map['shoulder_left']])
        for front_index,back_index in zip(side_indices,back_map['side_'+side_name]):
            kit.join(front_role, [front_index], role('back'), [back_index], direction='reverse')
        zip_length = half.segments[closure_index].length()
        facing_role = role('zip_facing_'+side_name)
        kit.add(facing_role, 'Подборт ' + ('правый' if side_name=='right' else 'левый'), rect(g['facing_width_mm'], zip_length))
        kit.join(front_role, [closure_index], facing_role, [3])
    kit.join(role('front_left'), [closure_index], role('front_right'), [closure_index], 'молния спереди')
    fl = sum(front.segments[i].length(.001) for i in (1, 2))
    bl = sum(back.segments[i].length(.001) for i in (1, 2))
    ease = g['cap_ease_mm']/2
    height, fw, bw = sleeve_solution(fl+ease, bl+ease, m('biceps')+g['biceps_ease_mm'], m('armhole_depth'))
    cap_front, cap_back = cap_half(fw, height, True), cap_half(bw, height, False)
    length = g['sleeve_length_mm']-g['cuff_height_mm']; cuff = g['cuff_circumference_mm']
    if length <= height+80 or cuff > fw+bw:raise ValueError('Рукав: недостаточная длина или низ шире рукава по бицепсу')
    center = (bw-fw)/2
    r, l = Point(center+cuff/2, length), Point(center-cuff/2, length)
    sleeve = Contour((reverse(mirrored(cap_front)), cap_back, Segment(cap_back.end, r), Segment(r, l), Segment(l, mirrored(cap_front).end)))
    for side_name, mirror in (('right', False), ('left', True)):
        sleeve_role = role('sleeve_'+side_name); cuff_role = role('cuff_'+side_name)
        side_label = 'правый' if side_name=='right' else 'левый'
        kit.add(sleeve_role, 'Втачной рукав — '+side_label, sleeve, mirror)
        kit.join(role('front_'+side_name), [2, 3], sleeve_role, [0], ease=-ease)
        kit.join(role('back'), [1, 2] if side_name=='right' else back_map['arm_left'], sleeve_role, [1], ease=-ease)
        kit.join(sleeve_role, [2], sleeve_role, [4], direction='reverse')
        kit.add(cuff_role, 'Манжета — '+side_label, rect(cuff, 2*g['cuff_height_mm']), internal=[[[0, g['cuff_height_mm']], [cuff, g['cuff_height_mm']]]])
        kit.join(sleeve_role, [3], cuff_role, [0]); kit.join(cuff_role, [1], cuff_role, [3])
    nf = half.segments[0].length(.001); nb = sum(back.segments[i].length(.001) for i in back_map['neck']); total = 2*nf+nb
    if total < m('neck_base'):raise ValueError('Горловина меньше обхвата основания шеи')
    depth, tip = g['collar_fall_mm']+g['collar_roll_mm'], g['collar_tip_mm']
    collar = Contour.polygon([(0, 0), (nf, 0), (nf+nb, 0), (total, 0), (total+tip, depth), (-tip, depth)])
    for layer in ('under', 'upper'):
        p = kit.add(role('collar_'+layer), 'Отложной воротник — '+('нижний' if layer=='under' else 'верхний'), collar,
                    internal=[[[0, g['collar_roll_mm']], [total, g['collar_roll_mm']]]])
        p['internal_line_kinds'] = ['roll_guide']; p['grainline'] = [[nf, depth/2], [nf+nb, depth/2]]
    for fr, indices, target in ((role('front_right'), [0], [0]), (role('back'), back_map['neck'], [1]), (role('front_left'), [0], [2])):
        kit.join(fr, indices, role('collar_under'), target)
    kit.join(role('collar_under'), [3, 4, 5], role('collar_upper'), [3, 4, 5])
    # The upper collar's neckline is turned under and hand/edge stitched over
    # the same three attachment sections; no disconnected cosmetic pattern.
    kit.join(role('collar_upper'), [0, 1, 2], role('collar_under'), [0, 1, 2], 'закрыть шов втачивания воротника')
    if pockets:
        for side_name in ('left', 'right'):
            pocket(kit, role('front_'+side_name), role('hand_pocket_'+side_name), g['hand_pocket_width_mm'], g['hand_pocket_depth_mm'], front_length-g['hand_pocket_depth_mm']-35)
        pocket(kit, role('front_left'), role('chest_pocket'), g['chest_pocket_width_mm'], g['chest_pocket_depth_mm'], m('armhole_depth')+g['armhole_ease_mm']+20, True)
    return dict(front_hem=hem_index, back_right_hem=back_map['hem_right'], back_left_hem=back_map['hem_left'],
                front_length_mm=front_length, back_length_mm=back_length, cap_height_mm=height,
                closure_length_mm=half.segments[closure_index].length(), dart_intake_mm=dart[3] if dart else 0)


def build(method, profile, parameters, previous=None):
    if method not in METHODS:raise ValueError('Неизвестный вариант конструкции')
    kit, check = prepare(method, profile, parameters, previous)
    if check:return check
    g = kit.g; m = lambda k: profile['measurements'][k]['value']; levels = {}
    if method == PANTS:
        levels.update(lower(kit, darts=True))
    elif method == JACKET:
        levels.update(upper(kit, g['length_mm'], g['length_mm'], g['hem_circumference_mm']))
        # Hem facings turn inward: finished jacket length stays length_mm.
        for host, indices in (('front_right', [levels['front_hem']]), ('back', [4]), ('back', [5]), ('front_left', [levels['front_hem']])):
            name = 'hem_facing_'+str(len(kit.pieces)); c = deserialize(kit.pieces[kit.roles[host]]['seam_contour'])
            kit.add(name, 'Обтачка низа', rect(sum(c.segments[i].length() for i in indices), g['hem_facing_depth_mm']))
            kit.join(host, indices, name, [0])
    else:
        if g['waist_drop_mm'] != 0:raise ValueError('Комбинезон: соединение корпуса рассчитано на естественной талии, waist_drop_mm должен быть 0')
        # Moderate fullness is explicit, rather than the much wider balloon preset.
        if not 60 <= g['hip_ease_mm'] <= 240:raise ValueError('Комбинезон: полная прибавка по бёдрам должна быть 60–240 мм')
        levels.update(lower(kit, excluded=('belt_', 'loop_')))
        front_length = m('front_waist_length')+g['torso_ease_mm']
        back_length = m('back_waist_length')+g['torso_ease_mm']
        upper_levels = upper(kit, front_length, back_length, m('garment_waist_girth')+g['waist_ease_mm'], 'upper_', True, False)
        levels.update(upper_levels)
        for side in ('left', 'right'):
            kit.join('front_'+side, [0], 'upper_front_'+side, [upper_levels['front_hem']], direction='reverse')
            kit.join('back_'+side, [0], 'upper_back', [upper_levels['back_'+side+'_hem']], direction='reverse')
    kit.metadata['required_roles'] = list(kit.roles)
    result = kit.finish(); garment = result['garment']; garment['construction_lines'].update(levels)
    garment['source_references'] = copy.deepcopy(kit.metadata['source_references'])
    garment['operations'][:0] = [
        'Проверить пробный макет: опубликованные фотографии и размеры не заменяют примерку и не являются оригинальными лекалами бренда',
        'Стачать отмеченные пары ножек вытачек вручную; Internal Line не является нативной вытачкой CLO' if method != JACKET else 'Входы прорезных карманов разрезать и обработать вручную по меткам; линия не создаёт отверстие автоматически',
        'Назначить ткань, долевую, обработку низа и застёжки; автосшивание не выполняется']
    for p in garment['pieces']:p['grainline'] = grain_guide(deserialize(p['seam_contour']))
    return result


def audit(garment):
    """Additional physical semantics, independent of saved success flags."""
    from engineering.geometry import inside
    issues = []
    for p in garment['pieces']:
        c = deserialize(p['seam_contour']); poly = [(x, y) for x, y, _ in c.clo_points(.05)]
        def error(section, message):issues.append(dict(code='REFERENCE_CONSTRUCTION', severity='error', piece=p['name'], section=section, message=message))
        for i, line in enumerate(p['internal_lines']):
            if any(not inside(q, poly) for q in line):error('внутренняя линия '+str(i+1), 'Разметка выходит за линию стачивания детали')
        spec = p.get('dart_spec')
        if spec:
            legs = [l for l, k in zip(p['internal_lines'], p.get('internal_line_kinds', [])) if k=='dart_leg']
            if len(legs)!=2 or legs[0][-1]!=legs[1][-1]:error('вытачка', 'Нужны две ножки с общей вершиной')
            elif abs(math.hypot(legs[0][0][0]-legs[0][-1][0],legs[0][0][1]-legs[0][-1][1])-math.hypot(legs[1][0][0]-legs[1][-1][0],legs[1][0][1]-legs[1][-1][1]))>.01:error('вытачка', 'Длины ножек вытачки не совпадают')
            if garment['method']==PANTS:
                actual = c.segments[5].length()-spec['intake_mm']
                if abs(actual-garment['parameters']['hem_flat_mm'])>.01:error('низ после вытачки', 'Ширина готового низа не соответствует заданию')
    return issues
