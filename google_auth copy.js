// ═══════════════════════════════════════════════════════════
//  GOOGLE AUTH + CLOUD SAVE ENGINE v2.5
//  Handles: Google Sign-In, cloud progress sync,
//           global leaderboard, presence system
// ═══════════════════════════════════════════════════════════

const GoogleAuth = (() => {

    let db   = null;
    let auth = null;
    let user = null;
    let syncDebounce = null;

    // ── Wait for Firebase ──────────────────────────────────
    function waitForFirebase(cb) {
        if (window._firebaseReady) { cb(); return; }
        document.addEventListener('firebase-ready', cb, { once: true });
    }

    // ── Bootstrap ──────────────────────────────────────────
    function init() {
        waitForFirebase(() => {
            db   = window._firebaseDB;
            auth = window._firebaseAuth;

            auth.onAuthStateChanged(async (firebaseUser) => {
                user = firebaseUser;
                if (user) {
                    await onSignedIn(user);
                } else {
                    onSignedOut();
                }
            });
        });
    }

    // ── Sign In with Google ────────────────────────────────
    async function signInWithGoogle() {
        if (!auth) { showToast('Firebase not configured yet. See SETUP_GUIDE.md', 'error', 5000); return; }
        try {
            const provider = new firebase.auth.GoogleAuthProvider();
            provider.addScope('profile');
            provider.addScope('email');
            // Use popup (works in webview); fallback to redirect
            try {
                await auth.signInWithPopup(provider);
            } catch(popupErr) {
                if (popupErr.code === 'auth/popup-blocked' || popupErr.code === 'auth/operation-not-supported-in-this-environment') {
                    await auth.signInWithRedirect(provider);
                } else {
                    throw popupErr;
                }
            }
        } catch(e) {
            console.error('[Auth]', e);
            const friendly = {
                'auth/popup-closed-by-user':  'Sign-in cancelled.',
                'auth/network-request-failed':'No internet connection.',
                'auth/too-many-requests':     'Too many attempts. Try later.',
            };
            showToast(friendly[e.code] || `Sign-in error: ${e.message}`, 'error', 4000);
        }
    }

    // ── Sign Out ───────────────────────────────────────────
    async function signOut() {
        if (!auth) return;
        try {
            await auth.signOut();
            showToast('Signed out successfully.', 'info', 2000);
        } catch(e) {
            showToast('Sign-out failed.', 'error');
        }
    }

    // ── On signed in ──────────────────────────────────────
    async function onSignedIn(firebaseUser) {
        showToast(`Welcome, ${firebaseUser.displayName}! ☁️`, 'success', 3000);
        updateAllAuthUI(firebaseUser);
        renderAccountPanel?.();

        // Create / update user document
        const userRef = db.collection('users').doc(firebaseUser.uid);
        try {
            const doc = await userRef.get();
            if (!doc.exists) {
                await userRef.set({
                    uid:         firebaseUser.uid,
                    displayName: firebaseUser.displayName,
                    email:       firebaseUser.email,
                    photoURL:    firebaseUser.photoURL,
                    createdAt:   firebase.firestore.FieldValue.serverTimestamp(),
                    lastSeen:    firebase.firestore.FieldValue.serverTimestamp(),
                    totalRaces:  0,
                    wins:        0,
                    bestMpWpm:   0,
                    loginStreak: 1,
                    lastLoginDay: new Date().toDateString(),
                });
            } else {
                // Login streak
                const data = doc.data();
                const today = new Date().toDateString();
                const updates = { lastSeen: firebase.firestore.FieldValue.serverTimestamp() };
                if (data.lastLoginDay !== today) {
                    const last = new Date(data.lastLoginDay || 0);
                    const diff = Math.floor((new Date(today) - last) / 86400000);
                    updates.loginStreak  = diff === 1 ? (data.loginStreak||0)+1 : 1;
                    updates.lastLoginDay = today;
                    await userRef.update(updates);
                    // Show login bonus
                    showLoginBonusCloud(updates.loginStreak);
                } else {
                    await userRef.update(updates);
                }
                // Pull cloud save if local is empty
                await pullCloudSave(doc.data());
            }
        } catch(e) {
            console.warn('[Auth] user doc error:', e);
        }

        // Trigger achievements check
        if (typeof Achievements !== 'undefined') Achievements.updateXPBar();
    }

    // ── On signed out ──────────────────────────────────────
    function onSignedOut() {
        user = null;
        updateAllAuthUI(null);
        renderAccountPanel?.();
    }

    // ── Login bonus (cloud streak) ─────────────────────────
    function showLoginBonusCloud(streak) {
        const bonus = 250 * Math.min(streak, 7);
        const bar = document.getElementById('bonus-day-bar');
        if (bar) {
            bar.innerHTML = '';
            for (let i = 1; i <= 7; i++) {
                const d = document.createElement('div');
                d.className = 'streak-day' + (i < streak ? ' completed' : '') + (i === streak ? ' today' : '');
                d.textContent = 'D' + i;
                bar.appendChild(d);
            }
        }
        const bonusEl = document.getElementById('bonus-amount-display');
        if (bonusEl) bonusEl.textContent = '+' + bonus;
        const typeEl = document.getElementById('bonus-currency-type');
        if (typeEl) typeEl.textContent = 'Emeralds (Cloud Reward)';
        window._pendingLoginBonus = bonus;
        const modal = document.getElementById('login-bonus-modal');
        if (modal) modal.classList.remove('hidden');
    }

    // ── Cloud Save — Push ──────────────────────────────────
    async function pushCloudSave() {
        if (!db || !user) return;
        clearTimeout(syncDebounce);
        syncDebounce = setTimeout(async () => {
            try {
                const saveData = {
                    emeralds:     parseInt(localStorage.getItem('typingEmeralds')     || '0'),
                    diamonds:     parseInt(localStorage.getItem('typingDiamonds')     || '0'),
                    prestige:     parseInt(localStorage.getItem('typingPrestige')     || '0'),
                    xp:           parseInt(localStorage.getItem('tq_xp')             || '0'),
                    progress:     localStorage.getItem('typingProgressData')   || '{}',
                    upgradesLit:  localStorage.getItem('typingUpgrades_Owned_Lit')  || '[]',
                    upgradesCode: localStorage.getItem('typingUpgrades_Owned_Code') || '[]',
                    claimedRanks: localStorage.getItem('typingClaimedRanks')        || '[]',
                    heatmap:      localStorage.getItem('typingHeatmap')             || '{}',
                    achStats:     localStorage.getItem('tq_ach_stats')             || '{}',
                    achUnlocked:  localStorage.getItem('tq_unlocked_ach')          || '[]',
                    savedAt:      firebase.firestore.FieldValue.serverTimestamp(),
                };
                await db.collection('saves').doc(user.uid).set(saveData);
                updateSyncStatus('synced');
            } catch(e) {
                console.warn('[Save] push error:', e);
                updateSyncStatus('error');
            }
        }, 2000); // debounce 2s
    }

    // ── Cloud Save — Pull ──────────────────────────────────
    async function pullCloudSave(userData) {
        if (!db || !user) return;
        try {
            const snap = await db.collection('saves').doc(user.uid).get();
            if (!snap.exists) return;
            const cloud = snap.data();

            // Only overwrite local if cloud has more
            const localEm  = parseInt(localStorage.getItem('typingEmeralds') || '0');
            const cloudEm  = cloud.emeralds || 0;
            const localXP  = parseInt(localStorage.getItem('tq_xp') || '0');
            const cloudXP  = cloud.xp || 0;

            // Merge strategy: take the higher value for currency/XP
            if (cloudEm  > localEm)  localStorage.setItem('typingEmeralds', cloudEm);
            if (cloud.diamonds > parseInt(localStorage.getItem('typingDiamonds')||'0'))
                localStorage.setItem('typingDiamonds', cloud.diamonds);
            if (cloudXP  > localXP)  localStorage.setItem('tq_xp', cloudXP);
            if (cloud.prestige > parseInt(localStorage.getItem('typingPrestige')||'0'))
                localStorage.setItem('typingPrestige', cloud.prestige);

            // Progress: merge per-mode/diff taking highest level
            try {
                const localProg = JSON.parse(localStorage.getItem('typingProgressData') || '{}');
                const cloudProg = JSON.parse(cloud.progress || '{}');
                const merged = {};
                ['Words','Lines','Paragraphs','Pages','Code'].forEach(m => {
                    merged[m] = merged[m] || {};
                    ['Easy','Normal','Hard','Easy_maxWpm','Normal_maxWpm','Hard_maxWpm'].forEach(k => {
                        merged[m][k] = Math.max(localProg[m]?.[k]||0, cloudProg[m]?.[k]||0);
                    });
                });
                localStorage.setItem('typingProgressData', JSON.stringify(merged));
            } catch(e) {}

            // Upgrades: union
            ['typingUpgrades_Owned_Lit','typingUpgrades_Owned_Code','typingClaimedRanks','tq_unlocked_ach'].forEach((key, i) => {
                const cloudKey = ['upgradesLit','upgradesCode','claimedRanks','achUnlocked'][i];
                try {
                    const local = JSON.parse(localStorage.getItem(key)||'[]');
                    const cloudArr = JSON.parse(cloud[cloudKey]||'[]');
                    const merged = [...new Set([...local,...cloudArr])];
                    localStorage.setItem(key, JSON.stringify(merged));
                } catch(e) {}
            });

            // Achievement stats: take max per key
            try {
                const localStats = JSON.parse(localStorage.getItem('tq_ach_stats')||'{}');
                const cloudStats = JSON.parse(cloud.achStats||'{}');
                const mergedStats = {...localStats};
                Object.keys(cloudStats).forEach(k => {
                    if (typeof cloudStats[k] === 'number') mergedStats[k] = Math.max(mergedStats[k]||0, cloudStats[k]);
                    else mergedStats[k] = cloudStats[k];
                });
                localStorage.setItem('tq_ach_stats', JSON.stringify(mergedStats));
            } catch(e) {}

            if (typeof updateUI === 'function') updateUI();
            if (typeof Achievements !== 'undefined') Achievements.updateXPBar();
            updateSyncStatus('synced');
            showToast('☁️ Cloud save loaded!', 'success', 2500);
        } catch(e) {
            console.warn('[Save] pull error:', e);
        }
    }

    // ── Sync status indicator ─────────────────────────────
    function updateSyncStatus(state) {
        const indicators = document.querySelectorAll('.cloud-sync-indicator');
        const labels = { synced: '☁️ Synced', syncing: '↑ Syncing...', error: '⚠ Sync Failed', offline: '📴 Offline' };
        const colors = { synced: '#00e676', syncing: '#ffd54f', error: '#ff1744', offline: 'rgba(255,255,255,0.3)' };
        indicators.forEach(el => {
            el.textContent = labels[state] || '☁️';
            el.style.color = colors[state] || '#fff';
        });
    }

    // ── Global Leaderboard ────────────────────────────────
    async function loadGlobalLeaderboard(mode = 'wpm') {
        const el = document.getElementById('global-lb-list');
        if (!el) return;
        el.innerHTML = '<div style="text-align:center;padding:20px;font-family:var(--font-code);color:rgba(255,255,255,0.3);font-size:0.85rem;">Loading...</div>';
        if (!db) { el.innerHTML = '<div class="mp-empty-state">Firebase not configured. See SETUP_GUIDE.md</div>'; return; }
        try {
            const snap = await db.collection('users')
                .orderBy(mode === 'races' ? 'totalRaces' : 'bestMpWpm', 'desc')
                .limit(25)
                .get();
            if (snap.empty) { el.innerHTML = '<div class="mp-empty-state">No players yet. Be the first!</div>'; return; }
            el.innerHTML = snap.docs.map((doc, i) => {
                const p = doc.data();
                const isMe = user && doc.id === user.uid;
                return `<div class="lb-row ${isMe ? 'lb-row-me' : ''}">
                    <span class="lb-rank ${i===0?'gold':i===1?'silver':i===2?'bronze':''}">${i===0?'🥇':i===1?'🥈':i===2?'🥉':'#'+(i+1)}</span>
                    ${p.photoURL ? `<img src="${p.photoURL}" style="width:28px;height:28px;border-radius:50%;flex-shrink:0;" alt="">` : `<div style="width:28px;height:28px;border-radius:50%;background:linear-gradient(135deg,var(--primary),var(--prog-grad-2));display:flex;align-items:center;justify-content:center;font-family:var(--font-head);font-size:0.75rem;font-weight:700;color:#000;flex-shrink:0;">${(p.displayName||'?').charAt(0)}</div>`}
                    <span class="lb-name">${p.displayName||'Anonymous'} ${isMe ? '<span style="color:var(--primary);font-size:0.7rem;">(you)</span>' : ''}</span>
                    <span class="lb-score">${mode==='races' ? (p.totalRaces||0)+' races' : (p.bestMpWpm||0)+' WPM'}</span>
                    <span style="font-family:var(--font-code);font-size:0.75rem;color:rgba(255,255,255,0.35);">${p.loginStreak||1}d 🔥</span>
                </div>`;
            }).join('');
        } catch(e) {
            console.warn('[LB]', e);
            el.innerHTML = '<div class="mp-empty-state">Could not load leaderboard. Check Firestore rules.</div>';
        }
    }

    // ── Update all UI that shows auth state ───────────────
    function updateAllAuthUI(firebaseUser) {
        // Header user indicator
        const avatarEls = document.querySelectorAll('[id$="-user-avatar"]');
        const nameEls   = document.querySelectorAll('[id$="-user-name"]');
        if (firebaseUser) {
            avatarEls.forEach(el => {
                if (firebaseUser.photoURL) {
                    el.style.cssText = 'width:26px;height:26px;border-radius:50%;overflow:hidden;display:inline-flex;align-items:center;justify-content:center;';
                    el.innerHTML = `<img src="${firebaseUser.photoURL}" style="width:100%;height:100%;object-fit:cover;" alt="">`;
                } else {
                    el.textContent = firebaseUser.displayName?.charAt(0)?.toUpperCase() || 'G';
                }
            });
            nameEls.forEach(el => el.textContent = firebaseUser.displayName || 'User');

            const ind = document.getElementById('landing-user-indicator');
            if (ind) { ind.classList.remove('hidden'); ind.style.display = 'flex'; }

            // Show sync indicator
            updateSyncStatus('synced');

            // Auto-push on every session end — patched below
        } else {
            avatarEls.forEach(el => { el.textContent = '?'; el.innerHTML = '?'; });
            nameEls.forEach(el => el.textContent = 'Guest');
            const ind = document.getElementById('landing-user-indicator');
            if (ind) ind.classList.add('hidden');
            updateSyncStatus('offline');
        }

        // Refresh account panel if open
        if (!document.getElementById('account-modal')?.classList.contains('hidden')) {
            renderAccountPanel?.();
        }
    }

    // ── Render account panel (override) ───────────────────
    function renderAuthPanel() {
        const panel = document.getElementById('account-panel-content');
        if (!panel) return;

        const googleSection = user ? `
            <div style="text-align:center;margin-bottom:24px;">
                <div style="position:relative;display:inline-block;margin-bottom:12px;">
                    ${user.photoURL
                        ? `<img src="${user.photoURL}" style="width:72px;height:72px;border-radius:50%;border:3px solid var(--primary);box-shadow:0 0 20px var(--card-shadow);" alt="">`
                        : `<div class="account-avatar">${user.displayName?.charAt(0)?.toUpperCase()||'G'}</div>`}
                    <div style="position:absolute;bottom:-4px;right:-4px;background:#00e676;border-radius:50%;width:20px;height:20px;display:flex;align-items:center;justify-content:center;font-size:0.6rem;border:2px solid var(--bg-2);">✓</div>
                </div>
                <div style="font-family:var(--font-head);font-size:1.2rem;color:var(--primary);">${user.displayName||'User'}</div>
                <div style="font-family:var(--font-code);font-size:0.78rem;color:rgba(255,255,255,0.35);margin-top:4px;">${user.email}</div>
                <div style="display:flex;gap:8px;justify-content:center;margin-top:12px;flex-wrap:wrap;">
                    <span class="cloud-sync-indicator" style="font-family:var(--font-code);font-size:0.75rem;color:#00e676;background:rgba(0,230,118,0.1);border:1px solid rgba(0,230,118,0.2);border-radius:100px;padding:4px 12px;">☁️ Synced</span>
                    <button onclick="GoogleAuth.pushCloudSave()" style="background:rgba(0,245,255,0.1);border:1px solid rgba(0,245,255,0.25);border-radius:100px;padding:4px 12px;font-family:var(--font-code);font-size:0.75rem;color:var(--primary);cursor:pointer;transition:0.2s;" onmouseover="this.style.background='rgba(0,245,255,0.2)'" onmouseout="this.style.background='rgba(0,245,255,0.1)'">↑ Push Save</button>
                    <button onclick="GoogleAuth.pullCloudSave({})" style="background:rgba(0,245,255,0.1);border:1px solid rgba(0,245,255,0.25);border-radius:100px;padding:4px 12px;font-family:var(--font-code);font-size:0.75rem;color:var(--primary);cursor:pointer;transition:0.2s;" onmouseover="this.style.background='rgba(0,245,255,0.2)'" onmouseout="this.style.background='rgba(0,245,255,0.1)'">↓ Pull Save</button>
                </div>
                <button onclick="GoogleAuth.signOut()" style="margin-top:14px;background:rgba(255,23,68,0.1);border:1px solid rgba(255,23,68,0.3);border-radius:8px;padding:7px 20px;color:#ff5252;font-family:var(--font-main);font-size:0.9rem;cursor:pointer;transition:0.2s;width:100%;" onmouseover="this.style.background='rgba(255,23,68,0.2)'" onmouseout="this.style.background='rgba(255,23,68,0.1)'">Sign Out</button>
            </div>` : `
            <div style="text-align:center;margin-bottom:24px;">
                <div style="font-size:3rem;margin-bottom:12px;">☁️</div>
                <h3 style="font-family:var(--font-head);color:var(--primary);font-size:1.3rem;margin:0 0 8px;letter-spacing:0.05em;">CLOUD ACCOUNT</h3>
                <p style="color:rgba(255,255,255,0.4);font-size:0.9rem;margin:0 0 20px;line-height:1.6;">Sign in with Google to save progress across devices, join global multiplayer races, and appear on the world leaderboard.</p>
                <button onclick="GoogleAuth.signInWithGoogle()" style="display:flex;align-items:center;justify-content:center;gap:10px;width:100%;background:rgba(255,255,255,0.06);border:1.5px solid rgba(255,255,255,0.15);border-radius:12px;padding:13px 20px;font-family:var(--font-main);font-size:1rem;font-weight:700;color:#e8e8f0;cursor:pointer;transition:all 0.25s;" onmouseover="this.style.background='rgba(255,255,255,0.12)';this.style.borderColor='var(--primary)'" onmouseout="this.style.background='rgba(255,255,255,0.06)';this.style.borderColor='rgba(255,255,255,0.15)'">
                    <svg width="20" height="20" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
                    Continue with Google
                </button>
                <p style="font-family:var(--font-code);font-size:0.7rem;color:rgba(255,255,255,0.2);margin-top:12px;">Or use local profiles below ↓</p>
            </div>`;

        // Append Google section at top, then the existing local profiles HTML
        const existingContent = buildLocalProfilesHTML();
        panel.innerHTML = `
            <h2 style="font-family:var(--font-head);color:var(--primary);margin:0 0 20px;font-size:1.6rem;text-align:center;letter-spacing:0.05em;padding-top:10px;">ACCOUNTS</h2>
            ${googleSection}
            <div style="border-top:1px solid rgba(255,255,255,0.07);padding-top:16px;margin-top:4px;">
                ${existingContent}
            </div>`;
    }

    function buildLocalProfilesHTML() {
        if (typeof accounts === 'undefined') return '';
        const accountList = Object.values(accounts || {});
        const acc = typeof getCurrentAccount === 'function' ? getCurrentAccount() : { id:'guest', name:'Guest' };
        return `
            <div style="font-family:var(--font-head);font-size:0.7rem;color:rgba(255,255,255,0.25);letter-spacing:0.12em;text-transform:uppercase;margin-bottom:10px;">LOCAL PROFILES (${accountList.length})</div>
            <div class="profile-list" id="profile-list-container">
                ${accountList.length === 0
                    ? `<div style="text-align:center;color:rgba(255,255,255,0.25);font-family:var(--font-code);font-size:0.82rem;padding:14px;">No local profiles yet</div>`
                    : accountList.map(a => `
                        <div class="profile-item ${a.id===acc.id?'active-profile':''}" onclick="switchAccount('${a.id}'); renderAccountPanel();">
                            <div class="profile-mini-avatar">${a.name.charAt(0).toUpperCase()}</div>
                            <div class="profile-info">
                                <div class="profile-info-name">${a.name}</div>
                                <div class="profile-info-sub">Streak: ${a.loginStreak||1}d</div>
                            </div>
                            ${a.id===acc.id
                                ? '<span style="color:var(--primary);font-size:0.8rem;font-family:var(--font-code);">ACTIVE</span>'
                                : `<button onclick="event.stopPropagation();deleteAccount('${a.id}');" style="background:rgba(255,23,68,0.1);border:1px solid rgba(255,23,68,0.2);border-radius:6px;padding:4px 10px;color:#ff5252;font-size:0.78rem;cursor:pointer;font-family:var(--font-code);">DEL</button>`}
                        </div>`).join('')}
            </div>
            <div style="margin-top:16px;">
                <div style="font-family:var(--font-head);font-size:0.7rem;color:rgba(255,255,255,0.25);letter-spacing:0.12em;text-transform:uppercase;margin-bottom:10px;">CREATE LOCAL PROFILE</div>
                <div class="account-form">
                    <input id="new-acc-name" placeholder="Display Name" maxlength="20">
                    <button onclick="createAccountFromForm()" class="massive-btn" style="padding:10px 28px;font-size:0.95rem;margin-top:4px;">Create</button>
                </div>
            </div>`;
    }

    // ── Global Leaderboard Modal ───────────────────────────
    function openGlobalLeaderboard() {
        const modal = document.getElementById('global-lb-modal');
        if (!modal) return;
        modal.classList.remove('hidden');
        loadGlobalLeaderboard('wpm');
    }

    // ── Auto-push on game end ─────────────────────────────
    function hookGameEnd() {
        const orig = window.executeEndGameSequence;
        if (typeof orig !== 'function') { window._authHookPending = true; return; }
        window.executeEndGameSequence = function(completed) {
            orig.call(this, completed);
            if (completed && user) {
                setTimeout(() => {
                    pushCloudSave();
                    // Update best WPM on user doc
                    const wpm = parseInt(document.getElementById('final-wpm')?.textContent||'0');
                    if (wpm > 0 && db && user) {
                        db.collection('users').doc(user.uid).get().then(doc => {
                            if (!doc.exists || wpm > (doc.data().bestMpWpm||0)) {
                                db.collection('users').doc(user.uid).update({ bestMpWpm: wpm }).catch(()=>{});
                            }
                        }).catch(()=>{});
                    }
                }, 500);
            }
        };
    }

    // ── Init ──────────────────────────────────────────────
    init();
    document.addEventListener('DOMContentLoaded', () => {
        if (window._authHookPending) hookGameEnd();
        else hookGameEnd();
    });

    // ── Public API ────────────────────────────────────────
    return {
        signInWithGoogle,
        signOut,
        pushCloudSave,
        pullCloudSave,
        openGlobalLeaderboard,
        loadGlobalLeaderboard,
        renderAuthPanel,
        getUser: () => user,
        isSignedIn: () => !!user,
    };

})();

