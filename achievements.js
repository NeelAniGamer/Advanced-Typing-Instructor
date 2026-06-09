// ═══════════════════════════════════════════════════════════
// ACHIEVEMENTS & XP SYSTEM v2.5
// ═══════════════════════════════════════════════════════════
const Achievements = (() => {

    // ── Achievement definitions ───────────────────────────
    const ALL = [
        // Speed
        { id:'spd_20',  cat:'speed',  name:'Speed Rookie',      desc:'Hit 20 WPM in any session.',         icon:'⚡', req: s=>s.wpm>=20 },
        { id:'spd_40',  cat:'speed',  name:'Speed Adept',       desc:'Hit 40 WPM.',                        icon:'⚡⚡', req: s=>s.wpm>=40 },
        { id:'spd_60',  cat:'speed',  name:'Speed Master',      desc:'Hit 60 WPM.',                        icon:'🚀', req: s=>s.wpm>=60 },
        { id:'spd_80',  cat:'speed',  name:'Speed Legend',      desc:'Hit 80 WPM.',                        icon:'🔥', req: s=>s.wpm>=80 },
        { id:'spd_100', cat:'speed',  name:'The Century',       desc:'Hit 100 WPM — insane speed!',        icon:'💯', req: s=>s.wpm>=100, secret:true },
        { id:'spd_120', cat:'speed',  name:'Machine',           desc:'Hit 120 WPM. Are you even human?',   icon:'🤖', req: s=>s.wpm>=120, secret:true },

        // Accuracy
        { id:'acc_95',  cat:'acc',    name:'Sharp Eye',         desc:'Finish with 95%+ accuracy.',         icon:'🎯', req: s=>s.acc>=95 },
        { id:'acc_100', cat:'acc',    name:'Flawless',          desc:'Finish with 100% accuracy.',         icon:'💎', req: s=>s.acc===100 },
        { id:'acc_100x5',cat:'acc',   name:'Perfectionist',     desc:'100% accuracy 5 times.',             icon:'✨', req: s=>s.perfect100Count>=5 },
        { id:'acc_100x25',cat:'acc',  name:'No Mistakes Ever',  desc:'100% accuracy 25 times.',            icon:'🏅', req: s=>s.perfect100Count>=25, secret:true },

        // Levels
        { id:'lvl_10',  cat:'lvl',    name:'Getting Started',   desc:'Reach Level 10.',                    icon:'📍', req: s=>s.maxLevel>=10 },
        { id:'lvl_50',  cat:'lvl',    name:'Halfway There',     desc:'Reach Level 50.',                    icon:'🏃', req: s=>s.maxLevel>=50 },
        { id:'lvl_100', cat:'lvl',    name:'Century Club',      desc:'Reach Level 100.',                   icon:'💯', req: s=>s.maxLevel>=100 },
        { id:'lvl_200', cat:'lvl',    name:'The Pinnacle',      desc:'Reach Level 200 (max).',             icon:'🏔', req: s=>s.maxLevel>=200, secret:true },

        // Streaks
        { id:'str_20',  cat:'streak', name:'On A Roll',         desc:'30-key streak in one session.',      icon:'🔗', req: s=>s.maxStreak>=30 },
        { id:'str_50',  cat:'streak', name:'Streak Machine',    desc:'50-key streak.',                     icon:'⛓', req: s=>s.maxStreak>=50 },
        { id:'str_100', cat:'streak', name:'Unbreakable',       desc:'100-key streak.',                    icon:'🌊', req: s=>s.maxStreak>=100, secret:true },

        // Modes
        { id:'mode_all',cat:'mode',   name:'Renaissance Typer', desc:'Complete a level in all 5 modes.',   icon:'🌐', req: s=>s.modesCompleted>=5 },
        { id:'mode_code',cat:'mode',  name:'Code Monkey',       desc:'Complete 10 Code levels.',           icon:'🐒', req: s=>s.codeLevels>=10 },
        { id:'mode_page',cat:'mode',  name:'Novelist',          desc:'Complete a Pages level.',            icon:'📖', req: s=>s.pagesCompleted>=1 },
        { id:'mode_hard',cat:'mode',  name:'Hardcore',          desc:'Complete 5 Hard difficulty levels.', icon:'☠️', req: s=>s.hardLevels>=5 },

        // Boss
        { id:'boss_1',  cat:'boss',   name:'Boss Slayer',       desc:'Defeat your first boss.',            icon:'⚔️', req: s=>s.bossesKilled>=1 },
        { id:'boss_10', cat:'boss',   name:'Boss Hunter',       desc:'Defeat 10 bosses.',                  icon:'🗡️', req: s=>s.bossesKilled>=10, secret:true },

        // Currency
        { id:'cur_10k', cat:'cur',    name:'Millionaire Mindset',desc:'Earn 10,000 Emeralds total.',       icon:'💰', req: s=>s.totalEarned>=10000 },
        { id:'cur_100k',cat:'cur',    name:'Tycoon',             desc:'Earn 100,000 Emeralds total.',      icon:'🤑', req: s=>s.totalEarned>=100000, secret:true },

        // Prestige
        { id:'pre_1',   cat:'pre',    name:'Ascended',          desc:'Reach Prestige 1.',                  icon:'⭐', req: s=>s.prestige>=1, secret:true },
        { id:'pre_5',   cat:'pre',    name:'Transcended',       desc:'Reach Prestige 5.',                  icon:'🌟', req: s=>s.prestige>=5, secret:true },

        // Multiplayer
        { id:'mp_1',    cat:'mp',     name:'First Race',        desc:'Finish a multiplayer race.',         icon:'🏁', req: s=>s.mpRaces>=1 },
        { id:'mp_win',  cat:'mp',     name:'Champion',          desc:'Win a multiplayer race.',            icon:'🏆', req: s=>s.mpWins>=1 },
        { id:'mp_10',   cat:'mp',     name:'Racer',             desc:'Finish 10 multiplayer races.',       icon:'🏎️', req: s=>s.mpRaces>=10, secret:true },

        // Fun / hidden
        { id:'fun_3am', cat:'fun',    name:'Insomniac',         desc:'Type after midnight.',               icon:'🌙', req: s=>s.typedAtMidnight, secret:true },
        { id:'fun_1k',  cat:'fun',    name:'Keystroke God',     desc:'Type 10,000 total keystrokes.',      icon:'⌨️', req: s=>s.totalKeystrokes>=10000 },
        { id:'fun_dc',  cat:'fun',    name:'Daily Devotion',    desc:'Complete 7 daily challenges.',       icon:'📅', req: s=>s.dailyChallenges>=7 },
        { id:'fun_fire',cat:'fun',    name:'On Fire',           desc:'Maintain a fire streak.',            icon:'🔥', req: s=>s.onFireCount>=1 },
        { id:'fun_back',cat:'fun',    name:'Never Give Up',     desc:'Retry a failed level 3 times.',      icon:'💪', req: s=>s.retries>=3 },
        { id:'fun_shop',cat:'fun',    name:'Shopaholic',        desc:'Purchase 5 shop items.',             icon:'🛒', req: s=>s.shopPurchases>=5 },
        { id:'fun_spd_acc',cat:'fun', name:'God Mode',          desc:'80 WPM with 100% accuracy.',         icon:'👑', req: s=>s.wpm>=80&&s.acc===100, secret:true },
    ];

    // ── Persistent stats ──────────────────────────────────
    let stats = {};
    let unlocked = [];

    function load() {
        try { stats   = JSON.parse(localStorage.getItem('tq_ach_stats') || '{}'); } catch(e) { stats = {}; }
        try { unlocked = JSON.parse(localStorage.getItem('tq_unlocked_ach') || '[]'); } catch(e) { unlocked = []; }
    }

    function save() {
        localStorage.setItem('tq_ach_stats', JSON.stringify(stats));
        localStorage.setItem('tq_unlocked_ach', JSON.stringify(unlocked));
    }

    // ── Check all achievements ─────────────────────────────
    function check(sessionData = {}) {
        load();
        // Merge session data into cumulative stats
        if (sessionData.wpm)       stats.wpm = Math.max(stats.wpm||0, sessionData.wpm);
        if (sessionData.acc !== undefined) {
            stats.acc = sessionData.acc;
            if (sessionData.acc === 100) stats.perfect100Count = (stats.perfect100Count||0) + 1;
        }
        if (sessionData.maxStreak) stats.maxStreak = Math.max(stats.maxStreak||0, sessionData.maxStreak);
        if (sessionData.level)     stats.maxLevel  = Math.max(stats.maxLevel||0, sessionData.level);
        if (sessionData.earned)    stats.totalEarned = (stats.totalEarned||0) + sessionData.earned;
        if (sessionData.keystrokes)stats.totalKeystrokes = (stats.totalKeystrokes||0) + sessionData.keystrokes;
        if (sessionData.mode === 'Code') stats.codeLevels = (stats.codeLevels||0)+1;
        if (sessionData.mode === 'Pages') stats.pagesCompleted = (stats.pagesCompleted||0)+1;
        if (sessionData.diff === 'Hard') stats.hardLevels = (stats.hardLevels||0)+1;
        if (sessionData.bossKilled) stats.bossesKilled = (stats.bossesKilled||0)+1;
        if (sessionData.onFire)     stats.onFireCount  = (stats.onFireCount||0)+1;
        if (sessionData.retry)      stats.retries      = (stats.retries||0)+1;
        if (sessionData.shopBuy)    stats.shopPurchases = (stats.shopPurchases||0)+1;
        if (sessionData.mpRace)     stats.mpRaces  = (stats.mpRaces||0)+1;
        if (sessionData.mpWin)      stats.mpWins   = (stats.mpWins||0)+1;
        if (sessionData.dailyChallenge) stats.dailyChallenges = (stats.dailyChallenges||0)+1;

        // Track modes completed
        if (sessionData.mode && sessionData.completed) {
            stats.modesSet = stats.modesSet || {};
            stats.modesSet[sessionData.mode] = true;
            stats.modesCompleted = Object.keys(stats.modesSet).length;
        }

        // Prestige from global
        stats.prestige = parseInt(localStorage.getItem('typingPrestige') || '0');
        stats.maxLevel = Math.max(stats.maxLevel||0, ...['Words','Lines','Paragraphs','Pages','Code'].map(m => {
            try { const p = JSON.parse(localStorage.getItem('typingProgressData')||'{}'); return Math.max(p[m]?.Easy||0, p[m]?.Normal||0, p[m]?.Hard||0); } catch(e) { return 0; }
        }));

        // Midnight typing
        if (new Date().getHours() < 4) stats.typedAtMidnight = true;

        save();

        // Evaluate all
        const newlyUnlocked = [];
        ALL.forEach(ach => {
            if (!unlocked.includes(ach.id) && ach.req(stats)) {
                unlocked.push(ach.id);
                newlyUnlocked.push(ach);
            }
        });
        save();
        newlyUnlocked.forEach(ach => showAchievementPopup(ach));
        return newlyUnlocked;
    }

    // ── Achievement popup (cinematic) ─────────────────────
    function showAchievementPopup(ach) {
        const container = document.getElementById('achievement-popup-container') || createPopupContainer();
        const popup = document.createElement('div');
        popup.className = 'ach-popup';
        popup.innerHTML = `
            <div class="ach-popup-icon">${ach.icon}</div>
            <div class="ach-popup-body">
                <div class="ach-popup-label">Achievement Unlocked</div>
                <div class="ach-popup-name">${ach.name}</div>
                <div class="ach-popup-desc">${ach.desc}</div>
            </div>`;
        container.appendChild(popup);
        // Animate in
        requestAnimationFrame(() => popup.classList.add('ach-popup-show'));
        setTimeout(() => {
            popup.classList.add('ach-popup-hide');
            setTimeout(() => popup.remove(), 500);
        }, 4000);
        try { if (window.SFX) SFX.playWin(); } catch(e) {}
    }

    function createPopupContainer() {
        const div = document.createElement('div');
        div.id = 'achievement-popup-container';
        div.style.cssText = 'position:fixed;top:24px;right:24px;z-index:99999;display:flex;flex-direction:column;gap:10px;pointer-events:none;max-width:340px;';
        document.body.appendChild(div);
        return div;
    }

    // ── XP System ─────────────────────────────────────────
    const XP_LEVELS = [0,100,250,500,900,1400,2100,3000,4200,5800,8000,11000,15000,20000,27000,36000,48000,64000,85000,115000];
    function getXP() { return parseInt(localStorage.getItem('tq_xp') || '0'); }
    function addXP(amount) {
        const prev = getXP();
        const next = prev + amount;
        localStorage.setItem('tq_xp', next);
        const prevLvl = getXPLevel(prev);
        const nextLvl = getXPLevel(next);
        if (nextLvl > prevLvl) { onXPLevelUp(nextLvl); }
        updateXPBar();
        return { prev, next, leveledUp: nextLvl > prevLvl, newLevel: nextLvl };
    }
    function getXPLevel(xp = getXP()) {
        let lvl = 0;
        for (let i = 0; i < XP_LEVELS.length; i++) { if (xp >= XP_LEVELS[i]) lvl = i; }
        return lvl;
    }
    function getXPTitle(lvl) {
        const titles = ['Novice','Apprentice','Typist','Scribe','Wordsmith','Linguist','Scholar','Veteran','Expert','Master','Grandmaster','Champion','Legend','Mythic','Immortal','Divine','Cosmic','Celestial','Ascendant','Eternal'];
        return titles[Math.min(lvl, titles.length-1)] || 'Eternal';
    }
    function onXPLevelUp(newLvl) {
        showToast(`🎖 XP Level Up! You are now ${getXPTitle(newLvl)} (Lvl ${newLvl})`, 'success', 5000);
        if (typeof triggerConfetti === 'function') triggerConfetti(2000);
    }
    function calcSessionXP(wpm, acc, level, mode) {
        let base = Math.round(wpm * (acc / 100) * 0.5);
        const modeMult = {Words:1, Lines:1.5, Paragraphs:2, Pages:4, Code:2.5}[mode] || 1;
        return Math.round(base * modeMult + level * 2);
    }
    function updateXPBar() {
        const xp    = getXP();
        const lvl   = getXPLevel(xp);
        const curr  = XP_LEVELS[lvl]  || 0;
        const next  = XP_LEVELS[lvl+1] || XP_LEVELS[XP_LEVELS.length-1];
        const pct   = Math.min(100, Math.round(((xp - curr) / Math.max(1, next - curr)) * 100));
        const els = document.querySelectorAll('.xp-bar-fill');
        els.forEach(el => el.style.width = pct + '%');
        document.querySelectorAll('.xp-level-display').forEach(el => el.textContent = `Lvl ${lvl}`);
        document.querySelectorAll('.xp-title-display').forEach(el => el.textContent = getXPTitle(lvl));
        document.querySelectorAll('.xp-points-display').forEach(el => el.textContent = `${(xp - curr).toLocaleString()} / ${(next - curr).toLocaleString()} XP`);
    }

    // ── Render achievements panel ─────────────────────────
    function renderPanel() {
        load();
        const modal = document.getElementById('achievements-modal');
        if (!modal) return;
        modal.classList.remove('hidden');

        const categories = [
            { id:'speed', label:'⚡ Speed' }, { id:'acc', label:'🎯 Accuracy' },
            { id:'lvl', label:'📍 Levels' }, { id:'streak', label:'🔗 Streaks' },
            { id:'mode', label:'🌐 Modes' }, { id:'boss', label:'⚔️ Boss' },
            { id:'cur', label:'💰 Currency' }, { id:'pre', label:'⭐ Prestige' },
            { id:'mp', label:'🏁 Multiplayer' }, { id:'fun', label:'🎭 Hidden' },
        ];

        const total  = ALL.filter(a => !a.secret || unlocked.includes(a.id)).length;
        const earned = unlocked.length;
        const xp     = getXP();
        const lvl    = getXPLevel(xp);

        const header = document.getElementById('ach-header-stats');
        if (header) header.innerHTML = `
            <div class="ach-summary-stat"><span class="ach-sum-val">${earned}</span><span class="ach-sum-label">Unlocked</span></div>
            <div class="ach-summary-stat"><span class="ach-sum-val">${total - earned}</span><span class="ach-sum-label">Locked</span></div>
            <div class="ach-summary-stat"><span class="ach-sum-val">${Math.round((earned/ALL.length)*100)}%</span><span class="ach-sum-label">Completion</span></div>
            <div class="ach-summary-stat"><span class="ach-sum-val">${xp.toLocaleString()}</span><span class="ach-sum-label">Total XP</span></div>
        `;

        const xpSection = document.getElementById('ach-xp-bar-section');
        if (xpSection) {
            const curr = XP_LEVELS[lvl]||0; const next = XP_LEVELS[lvl+1]||XP_LEVELS[XP_LEVELS.length-1];
            const pct = Math.min(100,Math.round(((xp-curr)/Math.max(1,next-curr))*100));
            xpSection.innerHTML = `
                <div style="display:flex;justify-content:space-between;margin-bottom:6px;">
                    <span style="font-family:var(--font-head);color:var(--primary);font-size:1rem;">${getXPTitle(lvl)} · Level ${lvl}</span>
                    <span style="font-family:var(--font-code);font-size:0.8rem;color:rgba(255,255,255,0.4);">${(xp-curr).toLocaleString()} / ${(next-curr).toLocaleString()} XP</span>
                </div>
                <div style="width:100%;height:10px;background:rgba(255,255,255,0.07);border-radius:6px;overflow:hidden;border:1px solid rgba(255,255,255,0.1);">
                    <div style="height:100%;width:${pct}%;background:linear-gradient(90deg,var(--primary),var(--prog-grad-2));border-radius:6px;transition:width 0.8s;box-shadow:0 0 10px var(--card-shadow);"></div>
                </div>`;
        }

        const grid = document.getElementById('ach-grid');
        if (!grid) return;
        grid.innerHTML = '';

        categories.forEach(cat => {
            const catAchs = ALL.filter(a => a.cat === cat.id);
            const catDiv = document.createElement('div');
            catDiv.className = 'ach-category';
            catDiv.innerHTML = `<div class="ach-cat-label">${cat.label}</div>`;
            const rowDiv = document.createElement('div');
            rowDiv.className = 'ach-row';
            catAchs.forEach(ach => {
                const isUnlocked = unlocked.includes(ach.id);
                const isVisible  = !ach.secret || isUnlocked;
                const card = document.createElement('div');
                card.className = `ach-card ${isUnlocked ? 'ach-unlocked' : 'ach-locked'} ${ach.secret ? 'ach-secret' : ''}`;
                card.title = isVisible ? ach.desc : '???';
                card.innerHTML = `
                    <div class="ach-card-icon">${isVisible ? ach.icon : '🔒'}</div>
                    <div class="ach-card-name">${isVisible ? ach.name : '???'}</div>
                    <div class="ach-card-desc">${isVisible ? ach.desc : 'Hidden achievement'}</div>
                    ${isUnlocked ? '<div class="ach-card-check">✓</div>' : ''}`;
                rowDiv.appendChild(card);
            });
            catDiv.appendChild(rowDiv);
            grid.appendChild(catDiv);
        });
    }

    // ── Expose ────────────────────────────────────────────
    return {
        check, renderPanel, load, save,
        addXP, getXP, getXPLevel, getXPTitle, calcSessionXP, updateXPBar,
        getAllCount: () => ALL.length,
        getUnlocked: () => { load(); return unlocked; },
        getStats: () => { load(); return stats; },
    };
})();

