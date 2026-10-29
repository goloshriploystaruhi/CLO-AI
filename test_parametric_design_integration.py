import copy
import unittest

from parametric_design import build, circle_skirt_example
from engineering.validation import validate
from clo_operations import dispatch
from test_clo_operations import FakeCLO


class ParametricNativeGatewayTests(unittest.TestCase):
    def test_generic_design_passes_the_same_native_gate_and_keeps_compact_curves(self):
        profile = {'id': 'person', 'metadata': {'sex': 'female'}, 'measurements': {
            'waist': {'value': 800, 'unit': 'mm', 'source': 'manual', 'status': 'unverified'}}}
        job = build(profile, circle_skirt_example())
        self.assertTrue(validate(job['garment'])['valid'])
        api = FakeCLO()
        result = dispatch(job, api, api)
        self.assertEqual(len(result['patterns']), 2)
        self.assertTrue(result['qa_report']['valid'])
        for part in result['patterns']:
            self.assertLessEqual(part['segments'], 32)
            self.assertGreater(part['export']['native_curves'], 0)
        self.assertFalse(job['garment']['readiness']['sewing_ready'])

    def test_forged_valid_flag_never_bypasses_generic_reconstruction_before_native_creation(self):
        profile = {'id': 'person', 'metadata': {}, 'measurements': {
            'waist': {'value': 800, 'unit': 'mm', 'source': 'manual', 'status': 'verified'}}}
        job = build(profile, circle_skirt_example())
        broken = copy.deepcopy(job)
        broken['garment']['pieces'][0]['seam_contour'][0]['start'][0] += 20
        broken['garment']['qa_report']['valid'] = True
        api = FakeCLO()
        with self.assertRaises(ValueError):
            dispatch(broken, api, api)
        self.assertEqual(api.GetPatternCount(), 0)


if __name__ == '__main__':
    unittest.main()
