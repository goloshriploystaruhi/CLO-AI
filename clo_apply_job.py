# -*- coding: utf-8 -*-
import json
import os
import tempfile
import sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from pattern_engine import rectangle
import pattern_api

def apply():
    root = tempfile.gettempdir()
    with open(os.path.join(root, 'clo_ai_job.json'), encoding='utf-8') as f:
        job = json.load(f)
    result = {'id': job['id']}
    try:
        if pattern_api.GetPatternCount() != 0:
            raise RuntimeError('Open an EMPTY test project. Existing project was not changed.')
        points = rectangle(job['width_mm'], job['height_mm'])
        pattern_api.CreatePatternWithPoints(points)
        if pattern_api.GetPatternCount() != 1:
            raise RuntimeError('Creation count check failed. Do not rerun.')
        lengths = [pattern_api.GetLineLength(0, i) for i in range(4)]
        expected = [job['width_mm'], job['height_mm']] * 2
        if any(abs(a-b)>0.01 for a,b in zip(lengths, expected)):
            raise RuntimeError('Dimensions check failed: ' + str(lengths))
        result['line_lengths_mm'] = lengths
    except Exception as error:
        result['error'] = str(error)
    with open(os.path.join(root, 'clo_ai_job_result.json'), 'w', encoding='utf-8') as f:
        json.dump(result, f)
    print(json.dumps(result))

apply()
