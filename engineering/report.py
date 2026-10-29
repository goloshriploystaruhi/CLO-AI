"""Readable reports keep mathematical, native and manual evidence distinct."""


def markdown(report):
    meta=report.get('method',{})
    text=['# Контроль качества лекал','',meta.get('name','Неизвестная методика')+' · '+str(meta.get('version','')),
          '','Соответствие профессиональному стандарту и посадка не подтверждены.',
          '', 'Профиль: '+str(report.get('profile_id','не указан')),
          'Версия конструкции: '+str(report.get('garment_version','')),
          '','## Статусы','',', '.join(report.get('quality',{}).get('labels',['Черновик'])),
          '', '## Источники','']
    text+=['- '+s for s in meta.get('source',[])]
    text+=['','## Использованные мерки и параметры','']
    for key,item in report.get('measurements',{}).items():text.append('- {}: {} {} ({})'.format(key,item.get('value'),item.get('unit'),item.get('status')))
    for key,value in report.get('parameters',{}).items():text.append('- {}: {}'.format(key,value))
    text+=['','## Детали','', '| Деталь | Ширина стачивания, мм | Высота, мм | Периметр, мм | Площадь, мм² |', '|---|---:|---:|---:|---:|']
    for p in report.get('parts',[]):
        b=p['geometry'].get('seam_contour',{})
        text.append('| {} | {:.3f} | {:.3f} | {:.3f} | {:.3f} |'.format(p['name'],b.get('width_mm',0),b.get('height_mm',0),b.get('perimeter_mm',0),b.get('area_mm2',0)))
    if report.get('assembly',{}).get('component_count',0)>1:
        text+=['','## Независимые сборки','']
        for group in report['assembly']['components']:
            text.append('- Сборка {}: {}'.format(group['index'],', '.join(group['piece_names'])))
        text.append('Сборки независимы; соединения между ними не создаются.')
    text+=['','## Сопряжения по линии стачивания','', '| Детали и участки | A, мм | B, мм | Посадка, мм | Невязка, мм | Допуск, мм |', '|---|---:|---:|---:|---:|---:|']
    for r in report.get('assembly',{}).get('links',[]):
        a,b=r['ends'];name=' / '.join(e['name']+' ['+', '.join(s.split('/')[-1] for s in e['segment_ids'])+']' for e in (a,b))
        text.append('| {} | {:.3f} | {:.3f} | {:.3f} | {:.3f} | {:.3f} |'.format(name,a['length_mm'],b['length_mm'],r['ease_mm'],r['residual_mm'],r['tolerance_mm']))
    text+=['','## Ошибки и предупреждения','']
    for e in report.get('issues',[])+report.get('warnings',[]):text.append('- {} / {}: {}'.format(e['piece'],e['section'],e['message']))
    text+=['','## Расчётная оценка и примерка','']
    text+=['- '+s for s in report.get('fit',{}).get('level_A',{}).get('risks',[])]
    text+=['- '+s for s in report.get('fit',{}).get('level_B',{}).get('instructions',[])]
    text+=['','## Фактический экспорт CLO','',report.get('native_export',{}).get('note','Ещё не измерен.'),'']
    return '\n'.join(text)
