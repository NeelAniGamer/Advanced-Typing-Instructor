/* ═══════════════════════════════════════════════════════════
   patches.js  —  Load AFTER script.js in index.html
   <script src="patches.js"></script>
   Fixes + overrides without touching script.js at all.
═══════════════════════════════════════════════════════════ */

// ─────────────────────────────────────────────────────────
// 1.  WORDS MODE FIX
//     • Every word rendered with capital first letter
//     • Trailing space span appended — user MUST press Space
//       to advance to the next word (no silent auto-advance)
//     • Input box cleared on each new word
// ─────────────────────────────────────────────────────────
const _origRenderText = window.renderTextProcedural;
window.renderTextProcedural = function(text) {
    const isWords = (window.currentMode === 'Words');

    const txt = document.querySelector("#game-screen .typing-text");
    if (txt) {
        txt.innerHTML = '';
        if (!text) text = 'Loading...';
        text = text.replace(/\r\n/g, '\n');

        text.split('').forEach(char => {
            const span = document.createElement('span');
            span.textContent = char;
            // Code mode: tint special characters
            if (window.currentMode === 'Code' && '[](){};:<>!@#$%^&*|/\\=+-'.includes(char)) {
                span.dataset.special = '1';
            }
            txt.appendChild(span);
        });

        // In Words mode append a mandatory trailing space span
        if (isWords) {
            const spaceSpan = document.createElement('span');
            spaceSpan.textContent = ' ';
            spaceSpan.dataset.trailingSpace = '1';
            txt.appendChild(spaceSpan);
        }

        const spans = txt.querySelectorAll('span');
        if (spans[0]) spans[0].classList.add('active');
    }

    const ttcTop = document.querySelector('#game-screen .typing-text-container');
    if (ttcTop) ttcTop.scrollTop = 0;

    const hif = document.getElementById('hiddenInputField');
    if (hif) {
        hif.value = '';
        hif.removeEventListener('input', window.handleFallingInput);
        hif.removeEventListener('input', window.handleTypingProcedural);
        hif.addEventListener('input', window.handleTypingProcedural);
        hif.focus();
    }
};

// Override handleTypingProcedural for clean Words-mode space logic
const _origHandleTyping = window.handleTypingProcedural;
window.handleTypingProcedural = function() {
    const txt = document.querySelector('#game-screen .typing-text');
    const hif = document.getElementById('hiddenInputField');
    if (!txt || !hif) return;

    const characters   = txt.querySelectorAll('span');
    const typedValue   = hif.value;
    const typedChar    = typedValue[window.charIndex];
    const isWordsMode  = (window.currentMode === 'Words');

    if (window.charIndex < characters.length && window.timeLeft > 0 &&
        (!window.isBossLevel || window.bossHP > 0)) {

        window.totalKeystrokes = (window.totalKeystrokes || 0) + 1;
        if (window.sessionQuestData) {
            window.sessionQuestData.m3 = (window.sessionQuestData.m3 || 0) + 1;
            if (window.currentMode === 'Code') window.sessionQuestData.c4 = (window.sessionQuestData.c4 || 0) + 1;
        }

        if (!window.isTyping) {
            window.timer = setInterval(window.initTimerProcedural, 1000);
            window.isTyping = true;
            window.wordHasMistake = false;
        }

        if (typedChar == null) {
            // Backspace
            if (window.charIndex > 0) {
                window.charIndex--;
                const prev = characters[window.charIndex];
                if (prev.classList.contains('incorrect')) window.mistakes--;
                prev.classList.remove('correct', 'incorrect', 'active');
                prev.classList.add('active');
            }
        } else {
            const expectedChar = characters[window.charIndex].textContent;
            const isTrailingSpace = !!characters[window.charIndex].dataset?.trailingSpace;

            // For Words mode trailing-space span, only Space key advances
            const isMatch = (expectedChar === typedChar)
                || (!isWordsMode && expectedChar === '\n' && typedChar === ' ');

            if (isMatch) {
                characters[window.charIndex].classList.add('correct');
                SFX.playType();
                flashKey(typedChar, true);

                window.currentStreak = (window.currentStreak || 0) + 1;
                if (window.currentStreak > (window.maxStreakInGame || 0)) window.maxStreakInGame = window.currentStreak;
                const strkEl = document.getElementById('streak');
                if (strkEl) strkEl.innerText = window.currentStreak;

                if (window.sessionQuestData) {
                    window.sessionQuestData.p1 = (window.sessionQuestData.p1 || 0) + 1;
                    if ('[](){};:<>|!@#$%^&*'.includes(typedChar)) {
                        window.sessionQuestData.c1 = (window.sessionQuestData.c1 || 0) + 1;
                        window.sessionQuestData.wkc_sp = (window.sessionQuestData.wkc_sp || 0) + 1;
                    }
                    if (window.currentMode === 'Code') window.sessionQuestData.c7 = (window.sessionQuestData.c7 || 0) + 1;
                }

                if ((window.currentStreak || 0) >= 50 && !window.isOnFire) {
                    window.isOnFire = true;
                    const gtb = document.getElementById('game-typing-box');
                    if (gtb) gtb.classList.add('on-fire');
                }

                if (window.isBossLevel) {
                    window.bossHP = (window.bossHP || 0) - 1;
                    const bhf = document.getElementById('boss-hp-fill');
                    if (bhf) bhf.style.width = `${Math.max(0, window.bossHP)}%`;
                    if (window.bossHP <= 0) {
                        if (window.updateQuestProgress) {
                            window.updateQuestProgress('wk_bss', 1);
                            window.updateQuestProgress('ch_b5', 1);
                            if (window.currentMode === 'Code') {
                                window.updateQuestProgress('wkc_bss', 1);
                                window.updateQuestProgress('chc_b5', 1);
                            }
                        }
                        window.triggerEndGamePause(true);
                        return;
                    }
                }

                // Word-mode: space on trailing-space span → advance word
                if (isWordsMode && isTrailingSpace) {
                    window.handleWordCompletionProcedural && window.handleWordCompletionProcedural();
                    const wArr = window.wordsArray || [];
                    const wIdx = window.currentWordIndex || 0;
                    if (wIdx < wArr.length - 1) {
                        window.currentWordIndex = wIdx + 1;
                        window.charIndex = 0;
                        hif.value = '';
                        renderTextProcedural(wArr[window.currentWordIndex]);
                        return;
                    } else {
                        characters[window.charIndex].classList.remove('active');
                        window.charIndex++;
                        window.triggerEndGamePause(true);
                        return;
                    }
                }

                // Non-words newline advance
                if (!isWordsMode && (expectedChar === ' ' || expectedChar === '\n')) {
                    window.handleWordCompletionProcedural && window.handleWordCompletionProcedural();
                }
            } else {
                // Wrong key
                window.wordHasMistake = true;
                const cOwned = window.getOwnedUpgrades ? window.getOwnedUpgrades() : [];
                let shieldLimit = 0;
                if (cOwned.includes('shield5')) shieldLimit = 10;
                else if (cOwned.includes('shield4')) shieldLimit = 8;
                else if (cOwned.includes('shield3')) shieldLimit = 6;
                else if (cOwned.includes('shield2')) shieldLimit = 4;
                else if (cOwned.includes('shield'))  shieldLimit = 2;

                if ((window.mistakesForgiven || 0) < shieldLimit) {
                    characters[window.charIndex].classList.add('correct');
                    window.mistakesForgiven = (window.mistakesForgiven || 0) + 1;
                    SFX.playType(); flashKey(typedChar, true);
                    if (isWordsMode && isTrailingSpace) {
                        window.handleWordCompletionProcedural && window.handleWordCompletionProcedural();
                        const wArr = window.wordsArray || [];
                        const wIdx = window.currentWordIndex || 0;
                        if (wIdx < wArr.length - 1) {
                            window.currentWordIndex = wIdx + 1;
                            window.charIndex = 0;
                            hif.value = '';
                            renderTextProcedural(wArr[window.currentWordIndex]);
                            return;
                        } else { window.triggerEndGamePause(true); return; }
                    }
                } else {
                    window.mistakes = (window.mistakes || 0) + 1;
                    characters[window.charIndex].classList.add('incorrect');
                    SFX.playError(); flashKey(typedChar, false);
                    window.currentStreak = 0; window.isOnFire = false;
                    const strkEl = document.getElementById('streak'); if (strkEl) strkEl.innerText = 0;
                    const gtb = document.getElementById('game-typing-box'); if (gtb) gtb.classList.remove('on-fire');
                    const mstEl = document.getElementById('mistakes'); if (mstEl) mstEl.innerText = window.mistakes;
                    if (window.isBossLevel) {
                        window.bossHP = Math.min(100, (window.bossHP || 0) + 5);
                        const bhf = document.getElementById('boss-hp-fill');
                        if (bhf) bhf.style.width = `${window.bossHP}%`;
                    }
                }
            }

            characters[window.charIndex].classList.remove('active');
            window.charIndex++;

            if (window.charIndex < characters.length) {
                characters[window.charIndex].classList.add('active');
                const ttc = document.querySelector('#game-screen .typing-text-container');
                if (ttc && window.currentMode !== 'Words') {
                    const span = characters[window.charIndex];
                    if (span.offsetTop > ttc.scrollTop + ttc.clientHeight - 80) {
                        ttc.scrollTop = span.offsetTop - 80;
                    }
                }
            } else if (!isWordsMode) {
                window.triggerEndGamePause(true);
            }
        }

        window.updateRealStatsProcedural && window.updateRealStatsProcedural();
    }
};


