import copy
import json
import math
from pathlib import Path
import struct
import tempfile
import unittest
import uuid
from unittest.mock import patch

from clo_operations import dispatch, fingerprint, snapshot
from contour_engine import simplify_closed
from garment_engine import deserialize
from sewing_snapshot import inspect_pac


class NativeCopies:
    def __init__(self,models):
        self.pieces=[];self.next_id=100;self.deletions=[]
        for i,p in enumerate(models):
            cut=simplify_closed(deserialize(p['cut_contour']).clo_points(.1),.08)
            seam=deserialize(p['seam_contour']).clo_points(.1)
            def shape(points):
                xy=[(x+i*900,-y+700) for x,y,_ in points]
                return {'PointList':[{'Point positionX':x,'Point positionY':y} for x,y in xy],
                        'LineList':[{'Line count':str(len(xy))}]+[{'Line length':math.dist(a,b)} for a,b in zip(xy,xy[1:]+xy[:1])]}
            root=shape(cut);child=shape(seam);child['Shape index']='0';root['Children Information']=[child]
            self.pieces.append({'id':self.next_id,'name':p['name'],'raw':{'Pattern InputInformation':[root]}});self.next_id+=1
    def GetPatternCount(self):return len(self.pieces)
    def GetPatternInformation(self,i):return {k:self.pieces[i][k] for k in ('id','name')}
    def GetPatternInputInformation(self,i):return json.dumps(self.pieces[i]['raw'])
    def CopyPatternPieceMove(self,i,dx,dy):
        p=copy.deepcopy(self.pieces[i]);p['id']=self.next_id;self.next_id+=1
        root=p['raw']['Pattern InputInformation'][0]
        for shape in [root]+root['Children Information']:
            for point in shape['PointList']:
                point['Point positionX']+=dx;point['Point positionY']+=dy
        self.pieces.append(p)
    def SetPatternPieceName(self,i,name):self.pieces[i]['name']=name
    def DeletePatternPiece(self,i):self.deletions.append(self.pieces[i]['id']);del self.pieces[i]
    def ExportZPrjW(self,path,thumbnail):Path(path).write_bytes(b'backup');return path


class SewingExperimentTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        from tests.synthetic_garment import tshirt
        garment=tshirt()
        cls.models=[next(p for p in garment['pieces'] if p['role']==r) for r in ('front','back')]
    def setUp(self):
        self.temp=tempfile.TemporaryDirectory(dir=Path('research').resolve());self.addCleanup(self.temp.cleanup)
        self.root=patch('sewing_experiment.tempfile.gettempdir',return_value=self.temp.name);self.root.start();self.addCleanup(self.root.stop)
        self.api=NativeCopies(self.models);self.before=snapshot(self.api);self.id=str(uuid.uuid4())
    def job(self,op,**kwargs):return dict(operation='sewing_test_'+op,experiment_id=self.id,**kwargs)
    def prepare(self):
        return dispatch(self.job('prepare',confirmed_test_copy=True,model_pieces=self.models,
            targets=[{'pattern_id':p['id'],'fingerprint':fingerprint(self.api,i)} for i,p in enumerate(self.api.pieces)]),self.api,self.api)
    def cleanup(self):return dispatch(self.job('cleanup',confirmed_test_cleanup=True),self.api,self.api)['sewing_test']
    def test_verified_copies_and_repeat_preparation_are_safe(self):
        result=self.prepare()['sewing_test'];self.assertEqual(len(result['copies']),2)
        self.assertEqual(self.api.GetPatternCount(),4);self.assertTrue(result['originals_preserved'])
        self.assertAlmostEqual(result['copies'][0]['shoulder']['length_mm'],109.201648,places=4)
        with self.assertRaisesRegex(ValueError,'повторно'):self.prepare()
        self.assertEqual(self.api.GetPatternCount(),4)
        cleaned=self.cleanup();self.assertTrue(cleaned['originals_preserved']);self.assertEqual(snapshot(self.api),self.before)
        self.cleanup();self.assertEqual(len(self.api.deletions),2)
    def test_all_copy_names_checked_before_any_deletion(self):
        self.prepare();self.api.pieces[2]['name']='Пользовательская деталь'
        with self.assertRaisesRegex(ValueError,'переименована'):self.cleanup()
        self.assertEqual(self.api.deletions,[]);self.assertEqual(self.api.GetPatternCount(),4)
    def test_changed_original_stops_cleanup(self):
        self.prepare();self.api.pieces[0]['raw']['Pattern InputInformation'][0]['PointList'][0]['Point positionX']+=1
        with self.assertRaisesRegex(ValueError,'Исходные детали изменились'):self.cleanup()
        self.assertEqual(self.api.deletions,[])
    def test_missing_backup_and_invalid_geometry_never_copy(self):
        with patch.object(self.api,'ExportZPrjW',return_value=False):
            with self.assertRaisesRegex(ValueError,'Резервная копия'):self.prepare()
        self.assertEqual(self.api.GetPatternCount(),2)
        self.api.pieces[0]['raw']['Pattern InputInformation'][0]['PointList'][5]['Point positionX']+=2
        with self.assertRaisesRegex(ValueError,'Форма среза'):self.prepare()
        self.assertEqual(self.api.GetPatternCount(),2)
    def test_journal_cannot_authorize_deleting_originals(self):
        self.prepare();path=Path(self.temp.name)/'CLO_AI_Sewing_Tests'/self.id/'journal.json'
        state=json.loads(path.read_text());state['created_ids'].append(self.api.pieces[0]['id']);path.write_text(json.dumps(state))
        with self.assertRaisesRegex(ValueError,'исходной деталью'):self.cleanup()
        self.assertEqual(self.api.deletions,[])
    def test_unknown_operation_and_missing_confirmation_are_blocked(self):
        with self.assertRaisesRegex(ValueError,'Неизвестная операция'):dispatch(self.job('execute'),self.api,self.api)
        with self.assertRaisesRegex(ValueError,'Не подтверждена'):dispatch(self.job('prepare'),self.api,self.api)
        self.assertEqual(self.api.GetPatternCount(),2)
    def test_partial_copy_failure_keeps_recoverable_journal(self):
        real=self.api.CopyPatternPieceMove;calls=[]
        def failing(*args):
            calls.append(args)
            if len(calls)==2:raise RuntimeError('copy failed')
            return real(*args)
        with patch.object(self.api,'CopyPatternPieceMove',side_effect=failing):
            with self.assertRaisesRegex(RuntimeError,'copy failed'):self.prepare()
        self.assertEqual(self.api.GetPatternCount(),3)
        self.cleanup();self.assertEqual(snapshot(self.api),self.before)
    def test_export_failure_and_path_traversal_do_not_report_success(self):
        self.prepare()
        with patch.object(self.api,'ExportZPrjW',return_value=False):
            with self.assertRaisesRegex(ValueError,'Не удалось сохранить'):dispatch(self.job('inspect',export_evidence=True),self.api,self.api)
        with self.assertRaises(ValueError):dispatch(dict(self.job('inspect'),experiment_id='../foreign'),self.api,self.api)
        self.assertEqual(self.api.GetPatternCount(),4)


class SewingSnapshotTests(unittest.TestCase):
    def specimen(self,count=1):
        data=b'mapSeamLinePairGroup'+b'\0'*13+b'listSeamLinePairGroup'+struct.pack('<I',count)
        if count!=1:return data
        data+=b'qsNameSewing_123qsTrimTypeUTF8mapSeamLinePairListlistSeamLinePair'+struct.pack('<I',1)
        for n in range(2):
            data+=('mapSeamLine'+str(n)).encode()
            for name,value,fmt in (('uiSelfIndex',5+n,'<I'),('uiShapeIndex',0,'<I'),('uiDepth',2,'<I'),('uiStartIndex',0,'<I'),('uiEndIndex',0,'<I'),('fRatioStart',0,'<f'),('fRatioEnd',1,'<f'),('bDirection',True,'<?')):
                data+=name.encode()+struct.pack(fmt,value)
            data+=b'arrMeshPointIndex'
        return data+b'mapSeamLinePairProperty'
    def test_exact_single_internal_pair_and_direction(self):
        result=inspect_pac(self.specimen());self.assertEqual(result['group_count'],1)
        seam=result['seams'][0];self.assertEqual(seam['name'],'Sewing_123')
        self.assertEqual([e['uiSelfIndex'] for e in seam['ends']],[5,6])
        self.assertTrue(all(e['uiDepth']==2 and e['bDirection'] for e in seam['ends']))
    def test_unknown_ambiguous_and_multi_seam_layouts_fail_closed(self):
        self.assertEqual(inspect_pac(self.specimen(0))['group_count'],0)
        for bad in (b'',self.specimen(2),self.specimen()+self.specimen(),self.specimen().replace(b'uiDepth',b'unknown'),self.specimen().replace(b'arrMeshPointIndex',b'')):
            with self.assertRaises(ValueError):inspect_pac(bad)


if __name__=='__main__':unittest.main()
