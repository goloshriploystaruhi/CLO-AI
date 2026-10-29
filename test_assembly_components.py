"""Generic multi-object construction: no garment-specific recipe or fake seams."""
import copy
import json
import subprocess
import sys
import unittest
from pathlib import Path
from unittest.mock import patch

from parametric_design import build,audit,describe
from garment_engine import validate_garment,deserialize
from engineering.assembly import audit as audit_assembly
from engineering.quality import fingerprint
from sewing_plan import compile_plan
from clo_operations import dispatch,fingerprint as native_fingerprint
from test_clo_operations import FakeCLO


def profile():
    return {'id':'generic-components','metadata':{'sex':'unspecified'},'measurements':{}}


def independent_sets():
    """Two three-piece panel assemblies; no assumptions about any garment type."""
    design={'version':1,'name':'Две независимые сборки','category':'custom',
            'parameters':{'panel_width_mm':100,'panel_height_mm':250,'band_height_mm':60},
            'measurements':[],'seam_allowance_mm':7,'pieces':[], 'relations':[], 'assembly_groups':[]}
    for prefix in ('first','second'):
        roles=[prefix+'_a',prefix+'_b',prefix+'_band'];design['assembly_groups'].append(roles)
        for role in roles:
            band=role.endswith('_band')
            design['pieces'].append({'role':role,'name':role,'primitive':{'type':'rectangle',
                'width':'2*p_panel_width_mm' if band else 'p_panel_width_mm',
                'height':'p_band_height_mm' if band else 'p_panel_height_mm'}})
        # Split one edge of the band mathematically so both panel tops have
        # distinct real 100mm partners rather than reusing a 200mm segment.
        design['pieces'][-1].pop('primitive')
        design['pieces'][-1].update(points={'a':[0,0],'b':['p_panel_width_mm',0],
            'c':['2*p_panel_width_mm',0],'d':['2*p_panel_width_mm','p_band_height_mm'],'e':[0,'p_band_height_mm']},
            segments=[{'name':name,'type':'line','from':start,'to':end}
                      for name,start,end in [('top_a','a','b'),('top_b','b','c'),('right','c','d'),('bottom','d','e'),('left','e','a')]])
        for side,seam in (('a','top_a'),('b','top_b')):
            design['relations'].append({'a':{'piece':prefix+'_'+side,'seam':'top'},
                'b':{'piece':prefix+'_band','seam':seam},'alignment':[0,.5,1]})
        design['relations'].append({'a':{'piece':prefix+'_a','seam':'right'},
            'b':{'piece':prefix+'_b','seam':'left'},'alignment':[0,.25,.5,.75,1]})
    return design