// ─────────────────────────────────────────────────────────
// 2.  RANK NAME OVERHAUL — Keyboard / Typing themed
//     Easy   → Finger tracks  (Home Row → Touch Type → Speed)
//     Normal → Keystroke tier (Keysmith → Typist → Wordsmith)
//     Hard   → Master tier   (Keymaster → Compiler → Overclocker)
// ─────────────────────────────────────────────────────────
const RANK_MATERIALS = [
    { prefix:'Rubber Dome',  color:'#a1887f', minLvl:1,   maxLvl:29  },
    { prefix:'Membrane',     color:'#90a4ae', minLvl:30,  maxLvl:49  },
    { prefix:'Scissor Key',  color:'#80cbc4', minLvl:50,  maxLvl:79  },
    { prefix:'Cherry Blue',  color:'#42a5f5', minLvl:80,  maxLvl:119 },
    { prefix:'Cherry Red',   color:'#ef5350', minLvl:120, maxLvl:159 },
    { prefix:'Topre',        color:'#ab47bc', minLvl:160, maxLvl:189 },
    { prefix:'Hall Effect',  color:'#26c6da', minLvl:190, maxLvl:199 },
    { prefix:'Endgame',      color:'#ffd54f', minLvl:200, maxLvl:200 },
];
const RANK_SUFFIXES = {
    Words:      ['Typer', 'Writer', 'Author'],
    Lines:      ['Composer', 'Scribe', 'Lyricist'],
    Paragraphs: ['Essayist', 'Scholar', 'Historian'],
    Pages:      ['Novelist', 'Archivist', 'Chronicler'],
    Code:       ['Debugger', 'Compiler', 'Architect'],
};
const RANK_DIFF_PREFIX = {
    Easy:   ['Trainee', 'Learner', 'Student'],
    Normal: ['Typist',  'Adept',   'Veteran'],
    Hard:   ['Expert',  'Master',  'Legend'],
};
const NUMERALS = ['I', 'II', 'III'];

