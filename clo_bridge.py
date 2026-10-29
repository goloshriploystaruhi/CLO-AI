# -*- coding: utf-8 -*-
"""Session bridge using bundled Qt or the installing Windows UI thread."""
import builtins
import importlib
import json
import os
import tempfile
import time
import sys

NATIVE_OPERATIONS=frozenset(('create','inspect','validate','measure','qa_measure','delete',
                            'assembly_preflight','simulate_confirmed','sewing_test_prepare',
                            'sewing_test_inspect','sewing_test_cleanup'))

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from pattern_engine import rectangle
import pattern_api
import export_api
import clo_adapter
import pattern_recipes
import contour_engine
import parametric_patterns
import semantic_patterns
import geometry_validation
import garment_engine
import tshirt_engine
import utility_api
import project_context
import clo_operations
import assembly_workflow
importlib.reload(contour_engine)
importlib.reload(importlib.import_module('clo_curves'))
importlib.reload(parametric_patterns)
importlib.reload(semantic_patterns)
importlib.reload(geometry_validation)
importlib.reload(garment_engine)
importlib.reload(tshirt_engine)
importlib.reload(importlib.import_module('category_constructors'))
# An already running older client may not yet ship this optional new module.
# Existing methods remain usable until CLO AI restarts and syncs all sources.
if os.path.isfile(os.path.join(os.path.dirname(os.path.abspath(__file__)),'utility_constructors.py')):
    importlib.reload(importlib.import_module('utility_constructors'))
if os.path.isfile(os.path.join(os.path.dirname(os.path.abspath(__file__)),'reference_constructors.py')):
    importlib.reload(importlib.import_module('reference_constructors'))
if os.path.isfile(os.path.join(os.path.dirname(os.path.abspath(__file__)),'development_engine.py')):
    importlib.reload(importlib.import_module('development_engine'))
if os.path.exists(os.path.join(os.path.dirname(__file__), 'patternmaking_recipes.py')):
    importlib.reload(importlib.import_module('patternmaking_recipes'))
if os.path.exists(os.path.join(os.path.dirname(__file__), 'parametric_design.py')):
    importlib.reload(importlib.import_module('parametric_design'))
importlib.reload(project_context)
for module_name in ('methods','measurements','dependencies','geometry','assembly','fit','quality','validation','report','pipeline','native','clo_capabilities'):
    importlib.reload(importlib.import_module('engineering.'+module_name))
if os.path.isfile(os.path.join(os.path.dirname(os.path.abspath(__file__)),'engineering','pattern_constraints.py')):
    importlib.reload(importlib.import_module('engineering.pattern_constraints'))
importlib.reload(pattern_recipes)
importlib.reload(clo_adapter)
importlib.reload(importlib.import_module('clo_updates'))
importlib.reload(clo_operations)
importlib.reload(importlib.import_module('sewing_plan'))
importlib.reload(importlib.import_module('sewing_map'))
importlib.reload(assembly_workflow)
if os.path.isfile(os.path.join(os.path.dirname(os.path.abspath(__file__)),'operation_events.py')):
    importlib.reload(importlib.import_module('operation_events'))

QtCore = QtWidgets = None
for package in ('PySide2', 'PyQt5'):
    try:
        QtCore = importlib.import_module(package + '.QtCore')
        QtWidgets = importlib.import_module(package + '.QtWidgets')
        break
    except ImportError:
        pass
application = QtWidgets.QApplication.instance() if QtWidgets else None
if QtCore is not None and (application is None or QtCore.QThread.currentThread() != application.thread()):
    raise RuntimeError('CLO bridge: not on the CLO UI thread. No changes made.')


