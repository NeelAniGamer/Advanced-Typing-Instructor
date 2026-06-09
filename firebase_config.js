// ═══════════════════════════════════════════════════════════
//  firebase_config.js
//  REPLACE the placeholder values below with your own project
//  credentials from https://console.firebase.google.com
//  Instructions: see SETUP_GUIDE.md
// ═══════════════════════════════════════════════════════════

const FIREBASE_CONFIG = {
    apiKey:            "AIzaSyAwBbG5oXsydGfuTUvLXL5AiA3dkXwq1tQ",
    authDomain:        "advanced-typing-instructor.firebaseapp.com",
    projectId:         "advanced-typing-instructor",
    storageBucket:     "advanced-typing-instructor.firebasestorage.app",
    messagingSenderId: "915425696696",
    appId:             "1:915425696696:web:bb01244ed6c868d2adcd4d",
    measurementId: "G-HPBP3Z91RJ"
};

// ── Initialise ─────────────────────────────────────────────
(function initFirebase() {
    try {
        if (!firebase.apps.length) {
            firebase.initializeApp(FIREBASE_CONFIG);
        }

        const app  = firebase.app();
        const db   = firebase.firestore();
        const auth = firebase.auth();

        // Enable offline persistence (works even without internet)
        db.enablePersistence({ synchronizeTabs: true })
          .catch(err => {
              if (err.code === 'failed-precondition') {
                  console.warn('[Firebase] Multiple tabs open — persistence disabled for this tab.');
              } else if (err.code === 'unimplemented') {
                  console.warn('[Firebase] Offline persistence not supported in this browser.');
              }
          });

        // Expose globally
        window._firebaseApp  = app;
        window._firebaseDB   = db;
        window._firebaseAuth = auth;
        window._firebaseReady = true;

        // Signal other modules
        document.dispatchEvent(new Event('firebase-ready'));

        console.log('[Firebase] Initialised ✓', FIREBASE_CONFIG.projectId);

    } catch (err) {
        console.error('[Firebase] Init failed:', err.message);
        window._firebaseReady = false;

        // Show a non-blocking banner so the game still works without Firebase
        const banner = document.createElement('div');
        banner.style.cssText = [
            'position:fixed','bottom:0','left:0','right:0','z-index:99999',
            'background:rgba(255,87,34,0.95)','color:#fff','text-align:center',
            'padding:10px 16px','font-family:var(--font-main,sans-serif)',
            'font-size:0.88rem','font-weight:600',
            'display:flex','align-items:center','justify-content:center','gap:12px',
        ].join(';');
        banner.innerHTML = `
            ⚠ Firebase not configured — multiplayer &amp; cloud save disabled.
            <a href="SETUP_GUIDE.md" style="color:#fff;text-decoration:underline;" target="_blank">Setup Guide</a>
            <button onclick="this.parentElement.remove()" style="background:rgba(0,0,0,0.25);border:none;border-radius:6px;padding:4px 12px;color:#fff;cursor:pointer;font-size:0.85rem;">Dismiss</button>`;
        document.body.appendChild(banner);
    }
})();
