"""Experimental construction families. Each entry advertises its limited supported variant."""
import json, math, uuid
from datetime import datetime, timezone
from dataclasses import asdict
from contour_engine import Point,Segment,Contour,SegmentChain
from garment_engine import offset,serialize,deserialize,construct as trousers,validate_garment
from geometry_validation import require_valid

CATALOG={}
def entry(key,label,category,required,params,variant):
    CATALOG[key]={'id':key,'name':label,'category':category,'required_measurements':required,'required_parameters':params,'variant':variant,'status':'experimental','fit_verified':False}
UPPER=['chest','shoulder_width','armhole_depth','neck_base','biceps']
UP=['length_mm','chest_ease_mm','hem_circumference_mm','sleeve_length_mm','cuff_circumference_mm']
for key,label,category,variant in [
 ('tshirt_drop_v1','Футболка','tshirt','Свободная футболка со спущенным плечом'),
 ('top_sleeveless_v1','Майка / топ','top','Свободный топ со спущенной линией плеча'),
 ('shirt_stand_v1','Рубашка / блузка','shirt','Свободная рубашка с воротником-стойкой и открытой планкой'),
 ('hoodie_drop_v1','Худи','hoodie','Свободное худи с двухдетальным капюшоном'),
 ('sweatshirt_drop_v1','Свитшот','sweatshirt','Свободный свитшот без отрицательных прибавок'),
 ('jacket_unstructured_v1','Жакет','blazer','Неструктурированный жакет без лацканов и подкладки'),
 ('jacket_stand_v1','Куртка','jacket','Свободная куртка со стойкой без утеплителя и подкладки'),
 ('coat_wrap_v1','Пальто','coat','Свободное пальто со стойкой и съёмным поясом, без подкладки; запах не моделируется'),
 ('dress_shift_v1','Платье','dress','Свободное платье без вытачек со спущенным плечом')]:
    entry(key,label,category,UPPER+(['head_height','head_length'] if category=='hoodie' else [])+(['hips','back_waist_length','waist_hip_length'] if category in ('dress','coat') else []),[p for p in UP if category!='top' or p not in ('sleeve_length_mm','cuff_circumference_mm')],variant)
entry('skirt_aline_v1','Юбка','skirt',['waist','hips','waist_hip_length'],['length_mm','waist_ease_mm','hem_circumference_mm'],'Двухпанельная юбка А-силуэта с поясом и боковой молнией')
LOWER=['garment_waist_girth','hips','waist_hip_length','seated_depth','waist_knee']
LP=['length_mm','waist_drop_mm','hip_ease_mm','waist_ease_mm','knee_flat_mm','hem_flat_mm']
entry('jeans_loose_v1','Джинсы','jeans',LOWER,LP,'Свободные брюки из денима с карманами в шве и накладными задними карманами; не классические пять карманов')
entry('shorts_loose_v1','Шорты','shorts',[k for k in LOWER if k!='waist_knee'],[p for p in LP if p!='knee_flat_mm'],'Свободные шорты с поясом, карманами в шве и молнией')
entry('boxers_loose_v1','Нижнее бельё','underwear',[k for k in LOWER if k!='waist_knee'],[p for p in LP if p!='knee_flat_mm'],'Свободные семейные трусы с застёжкой; не облегающее бельё и не бюстгальтер')
entry('headwear_gore_v1','Головной убор','headwear',['head'],['height_mm','head_ease_mm'],'Шестиклинная шапка с околышем без козырька')
CATALOG['headwear_gore_v1']['implementation_version']='1.1.0'
entry('jumpsuit_work_v1','Комбинезон','jumpsuit',list(dict.fromkeys(LOWER+UPPER)),LP+['torso_length_mm','chest_ease_mm','sleeve_length_mm','cuff_circumference_mm'],'Свободный рабочий комбинезон с застёжкой; баланс длины корпуса требует примерки')

