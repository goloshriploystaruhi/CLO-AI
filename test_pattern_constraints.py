import copy
import math
import unittest

from contour_engine import Contour, Point, Segment
from garment_engine import serialize
from engineering.pattern_constraints import check


def piece(role, contour, seams=None):
    return {'role': role, 'name': {'front': 'Перед', 'facing': 'Обтачка'}.get(role, role),
            'seam_contour': serialize(contour), 'seams': seams or {}}


def rectangle(role='front', width=100, height=100):
    return piece(role, Contour.polygon([(0, 0), (width, 0), (width, height), (0, height)]), {'fold': [3]})


def within(**extra):
    return dict({'type': 'within', 'piece': 'facing', 'parent': 'front', 'translate': [0, 0]}, **extra)


class PatternConstraintsTests(unittest.TestCase):
    def test_straight_fold_and_split_chain_have_exact_right_angles(self):
        p = rectangle();before = copy.deepcopy(p)
        result = check([p], [{'type': 'fold', 'piece': 'front', 'seam': 'fold', 'tolerance_deg': 0}])[0]
        self.assertTrue(result['passed']);self.assertEqual(result['angles_deg'], [90., 90.]);self.assertEqual(p, before)
        split = piece('front', Contour.polygon([(0, 0), (100, 0), (100, 100), (0, 100), (0, 50)]), {'fold': [3, 4]})
        self.assertEqual(check([split], [{'type': 'fold', 'piece': 'front', 'seam': 'fold'}])[0]['angles_deg'], [90., 90.])

    def test_fold_uses_analytic_cubic_endpoint_tangent_not_sampled_chord(self):
        p0, p1, p2, p3 = Point(0, 0), Point(100, 0), Point(100, 100), Point(0, 100)
        for first in [Point(25, 0), p0]:
            contour = Contour((Segment(p0, p1, first, Point(70, 0) if first == p0 else Point(70, 70)),
                               Segment(p1, p2), Segment(p2, p3), Segment(p3, p0)))
            p = piece('front', contour, {'fold': [3]})
            result = check([p], [{'type': 'fold', 'piece': 'front', 'seam': 'fold', 'tolerance_deg': 0}])
            self.assertEqual(result[0]['angles_deg'], [90., 90.])
        contour = Contour((Segment(p0, p1, Point(25, 10), Point(70, 70)), Segment(p1, p2), Segment(p2, p3), Segment(p3, p0)))
        with self.assertRaisesRegex(ValueError, 'Перед.*fold.*касательная'):
            check([piece('front', contour, {'fold': [3]})], [{'type': 'fold', 'piece': 'front', 'seam': 'fold'}])

    def test_fold_rejects_curved_disconnected_full_contour_or_undefined_fold(self):
        for indices in [[0, 2], [0, 1, 2, 3], [], [[0]], [True], [88]]:
            p = rectangle();p['seams']['fold'] = indices
            with self.assertRaises(ValueError):check([p], [{'type': 'fold', 'piece': 'front', 'seam': 'fold'}])
        p = piece('front', Contour.polygon([(0, 0), (100, 0), (100, 100), (0, 100), (2, 50)]), {'fold': [3, 4]})
        with self.assertRaisesRegex(ValueError, 'одной прямой'):check([p], [{'type': 'fold', 'piece': 'front', 'seam': 'fold'}])
        p = rectangle();p['seam_contour'][3].update(c1=[0, 70], c2=[0, 30])
        with self.assertRaisesRegex(ValueError, 'прямых сегментов'):check([p], [{'type': 'fold', 'piece': 'front', 'seam': 'fold'}])

    def test_within_alignment_is_explicit_and_transform_does_not_mutate_source(self):
        pieces = [rectangle(), rectangle('facing', 20, 10)];before = copy.deepcopy(pieces)
        result = check(pieces, [within(translate=[60, 60], rotate_deg=90, mirror='y', tolerance_mm=0)])[0]
        self.assertTrue(result['passed']);self.assertEqual(result['max_outside_mm'], 0);self.assertEqual(pieces, before)
        missing = within();missing.pop('translate')
        with self.assertRaisesRegex(ValueError, 'поля'):check(pieces, [missing])

    def test_concave_parent_detects_crossing_even_when_every_child_vertex_is_inside(self):
        parent = piece('front', Contour.polygon([(0, 0), (100, 0), (100, 100), (70, 100), (70, 30), (30, 30), (30, 100), (0, 100)]))
        child = piece('facing', Contour.polygon([(10, 70), (90, 70), (90, 90), (10, 90)]))
        with self.assertRaisesRegex(ValueError, 'Обтачка.*Перед.*выходит'):
            check([parent, child], [within(tolerance_mm=0)])

    def test_narrow_parent_notch_is_not_missed_by_regular_sampling(self):
        parent = piece('front', Contour.polygon([(0, 0), (100, 0), (100, 100), (50.01, 100), (50.01, 30), (49.99, 30), (49.99, 100), (0, 100)]))
        child = piece('facing', Contour.polygon([(10, 70), (90, 70), (90, 90), (10, 90)]))
        with self.assertRaisesRegex(ValueError, 'выходит'):
            check([parent, child], [within(tolerance_mm=0)])

    def test_within_quantifies_permitted_outside_distance_and_rejects_excess(self):
        child = piece('facing', Contour.polygon([(10, 10), (100.05, 10), (100.05, 90), (10, 90)]))
        result = check([rectangle(), child], [within(tolerance_mm=.1)])[0]
        self.assertAlmostEqual(result['max_outside_mm'], .05);self.assertEqual(result['curve_error_mm'], 0)
        with self.assertRaisesRegex(ValueError, 'выходит'):
            check([rectangle(), child], [within(tolerance_mm=.01)])
        self.assertEqual(check([rectangle(), rectangle('facing')], [within(tolerance_mm=0)])[0]['max_outside_mm'], 0)

    def test_curved_containment_accounts_for_flattening_error(self):
        p0, p1, p2, p3 = Point(10, 10), Point(90, 10), Point(90, 90), Point(10, 90)
        contour = Contour((Segment(p0, p1, Point(25, 5), Point(70, 5)), Segment(p1, p2), Segment(p2, p3), Segment(p3, p0)))
        child = piece('facing', contour)
        result = check([rectangle(), child], [within(tolerance_mm=0)])[0]
        self.assertTrue(result['passed']);self.assertGreater(result['curve_error_mm'], 0);self.assertEqual(result['max_outside_mm'], 0)
        host = piece('front', contour)
        self.assertTrue(check([host, child], [within(tolerance_mm=.1)])[0]['passed'])
        with self.assertRaisesRegex(ValueError, 'погрешность кривых'):
            check([host, child], [within(tolerance_mm=0)])

    def test_direct_call_strict_schema_and_limits(self):
        pieces = [rectangle(), rectangle('facing', 10, 10)]
        for spec in [within(translate=[0]), within(translate=[False, 0]), within(rotate_deg=float('nan')), within(mirror='z'),
                     within(tolerance_mm=-1), within(tolerance_mm=1.1), within(parent='absent'), within(piece='absent'),
                     within(parent='facing'), within(unexpected='code'), {'type': 'fold', 'piece': 'front', 'seam': 'fold', 'tolerance_deg': 3}]:
            with self.subTest(spec=spec):
                with self.assertRaises(ValueError):check(pieces, [spec])
        with self.assertRaisesRegex(ValueError, '64'):check(pieces, [within()]*65)
        with self.assertRaisesRegex(ValueError, 'уникальными'):check([rectangle(), rectangle()], [])
        self.assertEqual(check(pieces, []), [])


if __name__ == '__main__':
    unittest.main()
