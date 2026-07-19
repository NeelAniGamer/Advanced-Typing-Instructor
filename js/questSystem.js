// Quest Engine
let activeQuestTab = 'daily';
export let sessionQuestData = { w1: 0, p1: 0, m3: 0, m1: 0, c1: 0, c4: 0, c7: 0 };

// ═══════════════════════════════════════════════════════════
// QUEST ENGINE — Daily / Weekly / Challenge
// ═══════════════════════════════════════════════════════════

/* ── SEED HELPER — picks N quests from pool by UTC day so every
      player sees the same set today, different set tomorrow ── */
function _seedRandom(seed) {
    let s = seed >>> 0;
    return function() { s = Math.imul(s ^ (s >>> 16), 0x45d9f3b) >>> 0; s = Math.imul(s ^ (s >>> 16), 0x45d9f3b) >>> 0; return (s >>> 0) / 0xffffffff; };
}
function _dailyPick(pool, n) {
    const dayIdx = Math.floor(Date.now() / 86400000);
    const rng = _seedRandom(dayIdx ^ 0xdeadbeef);
    return [...pool].sort(() => rng() - 0.5).slice(0, Math.min(n, pool.length)).map(q => ({ ...q, current: 0, claimed: false }));
}
function _weeklyPick(pool, n) {
    const weekIdx = Math.floor(Date.now() / (86400000 * 7));
    const rng = _seedRandom(weekIdx ^ 0xcafebabe);
    return [...pool].sort(() => rng() - 0.5).slice(0, Math.min(n, pool.length)).map(q => ({ ...q, current: 0, claimed: false }));
}

/* ── DAILY POOLS (16 Lit + 14 Code — 5 shown per day, rest rotate next day) ── */
function getDailyLitPool() {
  return [
    { id:'d_lv1',  text:'Complete 3 levels today',                        target:3,    reward:1200  },
    { id:'d_lv2',  text:'Finish a Pages level',                           target:1,    reward:4000  },
    { id:'d_lv3',  text:'Complete a Paragraphs level',                    target:1,    reward:1800  },
    { id:'d_lv4',  text:'Finish a Lines level',                           target:1,    reward:1000  },
    { id:'d_acc1', text:'Earn 100% accuracy in any session',              target:1,    reward:2000  },
    { id:'d_acc2', text:'Earn 95%+ accuracy twice today',                 target:2,    reward:2500  },
    { id:'d_wpm1', text:'Hit 30 WPM in any session today',                target:30,   reward:1500  },
    { id:'d_wpm2', text:'Hit 50 WPM in any session today',                target:50,   reward:3000  },
    { id:'d_str1', text:'Reach a 30-key streak in one session',           target:30,   reward:800   },
    { id:'d_str2', text:'Reach a 50-key streak in one session',           target:50,   reward:1500  },
    { id:'d_key1', text:'Type 500 keystrokes today',                      target:500,  reward:900   },
    { id:'d_key2', text:'Type 1,200 keystrokes today',                    target:1200, reward:2000  },
    { id:'d_earn', text:'Earn 3,000 Emeralds in a single day',            target:3000, reward:2500  },
    { id:'d_hard', text:'Complete a Hard difficulty level',               target:1,    reward:3000  },
    { id:'d_boss', text:'Survive a boss level',                           target:1,    reward:6000  },
    { id:'d_prft', text:'Finish a Normal or Hard level with no mistakes', target:1,    reward:3500  },
  ];
}
function getDailyCodePool() {
  return [
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
}

/* ── WEEKLY POOLS (9 Lit + 8 Code — 4 shown per week) ── */
function getWeeklyLitPool() {
  return [
    { id:'wk_bss', text:'Slay a Wither or Warden Boss',                  target:1,    reward:10000 },
    { id:'wk_l5',  text:'Complete 5 Hard difficulty levels this week',   target:5,    reward:6000  },
    { id:'wk_p5',  text:'Type 500 words total this week',                target:500,  reward:4000  },
    { id:'wk_pg2', text:'Complete 2 Pages levels this week',             target:2,    reward:9000  },
    { id:'wk_str', text:'Hit a 100-key streak in one session',           target:100,  reward:5000  },
    { id:'wk_e20', text:'Earn 20,000 Emeralds this week',                target:20000,reward:12000 },
    { id:'wk_lv',  text:'Complete 20 levels this week',                  target:20,   reward:6500  },
    { id:'wk_acc', text:'Get 100% accuracy 5 times this week',           target:5,    reward:7000  },
    { id:'wk_wpm', text:'Hit 70 WPM in any session this week',           target:70,   reward:8000  },
  ];
}
function getWeeklyCodePool() {
  return [
    { id:'wkc_bss',text:'Slay a Code Boss',                              target:1,    reward:10000 },
    { id:'wkc_c10',text:'Clear 10 Code levels this week',                target:10,   reward:6000  },
    { id:'wkc_sp', text:'Type 500 special characters this week',         target:500,  reward:7000  },
    { id:'wkc_acc',text:'Get 95%+ accuracy 5 times in Code mode',        target:5,    reward:5500  },
    { id:'wkc_d15',text:'Earn 15,000 Diamonds this week',                target:15000,reward:11000 },
    { id:'wkc_str',text:'80-key streak in Code mode this week',          target:80,   reward:4500  },
    { id:'wkc_lv', text:'Beat 15 Code levels this week',                 target:15,   reward:6000  },
    { id:'wkc_wpm',text:'Hit 60 WPM in a Code session this week',        target:60,   reward:8000  },
  ];
}

/* ── CHALLENGE POOLS (hard, never reset) ── */
function getChallengeLitPool() {
  return [
    { id:'ch_100', text:'Reach Level 100 in any mode',                   target:100,  reward:25000 },
    { id:'ch_200', text:'Reach Level 200 (Max Level) in any mode',       target:200,  reward:75000 },
    { id:'ch_wpm', text:'Hit 80 WPM in a session',                       target:80,   reward:15000 },
    { id:'ch_b5',  text:'Defeat 5 Boss levels',                          target:5,    reward:30000 },
    { id:'ch_acc', text:'100 sessions with 100% Accuracy',               target:100,  reward:50000 },
    { id:'ch_pre', text:'Reach Prestige 1',                              target:1,    reward:100000},
  ];
}
function getChallengeCodePool() {
  return [
    { id:'chc_100',text:'Reach Level 100 in Code mode',                  target:100,  reward:25000 },
    { id:'chc_200',text:'Reach Level 200 in Code mode',                  target:200,  reward:75000 },
    { id:'chc_wpm',text:'Hit 60 WPM in Code mode',                       target:60,   reward:15000 },
    { id:'chc_b5', text:'Defeat 5 Code Bosses',                          target:5,    reward:30000 },
    { id:'chc_sp', text:'Type 5,000 total special characters',           target:5000, reward:40000 },
  ];
}

/* ── SEED FROM POOL — use _dailyPick/_weeklyPick for rotation ── */
function buildQuestSlots(pool, count) {
  const shuffled = [...pool].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count).map(q => ({ ...q, current: 0, claimed: false }));
}

