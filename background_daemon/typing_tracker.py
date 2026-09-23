"""
typing_tracker.py — Privacy-First Windows Background Cadence Tracker
Copyright (C) 2026 Class Of Learners. All rights reserved.

Monitors real-world typing volume, inter-keystroke intervals, and natural speed
across Windows applications with ZERO KEYLOGGING (strictly anonymous timing).
"""

import sys
import os
import time
import sqlite3
import threading
import ctypes
from ctypes import wintypes
from datetime import datetime
from typing import Dict, Any, Optional

user32 = ctypes.windll.user32
kernel32 = ctypes.windll.kernel32

WH_KEYBOARD_LL = 13
WM_KEYDOWN = 0x0100
WM_SYSKEYDOWN = 0x0104

HOOKPROC = ctypes.WINFUNCTYPE(ctypes.c_longlong, ctypes.c_int, wintypes.WPARAM, wintypes.LPARAM)

# Define explicit 64-bit safe ctypes function signatures
user32.SetWindowsHookExW.argtypes = [ctypes.c_int, HOOKPROC, wintypes.HINSTANCE, wintypes.DWORD]
user32.SetWindowsHookExW.restype = wintypes.HHOOK
user32.CallNextHookEx.argtypes = [wintypes.HHOOK, ctypes.c_int, wintypes.WPARAM, wintypes.LPARAM]
user32.CallNextHookEx.restype = ctypes.c_longlong
user32.UnhookWindowsHookEx.argtypes = [wintypes.HHOOK]
user32.UnhookWindowsHookEx.restype = wintypes.BOOL

class KBDLLHOOKSTRUCT(ctypes.Structure):
    _fields_ = [
        ("vkCode", wintypes.DWORD),
        ("scanCode", wintypes.DWORD),
        ("flags", wintypes.DWORD),
        ("time", wintypes.DWORD),
        ("dwExtraInfo", ctypes.POINTER(wintypes.ULONG))
    ]


