"""Deterministic CLO AI measurement diagrams. Pillow only; no downloaded images.

Coordinates describe schematic landmarks, never personal body measurements.
Run with the bundled Python from the repository root. Outputs GIF + final PNG
and a browser/Node manifest for every built-in profile measurement.
"""
from pathlib import Path
import json, math, subprocess
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'app/assets/measurements'
QA = ROOT / 'research'
W, H, SCALE = 264, 300, 2
BG = '#000000'; INK = '#888888'; SOFT = '#383838'; FILL = '#111111'
ACCENT = '#e08e62'; WHITE = '#e5e5e5'; DIM = '#765640'

def line(points): return [tuple(p) for p in points]
def curve(*commands):
    pts=[]; current=(0,0)
    for c in commands:
        if c[0]=='M': current=c[1:];pts.append(current)
        elif c[0]=='L': current=c[1:];pts.append(current)
        elif c[0]=='C':
            a=current;b=c[1:3];d=c[3:5];e=c[5:7]
            for i in range(1,25):
                t=i/24;v=1-t
                pts.append((v**3*a[0]+3*v*v*t*b[0]+3*v*t*t*d[0]+t**3*e[0],v**3*a[1]+3*v*v*t*b[1]+3*v*t*t*d[1]+t**3*e[1]))
            current=e
    return pts
def ellipse(cx,cy,rx,ry,tilt=0):
    return [(cx+rx*math.cos(a),cy+ry*math.sin(a)+tilt*math.cos(a)) for a in [2*math.pi*i/100 for i in range(101)]]
def polygon(*pts): return list(pts)

