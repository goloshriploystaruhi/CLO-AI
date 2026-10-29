"""Детерминированная геометрия; все размеры в миллиметрах."""
import math


def rectangle(width_mm, height_mm):
    for value in (width_mm, height_mm):
        if isinstance(value, bool) or not isinstance(value, (int, float)):
            raise ValueError('Размер должен быть числом')
        if not math.isfinite(value) or not 1 <= value <= 10000:
            raise ValueError('Размер должен быть от 1 до 10000 мм')
    return [(0.0, 0.0, 0), (float(width_mm), 0.0, 0),
            (float(width_mm), float(height_mm), 0), (0.0, float(height_mm), 0)]
