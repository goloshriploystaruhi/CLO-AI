"""Compact native CLO curves. Export-only; source construction stays unchanged."""
import math
from contour_engine import Point, Segment, Contour


def _distance(p,a,b):
    dx,dy=b.x-a.x,b.y-a.y;d=dx*dx+dy*dy
    t=max(0,min(1,((p.x-a.x)*dx+(p.y-a.y)*dy)/d)) if d else 0
    return p.distance(a.mix(b,t))


def _unit(a,b):
    d=a.distance(b)
    return ((b.x-a.x)/d,(b.y-a.y)/d) if d else (0,0)


def _tangent(points):
    a,b,c=points[:3];d1,d2=a.distance(b),b.distance(c)
    u,v=_unit(a,b),_unit(b,c)
    x=u[0]*(2*d1+d2)/(d1+d2)-v[0]*d1/(d1+d2)
    y=u[1]*(2*d1+d2)/(d1+d2)-v[1]*d1/(d1+d2)
    d=math.hypot(x,y)
    return (x/d,y/d) if d else u


def _value(s,t):
    u=1-t
    return Point(u*u*u*s.start.x+3*u*u*t*s.c1.x+3*u*t*t*s.c2.x+t*t*t*s.end.x,
                 u*u*u*s.start.y+3*u*u*t*s.c1.y+3*u*t*t*s.c2.y+t*t*t*s.end.y)


def _fit(points,tolerance):
    """Least-squares cubic with recursive splitting and bidirectional checks."""
    a,b=points[0],points[-1]
    if len(points)==2:return [Segment(a,b)]
    if max(_distance(p,a,b) for p in points)<=tolerance*.5:return [Segment(a,b)]
    distances=[0.0]
    for p,q in zip(points,points[1:]):distances.append(distances[-1]+p.distance(q))
    ts=[v/distances[-1] for v in distances]
    t0,t1=_tangent(points),_tangent(list(reversed(points)))
    aa=ab=bb=ar=br=0.0
    for p,t in zip(points,ts):
        u=1-t;v0=3*u*u*t;v1=3*u*t*t
        x=p.x-((u*u*u+v0)*a.x+(t*t*t+v1)*b.x)
        y=p.y-((u*u*u+v0)*a.y+(t*t*t+v1)*b.y)
        ax,ay=v0*t0[0],v0*t0[1];bx,by=v1*t1[0],v1*t1[1]
        aa+=ax*ax+ay*ay;ab+=ax*bx+ay*by;bb+=bx*bx+by*by;ar+=ax*x+ay*y;br+=bx*x+by*y
    det=aa*bb-ab*ab
    alpha,beta=((ar*bb-br*ab)/det,(br*aa-ar*ab)/det) if abs(det)>1e-12 else (0,0)
    if min(alpha,beta)>1e-6 and max(alpha,beta)<distances[-1]*2:
        curve=Segment(a,b,Point(a.x+t0[0]*alpha,a.y+t0[1]*alpha),Point(b.x+t1[0]*beta,b.y+t1[1]*beta))
        errors=[p.distance(_value(curve,t)) for p,t in zip(points,ts)]
        flat=curve.flatten(tolerance*.1)
        # Bound sampled Hausdorff distance, rather than trusting parameter fitting.
        reverse=max(min(_distance(p,x,y) for x,y in zip(points,points[1:])) for p in flat)
        forward=max(min(_distance(p,x,y) for x,y in zip(flat,flat[1:])) for p in points)
        if max(reverse,forward)<=tolerance*.8:return [curve]
        split=max(range(1,len(points)-1),key=lambda i:errors[i])
    else:split=len(points)//2
    return _fit(points[:split+1],tolerance)+_fit(points[split:],tolerance)


def compact_polygon(contour,tolerance=.08):
    """Retain true corners/extrema; fit only existing sampled cut boundaries."""
    if len(contour.segments)<=8 or any(s.c1 for s in contour.segments):return contour
    points=[s.start for s in contour.segments];n=len(points);keep={0}
    for attr in ('x','y'):
        keep.add(min(range(n),key=lambda i:getattr(points[i],attr)))
        keep.add(max(range(n),key=lambda i:getattr(points[i],attr)))
    for i,p in enumerate(points):
        u=_unit(points[i-1],p);v=_unit(p,points[(i+1)%n])
        if u[0]*v[0]+u[1]*v[1]<math.cos(math.radians(12)):keep.add(i)
    anchors=sorted(keep);segments=[]
    for k,i in enumerate(anchors):
        j=anchors[(k+1)%len(anchors)];j=j if j>i else j+n
        segments.extend(_fit([points[q%n] for q in range(i,j+1)],tolerance))
    candidate=Contour(tuple(segments))
    # Never exchange a valid cut contour for a self-intersecting approximation.
    try:candidate.clo_points(.02)
    except ValueError:return contour
    if abs(candidate.perimeter()-contour.perimeter())>max(.2,contour.perimeter()*.0002):return contour
    return candidate


def encode(contour,compact=False):
    c=compact_polygon(contour) if compact else contour
    points=[]
    for s in c.segments:
        points.append((s.start.x,s.start.y,0))
        if s.c1:points.extend([(s.c1.x,s.c1.y,3),(s.c2.x,s.c2.y,3)])
    return {'points':points,'anchors':[(s.start.x,s.start.y) for s in c.segments],
            'lengths':[s.length() for s in c.segments],
            'curves':sum(s.c1 is not None for s in c.segments),'contour':c}
