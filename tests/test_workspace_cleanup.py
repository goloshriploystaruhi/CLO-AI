"""Exercise deletion fences against small isolated fixtures, never the checkout."""
import importlib.util
import os
from pathlib import Path
import tempfile
import time
import unittest
from unittest.mock import patch

spec = importlib.util.spec_from_file_location('clean_workspace', Path(__file__).resolve().parents[1]/'tools/clean_workspace.py')
cleanup = importlib.util.module_from_spec(spec);spec.loader.exec_module(cleanup)


class WorkspaceCleanupTests(unittest.TestCase):
    def setUp(self):
        workspace = Path(__file__).resolve().parents[1]/'research'
        self.temp = tempfile.TemporaryDirectory(prefix='clo-cleanup-fixture-', dir=workspace)
        self.addCleanup(self.temp.cleanup);self.root = Path(self.temp.name)
        self.assertEqual(self.root.resolve().parent, workspace.resolve())
        (self.root/'app').mkdir();(self.root/'research').mkdir()
        (self.root/'app/example.test.cjs').write_text("testWorkspace.create('example-test-')", 'utf-8')
        self.tracked = {'app/example.test.cjs'}

    def cleaner(self, active=None):
        return cleanup.Cleanup(self.root, self.tracked, active=active or (set(), True))

    def old(self, name, filename='fixture.json'):
        folder = self.root/'research'/name;folder.mkdir();(folder/filename).write_text('{}', 'utf-8')
        os.utime(folder, (time.time()-10000, time.time()-10000));return folder

    def test_dry_run_preserves_files_and_apply_deletes_only_recognized_old_fixture(self):
        allowed = self.old('example-test-Abc123');unknown = self.old('important-research-Abc123')
        fresh = self.old('example-test-Fresh1');os.utime(fresh, None)
        cleaner = self.cleaner();plan = cleaner.plan()
        self.assertEqual([r['path'] for r in plan], ['research/example-test-Abc123'])
        self.assertTrue(allowed.exists());removed, retained = cleaner.apply(plan)
        self.assertEqual(len(removed), 1);self.assertFalse(retained);self.assertFalse(allowed.exists())
        self.assertTrue(unknown.exists());self.assertTrue(fresh.exists())

    def test_tracked_and_project_and_browser_data_are_preserved(self):
        tracked = self.old('example-test-Track1');self.tracked.add('research/example-test-Track1/fixture.json')
        project = self.old('example-test-Proj12', 'before.zprj')
        browser = self.old('example-test-Brows1', 'Local State')
        cleaner = self.cleaner();self.assertEqual(cleaner.plan(), [])
        self.assertTrue(all(p.exists() for p in (tracked, project, browser)))

    def test_new_protected_file_since_plan_blocks_deletion(self):
        folder = self.old('example-test-Abc123');cleaner = self.cleaner();plan = cleaner.plan()
        (folder/'new.zprj').write_text('project', 'utf-8')
        removed, retained = cleaner.apply(plan)
        self.assertFalse(removed);self.assertEqual(len(retained), 1);self.assertTrue(folder.exists())

    def test_same_size_file_change_since_plan_blocks_deletion(self):
        folder = self.old('example-test-Abc123');cleaner = self.cleaner();plan = cleaner.plan()
        file = folder/'fixture.json';before = file.stat()
        file.write_text('[]', 'utf-8');os.utime(file, ns=(before.st_atime_ns, before.st_mtime_ns+1000000000))
        removed, retained = cleaner.apply(plan)
        self.assertFalse(removed);self.assertTrue(retained);self.assertTrue(file.exists())

    def test_replaced_folder_and_parent_escape_are_refused(self):
        folder = self.old('example-test-Abc123');cleaner = self.cleaner();plan = cleaner.plan()
        folder.rename(folder.with_name('saved-original'));self.old('example-test-Abc123', 'new.json')
        removed, retained = cleaner.apply(plan);self.assertFalse(removed);self.assertTrue(retained)
        with self.assertRaises(ValueError):cleaner.inside(self.root.parent/'outside-canary')
        with self.assertRaises(ValueError):cleaner.inside(self.root)

    def test_reparse_point_guard_is_enforced_before_recursive_walk(self):
        folder = self.old('example-test-Abc123');cleaner = self.cleaner()
        original = cleanup.linked
        with patch.object(cleanup, 'linked', side_effect=lambda path: path == folder or original(path)):
            self.assertEqual(cleaner.plan(), [])
        self.assertTrue(folder.exists())

    def test_report_path_is_canonical_and_cannot_overwrite_sources_via_dot_dot(self):
        cleaner = self.cleaner()
        with self.assertRaises(ValueError):cleaner.report_target(self.root/'research/../construction-catalog.json')
        with self.assertRaises(ValueError):cleaner.report_target(self.root/'app/example.test.cjs')
        expected = self.root/'research/result.json'
        self.assertEqual(cleaner.report_target(self.root/'research/sub/../result.json'), expected.resolve())

    def test_deleting_one_owned_hardlink_does_not_block_another_owned_tree(self):
        first = self.old('example-test-Abc123');second = self.old('example-test-Def456')
        (second/'fixture.json').unlink();os.link(first/'fixture.json', second/'fixture.json')
        for folder in (first, second):os.utime(folder, (time.time()-10000, time.time()-10000))
        cleaner = self.cleaner();removed, retained = cleaner.apply(cleaner.plan())
        self.assertEqual(len(removed), 2);self.assertFalse(retained)

    def runtime(self, name, entry):
        folder = self.root/'vendor/siwc/node_modules/electron/dist/.clo-ai'/name
        source = folder/'resources/app';source.mkdir(parents=True)
        import json
        relative = os.path.relpath(self.root/entry, source).replace('\\', '/')
        (source/'bootstrap.cjs').write_text('const entry=path.resolve(__dirname,'+json.dumps(relative)+');', 'utf-8')
        (folder/'CLO AI.exe').write_bytes(b'fixture');return folder

    def test_production_runtime_is_preserved_and_active_or_unknown_test_runtime_is_preserved(self):
        production = self.runtime('a'*20, 'app/main.cjs');test = self.runtime('b'*20, 'app/example-smoke.cjs')
        self.assertFalse(self.cleaner().runtime_kind(production));self.assertTrue(self.cleaner().runtime_kind(test))
        self.assertFalse(self.cleaner(active=({(test/'CLO AI.exe').resolve()}, True)).runtime_kind(test))
        self.assertFalse(self.cleaner(active=(set(), False)).runtime_kind(test))

    def test_corrupt_runtime_bootstrap_is_preserved_as_unknown(self):
        runtime = self.runtime('c'*20, 'app/example-smoke.cjs')
        (runtime/'resources/app/bootstrap.cjs').write_bytes(b'\xff\xfe\xff')
        self.assertFalse(self.cleaner().runtime_kind(runtime))

    def test_summary_does_not_count_retained_hardlinks_as_freed_data(self):
        records = [{'reason':'test', 'files':[('a', 10, 1, 1, 2), ('b', 20, 1, 2, 1)]}]
        result = cleanup.summary(records)
        self.assertEqual(result['logical_bytes'], 30);self.assertEqual(result['unique_reclaimable_bytes_estimate'], 20)


if __name__ == '__main__':unittest.main()