class WindowsTimer:
    def __init__(self, tick):
        import ctypes
        from ctypes import wintypes
        self.api = ctypes.WinDLL('user32', use_last_error=True)
        kernel = ctypes.WinDLL('kernel32', use_last_error=True)
        kernel.GetCurrentThreadId.restype = wintypes.DWORD
        self.thread = kernel.GetCurrentThreadId()
        self.api.GetWindowThreadProcessId.argtypes = [wintypes.HWND, ctypes.POINTER(wintypes.DWORD)]
        self.api.GetWindowThreadProcessId.restype = wintypes.DWORD
        self.api.IsWindowVisible.argtypes = [wintypes.HWND]
        enum_type = ctypes.WINFUNCTYPE(wintypes.BOOL, wintypes.HWND, wintypes.LPARAM)
        threads = []
        @enum_type
        def collect(hwnd, unused):
            pid = wintypes.DWORD()
            thread = self.api.GetWindowThreadProcessId(hwnd, ctypes.byref(pid))
            if pid.value == os.getpid() and self.api.IsWindowVisible(hwnd):
                threads.append(thread)
            return True
        self.api.EnumWindows.argtypes = [enum_type, wintypes.LPARAM]
        self.api.EnumWindows(collect, 0)
        if not threads or any(thread != self.thread for thread in threads):
            raise RuntimeError('CLO bridge: UI thread check failed. No changes made.')
        callback_type = ctypes.WINFUNCTYPE(None, wintypes.HWND, wintypes.UINT, ctypes.c_size_t, wintypes.DWORD)
        def callback(hwnd, message, timer_id, timestamp):
            try:
                if kernel.GetCurrentThreadId() == self.thread:
                    tick()
            except BaseException:
                pass  # Never unwind Python exceptions into the native message loop.
        self.callback = callback_type(callback)
        self.api.SetTimer.argtypes = [wintypes.HWND, ctypes.c_size_t, wintypes.UINT, callback_type]
        self.api.SetTimer.restype = ctypes.c_size_t
        self.api.KillTimer.argtypes = [wintypes.HWND, ctypes.c_size_t]
        self.id = self.api.SetTimer(None, 0, 500, self.callback)
        if not self.id:
            raise ctypes.WinError(ctypes.get_last_error())

    def stop(self):
        if self.id:
            self.api.KillTimer(None, self.id)
            self.id = 0


