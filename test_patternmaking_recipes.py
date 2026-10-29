import ast
import copy
import importlib.util
import json
import math
from pathlib import Path
import re
import subprocess
import sys
import unittest
from unittest.mock import patch

from garment_engine import deserialize
from parametric_design import audit, build, describe
from patternmaking_recipes import RECIPE, DEFAULTS, catalog, expand, make_recipe
from clo_operations import dispatch
from test_clo_operations import FakeCLO


def person(sex='female', waist=760, hips=1000, depth=200):
    return {'id':'individual','name':'Личный профиль','metadata':{'sex':sex,'age':34},'measurements':{
        key:{'value':value,'unit':'mm','source':'manual','status':'unverified'}
        for key,value in {'waist':waist,'hips':hips,'waist_hip_length':depth}.items()}}


def closed_waist(garment):
    total=0
    for piece in garment['pieces']:
        c=deserialize(piece['seam_contour'])
        total+=sum(sum(c.segments[i].length(.00001) for i in indices) for name,indices in piece['seams'].items()
                   if re.fullmatch(r'(?:right_|left_)?waist_\d+',name))
    return total


class PatternmakingRecipeTests(unittest.TestCase):
    def test_catalog_and_skeleton_are_explicit_and_do_not_contain_body_defaults(self):
        recipe=make_recipe(RECIPE,{'length_mm':650})
        self.assertEqual(recipe['pieces'],[]);self.assertEqual(recipe['measurements'],['waist','hips','waist_hip_length'])
        self.assertEqual(set(recipe['parameters']),set(DEFAULTS));self.assertEqual(recipe['parameters']['length_mm'],650)
        self.assertEqual(catalog()[0]['source']['license'],'MIT');self.assertEqual(describe()['patternmaking_recipes'],catalog())
        self.assertIn('/blob/6587004c4c0495592d0a3947553b52e72f1e354c/',recipe['sources'][0])
        with self.assertRaises(ValueError): make_recipe('anything_else')

    def test_real_measurements_darts_closed_waist_and_anatomical_levels(self):
        profile=person();before=copy.deepcopy(profile);result=build(profile,make_recipe(RECIPE));g=result['garment']
        self.assertTrue(result['qa_report']['valid']);self.assertEqual(profile,before)
        self.assertEqual([p['role'] for p in g['pieces']],['front','back_left','back_right'])
        self.assertAlmostEqual(closed_waist(g),770,places=4);self.assertAlmostEqual(g['recipe_details']['waist_closed_mm'],770)
        self.assertEqual(g['recipe_details']['hip_circumference_mm'],1040);self.assertEqual(g['recipe_details']['hip_level_mm'],190)
        self.assertEqual(g['recipe_details']['dart_count'],8);self.assertFalse(g['readiness']['sewing_ready'])
        for piece in g['pieces']:
            self.assertEqual(piece['cut_quantity'],1)
            self.assertLessEqual(len(piece['seam_contour']),20)
            contour=deserialize(piece['seam_contour']);self.assertAlmostEqual(max(s.start.y for s in contour.segments)-min(s.start.y for s in contour.segments),600)
            for dart in piece['dart_details']:
                a,b=[piece['internal_lines'][index] for index in dart['legs']]
                self.assertEqual(a[1],b[1]);self.assertAlmostEqual(math.dist(*a),dart['length_mm'],places=8)
                self.assertAlmostEqual(math.dist(*a),math.dist(*b),places=8)
                self.assertAlmostEqual(math.dist(*piece['internal_lines'][dart['fold']]),dart['length_mm'],places=8)
                self.assertGreater(dart['cap_extension_mm'],0)
                self.assertFalse(any(a[1]==[s.start.x,s.start.y] for s in contour.segments),'Вершина непрорезанной вытачки не должна становиться вырезом')
        self.assertTrue(all(link['passed'] for link in result['qa_report']['assembly']['links']))
        self.assertTrue(any('молни' in r['type'] for r in g['sewing_graph']))
        self.assertTrue(any(w['code']=='UNVERIFIED_MEASUREMENTS' for w in result['qa_report']['warnings']))

    def test_length_edit_keeps_waist_hips_darts_and_ids_without_global_scaling(self):
        profile=person();source=make_recipe(RECIPE);first=build(profile,source)['garment']
        edited=copy.deepcopy(source);edited['parameters']['length_mm']=650
        result=build(profile,edited,first);g=result['garment']
        self.assertTrue(result['qa_report']['valid']);self.assertEqual(g['id'],first['id']);self.assertEqual(g['version'],2)
        self.assertEqual([p['id'] for p in g['pieces']],[p['id'] for p in first['pieces']])
        self.assertEqual(g['pattern_design'],edited);self.assertEqual(g['pattern_design']['pieces'],[])
        self.assertAlmostEqual(closed_waist(g),closed_waist(first),places=6)
        self.assertEqual(g['recipe_details']['hip_circumference_mm'],first['recipe_details']['hip_circumference_mm'])
        self.assertEqual([p['internal_lines'] for p in g['pieces']],[p['internal_lines'] for p in first['pieces']])
        for p in g['pieces']:
            c=deserialize(p['seam_contour']);self.assertAlmostEqual(max(s.start.y for s in c.segments)-min(s.start.y for s in c.segments),650)
        self.assertNotEqual(g['qa_report']['quality']['geometry_fingerprint'],first['qa_report']['quality']['geometry_fingerprint'])

    def test_waist_edit_recalculates_dart_topology_and_keeps_hips_and_height(self):
        profile=person();source=make_recipe(RECIPE);first=build(profile,source)['garment']
        source['parameters']['waist_ease_mm']=90;changed=build(profile,source,first)
        self.assertTrue(changed['qa_report']['valid']);g=changed['garment']
        self.assertAlmostEqual(closed_waist(g),850,places=4);self.assertEqual(g['recipe_details']['dart_count'],4)
        self.assertEqual(g['recipe_details']['hip_circumference_mm'],1040);self.assertEqual(g['parameters']['length_mm'],600)
        self.assertEqual([p['id'] for p in g['pieces']],[p['id'] for p in first['pieces']])

    def test_personal_values_units_and_sex_are_preserved_without_table_fallback(self):
        baseline=build(person(),make_recipe(RECIPE))['garment']
        for sex in ('female','male','unspecified'):
            profile=person(sex);profile['measurements']['hips'].update(value=100,unit='cm')
            g=build(profile,make_recipe(RECIPE))['garment']
            self.assertEqual([p['seam_contour'] for p in baseline['pieces']],[p['seam_contour'] for p in g['pieces']])
            self.assertEqual(g['profile_context']['sex'],sex);self.assertEqual(g['measurement_snapshot']['hips']['value'],1000)
            self.assertEqual(profile['measurements']['hips']['value'],100)
        missing=person();del missing['measurements']['waist_hip_length']
        self.assertEqual(build(missing,make_recipe(RECIPE))['needs_input']['missing_measurements'],['waist_hip_length'])
        disputed=person();disputed['measurements']['waist']['status']='disputed'
        self.assertEqual(build(disputed,make_recipe(RECIPE))['needs_input']['disputed_measurements'],['waist'])
        actual=build(person(waist=850,hips=1120,depth=230),make_recipe(RECIPE))['garment']
        self.assertAlmostEqual(closed_waist(actual),860,places=4);self.assertEqual(actual['recipe_details']['hip_circumference_mm'],1160)

    def test_invalid_parameters_cannot_replace_body_or_bypass_recipe(self):
        for changes in ({'length_mm':True},{'length_mm':float('nan')},{'waist':760},{'seam_allowance_mm':30},
                        {'length_mm':270},{'back_dart_length_mm':230}):
            with self.subTest(changes=changes), self.assertRaises(ValueError):
                recipe=make_recipe(RECIPE,changes);build(person(),recipe)
        for key,value in (('recipe','unknown'),('category','coat'),('pieces',[{'role':'injected'}]),('variables',{'waist':'1'}),('measurements',['waist'])):
            design=make_recipe(RECIPE);design[key]=value
            with self.subTest(key=key),self.assertRaises(ValueError): build(person(),design)
        with self.assertRaises(ValueError): build(person(waist=1200,hips=900),make_recipe(RECIPE))

    def test_replay_audit_rejects_changed_dart_lines_pairs_and_stale_waist_even_if_flags_forged(self):
        g=build(person(),make_recipe(RECIPE))['garment']
        for change in ('line','fold','pair','target','recipe'):
            broken=copy.deepcopy(g)
            if change=='line': broken['pieces'][0]['internal_lines'][0][1][0]+=3
            elif change=='fold': broken['pieces'][0]['internal_lines'][2][1][1]+=3
            elif change=='pair': broken['sewing_graph'][-1]['b']['internal_line']-=3
            elif change=='target': broken['recipe_details']['waist_closed_mm']+=10
            else: broken['pattern_design']['parameters']['waist_ease_mm']+=20
            broken['qa_report']['valid']=True
            with self.subTest(change=change): self.assertFalse(audit(broken)['valid'])

    def test_recipe_fingerprint_covers_internal_darts_grain_notches_and_sewing_graph(self):
        from engineering.quality import fingerprint
        garment=build(person(),make_recipe(RECIPE))['garment'];before=copy.deepcopy(garment)
        digest=garment['qa_report']['quality']['geometry_fingerprint']
        self.assertEqual(len(digest),64);self.assertNotEqual(digest,fingerprint(garment))
        self.assertEqual(audit(garment)['quality']['geometry_fingerprint'],digest)
        self.assertEqual(audit(garment)['quality']['geometry_fingerprint'],digest);self.assertEqual(garment,before)
        for field in ('internal_line','dart','grain','notch','graph'):
            changed=copy.deepcopy(garment)
            if field=='internal_line': changed['pieces'][0]['internal_lines'][2][1][0]+=2
            elif field=='dart': changed['pieces'][0]['dart_details'][0]['length_mm']+=2
            elif field=='grain': changed['pieces'][0]['grainline'][0][0]+=2
            elif field=='notch': changed['pieces'][0]['notches'][0]['t']+=.01
            else: changed['sewing_graph'][0]['direction']='same'
            with self.subTest(field=field):
                self.assertEqual(fingerprint(changed),fingerprint(garment),'Старый общий хеш не учитывает эти поля')
                report=audit(changed);self.assertNotEqual(report['quality']['geometry_fingerprint'],digest)
                self.assertEqual(len(report['quality']['geometry_fingerprint']),64)
                self.assertFalse(report['valid'])

    def test_fake_clo_dispatch_and_edit_gate(self):
        job=build(person(),make_recipe(RECIPE));api=FakeCLO();result=dispatch(job,api,api)
        self.assertEqual(len(result['patterns']),3);self.assertTrue(result['qa_report']['valid'])
        self.assertTrue(all(p['export']['native_curves']>0 for p in result['patterns']))
        self.assertTrue(all(p['segments']-p['export']['control_points']<=32 for p in result['patterns']))
        broken=copy.deepcopy(job);broken['garment']['pieces'][0]['internal_lines'][0][1][0]+=30
        api=FakeCLO()
        with self.assertRaises(ValueError): dispatch(broken,api,api)
        self.assertEqual(api.GetPatternCount(),0)

    def test_vendor_static_audit_precedes_comparison_and_never_calls_fallback(self):
        path=Path(__file__).parent/'third_party/pattern-making/scripts/pattern.py'
        tree=ast.parse(path.read_text(encoding='utf-8'))
        for node in tree.body:
            if isinstance(node,ast.Import): self.assertTrue(all(a.name in {'argparse','json','math','os','sys','tempfile'} for a in node.names))
            elif isinstance(node,ast.Assign): ast.literal_eval(node.value)
            elif isinstance(node,ast.If): self.assertEqual(ast.unparse(node.test),"__name__ == '__main__'")
            else: self.assertIsInstance(node,(ast.FunctionDef,ast.ClassDef,ast.Expr))
        spec=importlib.util.spec_from_file_location('_audited_patternmaking_test',path);vendor=importlib.util.module_from_spec(spec);spec.loader.exec_module(vendor)
        with patch.object(vendor,'complete',side_effect=AssertionError('fallback запрещён')),patch.object(vendor,'standard_measurements',side_effect=AssertionError('таблица запрещена')):
            seed=vendor.block_skirt({'waist':76,'hip':100,'hip_depth':20,'skirt_length':60},{'skirt_waist':1,'skirt_hip':4},'women')
        expanded=expand(person(),make_recipe(RECIPE));pieces=expanded['pieces']
        hips=[next(n['p'][0]*10 for n in p['outline'] if n['name']=='hip') for p in seed['pieces']]
        self.assertAlmostEqual(pieces[0]['points']['right_hip'][0],hips[0]);self.assertAlmostEqual(pieces[1]['points']['hip'][0],hips[1])
        unequal=[]
        for piece in seed['pieces']:
            nodes=piece['outline']
            for i,node in enumerate(nodes):
                if node.get('dart'): unequal.append(abs(math.dist(nodes[i-1]['p'],node['p'])-math.dist(nodes[i+1]['p'],node['p']))*10)
        self.assertGreater(max(unequal),.1,'Подтверждаем исправленную неодинаковую длину ног исходника')

    def test_read_only_recipe_cli_returns_replayable_schema(self):
        completed=subprocess.run([sys.executable,'parametric_design.py'],input=json.dumps({'operation':'patternmaking_recipe','id':RECIPE,'parameters':{'length_mm':650}}),capture_output=True,text=True,check=True)
        result=json.loads(completed.stdout);self.assertEqual(result['design']['parameters']['length_mm'],650)
        self.assertEqual(result['recipe']['id'],RECIPE);self.assertEqual(result['design']['pieces'],[])

    def test_low_suppression_has_no_microdarts_and_missing_grain_is_a_reported_error(self):
        result=build(person(waist=1000,hips=970),make_recipe(RECIPE))
        self.assertTrue(result['qa_report']['valid']);g=result['garment']
        self.assertEqual(g['recipe_details']['dart_count'],0);self.assertAlmostEqual(closed_waist(g),1010,places=4)
        broken=build(person(),make_recipe(RECIPE))['garment'];broken['pieces'][0]['grainline']=None
        self.assertFalse(audit(broken)['valid'])


if __name__=='__main__': unittest.main()
