"""Adapted, measurement-only pattern recipes; never import the vendor at runtime.

Straight-skirt proportions adapted from pattern-making (MIT),
Copyright (c) 2026 Adrien Delmas; full license: third_party/pattern-making/LICENSE.
scripts/pattern.py:block_skirt, revision 6587004c4c0495592d0a3947553b52e72f1e354c.
The source remains in third_party/pattern-making; its standard-size fallback,
waist projection check and unequal dart legs are deliberately not reproduced.
"""
import copy
import math
import uuid

RECIPE = 'patternmaking_skirt_v1'
MEASUREMENTS = ['waist', 'hips', 'waist_hip_length']
DEFAULTS = {'length_mm': 600, 'waist_ease_mm': 10, 'hip_ease_mm': 40,
            'front_dart_length_mm': 90, 'back_dart_length_mm': 130,
            'side_raise_mm': 10, 'back_center_drop_mm': 10,
            'front_balance_mm': 5, 'max_side_suppression_mm': 30,
            'zipper_length_mm': 180, 'seam_allowance_mm': 10}
LABELS = {'length_mm': 'Длина по боковой вертикали', 'waist_ease_mm': 'Прибавка к обхвату талии',
          'hip_ease_mm': 'Прибавка к обхвату бёдер', 'front_dart_length_mm': 'Длина передней вытачки',
          'back_dart_length_mm': 'Длина задней вытачки', 'side_raise_mm': 'Подъём талии у бока',
          'back_center_drop_mm': 'Понижение талии сзади', 'front_balance_mm': 'Перераспределение ширины на перед',
          'max_side_suppression_mm': 'Предельное заужение четверти у бока',
          'zipper_length_mm': 'Длина участка задней застёжки', 'seam_allowance_mm': 'Равномерный припуск'}
SOURCE = {'repository': 'https://github.com/adriendelmas/pattern-making-skill',
          'revision': '6587004c4c0495592d0a3947553b52e72f1e354c', 'path': 'skills/pattern-making/scripts/pattern.py', 'license': 'MIT'}
LIMITATIONS = ['Прямая основа юбки для стабильной ткани; не законченная модель изделия.',
               'Пояс или обтачка, подкладка, обработка низа и технология молнии требуют отдельной разработки.',
               'Вытачки не вырезаются: их ноги и сгибы обозначены внутренними линиями.',
               'Равномерный припуск не заменяет подгибку низа и специальную обработку застёжки.',
               'Баланс переда и спинки, материал и посадку необходимо проверить на макете.']


def catalog():
    return [{'id': RECIPE, 'name': 'Прямая основа юбки с вытачками', 'category': 'skirt',
             'required_measurements': list(MEASUREMENTS), 'required_parameters': list(DEFAULTS),
             'default_parameters': copy.deepcopy(DEFAULTS), 'parameter_labels': copy.deepcopy(LABELS),
             'status': 'experimental', 'fit_verified': False, 'sewing_ready': False,
             'limitations': list(LIMITATIONS), 'source': copy.deepcopy(SOURCE)}]


def _number(value, label):
    if isinstance(value, bool) or not isinstance(value, (int, float)) or not math.isfinite(value) or abs(value) > 10000:
        raise ValueError(label + ': требуется конечное число в миллиметрах')
    return float(value)


def _parameters(values, complete=True):
    if not isinstance(values, dict) or set(values)-set(DEFAULTS):
        raise ValueError('Основа юбки: неизвестные конструктивные параметры')
    if complete and set(DEFAULTS)-set(values):
        raise ValueError('Основа юбки: не заданы параметры '+', '.join(sorted(set(DEFAULTS)-set(values))))
    p = {key: _number(value, LABELS[key]) for key, value in values.items()}
    if not complete: return p
    ranges = {'length_mm': (250, 1500), 'waist_ease_mm': (0, 100), 'hip_ease_mm': (0, 200),
              'front_dart_length_mm': (40, 200), 'back_dart_length_mm': (50, 240),
              'side_raise_mm': (0, 30), 'back_center_drop_mm': (0, 30),
              'front_balance_mm': (0, 20), 'max_side_suppression_mm': (0, 40),
              'zipper_length_mm': (80, 400), 'seam_allowance_mm': (3, 25)}
    for key, (lo, hi) in ranges.items():
        if not lo <= p[key] <= hi: raise ValueError(LABELS[key]+': допустимо {}–{} мм'.format(lo, hi))
    return p


