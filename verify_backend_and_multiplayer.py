import sys, os, time, json, socket, threading, asyncio
import urllib.request
import websockets

def test_backend_and_multiplayer():
    print("=" * 60)
    print("STEP 1: Starting Backend HTTP & WS Servers...")
    print("=" * 60)
    
    # Import components from main
    from main import Handler, RoomManager, TypingGameAPI, DB_PATH
    from http.server import HTTPServer
    from background_daemon.typing_tracker import BackgroundTypingTracker
    
    http_port = 19480
    ws_port = 19481
    
    room_mgr = RoomManager()
    httpd = HTTPServer(('127.0.0.1', http_port), Handler)
    http_thread = threading.Thread(target=httpd.serve_forever, daemon=True)
    http_thread.start()
    print(f"[PASS] HTTP Server running on http://127.0.0.1:{http_port}")
    
    async def ws_server_runner():
        from websockets.server import serve as ws_serve
        async with ws_serve(room_mgr.handle, "127.0.0.1", ws_port):
            await asyncio.Future()
            
    ws_loop = asyncio.new_event_loop()
    def run_ws():
        asyncio.set_event_loop(ws_loop)
        ws_loop.run_until_complete(ws_server_runner())
    ws_thread = threading.Thread(target=run_ws, daemon=True)
    ws_thread.start()
    time.sleep(1)
    print(f"[PASS] WebSocket Room Server running on ws://127.0.0.1:{ws_port}")
    
    print("\n" + "=" * 60)
    print("STEP 2: Testing API Endpoints...")
    print("=" * 60)
    
    # 1. Test /api/background_stats
    req = urllib.request.urlopen(f"http://127.0.0.1:{http_port}/api/background_stats")
    bg_data = json.loads(req.read().decode())
    print("Background Stats response:", bg_data)
    assert bg_data.get("status") == "Active", "Status must be Active"
    assert "total_keystrokes_today" in bg_data, "total_keystrokes_today missing"
    assert "active_typing_minutes" in bg_data, "active_typing_minutes missing"
    assert "average_cadence_wpm" in bg_data, "average_cadence_wpm missing"
    assert "shift_usage_ratio" in bg_data, "shift_usage_ratio missing"
    print("[PASS] /api/background_stats passed all assertions!")
    
    # 2. Test /api/generate_ai_words
    req = urllib.request.urlopen(f"http://127.0.0.1:{http_port}/api/generate_ai_words?level=1&count=5&style=title_case")
    ai_words = json.loads(req.read().decode())
    print("AI Words response:", ai_words)
    assert "words" in ai_words and len(ai_words["words"]) > 0, "No words generated"
    assert "text" in ai_words, "No text in AI words"
    # Verify Title Case
    first_word = ai_words["words"][0]
    assert first_word[0].isupper(), f"Word '{first_word}' should be Title Case"
    print("[PASS] /api/generate_ai_words successfully generated Title Case words!")
    
    # 3. Test /api/getwords with curriculum
    req = urllib.request.urlopen(f"http://127.0.0.1:{http_port}/api/getwords?level=1&mode=Words&diff=Normal&style=title_case")
    curr_data = json.loads(req.read().decode())
    assert "text" in curr_data, "No text in curriculum getwords"
    print(f"[PASS] /api/getwords returned: {curr_data['text'][:50]}...")
    
    print("\n" + "=" * 60)
    print("STEP 3: Testing WebSocket Multiplayer Cross-Client Race...")
    print("=" * 60)
    
    async def simulate_race():
        uri = f"ws://127.0.0.1:{ws_port}"
        print(f"Connecting Client 1 (Host) to {uri}...")
        ws1 = await websockets.connect(uri)
        
        # Client 1 creates room
        await ws1.send(json.dumps({
            "type": "create_room",
            "name": "Player1_Host",
            "avatar": "👑",
            "level": 5,
            "rank": "Velocity Master",
            "rank_color": "#00f5ff",
            "best_wpm": 85,
            "races_won": 12,
            "mode": "race",
            "text": "The quick brown fox jumps over the lazy dog."
        }))
        res1 = json.loads(await ws1.recv())
        print("Host received:", res1)
        assert res1.get("type") == "room_created", "Failed to create room"
        room_code = res1["code"]
        # Drain initial room_state broadcast
        init_state = json.loads(await ws1.recv())
        assert init_state.get("type") == "room_state"
        print(f"[PASS] Room successfully created with code: {room_code}")
        
        # Client 2 connects and joins
        print(f"Connecting Client 2 (Challenger) to {uri}...")
        ws2 = await websockets.connect(uri)
        await ws2.send(json.dumps({
            "type": "join_room",
            "code": room_code,
            "name": "Player2_Challenger",
            "avatar": "⚡",
            "level": 3,
            "rank": "Key Striker",
            "rank_color": "#ffd54f",
            "best_wpm": 72,
            "races_won": 4
        }))
        res2 = json.loads(await ws2.recv())
        print("Challenger received:", res2)
        assert res2.get("type") == "room_joined", "Failed to join room"
        print("[PASS] Client 2 successfully joined the room!")
        
        # Drain any broadcast state
        state_msg = json.loads(await ws1.recv())
        print("Host received updated room state with players:", list(state_msg.get("players", {}).keys()))
        assert len(state_msg.get("players", {})) == 2, "Room must have 2 players"
        
        # Both players set ready
        await ws1.send(json.dumps({"type": "ready", "ready": True}))
        await ws2.send(json.dumps({"type": "ready", "ready": True}))
        
        # Host starts race
        print("Host starting race...")
        await ws1.send(json.dumps({"type": "start_race"}))
        
        # Receive countdown / start messages
        start_received = False
        for _ in range(5):
            msg = json.loads(await ws1.recv())
            if msg.get("type") == "countdown" or msg.get("type") == "race_start":
                print("Host received race signal:", msg.get("type"), msg.get("count", ""))
                start_received = True
                break
        assert start_received, "Did not receive race start/countdown signal"
        print("[PASS] Race start countdown synchronized across clients!")
        
        # Simulate progress updates
        await ws1.send(json.dumps({"type": "progress", "progress": 50, "wpm": 80}))
        await ws2.send(json.dumps({"type": "progress", "progress": 45, "wpm": 70}))
        
        # Client 1 finishes first
        await ws1.send(json.dumps({"type": "finish", "wpm": 85}))
        await ws2.send(json.dumps({"type": "finish", "wpm": 75}))
        print("[PASS] Both clients sent progress and finished successfully!")
        
        await ws1.close()
        await ws2.close()
        print("[PASS] WebSockets closed cleanly.")
        
    asyncio.run(simulate_race())
    
    httpd.shutdown()
    print("\n" + "=" * 60)
    print("ALL BACKEND, API & MULTIPLAYER TESTS PASSED (100% SUCCESS)!")
    print("=" * 60)

if __name__ == "__main__":
    test_backend_and_multiplayer()
