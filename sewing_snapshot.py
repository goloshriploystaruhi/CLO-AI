"""Read-only evidence for the single-seam CLO 7.0.228 experiment.

This deliberately narrow diagnostic reads observed tagged fields in a PAC saved
by CLO. It is not an SDK, a production sewing reader, or a file-format writer.
Unknown/ambiguous layouts fail closed. Native UI verification is still required.
"""
import hashlib
import io
import re
import struct
import zipfile


def _member(archive, suffix):
    entries=[n for n in archive.infolist() if n.filename.lower().endswith(suffix)]
    if len(entries)!=1 or entries[0].file_size>64*1024*1024:
        raise ValueError('Неоднозначный или слишком большой диагностический архив')
    return archive.read(entries[0])


def _field(data, tag, fmt):
    if data.count(tag)!=1:raise ValueError('Неоднозначное поле шва: '+tag.decode())
    offset=data.index(tag)+len(tag)
    try:return struct.unpack_from(fmt,data,offset)[0]
    except struct.error as error:raise ValueError('Неполное поле шва') from error


def inspect_pac(data):
    marker=b'mapSeamLinePairGroup'
    offsets=[m.end() for m in re.finditer(marker+rb'(?!WithHalfSymmetry)',data)]
    if len(offsets)!=1:raise ValueError('Не найдена однозначная таблица соединений')
    offset=offsets[0];tag=b'listSeamLinePairGroup'
    start=data.find(tag,offset,offset+64)
    if start<0:raise ValueError('Неизвестная структура таблицы соединений')
    try:count=struct.unpack_from('<I',data,start+len(tag))[0]
    except struct.error as error:raise ValueError('Неполная таблица соединений') from error
    if count==0:return {'group_count':0,'seams':[]}
    if count!=1:raise ValueError('Диагностика предназначена только для одного пробного шва')
    end=data.find(b'mapSeamLinePairGroupWithHalfSymmetry',start)
    block=data[start:end if end>=0 else len(data)]
    names=re.findall(rb'qsName(Sewing_\d+)qsTrimTypeUTF8',block)
    if len(names)!=1 or block.count(b'mapSeamLinePairList')!=1:
        raise ValueError('Неоднозначная группа пробного шва')
    # Group table tag contains the same prefix; inspect only the pair-list block.
    pairs=block[block.index(b'mapSeamLinePairList'):]
    pair_count=_field(pairs,b'listSeamLinePair','<I')
    if pair_count!=1:raise ValueError('В группе должно быть ровно одно соединение')
    ends=[]
    for n,stop in ((0,b'mapSeamLine1'),(1,b'mapSeamLinePairProperty')):
        tag=('mapSeamLine'+str(n)).encode()
        if pairs.count(tag)!=1 or pairs.count(stop)!=1:raise ValueError('Неоднозначная сторона шва')
        side=pairs[pairs.index(tag)+len(tag):pairs.index(stop)]
        if side.count(b'arrMeshPointIndex')!=1:raise ValueError('Неизвестная структура стороны шва')
        side=side[:side.index(b'arrMeshPointIndex')]
        values={name:_field(side,name.encode(),fmt) for name,fmt in (
            ('uiSelfIndex','<I'),('uiShapeIndex','<I'),('uiDepth','<I'),
            ('uiStartIndex','<I'),('uiEndIndex','<I'),('fRatioStart','<f'),('fRatioEnd','<f'),('bDirection','<?'))}
        if not 0<=values['fRatioStart']<=values['fRatioEnd']<=1:raise ValueError('Некорректные границы участка')
        ends.append(values)
    return {'group_count':1,'seams':[{'name':names[0].decode(),'pair_count':pair_count,'ends':ends}]}


def inspect_project(path):
    with zipfile.ZipFile(path) as project:
        avatars=[hashlib.sha256(project.read(n)).hexdigest() for n in project.infolist() if n.filename.lower().endswith('.avt')]
        with zipfile.ZipFile(io.BytesIO(_member(project,'.zpac'))) as garment:
            result=inspect_pac(_member(garment,'.pac'))
    result.update({'avatar_sha256':avatars,'diagnostic_format':'observed_clo_7_0_228_single_seam','read_only':True})
    return result
