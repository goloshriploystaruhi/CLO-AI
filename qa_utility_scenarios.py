"""Reproduce three synthetic utility kits; model plots are not CLO screenshots."""
import copy
import json
import textwrap
from pathlib import Path
from qa_scenarios import fixture
from engineering.pipeline import build
from garment_engine import deserialize

CASES=[('trousers_utility_v1','wide_trousers_experimental_v1'),
       ('jacket_utility_v1','jacket_stand_v1'),('jumpsuit_utility_v1','jumpsuit_work_v1')]


def overview(garment,path):
    from PIL import Image,ImageDraw,ImageFont
    font=ImageFont.truetype('C:/Windows/Fonts/arial.ttf',16)
    small=ImageFont.truetype('C:/Windows/Fonts/arial.ttf',13)
    scale=.55;items=[];x=y=0;row=0
    for piece in garment['pieces']:
        cut=deserialize(piece['cut_contour']).clo_points(.1)
        xs=[p[0] for p in cut];ys=[p[1] for p in cut]
        width=max(xs)-min(xs);height=max(ys)-min(ys);cell=max(width+65,400)
        if x+cell>2900:x=0;y+=row+90;row=0
        items.append((piece,x,y,min(xs),min(ys),width,height))
        x+=cell;row=max(row,height+95)
    image=Image.new('RGB',(1640,int((y+row+90)*scale)+100),'white');draw=ImageDraw.Draw(image)
    draw.text((20,12),garment['name']+' · '+str(len(garment['pieces']))+' деталей · расчётная схема, не снимок CLO',font=font,fill='#161616')
    draw.text((20,40),'Чёрный: стачивание. Серый: раскрой. Синий: внутренние линии. Зелёный: долевая модели; назначить в CLO вручную.',font=small,fill='#444444')
    for piece,x,y,left,top,width,height in items:
        ox=20+x*scale;oy=90+y*scale
        for n,line in enumerate(textwrap.wrap(piece['name'],width=27)):
            draw.text((ox,oy+n*17),line,font=small,fill='#161616')
        draw.text((ox,oy+36),'{:.1f} × {:.1f} мм по раскрою'.format(width,height),font=small,fill='#555555')
        def xy(point):return (ox+(point[0]-left)*scale,oy+68+(point[1]-top)*scale)
        for key,color,stroke in [('cut_contour','#b6b6b6',1),('seam_contour','#171717',2)]:
            points=[xy((a,b)) for a,b,_ in deserialize(piece[key]).clo_points(.1)]
            draw.line(points+[points[0]],fill=color,width=stroke)
        for line in piece['internal_lines']:draw.line([xy(p) for p in line],fill='#2875ba',width=2)
        draw.line([xy(p) for p in piece['grainline']],fill='#418450',width=1)
    image.save(path)


def run():
    from test_sewing_map import NativeLinesCLO
    from test_clo_updates import PropertiesCLO
    from clo_operations import dispatch,fingerprint
    from sewing_map import resolve_map
    class MockCLO(NativeLinesCLO,PropertiesCLO):pass
    folder=Path('reports/three-categories');folder.mkdir(exist_ok=True,parents=True)
    research=Path('research/utility-kits');research.mkdir(exist_ok=True,parents=True)
    report={'environment':'synthetic_profile_and_mock_CLO_API','native_clo_verified':False,
            'fit_verified':False,'sewing_ready':False,'native_sewing_created':0,'cases':[]}
    for key,base in CASES:
        profile,parameters=fixture(base);job=build(key,profile,parameters)
        assert job['qa_report']['valid'],job.get('message')
        api=MockCLO();api.CreatePatternWithPoints([(0,0,0),(100,0,0),(100,100,0),(0,100,0)])
        other=fingerprint(api,0);result=dispatch(copy.deepcopy(job),api,api)
        targets=[dict(id=p['id'],pattern_id=r['clo_pattern_id'],fingerprint=r['fingerprint']) for p,r in zip(job['garment']['pieces'],result['patterns'])]
        sewing=resolve_map(job['garment'],targets,api)
        assert sewing['verified_count']==sewing['seam_count']
        old=job['garment'];changed=build(key,profile,dict(old['parameters'],utility_pocket_depth_mm=40),old)
        def update(new,previous,native):
            new.update(previous_pieces=previous['garment']['pieces'],confirmed_replacement=True,
                       replace_targets=[dict(pattern_id=r['clo_pattern_id'],fingerprint=r['fingerprint']) for r in native['patterns']])
            return dispatch(new,api,api)
        revised=update(changed,job,result)
        restored=build(key,profile,old['parameters'],changed['garment']);undo=update(restored,changed,revised)
        assert fingerprint(api,0)==other
        assert revised['update_summary']['replaced']==undo['update_summary']['replaced']==2
        row=dict(method=key,piece_count=len(old['pieces']),seam_count=sewing['seam_count'],mapped=sewing['verified_count'],
                 model_qa_passed=True,mock_api_create_passed=True,mock_api_update=revised['update_summary'],
                 mock_api_undo=undo['update_summary'],unrelated_piece_preserved=True,
                 native_clo_verified=False,fit_verified=False,parameters=old['parameters'])
        report['cases'].append(row)
        (research/(key+'.json')).write_text(json.dumps(old,ensure_ascii=False,indent=2),encoding='utf-8')
        overview(old,folder/(key+'.png'))
    (folder/'verification.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    print(json.dumps([dict(method=r['method'],parts=r['piece_count'],mapped=r['mapped'],replaced=r['mock_api_update']['replaced']) for r in report['cases']]))


if __name__=='__main__':run()
