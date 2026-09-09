@echo off
:: ═══════════════════════════════════════════════════════════
::  BUILD SCRIPT — Advanced Typing Instructor
::  Creates a single .exe in the dist\ folder
::  Run: double-click build.bat   OR   run from cmd
:: ═══════════════════════════════════════════════════════════

title Building Advanced Typing Instructor...
echo.
echo  ============================================
echo   Advanced Typing Instructor — Windows Build
echo  ============================================
echo.

:: ── Check Python ──────────────────────────────────────────
python --version >nul 2>&1
if errorlevel 1 (
    echo  ERROR: Python not found. Install from https://python.org
    pause & exit /b 1
)

:: ── Install / upgrade dependencies ────────────────────────
echo  [1/4] Installing dependencies...
pip install pyinstaller pywebview websockets --quiet --upgrade
if errorlevel 1 (
    echo  ERROR: pip install failed. Check your internet connection.
    pause & exit /b 1
)

:: ── Build React Vite Frontend ──────────────────────────────
echo  [2/5] Building React Vite frontend...
call npm run build
if errorlevel 1 (
    echo  ERROR: Vite build failed.
    pause & exit /b 1
)

:: ── Clean previous build ──────────────────────────────────
echo  [3/5] Cleaning previous Python build...
if exist dist\AdvancedTypingInstructor rmdir /s /q dist\AdvancedTypingInstructor
if exist dist\AdvancedTypingInstructor.exe del /f /q dist\AdvancedTypingInstructor.exe
if exist build rmdir /s /q build

:: ── Run PyInstaller ───────────────────────────────────────
echo  [4/5] Compiling with PyInstaller (this takes 1-3 minutes)...

pyinstaller ^
    --onefile ^
    --windowed ^
    --name "AdvancedTypingInstructor" ^
    --add-data "dist;dist" ^
    --add-data "index.html;." ^
    --add-data "style.css;." ^
    --add-data "ui_fixes.css;." ^
    --add-data "script.js;." ^
    --add-data "patches.js;." ^
    --add-data "achievements.js;." ^
    --add-data "firebase_mp.js;." ^
    --add-data "firebase_config.js;." ^
    --add-data "google_auth.js;." ^
    --add-data "emerald.png;." ^
    --add-data "download.png;." ^
    --hidden-import "websockets" ^
    --hidden-import "websockets.server" ^
    --hidden-import "websockets.legacy" ^
    --hidden-import "websockets.legacy.server" ^
    --hidden-import "websockets.connection" ^
    --hidden-import "requests" ^
    --hidden-import "clr" ^
    --hidden-import "pythonnet" ^
    --collect-all "webview" ^
    --icon "game_icon.ico" ^
    --version-file "version_info.txt" ^
    main.py

if errorlevel 1 (
    echo.
    echo  ERROR: PyInstaller failed. See error above.
    pause & exit /b 1
)

:: ── Copy database next to exe ──────────────────────────────
echo  [4/4] Finalising...
if exist typing_quest.db copy /y typing_quest.db dist\ >nul

echo.
echo  ============================================
echo   BUILD COMPLETE!
echo   Output: dist\AdvancedTypingInstructor.exe
echo  ============================================
echo.
echo  You can now share the .exe file.
echo  The .db save file will be created next to it on first run.
echo.
pause
