"""Reviewed primary sources and an explicit boundary between research and drafting."""
import copy
import json
from pathlib import Path

CHECKED='2026-10-25'

def source(identity,title,url,category,facts,verification='official_documentation',access='reference_only'):
    return dict(id=identity,name=title,url=url,categories=category,checked_at=CHECKED,
                verification=verification,access=access,facts=facts,implemented_external_pattern=False)

SOURCES=[
 source('fs_catalog','FreeSewing — каталог конструкций','https://freesewing.eu/editor/',
        ['trousers','jacket','jumpsuit'],['Каталог содержит разные самостоятельные блоки; наличие модели у FreeSewing не означает её реализацию в CLO AI']),
 source('fs_titan','FreeSewing Titan — основа брюк','https://freesewing.eu/designs/titan/',
        ['trousers'],['Используются передняя и задняя составляющие мерок талии, сидения и дуги через промежность; это основа для моделирования, не готовый фасон']),
 source('fs_titan_options','FreeSewing Titan — настройки','https://freesewing.eu/docs/designs/titan/options/',
        ['trousers'],['Посадка и положение талии управляются отдельными настройками конкретной основы; их нельзя объявлять универсальными прибавками']),
 source('fs_charlie','FreeSewing Charlie — чиносы','https://freesewing.eu/docs/designs/charlie/',
        ['trousers'],['Чиносы на основе Titan; характерное расположение переднего входа связано со смещением бокового шва']),
 source('fs_paco','FreeSewing Paco — свободные летние брюки','https://freesewing.eu/docs/designs/paco/',
        ['trousers'],['Отдельная конструкция с эластичным поясом и карманами; не просто переименование чиносов']),
 source('fs_crux','FreeSewing Crux — походные брюки','https://freesewing.eu/docs/designs/crux/',
        ['trousers'],['Предусмотрены варианты карманов, пояса, низа и анатомического колена; исходная основа Cornelius']),
 source('fs_cornelius','FreeSewing Cornelius — велосипедные бриджи','https://freesewing.eu/docs/designs/cornelius/',
        ['trousers'],['Историческая система Keystone послужила основой отдельной конструкции; она не является современной универсальной основой всех брюк']),
 source('fs_waralee','FreeSewing Waralee — брюки с запахом','https://freesewing.eu/docs/designs/waralee/',
        ['trousers'],['Прямоугольные полотнища и вырез сидения формируют иной способ закрывания изделия; обычный пояс с гульфиком не эквивалентен запаху']),
 source('fs_percy','FreeSewing Percy — объёмные шорты с откидным передом','https://freesewing.eu/docs/designs/percy/',
        ['trousers'],['Слово Puffy в названии не означает пуховый утеплитель; модель описана как fall-front puffy shorts']),
 source('fs_jaeger','FreeSewing Jaeger — жакет','https://freesewing.eu/docs/designs/jaeger/',
        ['jacket'],['Полочки, бочки, спинка, двухчастный рукав, воротник, подборта и подкладка — отдельные зависимые детали']),
 source('fs_jett','FreeSewing Jett — бомбер','https://freesewing.eu/docs/designs/jett/',
        ['jacket'],['Подкладка, втачной рукав и трикотажные отделочные детали; предусмотрены отдельные коррекции груди и живота']),
 source('fs_devon','FreeSewing Devon — джинсовая куртка','https://freesewing.eu/docs/designs/devon/',
        ['jacket'],['Основа Bent, кокетки и панели; автор отдельно предупреждает о возможной проблеме глубины проймы и рекомендует макет']),
 source('fs_opal','FreeSewing Opal — полукомбинезон','https://freesewing.eu/docs/designs/opal/',
        ['jumpsuit'],['Нагрудник, бретели, пояс и карманы; приведённая модель должна проходить через бёдра без боковой застёжки']),
 source('fs_opal_options','FreeSewing Opal — параметры','https://freesewing.eu/docs/designs/opal/options/',
        ['jumpsuit'],['Нагрудник, его обработка, положения и формы карманов параметризуются отдельно']),
 source('fs_onyx','FreeSewing Onyx — цельный комбинезон','https://freesewing.eu/docs/designs/onyx/',
        ['jumpsuit'],['Самостоятельная модель цельного изделия; она не импортирована в CLO AI']),
 source('fs_otis','FreeSewing Otis — детский ромпер','https://freesewing.eu/docs/designs/otis/',
        ['jumpsuit'],['Детский ромпер; не применять его мерочную схему к рабочему взрослому комбинезону']),
 source('fs_archive','FreeSewing — архив исходников и переезд','https://github.com/freesewing/freesewing',
        ['trousers','jacket','jumpsuit'],['GitHub-репозиторий архивирован; README указывает на Codeberg. Новый репозиторий не прочитан из-за robots.txt'],
        'repository_metadata_and_readme','MIT_for_reviewed_archive'),
 source('fs_license','Лицензия архивного кода FreeSewing','https://github.com/freesewing/freesewing/blob/develop/LICENSE',
        ['trousers','jacket','jumpsuit'],['MIT; при включении существенных частей кода требуется сохранить уведомление. Исходный код в рабочий конструктор не копировался'],
        'license_read','MIT'),
 source('mueller_windbreaker','M. Müller & Sohn — ветровки','https://www.muellerundsohn.com/en/allgemein/pattern-construction-of-windbreaker-for-men/',
        ['jacket'],['В открытой статье показаны разные варианты ветровок; полная методика предлагается отдельно'],
        'official_public_article','public_excerpt_only'),
 source('mueller_jumpsuit','M. Müller & Sohn — конструирование комбинезонов','https://www.muellerundsohn.com/en/allgemein/constructing-4-jumpsuits/',
        ['jumpsuit'],['Дополнительная длина у талии важна для отсутствия тяги в промежности; выбор способа зависит от конструкции'],
        'official_public_article','public_excerpt_only'),
 source('mueller_flared','M. Müller & Sohn — варианты клёш','https://www.muellerundsohn.com/en/shop/pattern-flared-trousers-for-women/',
        ['trousers'],['Клёш описан для разных основ: джинсы, легинсы, деловые и классические брюки; один низ не определяет всю конструкцию'],
        'official_product_description','commercial_pattern_not_downloaded'),
 source('myog_alpha','LearnMYOG — Alpha Raglan','https://learnmyog.com/alphaRaglan.html',
        ['jacket'],['Реглан и варианты капюшона рассчитаны на конкретный тип слоя; опубликовано ограничение личного некоммерческого использования'],
        'official_product_description','personal_noncommercial_no_copy'),
 source('myog_windshell','LearnMYOG — UL Windshell','https://shop.learnmyog.com/shop/p/ul-windshell',
        ['jacket'],['Отдельная оболочка, совместимая по назначению со средним слоем; коммерческие лекала не приобретались'],
        'official_product_description','commercial_pattern_not_downloaded'),
 source('dla_coverall','DLA MIL-DTL-32082 — холодозащитный комбинезон механика','https://quicksearch.dla.mil/qsDocDetails.aspx?ident_number=212084',
        ['jumpsuit'],['Карточка описывает изделие, надеваемое поверх холодозащитной одежды; это не файл параметрических лекал'],
        'official_specification_catalog','catalog_only'),
 source('dla_parka','DLA MIL-DTL-32184 — парка','https://quicksearch.dla.mil/Transient/0EF0F8C72A86493F840947C60B7DFC17.pdf',
        ['jacket'],['Прочитано описание назначения мембранной парки и отдельного капюшона. Полный комплект лекал и текущая редакция не подтверждены'],
        'official_specification_scope_excerpt','public_scope_only'),
 source('dla_n3b','DLA MIL-DTL-6279 — N-3B','https://quicksearch.dla.mil/qsDocDetails.aspx?ident_number=5916',
        ['jacket'],['Карточка помечает документ отменённым 21 мая 2020; использовать только как исторический ориентир'],
        'official_specification_catalog','historical_catalog_only'),
]