def rect(w,h):return Contour.polygon([(0,0),(w,0),(w,h),(0,h)])
def reverse(s):return Segment(s.end,s.start,s.c2,s.c1)
def number(v,key):
    if isinstance(v,bool) or not isinstance(v,(int,float)) or not math.isfinite(v):raise ValueError('Некорректное число: '+key)
    return v

class Kit:
    def __init__(self,method,profile,g,previous,metadata=None):
        self.method,self.profile,self.g,self.previous=method,profile,g,previous;self.pieces=[];self.graph=[];self.roles={};self.metadata=metadata
        self.id=previous['id'] if previous else str(uuid.uuid4());self.version=previous['version']+1 if previous else 1
        self.old={p['role']:p for p in previous['pieces']} if previous else {}
    def add(self,role,name,c,mirror=False,internal=None):
        if mirror:c=c.reflected('y')
        pts=c.clo_points();xs=[p[0] for p in pts];ys=[p[1] for p in pts]
        a=self.g['seam_allowance_mm'];cut=offset(c,a)
        p={'id':self.old.get(role,{}).get('id',str(uuid.uuid4())),'name':name,'role':role,'seam_contour':serialize(c),'cut_contour':serialize(cut),'seams':{'outline':list(range(len(c.segments)))},'grainline':[[sum(xs)/len(xs),min(ys)+(max(ys)-min(ys))*.2],[sum(xs)/len(xs),min(ys)+(max(ys)-min(ys))*.8]],'notches':[],'internal_lines':internal or [],'allowance_mm':a,'cut_quantity':1,'mirror_cut':mirror,'landmarks':{'p'+str(i):asdict(s.start) for i,s in enumerate(c.segments)},'material':self.g.get('material',{})}
        self.roles[role]=len(self.pieces);self.pieces.append(p);return p
    def join(self,a,sa,b,sb,kind='стачной',direction='same',ease=0):
        self.graph.append({'id':str(uuid.uuid4()),'a':{'piece':self.roles[a],'segments':sa},'b':{'piece':self.roles[b],'segments':sb},'direction':direction,'type':kind,'ease_mm':ease,'tolerance_mm':1,'alignment':[0,.5,1]})
    def attach(self,a,b,length=30,kind='настрочной'):
        source=self.pieces[self.roles[a]];target=self.pieces[self.roles[b]]
        if length is None:
            pts=deserialize(source['seam_contour']).clo_points();w=max(p[0] for p in pts)-min(p[0] for p in pts);h=max(p[1] for p in pts)-min(p[1] for p in pts)
            host=deserialize(target['seam_contour']).clo_points();ys=[p[1] for p in host];y=min(ys)+(max(ys)-min(ys))*.45
            def span(level):
                xs=[]
                for p,q in zip(host,host[1:]+host[:1]):
                    if (p[1]<=level<q[1]) or (q[1]<=level<p[1]):xs.append(p[0]+(level-p[1])*(q[0]-p[0])/(q[1]-p[1]))
                if len(xs)<2:raise ValueError('Карман выходит за пределы детали')
                return min(xs),max(xs)
            bounds=[span(y),span(y+h)];left=max(t[0] for t in bounds)+15;right=min(t[1] for t in bounds)-15
            if y+h>max(ys)-15 or w>right-left:raise ValueError('Накладной карман не помещается: уменьшите его размеры')
            lines=[[[w,0],[w,h],[0,h],[0,0]],[[left+w,y],[left+w,y+h],[left,y+h],[left,y]]]
        else:
            lines=[]
            for p in (source,target):
                pts=deserialize(p['seam_contour']).clo_points();x=(min(v[0] for v in pts)+max(v[0] for v in pts))/2-length/2;y=(min(v[1] for v in pts)+max(v[1] for v in pts))/2
                lines.append([[x,y],[x+length,y]])
        endpoints=[]
        for role,line in zip((a,b),lines):
            p=self.pieces[self.roles[role]];idx=len(p['internal_lines']);p['internal_lines'].append(line);endpoints.append({'piece':self.roles[role],'internal_line':idx})
        self.graph.append({'id':str(uuid.uuid4()),'a':endpoints[0],'b':endpoints[1],'direction':'same','type':kind,'ease_mm':0,'tolerance_mm':1,'alignment':[0,1]})
    def finish(self,assembly_groups=None):
        specs=[{'type':'contour','name':p['name'],'segments':p['seam_contour']} for p in self.pieces]
        require_valid(specs,[{k:v for k,v in r.items() if k in ('a','b','ease_mm','tolerance_mm')} for r in self.graph if 'segments' in r['a'] and 'segments' in r['b']])
        for relation in self.graph:
            alignment=relation.get('alignment',[0,.5,1])
            if not isinstance(alignment,list) or not 2<=len(alignment)<=16 or any(type(f) not in (int,float) or not math.isfinite(f) or not 0<=f<=1 for f in alignment) or alignment!=sorted(set(alignment)) or alignment[0]!=0 or alignment[-1]!=1:
                raise ValueError('Некорректные контрольные позиции шва')
            for side,endpoint in enumerate((relation['a'],relation['b'])):
                if 'segments' not in endpoint:continue
                p=self.pieces[endpoint['piece']];c=deserialize(p['seam_contour']);ids=endpoint['segments']
                chain=SegmentChain(tuple(c.segments[n] for n in ids))
                legacy_iterations=25 if alignment==[0,.5,1] else None
                length=sum(s.length() for s in chain.segments) if legacy_iterations else chain.length()
                for fraction in alignment[1:-1]:
                    oriented=1-fraction if side==1 and relation['direction']=='reverse' else fraction
                    index,t,_=chain.position(length*oriented,_legacy_iterations=legacy_iterations)
                    if not any(mark.get('sewing_id')==relation['id'] and mark['segment']==ids[index] and abs(mark['t']-t)<1e-9 for mark in p['notches']):
                        p['notches'].append({'segment':ids[index],'t':t,'kind':'alignment_mark','sewing_id':relation['id']})
        meta=dict(self.metadata) if self.metadata else dict(CATALOG[self.method],required_roles=expected_roles(self.method,self.g));now=datetime.now(timezone.utc).isoformat()
        garment={'id':self.id,'name':meta['name'],'category':meta['category'],'subcategory':meta['variant'],'method':self.method,'method_spec':meta,'version':self.version,'profile_id':self.profile['id'],'measurement_snapshot':json.loads(json.dumps({k:self.profile['measurements'][k] for k in meta['required_measurements']})),'parameters':self.g,'material':self.g.get('material',{'status':'not_assigned'}),'pieces':self.pieces,'sewing_graph':self.graph,'construction_lines':{},'operations':['Перенести линии стачивания и метки с чертежей','Собрать изделие по карте соединений','Проверить застёжки, долевую и обработку срезов','Выполнить примерку; скорректировать баланс и обработку до раскроя основного материала'],'history':(self.previous.get('history',[])+[{'version':self.previous['version'],'parameters':self.previous['parameters'],'at':now}]) if self.previous else [],'readiness':{'geometry':True,'construction':'experimental','production':'requires_review','3d':'not_assembled','fit_verified':False,'sewing_ready':False},'quality':{'geometry':{'passed':True},'construction':{'seams_length_checked':True,'method_status':'experimental'},'production':{'requires_review':True},'3d':{'simulation_run':False}},'created_at':self.previous.get('created_at',now) if self.previous else now,'updated_at':now}
        if assembly_groups is not None:garment['assembly_groups']=[list(group) for group in assembly_groups]
        validate_garment(garment)
        patterns=[{'type':'garment_piece','name':p['name'],'production':p,'segments':p['cut_contour'],'semantic':{'id':p['id'],'name':p['name'],'type':'garment_piece','role':p['role'],'garment_id':self.id,'version':self.version,'relations':[]}} for p in self.pieces]
        return {'garment':garment,'patterns':patterns,'garment_generated':True,'semantic_edit':True}

