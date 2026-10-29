import contextlib
import io
import json
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch
import operation_events
from clo_operations import dispatch
from test_clo_operations import FakeCLO


@contextlib.contextmanager
def workspace_folder():
    root=Path(__file__).resolve().parent/'research'
    folder=Path(tempfile.mkdtemp(prefix='execution-events-',dir=str(root))).resolve()
    assert folder.is_relative_to(root.resolve())
    yield str(folder)


class EventTests(unittest.TestCase):
    def tearDown(self):operation_events.end()

    def test_worker_and_native_events_have_distinct_ids_and_project_identity(self):
        job={'id':'operation','project_ticket':{'project_id':'project','session_id':'dialogue'}}
        buffer=io.StringIO()
        with contextlib.redirect_stderr(buffer):
            operation_events.begin(job,worker=True)
            operation_events.emit('validation','Мерки','running','Проверяю мерки')
        worker=json.loads(buffer.getvalue().removeprefix('CLOAI_EVENT:'))
        with workspace_folder() as folder,patch('operation_events.tempfile.gettempdir',return_value=folder):
            operation_events.begin(job)
            operation_events.emit('construction','Перед','verified','Перед подтверждён')
            native=json.loads((Path(folder)/'clo_ai_progress.json').read_text())['events'][0]
        self.assertNotEqual(worker['id'],native['id'])
        for event in (worker,native):
            self.assertEqual(event['operation_id'],'operation');self.assertEqual(event['project_id'],'project')
            self.assertTrue({'action','object','status','description','result'}<=set(event))

    def test_adapter_reports_only_actual_created_parts_and_verified_result(self):
        job={'id':'create','project_ticket':{'project_id':'test','session_id':'s'},'patterns':[{'type':'rectangle','name':'Перед','width_mm':100,'height_mm':200}]}
        api=FakeCLO()
        with workspace_folder() as folder,patch('operation_events.tempfile.gettempdir',return_value=folder):
            result=dispatch(job,api,api)
        events=result['execution_events'];self.assertEqual(api.GetPatternCount(),1)
        self.assertTrue(any(e['object']=='Перед' and e['status']=='verified' for e in events))
        self.assertFalse(any('рукав' in e['description'].lower() for e in events))
        self.assertEqual(events[-1]['status'],'verified')

    def test_failure_has_no_overall_success_and_telemetry_io_never_breaks_creation(self):
        class Failing(FakeCLO):
            def CreatePatternWithPoints(self,points):raise ValueError('Тестовый отказ')
        job={'id':'failure','project_ticket':{'project_id':'p','session_id':'s'},'patterns':[{'type':'rectangle','width_mm':100,'height_mm':200}]}
        with workspace_folder() as folder,patch('operation_events.tempfile.gettempdir',return_value=folder):
            with self.assertRaises(RuntimeError) as caught:dispatch(job,Failing(),Failing())
            self.assertEqual(caught.exception.execution_events[-1]['status'],'failed')
            api=FakeCLO()
            with patch('operation_events.os.replace',side_effect=OSError('Диск недоступен')):
                self.assertEqual(len(dispatch(job,api,api)['patterns']),1)
        self.assertEqual(api.GetPatternCount(),1)


if __name__=='__main__':unittest.main()