def figure(view):
    """(closed filled shapes, anatomical lines), in common 264×300 space."""
    if view in ('front','back'):
        shapes=[ellipse(132,31,14,19),
          curve(('M',124,49),('L',124,58),('C',116,61,104,62,99,69),('C',96,84,101,110,108,136),('C',108,146,99,155,98,169),('C',98,181,111,188,122,191),('L',132,185),('L',142,191),('C',153,188,166,181,166,169),('C',165,155,156,146,156,136),('C',163,110,168,84,165,69),('C',160,62,148,61,140,58),('L',140,49)),
          curve(('M',99,69),('C',91,78,88,103,85,125),('L',77,162),('C',75,172,83,177,88,168),('L',99,132),('L',106,102)),
          curve(('M',165,69),('C',173,78,176,103,179,125),('L',187,162),('C',189,172,181,177,176,168),('L',165,132),('L',158,102)),
          curve(('M',100,173),('L',121,188),('L',128,222),('L',123,275),('L',111,280),('L',101,280),('L',107,271),('L',106,225),('L',99,191)),
          curve(('M',164,173),('L',143,188),('L',136,222),('L',141,275),('L',153,280),('L',163,280),('L',157,271),('L',158,225),('L',165,191))]
        details=[line([(108,143),(156,143)]),line([(106,225),(123,225)]),line([(141,225),(158,225)])]
        if view=='front': details += [curve(('M',108,98),('C',114,102,121,102,126,97)),curve(('M',138,97),('C',143,102,150,102,156,98)),ellipse(117,98,1,1),ellipse(147,98,1,1)]
        else: details += [line([(132,59),(132,134)]),curve(('M',109,82),('C',115,79,122,86,123,97)),curve(('M',155,82),('C',149,79,142,86,141,97))]
        return shapes,details
    if view=='side':
        shapes=[curve(('M',124,14),('C',142,11,145,28,143,34),('L',151,39),('L',142,43),('C',144,50,138,54,133,53),('L',132,62),('L',119,64),('L',119,52),('C',108,44,109,21,124,14)),
          curve(('M',120,63),('C',107,73,105,93,108,112),('L',110,139),('C',102,149,101,168,108,178),('C',115,187,129,187,139,176),('C',146,165,149,151,146,137),('C',143,125,140,116,143,111),('C',152,109,152,101,146,96),('C',143,82,137,70,132,62)),
          curve(('M',115,174),('L',136,179),('L',137,221),('L',133,275),('L',151,280),('L',154,285),('L',123,285),('L',119,273),('L',119,223)),
          curve(('M',120,71),('C',128,73,129,99,126,123),('L',137,158),('C',138,167,131,170,128,163),('L',114,126),('L',112,90))]
        return shapes,[line([(110,143),(147,143)]),line([(119,224),(137,224)])]
    if view in ('arm','bent_arm'):
        bent=view=='bent_arm'
        wrist=(206,155) if bent else (184,240)
        shapes=[curve(('M',71,33),('C',94,34,112,46,117,65),('L',136,148),('L',wrist[0]+8,wrist[1]-7),('C',wrist[0]+17,wrist[1]-2,wrist[0]+19,wrist[1]+9,wrist[0]+9,wrist[1]+12),('L',wrist[0]-5,wrist[1]+9),('L',116,163),('C',109,158,105,151,104,142),('L',86,78),('C',77,73,68,64,64,50))]
        details=[line([(62,31),(83,24),(94,37)]),line([(110,151),(129,148)]),line([(wrist[0]-7,wrist[1]+2),(wrist[0]+9,wrist[1]-5)])]
        return shapes,details
    if view=='hand':
        shapes=[curve(('M',90,276),('L',91,224),('C',78,213,66,199,61,184),('C',57,175,67,170,73,176),('L',93,196),('L',89,105),('C',88,94,99,90,102,102),('L',107,83),('C',108,69,118,65,123,72),('L',128,62),('C',129,49,141,50,143,64),('L',148,79),('C',151,70,161,73,162,85),('L',165,180),('C',169,205,163,219,153,231),('L',155,276))]
        return shapes,[line([(93,227),(152,229)]),curve(('M',96,180),('C',115,186,139,186,162,181)),line([(109,91),(112,157)]),line([(127,83),(130,157)]),line([(145,94),(147,158)])]
    if view=='foot':
        shapes=[curve(('M',106,274),('C',92,266,93,238,97,208),('C',103,174,96,161,90,135),('C',87,118,91,84,104,69),('C',108,52,116,37,126,30),('C',137,20,147,31,145,45),('C',158,34,167,44,161,58),('C',176,50,181,62,171,76),('C',185,72,187,83,177,96),('C',190,95,190,109,180,123),('C',169,144,161,163,156,183),('C',150,207,151,243,142,262),('C',135,280,117,282,106,274))]
        return shapes,[curve(('M',98,120),('C',125,139,157,137,179,116))]
    if view=='foot_side':
        shapes=[curve(('M',88,45),('L',115,45),('L',117,143),('C',124,166,149,177,171,179),('C',188,181,214,197,222,211),('L',221,223),('L',53,223),('C',49,215,51,196,62,182),('C',70,168,73,147,75,128),('L',78,45))]
        return shapes,[line([(44,225),(230,225)]),curve(('M',80,164),('C',90,174,98,179,113,185))]
    if view in ('head_front','head_back'):
        shapes=[ellipse(132,127,65,88),curve(('M',103,202),('L',102,242),('L',62,267),('L',202,267),('L',162,242),('L',161,202))]
        details=[line([(111,243),(153,243)])]
        if view=='head_front': details += [curve(('M',91,122),('C',104,116,116,118,121,122)),curve(('M',143,122),('C',150,118,162,116,174,122)),line([(133,132),(127,153),(137,153)]),curve(('M',113,176),('C',123,181,142,181,151,176))]
        else: details += [line([(132,218),(132,254)])]
        return shapes,details
    if view=='head_side':
        shapes=[curve(('M',109,45),('C',162,29,188,63,182,108),('L',198,132),('L',181,141),('C',188,165,175,185,153,189),('L',156,237),('L',206,265),('L',61,265),('L',112,238),('L',111,192),('C',57,172,53,105,76,68),('C',84,55,97,48,109,45))]
        return shapes,[ellipse(140,133,9,16),line([(112,237),(155,237)])]
    if view=='seated':
        shapes=[ellipse(116,43,14,20),curve(('M',108,61),('L',108,75),('C',99,79,96,100,98,119),('L',100,159),('C',105,169,139,169,165,167),('L',174,224),('L',204,234),('L',203,241),('L',162,240),('L',148,185),('L',100,185),('C',88,181,84,165,87,148),('L',88,98),('C',88,79,96,73,104,72),('L',104,61)),curve(('M',110,82),('C',122,91,127,108,132,122),('L',155,149),('L',149,155),('L',121,135),('L',105,106))]
        return shapes,[line([(101,143),(91,143)]),line([(70,186),(153,186)]),line([(75,188),(75,250)]),line([(150,188),(150,250)]),line([(66,251),(214,251)])]
    return [],[]