def prepare(method,profile,parameters,previous):
    meta=CATALOG[method];m=profile.get('measurements',{})
    check={'method':method,'missing_measurements':[k for k in meta['required_measurements'] if m.get(k,{}).get('value') is None],'unverified_measurements':[k for k in meta['required_measurements'] if m.get(k,{}).get('value') is not None and m[k].get('status')!='verified'],'missing_parameters':[k for k in meta['required_parameters'] if k not in parameters]}
    if any(check[k] for k in ('missing_measurements','unverified_measurements','missing_parameters')):return None,{'needs_input':check}
    allowed=set(meta['required_parameters'])|{'seam_allowance_mm','neck_width_mm','front_neck_depth_mm','back_neck_depth_mm','shoulder_drop_mm','binding_width_mm','belt_width_mm','hood_height_mm','hood_depth_mm','pocket_width_mm','pocket_depth_mm','zipper_mm','collar_height_mm','material','belt_length_mm','fly_width_mm','guard_width_mm','loop_width_mm','loop_count','back_raise_mm','knee_flat_mm'}
    if set(parameters)-allowed:raise ValueError('Неизвестный параметр методики: '+', '.join(set(parameters)-allowed))
    for k,v in parameters.items():
        if k!='material' and (number(v,k)<0 or v>10000):raise ValueError('Размер вне диапазона: '+k)
    for k in meta['required_measurements']:
        e=m[k]
        if e.get('unit')!='mm' or number(e['value'],k)<=0:raise ValueError('Мерка должна быть в миллиметрах: '+k)
    defaults={'seam_allowance_mm':10}
    category=meta['category']
    if category in ('tshirt','top','shirt','hoodie','sweatshirt','blazer','jacket','coat','dress','jumpsuit'):
        defaults.update(neck_width_mm=160,front_neck_depth_mm=80,back_neck_depth_mm=25,shoulder_drop_mm=30,binding_width_mm=20,collar_height_mm=30)
    if category=='hoodie':defaults.update(hood_height_mm=350,hood_depth_mm=300)
    if category in ('blazer','jacket','coat','jeans','shorts','underwear','jumpsuit'):defaults.update(pocket_width_mm=150,pocket_depth_mm=200)
    if category in ('jeans','shorts','underwear','jumpsuit'):defaults['pocket_depth_mm']=max(240,m['waist_hip_length']['value']-parameters['waist_drop_mm']+30)
    if category in ('skirt','jeans','shorts','underwear','jumpsuit'):defaults.update(belt_width_mm=40,zipper_mm=140)
    if category in ('jeans','shorts','underwear','jumpsuit'):defaults.update(fly_width_mm=45,guard_width_mm=40,loop_width_mm=12,loop_count=5,back_raise_mm=20)
    optional={'material'}|({'belt_length_mm'} if category=='coat' else set())|({'knee_flat_mm'} if category in ('shorts','underwear') else set())
    unsupported=set(parameters)-set(defaults)-set(meta['required_parameters'])-optional
    if unsupported:raise ValueError('Параметр не поддерживается этой конструкцией: '+', '.join(unsupported))
    g={**defaults,**parameters}
    if not 3<=g['seam_allowance_mm']<=25:raise ValueError('Припуск должен быть 3–25 мм')
    return Kit(method,profile,g,previous),None

