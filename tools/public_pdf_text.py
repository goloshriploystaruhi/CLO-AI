"""Bounded text-only PDF research worker; never opens URLs, files or actions.

Uses the existing pypdf distribution (BSD-3-Clause), not CLO's Python runtime.
Input is a PDF byte stream on stdin; output is one JSON object on stdout.
"""
import io
import json
import logging
import os
import re
import sys

MAX_INPUT = 2 * 1024 * 1024
MAX_STREAM = 1024 * 1024
MAX_PAGES = 12
MAX_TEXT = 24000
MEMORY = 256 * 1024 * 1024
_job = None


def constrain_memory():
    global _job
    if os.name != 'nt':
        import resource
        resource.setrlimit(resource.RLIMIT_AS, (MEMORY, MEMORY))
        return
    import ctypes as c
    from ctypes import wintypes as w

    class Basic(c.Structure):
        _fields_ = [('process_time', c.c_int64), ('job_time', c.c_int64),
                    ('flags', w.DWORD), ('min_ws', c.c_size_t), ('max_ws', c.c_size_t),
                    ('processes', w.DWORD), ('affinity', c.c_size_t),
                    ('priority', w.DWORD), ('scheduling', w.DWORD)]

    class Counters(c.Structure):
        _fields_ = [(name, c.c_uint64) for name in
                    ('read_ops', 'write_ops', 'other_ops', 'read_bytes', 'write_bytes', 'other_bytes')]

    class Extended(c.Structure):
        _fields_ = [('basic', Basic), ('io', Counters), ('process_memory', c.c_size_t),
                    ('job_memory', c.c_size_t), ('peak_process', c.c_size_t), ('peak_job', c.c_size_t)]

    kernel = c.WinDLL('kernel32', use_last_error=True)
    kernel.CreateJobObjectW.argtypes = [c.c_void_p, w.LPCWSTR]
    kernel.CreateJobObjectW.restype = w.HANDLE
    kernel.SetInformationJobObject.argtypes = [w.HANDLE, c.c_int, c.c_void_p, w.DWORD]
    kernel.SetInformationJobObject.restype = w.BOOL
    kernel.GetCurrentProcess.restype = w.HANDLE
    kernel.AssignProcessToJobObject.argtypes = [w.HANDLE, w.HANDLE]
    kernel.AssignProcessToJobObject.restype = w.BOOL
    _job = kernel.CreateJobObjectW(None, None)
    limits = Extended()
    limits.basic.flags = 0x100  # JOB_OBJECT_LIMIT_PROCESS_MEMORY, this worker only.
    limits.process_memory = MEMORY
    if not _job or not kernel.SetInformationJobObject(_job, 9, c.byref(limits), c.sizeof(limits)) or not kernel.AssignProcessToJobObject(_job, kernel.GetCurrentProcess()):
        raise RuntimeError('memory guard unavailable')


def failed(reason, message):
    return {'error': message, 'reason': reason, 'recoverable': True, 'format': 'pdf'}


def extract(data):
    if len(data) > MAX_INPUT:
        return failed('too_large', 'PDF слишком велик для исследования.')
    if b'%PDF-' not in data[:1024]:
        return failed('invalid_pdf', 'Полученный ресурс не является PDF.')
    try:
        constrain_memory()
    except Exception:
        return failed('unavailable', 'Не удалось ограничить ресурсы чтения PDF. Выберите текстовый источник.')
    try:
        from pypdf import PdfReader, filters
        from pypdf.errors import LimitReachedError
    except ImportError:
        return failed('unavailable', 'Библиотека чтения PDF недоступна. Выберите текстовый источник.')
    # pypdf 6.x bounds decompression before allocation. Do not silently run an
    # older library without these guards on untrusted research documents.
    caps = ('ZLIB_MAX_OUTPUT_LENGTH', 'LZW_MAX_OUTPUT_LENGTH',
            'RUN_LENGTH_MAX_OUTPUT_LENGTH', 'MAX_ARRAY_BASED_STREAM_OUTPUT_LENGTH',
            'MAX_DECLARED_STREAM_LENGTH', 'JBIG2_MAX_OUTPUT_LENGTH')
    if not all(hasattr(filters, name) for name in caps):
        return failed('unavailable', 'Доступная версия чтения PDF не поддерживает ограничения распаковки.')
    for name in caps:
        setattr(filters, name, MAX_STREAM)
    logging.getLogger('pypdf').setLevel(logging.CRITICAL)
    try:
        reader = PdfReader(io.BytesIO(data), strict=False)
        if reader.is_encrypted:
            return failed('encrypted', 'PDF защищён паролем. Выберите другой общедоступный источник.')
        page_count = len(reader.pages)
        chunks, read_pages, skipped, total = [], [], [], 0
        text_limited = False
        for index in range(min(page_count, MAX_PAGES)):
            try:
                page = reader.pages[index]
                content = page.get_contents()
                if content is not None and len(content.get_data()) > MAX_STREAM:
                    skipped.append({'page': index + 1, 'reason': 'resource_limit'})
                    continue
                text = page.extract_text() or ''
                text = re.sub(r'[\x00-\x08\x0b\x0c\x0e-\x1f]', '', text).strip()
                read_pages.append(index + 1)
                if text:
                    remaining = MAX_TEXT - total
                    segment = ('\n\n' if chunks else '') + text
                    chunks.append(segment[:remaining])
                    total += min(len(segment), remaining)
                    if len(segment) > remaining or total == MAX_TEXT:
                        text_limited = True
                        break
            except (MemoryError, LimitReachedError):
                skipped.append({'page': index + 1, 'reason': 'resource_limit'})
            except Exception:
                skipped.append({'page': index + 1, 'reason': 'unreadable_page'})
        if not chunks:
            if any(page['reason'] == 'resource_limit' for page in skipped):
                return failed('resource_limit', 'Содержимое PDF превышает ограничения безопасного чтения. Выберите другой источник.')
            return failed('no_text', 'В PDF не найден текстовый слой. Изображения и схемы этим инструментом не анализировались; выберите текстовый источник.')
        title = str((reader.metadata or {}).get('/Title', '') or '')
        title = re.sub(r'[\x00-\x1f]', '', title)[:250]
        return {'format': 'pdf', 'text': ''.join(chunks), 'title': title,
                'page_count': page_count, 'pages_read': len(read_pages),
                'coverage': {'complete': len(read_pages) == page_count and not text_limited and not skipped,
                             'read_pages': read_pages, 'skipped_pages': skipped,
                             'pages_limited': page_count > MAX_PAGES,
                             'text_limited': text_limited,
                             'images_analyzed': False, 'ocr_performed': False}}
    except (MemoryError, LimitReachedError):
        return failed('resource_limit', 'PDF превышает ограничения безопасного чтения.')
    except Exception:
        return failed('invalid_pdf', 'Не удалось разобрать PDF. Выберите другой источник.')


if __name__ == '__main__':
    try:
        result = extract(sys.stdin.buffer.read(MAX_INPUT + 1))
    except BaseException:
        result = failed('invalid_pdf', 'Не удалось безопасно прочитать PDF.')
    sys.stdout.write(json.dumps(result, ensure_ascii=True))
