"""Read-only numerical audit of saved garment models and CLO measurement snapshots."""
import json
import math
from pathlib import Path
from garment_engine import deserialize
from contour_engine import Point, validate_polygon


def distance(p, a, b):
    dx, dy = b[0]-a[0], b[1]-a[1]
    t = max(0, min(1, ((p[0]-a[0])*dx+(p[1]-a[1])*dy)/(dx*dx+dy*dy))) if dx or dy else 0
    return math.hypot(p[0]-a[0]-t*dx, p[1]-a[1]-t*dy)


def inside(p, polygon):
    result = False
    for a, b in zip(polygon, polygon[1:]+polygon[:1]):
        if distance(p, a, b) < 1e-6:
            return True
        if (a[1] > p[1]) != (b[1] > p[1]) and p[0] < (b[0]-a[0])*(p[1]-a[1])/(b[1]-a[1])+a[0]:
            result = not result
    return result


def bounds(points):
    return dict(width_mm=max(p[0] for p in points)-min(p[0] for p in points),
                height_mm=max(p[1] for p in points)-min(p[1] for p in points))


def tangent(s, end=False):
    a, b = (s.c2, s.end) if end and s.c1 else (s.start, s.c1) if s.c1 else (s.start, s.end)
    return b.x-a.x, b.y-a.y


def angle(a, b):
    return math.degrees(math.acos(max(-1, min(1, sum(x*y for x,y in zip(a,b))/math.hypot(*a)/math.hypot(*b)))))


def points(raw):
    return [(float(p['Point positionX']), float(p['Point positionY'])) for p in raw.get('PointList',[]) if 'Point positionX' in p]


def lines(raw):
    return [float(p['Line length']) for p in raw.get('LineList',[]) if 'Line length' in p]


