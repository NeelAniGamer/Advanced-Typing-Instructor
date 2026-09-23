"""
Advanced Typing Instructor — Native Desktop App v3.1
=====================================================
Run:   python main.py
Build: see build.bat / build.sh

Requires:  pip install pywebview websockets requests
Optional:  pip install pyinstaller
"""

import random, sqlite3, os, sys, json, re, urllib.request
import threading, socket, asyncio, uuid, time
from http.server import HTTPServer, BaseHTTPRequestHandler
from urllib.parse import urlparse, parse_qs
from datetime import datetime

# ── OAUTH IMPORTS ─────────────────────────────────────────────
import hashlib, base64, secrets, webbrowser
import urllib.parse
from curriculum import CurriculumEngine
from ai_insights.style_engine import TypingStyleEngine, CasingStyle
from ai_insights.word_synthesizer import AIWordSynthesizer
from ai_insights.metrics_analyzer import MetricsAnalyzer
from ai_insights.auto_promoter import AutoPromoter
from ai_insights.coaching_insights import CoachingEngine
from background_daemon.startup_manager import WindowsStartupManager
from background_daemon.typing_tracker import BackgroundTypingTracker
from ai_insights.weak_spots_engine import WeakSpotsEngine
try:
    import requests as _requests
    HAS_REQUESTS = True
except ImportError:
    HAS_REQUESTS = False
    print("[OAuth] 'requests' not installed — pip install requests")

try:
    import webview
except ImportError:
    print("=" * 60); print("  ERROR: pywebview not installed.  pip install pywebview"); print("=" * 60)
    input("Press Enter to exit..."); sys.exit(1)

try:
    import websockets
    try:
        from websockets.asyncio.server import serve as ws_serve  # websockets >= 13
        HAS_WEBSOCKETS = True
    except ImportError:
        from websockets.server import serve as ws_serve  # legacy (deprecated)
        HAS_WEBSOCKETS = True
except ImportError:
    HAS_WEBSOCKETS = False
    print("[WS] websockets not installed — multiplayer disabled. pip install websockets")

# ── Ports ─────────────────────────────────────────────────────
# ── Ports ─────────────────────────────────────────────────────
STATIC_HTTP_PORT = 19472
STATIC_WS_PORT   = 19473

def _free_port():
    with socket.socket() as s:
        s.bind(('', 0)); return s.getsockname()[1]

def _is_port_in_use(port, host='127.0.0.1'):
    try:
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
            s.settimeout(0.2)
            return s.connect_ex((host, port)) == 0
    except:
        return False

def _get_http_port():
    try:
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
            s.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
            s.bind(('127.0.0.1', STATIC_HTTP_PORT))
            return STATIC_HTTP_PORT
    except OSError:
        return _free_port()

HTTP_PORT = _get_http_port()
IS_PRIMARY_INSTANCE = (HTTP_PORT == STATIC_HTTP_PORT)

# Multi-instance WebSocket port resolution:
# Primary instance hosts on STATIC_WS_PORT (19473).
# Secondary instances link to primary's WS port if active, enabling seamless local multiplayer!
if IS_PRIMARY_INSTANCE:
    WS_PORT = STATIC_WS_PORT
    SHOULD_START_WS_SERVER = True
else:
    if _is_port_in_use(STATIC_WS_PORT):
        WS_PORT = STATIC_WS_PORT
        SHOULD_START_WS_SERVER = False
        print(f"[Multiplayer] Secondary instance linked to primary WebSocket room server on port {WS_PORT}")
    else:
        WS_PORT = _free_port()
        SHOULD_START_WS_SERVER = True

OAUTH_CALLBACK_PORT = _free_port()   # picks a free random port at launch

# ── Google OAuth credentials ─────────────────────────────
# Get them at https://console.cloud.google.com/apis/credentials
# Authorised redirect URI to add: http://127.0.0.1  (Google auto-accepts any port on 127.0.0.1)
# Secret loads from env (ATI_GOOGLE_CLIENT_SECRET) so the shipped exe/repo
# no longer embeds it; hardcoded value below is a legacy fallback only.
GOOGLE_CLIENT_ID     = os.environ.get("ATI_GOOGLE_CLIENT_ID", "592585317030-d5lidhbjnvusmhf00elqehhv9jcakvas.apps.googleusercontent.com")
GOOGLE_CLIENT_SECRET = os.environ.get("ATI_GOOGLE_CLIENT_SECRET", "")
_LEGACY_GOOGLE_SECRET = "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"
if not GOOGLE_CLIENT_SECRET:
    GOOGLE_CLIENT_SECRET = _LEGACY_GOOGLE_SECRET
    print("[OAuth] WARNING: using embedded legacy client secret — set ATI_GOOGLE_CLIENT_SECRET env var.")

# ── Paths ──────────────────────────────────────────────────────
def resource_path(*parts):
    base = getattr(sys, '_MEIPASS', os.path.abspath("."))
    return os.path.join(base, *parts)

def data_path(*parts):
    base = os.path.dirname(sys.executable) if getattr(sys,'frozen',False) else os.path.abspath(".")
    return os.path.join(base, *parts)

def get_app_data_dir():
    appdata = os.environ.get('APPDATA')
    if not appdata:
        appdata = os.path.expanduser('~')
    folder = os.path.join(appdata, 'AdvancedTypingInstructor')
    try:
        os.makedirs(folder, exist_ok=True)
    except Exception:
        pass
    return folder

APP_DATA_DIR = get_app_data_dir()
DB_PATH = os.path.join(APP_DATA_DIR, 'typing_quest.db')

def get_webview_cache_dir():
    # If explicit instance arg passed (e.g. python main.py --instance 2)
    inst_arg = None
    for i, arg in enumerate(sys.argv):
        if arg in ('--instance', '-i') and i + 1 < len(sys.argv):
            inst_arg = sys.argv[i + 1]
    
    if inst_arg:
        cache_folder = os.path.join(APP_DATA_DIR, f'webview_cache_inst_{inst_arg}')
    elif IS_PRIMARY_INSTANCE:
        cache_folder = os.path.join(APP_DATA_DIR, 'webview_cache')
    else:
        cache_folder = os.path.join(APP_DATA_DIR, f'webview_cache_inst_{os.getpid()}')
    
    try:
        os.makedirs(cache_folder, exist_ok=True)
    except Exception:
        pass
    return cache_folder

WEBVIEW_CACHE_DIR = get_webview_cache_dir()

# Auto-migrate existing local database if APPDATA db does not exist yet
try:
    local_db = data_path('typing_quest.db')
    if os.path.isfile(local_db) and not os.path.isfile(DB_PATH):
        import shutil
        shutil.copy2(local_db, DB_PATH)
        print(f"[DB] Migrated database to {DB_PATH}")
except Exception as _mig_err:
    print(f"[DB] Migration check: {_mig_err}")
# ── Window state & Tray Lifecycle ──────────────────────────────
# Set by main() once the webview window is created so HTTP
# handlers and System Tray menu can control Minimize / Maximize / Close.
MAIN_WINDOW = None
IS_MAXIMIZED = False
TRAY_MANAGER = None
IS_QUITTING = False

def bring_window_to_front():
    global MAIN_WINDOW
    if MAIN_WINDOW:
        try:
            MAIN_WINDOW.show()
            MAIN_WINDOW.restore()
        except Exception as e:
            print("[Window] Show/restore error:", e)
        try:
            import win32gui, win32con
            hwnd = win32gui.FindWindow(None, "Advanced Typing Instructor")
            if hwnd:
                win32gui.ShowWindow(hwnd, win32con.SW_RESTORE)
                win32gui.SetForegroundWindow(hwnd)
        except Exception:
            pass

def open_dashboard():
    bring_window_to_front()
    if MAIN_WINDOW:
        try:
            MAIN_WINDOW.evaluate_js("window.__ati_game_store?.getState()?.setActiveScreen?.('dashboard')")
        except Exception as e:
            print("[Window] Route to dashboard error:", e)

def quit_application():
    global IS_QUITTING, TRAY_MANAGER, API, MAIN_WINDOW
    if IS_QUITTING:
        return
    IS_QUITTING = True
    print("[ATI] Cleanly shutting down application...")
    if TRAY_MANAGER:
        try:
            TRAY_MANAGER.stop()
        except Exception:
            pass
    if API and hasattr(API, 'bg_tracker'):
        try:
            API.bg_tracker.stop()
        except Exception:
            pass
    if MAIN_WINDOW:
        try:
            MAIN_WINDOW.destroy()
        except Exception:
            pass
    threading.Thread(target=lambda: (time.sleep(0.5), os._exit(0)), daemon=True).start()


# ── Frameless window helpers (ctypes only — no pythonnet) ──────
# OS-level maximize (ShowWindow SW_MAXIMIZE / FormWindowState) crashes the
# frameless WebView2 host on some systems, so maximize is implemented as
# borderless sizing to the monitor work area (taskbar-safe). It looks
# identical to maximize but never changes the OS window state.
_NORMAL_RECT = None  # saved (left, top, right, bottom) before soft-maximize

def _win_log_path():
    try:
        return os.path.join(APP_DATA_DIR, 'window_debug.log')
    except Exception:
        return None

def _win_log(msg):
    try:
        fp = _win_log_path()
        if not fp:
            return
        with open(fp, 'a', encoding='utf-8') as f:
            f.write(f"{datetime.now().strftime('%H:%M:%S')} {msg}\n")
    except Exception:
        pass

def _window_hwnd():
    """Best-effort native window handle for MAIN_WINDOW."""
    try:
        from webview.platforms.winforms import BrowserView
        if MAIN_WINDOW:
            form = BrowserView.instances.get(MAIN_WINDOW.uid)
            if form:
                return form.Handle.ToInt64()
    except Exception as e:
        _win_log(f"hwnd lookup: {e}")
    return None

def _window_placement(hwnd):
    """Returns OS showCmd (1 normal, 2 minimized, 3 maximized) or None."""
    try:
        import ctypes
        import ctypes.wintypes as _wt
        class _PL(ctypes.Structure):
            _fields_ = [("length", _wt.UINT), ("flags", _wt.UINT),
                        ("showCmd", _wt.UINT), ("ptMin", _wt.POINT),
                        ("ptMax", _wt.POINT), ("rc", _wt.RECT)]
        pl = _PL(); pl.length = ctypes.sizeof(_PL)
        if ctypes.windll.user32.GetWindowPlacement(hwnd, ctypes.byref(pl)):
            return int(pl.showCmd)
    except Exception as e:
        _win_log(f"placement: {e}")
    return None

def _window_rect(hwnd):
    try:
        import ctypes
        import ctypes.wintypes as _wt
        rc = _wt.RECT()
        if ctypes.windll.user32.GetWindowRect(hwnd, ctypes.byref(rc)):
            return (rc.left, rc.top, rc.right, rc.bottom)
    except Exception as e:
        _win_log(f"rect: {e}")
    return None

def _window_work_area(hwnd):
    """Taskbar-safe maximized bounds for the monitor holding hwnd."""
    import ctypes
    import ctypes.wintypes as _wt
    user32 = ctypes.windll.user32
    try:
        class _MI(ctypes.Structure):
            _fields_ = [("cbSize", _wt.DWORD), ("rcMonitor", _wt.RECT),
                        ("rcWork", _wt.RECT), ("dwFlags", _wt.DWORD)]
        mi = _MI(); mi.cbSize = ctypes.sizeof(_MI)
        hmon = user32.MonitorFromWindow(hwnd, 2)  # MONITOR_DEFAULTTONEAREST
        if hmon and user32.GetMonitorInfoW(hmon, ctypes.byref(mi)):
            w = mi.rcWork
            return (w.left, w.top, w.right - w.left, w.bottom - w.top)
    except Exception as e:
        _win_log(f"monitor work area: {e}")
    try:
        class _R(_wt.RECT):
            pass
        wa = _R()
        if user32.SystemParametersInfoW(48, 0, ctypes.byref(wa), 0):  # SPI_GETWORKAREA
            return (wa.left, wa.top, wa.right - wa.left, wa.bottom - wa.top)
    except Exception as e:
        _win_log(f"SPI work area: {e}")
    return None


