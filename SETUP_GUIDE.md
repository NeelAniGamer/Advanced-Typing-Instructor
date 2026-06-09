# 🔥 Firebase Setup Guide — Advanced Typing Instructor v2.5

This guide takes you from zero to fully working **global multiplayer + Google sign-in** in about 10 minutes. You do not need to write any backend code.

---

## What Firebase gives you for free

| Feature | Free Tier Limit |
|---|---|
| Firestore reads | 50,000 / day |
| Firestore writes | 20,000 / day |
| Firestore storage | 1 GB |
| Auth users | Unlimited |
| Hosting | 10 GB / month |

For a classroom or friend group this is more than enough — all free, no credit card needed.

---

## Step 1 — Create a Firebase project

1. Go to **https://console.firebase.google.com**
2. Click **"Add project"**
3. Name it e.g. `advanced-typing-instructor`
4. Disable Google Analytics (not needed) → **Create project**
5. Wait ~30 seconds for it to provision

---

## Step 2 — Add a Web App

1. In the Firebase Console, click the **`</>`** (Web) icon
2. Register a nickname e.g. `typing-game`
3. **Do NOT** tick "Also set up Firebase Hosting" yet
4. Click **Register app**
5. You will see a block like this:

```js
const firebaseConfig = {
  apiKey: "AIza...",
  authDomain: "advanced-typing-instructor.firebaseapp.com",
  projectId: "advanced-typing-instructor",
  storageBucket: "advanced-typing-instructor.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc123",
};
```

6. **Copy these values** into `firebase_config.js` — replace the `PASTE_YOUR_...` placeholders.

---

## Step 3 — Enable Google Sign-In

1. In the left sidebar → **Build → Authentication**
2. Click **Get started**
3. Under **Sign-in providers**, click **Google**
4. Toggle **Enable** → ON
5. Set a project support email (your Google account)
6. Click **Save**

---

## Step 4 — Create Firestore Database

1. In the left sidebar → **Build → Firestore Database**
2. Click **Create database**
3. Choose **"Start in production mode"** (we'll set rules below)
4. Pick a region close to your users (e.g. `europe-west` for India/Europe, `us-central` for USA)
5. Click **Done**

---

## Step 5 — Set Firestore Security Rules

In **Firestore → Rules** tab, replace everything with the following:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // Users can read/write their own profile
    match /users/{userId} {
      allow read: if true;
      allow write: if request.auth != null && request.auth.uid == userId;
    }

    // Cloud saves — only owner can read/write
    match /saves/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }

    // Multiplayer rooms — authenticated users can create + read
    match /rooms/{roomId} {
      allow read: if true;
      allow create: if request.auth != null || true; // allow anon for LAN
      allow update: if true;  // players update progress
      allow delete: if false;

      // Players sub-collection
      match /players/{playerId} {
        allow read: if true;
        allow write: if true;
        allow delete: if true;
      }

      // Chat sub-collection
      match /chat/{msgId} {
        allow read: if true;
        allow create: if true;
      }
    }

    // Tournaments
    match /tournaments/{tId} {
      allow read: if true;
      allow write: if request.auth != null;

      match /scores/{scoreId} {
        allow read: if true;
        allow create: if true;
      }
    }

    // Announcements
    match /announcements/{aId} {
      allow read: if true;
      allow write: if request.auth != null;
    }
  }
}
```

Click **Publish**.

---

## Step 6 — Add Authorized Domains

Because the game runs from a local Python server (not a real domain), you need to tell Firebase to trust it.

1. In **Authentication → Settings → Authorized domains**
2. Click **Add domain**
3. Add: `localhost`
4. Add: `127.0.0.1`
5. If you deploy the HTML files to Firebase Hosting, add that domain too.

---

## Step 7 — Add Firebase SDK to index.html

Add these **4 script tags** inside `<head>` in `index.html`, **before** `style.css`:

```html
<!-- Firebase v9 compat (works with existing code) -->
<script src="https://www.gstatic.com/firebasejs/9.22.2/firebase-app-compat.js"></script>
<script src="https://www.gstatic.com/firebasejs/9.22.2/firebase-auth-compat.js"></script>
<script src="https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore-compat.js"></script>