def body(chest,hem,length,nw,depth,drop,armhole):
    if not 0<depth<armhole<length or not 0<drop<armhole or not 20<nw<chest/2:raise ValueError('Некорректны горловина, плечо или глубина проймы')
    pts=[(-nw/2,0),(-chest/4,drop),(-chest/4,armhole),(-hem/4,length),(hem/4,length),(chest/4,armhole),(chest/4,drop),(nw/2,0)]
    c=Contour.polygon(pts);a,b=c.segments[-1].start,c.segments[-1].end
    return Contour(c.segments[:-1]+(Segment(a,b,Point(a.x,depth*4/3),Point(b.x,depth*4/3)),))

def upper(kit):
    g=kit.g;m=lambda k:kit.profile['measurements'][k]['value'];category=CATALOG[kit.method]['category']
    chest=m('chest')+g['chest_ease_mm'];hem=g['hem_circumference_mm'];length=g['length_mm'];armhole=m('armhole_depth')
    if chest/2<m('shoulder_width') or chest/2>m('shoulder_width')+300:raise ValueError('Методика требует спущенного плеча в пределах 300 мм')
    if category in ('coat','dress'):
        hip_y=m('back_waist_length')+m('waist_hip_length')
        circumference=chest+(hem-chest)*max(0,min(1,(hip_y-armhole)/(length-armhole)))
        if circumference<m('hips'):raise ValueError('Объёма по бёдрам недостаточно для свободной конструкции')
    f=body(chest,hem,length,g['neck_width_mm'],g['front_neck_depth_mm'],g['shoulder_drop_mm'],armhole)
    b=body(chest,hem,length,g['neck_width_mm'],g['back_neck_depth_mm'],g['shoulder_drop_mm'],armhole)
    open_front=category in ('shirt','blazer','jacket','coat')
    if open_front:
        left_half,right_half=f.segments[7].split()
        # left front: center neckline -> left neckline -> shoulder -> side -> hem center -> closure
        left=Contour((right_half,)+f.segments[:3]+(Segment(f.segments[3].start,Point(0,length)),Segment(Point(0,length),right_half.start)))
        kit.add('front_left','Левая полочка',left);kit.add('front_right','Правая полочка',left,True);kit.add('back','Спинка',b)
        for role in ('front_left','front_right'):
            kit.add('placket_'+role,'Планка '+('левая' if role.endswith('left') else 'правая'),rect(length-g['front_neck_depth_mm'],40))
            kit.join(role,[5],'placket_'+role,[0],direction='reverse')
        if category!='coat':kit.join('placket_front_left',[2],'placket_front_right',[2],'молния' if category=='jacket' else 'пуговицы')
        kit.join('front_left',[1],'back',[0]);kit.join('front_right',[1],'back',[6])
        kit.join('front_left',[3],'back',[2]);kit.join('front_right',[3],'back',[4])
        openings=[('front_left',[2]),('front_right',[2])];backholes=[('back',[1]),('back',[5])]
        necks=[('front_left',[0]),('back',[7]),('front_right',[0])]
    else:
        kit.add('front','Перед',f);kit.add('back','Спинка',b)
        for x,y in ((0,0),(6,6),(2,2),(4,4)):kit.join('front',[x],'back',[y])
        openings=[('front',[1]),('front',[5])];backholes=[('back',[1]),('back',[5])];necks=[('front',[7]),('back',[7])]
    arm=armhole-g['shoulder_drop_mm']
    if category=='top':
        for i,(front,backhole) in enumerate(zip(openings,backholes)):
            band=Contour.polygon([(0,0),(arm,0),(2*arm,0),(2*arm,2*g['binding_width_mm']),(0,2*g['binding_width_mm'])]);role='arm_binding_'+str(i)
            kit.add(role,'Обтачка проймы '+str(i+1),band);kit.join(front[0],front[1],role,[0],direction='reverse' if i==0 else 'same');kit.join(backhole[0],backhole[1],role,[1],direction='same' if i==0 else 'reverse');kit.join(role,[2],role,[4])
    else:
        if 2*arm<m('biceps'):raise ValueError('Пройма не обеспечивает объём плеча для выбранного спущенного рукава')
        cuff=g['cuff_circumference_mm'];sl=g['sleeve_length_mm']
        if not 20<=cuff<=2*arm or not 40<=sl<=1200:raise ValueError('Рукав или низ рукава вне диапазона')
        taper=(2*arm-cuff)/2
        sleeve=Contour.polygon([(0,0),(arm,0),(2*arm,0),(2*arm-taper,sl),(taper,sl)])
        for i,(front,backhole) in enumerate(zip(openings,backholes)):
            role='sleeve_'+str(i);kit.add(role,'Рукав '+str(i+1),sleeve,bool(i));kit.join(front[0],front[1],role,[0],direction='reverse' if i==0 else 'same');kit.join(backhole[0],backhole[1],role,[1],direction='same' if i==0 else 'reverse');kit.join(role,[2],role,[4],direction='reverse')
            if category in ('hoodie','sweatshirt','jacket'):
                kit.add('cuff_'+str(i),'Манжета '+str(i+1),rect(cuff,80));kit.join(role,[3],'cuff_'+str(i),[0]);kit.join('cuff_'+str(i),[1],'cuff_'+str(i),[3])
    neck_lengths=[sum(deserialize(kit.pieces[kit.roles[r]]['seam_contour']).segments[i].length() for i in indices) for r,indices in necks]
    if sum(neck_lengths)<m('neck_base'):raise ValueError('Горловина меньше обхвата основания шеи')
    if category=='hoodie':
        if g['hood_height_mm']<m('head_height')+20 or g['hood_depth_mm']<m('head_length')+20:raise ValueError('Недостаточные размеры капюшона относительно мерок головы')
        # Two-part hood with exact, separately split front/back neckline edges.
        nf,nb=neck_lengths;full_front=kit.pieces[kit.roles['front']];full_back=kit.pieces[kit.roles['back']]
        for p in (full_front,full_back):
            c=deserialize(p['seam_contour']);a,z=c.segments[-1].split();p['seam_contour']=serialize(Contour(c.segments[:-1]+(a,z)));p['cut_contour']=serialize(offset(deserialize(p['seam_contour']),g['seam_allowance_mm']))
        hood=Contour.polygon([(0,0),(nf/2,0),((nf+nb)/2,0),(g['hood_depth_mm'],g['hood_height_mm']),(0,g['hood_height_mm'])])
        for i in range(2):kit.add('hood_'+str(i),'Половинка капюшона '+str(i+1),hood,bool(i));kit.join('front',[7+i],'hood_'+str(i),[0]);kit.join('back',[7+i],'hood_'+str(i),[1])
        kit.join('hood_0',[3,4],'hood_1',[3,4])
    else:
        total=sum(neck_lengths);points=[(0,0)];x=0
        for width in neck_lengths:x+=width;points.append((x,0))
        height=2*(g['collar_height_mm'] if open_front else g['binding_width_mm']);points.extend([(total,height),(0,height)])
        kit.add('neck_finish','Воротник-стойка' if open_front else 'Бейка горловины',Contour.polygon(points))
        for i,(role,indices) in enumerate(necks):kit.join(role,indices,'neck_finish',[i])
        if not open_front:kit.join('neck_finish',[len(necks)],'neck_finish',[len(necks)+2])
    if category in ('blazer','jacket','coat'):
        for side in ('left','right'):
            r='patch_'+side;kit.add(r,'Накладной карман '+('левый' if side=='left' else 'правый'),rect(g['pocket_width_mm'],g['pocket_depth_mm']));kit.attach(r,'front_'+side,length=None)
    if category=='coat':
        belt_length=g.get('belt_length_mm',max(chest,hem)*1.6)
        kit.add('tie_belt','Завязывающийся пояс',rect(belt_length,80));kit.attach('tie_belt','back',kind='размещение свободного аксессуара, не стачивание')
    return kit.finish()

