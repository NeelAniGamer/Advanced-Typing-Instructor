"""
verify_backend.py — Full-game backend API sweep (debugging pass)
===============================================================
Starts the real HTTP Handler from main.py on an ephemeral port and hits
every read-only /api endpoint the game uses: curriculum for all 5 modes,
AI synthesis formats, daily challenges, styles, quests, progress, rooms,
tournaments, announcements, window controls.

Usage:
    python verify_backend.py
Exit code 0 = all checks passed. Makes NO mutating calls.
"""

import json
import socket
import sys
import threading
import urllib.request
from http.server import HTTPServer

import main as ati


def _free_port():
    with socket.socket() as s:
        s.bind(('127.0.0.1', 0))
        return s.getsockname()[1]


PORT = _free_port()
server = HTTPServer(('127.0.0.1', PORT), ati.Handler)
threading.Thread(target=server.serve_forever, daemon=True).start()

passed, failed = [], []


def get(path):
    req = urllib.request.Request(f'http://127.0.0.1:{PORT}{path}')
    with urllib.request.urlopen(req, timeout=15) as resp:
        return resp.status, resp.read().decode('utf-8')


def check(name, cond, detail=''):
    (passed if cond else failed).append(name)
    print(('  [PASS] ' if cond else '  [FAIL] ') + name + (f' — {detail}' if detail and not cond else ''))


def expect_json(name, path, keys=()):
    try:
        status, body = get(path)
        data = json.loads(body)
    except Exception as e:
        check(name, False, f'{type(e).__name__}: {e}')
        return None
    ok = status == 200
    missing = [k for k in keys if isinstance(data, dict) and k not in data]
    check(name, ok and not missing, f'status={status} missing={missing} body={body[:100]}')
    return data


print('[Game] curriculum: all 5 modes x levels 1/40/120/200')
for mode in ['Words', 'Lines', 'Paragraphs', 'Pages', 'Code']:
    for lvl in [1, 40, 120, 200]:
        d = expect_json(f'getwords {mode} L{lvl}', f'/api/getwords?level={lvl}&mode={mode}&diff=Normal&style=sentence_case', ('text', 'status'))
        if d and (not d.get('text') or len(d['text'].strip()) < 10):
            check(f'getwords {mode} L{lvl} non-trivial', False, f'len={len(d.get("text",""))}')

print('[Game] AI synthesis formats')
for fmt in ['words', 'lines', 'paragraphs']:
    expect_json(f'ai {fmt}', f'/api/generate_ai_words?level=10&count=20&style=sentence_case&format={fmt}', ('text', 'status'))

print('[Game] daily challenge all formats')
for m in ['words', 'sentences', 'paragraphs', 'pages', 'code']:
    expect_json(f'daily {m}', f'/api/daily?mode={m}', ('text', 'date', 'status'))

print('[Game] styles / weak spots / promotion')
expect_json('get_styles', '/api/get_styles', ('styles',))
expect_json('get_typing_style', '/api/get_typing_style', ('style_id',))
expect_json('weak_spots', '/api/weak_spots', ())
expect_json('check_promotion', '/api/check_promotion?level=5&wpm=70&accuracy=97&rci=80&errors=1', ('status',))

print('[Game] quests / progress / background')
expect_json('getquests', '/api/getquests?category=Literature', ())
expect_json('getprogress', '/api/getprogress', ())
expect_json('background_stats', '/api/background_stats', ('status',))

print('[Game] multiplayer discovery + window controls')
expect_json('ws_port', '/api/ws_port', ('port',))
expect_json('list_rooms', '/api/list_rooms', ('rooms',))
expect_json('window_state', '/api/window_state', ('maximized',))

print('[Game] tournaments + announcements')
expect_json('tournaments', '/api/tournaments', ())
expect_json('announcements', '/api/announcements', ())

print(f'\n{len(passed)} passed, {len(failed)} failed')
if failed:
    print('FAILED:', failed)
    sys.exit(1)
print('ALL BACKEND CHECKS PASSED')
