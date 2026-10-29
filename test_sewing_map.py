import copy
import json
import unittest
from pathlib import Path
from test_clo_operations import FakeCLO
from test_tshirt_engine import fixture
from tshirt_engine import construct
from clo_operations import dispatch, fingerprint
from sewing_map import resolve_map


class NativeLinesCLO(FakeCLO):
    def __init__(self, legacy=False):
        super().__init__()
        self.legacy = legacy

    def CreateInternalShapeWithPoints(self, index, points, closed):
        if self.legacy and closed:
            from contour_engine import Point, Segment, Contour
            anchors = [i for i, p in enumerate(points) if p[2] == 0]
            segments = []
            for a, b in zip(anchors, anchors[1:] + anchors[:1]):
                controls = [points[j % len(points)] for j in range(a + 1, b if b > a else b + len(points))]
                segments.append(Segment(Point(*points[a][:2]), Point(*points[b][:2]),
                                        Point(*controls[0][:2]) if controls else None,
                                        Point(*controls[1][:2]) if controls else None))
            points = Contour(segments).clo_points(.1)
        self.pieces[index].setdefault('children', []).append({'points': points, 'closed': closed})

    def GetPatternInputInformation(self, index):
        data = json.loads(super().GetPatternInputInformation(index))
        shapes = [{'Children shape count': str(len(self.pieces[index].get('children', [])))}]
        for i, shape in enumerate(self.pieces[index].get('children', [])):
            anchors = [p for p in shape['points'] if p[2] == 0]
            fake = FakeCLO()
            fake.CreatePatternWithPoints(shape['points'])
            count = len(anchors) if shape['closed'] else len(anchors) - 1
            shapes.append({'Shape index': str(i),
                           'PointList': [{'Point count': str(len(anchors))}] + [
                               {'Point index': str(j), 'Point positionX': p[0], 'Point positionY': p[1]}
                               for j, p in enumerate(anchors)],
                           'LineList': [{'Line count': str(count)}] + [
                               {'Line index': str(j), 'Line length': fake.GetLineLength(0, j)} for j in range(count)]})
        data['Pattern InputInformation'][0]['Children Information'] = shapes
        return data


class SewingMapTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        profile, parameters = fixture()
        cls.job = construct(profile, parameters)

    def scene(self, legacy=False):
        api = NativeLinesCLO(legacy)
        result = dispatch(copy.deepcopy(self.job), api, api)
        targets = [{'id': p['id'], 'pattern_id': r['clo_pattern_id'], 'fingerprint': r['fingerprint']}
                   for p, r in zip(self.job['garment']['pieces'], result['patterns'])]
        return api, targets

    def test_all_thirteen_connections_resolve_to_real_compact_internal_segments(self):
        api, targets = self.scene()
        before = copy.deepcopy(api.pieces)
        result = resolve_map(self.job['garment'], targets, api)
        self.assertEqual(result['status'], 'verified')
        self.assertEqual(result['verified_count'], 13)
        self.assertEqual(result['native_seams_created'], 0)
        self.assertEqual(api.pieces, before)
        self.assertTrue(all(e['shape_index'] == 0 for s in result['seams'] for e in s['ends']))
        self.assertTrue(all(len(e['native_line_indices']) <= 2 for s in result['seams'] for e in s['ends']))
        self.assertTrue(all(e['native_guide']['verified'] for s in result['seams'] for m in s['marks'] for e in m['ends'] if 'native_guide' in e))
        self.assertEqual(result, resolve_map(self.job['garment'], targets, api))
        self.assertEqual([s['phase'] for s in result['seams'][:2]], ['Плечи', 'Плечи'])
        self.assertIn('кольцо', result['seams'][-3]['title'])

    def test_reverse_direction_maps_start_to_end_and_marks_by_arc_length(self):
        api, targets = self.scene()
        mapped = resolve_map(self.job['garment'], targets, api)
        source = {s['id']: s for s in self.job['garment']['sewing_graph']}
        for seam in mapped['seams']:
            for side, endpoint in enumerate(seam['ends']):
                reverse = side == 1 and seam['direction'] == 'reverse'
                self.assertEqual(endpoint['reverse'], reverse)
                self.assertLessEqual(max(abs(seam['marks'][0]['ends'][side]['clo_point'][i] - endpoint['start'][i]) for i in (0, 1)), .001)
                self.assertLessEqual(max(abs(seam['marks'][-1]['ends'][side]['clo_point'][i] - endpoint['end'][i]) for i in (0, 1)), .001)
                ids = source[seam['id']]['ab'[side]]['segments']
                self.assertEqual(endpoint['native_line_indices'], list(reversed(ids)) if reverse else ids)

    def test_historical_ring_midpoint_is_not_misrepresented_as_a_required_native_mark(self):
        api, targets = self.scene()
        garment = copy.deepcopy(self.job['garment'])
        ring = next(s for s in garment['sewing_graph'] if s['name'] == 'neckband_ring')
        ring['alignment'] = [0, .5, 1]
        mapped = resolve_map(garment, targets, api)
        seam = next(s for s in mapped['seams'] if s['id'] == ring['id'])
        self.assertEqual(seam['status'], 'verified')
        self.assertEqual([m['fraction'] for m in seam['marks']], [0, 1])

    def test_legacy_polyline_spans_remain_explicit_and_measure_correctly(self):
        api, targets = self.scene(True)
        mapped = resolve_map(self.job['garment'], targets, api)
        self.assertEqual(mapped['verified_count'], 13)
        spans = [e for s in mapped['seams'] for e in s['ends']]
        self.assertTrue(any(e['encoding'] == 'legacy_polyline' and len(e['native_line_indices']) > 2 for e in spans))
        self.assertTrue(all(s['lengths_passed'] for s in mapped['seams']))

    def test_missing_and_duplicate_stitch_shapes_are_never_guessed(self):
        for duplicate in (False, True):
            api, targets = self.scene()
            if duplicate:
                api.pieces[0]['children'].append(copy.deepcopy(api.pieces[0]['children'][0]))
            else:
                del api.pieces[0]['children'][0]
            targets[0]['fingerprint'] = fingerprint(api, 0)
            result = resolve_map(self.job['garment'], targets, api)
            self.assertEqual(result['status'], 'partial')
            self.assertLess(result['verified_count'], 13)
            self.assertTrue(any(not e['verified'] for s in result['seams'] for e in s['ends'] if e['piece_id'] == self.job['garment']['pieces'][0]['id']))

    def test_missing_native_mark_is_reported_separately_from_resolved_span(self):
        api, targets = self.scene()
        del api.pieces[0]['children'][1:]
        targets[0]['fingerprint'] = fingerprint(api, 0)
        result = resolve_map(self.job['garment'], targets, api)
        self.assertEqual(result['status'], 'partial')
        self.assertTrue(all(e['verified'] for s in result['seams'] for e in s['ends']))
        self.assertTrue(any('метка' in issue for s in result['seams'] for issue in s['issues']))

    def test_external_edit_stale_binding_and_duplicate_target_stop_mapping(self):
        api, targets = self.scene()
        before = copy.deepcopy(api.pieces)
        wrong = copy.deepcopy(targets)
        wrong[0]['id'] = 'other'
        with self.assertRaisesRegex(ValueError, 'Привязка'):
            resolve_map(self.job['garment'], wrong, api)
        targets[0]['fingerprint'] = 'stale'
        with self.assertRaisesRegex(ValueError, 'изменена'):
            resolve_map(self.job['garment'], targets, api)
        self.assertEqual(api.pieces, before)


if __name__ == '__main__':
    unittest.main()
