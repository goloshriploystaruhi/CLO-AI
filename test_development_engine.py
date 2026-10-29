import copy
import unittest
from qa_scenarios import fixture
from engineering.pipeline import build
from engineering.validation import validate


class DevelopmentTests(unittest.TestCase):
    def test_new_feature_is_constructed_checked_and_replayed_without_scaling_base(self):
        profile,p=fixture('workwear_zip_jacket_v1');before=copy.deepcopy(profile)
        base=build('workwear_zip_jacket_v1',profile,p)['garment']
        design={'version':1,'features':[dict(type='patch_pocket',host='front_right',width_mm=80,height_mm=100,y_mm=330)],'sources':['https://example.org/reviewed-source']}
        result=build(base['method'],profile,dict(p,development=design));g=result['garment']
        self.assertTrue(result['qa_report']['valid']);self.assertFalse(result['qa_report']['fit_verified'])
        self.assertEqual(len(g['pieces']),len(base['pieces'])+1)
        for a,b in zip(base['pieces'],g['pieces']):self.assertEqual(a['seam_contour'],b['seam_contour'])
        changed=build(base['method'],profile,dict(g['parameters'],length_mm=650),g)
        self.assertTrue(changed['qa_report']['valid']);self.assertEqual(g['id'],changed['garment']['id'])
        self.assertEqual([p['id'] for p in g['pieces']],[p['id'] for p in changed['garment']['pieces']])
        self.assertEqual(profile,before)
        tampered=copy.deepcopy(g);tampered['pieces'][-1]['seam_contour'][0]['end'][0]+=10
        self.assertFalse(validate(tampered)['valid'])

    def test_unsafe_unknown_code_and_duplicate_edge_connections_are_rejected(self):
        profile,p=fixture('workwear_zip_jacket_v1')
        for features in ([dict(type='run_python',code='print(1)')],
                         [dict(type='patch_pocket',host='back',width_mm=300,height_mm=400,y_mm=0)],
                         [dict(type='edge_panel',host='front_left',segments=[1],depth_mm=50)]):
            with self.subTest(features=features):
                with self.assertRaises(ValueError):build('workwear_zip_jacket_v1',profile,dict(p,development=dict(version=1,features=features)))

    def test_native_creation_manual_map_edit_and_undo_of_composed_geometry(self):
        from test_sewing_map import NativeLinesCLO
        from test_clo_updates import PropertiesCLO
        from clo_operations import dispatch,fingerprint
        from sewing_map import resolve_map
        class API(NativeLinesCLO,PropertiesCLO):pass
        profile,p=fixture('wide_trousers_experimental_v1')
        design=dict(version=1,features=[dict(type='cargo_pocket',host='front_left',width_mm=100,height_mm=120,y_mm=350,depth_mm=20,flap_mm=40)])
        job=build('wide_trousers_experimental_v1',profile,dict(p,development=design));self.assertTrue(job['qa_report']['valid'])
        api=API();api.CreatePatternWithPoints([(0,0,0),(10,0,0),(10,10,0),(0,10,0)]);other=fingerprint(api,0)
        result=dispatch(job,api,api);g=job['garment']
        bindings=[dict(id=p['id'],pattern_id=r['clo_pattern_id'],fingerprint=r['fingerprint']) for p,r in zip(g['pieces'],result['patterns'])]
        mapped=resolve_map(g,bindings,api);self.assertEqual(mapped['verified_count'],mapped['seam_count']);self.assertEqual(mapped['native_seams_created'],0)
        updated=build(g['method'],profile,dict(g['parameters'],hem_flat_mm=220),g)
        updated.update(previous_pieces=g['pieces'],confirmed_replacement=True,replace_targets=[dict(pattern_id=r['clo_pattern_id'],fingerprint=r['fingerprint']) for r in result['patterns']])
        new=dispatch(updated,api,api);self.assertLess(new['update_summary']['replaced'],len(g['pieces']));self.assertEqual(fingerprint(api,0),other)
        restored=build(g['method'],profile,g['parameters'],updated['garment']);self.assertTrue(restored['qa_report']['valid']);self.assertEqual(restored['garment']['parameters'],g['parameters'])


if __name__=='__main__':unittest.main()
