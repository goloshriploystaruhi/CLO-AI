"""Generate a mathematical fixture without reading a user's saved CLO scene."""
from copy import deepcopy
from functools import lru_cache


@lru_cache(maxsize=1)
def _model():
    from qa_scenarios import fixture
    from engineering.pipeline import build
    profile,parameters=fixture('tshirt_setin_engineering_v1')
    return build('tshirt_setin_engineering_v1',profile,parameters)['garment']


def tshirt():
    return deepcopy(_model())