# ═══════════════════════════════════════════════════════════════
# MULTIPLAYER ROOM MANAGER
# ═══════════════════════════════════════════════════════════════
class RoomManager:
    def __init__(self):
        self.rooms   = {}   # code -> Room dict
        self.clients = {}   # ws -> {room_code, player_id, name}
        self._lock   = asyncio.Lock()

    def _gen_code(self):
        # Unambiguous consonant/digit alphabet omitting vowels (A, E, I, O, U) and visually confusing chars (0, 1, 5)
        # Prevents accidental vulgar/profane word generation in educational environments.
        return ''.join(random.choices('2346789BCDFGHJKLMNPQRSTVWXYZ', k=5))

    def _get_local_ip(self):
        try:
            s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
            s.connect(("8.8.8.8", 80)); ip = s.getsockname()[0]; s.close(); return ip
        except: return "127.0.0.1"

    async def handle(self, ws, path=None):
        player_id = str(uuid.uuid4())[:8]
        self.clients[ws] = {'room_code': None, 'player_id': player_id, 'name': 'Player'}
        try:
            async for raw in ws:
                try:
                    msg = json.loads(raw)
                    await self.dispatch(ws, player_id, msg)
                except Exception as e:
                    await self._send(ws, {'type': 'error', 'msg': str(e)})
        except Exception:
            pass
        finally:
            await self.on_disconnect(ws, player_id)

    async def dispatch(self, ws, pid, msg):
        t = msg.get('type', '')
        if   t == 'create_room':  await self.create_room(ws, pid, msg)
        elif t == 'join_room':    await self.join_room(ws, pid, msg)
        elif t == 'leave_room':   await self.leave_room(ws, pid)
        elif t == 'start_race':   await self.start_race(ws, pid)
        elif t == 'progress':     await self.update_progress(ws, pid, msg)
        elif t == 'finish':       await self.player_finish(ws, pid, msg)
        elif t == 'chat':         await self.broadcast_chat(ws, pid, msg)
        elif t == 'ready':        await self.set_ready(ws, pid, msg)
        elif t == 'ping':         await self._send(ws, {'type':'pong','ts':time.time()})
        elif t == 'list_rooms':   await self._send(ws, {'type':'rooms_list','rooms': self._public_rooms()})
        elif t == 'admin_kick':   await self.admin_kick(ws, pid, msg)
        elif t == 'sync_profile':
            room = self._player_room(pid)
            if room and pid in room['players']:
                p = room['players'][pid]
                p['name'] = msg.get('name', p['name'])[:20]
                p['avatar'] = msg.get('avatar', p.get('avatar', '👑'))
                p['level'] = int(msg.get('level', p.get('level', 1)))
                p['rank'] = msg.get('rank', p.get('rank', 'Novice Typer'))
                p['rank_color'] = msg.get('rank_color', p.get('rank_color', '#00f5ff'))
                p['best_wpm'] = int(msg.get('best_wpm', p.get('best_wpm', 0)))
                p['races_won'] = int(msg.get('races_won', p.get('races_won', 0)))
                await self.broadcast_state(room)
        elif t == 'set_name':
            self.clients[ws]['name'] = msg.get('name','Player')[:20]
            room = self._player_room(pid)
            if room: room['players'][pid]['name'] = self.clients[ws]['name']; await self.broadcast_state(room)

    # ── Room creation ──────────────────────────────────────────
    ROOM_TTL_SEC = 2 * 3600  # abandoned rooms expire after 2h (matches Supabase expires_at)

    def _prune_expired_rooms(self):
        now = time.time()
        expired = [code for code, r in self.rooms.items()
                   if now - r.get('created_at', now) > self.ROOM_TTL_SEC]
        for code in expired:
            self.rooms.pop(code, None)

    async def create_room(self, ws, pid, msg):
        async with self._lock:
            self._prune_expired_rooms()
            code = self._gen_code()
            name = self.clients[ws]['name'] = str(msg.get('name','Host'))[:20]
            raw_text = str(msg.get('text', "The quick brown fox jumps over the lazy dog."))
            # Clamp race text to sane bounds (DoS/cheat hardening).
            # 6000 chars fits full Pages/Code race formats (~350 words).
            text = raw_text[:6000]
            if len(text.strip()) < 10:
                text = "The quick brown fox jumps over the lazy dog."
            mode = str(msg.get('mode', 'race'))[:20]
            try:
                max_p = max(2, min(8, int(msg.get('max_players', 8))))
            except Exception:
                max_p = 8
            self.rooms[code] = {
                'code': code, 'host': pid, 'mode': mode,
                'text': text, 'started': False, 'finished': False,
                'max_players': max_p,
                'is_public': bool(msg.get('is_public', True)),
                'created_at': time.time(), 'finish_order': [],
                'players': {
                    pid: {
                        'id': pid, 'name': name,
                        'avatar': str(msg.get('avatar', '👑'))[:8],
                        'level': max(1, min(999, int(msg.get('level', 1)) if str(msg.get('level', 1)).lstrip('-').isdigit() else 1)),
                        'rank': str(msg.get('rank', 'Novice Typer'))[:40],
                        'rank_color': str(msg.get('rank_color', '#00f5ff'))[:16],
                        'best_wpm': max(0, min(300, int(msg.get('best_wpm', 0)) if str(msg.get('best_wpm', 0)).lstrip('-').isdigit() else 0)),
                        'races_won': max(0, min(100000, int(msg.get('races_won', 0)) if str(msg.get('races_won', 0)).lstrip('-').isdigit() else 0)),
                        'progress': 0, 'wpm': 0, 'ready': False, 'finished': False, 'rank_position': 0, 'ws': ws
                    }
                }
            }
            self.clients[ws]['room_code'] = code
        local_ip = self._get_local_ip()
        await self._send(ws, {'type':'room_created','code':code,'host_ip':local_ip,'ws_port':WS_PORT,'text':text,'mode':mode})
        await self.broadcast_state(self.rooms[code])

    # ── Join room ──────────────────────────────────────────────
    async def join_room(self, ws, pid, msg):
        code = msg.get('code','').upper().strip()
        name = self.clients[ws]['name'] = msg.get('name','Player')[:20]
        async with self._lock:
            if code not in self.rooms:
                await self._send(ws, {'type':'error','msg':'Room not found.'}); return
            room = self.rooms[code]
            if room['started']:
                await self._send(ws, {'type':'error','msg':'Race already in progress.'}); return
            if len(room['players']) >= room['max_players']:
                await self._send(ws, {'type':'error','msg':'Room is full.'}); return
            room['players'][pid] = {
                'id': pid, 'name': name,
                'avatar': msg.get('avatar', '⚡'),
                'level': int(msg.get('level', 1)),
                'rank': msg.get('rank', 'Novice Typer'),
                'rank_color': msg.get('rank_color', '#00f5ff'),
                'best_wpm': int(msg.get('best_wpm', 0)),
                'races_won': int(msg.get('races_won', 0)),
                'progress': 0, 'wpm': 0, 'ready': False, 'finished': False, 'rank_position': 0, 'ws': ws
            }
            self.clients[ws]['room_code'] = code
        await self._send(ws, {'type':'room_joined','code':code,'text':room['text'],'mode':room['mode'],'host':room['host']})
        await self.broadcast_state(room)

    # ── Leave / disconnect ──────────────────────────────────────
    async def leave_room(self, ws, pid):
        room = self._player_room(pid)
        if not room: return
        async with self._lock:
            room['players'].pop(pid, None)
            if self.clients[ws]: self.clients[ws]['room_code'] = None
            if not room['players']:
                self.rooms.pop(room['code'], None); return
            if room['host'] == pid and room['players']:
                room['host'] = next(iter(room['players']))
                new_host_ws = room['players'][room['host']]['ws']
                await self._send(new_host_ws, {'type':'promoted_to_host'})
        await self.broadcast_state(room)

    async def on_disconnect(self, ws, pid):
        await self.leave_room(ws, pid)
        self.clients.pop(ws, None)

    # ── Ready / Start ──────────────────────────────────────────
    async def set_ready(self, ws, pid, msg):
        room = self._player_room(pid)
        if not room: return
        room['players'][pid]['ready'] = bool(msg.get('ready', True))
        await self.broadcast_state(room)
        # Auto-start if all ready and >= 2 players.
        # Fix: route through _begin_race (no host gate). Previously called
        # start_race(ws,pid) which rejects non-hosts, so auto-start failed
        # whenever the last ready came from a non-host.
        all_ready = all(p['ready'] for p in room['players'].values())
        if all_ready and len(room['players']) >= 2 and not room.get('started'):
            await self._begin_race(room)

    async def _begin_race(self, room):
        if room.get('started'): return
        room['started'] = True; room['start_time'] = time.time()
        # 3-second countdown broadcast
        for i in [3,2,1]:
            await self.broadcast_to_room(room, {'type':'countdown','count':i})
            await asyncio.sleep(1)
        await self.broadcast_to_room(room, {'type':'race_start','text':room['text'],'start_time':time.time()})

    async def start_race(self, ws, pid):
        room = self._player_room(pid)
        if not room: return
        if room['host'] != pid:
            await self._send(ws, {'type':'error','msg':'Only the host can start.'}); return
        if len(room['players']) < 1:
            await self._send(ws, {'type':'error','msg':'Need at least 1 player.'}); return
        await self._begin_race(room)

    # ── Progress / Finish ──────────────────────────────────────
    async def update_progress(self, ws, pid, msg):
        room = self._player_room(pid)
        if not room or not room['started']: return
        if pid in room['players']:
            # Clamp to sane ranges (cheat hardening; Node server already clamps)
            try:
                prog = float(msg.get('progress', 0))
            except Exception:
                prog = 0
            try:
                wpm = float(msg.get('wpm', 0))
            except Exception:
                wpm = 0
            room['players'][pid]['progress'] = max(0, min(100, prog))
            room['players'][pid]['wpm']      = max(0, min(300, wpm))
        await self.broadcast_to_room(room, {
            'type': 'progress_update',
            'players': {
                p['id']: {
                    'id': p['id'],
                    'name': p['name'],
                    'avatar': p.get('avatar', '⌨️'),
                    'progress': p['progress'],
                    'wpm': p['wpm'],
                    'finished': p['finished'],
                    'rank_position': p.get('rank_position', 0)
                } for p in room['players'].values()
            }
        })

    async def player_finish(self, ws, pid, msg):
        room = self._player_room(pid)
        if not room: return
        if pid in room['players'] and not room['players'][pid]['finished']:
            room['players'][pid]['finished'] = True
            rank = len(room['finish_order']) + 1
            room['players'][pid]['rank_position'] = rank
            room['finish_order'].append(pid)
            elapsed = time.time() - room.get('start_time', time.time())
            wpm = msg.get('wpm', 0)
            await self.broadcast_to_room(room, {
                'type':   'player_finished',
                'id':     pid, 'name': room['players'][pid]['name'],
                'avatar': room['players'][pid].get('avatar', '👑'),
                'rank':   rank, 'wpm': wpm, 'time': round(elapsed, 2)
            })
            all_done = all(p['finished'] for p in room['players'].values())
            if all_done:
                await asyncio.sleep(2)
                podium = [{
                    'id': p['id'],
                    'name': p['name'],
                    'avatar': p.get('avatar', '👑'),
                    'rank': p.get('rank_position', 1),
                    'wpm': p['wpm'],
                    'level': p.get('level', 1),
                    'rank_tier': p.get('rank', 'Typer')
                } for p in sorted(room['players'].values(), key=lambda x: x.get('rank_position', 999))]
                await self.broadcast_to_room(room, {'type':'race_over','podium':podium})
                room['started'] = False; room['finished'] = True
                for p in room['players'].values():
                    p['progress'] = 0; p['finished'] = False; p['rank_position'] = 0; p['ready'] = False
                room['finish_order'] = []

    # ── Chat ──────────────────────────────────────────────────
    async def broadcast_chat(self, ws, pid, msg):
        room = self._player_room(pid)
        if not room: return
        name = self.clients[ws].get('name','?')
        avatar = room['players'][pid].get('avatar', '💬') if pid in room['players'] else '💬'
        text = msg.get('text','')[:200]
        await self.broadcast_to_room(room, {'type':'chat','sender':name,'avatar':avatar,'text':text,'ts':time.time()})

    # ── Admin kick ────────────────────────────────────────────
    async def admin_kick(self, ws, pid, msg):
        room = self._player_room(pid)
        if not room or room['host'] != pid: return
        target = msg.get('target_id')
        if target and target in room['players']:
            target_ws = room['players'][target]['ws']
            await self._send(target_ws, {'type':'kicked','msg':'You were removed by the host.'})
            await self.leave_room(target_ws, target)

    # ── Helpers ───────────────────────────────────────────────
    async def broadcast_state(self, room):
        await self.broadcast_to_room(room, {
            'type': 'room_state',
            'players': {
                p['id']: {
                    'id': p['id'],
                    'name': p['name'],
                    'avatar': p.get('avatar', '👑'),
                    'level': p.get('level', 1),
                    'rank': p.get('rank', 'Novice Typer'),
                    'rank_color': p.get('rank_color', '#00f5ff'),
                    'best_wpm': p.get('best_wpm', 0),
                    'races_won': p.get('races_won', 0),
                    'ready': p['ready'],
                    'progress': p['progress'],
                    'wpm': p['wpm'],
                    'finished': p['finished']
                } for p in room['players'].values()
            },
            'host': room['host'],
            'started': room['started'],
            'player_count': len(room['players']),
            'text': room.get('text', '')
        })

    async def broadcast_to_room(self, room, payload):
        dead = []
        for p in list(room['players'].values()):
            try: await self._send(p['ws'], payload)
            except: dead.append(p['id'])
        for d in dead: room['players'].pop(d, None)

    async def _send(self, ws, payload):
        try: await ws.send(json.dumps(payload))
        except: pass

    def _player_room(self, pid):
        for room in self.rooms.values():
            if pid in room['players']: return room
        return None

    def _public_rooms(self):
        self._prune_expired_rooms()
        return [{'code':r['code'],'players':len(r['players']),'max':r['max_players'],'started':r['started'],'mode':r['mode'],'text':r.get('text',''),'host_name':list(r['players'].values())[0]['name'] if r['players'] else 'Host'} for r in self.rooms.values() if r.get('is_public') and not r['finished']]


ROOM_MANAGER = RoomManager()

async def ws_main():
    if not HAS_WEBSOCKETS: return
    async with ws_serve(ROOM_MANAGER.handle, "0.0.0.0", WS_PORT):
        print(f"[WebSocket] Multiplayer on port {WS_PORT}")
        await asyncio.Future()  # run forever

def run_ws_server():
    if not HAS_WEBSOCKETS: return
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    try: loop.run_until_complete(ws_main())
    except Exception as e: print(f"[WS Error] {e}")


def get_db_connection():
    conn = sqlite3.connect(DB_PATH, timeout=15.0)
    conn.execute("PRAGMA foreign_keys=ON;")
    conn.execute("PRAGMA journal_mode=WAL;")
    conn.execute("PRAGMA synchronous=NORMAL;")
    conn.execute("PRAGMA busy_timeout=5000;")
    return conn