/* ── DATE HELPERS ── */
let todayStr = new Date().toDateString();
function getWeekStr() {
  const d = new Date();
  const jan1 = new Date(d.getFullYear(), 0, 1);
  const week = Math.ceil(((d - jan1) / 86400000 + jan1.getDay() + 1) / 7);
  return `${d.getFullYear()}-W${week}`;
}
let weekStr = getWeekStr();

/* ── STORAGE KEYS ── */
const KEYS = {
  dailyLit:     'tqDailyLit',     dailyCode:     'tqDailyCode',
  weeklyLit:    'tqWeeklyLit',    weeklyCode:    'tqWeeklyCode',
  challengeLit: 'tqChallengeLit', challengeCode: 'tqChallengeCode',
};

function _loadOrCreate(key, dateProp, dateVal, buildFn) {
  let obj; try { obj = JSON.parse(localStorage.getItem(key)); } catch(e) {}
  if (!obj || obj[dateProp] !== dateVal) {
    obj = { [dateProp]: dateVal, quests: buildFn() };
    localStorage.setItem(key, JSON.stringify(obj));
  }
  return obj;
}

// Daily: seeded by day so today's 5 are deterministic, tomorrow different
let dailyQuestsLit  = _loadOrCreate(KEYS.dailyLit,     'date', todayStr, () => _dailyPick(getDailyLitPool(),  5));
let dailyQuestsCode = _loadOrCreate(KEYS.dailyCode,    'date', todayStr, () => _dailyPick(getDailyCodePool(), 5));
let weeklyQuestsLit  = _loadOrCreate(KEYS.weeklyLit,   'week', weekStr,  () => _weeklyPick(getWeeklyLitPool(),  4));
let weeklyQuestsCode = _loadOrCreate(KEYS.weeklyCode,  'week', weekStr,  () => _weeklyPick(getWeeklyCodePool(), 4));
let challengeQuestsLit  = _loadOrCreate(KEYS.challengeLit,  'v', '1', () => buildQuestSlots(getChallengeLitPool(),  3));
let challengeQuestsCode = _loadOrCreate(KEYS.challengeCode, 'v', '1', () => buildQuestSlots(getChallengeCodePool(), 3));

function getActiveQuestSet(tab) {
  const isCode = currentCategory === 'Coding';
  if (tab === 'weekly')    return isCode ? weeklyQuestsCode    : weeklyQuestsLit;
  if (tab === 'challenge') return isCode ? challengeQuestsCode : challengeQuestsLit;
  return isCode ? dailyQuestsCode : dailyQuestsLit;
}

let heatmapData = {};
try { heatmapData = JSON.parse(localStorage.getItem("typingHeatmap")) || {}; } catch(e) {}