class BackgroundTypingTracker:
    """Headless background tracker collecting aggregated timing and volume metrics."""

    def __init__(self, db_path: str):
        self.db_path = db_path
        self.hook = None
        self.running = False
        self.lock = threading.Lock()
        self._hook_callback = None

        # Telemetry variables
        self.daily_keystrokes = 0
        self.shift_keystrokes = 0
        self.backspace_keystrokes = 0
        self.shift_ratio = 0.12
        self.last_key_time = 0.0
        self.active_seconds = 0.0
        self.burst_strokes = 0
        self.burst_start_time = 0.0
        self.intervals = []
        self.current_date = datetime.now().strftime("%Y-%m-%d")
        self._init_db()
        self._hydrate_today_stats()

    def _init_db(self):
        """Creates the background telemetry table if it does not exist."""
        try:
            conn = sqlite3.connect(self.db_path, timeout=10.0)
            conn.execute("PRAGMA journal_mode=WAL;")
            c = conn.cursor()
            c.execute("""
                CREATE TABLE IF NOT EXISTS background_telemetry (
                    date TEXT PRIMARY KEY,
                    total_keystrokes INTEGER DEFAULT 0,
                    active_minutes REAL DEFAULT 0.0,
                    avg_wpm REAL DEFAULT 0.0,
                    peak_burst_wpm REAL DEFAULT 0.0,
                    shift_keystrokes INTEGER DEFAULT 0,
                    backspace_keystrokes INTEGER DEFAULT 0,
                    last_active DATETIME DEFAULT CURRENT_TIMESTAMP
                )
            """)
            try:
                c.execute("ALTER TABLE background_telemetry ADD COLUMN shift_keystrokes INTEGER DEFAULT 0")
            except Exception:
                pass
            try:
                c.execute("ALTER TABLE background_telemetry ADD COLUMN backspace_keystrokes INTEGER DEFAULT 0")
            except Exception:
                pass
            conn.commit()
            conn.close()
        except Exception as e:
            print(f"[Tracker DB Init Error] {e}")

    def _hydrate_today_stats(self):
        """Hydrates in-memory counters from today's persisted records to avoid data reset on restart."""
        try:
            today = datetime.now().strftime("%Y-%m-%d")
            self.current_date = today
            conn = sqlite3.connect(self.db_path, timeout=10.0)
            conn.execute("PRAGMA journal_mode=WAL;")
            c = conn.cursor()
            row = c.execute("SELECT total_keystrokes, active_minutes, shift_keystrokes FROM background_telemetry WHERE date=?", (today,)).fetchone()
            conn.close()
            if row:
                with self.lock:
                    self.daily_keystrokes = int(row[0] or 0)
                    self.active_seconds = float(row[1] or 0.0) * 60.0
                    self.shift_keystrokes = int(row[2] or 0)
                    self.shift_ratio = round(self.shift_keystrokes / max(self.daily_keystrokes, 1), 2)
        except Exception as e:
            print(f"[Tracker DB Hydrate Error] {e}")

    def _sync_to_db(self):
        """Persists aggregated daily totals to SQLite with date-rollover protection."""
        today = datetime.now().strftime("%Y-%m-%d")
        with self.lock:
            if hasattr(self, 'current_date') and self.current_date and self.current_date != today:
                # Midnight rollover: start a clean day counter
                self.daily_keystrokes = 0
                self.active_seconds = 0.0
                self.shift_keystrokes = 0
                self.shift_ratio = 0.12
                self.current_date = today

            total_strokes = self.daily_keystrokes
            shift_strokes = self.shift_keystrokes
            backspace_strokes = self.backspace_keystrokes
            active_mins = round(self.active_seconds / 60.0, 1)
            # Estimate standard WPM: (keystrokes / 5) / active_minutes
            avg_wpm = round((total_strokes / 5.0) / max(active_mins, 1.0), 1) if active_mins > 0 else 0.0
            self.shift_ratio = round(shift_strokes / max(total_strokes, 1), 2) if total_strokes > 0 else 0.12

        try:
            conn = sqlite3.connect(self.db_path, timeout=10.0)
            conn.execute("PRAGMA journal_mode=WAL;")
            c = conn.cursor()
            c.execute("""
                INSERT INTO background_telemetry (date, total_keystrokes, active_minutes, avg_wpm, shift_keystrokes, backspace_keystrokes, last_active)
                VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
                ON CONFLICT(date) DO UPDATE SET
                    total_keystrokes = MAX(total_keystrokes, excluded.total_keystrokes),
                    active_minutes = MAX(active_minutes, excluded.active_minutes),
                    avg_wpm = CASE WHEN excluded.avg_wpm > 0 THEN excluded.avg_wpm ELSE avg_wpm END,
                    shift_keystrokes = MAX(shift_keystrokes, excluded.shift_keystrokes),
                    backspace_keystrokes = MAX(backspace_keystrokes, excluded.backspace_keystrokes),
                    last_active = CURRENT_TIMESTAMP
            """, (today, total_strokes, active_mins, avg_wpm, shift_strokes, backspace_strokes))
            conn.commit()
            conn.close()
        except Exception as e:
            print(f"[Tracker DB Sync Error] {e}")

    def on_keystroke(self, is_shift: bool = False, is_backspace: bool = False):
        """Called upon any keystroke event across Windows."""
        try:
            now = time.perf_counter()
            with self.lock:
                self.daily_keystrokes += 1
                if is_shift:
                    self.shift_keystrokes += 1
                if is_backspace:
                    self.backspace_keystrokes += 1
                self.shift_ratio = round(self.shift_keystrokes / max(self.daily_keystrokes, 1), 2)

                if self.last_key_time > 0:
                    dt = (now - self.last_key_time) * 1000.0  # ms
                    if dt < 3000.0:  # Active typing interval (< 3 seconds)
                        self.active_seconds += (now - self.last_key_time)
                        if not hasattr(self, 'intervals'):
                            self.intervals = []
                        if len(self.intervals) < 200:
                            self.intervals.append(dt)

                self.last_key_time = now
        except Exception as e:
            # Never let telemetry calculation crash the hook
            pass

    def start_hook(self):
        """Installs the Win32 low-level hook and pumps Windows messages."""
        def hook_proc(nCode, wParam, lParam):
            try:
                if nCode >= 0 and wParam in (WM_KEYDOWN, WM_SYSKEYDOWN):
                    is_shift = False
                    is_backspace = False
                    try:
                        if lParam:
                            kb_struct = ctypes.cast(lParam, ctypes.POINTER(KBDLLHOOKSTRUCT)).contents
                            vk = kb_struct.vkCode
                            # VK_SHIFT=0x10, VK_LSHIFT=0xA0, VK_RSHIFT=0xA1
                            is_shift = vk in (0x10, 0xA0, 0xA1)
                            # VK_BACK=0x08
                            is_backspace = (vk == 0x08)
                    except Exception:
                        pass
                    self.on_keystroke(is_shift=is_shift, is_backspace=is_backspace)
            except Exception:
                pass
            return user32.CallNextHookEx(self.hook, nCode, wParam, lParam)

        self._hook_callback = HOOKPROC(hook_proc)
        # Passing 0 as hMod is required for WH_KEYBOARD_LL in the local process
        self.hook = user32.SetWindowsHookExW(
            WH_KEYBOARD_LL,
            self._hook_callback,
            0,
            0
        )

        if not self.hook:
            err = ctypes.GetLastError()
            print(f"[Tracker Error] Failed to install low-level keyboard hook. Win32 Error: {err}")
            return

        self.running = True
        print(f"[Tracker] Privacy-First Windows Background Cadence Hook active (handle: {self.hook}).")

        # Background database sync daemon (every 30 seconds)
        def sync_worker():
            while self.running:
                time.sleep(30)
                self._sync_to_db()

        sync_thread = threading.Thread(target=sync_worker, daemon=True)
        sync_thread.start()

        # Windows Message Pump
        msg = wintypes.MSG()
        while self.running and user32.GetMessageW(ctypes.byref(msg), 0, 0, 0) != 0:
            user32.TranslateMessage(ctypes.byref(msg))
            user32.DispatchMessageW(ctypes.byref(msg))

    def stop(self):
        self.running = False
        if self.hook:
            user32.UnhookWindowsHookEx(self.hook)
            self.hook = None
        self._sync_to_db()
        print("[Tracker] Stopped and synced final stats.")
