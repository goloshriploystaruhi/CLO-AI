import copy
import json
import math
from pathlib import Path
import subprocess
import sys
import unittest

from garment_engine import deserialize
from parametric_design import build, audit, describe, expression, circle_skirt_example


def person(sex='female'):
    return {'id': 'person', 'name': 'Профиль', 'metadata': {'sex': sex},
            'measurements': {k: {'value': v, 'unit': 'mm', 'status': 'verified', 'source': 'manual'}
                             for k, v in {'waist': 760, 'neck_base': 360, 'chest': 920}.items()}}


def asymmetrical():
    return {'version': 1, 'name': 'Асимметричная деталь с фигурным верхом', 'category': 'experimental_panel',
            'parameters': {'top_mm': 500, 'bottom_mm': 700, 'height_mm': 900, 'round_mm': 25}, 'measurements': [],
            'notes': ['Проверить назначение и технологию обработки на макете'],
            'pieces': [{'role': 'panel', 'name': 'Фигурная панель',
                        'points': {'a': [0, 0], 'b': ['p_top_mm', 0], 'c': ['p_bottom_mm', 'p_height_mm'], 'd': [0, 'p_height_mm'],
                                   'q': ['p_top_mm/2', 'p_round_mm'], 'r': ['p_top_mm', 'p_height_mm/3'], 's': ['p_bottom_mm', '2*p_height_mm/3']},
                        'segments': [{'name': 'top', 'type': 'quadratic', 'from': 'a', 'to': 'b', 'control': 'q'},
                                     {'name': 'side', 'type': 'cubic', 'from': 'b', 'to': 'c', 'controls': ['r', 's']},
                                     {'name': 'hem', 'type': 'line', 'from': 'c', 'to': 'd'},
                                     {'name': 'left', 'type': 'line', 'from': 'd', 'to': 'a'}]}],
            'checks': [{'piece': 'panel', 'metric': 'height', 'expected': 'p_height_mm', 'tolerance_mm': .01},
                       {'piece': 'panel', 'metric': 'width', 'expected': 'p_bottom_mm'},
                       {'piece': 'panel', 'metric': 'seam_length', 'seam': 'hem', 'expected': 'p_bottom_mm', 'tolerance_mm': .01}]}


