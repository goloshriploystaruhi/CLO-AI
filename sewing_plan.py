"""Deterministic research contract for translating the existing Sewing Graph.

This creates a plan, never native seams, screen coordinates, or simulation calls.
The native adapter must resolve IDs and the actual stitch-line spans separately.
"""
import hashlib
import json
from engineering.assembly import audit


def compile_plan(garment):
    checked=audit(garment)
    if not checked['valid']:
        raise ValueError('Карта соединений не прошла проверку: '+'; '.join(i['message'] for i in checked['issues']))
    steps=[]
    for relation,measured in zip(garment['sewing_graph'],checked['links']):
        ends=[]
        for ref,actual in zip((relation['a'],relation['b']),measured['ends']):
            piece=garment['pieces'][ref['piece']]
            ends.append({'piece_id':piece['id'],'piece_role':piece['role'],'piece_name':piece['name'],
                         'model_piece_index':ref['piece'],'source':'stitch_contour' if 'segments' in ref else 'construction_internal_line',
                         'semantic_segments':ref.get('segments'),'internal_line':ref.get('internal_line'),
                         'length_mm':actual['length_mm'],'control_points':actual['control_points']})
        identity={'garment_id':garment['id'],'version':garment['version'],'seam_id':relation['id'],'ends':ends,'direction':relation['direction']}
        steps.append({'id':relation['id'],'name':relation.get('name',relation['id']),'ends':ends,'direction':relation['direction'],
                      'ease_mm':measured['ease_mm'],'tolerance_mm':measured['tolerance_mm'],'residual_mm':measured['residual_mm'],
                      'technology':relation.get('type'),'idempotency_key':hashlib.sha256(json.dumps(identity,sort_keys=True).encode()).hexdigest(),
                      'execution_state':'not_executed','native_binding':'must_resolve_and_verify'})
    return {'schema_version':1,'garment_id':garment['id'],'garment_name':garment['name'],'version':garment['version'],
            'piece_count':len(garment['pieces']),'seam_count':len(steps),'seams':steps,'assembly_sequence':garment.get('operations',[]),
            'component_count':checked['component_count'],'assembly_components':checked['components'],
            'native_seams_created':0,'native_execution_verified':False,
            'note':'План рассчитан из сохранённой конструкции. Нативные линии и направление требуется сопоставить и проверить в CLO. Срезы припуска не подменяют линии стачивания.'}
