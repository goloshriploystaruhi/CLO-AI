import copy
import unittest

from tshirt_engine import construct, validate_engineering, METHOD
from garment_engine import deserialize


def fixture():
    measurements = dict(chest=960, shoulder_width=400, chest_width=340, back_width=380,
                        armhole_depth=240, biceps=300, head=570)
    profile = {'id': 'engineering-test', 'measurements': {k: {'value': v, 'unit': 'mm', 'status': 'verified'} for k, v in measurements.items()}}
    params = dict(length_mm=700, chest_ease_mm=100, hem_circumference_mm=1060,
                  sleeve_length_mm=240, cuff_circumference_mm=340, neck_width_mm=190,
                  front_neck_depth_mm=110, back_neck_depth_mm=30, shoulder_drop_mm=30,
                  biceps_ease_mm=70, armhole_ease_mm=10, rib_stretch_percent=60,
                  rib_recovery_percent=95, rib_application_extension_percent=15,
                  body_stretch_percent=40)
    return profile, params


class TshirtEngineeringTests(unittest.TestCase):
    def setUp(self):
        self.profile, self.params = fixture()

    def test_curved_armholes_asymmetric_cap_and_exact_seams(self):
        g=construct(self.profile,self.params)['garment']
        self.assertTrue(g['engineering_report']['valid'])
        self.assertEqual(len(g['pieces']),5)
        self.assertNotEqual(g['derived']['front_armhole_mm'],g['derived']['back_armhole_mm'])
        self.assertNotEqual(g['derived']['front_cap_span_mm'],g['derived']['back_cap_span_mm'])
        self.assertGreater(g['derived']['cap_height_mm'],50)
        for p in g['pieces'][:4]:
            self.assertTrue(any('c1' in s for s in p['seam_contour']))
            self.assertLessEqual(len(p['seam_contour']),11)
        for seam in g['engineering_report']['seams']:
            self.assertLess(abs(seam['residual_mm']),.01,seam)
        self.assertFalse(g['readiness']['sewing_ready'])
        self.assertFalse(g['engineering_report']['fit_verified'])
        # The two armhole segments are exact subdivisions, with continuous curvature.
        for p in g['pieces'][:2]:
            c=deserialize(p['seam_contour'])
            a,b=c.segments[1:3]
            def curvature(s,end):
                if end:
                    dx,dy=3*(s.end.x-s.c2.x),3*(s.end.y-s.c2.y)
                    ddx,ddy=6*(s.end.x-2*s.c2.x+s.c1.x),6*(s.end.y-2*s.c2.y+s.c1.y)
                else:
                    dx,dy=3*(s.c1.x-s.start.x),3*(s.c1.y-s.start.y)
                    ddx,ddy=6*(s.c2.x-2*s.c1.x+s.start.x),6*(s.c2.y-2*s.c1.y+s.start.y)
                return (dx*ddy-dy*ddx)/(dx*dx+dy*dy)**1.5
            self.assertAlmostEqual(curvature(a,True),curvature(b,False),places=10)

    def test_length_change_preserves_armhole_sleeve_and_neckband(self):
        a=construct(self.profile,self.params)['garment']
        b=construct(self.profile,dict(self.params,length_mm=760),a)['garment']
        self.assertEqual(a['id'],b['id']);self.assertEqual(b['version'],2)
        self.assertEqual([p['id'] for p in a['pieces']],[p['id'] for p in b['pieces']])
        for i in (2,3,4):self.assertEqual(a['pieces'][i]['seam_contour'],b['pieces'][i]['seam_contour'])
        for key in ('front_armhole_mm','back_armhole_mm','cap_height_mm','neckband_length_mm'):
            self.assertEqual(a['derived'][key],b['derived'][key])

    def test_shoulders_depth_and_chest_recompute_cap_without_changing_hem(self):
        a=construct(self.profile,self.params)['garment']
        for key,delta,body in [('armhole_ease_mm',10,False),('chest_ease_mm',20,False),('shoulder_width_mm',10,False)]:
            with self.subTest(key=key):
                p,g=copy.deepcopy(self.profile),dict(self.params)
                if body:p['measurements'][key]['value']+=delta
                else:g[key]=g.get(key,400)+delta
                b=construct(p,g,a)['garment']
                self.assertNotEqual(a['derived']['cap_height_mm'],b['derived']['cap_height_mm'])
                self.assertEqual(b['parameters']['hem_circumference_mm'],self.params['hem_circumference_mm'])
                self.assertEqual(b['parameters']['length_mm'],700)

    def test_neck_and_material_rebuild_band_not_arbitrary_ratio(self):
        a=construct(self.profile,self.params)['garment']
        b=construct(self.profile,dict(self.params,neck_width_mm=200),a)['garment']
        self.assertNotEqual(a['derived']['neckband_length_mm'],b['derived']['neckband_length_mm'])
        for g in (a,b):self.assertAlmostEqual(g['derived']['neckband_length_mm']*1.15,g['derived']['neckline_mm'],places=5)
        c=construct(self.profile,dict(self.params,rib_application_extension_percent=16),a)['garment']
        self.assertLess(c['derived']['neckband_length_mm'],a['derived']['neckband_length_mm'])
        self.assertEqual(c['pieces'][0]['seam_contour'],a['pieces'][0]['seam_contour'])

    def test_invalid_or_unimplementable_inputs_fail_before_export(self):
        for overrides in ({'rib_stretch_percent':10}, {'rib_recovery_percent':70},
                          {'length_mm':True},{'chest_ease_mm':float('nan')},
                          {'segments':[]},{'neck_width_mm':110,'front_neck_depth_mm':50},
                          {'biceps_ease_mm':30,'sleeve_length_mm':150}):
            with self.subTest(overrides=overrides):
                with self.assertRaises(ValueError):construct(self.profile,dict(self.params,**overrides))
        self.assertIn('needs_input',construct({'id':'empty','measurements':{}},{}))

    def test_independent_validation_detects_tampered_geometry(self):
        g=construct(self.profile,self.params)['garment']
        g['pieces'][2]['seam_contour'][0]['c1'][1]+=15
        report=validate_engineering(g)
        self.assertFalse(report['valid']);self.assertTrue(report['errors'])
        self.assertFalse(report['sewing_ready'])

    def test_preflight_rejects_tampering_before_changing_clo(self):
        from clo_operations import dispatch
        from test_clo_operations import FakeCLO
        job=construct(self.profile,self.params)
        # Altering the sleeve after generation must invalidate its engineering checks.
        job['garment']['pieces'][2]['seam_contour'][0]['c1'][1]+=15
        api=FakeCLO()
        with self.assertRaises(ValueError):dispatch(job,api,api)
        self.assertEqual(api.GetPatternCount(),0)

    def test_reference_bodies_use_independent_measurements_without_scaling(self):
        cases=[
            (dict(chest=840,shoulder_width=370,chest_width=300,back_width=340,armhole_depth=220,biceps=270,head=540),dict(chest_ease_mm=80,hem_circumference_mm=920,cuff_circumference_mm=310)),
            (dict(chest=1120,shoulder_width=460,chest_width=400,back_width=440,armhole_depth=270,biceps=360,head=590),dict(chest_ease_mm=120,hem_circumference_mm=1240,cuff_circumference_mm=400,sleeve_length_mm=270,biceps_ease_mm=80,neck_width_mm=210,front_neck_depth_mm=125,back_neck_depth_mm=35)),
        ]
        for values,overrides in cases:
            p=copy.deepcopy(self.profile)
            for k,v in values.items():p['measurements'][k]['value']=v
            g=construct(p,dict(self.params,**overrides))['garment']
            self.assertTrue(g['engineering_report']['valid'])
            self.assertAlmostEqual(g['derived']['biceps_width_mm'],values['biceps']+g['parameters']['biceps_ease_mm'],places=3)

    def test_mirrors_grain_marks_and_fold_are_honest_metadata(self):
        from clo_adapter import production_lines,local_to_clo
        r=construct(self.profile,self.params);g=r['garment']
        for s,t in zip(g['pieces'][2]['seam_contour'],g['pieces'][3]['seam_contour']):
            for key in s:
                self.assertEqual(s[key][0],-t[key][0]);self.assertEqual(s[key][1],t[key][1])
        lines=production_lines(g['pieces'][4]);self.assertTrue(any(l['kind']=='fold' for l in lines))
        self.assertFalse(any(l['kind']=='grainline' for l in lines))
        for p in g['pieces']:self.assertTrue(p['notches']);self.assertEqual(p['cut_quantity'],1)
        self.assertLess(local_to_clo(r['patterns'][0],0,700)[1],local_to_clo(r['patterns'][0],0,0)[1])

    def test_native_names_are_verified_and_missing_api_is_reported(self):
        from clo_adapter import assign_production_name
        class Names:
            def SetPatternPieceName(self,i,name):self.name=name
            def GetPatternPieceName(self,i):return self.name
        spec={'production':{'name':'Футболка — перед'}}
        self.assertEqual(assign_production_name(spec,0,Names())['status'],'verified')
        self.assertEqual(assign_production_name(spec,0,object())['status'],'manual')

    def test_apply_edit_undo_preserves_unrelated_project_geometry(self):
        from test_clo_operations import FakeCLO
        from clo_operations import dispatch, fingerprint
        api=FakeCLO();api.CreatePatternWithPoints([(0,0,0),(50,0,0),(50,50,0),(0,50,0)])
        original=fingerprint(api,0)
        a=construct(self.profile,self.params);result=dispatch(a,api,api)
        for params,previous in ((dict(self.params,armhole_ease_mm=20),a['garment']),):
            b=construct(self.profile,params,previous)
            b['replace_targets']=[{'pattern_id':p['clo_pattern_id'],'fingerprint':p['fingerprint']} for p in result['patterns']]
            b['confirmed_replacement']=True
            result=dispatch(b,api,api)
            self.assertEqual(api.GetPatternCount(),6);self.assertEqual(fingerprint(api,0),original)
        restored=construct(self.profile,self.params,b['garment'])
        restored['replace_targets']=[{'pattern_id':p['clo_pattern_id'],'fingerprint':p['fingerprint']} for p in result['patterns']]
        restored['confirmed_replacement']=True
        dispatch(restored,api,api)
        self.assertEqual(restored['garment']['pieces'][0]['seam_contour'],a['garment']['pieces'][0]['seam_contour'])
        self.assertEqual(api.GetPatternCount(),6);self.assertEqual(fingerprint(api,0),original)


if __name__=='__main__':unittest.main()