# These are development requirements inferred by CLO AI, not borrowed equations.
FAMILIES={
 'trousers':{'name':'Штаны и брюки','methods':['wide_trousers_experimental_v1','jeans_loose_v1','shorts_loose_v1','trousers_utility_v1'],
  'styles':[
   ('utility_woven','Свободные брюки с объёмными карманами','trousers_utility_v1',[]),
   ('straight_taper_flare','Прямой, суженный и расклешённый низ','trousers_utility_v1',['Индивидуальный баланс основы требует примерки']),
   ('tailored','Классические костюмные',None,['Раздельные дуги талии и бёдер','Вытачки и складки','Анатомическая форма пояса','Прорезные карманы']),
   ('chino','Чиносы',None,['Собственная проверенная чиносная основа','Косой вход кармана','Передне-задний баланс']),
   ('five_pocket_jeans','Классические джинсы с пятью карманами',None,['Задняя кокетка','Косые входы и монетный карман','Деним и его усадка']),
   ('jogger','Джоггеры и брюки на резинке',None,['Проходимость через бёдра','Пояс с эластичной лентой','Манжеты и их растяжение']),
   ('hiking','Походные и альпинистские',None,['Сгибание колена','Ластовица шага','Работа с ботинком и обвязкой']),
   ('military_hunting','Армейские и охотничьи',None,['Спецификация конкретного изделия','Усиления','Функциональное размещение карманов','Динамическая примерка']),
   ('stretch_fitted','Легинсы и облегающие',None,['Проверенная растяжимость и восстановление','Отрицательные прибавки по направлениям','Другой баланс сидения']),
   ('shell_insulated','Мембранные и утеплённые',None,['Внутренние слои и утеплитель','Раздельные оболочки','Герметизация и застёжки']),
   ('wrap','С запахом',None,['Проходимость и перекрытие полотнищ','Завязки и обработка открытых краёв'])],
  'measurements_to_add':['Передняя и задняя дуги талии на выбранном уровне','Передняя и задняя дуги сидения','Передняя и полная дуга через промежность','Бедро, колено, икра, щиколотка','Длина шага и боковая длина'],
  'source_ids':['fs_titan','fs_titan_options','fs_charlie','fs_paco','fs_crux','fs_cornelius','fs_waralee','mueller_flared']},
 'jacket':{'name':'Куртки','methods':['jacket_stand_v1','jacket_utility_v1'],
  'styles':[
   ('simple_work','Свободная рабочая со стойкой','jacket_utility_v1',['Ограничение: спущенное плечо, без подкладки']),
   ('casual','Повседневная лёгкая','jacket_stand_v1',['Ограничение: простой свободный блок']),
   ('denim','Джинсовая',None,['Кокетки и рельефы','Воротник с отлётом','Манжеты и шлицы']),
   ('bomber','Бомбер',None,['Втачной или регланный рукав','Подкладка','Трикотажные отделочные детали']),
   ('raglan','Реглан',None,['Отдельная основа реглана','Передняя и задняя части рукава','Подвижность плечевого пояса']),
   ('shell','Ветровка и мембранная оболочка',None,['Проверенная основа для слоя','Капюшон','Подборта и обтачки','Герметизация швов']),
   ('softshell','Софтшелл',None,['Механические свойства материала','Динамическая посадка','Технология карманов и застёжек']),
   ('down','Пуховик',None,['Раздельные наружные и внутренние оболочки','Камеры и перегородки','Объём и распределение утеплителя','Проба толщины и усадки после стёжки']),
   ('parka','Утеплённая парка',None,['Утепляющий пакет','Подкладка с прибавками','Капюшон','Ветрозащитные планки']),
   ('military_hunting','Армейская, охотничья и походная',None,['Техническое задание конкретного назначения','Подвижность с экипировкой','Усиления','Вентиляция и функциональные карманы'])],
  'measurements_to_add':['Баланс переда и спинки от высшей плечевой точки','Наклон плеча','Ширина груди и спины','Длина согнутой руки и положение локтя','Объёмы поверх нижележащих слоёв'],
  'source_ids':['fs_jaeger','fs_jett','fs_devon','mueller_windbreaker','myog_alpha','myog_windshell','dla_parka','dla_n3b']},
 'jumpsuit':{'name':'Комбинезоны','methods':['jumpsuit_work_v1','jumpsuit_utility_v1'],
  'styles':[
   ('work','Свободный рабочий','jumpsuit_utility_v1',['Проверить общий и передне-задний баланс корпуса на примерке']),
   ('bib','Полукомбинезон с нагрудником',None,['Нагрудник и бретели','Проходимость через бёдра или боковые застёжки','Усиление мест крепления']),
   ('fitted','Прилегающий модный',None,['Вытачки и рельефы','Раздельный баланс переда и спинки','Способ надевания']),
   ('stretch','Трикотажный и спортивный',None,['Растяжимость по двум направлениям','Восстановление','Динамическая длина через корпус']),
   ('insulated','Утеплённый',None,['Пакет слоёв','Раздельные оболочки','Длина корпуса поверх одежды','Застёжки ног и корпуса']),
   ('technical','Защитный и специальный',None,['Отдельная спецификация назначения','Динамические испытания','Подтверждение защитных свойств']),
   ('child','Детский и ромпер',None,['Отдельная детская мерочная схема','Способ надевания и обслуживания','Возрастная безопасность фурнитуры'])],
  'measurements_to_add':['Длины переда и спинки до выбранной линии соединения','Дуга корпуса через промежность','Длины до талии стоя и при движении','Глубина и дуга сидения','Размеры поверх нижней одежды'],
  'source_ids':['fs_opal','fs_opal_options','fs_onyx','fs_otis','mueller_jumpsuit','dla_coverall']},
}

