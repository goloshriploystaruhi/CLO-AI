"""Read-only diagnostic for execution in the existing CLO Python console.

Does not create seams, place pieces, import avatars or run simulation.
"""
import json
import os
import tempfile
import sys
sys.path.insert(0,os.path.dirname(os.path.abspath(__file__)))
import pattern_api
import utility_api
import export_api


def main():
    from engineering.clo_capabilities import probe
    report=probe(pattern_api,utility_api,export_api)
    report['pattern_count']=pattern_api.GetPatternCount()
    report['mutations_performed']=False
    for name in ('GetCLOVersion','GetVersion'):
        fn=getattr(utility_api,name,None)
        if callable(fn):
            try:report['version']=fn();break
            except Exception:pass
    target=os.path.join(tempfile.gettempdir(),'clo_ai_assembly_capabilities.json')
    with open(target,'w',encoding='utf-8') as f:json.dump(report,f,ensure_ascii=False,indent=2,default=str)
    print('CLO AI: диагностика сборки сохранена: '+target)
    print('Сцена не изменена. Шитьё, размещение и симуляция не запускались.')
    return report


if __name__ in ('__main__','__clo_probe__'):main()
