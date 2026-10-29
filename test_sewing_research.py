import ast
import copy
import importlib
import json
import os
from pathlib import Path
import sys
import tempfile
import types
import unittest
from unittest.mock import patch
from qa_scenarios import fixture
from engineering.pipeline import build
from sewing_plan import compile_plan


class SewingResearchTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        p,g=fixture('tshirt_setin_engineering_v1');cls.garment=build('tshirt_setin_engineering_v1',p,g)['garment']

    def test_graph_produces_identical_explicit_plan_without_mutating_model(self):
        g=copy.deepcopy(self.garment);before=copy.deepcopy(g);a=compile_plan(g);b=compile_plan(g)
        self.assertEqual(a,b);self.assertEqual(g,before);self.assertEqual(a['piece_count'],5);self.assertEqual(a['seam_count'],13)
        self.assertEqual(a['native_seams_created'],0)
        self.assertTrue(all(e['source']=='stitch_contour' for s in a['seams'] for e in s['ends']))
        self.assertEqual(len({s['idempotency_key'] for s in a['seams']}),13)

    def test_duplicate_and_missing_mark_are_blocked_before_native_resolution(self):
        g=copy.deepcopy(self.garment);g['sewing_graph'].append(copy.deepcopy(g['sewing_graph'][0]))
        with self.assertRaisesRegex(ValueError,'проверку'):compile_plan(g)
        g=copy.deepcopy(self.garment);g['pieces'][0]['notches']=[]
        with self.assertRaisesRegex(ValueError,'метка'):compile_plan(g)

    def test_bridge_probe_has_fixed_read_only_calls_and_nonce_deduplication(self):
        tree=ast.parse(Path('clo_bridge.py').read_text(encoding='utf-8'))
        cls=next(n for n in tree.body if isinstance(n,ast.ClassDef) and n.name=='Bridge')
        method=next(n for n in cls.body if isinstance(n,ast.FunctionDef) and n.name=='research_probe')
        pattern=types.SimpleNamespace(GetPatternCount=lambda:1,GetArrangementList=lambda:[],GetArrangementOfPattern=lambda i:{'name':'test'})
        utility=types.SimpleNamespace(GetMajorVersion=lambda:7,GetMinorVersion=lambda:0,GetPatchVersion=lambda:228)
        export=types.SimpleNamespace(GetAvatarCount=lambda:0)
        scope={'os':os,'json':json,'sys':sys,'importlib':importlib,'pattern_api':pattern,'utility_api':utility,'export_api':export}
        exec(compile(ast.Module(body=[method],type_ignores=[]),'probe-under-test','exec'),scope)
        with tempfile.TemporaryDirectory(dir=Path('research').resolve()) as directory:
            request=Path(directory)/'clo_ai_research_request.json';request.write_text(json.dumps({'nonce':'readonly'}))
            written=[];instance=types.SimpleNamespace(root=directory,research_nonce=None,sample_project=lambda **k:{'content_digest':'unchanged'},write=lambda name,data:written.append((name,data)))
            with patch.object(importlib,'import_module',side_effect=lambda name:{'pattern_api':pattern,'utility_api':utility,'export_api':export,'import_api':types.SimpleNamespace(),'fabric_api':types.SimpleNamespace(),'rest_api':types.SimpleNamespace()}[name]):
                scope['research_probe'](instance);scope['research_probe'](instance)
            self.assertEqual(len(written),1);report=written[0][1];self.assertFalse(report['mutations_performed']);self.assertEqual(report['reads']['GetPatchVersion'],228)
            self.assertEqual(report['project']['content_digest'],'unchanged')
