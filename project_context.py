"""Read-only CLO project observation. No geometry, export, auth or UI mutation.

CLO 7.0.228 exposes name/path and pattern IDs, not a documented document GUID
or lifecycle callbacks. Identity is inferred conservatively and limitations are
reported. An identical empty->empty unsaved reset is inherently unobservable.
"""
import hashlib
import json
import os
import tempfile
import time
import uuid


def digest(value):
    return hashlib.sha256(json.dumps(value,sort_keys=True,ensure_ascii=True).encode('utf-8')).hexdigest()


def clean(value):
    return None if value is None or str(value).strip().lower() in ('','null','none') else str(value)


def normalized_path(value):
    return (value or '').replace('\\','/').rstrip('/').casefold()


def managed_backup_path(value):
    """Only our temporary backup folder can be an export-induced path alias."""
    folder=normalized_path(os.path.join(tempfile.gettempdir(),'CLO_AI_Backups'))
    candidate=normalized_path(value)
    return candidate.startswith(folder+'/') and candidate.endswith('.zprj')


def read_snapshot(pattern_api,utility_api):
    def read(wide,narrow):
        fn=getattr(utility_api,wide,None) or getattr(utility_api,narrow,None)
        return clean(fn()) if callable(fn) else None
    path=read('GetProjectFilePathW','GetProjectFilePath')
    name=read('GetProjectNameW','GetProjectName')
    parts=[]
    for i in range(pattern_api.GetPatternCount()):
        info=pattern_api.GetPatternInformation(i);info=json.loads(info) if isinstance(info,str) else info
        raw=pattern_api.GetPatternInputInformation(i);raw=json.loads(raw) if isinstance(raw,str) else raw
        for p in raw.get('Pattern InputInformation',[]):p.pop('Pattern index',None)
        points=[p for part in raw.get('Pattern InputInformation',[]) for p in part.get('PointList',[]) if 'Point positionX' in p]
        xs=[float(p['Point positionX']) for p in points];ys=[float(p['Point positionY']) for p in points]
        parts.append({'pattern_id':info['id'],'name':info.get('name','Деталь '+str(i+1)),
                      'fingerprint':digest(raw),'width_mm':max(xs)-min(xs) if xs else None,
                      'height_mm':max(ys)-min(ys) if ys else None})
    file_stamp=None
    if path:
        try:
            st=os.stat(path);file_stamp={'size':st.st_size,'mtime_ns':getattr(st,'st_mtime_ns',int(st.st_mtime*1e9))}
        except OSError:pass
    return {'available':True,'name':name or ('Новый проект' if not path else os.path.basename(path)),
            'path':path,'parts':parts,'file_stamp':file_stamp,
            'content_digest':digest(sorted(parts,key=lambda p:str(p['pattern_id'])))}


class ProjectObserver:
    def __init__(self,state=None):
        self.state=state or {'document_id':str(uuid.uuid4()),'generation':1,'revision':0,'snapshot':None}

    def observe(self,current,known_mutation=False):
        old=self.state.get('snapshot');boundary=old is None;reason='initial'
        current=dict(current)
        native_path=normalized_path(current.get('path'))
        alias=self.state.get('managed_path_alias')
        old_ids={str(p['pattern_id']) for p in old['parts']} if old else set()
        current_ids={str(p['pattern_id']) for p in current['parts']}
        alias_continues=native_path==alias and not (old_ids and current_ids and not old_ids & current_ids)
        # ExportZPrjW changes GetProjectFilePath/Name in CLO 7. A safety backup
        # is not Save As and must not replace the user's project association.
        # Retain the alias until an actual subsequent save/open changes the path.
        if old and managed_backup_path(current.get('path')) and (known_mutation or alias_continues):
            self.state['managed_path_alias']=native_path
            current.update(native_path=current.get('path'),native_name=current.get('name'),
                           managed_backup_path=current.get('path'),path=old.get('path'),
                           name=old.get('name'),file_stamp=old.get('file_stamp'))
        elif alias:
            self.state.pop('managed_path_alias',None)
        if old:
            old_path=normalized_path(old.get('path'))
            path=normalized_path(current.get('path'))
            old_ids={str(p['pattern_id']) for p in old['parts']};ids={str(p['pattern_id']) for p in current['parts']}
            same_objects=bool(old_ids & ids)
            reason='unchanged'
            if known_mutation:
                reason='content_changed'
            elif old_path!=path:
                if same_objects:reason='save_as'
                else:boundary=True;reason='document_changed'
            elif old_ids and ids and not same_objects:
                # A wholly replaced native object set can be reopening the same
                # file. Reset dialogue conservatively rather than mixing contexts.
                boundary=True;reason='document_replaced_or_all_parts_replaced'
            elif old_ids and not ids and not path:
                boundary=True;reason='unsaved_document_reset_or_all_parts_deleted'
            elif current['content_digest']!=old['content_digest']:reason='content_changed'
            elif current.get('file_stamp')!=old.get('file_stamp'):reason='saved'
        if boundary and old:
            self.state['document_id']=str(uuid.uuid4());self.state['generation']+=1
        if boundary or not old or current!=old:self.state['revision']+=1
        self.state['snapshot']=current
        return dict(current,document_id=self.state['document_id'],generation=self.state['generation'],
                    revision=self.state['revision'],event=reason,observed_at=time.time(),
                    identity_source='path_and_native_pattern_ids',lifecycle_events_available=False,
                    limitations=['API не предоставляет стабильный GUID документа и события открытия/закрытия',
                                 'Пустые несохранённые проекты неразличимы: сохраните каждый проект под отдельным именем .zprj',
                                 'После полной замены нативных ID привязки деталей требуют проверки; история сохранённого проекта сохраняется'])

    def guard(self,expected,current,active_session=None):
        if not expected or expected.get('document_id')!=current.get('document_id') or expected.get('generation')!=current.get('generation'):
            raise ValueError('Проект CLO сменился. Команда предыдущего проекта отменена')
        if expected.get('content_digest')!=current.get('content_digest'):
            raise ValueError('Содержимое проекта CLO изменилось после запроса. Подготовьте команду повторно')
        if active_session is not None and (active_session.get('document_id')!=current['document_id'] or active_session.get('context_session_id')!=expected.get('context_session_id')):
            raise ValueError('Диалог проекта сменился. Подготовленная ранее команда отменена')
