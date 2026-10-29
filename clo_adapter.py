# -*- coding: utf-8 -*-
"""CLO 7 adapter. Geometry schemas verified against local runtime reports."""
import json
import math
import os
import tempfile
import uuid
from pattern_engine import rectangle
from pattern_recipes import build
from semantic_patterns import describe
from contour_engine import simplify_closed
import importlib
import clo_curves
importlib.reload(clo_curves)


def local_to_clo(spec,x,y):
    # Garment constructors use +Y from waist to hem; CLO 2D uses +Y upward.
    return (x,-y) if spec.get('type')=='garment_piece' else (x,y)


def placement(information):
    xs, ys = [], []
    for raw in information:
        data = json.loads(raw) if isinstance(raw, str) else raw
        parts = data['Pattern InputInformation']
        if len(parts) != 1:
            raise ValueError('Unsupported pattern information layout')
        part = parts[0]
        lines = [v for v in part['LineList'] if 'Line type' in v]
        if not lines:
            raise ValueError('Не удалось прочитать контур существующей детали')
        points = [p for p in part['PointList'] if 'Point positionX' in p]
        if len(points) < 3:
            raise ValueError('Pattern coordinates unavailable')
        for point in points:
            x, y = float(point['Point positionX']), float(point['Point positionY'])
            if not math.isfinite(x) or not math.isfinite(y):
                raise ValueError('Invalid existing coordinates')
            xs.append(x)
            ys.append(y)
    return (max(xs) + 50, min(ys)) if xs else (0, 0)


def create_rectangle(job, api, exporter):
    points = rectangle(job['width_mm'], job['height_mm'])
    before = api.GetPatternCount()
    previous = [api.GetPatternInformation(i) for i in range(before)]
    x, y = placement([api.GetPatternInputInformation(i) for i in range(before)])
    backup = None
    if before:
        folder = os.path.join(tempfile.gettempdir(), 'CLO_AI_Backups')
        os.makedirs(folder, exist_ok=True)
        backup = os.path.join(folder, 'before_' + str(uuid.uuid4()) + '.zprj')
        saved = exporter.ExportZPrjW(backup, False)
        if not saved or not os.path.isfile(backup) or os.path.getsize(backup) == 0:
            raise RuntimeError('Backup failed. No pattern created.')
    api.CreatePatternWithPoints([(px+x, py+y, kind) for px, py, kind in points])
    if api.GetPatternCount() != before + 1:
        raise RuntimeError('Unexpected pattern count. Check CLO. Backup: ' + str(backup))
    if any(api.GetPatternInformation(i) != previous[i] for i in range(before)):
        raise RuntimeError('Pattern indexing changed. Check CLO. Backup: ' + str(backup))
    lengths = [api.GetLineLength(before, i) for i in range(4)]
    if any(abs(a-b) > .01 for a, b in zip(lengths, [job['width_mm'], job['height_mm']] * 2)):
        raise RuntimeError('Dimension check failed. Backup: ' + str(backup))
    return {'line_lengths_mm': lengths, 'backup': backup, 'pattern_index': before}


