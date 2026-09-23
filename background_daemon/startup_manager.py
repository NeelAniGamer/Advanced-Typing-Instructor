"""
startup_manager.py — Fail-Safe Windows Startup Manager for ATI Daemon
Copyright (C) 2026 Class Of Learners. All rights reserved.

Manages automatic boot registration using dual-fail-safe strategy:
1. Windows Registry: HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Run (shows in Task Manager Startup tab)
2. Windows Startup Folder: %APPDATA%\\Microsoft\\Windows\\Start Menu\\Programs\\Startup\\ATI_Monitor.vbs (silent launcher)
"""

import os
import sys
import winreg


REG_RUN_PATH = r"Software\Microsoft\Windows\CurrentVersion\Run"
REG_APP_NAME = "ATIBackgroundMonitor"
VBS_LAUNCHER_NAME = "ATI_Monitor.vbs"


class WindowsStartupManager:
    """Configures Windows automatic startup for the background typing monitor."""

    @staticmethod
    def _get_startup_folder() -> str:
        """Returns the user's Windows Startup folder path."""
        appdata = os.environ.get('APPDATA')
        if not appdata:
            appdata = os.path.expanduser(r'~\AppData\Roaming')
        return os.path.join(appdata, r"Microsoft\Windows\Start Menu\Programs\Startup")

    @staticmethod
    def _get_vbs_path() -> str:
        return os.path.join(WindowsStartupManager._get_startup_folder(), VBS_LAUNCHER_NAME)

    @classmethod
    def is_startup_enabled(cls) -> bool:
        """Checks if startup is enabled via Registry or Startup folder."""
        # 1. Check Registry
        reg_enabled = False
        try:
            with winreg.OpenKey(winreg.HKEY_CURRENT_USER, REG_RUN_PATH, 0, winreg.KEY_READ) as key:
                winreg.QueryValueEx(key, REG_APP_NAME)
                reg_enabled = True
        except (FileNotFoundError, OSError):
            reg_enabled = False
        except Exception as e:
            print(f"[Startup Query Registry Error] {e}")

        # 2. Check Startup Folder VBS file
        vbs_enabled = os.path.exists(cls._get_vbs_path())

        return reg_enabled or vbs_enabled

    @classmethod
    def enable_startup(cls, target_path: str = None) -> bool:
        """Registers the background monitor into Windows startup with dual registration."""
        executable = None
        args = "--startup"

        if not target_path:
            if getattr(sys, 'frozen', False):
                # When packaged as a PyInstaller frozen executable, launch full app into system tray
                executable = sys.executable
                target_path = f'"{executable}" {args}'
            else:
                # Default to pythonw running main.py --startup in developer mode
                base_dir = os.path.dirname(os.path.abspath(__file__))
                main_py = os.path.abspath(os.path.join(base_dir, "..", "main.py"))
                pythonw = os.path.join(os.path.dirname(sys.executable), "pythonw.exe")
                if not os.path.exists(pythonw):
                    pythonw = sys.executable
                executable = pythonw
                target_path = f'"{pythonw}" "{main_py}" {args}'
        else:
            executable = target_path

        success = False

        # Step 1: Write to Registry
        try:
            with winreg.OpenKey(winreg.HKEY_CURRENT_USER, REG_RUN_PATH, 0, winreg.KEY_SET_VALUE) as key:
                winreg.SetValueEx(key, REG_APP_NAME, 0, winreg.REG_SZ, target_path)
                print(f"[Startup] Registry registration succeeded: {target_path}")
                success = True
        except Exception as e:
            print(f"[Startup Registry Error] {e}")

        # Step 2: Write silent VBScript to Windows Startup Folder
        try:
            startup_dir = cls._get_startup_folder()
            if os.path.exists(startup_dir):
                vbs_path = cls._get_vbs_path()
                # Create silent VBS launcher (0 = hide window, False = don't block)
                vbs_content = (
                    f'Set WshShell = CreateObject("WScript.Shell")\r\n'
                    f'WshShell.Run {repr(target_path)}, 0, False\r\n'
                )
                with open(vbs_path, "w", encoding="utf-8") as f:
                    f.write(vbs_content)
                print(f"[Startup] VBS startup launcher written to: {vbs_path}")
                success = True
        except Exception as e:
            print(f"[Startup Folder Error] {e}")

        return success

    @classmethod
    def disable_startup(cls) -> bool:
        """Removes the background monitor from Windows startup (both Registry & Startup folder)."""
        # 1. Clean Registry
        try:
            with winreg.OpenKey(winreg.HKEY_CURRENT_USER, REG_RUN_PATH, 0, winreg.KEY_SET_VALUE) as key:
                winreg.DeleteValue(key, REG_APP_NAME)
                print("[Startup] Removed registry key.")
        except FileNotFoundError:
            pass
        except Exception as e:
            print(f"[Startup Registry Delete Error] {e}")

        # 2. Clean VBS launcher in Startup Folder
        try:
            vbs_path = cls._get_vbs_path()
            if os.path.exists(vbs_path):
                os.remove(vbs_path)
                print(f"[Startup] Removed VBS launcher: {vbs_path}")
        except Exception as e:
            print(f"[Startup VBS Delete Error] {e}")

        return True
