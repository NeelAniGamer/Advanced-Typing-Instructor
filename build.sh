#!/usr/bin/env bash
# ═══════════════════════════════════════════════════════════
#  BUILD SCRIPT — Advanced Typing Instructor (Mac / Linux)
#  Creates:
#    macOS → dist/AdvancedTypingInstructor.app
#    Linux → dist/AdvancedTypingInstructor  (single binary)
#  Run: chmod +x build.sh && ./build.sh
# ═══════════════════════════════════════════════════════════

set -e
echo ""
echo " ============================================"
echo "  Advanced Typing Instructor — Build Script"
echo " ============================================"
echo ""

# ── Detect OS ─────────────────────────────────────────────
OS="$(uname -s)"
if [ "$OS" = "Darwin" ]; then
    PLATFORM="macOS"
    SEPARATOR=":"
else
    PLATFORM="Linux"
    SEPARATOR=":"
fi
echo " Platform: $PLATFORM"

# ── Check Python ──────────────────────────────────────────
if ! command -v python3 &>/dev/null; then
    echo " ERROR: python3 not found. Install from https://python.org"
    exit 1
fi
python3 --version

# ── Install dependencies ──────────────────────────────────
echo ""
echo " [1/4] Installing dependencies..."
pip3 install pyinstaller pywebview websockets --quiet --upgrade

# ── Clean ─────────────────────────────────────────────────
echo " [2/4] Cleaning previous build..."
rm -rf dist/AdvancedTypingInstructor dist/AdvancedTypingInstructor.app build AdvancedTypingInstructor.spec

# ── Build ─────────────────────────────────────────────────
echo " [3/4] Compiling (1-3 minutes)..."

# Build the add-data arguments
ADD_DATA=""
for f in index.html style.css script.js patches.js style_additions.css \
          achievements.js firebase_mp.js firebase_config.js google_auth.js \
          multiplayer.js html_additions.html emerald.png download.png; do
    [ -f "$f" ] && ADD_DATA="$ADD_DATA --add-data \"$f${SEPARATOR}.\""
done

ICON_FLAG=""
if [ "$PLATFORM" = "macOS" ] && [ -f "icon.icns" ]; then
    ICON_FLAG="--icon icon.icns"
elif [ -f "icon.png" ]; then
    ICON_FLAG="--icon icon.png"
fi

# macOS: --windowed creates a .app bundle
# Linux: --windowed suppresses the terminal window
eval python3 -m PyInstaller \
    --onefile \
    --windowed \
    --name "AdvancedTypingInstructor" \
    $ADD_DATA \
    --hidden-import websockets \
    --hidden-import websockets.server \
    --hidden-import websockets.legacy \
    --hidden-import websockets.legacy.server \
    --collect-all webview \
    $ICON_FLAG \
    main.py

echo " [4/4] Finalising..."
[ -f typing_quest.db ] && cp typing_quest.db dist/

echo ""
echo " ============================================"
if [ "$PLATFORM" = "macOS" ]; then
    echo "  BUILD COMPLETE!"
    echo "  Output: dist/AdvancedTypingInstructor.app"
    echo ""
    echo "  To run:  open dist/AdvancedTypingInstructor.app"
    echo "  To distribute: zip the .app and share it."
    echo ""
    echo "  Note: On first run, macOS may block it."
    echo "  Fix: System Preferences → Security → Open Anyway"
else
    echo "  BUILD COMPLETE!"
    echo "  Output: dist/AdvancedTypingInstructor"
    echo ""
    echo "  To run:  ./dist/AdvancedTypingInstructor"
fi
echo " ============================================"
echo ""