// Rebuild rankTiers using new names
(function rebuildRankTiers() {
    const modesList = ['Words','Lines','Paragraphs','Pages','Code'];
    modesList.forEach(mode => {
        ['Easy','Normal','Hard'].forEach(diff => {
            const tiers = [];
            let globalIdx = 0;
            const baseWpm  = diff === 'Hard' ? 30 : diff === 'Normal' ? 18 : 8;
            const wpmStep  = diff === 'Hard' ? 5  : diff === 'Normal' ? 3  : 2;

            RANK_MATERIALS.forEach(mat => {
                const range   = mat.maxLvl - mat.minLvl + 1;
                const stepLvl = Math.max(1, Math.floor(range / 3));
                NUMERALS.forEach((num, idx) => {
                    const reqLvl = mat.prefix === 'Endgame' ? 200 : mat.minLvl + idx * stepLvl;
                    const suffix = (RANK_SUFFIXES[mode] || RANK_SUFFIXES.Words)[idx % 3];
                    const dpfx   = (RANK_DIFF_PREFIX[diff] || RANK_DIFF_PREFIX.Normal)[idx % 3];
                    tiers.push({
                        name:     `${mat.prefix} ${suffix} ${num}`,
                        color:    mat.color,
                        material: mat.prefix.split(' ')[0],   // for trophy icon lookup
                        reqLvl,
                        reqWpm:   baseWpm + globalIdx * wpmStep,
                        reward:   (globalIdx + 1) * 120,
                    });
                    globalIdx++;
                });
            });

            if (window.rankTiers && window.rankTiers[mode]) {
                window.rankTiers[mode][diff] = tiers;
            }
        });
    });
})();


// ─────────────────────────────────────────────────────────
// 3.  SHOP ITEM NAME OVERHAUL — Typing / Keyboard themed
// ─────────────────────────────────────────────────────────
window.SHOP_ITEMS_DATA = [
    // ── TIME upgrades ───────────────────────────────────
    { id:'time',  family:'time', name:'Overtime Boost I',   desc:'+5 seconds on your timer.',            cost:100,   lvl:1   },
    { id:'time2', family:'time', name:'Overtime Boost II',  desc:'+10 seconds on your timer.',           cost:300,   lvl:5   },
    { id:'time3', family:'time', name:'Overtime Boost III', desc:'+15 seconds — more runway.',            cost:800,   lvl:15  },
    { id:'time4', family:'time', name:'Overtime Boost IV',  desc:'+20 seconds — extended session.',      cost:2000,  lvl:30  },
    { id:'time5', family:'time', name:'Overtime Boost V',   desc:'+30 seconds — marathon mode.',         cost:5000,  lvl:50  },
    // ── SHIELD upgrades ─────────────────────────────────
    { id:'shield',  family:'shield', name:'Typo Shield I',   desc:'Forgives 2 typos per level.',          cost:250,   lvl:1   },
    { id:'shield2', family:'shield', name:'Typo Shield II',  desc:'Forgives 4 typos per level.',          cost:600,   lvl:10  },
    { id:'shield3', family:'shield', name:'Typo Shield III', desc:'Forgives 6 typos per level.',          cost:1500,  lvl:20  },
    { id:'shield4', family:'shield', name:'Typo Shield IV',  desc:'Forgives 8 typos per level.',          cost:3500,  lvl:40  },
    { id:'shield5', family:'shield', name:'Typo Shield V',   desc:'Forgives 10 typos per level.',         cost:8000,  lvl:60  },
    // ── GOLD upgrades ───────────────────────────────────
    { id:'gold',  family:'gold', name:'XP Multiplier I',   desc:'Earn 1.5× currency per session.',       cost:500,   lvl:5   },
    { id:'gold2', family:'gold', name:'XP Multiplier II',  desc:'Earn 2× currency per session.',         cost:1500,  lvl:15  },
    { id:'gold3', family:'gold', name:'XP Multiplier III', desc:'Earn 2.5× currency per session.',       cost:4000,  lvl:35  },
    { id:'gold4', family:'gold', name:'XP Multiplier IV',  desc:'Earn 3× currency per session.',         cost:10000, lvl:60  },
    { id:'gold5', family:'gold', name:'XP Multiplier V',   desc:'Earn 4× currency per session.',         cost:25000, lvl:90  },
    // ── HASTE upgrades ──────────────────────────────────
    { id:'haste',  family:'haste', name:'Speed Burst I',   desc:'-10s timer, 1.5× currency.',            cost:750,   lvl:5   },
    { id:'haste2', family:'haste', name:'Speed Burst II',  desc:'-8s timer, 2× currency.',               cost:2000,  lvl:25  },
    { id:'haste3', family:'haste', name:'Speed Burst III', desc:'-6s timer, 3× currency.',               cost:6000,  lvl:50  },
    { id:'haste4', family:'haste', name:'Speed Burst IV',  desc:'-4s timer, 4× currency.',               cost:15000, lvl:80  },
    // ── PEARL upgrades ──────────────────────────────────
    { id:'pearl',  family:'pearl', name:'Word Skip I',     desc:'Skip 1 word with Tab key.',              cost:1000,  lvl:5   },
    { id:'pearl2', family:'pearl', name:'Word Skip II',    desc:'Skip 2 words with Tab key.',             cost:2500,  lvl:20  },
    { id:'pearl3', family:'pearl', name:'Word Skip III',   desc:'Skip 3 words with Tab key.',             cost:6000,  lvl:40  },
    { id:'pearl4', family:'pearl', name:'Word Skip IV',    desc:'Skip 4 words with Tab key.',             cost:12000, lvl:70  },
    { id:'pearl5', family:'pearl', name:'Word Skip V',     desc:'Skip 5 words with Tab key.',             cost:25000, lvl:100 },
    // ── AUDIO ───────────────────────────────────────────
    { id:'audio-cherry', family:'a1', name:'Cherry Click',      desc:'Mechanical click-clack sound.',     cost:3000,  lvl:15, isVisual:true },
    { id:'audio-arcade', family:'a2', name:'Arcade Keys',       desc:'Retro 8-bit keystroke sounds.',     cost:8000,  lvl:35, isVisual:true },
    { id:'audio-alien',  family:'a3', name:'Alien Haptics',     desc:'Futuristic sci-fi key tones.',      cost:20000, lvl:85, isVisual:true },
    // ── VISUAL ──────────────────────────────────────────
    { id:'visual-rainbow',        family:'v1', name:'RGB Keyboard',       desc:'Every key glows a different colour.',   cost:1500,  lvl:10,  isVisual:true },
    { id:'visual-diamond-cursor', family:'v2', name:'Diamond Caret',      desc:'Glowing diamond cursor blink.',         cost:2500,  lvl:20,  isVisual:true },
    { id:'visual-trophy-start',   family:'v3', name:'Hall of Fame Badge', desc:'Trophy floats on the map screen.',      cost:3000,  lvl:25,  isVisual:true },
    { id:'visual-dragon-result',  family:'v4', name:'PB Dragon Egg',      desc:'Dragon egg on the result screen.',      cost:5000,  lvl:50,  isVisual:true },
    { id:'visual-netherite-kb',   family:'v5', name:'Dark Matter Keys',   desc:'Deep-dark glowing keyboard.',           cost:7500,  lvl:70,  isVisual:true },
    { id:'visual-emerald-glow',   family:'v6', name:'Correct-Key Sparkle',desc:'Green glow on every correct key.',     cost:12000, lvl:90,  isVisual:true },
    { id:'visual-golden-text',    family:'v7', name:'Golden Typeface',     desc:'All typing text turns gold.',           cost:20000, lvl:100, isVisual:true },
    { id:'visual-crown',          family:'v8', name:'Rank Crown',          desc:'Crown badge next to your rank.',        cost:30000, lvl:120, isVisual:true },
    { id:'visual-enchanted-bg',   family:'v9', name:'Aura Field',         desc:'Enchanted aura behind the test box.',   cost:40000, lvl:150, isVisual:true },
    { id:'visual-hero-totem',     family:'v10',name:'Victory Totem',      desc:'Giant totem appears on win screen.',    cost:50000, lvl:180, isVisual:true },
];

