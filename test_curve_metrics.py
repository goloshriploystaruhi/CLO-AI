"""Precision regressions: semantic seam positions never depend on raw t."""
import ast
import copy
import json
import math
from pathlib import Path
import unittest

from contour_engine import Point, Segment, SegmentChain, Contour
from category_constructors import Kit
from garment_engine import deserialize
from clo_adapter import production_lines


class CurveMetricTests(unittest.TestCase):
    def setUp(self):
        self.uneven=Segment(Point(0,0),Point(100,0),Point(1,0),Point(10,0))

    def test_arc_midpoint_is_not_parameter_midpoint_and_curve_is_unchanged(self):
        before=copy.deepcopy(self.uneven)
        self.assertLess(self.uneven.point(.5).x,20)
        t=self.uneven.parameter_at_length(50,.00001)
        self.assertGreater(t,.5)
        self.assertAlmostEqual(self.uneven.point(t).x,50,places=4)
        self.assertEqual(self.uneven,before)
        self.assertEqual(self.uneven.point(0),self.uneven.start)
        self.assertEqual(self.uneven.point(1),self.uneven.end)

    def test_inverse_length_residual_on_curved_and_reversed_cubic(self):
        curve=Segment(Point(10,20),Point(130,50),Point(11,180),Point(70,-60))
        reverse=curve.reversed()
        for fraction in (.001,.1,.25,.5,.8,.999):
            total=curve.length(.00001);distance=total*fraction
            t=curve.parameter_at_length(distance,.0001)
            self.assertLess(abs(curve.split(t)[0].length(.00001)-distance),.0001)
            point=curve.point(t)
            opposite=reverse.point_at_length(total-distance,.0001)
            self.assertLess(point.distance(opposite),.0002)
            tangent=curve.tangent(t);other=reverse.tangent(1-t)
            self.assertAlmostEqual(math.hypot(tangent.x,tangent.y),1)
            self.assertAlmostEqual(tangent.x,-other.x)
            self.assertAlmostEqual(tangent.y,-other.y)

    def test_chain_walk_handles_boundaries_and_reversal_without_new_anchors(self):
        first=Segment(Point(0,0),Point(20,0))
        second=Segment(Point(20,0),Point(100,0),Point(21,0),Point(30,0))
        chain=SegmentChain((first,second))
        for distance in (0,5,20,50,99,100):
            index,t,point=chain.position(distance,.00001)
            self.assertAlmostEqual(point.x,distance,places=4)
            self.assertLess(point.distance(chain.reversed().position(100-distance,.00001)[2]),.00001)
        self.assertEqual(chain.position(20)[:2],(0,1))
        self.assertEqual(len(chain.segments),2)
        self.assertEqual(second.c1,Point(21,0))

    def test_endpoint_tangent_uses_analytic_limit_and_degenerate_tangents_fail(self):
        curve=Segment(Point(0,0),Point(100,0),Point(0,0),Point(100,0))
        self.assertEqual(curve.tangent(0),Point(1,0));self.assertEqual(curve.tangent(1),Point(1,0))
        with self.assertRaisesRegex(ValueError,'Касательная'):
            Segment(Point(0,0),Point(0,0)).tangent(.5)
        with self.assertRaisesRegex(ValueError,'Касательная'):
            Segment(Point(0,0),Point(0,0),Point(100,0),Point(100,0)).tangent(.5)

    def test_invalid_positions_and_disconnected_seams_are_rejected(self):
        for distance in (-1,101,float('inf'),True):
            with self.assertRaises(ValueError):self.uneven.parameter_at_length(distance)
        for tolerance in (0,-1,float('nan'),True):
            with self.assertRaises(ValueError):self.uneven.parameter_at_length(50,tolerance)
        with self.assertRaises(ValueError):SegmentChain(())
        with self.assertRaisesRegex(ValueError,'непрерывную'):
            SegmentChain((Segment(Point(0,0),Point(10,0)),Segment(Point(11,0),Point(20,0))))
        with self.assertRaisesRegex(ValueError,'нулевой'):
            SegmentChain((Segment(Point(0,0),Point(0,0)),)).position(0)

    def kit(self,alignment,direction='reverse'):
        a=Contour((self.uneven,Segment(Point(100,0),Point(100,40)),Segment(Point(100,40),Point(0,40)),Segment(Point(0,40),Point(0,0))))
        b=Contour.polygon([(0,0),(20,0),(100,0),(100,40),(0,40)])
        metadata={'id':'analytic_test','name':'Проверка швов','category':'test','variant':'проверка','required_measurements':[],'required_roles':['a','b']}
        kit=Kit('analytic_test',{'id':'fixture','measurements':{}},{'seam_allowance_mm':5},None,metadata)
        kit.add('a','Перед',a);kit.add('b','Спинка',b)
        kit.join('a',[0],'b',[0,1],direction=direction);kit.graph[-1]['alignment']=alignment
        return kit

    def test_all_declared_marks_are_walked_on_both_oriented_seams(self):
        kit=self.kit([0,.2,.5,.8,1]);before=[copy.deepcopy(p['seam_contour']) for p in kit.pieces]
        garment=kit.finish()['garment'];self.assertEqual([p['seam_contour'] for p in garment['pieces']],before)
        for piece,expected in zip(garment['pieces'],([20,50,80],[80,50,20])):
            contour=deserialize(piece['seam_contour']);marks=piece['notches'];self.assertEqual(len(marks),3)
            points=[contour.segments[mark['segment']].point(mark['t']) for mark in marks]
            self.assertTrue(all(abs(point.x-value)<.001 for point,value in zip(points,expected)))
            guides=[line for line in production_lines(piece) if line['kind']=='alignment_guide']
            self.assertEqual(len(guides),3)
            for guide in guides:
                self.assertAlmostEqual(guide['points'][0][1],0)
                self.assertLess(guide['points'][1][1],0)
        self.assertEqual(garment['pieces'][1]['notches'][-1]['t'],1)
        self.assertFalse(garment['readiness']['sewing_ready'])

    def test_endpoint_only_relation_does_not_invent_midpoint_marks(self):
        kit=self.kit([0,1]);garment=kit.finish()['garment']
        self.assertTrue(all(not piece['notches'] for piece in garment['pieces']))
        for bad in ([0,.5,.5,1],[0,float('nan'),1],[0,True,1],[0,.8,.2,1]):
            with self.assertRaisesRegex(ValueError,'контрольные позиции'):
                self.kit(bad).finish()

    def test_saved_default_midpoints_keep_their_original_strict_parameters(self):
        # Fixture was generated by the actual previous Kit class extracted
        # from commit3b43b40, not by the new metric helper under test.
        legacy=json.loads(Path('tests/fixtures/legacy-seam-marks.json').read_text(encoding='utf8'))
        self.assertEqual(legacy['source_commit'],'3b43b40')
        metadata={'id':'analytic_test','name':'Проверка швов','category':'test','variant':'проверка','required_measurements':[],'required_roles':['a','b']}
        for case in legacy['cases']:
            kit=Kit('analytic_test',{'id':'fixture','measurements':{}},{'seam_allowance_mm':5},None,metadata)
            contour=deserialize(case['segments'])
            kit.add('a','Перед',contour);kit.add('b','Спинка',contour)
            kit.join('a',case['indices'],'b',case['indices'])
            for piece in kit.finish()['garment']['pieces']:
                mark=piece['notches'][0]
                self.assertEqual(mark['segment'],case['expected_segment'])
                self.assertEqual(mark['t'],case['expected_t'])

    def test_new_geometry_methods_remain_python37_parseable(self):
        for file in ('contour_engine.py','category_constructors.py','clo_adapter.py','sewing_map.py'):
            ast.parse(Path(file).read_text(encoding='utf8'),filename=file,feature_version=(3,7))


if __name__=='__main__':unittest.main()
