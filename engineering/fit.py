"""Calculated screening and an explicit, version-bound manual fitting workflow."""

MANUAL_STEPS = [
    'Назначьте реальные материалы, долевую и контрольные метки в CLO',
    'Соберите по карте швов: стачивание по внутреннему контуру, не по припуску',
    'Разместите детали вокруг аватара с соответствующими мерками и запустите симуляцию вручную',
    'Проверьте горизонтальность уровней, плечевой баланс и вертикальность середины/боков',
    'Для брюк проверьте сидение, положение пояса и свободу в положении сидя',
    'Для втачного рукава проверьте ориентацию, подъём рук и положение плечевого шва',
    'Запишите наблюдения, исправления, свойства ткани и проверенную версию изделия',
]


def evaluate(g):
    p=g['parameters'];m=g['measurement_snapshot'];category=g['category'];checks=[];risks=[]
    def value(k):return m.get(k,{}).get('value')
    for key,body in (('chest_ease_mm','chest'),('hip_ease_mm','hips'),('waist_ease_mm','garment_waist_girth')):
        if key in p:
            body_value=value(body) if value(body) is not None else value('waist') if 'waist' in key else None
            checks.append({'name':key,'body_mm':body_value,'ease_mm':p[key],
                           'finished_circumference_mm':body_value+p[key] if body_value is not None else None,
                           'result':'расчёт прибавки; комфорт не подтверждён'})
    if 'length_mm' in p:checks.append({'name':'Длина изделия','value_mm':p['length_mm'],'result':'параметр конструкции; соответствие назначению требует примерки'})
    if 'hem_flat_mm' in p and 'knee_flat_mm' in p and p['hem_flat_mm']<p['knee_flat_mm']:
        risks.append('Низ уже колена: штанины сужаются к низу. Название «широкие» не означает прямой силуэт')
    if category in ('trousers','jeans','shorts','underwear','jumpsuit'):
        risks.append('Анатомический баланс сидения и распределение объёма между передом/спинкой не подтверждены этой экспериментальной основой')
    if category in ('tshirt','shirt','hoodie','sweatshirt','blazer','jacket','coat','dress','jumpsuit','top'):
        risks.append('Плечевой баланс и осанка не определяются одним равенством плечевых швов; нужна примерка')
    if g.get('approximate') or any(e.get('source')=='estimated' for e in m.values()):risks.append('Присутствуют условные мерки или допущения; это не персональная посадка')
    if not g.get('material') or 'cross_stretch_percent' not in g.get('material',{}):
        risks.append('Реальные механические свойства материала и трение не измерены системой')
    return {'level_A':{'status':'calculated_screening','checks':checks,'risks':risks,
                       'unassessed':['Динамическая подвижность','Давление и натяжение ткани','Индивидуальная осанка и баланс'],
                       'fit_verified':False},
            'level_B':{'status':'manual_review_required','simulation_run':False,'native_sewing_applied':False,
                       'numeric_strain_stress_available':False,'instructions':MANUAL_STEPS},
            'fit_verified':False,'sewing_ready':False}
