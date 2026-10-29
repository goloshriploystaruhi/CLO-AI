"""Exercise bridge dispatch without loading the native CLO runtime or a UI."""
import ast
import copy
import json
import os
from pathlib import Path
import tempfile
import time
import types
import unittest


def bridge_methods():
    tree=ast.parse(Path('clo_bridge.py').read_text(encoding='utf-8'))
    constants=next(n for n in tree.body if isinstance(n,ast.Assign) and any(isinstance(t,ast.Name) and t.id=='NATIVE_OPERATIONS' for t in n.targets))
    bridge=next(n for n in tree.body if isinstance(n,ast.ClassDef) and n.name=='Bridge')
    methods=[n for n in bridge.body if isinstance(n,ast.FunctionDef) and n.name in ('tick','publish_state')]
    scope={'os':os,'json':json,'time':time,'pattern_api':object(),'export_api':object(),'utility_api':object()}
    exec(compile(ast.Module(body=[constants]+methods,type_ignores=[]),'bridge-lifecycle-under-test','exec'),scope)
    return scope


class BridgeLifecycleTests(unittest.TestCase):
    def exercise(self,operation,fail=False):
        scope=bridge_methods();writes=[];samples=[]
        with tempfile.TemporaryDirectory(dir=Path('research').resolve()) as directory:
            job={'id':'bounded-operation','session':'same-bridge','operation':operation,'project_guard':{'document_id':'doc','generation':1}}
            Path(directory,'clo_ai_apply.json').write_text(json.dumps(job))
            Path(directory,'clo_ai_context_session.json').write_text('{}')
            before={'available':True,'document_id':'doc','generation':1,'parts':[]}
            instance=types.SimpleNamespace(root=directory,session='same-bridge',seen=set(),running=False,
                revision=None,update_error=None,project_refresh_nonce=None,project_snapshot=before,
                read_revision=lambda:None,research_probe=lambda:None,
                project_observer=types.SimpleNamespace(guard=lambda *args:None))
            def sample_project(**kwargs):
                samples.append(kwargs)
                instance.project_snapshot=dict(before,parts=[{'pattern_id':1}] if kwargs.get('known_mutation') else [])
                return instance.project_snapshot
            instance.sample_project=sample_project
            instance.write=lambda name,data:writes.append((name,copy.deepcopy(data)))
            instance.publish_state=types.MethodType(scope['publish_state'],instance)
            def dispatch(*args):
                live=writes[-1][1]
                self.assertEqual(live['native_busy']['operation'],operation)
                self.assertEqual(live['native_busy']['job_id'],job['id'])
                self.assertEqual(live['native_busy']['pid'],os.getpid())
                self.assertEqual(live['project']['document_id'],'doc')
                if fail:raise ValueError('Тестовая ошибка операции')
                return {'patterns':[{'pattern_id':1}]}
            scope['clo_operations']=types.SimpleNamespace(dispatch=dispatch)
            scope['tick'](instance)
            state=[data for name,data in writes if name=='clo_ai_bridge.json'][-1]
            result=[data for name,data in writes if name=='clo_ai_job_result.json'][-1]
            self.assertNotIn('native_busy',state);self.assertEqual(state['pid'],os.getpid())
            self.assertEqual(state['session'],'same-bridge');self.assertEqual(state['project']['parts'],[{'pattern_id':1}])
            self.assertEqual(samples[-1],{'force':True,'known_mutation':True})
            self.assertEqual(result['project_snapshot'],state['project'])
            self.assertEqual('error' in result,fail);self.assertFalse(instance.running)
            # A failed native call must not be retried by the timer either.
            previous=len([n for n,d in writes if n=='clo_ai_job_result.json'])
            scope['tick'](instance)
            self.assertEqual(len([n for n,d in writes if n=='clo_ai_job_result.json']),previous)

    def test_creation_backup_qa_and_simulation_publish_and_clear_busy(self):
        for operation in ('create','qa_measure','delete','simulate_confirmed'):
            with self.subTest(operation=operation):self.exercise(operation)

    def test_native_failure_clears_busy_and_keeps_readback_without_retry(self):
        self.exercise('create',fail=True)