def spec(view,region,start,end,direction,points=None,box=None,closed=False,guides=None):
    return dict(view=view,region=region,start_point=start,end_point=end,direction=direction,path=points or [],box=box,closed=closed,guides=guides or [])
S={}
def add(ids,**kwargs):
    for id in ids.split(): S[id]=dict(kwargs)
def st(id,view,region,start,end,direction,points,box=None,closed=False,guides=None):S[id]=spec(view,region,start,end,direction,points,box,closed,guides)
UP=(66,32,198,161); LOW=(71,128,195,287); FULL=(44,7,221,290)
st('height','front','Всё тело','Пол','Макушка','Вертикально',line([(193,280),(193,12)]),FULL,guides=[line([(100,12),(202,12)]),line([(86,280),(202,280)])])
for id,y,rx,ry in [('neck',55,10,3),('neck_base',61,15,4),('upper_chest',83,33,6),('armhole_girth',77,33,6),('chest',91,33,7),('underbust',105,29,6),('waist',138,24,5),('garment_waist_girth',147,29,6),('abdomen',142,26,6),('upper_hips',153,32,6),('hips',164,34,7)]:
    box=(76,40,188,188) if id not in ('neck','neck_base') else (95,35,169,88)
    st(id,'front','Шея' if id.startswith('neck') else 'Корпус','Выбранный уровень','Замкнутая лента','Вокруг тела',ellipse(132,y,rx,ry,2 if id=='neck_base' else 0),box,True)
S['chest']['path']=curve(('M',165,92),('C',161,96,153,98,147,98),('C',137,98,127,98,117,98),('C',108,98,103,96,99,92),('C',103,84,159,84,165,92))
S['chest']['front_fraction']=.75
st('shoulder_width','back','Плечи','Левая плечевая точка','Правая плечевая точка','По прямой поперёк спины',line([(100,68),(164,68)]),UP)
st('shoulder_length','back','Плечо','Боковое основание шеи','Плечевая точка','По линии плеча',line([(124,58),(100,68)]),(77,42,179,103))
st('shoulder_slope','back','Плечо','Горизонталь у шеи','Линия плеча','Угол относительно горизонтали',line([(124,58),(100,68)]),(77,42,179,103),guides=[line([(124,58),(97,58)]),curve(('M',108,58),('C',108,60,109,62,110,64))])
st('back_width','back','Спина','Задняя подмышечная складка','Противоположная складка','Поперёк лопаток',line([(103,89),(161,89)]),UP)
st('chest_width','front','Перед','Передняя подмышечная складка','Противоположная складка','Поперёк над грудью',line([(103,86),(161,86)]),UP)
st('back_waist_length','back','Спина','Позвонок C7','Естественная талия','Вниз по середине спины',line([(132,59),(132,143)]),UP)
st('front_waist_length','front','Перед','Боковое основание шеи','Талия через выступающую точку груди','По поверхности тела',curve(('M',140,59),('C',147,73,151,86,147,98),('C',148,113,151,130,152,143)),UP)
st('bust_height','front','Перед','Боковое основание шеи','Центр выступающей части груди','По поверхности тела',curve(('M',140,59),('C',147,73,151,86,147,98)),UP)
st('bust_spacing','front','Грудь','Левый центр груди','Правый центр груди','По прямой между точками',line([(117,98),(147,98)]),UP)
st('armhole_depth','back','Спина','Уровень C7','Уровень задних подмышечных складок','Строго вертикально',line([(181,59),(181,88)]),UP,guides=[line([(132,59),(187,59)]),line([(102,88),(187,88)])])
for id,start,y in [('shoulder_height','Плечевая точка',68),('hip_height','Уровень максимального обхвата бёдер',171),('waist_floor','Естественная талия',143),('knee_floor','Центр коленной чашечки',225),('ankle_floor','Наружная косточка щиколотки',269)]:
    st(id,'front','Высота от пола',start,'Пол','Вертикально к полу',line([(193,y),(193,280)]),FULL if y<220 else (84,205,210,288),guides=[line([(154,y),(201,y)]),line([(87,280),(202,280)])])