def make_recipe(recipe_id, parameters=None):
    if recipe_id != RECIPE: raise ValueError('Неизвестная проверяемая основа: '+str(recipe_id))
    values = {**DEFAULTS, **_parameters({} if parameters is None else parameters, complete=False)}
    _parameters(values)
    return {'version': 1, 'recipe': RECIPE, 'name': 'Прямая основа юбки с вытачками',
            'category': 'skirt', 'measurements': list(MEASUREMENTS), 'parameters': values,
            'parameter_labels': copy.deepcopy(LABELS), 'seam_allowance_mm': 'p_seam_allowance_mm',
            'pieces': [], 'intended_sex': 'unspecified', 'notes': list(LIMITATIONS),
            'sources': [SOURCE['repository']+'/blob/'+SOURCE['revision']+'/'+SOURCE['path']]}


def validate_recipe(design):
    allowed = {'version', 'recipe', 'name', 'category', 'measurements', 'parameters', 'pieces',
               'parameter_labels', 'seam_allowance_mm', 'material', 'notes', 'sources', 'operations', 'intended_sex', 'pattern_checks', 'assembly_groups'}
    if not isinstance(design, dict) or set(design)-allowed: raise ValueError('Основа юбки: неизвестные поля схемы')
    if {'version','recipe','name','category','measurements','parameters','pieces'}-set(design): raise ValueError('Основа юбки: не указаны обязательные поля рецепта')
    if design.get('recipe') != RECIPE or type(design.get('version')) is not int or design['version'] != 1:
        raise ValueError('Неизвестная версия рецепта основы юбки')
    if design.get('category') != 'skirt' or design.get('pieces') != []:
        raise ValueError('Рецепт основы юбки требует category=skirt и pieces=[]; детали рассчитывает методика')
    if design.get('measurements') != MEASUREMENTS: raise ValueError('Основа юбки требует мерки: '+', '.join(MEASUREMENTS))
    p = _parameters(design.get('parameters'))
    allowance = design.get('seam_allowance_mm', 'p_seam_allowance_mm')
    if allowance != 'p_seam_allowance_mm' and (not isinstance(allowance, (int, float)) or isinstance(allowance, bool) or allowance != p['seam_allowance_mm']):
        raise ValueError('Припуск рецепта должен совпадать с seam_allowance_mm в параметрах')
    return p


def _body(profile):
    result = {}
    if not isinstance(profile, dict) or not profile.get('id'): raise ValueError('Основа юбки: нужен профиль мерок')
    for key in MEASUREMENTS:
        entry = profile.get('measurements', {}).get(key)
        if not isinstance(entry, dict) or entry.get('value') is None: raise ValueError('Основа юбки: отсутствует мерка '+key)
        if entry.get('status') == 'disputed': raise ValueError('Основа юбки: спорная мерка '+key)
        factor = {'mm': 1, 'cm': 10, 'in': 25.4}.get(entry.get('unit'))
        if factor is None: raise ValueError('Основа юбки: мерка '+key+' должна быть линейной')
        result[key] = _number(entry['value'], 'Мерка '+key)*factor
    if not 300 <= result['waist'] <= 2200 or not 350 <= result['hips'] <= 2400 or not 80 <= result['waist_hip_length'] <= 400:
        raise ValueError('Мерки выходят за рабочую область этой основы; проверьте единицы и выберите другую конструкцию')
    return result


def _waist_y(x, width, y0, ys): return y0+(ys-y0)*(x/width)**2


def _waist_length(a, b, width, y0, ys):
    k = 2*(ys-y0)/width**2
    if abs(k) < 1e-12: return b-a
    def f(x): return .5*(x*math.sqrt(1+(k*x)**2)+math.asinh(k*x)/k)
    return f(b)-f(a)


