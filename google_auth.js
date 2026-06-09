// ═══════════════════════════════════════════════════════════
//  google_auth_desktop.js  —  Load AFTER script.js
//  Replaces google_auth.js for the pywebview desktop build.
//
//  Flow:
//    1. User clicks "Sign in with Google"
//    2. JS calls /api/google_login  →  Python opens real browser
//    3. Google redirects to localhost callback server
//    4. Python calls window.evaluate_js("receiveGoogleUser({...})")
//    5. JS updates the entire UI
//
//  No Firebase. No SDK. Works fully offline after sign-in.
// ═══════════════════════════════════════════════════════════

const GoogleAuth = (() => {

    let _user        = null;   // { id, name, email, picture }
    let _polling     = null;   // interval handle for fallback poll

    // ── Called by Python via evaluate_js ─────────────────────
    window.receiveGoogleUser = function(payload) {
        clearInterval(_polling);
        if (payload.error) {
            const friendly = {
                'access_denied':   'Sign-in was cancelled.',
                'state_mismatch':  'Security check failed. Please try again.',
                'no_code':         'Google did not return a code. Please try again.',
            };
            showToast(friendly[payload.error] || `Sign-in error: ${payload.error}`, 'error', 4000);
            _hideSignInSpinner();
            return;
        }
        if (payload.user) {
            _user = payload.user;
            _onSignedIn(_user);
        }
    };

    // ── Sign in ───────────────────────────────────────────────
    async function signInWithGoogle() {
        _showSignInSpinner();
        try {
            const resp = await fetch('/api/google_login');
            const data = await resp.json();
            if (data.error) { showToast(data.error, 'error'); _hideSignInSpinner(); return; }

            showToast('Browser opened — complete sign-in there, then return here.', 'info', 8000);

            // Fallback poll: in case evaluate_js fires before window is ready
            let attempts = 0;
            _polling = setInterval(async () => {
                attempts++;
                try {
                    const r2 = await fetch('/api/google_callback');
                    const d2 = await r2.json();
                    if (d2 && d2.id) {
                        clearInterval(_polling);
                        _user = d2;
                        _onSignedIn(_user);
                    }
                } catch(e) {}
                if (attempts > 60) { clearInterval(_polling); _hideSignInSpinner(); }
            }, 3000);   // poll every 3s for up to 3 minutes
        } catch(e) {
            showToast('Could not reach local server. Is main.py running?', 'error', 4000);
            _hideSignInSpinner();
        }
    }

    // ── Sign out ──────────────────────────────────────────────
    async function signOut() {
        try { await fetch('/api/google_logout'); } catch(e) {}
        _user = null;
        _onSignedOut();
        showToast('Signed out.', 'info', 2000);
    }

    // ── On signed in ──────────────────────────────────────────
    function _onSignedIn(u) {
        _hideSignInSpinner();
        showToast(`Welcome, ${u.name}! ✓`, 'success', 3000);
        _updateAllUI(u);
        _handleLoginStreak(u);
        renderAccountPanel();

        // Trigger XP bar refresh if achievements module loaded
        if (typeof Achievements !== 'undefined') Achievements.updateXPBar();
    }

    function _onSignedOut() {
        _updateAllUI(null);
        renderAccountPanel();
    }

    // ── Login streak ──────────────────────────────────────────
    function _handleLoginStreak(u) {
        const key   = `tq_gs_streak_${u.id}`;
        const keyD  = `tq_gs_day_${u.id}`;
        const today = new Date().toDateString();
        const lastD = localStorage.getItem(keyD);
        let streak  = parseInt(localStorage.getItem(key) || '0');

        if (lastD !== today) {
            const last = new Date(lastD || 0);
            const diff = Math.floor((new Date(today) - last) / 86400000);
            streak = diff === 1 ? streak + 1 : 1;
            localStorage.setItem(key, streak);
            localStorage.setItem(keyD, today);

            // Show daily bonus
            const bonus = 250 * Math.min(streak, 7);
            window._pendingLoginBonus = bonus;
            const bar = document.getElementById('bonus-day-bar');
            if (bar) {
                bar.innerHTML = '';
                for (let i = 1; i <= 7; i++) {
                    const d = document.createElement('div');
                    d.className = 'streak-day' + (i < streak ? ' completed':'') + (i === streak ? ' today':'');
                    d.textContent = 'D' + i;
                    bar.appendChild(d);
                }
            }
            const bonusEl = document.getElementById('bonus-amount-display');
            if (bonusEl) bonusEl.textContent = '+' + bonus;
            const modal = document.getElementById('login-bonus-modal');
            if (modal) modal.classList.remove('hidden');
        }
    }

    // ── Update every piece of UI that shows the user ──────────
    function _updateAllUI(u) {
        // Avatars
        document.querySelectorAll('[id$="-user-avatar"]').forEach(el => {
            if (u && u.picture) {
                el.style.cssText = 'width:26px;height:26px;border-radius:50%;overflow:hidden;display:inline-flex;align-items:center;justify-content:center;flex-shrink:0;';
                el.innerHTML = `<img src="${u.picture}" style="width:100%;height:100%;object-fit:cover;" alt="">`;
            } else {
                el.innerHTML = '';
                el.textContent = u ? u.name.charAt(0).toUpperCase() : '?';
            }
        });
        document.querySelectorAll('[id$="-user-name"]').forEach(el => { el.textContent = u ? u.name : 'Guest'; });

        const ind = document.getElementById('landing-user-indicator');
        if (ind) { if (u) { ind.classList.remove('hidden'); ind.style.display = 'flex'; } else { ind.classList.add('hidden'); } }
    }

    // ── Spinner helpers ───────────────────────────────────────
    function _showSignInSpinner() {
        const btn = document.getElementById('google-signin-btn');
        if (btn) { btn.disabled = true; btn.dataset.origText = btn.innerHTML; btn.innerHTML = '⏳ Opening browser…'; }
    }
    function _hideSignInSpinner() {
        const btn = document.getElementById('google-signin-btn');
        if (btn) { btn.disabled = false; if (btn.dataset.origText) btn.innerHTML = btn.dataset.origText; }
    }

    // ── Override renderAccountPanel to include Google section ─
    window.renderAccountPanel = function() {
        const panel = document.getElementById('account-panel-content');
        if (!panel) return;

        // Stats
        let pd = {}; try { pd = JSON.parse(localStorage.getItem('typingProgressData')||'{}'); } catch(e) {}
        const modes5 = ['Words','Lines','Paragraphs','Pages','Code'];
        const maxLvl  = Math.max(0, ...modes5.map(m => Math.max(pd[m]?.Easy||0, pd[m]?.Normal||0, pd[m]?.Hard||0)));
        const bestWpm = Math.max(0, ...modes5.map(m => Math.max(pd[m]?.Easy_maxWpm||0, pd[m]?.Normal_maxWpm||0, pd[m]?.Hard_maxWpm||0)));
        let sessCnt = 0; try { sessCnt = JSON.parse(localStorage.getItem('tq_session_log')||'[]').length; } catch(e) {}

        const acc = (typeof getCurrentAccount === 'function') ? getCurrentAccount() : { id:'guest', name:'Guest' };

        const googleSection = _user ? `
        <div style="display:flex;align-items:center;gap:14px;background:rgba(0,0,0,0.35);border:1px solid var(--card-border);border-radius:16px;padding:14px;margin-bottom:16px;">
            ${_user.picture
                ? `<img src="${_user.picture}" style="width:52px;height:52px;border-radius:50%;border:2px solid var(--primary);flex-shrink:0;" alt="">`
                : `<div style="width:52px;height:52px;border-radius:50%;background:linear-gradient(135deg,var(--primary),var(--prog-grad-2));display:flex;align-items:center;justify-content:center;font-family:var(--font-head);font-size:1.4rem;font-weight:900;color:#000;flex-shrink:0;">${_user.name.charAt(0).toUpperCase()}</div>`}
            <div style="flex:1;min-width:0;">
                <div style="font-family:var(--font-head);font-size:1rem;color:var(--primary);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${_user.name}</div>
                <div style="font-family:var(--font-code);font-size:0.72rem;color:rgba(255,255,255,0.35);margin-top:2px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${_user.email}</div>
                <div style="margin-top:6px;display:flex;gap:6px;flex-wrap:wrap;">
                    <span style="background:rgba(0,230,118,0.12);border:1px solid rgba(0,230,118,0.25);border-radius:100px;padding:2px 10px;font-family:var(--font-code);font-size:0.7rem;color:#00e676;">✓ Google Account</span>
                </div>
            </div>
            <button onclick="GoogleAuth.signOut()" style="background:rgba(255,23,68,0.1);border:1px solid rgba(255,23,68,0.25);border-radius:8px;padding:6px 12px;color:#ff5252;font-family:var(--font-main);font-size:0.82rem;font-weight:600;cursor:pointer;flex-shrink:0;white-space:nowrap;">Sign Out</button>
        </div>` : `
        <div style="text-align:center;margin-bottom:20px;">
            <div style="font-size:2.5rem;margin-bottom:10px;">☁️</div>
            <p style="color:rgba(255,255,255,0.4);font-size:0.9rem;margin:0 0 18px;line-height:1.6;">Sign in with Google to sync your progress across devices and appear on the world leaderboard.</p>
            <button id="google-signin-btn" onclick="GoogleAuth.signInWithGoogle()"
                style="display:flex;align-items:center;justify-content:center;gap:10px;width:100%;
                       background:rgba(255,255,255,0.06);border:1.5px solid rgba(255,255,255,0.15);
                       border-radius:12px;padding:13px 20px;font-family:var(--font-main);font-size:1rem;
                       font-weight:700;color:#e8e8f0;cursor:pointer;transition:all 0.25s;"
                onmouseover="this.style.background='rgba(255,255,255,0.12)';this.style.borderColor='var(--primary)'"
                onmouseout="this.style.background='rgba(255,255,255,0.06)';this.style.borderColor='rgba(255,255,255,0.15)'">
                <svg width="20" height="20" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Continue with Google
            </button>
        </div>`;

        panel.innerHTML = `
        <h2 style="font-family:var(--font-head);color:var(--primary);margin:0 0 18px;font-size:1.5rem;text-align:center;letter-spacing:0.05em;padding-top:8px;">ACCOUNT CENTRE</h2>

        ${googleSection}

        <!-- STATS (always shown) -->
        <div style="font-family:var(--font-head);font-size:0.66rem;letter-spacing:0.13em;text-transform:uppercase;color:rgba(255,255,255,0.25);margin:0 0 8px;">STATISTICS</div>
        <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-bottom:14px;">
            ${[{l:'Max Level',v:maxLvl},{l:'Best WPM',v:bestWpm},{l:'Sessions',v:sessCnt},
               {l:'Emeralds',v:(window.emeralds||0).toLocaleString()},{l:'Diamonds',v:(window.diamonds||0).toLocaleString()},{l:'Prestige',v:window.prestigeCount||0}
              ].map(s=>`
            <div style="background:rgba(0,0,0,0.4);border:1px solid rgba(255,255,255,0.07);border-radius:12px;padding:11px 8px;text-align:center;">
                <span style="display:block;font-family:var(--font-head);font-size:1.3rem;color:var(--primary);">${s.v}</span>
                <span style="display:block;font-family:var(--font-code);font-size:0.6rem;color:rgba(255,255,255,0.3);text-transform:uppercase;letter-spacing:0.1em;margin-top:3px;">${s.l}</span>
            </div>`).join('')}
        </div>

        <!-- SETTINGS -->
        <div style="font-family:var(--font-head);font-size:0.66rem;letter-spacing:0.13em;text-transform:uppercase;color:rgba(255,255,255,0.25);margin:0 0 8px;">SETTINGS</div>
        <div style="display:flex;flex-direction:column;gap:6px;margin-bottom:14px;">
            ${[
                {key:'sfx',   label:'Sound Effects',   on: localStorage.getItem('tq_sfx_off')!=='1'},
                {key:'vis',   label:'Visual Effects',   on: window.visualsActive !== false},
                {key:'kb',    label:'Show Keyboard',    on: localStorage.getItem('tq_hide_kb')!=='1'},
                {key:'pause', label:'Post-Level Pause', on: localStorage.getItem('tq_skip_pause')!=='1'},
                {key:'ghost', label:'Ghost Runner',     on: localStorage.getItem('tq_hide_ghost')!=='1'},
            ].map(s=>`
            <div style="display:flex;align-items:center;justify-content:space-between;background:rgba(0,0,0,0.3);border:1px solid rgba(255,255,255,0.07);border-radius:10px;padding:10px 14px;">
                <span style="font-family:var(--font-main);font-size:0.9rem;font-weight:600;color:rgba(255,255,255,0.7);">${s.label}</span>
                <label style="position:relative;display:inline-block;width:40px;height:22px;cursor:pointer;flex-shrink:0;">
                    <input type="checkbox" ${s.on?'checked':''} onchange="accToggleSetting('${s.key}',this.checked)" style="opacity:0;width:0;height:0;position:absolute;">
                    <span style="position:absolute;inset:0;background:${s.on?'var(--primary)':'rgba(255,255,255,0.1)'};border-radius:11px;transition:background 0.25s;border:1px solid rgba(255,255,255,0.12);"></span>
                    <span style="position:absolute;width:16px;height:16px;border-radius:50%;background:#fff;top:2px;left:${s.on?'20':'2'}px;transition:left 0.25s;pointer-events:none;"></span>
                </label>
            </div>`).join('')}
            <div style="display:flex;align-items:center;justify-content:space-between;background:rgba(0,0,0,0.3);border:1px solid rgba(255,255,255,0.07);border-radius:10px;padding:10px 14px;">
                <span style="font-family:var(--font-main);font-size:0.9rem;font-weight:600;color:rgba(255,255,255,0.7);">Colour Theme</span>
                <select onchange="accSetTheme(this.value)" style="background:rgba(0,0,0,0.5);border:1.5px solid rgba(255,255,255,0.12);border-radius:8px;padding:5px 10px;color:var(--primary);font-family:var(--font-main);font-size:0.85rem;font-weight:600;cursor:pointer;outline:none;">
                    <option value="cyan"   ${(localStorage.getItem('tq_theme')||'cyan')==='cyan'?'selected':''}>Cyan (Default)</option>
                    <option value="purple" ${localStorage.getItem('tq_theme')==='purple'?'selected':''}>Purple</option>
                    <option value="green"  ${localStorage.getItem('tq_theme')==='green'?'selected':''}>Matrix Green</option>
                    <option value="orange" ${localStorage.getItem('tq_theme')==='orange'?'selected':''}>Amber</option>
                </select>
            </div>
        </div>

        <!-- LOCAL PROFILES -->
        <div style="font-family:var(--font-head);font-size:0.66rem;letter-spacing:0.13em;text-transform:uppercase;color:rgba(255,255,255,0.25);margin:0 0 8px;">LOCAL PROFILES (${Object.keys(window.accounts||{}).length})</div>
        <div class="profile-list" style="max-height:170px;overflow-y:auto;margin-bottom:12px;">
            ${Object.values(window.accounts||{}).length ? Object.values(window.accounts).map(a=>`
            <div class="profile-item ${a.id===acc.id?'active-profile':''}" onclick="switchAccount('${a.id}');renderAccountPanel();" style="cursor:pointer;">
                <div class="profile-mini-avatar">${a.name.charAt(0).toUpperCase()}</div>
                <div class="profile-info">
                    <div class="profile-info-name">${a.name}</div>
                    <div class="profile-info-sub">Streak ${a.loginStreak||1}d</div>
                </div>
                ${a.id===acc.id
                    ? '<span style="color:var(--primary);font-family:var(--font-code);font-size:0.75rem;">ACTIVE</span>'
                    : `<button onclick="event.stopPropagation();deleteAccount('${a.id}');" style="background:rgba(255,23,68,0.1);border:1px solid rgba(255,23,68,0.2);border-radius:6px;padding:3px 9px;color:#ff5252;font-size:0.75rem;cursor:pointer;font-family:var(--font-code);">DEL</button>`}
            </div>`).join('')
            : '<div style="text-align:center;padding:12px;color:rgba(255,255,255,0.2);font-family:var(--font-code);font-size:0.82rem;">No local profiles</div>'}
        </div>
        <div style="display:flex;gap:8px;">
            <input id="new-acc-name" style="flex:1;background:rgba(0,0,0,0.45);border:1.5px solid rgba(255,255,255,0.1);border-radius:10px;padding:9px 14px;color:#e8e8f0;font-size:0.95rem;font-family:var(--font-main);outline:none;" placeholder="Local username…" maxlength="20" onkeydown="if(event.key==='Enter')createAccountFromForm()">
            <button onclick="createAccountFromForm()" style="background:var(--primary);color:#000;border:none;border-radius:10px;padding:9px 16px;font-family:var(--font-main);font-size:0.9rem;font-weight:700;cursor:pointer;white-space:nowrap;">Create</button>
        </div>`;
    };

    // ── Settings helpers (kept in sync with script.js) ────────
    window.accToggleSetting = function(key, val) {
        if (key === 'sfx')   localStorage.setItem('tq_sfx_off', val?'0':'1');
        if (key === 'vis')   { window.visualsActive = val; localStorage.setItem('typingVisualsActive', String(val)); if(val && window.applyOwnedVisualsOnLoad) window.applyOwnedVisualsOnLoad(); else if(window.removeAllVisuals) window.removeAllVisuals(); }
        if (key === 'kb')    { localStorage.setItem('tq_hide_kb', val?'0':'1'); const kb = document.getElementById('virtual-keyboard'); if(kb) kb.style.display = val?'':'none'; }
        if (key === 'pause') localStorage.setItem('tq_skip_pause', val?'0':'1');
        if (key === 'ghost') { localStorage.setItem('tq_hide_ghost', val?'0':'1'); const gt = document.getElementById('ghost-track'); if(gt) gt.style.display = val?'':'none'; }
        renderAccountPanel();
    };

    window.accSetTheme = function(theme) {
        localStorage.setItem('tq_theme', theme);
        const themes = {
            cyan:  { p:'#00f5ff', s:'rgba(0,245,255,0.15)',   b:'rgba(0,245,255,0.18)',  g1:'#00f5ff', g2:'#69ff47' },
            purple:{ p:'#b388ff', s:'rgba(179,136,255,0.15)', b:'rgba(179,136,255,0.2)', g1:'#b388ff', g2:'#f48fb1' },
            green: { p:'#39ff14', s:'rgba(57,255,20,0.12)',   b:'rgba(57,255,20,0.2)',   g1:'#39ff14', g2:'#00e5ff' },
            orange:{ p:'#ff9800', s:'rgba(255,152,0,0.15)',   b:'rgba(255,152,0,0.22)',  g1:'#ff9800', g2:'#ffd54f' },
        };
        const t = themes[theme] || themes.cyan;
        const r = document.documentElement;
        r.style.setProperty('--primary',     t.p);
        r.style.setProperty('--primary-dim', t.s);
        r.style.setProperty('--card-border', t.b);
        r.style.setProperty('--text-shadow', t.p+'99');
        r.style.setProperty('--prog-grad-1', t.g1);
        r.style.setProperty('--prog-grad-2', t.g2);
        r.style.setProperty('--card-shadow', t.p+'55');
    };

    // ── Apply theme + settings on load ────────────────────────
    window.accSetTheme(localStorage.getItem('tq_theme') || 'cyan');
    if (localStorage.getItem('tq_hide_kb') === '1') { const kb = document.getElementById('virtual-keyboard'); if(kb) kb.style.display='none'; }
    if (localStorage.getItem('tq_hide_ghost') === '1') { const gt = document.getElementById('ghost-track'); if(gt) gt.style.display='none'; }

    // ── Wire open buttons ─────────────────────────────────────
    document.addEventListener('DOMContentLoaded', () => {
        const modal = document.getElementById('account-modal');
        function openAcc() { if(modal) { renderAccountPanel(); modal.classList.remove('hidden'); } }
        ['open-accounts-btn','header-profile-btn','landing-profile-btn'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.addEventListener('click', openAcc);
        });
        // Show user indicators using whatever is already signed in
        if (typeof updateUserIndicators === 'function') updateUserIndicators();
    });

    // ── Public API ────────────────────────────────────────────
    return {
        signInWithGoogle,
        signOut,
        getUser: () => _user,
        isSignedIn: () => !!_user,
    };

})();