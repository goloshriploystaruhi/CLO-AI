"""Single entry point for profile -> constructor -> shared QA -> adapter-ready job."""
from .methods import method,build_raw
from .measurements import normalize
from .dependencies import plan
from .validation import validate
from .report import markdown


def build(key,profile,parameters,previous=None):
    try:from operation_events import emit
    except ImportError:emit=lambda *args,**kwargs:None
    emit('validation','Исходные данные','running','Проверяю мерки и параметры выбранной основы.')
    meta=method(key)
    profile,issues=normalize(profile,meta['required_measurements'])
    if issues:return {'qa_blocked':True,'message':'\n'.join(i['section']+': '+i['message'] for i in issues),'qa_report':{'valid':False,'issues':issues,'fit_verified':False,'sewing_ready':False}}
    result=build_raw(key,profile,parameters,previous)
    if 'needs_input' in result:return result
    g=result['garment'];g['dependency_plan']=plan(meta,g['parameters'],previous)
    emit('construction',g['name'],'completed','Комплект рассчитан: {} деталей. Перехожу к проверке.'.format(len(g['pieces'])))
    # An independent second construction checks correspondence with the method.
    # It is a bounded verification pass, never an auto-repair loop.
    emit('validation',g['name'],'running','Проверяю контуры, размеры и сопряжения комплекта.')
    report=validate(g,reconstruct=True)
    emit('validation',g['name'],'verified' if report['valid'] else 'failed',
         'Расчётная проверка геометрии и соединений пройдена. Посадка ещё не проверена.' if report['valid'] else 'В конструкции найдены проблемы; детали не будут переданы в CLO.',
         {'valid':report['valid'],'issues':report['issues']})
    g['dependency_plan']['verification_rebuilds']=1
    g['qa_report']=report;g['quality_status']=report.get('quality',{})
    g['readiness']['geometry']=report['valid'];g['readiness']['fit_verified']=False;g['readiness']['sewing_ready']=False
    result['qa_report']=report;result['qa_markdown']=markdown(report)
    if not report['valid']:
        return {'qa_blocked':True,'message':'Не удалось проверить конструкцию:\n'+'\n'.join(i['piece']+' / '+i['section']+': '+i['message'] for i in report['issues']),
                'qa_report':report,'qa_markdown':result['qa_markdown']}
    return result
