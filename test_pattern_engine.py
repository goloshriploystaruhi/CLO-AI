import unittest
from pattern_engine import rectangle


class GeometryTests(unittest.TestCase):
    def test_rectangle_dimensions_and_area(self):
        points = rectangle(400, 600)
        area = sum(points[i][0] * points[(i+1) % 4][1] -
                   points[(i+1) % 4][0] * points[i][1] for i in range(4)) / 2
        self.assertEqual(area, 240000)
        self.assertEqual(len(set(points)), 4)

    def test_invalid_dimensions(self):
        for value in (0, -1, float('nan'), float('inf'), True, '400', 10001):
            with self.subTest(value=value), self.assertRaises(ValueError):
                rectangle(value, 600)


if __name__ == '__main__':
    unittest.main()
