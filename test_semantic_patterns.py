import unittest
from parametric_patterns import TrouserPanel, TrouserParameters
from semantic_patterns import describe

class SemanticTests(unittest.TestCase):
    def test_named_geometry_and_local_parameter_change(self):
        panel=TrouserPanel(TrouserParameters(1050,250,190,170,280,600,180,210,45))
        data=describe(panel.to_recipe(),panel.contour())
        self.assertEqual(data['landmarks']['hem_side']['x'],85)
        self.assertEqual(data['seams']['side'],['s1','s2','s3','s4'])
        self.assertIn('hip_side',data['dependencies']['hip_width_mm'])
        changed=panel.updated(hip_width_mm=280)
        changed.contour().clo_points()
        self.assertEqual(changed.landmarks()['hem_side'],panel.landmarks()['hem_side'])