def create_batch(job, api, exporter):
    specs=job.get('patterns')
    if specs is None:
        return create_rectangle(job,api,exporter)
    if not isinstance(specs,list) or not 1<=len(specs)<=(64 if job.get('garment') else 20):
        raise ValueError('Batch must contain 1..20 patterns')
    # Validate the entire batch before making any change.
    contours=[build(spec) for spec in specs]
    originals=[contour.clo_points(.1) for contour in contours]
    encoded=[clo_curves.encode(c,spec.get('type')=='garment_piece') for c,spec in zip(contours,specs)]
    outlines=[e['points'] for e in encoded]
    outlines=[[(local_to_clo(spec,px,py)[0],local_to_clo(spec,px,py)[1],kind) for px,py,kind in points] for spec,points in zip(specs,outlines)]
    before=api.GetPatternCount()
    x,y=job.get('origin') or placement([api.GetPatternInputInformation(i) for i in range(before)])
    backup=backup_project(exporter)
    results=[];created_ids=[]
    try:
        for index,points in enumerate(outlines):
            try:from operation_events import emit
            except ImportError:emit=lambda *args,**kwargs:None
            name=specs[index].get('name') or 'Деталь '+str(index+1)
            emit('construction',name,'running','Создаю в CLO: '+name+'.')
            bounds=[local_to_clo(specs[index],px,py) for px,py,_ in originals[index]]
            minx,miny=min(p[0] for p in bounds),min(p[1] for p in bounds)
            if job.get('translations') is not None and job['translations'][index] is not None:
                dx,dy=job['translations'][index]
                shifted=[(px+dx,py+dy,kind) for px,py,kind in points]
            else:
                shifted=[(px-minx+x,py-miny+y,kind) for px,py,kind in points]
            expected=encoded[index]['lengths']
            api.CreatePatternWithPoints(shifted)
            if api.GetPatternCount()!=before+index+1: raise RuntimeError('Pattern count mismatch')
            created_info=api.GetPatternInformation(before+index)
            created_info=json.loads(created_info) if isinstance(created_info,str) else created_info
            created_ids.append(created_info['id'])
            lengths=[api.GetLineLength(before+index,i) for i in range(len(expected))]
            limits=[max(.06,v*.0002) if s.c1 is not None else .01 for s,v in zip(encoded[index]['contour'].segments,expected)]
            if any(not math.isfinite(a) or abs(a-b)>limit for a,b,limit in zip(lengths,expected,limits)): raise RuntimeError('Длина сегмента в CLO не соответствует модели')
            info=api.GetPatternInformation(before+index)
            info=json.loads(info) if isinstance(info,str) else info
            internal_status=add_production_lines(specs[index],shifted,points,before+index,api)
            naming=assign_production_name(specs[index],before+index,api)
            from engineering.native import readback
            anchors=[(px,py,kind) for px,py,kind in shifted if kind==0]
            measured=readback(api,before+index,anchors,specs[index].get('production'))
            emit('construction',name,'verified','CLO подтвердил контур: '+name+'.',{'pattern_id':info.get('id')})
            results.append({'native_measurement':measured,'name':naming,'internal_lines':internal_status,'material':assign_production_material(specs[index],before+index),'pattern_index':before+index,'clo_pattern_id':info.get('id'), 'semantic':describe(specs[index],contours[index]),'production':specs[index].get('production'),'segments':len(expected),'export':{'original_vertices':len(originals[index]),'vertices':len(anchors),'control_points':len(points)-len(anchors),'native_curves':encoded[index]['curves'],'simplification_tolerance_mm':.08 if specs[index].get('type')=='garment_piece' else 0,'coordinate_system':'CLO_x_right_y_up_mm'},'perimeter_mm':sum(lengths),'analytic_perimeter_mm':contours[index].perimeter()})
            x=max(p[0] for p in bounds)-minx+x+50
    except Exception as error:
        # Compensate only objects created by this transaction, never pre-existing pieces.
        rolled_back=[]
        if callable(getattr(api,'DeletePatternPiece',None)):
            for i in range(api.GetPatternCount()-1,before-1,-1):
                value=api.GetPatternInformation(i);value=json.loads(value) if isinstance(value,str) else value
                if value.get('id') in created_ids:
                    try:api.DeletePatternPiece(i);rolled_back.append(value['id'])
                    except Exception:break
        failure=RuntimeError('Не удалось применить комплект. Отменено новых деталей: {} из {}. Исходные детали не удалялись. Резервная копия: {}. {}'.format(len(rolled_back),len(created_ids),backup,error))
        failure.transaction={'stage':'create_failed','created_ids':created_ids,'rolled_back_ids':rolled_back,'backup':backup,'requires_manual_recovery':len(rolled_back)!=len(created_ids) or api.GetPatternCount()!=before}
        raise failure
    return {'patterns':results,'backup':backup,'line_lengths_mm':[], 'approximation_mm':.1,'curve_encoding':'native_bezier'}


def backup_project(exporter):
    folder=os.path.join(tempfile.gettempdir(),'CLO_AI_Backups');os.makedirs(folder,exist_ok=True)
    backup=os.path.join(folder,'batch_'+str(uuid.uuid4())+'.zprj')
    if not exporter.ExportZPrjW(backup,False) or not os.path.isfile(backup) or not os.path.getsize(backup):
        raise RuntimeError('Не удалось сохранить резервную копию. Проект не изменён.')
    return backup



