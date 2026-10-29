"""Factual execution telemetry. Python 3.7; no geometry or authorization changes."""
import json
import os
import sys
import tempfile
import time

_active=None


def begin(job,worker=False):
    global _active
    context=job.get('event_context') or job.get('project_ticket') or job.get('project_guard') or {}
    identity=job.get('id') or context.get('operation_id')
    _active={'operation_id':identity,'project_id':context.get('project_id') or context.get('document_id'),
             'session_id':context.get('session_id') or context.get('context_session_id'),
             'events':[],'worker':worker} if identity else None


def emit(action,object_name,status,description,result=None):
    if not _active:return
    event={'id':str(_active['operation_id'])+(':'+'engine' if _active['worker'] else ':clo')+':'+str(len(_active['events'])+1),
           'operation_id':_active['operation_id'],'project_id':_active['project_id'],
           'action':action,'object':object_name,'status':status,'description':description,
           'result':result,'at':time.time()}
    _active['events'].append(event)
    try:
        if _active['worker']:
            sys.stderr.write('CLOAI_EVENT:'+json.dumps(event,ensure_ascii=True)+'\n');sys.stderr.flush()
        elif _active['project_id']:
            path=os.path.join(tempfile.gettempdir(),'clo_ai_progress.json')
            with open(path+'.tmp','w',encoding='utf-8') as stream:json.dump(_active,stream,ensure_ascii=True)
            os.replace(path+'.tmp',path)
    except (OSError,ValueError):pass # Telemetry failure must not change the transaction.


def events():return list(_active['events']) if _active else []


def end():
    global _active
    _active=None