// Mass Shop Array
const SHOP_ITEMS_DATA = [
    { id:'time',   family:'time',   name:'Overtime Boost I',    desc:'+5 seconds on your timer.',              cost:100,   lvl:1   },
    { id:'time2',  family:'time',   name:'Overtime Boost II',   desc:'+10 seconds on your timer.',             cost:300,   lvl:5   },
    { id:'time3',  family:'time',   name:'Overtime Boost III',  desc:'+15 seconds — more runway.',             cost:800,   lvl:15  },
    { id:'time4',  family:'time',   name:'Overtime Boost IV',   desc:'+20 seconds — extended session.',        cost:2000,  lvl:30  },
    { id:'time5',  family:'time',   name:'Overtime Boost V',    desc:'+30 seconds — marathon mode.',           cost:5000,  lvl:50  },
    { id:'shield', family:'shield', name:'Typo Shield I',       desc:'Forgives 2 typos per level.',            cost:250,   lvl:1   },
    { id:'shield2',family:'shield', name:'Typo Shield II',      desc:'Forgives 4 typos per level.',            cost:600,   lvl:10  },
    { id:'shield3',family:'shield', name:'Typo Shield III',     desc:'Forgives 6 typos per level.',            cost:1500,  lvl:20  },
    { id:'shield4',family:'shield', name:'Typo Shield IV',      desc:'Forgives 8 typos per level.',            cost:3500,  lvl:40  },
    { id:'shield5',family:'shield', name:'Typo Shield V',       desc:'Forgives 10 typos per level.',           cost:8000,  lvl:60  },
    { id:'gold',   family:'gold',   name:'XP Multiplier I',     desc:'Earn 1.5× currency per session.',        cost:500,   lvl:5   },
    { id:'gold2',  family:'gold',   name:'XP Multiplier II',    desc:'Earn 2× currency per session.',          cost:1500,  lvl:15  },
    { id:'gold3',  family:'gold',   name:'XP Multiplier III',   desc:'Earn 2.5× currency per session.',        cost:4000,  lvl:35  },
    { id:'gold4',  family:'gold',   name:'XP Multiplier IV',    desc:'Earn 3× currency per session.',          cost:10000, lvl:60  },
    { id:'gold5',  family:'gold',   name:'XP Multiplier V',     desc:'Earn 4× currency per session.',          cost:25000, lvl:90  },
    { id:'haste',  family:'haste',  name:'Speed Burst I',       desc:'-10s timer, earn 1.5× currency.',        cost:750,   lvl:5   },
    { id:'haste2', family:'haste',  name:'Speed Burst II',      desc:'-8s timer, earn 2× currency.',           cost:2000,  lvl:25  },
    { id:'haste3', family:'haste',  name:'Speed Burst III',     desc:'-6s timer, earn 3× currency.',           cost:6000,  lvl:50  },
    { id:'haste4', family:'haste',  name:'Speed Burst IV',      desc:'-4s timer, earn 4× currency.',           cost:15000, lvl:80  },
    { id:'pearl',  family:'pearl',  name:'Word Skip I',         desc:'Skip 1 word — no penalty.',              cost:1000,  lvl:5   },
    { id:'pearl2', family:'pearl',  name:'Word Skip II',        desc:'Skip 2 words per level.',                cost:2500,  lvl:20  },
    { id:'pearl3', family:'pearl',  name:'Word Skip III',       desc:'Skip 3 words per level.',                cost:6000,  lvl:40  },
    { id:'pearl4', family:'pearl',  name:'Word Skip IV',        desc:'Skip 4 words per level.',                cost:12000, lvl:70  },
    { id:'pearl5', family:'pearl',  name:'Word Skip V',         desc:'Skip 5 words per level.',                cost:25000, lvl:100 },
    { id:'audio-cherry',family:'a1',name:'Cherry Click',        desc:'Mechanical click-clack sounds.',         cost:3000,  lvl:15, isVisual:true },
    { id:'audio-arcade', family:'a2',name:'Arcade Keys',        desc:'Retro 8-bit keystroke sounds.',          cost:8000,  lvl:35, isVisual:true },
    { id:'audio-alien',  family:'a3',name:'Alien Haptics',      desc:'Futuristic sci-fi key tones.',           cost:20000, lvl:85, isVisual:true },
    { id:'visual-rainbow',        family:'v1', name:'RGB Keyboard',       desc:'Every key glows a different colour.',  cost:1500,  lvl:10,  isVisual:true },
    { id:'visual-diamond-cursor', family:'v2', name:'Diamond Caret',      desc:'Glowing diamond cursor blink.',        cost:2500,  lvl:20,  isVisual:true },
    { id:'visual-trophy-start',   family:'v3', name:'Hall of Fame Badge', desc:'Trophy floats on the map screen.',     cost:3000,  lvl:25,  isVisual:true },
    { id:'visual-dragon-result',  family:'v4', name:'PB Dragon Egg',      desc:'Dragon egg on the result screen.',     cost:5000,  lvl:50,  isVisual:true },
    { id:'visual-netherite-kb',   family:'v5', name:'Dark Matter Keys',   desc:'Deep-dark glowing keyboard.',          cost:7500,  lvl:70,  isVisual:true },
    { id:'visual-emerald-glow',   family:'v6', name:'Correct-Key Sparkle',desc:'Green glow on every correct key.',     cost:12000, lvl:90,  isVisual:true },
    { id:'visual-golden-text',    family:'v7', name:'Golden Typeface',    desc:'All typing text turns gold.',          cost:10000, lvl:120, isVisual:true },
    { id:'visual-crown',          family:'v8', name:'Rank Crown',         desc:'Crown badge next to your rank.',       cost:15000, lvl:150, isVisual:true },
    { id:'visual-enchanted-bg',   family:'v9', name:'Aura Field',         desc:'Enchanted aura behind the test box.',  cost:50000, lvl:180, isVisual:true },
    { id:'visual-hero-totem',     family:'v10',name:'Victory Totem',      desc:'Huge totem appears on win screen.',    cost:100000,lvl:200, isVisual:true }
];
const ENCHANTMENTS_DATA = [
    { id:'ench-godmode',  name:'⚡ Infinite Clock',  desc:'Timer never ends + 5× currency.',      req1:'time5',   req2:'gold5',   cost:100000 },
    { id:'ench-aegis',    name:'🛡 Iron Wrists',      desc:'+6 hearts in Hardcore mode.',           req1:'shield5', req2:'pearl5',  cost:80000  },
    { id:'ench-chronos',  name:'⏳ Time Crystal',     desc:'Slower falling words in Hardcore.',     req1:'time5',   req2:'haste4',  cost:90000  },
    { id:'ench-midas',    name:'💎 Key of Fortune',   desc:'5× all currency earned, permanently.',  req1:'gold5',   req2:'haste4',  cost:120000 },
];

