"""Own experimental utility variants; no arbitrary AI coordinates or external code execution."""
import copy
import math
import uuid
from dataclasses import replace
from contour_engine import Point, Segment, Contour
from garment_engine import construct as trousers, deserialize
from category_constructors import Kit, build as category_build, adopt, rect

METHODS={'trousers_utility_v1':'wide_trousers_experimental_v1',
         'jacket_utility_v1':'jacket_stand_v1','jumpsuit_utility_v1':'jumpsuit_work_v1'}
POCKET_DEFAULTS={'utility_pocket_width_mm':140,'utility_pocket_height_mm':170,
                 'utility_pocket_depth_mm':30,'utility_flap_height_mm':50}
EXTRA=set(POCKET_DEFAULTS)|{'utility_pocket_y_mm','front_crotch_extension_mm',
                          'back_crotch_extension_mm','torso_ease_mm'}


def longer_curve(curve,target,tolerance=.005):
    """Lengthen a cubic with fixed landmarks and endpoint tangent directions.

    Bracket a root on a bounded control-handle interval, then bisect it. This is
    local seam calibration, never scaling the panel or moving anatomical levels.
    """
    initial=curve.length(.0005)
    if abs(initial-target)<=tolerance:return curve
    if initial>target:raise ValueError('Калибровка шва не может укоротить заданную кривую')
    def candidate(factor):
        return Segment(curve.start,curve.end,
                       curve.start.mix(curve.c1,factor),curve.end.mix(curve.c2,factor))
    lo,hi=1.,None
    for i in range(1,25):
        factor=1+i/8
        if candidate(factor).length(.0005)>=target:
            hi=factor;break
        lo=factor
    if hi is None:raise ValueError('Не удалось согласовать шаговые швы без перемещения опорных точек; измените параметры сидения')
    for _ in range(35):
        mid=(lo+hi)/2
        if candidate(mid).length(.0005)<target:lo=mid
        else:hi=mid
    result=candidate((lo+hi)/2)
    if abs(result.length(.0005)-target)>tolerance:raise ValueError('Не удалось подтвердить длину шагового шва')
    return result


def balanced_pair(base,front_extension,back_extension,allowance=10):
    front=type(base)(replace(base.parameters,crotch_extension_mm=front_extension)).contour()
    back=type(base)(replace(base.parameters,crotch_extension_mm=back_extension)).contour()
    # Segment 7 is the upper inseam, directed from knee to fork in this block.
    target=max(front.segments[7].length(.0005),back.segments[7].length(.0005))
    def fitted(c):
        return Contour(c.segments[:7]+(longer_curve(c.segments[7],target),)+c.segments[8:])
    pair=(fitted(front),fitted(back))
    from garment_engine import offset
    for name,c in zip(('передней','задней'),pair):
        try:offset(c,allowance)
        except ValueError as error:
            raise ValueError('Шаговой шов '+name+' половинки: выбранная разница выступов сидения образует небезопасную кривую; уменьшите разницу') from error
    return pair


def pocket_placement(host,y,width,height,margin=15,x=None):
    """A full rectangular stitch footprint must fit every outline cross-section."""
    points=[Point(x,z) for x,z,_ in deserialize(host['seam_contour']).clo_points(.05)]
    levels=[y,y+height]+[p.y for p in points if y<p.y<y+height]
    left,right=-math.inf,math.inf
    for level in levels:
        crossings=[]
        for a,b in zip(points,points[1:]+points[:1]):
            if min(a.y,b.y)<=level<max(a.y,b.y):
                crossings.append(a.x+(level-a.y)*(b.x-a.x)/(b.y-a.y))
        crossings.sort()
        if len(crossings)!=2:raise ValueError('Карман: на выбранном уровне нет однозначного места внутри детали «'+host['name']+'»')
        left=max(left,crossings[0]+margin);right=min(right,crossings[1]-margin)
    if right-left<width or (x is not None and not left<=x<=right-width):raise ValueError('Объёмный карман не помещается в детали «'+host['name']+'»: уменьшите ширину или измените высоту размещения')
    return (left+right-width)/2 if x is None else x


