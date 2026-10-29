"""Guarded single-shoulder UI experiment on two disposable native copies.

No sewing API is invented. Native sewing actions are performed and inspected
through CLO's UI separately. Cleanup can delete only IDs created by this journal.
"""
import json
import math
import os
import tempfile
import uuid
from garment_engine import deserialize
from contour_engine import simplify_closed


def _root(experiment_id):
    try:valid=str(uuid.UUID(experiment_id))==experiment_id
    except (ValueError,TypeError,AttributeError):valid=False
    if not valid:raise ValueError('Неверный ID проверки')
    return os.path.join(tempfile.gettempdir(),'CLO_AI_Sewing_Tests',experiment_id)


def _write(folder,state):
    with open(os.path.join(folder,'journal.json.tmp'),'w',encoding='utf-8') as f:json.dump(state,f,ensure_ascii=True)
    os.replace(os.path.join(folder,'journal.json.tmp'),os.path.join(folder,'journal.json'))


def _raw(api,index):
    raw=api.GetPatternInputInformation(index)
    return json.loads(raw) if isinstance(raw,str) else raw


def _points(shape):
    return [(float(p['Point positionX']),float(p['Point positionY'])) for p in shape.get('PointList',[]) if 'Point positionX' in p]


def shoulder(api,index,piece):
    """Verify the whole cut and stitch outlines before mapping segment zero."""
    root=_raw(api,index)['Pattern InputInformation'][0];actual=_points(root)
    local=simplify_closed(deserialize(piece['cut_contour']).clo_points(.1),.08)
    if len(actual)!=len(local):raise ValueError('Срез детали не соответствует сохранённой модели')
    dx,dy=actual[0][0]-local[0][0],actual[0][1]+local[0][1]
    error=max(math.hypot(a[0]-b[0]-dx,a[1]+b[1]-dy) for a,b in zip(actual,local))
    if error>.06:raise ValueError('Форма среза отличается от модели: {:.4f} мм'.format(error))
    contour=deserialize(piece['seam_contour']);line=contour.segments[0]
    if line.c1 is not None:raise ValueError('Проверка предназначена для прямого плечевого участка')
    local=contour.clo_points(.1);matches=[]
    for child in root.get('Children Information',[]):
        if 'Shape index' not in child:continue
        cp=_points(child)
        if len(cp)!=len(local):continue
        deviation=max(math.hypot(a[0]-b[0]-dx,a[1]+b[1]-dy) for a,b in zip(cp,local))
        if deviation<=.06:matches.append((child,cp,deviation))
    if len(matches)!=1:raise ValueError('Не найдена однозначная внутренняя линия стачивания')
    child,cp,deviation=matches[0];lengths=[float(l['Line length']) for l in child.get('LineList',[]) if 'Line length' in l]
    if len(lengths)!=len(local) or abs(lengths[0]-line.length())>.06:raise ValueError('Длина плечевого шва не подтверждена CLO')
    return {'child_index':int(child['Shape index']),'line_index':0,'length_mm':lengths[0],
            'start':cp[0],'end':cp[1],'midpoint':[(a+b)/2 for a,b in zip(cp[0],cp[1])],
            'cut_error_mm':error,'stitch_error_mm':deviation,
            'line_information':[l for l in child.get('LineList',[]) if 'Line length' in l][:1]}