window.ENCHANTMENTS_DATA = [
    { id:'ench-godmode',  name:'⚡ Infinite Clock',    desc:'Timer never ends + 5× currency.',         req1:'time5',   req2:'gold5',   cost:100000 },
    { id:'ench-aegis',    name:'🛡 Iron Wrists',        desc:'+6 hearts in Hardcore mode.',              req1:'shield5', req2:'pearl5',  cost:80000  },
    { id:'ench-chronos',  name:'⏳ Time Crystal',       desc:'Slow falling word speed in Hardcore.',     req1:'time5',   req2:'haste4',  cost:90000  },
    { id:'ench-midas',    name:'💎 Key of Fortune',     desc:'5× all currency earned, permanently.',     req1:'gold5',   req2:'haste4',  cost:120000 },
];


// ─────────────────────────────────────────────────────────
// 4.  EXPANDED QUEST POOLS  (daily + backup rotation)
// ─────────────────────────────────────────────────────────

// Helper – pick N quests from a pool by day-of-year seed so
// every player sees the same set each day, different next day.
function _seedRandom(seed) {
    let s = seed;
    return function() {
        s = (s * 1664525 + 1013904223) & 0xffffffff;
        return (s >>> 0) / 0xffffffff;
    };
}
function _dailyPick(pool, n) {
    const dayIdx = Math.floor(Date.now() / 86400000); // changes each UTC day
    const rng = _seedRandom(dayIdx ^ 0xdeadbeef);
    const shuffled = [...pool].sort(() => rng() - 0.5);
    return shuffled.slice(0, Math.min(n, shuffled.length)).map(q => ({
        ...q, current: 0, claimed: false,
    }));
}
function _weeklyPick(pool, n) {
    const weekIdx = Math.floor(Date.now() / (86400000 * 7));
    const rng = _seedRandom(weekIdx ^ 0xcafebabe);
    const shuffled = [...pool].sort(() => rng() - 0.5);
    return shuffled.slice(0, Math.min(n, shuffled.length)).map(q => ({
        ...q, current: 0, claimed: false,
    }));
}

// Full daily pools (8+ quests each — 4 shown per day, rest are next-day backup)
const DAILY_LIT_POOL_FULL = [
    { id:'dl_lv1',  text:'Complete 3 levels today',                       target:3,    reward:1200  },
    { id:'dl_lv2',  text:'Finish a Pages level',                          target:1,    reward:4000  },
    { id:'dl_lv3',  text:'Complete a Paragraphs level',                   target:1,    reward:1800  },
    { id:'dl_lv4',  text:'Finish a Lines level',                          target:1,    reward:1000  },
    { id:'dl_acc1', text:'Earn 100% accuracy in any session',             target:1,    reward:2000  },
    { id:'dl_acc2', text:'Earn 95%+ accuracy twice today',                target:2,    reward:2500  },
    { id:'dl_wpm1', text:'Hit 30 WPM in a session',                       target:30,   reward:1500  },
    { id:'dl_wpm2', text:'Hit 50 WPM in a session',                       target:50,   reward:3000  },
    { id:'dl_str1', text:'Reach a 30-key streak in one session',          target:30,   reward:800   },
    { id:'dl_str2', text:'Reach a 50-key streak in one session',          target:50,   reward:1500  },
    { id:'dl_key1', text:'Type 500 keystrokes today',                     target:500,  reward:900   },
    { id:'dl_key2', text:'Type 1,200 keystrokes today',                   target:1200, reward:2000  },
    { id:'dl_earn', text:'Earn 3,000 Emeralds in a single day',           target:3000, reward:2500  },
    { id:'dl_hard', text:'Complete a Hard difficulty level',              target:1,    reward:3000  },
    { id:'dl_boss', text:'Survive a boss level (every 40th level)',       target:1,    reward:6000  },
    { id:'dl_prfct',text:'Finish a Normal or Hard level with no mistakes',target:1,    reward:3500  },
];

