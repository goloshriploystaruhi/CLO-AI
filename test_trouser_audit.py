import json
import math
import unittest
from pathlib import Path
from garment_engine import construct,deserialize,offset
from clo_adapter import local_to_clo,production_lines
from contour_engine import simplify_closed,Point
from trouser_audit import angle,tangent,distance,inside


class TrouserAuditTests(unittest.TestCase):
    def setUp(self):
        self.profile={'id':'audit','measurements':{k:{'value':v,'unit':'mm','status':'verified'} for k,v in {'garment_waist_girth':830,'hips':960,'waist_hip_length':200,'seated_depth':260,'waist_knee':570}.items()}}
        self.parameters=dict(length_mm=1000,waist_drop_mm=35,hip_ease_mm=220,waist_ease_mm=35,knee_flat_mm=360,hem_flat_mm=260)
        self.job=construct(self.profile,self.parameters)

    def test_no_hip_tangent_break_on_front_or_raised_back(self):
        for p in self.job['garment']['pieces'][:4]:
            c=deserialize(p['seam_contour'])
            self.assertLess(angle(tangent(c.segments[8],True),tangent(c.segments[9])),.0001)
            self.assertAlmostEqual(c.segments[0].length(),(830+35)/4,places=7)
            self.assertAlmostEqual(c.segments[5].length(),260,places=7)
            for s in c.segments[6:8]:self.assertLess(s.end.y,s.start.y)

    def test_waist_is_above_hem_in_clo_and_all_offsets_share_transform(self):
        p=self.job['patterns'][0];c=deserialize(p['production']['seam_contour'])
        self.assertGreater(local_to_clo(p,c.segments[0].start.x,c.segments[0].start.y)[1],local_to_clo(p,c.segments[5].start.x,c.segments[5].start.y)[1])
        self.assertEqual(local_to_clo({'type':'rectangle'},1,2),(1,2))

    def test_guides_are_inside_and_not_exported_as_fake_grain(self):
        for p in self.job['garment']['pieces']:
            polygon=[q[:2] for q in deserialize(p['cut_contour']).clo_points()];a,b=p['grainline']
            for n in range(101):self.assertTrue(inside((a[0]+(b[0]-a[0])*n/100,a[1]+(b[1]-a[1])*n/100),polygon),p['role'])
            lines=production_lines(p);self.assertNotIn('grain',[l['kind'] for l in lines]);keys=[str(l['points']) for l in lines];self.assertEqual(len(keys),len(set(keys)))
            stitch=[q[:2] for q in deserialize(p['seam_contour']).clo_points()]
            for line in lines:
                if line['kind']=='alignment_guide':
                    self.assertFalse(inside(line['points'][1],stitch),p['role'])
                    self.assertTrue(inside(line['points'][1],polygon),p['role'])

    def test_simplification_preserves_bbox_topology_and_error_budget(self):
        reduced=False
        for p in self.job['garment']['pieces']:
            raw=deserialize(p['cut_contour']).clo_points();simple=simplify_closed(raw,.08)
            reduced|=len(simple)<len(raw)
            for axis in (0,1):
                self.assertEqual(min(q[axis] for q in raw),min(q[axis] for q in simple));self.assertEqual(max(q[axis] for q in raw),max(q[axis] for q in simple))
            for q in raw:self.assertLessEqual(min(distance(q,a,b) for a,b in zip(simple,simple[1:]+simple[:1])),.080001)
        self.assertTrue(reduced)

    def test_allowances_are_normal_offsets_not_scaled_copies(self):
        for p in self.job['garment']['pieces']:
            c=deserialize(p['seam_contour']);raw=c.clo_points(.1);out=deserialize(p['cut_contour']).clo_points()
            self.assertEqual(len(raw),len(out))
            for i,a in enumerate(raw):
                b=raw[(i+1)%len(raw)];q=out[i];dx,dy=b[0]-a[0],b[1]-a[1]
                self.assertAlmostEqual(abs((q[0]-a[0])*dy-(q[1]-a[1])*dx)/math.hypot(dx,dy),10,places=7)

    def test_requested_pocket_depth_is_not_silently_changed(self):
        with self.assertRaisesRegex(ValueError,'не изменено автоматически'):construct(self.profile,dict(self.parameters,pocket_depth_mm=100))

    def test_alignment_marks_match_seam_midpoint_without_scaling(self):
        g=self.job['garment']
        for r in g['sewing_graph']:
            lengths=[]
            for e in (r['a'],r['b']):
                p=g['pieces'][e['piece']]
                if 'segments' not in e:continue
                c=deserialize(p['seam_contour']);length=sum(c.segments[n].length() for n in e['segments']);lengths.append(length)
                mark=next(m for m in p['notches'] if m.get('sewing_id')==r['id'])
                before=sum(c.segments[n].length() for n in e['segments'][:e['segments'].index(mark['segment'])]);actual=before+c.segments[mark['segment']].split(mark['t'])[0].length()
                self.assertAlmostEqual(actual,length/2,places=4)
            if lengths:self.assertLess(abs(lengths[0]-lengths[1]-r['ease_mm']),r['tolerance_mm'])