def skirt(kit):
    g=kit.g;m=lambda k:kit.profile['measurements'][k]['value'];top=(m('waist')+g['waist_ease_mm'])/2;bottom=g['hem_circumference_mm']/2;h=g['length_mm']
    if not h>m('waist_hip_length') or top+(bottom-top)*m('waist_hip_length')/h<m('hips')/2:raise ValueError('Недостаточная ширина юбки по бёдрам')
    c=Contour.polygon([(-top/2,0),(top/2,0),(bottom/2,h),(-bottom/2,h)])
    # Split one side for a real closure opening.
    z=g['zipper_mm'];a,b=c.segments[1].split(z/c.segments[1].length());c=Contour((c.segments[0],a,b,c.segments[2],c.segments[3]))
    kit.add('front','Переднее полотнище',c);kit.add('back','Заднее полотнище',c)
    kit.join('front',[1],'back',[1],'молния');kit.join('front',[2],'back',[2]);kit.join('front',[4],'back',[4])
    for r in ('front','back'):kit.add('belt_'+r,'Пояс '+('передний' if r=='front' else 'задний'),rect(top,2*g['belt_width_mm']));kit.join(r,[0],'belt_'+r,[0])
    kit.join('belt_front',[3],'belt_back',[3]);kit.join('belt_front',[1],'belt_back',[1],'застёжка')
    return kit.finish()

