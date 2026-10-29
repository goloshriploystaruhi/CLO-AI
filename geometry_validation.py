"""Geometry checks never establish fit or sewing readiness."""
import math
from pattern_recipes import build
from semantic_patterns import describe

def validate(specs, relations=()):
    errors, reports, contours = [], [], []
    for i, spec in enumerate(specs):
        name=spec.get('semantic',{}).get('name',spec.get('name','Деталь '+str(i+1)))
        def error(section,message): errors.append(dict(piece=name,section=section,message=message))
        try:
            c=build(spec);contours.append(c)
            for n,s in enumerate(c.segments):
                length=s.length()
                minimum=.001 if spec['type']=='garment_piece' else .5
                if not math.isfinite(length) or length<minimum: error('s'+str(n),'Нулевой или слишком короткий сегмент (<{} мм)'.format(minimum))
            points=c.clo_points(.1)
            for n,p in enumerate(points):
                q=points[(n+1)%len(points)]
                if math.hypot(p[0]-q[0],p[1]-q[1])<.001: error('полилиния '+str(n),'Слишком короткий участок экспорта (<0,001 мм)')
            width=max(p[0] for p in points)-min(p[0] for p in points)
            height=max(p[1] for p in points)-min(p[1] for p in points)
            if not any(k in spec for k in ('rotate_deg','scale')) and spec['type'] in ('rectangle','shaped_panel','trapezoid','rounded_trapezoid'):
                expected=spec.get('width_mm',max(spec.get('top_mm',0),spec.get('bottom_mm',0)))
                if abs(width-expected)>.11: error('ширина','Не соответствует заданному размеру')
                if abs(height-spec['height_mm'])>.11: error('высота','Не соответствует заданному размеру')
            data=describe(spec,c)
            if spec['type']=='trouser_panel':
                for k in ('waist','hip','knee','hem'):
                    if k not in [v['id'] for v in data['construction_lines']]: error(k,'Отсутствует обязательная конструктивная линия')
            reports.append(dict(piece=name,perimeter_mm=c.perimeter(),width_mm=width,height_mm=height,semantic=data))
        except Exception as exc:
            error('контур',{'Contour is not closed':'Контур не замкнут','Self-intersecting contour':'Самопересечение контура','Degenerate contour':'Вырожденный контур','Duplicate adjacent points':'Совпадающие соседние точки','Curve subdivision limit exceeded':'Кривая не сходится при разбиении'}.get(str(exc),str(exc)));reports.append(None)
            if len(contours)<=i: contours.append(None)
    for r in relations:
        try:
            if set(r)-{'a','b','ease_mm','tolerance_mm'}: raise ValueError('Неизвестное свойство связи швов')
            a,b=r['a'],r['b']
            for endpoint in (a,b):
                if set(endpoint)!={'piece','segments'} or type(endpoint['piece']) is not int or not 0<=endpoint['piece']<len(contours): raise ValueError('Неверная ссылка на деталь')
                indices=endpoint['segments']
                if not isinstance(indices,list) or not indices or len(set(indices))!=len(indices) or any(type(n) is not int or not 0<=n<len(contours[endpoint['piece']].segments) for n in indices): raise ValueError('Неверная ссылка на сегмент')
            la=sum(contours[a['piece']].segments[n].length() for n in a['segments'])
            lb=sum(contours[b['piece']].segments[n].length() for n in b['segments'])
            ease=float(r.get('ease_mm',0));tol=float(r.get('tolerance_mm',1))
            if not math.isfinite(ease) or not math.isfinite(tol) or not 0<=tol<=10: raise ValueError('Некорректный допуск')
            if abs(la-lb-ease)>tol: errors.append(dict(piece=str(a['piece'])+' / '+str(b['piece']),section='сопрягаемый шов',message='Длины {:.2f} и {:.2f} мм, посадка {:.2f} мм'.format(la,lb,ease)))
        except Exception as exc: errors.append(dict(piece='комплект',section='связь швов',message=str(exc)))
    return dict(valid=not errors,errors=errors,pieces=reports,fit_verified=False,sewing_ready=False)

def require_valid(specs,relations=()):
    report=validate(specs,relations)
    if not report['valid']: raise ValueError('; '.join('{piece} / {section}: {message}'.format(**e) for e in report['errors']))
    return report
