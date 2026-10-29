"""Conservative developer-artifact cleanup. Dry run unless --apply is supplied.

Only this checkout is considered. Tracked files, CLO projects, browser profiles,
unknown folders, reparse points and the production runtime are preserved.
"""
import argparse
import collections
import ctypes
import json
import os
from pathlib import Path
import re
import shutil
import stat
import subprocess
import time

PROJECTS = {'.zprj', '.zpac', '.zprj2', '.avt', '.avte', '.val', '.vit', '.fig'}
LINK = getattr(stat, 'FILE_ATTRIBUTE_REPARSE_POINT', 0x400)


def linked(path):
    info = path.lstat()
    return stat.S_ISLNK(info.st_mode) or bool(getattr(info, 'st_file_attributes', 0) & LINK)


def running_electron():
    """Read process image paths only; inaccessible relevant processes fence caches."""
    if os.name != 'nt':
        return set(), False
    from ctypes import wintypes as w
    class Entry(ctypes.Structure):
        _fields_ = [('size', w.DWORD), ('usage', w.DWORD), ('pid', w.DWORD),
                    ('heap', ctypes.c_size_t), ('module', w.DWORD), ('threads', w.DWORD),
                    ('parent', w.DWORD), ('priority', w.LONG), ('flags', w.DWORD), ('exe', w.WCHAR*260)]
    kernel = ctypes.WinDLL('kernel32', use_last_error=True)
    kernel.CreateToolhelp32Snapshot.argtypes = [w.DWORD, w.DWORD];kernel.CreateToolhelp32Snapshot.restype = w.HANDLE
    kernel.Process32FirstW.argtypes = kernel.Process32NextW.argtypes = [w.HANDLE, ctypes.POINTER(Entry)]
    kernel.OpenProcess.argtypes = [w.DWORD, w.BOOL, w.DWORD];kernel.OpenProcess.restype = w.HANDLE
    kernel.QueryFullProcessImageNameW.argtypes = [w.HANDLE, w.DWORD, w.LPWSTR, ctypes.POINTER(w.DWORD)]
    kernel.CloseHandle.argtypes = [w.HANDLE]
    handle = kernel.CreateToolhelp32Snapshot(2, 0)
    if handle in (None, ctypes.c_void_p(-1).value):return set(), False
    paths, complete = set(), True
    try:
        entry = Entry();entry.size = ctypes.sizeof(entry);more = kernel.Process32FirstW(handle, ctypes.byref(entry))
        if not more:return set(), False
        while more:
            if entry.exe.lower().startswith('clo ai') or entry.exe.lower() == 'electron.exe':
                process = kernel.OpenProcess(0x1000, False, entry.pid)
                if not process:complete = False
                else:
                    try:
                        buffer = ctypes.create_unicode_buffer(32768);size = w.DWORD(len(buffer))
                        if kernel.QueryFullProcessImageNameW(process, 0, buffer, ctypes.byref(size)):paths.add(Path(buffer.value).resolve())
                        else:complete = False
                    finally:kernel.CloseHandle(process)
            more = kernel.Process32NextW(handle, ctypes.byref(entry))
    finally:kernel.CloseHandle(handle)
    return paths, complete


