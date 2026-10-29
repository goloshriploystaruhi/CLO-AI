"""Parametric closed contours. Python 3.7 compatible; coordinates in mm."""
import math
from dataclasses import dataclass, replace


def number(value):
    if isinstance(value, bool) or not isinstance(value, (int, float)) or not math.isfinite(value):
        raise ValueError('Expected finite number')
    return float(value)


@dataclass(frozen=True)
class Point:
    x: float
    y: float

    def __post_init__(self):
        object.__setattr__(self, 'x', number(self.x))
        object.__setattr__(self, 'y', number(self.y))

    def mix(self, other, t):
        return Point(self.x*(1-t)+other.x*t, self.y*(1-t)+other.y*t)

    def distance(self, other):
        return math.hypot(self.x-other.x, self.y-other.y)


@dataclass(frozen=True)
class Segment:
    start: Point
    end: Point
    c1: Point = None
    c2: Point = None

    def __post_init__(self):
        if (self.c1 is None) != (self.c2 is None):
            raise ValueError('Cubic requires two controls')

    def point(self, t):
        """Evaluate the analytic curve, including exact endpoint positions."""
        t = number(t)
        if not 0 <= t <= 1:
            raise ValueError('Параметр кривой должен находиться в пределах 0..1')
        if t == 0:
            return self.start
        if t == 1:
            return self.end
        if self.c1 is None:
            return self.start.mix(self.end, t)
        a, b, c = self.start.mix(self.c1, t), self.c1.mix(self.c2, t), self.c2.mix(self.end, t)
        return a.mix(b, t).mix(b.mix(c, t), t)

    def tangent(self, t):
        """Unit tangent; endpoint limits handle coincident end controls.

        Stationary interior points are rejected conservatively rather than
        assigning a potentially ambiguous directed normal to a cutting mark.
        """
        t = number(t)
        if not 0 <= t <= 1:
            raise ValueError('Параметр кривой должен находиться в пределах 0..1')
        if self.c1 is None:
            dx, dy = self.end.x-self.start.x, self.end.y-self.start.y
        else:
            u = 1-t
            dx = 3*(u*u*(self.c1.x-self.start.x)+2*u*t*(self.c2.x-self.c1.x)+t*t*(self.end.x-self.c2.x))
            dy = 3*(u*u*(self.c1.y-self.start.y)+2*u*t*(self.c2.y-self.c1.y)+t*t*(self.end.y-self.c2.y))
            if math.hypot(dx, dy) <= 1e-12 and t in (0, 1):
                origin = self.start if t == 0 else self.end
                controls = (self.c1, self.c2, self.end) if t == 0 else (self.c2, self.c1, self.start)
                for control in controls:
                    dx, dy = control.x-origin.x, control.y-origin.y
                    if t == 1:
                        dx, dy = -dx, -dy
                    if math.hypot(dx, dy) > 1e-12:
                        break
        length = math.hypot(dx, dy)
        if length <= 1e-12:
            raise ValueError('Касательная не определена: вырожденный участок или остановка кривой')
        return Point(dx/length, dy/length)

    def reversed(self):
        return Segment(self.end, self.start, self.c2, self.c1)

    def parameter_at_length(self, distance_mm, tolerance=.001, _legacy_iterations=None):
        """Invert arc length without flattening, moving anchors or scaling.

        Length integration uses an error budget smaller than the requested
        positional tolerance; bounded bisection also works for uneven handles.
        """
        distance_mm, tolerance = number(distance_mm), number(tolerance)
        if tolerance <= 0:
            raise ValueError('Погрешность позиции должна быть положительной')
        # Existing saved default midpoint marks are audited by their parameter,
        # not only their physical position. Reproduce that original estimator
        # and bounded iteration count when reconstructing those marks.
        legacy = _legacy_iterations is not None
        if legacy and (type(_legacy_iterations) is not int or not 1 <= _legacy_iterations <= 60):
            raise ValueError('Некорректное число итераций позиции')
        length_tolerance = .001 if legacy else tolerance/8
        total = self.length(length_tolerance)
        if total <= 1e-12:
            raise ValueError('Нельзя измерить позицию на нулевом участке')
        if distance_mm < 0 or distance_mm > total+tolerance/4:
            raise ValueError('Контрольная позиция выходит за участок шва')
        if distance_mm == 0 and not legacy:
            return 0.
        if distance_mm >= total and not legacy:
            return 1.
        if self.c1 is None and not legacy:
            return distance_mm/total
        lo, hi = (.000001,.999999) if legacy else (0.,1.)
        for _ in range(_legacy_iterations if legacy else 60):
            t = (lo+hi)/2
            measured = self.split(t)[0].length(length_tolerance)
            if not legacy and abs(measured-distance_mm) <= tolerance/2:
                return t
            if measured < distance_mm:
                lo = t
            else:
                hi = t
        if legacy:
            return (lo+hi)/2
        raise ValueError('Не достигнута заданная точность позиции на кривой')

    def point_at_length(self, distance_mm, tolerance=.001):
        return self.point(self.parameter_at_length(distance_mm, tolerance))

    def split(self, t=.5):
        if not 0 < number(t) < 1:
            raise ValueError('Split parameter must be inside (0,1)')
        if self.c1 is None:
            p = self.start.mix(self.end, t)
            return Segment(self.start, p), Segment(p, self.end)
        a, b, c = self.start.mix(self.c1,t), self.c1.mix(self.c2,t), self.c2.mix(self.end,t)
        d, e = a.mix(b,t), b.mix(c,t)
        p = d.mix(e,t)
        return Segment(self.start,p,a,d), Segment(p,self.end,e,c)

    def flatten(self, tolerance=.1, depth=0):
        tolerance = number(tolerance)
        if tolerance <= 0:
            raise ValueError('Tolerance must be positive')
        if self.c1 is None:
            return [self.start, self.end]
        # Distance to the chord segment bounds the Bezier convex hull error.
        def distance(p):
            dx, dy = self.end.x-self.start.x, self.end.y-self.start.y
            denom = dx*dx+dy*dy
            t = max(0,min(1,((p.x-self.start.x)*dx+(p.y-self.start.y)*dy)/denom)) if denom else 0
            return p.distance(self.start.mix(self.end,t))
        if max(distance(self.c1), distance(self.c2)) <= tolerance:
            return [self.start,self.end]
        if depth >= 20:
            raise ValueError('Curve subdivision limit exceeded')
        a,b = self.split()
        return a.flatten(tolerance,depth+1)[:-1]+b.flatten(tolerance,depth+1)

    def length(self, tolerance=.001, depth=0):
        tolerance = number(tolerance)
        if tolerance <= 0:
            raise ValueError('Tolerance must be positive')
        chord = self.start.distance(self.end)
        if self.c1 is None:
            return chord
        polygon = self.start.distance(self.c1)+self.c1.distance(self.c2)+self.c2.distance(self.end)
        if polygon-chord <= 2*tolerance:
            return (polygon+chord)/2
        if depth >= 24:
            raise ValueError('Length convergence limit exceeded')
        a,b = self.split()
        return a.length(tolerance/2,depth+1)+b.length(tolerance/2,depth+1)

    def mapped(self, fn):
        return Segment(fn(self.start),fn(self.end),fn(self.c1) if self.c1 else None,fn(self.c2) if self.c2 else None)


