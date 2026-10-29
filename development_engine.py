"""Validated compositional prototypes. No downloaded or AI-generated code.

Existing pattern blocks remain the foundation. Optional feature operations are
mathematical, versioned and replayable by independent QA and undo.
"""
import copy
import math
import uuid
from category_constructors import Kit, adopt, rect
from garment_engine import deserialize
from utility_constructors import pocket_placement, add_cargo


def checked(design):
    if not isinstance(design,dict) or set(design)-{'version','features','sources'} or design.get('version')!=1:
        raise ValueError('Неизвестный формат опытной конструкции')
    features=design.get('features')
    if not isinstance(features,list) or not 1<=len(features)<=8:raise ValueError('Нужно 1–8 проверяемых изменений конструкции')
    allowed={'patch_pocket':{'type','host','width_mm','height_mm','y_mm'},
             'cargo_pocket':{'type','host','width_mm','height_mm','y_mm','depth_mm','flap_mm'},
             'edge_panel':{'type','host','segments','depth_mm'}}
    for f in features:
        if not isinstance(f,dict) or f.get('type') not in allowed or set(f)!=allowed[f['type']]:raise ValueError('Неизвестная операция или неполные параметры опытной конструкции')
        if not isinstance(f['host'],str) or not 1<=len(f['host'])<=100:raise ValueError('Нужно указать роль основной детали')
        for k,v in f.items():
            if k.endswith('_mm') and (type(v) not in (float,int) or not math.isfinite(v) or not 0<=v<=1500):raise ValueError('Некорректный размер элемента: '+k)
        if f['type']=='edge_panel':
            if not 20<=f['depth_mm']<=300 or not isinstance(f['segments'],list) or not 1<=len(f['segments'])<=8 or any(type(i) is not int or i<0 for i in f['segments']) or len(set(f['segments']))!=len(f['segments']):raise ValueError('Неверный участок притачивания дополнительной панели')
        elif not 60<=f['width_mm']<=300 or not 60<=f['height_mm']<=400:raise ValueError('Карман: ширина 60–300 мм, высота 60–400 мм')
        if f['type']=='cargo_pocket' and (not 10<=f['depth_mm']<=80 or not 25<=f['flap_mm']<=100):raise ValueError('Стенка кармана 10–80 мм; клапан 25–100 мм')
    sources=design.get('sources',[])
    if not isinstance(sources,list) or len(sources)>12 or any(not isinstance(s,str) or not s.startswith('https://') or len(s)>2000 for s in sources):raise ValueError('Источники конструкции должны быть ссылками HTTPS')
    return copy.deepcopy(design)


def build(method,profile,parameters,design,previous=None):
    from engineering.methods import _build_raw
    design=checked(design)
    if method=='tshirt_setin_engineering_v1':raise ValueError('Инженерная трикотажная основа пока не поддерживает добавочные элементы; для опытной модификации выберите основу без специальных правил рибаны')
    source=_build_raw(method,profile,parameters,previous)
    if source.get('needs_input'):return source
    base=source['garment'];g=copy.deepcopy(base['parameters']);g['development']=design
    meta=copy.deepcopy(base['method_spec'])
    meta.setdefault('name',base['name'])
    meta['variant']=meta.get('variant',base['name'])+' — опытная модификация'
    meta.setdefault('limits',[]).append('Дополнительные элементы требуют ручной сборки и примерки; источники не подтверждают посадку')
    kit=Kit(method,profile,g,previous,metadata=meta);adopt(kit,source)
    for p,q in zip(kit.pieces,base['pieces']):
        for k in ('grainline','seams','internal_line_kinds','dart_spec','finished_hem_panel_mm','material_panel'):
            if k in q:p[k]=copy.deepcopy(q[k])
    for n,f in enumerate(design['features']):
        if f['host'] not in kit.roles:raise ValueError('Не найдена основная деталь для изменения: '+f['host'])
        host=kit.pieces[kit.roles[f['host']]];role='development_'+str(n)
        if f['type']=='patch_pocket':
            w,h=f['width_mm'],f['height_mm'];x=pocket_placement(host,f['y_mm'],w,h);y=f['y_mm']
            for line in host['internal_lines']:
                if any(max(a[0],b[0])>=x and min(a[0],b[0])<=x+w and max(a[1],b[1])>=y and min(a[1],b[1])<=y+h for a,b in zip(line,line[1:])):
                    raise ValueError('Новый карман пересекает существующую конструктивную линию на детали «'+host['name']+'»; измените положение или размер')
            kit.add(role,'Дополнительный накладной карман '+str(n+1),rect(w,h))
            i=len(host['internal_lines']);host['internal_lines'].append([[x+w,y],[x+w,y+h],[x,y+h],[x,y]])
            host.setdefault('internal_line_kinds',['stitch_attachment']*i).append('stitch_attachment')
            kit.graph.append(dict(id=str(uuid.uuid4()),a=dict(piece=kit.roles[role],segments=[1,2,3]),b=dict(piece=kit.roles[f['host']],internal_line=i),direction='same',type='настрочить карман',ease_mm=0,tolerance_mm=.5,alignment=[0,1]))
        elif f['type']=='cargo_pocket':
            saved=copy.deepcopy(kit.g)
            kit.g.update(utility_pocket_width_mm=f['width_mm'],utility_pocket_height_mm=f['height_mm'],utility_pocket_depth_mm=f['depth_mm'],utility_flap_height_mm=f['flap_mm'])
            add_cargo(kit,f['host'],'development_'+str(n),f['y_mm']);kit.g=saved
        else:
            c=deserialize(host['seam_contour']);ids=f['segments']
            if any(i>=len(c.segments) for i in ids):raise ValueError('Дополнительная панель: участок шва отсутствует')
            if any(c.segments[a].end.distance(c.segments[b].start)>.001 for a,b in zip(ids,ids[1:])):raise ValueError('Дополнительная панель требует непрерывного участка шва')
            if any(r[e].get('piece')==kit.roles[f['host']] and set(r[e].get('segments',[]))&set(ids) for r in kit.graph for e in ('a','b')):raise ValueError('Выбранный участок уже соединён с другой деталью; уточните способ обработки')
            width=sum(c.segments[i].length(.001) for i in ids)
            if not 30<=width<=2000:raise ValueError('Длина притачивания панели вне диапазона 30–2000 мм')
            kit.add(role,'Дополнительная притачная панель '+str(n+1),rect(width,f['depth_mm']))
            kit.join(f['host'],ids,role,[0],direction='reverse')
    if len(kit.pieces)>64:raise ValueError('В опытном комплекте больше 64 деталей')
    kit.metadata['required_roles']=list(kit.roles)
    result=kit.finish();result['garment']['construction_lines']=copy.deepcopy(base.get('construction_lines',{}))
    result['garment']['operations'][:0]=['Опытная модификация: проверить добавленные элементы, технологию обработки и посадку на макете']
    result['garment']['development_sources']=design.get('sources',[])
    return result
