"""New-worker/embedded-CLO parity without a running CLO or a garment preset.

CLO 7.0.228's recorded runtime is Python 3.7.9. The tests emulate its numeric
AST nodes; modern ast.parse no longer emits Num, even with feature_version=3.7.
"""
import ast
import copy
import json
import unittest
from unittest.mock import patch

import parametric_design
from clo_operations import dispatch
from engineering.validation import validate
from test_clo_operations import FakeCLO


class Num(ast.AST):
    _fields = ('n',)

    def __init__(self, n):
        self.n = n


class LegacyNumericAST:
    Num = Num

    def __init__(self):
        self.Num = Num
        self.numeric_nodes = 0

    def __getattr__(self, name):
        return getattr(ast, name)

    def parse(self, source, mode='eval'):
        owner = self

        class Convert(ast.NodeTransformer):
            def visit_Constant(self, node):
                if type(node.value) in (int, float):
                    owner.numeric_nodes += 1
                    return Num(node.value)
                return node

        return Convert().visit(ast.parse(source, mode=mode))


def curved_design():
    panel = {
        'role': 'left', 'name': 'Фигурная накладка слева', 'cut_quantity': 2,
        'points': {'a': [0, 0], 'b': ['span', 0],
                   'c': ['span+60', 'p_height_mm'], 'd': [0, 'p_height_mm'],
                   'q': ['span/2', 'p_round_mm'],
                   'r': ['span', 'p_height_mm/3'],
                   's': ['span+60', '2*p_height_mm/3']},
        'segments': [
            {'name': 'top', 'type': 'quadratic', 'from': 'a', 'to': 'b', 'control': 'q'},
            {'name': 'side', 'type': 'cubic', 'from': 'b', 'to': 'c', 'controls': ['r', 's']},
            {'name': 'hem', 'type': 'line', 'from': 'c', 'to': 'd'},
            {'name': 'left', 'type': 'line', 'from': 'd', 'to': 'a'}]}
    other = copy.deepcopy(panel)
    other.update(role='right', name='Фигурная накладка справа', mirror='y',
                 translate=['3*p_width_mm', 0])
    return {
        'version': 1, 'name': 'Новая парная фигурная накладка', 'category': 'custom_insert',
        'parameters': {'width_mm': 240, 'height_mm': 360, 'round_mm': 20},
        'measurements': [],
        'variables': {'double_width': '2*p_width_mm', 'span': 'double_width/2',
                      'upper_level': 'p_height_mm-40',
                      'hypotenuse': 'hypot(3,4,12)', 'power': '2**-2'},
        'pieces': [panel, other],
        'relations': [{'a': {'piece': 'left', 'seam': 'left'},
                       'b': {'piece': 'right', 'seam': 'left'}, 'direction': 'reverse'}],
        'checks': [{'piece': role, 'metric': 'height', 'expected': 'p_height_mm',
                    'tolerance_mm': .01} for role in ('left', 'right')]
    }


class NativeExpressionCompatibilityTests(unittest.TestCase):
    def test_numeric_expressions_are_identical_for_legacy_and_modern_numeric_ast(self):
        env = {'p_width_mm': 100, 'p_height_mm': 180}
        values = ['2*p_width_mm', 'p_height_mm-40', 'p_width_mm/2',
                  '(p_width_mm+20)*.5', '2**-2', 'sqrt(9)+abs(-3)',
                  'hypot(3,4,12)', 'hypot(3)', '2+3.5', 'hypot(1e-200,1e-200)']
        expected = [parametric_design.expression(text, env) for text in values]
        legacy = LegacyNumericAST()
        with patch.object(parametric_design, 'ast', legacy):
            actual = [parametric_design.expression(text, env) for text in values]
        self.assertEqual(actual, expected)
        self.assertGreater(legacy.numeric_nodes, 0)
        self.assertEqual(expected[6:8], [13, 3])
        self.assertGreater(expected[-1], 0, 'hypot must not underflow by squaring small inputs')

    def test_serialized_mathematical_job_passes_same_gate_in_embedded_numeric_ast(self):
        profile = {'id': 'geometry-only', 'metadata': {'sex': 'unspecified'}, 'measurements': {}}
        result = parametric_design.build(profile, curved_design())
        self.assertTrue(result['qa_report']['valid'])
        # Mirror the real worker -> Node IPC -> disk JSON -> embedded bridge path.
        job = json.loads(json.dumps(result))
        job.update(id='synthetic-main-job', project_guard={'context_session_id': 'isolated'})
        legacy = LegacyNumericAST()
        api = FakeCLO()
        with patch.object(parametric_design, 'ast', legacy):
            replay = validate(job['garment'], reconstruct=True)
            self.assertTrue(replay['valid'], replay['issues'])
            native = dispatch(job, api, api)
        self.assertGreater(legacy.numeric_nodes, 0)
        self.assertEqual(len(native['patterns']), 2)
        self.assertEqual(api.GetPatternCount(), 2, 'cut_quantity is metadata, not native clone count')
        self.assertEqual([p['cut_quantity'] for p in job['garment']['pieces']], [2, 2])
        self.assertTrue(native['qa_report']['valid'])
        self.assertFalse(native['qa_report']['fit_verified'])
        for part in native['patterns']:
            self.assertGreater(part['export']['native_curves'], 0)
            self.assertTrue(part['native_measurement']['cut_coordinates_verified'])
            self.assertLess(part['native_measurement']['max_coordinate_error_mm'], .06)
            self.assertAlmostEqual(part['perimeter_mm'], part['analytic_perimeter_mm'], delta=.2)
        self.assertAlmostEqual(native['patterns'][0]['perimeter_mm'], native['patterns'][1]['perimeter_mm'], delta=.01)
        self.assertEqual(job['garment']['pattern_design']['parameters'], curved_design()['parameters'])

    def test_legacy_nodes_do_not_enable_code_booleans_complex_or_unbounded_exponents(self):
        unsafe = ["__import__('os').getcwd()", 'p_width_mm.__class__',
                  '(lambda:1)()', 'True', 'False', '1j', '1e1000',
                  '2**-5', '2**p_width_mm', '10/0', '[1,2][0]']
        with patch.object(parametric_design, 'ast', LegacyNumericAST()):
            for expression in unsafe:
                with self.subTest(expression=expression):
                    with self.assertRaises(ValueError):
                        parametric_design.expression(expression, {'p_width_mm': 100})

    def test_failed_legacy_reconstruction_never_calls_native_creation(self):
        job = parametric_design.build({'id': 'geometry-only', 'measurements': {}}, curved_design())
        job['garment']['pattern_design']['variables']['double_width'] = "__import__('os')"
        job['garment']['qa_report']['valid'] = True
        api = FakeCLO()
        with patch.object(parametric_design, 'ast', LegacyNumericAST()):
            with self.assertRaises(ValueError):
                dispatch(job, api, api)
        self.assertEqual(api.GetPatternCount(), 0)

    def test_invalid_generic_quantities_are_still_rejected_before_creation(self):
        for quantity in (0, 9, True, 1.5):
            with self.subTest(quantity=quantity):
                job = parametric_design.build({'id': 'geometry-only', 'measurements': {}}, curved_design())
                job['garment']['pieces'][0]['cut_quantity'] = quantity
                api = FakeCLO()
                with self.assertRaises(ValueError):
                    dispatch(job, api, api)
                self.assertEqual(api.GetPatternCount(), 0)


if __name__ == '__main__':
    unittest.main()