class Bridge:
    def __init__(self):
        self.root = tempfile.gettempdir()
        self.session = str(__import__('uuid').uuid4())
        self.seen = set()
        self.running = False
        self.revision = self.read_revision()
        self.update_error = None
        self.project_observer=project_context.ProjectObserver()
        self.project_snapshot=None
        self.project_polled_at=0
        self.project_refresh_nonce=None
        self.research_nonce=None
        if QtCore:
            self.timer = QtCore.QTimer(application)
            self.timer.timeout.connect(self.tick)
            self.timer.start(500)
        else:
            self.timer = WindowsTimer(self.tick)

    def read_revision(self):
        try:
            with open(os.path.join(self.root, 'clo_ai_bridge_update.json'), encoding='utf-8') as f:
                return json.load(f)['revision']
        except (OSError, ValueError, KeyError):
            return None

    def write(self, name, data):
        target = os.path.join(self.root, name)
        with open(target + '.tmp', 'w', encoding='utf-8') as f:
            json.dump(data, f)
        os.replace(target + '.tmp', target)

    def publish_state(self,busy=None):
        state={'session':self.session,'pid':os.getpid(),'heartbeat':time.time(),
               'version':3,'auto_update':True,'update_error':self.update_error,
               'project_protocol':1,'project':self.project_snapshot,
               'project_refresh_nonce':self.project_refresh_nonce}
        if busy:state['native_busy']=busy
        self.write('clo_ai_bridge.json',state)

    def sample_project(self,force=False,known_mutation=False):
        nonce=None
        try:
            with open(os.path.join(self.root,'clo_ai_context_refresh.json'),encoding='utf-8') as f:nonce=json.load(f).get('nonce')
        except (OSError,ValueError):pass
        if not force and nonce==self.project_refresh_nonce and time.monotonic()-self.project_polled_at<1.5:return self.project_snapshot
        try:
            snapshot=project_context.read_snapshot(pattern_api,utility_api)
            self.project_snapshot=self.project_observer.observe(snapshot,known_mutation)
        except Exception as error:
            self.project_snapshot={'available':False,'message':'Не удалось прочитать текущий проект CLO: '+str(error)}
        self.project_polled_at=time.monotonic();self.project_refresh_nonce=nonce
        return self.project_snapshot

    def research_probe(self):
        """Fixed read-only API inventory; no arbitrary code or mutation channel."""
        request=os.path.join(self.root,'clo_ai_research_request.json')
        try:
            with open(request,encoding='utf-8') as f:nonce=json.load(f).get('nonce')
        except (OSError,ValueError):return
        if not isinstance(nonce,str) or not nonce or len(nonce)>100 or nonce==self.research_nonce:return
        self.research_nonce=nonce
        report={'nonce':nonce,'mutations_performed':False,'modules':{},'reads':{},'python_version':sys.version,'pid':os.getpid(),'builtin_modules':list(sys.builtin_module_names)}
        for name in ('pattern_api','utility_api','export_api','import_api','fabric_api','rest_api'):
            try:
                module=importlib.import_module(name)
                names=[n for n in dir(module) if not n.startswith('_')]
                candidates=[n for n in names if any(k in n.lower() for k in ('sew','seamline','arrang','simulat','avatar','json'))]
                report['modules'][name]={'names':names,'relevant':{n:str(getattr(module,n).__doc__ or '')[:12000] for n in candidates}}
            except Exception as error:report['modules'][name]={'error':str(error)}
        for module,name,args in ((utility_api,'GetMajorVersion',()),(utility_api,'GetMinorVersion',()),(utility_api,'GetPatchVersion',()),
                                 (export_api,'GetAvatarCount',()),(pattern_api,'GetArrangementList',()),(pattern_api,'GetSeamlinePairGroupCount',())):
            fn=getattr(module,name,None)
            if callable(fn):
                try:report['reads'][name]=fn(*args)
                except Exception as error:report['reads'][name]={'error':str(error)}
        report['project']=self.sample_project(force=True)
        report['arrangement_by_pattern']=[]
        for i in range(min(pattern_api.GetPatternCount(),30)):
            try:report['arrangement_by_pattern'].append({'index':i,'information':pattern_api.GetArrangementOfPattern(i)})
            except Exception as error:report['arrangement_by_pattern'].append({'index':i,'error':str(error)})
        self.write('clo_ai_research_result.json',report)

    def tick(self):
        if self.running:
            return
        self.running = True
        try:
            revision = self.read_revision()
            if revision and revision != self.revision:
                self.revision = revision
                try:
                    target = os.path.join(self.root, 'clo_bridge.py')
                    with open(target, encoding='utf-8') as f:
                        code = compile(f.read(), target, 'exec')
                    exec(code, {'__file__': target, '__name__': '__clo_bridge__'})
                    return
                except Exception as error:
                    self.update_error = str(error)
            self.sample_project()
            self.research_probe()
            self.publish_state()
            target = os.path.join(self.root, 'clo_ai_apply.json')
            if not os.path.exists(target):
                return
            with open(target, encoding='utf-8') as f:
                job = json.load(f)
            if job.get('session') != self.session or job['id'] in self.seen:
                return
            self.seen.add(job['id'])  # Never retry a possibly applied operation.
            result = {'id': job['id'],'project_guard':job.get('project_guard')}
            operation=job.get('operation','create')
            if operation in NATIVE_OPERATIONS:
                # Every guarded native call blocks this UI-thread timer, not
                # just simulation. Keep the connection during creation/backup/QA.
                self.publish_state({'job_id':job['id'],'operation':operation,
                                    'pid':os.getpid(),'started_at':time.time()})
            dispatched=False
            try:
                current=self.sample_project(force=True)
                if not current or not current.get('available'):raise ValueError('Не удалось прочитать проект CLO. Команда не применена')
                try:
                    with open(os.path.join(self.root,'clo_ai_context_session.json'),encoding='utf-8') as f:active_context=json.load(f)
                except (OSError,ValueError):active_context={}
                self.project_observer.guard(job.get('project_guard'),current,active_context)
                dispatched=True
                result.update(clo_operations.dispatch(job, pattern_api, export_api,utility_api))
                result['project_guard']=job['project_guard']
            except Exception as error:
                result['error'] = str(error)
                if hasattr(error,'qa_report'):result['qa_report']=error.qa_report
                if hasattr(error,'transaction'):result['transaction']=error.transaction
                if hasattr(error,'execution_events'):result['execution_events']=error.execution_events
            finally:
                # A failed/rolled-back operation can also have exported a backup
                # or changed geometry. Publish actual readback and clear busy now.
                result['project_snapshot']=self.sample_project(force=True,known_mutation=dispatched)
                self.publish_state()
            self.write('clo_ai_job_result.json', result)
        except Exception as error:
            print('CLO bridge: ' + str(error))
        finally:
            self.running = False


previous = getattr(builtins, '_clo_ai_bridge', None)
replacement = Bridge()
if previous:
    replacement.session = previous.session
    replacement.seen = previous.seen
    if hasattr(previous,'project_observer'):
        replacement.project_observer=project_context.ProjectObserver(previous.project_observer.state)
    previous.timer.stop()
builtins._clo_ai_bridge = replacement
print('CLO AI bridge started. Keep CLO running.')
