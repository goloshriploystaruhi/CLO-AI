import copy
import unittest
from unittest.mock import patch

from clo_operations import dispatch, fingerprint, snapshot
from clo_updates import PROPERTIES
from test_clo_operations import FakeCLO
from test_tshirt_engine import fixture
from tshirt_engine import construct


class PropertiesCLO(FakeCLO):
    def __init__(self):
        super().__init__()
        self.deleted_ids = []
        self.fail_property = None

    def CreatePatternWithPoints(self, points):
        super().CreatePatternWithPoints(points)
        self.pieces[-1]['properties'] = {
            'fabric_index': 0, 'layer': 0, 'particle_distance_mm': 20.,
            'grain_link_all_colorways': True, 'grain_direction_deg': 0., 'name': 'Новая деталь'}

    def DeletePatternPiece(self, index):
        self.deleted_ids.append(self.pieces[index]['id'])
        super().DeletePatternPiece(index)


def install_property(key, getter, setter):
    def get(self, index):
        return self.pieces[index]['properties'][key]

    def set_value(self, index, value):
        if self.fail_property != key:
            self.pieces[index]['properties'][key] = value

    setattr(PropertiesCLO, getter, get)
    setattr(PropertiesCLO, setter, set_value)


for key, getter, setter in PROPERTIES:
    install_property(key, getter, setter)


