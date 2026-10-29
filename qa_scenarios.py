"""Reproducible synthetic fixtures, never measurements of a user."""
import copy
import json
import random
from pathlib import Path
from engineering.methods import registry
from engineering.pipeline import build
from engineering.report import markdown


def fixture(method):
    values=dict(chest=960,shoulder_width=400,chest_width=340,back_width=380,armhole_depth=240,neck_base=370,biceps=300,hips=1000,back_waist_length=420,waist_hip_length=200,waist=800,head=570,head_height=230,head_length=190,garment_waist_girth=840,seated_depth=310,waist_knee=620)
    profile={'id':'synthetic-qa','measurements':{k:{'value':v,'unit':'mm','status':'verified','source':'synthetic_test'} for k,v in values.items()}}
    meta=registry()[method];cat=meta['category']
    if method=='tshirt_setin_engineering_v1':
        p=dict(length_mm=700,chest_ease_mm=100,hem_circumference_mm=1060,sleeve_length_mm=240,cuff_circumference_mm=340,neck_width_mm=190,front_neck_depth_mm=110,back_neck_depth_mm=30,shoulder_drop_mm=30,biceps_ease_mm=70,armhole_ease_mm=10,rib_stretch_percent=60,rib_recovery_percent=95,rib_application_extension_percent=15,body_stretch_percent=40)
    elif cat in ('trousers','jeans','shorts','underwear','jumpsuit'):
        p=dict(length_mm=1050,waist_drop_mm=20,hip_ease_mm=160,waist_ease_mm=20,knee_flat_mm=280,hem_flat_mm=240)
        if cat in ('shorts','underwear'):p['length_mm']=450;p.pop('knee_flat_mm')
        if cat=='jumpsuit':p.update(torso_length_mm=470,chest_ease_mm=160,sleeve_length_mm=500,cuff_circumference_mm=300)
    elif cat=='skirt':p=dict(length_mm=650,waist_ease_mm=20,hem_circumference_mm=1700)
    elif cat=='headwear':p=dict(height_mm=210,head_ease_mm=10)
    else:
        p=dict(length_mm=700,chest_ease_mm=160,hem_circumference_mm=1160,sleeve_length_mm=500,cuff_circumference_mm=300)
        if cat=='top':p.pop('sleeve_length_mm');p.pop('cuff_circumference_mm')
        if cat in ('coat','dress'):p.update(length_mm=1100,hem_circumference_mm=1500)
    if method=='balloon_tapered_v1':p.update(length_mm=1010,hip_ease_mm=320,knee_flat_mm=360,hem_flat_mm=290)
    if method=='workwear_zip_jacket_v1':p.update(length_mm=600,sleeve_length_mm=600)
    if method=='women_baggy_boilersuit_v1':
        p.pop('torso_length_mm',None);p.update(waist_drop_mm=0,hip_ease_mm=160,knee_flat_mm=270,hem_flat_mm=230,sleeve_length_mm=580)
        for k,v in dict(front_waist_length=440,bust_height=260,bust_spacing=180).items():profile['measurements'][k]={'value':v,'unit':'mm','status':'verified','source':'synthetic_test'}
    return profile,p


def property_cases(count=6):
    rng=random.Random(20261024)
    for i in range(count):
        for key in ('tshirt_setin_engineering_v1','wide_trousers_experimental_v1'):
            profile,p=fixture(key)
            if key.startswith('tshirt'):
                # Correlated body widths, not independent random numbers that
                # contradict each other. This is the tested adult subset.
                change=rng.uniform(-30,50)
                for m,factor in (('chest',1),('shoulder_width',.25),('chest_width',.25),('back_width',.25),('biceps',.15),('armhole_depth',.15)):
                    profile['measurements'][m]['value']+=change*factor
                p['cuff_circumference_mm']=profile['measurements']['biceps']['value']+40
                p['sleeve_length_mm']=260
                easekey='chest_ease_mm';eases=(90,120)
            else:
                for m,lo,hi in (('garment_waist_girth',790,900),('hips',970,1100),('waist_hip_length',190,220),('seated_depth',290,335),('waist_knee',580,640)):
                    profile['measurements'][m]['value']=rng.uniform(lo,hi)
                p['length_mm']=rng.uniform(1000,1120);easekey='hip_ease_mm';eases=(140,190)
            for ease in eases:
                yield key,copy.deepcopy(profile),dict(p,**{easekey:ease})


def metrics(g):
    from garment_engine import deserialize
    return {p['role']:{'perimeter_mm':deserialize(p['seam_contour']).perimeter(.001),
                       'landmarks':p['landmarks'],'segment_lengths_mm':[s.length() for s in deserialize(p['seam_contour']).segments]}
            for p in g['pieces']}


def run(folder):
    folder=Path(folder);folder.mkdir(parents=True,exist_ok=True);results=[]
    for key in registry():
        p,g=fixture(key)
        try:
            r=build(key,p,g);report=r['qa_report']
            (folder/(key+'.json')).write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf-8')
            (folder/(key+'.md')).write_text(markdown(report),encoding='utf-8')
            results.append({'method':key,'valid':report['valid'],'issues':report['issues'],'parts':len(report.get('parts',[]))})
        except Exception as e:results.append({'method':key,'valid':False,'error':str(e)})
    props=[]
    for key,p,g in property_cases():
        try:
            r=build(key,p,g);props.append({'method':key,'parameters':g,'measurements':p['measurements'],'valid':r.get('qa_report',{}).get('valid',False),'error':r.get('message')})
        except Exception as e:props.append({'method':key,'valid':False,'error':str(e)})
    result={'seed':20261024,'synthetic_fixtures':True,'methods':results,'property_cases':props,
            'fit_verified':False,'professional_standard_verified':False}
    (folder/'matrix.json').write_text(json.dumps(result,ensure_ascii=False,indent=2),encoding='utf-8')
    print(json.dumps({'methods':len(results),'passed':sum(r['valid'] for r in results),'property_cases':len(props),'property_passed':sum(r['valid'] for r in props),'failures':[r for r in results+props if not r['valid']]},ensure_ascii=True))
    return result


if __name__=='__main__':
    import sys
    run(sys.argv[1] if len(sys.argv)>1 else 'reports/stage5-qa')
