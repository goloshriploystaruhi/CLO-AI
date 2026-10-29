"""Read-only runtime capability evidence; never starts simulation."""


def probe(pattern_api,utility_api=None,export_api=None):
    sewing=[n for n in dir(pattern_api) if 'sew' in n.lower() and callable(getattr(pattern_api,n,None))]
    selection=[n for n in dir(pattern_api) if 'select' in n.lower() and callable(getattr(pattern_api,n,None))]
    fields=[n for api in (pattern_api,utility_api) if api for n in dir(api) if any(k in n.lower() for k in ('strain','stress','tension')) and callable(getattr(api,n,None))]
    avatars=None
    if export_api and callable(getattr(export_api,'GetAvatarCount',None)):
        try:avatars=int(export_api.GetAvatarCount())
        except Exception:pass
    return {'pattern_api_sewing_functions':sewing,'pattern_api_selection_functions':selection,
            'seamline_pair_api_callable':callable(getattr(pattern_api,'AddSeamlinePairGroup',None)),
            'automatic_sewing_supported':False,'sewing_readback_supported':False,'automatic_arrangement_supported':False,
            'avatar_count':avatars,'active_avatar_identifiable':False,'simulation_status_readback':False,
            'physical_field_functions':fields,'simulate_callable':bool(utility_api and callable(getattr(utility_api,'Simulate',None))),
            'arrangement_callable':callable(getattr(pattern_api,'SetArrangement',None)),
            'automated_fit_verified':False,
            'workflow':'manual_review_required',
            'note':'Перечень функций не подтверждает выполнение операций. Наличие Simulate само по себе не обеспечивает сшивание, размещение, физические измерения или правильную посадку.'}
