import unittest
import test_garment_engine as fixtures
from test_clo_operations import FakeCLO
from garment_engine import construct
from clo_operations import dispatch,fingerprint
class GarmentIntegrationTests(unittest.TestCase):
    def test_current_project_create_then_update_without_duplicates(self):
        fixture=fixtures.GarmentTests();fixture.setUp();api=FakeCLO()
        api.CreatePatternWithPoints([(0,0,0),(100,0,0),(100,100,0),(0,100,0)]);unchanged=fingerprint(api,0)
        built=construct(fixture.profile,fixture.parameters)
        result=dispatch(built,api,api)
        self.assertEqual(api.GetPatternCount(),22)
        self.assertEqual(len(result['patterns']),21)
        updated=construct(fixture.profile,dict(fixture.parameters,hem_flat_mm=220),built['garment'])
        updated['replace_targets']=[{'pattern_id':p['clo_pattern_id'],'fingerprint':p['fingerprint']} for p in result['patterns']]
        updated['confirmed_replacement']=True
        second=dispatch(updated,api,api)
        self.assertEqual(api.GetPatternCount(),22)
        self.assertEqual(fingerprint(api,0),unchanged)
        self.assertEqual(len(second['patterns']),21)
