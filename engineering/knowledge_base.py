"""Reproducible local knowledge index. External facts never become drafting code."""
import json
from pathlib import Path
from .methods import registry

SOURCES=[
 {'id':'iso8559','name':'ISO 8559-1:2017','edition':'1, 2017-03; карточка подтверждена 2026-10-24',
  'url':'https://www.iso.org/standard/61686.html','verification':'official_abstract_only','implemented':False,
  'facts':['Стандарт определяет антропометрические измерения, не универсальные формулы конструирования'],
  'limits':['Полный нормативный текст не приобретался; соответствие измерений ISO не заявляется']},
 {'id':'mueller','name':'M. Müller & Sohn — опубликованные параметры футболки','edition':'Официальная карточка, дата издания не указана; проверена 2026-10-24',
  'url':'https://www.muellerundsohn.com/en/shop/pattern-basic-longsleeve-and-t-shirt-block-for-women/',
  'verification':'official_product_data_only','implemented':False,
  'facts':['Для описанного базового T-shirt block заявлена прибавка 4 см к половине обхвата груди; для longsleeve — 2 см',
           'В терминах полной окружности это соответственно 80 и 40 мм; это арифметическое преобразование опубликованных данных'],
  'limits':['Это свойства конкретных блоков, не нормы для всех футболок','Полная последовательность и коммерческие лекала не копировались']},
 {'id':'mueller_trousers','name':'Pattern Making Men’s Trousers','edition':'Первое английское издание, 2020, 216 страниц',
  'url':'https://www.muellerundsohn.com/en/shop/download-patternmaking-mens-trousers/',
  'verification':'official_bibliography_only','implemented':False,'facts':['Существуют разные блоки и коррекции фигуры'],
  'limits':['Расчётные формулы закрытого издания не проверены и не воспроизведены']},
 {'id':'emko','name':'ЕМКО СЭВ, тома 2 и 4','edition':'Базовые конструкции женской одежды, 1988; градация, 1989',
  'url':'https://library.sutd.ru/web/index.php?C21COM=S&I21DBN=KNIGI_FULLTEXT&LNG=&P21DBN=KNIGI&S21CNR=&S21FMT=briefHTML_ft&S21LOG=1&S21P01=0&S21P02=0&S21P03=K%3D&S21REF=&S21STN=1&S21STR=%D0%A0%D0%90%D0%97%D0%9C%D0%95%D0%A0%D0%9D%D0%AB%D0%95+%D0%9F%D0%A0%D0%98%D0%97%D0%9D%D0%90%D0%9A%D0%98&USES21ALL=1&Z21ID=MTAyNFU2UzA1OFQzRTZHNzE5',
  'verification':'university_library_bibliography_only','implemented':False,'facts':['Издания по базовым конструкциям и градации подтверждены каталогом профильного университета'],
  'limits':['Формулы Т16/Т19, определения и правила градации не подтверждены по полному первоисточнику; реализация отсутствует']},
 {'id':'cotshl','name':'ЦОТШЛ — индивидуальное конструирование','edition':'Точное издание первоисточника не проверено',
  'url':None,'verification':'unverified','implemented':False,'facts':[],
  'limits':['Не использовать пересказанные формулы как подтверждённую методику; в конструкторы не включено']},
 {'id':'brian','name':'FreeSewing Brian v3','edition':'Документация v3, проверена 2026-10-24; исходный commit не зафиксирован',
  'url':'https://freesewing.eu/docs/designs/brian/','verification':'official_documentation','implemented':False,
  'facts':['Блок прямой ниже груди, индивидуальная подгонка талии не входит в его назначение',
           'Окат имеет разные переднюю и заднюю области; размер согласуется с проймой'],
  'limits':['Не перенесён в проект и не смешивается с собственным блоком CLO AI']},
 {'id':'brian_options','name':'FreeSewing Brian — прибавки','edition':'Онлайн-документация v3, проверена 2026-10-24',
  'url':'https://freesewing.eu/docs/designs/brian/options/','verification':'official_documentation','implemented':False,
  'facts':['Прибавка груди по умолчанию 15% в данной модели; заданная окружность равна мерке × 1.15',
           'У трикотажного оката допускается малая или нулевая посадка; она не универсальна для ткани'],
  'limits':['Процентные настройки конкретного блока не являются стандартом антропометрии и не подставляются в другие методы']},
 {'id':'fit_checklist','name':'Texas A&M, Principles of Pattern Alteration E-372','edition':'02/06, индексированный текст; полный PDF перенаправляется',
  'url':'https://rockwall.agrilife.org/files/2011/09/patternalteration_10.pdf','verification':'partial_search_excerpt_redirect','implemented':False,
  'facts':['Для оценки посадки важны баланс, положение долевой и свобода движения'],
  'limits':['Полный текст сейчас недоступен по исходной ссылке; не источник точных допусков и формул']},
]