class Cleanup:
    def __init__(self, root, tracked=None, now=None, active=None):
        self.root = Path(root).absolute()
        if linked(self.root) or (tracked is None and not (self.root/'.git').is_dir()):raise ValueError('Нужна корневая папка Git-проекта без ссылки')
        self.root = self.root.resolve();self.now = time.time() if now is None else now
        self.tracked = set(tracked) if tracked is not None else set(subprocess.check_output(['git', 'ls-files', '-z'], cwd=self.root).decode('utf-8').split('\0'))
        self.active = running_electron() if active is None else active
        self.prefixes = set()
        for name in self.tracked:
            file = self.root/name
            if file.suffix not in ('.py', '.cjs', '.ps1') or not file.is_file() or name.startswith(('vendor/', 'research/')):continue
            try:lines = file.read_text('utf-8').splitlines()
            except (OSError, UnicodeError):continue
            for line in lines:
                if not any(word in line for word in ('mkdtemp', 'TemporaryDirectory', 'testWorkspace.create')):continue
                for value in re.findall(r'''["']([^"'\n]{1,180})["']''', line):
                    value = value.replace('\\', '/').rsplit('/', 1)[-1]
                    if re.fullmatch(r'[a-zA-Z][a-zA-Z0-9_-]{0,99}-', value):self.prefixes.add(value)
        self.skipped = collections.Counter()

    def inside(self, path):
        candidate = Path(path).absolute()
        if candidate == self.root or self.root not in candidate.resolve().parents:raise ValueError('Удаление за пределами рабочей папки запрещено')
        for part in (candidate, *candidate.parents):
            if part == self.root:break
            if (part.exists() or part.is_symlink()) and linked(part):raise ValueError('Удаление ссылок и junction запрещено')
        return candidate.resolve()

    def report_target(self, path):
        target = self.inside(path);relative = target.relative_to(self.root).as_posix()
        if target.suffix != '.json' or relative in self.tracked or not relative.startswith(('research/', 'reports/structure-cleanup/')):
            raise ValueError('Отчёт разрешён только в research или reports/structure-cleanup, без перезаписи файлов Git')
        return target

    def inspect(self, path):
        path = self.inside(path);files = [];stack = [path]
        while stack:
            current = stack.pop()
            if linked(current):raise ValueError('reparse-point')
            if current.is_dir():
                if current.name in ('Default', 'Profile 1') and any((current.parent/n).exists() for n in ('Local State', 'Preferences')):raise ValueError('browser-profile')
                stack.extend(current.iterdir());continue
            relative = current.relative_to(self.root).as_posix()
            if relative in self.tracked:raise ValueError('tracked-file')
            if current.suffix.lower() in PROJECTS:raise ValueError('project-file')
            if current.name in ('Local State', 'SingletonLock', '.keep'):raise ValueError('browser-or-kept-data')
            info = current.stat();files.append((relative, info.st_size, info.st_dev, info.st_ino, info.st_nlink, info.st_mtime_ns))
        return sorted(files)

    def runtime_kind(self, folder):
        try:return self._runtime_kind(folder)
        except (OSError, ValueError, UnicodeError):return False

    def _runtime_kind(self, folder):
        bootstrap = folder/'resources/app/bootstrap.cjs'
        if not re.fullmatch('[a-f0-9]{20}', folder.name) or not bootstrap.is_file():return False
        match = re.search(r'const entry=path\.resolve\(__dirname,("(?:[^"\\]|\\.)*")\);', bootstrap.read_text('utf-8'))
        if not match:return False
        entry = (bootstrap.parent/json.loads(match.group(1))).resolve()
        if self.root not in entry.parents or entry == self.root/'app/main.cjs':return False
        test = entry.parent == self.root/'app' and entry.name.endswith('-smoke.cjs')
        standalone = entry.parent.name == 'app' and entry.parent.parent.parent == self.root/'research' and entry.parent.parent.name.startswith('автономный запуск & пробелы ')
        if not (test or standalone):return False
        paths, complete = self.active
        return complete and not any(folder.resolve() in p.parents for p in paths)

    def plan(self, age_hours=2, runtimes=False):
        candidates = [];base = self.root/'research'
        if base.is_dir():
            self.inside(base)
            for entry in base.iterdir():
                if entry.name.endswith('-checks'):continue  # Stable smoke-test reports, not mkdtemp ownership.
                if entry.is_dir() and any(entry.name.startswith(p) and re.fullmatch('[a-zA-Z0-9_]{6,12}', entry.name[len(p):]) for p in self.prefixes):
                    if self.now-entry.stat().st_mtime >= age_hours*3600:candidates.append((entry, 'old-test-workspace'))
        for directory in (self.root/'__pycache__', self.root/'engineering/__pycache__', self.root/'third_party/pattern-making/scripts/__pycache__'):
            if directory.is_dir():candidates.append((directory, 'python-cache'))
        if runtimes:
            base = self.root/'vendor/siwc/node_modules/electron/dist/.clo-ai'
            if base.is_dir():
                self.inside(base)
                for entry in base.iterdir():
                    if entry.is_dir() and self.runtime_kind(entry):candidates.insert(0, (entry, 'inactive-test-runtime'))
        records = []
        for path, reason in candidates:
            try:
                files = self.inspect(path);info = path.stat()
                records.append({'path':path.relative_to(self.root).as_posix(), 'reason':reason, 'identity':[info.st_dev, info.st_ino], 'files':files})
            except (OSError, ValueError) as error:self.skipped[str(error)] += 1
        return records

    def apply(self, records):
        removed, retained = [], []
        for record in records:
            try:
                path = self.inside(self.root/record['path']);info = path.stat()
                if [info.st_dev, info.st_ino] != record['identity']:raise ValueError('ownership-changed')
                if record['reason'] == 'inactive-test-runtime':
                    self.active = running_electron()
                    if not self.runtime_kind(path):raise ValueError('runtime-in-use-or-unknown')
                files = self.inspect(path)
                # Link counts legitimately fall as sibling runtime caches are removed.
                # They affect reclaim estimates, never content/ownership identity.
                if [row[:4]+row[5:] for row in files] != [row[:4]+row[5:] for row in record['files']]:raise ValueError('contents-changed')
                shutil.rmtree(path);removed.append(record)
            except (OSError, ValueError) as error:retained.append({'path':record['path'], 'reason':str(error)})
        return removed, retained


def summary(records):
    links = collections.Counter();sizes = {};counts = collections.Counter()
    for record in records:
        counts[record['reason']] += 1
        for _, size, device, inode, nlink, *_ in record['files']:
            key = (device, inode);links[key] += 1;sizes[key] = (size, nlink)
    return {'directories':len(records), 'files':sum(len(r['files']) for r in records), 'logical_bytes':sum(row[1] for r in records for row in r['files']),
            'unique_reclaimable_bytes_estimate':sum(size for key,(size,nlink) in sizes.items() if links[key] >= nlink), 'kinds':dict(counts)}


def main():
    parser = argparse.ArgumentParser(description='Очистка только подтверждённых временных файлов текущего проекта; по умолчанию — просмотр.')
    parser.add_argument('--apply', action='store_true');parser.add_argument('--test-runtimes', action='store_true');parser.add_argument('--min-age-hours', type=float, default=2)
    parser.add_argument('--report', type=Path);args = parser.parse_args()
    if args.min_age_hours < 0:parser.error('Возраст не может быть отрицательным')
    cleaner = Cleanup(Path(__file__).resolve().parent.parent)
    try:target = cleaner.report_target(args.report) if args.report else None
    except ValueError as error:parser.error(str(error))
    records = cleaner.plan(args.min_age_hours, args.test_runtimes)
    result = {'mode':'apply' if args.apply else 'dry-run', 'planned':summary(records), 'protected':dict(cleaner.skipped)}
    if args.apply:
        removed, retained = cleaner.apply(records);result.update(removed=summary(removed), retained=retained)
    if target:
        target.parent.mkdir(parents=True, exist_ok=True);target.write_text(json.dumps(result, ensure_ascii=False, indent=2), 'utf-8')
    print(json.dumps(result, ensure_ascii=False, indent=2))


if __name__ == '__main__':main()
