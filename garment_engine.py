"""Experimental wide-trouser construction, explicitly versioned and parameter driven."""
import json
import math
import uuid
from datetime import datetime, timezone
from dataclasses import asdict
from contour_engine import Point, Segment, Contour, validate_polygon
from parametric_patterns import TrouserParameters, TrouserPanel, align_curve_end
from geometry_validation import require_valid

METHOD='wide_trousers_experimental_v1'
REQUIRED=['garment_waist_girth','hips','waist_hip_length','seated_depth','waist_knee']
REQUIRED_PARAMETERS=['length_mm','waist_drop_mm','hip_ease_mm','waist_ease_mm','knee_flat_mm','hem_flat_mm']
DEFAULTS=dict(belt_width_mm=40,seam_allowance_mm=10,pocket_width_mm=150,pocket_depth_mm=240,zipper_mm=140,fly_width_mm=45,guard_width_mm=40,loop_width_mm=12,loop_count=5,back_raise_mm=20)

METHOD_SPEC={'construction_revision':'wide_trousers_audit_2','coordinate_system':'x_right_y_down_mm','id':METHOD,'category':'trousers','status':'experimental','required_measurements':REQUIRED,
'recommended_measurements':['height','thigh','inseam','outseam'],'required_parameters':REQUIRED_PARAMETERS,
'formulas':{'waist_panel':'(обхват тела на уровне посадки + прибавка по талии) / 4',
'hip_panel':'(обхват бёдер + полная прибавка) / 4','levels':'мерки от естественной талии минус снижение талии',
'crotch_extension':'max(20 мм, 0.16 × ширина панели по бедру)',
'back_waist':'подъём внутренней задней точки с сохранением длины талиевого участка',
'cutting_outline':'внешний offset полилинии стачивания на равномерный припуск'},
'sequence':['Именованные уровни','Половинки и баланс задней талии','Разделение среднего шва под молнию','Карманы в боковом шве','Секции пояса','Гульфик и откосок','Шлёвки','Припуски и карта швов'],
'limits':['Не проверенная профессиональная методика','Только карманы в боковом шве','Равномерный припуск; обработку низа проверить отдельно','Материал без отрицательных прибавок','Кривые CLO представлены полилиниями'],
'length_tolerance_mm':1,'curve_tolerance_mm':.1}

def serialize(contour):
    return [{'start':[s.start.x,s.start.y],'end':[s.end.x,s.end.y],**({'c1':[s.c1.x,s.c1.y],'c2':[s.c2.x,s.c2.y]} if s.c1 else {})} for s in contour.segments]

def deserialize(segments):
    return Contour(tuple(Segment(Point(*s['start']),Point(*s['end']),Point(*s['c1']) if 'c1' in s else None,Point(*s['c2']) if 'c2' in s else None) for s in segments))

def rectangle(w,h): return Contour.polygon([(0,0),(w,0),(w,h),(0,h)])


def grain_guide(contour, preferred_x=None):
    """A clipped drawing guide, not a CLO grain attribute or a press crease."""
    pts=contour.clo_points(.05);x=preferred_x if preferred_x is not None else (min(p[0] for p in pts)+max(p[0] for p in pts))/2
    ys=[]
    for a,b in zip(pts,pts[1:]+pts[:1]):
        if min(a[0],b[0])<=x<max(a[0],b[0]):ys.append(a[1]+(x-a[0])*(b[1]-a[1])/(b[0]-a[0]))
    ys.sort();intervals=list(zip(ys[::2],ys[1::2]))
    if not intervals:raise ValueError('Не удалось разместить указатель долевой внутри детали')
    a,b=max(intervals,key=lambda p:p[1]-p[0]);margin=min(20,(b-a)*.15)
    return [[x,a+margin],[x,b-margin]]

