"""Semantic metadata generated from deterministic construction geometry."""
from dataclasses import asdict
from parametric_patterns import TrouserPanel, TrouserParameters


def describe(spec, contour):
    segments=[]
    for i,s in enumerate(contour.segments):
        segments.append({'id':'s'+str(i),'start':asdict(s.start),'end':asdict(s.end),
                         'c1':asdict(s.c1) if s.c1 else None,'c2':asdict(s.c2) if s.c2 else None,
                         'length_mm':s.length()})
    landmarks={};lines=[];seams={};dependencies={}
    if spec['type']=='trouser_panel':
        panel=TrouserPanel(TrouserParameters(**spec['parameters']))
        landmarks={key:asdict(point) for key,point in panel.landmarks().items()}
        lines=[{'id':name,'start':a,'end':b} for name,a,b in
               [('waist','waist_inner','waist_side'),('hip','hip_inner','hip_side'),
                ('knee','knee_inner','knee_side'),('hem','hem_inner','hem_side')]]
        seams={'waist':['s0'],'side':['s1','s2','s3','s4'],'hem':['s5'],
               'inseam':['s6','s7'],'crotch':['s8','s9']}
        dependencies={'hip_width_mm':['hip_inner','hip_side','seat_side','crotch'],
                      'knee_width_mm':['knee_inner','knee_side'],'hem_width_mm':['hem_inner','hem_side'],
                      'length_mm':['hem_inner','hem_side'],'rise_mm':['seat_side','crotch']}
    else:
        landmarks={'p'+str(i):asdict(s.start) for i,s in enumerate(contour.segments)}
        seams={'outline':[s['id'] for s in segments]}
    return {'contour':segments,'landmarks':landmarks,'construction_lines':lines,
            'seams':seams,'dependencies':dependencies,'coordinate_system':'local_mm',
            'parameters':({'garment_id':spec.get('semantic',{}).get('garment_id'),'role':spec.get('production',{}).get('role'),'allowance_mm':spec.get('production',{}).get('allowance_mm')} if spec['type']=='garment_piece' else spec.get('parameters',{k:v for k,v in spec.items() if k not in ('type','semantic')}))}