def _bisect(function, lo, hi, target, increasing=True):
    for _ in range(64):
        mid = (lo+hi)/2
        if (function(mid) < target) == increasing: lo = mid
        else: hi = mid
    return (lo+hi)/2


def _quarter(role, hip, target, depth, p):
    y0, ys = (0 if role == 'front' else p['back_center_drop_mm']), -p['side_raise_mm']
    hip_y, hem_y = depth-p['side_raise_mm'], p['length_mm']-p['side_raise_mm']
    suppression = min((p['_hip_total']-p['_waist_total'])/8, p['max_side_suppression_mm'])
    width = hip-suppression
    arc = lambda a, b: _waist_length(a, b, width, y0, ys)
    needed = arc(0, width)-target
    if needed < -1e-7: raise ValueError('Талия шире допустимой области этой прямой основы')
    darts = []
    if needed <= 5:
        width = _bisect(lambda w: _waist_length(0, w, w, y0, ys), 1, hip, target)
        if hip-width > p['max_side_suppression_mm']+1e-6: raise ValueError('Для талии без микровытачек требуется большее допустимое заужение у бока')
        arc = lambda a, b: _waist_length(a, b, width, y0, ys)
    else:
        centers, intake = None, None
        for locations, maximum in (([.45], 30), ([.35, .65], 60)):
            maximum = min(maximum, .9*width-6 if len(locations)==1 else .6*width-6)
            def closed(value):
                w = value/len(locations)
                return arc(0, width)-sum(arc(width*c-w/2, width*c+w/2) for c in locations)
            if maximum >= 5 and closed(maximum) <= target:
                centers = locations;intake = _bisect(closed, 0, maximum, target, increasing=False);break
        if centers is None: raise ValueError('Разница талии и бёдер требует иной основы: двух вытачек до 30 мм на четверть недостаточно')
        for i, center in enumerate(centers):
            w = intake/len(centers);a, b = width*center-w/2, width*center+w/2
            left, right = [a, _waist_y(a,width,y0,ys)], [b, _waist_y(b,width,y0,ys)]
            dx, dy = right[0]-left[0], right[1]-left[1];chord = math.hypot(dx, dy)
            length = p['front_dart_length_mm' if role=='front' else 'back_dart_length_mm']
            if length <= chord/2+5: raise ValueError('Вытачка слишком короткая для заданного раствора')
            normal = [-dy/chord, dx/chord];middle = [(left[j]+right[j])/2 for j in (0,1)]
            altitude = math.sqrt(length*length-chord*chord/4)
            apex = [middle[j]+normal[j]*altitude for j in (0,1)]
            cap = [apex[j]-normal[j]*length for j in (0,1)]
            if not y0+10 < apex[1] < hip_y-10: raise ValueError('Вершина вытачки должна находиться выше линии бёдер; измените её длину')
            darts.append({'name': 'dart_'+str(i), 'left':left, 'right':right, 'apex':apex, 'cap':cap,
                          'intake_mm':chord, 'waist_reduction_mm':arc(a,b), 'length_mm':length, 'cap_extension_mm':length-altitude})
    points, segments, waist_spans = {}, [], []
    def add_point(name, coords): points[name] = [float(v) for v in coords];return name
    add_point('center_waist',[0,y0]);current = 'center_waist'
    def line(name, destination):
        nonlocal current
        segments.append({'name':name,'type':'line','from':current,'to':destination});current = destination
    def curve(name,destination,c1,c2):
        nonlocal current
        add_point(name+'_c1',c1);add_point(name+'_c2',c2)
        segments.append({'name':name,'type':'cubic','from':current,'to':destination,'controls':[name+'_c1',name+'_c2']});current = destination
    def waist_to(destination):
        a,b = points[current][0],points[destination][0];dx=b-a;name='waist_'+str(len(waist_spans))
        if abs(y0-ys)<1e-10: line(name,destination)
        else:
            slope = lambda x: 2*(ys-y0)*x/(width*width)
            curve(name,destination,[a+dx/3,points[current][1]+slope(a)*dx/3],[b-dx/3,points[destination][1]-slope(b)*dx/3])
        waist_spans.append({'name':name,'length_mm':arc(a,b)})
    for dart in darts:
        prefix=dart['name']
        for key in ('left','right','cap','apex'): add_point(prefix+'_'+key,dart[key])
        waist_to(prefix+'_left');line(prefix+'_cap_a',prefix+'_cap');line(prefix+'_cap_b',prefix+'_right')
    add_point('side_waist',[width,ys]);waist_to('side_waist')
    add_point('hip',[hip,hip_y]);delta=hip-width
    curve('side_upper','hip',[width+delta*.6,ys+(hip_y-ys)*.15],[hip,hip_y-(hip_y-ys)*.45])
    add_point('side_hem',[hip,hem_y]);line('side_lower','side_hem')
    add_point('center_hem',[0,hem_y]);line('hem','center_hem')
    if role=='back':
        add_point('zipper_end',[0,y0+p['zipper_length_mm']]);line('center_seam','zipper_end');line('center_zipper','center_waist')
    else: line('center','center_waist')
    return {'points':points,'segments':segments,'darts':darts,'waist_spans':waist_spans,
            'hip':hip,'hip_y':hip_y,'hem_y':hem_y,'target':target}


