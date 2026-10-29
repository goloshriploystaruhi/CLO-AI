import unittest
from category_constructors import CATALOG,build
class CategoryTests(unittest.TestCase):
    def setUp(self):
        values=dict(chest=960,shoulder_width=400,armhole_depth=240,neck_base=370,biceps=300,hips=1000,back_waist_length=420,waist_hip_length=200,waist=800,head=570,head_height=230,head_length=190,garment_waist_girth=840,seated_depth=310,waist_knee=620)
        self.profile={'id':'fixture','measurements':{k:{'value':v,'unit':'mm','status':'verified'} for k,v in values.items()}}
        self.upper=dict(length_mm=700,chest_ease_mm=160,hem_circumference_mm=1160,sleeve_length_mm=500,cuff_circumference_mm=300)
    def test_upper_families(self):
        for method in list(CATALOG)[:9]:
            with self.subTest(method=method):
                params=dict(self.upper)
                if method=='top_sleeveless_v1':params.pop('sleeve_length_mm');params.pop('cuff_circumference_mm')
                if method in ('coat_wrap_v1','dress_shift_v1'):params.update(length_mm=1100,hem_circumference_mm=1500)
                result=build(method,self.profile,params)
                self.assertTrue(result['garment']['readiness']['geometry'])
    def test_skirt_and_hat(self):
        for method,params in [('skirt_aline_v1',dict(length_mm=650,waist_ease_mm=20,hem_circumference_mm=1700)),('headwear_gore_v1',dict(height_mm=210,head_ease_mm=10))]:
            result=build(method,self.profile,params);self.assertGreater(len(result['patterns']),3)
    def test_lower_and_jumpsuit(self):
        base=dict(length_mm=1050,waist_drop_mm=20,hip_ease_mm=160,waist_ease_mm=20,knee_flat_mm=280,hem_flat_mm=240)
        for method in ('jeans_loose_v1','shorts_loose_v1','boxers_loose_v1','jumpsuit_work_v1'):
            with self.subTest(method=method):
                params=dict(base)
                if method in ('shorts_loose_v1','boxers_loose_v1'):params['length_mm']=450;params.pop('knee_flat_mm')
                if method=='jumpsuit_work_v1':params.update(torso_length_mm=470,chest_ease_mm=160,sleeve_length_mm=500,cuff_circumference_mm=300)
                r=build(method,self.profile,params);self.assertTrue(r['garment']['readiness']['geometry']);self.assertGreater(len(r['patterns']),5)
    def test_all_methods_apply_update_and_preserve_other_project_details(self):
        from test_clo_operations import FakeCLO
        from clo_operations import dispatch,fingerprint
        import json
        report=[]
        for method,meta in CATALOG.items():
            with self.subTest(method=method):
                if method=='skirt_aline_v1':params=dict(length_mm=650,waist_ease_mm=20,hem_circumference_mm=1700);change='length_mm'
                elif method=='headwear_gore_v1':params=dict(height_mm=210,head_ease_mm=10);change='height_mm'
                elif meta['category'] in ('jeans','shorts','underwear','jumpsuit'):
                    params=dict(length_mm=1050,waist_drop_mm=20,hip_ease_mm=160,waist_ease_mm=20,knee_flat_mm=280,hem_flat_mm=240);change='length_mm'
                    if meta['category'] in ('shorts','underwear'):params['length_mm']=450;params.pop('knee_flat_mm')
                    if meta['category']=='jumpsuit':params.update(torso_length_mm=470,chest_ease_mm=160,sleeve_length_mm=500,cuff_circumference_mm=300)
                else:
                    params=dict(self.upper);change='length_mm'
                    if meta['category']=='top':params.pop('sleeve_length_mm');params.pop('cuff_circumference_mm')
                    if meta['category'] in ('coat','dress'):params.update(length_mm=1100,hem_circumference_mm=1500)
                api=FakeCLO();api.CreatePatternWithPoints([(0,0,0),(100,0,0),(100,100,0),(0,100,0)]);original=fingerprint(api,0)
                kit=build(method,self.profile,params);first=dispatch(kit,api,api);count=api.GetPatternCount()
                updated_params=dict(params);updated_params[change]+=20
                revised=build(method,self.profile,updated_params,kit['garment']);revised['replace_targets']=[{'pattern_id':r['clo_pattern_id'],'fingerprint':r['fingerprint']} for r in first['patterns']]
                revised['confirmed_replacement']=True
                dispatch(revised,api,api)
                self.assertEqual(api.GetPatternCount(),count);self.assertEqual(original,fingerprint(api,0));self.assertEqual([p['id'] for p in kit['garment']['pieces']],[p['id'] for p in revised['garment']['pieces']])
                report.append({'method':method,'name':meta['name'],'variant':meta['variant'],'parts':len(first['patterns']),'geometry':'passed','seams':'passed','mock_clo_create':'passed','mock_clo_update':'passed','native_clo':'not_verified','production':'requires_review','fit':'not_verified'})
        with open('CATEGORY_READINESS.json','w',encoding='utf-8') as f:json.dump(report,f,ensure_ascii=False,indent=2)

    def test_missing_data_and_unsupported_styles_are_not_fabricated(self):
        for method in CATALOG:
            with self.subTest(method=method):
                r=build(method,{'id':'empty','measurements':{}},{})
                self.assertIn('needs_input',r);self.assertNotIn('patterns',r)
        with self.assertRaisesRegex(ValueError,'не поддерживается'):
            build('tshirt_drop_v1',self.profile,dict(self.upper,hood_height_mm=350))
    def test_short_method_does_not_require_a_fictional_knee_measurement(self):
        profile={'id':'short','measurements':{k:v for k,v in self.profile['measurements'].items() if k!='waist_knee'}}
        r=build('shorts_loose_v1',profile,dict(length_mm=450,waist_drop_mm=20,hip_ease_mm=160,waist_ease_mm=20,hem_flat_mm=240))
        self.assertNotIn('waist_knee',r['garment']['measurement_snapshot'])
