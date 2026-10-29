import math
import unittest
from contour_engine import Point, Segment, Contour
from pattern_recipes import build


class ContourTests(unittest.TestCase):
    def setUp(self):
        self.rect=Contour.polygon([(0,0),(400,0),(400,600),(0,600)])

    def test_perimeter_and_transforms(self):
        self.assertEqual(self.rect.perimeter(),2000)
        transformed=self.rect.rotated(37).translated(-123,90).reflected('y',50)
        self.assertAlmostEqual(transformed.perimeter(),2000)
        self.assertAlmostEqual(self.rect.scaled(2).perimeter(),4000)
        self.assertAlmostEqual(self.rect.scaled(2,3).perimeter(),5200)

    def test_split_cubic_preserves_length(self):
        s=Segment(Point(0,0),Point(100,0),Point(0,100),Point(100,100))
        a,b=s.split(.3)
        self.assertEqual(a.end,b.start)
        self.assertAlmostEqual(s.length(),a.length()+b.length(),places=3)
        self.assertAlmostEqual(s.length(),200,places=3)
        self.assertGreater(len(s.flatten(.1)),10)

    def test_edit_nodes(self):
        split=self.rect.insert_point(0,.25)
        self.assertEqual(len(split.segments),5)
        self.assertEqual(split.perimeter(),2000)
        self.assertEqual(split.delete_point(1).clo_points(),self.rect.clo_points())
        moved=self.rect.move_point(1,Point(450,0))
        self.assertEqual(moved.segments[0].end,Point(450,0))
        self.assertEqual(moved.segments[1].start,Point(450,0))

    def test_smooth_join_tangent(self):
        contour=self.rect.smooth_point(1,20)
        a,b=contour.segments[0:2]; p=b.start
        self.assertAlmostEqual(p.x-a.c2.x,b.c1.x-p.x)
        self.assertAlmostEqual(p.y-a.c2.y,b.c1.y-p.y)

    def test_self_intersection_rejected(self):
        with self.assertRaises(ValueError):
            Contour.polygon([(0,0),(100,100),(0,100),(100,0)]).clo_points()

    def test_circle_recipe(self):
        c=build({'type':'circle','diameter_mm':100})
        # Four cubics approximate a circle; not an exact rational circle.
        self.assertLess(abs(c.perimeter()-math.pi*100),.05)
        self.assertGreater(len(c.clo_points()),20)

    def test_asymmetric_trapezoid(self):
        c=build({'type':'trapezoid','top_mm':100,'bottom_mm':200,'height_mm':300,'offset_mm':0})
        self.assertEqual(c.segments[2].end,Point(0,300))
        self.assertEqual(len(c.clo_points()),4)

    def test_invalid_numbers_and_scales(self):
        for v in (float('nan'),float('inf'),True):
            with self.assertRaises(ValueError): Point(v,0)
        with self.assertRaises(ValueError): self.rect.scaled(0)
        with self.assertRaises(ValueError): self.rect.segments[0].split(0)

    def test_open_contour_rejected(self):
        with self.assertRaises(ValueError):
            Contour((Segment(Point(0,0),Point(1,0)),Segment(Point(2,0),Point(0,0))))
