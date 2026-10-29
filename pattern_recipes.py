"""Deterministic recipes; AI may select parameters, never generate coordinates."""
import math
from contour_engine import Contour, Point, Segment, number
from pattern_engine import rectangle


def build(spec):
    kind=spec['type']
    if kind=='trouser_panel':
        from parametric_patterns import TrouserParameters, TrouserPanel
        if 'scale' in spec: raise ValueError('Change construction parameters instead of scaling a trouser panel')
        result=TrouserPanel(TrouserParameters(**spec['parameters'])).contour()
    elif kind in ('contour','garment_piece'):
        # Explicit CAD data from code/import; never exposed to AI coordinate generation.
        segments=[]
        for s in spec['segments']:
            segments.append(Segment(Point(*s['start']),Point(*s['end']),Point(*s['c1']) if 'c1' in s else None,Point(*s['c2']) if 'c2' in s else None))
        result=Contour(tuple(segments))
    elif kind=='rectangle':
        result=Contour.polygon([(x,y) for x,y,_ in rectangle(spec['width_mm'],spec['height_mm'])])
    elif kind in ('trapezoid','rounded_trapezoid'):
        top,bottom,height=[number(spec[k]) for k in ('top_mm','bottom_mm','height_mm')]
        if not all(1<=v<=10000 for v in (top,bottom,height)): raise ValueError('Dimensions must be 1..10000 mm')
        offset=number(spec.get('offset_mm',(bottom-top)/2))
        result=Contour.polygon([(0,0),(bottom,0),(offset+top,height),(offset,height)])
        if kind=='rounded_trapezoid':
            depth=number(spec.get('top_round_mm',min(20,height*.05,top*.1)))
            if not 0<depth<height/2: raise ValueError('Закругление верха должно быть меньше половины высоты')
            a,b=Point(offset+top,height),Point(offset,height)
            result=Contour((result.segments[0],result.segments[1],Segment(a,b,Point(a.x-top/3,height-depth*4/3),Point(b.x+top/3,height-depth*4/3)),result.segments[3]))
    elif kind=='shaped_panel':
        w,h=number(spec['width_mm']),number(spec['height_mm'])
        if not 1<=w<=10000 or not 1<=h<=10000: raise ValueError('Размеры должны быть 1..10000 мм')
        a,b,c,d=Point(0,0),Point(w,0),Point(w,h),Point(0,h)
        result=Contour((Segment(a,b),Segment(b,c,Point(w*.94,h/3),Point(w*.94,2*h/3)),Segment(c,d),Segment(d,a,Point(w*.12,2*h/3),Point(w*.12,h/3))))
    elif kind=='circle':
        radius=number(spec['diameter_mm'])/2
        if not .5<=radius<=5000: raise ValueError('Diameter must be 1..10000 mm')
        k=4*(math.sqrt(2)-1)/3
        p=[Point(radius,0),Point(0,radius),Point(-radius,0),Point(0,-radius)]
        controls=[(Point(radius,k*radius),Point(k*radius,radius)),(Point(-k*radius,radius),Point(-radius,k*radius)),(Point(-radius,-k*radius),Point(-k*radius,-radius)),(Point(k*radius,-radius),Point(radius,-k*radius))]
        result=Contour(tuple(Segment(p[i],p[(i+1)%4],*controls[i]) for i in range(4)))
    else: raise ValueError('Unknown parametric recipe: '+str(kind))
    if 'rotate_deg' in spec: result=result.rotated(spec['rotate_deg'])
    if 'reflect_axis' in spec: result=result.reflected(spec['reflect_axis'])
    if 'scale' in spec: result=result.scaled(spec['scale'])
    return result
