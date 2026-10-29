"""Read back actual CLO geometry; missing measurements stay explicitly unverified."""
import json
import math
from garment_engine import deserialize


def readback(api,index,expected,production=None):
    raw=api.GetPatternInputInformation(index);raw=json.loads(raw) if isinstance(raw,str) else raw
    root=raw['Pattern InputInformation'][0]
    points=[(float(p['Point positionX']),float(p['Point positionY'])) for p in root['PointList'] if 'Point positionX' in p]
    if len(points)!=len(expected):raise ValueError('CLO / число точек контура изменилось при экспорте')
    error=max(math.hypot(a[0]-b[0],a[1]-b[1]) for a,b in zip(points,expected))
    if error>.06:raise ValueError('CLO / отклонение контура {:.4f} мм превышает 0,06 мм'.format(error))
    row={'cut_coordinates_verified':True,'max_coordinate_error_mm':error,
         'cut_width_mm':max(p[0] for p in points)-min(p[0] for p in points),
         'cut_height_mm':max(p[1] for p in points)-min(p[1] for p in points),
         'cut_perimeter_mm':sum(api.GetLineLength(index,i) for i in range(len(points))),
         'stitch_measured':False,'stitch_segment_lengths_mm':[],'internal_lengths_mm':{}}
    if production:
        c=deserialize(production['seam_contour'])
        # Read both compact native curves and older exported polylines.
        native=[(s.start.x,s.start.y,0) for s in c.segments]
        children=[v for v in root.get('Children Information',[]) if 'Shape index' in v]
        for child in children:
            cp=[(float(p['Point positionX']),float(p['Point positionY'])) for p in child.get('PointList',[]) if 'Point positionX' in p]
            lines=[float(v['Line length']) for v in child.get('LineList',[]) if 'Line length' in v]
            local=native if len(cp)==len(native) and len(lines)==len(native) else c.clo_points(.1)
            if len(cp)!=len(local) or len(lines)!=len(local):continue
            dx,dy=cp[0][0]-local[0][0],cp[0][1]+local[0][1]
            if max(math.hypot(a[0]-b[0]-dx,a[1]+b[1]-dy) for a,b in zip(cp,local))>.06:continue
            if local is native:row['stitch_segment_lengths_mm']=lines
            else:
                position=0
                for s in c.segments:
                    n=len(s.flatten(.1))-1;row['stitch_segment_lengths_mm'].append(sum(lines[position:position+n]));position+=n
            row['stitch_native_segments']=len(lines)
            row['stitch_encoding']='native_bezier' if local is native else 'legacy_polyline'
            row['stitch_measured']=True;row['stitch_mapping_error_mm']=max(math.hypot(a[0]-b[0]-dx,a[1]+b[1]-dy) for a,b in zip(cp,local))
            for i,line in enumerate(production.get('internal_lines',[])):
                for ch in children:
                    pts=[(float(p['Point positionX']),float(p['Point positionY'])) for p in ch.get('PointList',[]) if 'Point positionX' in p]
                    ll=[float(v['Line length']) for v in ch.get('LineList',[]) if 'Line length' in v]
                    if len(pts)==len(line) and ll and max(math.hypot(a[0]-b[0]-dx,a[1]+b[1]-dy) for a,b in zip(pts,line))<.06:
                        row['internal_lengths_mm'][str(i)]=sum(ll);break
            break
    return row


def assembly_readback(garment,results,report):
    seams=[]
    for source,canonical in zip(garment['sewing_graph'],report['assembly']['links']):
        values=[]
        for e in (source['a'],source['b']):
            measured=results[e['piece']]['native_measurement']
            if 'segments' in e:
                values.append(sum(measured['stitch_segment_lengths_mm'][j] for j in e['segments']) if measured['stitch_measured'] else None)
            else:values.append(measured['internal_lengths_mm'].get(str(e['internal_line'])))
        residual=values[0]-values[1]-canonical['ease_mm'] if all(v is not None for v in values) else None
        seams.append({'id':source['id'],'a_mm':values[0],'b_mm':values[1],'residual_mm':residual,'ease_mm':canonical['ease_mm'],
                      'tolerance_mm':canonical['tolerance_mm'],'passed':abs(residual)<=canonical['tolerance_mm'] if residual is not None else None})
    return {'status':'measured' if all(s['passed'] is not None for s in seams) else 'partially_measured',
            'cut_coordinates_verified':all(p['native_measurement']['cut_coordinates_verified'] for p in results),
            'pieces':[p['native_measurement'] for p in results],'seams':seams,
            'note':'Реальные координаты и доступные длины прочитаны из API CLO. Пустые значения не измерены. Стачивание и посадка не проверены.'}