const rankTiers = {};
modesList.forEach(m => rankTiers[m] = { "Easy": [], "Normal": [], "Hard": [] });

const matConfig = [
  { prefix: 'Rubber Dome',  color: '#a1887f', minLvl: 1,   maxLvl: 29  },
  { prefix: 'Membrane',     color: '#90a4ae', minLvl: 30,  maxLvl: 49  },
  { prefix: 'Scissor Key',  color: '#80cbc4', minLvl: 50,  maxLvl: 79  },
  { prefix: 'Cherry Blue',  color: '#42a5f5', minLvl: 80,  maxLvl: 119 },
  { prefix: 'Cherry Red',   color: '#ef5350', minLvl: 120, maxLvl: 159 },
  { prefix: 'Topre',        color: '#b388ff', minLvl: 160, maxLvl: 189 },
  { prefix: 'Hall Effect',  color: '#26c6da', minLvl: 190, maxLvl: 199 },
  { prefix: 'Endgame',      color: '#ffd54f', minLvl: 200, maxLvl: 200 },
];
const numerals = ['I', 'II', 'III'];
const modesDef = [
  { id: 'Words',      suffix: 'Typer'    },
  { id: 'Lines',      suffix: 'Scribe'   },
  { id: 'Paragraphs', suffix: 'Scholar'  },
  { id: 'Pages',      suffix: 'Novelist' },
  { id: 'Code',       suffix: 'Coder'    },
];
const diffDef = [
  { id: 'Easy',   title: 'Trainee' },
  { id: 'Normal', title: 'Adept'   },
  { id: 'Hard',   title: 'Expert'  },
];

modesDef.forEach(mode => { 
    diffDef.forEach(diff => { 
        let baseWpm = diff.id === "Hard" ? 30 : (diff.id === "Normal" ? 20 : 10); 
        let wpmStep = diff.id === "Hard" ? 4 : (diff.id === "Normal" ? 3 : 2); 
        let globalRankIdx = 0;
        
        matConfig.forEach(mat => { 
            let lvlRange = (mat.maxLvl - mat.minLvl) + 1;
            let stepLvl = Math.max(1, Math.floor(lvlRange / 3));
            
            numerals.forEach((num, idx) => { 
                let reqLvl = mat.minLvl + (idx * stepLvl);
                if (mat.prefix === 'Warden') reqLvl = 200; 
                
                rankTiers[mode.id][diff.id].push({ 
                    name: `${mat.prefix} ${mode.suffix} ${diff.title} ${num}`, 
                    color: mat.color, 
                    material: mat.prefix,
                    reqLvl: reqLvl, 
                    reqWpm: baseWpm + (globalRankIdx * wpmStep), 
                    reward: (globalRankIdx + 1) * 100 
                }); 
                globalRankIdx++;
            }); 
        }); 
    }); 
});

function calculateRankStats(lvl, wpm, mode, diff) { 
    let rankIdx = 0; 
    if (!rankTiers[mode] || !rankTiers[mode][diff]) return { index: 0, rank: {name: "Error", color: "#fff", reward: 0}, nextRank: null, progress: 100 };
    
    let tiers = rankTiers[mode][diff]; 
    for (let i = 0; i < tiers.length; i++) { 
        if (lvl >= tiers[i].reqLvl && wpm >= tiers[i].reqWpm) { rankIdx = i; } 
    } 
    let rank = tiers[rankIdx]; let progress = 100; let nextRank = null; 
    
    if (rankIdx < tiers.length - 1) { 
        nextRank = tiers[rankIdx + 1]; 
        let lvlDiff = nextRank.reqLvl - rank.reqLvl; 
        let wpmDiff = nextRank.reqWpm - rank.reqWpm; 
        let lvlProgress = lvlDiff > 0 ? Math.min(1, Math.max(0, (lvl - rank.reqLvl) / lvlDiff)) : 1; 
        let wpmProgress = wpmDiff > 0 ? Math.min(1, Math.max(0, (wpm - rank.reqWpm) / wpmDiff)) : 1; 
        progress = (lvlProgress * 0.5 + wpmProgress * 0.5) * 100; 
    } 
    if (isNaN(progress) || !isFinite(progress)) progress = 0; 
    return { index: rankIdx, rank: rank, nextRank: nextRank, progress: progress }; 
}

const trophyIcons = {
  'Rubber Dome': 'https://img.icons8.com/color/96/wood.png',
  'Membrane':    'https://img.icons8.com/color/96/iron-ore.png',
  'Scissor Key': 'https://img.icons8.com/color/96/stone-block.png',
  'Cherry Blue': 'download.png',
  'Cherry Red':  'https://img.icons8.com/color/96/obsidian.png',
  'Topre':       'https://img.icons8.com/color/96/amethyst.png',
  'Hall Effect': 'https://img.icons8.com/color/96/crystal-ball.png',
  'Endgame':     'emerald.png',
};