@dataclass(frozen=True)
class SegmentChain:
    """Ordered, connected analytic seam; does not add contour anchors."""
    segments: tuple

    def __post_init__(self):
        object.__setattr__(self, 'segments', tuple(self.segments))
        if not self.segments or any(not isinstance(s, Segment) for s in self.segments):
            raise ValueError('Участок шва должен содержать сегменты')
        for a, b in zip(self.segments, self.segments[1:]):
            if a.end.distance(b.start) > 1e-7:
                raise ValueError('Участки шва не образуют непрерывную цепочку')

    def length(self, tolerance=.001):
        tolerance = number(tolerance)
        if tolerance <= 0:
            raise ValueError('Погрешность длины должна быть положительной')
        return sum(s.length(tolerance/(8*len(self.segments))) for s in self.segments)

    def position(self, distance_mm, tolerance=.001, _legacy_iterations=None):
        """Return local segment index, original Bezier parameter and point.

        At a shared anchor prefer the preceding segment, consistent with the
        direction of the chain and its incoming tangent at a corner.
        """
        distance_mm, tolerance = number(distance_mm), number(tolerance)
        if tolerance <= 0:
            raise ValueError('Погрешность позиции должна быть положительной')
        lengths = [s.length(.001 if _legacy_iterations is not None else tolerance/(8*len(self.segments))) for s in self.segments]
        if any(length <= 1e-12 for length in lengths):
            raise ValueError('Участок шва содержит нулевой сегмент')
        total = sum(lengths)
        if distance_mm < 0 or distance_mm > total+tolerance/4:
            raise ValueError('Контрольная позиция выходит за участок шва')
        remaining = min(distance_mm, total)
        roundoff = 0. if _legacy_iterations is not None else 1e-12*max(1.,total)
        for index, (segment, length) in enumerate(zip(self.segments, lengths)):
            if remaining <= length+roundoff or index == len(lengths)-1:
                t = segment.parameter_at_length(remaining,tolerance,_legacy_iterations) if _legacy_iterations is not None else (1. if remaining >= length-roundoff else segment.parameter_at_length(remaining,tolerance))
                return index, t, segment.point(t)
            remaining -= length
        raise ValueError('Контрольная позиция выходит за участок шва')

    def reversed(self):
        return SegmentChain(tuple(s.reversed() for s in reversed(self.segments)))


