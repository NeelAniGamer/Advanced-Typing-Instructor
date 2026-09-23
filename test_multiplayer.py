"""
test_multiplayer.py — Dual Instance Multiplayer Launcher
===========================================================
Launches two independent instances of Advanced Typing Instructor simultaneously
with isolated WebView2 runtime caches and linked WebSocket room networking.

Usage:
    python test_multiplayer.py
"""

import subprocess
import sys
import time
import os

def launch_instances():
    print("=" * 65)
    print("  ADVANCED TYPING INSTRUCTOR — DUAL INSTANCE MULTIPLAYER TEST")
    print("=" * 65)
    print("\n[1/3] Launching Primary Instance (Host) on port 19472 & 19473...")
    
    python_exe = sys.executable
    script_path = os.path.abspath("main.py")
    
    # Launch Instance 1 (Primary)
    # NOTE: --multi-instance is required, otherwise the single-instance
    # handshake wakes the primary and the second process exits immediately.
    p1 = subprocess.Popen([python_exe, script_path, "--instance", "1", "--multi-instance"])
    print(f"      Instance 1 PID: {p1.pid}")

    print("[2/3] Waiting 3 seconds for Primary WebSocket server to initialize...")
    time.sleep(3)

    # Launch Instance 2 (Challenger)
    print("[3/3] Launching Secondary Instance (Challenger)...")
    p2 = subprocess.Popen([python_exe, script_path, "--instance", "2", "--multi-instance"])
    print(f"      Instance 2 PID: {p2.pid}")
    
    print("\n" + "-" * 65)
    print("[OK] BOTH INSTANCES SUCCESSFULLY LAUNCHED!")
    print("-" * 65)
    print("HOW TO TEST MULTIPLAYER:")
    print("  1. In Window 1 (Host):")
    print("     - Navigate to 'Multiplayer'")
    print("     - Click 'Create Room' / 'Host Room'")
    print("     - Note the 5-letter room code (e.g., 'K7F2P')")
    print()
    print("  2. In Window 2 (Challenger):")
    print("     - Navigate to 'Multiplayer'")
    print("     - Type or paste the 5-letter room code in 'Join Room'")
    print("     - Click 'Join'")
    print()
    print("  3. Both players will appear in the room lobby!")
    print("     - Both players click 'Ready'")
    print("     - Host clicks 'Start Race'")
    print("     - Race side-by-side with live progress bars & finish podium!")
    print("-" * 65)
    print("Press Ctrl+C in this terminal to close both test instances.\n")
    
    try:
        p1.wait()
        p2.wait()
    except KeyboardInterrupt:
        print("\nTerminating test instances...")
        try:
            p1.terminate()
            p2.terminate()
        except Exception:
            pass
        print("Instances closed.")

if __name__ == "__main__":
    launch_instances()
