# -*- mode: python ; coding: utf-8 -*-
from PyInstaller.utils.hooks import collect_all

datas = [('dist', 'dist'), ('index.html', '.'), ('style.css', '.'), ('ui_fixes.css', '.'), ('script.js', '.'), ('patches.js', '.'), ('achievements.js', '.'), ('firebase_mp.js', '.'), ('firebase_config.js', '.'), ('google_auth.js', '.'), ('emerald.png', '.'), ('download.png', '.'), ('game_icon.ico', '.')]
binaries = []
hiddenimports = ['websockets', 'websockets.server', 'websockets.asyncio.server', 'websockets.legacy', 'websockets.legacy.server', 'websockets.connection', 'requests', 'pystray', 'pystray._win32', 'PIL', 'win32gui', 'win32con', 'background_daemon.tray_manager']
tmp_ret = collect_all('webview')
datas += tmp_ret[0]; binaries += tmp_ret[1]; hiddenimports += tmp_ret[2]
tmp_ret = collect_all('pystray')
datas += tmp_ret[0]; binaries += tmp_ret[1]; hiddenimports += tmp_ret[2]
tmp_ret = collect_all('PIL')
datas += tmp_ret[0]; binaries += tmp_ret[1]; hiddenimports += tmp_ret[2]


a = Analysis(
    ['main.py'],
    pathex=[],
    binaries=binaries,
    datas=datas,
    hiddenimports=hiddenimports,
    hookspath=[],
    hooksconfig={},
    runtime_hooks=[],
    excludes=[],
    noarchive=False,
    optimize=0,
)
pyz = PYZ(a.pure)

exe = EXE(
    pyz,
    a.scripts,
    a.binaries,
    a.datas,
    [],
    name='AdvancedTypingInstructor',
    debug=False,
    bootloader_ignore_signals=False,
    strip=False,
    upx=True,
    upx_exclude=[],
    runtime_tmpdir=None,
    console=False,
    disable_windowed_traceback=False,
    argv_emulation=False,
    target_arch=None,
    codesign_identity=None,
    entitlements_file=None,
    version='version_info.txt',
    icon=['game_icon.ico'],
)