const DAILY_CODE_POOL_FULL = [
    { id:'dc_lv1',  text:'Clear 2 Code levels today',                     target:2,    reward:1500  },
    { id:'dc_lv2',  text:'Clear 4 Code levels today',                     target:4,    reward:3000  },
    { id:'dc_sp1',  text:'Type 50 special characters { } ; ( )',          target:50,   reward:1200  },
    { id:'dc_sp2',  text:'Type 120 special characters today',             target:120,  reward:2500  },
    { id:'dc_acc1', text:'Finish a Code session with 90%+ accuracy',      target:1,    reward:1800  },
    { id:'dc_acc2', text:'Finish a Code session with 100% accuracy',      target:1,    reward:3000  },
    { id:'dc_wpm1', text:'Hit 25 WPM in a Code session',                  target:25,   reward:1500  },
    { id:'dc_wpm2', text:'Hit 45 WPM in a Code session',                  target:45,   reward:3000  },
    { id:'dc_str1', text:'40-key streak in Code mode',                    target:40,   reward:1000  },
    { id:'dc_key1', text:'Type 400 Code keystrokes today',                target:400,  reward:1000  },
    { id:'dc_key2', text:'Type 800 Code keystrokes today',                target:800,  reward:2000  },
    { id:'dc_earn', text:'Earn 2,000 Diamonds in a single day',           target:2000, reward:2000  },
    { id:'dc_hard', text:'Complete a Hard Code level',                    target:1,    reward:3500  },
    { id:'dc_boss', text:'Survive a Code boss level',                     target:1,    reward:7000  },
];

const WEEKLY_LIT_POOL_FULL = [
    { id:'wl_lv5',  text:'Complete 5 Hard levels this week',              target:5,    reward:6000  },
    { id:'wl_lv20', text:'Complete 20 levels this week',                  target:20,   reward:8000  },
    { id:'wl_pg2',  text:'Finish 2 Pages levels this week',               target:2,    reward:9000  },
    { id:'wl_boss', text:'Slay a boss level',                             target:1,    reward:12000 },
    { id:'wl_str',  text:'Hit a 100-key streak in one session',           target:100,  reward:5000  },
    { id:'wl_e20k', text:'Earn 20,000 Emeralds this week',                target:20000,reward:12000 },
    { id:'wl_p500', text:'Type 500 words total this week',                target:500,  reward:4000  },
    { id:'wl_acc5', text:'Get 100% accuracy 5 times this week',           target:5,    reward:7000  },
    { id:'wl_wpm70',text:'Hit 70 WPM in any session this week',           target:70,   reward:8000  },
];

const WEEKLY_CODE_POOL_FULL = [
    { id:'wc_lv10', text:'Clear 10 Code levels this week',                target:10,   reward:6000  },
    { id:'wc_sp500',text:'Type 500 special characters this week',         target:500,  reward:7000  },
    { id:'wc_boss', text:'Slay a Code boss level',                        target:1,    reward:12000 },
    { id:'wc_d15k', text:'Earn 15,000 Diamonds this week',                target:15000,reward:11000 },
    { id:'wc_acc5', text:'Get 95%+ accuracy 5 times in Code mode',        target:5,    reward:5500  },
    { id:'wc_str80',text:'80-key streak in Code mode',                    target:80,   reward:4500  },
    { id:'wc_lv15', text:'Beat 15 Code levels this week',                 target:15,   reward:6500  },
    { id:'wc_wpm60',text:'Hit 60 WPM in a Code session this week',        target:60,   reward:8000  },
];

// Rebuild daily/weekly quests with rotated picks
(function refreshQuestPools() {
    const todayStr = new Date().toDateString();
    const weekStr  = (() => {
        const d = new Date(); const jan1 = new Date(d.getFullYear(), 0, 1);
        return `${d.getFullYear()}-W${Math.ceil(((d - jan1) / 86400000 + jan1.getDay() + 1) / 7)}`;
    })();

    const KEYS = window.KEYS || {};

    function _freshOrKeep(storageKey, dateProp, dateVal, buildFn) {
        let existing;
        try { existing = JSON.parse(localStorage.getItem(storageKey)); } catch(e) {}
        if (!existing || existing[dateProp] !== dateVal) {
            existing = { [dateProp]: dateVal, quests: buildFn() };
            localStorage.setItem(storageKey, JSON.stringify(existing));
        }
        return existing;
    }

    window.dailyQuestsLit    = _freshOrKeep(KEYS.dailyLit    || 'tqDailyLit',     'date', todayStr, () => _dailyPick(DAILY_LIT_POOL_FULL,  5));
    window.dailyQuestsCode   = _freshOrKeep(KEYS.dailyCode   || 'tqDailyCode',    'date', todayStr, () => _dailyPick(DAILY_CODE_POOL_FULL, 5));
    window.weeklyQuestsLit   = _freshOrKeep(KEYS.weeklyLit   || 'tqWeeklyLit',   'week', weekStr,  () => _weeklyPick(WEEKLY_LIT_POOL_FULL, 4));
    window.weeklyQuestsCode  = _freshOrKeep(KEYS.weeklyCode  || 'tqWeeklyCode',  'week', weekStr,  () => _weeklyPick(WEEKLY_CODE_POOL_FULL, 4));
})();