class SelectiveUpdatesTests(unittest.TestCase):
    def setUp(self):
        self.api = PropertiesCLO()
        self.api.CreatePatternWithPoints([(0, 0, 0), (20, 0, 0), (20, 30, 0), (0, 30, 0)])
        self.other = fingerprint(self.api, 0)
        self.profile, self.params = fixture()
        self.initial = construct(self.profile, self.params)
        self.result = dispatch(self.initial, self.api, self.api)
        for i, piece in enumerate(self.api.pieces[1:]):
            piece['properties'].update(fabric_index=2, layer=3, particle_distance_mm=8.,
                                       grain_direction_deg=17.5, grain_link_all_colorways=False,
                                       name='Моё имя ' + str(i))
        self.api.deleted_ids.clear()

    def edit(self, params, previous=None, result=None):
        previous = previous or self.initial
        result = result or self.result
        job = construct(self.profile, params, previous['garment'])
        job.update(previous_pieces=copy.deepcopy(previous['garment']['pieces']),
                   replace_targets=[{'pattern_id': p['clo_pattern_id'], 'fingerprint': p['fingerprint']}
                                    for p in result['patterns']], confirmed_replacement=True)
        return job

    def test_length_edit_reuses_sleeves_and_neckband_and_preserves_properties_and_2d(self):
        old_points = [copy.deepcopy(p['points']) for p in self.api.pieces]
        job = self.edit(dict(self.params, length_mm=760))
        r = dispatch(job, self.api, self.api)
        self.assertEqual(r['update_summary']['replaced'], 2)
        self.assertEqual(r['update_summary']['reused'], 3)
        self.assertEqual(self.api.GetPatternCount(), 6)
        self.assertEqual(fingerprint(self.api, 0), self.other)
        for i, row in enumerate(r['patterns']):
            self.assertEqual(self.api.pieces[row['pattern_index']]['id'], row['clo_pattern_id'])
            self.assertEqual(fingerprint(self.api, row['pattern_index']), row['fingerprint'])
            if i >= 2:
                self.assertEqual(row['clo_pattern_id'], self.result['patterns'][i]['clo_pattern_id'])
                self.assertEqual(self.api.pieces[row['pattern_index']]['points'], old_points[i + 1])
            else:
                self.assertNotEqual(row['clo_pattern_id'], self.result['patterns'][i]['clo_pattern_id'])
                self.assertEqual(row['preserved_properties']['status'], 'verified')
                props = self.api.pieces[row['pattern_index']]['properties']
                self.assertEqual(props['fabric_index'], 2)
                self.assertEqual(props['layer'], 3)
                self.assertEqual(props['particle_distance_mm'], 8.)
                self.assertEqual(props['grain_direction_deg'], 17.5)
                self.assertEqual(props['name'], 'Моё имя ' + str(i))
                # Shoulder anchor remains fixed; changed hem grows from the same origin.
                self.assertEqual(self.api.pieces[row['pattern_index']]['points'][0], old_points[i + 1][0])

    def test_same_parameters_do_not_replace_any_native_object(self):
        before = copy.deepcopy(self.api.pieces)
        r = dispatch(self.edit(self.params), self.api, self.api)
        self.assertEqual(r['update_summary']['replaced'], 0)
        self.assertIsNone(r['backup'])
        self.assertEqual(self.api.pieces, before)
        self.assertEqual(self.api.deleted_ids, [])

    def test_property_readback_failure_rolls_back_before_any_original_deletion(self):
        before = copy.deepcopy(self.api.pieces)
        old_ids = {p['id'] for p in before}
        self.api.fail_property = 'layer'
        with self.assertRaisesRegex(ValueError, 'перенос свойства') as caught:
            dispatch(self.edit(dict(self.params, length_mm=760)), self.api, self.api)
        self.assertFalse(caught.exception.transaction['requires_manual_recovery'])
        self.assertEqual(self.api.pieces, before)
        self.assertTrue(old_ids.isdisjoint(self.api.deleted_ids))

    def test_manual_geometry_changes_and_bad_model_order_fail_before_creation(self):
        job = self.edit(dict(self.params, length_mm=760))
        job['previous_pieces'].reverse()
        before = copy.deepcopy(self.api.pieces)
        with self.assertRaises(ValueError) as caught:
            dispatch(job, self.api, self.api)
        self.assertFalse(caught.exception.transaction['requires_manual_recovery'])
        self.assertEqual(self.api.pieces, before)
        job = self.edit(dict(self.params, length_mm=760))
        x, y, kind = self.api.pieces[1]['points'][0]
        self.api.pieces[1]['points'][0] = (x + 1, y, kind)
        before = copy.deepcopy(self.api.pieces)
        with self.assertRaisesRegex(ValueError, 'вне CLO AI'):
            dispatch(job, self.api, self.api)
        self.assertEqual(self.api.pieces, before)

    def test_undo_restores_body_and_keeps_native_sleeve_ids(self):
        changed = self.edit(dict(self.params, length_mm=760))
        r = dispatch(changed, self.api, self.api)
        restored = dispatch(self.edit(self.params, changed, r), self.api, self.api)
        self.assertEqual(restored['update_summary']['replaced'], 2)
        for i in (2, 3, 4):
            self.assertEqual(restored['patterns'][i]['clo_pattern_id'], self.result['patterns'][i]['clo_pattern_id'])
        self.assertEqual(fingerprint(self.api, 0), self.other)

    def test_native_qa_failure_keeps_all_originals(self):
        before = copy.deepcopy(self.api.pieces)
        with patch('clo_updates.assembly_readback', return_value={'seams': [{'passed': False}]}):
            with self.assertRaisesRegex(ValueError, 'длины швов') as caught:
                dispatch(self.edit(dict(self.params, length_mm=760)), self.api, self.api)
        self.assertFalse(caught.exception.transaction['requires_manual_recovery'])
        self.assertEqual(self.api.pieces, before)

    def test_missing_property_api_is_reported_without_inventing_verification(self):
        # Emulate an older API with no documented property pairs.
        for _, getter, setter in PROPERTIES:
            setattr(self.api, getter, None)
            setattr(self.api, setter, None)
        r = dispatch(self.edit(dict(self.params, length_mm=760)), self.api, self.api)
        self.assertEqual(r['patterns'][0]['preserved_properties']['status'], 'unavailable')
        self.assertEqual(len(r['patterns'][0]['preserved_properties']['unavailable']), len(PROPERTIES))

    def test_original_deletion_failure_reports_required_recovery(self):
        original_delete = self.api.DeletePatternPiece
        ids = {p['clo_pattern_id'] for p in self.result['patterns'][:2]}

        def fail(index):
            if self.api.pieces[index]['id'] in ids:
                raise RuntimeError('Отказ удаления')
            original_delete(index)

        self.api.DeletePatternPiece = fail
        with self.assertRaisesRegex(RuntimeError, 'Отказ удаления') as caught:
            dispatch(self.edit(dict(self.params, length_mm=760)), self.api, self.api)
        self.assertTrue(caught.exception.transaction['requires_manual_recovery'])
        self.assertEqual(caught.exception.transaction['stage'], 'replacement_partial')

    def test_loop_count_changes_keep_body_and_existing_loops_and_update_belt_marks(self):
        from garment_engine import construct as trousers
        from test_garment_engine import GarmentTests
        fixture = GarmentTests()
        fixture.setUp()
        api = FakeCLO()
        initial = trousers(fixture.profile, fixture.parameters)
        first = dispatch(initial, api, api)
        previous, result = initial, first
        initial_ids = [r['clo_pattern_id'] for r in first['patterns']]
        for count, added, removed in ((6, 1, 0), (5, 0, 1)):
            updated = trousers(fixture.profile, dict(fixture.parameters, loop_count=count), previous['garment'])
            updated.update(previous_pieces=previous['garment']['pieces'], confirmed_replacement=True,
                           replace_targets=[{'pattern_id': r['clo_pattern_id'], 'fingerprint': r['fingerprint']}
                                            for r in result['patterns']])
            result = dispatch(updated, api, api)
            self.assertEqual(result['update_summary']['replaced'], 4)
            self.assertEqual(result['update_summary']['added'], added)
            self.assertEqual(result['update_summary']['removed'], removed)
            self.assertEqual(result['update_summary']['reused'], 17)
            self.assertTrue(result['backup'])
            for i, p in enumerate(updated['garment']['pieces'][:21]):
                if not p['role'].startswith('belt_'):
                    self.assertEqual(result['patterns'][i]['clo_pattern_id'], initial_ids[i])
            self.assertEqual(api.GetPatternCount(), 21 + added)
            previous = updated


if __name__ == '__main__':
    unittest.main()