st('outseam','front','Нога','Естественная талия сбоку','Пол','Вниз по внешней стороне',line([(157,143),(167,171),(165,225),(165,280)]),FULL)
st('inseam','front','Нога','Верхняя точка промежности','Пол','По внутренней стороне одной ноги',line([(132,185),(129,226),(126,280)]),LOW,guides=[line([(94,280),(174,280)])])
st('waist_knee','front','Нога','Естественная талия','Уровень центра колена','Вертикально по боку',line([(181,143),(181,225)]),LOW,guides=[line([(155,143),(187,143)]),line([(142,225),(187,225)])])
st('waist_hip_length','front','Таз','Естественная талия','Уровень максимального обхвата бёдер','Вниз по боку',line([(180,143),(180,171)]),(83,126,193,191),guides=[line([(107,143),(186,143)]),line([(97,171),(186,171)])])
st('seated_depth','seated','Сидя на твёрдом стуле','Естественная талия','Поверхность сиденья','Строго вертикально',line([(65,143),(65,186)]),(50,20,216,256),guides=[line([(62,143),(100,143)]),line([(60,186),(153,186)])])
st('crotch_arc','side','Таз, вид сбоку','Середина талии спереди','Середина талии сзади через промежность','По поверхности тела непрерывной дугой',curve(('M',146,143),('C',148,157,145,178,132,187),('C',119,184,108,167,109,143)),(79,115,169,205))
for id,y,rx,ry in [('thigh',184,11,4),('thigh_level',199,10,4),('knee',222,8,3),('below_knee',231,8,3),('calf',244,9,3),('ankle',266.5,7,2.5)]:
    st(id,'front','Одна нога','Выбранный уровень одной ноги','Замкнутая лента','Вокруг одной ноги',ellipse(114,y,rx,ry),(88,169,169,283),True)
for id,pts in [('arm_length',[(103,62),(123,151),(184,240)]),('neck_wrist_length',[(82,29),(103,62),(123,151),(184,240)]),('upper_arm_length',[(103,62),(123,151)]),('forearm_length',[(123,151),(184,240)]),('bent_arm_length',[(103,62),(123,151),(206,155)])]:
    names={'arm_length':('Плечевая точка','Косточка запястья через локоть'),'neck_wrist_length':('Боковое основание шеи','Запястье через плечо и локоть'),'upper_arm_length':('Плечевая точка','Локоть'),'forearm_length':('Локоть','Косточка запястья'),'bent_arm_length':('Плечевая точка','Запястье через локоть под прямым углом')}
    st(id,'bent_arm' if id=='bent_arm_length' else 'arm','Рука',*names[id],'По наружной стороне руки',line(pts),(54,17,232,263))
