"""
service_runner.py — Headless Background Process for ATI Cadence Tracking
Copyright (C) 2026 Class Of Learners. All rights reserved.

Runs silently in the background on Windows startup, tracking daily typing volume
and speed across desktop apps with 100% privacy (zero keylogging).
"""

import os
import sys
import signal
try:
    from background_daemon.typing_tracker import BackgroundTypingTracker
except ImportError:
    from typing_tracker import BackgroundTypingTracker



def get_db_path():
    appdata = os.environ.get("APPDATA", os.path.expanduser("~"))
    db_folder = os.path.join(appdata, "AdvancedTypingInstructor")
    os.makedirs(db_folder, exist_ok=True)
    return os.path.join(db_folder, "typing_quest.db")


def main():
    db_path = get_db_path()
    print(f"[ATI Daemon] Starting background typing cadence monitor on {db_path}...")
    tracker = BackgroundTypingTracker(db_path=db_path)

    def sig_handler(signum, frame):
        print("[ATI Daemon] Received termination signal. Exiting cleanly.")
        tracker.stop()
        sys.exit(0)

    signal.signal(signal.SIGINT, sig_handler)
    signal.signal(signal.SIGTERM, sig_handler)

    try:
        tracker.start_hook()
    except Exception as e:
        print(f"[ATI Daemon Error] {e}")


if __name__ == "__main__":
    main()
