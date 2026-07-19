"""
Advanced Typing Instructor — Native Desktop App v2.5
=====================================================
Run:   python main.py
Build: see build.bat / build.sh

Requires:  pip install pywebview requests
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

HAS_WEBSOCKETS = True

# ── Ports ─────────────────────────────────────────────────────
def _free_port():
    with socket.socket() as s:
        s.bind(('', 0)); return s.getsockname()[1]

HTTP_PORT = _free_port()
LAN_WS_PORT = _free_port()
OAUTH_CALLBACK_PORT = _free_port()

# ── LAN MULTIPLAYER ──────────────────────────────────────────
import websockets

lan_rooms = {} 
lan_state = {} 

async def lan_ws_handler(websocket):
    room_code = None
    try:
        async for message in websocket:
            data = json.loads(message)
            action = data.get('action')
            
            if action == 'create_room':
                room_code = str(random.randint(1000, 9999))
                lan_rooms[room_code] = [websocket]
                lan_state[room_code] = {'host': data.get('uid'), 'players': {data.get('uid'): data.get('profile')}, 'status': 'waiting'}
                await websocket.send(json.dumps({'type': 'room_created', 'room': room_code}))
            
            elif action == 'join_room':
                room_code = data.get('room')
                if room_code in lan_rooms:
                    lan_rooms[room_code].append(websocket)
                    lan_state[room_code]['players'][data.get('uid')] = data.get('profile')
                    await websocket.send(json.dumps({'type': 'joined', 'room': room_code}))
                    for ws in lan_rooms[room_code]:
                        await ws.send(json.dumps({'type': 'state_update', 'state': lan_state[room_code]}))
                else:
                    await websocket.send(json.dumps({'type': 'error', 'msg': 'Room not found'}))
            
            elif action == 'update_progress':
                if room_code in lan_rooms:
                    uid = data.get('uid')
                    if uid in lan_state[room_code]['players']:
                        lan_state[room_code]['players'][uid]['progress'] = data.get('progress')
                    for ws in lan_rooms[room_code]:
                        await ws.send(json.dumps({'type': 'state_update', 'state': lan_state[room_code]}))
            
            elif action == 'start_race':
                if room_code in lan_rooms:
                    lan_state[room_code]['status'] = 'playing'
                    lan_state[room_code]['text'] = data.get('text')
                    for ws in lan_rooms[room_code]:
                        await ws.send(json.dumps({'type': 'race_started', 'text': data.get('text')}))
    except:
        pass
    finally:
        if room_code in lan_rooms and websocket in lan_rooms[room_code]:
            lan_rooms[room_code].remove(websocket)
            if len(lan_rooms[room_code]) == 0:
                del lan_rooms[room_code]
                del lan_state[room_code]

async def lan_ws_server():
    async with websockets.serve(lan_ws_handler, "0.0.0.0", LAN_WS_PORT):
        await asyncio.Future()

def run_lan_ws():
    asyncio.run(lan_ws_server())

threading.Thread(target=run_lan_ws, daemon=True).start()

# UDP Discovery
UDP_PORT = 19999
def udp_discovery_listener():
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
        s.bind(('', UDP_PORT))
        while True:
            data, addr = s.recvfrom(1024)
            if data.decode() == 'DISCOVER_TYPING_SERVER':
                response = f'TYPING_SERVER:{HTTP_PORT}:{LAN_WS_PORT}'
                s.sendto(response.encode(), addr)
    except Exception as e:
        print("UDP Discovery Error:", e)

threading.Thread(target=udp_discovery_listener, daemon=True).start()

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
            self._send(200,'application/json',json.dumps({'ip':ip}).encode())
            
        # ── OAUTH ROUTES ───────────────────────────────────────────
        elif path == '/api/lan_discover':
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({'ws_port': LAN_WS_PORT}).encode())
        elif path == '/api/admin/add_quest':
            content_length = int(self.headers.get('Content-Length', 0))
            if content_length:
                body = self.rfile.read(content_length)
                quest_data = json.loads(body)
                cat = quest_data.get('category', 'daily')
                
                conn = sqlite3.connect(DB_PATH)
                c = conn.cursor()
                c.execute("SELECT quest_json FROM quests WHERE category=?", (cat,))
                row = c.fetchone()
                
                quests_arr = []
                if row and row[0]:
                    try:
                        quests_arr = json.loads(row[0])
                    except: pass
                
                quests_arr.append(quest_data)
                
                c.execute("INSERT OR REPLACE INTO quests (category, quest_json, last_updated) VALUES (?, ?, CURRENT_TIMESTAMP)", (cat, json.dumps(quests_arr)))
                conn.commit()
                conn.close()
                self._send(200, 'application/json', b'{"status": "success"}')
            else:
                self._send(400, 'application/json', b'{"status": "error"}')
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
    print(f"[HTTP] http://127.0.0.1:{HTTP_PORT}")


    window = webview.create_window(
        title='Advanced Typing Instructor',
        url=f'http://127.0.0.1:{HTTP_PORT}/',
        width=1440, height=900, resizable=True, min_size=(900,600),
    )
    
    # Register window reference to OAuth Manager before starting
    OAUTH.set_window(window)
    
    webview.start(debug=False)