function updateRank() { 
    let currentLvl = getProg(currentMode, currentDiff); 
    let currentWpm = getWpmProg(currentMode, currentDiff); 
    let stats = calculateRankStats(currentLvl, currentWpm, currentMode, currentDiff); 
    
    let r1 = document.getElementById("current-rank"); 
    if(r1) { 
        r1.innerText = `${stats.rank.name}`; 
        r1.style.color = stats.rank.color; 
    }
    let r2 = document.getElementById("progress-current-rank"); if(r2) { r2.innerText = stats.rank.name; r2.style.color = stats.rank.color; }
    let rn = document.getElementById("progress-next-rank"); let rf = document.getElementById("rank-progress-fill");
    
    if (stats.nextRank) { 
        if(rn) { rn.innerText = stats.nextRank.name; rn.style.color = stats.nextRank.color; }
        if(rf) { rf.style.width = `${Math.max(2, stats.progress)}%`; }
    } else { 
        if(rn) { rn.innerText = "MAX RANK"; rn.style.color = "#fff"; }
        if(rf) { rf.style.width = `100%`; }
    } 
    
    if (prestigeCount > 0) { 
        let pt = document.getElementById("prestige-tracker");
        if(pt) { pt.innerText = `⭐${prestigeCount}`; pt.classList.remove("hidden"); }
    }

    let tUrl = trophyIcons[stats.rank.material] || trophyIcons['Copper'];
    let dTr = document.getElementById("diff-trophy"); if(dTr) dTr.src = tUrl;
    let lTr = document.getElementById("cat-lit-trophy"); if(lTr && currentCategory === "Literature") lTr.src = tUrl;
    let cTr = document.getElementById("cat-code-trophy"); if(cTr && currentCategory === "Coding") cTr.src = tUrl;
}

function showGameError(message) { 
    if(errorMessageText) errorMessageText.innerText = message; 
    if(errorModal) errorModal.classList.remove("hidden"); 
    SFX.playError(); 
}

function safeAddListener(id, eventType, callback) {
    let el = document.getElementById(id);
    if(el) el.addEventListener(eventType, callback);
}

function setupModalBackgroundClose(modalId) {
    const modal = document.getElementById(modalId);
    if (!modal) return;
    modal.addEventListener('click', (e) => {
        if (e.target === modal || e.target.classList.contains("popup-overlay")) {
            modal.classList.add("hidden");
        }
    });
}

function applyFocusLogic() {
    document.addEventListener("click", () => {
        if (gameScreen && !gameScreen.classList.contains("hidden") && hiddenInputField && !hiddenInputField.disabled) hiddenInputField.focus();
        else if (testScreen && !testScreen.classList.contains("hidden") && testInputField && !testInputField.disabled) testInputField.focus();
    });

    setupModalBackgroundClose("rank-modal");
    setupModalBackgroundClose("heatmap-modal");
    setupModalBackgroundClose("prestige-modal");
    setupModalBackgroundClose("error-modal");
    setupModalBackgroundClose("rewards-screen");
    setupModalBackgroundClose("shop-screen");
    setupModalBackgroundClose("crafting-screen");
}
applyFocusLogic();

// Spacebar guard removed — fluid typing, no forced space key required.

safeAddListener("close-error-btn", "click", () => { if(errorModal) errorModal.classList.add("hidden"); });

safeAddListener("enter-game-btn", "click", () => { 
    try {
        SFX.resume(); 
        if(landingScreen) landingScreen.classList.add("hidden"); 
        
        if(!localStorage.getItem('hasTested')) { 
            startPlacementTest(); 
        } else { 
            if(categoryScreen) { 
                categoryScreen.classList.remove("hidden");
                document.getElementById("global-emerald-count").innerText = emeralds || 0;
                document.getElementById("global-diamond-count").innerText = diamonds || 0;
                updateRank(); 
            }
        } 
    } catch(err) {
        showGameError("Initialization Error: " + err.message);
    }
});

safeAddListener("cat-main-menu-btn", "click", () => {
    if(categoryScreen) categoryScreen.classList.add("hidden");
    if(landingScreen) landingScreen.classList.remove("hidden");
});

document.querySelectorAll('.category-card').forEach(card => {
    card.addEventListener("click", () => {
        currentCategory = card.getAttribute("data-category");
        let isCoding = (currentCategory === "Coding");
        
        document.body.classList.toggle("theme-red", isCoding);
        
        let cName = isCoding ? "Diamonds" : "Emeralds";
        let cIcon = isCoding ? "download.png" : "emerald.png";
        
        document.querySelectorAll(".curr-name").forEach(el => el.innerText = cName);
        document.querySelectorAll(".curr-icon").forEach(el => {
            el.src = cIcon;
            if(isCoding) el.style.borderRadius = "4px"; else el.style.borderRadius = "0";
        });
        
        let ms = document.getElementById("mode-selector");
        let msw = document.getElementById("mode-selector-wrapper");
        if(ms) {
            ms.innerHTML = "";
            if (isCoding) {
                if (msw) msw.classList.add("hidden");
                currentMode = "Code";
            } else {
                if (msw) msw.classList.remove("hidden");
                ms.innerHTML = '<option value="Words">Words</option><option value="Lines">Lines</option><option value="Paragraphs">Paragraphs</option><option value="Pages">Pages</option>';
                currentMode = "Words";
            }
        }
        
        if(categoryScreen) categoryScreen.classList.add("hidden");
        applyOwnedVisualsOnLoad();
        showDifficultyScreen();
        renderQuests(); 
    });
});

safeAddListener("diff-main-menu-btn", "click", () => { 
    if(diffScreen) diffScreen.classList.add("hidden"); 
    if(landingScreen) landingScreen.classList.remove("hidden"); 
});