def headwear(kit):
    g=kit.g;w=(kit.profile['measurements']['head']['value']+g['head_ease_mm'])/6;h=g['height_mm']
    # Local +Y runs down. The crown must lie above the headband baseline.
    c=Contour((Segment(Point(-w/2,0),Point(w/2,0)),Segment(Point(w/2,0),Point(0,-h),Point(w/2,-h*.6),Point(w*.25,-h)),Segment(Point(0,-h),Point(-w/2,0),Point(-w*.25,-h),Point(-w/2,-h*.6))))
    for i in range(6):kit.add('gore_'+str(i),'Клин '+str(i+1),c)
    for i in range(6):kit.join('gore_'+str(i),[1],'gore_'+str((i+1)%6),[2])
    pts=[(i*w,0) for i in range(7)]+[(6*w,50),(0,50)];band=kit.add('band','Околыш',Contour.polygon(pts));band['grainline']=[[10,25],[6*w-10,25]]
    for i in range(6):kit.join('gore_'+str(i),[0],'band',[i])
    kit.join('band',[6],'band',[8]);return kit.finish()

def build(method,profile,parameters,previous=None):
    kit,error=prepare(method,profile,parameters,previous)
    if error:return error
    if method=='skirt_aline_v1':return skirt(kit)
    if method=='headwear_gore_v1':return headwear(kit)
    if CATALOG[method]['category'] in ('jeans','shorts','underwear','jumpsuit'):return lower(kit)
    return upper(kit)
