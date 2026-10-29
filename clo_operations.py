"""Targeted CLO operations guarded by stable IDs and geometry fingerprints."""
import json
import hashlib
import os
import tempfile
import uuid
from clo_adapter import create_batch
from geometry_validation import require_valid, validate

def info(api,index):
    value=api.GetPatternInformation(index)
    return json.loads(value) if isinstance(value,str) else value

def fingerprint(api,index):
    raw=api.GetPatternInputInformation(index)
    raw=json.loads(raw) if isinstance(raw,str) else raw
    # CLO changes indices when a pattern is deleted; do not fingerprint an index.
    for part in raw.get('Pattern InputInformation',[]): part.pop('Pattern index',None)
    return hashlib.sha256(json.dumps(raw,sort_keys=True).encode('utf-8')).hexdigest()

def locate(api,target):
    matches=[i for i in range(api.GetPatternCount()) if info(api,i).get('id')==target['pattern_id']]
    if len(matches)!=1: raise ValueError('Деталь не найдена в текущем проекте CLO; обновление запрещено')
    i=matches[0]
    if not target.get('fingerprint') or fingerprint(api,i)!=target['fingerprint']: raise ValueError('Деталь изменена вне CLO AI; операция остановлена')
    return i

def snapshot(api):
    return {str(info(api,i)['id']):fingerprint(api,i) for i in range(api.GetPatternCount())}

def dispatch(job,api,exporter,utility=None):
    try:import operation_events
    except ImportError:return _checked_dispatch(job,api,exporter,utility)
    operation_events.begin(job)
    try:
        result=_checked_dispatch(job,api,exporter,utility)
        confirmed=result.get('validation',{}).get('valid') is not False and result.get('assembly',{}).get('status')!='simulation_unconfirmed'
        operation_events.emit('result','Операция CLO','verified' if confirmed else 'unconfirmed',
                              'CLO завершил операцию и вернул результат.' if confirmed else 'CLO вернул ответ, но проверка результата не пройдена.')
        result['execution_events']=operation_events.events()
        return result
    except Exception as error:
        operation_events.emit('result','Операция CLO','failed','CLO не подтвердил завершение операции.',{'error':str(error),'transaction':getattr(error,'transaction',None)})
        error.execution_events=operation_events.events()
        raise
    finally:operation_events.end()


def _checked_dispatch(job,api,exporter,utility=None):
    if job.get('operation','create') not in ('create','inspect','validate','measure','qa_measure','delete','assembly_preflight','simulate_confirmed','sewing_test_prepare','sewing_test_inspect','sewing_test_cleanup'):
        raise ValueError('Неизвестная операция CLO')
    destructive=job.get('replace_targets') or job.get('replace_target') or job.get('operation')=='delete'
    if destructive and job.get('confirmed_replacement') is not True:
        raise ValueError('Подтвердите замену или удаление существующих деталей перед применением')
    report=None
    if job.get('garment') and job.get('operation','create')=='create':
        try:from operation_events import emit
        except ImportError:emit=lambda *args,**kwargs:None
        emit('validation','Передача в CLO','running','Проверяю актуальную конструкцию перед изменением проекта CLO.')
        from engineering.validation import validate
        report=validate(job['garment'],reconstruct=True)
        if not report['valid']:
            failure=ValueError('; '.join('{piece} / {section}: {message}'.format(**e) for e in report['issues']))
            failure.qa_report=report
            raise failure
    try:
        if job.get('operation') in ('sewing_test_prepare','sewing_test_inspect','sewing_test_cleanup'):
            import importlib
            import sewing_experiment
            return importlib.reload(sewing_experiment).dispatch(job,api,exporter)
        if job.get('operation') in ('assembly_preflight','simulate_confirmed'):
            from assembly_workflow import inspect,simulate
            result=inspect(job['garment'],job['targets'],api,exporter,utility) if job['operation']=='assembly_preflight' else simulate(job,api,exporter,utility)
            return {'assembly':result,'backup':result.get('backup')}
        result=_dispatch(job,api,exporter,report)
        result.setdefault('transaction',{'stage':'committed','requires_manual_recovery':False})
        return result
    except Exception as error:
        if not hasattr(error,'transaction'):
            error.transaction={'stage':'failed','requires_manual_recovery':bool(destructive),'note':'Не повторять автоматически; проверьте резервную копию и состояние CLO'}
        raise


