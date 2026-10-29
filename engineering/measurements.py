"""Unit conversion and measurement provenance; never fills missing values."""
import copy
import math

FACTORS = {'mm': 1., 'cm': 10., 'in': 25.4}


def normalize(profile, required):
    p = copy.deepcopy(profile)
    m = p.setdefault('measurements', {})
    issues = []
    for key in required:
        entry = m.get(key, {})
        value = entry.get('value')
        if value is None:
            continue
        unit = entry.get('unit')
        if unit not in FACTORS or isinstance(value, bool) or not isinstance(value, (int, float)) or not math.isfinite(value) or value <= 0:
            issues.append({'code': 'MEASUREMENT_INVALID', 'piece': 'Профиль мерок', 'section': key,
                           'message': 'Нужна положительная конечная мерка в мм, см или дюймах', 'severity': 'error'})
            continue
        if unit != 'mm':
            entry['original_measurement'] = {'value': value, 'unit': unit}
        entry['value'], entry['unit'] = value * FACTORS[unit], 'mm'
    # Only hard geometric contradictions, not population proportions.
    for shorter, longer in (('waist_hip_length', 'seated_depth'), ('seated_depth', 'waist_knee')):
        if shorter in required and longer in required:
            a, b = m.get(shorter, {}).get('value'), m.get(longer, {}).get('value')
            if isinstance(a, (int, float)) and isinstance(b, (int, float)) and a >= b:
                issues.append({'code': 'MEASUREMENT_ORDER', 'piece': 'Профиль мерок', 'section': shorter+' / '+longer,
                               'message': 'Анатомические уровни противоречат друг другу: первый должен быть выше второго', 'severity': 'error'})
    return p, issues
