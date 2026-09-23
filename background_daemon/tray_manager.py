"""
tray_manager.py — System Tray ("BG Taskbar") Manager for Advanced Typing Instructor
Copyright (C) 2026 Class Of Learners. All rights reserved.

Manages the Windows System Tray notification area icon, context menus,
quick actions, balloon notifications, and background cadence status.
"""

import os
import sys
import threading
import time
from typing import Callable, Optional, Dict, Any

try:
    import pystray
    from PIL import Image, ImageDraw
    HAS_PYSTRAY = True
except ImportError:
    HAS_PYSTRAY = False
    print("[Tray] pystray or Pillow not installed. System tray disabled.")


class ATITrayManager:
    """Manages the Windows Notification Area (System Tray) icon and menu."""

    def __init__(
        self,
        on_open: Callable[[], None],
        on_dashboard: Optional[Callable[[], None]] = None,
        on_quit: Optional[Callable[[], None]] = None,
        get_stats: Optional[Callable[[], Dict[str, Any]]] = None,
        icon_path: Optional[str] = None
    ):
        self.on_open = on_open
        self.on_dashboard = on_dashboard
        self.on_quit = on_quit
        self.get_stats = get_stats
        self.icon_path = icon_path
        self.icon: Optional[pystray.Icon] = None
        self._is_running = False
        self._notified_minimized = False

    def _get_image(self) -> Any:
        """Loads game_icon.ico or falls back to creating an emerald-themed ATI icon."""
        if self.icon_path and os.path.isfile(self.icon_path):
            try:
                return Image.open(self.icon_path)
            except Exception as e:
                print(f"[Tray] Error loading icon from {self.icon_path}: {e}")

        # Try relative paths
        for candidate in ["game_icon.ico", os.path.join("dist", "favicon.ico"), "icon.png"]:
            if os.path.isfile(candidate):
                try:
                    return Image.open(candidate)
                except Exception:
                    pass

        # Fallback generated 64x64 icon: emerald green square with white 'A'
        img = Image.new("RGBA", (64, 64), (16, 185, 129, 255))
        draw = ImageDraw.Draw(img)
        draw.rectangle([4, 4, 60, 60], outline=(255, 255, 255), width=2)
        return img

    def _get_stats_label(self, item=None) -> str:
        """Returns dynamic label showing background monitor status and keystroke count."""
        count = 0
        if self.get_stats:
            try:
                stats = self.get_stats()
                count = stats.get("total_keystrokes_today", 0)
            except Exception:
                pass
        if count > 0:
            return f"Background Monitor: Active ({count:,} keys today)"
        return "Background Monitor: Active"

    def _on_toggle_startup(self, icon, item):
        """Toggles Windows startup registration."""
        try:
            from background_daemon.startup_manager import WindowsStartupManager
            if WindowsStartupManager.is_startup_enabled():
                WindowsStartupManager.disable_startup()
                print("[Tray] Windows startup disabled.")
            else:
                WindowsStartupManager.enable_startup()
                print("[Tray] Windows startup enabled.")
        except Exception as e:
            print(f"[Tray] Toggle startup error: {e}")

    def _is_startup_checked(self, item=None) -> bool:
        """Checks if startup is currently enabled."""
        try:
            from background_daemon.startup_manager import WindowsStartupManager
            return WindowsStartupManager.is_startup_enabled()
        except Exception:
            return False

    def _handle_open(self, icon=None, item=None):
        if self.on_open:
            self.on_open()

    def _handle_dashboard(self, icon=None, item=None):
        if self.on_dashboard:
            self.on_dashboard()
        elif self.on_open:
            self.on_open()

    def _handle_quit(self, icon=None, item=None):
        if self.on_quit:
            self.on_quit()
        else:
            self.stop()
            sys.exit(0)

    def _build_menu(self) -> Any:
        """Constructs the system tray context menu."""
        items = [
            pystray.MenuItem("Open Advanced Typing Instructor", self._handle_open, default=True),
        ]
        if self.on_dashboard:
            items.append(pystray.MenuItem("Open Dashboard", self._handle_dashboard))
        
        items.extend([
            pystray.Menu.SEPARATOR,
            pystray.MenuItem(self._get_stats_label, None, enabled=False),
            pystray.MenuItem("Start with Windows", self._on_toggle_startup, checked=self._is_startup_checked),
            pystray.Menu.SEPARATOR,
            pystray.MenuItem("Quit Advanced Typing Instructor", self._handle_quit),
        ])
        return pystray.Menu(*items)

    def start(self):
        """Initializes and runs the tray icon in a dedicated background message loop thread."""
        if not HAS_PYSTRAY:
            return
        if self._is_running:
            return

        try:
            image = self._get_image()
            menu = self._build_menu()
            self.icon = pystray.Icon(
                name="AdvancedTypingInstructor",
                icon=image,
                title="Advanced Typing Instructor (Running in Background)",
                menu=menu
            )
            self.icon.run_detached()
            self._is_running = True
            print("[Tray] System tray icon active in Windows Notification Area.")
        except Exception as e:
            print(f"[Tray] Error launching system tray icon: {e}")

    def notify_minimized_to_tray(self):
        """Shows a Windows balloon notification on first minimize to educate the user."""
        if not self._notified_minimized and self.icon and hasattr(self.icon, "notify"):
            try:
                self.icon.notify(
                    "Advanced Typing Instructor is running in the background. Keystroke analytics & weak-key learning are active. Click the tray icon to reopen.",
                    "Running in Background"
                )
                self._notified_minimized = True
            except Exception as e:
                print(f"[Tray] Balloon notification error: {e}")

    def stop(self):
        """Cleanly destroys the tray icon."""
        self._is_running = False
        if self.icon:
            try:
                self.icon.stop()
            except Exception:
                pass
            self.icon = None