safeAddListener("diff-back-cat-btn", "click", () => { 
    if(diffScreen) diffScreen.classList.add("hidden"); 
    if(categoryScreen) { 
        categoryScreen.classList.remove("hidden"); 
        document.getElementById("global-emerald-count").innerText = emeralds || 0;
        document.getElementById("global-diamond-count").innerText = diamonds || 0;
        updateRank();
    }
});

if (diffCards) {
    diffCards.forEach(card => { 
        if (card.classList.contains("category-card")) return; 
        card.addEventListener("click", () => { 
            if (card.classList.contains("locked-diff")) { 
                showGameError("This Difficulty Is Locked! Complete the required levels first."); 
                return; 
            }
            currentDiff = card.getAttribute("data-diff"); 
            if(diffScreen) diffScreen.classList.add("hidden"); 
            if(startScreen) startScreen.classList.remove("hidden"); 
            if(mainHeader) mainHeader.classList.remove("hidden"); 
            
            let mtd = document.getElementById("map-title-display");
            if(mtd) mtd.innerText = currentDiff === "Hard" ? "Hardcore Survival" : `${currentDiff} Mode`; 
            
            let currentMaxLvl = getProg(currentMode, currentDiff); 
            currentMapPage = Math.floor((currentMaxLvl - 1) / 40); 
            if (currentMapPage > 4) currentMapPage = 4; 
            
            buildLevelMap(); 
        }); 
    });
}

safeAddListener("back-to-diff-btn", "click", () => { 
    if(startScreen) startScreen.classList.add("hidden"); 
    if(mainHeader) mainHeader.classList.add("hidden"); 
    showDifficultyScreen(); 
});

safeAddListener("back-from-game-btn", "click", () => { 
    isGameActive = false; 
    clearInterval(timer); clearInterval(fallingSpawnInterval); clearInterval(fallingPhysicsInterval); 
    
    flushQuestsToStorage();

    if(gameScreen) gameScreen.classList.add("hidden"); 
    if(startScreen) startScreen.classList.remove("hidden"); 
    if(mainHeader) mainHeader.classList.remove("hidden"); 
    buildLevelMap(); 
});

safeAddListener("open-shop-btn", "click", () => { 
    if(shopScreen) shopScreen.classList.remove("hidden"); 
    updateShop(); 
});

safeAddListener("close-shop-btn", "click", () => { 
    if(shopScreen) shopScreen.classList.add("hidden"); 
});

safeAddListener("open-crafting-btn", "click", () => { 
    let cs = document.getElementById("crafting-screen");
    if(cs) cs.classList.remove("hidden"); 
    updateCrafting(); 
});

safeAddListener("close-crafting-btn", "click", () => { 
    let cs = document.getElementById("crafting-screen");
    if(cs) cs.classList.add("hidden"); 
});

safeAddListener("open-rewards-btn", "click", () => { 
    if(rewardsScreen) rewardsScreen.classList.remove("hidden"); 
    populateRewardsTrack(); 
});

safeAddListener("close-rewards-btn", "click", () => { 
    if(rewardsScreen) rewardsScreen.classList.add("hidden"); 
});

safeAddListener("return-menu-btn", "click", () => { 
    if(resultScreen) resultScreen.classList.add("hidden"); 
    if(startScreen) startScreen.classList.remove("hidden"); 
    if(mainHeader) mainHeader.classList.remove("hidden"); 
    buildLevelMap(); 
});

safeAddListener("rank-display-btn", "click", () => { 
    const rankListUI = document.getElementById("rank-list-ui"); 
    let rmt = document.getElementById("rank-modal-title");
    if(rmt) rmt.innerText = `${currentMode} [${currentDiff}] Ranks`; 
    if(rankListUI) {
        rankListUI.innerHTML = ""; 
        if(rankTiers[currentMode] && rankTiers[currentMode][currentDiff]) {
            rankTiers[currentMode][currentDiff].forEach(rank => { 
                let cName = currentCategory === "Coding" ? "Diamonds" : "Emeralds";
                rankListUI.innerHTML += `<li><b style="color:${rank.color};">${rank.name}:</b> Lvl ${rank.reqLvl} & ${rank.reqWpm} WPM <span style="font-size:1rem; color:#4caf50;">(+${rank.reward} ${cName})</span></li>`; 
            }); 
        }
    }
    if(rankModal) rankModal.classList.remove("hidden"); 
});

safeAddListener("close-rank-btn", "click", () => { if(rankModal) rankModal.classList.add("hidden"); });
safeAddListener("open-heatmap-btn", "click", () => { renderHeatmap(); if(heatmapModal) heatmapModal.classList.remove("hidden"); });
safeAddListener("close-heatmap-btn", "click", () => { if(heatmapModal) heatmapModal.classList.add("hidden"); });

let ms = document.getElementById("mode-selector");
if(ms) {
    ms.addEventListener("change", (e) => { currentMode = e.target.value; updateUI(); buildLevelMap(); });
}

// TOGGLE VISUALS
let btnToggleVisuals = document.getElementById("toggle-visuals-btn");
if(btnToggleVisuals) {
    btnToggleVisuals.innerText = visualsActive ? "👁️ Visuals: ON" : "👁️ Visuals: OFF";
    safeAddListener("toggle-visuals-btn", "click", () => {
        visualsActive = !visualsActive;
        localStorage.setItem('typingVisualsActive', visualsActive);
        btnToggleVisuals.innerText = visualsActive ? "👁️ Visuals: ON" : "👁️ Visuals: OFF";
        applyOwnedVisualsOnLoad();
    });
}