@dataclass(frozen=True)
class Contour:
    segments: tuple

    def __post_init__(self):
        object.__setattr__(self,'segments',tuple(self.segments))
        if len(self.segments)<2:
            raise ValueError('Closed contour needs at least two segments')
        for i,s in enumerate(self.segments):
            if s.end.distance(self.segments[(i+1)%len(self.segments)].start)>1e-7:
                raise ValueError('Contour is not closed')

    @classmethod
    def polygon(cls, points):
        points = tuple(p if isinstance(p,Point) else Point(*p) for p in points)
        if len(points)<3:
            raise ValueError('Polygon requires three points')
        return cls(tuple(Segment(p,points[(i+1)%len(points)]) for i,p in enumerate(points)))

    def perimeter(self, tolerance=.01):
        return sum(s.length(tolerance/len(self.segments)) for s in self.segments)

    def mapped(self, fn):
        return Contour(tuple(s.mapped(fn) for s in self.segments))

    def translated(self, x, y):
        x,y = number(x),number(y)
        return self.mapped(lambda p:Point(p.x+x,p.y+y))

    def scaled(self, sx, sy=None, origin=Point(0,0)):
        sx,sy = number(sx),number(sx if sy is None else sy)
        if sx==0 or sy==0:
            raise ValueError('Scale cannot be zero')
        return self.mapped(lambda p:Point(origin.x+(p.x-origin.x)*sx,origin.y+(p.y-origin.y)*sy))

    def rotated(self, degrees, origin=Point(0,0)):
        angle=math.radians(number(degrees)); c,s=math.cos(angle),math.sin(angle)
        return self.mapped(lambda p:Point(origin.x+(p.x-origin.x)*c-(p.y-origin.y)*s,origin.y+(p.x-origin.x)*s+(p.y-origin.y)*c))

    def reflected(self, axis='x', offset=0):
        offset=number(offset)
        if axis not in ('x','y'):
            raise ValueError('Axis must be x or y')
        return self.mapped(lambda p:Point(p.x,2*offset-p.y) if axis=='x' else Point(2*offset-p.x,p.y))

    def insert_point(self, segment_index, t=.5):
        segments=list(self.segments); segments[segment_index:segment_index+1]=segments[segment_index].split(t)
        return Contour(segments)

    def move_point(self, index, point):
        index %= len(self.segments)
        old=self.segments[index].start; dx,dy=point.x-old.x,point.y-old.y
        segments=list(self.segments)
        prev=(index-1)%len(segments)
        s=segments[prev]; segments[prev]=replace(s,end=point,c2=Point(s.c2.x+dx,s.c2.y+dy) if s.c2 else None)
        s=segments[index]; segments[index]=replace(s,start=point,c1=Point(s.c1.x+dx,s.c1.y+dy) if s.c1 else None)
        return Contour(segments)

    def delete_point(self, index):
        # Explicitly replace both adjacent segments by a straight chord.
        if len(self.segments)<=3:
            raise ValueError('Cannot reduce contour below three anchors')
        segments=list(self.segments); index %= len(segments); prev=(index-1)%len(segments)
        segments[prev]=Segment(segments[prev].start,segments[index].end)
        del segments[index]
        return Contour(segments)

    def smooth_point(self, index, handle_mm):
        h=number(handle_mm)
        if h<=0:
            raise ValueError('Handle length must be positive')
        segments=list(self.segments); index %= len(segments); prev=(index-1)%len(segments)
        a,b=segments[prev],segments[index]; p=b.start
        dx,dy=b.end.x-a.start.x,b.end.y-a.start.y; d=math.hypot(dx,dy)
        if d<1e-9:
            raise ValueError('Tangent is undefined')
        segments[prev]=Segment(a.start,p,a.c1 or a.start.mix(p,1/3),Point(p.x-h*dx/d,p.y-h*dy/d))
        segments[index]=Segment(p,b.end,Point(p.x+h*dx/d,p.y+h*dy/d),b.c2 or p.mix(b.end,2/3))
        return Contour(segments)

    def clo_points(self, tolerance=.1):
        points=[]
        for s in self.segments:
            points.extend(s.flatten(tolerance)[:-1])
        validate_polygon(points)
        return [(p.x,p.y,0) for p in points]


