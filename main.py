"""
Advanced Typing Instructor — Native Desktop App v2.5
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
    from websockets.server import serve as ws_serve
    HAS_WEBSOCKETS = True
except ImportError:
    HAS_WEBSOCKETS = False
    print("[WS] websockets not installed — multiplayer disabled. pip install websockets")

# ── Ports ─────────────────────────────────────────────────────
def _free_port():
    with socket.socket() as s:
        s.bind(('', 0)); return s.getsockname()[1]

HTTP_PORT = _free_port()
WS_PORT   = _free_port()
OAUTH_CALLBACK_PORT = _free_port()   # picks a free random port at launch

# ── REPLACE WITH YOUR REAL OAUTH VALUES ──────────────────────
# Get them at https://console.cloud.google.com/apis/credentials
# Authorised redirect URI to add: http://127.0.0.1  (Google auto-accepts any port on 127.0.0.1)
GOOGLE_CLIENT_ID     = "592585317030-d5lidhbjnvusmhf00elqehhv9jcakvas.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET = "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"

# ── Paths ──────────────────────────────────────────────────────
def resource_path(*parts):
    base = getattr(sys, '_MEIPASS', os.path.abspath("."))
    return os.path.join(base, *parts)

def data_path(*parts):
    base = os.path.dirname(sys.executable) if getattr(sys,'frozen',False) else os.path.abspath(".")
    return os.path.join(base, *parts)

DB_PATH = data_path('typing_quest.db')

# ═══════════════════════════════════════════════════════════════
# MULTIPLAYER ROOM MANAGER
# ═══════════════════════════════════════════════════════════════
class RoomManager:
    def __init__(self):
        self.rooms   = {}   # code -> Room dict
        self.clients = {}   # ws -> {room_code, player_id, name}
        self._lock   = asyncio.Lock()

    def _gen_code(self):
        return ''.join(random.choices('ABCDEFGHJKLMNPQRSTUVWXYZ23456789', k=5))

    def _get_local_ip(self):
        try:
            s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
            s.connect(("8.8.8.8", 80)); ip = s.getsockname()[0]; s.close(); return ip
        except: return "127.0.0.1"

    async def handle(self, ws):
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
        elif t == 'set_name':
            self.clients[ws]['name'] = msg.get('name','Player')[:20]
            room = self._player_room(pid)
            if room: room['players'][pid]['name'] = self.clients[ws]['name']; await self.broadcast_state(room)

    # ── Room creation ──────────────────────────────────────────
    async def create_room(self, ws, pid, msg):
        async with self._lock:
            code = self._gen_code()
            name = self.clients[ws]['name'] = msg.get('name','Host')[:20]
            text = msg.get('text', "The quick brown fox jumps over the lazy dog.")
            mode = msg.get('mode', 'race')
            self.rooms[code] = {
                'code': code, 'host': pid, 'mode': mode,
                'text': text, 'started': False, 'finished': False,
                'max_players': int(msg.get('max_players', 8)),
                'is_public': bool(msg.get('is_public', True)),
                'created_at': time.time(), 'finish_order': [],
                'players': {
                    pid: {'id':pid,'name':name,'progress':0,'wpm':0,'ready':False,'finished':False,'rank':0,'ws':ws}
                }
            }
            self.clients[ws]['room_code'] = code
        local_ip = self._get_local_ip()
        await self._send(ws, {'type':'room_created','code':code,'host_ip':local_ip,'ws_port':WS_PORT,'text':text,'mode':mode})

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
            room['players'][pid] = {'id':pid,'name':name,'progress':0,'wpm':0,'ready':False,'finished':False,'rank':0,'ws':ws}
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
        room['players'][pid]['ready'] = msg.get('ready', True)
        await self.broadcast_state(room)
        # Auto-start if all ready and >= 2 players
        all_ready = all(p['ready'] for p in room['players'].values())
        if all_ready and len(room['players']) >= 2:
            await self.start_race(ws, pid)

    async def start_race(self, ws, pid):
        room = self._player_room(pid)
        if not room: return
        if room['host'] != pid:
            await self._send(ws, {'type':'error','msg':'Only the host can start.'}); return
        if len(room['players']) < 1:
            await self._send(ws, {'type':'error','msg':'Need at least 1 player.'}); return
        room['started'] = True; room['start_time'] = time.time()
        # 3-second countdown broadcast
        for i in [3,2,1]:
            await self.broadcast_to_room(room, {'type':'countdown','count':i})
            await asyncio.sleep(1)
        await self.broadcast_to_room(room, {'type':'race_start','text':room['text'],'start_time':time.time()})

    # ── Progress / Finish ──────────────────────────────────────
    async def update_progress(self, ws, pid, msg):
        room = self._player_room(pid)
        if not room or not room['started']: return
        if pid in room['players']:
            room['players'][pid]['progress'] = msg.get('progress', 0)
            room['players'][pid]['wpm']      = msg.get('wpm', 0)
        await self.broadcast_to_room(room, {
            'type': 'progress_update',
            'players': {p['id']: {'name':p['name'],'progress':p['progress'],'wpm':p['wpm'],'finished':p['finished']} for p in room['players'].values()}
        })

    async def player_finish(self, ws, pid, msg):
        room = self._player_room(pid)
        if not room: return
        if pid in room['players'] and not room['players'][pid]['finished']:
            room['players'][pid]['finished'] = True
            rank = len(room['finish_order']) + 1
            room['players'][pid]['rank'] = rank
            room['finish_order'].append(pid)
            elapsed = time.time() - room.get('start_time', time.time())
            wpm = msg.get('wpm', 0)
            await self.broadcast_to_room(room, {
                'type':   'player_finished',
                'id':     pid, 'name': room['players'][pid]['name'],
                'rank':   rank, 'wpm': wpm, 'time': round(elapsed, 2)
            })
            all_done = all(p['finished'] for p in room['players'].values())
            if all_done:
                await asyncio.sleep(3)
                podium = [{'id':p['id'],'name':p['name'],'rank':p['rank'],'wpm':p['wpm']} for p in sorted(room['players'].values(), key=lambda x: x['rank'])]
                await self.broadcast_to_room(room, {'type':'race_over','podium':podium})
                room['started'] = False; room['finished'] = True
                for p in room['players'].values():
                    p['progress'] = 0; p['finished'] = False; p['rank'] = 0; p['ready'] = False
                room['finish_order'] = []

    # ── Chat ──────────────────────────────────────────────────
    async def broadcast_chat(self, ws, pid, msg):
        room = self._player_room(pid)
        if not room: return
        name = self.clients[ws].get('name','?')
        text = msg.get('text','')[:200]
        await self.broadcast_to_room(room, {'type':'chat','sender':name,'text':text,'ts':time.time()})

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
            'players': {p['id']: {'name':p['name'],'ready':p['ready'],'wpm':p['wpm']} for p in room['players'].values()},
            'host': room['host'],
            'started': room['started'],
            'player_count': len(room['players'])
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
        return [{'code':r['code'],'players':len(r['players']),'max':r['max_players'],'started':r['started'],'mode':r['mode']} for r in self.rooms.values() if r.get('is_public') and not r['finished']]


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
        threading.Thread(target=self._load_wikipedia, daemon=True).start()

    def _init_db(self):
        try:
            conn = sqlite3.connect(DB_PATH); c = conn.cursor()
            c.execute('''CREATE TABLE IF NOT EXISTS sessions (id INTEGER PRIMARY KEY AUTOINCREMENT, level INTEGER, mode TEXT, difficulty TEXT, wpm INTEGER, accuracy INTEGER, rupees_earned INTEGER, timestamp DATETIME DEFAULT CURRENT_TIMESTAMP)''')
            c.execute('''CREATE TABLE IF NOT EXISTS quests (category TEXT PRIMARY KEY, quest_json TEXT, last_updated DATETIME DEFAULT CURRENT_TIMESTAMP)''')
            c.execute('''CREATE TABLE IF NOT EXISTS progress (id INTEGER PRIMARY KEY CHECK (id = 1), progress_json TEXT, last_updated DATETIME DEFAULT CURRENT_TIMESTAMP)''')
            c.execute('''CREATE TABLE IF NOT EXISTS announcements (id INTEGER PRIMARY KEY AUTOINCREMENT, message TEXT, created DATETIME DEFAULT CURRENT_TIMESTAMP, active INTEGER DEFAULT 1)''')
            c.execute('''CREATE TABLE IF NOT EXISTS tournament (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT, text TEXT, start_time DATETIME, end_time DATETIME, active INTEGER DEFAULT 1)''')
            c.execute('''CREATE TABLE IF NOT EXISTS tournament_scores (id INTEGER PRIMARY KEY AUTOINCREMENT, tournament_id INTEGER, player_name TEXT, wpm INTEGER, accuracy INTEGER, timestamp DATETIME DEFAULT CURRENT_TIMESTAMP)''')
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
                    full_text += data.get('extract','').encode('ascii','ignore').decode() + "\n\n"
            except Exception as e: print(f"[Wikipedia] {e}")
        if not full_text.strip(): return
        words  = [w.lower() for w in re.split(r'\W+', full_text) if w.isalpha() and len(w) > 1]
        unique = list(set(words))
        self.corpus_words      = unique
        self.easy_words        = [w for w in unique if len(w)<=5]  or unique
        self.normal_words      = [w for w in unique if 5<len(w)<=8] or unique
        self.hard_words        = [w for w in unique if len(w)>8]   or unique
        self.corpus_sentences  = [s.strip() for s in re.split(r'[.!?]', full_text) if len(s.strip())>20]
        self.corpus_paragraphs = [p.strip() for p in full_text.split('\n') if len(p.strip())>50]
        self.pages_pool        = [p.strip() for p in full_text.split('\n\n') if len(p.strip())>100]
        print("[Wikipedia] Loaded.")

    def get_new_word_batch(self, level, mode, difficulty):
        level=int(level); mode=str(mode).strip(); diff=str(difficulty).strip()
        pool=(self.easy_words if diff=='Easy' else self.hard_words if diff=='Hard' else self.normal_words) or self.corpus_words or ['typing','game']
        if mode=='Words':
            sel=self._no_repeat_sample(pool,min(10+level//2,60)); text=' '.join(sel); text=text[0].upper()+text[1:]
        elif mode=='Lines':
            src=self.corpus_sentences or [' '.join(self._no_repeat_sample(pool,8))]; random.shuffle(src)
            text='. '.join(s.rstrip('.') for s in src[:max(2,2+level//10)])+'.'; text=self._sentence_case(text)
        elif mode=='Paragraphs':
            src=self.corpus_paragraphs or [' '.join(self._no_repeat_sample(pool,30))]; random.shuffle(src)
            text='\n\n'.join(self._sentence_case(p) for p in src[:max(1,1+level//40)])
        elif mode=='Pages':
            src=self.pages_pool or self.corpus_paragraphs; random.shuffle(src)
            text='\n\n'.join(self._sentence_case(p) for p in src[:max(2,3+level//20)])
        elif mode=='Code':
            sel=random.sample(self.code_pool,min(1+level//10,len(self.code_pool),7)); text='\n'.join(sel)
        else:
            sel=self._no_repeat_sample(pool,15); text=' '.join(sel); text=text[0].upper()+text[1:]
        return json.dumps({'text':text,'status':'success'})

    def get_daily_challenge(self):
        today = datetime.now().strftime('%Y-%m-%d')
        if self.daily_challenge_date != today:
            random.seed(int(today.replace('-','')))
            pool = self.corpus_sentences or ["The quick brown fox jumps over the lazy dog."]
            sents = random.sample(pool, min(5, len(pool)))
            self.daily_challenge_text = ' '.join(sents)
            self.daily_challenge_date = today
            random.seed()
        return json.dumps({'text':self.daily_challenge_text,'date':today,'status':'success'})

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

    def save_session_results(self, level, mode, difficulty, wpm, accuracy, emeralds):
        try:
            conn=sqlite3.connect(DB_PATH); conn.cursor().execute('INSERT INTO sessions (level,mode,difficulty,wpm,accuracy,rupees_earned) VALUES (?,?,?,?,?,?)',(level,mode,difficulty,wpm,accuracy,emeralds)); conn.commit()
            return json.dumps({'status':'success'})
        except: return json.dumps({'status':'error'})
        finally:
            try: conn.close()
            except: pass

    def getquestdata(self, category):
        try:
            conn=sqlite3.connect(DB_PATH); row=conn.cursor().execute('SELECT quest_json FROM quests WHERE category=?',(category,)).fetchone()
            return row[0] if row else ''
        except: return ''
        finally:
            try: conn.close()
            except: pass

    def savequestdata(self, category, quest_json):
        try:
            conn=sqlite3.connect(DB_PATH); conn.cursor().execute('INSERT OR REPLACE INTO quests (category,quest_json) VALUES (?,?)',(category,quest_json)); conn.commit()
            return json.dumps({'status':'success'})
        except: return json.dumps({'status':'error'})
        finally:
            try: conn.close()
            except: pass

    def getprogress(self):
        try:
            conn=sqlite3.connect(DB_PATH); row=conn.cursor().execute('SELECT progress_json FROM progress WHERE id=1').fetchone()
            return row[0] if row else ''
        except: return ''
        finally:
            try: conn.close()
            except: pass

    def saveprogress(self, progress_json):
        try:
            conn=sqlite3.connect(DB_PATH); conn.cursor().execute('INSERT OR REPLACE INTO progress (id,progress_json) VALUES (1,?)',(progress_json,)); conn.commit()
            return json.dumps({'status':'success'})
        except Exception as e: return json.dumps({'status':'error','msg':str(e)})
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

    # ── Start mini-server just for the OAuth redirect ─────────
    def _start_callback_server(self):
        manager = self

        class CallbackHandler(BaseHTTPRequestHandler):
            def log_message(self, *_): pass

            def do_GET(self):
                parsed = urlparse(self.path)
                if parsed.path == '/oauth/callback':
                    params = parse_qs(parsed.query)
                    # Send a closing page to the real browser
                    html = b"""<!DOCTYPE html><html><head>
                    <style>body{background:#0d0d1a;color:#00f5ff;font-family:system-ui,sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;flex-direction:column;}
                    h2{font-size:2rem;margin-bottom:8px;}p{opacity:0.5;}</style></head><body>
                    <h2>&#10003; Signed in!</h2><p>Return to the Typing Instructor app.</p>
                    <script>setTimeout(()=>window.close(),2000);</script></body></html>"""
                    self.send_response(200)
                    self.send_header('Content-Type', 'text/html')
                    self.send_header('Content-Length', len(html))
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
# HTTP SERVER
# ═══════════════════════════════════════════════════════════════
MIME = {'html':'text/html; charset=utf-8','css':'text/css','js':'application/javascript','png':'image/png','jpg':'image/jpeg','ico':'image/x-icon','svg':'image/svg+xml','woff2':'font/woff2'}

class Handler(BaseHTTPRequestHandler):
    def log_message(self, *_): pass

    def _send(self, code, ctype, body: bytes):
        self.send_response(code); self.send_header('Content-Type',ctype); self.send_header('Content-Length',len(body)); self.send_header('Access-Control-Allow-Origin','*'); self.end_headers(); self.wfile.write(body)

    def do_OPTIONS(self):
        self.send_response(204); self.send_header('Access-Control-Allow-Origin','*'); self.send_header('Access-Control-Allow-Methods','GET, OPTIONS'); self.end_headers()

    def do_GET(self):
        parsed=urlparse(self.path); p=parse_qs(parsed.query); path=parsed.path
        if   path=='/api/getwords':         self._send(200,'application/json',API.get_new_word_batch(p.get('level',['1'])[0],p.get('mode',['Words'])[0],p.get('diff',['Normal'])[0]).encode())
        elif path=='/api/save':             API.save_session_results(p.get('level',['1'])[0],p.get('mode',['Words'])[0],p.get('diff',['Normal'])[0],p.get('wpm',['0'])[0],p.get('accuracy',['100'])[0],p.get('emeralds',['0'])[0]); self._send(200,'application/json',b'{"status":"success"}')
        elif path=='/api/getquests':        self._send(200,'text/plain',API.getquestdata(p.get('category',['Literature'])[0]).encode())
        elif path=='/api/savequests':       API.savequestdata(p.get('category',['Literature'])[0],p.get('data',[''])[0]); self._send(200,'application/json',b'{"status":"success"}')
        elif path=='/api/getprogress':      self._send(200,'text/plain',API.getprogress().encode())
        elif path=='/api/saveprogress':     API.saveprogress(p.get('data',[''])[0]); self._send(200,'application/json',b'{"status":"success"}')
        elif path=='/api/ws_port':          self._send(200,'application/json',json.dumps({'port':WS_PORT,'available':HAS_WEBSOCKETS}).encode())
        elif path=='/api/daily':            self._send(200,'application/json',API.get_daily_challenge().encode())
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
        # ───────────────────────────────────────────────────────────
        else:
            rel='index.html' if path in ('/','','/index.html') else path.lstrip('/')
            fp=resource_path(rel)
            if os.path.isfile(fp):
                ext=os.path.splitext(fp)[1].lstrip('.')
                with open(fp,'rb') as f: self._send(200,MIME.get(ext,'application/octet-stream'),f.read())
            else: self._send(404,'text/plain',b'404 Not Found')


def _run_http():
    HTTPServer(('127.0.0.1',HTTP_PORT),Handler).serve_forever()

if __name__ == '__main__':
    threading.Thread(target=_run_http, daemon=True).start()
    if HAS_WEBSOCKETS:
        threading.Thread(target=run_ws_server, daemon=True).start()
    print(f"[HTTP] http://127.0.0.1:{HTTP_PORT}")
    print(f"[WS]   ws://0.0.0.0:{WS_PORT}")

    window = webview.create_window(
        title='Advanced Typing Instructor',
        url=f'http://127.0.0.1:{HTTP_PORT}/',
        width=1440, height=900, resizable=True, min_size=(900,600),
    )
    
    # Register window reference to OAuth Manager before starting
    OAUTH.set_window(window)
    
    webview.start(debug=False)