for id,cx,cy,rx,ry,tilt in [('biceps',110,105,11,4,-2),('elbow',122,151,12,4,-3),('forearm',151,196,11,4,-7),('wrist',182,239,9,3,-6)]:
    st(id,'arm','Одна рука','Выбранный уровень','Замкнутая лента','Вокруг руки без сдавливания',ellipse(cx,cy,rx,ry,tilt),(70,52,208,256),True)
st('hand','hand','Кисть','Костяшки четырёх пальцев','Замкнутая лента без большого пальца','Вокруг кисти',ellipse(127,173,36,8),(47,44,184,283),True)
st('palm_width','hand','Ладонь','Край у костяшек мизинца','Край у костяшек указательного пальца','Прямо поперёк, без большого пальца',line([(92,181),(164,181)]),(47,44,184,283))
st('hand_length','hand','Ладонь','Складка у основания ладони','Кончик среднего пальца','По ладони',line([(125,228),(136,54)]),(47,44,184,283))
st('foot_length','foot','Нагруженная стопа','Самая выступающая точка пятки','Самый длинный палец','Прямая на полу',line([(75,278),(75,26)]),(58,11,201,289),guides=[line([(73,278),(124,278)]),line([(73,26),(138,26)])])
st('foot_width','foot','Нагруженная стопа','Край у оснований пальцев','Противоположный край','Поперёк в самом широком месте',line([(91,121),(181,121)]),(58,11,201,289))
st('instep','foot_side','Нагруженная стопа','Верхняя точка подъёма','Подошва и обратно к подъёму','Замкнутая поперечная лента',ellipse(130,196,9,27),(38,87,233,236),True)
st('head','head_side','Голова','Лоб над бровями','Затылок на том же уровне','Вокруг головы',ellipse(129,100,54,12),(46,30,212,213),True)
st('head_height','head_front','Голова','Уровень обхвата головы','Макушка','Строго вертикально',line([(213,116),(213,39)]),(51,28,224,230),guides=[line([(72,116),(220,116)]),line([(130,39),(220,39)])])
st('head_width','head_front','Голова','Левый край головы без ушей','Правый край головы без ушей','Прямое расстояние между планками',line([(67,25),(197,25)]),(49,12,215,228),guides=[line([(67,22),(67,155)]),line([(197,22),(197,155)])])
st('head_length','head_side','Голова сбоку','Лоб','Выступающая часть затылка','Прямая между планками',line([(66,25),(184,25)]),(46,12,212,214),guides=[line([(66,22),(66,139)]),line([(184,22),(184,110)])])
st('crown_neck','head_side','Затылок','Макушка','Позвонок C7 у основания шеи','По поверхности затылка',curve(('M',125,42),('C',78,40,58,88,65,134),('C',67,174,106,195,112,237)),(46,27,210,255))
for id,view in [('weight','scale'),('age','calendar'),('waist_level','clarify_waist'),('seat_length','clarify_seat'),('fallback','clarify')]:
    S[id]=spec(view,'Справочные данные' if id in ('weight','age') else 'Уточнение определения','Не используется','Не используется','Без сантиметровой ленты')

VIEW_NAMES={'front':'Спереди','back':'Со спины','side':'Сбоку','arm':'Рука слегка согнута','bent_arm':'Сгиб около 90°','hand':'Пальцы вместе','foot':'Стопа на полу','foot_side':'Стопа сбоку','head_front':'Голова спереди','head_back':'Голова сзади','head_side':'Голова сбоку','seated':'Сидя','scale':'Весы','calendar':'Полные годы','clarify':'Уточните ориентиры','clarify_waist':'Уточните уровень','clarify_seat':'Уточните определение'}

