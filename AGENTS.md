# AGENTS.md — Advanced Typing Instructor (ATI 1.4)

> Agent guidance for the `ATI 1.4` project. Read this before editing files. Keep it in sync with `CLAUDE.md`.

## Overview
**Advanced Typing Instructor (ATI)** is an offline-capable desktop typing tutor and competitive typing game. It is a Python desktop application that embeds a local web frontend inside a `pywebview` window, so all game logic, persistence, and networking live in Python while the UI is plain web assets.

## Running
- **Dependencies:** `pip install pywebview websockets requests`
- **Launch:** `python main.py` — starts a local HTTP server (static assets) and a WebSocket server (multiplayer), then opens the `pywebview` window.
- **Build (Windows):** `build.bat` — PyInstaller freeze via `AdvancedTypingInstructor.spec`.
- **Build (POSIX/macOS):** `build.sh` — same PyInstaller flow.

## Architecture
### Backend (`main.py`)
Single entry point exposing several classes:
- **`Handler`** — HTTP request handler serving static files and the `/api/...` REST endpoints.
- **`TypingGameAPI`** — core game/API layer: reads/writes the SQLite database `typing_quest.db`, pulls word batches from Wikipedia, manages daily challenges and tournament state.
- **`OAuthManager`** — Google OAuth2 (PKCE) sign-in: opens the system browser and listens for the callback on a random local port.
- **`RoomManager`** — WebSocket-based multiplayer race rooms (room creation, player join, live race progress broadcast, results). Race text supports all 5 curriculum formats; text clamp is 6000 chars. Test with `python verify_multiplayer.py`.
- **`UpdateManager`** — Over-the-air auto-updater: checks remote manifest (`ati-version.json`), streams binary payloads with speed/byte telemetry, and executes detached in-place executable replacement and restart.
- **Inno Setup Installer:** `Advanced Typing Instructor.iss` compiles into `Output\AdvancedTypingInstructor_Setup.exe` via Inno Setup 6 (`ISCC.exe`).
- **Site Distribution:** `c:\Users\neelg\OneDrive\Desktop\Vercel` hosts `ati-version.json`, `AdvancedTypingInstructor_Setup.exe`, and `AdvancedTypingInstructor.exe`.

### Frontend
The frontend is a collection of static web assets loaded into the `pywebview` window.
- **UI Files:** `index.html`, `style.css`, `ui_fixes.css`
- **Logic Files:** `script.js`, `achievements.js`, `patches.js`
- **Integration Files:** `google_auth.js`, `firebase_config.js`, `firebase_mp.js`
- **Communicates with the Python backend** via `window.pywebview.api` for all game logic, progress, and API calls.
- **`script.js`** — Core game loop, typing engine, race logic, DOM updates.
- **`achievements.js`** — Achievement definitions and unlock checks.
- **`patches.js`** — Runtime patches/hotfixes applied to the game.
- **`google_auth.js`** — Handles Google OAuth2 browser-based sign-in (calls Python `OAuthManager`).
- **`firebase_config.js`** — Firebase project config (used by `firebase_mp.js`).
- **`firebase_mp.js`** — Firebase Realtime Database listener for cross-instance multiplayer sync.
- **`ui_fixes.css`** — Overrides for layout/visual bugs.

## Notes
- The `dist/` and `build/` directories are ignored by version control (build outputs).
- `google_auth copy.js` is a legacy/backup file; do not edit unless explicitly requested.
- `main.spec` is a legacy PyInstaller spec; `AdvancedTypingInstructor.spec` is the active one.
- `opencode.json` is config for the OpenCode editor/agent.
- `SETUP_GUIDE.md` and `README.md` contain setup/usage details.

## Constraints
- Do not modify `typing_quest.db` directly; always use the API.
- Do not commit `build/`, `dist/`, `typing_quest.db`, or `game_icon.ico` (binary/build artifacts).
- Keep `CLAUDE.md` and `AGENTS.md` in sync if both exist.
