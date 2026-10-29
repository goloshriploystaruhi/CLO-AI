import copy
import json
import math
from pathlib import Path
import unittest
from contour_engine import Point,Contour
from pattern_recipes import build
from garment_engine import deserialize
from clo_curves import encode,_distance
from engineering.native import readback


class CompactCurveTests(unittest.TestCase):
    def test_circle_has_four_native_arcs_at_all_sizes(self):
        for diameter in (10,100,1000):
            c=build({'type':'circle','diameter_mm':diameter});e=encode(c)
            self.assertEqual(len(e['anchors']),4);self.assertEqual(e['curves'],4)
            self.assertEqual(len(e['points']),12)
            self.assertLess(abs(sum(e['lengths'])-math.pi*diameter),diameter*.0005)
    def test_exact_bezier_handles_and_corner_anchors_survive(self):
        c=build({'type':'shaped_panel','width_mm':350,'height_mm':800});before=copy.deepcopy(c)
        e=encode(c);self.assertEqual(c,before)
        self.assertEqual(len(e['anchors']),len(c.segments))
        for s in c.segments:
            self.assertIn((s.start.x,s.start.y,0),e['points'])
            if s.c1:self.assertIn((s.c1.x,s.c1.y,3),e['points'])
    def test_sampled_cut_contours_are_compact_without_losing_shape(self):
        from tests.synthetic_garment import tshirt
        g=tshirt()
        for p in g['pieces'][:4]:
            c=deserialize(p['cut_contour']);e=encode(c,True)
            self.assertLess(len(e['anchors']),len(c.segments)*.6)
            source=[s.start for s in c.segments];flat=e['contour'].clo_points(.008);actual=[Point(x,y) for x,y,_ in flat]
            error=max(min(_distance(q,a,b) for a,b in zip(source,source[1:]+source[:1])) for q in actual)
            self.assertLessEqual(error,.08)
            self.assertLessEqual(abs(e['contour'].perimeter()-c.perimeter()),max(.2,c.perimeter()*.0002))
            for axis in ('x','y'):
                for op in (min,max):self.assertIn(op(source,key=lambda q:getattr(q,axis)),[s.start for s in e['contour'].segments])
    def test_native_and_legacy_stitch_measurements_are_both_supported(self):
        c=build({'type':'circle','diameter_mm':100})
        from garment_engine import serialize
        for compact in (False,True):
            pts=encode(c)['anchors'] if compact else [p[:2] for p in c.clo_points(.1)]
            lengths=encode(c)['lengths'] if compact else [math.dist(a,b) for a,b in zip(pts,pts[1:]+pts[:1])]
            shape={'PointList':[{'Point positionX':x,'Point positionY':-y} for x,y in pts],
                   'LineList':[{'Line length':v} for v in lengths],'Shape index':'0'}
            root={'PointList':shape['PointList'],'Children Information':[shape]}
            class API:
                def GetPatternInputInformation(self,i):return {'Pattern InputInformation':[root]}
                def GetLineLength(self,i,j):return lengths[j]
            r=readback(API(),0,[(x,-y) for x,y in pts],{'seam_contour':serialize(c)})
            self.assertTrue(r['stitch_measured']);self.assertEqual(len(r['stitch_segment_lengths_mm']),4)
            self.assertEqual(r['stitch_encoding'],'native_bezier' if compact else 'legacy_polyline')
    def test_rectangle_does_not_acquire_curves(self):
        e=encode(Contour.polygon([(0,0),(100,0),(100,200),(0,200)]),True)
        self.assertEqual(e['curves'],0);self.assertEqual(len(e['points']),4)


if __name__=='__main__':unittest.main()