SOURCE_REVIEW=[
 {'source_id':'fs_titan','path':'designs/titan/src/front.mjs','git_blob_sha':'8e478bd922e6a9ab8fab3f554d75e69fc11c070e',
  'findings':['Раздельные передние мерки','Ограниченные итерации согласования среднего, шагового и бокового швов','Понижение талии выполняется после согласования основы']},
 {'source_id':'fs_titan','path':'designs/titan/src/back.mjs','git_blob_sha':'6c500087c017da42c66acfb320887b5e4372f405',
  'findings':['Раздельные задние мерки','Колено распределяется между передом и спинкой','Перед получает длины швов через промежуточное хранилище']},
 {'source_id':'fs_jaeger','path':'designs/jaeger/src/front-lining.mjs','git_blob_sha':'25bfe75820296803d1bfae04c759a3365475ca52',
  'findings':['Подкладка выделяется относительно границы подборта','Это самостоятельный замкнутый контур, а не копия всей полочки с равномерным масштабом']},
 {'source_id':'fs_opal','path':'designs/opal/src/bib.mjs','git_blob_sha':'6340f65999edec115d44d052cfa875344cfaead2',
  'findings':['Нагрудник использует длины переда и спинки','Талиевый край согласуется с основой','Карман нагрудника зависит от его формы и размеров']},
]

