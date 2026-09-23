@echo off
:: ═══════════════════════════════════════════════════════════
::  BUILD SCRIPT — Advanced Typing Instructor
::  One double-click builds the full .exe from scratch:
::    1. Checks Python + Node.js
::    2. Installs Python dependencies
::    3. Builds the React Vite frontend (dist\)
::    4. Freezes everything into one .exe with PyInstaller
::    5. Stages the .exe for Inno Setup
::
::  Run: double-click build.bat   OR   run `build.bat` from cmd
:: ═══════════════════════════════════════════════════════════
setlocal EnableExtensions EnableDelayedExpansion
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
    echo  Then re-run build.bat.
    pause & exit /b 1
)

:: ── Check Node.js / npm (needed for the Vite frontend) ───
node --version >nul 2>&1
if errorlevel 1 (
    echo  ERROR: Node.js not found. Install the LTS from https://nodejs.org
    echo  Then re-run build.bat.
    pause & exit /b 1
)
call npm --version >nul 2>&1
if errorlevel 1 (
    echo  ERROR: npm not found even though Node.js exists. Reinstall Node.js LTS.
    pause & exit /b 1
)

:: ── Install / upgrade Python dependencies ─────────────────
echo  [1/5] Installing Python dependencies...
pip install pyinstaller pywebview websockets requests pystray pillow pywin32 --quiet
if errorlevel 1 (
    echo  ERROR: pip install failed. Check your internet connection.
    pause & exit /b 1
)

:: ── Close running app (it locks its own .exe) ─────────────
:: Windows locks a running .exe, so PyInstaller can neither delete nor
:: overwrite it. Detect that case FIRST with a clear message.
echo  [2/5] Checking for running app instance...
tasklist /FI "IMAGENAME eq AdvancedTypingInstructor.exe" 2>nul | find /I "AdvancedTypingInstructor.exe" >nul
if not errorlevel 1 (
    echo.
    echo  *** The app is currently RUNNING, which locks AdvancedTypingInstructor.exe. ***
    echo      Close it fully first: system-tray icon -^> Quit ^(closing the
    echo      window alone leaves it in the tray^).
    echo.
    choice /C YN /T 60 /D N /M "Close the running app automatically now"
    if errorlevel 2 (
        echo.
        echo  Build cancelled. Close the app and re-run build.bat.
        pause & exit /b 1
    )
    echo  Closing running instances...
    taskkill /F /IM AdvancedTypingInstructor.exe >nul 2>&1
    timeout /t 3 /nobreak >nul
)

:: ── Clean stale PyInstaller outputs BEFORE Vite ─────────────
:: IMPORTANT: Vite uses emptyOutDir=false, so a previous exe or a
:: dev typing_quest.db left in dist\ would be re-bundled via
:: --add-data "dist;dist" (exponential bloat + user-data leak).
echo  Cleaning stale build outputs from dist...
if exist dist\AdvancedTypingInstructor rmdir /s /q dist\AdvancedTypingInstructor
if exist dist\typing_quest.db del /f /q dist\typing_quest.db
if exist build rmdir /s /q build
:: Retry loop: OneDrive sync can briefly lock the file too.
set "TRIES=0"
:DELRETRY
if exist dist\AdvancedTypingInstructor.exe del /f /q dist\AdvancedTypingInstructor.exe >nul 2>&1
if exist dist\AdvancedTypingInstructor.exe (
    set /A TRIES+=1
    if !TRIES! GEQ 4 (
        echo.
        echo  ERROR: dist\AdvancedTypingInstructor.exe is still locked.
        echo  Close the running app completely ^(check the system tray!^) and re-run build.bat.
        pause & exit /b 1
    )
    timeout /t 2 /nobreak >nul
    goto DELRETRY
)

:: ── Install frontend dependencies (first run only is slow) ─
echo  [3/5] Installing frontend dependencies...
if not exist node_modules (
    call npm install
) else (
    echo        node_modules already present, skipping npm install.
)
if errorlevel 1 (
    echo  ERROR: npm install failed. Check your internet connection.
    pause & exit /b 1
)

:: ── Build React Vite Frontend ──────────────────────────────
echo  [4/5] Building React Vite frontend...
call npm run build
if errorlevel 1 (
    echo  ERROR: Vite build failed. Fix the TypeScript errors above.
    pause & exit /b 1
)

:: ── Run PyInstaller ───────────────────────────────────────
echo  [5/5] Compiling with PyInstaller (this takes 2-5 minutes)...

pyinstaller ^
    --noconfirm ^
    --clean ^
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
    --add-data "game_icon.ico;." ^
    --hidden-import "websockets" ^
    --hidden-import "websockets.server" ^
    --hidden-import "websockets.asyncio.server" ^
    --hidden-import "websockets.legacy" ^
    --hidden-import "websockets.legacy.server" ^
    --hidden-import "websockets.connection" ^
    --hidden-import "requests" ^
    --hidden-import "pystray" ^
    --hidden-import "pystray._win32" ^
    --hidden-import "PIL" ^
    --hidden-import "win32gui" ^
    --hidden-import "win32con" ^
    --hidden-import "background_daemon.tray_manager" ^
    --collect-all "webview" ^
    --collect-all "pystray" ^
    --collect-all "PIL" ^
    --icon "game_icon.ico" ^
    --version-file "version_info.txt" ^
    main.py

if errorlevel 1 (
    echo.
    echo  ERROR: PyInstaller failed. See error above.
    pause & exit /b 1
)

:: ── Stage exe for Inno Setup (expects root exe) ───────────
echo  Finalising...
copy /y dist\AdvancedTypingInstructor.exe AdvancedTypingInstructor.exe >nul
if errorlevel 1 (
    echo.
    echo  WARNING: Could not stage the exe at the project root ^(locked?^).
    echo  The fresh build is still at dist\AdvancedTypingInstructor.exe.
)

echo.
echo  ============================================
echo   BUILD COMPLETE!
echo   Output: dist\AdvancedTypingInstructor.exe
echo   Staged: AdvancedTypingInstructor.exe (for Inno Setup)
echo  ============================================
echo.
echo  Do NOT ship typing_quest.db — it is created per-user in
echo  %%APPDATA%%\AdvancedTypingInstructor on first run.
echo.
pause
endlocal