CATEGORY_METHODS={k:(lambda profile,parameters,previous=None,key=k:build(key,profile,parameters,previous)) for k in CATALOG}


def adopt(kit,result,excluded=(),prefix=''):
    pieces=result['garment']['pieces'];mapping={}
    for i,p in enumerate(pieces):
        if any(p['role'].startswith(x) for x in excluded):continue
        role=prefix+p['role'];mapping[i]=kit.roles.get(role,len(kit.pieces))
        adopted=kit.add(role,p['name'],deserialize(p['seam_contour']),internal=json.loads(json.dumps(p['internal_lines'])))
        adopted['mirror_cut']=p['mirror_cut']
    for relation in result['garment']['sewing_graph']:
        if relation['a']['piece'] not in mapping or relation['b']['piece'] not in mapping:continue
        r=json.loads(json.dumps(relation));r['id']=str(uuid.uuid4());r['a']['piece']=mapping[r['a']['piece']];r['b']['piece']=mapping[r['b']['piece']];kit.graph.append(r)

def lower(kit):
    g=kit.g;category=CATALOG[kit.method]['category'];m=lambda k:kit.profile['measurements'][k]['value']
    core={k:g[k] for k in LP if k in g}
    for k in ('seam_allowance_mm','belt_width_mm','pocket_width_mm','pocket_depth_mm','zipper_mm','fly_width_mm','guard_width_mm','loop_count','loop_width_mm','back_raise_mm','material'):
        if k in g:core[k]=g[k]
    if category in ('shorts','underwear'):
        rise=m('seated_depth')-g['waist_drop_mm']
        if g['length_mm']<rise+30:raise ValueError('Эта свободная конструкция требует длину минимум на 30 мм ниже уровня сидения')
        core['lower_control_y_mm']=(rise+g['length_mm'])/2
        core['knee_flat_mm']=((m('hips')+g['hip_ease_mm'])/4+g['hem_flat_mm'])/2
        kit.g['knee_flat_mm']=core['knee_flat_mm']
    result=trousers(kit.profile,core)
    if result.get('needs_input'):return result
    excluded=('bag_','facing_','loop_') if category=='underwear' else ('belt_','loop_') if category=='jumpsuit' else ()
    adopt(kit,result,excluded)
    if category=='underwear':
        for r in kit.graph:
            if r['type']=='молния':r['type']='пуговицы'
        for side in ('left','right'):kit.join('front_'+side,[1],'back_'+side,[1])
        kit.join('belt_front_left',[3],'belt_front_right',[3],'пуговицы')
    if category=='jeans':
        for side in ('left','right'):
            role='rear_patch_'+side;kit.add(role,'Задний накладной карман '+('левый' if side=='left' else 'правый'),rect(g['pocket_width_mm'],g['pocket_depth_mm']));kit.attach(role,'back_'+side,length=None)
    if category=='jumpsuit':
        waist=m('garment_waist_girth')+g['waist_ease_mm']
        upperparams={'length_mm':g['torso_length_mm'],'chest_ease_mm':g['chest_ease_mm'],'hem_circumference_mm':waist,'sleeve_length_mm':g['sleeve_length_mm'],'cuff_circumference_mm':g['cuff_circumference_mm'],'seam_allowance_mm':g['seam_allowance_mm']}
        upperparams.update({k:g[k] for k in ('neck_width_mm','front_neck_depth_mm','back_neck_depth_mm','shoulder_drop_mm','binding_width_mm','collar_height_mm') if k in g})
        temp,_=prepare('shirt_stand_v1',kit.profile,upperparams,None);top=upper(temp)
        back=next(p for p in top['garment']['pieces'] if p['role']=='back');c=deserialize(back['seam_contour']);a,b=c.segments[3].split();back['seam_contour']=serialize(Contour(c.segments[:3]+(a,b)+c.segments[4:]))
        for r in top['garment']['sewing_graph']:
            for endpoint in (r['a'],r['b']):
                if top['garment']['pieces'][endpoint['piece']]['role']=='back' and 'segments' in endpoint:endpoint['segments']=[i+1 if i>=4 else i for i in endpoint['segments']]
        adopt(kit,top,prefix='upper_')
        kit.join('front_left',[0],'upper_front_left',[4],direction='reverse');kit.join('front_right',[0],'upper_front_right',[4],direction='reverse')
        kit.join('back_left',[0],'upper_back',[3],direction='reverse');kit.join('back_right',[0],'upper_back',[4])
    return kit.finish()