// ── Override renderAccountPanel globally ─────────────────
window.renderAccountPanel = function() {
    GoogleAuth.renderAuthPanel();
};

// ── Global Leaderboard modal HTML ─────────────────────────
// This is injected if not already in the DOM
document.addEventListener('DOMContentLoaded', () => {
    if (!document.getElementById('global-lb-modal')) {
        const modal = document.createElement('div');
        modal.id = 'global-lb-modal';
        modal.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.95);z-index:3200;display:flex;align-items:center;justify-content:center;padding:16px;';
        modal.classList.add('hidden');
        modal.innerHTML = `
            <div style="width:100%;max-width:640px;max-height:90vh;background:rgba(8,8,18,0.98);border:1px solid rgba(0,245,255,0.18);border-radius:20px;overflow:hidden;display:flex;flex-direction:column;box-shadow:0 0 80px rgba(0,245,255,0.06);">
                <div style="display:flex;align-items:center;gap:14px;padding:20px 24px;border-bottom:1px solid rgba(255,255,255,0.06);background:rgba(0,0,0,0.5);flex-shrink:0;">
                    <span style="font-size:1.5rem;">🌍</span>
                    <span style="font-family:var(--font-head);font-size:1.3rem;color:var(--primary);letter-spacing:0.06em;flex:1;">GLOBAL LEADERBOARD</span>
                    <div style="display:flex;gap:8px;">
                        <button onclick="GoogleAuth.loadGlobalLeaderboard('wpm')" style="background:rgba(0,245,255,0.1);border:1px solid rgba(0,245,255,0.25);border-radius:8px;padding:5px 12px;font-family:var(--font-code);font-size:0.75rem;color:var(--primary);cursor:pointer;">By WPM</button>
                        <button onclick="GoogleAuth.loadGlobalLeaderboard('races')" style="background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.12);border-radius:8px;padding:5px 12px;font-family:var(--font-code);font-size:0.75rem;color:rgba(255,255,255,0.5);cursor:pointer;">By Races</button>
                    </div>
                    <button onclick="document.getElementById('global-lb-modal').classList.add('hidden')" style="background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.12);border-radius:100px;padding:5px 14px;font-family:var(--font-main);font-size:0.82rem;color:rgba(255,255,255,0.5);cursor:pointer;">✖</button>
                </div>
                <div id="global-lb-list" class="leaderboard-list" style="flex:1;overflow-y:auto;padding:20px;"></div>
                <div style="padding:16px 24px;border-top:1px solid rgba(255,255,255,0.06);text-align:center;">
                    <button onclick="GoogleAuth.signInWithGoogle()" id="lb-signin-prompt" style="background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.12);border-radius:100px;padding:8px 20px;font-family:var(--font-main);font-size:0.85rem;color:rgba(255,255,255,0.5);cursor:pointer;transition:0.2s;" onmouseover="this.style.borderColor='var(--primary)';this.style.color='var(--primary)'" onmouseout="this.style.borderColor='rgba(255,255,255,0.12)';this.style.color='rgba(255,255,255,0.5)'">Sign in with Google to appear here</button>
                </div>
            </div>`;
        document.body.appendChild(modal);
    }

    // Hide sign-in prompt if already signed in
    document.addEventListener('firebase-ready', () => {
        const prompt = document.getElementById('lb-signin-prompt');
        if (window._firebaseAuth?.currentUser && prompt) prompt.style.display = 'none';
    });
});