def add_cargo(kit,host_role,side,y):
    g=kit.g;w=g['utility_pocket_width_mm'];h=g['utility_pocket_height_mm'];d=g['utility_pocket_depth_mm'];f=g['utility_flap_height_mm']
    host=kit.pieces[kit.roles[host_role]]
    x=pocket_placement(host,y,w,h)
    # Flap attachment sits above the opening; check the full flap footprint too.
    pocket_placement(host,y-10,w,f,x=x)
    role='cargo_'+side;panel=kit.add(role,'Объёмный карман '+('левый' if side=='left' else 'правый'),rect(w,h))
    length=2*h+w
    gusset=Contour.polygon([(0,0),(h,0),(h+w,0),(length,0),(length,d),(h+w,d),(h,d),(0,d)])
    strip=role+'_gusset';kit.add(strip,'Стенка кармана '+('левая' if side=='left' else 'правая'),gusset)
    kit.pieces[kit.roles[strip]]['grainline']=[[10,d/2],[length-10,d/2]]
    # Panel right -> bottom -> left matches the three-piece top edge of the strip.
    kit.join(role,[1,2,3],strip,[0,1,2],direction='reverse')
    idx=len(host['internal_lines']);host['internal_lines'].append([[x,y],[x,y+h],[x+w,y+h],[x+w,y]])
    kit.graph.append({'id':str(uuid.uuid4()),'a':{'piece':kit.roles[strip],'segments':[4,5,6]},
                      'b':{'piece':kit.roles[host_role],'internal_line':idx},'direction':'reverse',
                      'type':'притачивание стенки кармана','ease_mm':0,'tolerance_mm':.5,'alignment':[0,1]})
    flap=role+'_flap';kit.add(flap,'Клапан кармана '+('левый' if side=='left' else 'правый'),rect(w,2*f))
    kit.pieces[kit.roles[flap]]['internal_lines'].append([[0,f],[w,f]])
    kit.pieces[kit.roles[flap]]['internal_line_kinds']=['fold']
    fi=len(host['internal_lines']);host['internal_lines'].append([[x,y-10],[x+w,y-10]])
    kit.graph.append({'id':str(uuid.uuid4()),'a':{'piece':kit.roles[flap],'segments':[0]},
                      'b':{'piece':kit.roles[host_role],'internal_line':fi},'direction':'same',
                      'type':'притачивание клапана','ease_mm':0,'tolerance_mm':.5,'alignment':[0,1]})
    for p in (panel,kit.pieces[kit.roles[strip]],kit.pieces[kit.roles[flap]]):
        p['construction_version']=kit.version


def remove_patch_attachments(source):
    """Remove only obsolete generated patch-pocket stitch footprints.

    Dropping the pocket pieces alone leaves their U-shaped lines on the fronts.
    Remap surviving internal references, rather than clearing a host's geometry.
    """
    garment=source['garment'];pieces=garment['pieces']
    removed={i for i,p in enumerate(pieces) if p['role'].startswith('patch_')}
    discarded={}
    graph=[]
    for relation in garment['sewing_graph']:
        ends=[relation['a'],relation['b']]
        if any(e['piece'] in removed for e in ends):
            for e in ends:
                if e['piece'] not in removed and 'internal_line' in e:
                    discarded.setdefault(e['piece'],set()).add(e['internal_line'])
        else:graph.append(relation)
    for i,drop in discarded.items():
        p=pieces[i];keep=[j for j in range(len(p['internal_lines'])) if j not in drop]
        mapping={old:new for new,old in enumerate(keep)}
        for relation in graph:
            for end in (relation['a'],relation['b']):
                if end['piece']==i and 'internal_line' in end:
                    if end['internal_line'] not in mapping:raise ValueError('Линия старого кармана используется другой связью; замена кармана остановлена')
                    end['internal_line']=mapping[end['internal_line']]
        p['internal_lines']=[p['internal_lines'][j] for j in keep]
        if 'internal_line_kinds' in p:p['internal_line_kinds']=[p['internal_line_kinds'][j] if j<len(p['internal_line_kinds']) else 'stitch_attachment' for j in keep]
    garment['sewing_graph']=graph