def dispatch(job,api,exporter):
    from clo_operations import locate,info,fingerprint,snapshot
    if job.get('operation') not in ('sewing_test_prepare','sewing_test_inspect','sewing_test_cleanup'):
        raise ValueError('Неизвестная операция проверки шва')
    folder=_root(job['experiment_id']);journal=os.path.join(folder,'journal.json')
    operation=job['operation']
    if operation=='sewing_test_prepare':
        if job.get('confirmed_test_copy') is not True:raise ValueError('Не подтверждена проверка на временных копиях')
        if os.path.exists(journal):raise ValueError('Эта проверка уже подготовлена; копии повторно не создаются')
        sources=job.get('targets',[]);models=job.get('model_pieces',[])
        if len(sources)!=2 or len(models)!=2 or [p.get('role') for p in models]!=['front','back']:raise ValueError('Нужны перед и спинка одной футболки')
        source_indices=[locate(api,t) for t in sources]
        if not callable(getattr(api,'CopyPatternPieceMove',None)) or not callable(getattr(api,'SetPatternPieceName',None)):
            raise ValueError('CLO не поддерживает создание именованных тестовых копий')
        if len(set(source_indices))!=2:raise ValueError('Одна деталь указана дважды')
        measured=[shoulder(api,i,p) for i,p in zip(source_indices,models)]
        if abs(measured[0]['length_mm']-measured[1]['length_mm'])>.2:raise ValueError('Длины плечевых участков не сопряжены')
        before=snapshot(api);os.makedirs(folder)
        backup=os.path.join(folder,'scene-before.zprj');saved=exporter.ExportZPrjW(backup,False)
        if not saved or not os.path.isfile(backup) or not os.path.getsize(backup):raise ValueError('Резервная копия не сохранена; проверка остановлена')
        state={'id':job['experiment_id'],'before':before,'before_count':api.GetPatternCount(),'backup':backup,
               'created_ids':[],'source_models':models,'source_measurements':measured,'stage':'preparing'};_write(folder,state)
        try:
            for i,source_index in enumerate(source_indices):
                old=snapshot(api)
                api.CopyPatternPieceMove(source_index,0,1100)
                added=[info(api,n)['id'] for n in range(api.GetPatternCount()) if str(info(api,n)['id']) not in old]
                state['created_ids'].extend(added);_write(folder,state)
                if len(added)!=1:raise ValueError('CLO не подтвердил создание одной копии')
                index=next(n for n in range(api.GetPatternCount()) if info(api,n)['id']==added[0])
                api.SetPatternPieceName(index,'CLO_AI_TEST_'+('FRONT' if i==0 else 'BACK')+'_'+job['experiment_id'][:8])
                shoulder(api,index,models[i])
            if any(snapshot(api).get(k)!=v for k,v in before.items()):raise ValueError('Изменились исходные детали')
            state['stage']='prepared';_write(folder,state)
        except Exception:
            state['stage']='prepare_failed';_write(folder,state);raise
    else:
        with open(journal,encoding='utf-8') as f:state=json.load(f)
    if operation=='sewing_test_cleanup':
        if job.get('confirmed_test_cleanup') is not True:raise ValueError('Не подтверждено удаление временных копий')
        if set(map(str,state['created_ids']))&set(state['before']):raise ValueError('ID копии совпал с исходной деталью; удаление запрещено')
        current=snapshot(api)
        if any(current.get(k)!=v for k,v in state['before'].items()):
            raise ValueError('Исходные детали изменились; автоматическое удаление копий остановлено')
        names={pid:'CLO_AI_TEST_'+('FRONT' if n==0 else 'BACK')+'_'+job['experiment_id'][:8] for n,pid in enumerate(state['created_ids'])}
        # Validate every candidate before deleting any of them.
        indices=[]
        for i in range(api.GetPatternCount()-1,-1,-1):
            item=info(api,i)
            if item['id'] in state['created_ids']:
                if item.get('name')!=names[item['id']]:raise ValueError('Тестовая копия переименована; автоматическое удаление остановлено')
                indices.append(i)
        for i in indices:api.DeletePatternPiece(i)
        after=snapshot(api)
        expected={k:v for k,v in current.items() if k not in set(map(str,state['created_ids']))}
        state['originals_preserved']=all(after.get(k)==v for k,v in state['before'].items())
        state['after_count']=api.GetPatternCount()
        state['stage']='cleaned' if after==expected else 'cleanup_failed';_write(folder,state)
        if after!=expected:raise ValueError('Проверка удаления копий не пройдена; используйте резервную копию: '+state['backup'])
        evidence=None
        if job.get('export_evidence') is True:
            evidence=os.path.join(folder,'scene-after-cleanup.zprj')
            if not exporter.ExportZPrjW(evidence,False) or not os.path.isfile(evidence) or not os.path.getsize(evidence):
                raise ValueError('Копии удалены, но не удалось сохранить результат проверки')
        return {'sewing_test':{'stage':state['stage'],'originals_preserved':state['originals_preserved'],'before_count':state['before_count'],'after_count':state['after_count'],'backup':state['backup'],'journal':journal,'evidence':evidence}}
    copies=[]
    for i,pattern_id in enumerate(state['created_ids']):
        matches=[n for n in range(api.GetPatternCount()) if info(api,n)['id']==pattern_id]
        if len(matches)!=1:raise ValueError('Не найдена тестовая копия')
        index=matches[0];copies.append({'index':index,'pattern_id':pattern_id,'name':info(api,index)['name'],'fingerprint':fingerprint(api,index),'shoulder':shoulder(api,index,state['source_models'][i])})
        with open(os.path.join(folder,'copy-'+str(i)+'-input.json'),'w',encoding='utf-8') as f:json.dump(_raw(api,index),f)
    evidence=None
    if job.get('export_evidence') is True:
        evidence=os.path.join(folder,'sewing-evidence.zprj')
        if not exporter.ExportZPrjW(evidence,False) or not os.path.isfile(evidence) or not os.path.getsize(evidence):
            raise ValueError('Не удалось сохранить проект с пробным швом')
    state['last_inspection']=copies;_write(folder,state)
    return {'sewing_test':{'stage':state['stage'],'copies':copies,'backup':state['backup'],'journal':journal,'evidence':evidence,
                           'originals_preserved':all(snapshot(api).get(k)==v for k,v in state['before'].items())}}