// PRESTIGE
safeAddListener("prestige-btn", "click", () => { if(prestigeModal) prestigeModal.classList.remove("hidden"); });
safeAddListener("cancel-prestige-btn", "click", () => { if(prestigeModal) prestigeModal.classList.add("hidden"); });
safeAddListener("confirm-prestige-btn", "click", () => { 
    progressData = {}; 
    modesList.forEach(mode => { 
        progressData[mode] = {};
        ["Easy", "Normal", "Hard"].forEach(diff => { 
            progressData[mode][diff] = 1; progressData[mode][diff + "_maxWpm"] = 0; 
        }); 
    });
    // Mark prestige challenge as progress
    updateQuestProgress('ch_pre', 1); 
    localStorage.setItem('typingProgressData', JSON.stringify(progressData)); 
    
    emeralds = 0; diamonds = 0;
    localStorage.setItem('typingEmeralds', emeralds); 
    localStorage.setItem('typingDiamonds', diamonds); 
    
    ownedUpgradesLit = []; ownedUpgradesCode = [];
    localStorage.setItem('typingUpgrades_Owned_Lit', JSON.stringify([])); 
    localStorage.setItem('typingUpgrades_Owned_Code', JSON.stringify([])); 
    
    prestigeCount++; localStorage.setItem('typingPrestige', prestigeCount); 
    location.reload(); 
});

/* --- KEYBOARD HEATMAP LOGIC --- */
const layout = [ 
    ['`','1','2','3','4','5','6','7','8','9','0','-','='], 
    ['Q','W','E','R','T','Y','U','I','O','P','[',']','\\'], 
    ['A','S','D','F','G','H','J','K','L',';','\''], 
    ['Z','X','C','V','B','N','M',',','.','/'], 
    [' '] 
]; 

const keyMap = { '!':'1', '@':'2', '#':'3', '$':'4', '%':'5', '^':'6', '&':'7', '*':'8', '(':'9', ')':'0', '_':'-', '+':'=', '{':'[', '}':']', '|':'\\', ':':';', '"':'\'', '<':',', '>':'.', '?':'/' };

const keyZones = { 
    '1':'zone-pinky-l', 'q':'zone-pinky-l', 'a':'zone-pinky-l', 'z':'zone-pinky-l', '`':'zone-pinky-l',
    '2':'zone-ring-l', 'w':'zone-ring-l', 's':'zone-ring-l', 'x':'zone-ring-l',
    '3':'zone-middle-l', 'e':'zone-middle-l', 'd':'zone-middle-l', 'c':'zone-middle-l',
    '4':'zone-index', '5':'zone-index', 'r':'zone-index', 't':'zone-index', 'f':'zone-index', 'g':'zone-index', 'v':'zone-index', 'b':'zone-index',
    '6':'zone-index', '7':'zone-index', 'y':'zone-index', 'u':'zone-index', 'h':'zone-index', 'j':'zone-index', 'n':'zone-index', 'm':'zone-index',
    '8':'zone-middle-r', 'i':'zone-middle-r', 'k':'zone-middle-r', ',':'zone-middle-r',
    '9':'zone-ring-r', 'o':'zone-ring-r', 'l':'zone-ring-r', '.':'zone-ring-r',
    '0':'zone-pinky-r', '-':'zone-pinky-r', '=':'zone-pinky-r', 'p':'zone-pinky-r', '[':'zone-pinky-r', ']':'zone-pinky-r', '\\':'zone-pinky-r', ';':'zone-pinky-r', '\'':'zone-pinky-r', '/':'zone-pinky-r'
}; 

const kbContainer = document.getElementById("virtual-keyboard"); 
let keyElements = {}; 

function buildKeyboard() { 
    if(!kbContainer) return;
    kbContainer.innerHTML = ''; 
    layout.forEach(row => { 
        let rowDiv = document.createElement('div'); rowDiv.className = 'keyboard-row'; 
        row.forEach(char => { 
            let keyDiv = document.createElement('div'); keyDiv.className = 'key'; 
            let lower = char.toLowerCase(); 
            if(char === ' ') { keyDiv.classList.add('spacebar'); keyDiv.innerText = 'SPACE'; } 
            else { keyDiv.innerText = char; if (keyZones[lower]) keyDiv.classList.add(keyZones[lower]); } 
            keyElements[lower] = keyDiv; rowDiv.appendChild(keyDiv); 
        }); 
        kbContainer.appendChild(rowDiv); 
    }); 
} buildKeyboard(); 

function flashKey(char, isCorrect) { 
    if (!char) return; 
    let lowerChar = char.toLowerCase(); 
    if (keyMap[char]) lowerChar = keyMap[char]; 

    if(keyElements[lowerChar]) { 
        let el = keyElements[lowerChar]; let cClass = isCorrect ? 'pressed-correct' : 'pressed-incorrect'; 
        el.classList.add(cClass); setTimeout(() => el.classList.remove(cClass), 150); 
    } 
    if (!heatmapData[lowerChar]) heatmapData[lowerChar] = { hits: 0, misses: 0 };
    if (isCorrect) heatmapData[lowerChar].hits++; else heatmapData[lowerChar].misses++;
    localStorage.setItem("typingHeatmap", JSON.stringify(heatmapData));
}

