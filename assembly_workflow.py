"""Version-specific 3D preflight and explicitly confirmed bounded simulation.

No guessed sewing API, cut-edge indices or arrangement coordinates are used.
The installed 7.0.228 Python API cannot create/read back semantic sewing links.
"""
import os
import tempfile
import uuid
from engineering.validation import validate
from engineering.clo_capabilities import probe


def inspect(garment,targets,api,exporter,utility):
    from clo_operations import locate
    if len(targets)!=len(garment['pieces']):raise ValueError('Неполный комплект привязок деталей изделия')
    if len({str(t['pattern_id']) for t in targets})!=len(targets):raise ValueError('Одна нативная деталь указана несколько раз')
    for p,t in zip(garment['pieces'],targets):
        if t.get('id')!=p['id']:raise ValueError('Привязка не соответствует семантической детали «'+p['name']+'»')
        locate(api,t)
    report=validate(garment,reconstruct=True)
    if not report['valid']:raise ValueError('Проверка перед сборкой не пройдена: '+'; '.join(e['piece']+' / '+e['section']+': '+e['message'] for e in report['issues']))
    if not report['assembly']['links']:raise ValueError('В комплекте отсутствует карта соединений')
    capabilities=probe(api,utility,exporter)
    avatar_count=capabilities.get('avatar_count')
    from sewing_map import resolve_map
    sewing_map=resolve_map(garment,targets,api)
    return {'status':'unavailable','geometry_valid':True,'connections_valid':True,
            'garment_id':garment['id'],'garment_version':garment['version'],
            'native_seams_created':0,'placed_parts':0,'simulation_status':'not_run',
            'sewing_graph':report['assembly']['links'],'sequence':garment.get('operations',[]),
            'component_count':report['assembly'].get('component_count',1),'assembly_components':report['assembly'].get('components',[]),
            'sewing_map':sewing_map,
            'capabilities':capabilities,'avatar_count':avatar_count,
            'text':'Конструкция проверена. '+('Независимых сборок в комплекте: {}. Между ними нет швов. '.format(report['assembly']['component_count']) if report['assembly'].get('component_count',1)>1 else '')+
                   'Сопоставлено с внутренними линиями CLO: {} из {} соединений. Полностью проверено с метками: {}. '.format(sewing_map['mapped_count'],sewing_map['seam_count'],sewing_map['verified_count'])+
                   ('Откройте карту сборки: доступны схемы, направления и измеренные длины. ' if sewing_map['status']=='verified' else 'Часть участков или меток не удалось сопоставить; причины указаны в карте. ')+
                   'Сшивание выполняется вручную в CLO. Швы и размещение не изменены. '+
                   ('Добавьте аватар в CLO. ' if avatar_count==0 else '')+
                   'Сшейте и разместите детали вручную по карте. После этого можно отдельно подтвердить запуск 100 шагов симуляции. Посадку требуется проверить.'}


def simulate(job,api,exporter,utility):
    if job.get('confirmed_simulation') is not True or job.get('manual_scene_confirmed') is not True or job.get('simulation_steps')!=100:
        raise ValueError('Подтвердите, что швы и размещение в 3D выполнены вручную, и разрешите 100 шагов симуляции')
    result=inspect(job['garment'],job['targets'],api,exporter,utility)
    if not result['capabilities']['simulate_callable']:raise ValueError('Запуск симуляции недоступен в текущем CLO')
    if result['avatar_count'] is None:raise ValueError('Не удалось проверить наличие аватара. Симуляция не запущена')
    if result['avatar_count']==0:raise ValueError('Добавьте аватар, разместите детали и повторите подтверждение')
    folder=os.path.join(tempfile.gettempdir(),'CLO_AI_Backups');os.makedirs(folder,exist_ok=True)
    backup=os.path.join(folder,'before_simulation_'+str(uuid.uuid4())+'.zprj')
    saved=exporter.ExportZPrjW(backup,False)
    if not saved or not os.path.isfile(backup) or not os.path.getsize(backup):raise ValueError('Не удалось сохранить резервную копию. Симуляция не запущена')
    # Simulate is synchronous in this API. True confirms only these bounded steps.
    try:success=utility.Simulate(100)
    except Exception as error:
        failure=RuntimeError('CLO сообщил об ошибке симуляции. Проверьте сцену и резервную копию перед повтором')
        failure.transaction={'stage':'simulation_failed','requires_manual_recovery':True,'backup':backup,'note':'Симуляция могла частично выполниться; проверьте сцену перед повтором'}
        raise failure from error
    result.update(status='simulation_steps_completed' if success is True else 'simulation_unconfirmed',
                  simulation_status='steps_completed' if success is True else 'unconfirmed',
                  simulation_steps=100,backup=backup,manual_scene_attested=True,
                  text='CLO подтвердил выполнение 100 шагов симуляции. Швы и размещение подтверждены пользователем, автоматически не проверялись. Проверьте посадку, пересечения и натяжение.' if success is True else 'CLO не подтвердил выполнение симуляции. Проверьте сцену; автоматический повтор не выполняется.')
    return result
