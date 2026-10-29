import unittest
from geometry_validation import validate
class ValidationTests(unittest.TestCase):
    def test_open_contour(self):
        spec={'type':'contour','name':'Перед','segments':[{'start':[0,0],'end':[100,0]},{'start':[100,1],'end':[0,0]}]}
        r=validate([spec]);self.assertFalse(r['valid']);self.assertIn('замкнут',r['errors'][0]['message'])
    def test_zero_segment_is_localized(self):
        spec={'type':'contour','name':'Левая','segments':[{'start':a,'end':b} for a,b in [([0,0],[100,0]),([100,0],[100,0]),([100,0],[0,100]),([0,100],[0,0])]]}
        r=validate([spec]);self.assertFalse(r['valid']);self.assertTrue(any(e['section']=='s1' and e['piece']=='Левая' for e in r['errors']))
    def test_invalid_bezier(self):
        spec={'type':'contour','segments':[{'start':[0,0],'end':[100,0],'c1':[20,20]},{'start':[100,0],'end':[0,0]}]}
        self.assertFalse(validate([spec])['valid'])
    def test_invalid_seam_reference(self):
        spec={'type':'rectangle','width_mm':100,'height_mm':200}
        r=validate([spec],[{'a':{'piece':-1,'segments':[0]},'b':{'piece':0,'segments':[0]}}]);self.assertFalse(r['valid'])