// ─────────────────────────────────────────────────────────
// 5.  ACCOUNT CENTRE  (username + settings panel)
//     Opens via the existing account modal
//
//     NOTE: This definition is overwritten by google_auth.js, which loads
//     after this file and reassigns window.renderAccountPanel last. Edits
//     made here will NOT appear in the app — edit google_auth.js's
//     renderAccountPanel instead.
// ─────────────────────────────────────────────────────────
window.renderAccountPanel = function() {
    const panel = document.getElementById('account-panel-content');
    if (!panel) return;
    const acc  = window.getCurrentAccount ? window.getCurrentAccount() : { id:'guest', name:'Guest', loginStreak:1 };
    const list = Object.values(window.accounts || {});

    panel.innerHTML = `
    <h2 style="font-family:var(--font-head);color:var(--primary);margin:0 0 20px;font-size:1.6rem;text-align:center;letter-spacing:0.05em;padding-top:8px;">ACCOUNT CENTRE</h2>

    ${acc.id !== 'guest' ? `
    <div class="acc-active-box">
        <div class="acc-avatar-ring">
            <div class="acc-big-avatar">${acc.name.charAt(0).toUpperCase()}</div>
        </div>
        <div>
            <div class="acc-username" id="acc-name-display">${acc.name}</div>
            <div class="acc-meta">Login streak: ${acc.loginStreak || 1} day${(acc.loginStreak||1)>1?'s':''}</div>
            <div class="acc-meta">Joined: ${new Date(acc.created||Date.now()).toLocaleDateString()}</div>
        </div>
    </div>

    <div class="acc-section-label">EDIT PROFILE</div>
    <div class="acc-form-row">
        <input id="edit-acc-name" class="acc-input" value="${acc.name}" maxlength="20" placeholder="Display name">
        <button class="acc-btn primary" onclick="accSaveName()">Save Name</button>
    </div>

    <div class="acc-section-label">SETTINGS</div>
    <div class="acc-settings-grid">
        <div class="acc-setting-row">
            <span class="acc-setting-label">Sound Effects</span>
            <label class="acc-toggle-wrap">
                <input type="checkbox" id="sett-sfx" ${localStorage.getItem('tq_sfx_off')==='1'?'':'checked'} onchange="accToggleSetting('sfx',this.checked)">
                <span class="acc-toggle-slider"></span>
            </label>
        </div>
        <div class="acc-setting-row">
            <span class="acc-setting-label">Visual Effects</span>
            <label class="acc-toggle-wrap">
                <input type="checkbox" id="sett-vis" ${window.visualsActive?'checked':''} onchange="accToggleSetting('vis',this.checked)">
                <span class="acc-toggle-slider"></span>
            </label>
        </div>
        <div class="acc-setting-row">
            <span class="acc-setting-label">Show Keyboard</span>
            <label class="acc-toggle-wrap">
                <input type="checkbox" id="sett-kb" ${localStorage.getItem('tq_hide_kb')!=='1'?'checked':''} onchange="accToggleSetting('kb',this.checked)">
                <span class="acc-toggle-slider"></span>
            </label>
        </div>
        <div class="acc-setting-row">
            <span class="acc-setting-label">Pause after level</span>
            <label class="acc-toggle-wrap">
                <input type="checkbox" id="sett-pause" ${localStorage.getItem('tq_skip_pause')!=='1'?'checked':''} onchange="accToggleSetting('pause',this.checked)">
                <span class="acc-toggle-slider"></span>
            </label>
        </div>
        <div class="acc-setting-row">
            <span class="acc-setting-label">Ghost Runner</span>
            <label class="acc-toggle-wrap">
                <input type="checkbox" id="sett-ghost" ${localStorage.getItem('tq_hide_ghost')!=='1'?'checked':''} onchange="accToggleSetting('ghost',this.checked)">
                <span class="acc-toggle-slider"></span>
            </label>
        </div>
        <div class="acc-setting-row">
            <span class="acc-setting-label">Colour Theme</span>
            <select class="acc-select" onchange="accSetTheme(this.value)">
                <option value="cyan" ${(localStorage.getItem('tq_theme')||'cyan')==='cyan'?'selected':''}>Cyan (Default)</option>
                <option value="purple" ${localStorage.getItem('tq_theme')==='purple'?'selected':''}>Purple</option>
                <option value="green" ${localStorage.getItem('tq_theme')==='green'?'selected':''}>Matrix Green</option>
                <option value="orange" ${localStorage.getItem('tq_theme')==='orange'?'selected':''}>Amber</option>
            </select>
        </div>
    </div>

    <div class="acc-section-label" style="margin-top:16px;">STATISTICS</div>
    <div class="acc-stats-grid" id="acc-stats-grid">${buildAccStats()}</div>

    <div style="display:flex;gap:8px;margin-top:16px;flex-wrap:wrap;">
        <button class="acc-btn danger" onclick="if(confirm('Sign out?')){switchAccount('guest');renderAccountPanel();}">Sign Out</button>
        <button class="acc-btn secondary" onclick="if(confirm('Delete this profile? This cannot be undone.')){deleteAccount('${acc.id}');}">Delete Profile</button>
    </div>
    ` : `
    <p style="text-align:center;color:rgba(255,255,255,0.4);font-size:0.9rem;margin:0 0 20px;line-height:1.6;">Create a profile to track your progress, set a username, and personalise your experience.</p>
    `}

    <div class="acc-section-label">SWITCH PROFILE (${list.length})</div>
    <div class="profile-list" style="max-height:200px;overflow-y:auto;margin-bottom:14px;">
        ${list.length ? list.map(a => `
        <div class="profile-item ${a.id===acc.id?'active-profile':''}" onclick="switchAccount('${a.id}');renderAccountPanel();">
            <div class="profile-mini-avatar">${a.name.charAt(0).toUpperCase()}</div>
            <div class="profile-info">
                <div class="profile-info-name">${a.name}</div>
                <div class="profile-info-sub">Streak ${a.loginStreak||1}d</div>
            </div>
            ${a.id===acc.id
                ? '<span style="color:var(--primary);font-family:var(--font-code);font-size:0.75rem;">ACTIVE</span>'
                : `<button onclick="event.stopPropagation();deleteAccount('${a.id}');" style="background:rgba(255,23,68,0.1);border:1px solid rgba(255,23,68,0.25);border-radius:6px;padding:3px 9px;color:#ff5252;font-size:0.75rem;cursor:pointer;font-family:var(--font-code);">DEL</button>`}
        </div>`).join('')
        : '<div style="text-align:center;padding:14px;color:rgba(255,255,255,0.25);font-family:var(--font-code);font-size:0.82rem;">No profiles yet</div>'}
    </div>

    <div class="acc-section-label">CREATE NEW PROFILE</div>
    <div style="display:flex;gap:8px;">
        <input id="new-acc-name" class="acc-input" placeholder="Choose a username…" maxlength="20" style="flex:1;margin-bottom:0;" onkeydown="if(event.key==='Enter')createAccountFromForm()">
        <button class="acc-btn primary" onclick="createAccountFromForm()">Create</button>
    </div>`;

    // Apply saved theme on load
    accSetTheme(localStorage.getItem('tq_theme') || 'cyan', true);
};

