"""Shared geometric audit of analytic seams and discrete cutting boundaries."""
import math
from garment_engine import deserialize
from contour_engine import Point


def signed_area(points):
    return sum(a[0]*b[1]-b[0]*a[1] for a,b in zip(points,points[1:]+points[:1]))/2


def distance(p,a,b):
    dx,dy=b[0]-a[0],b[1]-a[1]
    den=dx*dx+dy*dy
    t=max(0,min(1,((p[0]-a[0])*dx+(p[1]-a[1])*dy)/den)) if den else 0
    return math.hypot(p[0]-a[0]-t*dx,p[1]-a[1]-t*dy)


def inside(p,poly):
    result=False
    for a,b in zip(poly,poly[1:]+poly[:1]):
        if distance(p,a,b)<1e-6:return True
        if (a[1]>p[1])!=(b[1]>p[1]) and p[0]<(b[0]-a[0])*(p[1]-a[1])/(b[1]-a[1])+a[0]:result=not result
    return result


def length_interval(segment, error=.01, depth=0):
    if not math.isfinite(error) or error<=0:raise ValueError('Погрешность длины должна быть положительной')
    lower=segment.start.distance(segment.end)
    if not segment.c1:return lower,lower
    upper=segment.start.distance(segment.c1)+segment.c1.distance(segment.c2)+segment.c2.distance(segment.end)
    if upper-lower<=2*error:return lower,upper
    if depth>=24:raise ValueError('Не достигнута заданная погрешность длины кривой')
    a,b=segment.split();la,ua=length_interval(a,error/2,depth+1);lb,ub=length_interval(b,error/2,depth+1)
    return la+lb,ua+ub


def audit_piece(piece):
    issues=[]
    def issue(code,section,message,severity='error'):
        issues.append(dict(code=code,piece=piece['name'],piece_id=piece['id'],section=section,message=message,severity=severity))
    reports={}
    for kind,key in (('стачивание','seam_contour'),('раскрой','cut_contour')):
        try:
            c=deserialize(piece[key]);poly=[(x,y) for x,y,_ in c.clo_points(.1)]
            seen=set();minimum=float('inf')
            for i,s in enumerate(c.segments):
                length=s.length();minimum=min(minimum,length)
                if length<(.5 if key=='seam_contour' else .01):issue('MICROSEGMENT',kind+'/s'+str(i),'Слишком короткий участок: {:.5f} мм'.format(length))
                forward=tuple(tuple(round(v,7) for v in pt) for pt in ([s.start.x,s.start.y],[s.c1.x,s.c1.y] if s.c1 else [s.start.x,s.start.y],[s.c2.x,s.c2.y] if s.c2 else [s.end.x,s.end.y],[s.end.x,s.end.y]))
                canonical=min(forward,forward[::-1])
                if canonical in seen:issue('DUPLICATE_SEGMENT',kind+'/s'+str(i),'Дублирующийся сегмент')
                seen.add(canonical)
            reports[key]={'width_mm':max(p[0] for p in poly)-min(p[0] for p in poly),'height_mm':max(p[1] for p in poly)-min(p[1] for p in poly),
                          'area_mm2':abs(signed_area(poly)),'signed_area_mm2':signed_area(poly),'perimeter_mm':c.perimeter(.01),
                          'source_segments':len(c.segments),'adaptive_vertices':len(poly),'min_segment_mm':minimum,'curve_error_mm':.1}
        except (ValueError,KeyError,TypeError,IndexError) as e:
            issue('CONTOUR_INVALID',kind,{'Self-intersecting contour':'Самопересечение контура','Contour is not closed':'Контур не замкнут','Duplicate adjacent points':'Совпадают соседние точки'}.get(str(e),str(e)))
    if len(reports)==2:
        seam=deserialize(piece['seam_contour']);cut=deserialize(piece['cut_contour'])
        spts=[(x,y) for x,y,_ in seam.clo_points(.1)];cpts=[(x,y) for x,y,_ in cut.clo_points(.1)]
        if signed_area(spts)*signed_area(cpts)<=0:issue('WINDING_MISMATCH','припуск','Направление контура припуска не совпадает с линией стачивания')
        if abs(signed_area(cpts))<=abs(signed_area(spts)):issue('ALLOWANCE_INWARD','припуск','Припуск уменьшает площадь вместо расширения детали')
        a=piece.get('allowance_mm')
        if isinstance(a,bool) or not isinstance(a,(int,float)) or not math.isfinite(a) or a<=0:issue('ALLOWANCE_INVALID','припуск','Не задан положительный припуск')
        else:
            if any(not inside(p,cpts) for p in spts):issue('ALLOWANCE_CONTAINMENT','припуск','Линия стачивания выходит за контур раскроя')
            # Verify the documented uniform miter offset against the seam polyline.
            from garment_engine import offset
            try:
                expected=offset(seam,a).clo_points(.1)
                if len(expected)!=len(cpts) or max(math.hypot(x-p[0],y-p[1]) for (x,y),p in zip(cpts,expected))>.001:
                    issue('ALLOWANCE_DISTANCE','припуск','Контур не соответствует заявленному равномерному припуску {:.2f} мм'.format(a))
            except ValueError:issue('ALLOWANCE_UNSAFE','припуск','Смещение образует пересечение или острый выброс')
    return {'piece_id':piece['id'],'name':piece['name'],'role':piece['role'],'geometry':reports,'issues':issues}
