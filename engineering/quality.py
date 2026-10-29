"""Evidence-based milestones. Mathematical QA never grants sewing readiness."""
import hashlib
import json
from datetime import datetime, timezone

STATUSES=('DRAFT','GEOMETRY_VALIDATED','CONSTRUCTION_VALIDATED','ASSEMBLY_VALIDATED',
          'FIT_REVIEW_REQUIRED','FIT_REVIEWED','PRODUCTION_REVIEW_REQUIRED')
LABELS={'DRAFT':'Черновик','GEOMETRY_VALIDATED':'Геометрия проверена',
        'CONSTRUCTION_VALIDATED':'Правила методики проверены','ASSEMBLY_VALIDATED':'Сопряжения проверены',
        'FIT_REVIEW_REQUIRED':'Требуется примерка','FIT_REVIEWED':'Примерка отмечена пользователем',
        'PRODUCTION_REVIEW_REQUIRED':'Требуется производственная проверка'}


def fingerprint(g):
    content={'method':g['method'],'method_version':g.get('construction_revision',g['method_spec'].get('implementation_version','legacy-1')),
             'parameters':g['parameters'],'measurements':g['measurement_snapshot'],
             'pieces':[{k:p[k] for k in ('id','role','seam_contour','cut_contour')} for p in g['pieces']]}
    if 'assembly_groups' in g:
        # New explicit assembly contracts also invalidate evidence after topology
        # changes; leave existing single-assembly fingerprints unchanged.
        content['assembly_groups']=g['assembly_groups']
        content['sewing_graph']=[{k:r.get(k) for k in ('a','b','direction','ease_mm','tolerance_mm','type','alignment')} for r in g['sewing_graph']]
    return hashlib.sha256(json.dumps(content,sort_keys=True,allow_nan=False).encode('utf-8')).hexdigest()


def milestones(g,geometry,construction,assembly,review=None):
    digest=fingerprint(g);now=datetime.now(timezone.utc).isoformat()
    statuses=['DRAFT'];events=[]
    for name,passed,criterion in (
        ('GEOMETRY_VALIDATED',geometry,'Замкнутость, топология, размеры и припуски'),
        ('CONSTRUCTION_VALIDATED',construction,'Соответствие детерминированному экспериментальному конструктору и заявленным правилам; не профессиональная сертификация'),
        ('ASSEMBLY_VALIDATED',assembly,'Сопряжения по линиям стачивания и технологически заданная разница длин')):
        events.append({'status':name,'passed':bool(passed),'criterion':criterion,'at':now,'version':g['version'],'geometry_fingerprint':digest,'source':'deterministic_engine'})
        if passed:statuses.append(name)
    valid_review=bool(review and review.get('version')==g['version'] and review.get('geometry_fingerprint')==digest and review.get('method') in ('clo_3d','physical') and review.get('notes','').strip())
    statuses.append('FIT_REVIEWED' if valid_review else 'FIT_REVIEW_REQUIRED')
    if valid_review:events.append({'status':'FIT_REVIEWED','passed':True,'version':g['version'],'geometry_fingerprint':digest,'source':'user_attestation','evidence':review,'at':review.get('at',now)})
    statuses.append('PRODUCTION_REVIEW_REQUIRED')
    return {'statuses':statuses,'labels':[LABELS[s] for s in statuses],'evidence':events,
            'geometry_fingerprint':digest,'professional_standard_verified':False,'fit_verified':False,'sewing_ready':False}