function buildAccStats() {
    let pd = {};
    try { pd = JSON.parse(localStorage.getItem('typingProgressData') || '{}'); } catch(e) {}
    const modes = ['Words','Lines','Paragraphs','Pages','Code'];
    const maxLvl = Math.max(0, ...modes.map(m => Math.max(pd[m]?.Easy||0, pd[m]?.Normal||0, pd[m]?.Hard||0)));
    const bestWpm = Math.max(0, ...modes.map(m => Math.max(pd[m]?.Easy_maxWpm||0, pd[m]?.Normal_maxWpm||0, pd[m]?.Hard_maxWpm||0)));
    const sessions = (() => { try { return JSON.parse(localStorage.getItem('tq_session_log')||'[]').length; } catch(e){ return 0; }})();
    return [
        { label:'Max Level', val: maxLvl },
        { label:'Best WPM',  val: bestWpm },
        { label:'Sessions',  val: sessions },
        { label:'Emeralds',  val: (window.emeralds||0).toLocaleString() },
        { label:'Diamonds',  val: (window.diamonds||0).toLocaleString() },
        { label:'Prestige',  val: window.prestigeCount || 0 },
    ].map(s => `<div class="acc-stat-chip"><span class="acc-stat-val">${s.val}</span><span class="acc-stat-lbl">${s.label}</span></div>`).join('');
}

window.accSaveName = function() {
    const inp = document.getElementById('edit-acc-name');
    const name = inp?.value.trim();
    if (!name) { showToast('Name cannot be empty.', 'error'); return; }
    const acc = window.getCurrentAccount ? window.getCurrentAccount() : null;
    if (!acc || acc.id === 'guest') return;
    if (window.accounts && window.accounts[acc.id]) {
        window.accounts[acc.id].name = name;
        window.saveAccounts && window.saveAccounts();
        window.updateUserIndicators && window.updateUserIndicators();
        renderAccountPanel();
        showToast(`Name updated to "${name}"`, 'success');
    }
};

window.accToggleSetting = function(key, val) {
    if (key === 'sfx')   { localStorage.setItem('tq_sfx_off', val ? '0' : '1'); }
    if (key === 'vis')   { window.visualsActive = val; localStorage.setItem('typingVisualsActive', val); window.applyOwnedVisualsOnLoad && window.applyOwnedVisualsOnLoad(); }
    if (key === 'kb')    { localStorage.setItem('tq_hide_kb', val ? '0' : '1'); const kb = document.getElementById('virtual-keyboard'); if (kb) kb.style.display = val ? '' : 'none'; }
    if (key === 'pause') { localStorage.setItem('tq_skip_pause', val ? '0' : '1'); }
    if (key === 'ghost') { localStorage.setItem('tq_hide_ghost', val ? '0' : '1'); const gt = document.getElementById('ghost-track'); if (gt) gt.style.display = val ? '' : 'none'; }
};

window.accSetTheme = function(theme, silent) {
    localStorage.setItem('tq_theme', theme);
    const root = document.documentElement;
    const themes = {
        cyan:   { p:'#00f5ff', s:'rgba(0,245,255,0.15)', b:'rgba(0,245,255,0.18)', g1:'#00f5ff', g2:'#69ff47' },
        purple: { p:'#b388ff', s:'rgba(179,136,255,0.15)', b:'rgba(179,136,255,0.2)', g1:'#b388ff', g2:'#f48fb1' },
        green:  { p:'#39ff14', s:'rgba(57,255,20,0.12)',  b:'rgba(57,255,20,0.2)',  g1:'#39ff14', g2:'#00e5ff' },
        orange: { p:'#ff9800', s:'rgba(255,152,0,0.15)',  b:'rgba(255,152,0,0.22)', g1:'#ff9800', g2:'#ffd54f' },
    };
    const t = themes[theme] || themes.cyan;
    root.style.setProperty('--primary',       t.p);
    root.style.setProperty('--primary-dim',   t.s);
    root.style.setProperty('--card-border',   t.b);
    root.style.setProperty('--text-shadow',   t.p + '99');
    root.style.setProperty('--prog-grad-1',   t.g1);
    root.style.setProperty('--prog-grad-2',   t.g2);
    root.style.setProperty('--card-shadow',   t.p + '55');
    if (!silent) showToast(`Theme: ${theme.charAt(0).toUpperCase()+theme.slice(1)}`, 'info', 1500);
};

// Apply saved theme on page load
accSetTheme(localStorage.getItem('tq_theme') || 'cyan', true);

// Apply saved keyboard / ghost visibility
(function applySettings() {
    if (localStorage.getItem('tq_hide_kb') === '1') {
        const kb = document.getElementById('virtual-keyboard');
        if (kb) kb.style.display = 'none';
    }
    if (localStorage.getItem('tq_hide_ghost') === '1') {
        const gt = document.getElementById('ghost-track');
        if (gt) gt.style.display = 'none';
    }
})();