def build(method,profile,parameters,previous=None):
    from engineering.methods import method as metadata
    meta=metadata(method)
    if method not in METHODS:raise ValueError('Неизвестная утилитарная конструкция')
    unsupported=EXTRA.intersection(parameters)-set(meta['optional_parameters'])
    if unsupported:raise ValueError('Параметры не поддерживаются этой конструкцией: '+', '.join(sorted(unsupported)))
    for key,value in parameters.items():
        if key in EXTRA and (type(value) not in (int,float) or not math.isfinite(value)):
            raise ValueError('Параметр должен быть конечным числом: '+key)
    g=dict(POCKET_DEFAULTS,**parameters)
    for key,lo,hi in [('utility_pocket_width_mm',60,300),('utility_pocket_height_mm',80,400),
                      ('utility_pocket_depth_mm',10,80),('utility_flap_height_mm',25,100)]:
        if not lo<=g[key]<=hi:raise ValueError('Размер кармана вне диапазона: '+key)
    core={k:v for k,v in parameters.items() if k not in EXTRA}
    if method=='trousers_utility_v1':
        hips=profile.get('measurements',{}).get('hips',{}).get('value')
        # Requirements are checked before calculating any technical defaults.
        from garment_engine import requirements
        needed=requirements(profile,core)
        if any(needed[k] for k in ('missing_measurements','unverified_measurements','missing_parameters')):
            needed['method']=method;return {'needs_input':needed}
        hip=(hips+core['hip_ease_mm'])/4
        g.setdefault('front_crotch_extension_mm',max(20,hip*.16))
        g.setdefault('back_crotch_extension_mm',max(20,hip*.17))
        for key in ('front_crotch_extension_mm','back_crotch_extension_mm'):
            if not 1<=g[key]<hip/2:raise ValueError('Выступ сидения должен быть положительным и меньше половины ширины панели по бёдрам: '+key)
        pair=lambda base:balanced_pair(base,g['front_crotch_extension_mm'],g['back_crotch_extension_mm'],core.get('seam_allowance_mm',10))
        source=trousers(profile,core,_panel_pair=pair)
    else:
        if method=='jumpsuit_utility_v1':
            g.setdefault('torso_ease_mm',40)
            if not 0<=g['torso_ease_mm']<=150:raise ValueError('Прибавка по длине корпуса должна быть 0–150 мм')
            if 'torso_length_mm' in core:
                value=core['torso_length_mm']
                if type(value) not in (int,float) or not math.isfinite(value):raise ValueError('Длина корпуса должна быть конечным числом')
                core['torso_length_mm']+=g['torso_ease_mm']
        source=category_build(METHODS[method],profile,core)
    if source.get('needs_input'):
        source['needs_input']['method']=method;return source
    # Persist resolved technical defaults, but keep the user's base torso length.
    resolved=copy.deepcopy(source['garment']['parameters']);resolved.update(g)
    if method=='jumpsuit_utility_v1':resolved['torso_length_mm']=parameters['torso_length_mm']
    g=resolved
    if 'utility_pocket_y_mm' not in g:
        g['utility_pocket_y_mm']=(profile['measurements']['seated_depth']['value']-g['waist_drop_mm']+40
                                  if meta['category']!='jacket' else g['length_mm']-g['utility_pocket_height_mm']-40)
    if not 0<=g['utility_pocket_y_mm']<=3000:raise ValueError('Высота размещения кармана вне диапазона')
    kit=Kit(method,profile,g,previous,metadata=meta)
    if meta['category']=='jacket':remove_patch_attachments(source)
    adopt(kit,source,excluded=('patch_',) if meta['category']=='jacket' else ())
    base_roles=[p['role'] for p in kit.pieces]
    for side in ('left','right'):add_cargo(kit,'front_'+side,side,g['utility_pocket_y_mm'])
    kit.metadata['required_roles']=base_roles+['cargo_'+s+suffix for s in ('left','right') for suffix in ('','_gusset','_flap')]
    result=kit.finish();garment=result['garment']
    garment['construction_lines']['utility_pocket_y_mm']=g['utility_pocket_y_mm']
    garment['operations'][:0]=['Согласовать и перенести П-образные линии притачивания объёмных карманов',
                              'Притачать стенки карманов к передним панелям и внутренним линиям основных деталей; сложить клапаны по линии сгиба']
    if method=='jumpsuit_utility_v1':
        garment['construction_lines']['effective_torso_length_mm']=g['torso_length_mm']+g['torso_ease_mm']
        garment['operations'].append('Проверить длину корпуса стоя, сидя и при подъёме рук; прибавка по длине не подтверждает свободу движения')
    garment['method_spec']['technical_defaults_disclosed']=True
    return result
