import copy
import math
import unittest
from qa_scenarios import fixture
from engineering.pipeline import build
from engineering.validation import validate
from engineering.assembly import audit
from garment_engine import deserialize
from utility_constructors import balanced_pair,pocket_placement
from parametric_patterns import TrouserPanel,TrouserParameters

PAIRS=[('trousers_utility_v1','wide_trousers_experimental_v1',27),
       ('jacket_utility_v1','jacket_stand_v1',16),('jumpsuit_utility_v1','jumpsuit_work_v1',26)]


class UtilityTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.kits={}
        for key,base,count in PAIRS:
            p,g=fixture(base);cls.kits[key]=(p,g,build(key,p,g))

    def test_all_three_are_real_valid_kits_with_distinct_parts_and_no_fit_claim(self):
        for key,base,count in PAIRS:
            with self.subTest(method=key):
                p,g,r=self.kits[key]
                self.assertEqual(len(r['patterns']),count)
                self.assertTrue(r['qa_report']['valid'],r.get('message'))
                self.assertTrue(audit(r['garment'])['valid'])
                self.assertFalse(r['qa_report']['fit_verified']);self.assertFalse(r['qa_report']['sewing_ready'])
                roles={p['role'] for p in r['garment']['pieces']}
                self.assertTrue({'cargo_left','cargo_left_gusset','cargo_left_flap','cargo_right_gusset'}<=roles)
                self.assertEqual(len(r['garment']['measurement_snapshot']),len(p['measurements'].keys() & set(r['garment']['method_spec']['required_measurements'])))

    def test_pocket_strip_lengths_directions_and_host_footprints(self):
        from engineering.geometry import inside
        for key,_,_ in PAIRS:
            g=self.kits[key][2]['garment'];p=g['parameters'];expected=2*p['utility_pocket_height_mm']+p['utility_pocket_width_mm']
            added=[r for r in g['sewing_graph'] if r['type']=='притачивание стенки кармана']
            self.assertEqual(len(added),2)
            for r in added:
                a,b=r['a'],r['b'];self.assertEqual(r['direction'],'reverse')
                strip=deserialize(g['pieces'][a['piece']]['seam_contour'])
                self.assertAlmostEqual(sum(strip.segments[i].length() for i in a['segments']),expected,places=6)
                host=g['pieces'][b['piece']];poly=[(x,y) for x,y,_ in deserialize(host['seam_contour']).clo_points(.05)]
                line=host['internal_lines'][b['internal_line']]
                self.assertTrue(all(inside(p,poly) for p in line))
                self.assertEqual(len(line),4)
        jacket=self.kits['jacket_utility_v1'][2]['garment']
        for piece in jacket['pieces']:
            if piece['role'] in ('front_left','front_right'):self.assertEqual(len(piece['internal_lines']),2,'Old patch-pocket footprints must not remain on utility fronts')
            if piece['role'].endswith('_flap'):self.assertEqual(piece['internal_line_kinds'],['fold'])

    def test_crotch_pair_preserves_landmarks_and_matches_inseams(self):
        params=TrouserParameters(1050,290,280,240,290,600,180,215,46.4)
        base=TrouserPanel(params);f,b=balanced_pair(base,46.4,49.3)
        self.assertNotEqual(f.segments[8],b.segments[8])
        self.assertAlmostEqual(f.segments[7].length(),b.segments[7].length(),delta=.005)
        for contour in (f,b):
            self.assertEqual(contour.segments[5],base.contour().segments[5])
            self.assertEqual(contour.segments[7].start,base.contour().segments[7].start)
            self.assertEqual(contour.segments[0],base.contour().segments[0])
        with self.assertRaisesRegex(ValueError,'половинки|согласовать'):
            balanced_pair(base,35,55)

    def test_straight_tapered_and_flared_widths_are_independent_not_scaling(self):
        p,g,_=self.kits['trousers_utility_v1']
        for knee,hem in ((260,260),(240,180),(230,330)):
            r=build('trousers_utility_v1',p,dict(g,knee_flat_mm=knee,hem_flat_mm=hem))
            self.assertTrue(r['qa_report']['valid'],r.get('message'))
            panel=r['garment']['pieces'][0];c=deserialize(panel['seam_contour'])
            self.assertAlmostEqual(c.segments[5].length(),hem)
            self.assertAlmostEqual(c.segments[4].start.x-c.segments[7].start.x,knee)
            self.assertEqual(c.segments[5].start.y,g['length_mm'])

    def test_torso_ease_changes_upper_length_without_scaling_legs(self):
        p,g,original=self.kits['jumpsuit_utility_v1']
        changed=build('jumpsuit_utility_v1',p,dict(original['garment']['parameters'],torso_ease_mm=60),original['garment'])
        self.assertTrue(changed['qa_report']['valid'],changed.get('message'))
        before={p['role']:p for p in original['garment']['pieces']};after={p['role']:p for p in changed['garment']['pieces']}
        for role in ('front_left','back_left','front_right','back_right','cargo_left','upper_sleeve_0'):
            self.assertEqual(before[role]['id'],after[role]['id'])
            self.assertEqual(before[role]['seam_contour'],after[role]['seam_contour'])
        self.assertNotEqual(before['upper_front_left']['seam_contour'],after['upper_front_left']['seam_contour'])
        self.assertEqual(changed['garment']['construction_lines']['effective_torso_length_mm'],g['torso_length_mm']+60)
        self.assertIn('waist_join',changed['garment']['dependency_plan']['affected'])

    def test_invalid_pockets_and_extra_fields_never_create_geometry(self):
        for key,_,_ in PAIRS:
            p,g,_=self.kits[key]
            for invalid in ({'utility_pocket_width_mm':300},{'utility_pocket_y_mm':0},{'utility_pocket_depth_mm':float('nan')},{'utility_pocket_depth_mm':True},{'front_crotch_extension_mm':-1},{'code':'run()'}):
                with self.subTest(method=key,invalid=invalid):
                    with self.assertRaises(ValueError):build(key,p,dict(g,**invalid))
        p,g,_=self.kits['jacket_utility_v1']
        with self.assertRaisesRegex(ValueError,'не поддерживаются'):build('jacket_utility_v1',p,dict(g,torso_ease_mm=30))

    def test_missing_measurements_are_not_filled_and_original_profiles_untouched(self):
        for key,_,_ in PAIRS:
            p,g,_=self.kits[key];before=copy.deepcopy(p)
            result=build(key,{'id':'missing','measurements':{}},{})
            self.assertIn('needs_input',result);self.assertNotIn('patterns',result)
            self.assertEqual(p,before)

    def test_host_or_pocket_tampering_is_rejected_by_independent_qa(self):
        g=copy.deepcopy(self.kits['jacket_utility_v1'][2]['garment'])
        seam=next(r for r in g['sewing_graph'] if r['type']=='притачивание стенки кармана')
        line=g['pieces'][seam['b']['piece']]['internal_lines'][seam['b']['internal_line']]
        line[0][0]+=10
        self.assertFalse(validate(g)['valid'])

    def test_pocket_depth_edit_preserves_hosts_and_changes_only_gussets(self):
        p,g,r=self.kits['jacket_utility_v1'];old=r['garment']
        changed=build('jacket_utility_v1',p,dict(old['parameters'],utility_pocket_depth_mm=40),old)
        self.assertTrue(changed['qa_report']['valid'])
        before={p['role']:p for p in old['pieces']};after={p['role']:p for p in changed['garment']['pieces']}
        changed_roles={role for role in before if before[role]['seam_contour']!=after[role]['seam_contour']}
        self.assertEqual(changed_roles,{'cargo_left_gusset','cargo_right_gusset'})
        self.assertEqual({p['id'] for p in old['pieces']},{p['id'] for p in changed['garment']['pieces']})
        self.assertIn('pockets',changed['garment']['dependency_plan']['affected'])

    def test_mock_clo_create_map_edit_and_undo_preserve_unrelated_native_details(self):
        from test_sewing_map import NativeLinesCLO
        from test_clo_updates import PropertiesCLO
        from clo_operations import dispatch,fingerprint
        from sewing_map import resolve_map
        class NativeUtilityCLO(NativeLinesCLO,PropertiesCLO):pass
        for key,_,_ in PAIRS:
            with self.subTest(method=key):
                p,g,job=self.kits[key];api=NativeUtilityCLO()
                api.CreatePatternWithPoints([(0,0,0),(100,0,0),(100,100,0),(0,100,0)])
                other=fingerprint(api,0);first=dispatch(job,api,api)
                targets=[dict(id=p['id'],pattern_id=r['clo_pattern_id'],fingerprint=r['fingerprint']) for p,r in zip(job['garment']['pieces'],first['patterns'])]
                mapped=resolve_map(job['garment'],targets,api)
                self.assertEqual(mapped['verified_count'],mapped['seam_count'])
                self.assertEqual(first['qa_report']['native_export']['status'],'measured')
                self.assertEqual(mapped['native_seams_created'],0)
                old=job['garment'];changed=build(key,p,dict(old['parameters'],utility_pocket_depth_mm=40),old)
                def replacement(new,previous,result):
                    new.update(previous_pieces=previous['garment']['pieces'],confirmed_replacement=True,
                               replace_targets=[dict(pattern_id=r['clo_pattern_id'],fingerprint=r['fingerprint']) for r in result['patterns']])
                    return dispatch(new,api,api)
                updated=replacement(changed,job,first)
                self.assertEqual(updated['update_summary']['replaced'],2)
                for piece,a,b in zip(old['pieces'],first['patterns'],updated['patterns']):
                    if not piece['role'].endswith('_gusset'):self.assertEqual(a['clo_pattern_id'],b['clo_pattern_id'])
                restored=build(key,p,old['parameters'],changed['garment'])
                final=replacement(restored,changed,updated)
                self.assertEqual(final['update_summary']['replaced'],2)
                self.assertEqual(api.GetPatternCount(),len(old['pieces'])+1)
                self.assertEqual(fingerprint(api,0),other)
                self.assertEqual(restored['garment']['parameters'],old['parameters'])


if __name__=='__main__':unittest.main()
