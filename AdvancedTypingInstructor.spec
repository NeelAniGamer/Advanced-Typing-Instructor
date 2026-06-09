# -*- mode: python ; coding: utf-8 -*-
# ============================================================
#  Advanced Typing Instructor — PyInstaller Build Spec
#  Produces a single-folder .exe on Windows
#  and a .app bundle on macOS
# ============================================================

import os

# Collect all game assets (html / css / js / images)
here = os.path.abspath(os.path.dirname(SPEC))
assets = [
    (os.path.join(here, 'index.html'),  '.'),
    (os.path.join(here, 'style.css'),   '.'),
    (os.path.join(here, 'script.js'),   '.'),
]

# Add any PNG/ICO images that exist next to main.py
for fname in os.listdir(here):
    if fname.lower().endswith(('.png', '.jpg', '.ico', '.svg', '.gif')):
        assets.append((os.path.join(here, fname), '.'))

a = Analysis(
    ['main.py'],
    pathex=[here],
    binaries=[],
    datas=assets,
    hiddenimports=[
        'webview',
        'webview.platforms.winforms',   # Windows
        'webview.platforms.gtk',         # Linux
        'webview.platforms.cocoa',       # macOS
        'clr',
        'pythonnet',
    ],
    hookspath=[],
    hooksconfig={},
    runtime_hooks=[],
    excludes=['tkinter', 'matplotlib', 'numpy', 'pandas'],
    noarchive=False,
)

pyz = PYZ(a.pure)

exe = EXE(
    pyz,
    a.scripts,
    [],
    exclude_binaries=True,
    name='AdvancedTypingInstructor',
    debug=False,
    bootloader_ignore_signals=False,
    strip=False,
    upx=True,
    console=False,          # No black console window
    disable_windowed_traceback=False,
    target_arch=None,
    codesign_identity=None,
    entitlements_file=None,
    # icon='icon.ico',      # Uncomment and add icon.ico to use a custom icon
)

coll = COLLECT(
    exe,
    a.binaries,
    a.datas,
    strip=False,
    upx=True,
    upx_exclude=[],
    name='AdvancedTypingInstructor',
)

# macOS .app bundle
app = BUNDLE(
    coll,
    name='AdvancedTypingInstructor.app',
    # icon='icon.icns',     # Uncomment for macOS icon
    bundle_identifier='com.typinginstructor.app',
    info_plist={
        'NSHighResolutionCapable': True,
        'LSUIElement': False,
    },
)