class ParametricDesignTests(unittest.TestCase):
    def test_circle_skirt_uses_actual_waist_and_compact_analytic_arcs(self):
        profile, design = person(), circle_skirt_example();before = copy.deepcopy(profile)
        result = build(profile, design);g = result['garment']
        self.assertTrue(result['qa_report']['valid']);self.assertEqual(profile, before)
        self.assertEqual(g['category'], 'skirt');self.assertEqual(len(g['pieces']), 2)
        length = 0
        for p in g['pieces']:
            c = deserialize(p['seam_contour']);self.assertEqual(len(c.segments), 6)
            self.assertEqual(sum(s.c1 is not None for s in c.segments), 4)
            length += sum(c.segments[i].length() for i in p['seams']['waist'])
            self.assertAlmostEqual(c.segments[p['seams']['radial_start'][0]].length(), 600)
            self.assertEqual(p['allowance_mm'], 10)
        self.assertLess(abs(length-780), .2)
        self.assertFalse(g['readiness']['fit_verified']);self.assertFalse(g['readiness']['sewing_ready'])
        self.assertFalse(result['qa_report']['sewing_ready']);self.assertEqual(g['profile_context']['sex'], 'female')

    def test_parameter_edit_recalculates_dependencies_without_scaling_and_preserves_ids(self):
        design = circle_skirt_example();first = build(person(), design)['garment']
        length_design = copy.deepcopy(design);length_design['parameters']['length_mm'] = 750
        second = build(person(), length_design, first)['garment']
        self.assertEqual(second['id'], first['id']);self.assertEqual(second['version'], 2)
        self.assertEqual([p['id'] for p in second['pieces']], [p['id'] for p in first['pieces']])
        for a, b in zip(first['pieces'], second['pieces']):
            self.assertEqual(a['seam_contour'][:2], b['seam_contour'][:2])
            self.assertAlmostEqual(deserialize(b['seam_contour']).segments[b['seams']['radial_start'][0]].length(), 750)
        wide = copy.deepcopy(length_design);wide['parameters']['waist_ease_mm'] = 60
        third = build(person(), wide, second)['garment']
        for p in third['pieces']:
            self.assertAlmostEqual(deserialize(p['seam_contour']).segments[p['seams']['radial_start'][0]].length(), 750)
        self.assertEqual(third['parameters']['length_mm'], 750)
        self.assertNotEqual(third['pieces'][0]['seam_contour'][0], second['pieces'][0]['seam_contour'][0])

    def test_cape_is_a_new_category_with_mathematical_sector_and_honest_fit_status(self):
        design = {'version': 1, 'name': 'Кейп с открытым передом', 'category': 'cape',
                  'parameters': {'length_mm': 650, 'neck_ease_mm': 30}, 'measurements': ['neck_base'],
                  'variables': {'radius': '(m_neck_base+p_neck_ease_mm)/rad(270)'},
                  'pieces': [{'role': 'cape', 'name': 'Кейп', 'primitive': {'type': 'annular_sector', 'inner_radius': 'radius', 'width': 'p_length_mm', 'angle_deg': 270}}],
                  'operations': ['Уточнить плечевой баланс, вид застёжки и обработку открытого переда на макете']}
        result = build(person('male'), design)
        self.assertTrue(result['qa_report']['valid']);self.assertEqual(result['garment']['category'], 'cape')
        p = result['garment']['pieces'][0];c = deserialize(p['seam_contour'])
        neck = sum(c.segments[i].length() for i in p['seams']['waist'])
        self.assertLess(abs(neck-390), .1);self.assertEqual(len(c.segments), 8)
        self.assertFalse(result['garment']['readiness']['sewing_ready'])

    def test_asymmetric_curve_points_quadratic_cubic_and_mirror_are_replayable(self):
        design = asymmetrical();base = build(person(), design)['garment']
        changed = copy.deepcopy(design);changed['parameters']['bottom_mm'] = 800
        revised = build(person(), changed, base)['garment']
        self.assertEqual(base['pieces'][0]['seam_contour'][0], revised['pieces'][0]['seam_contour'][0])
        self.assertEqual(base['pieces'][0]['seam_contour'][2]['start'][1], revised['pieces'][0]['seam_contour'][2]['start'][1])
        self.assertEqual(base['pieces'][0]['seam_contour'][3], revised['pieces'][0]['seam_contour'][3])
        pair = copy.deepcopy(design);pair['pieces'][0]['role'] = 'left'
        for check in pair['checks']: check['piece'] = 'left'
        mirrored = copy.deepcopy(pair['pieces'][0]);mirrored.update(role='right', name='Зеркальная панель', mirror='y', translate=[1600, 0])
        pair['pieces'].append(mirrored)
        pair['relations'] = [{'a': {'piece': 'left', 'seam': 'left'}, 'b': {'piece': 'right', 'seam': 'left'}, 'direction': 'reverse'}]
        result = build(person(), pair);self.assertTrue(result['qa_report']['valid'])
        left, right = [deserialize(p['seam_contour']) for p in result['garment']['pieces']]
        for a, b in zip(left.segments, right.segments):
            self.assertAlmostEqual(a.start.x+b.start.x, 1600);self.assertEqual(a.start.y, b.start.y)

    def test_missing_or_disputed_measurements_block_but_unverified_values_are_used_with_warning(self):
        profile = person();profile['measurements']['waist']['value'] = None
        result = build(profile, circle_skirt_example());self.assertEqual(result['needs_input']['missing_measurements'], ['waist'])
        self.assertNotIn('patterns', result);self.assertIsNone(profile['measurements']['waist']['value'])
        profile['measurements']['waist'].update(value=760, status='unverified')
        ordinary = build(profile, circle_skirt_example());self.assertTrue(ordinary['qa_report']['valid'])
        self.assertTrue(any(w['code']=='UNVERIFIED_MEASUREMENTS' for w in ordinary['qa_report']['warnings']))
        self.assertEqual(ordinary['garment']['measurement_snapshot']['waist']['status'], 'unverified')
        self.assertEqual(profile['measurements']['waist']['status'], 'unverified')
        profile['measurements']['waist']['status'] = 'disputed'
        self.assertEqual(build(profile, circle_skirt_example())['needs_input']['disputed_measurements'], ['waist'])
        profile['measurements']['waist'].update(value=76, unit='cm', status='verified')
        result = build(profile, circle_skirt_example());self.assertEqual(result['garment']['measurement_snapshot']['waist']['value'], 760)
        self.assertEqual(profile['measurements']['waist']['value'], 76)

    def test_custom_measurement_alias_and_sex_context_are_not_demographic_averages(self):
        profile = person('male');key = 'custom_21bf7d09-6457-4490-b443-aab85a34bb23'
        profile['measurements'][key] = {'value': 400, 'unit': 'mm', 'status': 'verified'}
        design = {'version': 1, 'name': 'Панель по собственной мерке', 'category': 'custom', 'intended_sex': 'female', 'parameters': {'height_mm': 500}, 'measurements': [key],
                  'pieces': [{'role': 'panel', 'name': 'Панель', 'primitive': {'type': 'rectangle', 'width': 'm_'+key.replace('-', '_'), 'height': 'p_height_mm'}}]}
        result = build(profile, design)
        self.assertTrue(result['qa_report']['valid']);self.assertTrue(any(w['code']=='PROFILE_SEX_REVIEW' for w in result['qa_report']['warnings']))
        self.assertEqual(deserialize(result['garment']['pieces'][0]['seam_contour']).segments[0].length(), 400)
        self.assertEqual(result['garment']['profile_context']['sex'], 'male')

    def test_expression_allowlist_rejects_executable_or_unbounded_programs(self):
        for formula in ["__import__('os').system('echo nope')", '(1).__class__', '[1,2][0]', 'open(1)', 'sum([1,2])', 'lambda:1', '10**1000000', '2**pi', '1/0', 'sqrt(-1)', 'True', '1e1000', 'x'*257]:
            with self.subTest(formula=formula), self.assertRaises(ValueError): expression(formula, {'pi': math.pi})
        self.assertAlmostEqual(expression('sqrt(9)+sin(rad(90))+2**-2', {}), 4.25)
        self.assertAlmostEqual(expression('degrees(atan2(1,1))', {}), 45)

    def test_arithmetic_failures_are_actionable_russian_errors_with_named_section(self):
        for formula in ['1/0', 'sqrt(-1)', 'asin(2)', 'sin(1,2)', 'min(1)', '1e1000', '1000000**4']:
            with self.subTest(formula=formula):
                with self.assertRaises(ValueError) as failure:
                    expression(formula, {}, 'деталь переда / высота')
                message = str(failure.exception)
                self.assertTrue(message.startswith('деталь переда / высота:'), message)
                self.assertNotIn('division by zero', message)
                self.assertNotIn('math domain error', message)
                self.assertNotIn('arguments', message)
                self.assertTrue(any(char in message for char in 'яюэъыьщшчцхфутсрпонмлкйизжедгвба'), message)
        for formula in ['m_waist.real', 'm_waist.__class__', '__import__(1)', 'functions.sqrt(4)']:
            with self.subTest(formula=formula), self.assertRaises(ValueError):
                expression(formula, {'m_waist': 760}, 'перед / точка')

    def test_explicit_dimension_checks_reject_mathematically_closed_but_wrong_sized_patterns(self):
        design = asymmetrical();result = build(person(), design)
        checks = result['qa_report']['dimension_checks'];self.assertEqual(len(checks), 3)
        self.assertTrue(all(check['passed'] for check in checks));self.assertAlmostEqual(checks[0]['actual_mm'], 900)
        bad = copy.deepcopy(design);bad['pieces'][0]['points']['c'][1] = 'p_height_mm+10'
        with self.assertRaisesRegex(ValueError, 'ожидалось.*рассчитано'): build(person(), bad)
        bad = copy.deepcopy(design);bad['checks'][0]['tolerance_mm'] = 2
        with self.assertRaisesRegex(ValueError, '0–1'): build(person(), bad)
        changed = copy.deepcopy(design);changed['parameters']['height_mm'] = 1000
        revised = build(person(), changed, result['garment'])
        self.assertTrue(revised['qa_report']['valid']);self.assertAlmostEqual(revised['qa_report']['dimension_checks'][0]['actual_mm'], 1000)
        self.assertEqual(result['garment']['pieces'][0]['seam_contour'][0], revised['garment']['pieces'][0]['seam_contour'][0])

    def test_unknown_fields_contours_and_bad_seam_pairings_are_rejected(self):
        base = {'version': 1, 'name': 'Прямоугольник', 'category': 'panel', 'parameters': {}, 'measurements': [], 'pieces': [{'role': 'panel', 'name': 'Панель', 'primitive': {'type': 'rectangle', 'width': 100, 'height': 200}}]}
        cases = []
        bad = copy.deepcopy(base);bad['code'] = 'print(1)';cases.append(bad)
        bad = copy.deepcopy(base);bad['pieces'][0]['primitive']['evil'] = 1;cases.append(bad)
        bad = copy.deepcopy(base);bad['pieces'][0]['translate'] = [20000, 0];cases.append(bad)
        bad = copy.deepcopy(base);bad['pieces'] *= 65;cases.append(bad)
        bad = copy.deepcopy(base);bad['pieces'][0]['cut_quantity'] = True;cases.append(bad)
        bad = copy.deepcopy(base);bad['pieces'][0]['grainline'] = [[200, 0], [200, 100]]
        self.assertTrue(build(person(), bad)['qa_blocked'])
        for bad in cases:
            with self.subTest(design=bad), self.assertRaises(ValueError): build(person(), bad)
        mismatch = copy.deepcopy(base);other = copy.deepcopy(mismatch['pieces'][0]);other['role']='second';other['primitive']['width']=110;mismatch['pieces'].append(other)
        mismatch['relations'] = [{'a': {'piece': 'panel', 'seam': 'top'}, 'b': {'piece': 'second', 'seam': 'top'}}]
        with self.assertRaises(ValueError): build(person(), mismatch)
        mismatch['relations'][0]['tolerance_mm'] = 20
        with self.assertRaises(ValueError): build(person(), mismatch)
        for update in [{'points': {'a': [0,0], 'b': [100,0], 'c': [100,100]}, 'segments': [{'name':'a','type':'line','from':'a','to':'b'},{'name':'b','type':'line','from':'b','to':'c'},{'name':'c','type':'line','from':'c','to':'b'}]},
                       {'points': {'a':[0,0],'b':[100,100],'c':[0,100],'d':[100,0]},'segments':[{'name':str(i).join(['s','']),'type':'line','from':a,'to':b} for i,(a,b) in enumerate(zip('abcd','bcda'))]}]:
            bad = copy.deepcopy(base);del bad['pieces'][0]['primitive'];bad['pieces'][0].update(update)
            with self.assertRaises(ValueError): build(person(), bad)

    def test_audit_reconstructs_actual_geometry_and_does_not_trust_cached_flags(self):
        g = build(person(), circle_skirt_example())['garment'];self.assertTrue(audit(g)['valid'])
        variants = []
        altered = copy.deepcopy(g);altered['parameters']['length_mm'] += 20;variants.append(altered)
        altered = copy.deepcopy(g);altered['pieces'][0]['cut_contour'][0]['start'][0] += 20;variants.append(altered)
        altered = copy.deepcopy(g);altered['pieces'][0]['notches'][0]['t'] = .1;variants.append(altered)
        altered = copy.deepcopy(g);altered['pieces'][1]['id'] = altered['pieces'][0]['id'];variants.append(altered)
        altered = copy.deepcopy(g);altered['pattern_design']['code'] = 'print(1)';variants.append(altered)
        for altered in variants:
            with self.subTest(variant=len(variants)):
                altered['readiness'].update(fit_verified=True, sewing_ready=True)
                report = audit(altered);self.assertFalse(report['valid']);self.assertFalse(report['fit_verified']);self.assertFalse(report['sewing_ready'])

    def test_quality_fingerprint_is_stable_for_unchanged_audit_and_changes_with_construction(self):
        from engineering.quality import fingerprint
        design = asymmetrical();original = build(person(), design)['garment']
        digest = original['qa_report']['quality']['geometry_fingerprint']
        self.assertEqual(len(digest), 64);self.assertEqual(digest, fingerprint(original))
        before = copy.deepcopy(original)
        self.assertEqual(audit(original)['quality']['geometry_fingerprint'], digest)
        self.assertEqual(audit(original)['quality']['geometry_fingerprint'], digest)
        self.assertEqual(original, before)
        revised_design = copy.deepcopy(design);revised_design['parameters']['height_mm'] += 50
        revised = build(person(), revised_design, original)['garment']
        self.assertNotEqual(revised['qa_report']['quality']['geometry_fingerprint'], digest)
        corrupted = copy.deepcopy(original);corrupted['pieces'][0]['seam_contour'][0]['start'][0] += 10
        report = audit(corrupted)
        self.assertFalse(report['valid']);self.assertNotEqual(report['quality']['geometry_fingerprint'], digest)

    def test_native_export_compacts_cut_curves_instead_of_hundreds_of_sewing_segments(self):
        from clo_curves import encode
        g = build(person(), circle_skirt_example())['garment']
        for p in g['pieces']:
            seam = encode(deserialize(p['seam_contour']));self.assertEqual(len(seam['anchors']), 6)
            cut = deserialize(p['cut_contour']);encoded = encode(cut, True)
            self.assertLessEqual(len(encoded['anchors']), 32);self.assertLess(len(encoded['anchors']), len(cut.segments)*.2)
            self.assertGreater(encoded['curves'], 0)
            self.assertLess(abs(sum(encoded['lengths'])-cut.perimeter()), max(.2, cut.perimeter()*.0002))

    def test_cli_describes_and_builds_only_declarative_input(self):
        script = str(Path(__file__).with_name('parametric_design.py'))
        capabilities = json.loads(subprocess.check_output([sys.executable, script, '--describe']))
        self.assertEqual(capabilities['method'], 'parametric_design_v1');self.assertIn('notes', capabilities['schema']['design']['allowed'])
        result = json.loads(subprocess.check_output([sys.executable, script], input=json.dumps({'profile': person(), 'design': asymmetrical()}).encode()))
        self.assertTrue(result['qa_report']['valid'])
        qa = json.loads(subprocess.check_output([sys.executable, script], input=json.dumps({'operation':'qa','garment':result['garment']}).encode()))
        self.assertTrue(qa['qa_report']['valid'])
        bad = json.loads(subprocess.check_output([sys.executable, script], input=b'{"code":"print(1)"}'))
        self.assertIn('error', bad)


if __name__ == '__main__':
    unittest.main()