def _calculate(profile, design):
    p = validate_recipe(design);m = _body(profile)
    waist, hip, depth = m['waist']+p['waist_ease_mm'],m['hips']+p['hip_ease_mm'],m['waist_hip_length']
    if hip < waist: raise ValueError('Эта прямая основа требует обхват бёдер с прибавкой не меньше талии; для другого телосложения нужна иная конструкция')
    if p['length_mm'] < depth+80: raise ValueError('Низ этой основы должен быть ниже линии бёдер хотя бы на 80 мм')
    if p['zipper_length_mm'] >= p['length_mm']-p['side_raise_mm']-p['back_center_drop_mm']-40:
        raise ValueError('Участок молнии слишком длинный относительно длины юбки')
    p['_waist_total'],p['_hip_total'] = waist,hip
    q = {role:_quarter(role,hip/4+sign*p['front_balance_mm'],waist/4+sign*p['front_balance_mm'],depth,p)
         for role,sign in (('front',1),('back',-1))}
    return p,m,q


def _front(quarter):
    points, segments = {}, []
    for prefix,sign in (('right_',1),('left_',-1)):
        points.update({prefix+k:[sign*v[0],v[1]] for k,v in quarter['points'].items()})
    for prefix,reverse in (('right_',False),('left_',True)):
        selected=[s for s in quarter['segments'] if s['name']!='center']
        for s in (list(reversed(selected)) if reverse else selected):
            row={'name':prefix+s['name'],'type':s['type'],'from':prefix+s['to' if reverse else 'from'],'to':prefix+s['from' if reverse else 'to']}
            if 'controls' in s: row['controls']=[prefix+c for c in (list(reversed(s['controls'])) if reverse else s['controls'])]
            segments.append(row)
    # Shared centre endpoints have equal coordinates, without adding zero-length edges.
    seams={}
    for prefix in ('right_','left_'):
        seams['side_'+prefix[:-1]]=[i for i,s in enumerate(segments) if s['name'] in (prefix+'side_upper',prefix+'side_lower')]
    return {'role':'front','name':'Переднее полотнище юбки — целиком','points':points,'segments':segments,'seams':seams,
            'grainline':[[0,quarter['hip_y']+10],[0,quarter['hem_y']-20]]}


