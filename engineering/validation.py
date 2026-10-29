"""Common gate for every registered method, using method-specific constructors."""
import json
from . import methods,geometry,assembly,fit,quality
from .measurements import normalize


def validate(g,reconstruct=True):
    if g.get('method') == 'parametric_design_v1':
        from parametric_design import audit
        return audit(g,reconstruct=reconstruct)
    issues=[];parts=[];method_valid=True
    def error(code,section,message,piece='Комплект'):
        issues.append({'code':code,'severity':'error','piece':piece,'section':section,'message':message})
    try:
        meta=methods.method(g['method'])
        material=g.get('material',{})
        if not isinstance(material,dict) or ('fabric_index' in material and (type(material['fabric_index']) is not int or material['fabric_index']<0)):
            error('MATERIAL_INVALID','материал','Индекс ткани CLO должен быть целым неотрицательным числом')
        normalized,measurement_issues=normalize({'id':g['profile_id'],'measurements':g['measurement_snapshot']},meta['required_measurements'])
        issues+=measurement_issues
        ids=[p['id'] for p in g['pieces']]
        if not ids or len(set(ids))!=len(ids):error('PIECE_ID','идентификаторы','Пустой комплект или повторяющиеся ID деталей')
        from garment_engine import validate_garment
        try:validate_garment(g)
        except (ValueError,KeyError,IndexError) as e:error('COMPLETENESS','комплектность',str(e))
        for p in g['pieces']:
            row=geometry.audit_piece(p);parts.append(row);issues+=row['issues']
            if not p.get('grainline') or len(p['grainline'])!=2:error('GRAIN_MISSING','долевая','Не задано направление долевой',p['name'])
            if p.get('cut_quantity')!=1:error('CUT_QUANTITY','раскрой','Полноразмерные детали этой реализации должны иметь количество 1',p['name'])
        # Method conformity is independent of an AI-provided method_spec or saved valid flag.
        if reconstruct and not measurement_issues:
            expected=methods.build_raw(g['method'],normalized,g['parameters'])
            if 'needs_input' in expected:raise ValueError('Неполные или неподтверждённые исходные данные методики')
            by_role={p['role']:p for p in expected['garment']['pieces']}
            if set(by_role)!={p['role'] for p in g['pieces']}:raise ValueError('Состав деталей не соответствует конструктору методики')
            for p in g['pieces']:
                for field in ('seam_contour','cut_contour','internal_lines'):
                    if not equivalent(p[field],by_role[p['role']][field]):
                        error('METHOD_CONFORMITY',field,'Геометрия отличается от расчёта выбранной методики по сохранённым меркам и параметрам',p['name']);method_valid=False
            # Verify the connection topology, not only a connected graph with equal lengths.
            def topology(garment):
                def endpoint(e):return (garment['pieces'][e['piece']]['role'],tuple(e.get('segments',[])),e.get('internal_line'))
                return sorted((endpoint(r['a']),endpoint(r['b']),r['direction'],r.get('ease_mm',0),r['type']) for r in garment['sewing_graph'])
            if not equivalent(topology(g),topology(expected['garment']),1e-5):error('METHOD_ASSEMBLY','карта швов','Карта сборки не соответствует методике');method_valid=False
        if g['method'] in ('balloon_tapered_v1','workwear_zip_jacket_v1','women_baggy_boilersuit_v1'):
            from reference_constructors import audit
            issues += audit(g)
        if g['method']=='tshirt_setin_engineering_v1':
            from tshirt_engine import validate_engineering
            specific=validate_engineering(g)
            for e in specific['errors']:issues.append(dict(e,code='TSHIRT_RULE',severity='error'))
        elif g['category']=='headwear':
            for p in g['pieces']:
                if p['role'].startswith('gore_'):
                    crown=p['seam_contour'][1]['end'];base=p['seam_contour'][0]['start']
                    if crown[1]>=base[1] or abs(base[1]-crown[1]-g['parameters']['height_mm'])>.01:
                        error('CROWN_ORIENTATION','верх клина','Вершина шапки должна находиться выше линии околыша в локальной системе Y вниз',p['name'])
        elif g['method'] in ('wide_trousers_experimental_v1','trousers_utility_v1'):
            from tshirt_engine import tangent_angle
            from garment_engine import deserialize
            for p in g['pieces']:
                if p['role'].startswith(('front_','back_')):
                    c=deserialize(p['seam_contour'])
                    if tangent_angle(c.segments[8],c.segments[9])>.1:error('SEAT_TANGENT','средний шов','Нарушена касательная на переходе линии сидения',p['name'])
        connections=assembly.audit(g);issues+=connections['issues']
        geometry_valid=not any(e['severity']=='error' for p in parts for e in p['issues'])
        construction_valid=method_valid and not any(e['severity']=='error' and e['code'] not in ('SEAM_MISMATCH',) for e in issues)
        qs=quality.milestones(g,geometry_valid,construction_valid,connections['valid'],g.get('fit_review'))
        fit_report=fit.evaluate(g)
        warnings=[{'code':'EXPERIMENTAL_METHOD','severity':'warning','piece':'Комплект','section':'методика',
                   'message':'Проверено соответствие собственной экспериментальной методике. Профессиональная методика и посадка не подтверждены'},
                  {'code':'NATIVE_PRODUCTION_MANUAL','severity':'warning','piece':'Комплект','section':'CLO',
                   'message':'Нативные долевая, надсечки, стачивание и реальные свойства ткани требуют ручной проверки'}]
        return {'schema_version':1,'method':{'id':g['method'],'name':meta['name'],'version':meta['implementation_version'],
                 'source':meta.get('sources',['Собственная экспериментальная реализация CLO AI; см. базу знаний']),
                 'knowledge_id':meta['knowledge_id'],'professional_standard_verified':False},
                'garment_id':g['id'],'garment_version':g['version'],'profile_id':g['profile_id'],
                'measurements':g['measurement_snapshot'],'parameters':g['parameters'],
                'valid':not any(i['severity']=='error' for i in issues),'issues':issues,'warnings':warnings,
                'parts':parts,'assembly':connections,'fit':fit_report,'quality':qs,
                'rule_coverage':{'applicable':['Комплектность выбранного варианта','Соответствие геометрии конструктору','Равенства и заданная посадка Sewing Graph','Припуски и контроль исходных размеров'],
                                 'not_applicable':[] if g['method'] in ('balloon_tapered_v1','women_baggy_boilersuit_v1') else ['Этот вариант не заявляет вытачек'],
                                 'unassessed':['Промышленная градация','Профессиональная корректность не реализованной внешней методики','Индивидуальный конструктивный баланс и технология обработки']},
                'native_export':{'status':'not_measured','note':'Расчёт модели. Подтверждение CLO прикладывается только после чтения API'},
                'fit_verified':False,'sewing_ready':False}
    except (ValueError,KeyError,TypeError,IndexError) as e:
        error('METHOD_INVALID','методика',str(e))
        return {'schema_version':1,'garment_id':g.get('id'),'garment_version':g.get('version'),'valid':False,
                'issues':issues,'warnings':[],'parts':parts,'fit_verified':False,'sewing_ready':False}


def equivalent(a,b,tol=1e-7):
    if isinstance(a,(int,float)) and not isinstance(a,bool) and isinstance(b,(int,float)) and not isinstance(b,bool):return abs(a-b)<=tol
    if type(a)!=type(b):return False
    if isinstance(a,(list,tuple)):return len(a)==len(b) and all(equivalent(x,y,tol) for x,y in zip(a,b))
    if isinstance(a,dict):return set(a)==set(b) and all(equivalent(a[k],b[k],tol) for k in a)
    return a==b