// ─────────────────────────────────────────────────────────
// 6.  UI POLISH — make buttons/cards less boxy + purple base
// ─────────────────────────────────────────────────────────
// Injected at runtime so it layers on top of style.css
(function injectPatchStyles() {
    const s = document.createElement('style');
    s.id = 'patch-styles';
    s.textContent = `
/* ── Font smoothing ─────────────────────────────────── */
body { -webkit-font-smoothing: antialiased; }

/* ── Softer card radii ──────────────────────────────── */
.glass-card { border-radius: 20px !important; }
.diff-card, .shop-item, .quest-item, .lb-row,
.mp-player-row, .mp-room-row { border-radius: 14px !important; }
.map-node { border-radius: 50% !important; }
.acc-input, .mp-input { border-radius: 12px !important; }

/* ── Account centre helpers ─────────────────────────── */
.acc-active-box {
    display:flex; align-items:center; gap:16px;
    background:rgba(0,0,0,0.35); border:1px solid var(--card-border);
    border-radius:16px; padding:16px; margin-bottom:16px;
}
.acc-avatar-ring {
    width:56px; height:56px; border-radius:50%;
    background:linear-gradient(135deg,var(--primary),var(--prog-grad-2));
    padding:3px; flex-shrink:0;
}
.acc-big-avatar {
    width:100%; height:100%; border-radius:50%;
    background:var(--bg-1); display:flex; align-items:center;
    justify-content:center; font-family:var(--font-head);
    font-size:1.4rem; font-weight:900; color:var(--primary);
}
.acc-username { font-family:var(--font-head); font-size:1.15rem; color:var(--primary); }
.acc-meta { font-family:var(--font-code); font-size:0.74rem; color:rgba(255,255,255,0.35); margin-top:3px; }
.acc-section-label {
    font-family:var(--font-head); font-size:0.68rem; letter-spacing:0.13em;
    text-transform:uppercase; color:rgba(255,255,255,0.25); margin:14px 0 8px;
}
.acc-form-row { display:flex; gap:8px; }
.acc-input {
    flex:1; background:rgba(0,0,0,0.45);
    border:1.5px solid rgba(255,255,255,0.1); border-radius:10px;
    padding:10px 14px; color:#e8e8f0; font-size:0.95rem;
    font-family:var(--font-main); outline:none; transition:border-color 0.2s;
    margin-bottom:8px;
}
.acc-input:focus { border-color:var(--primary); box-shadow:0 0 8px var(--card-shadow); }
.acc-btn {
    padding:9px 18px; border-radius:10px; border:none; cursor:pointer;
    font-family:var(--font-main); font-size:0.9rem; font-weight:700;
    transition:all 0.2s; letter-spacing:0.03em; white-space:nowrap;
}
.acc-btn.primary  { background:var(--primary); color:#000; }
.acc-btn.primary:hover { transform:translateY(-2px); box-shadow:0 6px 18px var(--card-shadow); }
.acc-btn.secondary{ background:rgba(255,255,255,0.07); color:rgba(255,255,255,0.7); border:1px solid rgba(255,255,255,0.12); }
.acc-btn.secondary:hover { background:rgba(255,255,255,0.12); border-color:var(--primary); color:var(--primary); }
.acc-btn.danger   { background:rgba(255,23,68,0.1); color:#ff5252; border:1px solid rgba(255,23,68,0.28); }
.acc-btn.danger:hover { background:rgba(255,23,68,0.2); border-color:#ff1744; }

/* Settings grid */
.acc-settings-grid { display:flex; flex-direction:column; gap:6px; }
.acc-setting-row {
    display:flex; align-items:center; justify-content:space-between;
    background:rgba(0,0,0,0.3); border:1px solid rgba(255,255,255,0.07);
    border-radius:10px; padding:10px 14px;
}
.acc-setting-label { font-family:var(--font-main); font-size:0.9rem; font-weight:600; color:rgba(255,255,255,0.7); }
.acc-toggle-wrap { position:relative; display:inline-block; width:40px; height:22px; }
.acc-toggle-wrap input { opacity:0; width:0; height:0; }
.acc-toggle-slider {
    position:absolute; inset:0; background:rgba(255,255,255,0.1);
    border-radius:11px; cursor:pointer; transition:background 0.25s;
    border:1px solid rgba(255,255,255,0.15);
}
.acc-toggle-slider::before {
    content:''; position:absolute; width:16px; height:16px;
    border-radius:50%; background:#fff; top:2px; left:2px; transition:left 0.25s;
}
.acc-toggle-wrap input:checked + .acc-toggle-slider { background:var(--primary); }
.acc-toggle-wrap input:checked + .acc-toggle-slider::before { left:20px; }
.acc-select {
    background:rgba(0,0,0,0.5); border:1.5px solid rgba(255,255,255,0.12);
    border-radius:8px; padding:5px 10px; color:var(--primary);
    font-family:var(--font-main); font-size:0.85rem; font-weight:600; cursor:pointer;
    outline:none;
}
/* Stats grid */
.acc-stats-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:8px; }
.acc-stat-chip {
    background:rgba(0,0,0,0.4); border:1px solid rgba(255,255,255,0.07);
    border-radius:12px; padding:12px 8px; text-align:center;
}
.acc-stat-val { display:block; font-family:var(--font-head); font-size:1.4rem; color:var(--primary); }
.acc-stat-lbl { display:block; font-family:var(--font-code); font-size:0.65rem; color:rgba(255,255,255,0.3); text-transform:uppercase; letter-spacing:0.1em; margin-top:3px; }

/* ── Softer typing area ───────────────────────────── */
#game-typing-box { border-radius: 16px !important; }
.typing-text { font-family: 'Rajdhani', sans-serif !important; font-weight: 600 !important; letter-spacing: 0.01em; }
.typing-text span { display: inline; }
.typing-text span.active { background: rgba(255,255,255,0.07); border-radius: 3px; }

/* ── Words mode: trailing space span subtle hint ──── */
.typing-text span[data-trailing-space='1'] {
    border-bottom: 2px dashed rgba(255,255,255,0.15) !important;
    min-width: 8px; display: inline-block;
}
.typing-text span[data-trailing-space='1'].correct { border-bottom-color: #00e676 !important; }

/* ── Quest items softer ───────────────────────────── */
.quest-item { border-radius: 14px !important; padding: 14px !important; }
.quest-item h3 { font-family: var(--font-main) !important; font-weight: 600; font-size: 0.92rem !important; }

/* ── Map nodes ────────────────────────────────────── */
.map-node { font-family: var(--font-main) !important; font-weight: 700; }

/* ── Results screen ───────────────────────────────── */
.results-header { font-family: var(--font-head) !important; }
.results-subtitle { font-family: var(--font-main) !important; font-weight: 500; }
`;
    document.head.appendChild(s);
})();

console.log('[patches.js] Loaded — Words mode fix, rank overhaul, shop rename, expanded quests, account centre.');
