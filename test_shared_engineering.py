import copy
import json
import math
import unittest
from pathlib import Path
from engineering.pipeline import build
from engineering.validation import validate
from engineering.methods import registry,select
from engineering.measurements import normalize
from engineering.dependencies import DependencyGraph,plan
from engineering.geometry import length_interval,audit_piece
from engineering.quality import fingerprint,milestones
from qa_scenarios import fixture,property_cases,metrics


class SharedEngineeringTests(unittest.TestCase):
    def test_unit_conversion_preserves_profile_and_missing_values(self):
        p={'measurements':{'chest':{'value':96,'unit':'cm'},'biceps':{'value':12,'unit':'in'}}}
        before=copy.deepcopy(p);m,e=normalize(p,['chest','biceps','head'])
        self.assertEqual(m['measurements']['chest']['value'],960)
        self.assertAlmostEqual(m['measurements']['biceps']['value'],304.8)
        self.assertNotIn('head',m['measurements']);self.assertEqual(p,before);self.assertFalse(e)
        self.assertTrue(normalize({'measurements':{'chest':{'value':True,'unit':'mm'}}},['chest'])[1])

    def test_headwear_crown_is_above_headband_in_clo_coordinates(self):
        from clo_adapter import local_to_clo
        p,g=fixture('headwear_gore_v1');job=build('headwear_gore_v1',p,g)
        self.assertTrue(job['qa_report']['valid'])
        c=job['patterns'][0];apex=c['production']['seam_contour'][1]['end'];base=c['production']['seam_contour'][0]['start']
        self.assertGreater(local_to_clo(c,*apex)[1],local_to_clo(c,*base)[1])

    def test_dag_detects_cycles_and_traces_dependencies(self):
        with self.assertRaisesRegex(ValueError,'цикл'):DependencyGraph({'a':['b'],'b':['a']})
        self.assertEqual(DependencyGraph({'a':['b'],'b':['c']}).affected(['a']),['a','b','c'])
        p,g=fixture('tshirt_setin_engineering_v1');old=build('tshirt_setin_engineering_v1',p,g)['garment']
        result=plan(registry()[old['method']],dict(old['parameters'],armhole_ease_mm=20),old)
        self.assertIn('sleeve',result['affected']);self.assertIn('validation',result['affected'])

    def test_curve_length_error_bound_against_analytic_parabola(self):
        from contour_engine import Point,Segment
        c=Segment(Point(0,0),Point(100,100),Point(100/3,0),Point(200/3,100/3))
        exact=100*(math.sqrt(5)/2+math.asinh(2)/4)
        lo,hi=length_interval(c,.001)
        self.assertLessEqual(lo,exact);self.assertGreaterEqual(hi,exact);self.assertLessEqual(hi-lo,.002)

    def test_allowance_and_method_tampering_are_rejected(self):
        p,g=fixture('wide_trousers_experimental_v1');r=build('wide_trousers_experimental_v1',p,g);kit=r['garment']
        kit['pieces'][0]['cut_contour'][0]['start'][0]+=2
        self.assertFalse(validate(kit)['valid'])
        kit=r['garment'];kit['qa_report']['valid']=True
        self.assertFalse(validate(kit)['valid'])

    def test_all_registered_methods_share_gate_and_identifiable_knowledge(self):
        for key in registry():
            with self.subTest(method=key):
                p,g=fixture(key);r=build(key,p,g)
                self.assertIn('patterns',r,r.get('message'))
                report=r['qa_report'];self.assertTrue(report['valid'],report['issues'])
                self.assertEqual(report['method']['knowledge_id'],'clo_ai/'+key)
                self.assertFalse(report['method']['professional_standard_verified'])
                self.assertIn('FIT_REVIEW_REQUIRED',report['quality']['statuses'])
                self.assertNotIn('FIT_REVIEWED',report['quality']['statuses'])
                self.assertEqual(report['native_export']['status'],'not_measured')
        self.assertFalse(select('tshirt','tshirt_setin_engineering_v1','woven'))

    def test_property_cases_for_two_categories_and_multiple_bodies(self):
        count=0
        for key,p,g in property_cases():
            with self.subTest(method=key,parameters=g):
                r=build(key,p,g);self.assertTrue(r.get('qa_report',{}).get('valid'),r.get('message'))
                self.assertEqual(r['garment']['parameters']['length_mm'],g['length_mm'])
                self.assertFalse(r['qa_report']['fit_verified']);count+=1
        self.assertEqual(count,24)

    def test_distinct_seam_tolerances_and_stable_ids(self):
        p,g=fixture('wide_trousers_experimental_v1');r=build('wide_trousers_experimental_v1',p,g)
        links=r['qa_report']['assembly']['links'];self.assertGreaterEqual(len({s['tolerance_mm'] for s in links}),3)
        self.assertTrue(all(e['piece_id'] in {p['id'] for p in r['garment']['pieces']} for l in links for e in l['ends']))

    def test_manual_fit_evidence_is_bound_to_version_and_geometry(self):
        p,g=fixture('tshirt_setin_engineering_v1');kit=build('tshirt_setin_engineering_v1',p,g)['garment']
        review={'version':kit['version'],'geometry_fingerprint':fingerprint(kit),'method':'clo_3d','notes':'Фактическая проба с проверкой баланса на аватаре'}
        q=milestones(kit,True,True,True,review);self.assertIn('FIT_REVIEWED',q['statuses']);self.assertFalse(q['sewing_ready'])
        kit['version']+=1
        self.assertNotIn('FIT_REVIEWED',milestones(kit,True,True,True,review)['statuses'])

    def test_missing_measurements_are_not_estimated_by_qa(self):
        self.assertIn('needs_input',build('tshirt_setin_engineering_v1',{'id':'empty','measurements':{}},{}))
        p,g=fixture('wide_trousers_experimental_v1');p['measurements']['seated_depth']['value']=150
        r=build('wide_trousers_experimental_v1',p,g);self.assertTrue(r['qa_blocked']);self.assertNotIn('patterns',r)

    def test_create_failure_compensates_only_new_pieces(self):
        from test_clo_operations import FakeCLO
        from clo_operations import dispatch,fingerprint as native_fingerprint
        class Failing(FakeCLO):
            def GetLineLength(self,i,n):return super().GetLineLength(i,n)+(1 if i==2 and n==0 else 0)
        api=Failing();api.CreatePatternWithPoints([(0,0,0),(20,0,0),(20,20,0),(0,20,0)]);before=native_fingerprint(api,0)
        with self.assertRaises(RuntimeError) as ctx:dispatch({'patterns':[{'type':'rectangle','width_mm':100,'height_mm':100}]*2},api,api)
        self.assertEqual(api.GetPatternCount(),1);self.assertEqual(native_fingerprint(api,0),before)
        self.assertFalse(ctx.exception.transaction['requires_manual_recovery'])

    def test_unconfirmed_existing_geometry_cannot_be_deleted(self):
        from test_clo_operations import FakeCLO
        from clo_operations import dispatch,fingerprint as native_fingerprint
        api=FakeCLO();api.CreatePatternWithPoints([(0,0,0),(20,0,0),(20,20,0),(0,20,0)])
        with self.assertRaisesRegex(ValueError,'Подтвердите'):dispatch({'operation':'delete','targets':[{'pattern_id':100,'fingerprint':native_fingerprint(api,0)}]},api,api)
        self.assertEqual(api.GetPatternCount(),1)

    def test_frozen_numeric_regressions(self):
        golden=json.loads(Path('tests/engineering-golden.json').read_text(encoding='utf-8'))
        from engineering.validation import equivalent
        for key,expected in golden.items():
            p,g=fixture(key);actual=metrics(build(key,p,g)['garment'])
            self.assertTrue(equivalent(actual,expected,.002),key)
