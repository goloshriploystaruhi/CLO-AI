import unittest
from garment_engine import construct,requirements,deserialize
class GarmentTests(unittest.TestCase):
    def setUp(self):
        self.profile={'id':'test-person','measurements':{k:{'value':v,'unit':'mm','status':'verified'} for k,v in {'garment_waist_girth':840,'hips':1000,'waist_hip_length':210,'seated_depth':310,'waist_knee':620}.items()}}
        self.parameters={'length_mm':1050,'waist_drop_mm':20,'hip_ease_mm':160,'waist_ease_mm':20,'knee_flat_mm':280,'hem_flat_mm':240}
    def test_missing_measurements_are_not_invented(self):
        result=construct({'id':'empty','measurements':{}},self.parameters)
        self.assertIn('hips',result['needs_input']['missing_measurements'])
    def test_full_set_and_sewing_graph(self):
        result=construct(self.profile,self.parameters);g=result['garment']
        self.assertEqual(len(g['pieces']),21)
        self.assertTrue(g['readiness']['geometry']);self.assertFalse(g['readiness']['sewing_ready'])
        self.assertGreater(len(g['sewing_graph']),15)
        for p in g['pieces']:
            self.assertNotEqual(p['seam_contour'],p['cut_contour'])
            deserialize(p['cut_contour']).clo_points()
            self.assertTrue(p['grainline'])
    def test_edit_preserves_identity_and_snapshot(self):
        old=construct(self.profile,self.parameters)['garment']
        updated=construct(self.profile,dict(self.parameters,hip_ease_mm=200),old)['garment']
        self.assertEqual(old['id'],updated['id']);self.assertEqual(updated['version'],2)
        self.assertEqual([p['id'] for p in old['pieces']],[p['id'] for p in updated['pieces']])
        self.profile['measurements']['hips']['value']=1200
        self.assertEqual(old['measurement_snapshot']['hips']['value'],1000)
    def test_graph_has_no_isolated_details(self):
        from garment_engine import validate_garment
        g=construct(self.profile,self.parameters)['garment']
        self.assertEqual(validate_garment(g)['connected_parts'],21)
        g['sewing_graph']=[r for r in g['sewing_graph'] if r['a']['piece']!=20 and r['b']['piece']!=20]
        with self.assertRaisesRegex(ValueError,'без связи'):validate_garment(g)