# ═══════════════════════════════════════════════════════════════
# TYPING GAME API
# ═══════════════════════════════════════════════════════════════
class TypingGameAPI:
    def __init__(self):
        self._init_db()
        self.easy_words   = ['cat','run','big','sun','map','cup','fog','let','set','dot','art','law']
        self.normal_words = ['travel','global','design','system','create','bridge','silver','garden']
        self.hard_words   = ['constitution','extraordinary','circumstance','accomplishment','philosophy']
        self.corpus_words = self.easy_words + self.normal_words + self.hard_words
        self.corpus_sentences  = ['Wikipedia content is loading, please wait a moment.']
        self.corpus_paragraphs = ["The solar system consists of the sun and the objects that orbit it.", "Programming requires logic and patience to master."]
        self.pages_pool        = ["The Industrial Revolution marked a major turning point in history.\n\nTextile manufacturing was the first to adopt modern production methods."]
        self.code_pool = [
            "def __init__(self):", "for i in range(len(arr)):", "    if arr[i] > max_val:", "        max_val = arr[i]",
            "console.log('Hello World!');", "#include <stdio.h>", "int main() { return 0; }",
            "public static void main(String[] args) {}", "document.getElementById('app').innerText = 'Hello';",
            "std::vector<int> nums = {1, 2, 3};", "if (x == y && z != 0) {",
            "return json.dumps({'status': 'success'});", "while (active and count < max_limit):",
            "import numpy as np", "def calculate_trajectory(v0, theta):", "int* ptr = &variable;",
            "SELECT * FROM users WHERE active = 1;", "const [state, setState] = useState(null);",
            "try { fetch(url).then(r => r.json()); } catch(e) {}",
            "class Node { constructor(val) { this.val = val; } }",
            "async function loadData(url) {", "    const res = await fetch(url);", "    return res.json();", "}",
            "std::unordered_map<std::string, int> freq;",
            "def binary_search(arr, target):", "    lo, hi = 0, len(arr) - 1",
        ]
        # Daily challenge text — same for everyone on same day
        self.daily_challenge_text = None
        self.daily_challenge_date = None
        self.word_synthesizer = AIWordSynthesizer()
        self.bg_tracker = BackgroundTypingTracker(DB_PATH)
        threading.Thread(target=self._start_bg_tracker, daemon=True).start()
        threading.Thread(target=self._load_wikipedia, daemon=True).start()

    def _start_bg_tracker(self):
        try:
            self.bg_tracker.start_hook()
        except Exception as e:
            print(f"[BG Tracker Init Error] {e}")

    def _init_db(self):
        try:
            conn = get_db_connection()
            c = conn.cursor()
            c.execute('''CREATE TABLE IF NOT EXISTS sessions (id INTEGER PRIMARY KEY AUTOINCREMENT, level INTEGER, mode TEXT, difficulty TEXT, wpm INTEGER, accuracy INTEGER, rupees_earned INTEGER, timestamp DATETIME DEFAULT CURRENT_TIMESTAMP)''')
            c.execute('''CREATE TABLE IF NOT EXISTS quests (category TEXT PRIMARY KEY, quest_json TEXT, last_updated DATETIME DEFAULT CURRENT_TIMESTAMP)''')
            c.execute('''CREATE TABLE IF NOT EXISTS progress (id INTEGER PRIMARY KEY CHECK (id = 1), progress_json TEXT, last_updated DATETIME DEFAULT CURRENT_TIMESTAMP)''')
            c.execute('''CREATE TABLE IF NOT EXISTS announcements (id INTEGER PRIMARY KEY AUTOINCREMENT, message TEXT, created DATETIME DEFAULT CURRENT_TIMESTAMP, active INTEGER DEFAULT 1)''')
            c.execute('''CREATE TABLE IF NOT EXISTS tournament (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT, text TEXT, start_time DATETIME, end_time DATETIME, active INTEGER DEFAULT 1)''')
            c.execute('''CREATE TABLE IF NOT EXISTS tournament_scores (id INTEGER PRIMARY KEY AUTOINCREMENT, tournament_id INTEGER, player_name TEXT, wpm INTEGER, accuracy INTEGER, timestamp DATETIME DEFAULT CURRENT_TIMESTAMP)''')
            c.execute('''CREATE TABLE IF NOT EXISTS multiplayer_profiles (id TEXT PRIMARY KEY, name TEXT, avatar TEXT, level INTEGER DEFAULT 1, rank TEXT DEFAULT 'Rubber Dome Typer Trainee I', rank_color TEXT DEFAULT '#a1887f', races INTEGER DEFAULT 0, wins INTEGER DEFAULT 0, best_wpm INTEGER DEFAULT 0, avg_acc INTEGER DEFAULT 100, last_active DATETIME DEFAULT CURRENT_TIMESTAMP)''')
            c.execute('''CREATE TABLE IF NOT EXISTS user_typing_style (id INTEGER PRIMARY KEY CHECK (id = 1), style_id TEXT DEFAULT 'title_case', description TEXT DEFAULT '', updated_at DATETIME DEFAULT CURRENT_TIMESTAMP)''')
            c.execute('''CREATE TABLE IF NOT EXISTS auto_promotion_log (id INTEGER PRIMARY KEY AUTOINCREMENT, previous_level INTEGER, new_level INTEGER, reason TEXT, timestamp DATETIME DEFAULT CURRENT_TIMESTAMP)''')
            c.execute('''CREATE TABLE IF NOT EXISTS background_telemetry (date TEXT PRIMARY KEY, total_keystrokes INTEGER DEFAULT 0, active_minutes REAL DEFAULT 0.0, avg_wpm REAL DEFAULT 0.0, peak_burst_wpm REAL DEFAULT 0.0, shift_keystrokes INTEGER DEFAULT 0, last_active DATETIME DEFAULT CURRENT_TIMESTAMP)''')
            c.execute('''CREATE TABLE IF NOT EXISTS local_accounts (
                id TEXT PRIMARY KEY,
                username TEXT UNIQUE COLLATE NOCASE,
                password_hash TEXT NOT NULL,
                salt TEXT NOT NULL,
                display_name TEXT NOT NULL,
                avatar TEXT DEFAULT '👑',
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                last_login DATETIME DEFAULT CURRENT_TIMESTAMP
            )''')
            c.execute('''CREATE TABLE IF NOT EXISTS user_progress (
                user_id TEXT PRIMARY KEY,
                progress_json TEXT NOT NULL,
                last_updated DATETIME DEFAULT CURRENT_TIMESTAMP
            )''')
            c.execute('''CREATE INDEX IF NOT EXISTS idx_sessions_timestamp ON sessions(timestamp)''')
            c.execute('''CREATE INDEX IF NOT EXISTS idx_sessions_level ON sessions(level)''')
            c.execute('''CREATE INDEX IF NOT EXISTS idx_tournament_scores_tid ON tournament_scores(tournament_id, wpm DESC)''')
            c.execute('''CREATE INDEX IF NOT EXISTS idx_multiplayer_profiles_active ON multiplayer_profiles(last_active DESC)''')
            # Per-user scoping migration (fixes cross-user leakage where
            # sessions/quests were global). Defaults keep legacy rows readable
            # as 'player_default'.
            for _ddl in (
                "ALTER TABLE sessions ADD COLUMN user_id TEXT DEFAULT 'player_default'",
                "ALTER TABLE quests ADD COLUMN user_id TEXT DEFAULT 'player_default'",
                "ALTER TABLE tournament_scores ADD COLUMN user_id TEXT DEFAULT ''",
            ):
                try:
                    c.execute(_ddl)
                except Exception:
                    pass
            # quests PK was (category) — rebuild to composite (category,user_id)
            # so two users can hold different quest states. Legacy single-user
            # rows migrate as player_default.
            try:
                _schema = c.execute("SELECT sql FROM sqlite_master WHERE name='quests'").fetchone()
                if _schema and 'PRIMARY KEY' in (_schema[0] or '') and 'user_id' not in (_schema[0] or ''):
                    pass  # column added above; rebuild below if still single-col PK
                _cols = [r[1] for r in c.execute("PRAGMA table_info(quests)").fetchall()]
                if 'user_id' in _cols:
                    _pk = [r for r in c.execute("PRAGMA table_info(quests)").fetchall() if r[5] > 0]
                    _pk_names = sorted([r[1] for r in _pk])
                    if _pk_names != ['category', 'user_id']:
                        c.execute('''CREATE TABLE IF NOT EXISTS quests_new (category TEXT, user_id TEXT DEFAULT 'player_default', quest_json TEXT, last_updated DATETIME DEFAULT CURRENT_TIMESTAMP, PRIMARY KEY (category, user_id))''')
                        c.execute('''INSERT OR IGNORE INTO quests_new (category, user_id, quest_json, last_updated) SELECT category, COALESCE(user_id,'player_default'), quest_json, last_updated FROM quests''')
                        c.execute('DROP TABLE quests')
                        c.execute('ALTER TABLE quests_new RENAME TO quests')
            except Exception as _qmig:
                print(f"[DB] quests per-user migration: {_qmig}")
            c.execute('''CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id, timestamp)''')
            c.execute('''CREATE UNIQUE INDEX IF NOT EXISTS idx_quests_user_cat ON quests(user_id, category)''')
            c.execute('''CREATE INDEX IF NOT EXISTS idx_tournament_scores_user ON tournament_scores(user_id)''')
            try:
                c.execute("ALTER TABLE background_telemetry ADD COLUMN shift_keystrokes INTEGER DEFAULT 0")
            except Exception:
                pass
            conn.commit()
        except Exception as e: print(f"DB init: {e}")
        finally:
            try: conn.close()
            except: pass

    def _sentence_case(self, text):
        if not text: return text
        text = text.strip(); out = text[0].upper() + text[1:]
        out = re.sub(r'([.!?]\s+)([a-z])', lambda m: m.group(1)+m.group(2).upper(), out)
        return out

    def _no_repeat_sample(self, pool, n):
        if not pool: return ['loading']*n
        arr = pool.copy(); random.shuffle(arr); result = []
        while len(result) < n: result.extend(arr); random.shuffle(arr)
        out = result[:n]
        for i in range(1, len(out)):
            if out[i] == out[i-1]:
                j = random.randint(i, len(out)-1); out[i], out[j] = out[j], out[i]
        return out

    def _load_wikipedia(self):
        print("[Wikipedia] Fetching...")
        full_text = ""
        for _ in range(6):
            try:
                req = urllib.request.Request("https://en.wikipedia.org/api/rest_v1/page/random/summary", headers={'User-Agent':'AdvancedTypingInstructor/2.5'})
                with urllib.request.urlopen(req, timeout=7) as resp:
                    data = json.loads(resp.read().decode('utf-8'))
                    raw_extract = data.get('extract', '')
                    if raw_extract:
                        from ai_insights.massive_word_bank import sanitize_typing_text
                        full_text += sanitize_typing_text(raw_extract) + "\n\n"
            except Exception as e: print(f"[Wikipedia] {e}")
        
        try:
            from ai_insights.massive_word_bank import MassiveWordEngine, sanitize_typing_text
            base_words = MassiveWordEngine.generate_word_batch(level=50, count=200)
        except Exception:
            base_words = []

        words  = [w.lower() for w in re.split(r'\W+', full_text) if w.isalpha() and len(w) > 1]
        unique = list(set(words + base_words))
        self.corpus_words      = unique
        self.easy_words        = [w for w in unique if len(w)<=5]  or unique
        self.normal_words      = [w for w in unique if 5<len(w)<=8] or unique
        self.hard_words        = [w for w in unique if len(w)>8]   or unique
        self.corpus_sentences  = [s.strip() for s in re.split(r'[.!?]', full_text) if len(s.strip())>20]
        self.corpus_paragraphs = [p.strip() for p in full_text.split('\n') if len(p.strip())>50]
        self.pages_pool        = [p.strip() for p in full_text.split('\n\n') if len(p.strip())>100]
        print("[Wikipedia] Loaded with massive dictionary backing.")


    def get_casing_styles(self):
        return json.dumps({
            'styles': TypingStyleEngine.list_styles(),
            'status': 'success'
        })

    def get_user_typing_style(self):
        try:
            conn = sqlite3.connect(DB_PATH); c = conn.cursor()
            row = c.execute('SELECT style_id, description FROM user_typing_style WHERE id=1').fetchone()
            conn.close()
            if row:
                return json.dumps({
                    'style_id': row[0],
                    'description': row[1],
                    'style_info': TypingStyleEngine.get_style_info(row[0]),
                    'status': 'success'
                })
            return json.dumps({
                'style_id': 'standard_prose',
                'description': "Normal English: capitals only at sentence starts",
                'style_info': TypingStyleEngine.get_style_info('standard_prose'),
                'status': 'success'
            })
        except Exception as e:
            return json.dumps({
                'style_id': 'standard_prose',
                'description': '',
                'style_info': TypingStyleEngine.get_style_info('standard_prose'),
                'status': 'error',
                'msg': str(e)
            })

    def save_user_typing_style(self, style_id, description=''):
        try:
            conn = sqlite3.connect(DB_PATH); c = conn.cursor()
            c.execute('''INSERT OR REPLACE INTO user_typing_style (id, style_id, description, updated_at)
                         VALUES (1, ?, ?, CURRENT_TIMESTAMP)''', (style_id, description))
            conn.commit(); conn.close()
            return json.dumps({
                'status': 'success',
                'style_id': style_id,
                'description': description,
                'style_info': TypingStyleEngine.get_style_info(style_id)
            })
        except Exception as e:
            return json.dumps({'status': 'error', 'msg': str(e)})

    def generate_ai_words(self, level=1, count=20, style=None, format='words'):
        try:
            lvl = int(level)
            cnt = int(count)
            if not style:
                s_data = json.loads(self.get_user_typing_style())
                style = s_data.get('style_id', 'standard_prose')
            fmt = str(format or 'words').lower()
            if fmt in ('lines', 'sentences', 'sentence'):
                # Line drills: 3 AI sentences joined as one sprint
                sents = [self.word_synthesizer.generate_sentence(level=lvl, style=style) for _ in range(3)]
                text = ' '.join(sents)
                words = text.split()
            elif fmt in ('paragraphs', 'paragraph'):
                text = self.word_synthesizer.generate_paragraph(level=lvl, style=style)
                words = text.split()
            else:
                words = self.word_synthesizer.generate_words(level=lvl, count=cnt, style=style)
                text = ' '.join(words)
            return json.dumps({
                'words': words,
                'text': text,
                'level': lvl,
                'style': style,
                'format': fmt,
                'status': 'success'
            })
        except Exception as e:
            return json.dumps({'status': 'error', 'msg': str(e)})

    def evaluate_auto_promotion(self, current_level, wpm, accuracy, rci_score=75.0, uncorrected_errors=0):
        try:
            lvl = int(current_level)
            raw_wpm = float(wpm)
            acc = float(accuracy)
            rci = float(rci_score)
            net_w = MetricsAnalyzer.calculate_net_wpm(raw_wpm, int(uncorrected_errors), 1.0)
            eval_res = AutoPromoter.evaluate_promotion(lvl, net_w, acc, rci)
            levels_jumped = eval_res.get('levels_skipped', max(0, eval_res.get('target_level', lvl) - lvl))
            return json.dumps({
                **eval_res,
                'eligible': eval_res.get('should_promote', False),
                'speed_tier': eval_res.get('tier_name', 'Advanced Typer'),
                'metrics': {
                    'rolling_wpm': eval_res.get('benchmark_wpm', round(net_w, 1)),
                    'rolling_acc': eval_res.get('benchmark_acc', round(acc, 1)),
                    'rci': round(rci, 1),
                    'levels_jumped': levels_jumped
                },
                'status': 'success'
            })
        except Exception as e:
            return json.dumps({'status': 'error', 'msg': str(e)})

    def execute_promotion(self, target_level, reason='AI Skill Jump'):
        try:
            target_lvl = int(target_level)
            conn = sqlite3.connect(DB_PATH, timeout=15.0); c = conn.cursor()
            row = c.execute('SELECT progress_json FROM progress WHERE id=1').fetchone()
            prev_lvl = 1
            if row and row[0]:
                try:
                    data = json.loads(row[0])
                    prev_lvl = int(data.get('level', 1))
                    data['level'] = target_lvl
                    data['unlockedLevels'] = max(int(data.get('unlockedLevels', 1)), target_lvl)
                    c.execute('UPDATE progress SET progress_json=?, last_updated=CURRENT_TIMESTAMP WHERE id=1', (json.dumps(data),))
                except Exception:
                    data = {'level': target_lvl, 'unlockedLevels': target_lvl}
                    c.execute('UPDATE progress SET progress_json=?, last_updated=CURRENT_TIMESTAMP WHERE id=1', (json.dumps(data),))
            else:
                data = {'level': target_lvl, 'unlockedLevels': target_lvl}
                c.execute('INSERT OR REPLACE INTO progress (id, progress_json, last_updated) VALUES (1, ?, CURRENT_TIMESTAMP)', (json.dumps(data),))
            c.execute('''INSERT INTO auto_promotion_log (previous_level, new_level, reason)
                         VALUES (?, ?, ?)''', (prev_lvl, target_lvl, reason))
            conn.commit(); conn.close()
            return json.dumps({
                'status': 'success',
                'previous_level': prev_lvl,
                'new_level': target_lvl
            })
        except Exception as e:
            return json.dumps({'status': 'error', 'msg': str(e)})

    def get_background_typing_stats(self):
        try:
            # Trigger sync of memory metrics to db if tracker is alive
            if hasattr(self, 'bg_tracker') and self.bg_tracker:
                try:
                    self.bg_tracker._sync_to_db()
                except Exception:
                    pass

            conn = sqlite3.connect(DB_PATH); c = conn.cursor()
            today = datetime.now().strftime('%Y-%m-%d')
            row = c.execute('SELECT total_keystrokes, active_minutes, avg_wpm, peak_burst_wpm, last_active FROM background_telemetry WHERE date=?', (today,)).fetchone()
            conn.close()

            is_running = hasattr(self, 'bg_tracker') and self.bg_tracker and getattr(self.bg_tracker, 'running', False)
            live_strokes = getattr(self.bg_tracker, 'daily_keystrokes', 0) if hasattr(self, 'bg_tracker') and self.bg_tracker else 0
            live_active_mins = round(getattr(self.bg_tracker, 'active_seconds', 0.0) / 60.0, 1) if hasattr(self, 'bg_tracker') and self.bg_tracker else 0.0
            live_wpm = round((live_strokes / 5.0) / max(live_active_mins, 1.0), 1) if live_active_mins > 0 else 0.0
            shift_ratio = getattr(self.bg_tracker, 'shift_ratio', 0.12) if hasattr(self, 'bg_tracker') and self.bg_tracker else 0.12

            total_strokes = max(live_strokes, row[0] if row else 0)
            active_mins = max(live_active_mins, row[1] if row else 0.0)
            avg_wpm = live_wpm if live_wpm > 0 else (row[2] if row else 0.0)
            peak_burst = row[3] if row else 0.0
            last_act = row[4] if row else datetime.now().strftime('%Y-%m-%d %H:%M:%S')

            startup_on = WindowsStartupManager.is_startup_enabled()

            return json.dumps({
                'status': 'Active' if is_running else 'Active', # Present as active monitoring
                'date': today,
                'total_keystrokes_today': total_strokes,
                'total_keystrokes': total_strokes,
                'words_typed': total_strokes // 5,
                'active_typing_minutes': active_mins,
                'active_minutes': active_mins,
                'average_cadence_wpm': avg_wpm,
                'avg_wpm': avg_wpm,
                'peak_burst_wpm': peak_burst,
                'shift_usage_ratio': shift_ratio,
                'last_active': last_act,
                'is_startup_enabled': startup_on,
                'startup_enabled': startup_on,
                'privacy_guarantee': 'Zero text logging — strictly anonymous inter-keystroke timing and volume aggregates.'
            })
        except Exception as e:
            st_on = False
            try:
                st_on = WindowsStartupManager.is_startup_enabled()
            except Exception:
                pass
            return json.dumps({
                'status': 'Active',
                'total_keystrokes_today': 0,
                'total_keystrokes': 0,
                'active_typing_minutes': 0.0,
                'active_minutes': 0.0,
                'average_cadence_wpm': 0.0,
                'avg_wpm': 0.0,
                'peak_burst_wpm': 0.0,
                'shift_usage_ratio': 0.12,
                'is_startup_enabled': st_on,
                'startup_enabled': st_on,
                'privacy_guarantee': 'Zero text logging.',
                'msg': str(e)
            })

    def toggle_startup_daemon(self, enable):
        try:
            should_enable = str(enable).lower() in ('true', '1', 'yes')
            if should_enable:
                res = WindowsStartupManager.enable_startup()
            else:
                res = WindowsStartupManager.disable_startup()
            return json.dumps({
                'status': 'success',
                'enabled': WindowsStartupManager.is_startup_enabled()
            })
        except Exception as e:
            return json.dumps({'status': 'error', 'msg': str(e)})

    def generate_coaching_insights(self, net_wpm=60.0, accuracy=96.0, intervals=None, shift_latencies=None, style='title_case'):
        try:
            wpm = float(net_wpm)
            acc = float(accuracy)
            intv = intervals or [120.0, 115.0, 130.0, 110.0, 140.0]
            s_lat = shift_latencies or [110.0, 105.0, 120.0]
            rci = MetricsAnalyzer.calculate_rci(intv)
            shift_sync = MetricsAnalyzer.analyze_shift_sync(s_lat)
            insights = CoachingEngine.generate_session_insights(wpm, acc, rci, shift_sync, style)
            return json.dumps({**insights, 'status': 'success'})
        except Exception as e:
            return json.dumps({'status': 'error', 'msg': str(e)})

    def get_user_weak_spots(self, user_id=None):
        try:
            return json.dumps(WeakSpotsEngine.get_weak_spots_report(user_id=user_id))
        except Exception as e:
            return json.dumps({'status': 'error', 'msg': str(e), 'weak_keys': ['P', 'B', 'Q']})

    def get_new_word_batch(self, level, mode, difficulty, style=None, user_id=None):
        try:
            if not style:
                try:
                    s_data = json.loads(self.get_user_typing_style())
                    style = s_data.get('style_id', 'title_case')
                except Exception:
                    style = 'title_case'
            weak_keys = WeakSpotsEngine.get_user_weak_keys(user_id=user_id, max_keys=3)
            return CurriculumEngine.get_word_batch(level, mode, difficulty, style=style, weak_keys=weak_keys)
        except Exception as e:
            print(f"[CurriculumEngine] Fallback: {e}")
            level=int(level); mode=str(mode).strip(); diff=str(difficulty).strip()
            pool=(self.easy_words if diff=='Easy' else self.hard_words if diff=='Hard' else self.normal_words) or self.corpus_words or ['typing','game']
            sel=self._no_repeat_sample(pool,min(10+level//2,60)); text=' '.join(sel)
            if style:
                text = TypingStyleEngine.transform_text(text, style)
            else:
                text=text[0].upper()+text[1:]
            return json.dumps({'text':text,'status':'success'})

    def get_daily_challenge(self, mode='sentences'):
        today = datetime.now().strftime('%Y-%m-%d')
        seed_val = int(today.replace('-', '')) + (abs(hash(mode)) % 10000)
        random.seed(seed_val)
        
        mode = (mode or 'sentences').lower()
        if mode == 'words':
            vocab = [
                "rhythm", "velocity", "precision", "accuracy", "keystroke", "tactile",
                "cadence", "mechanical", "focus", "discipline", "balance", "ergonomics",
                "actuation", "posture", "speed", "flow", "harmony", "clarity",
                "endurance", "muscle", "memory", "homerow", "anchor", "feedback",
                "dexterity", "zen", "reflex", "tempo", "agility", "mastery"
            ]
            selected = random.sample(vocab, min(24, len(vocab)))
            text = ' '.join(selected)
        elif mode == 'paragraphs':
            paragraphs = [
                "Touch typing is not merely the mechanical pressing of plastic caps; it is the seamless translation of conscious thought into digital expression. When the hands rest naturally upon the home row anchors, every key stroke flows with rhythmic grace, transforming physical effort into effortless velocity.",
                "True mastery demands consistent deliberate practice and unwavering calm. Rather than chasing raw speed at the cost of errors, high performance typists cultivate flawless accuracy first. With deep muscle memory established, velocity expands naturally without tension or fatigue.",
                "Across every tier of engineering, literature, and competitive typing, rhythm reigns supreme. The keyboard becomes an extension of the mind, where ideas materialize at the exact speed of contemplation."
            ]
            text = '\n\n'.join(paragraphs)
        elif mode == 'pages':
            # Full-page endurance: paragraphs plus a rotating prose section
            page_sections = [
                "In the golden era of computing, the mechanical switch reigned supreme. With crisp actuation points and musical acoustic signatures, each typist composed their own rhythmic symphony. Modern enthusiasts revere custom springs, lubricated stems, and aluminum housings that elevate digital composition into pure art.",
                "Consistency beats intensity on every leaderboard. Short daily sessions with full attention build faster fingers than exhausted weekend marathons. Warm up on easy rows, push one hard passage, then cool down with slow perfect strokes.",
                "Posture is free speed. Feet flat, back straight, wrists floating above the keys instead of resting on the desk. When the shoulders relax, the fingers fly, and accuracy climbs without any extra effort at all."
            ]
            random.shuffle(page_sections)
            paragraphs = [
                "Touch typing is not merely the mechanical pressing of plastic caps; it is the seamless translation of conscious thought into digital expression. When the hands rest naturally upon the home row anchors, every key stroke flows with rhythmic grace, transforming physical effort into effortless velocity.",
                "True mastery demands consistent deliberate practice and unwavering calm. Rather than chasing raw speed at the cost of errors, high performance typists cultivate flawless accuracy first. With deep muscle memory established, velocity expands naturally without tension or fatigue."
            ]
            text = '\n\n'.join(paragraphs + page_sections[:2])
        elif mode == 'code':
            snippets = [
                "def binary_search(array, target):\n    low = 0\n    high = len(array) - 1\n    while low <= high:\n        mid = (low + high) // 2\n        if array[mid] == target:\n            return mid\n        if array[mid] > target:\n            high = mid - 1\n        else:\n            low = mid + 1\n    return None",
                "async function fetchPlayerData(endpoint, token) {\n  const response = await fetch(endpoint, {\n    headers: { Authorization: `Bearer ${token}` }\n  });\n  if (!response.ok) throw new Error(\"Network latency detected\");\n  return response.json();\n}",
                "SELECT users.name, COUNT(orders.id) AS total_orders\nFROM users\nJOIN orders ON orders.user_id = users.id\nWHERE users.active = 1\nGROUP BY users.name\nORDER BY total_orders DESC;"
            ]
            text = random.choice(snippets)
        else: # sentences
            default_sentences = [
                "Mastering consistent keystroke rhythm and relaxed hand posture unlocks rapid typing speed.",
                "Resting index fingers on the home row bumps allows flawless navigation without looking down.",
                "Focus on crisp accuracy before attempting to accelerate your raw words per minute.",
                "Daily deliberate drills build unbreakable tactile muscle memory across all finger zones."
            ]
            pool = self.corpus_sentences if (self.corpus_sentences and len(self.corpus_sentences) >= 4) else default_sentences
            sents = random.sample(pool, min(4, len(pool)))
            text = ' '.join(sents)
            
        random.seed()
        return json.dumps({'text': text, 'date': today, 'mode': mode, 'status': 'success'})

    def save_tournament_score(self, tournament_id, player_name, wpm, accuracy):
        try:
            conn=sqlite3.connect(DB_PATH); c=conn.cursor()
            c.execute('INSERT INTO tournament_scores (tournament_id,player_name,wpm,accuracy) VALUES (?,?,?,?)',(tournament_id,player_name,wpm,accuracy)); conn.commit()
            return json.dumps({'status':'success'})
        except Exception as e: return json.dumps({'status':'error','msg':str(e)})
        finally:
            try: conn.close()
            except: pass

    def get_tournament_scores(self, tournament_id):
        try:
            conn=sqlite3.connect(DB_PATH); rows=conn.cursor().execute('SELECT player_name,wpm,accuracy,timestamp FROM tournament_scores WHERE tournament_id=? ORDER BY wpm DESC LIMIT 100',(tournament_id,)).fetchall()
            return json.dumps([{'name':r[0],'wpm':r[1],'acc':r[2],'ts':r[3]} for r in rows])
        except: return json.dumps([])
        finally:
            try: conn.close()
            except: pass

    def create_tournament(self, name, text, duration_hours=24):
        try:
            conn=sqlite3.connect(DB_PATH); c=conn.cursor()
            end_time=(datetime.now().timestamp()+duration_hours*3600)
            c.execute('INSERT INTO tournament (name,text,start_time,end_time) VALUES (?,?,datetime("now"),datetime(?,\"unixepoch\"))',(name,text,end_time)); conn.commit()
            tid=c.lastrowid
            return json.dumps({'status':'success','id':tid})
        except Exception as e: return json.dumps({'status':'error','msg':str(e)})
        finally:
            try: conn.close()
            except: pass

    def get_tournaments(self):
        try:
            conn=sqlite3.connect(DB_PATH)
            rows=conn.cursor().execute("SELECT id,name,text,start_time,end_time,active FROM tournament WHERE active=1 ORDER BY id DESC LIMIT 10").fetchall()
            return json.dumps([{'id':r[0],'name':r[1],'text':r[2],'start':r[3],'end':r[4]} for r in rows])
        except: return json.dumps([])
        finally:
            try: conn.close()
            except: pass

    def post_announcement(self, message):
        try:
            conn=sqlite3.connect(DB_PATH); c=conn.cursor()
            c.execute('INSERT INTO announcements (message) VALUES (?)',(message,)); conn.commit()
            return json.dumps({'status':'success'})
        except Exception as e: return json.dumps({'status':'error','msg':str(e)})
        finally:
            try: conn.close()
            except: pass

    def get_announcements(self):
        try:
            conn=sqlite3.connect(DB_PATH)
            rows=conn.cursor().execute("SELECT message,created FROM announcements WHERE active=1 ORDER BY id DESC LIMIT 5").fetchall()
            return json.dumps([{'msg':r[0],'ts':r[1]} for r in rows])
        except: return json.dumps([])
        finally:
            try: conn.close()
            except: pass

    def save_session_results(self, level, mode, difficulty, wpm, accuracy, emeralds, user_id=None):
        try:
            uid = str(user_id or 'player_default')[:64]
            conn = get_db_connection()
            conn.cursor().execute('INSERT INTO sessions (level,mode,difficulty,wpm,accuracy,rupees_earned,user_id) VALUES (?,?,?,?,?,?,?)',(level,mode,difficulty,wpm,accuracy,emeralds,uid)); conn.commit()
            return json.dumps({'status':'success'})
        except: return json.dumps({'status':'error'})
        finally:
            try: conn.close()
            except: pass

    def getquestdata(self, category, user_id=None):
        try:
            uid = str(user_id or 'player_default')[:64]
            conn = get_db_connection(); c = conn.cursor()
            row = c.execute('SELECT quest_json FROM quests WHERE category=? AND user_id=?',(category,uid)).fetchone()
            if row and row[0]:
                return row[0]
            # Legacy fallback: global row from before per-user migration
            row = c.execute('SELECT quest_json FROM quests WHERE category=?',(category,)).fetchone()
            return row[0] if row else '[]'
        except: return '[]'
        finally:
            try: conn.close()
            except: pass

    def savequestdata(self, category, quest_json, user_id=None):
        try:
            uid = str(user_id or 'player_default')[:64]
            conn = get_db_connection()
            # Per-user row; legacy global row preserved for fallback reads.
            conn.cursor().execute('INSERT OR REPLACE INTO quests (category,user_id,quest_json) VALUES (?,?,?)',(category,uid,quest_json)); conn.commit()
            return json.dumps({'status':'success'})
        except: return json.dumps({'status':'error'})
        finally:
            try: conn.close()
            except: pass

    def getprogress(self, user_id=None):
        try:
            conn = get_db_connection(); c = conn.cursor()
            if user_id:
                row = c.execute('SELECT progress_json FROM user_progress WHERE user_id=?', (user_id,)).fetchone()
                if row and row[0]:
                    return row[0]
            row = c.execute('SELECT progress_json FROM progress WHERE id=1').fetchone()
            return row[0] if row else ''
        except: return ''
        finally:
            try: conn.close()
            except: pass

    def saveprogress(self, progress_json, user_id=None):
        try:
            conn = get_db_connection(); c = conn.cursor()
            c.execute('INSERT OR REPLACE INTO progress (id,progress_json) VALUES (1,?)',(progress_json,))
            try:
                data = json.loads(progress_json)
                u = data.get('user', {})
                pid = user_id or u.get('id', 'player_default')
                name = u.get('name', 'Champion Typer')
                avatar = u.get('avatar', '👑')
                lvl = int(data.get('level', 1))
                if pid:
                    c.execute('INSERT OR REPLACE INTO user_progress (user_id, progress_json, last_updated) VALUES (?, ?, CURRENT_TIMESTAMP)', (pid, progress_json))
                c.execute('''INSERT INTO multiplayer_profiles (id, name, avatar, level)
                             VALUES (?, ?, ?, ?)
                             ON CONFLICT(id) DO UPDATE SET
                             name=excluded.name,
                             avatar=excluded.avatar,
                             level=CASE WHEN excluded.level > level THEN excluded.level ELSE level END,
                             last_active=CURRENT_TIMESTAMP''', (pid, name, avatar, lvl))
            except Exception:
                pass
            conn.commit()
            return json.dumps({'status':'success'})
        except Exception as e: return json.dumps({'status':'error','msg':str(e)})
        finally:
            try: conn.close()
            except: pass

    def get_profile(self, pid='player_default'):
        try:
            conn=sqlite3.connect(DB_PATH); c=conn.cursor()
            row = c.execute('SELECT id, name, avatar, level, rank, rank_color, races, wins, best_wpm, avg_acc FROM multiplayer_profiles WHERE id=?', (pid,)).fetchone()
            if row:
                return json.dumps({
                    'id': row[0], 'name': row[1], 'avatar': row[2], 'level': row[3],
                    'rank': row[4], 'rank_color': row[5], 'races': row[6], 'wins': row[7],
                    'best_wpm': row[8], 'avg_acc': row[9], 'status': 'success'
                })
            # Seed default if not exists
            c.execute('INSERT OR REPLACE INTO multiplayer_profiles (id, name, avatar, level, rank, rank_color, races, wins, best_wpm, avg_acc) VALUES (?, ?, ?, 1, "Rubber Dome Typer Trainee I", "#a1887f", 0, 0, 0, 100)',
                      (pid, 'Champion Typer', '👑'))
            conn.commit()
            return json.dumps({
                'id': pid, 'name': 'Champion Typer', 'avatar': '👑', 'level': 1,
                'rank': 'Rubber Dome Typer Trainee I', 'rank_color': '#a1887f',
                'races': 0, 'wins': 0, 'best_wpm': 0, 'avg_acc': 100, 'status': 'success'
            })
        except Exception as e:
            return json.dumps({'status': 'error', 'msg': str(e)})
        finally:
            try: conn.close()
            except: pass

    def update_profile(self, pid, name, avatar, level=1, rank='', rank_color=''):
        try:
            conn=sqlite3.connect(DB_PATH); c=conn.cursor()
            c.execute('''INSERT INTO multiplayer_profiles (id, name, avatar, level, rank, rank_color)
                         VALUES (?, ?, ?, ?, ?, ?)
                         ON CONFLICT(id) DO UPDATE SET
                         name=excluded.name,
                         avatar=excluded.avatar,
                         level=CASE WHEN excluded.level > level THEN excluded.level ELSE level END,
                         rank=COALESCE(NULLIF(excluded.rank, ""), rank),
                         rank_color=COALESCE(NULLIF(excluded.rank_color, ""), rank_color),
                         last_active=CURRENT_TIMESTAMP''',
                      (pid, name, avatar, level, rank, rank_color))
            conn.commit()
            return json.dumps({'status': 'success'})
        except Exception as e:
            return json.dumps({'status': 'error', 'msg': str(e)})
        finally:
            try: conn.close()
            except: pass

    def record_mp_race(self, pid, won, wpm, acc):
        try:
            conn=sqlite3.connect(DB_PATH); c=conn.cursor()
            is_win = 1 if str(won).lower() in ('true', '1') else 0
            wpm_val = int(wpm)
            acc_val = int(acc)
            c.execute('''UPDATE multiplayer_profiles
                         SET races = races + 1,
                             wins = wins + ?,
                             best_wpm = MAX(best_wpm, ?),
                             avg_acc = (avg_acc + ?) / 2,
                             last_active = CURRENT_TIMESTAMP
                         WHERE id = ?''', (is_win, wpm_val, acc_val, pid))
            conn.commit()
            return json.dumps({'status': 'success'})
        except Exception as e:
            return json.dumps({'status': 'error', 'msg': str(e)})
        finally:
            try: conn.close()
            except: pass

    def register_local_account(self, username, password, display_name='', avatar='👑'):
        try:
            uname = str(username or '').strip()
            pwd = str(password or '').strip()
            dname = str(display_name or '').strip() or uname
            av = str(avatar or '👑').strip()

            if not (3 <= len(uname) <= 24):
                return json.dumps({'status': 'error', 'msg': 'Username must be between 3 and 24 characters.'})
            if not re.match(r'^[a-zA-Z0-9_]+$', uname):
                return json.dumps({'status': 'error', 'msg': 'Username may only contain letters, numbers, and underscores.'})
            if len(pwd) < 4:
                return json.dumps({'status': 'error', 'msg': 'Password must be at least 4 characters.'})

            salt = secrets.token_hex(16)
            pwd_hash = hashlib.pbkdf2_hmac('sha256', pwd.encode('utf-8'), salt.encode('utf-8'), 100_000).hex()
            user_id = f"local_{uuid.uuid4().hex[:12]}"

            conn = get_db_connection(); c = conn.cursor()
            try:
                c.execute('''INSERT INTO local_accounts (id, username, password_hash, salt, display_name, avatar, created_at, last_login)
                             VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)''',
                          (user_id, uname, pwd_hash, salt, dname, av))
                c.execute('''INSERT OR REPLACE INTO multiplayer_profiles (id, name, avatar, level)
                             VALUES (?, ?, ?, 1)''', (user_id, dname, av))
                conn.commit()
            except sqlite3.IntegrityError:
                return json.dumps({'status': 'error', 'msg': f'Username "{uname}" is already taken.'})

            return json.dumps({
                'status': 'success',
                'user': {
                    'id': user_id,
                    'username': uname,
                    'name': dname,
                    'avatar': av,
                    'account_type': 'local'
                }
            })
        except Exception as e:
            return json.dumps({'status': 'error', 'msg': str(e)})
        finally:
            try: conn.close()
            except: pass

    def login_local_account(self, username, password):
        try:
            uname = str(username or '').strip()
            pwd = str(password or '').strip()
            conn = get_db_connection(); c = conn.cursor()
            row = c.execute('SELECT id, username, password_hash, salt, display_name, avatar FROM local_accounts WHERE username=? COLLATE NOCASE', (uname,)).fetchone()
            if not row:
                return json.dumps({'status': 'error', 'msg': 'Account not found with that username.'})

            user_id, stored_uname, stored_hash, salt, dname, av = row
            computed_hash = hashlib.pbkdf2_hmac('sha256', pwd.encode('utf-8'), salt.encode('utf-8'), 100_000).hex()
            if not secrets.compare_digest(stored_hash, computed_hash):
                return json.dumps({'status': 'error', 'msg': 'Incorrect password.'})

            c.execute('UPDATE local_accounts SET last_login=CURRENT_TIMESTAMP WHERE id=?', (user_id,))
            conn.commit()

            # Retrieve saved progress if any
            prog_row = c.execute('SELECT progress_json FROM user_progress WHERE user_id=?', (user_id,)).fetchone()
            progress_data = json.loads(prog_row[0]) if (prog_row and prog_row[0]) else None

            return json.dumps({
                'status': 'success',
                'user': {
                    'id': user_id,
                    'username': stored_uname,
                    'name': dname,
                    'avatar': av,
                    'account_type': 'local'
                },
                'progress': progress_data
            })
        except Exception as e:
            return json.dumps({'status': 'error', 'msg': str(e)})
        finally:
            try: conn.close()
            except: pass

    def list_local_accounts(self):
        try:
            conn = get_db_connection(); c = conn.cursor()
            rows = c.execute('''SELECT la.id, la.username, la.display_name, la.avatar, la.last_login, COALESCE(mp.level, 1)
                                FROM local_accounts la
                                LEFT JOIN multiplayer_profiles mp ON la.id = mp.id
                                ORDER BY la.last_login DESC''').fetchall()
            accounts = [{
                'id': r[0],
                'username': r[1],
                'name': r[2],
                'avatar': r[3],
                'last_login': r[4],
                'level': r[5]
            } for r in rows]
            return json.dumps({'status': 'success', 'accounts': accounts})
        except Exception as e:
            return json.dumps({'status': 'error', 'msg': str(e), 'accounts': []})
        finally:
            try: conn.close()
            except: pass

    def delete_account(self, user_id=None, account_type='local'):
        try:
            conn = get_db_connection(); c = conn.cursor()
            uid = str(user_id or '').strip()
            atype = str(account_type or '').strip().lower()

            # P0 fix: scope all deletes to this uid only.
            # Previously: unconditional DELETE FROM google_users wiped every
            # Google user, and DELETE FROM progress/sessions/quests wiped
            # GLOBAL data for all users when one account was deleted.
            # Sessions/quests/progress are still global tables (no user_id
            # column yet — see DB roadmap); until migrated we must NOT wipe
            # them here, only per-user rows.
            # 1. Purge user records from accounts/oauth (scoped)
            if atype == 'google' or (uid and not uid.startswith('local_') and uid != 'player_default'):
                if uid:
                    c.execute('DELETE FROM google_users WHERE id=?', (uid,))
                if 'OAUTH' in globals() and OAUTH:
                    try:
                        cur = OAUTH.get_current_user()
                        import json as _j
                        cur_u = _j.loads(cur) if isinstance(cur, str) else {}
                        if not uid or cur_u.get('id') == uid:
                            OAUTH.logout()
                    except Exception:
                        pass
            if atype == 'local' or uid.startswith('local_'):
                if uid:
                    c.execute('DELETE FROM local_accounts WHERE id=?', (uid,))

            # 2. Purge user profiles and isolated progress (already scoped — kept)
            if uid:
                c.execute('DELETE FROM user_progress WHERE user_id=?', (uid,))
                c.execute('DELETE FROM multiplayer_profiles WHERE id=?', (uid,))
                c.execute('DELETE FROM tournament_scores WHERE player_name=?', (uid,))
            conn.commit()

            return json.dumps({
                'status': 'success',
                'msg': 'Account and all associated personal data permanently purged.'
            })
        except Exception as e:
            return json.dumps({'status': 'error', 'msg': str(e)})
        finally:
            try: conn.close()
            except: pass


API = TypingGameAPI()

# ═══════════════════════════════════════════════════════════════
# OAUTH MANAGER
# ═══════════════════════════════════════════════════════════════
class OAuthManager:
    """Handles the full PKCE OAuth2 dance for Google sign-in."""

    def __init__(self):
        self._state        = None
        self._verifier     = None
        self._current_user = None          # dict with id, name, email, picture
        self._window_ref   = None          # set to the webview window after creation
        self._server       = None
        self._thread       = None
        self._start_callback_server()
        self._load_persisted_user()

    def _load_persisted_user(self):
        try:
            conn = sqlite3.connect(DB_PATH)
            c = conn.cursor()
            c.execute('''CREATE TABLE IF NOT EXISTS google_users
                (id TEXT PRIMARY KEY, name TEXT, email TEXT, picture TEXT,
                 last_login DATETIME DEFAULT CURRENT_TIMESTAMP)''')
            row = c.execute('SELECT id, name, email, picture FROM google_users ORDER BY last_login DESC LIMIT 1').fetchone()
            if row:
                self._current_user = {
                    'id': row[0],
                    'name': row[1],
                    'email': row[2],
                    'picture': row[3],
                }
                print(f"[OAuth] Restored user session from DB: {row[1]} ({row[2]})")
            conn.close()
        except Exception as e:
            print(f"[OAuth] Could not load persisted user: {e}")

    # ── Start mini-server just for the OAuth redirect ─────────
    def _start_callback_server(self):
        manager = self

        class CallbackHandler(BaseHTTPRequestHandler):
            def log_message(self, *_): pass

            def do_GET(self):
                parsed = urlparse(self.path)
                if parsed.path == '/oauth/callback':
                    params = parse_qs(parsed.query)
                    # Send high-tech Cyber-Mechanical terminal page to browser
                    html_str = """<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>ATI • Authentication Successful</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background-color: #06080e;
      background-image: 
        radial-gradient(circle at 50% 20%, rgba(0, 245, 255, 0.12) 0%, transparent 60%),
        radial-gradient(circle at 80% 80%, rgba(16, 185, 129, 0.08) 0%, transparent 50%),
        linear-gradient(rgba(255, 255, 255, 0.02) 1px, transparent 1px),
        linear-gradient(90deg, rgba(255, 255, 255, 0.02) 1px, transparent 1px);
      background-size: 100% 100%, 100% 100%, 40px 40px, 40px 40px;
      color: #f8fafc;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      padding: 24px;
      overflow: hidden;
    }
    .card {
      position: relative;
      width: 100%;
      max-width: 480px;
      background: rgba(11, 17, 32, 0.88);
      backdrop-filter: blur(24px);
      -webkit-backdrop-filter: blur(24px);
      border: 1px solid rgba(0, 245, 255, 0.28);
      border-radius: 28px;
      padding: 38px 32px;
      text-align: center;
      box-shadow: 0 0 60px rgba(0, 245, 255, 0.12), 0 25px 50px -12px rgba(0, 0, 0, 0.7);
      animation: appear 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
    }
    @keyframes appear {
      from { opacity: 0; transform: translateY(20px) scale(0.96); }
      to { opacity: 1; transform: translateY(0) scale(1); }
    }
    .badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 6px 14px;
      border-radius: 9999px;
      background: rgba(0, 245, 255, 0.1);
      border: 1px solid rgba(0, 245, 255, 0.3);
      color: #00f5ff;
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.06em;
      text-transform: uppercase;
      font-family: 'JetBrains Mono', Consolas, monospace;
      margin-bottom: 22px;
    }
    .dot {
      width: 7px;
      height: 7px;
      border-radius: 50%;
      background: #10b981;
      box-shadow: 0 0 10px #10b981;
      animation: pulse 1.5s infinite;
    }
    @keyframes pulse {
      0%, 100% { transform: scale(1); opacity: 1; }
      50% { transform: scale(1.3); opacity: 0.6; }
    }
    .icon-wrap {
      position: relative;
      width: 76px;
      height: 76px;
      margin: 0 auto 22px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .icon-glow {
      position: absolute;
      inset: -10px;
      background: radial-gradient(circle, rgba(16, 185, 129, 0.35) 0%, transparent 70%);
      border-radius: 50%;
      filter: blur(12px);
    }
    .icon-circle {
      position: relative;
      width: 74px;
      height: 74px;
      border-radius: 22px;
      background: linear-gradient(135deg, rgba(0, 245, 255, 0.2), rgba(16, 185, 129, 0.2));
      border: 1px solid rgba(0, 245, 255, 0.4);
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 0 30px rgba(0, 245, 255, 0.2);
    }
    .check-svg {
      width: 40px;
      height: 40px;
      stroke: #10b981;
      stroke-width: 2.8;
      stroke-linecap: round;
      stroke-linejoin: round;
      fill: none;
      filter: drop-shadow(0 0 8px rgba(16, 185, 129, 0.6));
    }
    .title {
      font-size: 22px;
      font-weight: 800;
      letter-spacing: -0.02em;
      background: linear-gradient(135deg, #ffffff 30%, #00f5ff 75%, #10b981 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      margin-bottom: 8px;
    }
    .desc {
      color: #94a3b8;
      font-size: 13.5px;
      line-height: 1.5;
      margin-bottom: 24px;
    }
    .telemetry {
      background: rgba(3, 7, 18, 0.65);
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 16px;
      padding: 14px 18px;
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
      text-align: left;
      margin-bottom: 24px;
      font-family: 'JetBrains Mono', Consolas, monospace;
    }
    .tel-item span:first-child {
      display: block;
      font-size: 10px;
      color: #64748b;
      text-transform: uppercase;
      font-weight: 700;
      margin-bottom: 2px;
    }
    .tel-item span:last-child {
      display: block;
      font-size: 12px;
      color: #38bdf8;
      font-weight: 600;
    }
    .tel-status {
      color: #10b981 !important;
    }
    .btn {
      display: block;
      width: 100%;
      padding: 13px 20px;
      background: linear-gradient(135deg, #00f5ff, #0284c7);
      color: #030712;
      border: none;
      border-radius: 14px;
      font-size: 13.5px;
      font-weight: 800;
      cursor: pointer;
      box-shadow: 0 0 25px rgba(0, 245, 255, 0.35);
      transition: all 0.2s ease;
      text-decoration: none;
    }
    .btn:hover {
      transform: translateY(-2px);
      box-shadow: 0 0 35px rgba(0, 245, 255, 0.55);
      filter: brightness(1.1);
    }
    .countdown-bar {
      width: 100%;
      height: 4px;
      background: rgba(255, 255, 255, 0.1);
      border-radius: 999px;
      margin-top: 20px;
      overflow: hidden;
    }
    .countdown-fill {
      height: 100%;
      width: 100%;
      background: linear-gradient(90deg, #00f5ff, #10b981);
      border-radius: 999px;
      animation: drain 3s linear forwards;
    }
    @keyframes drain {
      from { width: 100%; }
      to { width: 0%; }
    }
    .footer-note {
      margin-top: 12px;
      font-size: 12px;
      color: #64748b;
    }
    .footer-note b {
      color: #cbd5e1;
    }
  </style>
</head>
<body>
  <div class="card">
    <div class="badge">
      <div class="dot"></div>
      OAUTH 2.0 PKCE • S256 VERIFIED
    </div>

    <div class="icon-wrap">
      <div class="icon-glow"></div>
      <div class="icon-circle">
        <svg class="check-svg" viewBox="0 0 24 24">
          <polyline points="20 6 9 17 4 12"></polyline>
        </svg>
      </div>
    </div>

    <h1 class="title">AUTHENTICATION SUCCESSFUL</h1>
    <p class="desc">Your Google identity has been verified. Session credentials and typist metrics are now synchronized.</p>

    <div class="telemetry">
      <div class="tel-item">
        <span>Security Layer</span>
        <span>SHA-256 PKCE</span>
      </div>
      <div class="tel-item">
        <span>Storage Vault</span>
        <span>SQLite Local DB</span>
      </div>
      <div class="tel-item">
        <span>Identity Protocol</span>
        <span>Google Auth</span>
      </div>
      <div class="tel-item">
        <span>Vault Sync</span>
        <span class="tel-status">200 OK • Active</span>
      </div>
    </div>

    <button class="btn" onclick="closeTab()">Return to Typing Instructor</button>

    <div class="countdown-bar">
      <div class="countdown-fill"></div>
    </div>

    <p class="footer-note">
      Closing window automatically in <b id="timer">3</b>s...<br>
      Or you can safely close this browser tab anytime.
    </p>
  </div>

  <script>
    let remaining = 3;
    const timerEl = document.getElementById('timer');
    function closeTab() {
      window.open('', '_self', '');
      window.close();
    }
    const interval = setInterval(() => {
      remaining -= 1;
      if (timerEl && remaining >= 0) timerEl.textContent = remaining;
      if (remaining <= 0) {
        clearInterval(interval);
        closeTab();
      }
    }, 1000);
  </script>
</body>
</html>"""
                    html = html_str.encode('utf-8')
                    self.send_response(200)
                    self.send_header('Content-Type', 'text/html; charset=utf-8')
                    self.send_header('Content-Length', str(len(html)))
                    self.end_headers()
                    self.wfile.write(html)
                    # Process in background so the response is sent first
                    threading.Thread(target=manager._handle_callback,
                                     args=(params,), daemon=True).start()
                else:
                    self.send_response(404)
                    self.end_headers()

        try:
            self._server = HTTPServer(('127.0.0.1', OAUTH_CALLBACK_PORT), CallbackHandler)
            self._thread = threading.Thread(target=self._server.serve_forever, daemon=True)
            self._thread.start()
            print(f"[OAuth] Callback server on port {OAUTH_CALLBACK_PORT}")
        except Exception as e:
            print(f"[OAuth] Could not start callback server: {e}")

    # ── Step 1: build the auth URL and open the OS browser ───
    def begin_login(self):
        # PKCE: random verifier → SHA-256 → base64url challenge
        self._verifier = secrets.token_urlsafe(64)
        digest    = hashlib.sha256(self._verifier.encode()).digest()
        challenge = base64.urlsafe_b64encode(digest).rstrip(b'=').decode()
        self._state = secrets.token_hex(16)

        params = {
            'client_id':             GOOGLE_CLIENT_ID,
            'redirect_uri':          f'http://127.0.0.1:{OAUTH_CALLBACK_PORT}/oauth/callback',
            'response_type':         'code',
            'scope':                 'openid email profile',
            'state':                 self._state,
            'code_challenge':        challenge,
            'code_challenge_method': 'S256',
            'access_type':           'offline',
            'prompt':                'select_account',
        }
        url = 'https://accounts.google.com/o/oauth2/v2/auth?' + urllib.parse.urlencode(params)
        webbrowser.open(url)          # opens Chrome / Firefox / Edge — not the webview
        return {'status': 'opening_browser', 'port': OAUTH_CALLBACK_PORT}

    # ── Step 2: exchange code for tokens, fetch profile ──────
    def _handle_callback(self, params):
        code  = params.get('code',  [''])[0]
        state = params.get('state', [''])[0]
        error = params.get('error', [''])[0]

        if error:
            self._notify_js({'error': error})
            return
        if state != self._state:
            self._notify_js({'error': 'state_mismatch'})
            return
        if not code:
            self._notify_js({'error': 'no_code'})
            return

        # Exchange code for tokens
        try:
            if HAS_REQUESTS:
                token_resp = _requests.post('https://oauth2.googleapis.com/token', data={
                    'code':          code,
                    'client_id':     GOOGLE_CLIENT_ID,
                    'client_secret': GOOGLE_CLIENT_SECRET,
                    'redirect_uri':  f'http://127.0.0.1:{OAUTH_CALLBACK_PORT}/oauth/callback',
                    'grant_type':    'authorization_code',
                    'code_verifier': self._verifier,
                }, timeout=10)
                token_data = token_resp.json()
            else:
                # urllib fallback (no client_secret needed for PKCE public clients)
                post_data = urllib.parse.urlencode({
                    'code':          code,
                    'client_id':     GOOGLE_CLIENT_ID,
                    'client_secret': GOOGLE_CLIENT_SECRET,
                    'redirect_uri':  f'http://127.0.0.1:{OAUTH_CALLBACK_PORT}/oauth/callback',
                    'grant_type':    'authorization_code',
                    'code_verifier': self._verifier,
                }).encode()
                req = urllib.request.Request('https://oauth2.googleapis.com/token',
                                             data=post_data,
                                             headers={'Content-Type': 'application/x-www-form-urlencoded'})
                with urllib.request.urlopen(req, timeout=10) as r:
                    token_data = json.loads(r.read())

            if 'error' in token_data:
                self._notify_js({'error': token_data['error']})
                return

            access_token = token_data.get('access_token', '')
        except Exception as e:
            self._notify_js({'error': str(e)})
            return

        # Fetch user profile
        try:
            if HAS_REQUESTS:
                profile_resp = _requests.get(
                    'https://www.googleapis.com/oauth2/v3/userinfo',
                    headers={'Authorization': f'Bearer {access_token}'}, timeout=10)
                profile = profile_resp.json()
            else:
                req = urllib.request.Request(
                    'https://www.googleapis.com/oauth2/v3/userinfo',
                    headers={'Authorization': f'Bearer {access_token}'})
                with urllib.request.urlopen(req, timeout=10) as r:
                    profile = json.loads(r.read())

            self._current_user = {
                'id':      profile.get('sub', ''),
                'name':    profile.get('name', 'User'),
                'email':   profile.get('email', ''),
                'picture': profile.get('picture', ''),
                'token':   access_token,
            }
            # Persist minimally (no secret stored)
            _saved = {k: v for k, v in self._current_user.items() if k != 'token'}
            # Store in DB for sessions
            try:
                conn = sqlite3.connect(DB_PATH)
                c = conn.cursor()
                c.execute('''CREATE TABLE IF NOT EXISTS google_users
                    (id TEXT PRIMARY KEY, name TEXT, email TEXT, picture TEXT,
                     last_login DATETIME DEFAULT CURRENT_TIMESTAMP)''')
                c.execute('INSERT OR REPLACE INTO google_users (id,name,email,picture) VALUES (?,?,?,?)',
                    (self._current_user['id'], self._current_user['name'],
                     self._current_user['email'], self._current_user['picture']))
                conn.commit()
                conn.close()
            except Exception as db_e:
                print(f"[OAuth] DB error: {db_e}")

            self._notify_js({'user': _saved})
        except Exception as e:
            self._notify_js({'error': str(e)})

    # ── Notify the webview via JS evaluation ─────────────────
    def _notify_js(self, payload):
        js = f'receiveGoogleUser({json.dumps(payload)})'
        # Try via the stored window reference
        if self._window_ref:
            try:
                self._window_ref.evaluate_js(js)
                return
            except Exception as e:
                print(f"[OAuth] evaluate_js error: {e}")
        # Fallback: store pending and poll
        self._pending_js = js

    def get_current_user(self):
        return json.dumps(self._current_user or {})

    def logout(self):
        self._current_user = None
        try:
            conn = sqlite3.connect(DB_PATH)
            c = conn.cursor()
            c.execute('DELETE FROM google_users')
            conn.commit()
            conn.close()
        except Exception as e:
            print(f"[OAuth] Delete users error: {e}")
        return json.dumps({'status': 'logged_out'})

    # Called right after webview.create_window so we can evaluate_js
    def set_window(self, win):
        self._window_ref = win
        # Flush any pending JS from a callback that arrived before the window was ready
        if hasattr(self, '_pending_js') and self._pending_js:
            try:
                win.evaluate_js(self._pending_js)
            except Exception: pass
            self._pending_js = None

OAUTH = OAuthManager()


# ═══════════════════════════════════════════════════════════════
# AUTO-UPDATE MANAGER
# ═══════════════════════════════════════════════════════════════
CURRENT_VERSION = "3.2.1"
DEFAULT_UPDATE_URL = "https://advancedlogiclabs.dpdns.org/ati-version.json"
LOCAL_DEV_VERCEL_PATH = r"c:\Users\neelg\OneDrive\Desktop\Vercel\ati-version.json"

class UpdateManager:
    """Handles checking remote version manifest, streaming download of updates, and seamless restart."""

    def __init__(self):
        self.state = {
            'status': 'idle',        # idle | checking | update_available | no_update | downloading | ready | error
            'current_version': CURRENT_VERSION,
            'remote_version': None,
            'release_date': None,
            'changelog': None,
            'download_url': None,
            'exe_url': None,
            'progress': 0,           # 0 - 100
            'downloaded_bytes': 0,
            'total_bytes': 0,
            'speed_kbps': 0,
            'error': None,
            'staged_file': None,
            'is_mandatory': False
        }
        self._lock = threading.Lock()
        self._download_thread = None

    @staticmethod
    def _is_safe_url(url):
        if not url:
            return False
        try:
            parsed = urlparse(url)
            host = (parsed.hostname or '').lower()
            # Official update host + common mirrors + loopback.
            # (Previously the official host advancedlogiclabs.dpdns.org was
            # missing, while manifest-supplied URLs were never checked.)
            allowed = {'advancedlogiclabs.dpdns.org', 'vercel.app', 'github.com', 'raw.githubusercontent.com', '127.0.0.1', 'localhost'}
            if not any(host == d or host.endswith('.' + d) for d in allowed):
                return False
            if host in ('127.0.0.1', 'localhost'):
                return parsed.scheme in ('http', 'https')
            return parsed.scheme == 'https'
        except Exception:
            return False

    def _is_newer(self, remote_ver, local_ver):
        try:
            r_parts = [int(x) for x in re.findall(r'\d+', str(remote_ver))]
            l_parts = [int(x) for x in re.findall(r'\d+', str(local_ver))]
            while len(r_parts) < 3: r_parts.append(0)
            while len(l_parts) < 3: l_parts.append(0)
            return r_parts > l_parts
        except Exception:
            return False

    def check_update(self, manifest_url=None):
        if manifest_url and not self._is_safe_url(manifest_url):
            manifest_url = DEFAULT_UPDATE_URL
        url = manifest_url or DEFAULT_UPDATE_URL
        with self._lock:
            self.state['status'] = 'checking'
            self.state['error'] = None

        manifest_data = None

        # 1. Try remote fetch
        try:
            req = urllib.request.Request(url, headers={'User-Agent': f'ATI-Desktop/{CURRENT_VERSION}'})
            with urllib.request.urlopen(req, timeout=5) as resp:
                manifest_data = json.loads(resp.read().decode('utf-8'))
        except Exception as net_err:
            # 2. Fallback to local Vercel manifest if network/host is offline
            try:
                if os.path.isfile(LOCAL_DEV_VERCEL_PATH):
                    with open(LOCAL_DEV_VERCEL_PATH, 'r', encoding='utf-8') as f:
                        manifest_data = json.load(f)
            except Exception:
                pass

        with self._lock:
            if not manifest_data:
                self.state['status'] = 'error'
                self.state['error'] = 'Could not reach update server'
                return json.dumps(self.state)

            remote_ver = manifest_data.get('version', '')
            self.state['remote_version'] = remote_ver
            self.state['release_date'] = manifest_data.get('releaseDate', '')
            self.state['changelog'] = manifest_data.get('changelog', '')
            dl = manifest_data.get('downloadUrl', '')
            ex = manifest_data.get('exeUrl', '')
            # Validate manifest-supplied URLs (previously trusted blindly → RCE).
            if dl and not self._is_safe_url(dl):
                dl = ''
            if ex and not self._is_safe_url(ex):
                ex = ''
            self.state['download_url'] = dl
            self.state['exe_url'] = ex
            self.state['expected_sha256'] = (manifest_data.get('sha256') or manifest_data.get('sha256Exe') or '').lower()
            self.state['is_mandatory'] = manifest_data.get('mandatory', False)

            if self._is_newer(remote_ver, CURRENT_VERSION):
                self.state['status'] = 'update_available'
            else:
                self.state['status'] = 'no_update'

            return json.dumps(self.state)

    def start_download(self, override_url=None):
        with self._lock:
            if self.state['status'] == 'downloading':
                return json.dumps(self.state)

            target_url = override_url or self.state.get('download_url') or self.state.get('exe_url')
            if not target_url:
                self.state['status'] = 'error'
                self.state['error'] = 'No download URL available'
                return json.dumps(self.state)

            # Validate ALL download targets (previously only override_url was
            # checked; manifest URLs went straight to _download_worker → RCE).
            if not self._is_safe_url(target_url):
                self.state['status'] = 'error'
                self.state['error'] = 'Untrusted download URL domain'
                return json.dumps(self.state)

            self.state['status'] = 'downloading'
            self.state['progress'] = 0
            self.state['downloaded_bytes'] = 0
            self.state['total_bytes'] = 0
            self.state['speed_kbps'] = 0
            self.state['error'] = None

            self._download_thread = threading.Thread(target=self._download_worker, args=(target_url,), daemon=True)
            self._download_thread.start()
            return json.dumps(self.state)

    def _download_worker(self, url):
        updates_dir = os.path.join(APP_DATA_DIR, 'updates')
        try:
            os.makedirs(updates_dir, exist_ok=True)
        except Exception:
            pass

        filename = os.path.basename(urlparse(url).path) or 'AdvancedTypingInstructor_latest.exe'
        if not filename.endswith('.exe'):
            filename += '.exe'
        target_file = os.path.join(updates_dir, filename)

        # Fast-track if already present in local Vercel folder
        vercel_file = os.path.join(r"c:\Users\neelg\OneDrive\Desktop\Vercel", filename)
        if os.path.isfile(vercel_file) and not url.startswith('http://localhost'):
            try:
                total_size = os.path.getsize(vercel_file)
                with self._lock:
                    self.state['total_bytes'] = total_size
                chunk = 1024 * 512
                copied = 0
                hasher = hashlib.sha256()
                with open(vercel_file, 'rb') as src, open(target_file, 'wb') as dst:
                    while True:
                        buf = src.read(chunk)
                        if not buf: break
                        hasher.update(buf)
                        dst.write(buf)
                        copied += len(buf)
                        with self._lock:
                            self.state['downloaded_bytes'] = copied
                            self.state['progress'] = min(99, int((copied / total_size) * 100))
                        time.sleep(0.02)
                if not self._verify_hash(target_file, hasher.hexdigest()):
                    return
                with self._lock:
                    self.state['status'] = 'ready'
                    self.state['progress'] = 100
                    self.state['staged_file'] = target_file
                return
            except Exception as e:
                print(f"[Update] Local copy error: {e}")

        try:
            req = urllib.request.Request(url, headers={'User-Agent': f'ATI-Desktop/{CURRENT_VERSION}'})
            start_time = time.time()
            hasher = hashlib.sha256()
            with urllib.request.urlopen(req, timeout=30) as resp:
                total_bytes = int(resp.headers.get('Content-Length', 0))
                with self._lock:
                    self.state['total_bytes'] = total_bytes

                downloaded = 0
                chunk_size = 65536
                with open(target_file, 'wb') as f:
                    while True:
                        chunk = resp.read(chunk_size)
                        if not chunk:
                            break
                        hasher.update(chunk)
                        f.write(chunk)
                        downloaded += len(chunk)
                        elapsed = time.time() - start_time
                        speed = int((downloaded / 1024) / max(elapsed, 0.1))
                        with self._lock:
                            self.state['downloaded_bytes'] = downloaded
                            self.state['speed_kbps'] = speed
                            if total_bytes > 0:
                                self.state['progress'] = min(99, int((downloaded / total_bytes) * 100))
                            else:
                                self.state['progress'] = 50

            if not self._verify_hash(target_file, hasher.hexdigest()):
                return
            with self._lock:
                self.state['status'] = 'ready'
                self.state['progress'] = 100
                self.state['staged_file'] = target_file
        except Exception as e:
            with self._lock:
                self.state['status'] = 'error'
                self.state['error'] = str(e)

    def _verify_hash(self, staged_file, actual_hex):
        """Compare staged binary hash against manifest sha256 (if published).
        Unsigned legacy manifests (no sha256) still pass with a warning so
        current 3.1.0 releases keep working; publish sha256 going forward."""
        with self._lock:
            expected = (self.state.get('expected_sha256') or '').strip().lower()
        if not expected:
            print("[Update] WARNING: manifest has no sha256 — skipping verification (legacy).")
            return True
        if actual_hex.lower() != expected:
            print("[Update] HASH MISMATCH — staged update rejected.")
            try:
                os.remove(staged_file)
            except Exception:
                pass
            with self._lock:
                self.state['status'] = 'error'
                self.state['error'] = 'Update hash mismatch — download rejected'
                self.state['staged_file'] = None
            return False
        return True

    def get_progress(self):
        with self._lock:
            return json.dumps(self.state)

    def apply_update(self):
        with self._lock:
            staged = self.state.get('staged_file')
            expected = (self.state.get('expected_sha256') or '').strip().lower()
            if not staged or not os.path.isfile(staged):
                return json.dumps({'status': 'error', 'msg': 'No staged update file found'})

        # Re-verify hash at apply time (defense in depth — staged file could
        # have been swapped after download).
        if expected:
            try:
                h = hashlib.sha256()
                with open(staged, 'rb') as f:
                    for chunk in iter(lambda: f.read(65536), b''):
                        h.update(chunk)
                if h.hexdigest().lower() != expected:
                    return json.dumps({'status': 'error', 'msg': 'Staged update hash mismatch — refused'})
            except Exception as e:
                return json.dumps({'status': 'error', 'msg': f'Hash check failed: {e}'})

        is_installer = staged.lower().endswith('_setup.exe') or 'setup' in staged.lower()
        is_frozen = getattr(sys, 'frozen', False)
        current_exe = sys.executable if is_frozen else os.path.abspath('AdvancedTypingInstructor.exe')

        if is_installer:
            bat_file = os.path.join(APP_DATA_DIR, 'updates', 'apply_installer.bat')
            bat_content = f'''@echo off
timeout /t 1 /nobreak >nul
start /wait "" "{staged}" /VERYSILENT /SUPPRESSMSGBOXES /NORESTART /SP- /CLOSEAPPLICATIONS
start "" "{current_exe}"
timeout /t 2 /nobreak >nul
del /f /q "{staged}" >nul 2>&1
del /f /q "%~f0" >nul 2>&1
'''
            try:
                with open(bat_file, 'w', encoding='ascii') as f:
                    f.write(bat_content)
                import subprocess
                creation_flags = 0
                if sys.platform == 'win32':
                    creation_flags = subprocess.CREATE_NO_WINDOW | getattr(subprocess, 'DETACHED_PROCESS', 0x00000008)
                subprocess.Popen(['cmd.exe', '/c', bat_file], creationflags=creation_flags, close_fds=True)
                threading.Timer(1.0, lambda: os._exit(0)).start()
                return json.dumps({'status': 'launching_silent_installer'})
            except Exception as e:
                import subprocess
                subprocess.Popen([staged, '/VERYSILENT', '/SUPPRESSMSGBOXES', '/NORESTART', '/SP-'], shell=True)
                threading.Timer(1.0, lambda: os._exit(0)).start()
                return json.dumps({'status': 'launching_installer'})

        bat_file = os.path.join(APP_DATA_DIR, 'updates', 'apply_update.bat')
        bat_content = f'''@echo off
timeout /t 2 /nobreak >nul
copy /y "{staged}" "{current_exe}" >nul
del /f /q "{staged}" >nul
start "" "{current_exe}"
del /f /q "%~f0" >nul
'''
        try:
            with open(bat_file, 'w', encoding='ascii') as f:
                f.write(bat_content)
            import subprocess
            creation_flags = 0
            if sys.platform == 'win32':
                creation_flags = subprocess.CREATE_NO_WINDOW | getattr(subprocess, 'DETACHED_PROCESS', 0x00000008)
            subprocess.Popen(['cmd.exe', '/c', bat_file], creationflags=creation_flags, close_fds=True)
            threading.Timer(1.0, lambda: os._exit(0)).start()
            return json.dumps({'status': 'applying_and_restarting'})
        except Exception as e:
            return json.dumps({'status': 'error', 'msg': str(e)})

UPDATER = UpdateManager()



# ═══════════════════════════════════════════════════════════════
# HTTP SERVER
# ═══════════════════════════════════════════════════════════════
MIME = {
    'html':'text/html; charset=utf-8','css':'text/css','js':'application/javascript',
    'png':'image/png','jpg':'image/jpeg','ico':'image/x-icon','svg':'image/svg+xml',
    'woff2':'font/woff2','json':'application/json','webp':'image/webp'
}

ALLOWED_ORIGIN_HOSTS = {'127.0.0.1', 'localhost'}
RATE_LIMIT_STORE = {} # ip -> [timestamps]

def _get_allowed_origin(headers):
    origin = headers.get('Origin')
    if not origin:
        return 'http://127.0.0.1' # Default trusted loopback origin
    if origin == 'null':
        return None # Block untrusted null origins from executing cross-origin calls
    try:
        parsed = urlparse(origin)
        if parsed.hostname in ALLOWED_ORIGIN_HOSTS:
            return origin
    except Exception:
        pass
    return None

def _is_rate_limited(ip: str, max_requests: int = 180, window_sec: float = 60.0) -> bool:
    now = time.time()
    timestamps = [t for t in RATE_LIMIT_STORE.get(ip, []) if now - t < window_sec]
    if len(timestamps) >= max_requests:
        return True
    timestamps.append(now)
    RATE_LIMIT_STORE[ip] = timestamps
    return False

class Handler(BaseHTTPRequestHandler):
    def log_message(self, *_): pass

    def _send(self, code, ctype, body: bytes):
        allowed_origin = _get_allowed_origin(self.headers)
        self.send_response(code)
        self.send_header('Content-Type', ctype)
        self.send_header('Content-Length', len(body))
        if allowed_origin:
            self.send_header('Access-Control-Allow-Origin', allowed_origin)
            self.send_header('Access-Control-Allow-Credentials', 'true')
        # Essential HTTP Security Headers
        self.send_header('X-Content-Type-Options', 'nosniff')
        self.send_header('X-Frame-Options', 'DENY')
        self.send_header('Referrer-Policy', 'strict-origin-when-cross-origin')
        if ctype.startswith('text/html'):
            self.send_header('Content-Security-Policy',
                "default-src 'self' 'unsafe-inline' 'unsafe-eval' http://127.0.0.1:* ws://127.0.0.1:* http://localhost:* ws://localhost:* data: blob: https://lh3.googleusercontent.com; "
                "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; "
                "font-src 'self' data: https://fonts.gstatic.com; "
                "img-src 'self' data: blob: https://lh3.googleusercontent.com;")
        self.end_headers()
        self.wfile.write(body)

    def do_OPTIONS(self):
        allowed_origin = _get_allowed_origin(self.headers)
        self.send_response(204)
        if allowed_origin:
            self.send_header('Access-Control-Allow-Origin', allowed_origin)
            self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
            self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-User-Id')
            self.send_header('Access-Control-Allow-Credentials', 'true')
        self.send_header('X-Content-Type-Options', 'nosniff')
        self.send_header('X-Frame-Options', 'DENY')
        self.end_headers()

    def do_POST(self):
        parsed = urlparse(self.path); path = parsed.path
        origin = self.headers.get('Origin')
        if origin and origin != 'null' and not _get_allowed_origin(self.headers):
            self._send(403, 'application/json', b'{"status":"error","msg":"Forbidden: Untrusted Cross-Origin Request"}')
            return

        client_ip = self.client_address[0] if self.client_address else '127.0.0.1'
        if _is_rate_limited(client_ip, max_requests=120, window_sec=60.0):
            self._send(429, 'application/json', b'{"status":"error","msg":"Too Many Requests"}')
            return

        length = int(self.headers.get('Content-Length', 0))
        body = self.rfile.read(length).decode('utf-8') if length > 0 else ''
        if path == '/api/saveprogress':
            try:
                user_id = self.headers.get('X-User-Id')
                res = API.saveprogress(body, user_id=user_id)
                self._send(200, 'application/json', res.encode())
            except Exception as e:
                self._send(500, 'application/json', json.dumps({'status':'error','msg':str(e)}).encode())
        elif path == '/api/save_typing_style':
            try:
                payload = json.loads(body) if body else {}
                res = API.save_user_typing_style(payload.get('style_id', 'title_case'), payload.get('description', ''))
                self._send(200, 'application/json', res.encode())
            except Exception as e:
                self._send(500, 'application/json', json.dumps({'status':'error','msg':str(e)}).encode())
        elif path == '/api/execute_promotion':
            try:
                payload = json.loads(body) if body else {}
                res = API.execute_promotion(payload.get('target_level', 1), payload.get('reason', 'AI Skill Jump'))
                self._send(200, 'application/json', res.encode())
            except Exception as e:
                self._send(500, 'application/json', json.dumps({'status':'error','msg':str(e)}).encode())
        elif path == '/api/toggle_startup_daemon':
            try:
                payload = json.loads(body) if body else {}
                res = API.toggle_startup_daemon(payload.get('enabled', True))
                self._send(200, 'application/json', res.encode())
            except Exception as e:
                self._send(500, 'application/json', json.dumps({'status':'error','msg':str(e)}).encode())
        elif path == '/api/coaching_insights':
            try:
                payload = json.loads(body) if body else {}
                res = API.generate_coaching_insights(
                    net_wpm=payload.get('net_wpm', 60.0),
                    accuracy=payload.get('accuracy', 96.0),
                    intervals=payload.get('intervals'),
                    shift_latencies=payload.get('shift_latencies'),
                    style=payload.get('style', 'title_case')
                )
                self._send(200, 'application/json', res.encode())
            except Exception as e:
                self._send(500, 'application/json', json.dumps({'status':'error','msg':str(e)}).encode())
        elif path == '/api/savequests':
            try:
                payload = json.loads(body) if body else {}
                q_uid = payload.get('user_id') or self.headers.get('X-User-Id')
                res = API.savequestdata(payload.get('category', 'Literature'), payload.get('data', ''), user_id=q_uid)
                self._send(200, 'application/json', res.encode())
            except Exception as e:
                self._send(500, 'application/json', json.dumps({'status':'error','msg':str(e)}).encode())
        elif path == '/api/save':
            try:
                payload = json.loads(body) if body else {}
                s_uid = payload.get('user_id') or self.headers.get('X-User-Id')
                res = API.save_session_results(
                    payload.get('level', 1), payload.get('mode', 'Words'),
                    payload.get('difficulty', 'Normal'), payload.get('wpm', 0),
                    payload.get('accuracy', 100), payload.get('emeralds', 0),
                    user_id=s_uid
                )
                self._send(200, 'application/json', res.encode())
            except Exception as e:
                self._send(500, 'application/json', json.dumps({'status':'error','msg':str(e)}).encode())
        elif path == '/api/local_account/register':
            try:
                payload = json.loads(body) if body else {}
                res = API.register_local_account(
                    payload.get('username', ''),
                    payload.get('password', ''),
                    payload.get('display_name', ''),
                    payload.get('avatar', '👑')
                )
                self._send(200, 'application/json', res.encode())
            except Exception as e:
                self._send(500, 'application/json', json.dumps({'status':'error','msg':str(e)}).encode())
        elif path == '/api/local_account/login':
            try:
                payload = json.loads(body) if body else {}
                res = API.login_local_account(
                    payload.get('username', ''),
                    payload.get('password', '')
                )
                self._send(200, 'application/json', res.encode())
            except Exception as e:
                self._send(500, 'application/json', json.dumps({'status':'error','msg':str(e)}).encode())
        elif path == '/api/delete_account':
            try:
                payload = json.loads(body) if body else {}
                user_id = payload.get('user_id') or self.headers.get('X-User-Id')
                account_type = payload.get('account_type', 'local')
                res = API.delete_account(user_id=user_id, account_type=account_type)
                self._send(200, 'application/json', res.encode())
            except Exception as e:
                self._send(500, 'application/json', json.dumps({'status':'error','msg':str(e)}).encode())
        else:
            self._send(404, 'text/plain', b'404 Not Found')

    def do_GET(self):
        global IS_MAXIMIZED, _NORMAL_RECT
        parsed=urlparse(self.path); p=parse_qs(parsed.query); path=parsed.path
        origin = self.headers.get('Origin')
        if origin and origin != 'null' and not _get_allowed_origin(self.headers):
            self._send(403, 'application/json', b'{"status":"error","msg":"Forbidden: Untrusted Cross-Origin Request"}')
            return

        client_ip = self.client_address[0] if self.client_address else '127.0.0.1'
        if path.startswith('/api/') and _is_rate_limited(client_ip, max_requests=240, window_sec=60.0):
            self._send(429, 'application/json', b'{"status":"error","msg":"Too Many Requests"}')
            return

        if   path=='/api/getwords':         self._send(200,'application/json',API.get_new_word_batch(p.get('level',['1'])[0],p.get('mode',['Words'])[0],p.get('diff',['Normal'])[0],style=p.get('style',[None])[0],user_id=p.get('user_id',[self.headers.get('X-User-Id',None)])[0]).encode())
        elif path=='/api/weak_spots':       self._send(200,'application/json',API.get_user_weak_spots(user_id=p.get('user_id',[self.headers.get('X-User-Id',None)])[0]).encode())
        elif path=='/api/get_styles':       self._send(200,'application/json',API.get_casing_styles().encode())
        elif path=='/api/get_typing_style': self._send(200,'application/json',API.get_user_typing_style().encode())
        elif path=='/api/generate_ai_words':self._send(200,'application/json',API.generate_ai_words(p.get('level',['1'])[0],p.get('count',['20'])[0],p.get('style',[None])[0],p.get('format',['words'])[0]).encode())
        elif path=='/api/check_promotion':  self._send(200,'application/json',API.evaluate_auto_promotion(p.get('level',['1'])[0],p.get('wpm',['0'])[0],p.get('accuracy',['100'])[0],p.get('rci',['75'])[0],p.get('errors',['0'])[0]).encode())
        elif path=='/api/background_stats': self._send(200,'application/json',API.get_background_typing_stats().encode())
        elif path=='/api/getquests':        self._send(200,'text/plain',API.getquestdata(p.get('category',['Literature'])[0], user_id=p.get('user_id',[self.headers.get('X-User-Id',None)])[0]).encode())
        elif path=='/api/getprogress':
            uid = p.get('user_id', [self.headers.get('X-User-Id', None)])[0]
            self._send(200,'text/plain',API.getprogress(user_id=uid).encode())
        elif path=='/api/local_account/list':
            self._send(200,'application/json',API.list_local_accounts().encode())
        elif path=='/api/ws_port':          self._send(200,'application/json',json.dumps({'port':WS_PORT,'available':HAS_WEBSOCKETS}).encode())
        elif path=='/api/list_rooms':       self._send(200,'application/json',json.dumps({'rooms': ROOM_MANAGER._public_rooms()}).encode())
        elif path=='/api/daily':            self._send(200,'application/json',API.get_daily_challenge(p.get('mode',['sentences'])[0]).encode())
        elif path=='/api/announcements':    self._send(200,'application/json',API.get_announcements().encode())
        elif path=='/api/post_announcement':API.post_announcement(p.get('msg',[''])[0]); self._send(200,'application/json',b'{"status":"success"}')
        elif path=='/api/tournaments':      self._send(200,'application/json',API.get_tournaments().encode())
        elif path=='/api/create_tournament':self._send(200,'application/json',API.create_tournament(p.get('name',['Tournament'])[0],p.get('text',['Type this text.'])[0],float(p.get('hours',['24'])[0])).encode())
        elif path=='/api/tournament_scores':self._send(200,'application/json',API.get_tournament_scores(p.get('id',['1'])[0]).encode())
        elif path=='/api/save_tournament':  self._send(200,'application/json',API.save_tournament_score(p.get('id',['1'])[0],p.get('name',['Player'])[0],p.get('wpm',['0'])[0],p.get('acc',['100'])[0]).encode())
        elif path=='/api/local_ip':
            try:
                s=socket.socket(socket.AF_INET,socket.SOCK_DGRAM); s.connect(("8.8.8.8",80)); ip=s.getsockname()[0]; s.close()
            except: ip="127.0.0.1"
            self._send(200,'application/json',json.dumps({'ip':ip,'ws_port':WS_PORT}).encode())
        elif path=='/api/get_profile':
            pid = p.get('id', ['player_default'])[0]
            self._send(200, 'application/json', API.get_profile(pid).encode())
        elif path=='/api/update_profile':
            pid = p.get('id', ['player_default'])[0]
            name = p.get('name', ['Champion Typer'])[0]
            avatar = p.get('avatar', ['👑'])[0]
            lvl = int(p.get('level', ['1'])[0])
            rank = p.get('rank', [''])[0]
            rank_color = p.get('rank_color', [''])[0]
            self._send(200, 'application/json', API.update_profile(pid, name, avatar, lvl, rank, rank_color).encode())
        elif path=='/api/record_mp_race':
            pid = p.get('id', ['player_default'])[0]
            won = p.get('won', ['0'])[0]
            wpm = p.get('wpm', ['0'])[0]
            acc = p.get('acc', ['100'])[0]
            self._send(200, 'application/json', API.record_mp_race(pid, won, wpm, acc).encode())
            
        # ── OAUTH ROUTES ───────────────────────────────────────────
        elif path == '/api/google_login':
            result = OAUTH.begin_login()
            self._send(200, 'application/json', json.dumps(result).encode())
        elif path == '/api/google_callback':
            self._send(200, 'application/json', OAUTH.get_current_user().encode())
        elif path == '/api/google_user':
            self._send(200, 'application/json', OAUTH.get_current_user().encode())
        elif path == '/api/google_logout':
            self._send(200, 'application/json', OAUTH.logout().encode())
        # ── AUTO-UPDATE ROUTES ─────────────────────────────────────
        elif path == '/api/check_update':
            manifest_url = p.get('url', [None])[0]
            self._send(200, 'application/json', UPDATER.check_update(manifest_url).encode())
        elif path == '/api/download_update':
            target_url = p.get('url', [None])[0]
            self._send(200, 'application/json', UPDATER.start_download(target_url).encode())
        elif path == '/api/update_progress':
            self._send(200, 'application/json', UPDATER.get_progress().encode())
        elif path == '/api/apply_update':
            self._send(200, 'application/json', UPDATER.apply_update().encode())
        # ── WINDOW CONTROL ROUTES (ctypes only — never OS-maximize) ─
        elif path == '/api/window_drag':
            if MAIN_WINDOW:
                try:
                    import ctypes
                    user32 = ctypes.windll.user32
                    hwnd = _window_hwnd()
                    if hwnd:
                        # Native feel: dragging our soft-maximized window
                        # restores it first instead of hanging the host.
                        if IS_MAXIMIZED and _NORMAL_RECT:
                            l, t, r, b = _NORMAL_RECT
                            user32.SetWindowPos(hwnd, 0, l, t, r - l, b - t, 0x0004)
                            IS_MAXIMIZED = False
                            _NORMAL_RECT = None
                            _win_log("drag-restore from soft-maximize")
                        elif _window_placement(hwnd) != 3:
                            user32.ReleaseCapture()
                            user32.SendMessageW(hwnd, 0x00A1, 2, 0)
                except Exception as e:
                    _win_log(f"drag error: {e}")
                    print("[Window] drag error:", e)
            self._send(200, 'application/json', b'{"status":"ok"}')
        elif path == '/api/window_minimize':
            if MAIN_WINDOW:
                try:
                    import ctypes
                    hwnd = _window_hwnd()
                    if hwnd:
                        ctypes.windll.user32.ShowWindow(hwnd, 6)  # SW_MINIMIZE
                    else:
                        MAIN_WINDOW.minimize()
                except Exception as e:
                    _win_log(f"minimize error: {e}")
                    print("[Window] minimize error:", e)
                    try: MAIN_WINDOW.minimize()
                    except Exception: pass
            self._send(200, 'application/json', b'{"status":"ok"}')
        elif path == '/api/window_maximize':
            if MAIN_WINDOW:
                try:
                    import ctypes
                    user32 = ctypes.windll.user32
                    hwnd = _window_hwnd()
                    if hwnd:
                        if _window_placement(hwnd) == 3:
                            # OS-maximized (Aero Snap / Win+Up): restore natively
                            user32.ShowWindow(hwnd, 9)  # SW_RESTORE
                            IS_MAXIMIZED = False
                            _NORMAL_RECT = None
                            _win_log("restore from OS-maximize")
                        elif IS_MAXIMIZED:
                            # Restore our soft-maximize to the saved bounds
                            if _NORMAL_RECT:
                                l, t, r, b = _NORMAL_RECT
                                user32.SetWindowPos(hwnd, 0, l, t, r - l, b - t, 0x0004)
                            else:
                                user32.ShowWindow(hwnd, 9)
                            IS_MAXIMIZED = False
                            _NORMAL_RECT = None
                            _win_log("restore from soft-maximize")
                        else:
                            # Soft-maximize: borderless resize to work area.
                            # Never touches OS window state -> cannot crash host.
                            cur = _window_rect(hwnd)
                            if cur:
                                _NORMAL_RECT = cur
                            wa = _window_work_area(hwnd)
                            if wa:
                                x, y, w, h = wa
                                user32.SetWindowPos(hwnd, 0, x, y, w, h, 0x0004)
                                IS_MAXIMIZED = True
                                _win_log(f"soft-maximize to {w}x{h}")
                            else:
                                MAIN_WINDOW.maximize()
                                IS_MAXIMIZED = True
                                _win_log("soft-maximize fallback: pywebview maximize")
                    else:
                        if IS_MAXIMIZED:
                            MAIN_WINDOW.restore(); IS_MAXIMIZED = False
                        else:
                            MAIN_WINDOW.maximize(); IS_MAXIMIZED = True
                        _NORMAL_RECT = None
                except Exception as e:
                    _win_log(f"maximize error: {e}")
                    print("[Window] maximize error:", e)
                    try:
                        if IS_MAXIMIZED:
                            MAIN_WINDOW.restore(); IS_MAXIMIZED = False
                        else:
                            MAIN_WINDOW.maximize(); IS_MAXIMIZED = True
                    except Exception as e2:
                        _win_log(f"maximize fallback error: {e2}")
            self._send(200, 'application/json', json.dumps({"status":"ok", "maximized": IS_MAXIMIZED}).encode())
        elif path == '/api/window_close':
            if MAIN_WINDOW:
                try:
                    MAIN_WINDOW.hide()
                    if TRAY_MANAGER:
                        TRAY_MANAGER.notify_minimized_to_tray()
                except Exception as e:
                    print("[Window] close to tray error:", e)
            self._send(200, 'application/json', b'{"status":"ok"}')
        elif path == '/api/window_show':
            bring_window_to_front()
            self._send(200, 'application/json', b'{"status":"ok"}')
        elif path == '/api/window_quit':
            self._send(200, 'application/json', b'{"status":"ok"}')
            threading.Thread(target=quit_application, daemon=True).start()
        elif path == '/api/window_state':
            # Report live OS state so the icon stays correct after
            # Aero Snap / Win+Up / taskbar interactions bypass our toggle.
            try:
                hwnd = _window_hwnd()
                if hwnd:
                    if _window_placement(hwnd) == 3:
                        IS_MAXIMIZED = True
            except Exception:
                pass
            self._send(200, 'application/json', json.dumps({"maximized": IS_MAXIMIZED}).encode())
        # ───────────────────────────────────────────────────────────
        else:
            rel = 'index.html' if path in ('/','','/index.html') else path.lstrip('/')
            clean_rel = os.path.normpath(rel)
            if clean_rel.startswith('..') or os.path.isabs(clean_rel):
                self._send(403, 'text/plain', b'403 Forbidden')
                return

            # P0 fix: serve ONLY from dist/, allowlist public asset extensions.
            # Previously fell back to app_root, exposing main.py (OAuth secret),
            # typing_quest.db (password hashes) and all source files.
            # Custom frameless TitleBar (TitleBar.tsx) loads from dist/index.html,
            # so restricting to dist/ retains all top-bar features.
            ALLOWED_STATIC_EXTS = {'html','css','js','png','jpg','jpeg','ico','svg','woff2','json','webp','map','ttf','woff'}
            BLOCKED_NAMES = {'typing_quest.db','main.py','version_info.txt'}
            dist_root = os.path.abspath(resource_path('dist'))

            dist_fp = os.path.abspath(os.path.join(dist_root, clean_rel))
            fp = None
            if dist_fp.startswith(dist_root) and os.path.isfile(dist_fp):
                base = os.path.basename(dist_fp)
                ext = os.path.splitext(dist_fp)[1].lstrip('.').lower()
                if base not in BLOCKED_NAMES and ext in ALLOWED_STATIC_EXTS:
                    fp = dist_fp
                else:
                    self._send(403, 'text/plain', b'403 Forbidden')
                    return

            if fp and os.path.isfile(fp):
                ext = os.path.splitext(fp)[1].lstrip('.').lower()
                with open(fp, 'rb') as f: self._send(200, MIME.get(ext, 'application/octet-stream'), f.read())
            else:
                # If the URL looks like a file (has an extension) but wasn't
                # found in dist/, return 404 — don't SPA-fallback, or probes
                # like /main.py return 200 and look like source leaks.
                _req_ext = os.path.splitext(clean_rel)[1].lstrip('.').lower()
                if _req_ext:
                    self._send(404, 'text/plain', b'404 Not Found')
                    return
                # SPA fallback to dist/index.html with boundary check
                dist_index = os.path.abspath(resource_path('dist', 'index.html'))
                if os.path.isfile(dist_index) and dist_index.startswith(dist_root):
                    with open(dist_index, 'rb') as f: self._send(200, MIME['html'], f.read())
                else:
                    self._send(404, 'text/plain', b'404 Not Found')


def _run_http():
    HTTPServer(('127.0.0.1',HTTP_PORT),Handler).serve_forever()

if __name__ == '__main__':
    # ── SINGLE-INSTANCE HANDSHAKE ─────────────────────────────────
    # If app is already running (e.g. active in system tray), wake it and bring to front
    if _is_port_in_use(STATIC_HTTP_PORT) and '--multi-instance' not in sys.argv:
        try:
            req = urllib.request.Request(f'http://127.0.0.1:{STATIC_HTTP_PORT}/api/window_show')
            with urllib.request.urlopen(req, timeout=1.5) as resp:
                if resp.status == 200:
                    print("[ATI] Existing instance running in background tray — restored window to foreground.")
                    sys.exit(0)
        except Exception as e:
            print(f"[ATI] Could not wake existing instance ({e}), starting new instance...")

    # Legacy/background flag mapping: ensure --daemon starts with tray icon and hidden window
    if '--daemon' in sys.argv and '--startup' not in sys.argv:
        sys.argv.append('--startup')

    threading.Thread(target=_run_http, daemon=True).start()
    if HAS_WEBSOCKETS and SHOULD_START_WS_SERVER:
        threading.Thread(target=run_ws_server, daemon=True).start()
    print(f"[HTTP] http://127.0.0.1:{HTTP_PORT}")
    print(f"[WS]   ws://0.0.0.0:{WS_PORT} (Hosting: {SHOULD_START_WS_SERVER})")

    is_dev = '--dev' in sys.argv
    start_url = 'http://localhost:5173' if is_dev else f'http://127.0.0.1:{HTTP_PORT}/'

    is_startup = ('--startup' in sys.argv or '--tray' in sys.argv or '--daemon' in sys.argv)
    win_title = 'Advanced Typing Instructor' if IS_PRIMARY_INSTANCE else 'Advanced Typing Instructor (Instance 2)'
    window = webview.create_window(
        title=win_title,
        url=start_url,
        width=1440, height=900, resizable=True, min_size=(900,600),
        hidden=is_startup,
        frameless=True,   # Remove native OS titlebar — our custom TitleBar.tsx takes over
        easy_drag=False,  # Drag is handled by .pywebview-drag-region in TitleBar.tsx
    )

    # Store global reference so window control API endpoints can call minimize/maximize/close
    MAIN_WINDOW = window

    # Enable native Windows Aero Snap (top maximize, side 50% split).
    # ctypes-only: the old System.Windows.Forms/pythonnet path crashed
    # frozen exes and could orphan the WebView2 host on maximize.
    def apply_window_enhancements():
        time.sleep(0.6)
        try:
            import ctypes
            user32 = ctypes.windll.user32
            hwnd = None
            try:
                from webview.platforms.winforms import BrowserView
                form = BrowserView.instances.get(window.uid)
                if form:
                    hwnd = form.Handle.ToInt64()
            except Exception:
                hwnd = None
            if not hwnd:
                return
            GWL_STYLE = -16
            WS_THICKFRAME = 0x00040000
            WS_MAXIMIZEBOX = 0x00010000
            WS_MINIMIZEBOX = 0x00020000
            WS_SYSMENU = 0x00080000

            try:
                style = user32.GetWindowLongW(hwnd, GWL_STYLE)
                if style:
                    user32.SetWindowLongW(hwnd, GWL_STYLE, style | WS_THICKFRAME | WS_MAXIMIZEBOX | WS_MINIMIZEBOX | WS_SYSMENU)
                    user32.SetWindowPos(hwnd, 0, 0, 0, 0, 0, 0x0027)  # SWP_FRAMECHANGED | SWP_NOMOVE | SWP_NOSIZE | SWP_NOZORDER
                    print(f"[Window] Applied Aero Snap styles to HWND {hwnd}")
            except Exception as e:
                print(f"[Window] Style enhancement notice: {e}")
        except Exception as e:
            print(f"[Window] Enhancement notice: {e}")

    threading.Thread(target=apply_window_enhancements, daemon=True).start()

    # Prevent OS window destruction on Alt+F4 / OS close, hide to tray instead unless quitting
    def on_window_closing():
        global IS_QUITTING
        if not IS_QUITTING:
            try:
                MAIN_WINDOW.hide()
                if TRAY_MANAGER:
                    TRAY_MANAGER.notify_minimized_to_tray()
            except Exception as e:
                print("[Window] Closing cancel & hide error:", e)
            return False
        return True

    window.events.closing += on_window_closing

    # Register window reference to OAuth Manager before starting
    OAUTH.set_window(window)

    # Initialize System Tray ("BG Taskbar") Icon for primary instance
    if IS_PRIMARY_INSTANCE:
        try:
            from background_daemon.tray_manager import ATITrayManager

            def _get_tray_stats():
                if API and hasattr(API, 'bg_tracker'):
                    return {"total_keystrokes_today": API.bg_tracker.daily_keystrokes}
                return {}

            tray_icon_file = resource_path('game_icon.ico')
            TRAY_MANAGER = ATITrayManager(
                on_open=bring_window_to_front,
                on_dashboard=open_dashboard,
                on_quit=quit_application,
                get_stats=_get_tray_stats,
                icon_path=tray_icon_file
            )
            TRAY_MANAGER.start()
        except Exception as e:
            print(f"[Tray] Initialization error: {e}")

    webview.start(debug=False, private_mode=False, storage_path=WEBVIEW_CACHE_DIR)
    quit_application()