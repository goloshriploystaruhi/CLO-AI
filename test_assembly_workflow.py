import copy
import unittest
from unittest.mock import patch
from qa_scenarios import fixture
from engineering.pipeline import build
from engineering.assembly import audit
from clo_operations import dispatch
from assembly_workflow import inspect,simulate
from test_clo_operations import FakeCLO


class AssemblyTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        p,g=fixture('tshirt_setin_engineering_v1');cls.job=build('tshirt_setin_engineering_v1',p,g)

    def setup_scene(self):
        api=FakeCLO();result=dispatch(copy.deepcopy(self.job),api,api)
        targets=[{'id':p['id'],'pattern_id':r['clo_pattern_id'],'fingerprint':r['fingerprint']} for p,r in zip(self.job['garment']['pieces'],result['patterns'])]
        class Utility:
            calls=[]
            def Simulate(self,n):self.calls.append(n);return True
        utility=Utility();utility.calls=[];api.GetAvatarCount=lambda:1
        return api,targets,utility

    def test_preflight_reports_real_limits_without_creating_seams_or_simulating(self):
        api,targets,u=self.setup_scene();before=copy.deepcopy(api.pieces)
        r=inspect(self.job['garment'],targets,api,api,u)
        self.assertEqual(r['status'],'unavailable');self.assertTrue(r['connections_valid'])
        self.assertEqual(r['native_seams_created'],0);self.assertEqual(r['placed_parts'],0);self.assertEqual(u.calls,[]);self.assertEqual(before,api.pieces)
        self.assertFalse(r['capabilities']['automatic_sewing_supported'])

    def test_missing_piece_and_external_geometry_change_stop_preflight(self):
        api,targets,u=self.setup_scene()
        with self.assertRaisesRegex(ValueError,'Неполный'):inspect(self.job['garment'],targets[:-1],api,api,u)
        api.pieces[0]['points'][0]=(99,99,0)
        with self.assertRaisesRegex(ValueError,'изменена'):inspect(self.job['garment'],targets,api,api,u)

    def test_duplicate_seams_and_missing_control_marks_are_rejected(self):
        g=copy.deepcopy(self.job['garment']);duplicate=copy.deepcopy(g['sewing_graph'][0]);duplicate['id']='duplicate';g['sewing_graph'].append(duplicate)
        self.assertFalse(audit(g)['valid'])
        g=copy.deepcopy(self.job['garment']);g['pieces'][0]['notches']=[];self.assertFalse(audit(g)['valid'])

    def test_simulation_needs_consent_avatar_backup_and_true_native_result(self):
        api,targets,u=self.setup_scene();job={'garment':self.job['garment'],'targets':targets,'simulation_steps':100}
        with self.assertRaisesRegex(ValueError,'Подтвердите'):simulate(job,api,api,u)
        job.update(confirmed_simulation=True,manual_scene_confirmed=True);api.GetAvatarCount=lambda:0
        with self.assertRaisesRegex(ValueError,'аватар'):simulate(job,api,api,u)
        self.assertEqual(u.calls,[]);api.GetAvatarCount=lambda:1
        r=simulate(job,api,api,u);self.assertEqual(u.calls,[100]);self.assertEqual(r['simulation_status'],'steps_completed');self.assertEqual(r['native_seams_created'],0)
        u.Simulate=lambda steps:False;r=simulate(job,api,api,u);self.assertEqual(r['simulation_status'],'unconfirmed')

    def test_backup_failure_and_simulation_exception_do_not_trigger_retry(self):
        api,targets,u=self.setup_scene();job={'operation':'simulate_confirmed','garment':self.job['garment'],'targets':targets,'simulation_steps':100,'confirmed_simulation':True,'manual_scene_confirmed':True}
        with patch.object(api,'ExportZPrjW',return_value=''):
            with self.assertRaisesRegex(ValueError,'резервную'):dispatch(job,api,api,u)
        self.assertEqual(u.calls,[])
        def fail(n):u.calls.append(n);raise RuntimeError('Native simulation error')
        u.Simulate=fail
        with self.assertRaises(RuntimeError) as ctx:dispatch(job,api,api,u)
        self.assertEqual(u.calls,[100]);self.assertTrue(ctx.exception.transaction['requires_manual_recovery'])