function renderHeatmap() {
    const hkContainer = document.getElementById("heatmap-keyboard");
    if(!hkContainer) return;
    hkContainer.innerHTML = ''; 
    layout.forEach(row => { 
        let rowDiv = document.createElement('div'); rowDiv.className = 'keyboard-row'; 
        row.forEach(char => { 
            let keyDiv = document.createElement('div'); keyDiv.className = 'key'; 
            let lower = char.toLowerCase(); 
            if(char === ' ') { keyDiv.classList.add('spacebar'); keyDiv.innerText = 'SPACE'; } else { keyDiv.innerText = char; }
            
            if (heatmapData[lower]) {
                let total = heatmapData[lower].hits + heatmapData[lower].misses;
                let acc = heatmapData[lower].hits / total;
                let hue = acc * 120; 
                keyDiv.style.background = `hsl(${hue}, 80%, 30%)`;
                keyDiv.style.borderColor = `hsl(${hue}, 80%, 50%)`;
            }
            rowDiv.appendChild(keyDiv); 
        }); 
        hkContainer.appendChild(rowDiv); 
    });
}

/* --- ZERO LAG QUESTS LOGIC --- */
function updateQuestProgress(questId, amount) {
    // Update across ALL quest tiers so progress counts everywhere
    const allSets = currentCategory === 'Coding'
        ? [dailyQuestsCode, weeklyQuestsCode, challengeQuestsCode]
        : [dailyQuestsLit,  weeklyQuestsLit,  challengeQuestsLit];
    allSets.forEach(qs => {
        if (!qs || !qs.quests) return;
        const quest = qs.quests.find(q => q.id === questId);
        if (quest && !quest.claimed && quest.current < quest.target) {
            quest.current = Math.min(quest.target, quest.current + amount);
        }
    });
}

function flushQuestsToStorage() {
  // Save all tiers
  const saveMap = {
    [KEYS.dailyLit]:     dailyQuestsLit,
    [KEYS.dailyCode]:    dailyQuestsCode,
    [KEYS.weeklyLit]:    weeklyQuestsLit,
    [KEYS.weeklyCode]:   weeklyQuestsCode,
    [KEYS.challengeLit]: challengeQuestsLit,
    [KEYS.challengeCode]:challengeQuestsCode,
  };
  Object.entries(saveMap).forEach(([k, v]) => { if(v) localStorage.setItem(k, JSON.stringify(v)); });
  renderQuests();
}

function renderQuests() {
    try {
        const container = document.getElementById("quests-list-container");
        if (!container) return;
        container.innerHTML = "";

        const tab = activeQuestTab || 'daily';
        const qs  = getActiveQuestSet(tab);
        if (!qs || !qs.quests) return;

        const tabClass  = tab === 'weekly' ? 'quest-weekly' : tab === 'challenge' ? 'quest-challenge' : '';
        const fillClass = tab === 'weekly' ? 'weekly-fill'  : tab === 'challenge' ? 'challenge-fill'  : '';
        const btnClass  = tab === 'weekly' ? 'weekly-btn'   : tab === 'challenge' ? 'challenge-btn'   : '';
        const resetLabel = tab === 'daily' ? 'Resets tomorrow' : tab === 'weekly' ? 'Resets next week' : 'Permanent challenge';
        const cName = currentCategory === 'Coding' ? 'Diamonds' : 'Emeralds';

        const labelDiv = document.createElement('div');
        labelDiv.className = 'quest-section-label';
        labelDiv.textContent = resetLabel;
        container.appendChild(labelDiv);

        qs.quests.forEach((q, index) => {
            const isDone = q.current >= q.target;
            const pct    = Math.min(100, (q.current / q.target) * 100);
            const btnHTML = isDone && !q.claimed
                ? `<button class="quest-claim-btn ${btnClass}" onclick="claimQuestTab('${tab}',${index})">🏆 Claim +${q.reward} ${cName}</button>`
                : q.claimed
                    ? `<button class="quest-claim-btn" disabled>✅ Claimed</button>`
                    : '';

            const div = document.createElement('div');
            div.className = `quest-item ${tabClass}` + (q.claimed ? ' ' : '');
            div.style.opacity = q.claimed ? '0.45' : '1';
            div.innerHTML = `
                <h3>${q.text}</h3>
                <p style="margin:0; color:#aaa; font-size:0.82rem;">${q.current.toLocaleString()} / ${q.target.toLocaleString()}</p>
                <div class="quest-bar-bg"><div class="quest-bar-fill ${fillClass}" style="width:${pct}%"></div></div>
                ${btnHTML}`;
            container.appendChild(div);
        });
    } catch(e) { console.error("Quest Error:", e); }
}

window.claimQuestTab = function(tab, index) {
    const qs = getActiveQuestSet(tab);
    if (!qs || !qs.quests || !qs.quests[index]) return;
    qs.quests[index].claimed = true;
    addActiveCurrency(qs.quests[index].reward);
    flushQuestsToStorage();
    SFX.playWin();
    updateUI();
    triggerConfetti();
};

window.switchQuestTab = function(btn, tab) {
    document.querySelectorAll('.quest-tab-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    activeQuestTab = tab;
    renderQuests();
};

window.claimQuest = function(index) {
    // Legacy wrapper — routes to daily tab
    claimQuestTab('daily', index);
};

// Expose to window
window.activeQuestTab = activeQuestTab;
window.sessionQuestData = sessionQuestData;
window.updateQuestProgress = updateQuestProgress;
window.flushQuestsToStorage = flushQuestsToStorage;
window.renderQuests = renderQuests;