def expand(profile, design):
    p,m,q = _calculate(profile,design)
    result={key:copy.deepcopy(value) for key,value in design.items() if key!='recipe'}
    front=_front(q['front']);back=q['back'];back_hip=back['hip'];front_hip=q['front']['hip']
    pieces=[front]
    for role,mirror,offset in (('back_left',False,front_hip+80),('back_right',True,front_hip+2*back_hip+160)):
        spec={'role':role,'name':'Заднее полотнище юбки — '+('левое' if not mirror else 'правое'),
              'points':copy.deepcopy(back['points']),'segments':copy.deepcopy(back['segments']),
              'seams':{'side':[i for i,s in enumerate(back['segments']) if s['name'].startswith('side_')]},
              'grainline':[[back_hip/2,back['hip_y']+10],[back_hip/2,back['hem_y']-20]],'translate':[offset,0]}
        if mirror: spec['mirror']='y'
        pieces.append(spec)
    result['pieces']=pieces;result['relations']=[]
    for side,direction in (('left','reverse'),('right','same')):
        result['relations'].append({'a':{'piece':'front','seam':'side_'+side},'b':{'piece':'back_'+side,'seam':'side'},
                                    'direction':direction,'type':'боковой шов','tolerance_mm':.25})
    for seam,kind in (('center_seam','средний задний шов'),('center_zipper','застёжка-молния — установить вручную')):
        result['relations'].append({'a':{'piece':'back_left','seam':seam},'b':{'piece':'back_right','seam':seam},'direction':'same','type':kind,'tolerance_mm':.1})
    result['checks']=[]
    for part in pieces:
        target=q['front'] if part['role']=='front' else q['back']
        result['checks'].extend([{'piece':part['role'],'metric':'height','expected':p['length_mm'],'tolerance_mm':.01},
                                 {'piece':part['role'],'metric':'width','expected':target['hip']*(2 if part['role']=='front' else 1),'tolerance_mm':.01}])
        for span in target['waist_spans']:
            for prefix in (('right_','left_') if part['role']=='front' else ('',)):
                result['checks'].append({'piece':part['role'],'metric':'seam_length','seam':prefix+span['name'],'expected':span['length_mm'],'tolerance_mm':.01})
    result['operations']=['Перенести ноги и сгибы вытачек; стачать каждую пару ног, не вырезая раствор.',
                          'Соединить боковые швы и задний средний шов; верхний участок предназначен для ручной установки молнии.',
                          'Разработать пояс или обтачку, обработку низа и технологию застёжки; проверить баланс на макете.']+result.get('operations',[])
    return result


def decorate(result, profile, design):
    """Attach calculated internal dart semantics after the ordinary contour builder."""
    p,m,q=_calculate(profile,design);g=result['garment'];closed=0;dart_count=0
    for piece in g['pieces']:
        quarter=q['front'] if piece['role']=='front' else q['back']
        copies=[('right_',1,0),('left_',-1,0)] if piece['role']=='front' else [('',-1 if piece['role']=='back_right' else 1,
                   q['front']['hip']+2*q['back']['hip']+160 if piece['role']=='back_right' else q['front']['hip']+80)]
        piece['dart_details']=[];piece['internal_lines']=[]
        for prefix,sign,shift in copies:
            def mapped(pt): return [sign*pt[0]+shift,pt[1]]
            for dart in quarter['darts']:
                start=len(piece['internal_lines'])
                piece['internal_lines'].extend([[mapped(dart['left']),mapped(dart['apex'])],
                                                [mapped(dart['right']),mapped(dart['apex'])],
                                                [mapped(dart['cap']),mapped(dart['apex'])]])
                detail={key:copy.deepcopy(value) for key,value in dart.items() if key not in ('left','right','cap','apex')}
                detail.update(name=prefix+dart['name'],legs=[start,start+1],fold=start+2,kind='uncut_waist_dart')
                piece['dart_details'].append(detail);index=g['pieces'].index(piece)
                g['sewing_graph'].append({'id':str(uuid.uuid4()),'a':{'piece':index,'internal_line':start},
                                         'b':{'piece':index,'internal_line':start+1},'direction':'same','type':'непрорезанная вытачка',
                                         'ease_mm':0,'tolerance_mm':.01,'alignment':[0,1]})
                dart_count+=1
            closed+=sum(span['length_mm'] for span in quarter['waist_spans'])
    g['recipe_details']={'id':RECIPE,'implementation_version':1,'source':copy.deepcopy(SOURCE),
                         'waist_closed_mm':closed,'waist_target_mm':p['_waist_total'],
                         'hip_circumference_mm':p['_hip_total'],'hip_level_mm':q['front']['hip_y'],
                         'dart_count':dart_count,'front_cut_on_fold':False,
                         'limitations':list(LIMITATIONS),'professional_standard_verified':False}
    g['construction_lines'].update(hip_level_mm=q['front']['hip_y'],hem_level_mm=q['front']['hem_y'])
    return result