def analyze(g, native=None):
    parts, findings, seam_rows = [], [], []
    native_rows = native.get('measurement',[]) if native else []
    data = [json.loads(r) if isinstance(r,str) else r for r in native_rows]
    contours = [deserialize(p['seam_contour']) for p in g['pieces']]
    native_lengths = {};native_internal={}
    corrected=g.get('construction_revision')=='wide_trousers_audit_2'
    for i, (p,c) in enumerate(zip(g['pieces'],contours)):
        cut=deserialize(p['cut_contour']);outline=[v[:2] for v in cut.clo_points()];stitch=[v[:2] for v in c.clo_points()]
        issues=[]
        try:validate_polygon([Point(*q) for q in outline]);validate_polygon([Point(*q) for q in stitch])
        except ValueError as e:issues.append(str(e))
        short=[n for n,s in enumerate(cut.segments) if s.length()<.5]
        if short:issues.append('Короткие участки раскроя <0,5 мм: '+str(short))
        # Measurements at edge midpoints: miter corner distance is not seam allowance width.
        fine=[]
        for s in c.segments:fine.extend([(v.x,v.y) for v in s.flatten(.01)[:-1]])
        distances=[]
        for a,b in zip(outline,outline[1:]+outline[:1]):
            q=((a[0]+b[0])/2,(a[1]+b[1])/2)
            distances.append(min(distance(q,u,v) for u,v in zip(fine,fine[1:]+fine[:1])))
        perpendicular=[];base=c.clo_points(.1)
        if len(base)==len(outline):
            for j,a in enumerate(base):
                b=base[(j+1)%len(base)];q=outline[j];dx,dy=b[0]-a[0],b[1]-a[1]
                perpendicular.append(abs((q[0]-a[0])*dy-(q[1]-a[1])*dx)/math.hypot(dx,dy))
        marker=p.get('grainline',[]);outside=0
        if len(marker)==2:
            outside=sum(not inside((marker[0][0]*(1-t)+marker[1][0]*t,marker[0][1]*(1-t)+marker[1][1]*t),outline) for t in [n/100 for n in range(101)])
        if outside:issues.append('Указатель долевой выходит за контур раскроя; вне детали '+str(outside)+' из 101 проб')
        kinks=[]
        for group,ids in p.get('seams',{}).items():
            if group not in ('side','inseam','crotch'):continue
            for a,b in zip(ids,ids[1:]):
                if c.segments[a].end.distance(c.segments[b].start)<1e-7:
                    turn=angle(tangent(c.segments[a],True),tangent(c.segments[b]))
                    if turn>1:kinks.append(dict(seam=group,between=[a,b],degrees=turn))
        # Crotch curve / upper centre line is also a same-seam join when front is split for zipper.
        if p['role'].startswith(('front_','back_')) and len(c.segments)>9:
            turn=angle(tangent(c.segments[8],True),tangent(c.segments[9]))
            if turn>1 and not any(k['between']==[8,9] for k in kinks):kinks.append(dict(seam='crotch',between=[8,9],degrees=turn))
        for k in kinks:issues.append('Излом касательной '+k['seam']+' '+str(k['between'])+': {:.3f}°'.format(k['degrees']))
        overlap=False
        if len(marker)==2:
            overlap=any(len(l)==2 and max(distance(q,l[0],l[1]) for q in marker)<1e-6 for l in p.get('internal_lines',[]))
        if overlap:issues.append('Указатель долевой дублирует часть линии сгиба')
        actual={}
        if i<len(data):
            raw=data[i]['Pattern InputInformation'][0];np=points(raw);children=[ch for ch in raw.get('Children Information',[]) if 'Shape index' in ch]
            actual=dict(bounds(np),vertices=len(np),perimeter_mm=sum(lines(raw)),internal_shapes=len(children),internal_types=sorted(set(ch.get('Shape type','unknown') for ch in children)))
            # Identify the stitching contour by coordinate correspondence, not just child order.
            sy_found=None
            for ch in children:
                cp=points(ch)
                if len(cp)!=len(stitch):continue
                errors=[]
                for sy in (1,-1):
                    dx,dy=cp[0][0]-stitch[0][0],cp[0][1]-sy*stitch[0][1]
                    errors.append((max(math.hypot(q[0]-u[0]-dx,q[1]-sy*u[1]-dy) for q,u in zip(cp,stitch)),sy))
                error,candidate_sy=min(errors)
                if error>.06:continue
                ll=lines(ch);counts=[len(s.flatten(.1))-1 for s in c.segments]
                if len(ll)!=sum(counts):continue
                sy_found=candidate_sy;offset=0;native_lengths[i]=[]
                for n in counts:native_lengths[i].append(sum(ll[offset:offset+n]));offset+=n
                actual['stitch_child_index']=int(ch['Shape index']);actual['stitch_mapping_error_mm']=error
                actual['stitch_segment_lengths_mm']=native_lengths[i]
                if p['role'].startswith(('front_','back_')):actual['local_y_exported_without_flip']=sy_found==1
                break
            cp=points(raw);local=outline
            # Source internal polyline matching uses the same rigid translation as the cutting boundary.
            sy=sy_found or 1;dx,dy=cp[0][0]-local[0][0],cp[0][1]-sy*local[0][1]
            for li,line in enumerate(p.get('internal_lines',[])):
                for ch in children:
                    q=points(ch)
                    if len(q)==len(line) and max(math.hypot(a[0]-b[0]-dx,a[1]-sy*b[1]-dy) for a,b in zip(q,line))<.06:
                        native_internal[(i,li)]=sum(lines(ch));break
        connected=[n+1 for n,r in enumerate(g['sewing_graph']) if any(e['piece']==i for e in (r['a'],r['b']))]
        parts.append(dict(index=i,role=p['role'],name=p['name'],purpose=purpose(p['role']),seam_bounds=bounds(stitch),cut_bounds=bounds(outline),semantic_segments=len(c.segments),cut_vertices=len(outline),min_cut_segment_mm=min(s.length() for s in cut.segments),allowance_mm=p['allowance_mm'],allowance_sample_min_mm=min(distances),allowance_sample_max_mm=max(distances),internal_lines={'stitch_outline':1,'grain_guide':0 if corrected else 1,'other':len(p.get('internal_lines',[])),'mark_guides':len(p.get('notches',[])),'native_grainline_configured_by_plugin':False},connected_seams=connected,tangent_kinks=kinks,grain_guide_outside_samples=outside,grain_fold_overlap=overlap,issues=issues,native=actual))
        parts[-1]['allowance_perpendicular_min_mm']=min(perpendicular) if perpendicular else None
        parts[-1]['allowance_perpendicular_max_mm']=max(perpendicular) if perpendicular else None
    for n,r in enumerate(g['sewing_graph']):
        row={'number':n+1,'id':r['id'],'type':r['type'],'direction':r['direction'],'tolerance_mm':r['tolerance_mm'],'ease_mm':r.get('ease_mm',0)}
        lengths=[];native_pair=[];control_positions=[]
        for key in ('a','b'):
            e=r[key];p=g['pieces'][e['piece']];row[key]=p['name'];row[key+'_role']=p['role'];row[key+'_sections']=e.get('segments', 'внутренняя '+str(e.get('internal_line')))
            if 'segments' in e:
                lengths.append(sum(contours[e['piece']].segments[j].length() for j in e['segments']))
                native_pair.append(sum(native_lengths[e['piece']][j] for j in e['segments']) if e['piece'] in native_lengths else None)
                mark=next((m for m in p.get('notches',[]) if m.get('sewing_id')==r['id'] and m['segment'] in e['segments']),None)
                if mark:
                    ids=e['segments'];c=contours[e['piece']];position=sum(c.segments[j].length() for j in ids[:ids.index(mark['segment'])])+c.segments[mark['segment']].split(mark['t'])[0].length()
                    control_positions.append(position)
            else:
                l=p['internal_lines'][e['internal_line']];lengths.append(sum(math.hypot(b[0]-a[0],b[1]-a[1]) for a,b in zip(l,l[1:])));native_pair.append(native_internal.get((e['piece'],e['internal_line'])))
        row.update(a_mm=lengths[0],b_mm=lengths[1],delta_mm=lengths[0]-lengths[1]-row['ease_mm'],native_a_mm=native_pair[0],native_b_mm=native_pair[1])
        row['native_delta_mm']=native_pair[0]-native_pair[1]-row['ease_mm'] if all(v is not None for v in native_pair) else None
        row['control_midpoint_delta_mm']=control_positions[0]-control_positions[1] if len(control_positions)==2 else None
        seam_rows.append(row)
    if any(p['native'].get('local_y_exported_without_flip') for p in parts):findings.append('Подтверждено: +Y от талии к низу передаётся без отражения; детали в CLO перевёрнуты.')
    if any(p['tangent_kinks'] for p in parts):findings.append('Подтверждено: излом касательной среднего шва на уровне бёдер.')
    if any(p['grain_fold_overlap'] for p in parts):findings.append('Подтверждено: дублирование линии сгиба пояса указателем долевой.')
    if any(p['grain_guide_outside_samples'] for p in parts):findings.append('Подтверждено: часть прямых указателей долевой выходит за деталь.')
    return dict(garment_id=g['id'],version=g['version'],parameters=g['parameters'],approximate=g.get('approximate',False),piece_count=len(parts),parts=parts,seams=seam_rows,findings=findings,native_snapshot=bool(data),fit_verified=False,sewing_ready=False)