def offset(contour,allowance):
    """Miter offset of flattened outline; rejects unsafe intersections instead of repairing."""
    raw=contour.clo_points(.1);pts=[Point(x,y) for x,y,_ in raw];n=len(pts)
    sign=1 if sum(pts[i].x*pts[(i+1)%n].y-pts[(i+1)%n].x*pts[i].y for i in range(n))>0 else -1
    lines=[]
    for i,a in enumerate(pts):
        b=pts[(i+1)%n];dx,dy=b.x-a.x,b.y-a.y;length=math.hypot(dx,dy)
        normal=Point(sign*dy/length*allowance,-sign*dx/length*allowance)
        lines.append((Point(a.x+normal.x,a.y+normal.y),Point(dx,dy)))
    result=[]
    for i in range(n):
        a,u=lines[i-1];b,v=lines[i];den=u.x*v.y-u.y*v.x
        if abs(den)<1e-10:q=b
        else:
            t=((b.x-a.x)*v.y-(b.y-a.y)*v.x)/den;q=Point(a.x+t*u.x,a.y+t*u.y)
        if q.distance(pts[i])>allowance*8:raise ValueError('Припуск образует острый выброс; измените конструкцию')
        result.append(q)
    validate_polygon(result)
    return Contour.polygon(result)

def requirements(profile,parameters):
    m=profile.get('measurements',{})
    needed=[k for k in REQUIRED if k!='waist_knee' or 'lower_control_y_mm' not in parameters]
    return {'method':METHOD,'missing_measurements':[k for k in needed if m.get(k,{}).get('value') is None],
            'unverified_measurements':[k for k in needed if m.get(k,{}).get('value') is not None and m[k].get('status')!='verified'],
            'missing_parameters':[k for k in REQUIRED_PARAMETERS if k not in parameters],
            'defaults':DEFAULTS,'experimental':True}

