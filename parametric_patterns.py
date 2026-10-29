"""Experimental single trouser panel, not a certified drafting method. Units: mm."""
from dataclasses import dataclass, replace, asdict
from contour_engine import Point, Segment, Contour, number


@dataclass(frozen=True)
class TrouserParameters:
    length_mm: float
    hip_width_mm: float
    knee_width_mm: float
    hem_width_mm: float
    rise_mm: float
    knee_y_mm: float
    hip_y_mm: float
    waist_width_mm: float
    crotch_extension_mm: float
    waist_y_mm: float = 0
    hip_ease_mm: float = 0
    knee_ease_mm: float = 0
    hem_ease_mm: float = 0
    waist_ease_mm: float = 0
    side_shape: float = 1
    inseam_shape: float = 1
    crotch_shape: float = .55

    def __post_init__(self):
        for key,value in asdict(self).items():
            number(value)
        if not 0 < self.hip_y_mm < self.rise_mm < self.knee_y_mm < self.length_mm <= 3000:
            raise ValueError('Required: 0 < hip level < rise < knee level < length <= 3000 mm')
        if not -200 <= self.waist_y_mm <= 200:
            raise ValueError('Waist position outside -200..200 mm')
        for level in ('hip','knee','hem','waist'):
            width=getattr(self,level+'_width_mm');ease=getattr(self,level+'_ease_mm')
            if not 10 <= width <= 1000 or not 0 <= ease <= 200:
                raise ValueError('Panel widths: 10..1000 mm; panel ease: 0..200 mm')
        if not 1 <= self.crotch_extension_mm < self.hip_width_mm/2:
            raise ValueError('Crotch extension must be positive and less than half hip width')
        if not 0 <= self.side_shape <= 1 or not 0 <= self.inseam_shape <= 1 or not .05 <= self.crotch_shape <= .95:
            raise ValueError('Side/inseam shape: 0..1; crotch shape: .05...95')


def seam(points, shape):
    """Hermite interpolation x(y); shared derivatives give tangent continuity."""
    slopes=[(points[i+1].x-p.x)/(points[i+1].y-p.y) for i,p in enumerate(points[:-1])]
    derivatives=[slopes[0]]
    for i in range(1,len(points)-1):
        a,b=slopes[i-1],slopes[i]
        derivatives.append(0 if a*b<=0 else 2*a*b/(a+b))
    derivatives.append(slopes[-1])
    result=[]
    for i,a in enumerate(points[:-1]):
        b=points[i+1];dy=b.y-a.y
        if shape==0: result.append(Segment(a,b));continue
        result.append(Segment(a,b,Point(a.x+shape*derivatives[i]*dy/3,a.y+dy/3),Point(b.x-shape*derivatives[i+1]*dy/3,b.y-dy/3)))
    return result


def align_curve_end(curve, following):
    """G1 join without moving landmarks or changing the outgoing straight seam."""
    dx,dy=following.end.x-following.start.x,following.end.y-following.start.y
    length=(dx*dx+dy*dy)**.5;handle=curve.end.distance(curve.c2)
    if length<1e-9:raise ValueError('Undefined centre-seam tangent')
    return Segment(curve.start,curve.end,curve.c1,Point(curve.end.x-handle*dx/length,curve.end.y-handle*dy/length))


@dataclass(frozen=True)
class TrouserPanel:
    parameters: TrouserParameters

    def updated(self, **changes):
        return TrouserPanel(replace(self.parameters,**changes))

    def landmarks(self):
        p=self.parameters
        hip=p.hip_width_mm+p.hip_ease_mm
        knee=p.knee_width_mm+p.knee_ease_mm
        hem=p.hem_width_mm+p.hem_ease_mm
        waist=p.waist_width_mm+p.waist_ease_mm
        y=p.waist_y_mm
        return {'waist_inner':Point(-waist/2,y),'waist_side':Point(waist/2,y),
                'hip_inner':Point(-hip/2,y+p.hip_y_mm),'hip_side':Point(hip/2,y+p.hip_y_mm),
                'seat_side':Point(hip/2,y+p.rise_mm),
                'crotch':Point(-hip/2-p.crotch_extension_mm,y+p.rise_mm),
                'knee_inner':Point(-knee/2,y+p.knee_y_mm),'knee_side':Point(knee/2,y+p.knee_y_mm),
                'hem_inner':Point(-hem/2,y+p.length_mm),'hem_side':Point(hem/2,y+p.length_mm)}

    def contour(self):
        p=self.parameters;l=self.landmarks()
        side=seam([l[k] for k in ('waist_side','hip_side','seat_side','knee_side','hem_side')],p.side_shape)
        inside=seam([l[k] for k in ('crotch','knee_inner','hem_inner')],p.inseam_shape)
        reversed_inside=[Segment(s.end,s.start,s.c2,s.c1) for s in reversed(inside)]
        crotch,hip=l['crotch'],l['hip_inner']
        curve=Segment(crotch,hip,Point(crotch.x+(hip.x-crotch.x)*p.crotch_shape,crotch.y),Point(hip.x,hip.y+(crotch.y-hip.y)*p.crotch_shape))
        centre=Segment(hip,l['waist_inner']);curve=align_curve_end(curve,centre)
        return Contour(tuple([Segment(l['waist_inner'],l['waist_side'])]+side+
            [Segment(l['hem_side'],l['hem_inner'])]+reversed_inside+[curve,centre]))

    def to_recipe(self):
        return {'type':'trouser_panel','parameters':asdict(self.parameters)}
