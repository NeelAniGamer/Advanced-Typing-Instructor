# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview
**Advanced Typing Instructor (ATI 1.4)** is a native desktop typing application. It uses a Python backend (`pywebview`) to serve a web-based frontend and provide system-level capabilities (DB access, local servers, OAuth).

## Running / Developing

### Local Development
To run the application in development mode:
1. Install dependencies:
   ```bash
   pip install pywebview websockets requests
   ```
2. Launch the app:
   ```bash
   python main.py
   ```
The app will start a local HTTP server (for the UI and API) and a WebSocket server (for multiplayer).

### Building the Executable
The project is bundled into a standalone `.exe` using PyInstaller.
- **Windows:** Run `build.bat`
- **POSIX:** Run `build.sh`
- The build configuration is defined in `AdvancedTypingInstructor.spec`.

## Architecture

### Backend (`main.py`)
The backend is a single Python file that coordinates several systems:
- **`pywebview` Window:** Creates the desktop window and loads the local HTTP server.
- **HTTP Server (`Handler` class):**
  - Serves static frontend assets (`index.html`, `script.js`, etc.).
  - Provides a REST API (`/api/...`) for game logic, progress saving, and tournament management.
- **`TypingGameAPI`:**
  - Manages the SQLite database (`typing_quest.db`).
  - Generates word batches (fetching random content from Wikipedia).
  - Handles daily challenges and tournament state.
- **`OAuthManager`:** Implements the Google OAuth2 PKCE flow, launching the system browser for authentication and listening for the callback on a random port.
- **`RoomManager`:** Manages multiplayer race rooms via a WebSocket server.
- **`UpdateManager`:** Checks remote version manifest (`ati-version.json`), streams chunked binary updates with telemetry, and replaces running executables via detached batch swapper.
- **Inno Setup Installer:** `Advanced Typing Instructor.iss` compiles into `Output\AdvancedTypingInstructor_Setup.exe` via Inno Setup 6 (`ISCC.exe`).
- **Site Distribution:** `c:\Users\neelg\OneDrive\Desktop\Vercel` hosts `ati-version.json`, `AdvancedTypingInstructor_Setup.exe`, and `AdvancedTypingInstructor.exe`.

### Frontend
- **UI:** HTML/CSS (`index.html`, `style.css`, `ui_fixes.css`).
- **Logic:** JavaScript (`script.js`, `achievements.js`, `patches.js`).
- **Integration:** Communicates with the Python backend via `fetch()` calls to the local API and WebSockets for real-time multiplayer synchronization.

### Data Storage
- **Local DB:** `typing_quest.db` (SQLite) stores session history, quests, player progress, and tournaments.
- **Cloud Sync:** Firebase integration (`firebase_config.js`, `firebase_mp.js`) provides optional cloud saves and multiplayer capabilities.

## Key Implementation Details
- **Multiplayer:** Uses a room-code system. The host's local IP is shared with clients to connect to the WebSocket server.
- **Content Generation:** The `TypingGameAPI` fetches random Wikipedia summaries to generate dynamic typing text for different difficulties.
- **Auth Flow:** Google Login $\rightarrow$ System Browser $\rightarrow$ Local Callback $\rightarrow$ Backend $\rightarrow$ Frontend `receiveGoogleUser()` call.
- **Scaling:** The app uses `resource_path()` for PyInstaller compatibility (handling `_MEIPASS`).

## Common Change Patterns
- **Adding a new API endpoint:** Add a new `elif path == '...'` block in the `Handler.do_GET` method and implement the corresponding logic in `TypingGameAPI`.
- **Updating UI/Styles:** Modify `style.css` or `ui_fixes.css`.
- **Adjusting Game Logic:** Edit `script.js` for frontend behavior or `main.py` for backend rules.
- **Modifying DB Schema:** Update the `_init_db` method in `TypingGameAPI`.