def purpose(role):
    if role.startswith('front_'):return 'Передняя половинка брючины'
    if role.startswith('back_'):return 'Задняя половинка брючины'
    if role.startswith('bag_'):return 'Мешковина бокового кармана'
    if role.startswith('facing_'):return 'Подзор кармана'
    if role.startswith('belt_'):return 'Секция складываемого пояса'
    if role.startswith('loop_'):return 'Заготовка шлёвки и линии закрепок'
    return {'fly':'Обтачка застёжки / гульфик','guard':'Откосок застёжки'}.get(role,'Деталь изделия')


def write_report(report,folder,label='Диагностика исходного комплекта'):
    folder=Path(folder);folder.mkdir(parents=True,exist_ok=True)
    (folder/'audit.json').write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf-8')
    f=lambda x:'—' if x is None else '{:.3f}'.format(x)
    text=['# '+label,'','Изделие: `'+report['garment_id']+'`, версия '+str(report['version'])+'.',
          'Фактический снимок CLO: '+('получен, геометрия только прочитана.' if report['native_snapshot'] else 'не получен; это вычислительная проверка модели.'),'',
          'Макет приблизительный: '+str(report['approximate'])+'. Посадка и готовность к пошиву не подтверждены.','',
          '## Подтверждённые результаты','']+['- '+x for x in report['findings']]
    text+=['','## Пары швов','', 'Длины модели — по кривым Безье. Длины CLO — сумма отрезков внутреннего контура, идентифицированного по координатам; внешние припуски для стачивания не используются. Отсутствующие нативные измерения отмечены прочерком.', '',
           '| № | Деталь / участки A | Деталь / участки B | A, мм | B, мм | Δ с учётом посадки, мм | CLO A, мм | CLO B, мм | Δ CLO, мм |','|---:|---|---|---:|---:|---:|---:|---:|---:|']
    for r in report['seams']:text.append('| {} | {} / {} | {} / {} | {} | {} | {} | {} | {} | {} |'.format(r['number'],r['a'],r['a_sections'],r['b'],r['b_sections'],f(r['a_mm']),f(r['b_mm']),f(r['delta_mm']),f(r['native_a_mm']),f(r['native_b_mm']),f(r['native_delta_mm'])))
    text+=['','## Детали','']
    for p in report['parts']:
        text+=['### '+p['name']+' (`'+p['role']+'`)','',p['purpose']+'.',
               '- Габариты стачивания: '+f(p['seam_bounds']['width_mm'])+' × '+f(p['seam_bounds']['height_mm'])+' мм; раскроя: '+f(p['cut_bounds']['width_mm'])+' × '+f(p['cut_bounds']['height_mm'])+' мм.',
               '- Припуск: '+f(p['allowance_mm'])+' мм. Расстояние от середин срезов до тонко дискретизированной линии стачивания: '+f(p['allowance_sample_min_mm'])+'…'+f(p['allowance_sample_max_mm'])+' мм. На митровых углах радиальное расстояние не является шириной припуска.',
               '- По нормали к каждому исходному участку полилинии стачивания: '+f(p['allowance_perpendicular_min_mm'])+'…'+f(p['allowance_perpendicular_max_mm'])+' мм.',
               '- Контур модели: '+str(p['semantic_segments'])+' участков; раскрой: '+str(p['cut_vertices'])+' вершин; самый короткий срез: '+f(p['min_cut_segment_mm'])+' мм.',
               '- Линии: '+json.dumps(p['internal_lines'],ensure_ascii=False)+'. Длинная прямая — указатель направления долевой, не нативная долевая, не заутюживание и не конструктивная ось.',
               '- Связанные швы: '+', '.join(map(str,p['connected_seams']))+'.',
               '- Фактический CLO: '+('вершин '+str(p['native'].get('vertices'))+', внутренних форм '+str(p['native'].get('internal_shapes'))+' ('+', '.join(p['native'].get('internal_types',[]))+').' if p['native'] else 'нет данных.'),
               '- Проблемы: '+('; '.join(p['issues']) if p['issues'] else 'вычислительные ошибки перечисленных проверок не обнаружены; технологическая пригодность не доказана.'),'']
    (folder/'audit.md').write_text('\n'.join(text),encoding='utf-8')


if __name__=='__main__':
    import argparse
    parser=argparse.ArgumentParser();parser.add_argument('garment');parser.add_argument('output');parser.add_argument('--native');args=parser.parse_args()
    g=json.loads(Path(args.garment).read_text(encoding='utf-8'));native=json.loads(Path(args.native).read_text(encoding='utf-8')) if args.native else None
    report=analyze(g,native);write_report(report,args.output);print(json.dumps({'pieces':report['piece_count'],'seams':len(report['seams']),'findings':report['findings']},ensure_ascii=True))