def transform(box):
    if not box: return lambda p:p
    x0,y0,x1,y1=box;scale=min(220/(x1-x0),264/(y1-y0));cx=(x0+x1)/2;cy=(y0+y1)/2
    return lambda p:((p[0]-cx)*scale+W/2,(p[1]-cy)*scale+H/2)
def raster(spec,progress):
    im=Image.new('RGB',(W*SCALE,H*SCALE),BG);d=ImageDraw.Draw(im);tr=transform(spec['box'])
    def xy(p):q=tr(p);return (q[0]*SCALE,q[1]*SCALE)
    def poly(points,color=INK,width=1,fill=None):
        if len(points)<2:return
        pp=[xy(p) for p in points]
        if fill:d.polygon(pp,fill=fill)
        d.line(pp,fill=color,width=max(1,round(width*SCALE)),joint='curve')
    def dot(p,r=2,color=WHITE):
        x,y=xy(p);d.ellipse((x-r*SCALE,y-r*SCALE,x+r*SCALE,y+r*SCALE),fill=color)
    view=spec['view']
    if view in ('scale','calendar') or view.startswith('clarify'):
        tr=lambda p:p
        if view=='scale':
            d.rounded_rectangle((60*SCALE,98*SCALE,204*SCALE,238*SCALE),radius=10*SCALE,fill=FILL,outline=INK,width=2*SCALE)
            d.rounded_rectangle((95*SCALE,116*SCALE,169*SCALE,155*SCALE),radius=3*SCALE,outline=SOFT,width=SCALE)
            for x in (101,137):d.ellipse((x*SCALE,175*SCALE,(x+26)*SCALE,216*SCALE),outline=INK,width=2*SCALE)
            for i in range(4):
                a=102+i*17;d.line((a*SCALE,136*SCALE,(a+10)*SCALE,136*SCALE),fill=ACCENT if progress>(i+1)/5 else SOFT,width=3*SCALE)
        elif view=='calendar':
            d.rounded_rectangle((57*SCALE,72*SCALE,207*SCALE,230*SCALE),radius=5*SCALE,outline=INK,width=2*SCALE)
            d.line((57*SCALE,111*SCALE,207*SCALE,111*SCALE),fill=INK,width=SCALE)
            for x in (90,174):d.line((x*SCALE,58*SCALE,x*SCALE,87*SCALE),fill=WHITE,width=3*SCALE)
            for i in range(3):
                for j in range(4):
                    x=80+j*32;y=135+i*29;d.line((x*SCALE,y*SCALE,(x+9)*SCALE,y*SCALE),fill=SOFT,width=2*SCALE)
            length=86*progress;d.line((88*SCALE,210*SCALE,(88+length)*SCALE,210*SCALE),fill=ACCENT,width=3*SCALE)
        else:
            poly([(74,66),(167,66),(190,91),(190,238),(74,238),(74,66)],INK,1.5)
            poly([(166,67),(166,92),(190,92)],SOFT,1)
            for y in (114,136,158):poly([(94,y),(162,y)],SOFT,1.5)
            # A question mark asks for a definition instead of inventing a tape path.
            q=curve(('M',118,182),('C',120,169,145,169,148,183),('C',151,196,134,197,133,208))
            poly(q,ACCENT,2.3);dot((133,219),2,ACCENT)
            poly([(94,248),(94+75*progress,248)],ACCENT,2)
        return im
    shapes,details=figure(view)
    for shape in shapes:poly(shape+[shape[0]],INK,1.05,FILL)
    for detail in details:poly(detail,SOFT,.8)
    for guide in spec['guides']:poly(guide,SOFT,.8)
    pts=spec['path']
    if pts:
        lengths=[0]
        for a,b in zip(pts,pts[1:]):lengths.append(lengths[-1]+math.dist(a,b))
        total=lengths[-1];target=total*progress;active=[]
        for i,p in enumerate(pts):
            if lengths[i]<=target:active.append(p)
            else:
                prev=pts[i-1];f=(target-lengths[i-1])/(lengths[i]-lengths[i-1]);active.append((prev[0]+(p[0]-prev[0])*f,prev[1]+(p[1]-prev[1])*f));break
        # Dim unmeasured trajectory; closed tape's rear half is dashed.
        if spec['closed']:
            for i in range(len(pts)-1):
                if i%6<3:poly(pts[i:i+2],SOFT,1)
            for i in range(len(active)-1):
                rear=i>(len(pts)-1)*spec.get('front_fraction',.5)
                if not rear or i%6<3:poly(active[i:i+2],DIM if rear else ACCENT,2.2)
        else:
            poly(pts,SOFT,1);poly(active,ACCENT,2.2)
        dot(pts[0],2.3,WHITE);dot(pts[-1],2.3,WHITE)
        if active:dot(active[-1],2.3,ACCENT)
    return im