// Hook XP + achievements into game end
(function patchGameEnd() {
    const _orig = window.executeEndGameSequence;
    if (typeof _orig !== 'function') {
        // Will be patched when script.js loads first
        window._achPatchPending = true;
        return;
    }
    _patchGameEnd();
})();

function _patchGameEnd() {
    const _orig = window.executeEndGameSequence;
    window.executeEndGameSequence = function(completed) {
        _orig.call(this, completed);
        // Run after a tick so results are computed
        setTimeout(() => {
            try {
                const wpm   = parseInt(document.getElementById('final-wpm')?.textContent || '0');
                const acc   = parseInt(document.getElementById('final-accuracy')?.textContent || '0');
                const xpEarned = Achievements.calcSessionXP(wpm, acc, window.currentLevel||1, window.currentMode||'Words');
                const result = Achievements.addXP(xpEarned);
                Achievements.check({
                    wpm, acc,
                    level: window.currentLevel||1,
                    mode: window.currentMode||'Words',
                    diff: window.currentDiff||'Normal',
                    earned: parseInt(document.getElementById('final-rupees')?.textContent?.replace(/,/g,'') || '0'),
                    keystrokes: window.totalKeystrokes||0,
                    maxStreak: window.maxStreakInGame||0,
                    completed,
                    bossKilled: window.isBossLevel && window.bossHP <= 0,
                    onFire: window.isOnFire||false,
                });
                // Show XP gained toast
                if (completed) showToast(`+${xpEarned} XP earned! ${result.leveledUp ? '🎖 Level Up!' : ''}`, 'info', 2500);
            } catch(e) { console.warn('Achievements patch error:', e); }
        }, 200);
    };
}

// Auto-patch after DOM ready if script.js loaded first
document.addEventListener('DOMContentLoaded', () => {
    if (window._achPatchPending) _patchGameEnd();
    Achievements.updateXPBar();
});
