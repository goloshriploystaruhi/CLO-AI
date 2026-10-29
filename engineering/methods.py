"""Versioned registry wrapping the existing category-specific constructors."""
import copy
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent


def registry():
    catalog = json.loads((ROOT/'construction-catalog.json').read_text(encoding='utf-8'))
    for key, meta in catalog.items():
        meta['implementation_version'] = meta.get('implementation_version', meta.get('construction_revision', 'legacy-1'))
        meta['knowledge_id'] = 'clo_ai/'+key
        meta['professional_standard_verified'] = False
        meta['material_scope'] = 'stretch_knit' if key == 'tshirt_setin_engineering_v1' else 'experimental_nonnegative_ease'
    return catalog


def method(key):
    if key not in registry():
        raise ValueError('Методика не реализована: '+str(key))
    return copy.deepcopy(registry()[key])


def select(category, construction=None, material=None):
    choices = []
    for key, meta in registry().items():
        if meta['category'] != category or (construction and construction != key):
            continue
        if material == 'woven' and meta['material_scope'] == 'stretch_knit':
            continue
        choices.append({'id': key, 'name': meta['name'], 'variant': meta.get('variant'),
                        'status': meta['status'], 'professional_standard_verified': False})
    return choices


def build_raw(key, profile, parameters, previous=None):
    if 'development' in parameters:
        from development_engine import build
        return build(key,profile,{k:v for k,v in parameters.items() if k!='development'},parameters['development'],previous)
    return _build_raw(key,profile,parameters,previous)


def _build_raw(key, profile, parameters, previous=None):
    method(key)
    if key in ('balloon_tapered_v1','workwear_zip_jacket_v1','women_baggy_boilersuit_v1'):
        from reference_constructors import build
        return build(key,profile,parameters,previous)
    if key in ('trousers_utility_v1','jacket_utility_v1','jumpsuit_utility_v1'):
        from utility_constructors import build
        return build(key,profile,parameters,previous)
    if key == 'tshirt_setin_engineering_v1':
        from tshirt_engine import construct
        return construct(profile, parameters, previous)
    if key == 'wide_trousers_experimental_v1':
        from garment_engine import construct
        return construct(profile, parameters, previous)
    from category_constructors import build
    return build(key, profile, parameters, previous)
