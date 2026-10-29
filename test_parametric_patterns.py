import unittest
from parametric_patterns import TrouserParameters, TrouserPanel
from pattern_recipes import build


class ParametricTests(unittest.TestCase):
    def setUp(self):
        self.panel=TrouserPanel(TrouserParameters(length_mm=1050,hip_width_mm=250,
            knee_width_mm=190,hem_width_mm=170,rise_mm=280,knee_y_mm=600,
            hip_y_mm=180,waist_width_mm=210,crotch_extension_mm=45))

    def test_valid_contour(self):
        points=self.panel.contour().clo_points()
        self.assertGreater(len(points),10)
        self.assertGreater(self.panel.contour().perimeter(),2000)

    def test_knee_change_is_local_not_scaling(self):
        old=self.panel.landmarks();new=self.panel.updated(knee_width_mm=220).landmarks()
        for key in old:
            if not key.startswith('knee'): self.assertEqual(old[key],new[key])
        self.assertEqual(new['knee_side'].x-new['knee_inner'].x,220)
        self.assertNotEqual(self.panel.contour().perimeter(),self.panel.updated(knee_width_mm=220).contour().perimeter())

    def test_length_changes_hem_only(self):
        old=self.panel.landmarks();new=self.panel.updated(length_mm=1100).landmarks()
        self.assertEqual(new['hem_side'].y-old['hem_side'].y,50)
        self.assertEqual(old['knee_side'],new['knee_side'])
        self.assertEqual(old['hip_side'],new['hip_side'])

    def test_waist_position_translates_construction(self):
        old=self.panel.landmarks();new=self.panel.updated(waist_y_mm=30).landmarks()
        for key in old:
            self.assertEqual(new[key].y-old[key].y,30)
            self.assertEqual(new[key].x,old[key].x)

    def test_ease_applies_to_corresponding_section(self):
        l=self.panel.updated(hip_ease_mm=20).landmarks()
        self.assertEqual(l['hip_side'].x-l['hip_inner'].x,270)
        self.assertEqual(l['hem_side'],self.panel.landmarks()['hem_side'])

    def test_shape_keeps_landmarks(self):
        changed=self.panel.updated(side_shape=.3,inseam_shape=.7,crotch_shape=.8)
        self.assertEqual(changed.landmarks(),self.panel.landmarks())
        self.assertNotEqual(changed.contour().segments,self.panel.contour().segments)
        changed.contour().clo_points()

    def test_invalid_dependencies_rejected(self):
        for change in ({'length_mm':500},{'rise_mm':700},{'knee_width_mm':-1},{'hip_ease_mm':-5}):
            with self.assertRaises(ValueError): self.panel.updated(**change)

    def test_serialization_and_no_scaling(self):
        self.assertEqual(build(self.panel.to_recipe()),self.panel.contour())
        spec=self.panel.to_recipe();spec['scale']=2
        with self.assertRaises(ValueError): build(spec)