class AssemblyComponentTests(unittest.TestCase):
    def test_two_declared_sets_build_six_native_pieces_with_verified_seams(self):
        job=build(profile(),independent_sets());garment=job['garment'];report=job['qa_report']
        self.assertTrue(report['valid'],report['issues']);self.assertEqual(len(job['patterns']),6)
        self.assertEqual(report['assembly']['component_count'],2)
        self.assertEqual([len(g['piece_ids']) for g in report['assembly']['components']],[3,3])
        self.assertEqual([g['roles'] for g in report['assembly']['components']],garment['assembly_groups'])
        self.assertEqual(validate_garment(garment)['connected_parts'],6)
        self.assertTrue(all(link['passed'] for link in report['assembly']['links']))
        self.assertTrue(all(abs(link['residual_mm'])<.0001 for link in report['assembly']['links']))
        self.assertIn('Независимые сборки',job['qa_markdown'])
        self.assertFalse(report['sewing_ready']);self.assertFalse(report['fit_verified'])
        api=FakeCLO();api.CreatePatternWithPoints([(0,0,0),(20,0,0),(20,20,0),(0,20,0)])
        existing=native_fingerprint(api,0)
        import tempfile
        with tempfile.TemporaryDirectory(prefix='assembly-components-',dir=Path(__file__).parent/'research') as folder:
            self.assertEqual(Path(folder).resolve().parent,(Path(__file__).parent/'research').resolve())
            with patch('tempfile.gettempdir',return_value=folder):result=dispatch(job,api,api)
        self.assertEqual(api.GetPatternCount(),7);self.assertEqual(len(result['patterns']),6)
        self.assertEqual(native_fingerprint(api,0),existing)
        self.assertTrue(result['qa_report']['valid'])
        self.assertFalse(report['assembly']['native_sewing_applied'])

    def test_no_groups_retains_single_connected_contract_and_single_piece_stays_valid(self):
        design=independent_sets();del design['assembly_groups']
        with self.assertRaisesRegex(ValueError,'assembly_groups'):build(profile(),design)
        design['pieces']=design['pieces'][:1];design['relations']=[]
        job=build(profile(),design)
        self.assertTrue(job['qa_report']['valid']);self.assertEqual(job['qa_report']['assembly']['component_count'],1)
        self.assertNotIn('assembly_groups',job['garment'])

    def test_groups_must_partition_all_roles_once_and_reference_existing_roles(self):
        original=independent_sets()
        for groups in (None,[],[[]],[['missing']],[[True]],
                       [original['assembly_groups'][0]],
                       original['assembly_groups']+[original['assembly_groups'][0]],
                       [original['assembly_groups'][0]+[original['assembly_groups'][0][0]],original['assembly_groups'][1]]):
            bad=copy.deepcopy(original);bad['assembly_groups']=groups
            with self.subTest(groups=groups),self.assertRaises(ValueError):build(profile(),bad)

    def test_disconnected_piece_inside_declared_group_is_rejected(self):
        design=independent_sets();design['relations']=[r for r in design['relations']
            if 'first_band' not in (r['a']['piece'],r['b']['piece'])]
        with self.assertRaisesRegex(ValueError,'без связи друг с другом'):build(profile(),design)

    def test_cross_group_relation_and_arbitrary_partition_are_rejected(self):
        design=independent_sets();design['relations'].append({'a':{'piece':'first_a','seam':'bottom'},
            'b':{'piece':'second_a','seam':'bottom'}})
        with self.assertRaisesRegex(ValueError,'границы независимых сборок'):build(profile(),design)
        design=independent_sets();design['assembly_groups']=[['first_a','second_a'],['first_b','first_band','second_b','second_band']]
        with self.assertRaisesRegex(ValueError,'границы независимых сборок'):build(profile(),design)

    def test_one_standalone_piece_can_be_an_explicit_independent_assembly(self):
        design=independent_sets();design['pieces']=design['pieces'][:4];design['relations']=design['relations'][:3]
        design['assembly_groups']=[design['assembly_groups'][0],['second_a']]
        report=build(profile(),design)['qa_report']
        self.assertTrue(report['valid']);self.assertEqual([len(g['roles']) for g in report['assembly']['components']],[3,1])

    def test_rebuild_preserves_all_piece_ids_and_dependency_geometry(self):
        design=independent_sets();first=build(profile(),design)['garment']
        changed=copy.deepcopy(design);changed['parameters']['panel_height_mm']=300
        second=build(profile(),changed,first)['garment']
        self.assertEqual(second['id'],first['id']);self.assertEqual(second['version'],2)
        self.assertEqual([p['id'] for p in second['pieces']],[p['id'] for p in first['pieces']])
        self.assertEqual(second['assembly_groups'],first['assembly_groups'])
        for i in (0,1,3,4):self.assertAlmostEqual(deserialize(second['pieces'][i]['seam_contour']).segments[1].length(),300)
        self.assertEqual(second['pieces'][2]['seam_contour'],first['pieces'][2]['seam_contour'])
        self.assertEqual(second['pieces'][5]['seam_contour'],first['pieces'][5]['seam_contour'])
        self.assertTrue(audit(second)['valid'])

    def test_reconstructed_qa_does_not_trust_forged_partition_or_connections(self):
        original=build(profile(),independent_sets())['garment']
        altered=copy.deepcopy(original);altered['assembly_groups'].reverse()
        report=audit(altered);self.assertFalse(report['valid'])
        self.assertTrue(any(i['code']=='DESIGN_ASSEMBLY_GROUPS' for i in report['issues']))
        altered=copy.deepcopy(original);altered['sewing_graph']=altered['sewing_graph'][:2]+altered['sewing_graph'][3:]
        self.assertFalse(audit(altered)['valid'])
        self.assertNotEqual(fingerprint(original),fingerprint(altered))
        self.assertNotEqual(fingerprint(original),fingerprint(dict(original,assembly_groups=list(reversed(original['assembly_groups'])))))

    def test_bad_seam_lengths_and_missing_control_marks_still_block_pair(self):
        design=independent_sets();design['pieces'][0]['primitive']['width']=110
        with self.assertRaises(ValueError):build(profile(),design)
        garment=build(profile(),independent_sets())['garment'];garment['pieces'][4]['notches']=[]
        report=audit_assembly(garment);self.assertFalse(report['valid'])
        self.assertTrue(any(i['code']=='ASSEMBLY_REFERENCE' for i in report['issues']))

    def test_assembly_plan_keeps_independent_seams_without_native_execution(self):
        garment=build(profile(),independent_sets())['garment'];plan=compile_plan(garment)
        self.assertEqual(plan['component_count'],2);self.assertEqual(plan['piece_count'],6)
        self.assertEqual(plan['seam_count'],6);self.assertEqual(plan['native_seams_created'],0)
        groups=[set(group['piece_ids']) for group in plan['assembly_components']]
        for relation in plan['seams']:
            ids={e['piece_id'] for e in relation['ends']};self.assertTrue(any(ids<=group for group in groups))

    def test_cli_capabilities_and_replay_use_the_same_contract(self):
        self.assertIn('assembly_groups',describe()['design_keys'])
        self.assertIn('assembly_groups',describe())
        request=json.dumps({'profile':profile(),'design':independent_sets()}).encode()
        script=Path(__file__).with_name('parametric_design.py')
        reply=json.loads(subprocess.check_output([sys.executable,str(script)],input=request))
        self.assertTrue(reply['qa_report']['valid']);self.assertEqual(reply['qa_report']['assembly']['component_count'],2)


if __name__=='__main__':unittest.main()