def validate_polygon(points):
    if len(points)>4096 or len(points)<3:
        raise ValueError('Contour vertex limit: 3..4096')
    def cross(a,b,c): return (b.x-a.x)*(c.y-a.y)-(b.y-a.y)*(c.x-a.x)
    n=len(points)
    if abs(sum(points[i].x*points[(i+1)%n].y-points[(i+1)%n].x*points[i].y for i in range(n)))<1e-6:
        raise ValueError('Degenerate contour')
    for i,a in enumerate(points):
        b=points[(i+1)%n]
        if a.distance(b)<1e-7: raise ValueError('Duplicate adjacent points')
        for j in range(i+1,n):
            if j==i+1 or (i==0 and j==n-1): continue
            c,d=points[j],points[(j+1)%n]
            if max(a.x,b.x)<min(c.x,d.x) or max(c.x,d.x)<min(a.x,b.x) or max(a.y,b.y)<min(c.y,d.y) or max(c.y,d.y)<min(a.y,b.y): continue
            if cross(a,b,c)*cross(a,b,d)<=0 and cross(c,d,a)*cross(c,d,b)<=0:
                raise ValueError('Self-intersecting contour')


def simplify_closed(points, tolerance=.08):
    """Corner/extrema preserving RDP for export only; closed topology is revalidated."""
    tolerance=number(tolerance)
    if tolerance<=0:raise ValueError('Tolerance must be positive')
    pts=[Point(p[0],p[1]) for p in points];validate_polygon(pts);n=len(pts)
    keep={0,n//2}
    for axis in ('x','y'):
        keep.add(min(range(n),key=lambda i:getattr(pts[i],axis)))
        keep.add(max(range(n),key=lambda i:getattr(pts[i],axis)))
    for i,p in enumerate(pts):
        a,b=pts[i-1],pts[(i+1)%n];u=(p.x-a.x,p.y-a.y);v=(b.x-p.x,b.y-p.y)
        cosine=sum(x*y for x,y in zip(u,v))/math.hypot(*u)/math.hypot(*v)
        if cosine<math.cos(math.radians(12)):keep.add(i)
    def point_distance(p,a,b):
        dx,dy=b.x-a.x,b.y-a.y;d=dx*dx+dy*dy
        t=max(0,min(1,((p.x-a.x)*dx+(p.y-a.y)*dy)/d)) if d else 0
        return p.distance(a.mix(b,t))
    fixed=sorted(keep);stack=[]
    for k,a in enumerate(fixed):
        b=fixed[(k+1)%len(fixed)];stack.append((a,b if b>a else b+n))
    while stack:
        a,b=stack.pop()
        if b-a<2:continue
        d,i=max((point_distance(pts[j%n],pts[a%n],pts[b%n]),j) for j in range(a+1,b))
        if d>tolerance:keep.add(i%n);stack.extend([(a,i),(i,b)])
    result=[pts[i] for i in sorted(keep)]
    try:validate_polygon(result)
    except ValueError:return [(p.x,p.y,0) for p in pts]
    return [(p.x,p.y,0) for p in result]