def expected_roles(method,g):
    category=CATALOG[method]['category']
    if category=='skirt':return ['front','back','belt_front','belt_back']
    if category=='headwear':return ['gore_'+str(i) for i in range(6)]+['band']
    if category in ('jeans','shorts','underwear','jumpsuit'):
        roles=['front_left','back_left','front_right','back_right','fly','guard']
        if category!='underwear':roles+=['bag_'+half+'_'+side for side in ('left','right') for half in ('front','back')]+['facing_left','facing_right']
        if category!='jumpsuit':roles+=['belt_front_left','belt_back_left','belt_front_right','belt_back_right']
        if category in ('jeans','shorts'):roles+=['loop_'+str(i+1) for i in range(g.get('loop_count',5))]
        if category=='jeans':roles+=['rear_patch_left','rear_patch_right']
        if category=='jumpsuit':roles+=['upper_'+r for r in ['front_left','front_right','back','placket_front_left','placket_front_right','sleeve_0','sleeve_1','neck_finish']]
        return roles
    opened=category in ('shirt','blazer','jacket','coat')
    roles=['front_left','front_right','back','placket_front_left','placket_front_right'] if opened else ['front','back']
    roles+=['arm_binding_0','arm_binding_1'] if category=='top' else ['sleeve_0','sleeve_1']
    if category in ('hoodie','sweatshirt','jacket'):roles+=['cuff_0','cuff_1']
    roles+=['hood_0','hood_1'] if category=='hoodie' else ['neck_finish']
    if category in ('blazer','jacket','coat'):roles+=['patch_left','patch_right']
    if category=='coat':roles+=['tie_belt']
    return roles
