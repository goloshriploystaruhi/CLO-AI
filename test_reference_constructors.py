import copy
import unittest
from qa_scenarios import fixture
from engineering.pipeline import build
from engineering.validation import validate
from garment_engine import deserialize
from reference_constructors import PANTS, JACKET, SUIT, audit


class ReferenceConstructionTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.cases = {}
        for method in (PANTS, JACKET, SUIT):
            profile, parameters = fixture(method)
            cls.cases[method] = (profile, parameters, build(method, profile, parameters))

    def garment(self, method):return self.cases[method][2]['garment']

    def pieces(self, garment):return {p['role']:p for p in garment['pieces']}

    def test_own_three_kits_pass_independent_qa_without_fit_or_brand_claim(self):
        for method, count in ((PANTS,21),(JACKET,24),(SUIT,23)):
            with self.subTest(method=method):
                r = self.cases[method][2]; self.assertTrue(r.get('qa_report',{}).get('valid'),r.get('message'))
                self.assertEqual(len(r['patterns']),count)
                self.assertFalse(r['qa_report']['fit_verified']); self.assertFalse(r['qa_report']['sewing_ready'])
                self.assertFalse(audit(r['garment']))
                self.assertTrue(all(not s['original_pattern_available'] for s in r['garment']['source_references']))
                self.assertTrue(all(link['passed'] for link in r['qa_report']['assembly']['links']))

    def test_balloon_hem_is_finished_width_after_darts_not_unfolded_outline(self):
        g=self.garment(PANTS)
        for p in g['pieces']:
            if not p['role'].startswith(('front_','back_')):continue
            c=deserialize(p['seam_contour'])
            self.assertAlmostEqual(c.segments[5].length(),310,places=6)
            self.assertAlmostEqual(p['dart_spec']['finished_hem_mm'],290,places=6)
            self.assertEqual(p['dart_spec']['intake_mm'],20)
            self.assertFalse(p['dart_spec']['native_dart'])
            self.assertLessEqual(len(c.segments),11)
        self.assertEqual(len([r for r in g['sewing_graph'] if 'нижняя вытачка' in r['type']]),4)

    def test_hem_edit_preserves_waist_hip_knee_levels_and_unrelated_parts(self):
        profile,_,_=self.cases[PANTS]; old=self.garment(PANTS)
        changed=build(PANTS,profile,dict(old['parameters'],hem_flat_mm=250),old)
        self.assertTrue(changed['qa_report']['valid'])
        before,after=self.pieces(old),self.pieces(changed['garment'])
        for role,p in before.items():
            q=after[role];self.assertEqual(p['id'],q['id'])
            if role.startswith(('front_','back_')):
                for n in (0,1,2,3,7,8):self.assertEqual(p['seam_contour'][n]['start'],q['seam_contour'][n]['start'])
                self.assertEqual(p['seam_contour'][0],q['seam_contour'][0])
            else:self.assertEqual(p['seam_contour'],q['seam_contour'])

    def test_cropped_and_regular_jacket_preserve_armholes_sleeves_and_collar(self):
        profile,_,_=self.cases[JACKET];old=self.garment(JACKET)
        for length in (520,700):
            with self.subTest(length=length):
                r=build(JACKET,profile,dict(old['parameters'],length_mm=length),old)
                self.assertTrue(r.get('qa_report',{}).get('valid'),r.get('message'))
                a,b=self.pieces(old),self.pieces(r['garment'])
                for role in ('sleeve_left','sleeve_right','collar_upper','collar_under','cuff_left','cuff_right'):
                    self.assertEqual(a[role]['seam_contour'],b[role]['seam_contour'])
                self.assertAlmostEqual(max(s['end'][1] for s in b['front_left']['seam_contour']),length)
                self.assertNotEqual(a['front_left']['internal_lines'],b['front_left']['internal_lines'])
                self.assertEqual(a['back']['seam_contour'][1:3],b['back']['seam_contour'][1:3])

    def test_women_suit_front_back_balance_consumes_side_length_as_real_dart(self):
        g=self.garment(SUIT);p=self.pieces(g)
        self.assertEqual(g['construction_lines']['front_length_mm'],480)
        self.assertEqual(g['construction_lines']['back_length_mm'],460)
        self.assertGreater(g['construction_lines']['dart_intake_mm'],0)
        for side in ('left','right'):
            front=deserialize(p['upper_front_'+side]['seam_contour']);back=deserialize(p['upper_back']['seam_contour'])
            self.assertAlmostEqual(sum(front.segments[i].length() for i in (4,6)),sum(back.segments[i].length() for i in ([3,4] if side=='right' else [7,8])),places=5)
            self.assertEqual(p['upper_front_'+side]['internal_line_kinds'],['dart_leg','dart_leg'])
        self.assertEqual(len([r for r in g['sewing_graph'] if 'нагрудная вытачка' in r['type']]),2)

    def test_torso_ease_edit_does_not_scale_any_lower_piece(self):
        profile,_,_=self.cases[SUIT];old=self.garment(SUIT)
        r=build(SUIT,profile,dict(old['parameters'],torso_ease_mm=60),old)
        self.assertTrue(r.get('qa_report',{}).get('valid'),r.get('message'))
        a,b=self.pieces(old),self.pieces(r['garment'])
        for role,p in a.items():
            if not role.startswith('upper_'):self.assertEqual(p['seam_contour'],b[role]['seam_contour'])
        self.assertEqual(r['garment']['construction_lines']['front_length_mm'],500)
        self.assertIn('waist_join',r['garment']['dependency_plan']['affected'])

    def test_reject_invalid_values_parameters_and_unsafe_geometry_without_profile_mutation(self):
        for method in (PANTS,JACKET,SUIT):
            profile,params,_=self.cases[method];before=copy.deepcopy(profile)
            for extra in ({'code':'eval()'},{'length_mm':float('nan')},{'length_mm':True},{'material':{'url':'remote-code'}}):
                with self.subTest(method=method,extra=extra):
                    with self.assertRaises(ValueError):build(method,profile,dict(params,**extra))
            self.assertEqual(profile,before)
            self.assertIn('needs_input',build(method,{'id':'empty','measurements':{}},{}))
        p,g,_=self.cases[SUIT]
        with self.assertRaisesRegex(ValueError,'waist_drop'):build(SUIT,p,dict(g,waist_drop_mm=20))
        p,g,_=self.cases[JACKET]
        with self.assertRaises(ValueError):build(JACKET,p,dict(g,back_neck_depth_mm=15,seam_allowance_mm=15))

    def test_modified_dart_and_pocket_guides_cannot_pass_saved_success_flags(self):
        for method,role in ((PANTS,'front_left'),(SUIT,'upper_front_left'),(JACKET,'front_left')):
            g=copy.deepcopy(self.garment(method));p=self.pieces(g)[role]
            p['internal_lines'][0][0][0]+=25
            self.assertFalse(validate(g)['valid'])

    def test_native_adapter_create_selective_edit_undo_and_map_preserve_existing_project(self):
        from test_sewing_map import NativeLinesCLO
        from test_clo_updates import PropertiesCLO
        from clo_operations import dispatch,fingerprint
        from sewing_map import resolve_map
        class NativeReferenceCLO(NativeLinesCLO,PropertiesCLO):pass
        for method,parameter,value in ((PANTS,'hem_flat_mm',250),(JACKET,'length_mm',520),(SUIT,'torso_ease_mm',60)):
            with self.subTest(method=method):
                profile,_,initial=self.cases[method];job=copy.deepcopy(initial);api=NativeReferenceCLO()
                api.CreatePatternWithPoints([(0,0,0),(100,0,0),(100,100,0),(0,100,0)])
                original=fingerprint(api,0);first=dispatch(job,api,api)
                targets=[dict(id=p['id'],pattern_id=r['clo_pattern_id'],fingerprint=r['fingerprint']) for p,r in zip(job['garment']['pieces'],first['patterns'])]
                mapped=resolve_map(job['garment'],targets,api)
                self.assertEqual(mapped['verified_count'],mapped['seam_count'])
                self.assertEqual(mapped['native_seams_created'],0)
                self.assertEqual(first['qa_report']['native_export']['status'],'measured')
                old=job['garment'];changed=build(method,profile,dict(old['parameters'],**{parameter:value}),old)
                def apply(new,prev,result):
                    new.update(previous_pieces=prev['garment']['pieces'],confirmed_replacement=True,
                               replace_targets=[dict(pattern_id=r['clo_pattern_id'],fingerprint=r['fingerprint']) for r in result['patterns']])
                    return dispatch(new,api,api)
                updated=apply(changed,job,first)
                self.assertLess(updated['update_summary']['replaced'],len(old['pieces']))
                restored=build(method,profile,old['parameters'],changed['garment']);final=apply(restored,changed,updated)
                self.assertEqual(api.GetPatternCount(),len(old['pieces'])+1);self.assertEqual(fingerprint(api,0),original)
                self.assertEqual(restored['garment']['parameters'],old['parameters'])


if __name__=='__main__':unittest.main()
