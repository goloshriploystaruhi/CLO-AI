"""Reproducible reference-style scenarios on a synthetic mannequin, never a user.

Core QA uses only the standard library; optional Pillow is used for diagnostic
drawings. Run with the existing bundled Python, no new runtime dependencies.
"""
import json
import sys
from pathlib import Path
from engineering.pipeline import build
from engineering.report import markdown
from garment_engine import deserialize
from qa_scenarios import fixture
from reference_constructors import PANTS, JACKET, SUIT


def preview(garment, target):
    from PIL import Image, ImageDraw, ImageFont
    pieces = [p for p in garment['pieces'] if p['role'] in
              ('front_left','back_left','front_right','back','sleeve_right','collar_upper',
               'upper_front_right','upper_back','upper_sleeve_right','upper_collar_upper')]
    cols,cellw,cellh = 3,440,470
    rows = (len(pieces)+cols-1)//cols
    img = Image.new('RGB',(cols*cellw,rows*cellh+110),'#fafafa');d = ImageDraw.Draw(img)
    font = ImageFont.truetype('C:/Windows/Fonts/arial.ttf',18)
    small = ImageFont.truetype('C:/Windows/Fonts/arial.ttf',15)
    d.text((22,15),garment['name']+' · условный манекен',(20,20,20),font=font)
    d.text((22,44),'Линия стачивания — синяя; срез — серый; вытачки/разметка — красные.',(65,65,65),font=small)
    d.text((22,68),'Масштаб каждой детали отдельный. Посадка не проверена. SVG экспортируются в миллиметрах.',(65,65,65),font=small)
    for n,p in enumerate(pieces):
        seam = deserialize(p['seam_contour']);cut = deserialize(p['cut_contour'])
        contour = [(x,y) for x,y,_ in cut.clo_points(.2)]
        xs,ys = zip(*contour);left,top=min(xs),min(ys);width,height=max(xs)-left,max(ys)-top
        scale=min((cellw-65)/width,(cellh-90)/height)
        ox=(n%cols)*cellw+35;oy=(n//cols)*cellh+150
        xy=lambda q:(round(ox+(q[0]-left)*scale),round(oy+(q[1]-top)*scale))
        d.text((ox,oy-36),p['name'],(20,20,20),font=font)
        d.line([xy(q) for q in contour+[contour[0]]],fill='#aaaaaa',width=1)
        points=[(x,y) for x,y,_ in seam.clo_points(.2)]
        d.line([xy(q) for q in points+[points[0]]],fill='#135d90',width=2)
        for l in p['internal_lines']:d.line([xy(q) for q in l],fill='#ae4034',width=2)
        for s in seam.segments:
            x,y=xy((s.start.x,s.start.y));d.ellipse((x-2,y-2,x+2,y+2),fill='#135d90')
        d.text((ox,oy+cellh-67),'{} сегм. · {:.0f} × {:.0f} мм'.format(len(seam.segments),max(q[0] for q in points)-min(q[0] for q in points),max(q[1] for q in points)-min(q[1] for q in points)),(65,65,65),font=small)
    img.save(target)


def run(folder='reports/reference-styles'):
    out=Path(folder);out.mkdir(parents=True,exist_ok=True);cases=[]
    for method,change in ((PANTS,dict(hem_flat_mm=250)),(JACKET,dict(length_mm=520)),(SUIT,dict(torso_ease_mm=60))):
        profile,p=fixture(method);initial=build(method,profile,p)
        if not initial.get('qa_report',{}).get('valid'):raise ValueError(initial.get('message','Не пройдена проверка'))
        old=initial['garment'];updated=build(method,profile,dict(old['parameters'],**change),old)
        if not updated.get('qa_report',{}).get('valid'):raise ValueError(updated.get('message','Не пройдена проверка изменения'))
        (out/(method+'.json')).write_text(json.dumps(old,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
        (out/(method+'-edited.json')).write_text(json.dumps(updated['garment'],ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
        (out/(method+'-qa.md')).write_text(markdown(initial['qa_report']),encoding='utf-8')
        preview(old,out/(method+'.png'))
        cases.append(dict(method=method,pieces=len(old['pieces']),pairs=len(old['sewing_graph']),
                          maximum_residual_mm=max(abs(l['residual_mm']) for l in initial['qa_report']['assembly']['links']),
                          edit=change,valid=True,edit_valid=True,native_clo_measured=False,fit_verified=False))
    result=dict(synthetic_measurements=True,live_clo_tested=False,fit_verified=False,sewing_ready=False,cases=cases)
    (out/'summary.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    print(json.dumps(result,ensure_ascii=True))
    return result


if __name__=='__main__':run(sys.argv[1] if len(sys.argv)>1 else 'reports/reference-styles')