def construct(profile,parameters,previous=None,_panel_pair=None):
    check=requirements(profile,parameters)
    if any(check[k] for k in ('missing_measurements','unverified_measurements','missing_parameters')):return {'needs_input':check}
    if set(parameters)-set(REQUIRED_PARAMETERS)-set(DEFAULTS)-{'material','lower_control_y_mm'}:raise ValueError('Неизвестный параметр изделия')
    g=dict(DEFAULTS,**parameters)
    for k,v in g.items():
        if k=='material':continue
        if isinstance(v,bool) or not isinstance(v,(int,float)) or not math.isfinite(v):raise ValueError('Параметр должен быть конечным числом: '+k)
    if not 0<=g['waist_drop_mm']<=100 or not 0<=g['hip_ease_mm']<=400 or not 0<=g['waist_ease_mm']<=100:raise ValueError('Посадка или прибавки вне диапазона методики')
    if not 3<=g['seam_allowance_mm']<=25 or not 20<=g['belt_width_mm']<=80 or type(g['loop_count']) is not int or not 3<=g['loop_count']<=8:raise ValueError('Некорректные параметры обработки')
    for k in ['pocket_width_mm','pocket_depth_mm','zipper_mm','fly_width_mm','guard_width_mm','loop_width_mm']:
        if not 5<=g[k]<=500:raise ValueError('Некорректный технологический размер: '+k)
    for key in [k for k in REQUIRED if k!='waist_knee' or 'lower_control_y_mm' not in g]:
        entry=profile['measurements'][key]
        if entry.get('unit')!='mm' or isinstance(entry['value'],bool) or not isinstance(entry['value'],(int,float)) or not math.isfinite(entry['value']) or entry['value']<=0:raise ValueError('Мерка должна быть положительной и заданной в мм: '+key)
    m=lambda k:profile['measurements'][k]['value']
    drop=g['waist_drop_mm'];waist=(m('garment_waist_girth')+g['waist_ease_mm'])/4;hip=(m('hips')+g['hip_ease_mm'])/4
    base=TrouserPanel(TrouserParameters(g['length_mm'],hip,g['knee_flat_mm'],g['hem_flat_mm'],m('seated_depth')-drop,(g['lower_control_y_mm'] if 'lower_control_y_mm' in g else m('waist_knee')-drop),m('waist_hip_length')-drop,waist,max(20,hip*.16)))
    front,back=_panel_pair(base) if _panel_pair else (base.contour(),base.contour())
    # Back waist balance: fixed waist seam length, shared side and lower inseam.
    raise_mm=g['back_raise_mm']
    if not 0<=raise_mm<waist/2:raise ValueError('Подъём задней талии вне диапазона')
    side=front.segments[0].end
    back=back.move_point(0,Point(side.x-math.sqrt(waist*waist-raise_mm*raise_mm),side.y-raise_mm))
    back=Contour(back.segments[:8]+(align_curve_end(back.segments[8],back.segments[9]),)+back.segments[9:])
    # Split front center line at the exact zipper seam length.
    center=front.segments[-1]
    if not g['zipper_mm']<center.length()-10:raise ValueError('Молния длиннее доступного среднего шва; уменьшите zipper_mm')
    lower,opening=center.split(1-g['zipper_mm']/center.length())
    front=Contour(front.segments[:-1]+(lower,opening))
    pieces=[];byrole={};sewing=[]
    garment_id=previous['id'] if previous else str(uuid.uuid4())
    oldroles={p['role']:p for p in previous['pieces']} if previous else {}
    def piece(role,name,seam,mirror=False,seam_names=None,internal=None):
        if mirror:seam=seam.reflected('y')
        cut=offset(seam,g['seam_allowance_mm'])
        bounds=seam.clo_points();xs=[p[0] for p in bounds];ys=[p[1] for p in bounds]
        grain=grain_guide(seam,0 if role.startswith(('front_','back_')) else None)
        notches=[{'segment':i,'t':.5,'kind':'mark'} for i in (seam_names or {}).get('side',[])[:2]]
        p={'id':oldroles.get(role,{}).get('id',str(uuid.uuid4())),'name':name,'role':role,'seam_contour':serialize(seam),'cut_contour':serialize(cut),'seams':seam_names or {'outline':list(range(len(seam.segments)))},'grainline':grain,'notches':notches,'internal_lines':internal or [],'allowance_mm':g['seam_allowance_mm'],'cut_quantity':1,'mirror_cut':mirror,'material':g.get('material',{}),'landmarks':{'p'+str(i):asdict(s.start) for i,s in enumerate(seam.segments)}}
        byrole[role]=len(pieces);pieces.append(p);return p
    front_seams={'waist':[0],'pocket_opening':[1],'side':[2,3,4],'hem':[5],'inseam':[6,7],'crotch':[8,9],'zipper':[10]}
    back_seams={'waist':[0],'pocket_opening':[1],'side':[2,3,4],'hem':[5],'inseam':[6,7],'crotch':[8,9]}
    for side_name,mirror in [('left',False),('right',True)]:
        piece('front_'+side_name,'Передняя половинка '+('левая' if not mirror else 'правая'),front,mirror,front_seams)
        piece('back_'+side_name,'Задняя половинка '+('левая' if not mirror else 'правая'),back,mirror,back_seams)
    def join(a,sa,b,sb,seam_type='стачной'):
        sewing.append({'id':str(uuid.uuid4()),'a':{'piece':byrole[a],'segments':sa},'b':{'piece':byrole[b],'segments':sb},'direction':'same','type':seam_type,'ease_mm':0,'tolerance_mm':1,'alignment':[0,.5,1]})
    for side_name,mirror in [('left',False),('right',True)]:
        join('front_'+side_name,[2,3,4],'back_'+side_name,[2,3,4]);join('front_'+side_name,[6,7],'back_'+side_name,[6,7])
        mouth=front.segments[1];a,b=mouth.start,mouth.end
        depth=g['pocket_depth_mm']
        if depth<b.y-a.y+30:raise ValueError('Глубина мешковины должна быть не меньше {:.1f} мм; заданное значение не изменено автоматически'.format(b.y-a.y+30))
        bag=Contour((mouth,Segment(b,Point(b.x-g['pocket_width_mm'],a.y+depth)),Segment(Point(b.x-g['pocket_width_mm'],a.y+depth),Point(a.x-g['pocket_width_mm'],a.y)),Segment(Point(a.x-g['pocket_width_mm'],a.y),a)))
        for half in ('front','back'):
            role='bag_'+half+'_'+side_name;piece(role,'Мешковина '+('передняя' if half=='front' else 'задняя')+' '+('левая' if side_name=='left' else 'правая'),bag,mirror)
            join(half+'_'+side_name,[1],role,[0])
        join('bag_front_'+side_name,[1,2,3],'bag_back_'+side_name,[1,2,3])
        shifted=Segment(Point(b.x-40,b.y),Point(a.x-40,a.y),Point(mouth.c2.x-40,mouth.c2.y) if mouth.c2 else None,Point(mouth.c1.x-40,mouth.c1.y) if mouth.c1 else None)
        facing=Contour((mouth,Segment(b,shifted.start),shifted,Segment(shifted.end,a)))
        piece('facing_'+side_name,'Подзор кармана '+('левый' if side_name=='left' else 'правый'),facing,mirror)
        join('facing_'+side_name,[0],'bag_back_'+side_name,[0],'настрочной')
    join('front_left',[8,9],'front_right',[8,9]);join('back_left',[8,9],'back_right',[8,9])
    belt_order=['front_left','back_left','back_right','front_right']
    for role in belt_order:
        seam=deserialize(pieces[byrole[role]]['seam_contour']);w=seam.segments[0].length()
        belt_piece=piece('belt_'+role,'Пояс — '+{'front_left':'передний левый','front_right':'передний правый','back_left':'задний левый','back_right':'задний правый'}[role],rectangle(w,2*g['belt_width_mm']),False,internal=[[[0,g['belt_width_mm']],[w,g['belt_width_mm']]]])
        belt_piece['grainline']=[[10,g['belt_width_mm']*.5],[w-10,g['belt_width_mm']*.5]]
        join(role,[0],'belt_'+role,[0])
    join('belt_front_left',[1],'belt_back_left',[1])
    join('belt_back_left',[3],'belt_back_right',[3])
    join('belt_back_right',[1],'belt_front_right',[1])
    piece('fly','Гульфик',rectangle(g['fly_width_mm'],g['zipper_mm']))
    piece('guard','Откосок',rectangle(g['guard_width_mm'],g['zipper_mm']))
    join('front_left',[10],'fly',[3]);join('front_right',[10],'guard',[3]);join('fly',[1],'guard',[1],'молния')
    for i in range(g['loop_count']):piece('loop_'+str(i+1),'Шлёвка '+str(i+1),rectangle(g['loop_width_mm']*2,g['belt_width_mm']+30))
    # Belt-loop bartacks join explicit internal stitch lines, not arbitrary outline edges.
    for i in range(g['loop_count']):
        loop=pieces[byrole['loop_'+str(i+1)]]
        position=(i+.5)*waist*4/g['loop_count'];section=min(3,int(position//waist))
        belt=pieces[byrole['belt_'+belt_order[section]]]
        x=max(g['loop_width_mm']+5,min(waist-g['loop_width_mm']-5,position-section*waist))
        for loop_y,belt_y in [(15,3),(g['belt_width_mm']+15,g['belt_width_mm']-3)]:
            li=len(loop['internal_lines']);bi=len(belt['internal_lines']);w=g['loop_width_mm']
            loop['internal_lines'].append([[w/2,loop_y],[w*1.5,loop_y]])
            belt['internal_lines'].append([[x-w/2,belt_y],[x+w/2,belt_y]])
            sewing.append({'id':str(uuid.uuid4()),'a':{'piece':byrole[loop['role']],'internal_line':li},'b':{'piece':byrole[belt['role']],'internal_line':bi},'direction':'same','type':'закрепка','ease_mm':0,'tolerance_mm':1,'alignment':[0,1]})
    # Locate midpoint alignment marks by arc length on every connected seam.
    for relation in sewing:
        for endpoint in (relation['a'],relation['b']):
            if 'segments' not in endpoint:continue
            p=pieces[endpoint['piece']];contour=deserialize(p['seam_contour'])
            lengths=[contour.segments[n].length() for n in endpoint['segments']];remaining=sum(lengths)/2
            for n,length in zip(endpoint['segments'],lengths):
                if remaining<=length:
                    segment=contour.segments[n];lo,hi=.000001,.999999
                    for _ in range(30):
                        t=(lo+hi)/2
                        if segment.split(t)[0].length()<remaining:lo=t
                        else:hi=t
                    p['notches'].append({'segment':n,'t':(lo+hi)/2,'kind':'alignment_mark','sewing_id':relation['id']})
                    break
                remaining-=length
    # Full semantic graph validation is on stitching contours, not cutting contours.
    specs=[{'type':'contour','name':p['name'],'segments':p['seam_contour']} for p in pieces]
    length_report=require_valid(specs,[{k:v for k,v in r.items() if k in ('a','b','ease_mm','tolerance_mm')} for r in sewing if 'segments' in r['a']])
    for connection in sewing:
        if 'internal_line' in connection['a']:
            lengths=[]
            for endpoint in (connection['a'],connection['b']):
                line=pieces[endpoint['piece']]['internal_lines'][endpoint['internal_line']]
                lengths.append(sum(math.hypot(b[0]-a[0],b[1]-a[1]) for a,b in zip(line,line[1:])))
            if abs(lengths[0]-lengths[1])>connection['tolerance_mm']:raise ValueError('Несовместимые линии закрепок')
    now=datetime.now(timezone.utc).isoformat()
    garment={'id':garment_id,'name':'Широкие брюки','category':'trousers','subcategory':'wide','method':METHOD,'method_spec':METHOD_SPEC,'version':previous['version']+1 if previous else 1,'profile_id':profile['id'],'measurement_snapshot':json.loads(json.dumps({k:profile['measurements'][k] for k in REQUIRED if k in profile['measurements']})),'parameters':g,'material':g.get('material',{'status':'not_assigned'}),'pieces':pieces,'sewing_graph':sewing,'construction_lines':{'waist_drop_mm':drop,'hip_y_mm':m('waist_hip_length')-drop,'knee_y_mm':(g['lower_control_y_mm'] if 'lower_control_y_mm' in g else m('waist_knee')-drop)},'operations':['Вырезать детали по внешнему контуру, перенести внутренние линии и метки','Собрать карманы в боковых швах по карте соединений','Стачать шаговые и средние швы; установить молнию, гульфик и откосок','Собрать пояс, сложить по линии сгиба, установить шлёвки и застёжку','Подогнуть низ; проверить сборку и выполнить примерку'],'history':(previous.get('history',[])+[{'version':previous['version'],'parameters':previous['parameters'],'at':now}]) if previous else [],'readiness':{'geometry':length_report['valid'],'construction':'experimental','production':'requires_review','3d':'not_assembled','fit_verified':False,'sewing_ready':False},'created_at':previous.get('created_at',now) if previous else now,'updated_at':now}
    garment['construction_revision']='wide_trousers_audit_2'
    garment['coordinate_system']='x_right_y_down_mm'
    garment['construction_lines']['rise_y_mm']=m('seated_depth')-drop
    garment['quality']={
        'geometry':{'passed':True,'seam_contours_checked':True,'cut_contours_checked':True},
        'construction':{'complete':all(role in byrole for role in ['front_left','front_right','back_left','back_right','fly','guard']),'seams_length_checked':True,'method_status':'experimental'},
        'production':{'allowances_defined':True,'grainlines_defined':all(p['grainline'] for p in pieces),'native_grainlines_configured':False,'alignment_marks_defined':True,'cut_quantities_defined':True,'requires_review':True},
        '3d':{'sewing_applied':False,'simulation_run':False,'fit_verified':False}}
    validate_garment(garment)
    patterns=[]
    for p in pieces:
        patterns.append({'type':'garment_piece','name':p['name'],'production':p,'segments':p['cut_contour'],'semantic':{'id':p['id'],'name':p['name'],'type':'garment_piece','role':p['role'],'garment_id':garment_id,'version':garment['version'],'relations':[]}})
    return {'garment':garment,'patterns':patterns,'garment_generated':True,'semantic_edit':True}

def validate_assembly_groups(groups,roles):
    """Explicit assemblies partition actual native pieces, never cutting copies."""
    if not isinstance(groups,list) or not 1<=len(groups)<=64:
        raise ValueError('Независимые сборки: нужен список из 1–64 непустых групп ролей')
    known=set(roles);seen=set()
    for group in groups:
        if not isinstance(group,list) or not 1<=len(group)<=64:
            raise ValueError('Каждая независимая сборка должна содержать 1–64 роли деталей')
        for role in group:
            if not isinstance(role,str) or role not in known:
                raise ValueError('Независимая сборка ссылается на отсутствующую роль детали')
            if role in seen:raise ValueError('Роль детали повторяется в независимых сборках: '+role)
            seen.add(role)
    if seen!=known:
        raise ValueError('Независимые сборки не покрывают все детали: '+', '.join(sorted(known-seen)))
    return [list(group) for group in groups]


def assembly_components(garment,adjacency=None):
    """Check declared graph components while retaining the legacy single-set gate."""
    pieces=garment['pieces'];roles=[p['role'] for p in pieces]
    if not pieces:raise ValueError('В комплекте отсутствуют детали')
    if adjacency is None:
        adjacency={i:set() for i in range(len(pieces))}
        for relation in garment['sewing_graph']:
            a,b=relation['a']['piece'],relation['b']['piece']
            if type(a) is not int or type(b) is not int or a not in adjacency or b not in adjacency:
                raise ValueError('Неверная связь в карте сборки')
            adjacency[a].add(b);adjacency[b].add(a)
    actual=[];remaining=set(adjacency)
    while remaining:
        reached=set();todo=[min(remaining)]
        while todo:
            index=todo.pop()
            if index in reached:continue
            reached.add(index);todo.extend(adjacency[index]-reached)
        actual.append(sorted(reached));remaining-=reached
    if 'assembly_groups' in garment:
        if garment.get('method')!='parametric_design_v1':
            raise ValueError('Независимые сборки разрешены только явно заданной параметрической схеме')
        groups=validate_assembly_groups(garment['assembly_groups'],roles)
        group_for={role:index for index,group in enumerate(groups) for role in group}
        for relation in garment['sewing_graph']:
            if group_for[roles[relation['a']['piece']]]!=group_for[roles[relation['b']['piece']]]:
                raise ValueError('Соединение пересекает границы независимых сборок; уберите фиктивный шов или исправьте группы')
        actual_sets={frozenset(roles[i] for i in group) for group in actual}
        for group in groups:
            if frozenset(group) not in actual_sets:
                raise ValueError('В независимой сборке есть детали без связи друг с другом: '+', '.join(group))
        # Preserve declaration order but report real native piece order within it.
        actual=[[i for i,role in enumerate(roles) if role in group] for group in groups]
    elif len(actual)!=1:
        message='В комплекте есть детали без связи с изделием'
        if garment.get('method')=='parametric_design_v1':
            message+='; для намеренно независимых сборок явно задайте assembly_groups с полным составом каждой группы'
        raise ValueError(message)
    return [{'index':number+1,'piece_indices':indices,'piece_ids':[pieces[i]['id'] for i in indices],
             'roles':[roles[i] for i in indices],'piece_names':[pieces[i]['name'] for i in indices],
             'relation_ids':[r['id'] for r in garment['sewing_graph'] if r['a']['piece'] in indices]}
            for number,indices in enumerate(actual)]


def validate_garment(garment):
    pieces=garment['pieces'];roles=[p['role'] for p in pieces];n=garment['parameters'].get('loop_count',0)
    expected={'front_left','front_right','back_left','back_right','fly','guard'}
    expected.update('belt_'+r for r in ('front_left','front_right','back_left','back_right'))
    expected.update('bag_'+half+'_'+side for half in ('front','back') for side in ('left','right'))
    expected.update('facing_'+side for side in ('left','right'));expected.update('loop_'+str(i+1) for i in range(n))
    if garment['method']!=METHOD or 'development' in garment['parameters']:expected=set(garment['method_spec']['required_roles'])
    if len(set(roles))!=len(roles) or set(roles)!=expected:raise ValueError('Комплект не соответствует выбранной конструкции')
    adjacency={i:set() for i in range(len(pieces))}
    for relation in garment['sewing_graph']:
        a,b=relation['a']['piece'],relation['b']['piece']
        if type(a) is not int or type(b) is not int or a not in adjacency or b not in adjacency:raise ValueError('Неверная связь в карте сборки')
        adjacency[a].add(b);adjacency[b].add(a)
        if relation['direction'] not in ('same','reverse'):raise ValueError('Не определено направление шва')
        if 'internal_line' in relation['a']:
            lengths=[]
            for endpoint in (relation['a'],relation['b']):
                line=pieces[endpoint['piece']]['internal_lines'][endpoint['internal_line']]
                lengths.append(sum(math.hypot(v[0]-u[0],v[1]-u[1]) for u,v in zip(line,line[1:])))
            if abs(lengths[0]-lengths[1]-relation['ease_mm'])>relation['tolerance_mm']:raise ValueError('Несогласованные закрепки')
    components=assembly_components(garment,adjacency)
    return {'valid':True,'connected_parts':len(pieces),'component_count':len(components),'components':components}

CONSTRUCTION_METHODS={METHOD:construct}
def register_method(method_id,builder):
    if method_id in CONSTRUCTION_METHODS or not callable(builder):raise ValueError('Неверная регистрация методики')
    CONSTRUCTION_METHODS[method_id]=builder

if __name__=='__main__':
    import sys
    if hasattr(sys.stdin,'reconfigure'):sys.stdin.reconfigure(encoding='utf-8')
    try:
        request=json.load(sys.stdin);method=request.get('method',METHOD)
        if request.get('event_context'):
            from operation_events import begin
            begin(request,worker=True)
        if request.get('operation')=='qa':
            from engineering.validation import validate
            from engineering.report import markdown
            result=validate(request['garment']);result={'qa_report':result,'qa_markdown':markdown(result)}
        else:
            from engineering.pipeline import build as engineering_build
            result=engineering_build(method,request['profile'],request['parameters'],request.get('previous'))
        print(json.dumps(result,ensure_ascii=True))
    except Exception as error:
        message={'Required: 0 < hip level < rise < knee level < length <= 3000 mm':'Уровни должны идти в порядке: талия, бёдра, сидение, колено, низ; длина не больше 3000 мм','Panel widths: 10..1000 mm; panel ease: 0..200 mm':'Ширины панелей должны быть 10–1000 мм, прибавки панели — 0–200 мм','Self-intersecting contour':'Самопересечение контура','Degenerate contour':'Вырожденный контур'}.get(str(error),str(error))
        print(json.dumps({'error':message},ensure_ascii=True));sys.exit(1)