def build():
    OUT.mkdir(parents=True,exist_ok=True);QA.mkdir(exist_ok=True)
    if not (OUT/'manifest.json').exists():
        (OUT/'manifest.json').write_text('{"version":1,"measurements":{},"fallback":{}}',encoding='utf-8')
    node=Path(__import__('shutil').which('node') or 'node')
    catalog=json.loads(subprocess.check_output([str(node),'-e',"process.stdout.write(JSON.stringify(require('./app/body-profiles.cjs').catalog))"],cwd=ROOT))
    assert set(m['id'] for m in catalog)==set(S)-{'fallback'}, sorted(set(m['id'] for m in catalog)^set(S))
    manifest={'version':1,'width':W*SCALE,'height':H*SCALE,'measurements':{}}
    tiles=[];font=ImageFont.truetype('C:/Windows/Fonts/segoeui.ttf',15)
    for m in catalog+[{'id':'fallback','name':'Уточните способ измерения'}]:
        id=m['id'];sp=S[id];frames=[]
        for i in range(24):
            t=i/23;progress=0 if t<.08 else min(1,(t-.08)/.56);progress=progress*progress*(3-2*progress)
            frames.append(raster(sp,progress))
        frames[0].save(OUT/(id+'.gif'),save_all=True,append_images=frames[1:],duration=[85]*23+[650],loop=0,optimize=True,disposal=2)
        frames[-1].save(OUT/(id+'.png'),optimize=True)
        rec={k:sp[k] for k in ('region','start_point','end_point','direction')}
        rec.update(src='assets/measurements/'+id+'.gif',poster='assets/measurements/'+id+'.png',alt=m['name']+' — '+sp['direction'].lower()+'. '+VIEW_NAMES[sp['view']]+'.',view=VIEW_NAMES[sp['view']],width=W*SCALE,height=H*SCALE)
        if id=='fallback':manifest['fallback']=rec
        else:manifest['measurements'][id]=rec
        tile=Image.new('RGB',(180,236),BG);tile.paste(frames[-1].resize((176,200),Image.Resampling.LANCZOS),(2,0));ImageDraw.Draw(tile).text((5,206),id,fill=WHITE,font=font);tiles.append(tile)
    (OUT/'manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2),encoding='utf-8')
    (OUT/'manifest.js').write_text('(function(root){const data='+json.dumps(manifest,ensure_ascii=False,separators=(',',':'))+';if(typeof module!==\'undefined\')module.exports=data;else root.MeasurementIllustrations=data;})(typeof window===\'undefined\'?globalThis:window);\n',encoding='utf-8')
    sheet=Image.new('RGB',(8*180,math.ceil(len(tiles)/8)*236),BG)
    for i,t in enumerate(tiles):sheet.paste(t,((i%8)*180,(i//8)*236))
    sheet.save(QA/'measurement-gif-contact.png')
    print(json.dumps({'count':len(catalog),'gif_bytes':sum(f.stat().st_size for f in OUT.glob('*.gif')),'manifest':str(OUT/'manifest.json')}))
if __name__=='__main__':build()
