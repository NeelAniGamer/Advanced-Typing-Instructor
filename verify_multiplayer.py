"""
verify_multiplayer.py — Automated Multiplayer Race Test
========================================================
Plays a full 2-player race against the real RoomManager + WebSocket
server from main.py: create room (Pages format, long text) -> join ->
ready x2 -> auto-start countdown -> race_start -> progress -> finish x2
-> race_over podium -> chat -> list_rooms.

Usage:
    python verify_multiplayer.py
Exit code 0 = all checks passed.
"""

import asyncio
import json
import socket
import sys

import websockets

import main as ati


def _free_port():
    with socket.socket() as s:
        s.bind(('127.0.0.1', 0))
        return s.getsockname()[1]


async def _recv_of(ws, want, timeout=15):
    """Read messages until one with type in `want` arrives."""
    if isinstance(want, str):
        want = {want}
    msgs = []
    async with asyncio.timeout(timeout):
        async for raw in ws:
            msg = json.loads(raw)
            msgs.append(msg)
            if msg.get('type') in want:
                return msg, msgs
    raise AssertionError(f"never received {want}")


async def _drain(ws, duration=0.2):
    """Collect any pending messages for `duration` seconds."""
    out = []
    try:
        async with asyncio.timeout(duration):
            async for raw in ws:
                out.append(json.loads(raw))
    except TimeoutError:
        pass
    return out


async def main_test():
    # Use the modern asyncio server when available (matches main.py)
    try:
        from websockets.asyncio.server import serve as ws_serve
    except ImportError:
        from websockets.server import serve as ws_serve

    port = _free_port()
    checks = []

    def check(name, cond):
        checks.append((name, bool(cond)))
        print(('  [PASS] ' if cond else '  [FAIL] ') + name)
        if not cond:
            raise AssertionError(name)

    async with ws_serve(ati.ROOM_MANAGER.handle, '127.0.0.1', port):
        # Long Pages-format race text (proves the raised 6000-char clamp)
        race_text = (
            'Touch typing is not merely the mechanical pressing of plastic caps. '
            'It is the seamless translation of conscious thought into digital expression. '
            'When the hands rest naturally upon the home row anchors, every key stroke '
            'flows with rhythmic grace, transforming physical effort into effortless velocity. '
        ) * 8
        print(f'[Test] race text length: {len(race_text)} chars')

        async with websockets.connect(f'ws://127.0.0.1:{port}') as host:
            async with websockets.connect(f'ws://127.0.0.1:{port}') as guest:
                # 1. Host creates a Pages-format room
                await host.send(json.dumps({
                    'type': 'create_room', 'name': 'HostPlayer', 'mode': 'race',
                    'text': race_text, 'max_players': 8, 'is_public': True,
                    'avatar': 'A', 'level': 12, 'rank': 'Typer',
                    'rank_color': '#fff', 'best_wpm': 60, 'races_won': 3,
                }))
                created, _ = await _recv_of(host, 'room_created')
                code = created['code']
                check('room_created with 5-char code', len(code) == 5)
                check('full Pages text survives (not truncated)', created.get('text') == race_text)
                await _recv_of(host, 'room_state', timeout=5)

                # 2. Guest joins
                await guest.send(json.dumps({'type': 'join_room', 'code': code, 'name': 'GuestPlayer'}))
                joined, _ = await _recv_of(guest, 'room_joined')
                check('guest room_joined with same text', joined.get('text') == race_text)
                st, _ = await _recv_of(guest, 'room_state', timeout=5)
                check('lobby shows 2 players', len(st.get('players', {})) == 2)

                # 2b. Public lobby listing (before racing; finished rooms hide)
                await host.send(json.dumps({'type': 'list_rooms'}))
                lst, _ = await _recv_of(host, 'rooms_list', timeout=5)
                check('room listed publicly', any(r.get('code') == code for r in lst.get('rooms', [])))

                # 3. Both ready -> auto-start countdown
                # (server tracks ready per player; host is NOT auto-ready)
                await host.send(json.dumps({'type': 'ready', 'ready': True}))
                await guest.send(json.dumps({'type': 'ready', 'ready': True}))
                counts = []
                async with asyncio.timeout(12):
                    async for raw in guest:
                        m = json.loads(raw)
                        if m.get('type') == 'countdown':
                            counts.append(m.get('count'))
                        if m.get('type') == 'race_start':
                            break
                check('countdown 3-2-1 received', counts == [3, 2, 1])
                check('race_start carries full text', len(m.get('text', '')) == len(race_text))
                # Host also gets race_start
                _, _ = await _recv_of(host, 'race_start', timeout=5)

                # 4. Live progress broadcast
                await host.send(json.dumps({'type': 'progress', 'progress': 42.5, 'wpm': 88}))
                prog, _ = await _recv_of(guest, 'progress_update', timeout=5)
                players = prog.get('players', {})
                check('progress_update reaches opponent', any(
                    p.get('progress') == 42.5 for p in players.values()))

                # 5. Chat
                await guest.send(json.dumps({'type': 'chat', 'text': 'good luck!'}))
                chat, _ = await _recv_of(host, 'chat', timeout=5)
                check('chat relay works', chat.get('text') == 'good luck!')

                # 6. Finish both -> race_over podium
                await host.send(json.dumps({'type': 'finish', 'wpm': 90}))
                await guest.send(json.dumps({'type': 'finish', 'wpm': 75}))
                over, _ = await _recv_of(host, 'race_over', timeout=10)
                podium = over.get('podium', [])
                check('podium has 2 racers', len(podium) == 2)
                check('winner ranked #1', podium[0].get('rank') == 1)

    print(f'\nALL {len(checks)} MULTIPLAYER CHECKS PASSED')
    return 0


if __name__ == '__main__':
    try:
        sys.exit(asyncio.run(main_test()))
    except Exception as e:
        print(f'\nMULTIPLAYER TEST FAILED: {e}')
        sys.exit(1)
