import unittest
from clo_adapter import placement, create_rectangle


class AdapterTests(unittest.TestCase):
    def test_gap_after_existing_pattern(self):
        data = {'Pattern InputInformation': [{'LineList': [{'Line type': 'Straight type'}],
                'PointList': [{'Point positionX': x, 'Point positionY': y}
                              for x, y in [(200, -100), (600, -100), (600, 500), (200, 500)]]}]}
        self.assertEqual(placement([data]), (650, -100))

    def test_unknown_geometry_stops(self):
        with self.assertRaises((ValueError, KeyError)):
            placement([{}])

    def test_empty_project_creates_and_checks(self):
        class API:
            count = 0
            def GetPatternCount(self): return self.count
            def CreatePatternWithPoints(self, points):
                self.points = points
                self.count += 1
            def GetLineLength(self, index, line): return [300, 500, 300, 500][line]
        result = create_rectangle({'width_mm': 300, 'height_mm': 500}, API(), None)
        self.assertEqual(result['line_lengths_mm'], [300, 500, 300, 500])
        self.assertIsNone(result['backup'])