def _dispatch(job,api,exporter,qa_report=None):
    operation=job.get('operation','create')
    if operation=='inspect':
        from engineering.clo_capabilities import probe
        try:import utility_api
        except ImportError:utility_api=None
        return {'engineering_capabilities':probe(api,utility_api),'capabilities':{name:callable(getattr(api,name,None)) for name in ('CreatePatternWithPoints','CreateInternalShapeWithPoints','DeletePatternPiece','SetArrangementPosition')},'inspection':[{'pattern_index':i,'pattern_id':info(api,i).get('id'),'name':info(api,i).get('name'),'fingerprint':fingerprint(api,i)} for i in range(api.GetPatternCount())]}
    if operation=='qa_measure':
        from engineering.validation import validate
        from engineering.native import readback,assembly_readback
        from garment_engine import deserialize
        from contour_engine import simplify_closed
        g=job['garment'];report=validate(g)
        if not report['valid']:return {'qa_report':report,'validation':{'valid':False,'errors':report['issues']}}
        targets=job['targets']
        if len(targets)!=len(g['pieces']):raise ValueError('Для измерения нужны привязки всех деталей изделия')
        results=[];raws=[]
        for p,target in zip(g['pieces'],targets):
            index=locate(api,target);raw=api.GetPatternInputInformation(index);raws.append(raw)
            data=json.loads(raw) if isinstance(raw,str) else raw
            actual=[v for v in data['Pattern InputInformation'][0]['PointList'] if 'Point positionX' in v]
            cut=deserialize(p['cut_contour'])
            from clo_curves import encode
            compact=encode(cut,True)['anchors']
            local=[(x,y,0) for x,y in compact] if len(actual)==len(compact) else simplify_closed(cut.clo_points(.1),.08)
            dx,dy=float(actual[0]['Point positionX'])-local[0][0],float(actual[0]['Point positionY'])+local[0][1]
            expected=[(x+dx,-y+dy) for x,y,_ in local]
            results.append({'native_measurement':readback(api,index,expected,p)})
        report['native_export']=assembly_readback(g,results,report)
        return {'qa_report':report,'measurement':raws}
    if operation in ('validate','measure'):
        indices=[locate(api,t) for t in job.get('targets',[])]
        if operation=='measure':
            return {'measurement':[api.GetPatternInputInformation(i) for i in indices]}
        return {'validation':validate(job['patterns'],job.get('relations',[]))}
    if operation=='delete':
        indices=[locate(api,t) for t in job['targets']]
        before=snapshot(api)
        folder=os.path.join(tempfile.gettempdir(),'CLO_AI_Backups');os.makedirs(folder,exist_ok=True)
        backup=os.path.join(folder,str(uuid.uuid4())+'.zprj')
        if not exporter.ExportZPrjW(backup,False) or not os.path.isfile(backup) or not os.path.getsize(backup): raise ValueError('Не удалось сохранить резервную копию')
        for index in sorted(set(indices),reverse=True): api.DeletePatternPiece(index)
        expected={k:v for k,v in before.items() if k not in {str(t['pattern_id']) for t in job['targets']}}
        if snapshot(api)!=expected: raise ValueError('Проверка отмены не пройдена. Копия: '+backup)
        return {'deleted':True,'backup':backup}
    garment=job.get('garment')
    if garment:
        from garment_engine import validate_garment
        validate_garment(garment)
        pieces=garment['pieces'];roles={p['role'] for p in pieces}
        mandatory={'front_left','front_right','back_left','back_right','fly','guard','belt_front_left','belt_back_left','belt_front_right','belt_back_right'}
        if garment['method']!='wide_trousers_experimental_v1':mandatory=set(garment['method_spec']['required_roles'])
        if not mandatory<=roles or len(pieces)!=len(job['patterns']):raise ValueError('Неполный комплект изделия')
        for p,spec in zip(pieces,job['patterns']):
            # A generic piece is a cutting template and may request several
            # fabric copies. Registered constructors still emit full-size,
            # one-copy pieces. Cutting quantity never clones native geometry.
            quantity=p.get('cut_quantity')
            valid_quantity=type(quantity) is int and (1<=quantity<=8 if garment['method']=='parametric_design_v1' else quantity==1)
            if p['cut_contour']!=spec['segments'] or not p.get('grainline') or not p.get('landmarks') or not p.get('allowance_mm') or not valid_quantity:raise ValueError('Нет обязательных данных детали: '+p['name'])
        # The shared construction gate above measures every graph endpoint,
        # including outline-to-internal-line connections. This contour-only
        # validator accepts only pairs of outline references.
        require_valid([{'type':'contour','name':p['name'],'segments':p['seam_contour']} for p in pieces],[{k:v for k,v in r.items() if k in ('a','b','ease_mm','tolerance_mm')} for r in garment['sewing_graph'] if 'segments' in r['a'] and 'segments' in r['b']])
    report=require_valid(job['patterns'],job.get('relations',[]))
    for seam in job.get('external_seams',[]):
        segments=report['pieces'][0]['semantic']['contour']
        length=sum(segments[n]['length_mm'] for n in seam['segments'])
        if abs(length-seam['expected_mm'])>seam['tolerance_mm']: raise ValueError('Связанный шов с деталью {}: {:.2f} мм вместо {:.2f} мм'.format(seam['name'],length,seam['expected_mm']))
    targets=job.get('replace_targets') or ([job['replace_target']] if job.get('replace_target') else [])
    if garment and 'previous_pieces' in job:
        from clo_updates import update_garment
        return update_garment(job,api,exporter,qa_report)
    old_indices=[];before=None
    if targets:
        old_indices=[locate(api,t) for t in targets];before=snapshot(api)
        if len(set(old_indices))!=len(old_indices):raise ValueError('Повтор целевой детали')
        coords=[]
        for old in old_indices:
            raw=api.GetPatternInputInformation(old);raw=json.loads(raw) if isinstance(raw,str) else raw
            coords.extend(p for p in raw['Pattern InputInformation'][0]['PointList'] if 'Point positionX' in p)
        job=dict(job,origin=[min(float(p['Point positionX']) for p in coords),min(float(p['Point positionY']) for p in coords)])
    result=create_batch(job,api,exporter)
    if garment and qa_report:
        from engineering.native import assembly_readback
        qa_report['native_export']=assembly_readback(garment,result['patterns'],qa_report)
        failed=[s for s in qa_report['native_export']['seams'] if s['passed'] is False]
        if failed:
            # Native mismatch: old targets are still intact. Roll back new pieces only.
            for r in reversed(result['patterns']):api.DeletePatternPiece(r['pattern_index'])
            failure=ValueError('Фактические длины швов CLO не прошли проверку; новые детали отменены, исходные сохранены')
            failure.qa_report=qa_report;failure.transaction={'stage':'native_qa_rolled_back','backup':result['backup'],'requires_manual_recovery':False}
            raise failure
        result['qa_report']=qa_report
    if targets:
        try:
            for old in sorted(old_indices,reverse=True):api.DeletePatternPiece(old)
        except Exception as error:
            error.transaction={'stage':'replacement_partial','backup':result['backup'],'requires_manual_recovery':True,
                               'note':'Новые детали созданы, удаление старых не завершено. Восстановите сохранённый проект вручную'}
            raise
        for r in result['patterns']:r['pattern_index']-=len(old_indices)
        after=snapshot(api);expected={k:v for k,v in before.items() if k not in {str(t['pattern_id']) for t in targets}}
        if any(after.get(k)!=v for k,v in expected.items()):raise ValueError('Изменились другие детали. Копия: '+result['backup'])
    for r in result['patterns']:r['fingerprint']=fingerprint(api,r['pattern_index'])
    return result