def assign_production_name(spec,index,api):
    name=spec.get('production',{}).get('name')
    if not name:return {'status':'not_requested'}
    setter,getter=getattr(api,'SetPatternPieceName',None),getattr(api,'GetPatternPieceName',None)
    if not callable(setter) or not callable(getter):return {'status':'manual','reason':'API имени детали недоступен'}
    try:
        setter(index,name)
        if getter(index)!=name:raise ValueError('Имя детали не подтверждено CLO')
        return {'status':'verified','value':name}
    except Exception as error:return {'status':'manual','reason':str(error)}


def add_production_lines(spec, shifted, original, index, api):
    production=spec.get('production')
    if not production:return {'status':'not_requested'}
    fn=getattr(api,'CreateInternalShapeWithPoints',None)
    if not callable(fn):return {'status':'manual','reason':'API внутренних линий недоступен'}
    dx,dy=shifted[0][0]-original[0][0],shifted[0][1]-original[0][1]
    lines=production_lines(production)
    count=0
    try:
        for line in lines:
            coords=[local_to_clo(spec,x,y) for x,y in line['points']]
            kinds=line.get('point_types',[0]*len(coords))
            fn(index,[(x+dx,y+dy,k) for (x,y),k in zip(coords,kinds)],line['closed']);count+=1
        return {'status':'sent_to_api_not_verified','count':count,'kinds':[l['kind'] for l in lines],'grainline':{'status':'manual','note':'Направление долевой сохранено в модели и SVG; нативная долевая CLO не настроена'},'note':'Внутренняя линия стачивания, сгибы, закрепки и контрольные метки; метки не являются нативными надсечками'}
    except Exception as error:return {'status':'partial_manual','count':count,'reason':str(error)}


def production_lines(production):
    """Typed internal shapes. A grain direction is metadata, never a fake native grainline."""
    from garment_engine import deserialize
    seam=deserialize(production['seam_contour'])
    pts=[(x,y) for x,y,_ in seam.clo_points(.1)]
    sign=1 if sum(a[0]*b[1]-b[0]*a[1] for a,b in zip(pts,pts[1:]+pts[:1]))>0 else -1
    native=clo_curves.encode(seam)
    lines=[{'kind':'stitch_outline','points':[(x,y) for x,y,_ in native['points']],
            'point_types':[k for x,y,k in native['points']],'closed':True}]
    for i,line in enumerate(production.get('internal_lines',[])):
        kinds=production.get('internal_line_kinds',[])
        kind=kinds[i] if i<len(kinds) else ('fold' if production.get('role','').startswith('belt_') and i==0 else 'stitch_attachment')
        lines.append({'kind':kind,'points':line,'closed':False})
    seen=set()
    for notch in production.get('notches',[]):
        s=seam.segments[notch['segment']];p=s.point(notch['t']);tangent=s.tangent(notch['t'])
        size=min(3,production['allowance_mm']*.5);q=[p.x+sign*tangent.y*size,p.y-sign*tangent.x*size]
        key=tuple(round(v,5) for v in (p.x,p.y,q[0],q[1]))
        if key not in seen:lines.append({'kind':'alignment_guide','points':[[p.x,p.y],q],'closed':False});seen.add(key)
    return lines


def assign_production_material(spec,index):
    material=spec.get('production',{}).get('material',{})
    fabric_index=material.get('fabric_index') if isinstance(material,dict) else None
    if fabric_index is None:return {'status':'not_requested'}
    try:
        import fabric_api
        if type(fabric_index) is not int or not 0<=fabric_index<fabric_api.GetFabricCount():raise ValueError('Выберите существующую ткань CLO')
        assigned=fabric_api.AssignFabricToPattern(fabric_index,index)
        if not assigned or fabric_api.GetFabricIndexForPattern(index)!=fabric_index:raise ValueError('Назначение ткани не подтверждено')
        return {'status':'verified','fabric_index':fabric_index}
    except Exception as error:return {'status':'manual','reason':str(error)}