# Exact references supplied by the user, reviewed separately from generic models.
STYLE_REFERENCE_FILE=Path(__file__).with_name('style-references.json')
for identity, item in json.loads(STYLE_REFERENCE_FILE.read_text(encoding='utf-8'))['sources'].items():
    category={'anglan':'trousers','detroit':'jacket','blanca':'jumpsuit'}[identity]
    SOURCES.append(source('style_'+identity,item['title'],item['url'],[category],item['facts'],verification=item['evidence']))
    SOURCES[-1]['checked_at']=item['checked_at']
    FAMILIES[category]['source_ids'].append('style_'+identity)
    key={'anglan':'balloon_tapered_v1','detroit':'workwear_zip_jacket_v1','blanca':'women_baggy_boilersuit_v1'}[identity]
    FAMILIES[category]['methods'].append(key)
    FAMILIES[category]['styles'].insert(0,(key,{'anglan':'Брюки-баллоны с нижними вытачками','detroit':'Короткая или обычная рабочая куртка с отложным воротником','blanca':'Женский рабочий комбинезон с рукавами и умеренно свободными брюками'}[identity],key,['Собственная основа, не оригинальные лекала бренда','Нужна примерка; автосшивания нет']))


def export(category=None):
    if category is not None and category not in FAMILIES:raise ValueError('Выберите категорию: trousers, jacket или jumpsuit')
    selected={category:copy.deepcopy(FAMILIES[category])} if category else copy.deepcopy(FAMILIES)
    for family in selected.values():
        family['styles']=[dict(id=i,name=n,method=m,status='experimental' if m else 'not_implemented',remaining=missing) for i,n,m,missing in family['styles']]
    wanted={i for f in selected.values() for i in f['source_ids']}|{'fs_catalog','fs_archive','fs_license'}
    return dict(schema_version=1,checked_at='2026-10-26',exhaustive=False,categories=selected,
                sources=[copy.deepcopy(s) for s in SOURCES if not category or s['id'] in wanted],
                source_review=[dict(r,url='https://github.com/freesewing/freesewing/blob/develop/'+r['path']) for r in SOURCE_REVIEW if not category or r['source_id'] in wanted],
                notice='Исследовательский индекс, не набор импортированных лекал. Нереализованный фасон нельзя подменять простым блоком. Посадка и защитные свойства не подтверждены.')

if __name__=='__main__':
    Path(__file__).with_name('category-research.json').write_text(json.dumps(export(),ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
