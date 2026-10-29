"""Stable sewing references and seam-specific tolerance policies on stitch lines."""
import math
from garment_engine import deserialize,assembly_components

TOLERANCES={'rib':.2,'bartack':.3,'waistband':.5,'pocket':.75,'short':.5,'long':1.0}


def audit(garment):
    pieces=garment['pieces'];contours=[deserialize(p['seam_contour']) for p in pieces]
    links=[];issues=[];seen_ids=set();seen_connections=set()
    for n,r in enumerate(garment['sewing_graph']):
        try:
            if not isinstance(r.get('id'),str) or not r['id'] or r['id'] in seen_ids:raise ValueError('Отсутствует или повторяется ID соединения')
            seen_ids.add(r['id'])
            def key(e):return (e['piece'],tuple(e.get('segments',[])),e.get('internal_line',-1))
            connection=tuple(sorted((key(r['a']),key(r['b']))))
            if connection in seen_connections:raise ValueError('Дублирующее соединение одних и тех же участков')
            seen_connections.add(connection)
            alignment=r.get('alignment',[])
            if not alignment or any(type(t) not in (float,int) or not math.isfinite(t) or not 0<=t<=1 for t in alignment) or alignment!=sorted(set(alignment)) or alignment[0]!=0 or alignment[-1]!=1:raise ValueError('Некорректные контрольные позиции шва')
            ends=[]
            for endpoint in (r['a'],r['b']):
                i=endpoint['piece']
                if type(i) is not int or not 0<=i<len(pieces):raise ValueError('Неверный индекс детали')
                p=pieces[i]
                if 'segments' in endpoint:
                    ids=endpoint['segments']
                    if not ids or len(set(ids))!=len(ids) or any(type(j) is not int or j<0 or j>=len(contours[i].segments) for j in ids):raise ValueError('Неверный участок шва')
                    length=sum(contours[i].segments[j].length(.001/len(ids)) for j in ids)
                    segment_ids=[p['id']+'/s'+str(j) for j in ids]
                    control_points=[m for m in p.get('notches',[]) if m.get('sewing_id')==r['id'] and m['segment'] in ids]
                    required_marks=sum(0<t<1 for t in alignment)
                    # Earlier set-in T-shirt graphs placed a generic midpoint
                    # on the neckband ring join; that join uses endpoints only.
                    if garment.get('method')=='tshirt_setin_engineering_v1' and r.get('name')=='neckband_ring':required_marks=0
                    if len(control_points)<required_marks:raise ValueError('Отсутствует обязательная контрольная метка на детали «'+p['name']+'»')
                else:
                    li=endpoint['internal_line'];line=p['internal_lines'][li]
                    length=sum(math.hypot(b[0]-a[0],b[1]-a[1]) for a,b in zip(line,line[1:]));segment_ids=[p['id']+'/internal/'+str(li)];control_points=[]
                ends.append({'piece_id':p['id'],'name':p['name'],'role':p['role'],'segment_ids':segment_ids,'length_mm':length,'control_points':control_points})
            roles=' '.join(e['role'] for e in ends);kind=r.get('type','стачной')
            policy='rib' if 'растяжение' in kind else 'bartack' if 'internal_line' in r['a'] else 'waistband' if 'belt_' in roles else 'pocket' if any(x in roles for x in ('bag_','facing','pocket')) else 'long' if max(e['length_mm'] for e in ends)>300 else 'short'
            tol=min(float(r.get('tolerance_mm',TOLERANCES[policy])),TOLERANCES[policy]);ease=r.get('ease_mm',0)
            if isinstance(ease,bool) or not isinstance(ease,(int,float)) or not math.isfinite(ease) or not math.isfinite(tol) or tol<0:raise ValueError('Некорректная посадка или допуск')
            if r.get('direction') not in ('same','reverse'):raise ValueError('Не указано направление соединения')
            residual=ends[0]['length_mm']-ends[1]['length_mm']-ease
            passed=abs(residual)<=tol
            links.append({'id':r['id'],'ends':ends,'type':kind,'direction':r['direction'],'ease_mm':ease,
                          'tolerance_mm':tol,'tolerance_policy':policy,'residual_mm':residual,'passed':passed,
                          'material':garment.get('material',{}),'alignment':r.get('alignment',[]),
                          'technology_limits':['Нативное стачивание CLO не выполнено','Проверять линию стачивания, а не внешний срез']})
            if not passed:
                issues.append({'code':'SEAM_MISMATCH','severity':'error','piece':ends[0]['name']+' / '+ends[1]['name'],
                               'piece_ids':[e['piece_id'] for e in ends],'segment_ids':[s for e in ends for s in e['segment_ids']],
                               'section':'сопряжение '+str(n+1),'message':'{:.3f} и {:.3f} мм; заданная посадка {:.3f} мм; невязка {:.3f} мм, допуск {:.3f} мм'.format(ends[0]['length_mm'],ends[1]['length_mm'],ease,residual,tol)})
        except (KeyError,IndexError,TypeError,ValueError) as e:
            issues.append({'code':'ASSEMBLY_REFERENCE','severity':'error','piece':'Комплект','section':'шов '+str(n+1),'message':str(e)})
    components=[]
    try:components=assembly_components(garment)
    except (KeyError,IndexError,TypeError,ValueError) as error:
        issues.append({'code':'ASSEMBLY_COMPONENTS','severity':'error','piece':'Комплект','section':'независимые сборки','message':str(error)})
    return {'valid':not issues,'links':links,'issues':issues,'component_count':len(components),'components':components,'native_sewing_applied':False}
