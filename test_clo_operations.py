import json
import os
import unittest
from clo_operations import dispatch, fingerprint
from geometry_validation import validate

class FakeCLO:
    def __init__(self): self.pieces=[];self.next=100
    def GetPatternCount(self): return len(self.pieces)
    def CreatePatternWithPoints(self,points):
        self.pieces.append({'id':self.next,'points':points});self.next+=1
    def DeletePatternPiece(self,i): del self.pieces[i]
    def GetPatternInformation(self,i): return json.dumps({'id':self.pieces[i]['id'],'name':'Pattern_'+str(self.pieces[i]['id'])})
    def GetLineLength(self,i,n):
        from contour_engine import Point,Segment
        pts=self.pieces[i]['points'];anchors=[j for j,p in enumerate(pts) if p[2]==0]
        start=anchors[n];end=anchors[(n+1)%len(anchors)]
        controls=[pts[j%len(pts)] for j in range(start+1,end if end>start else end+len(pts))]
        a,b=Point(*pts[start][:2]),Point(*pts[end][:2])
        if controls:
            if len(controls)!=2 or any(p[2]!=3 for p in controls):raise ValueError('Unsupported fake native curve')
            return Segment(a,b,Point(*controls[0][:2]),Point(*controls[1][:2])).length()
        return a.distance(b)
    def GetPatternInputInformation(self,i):
        anchors=[p for p in self.pieces[i]['points'] if p[2]==0]
        return json.dumps({'Pattern InputInformation':[{'Pattern index':str(i),'PointList':[{'Point positionX':x,'Point positionY':y} for x,y,k in anchors], 'LineList':[{'Line type':'Straight type','Line length':self.GetLineLength(i,n)} for n,p in enumerate(anchors)]}]})
    def ExportZPrjW(self,path,thumbnail):
        with open(path,'w') as f: json.dump(self.pieces,f)
        return path

class OperationTests(unittest.TestCase):
    def setUp(self): self.api=FakeCLO()
    def test_disabled_auto_sewing_commands_never_reach_native_api(self):
        for operation in ('sew_prepare','sew_next','sew_verify'):
            with self.subTest(operation=operation):
                with self.assertRaisesRegex(ValueError,'Неизвестная операция CLO'):
                    dispatch({'operation':operation,'confirmed_sewing':True},self.api,self.api)
                self.assertEqual(self.api.GetPatternCount(),0)
    def test_scenarios_create_edit_mirror_and_undo(self):
        a=self.api
        # Untouched existing garment piece.
        a.CreatePatternWithPoints([(0,0,0),(100,0,0),(100,100,0),(0,100,0)])
        untouched=fingerprint(a,0)
        spec={'type':'rounded_trapezoid','top_mm':500,'bottom_mm':700,'height_mm':900}
        first=dispatch({'patterns':[spec]},a,a)['patterns'][0]
        target={'pattern_id':first['clo_pattern_id'],'fingerprint':first['fingerprint']}
        changed=dict(spec,bottom_mm=800)
        result=dispatch({'confirmed_replacement':True,'patterns':[changed],'replace_target':target},a,a)
        self.assertEqual(a.GetPatternCount(),2)
        self.assertEqual(fingerprint(a,0),untouched)
        validation=validate([changed]);self.assertTrue(validation['valid'],validation)
        self.assertAlmostEqual(validation['pieces'][0]['width_mm'],800)
        self.assertAlmostEqual(validation['pieces'][0]['height_mm'],900)
        self.assertEqual(changed['top_mm'],500)
        edited=result['patterns'][0]
        restored=dispatch({'confirmed_replacement':True,'patterns':[spec],'replace_target':{'pattern_id':edited['clo_pattern_id'],'fingerprint':edited['fingerprint']}},a,a)
        self.assertEqual(a.GetPatternCount(),2)
        panel={'type':'shaped_panel','width_mm':350,'height_mm':800}
        pair=[panel,dict(panel,reflect_axis='y')]
        relation={'a':{'piece':0,'segments':[1]},'b':{'piece':1,'segments':[1]},'tolerance_mm':.01}
        result=dispatch({'patterns':pair,'relations':[relation]},a,a)
        self.assertEqual(a.GetPatternCount(),4)
        self.assertAlmostEqual(result['patterns'][0]['perimeter_mm'],result['patterns'][1]['perimeter_mm'])
        targets=[{'pattern_id':r['clo_pattern_id'],'fingerprint':r['fingerprint']} for r in result['patterns']]
        dispatch({'confirmed_replacement':True,'operation':'delete','targets':targets},a,a)
        self.assertEqual(a.GetPatternCount(),2)
        self.assertEqual(fingerprint(a,0),untouched)
    def test_manual_changes_prevent_replacement(self):
        spec={'type':'rectangle','width_mm':200,'height_mm':300}
        r=dispatch({'patterns':[spec]},self.api,self.api)['patterns'][0]
        self.api.pieces[0]['points'][0]=(1,0,0)
        with self.assertRaisesRegex(ValueError,'вне CLO AI'):
            dispatch({'confirmed_replacement':True,'patterns':[spec],'replace_target':{'pattern_id':r['clo_pattern_id'],'fingerprint':r['fingerprint']}},self.api,self.api)
        self.assertEqual(self.api.GetPatternCount(),1)
    def test_diagnostics_and_seam_mismatch(self):
        report=validate([{'type':'rectangle','name':'Перед','width_mm':.1,'height_mm':300}])
        self.assertFalse(report['valid']);self.assertEqual(report['errors'][0]['piece'],'Перед')
        specs=[{'type':'rectangle','width_mm':200,'height_mm':300},{'type':'rectangle','width_mm':250,'height_mm':300}]
        relation={'a':{'piece':0,'segments':[0]},'b':{'piece':1,'segments':[0]}}
        report=validate(specs,[relation]);self.assertFalse(report['valid']);self.assertFalse(report['sewing_ready'])
