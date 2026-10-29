"""A bounded DAG; no expressions, eval, recursive auto-repair or arbitrary code."""


class DependencyGraph:
    def __init__(self, edges):
        self.edges = {str(k): list(v) for k, v in edges.items()}
        nodes = set(self.edges)
        nodes.update(n for values in self.edges.values() for n in values)
        if len(nodes) > 256:
            raise ValueError('Слишком большой граф зависимостей')
        self.order = []
        incoming = {n: 0 for n in nodes}
        for values in self.edges.values():
            for n in set(values):
                incoming[n] += 1
        ready = sorted(n for n in nodes if not incoming[n])
        while ready:
            node = ready.pop(0)
            self.order.append(node)
            for n in sorted(set(self.edges.get(node, []))):
                incoming[n] -= 1
                if not incoming[n]:
                    ready.append(n)
                    ready.sort()
        if len(self.order) != len(nodes):
            raise ValueError('Обнаружен цикл конструктивных зависимостей')

    def affected(self, changed):
        reached = set(changed)
        for node in self.order:
            if node in reached:
                reached.update(self.edges.get(node, []))
        return [n for n in self.order if n in reached]


def plan(meta, parameters, previous=None):
    category = meta['category']
    if category in ('trousers', 'jeans', 'shorts', 'underwear','jumpsuit'):
        edges = {'measurements': ['levels', 'panels'], 'levels': ['panels'], 'panels': ['pockets', 'waistband', 'closure'],
                 'pockets': ['assembly'], 'waistband': ['assembly'], 'closure': ['assembly'], 'assembly': ['allowances'], 'allowances': ['validation']}
        mapping = {'waist_drop_mm': ['levels'], 'hip_ease_mm': ['panels'], 'waist_ease_mm': ['panels'],
                   'pocket_width_mm': ['pockets'], 'pocket_depth_mm': ['pockets'], 'belt_width_mm': ['waistband'],
                   'zipper_mm': ['closure'], 'seam_allowance_mm': ['allowances']}
        if category=='jumpsuit':
            edges.update({'measurements':['levels','panels','body'],'body':['sleeve','neck_finish','waist_join'],
                          'sleeve':['assembly'],'neck_finish':['assembly'],'waist_join':['assembly']})
            edges['panels'].append('waist_join')
            mapping.update(chest_ease_mm=['body'],sleeve_length_mm=['sleeve'],torso_length_mm=['body'])
    elif category=='skirt':
        edges={'measurements':['panels'],'panels':['waistband','assembly'],'waistband':['assembly'],'assembly':['allowances'],'allowances':['validation']}
        mapping={'belt_width_mm':['waistband'],'seam_allowance_mm':['allowances']}
    elif category=='headwear':
        edges={'measurements':['gores'],'gores':['headband','assembly'],'headband':['assembly'],'assembly':['allowances'],'allowances':['validation']}
        mapping={'head_ease_mm':['gores'],'height_mm':['gores'],'seam_allowance_mm':['allowances']}
    else:
        edges = {'measurements': ['body'], 'body': ['sleeve', 'neck_finish'], 'sleeve': ['assembly'],
                 'neck_finish': ['assembly'], 'assembly': ['allowances'], 'allowances': ['validation']}
        mapping = {'neck_width_mm': ['body'], 'front_neck_depth_mm': ['body'], 'back_neck_depth_mm': ['body'],
                   'armhole_ease_mm': ['body'], 'shoulder_width_mm': ['body'], 'chest_ease_mm': ['body'],
                   'sleeve_length_mm': ['sleeve'], 'rib_application_extension_percent': ['neck_finish'],
                   'binding_width_mm': ['neck_finish'], 'seam_allowance_mm': ['allowances']}
        if category=='top':
            edges['body']=['arm_binding','neck_finish'];edges['arm_binding']=['assembly'];edges.pop('sleeve')
        if category=='hoodie':edges['body'].append('hood');edges['hood']=['assembly'];mapping.update(hood_height_mm=['hood'],hood_depth_mm=['hood'])
    for key in parameters:
        if key.startswith('utility_'):
            edges.setdefault('pockets',['assembly']);mapping[key]=['pockets']
            if category=='jacket' and 'pockets' not in edges['body']:edges['body'].append('pockets')
        elif key in ('front_crotch_extension_mm','back_crotch_extension_mm'):mapping[key]=['panels']
        elif key in ('torso_ease_mm','bust_dart_tip_offset_mm'):mapping[key]=['body']
        elif key in ('hem_dart_intake_mm','hem_dart_length_mm'):mapping[key]=['panels']
        elif key.startswith('collar_'):mapping[key]=['neck_finish']
        elif key in ('cap_ease_mm','biceps_ease_mm','cuff_height_mm','cuff_circumference_mm'):mapping[key]=['sleeve']
        elif key.startswith(('hand_pocket_','chest_pocket_')):
            edges.setdefault('pockets',['assembly']);mapping[key]=['pockets']
            if 'body' in edges and 'pockets' not in edges['body']:edges['body'].append('pockets')
        edges['parameter:'+key] = mapping.get(key, ['gores' if 'gores' in edges else 'panels' if 'panels' in edges else 'body'])
    graph = DependencyGraph(edges)
    changed = ['parameter:'+k for k,v in parameters.items() if not previous or previous['parameters'].get(k) != v]
    if not previous:
        changed.append('measurements')
    return {'order': graph.order, 'changed': changed, 'affected': graph.affected(changed),
            'cycle_checked': True, 'builder_executions': 1,
            'strategy': 'Один детерминированный пересчёт комплекта по исходным меркам; граф задаёт зависимости и порядок проверки'}