def export():
    from .category_research import SOURCES as category_sources
    records=[]
    for key,meta in registry().items():
        formulas=meta.get('formulas')
        if not formulas:
            cat=meta['category']
            if cat=='headwear':formulas={'gore_base':'(head + head_ease_mm) / 6','crown':'(0, -height_mm), local Y down','headband':'6 * gore_base, height 50 mm','gore_controls':'(w/2,-0.6h), (0.25w,-h), mirrored for other edge'}
            elif cat=='skirt':formulas={'panel_top':'(waist + waist_ease_mm)/2','panel_hem':'hem_circumference_mm/2','hip_width':'top+(hem-top)*waist_hip_length/length_mm >= hips/2','belt':'top x (2*belt_width_mm)','zipper_split':'zipper_mm / actual side seam length'}
            elif cat in ('jeans','shorts','underwear','jumpsuit'):formulas={'hip_panel':'(hips+hip_ease_mm)/4','waist_panel':'(garment_waist_girth+waist_ease_mm)/4','levels':'body level - waist_drop_mm','short_control':'(seated_depth-waist_drop_mm+length_mm)/2','short_knee_width':'(hip_panel+hem_flat_mm)/2','jumpsuit_join':'upper hem circumference = garment_waist_girth + waist_ease_mm','dependency':'lower foundation = wide_trousers_experimental_v1; upper jumpsuit = shirt_stand_v1, no claim of professional balance'}
            else:formulas={'body_chest_half_width':'(chest+chest_ease_mm)/4','body_hem_half_width':'hem_circumference_mm/4','drop_shoulder_x':'(chest+chest_ease_mm)/4; not a classic set-in armhole','legacy_arm_edge':'armhole_depth-shoulder_drop_mm','legacy_sleeve_width':'2*legacy_arm_edge; cuff = cuff_circumference_mm','sleeve_taper':'(2*legacy_arm_edge-cuff_circumference_mm)/2','neck_finish_length':'sum of actual neckline cubic lengths; legacy methods do not calibrate rib stretch','hood_bottom':'front neckline/2 + back neckline/2','coat_belt_default':'1.6*max(chest+chest_ease_mm, hem_circumference_mm)','processing':'patch pockets use the supplied width/depth; cuff rectangle is cuff circumference x 80 mm'}
        records.append({'id':meta['knowledge_id'],'name':meta['name'],'source':{'type':'own_experimental','files':['utility_constructors.py' if meta.get('foundation') else 'tshirt_engine.py' if key=='tshirt_setin_engineering_v1' else 'garment_engine.py' if key=='wide_trousers_experimental_v1' else 'category_constructors.py']},
                        'version':meta['implementation_version'],'category':meta['category'],'construction_type':meta.get('variant','Экспериментальный комплект'),
                        'required_measurements':meta['required_measurements'],'required_parameters':meta['required_parameters'],
                        'formulas':formulas,
                        'ease_definition':'Параметры _ease_mm в полном обхвате; biceps_ease_mm — полный обхват рукава; исключения описаны методом',
                        'dependencies':'engineering.dependencies.plan','tolerances_mm':{'rib':.2,'bartack':.3,'waistband':.5,'pocket':.75,'short':.5,'long':1},
                        'limits':meta.get('limits',['Экспериментальная геометрия ограниченного варианта; баланс и технология требуют конструктора']),
                        'verification':'deterministic_implementation_and_tests','professional_standard_verified':False,'grading':'Перестроение по полному набору мерок; межразмерная промышленная градация не реализована'})
    return {'name':'Pattern Engineering Knowledge Base','version':1,'checked_at':'2026-10-25','sources':SOURCES+category_sources,'implemented_methods':records,'category_research':'engineering/category-research.json'}


if __name__=='__main__':
    target=Path(__file__).resolve().parent/'knowledge-base.json'
    target.write_text(json.dumps(export(),ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