<!-- Your config (fill in the values from Step 2) -->
<script src="firebase_config.js"></script>
```

---

## Step 8 — Add new scripts to index.html

At the **very bottom** of `index.html`, just before `</body>`, make sure the scripts are in this exact order:

```html
<script src="script.js"></script>
<script src="firebase_mp.js"></script>    <!-- replaces multiplayer.js -->
<script src="achievements.js"></script>
<script src="google_auth.js"></script>

<!-- Remove or keep the old multiplayer.js — it is now replaced by firebase_mp.js -->
```

> ⚠ Remove `multiplayer.js` from the script tags — `firebase_mp.js` replaces it entirely.

---

## Step 9 — Add Global Leaderboard button (optional)

In the action-dock inside `index.html`, you can add:

```html
<button onclick="GoogleAuth.openGlobalLeaderboard()"
        class="compact-shop-icon"
        style="background:linear-gradient(135deg,rgba(255,213,79,0.2),rgba(255,152,0,0.1));
               border-color:rgba(255,213,79,0.35);color:#ffd54f;"
        title="World Rankings">
  🌍 World Rankings
</button>
```

---

## Step 10 — Test it

1. Run `python main.py`
2. Open the game
3. Click **Accounts** → **Continue with Google**
4. A popup should appear asking for your Google account
5. Sign in — you should see your name and photo appear in the header
6. Open **Multiplayer** → **Create Room**
7. Share the 5-letter code with a friend (or open a second browser window)
8. Both players ready up → Host clicks **Start Race** → Race begins!

---

## How Global Multiplayer Works

```
Player A (PC at home)          Player B (laptop at school)
        │                               │
        ▼                               ▼
   Firebase Firestore ◄──────────────────
        │
   Room document
   ├── code: "ABCD2"
   ├── status: "racing"
   ├── text: "The quick brown fox..."
   └── players/
       ├── uid_A: { progress: 45%, wpm: 62 }
       └── uid_B: { progress: 32%, wpm: 48 }
```

- No dedicated server needed — Firestore is the relay
- Real-time via Firestore `onSnapshot` listeners
- Works from anywhere with internet
- Offline fallback still uses the local Python server

---

## Troubleshooting

| Problem | Fix |
|---|---|
| Popup blocked | Allow popups for `127.0.0.1` in browser settings |
| "auth/unauthorized-domain" | Add `127.0.0.1` and `localhost` to Auth → Authorized Domains |
| Firestore permission denied | Re-check security rules in Step 5 |
| "Firebase not configured" banner | You haven't filled in `firebase_config.js` yet |
| Players don't see each other | Check Firestore rules allow `read: true` on rooms/players |
| Google sign-in not working in pywebview | Use popup mode — already set in `google_auth.js` |

---

## Optional: Deploy to Firebase Hosting

If you want the game to be playable in any browser without installing Python:

```bash
npm install -g firebase-tools
firebase login
firebase init hosting
# Point public directory to your game folder
firebase deploy
```

Your game will be live at `https://YOUR_PROJECT_ID.web.app` — shareable with anyone.

---

## File Summary

```
your-game-folder/
├── index.html          ← add Firebase SDK scripts to <head>
├── script.js           ← unchanged
├── style.css           ← unchanged
├── style_additions.css ← from previous update
├── firebase_config.js  ← FILL IN your credentials here ← NEW
├── firebase_mp.js      ← replaces multiplayer.js       ← NEW
├── google_auth.js      ← Google sign-in + cloud save   ← NEW
├── achievements.js     ← from previous update
├── main.py             ← local Python HTTP server (unchanged)
└── SETUP_GUIDE.md      ← this file
```
