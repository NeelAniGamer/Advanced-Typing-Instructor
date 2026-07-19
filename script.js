// Audio engine moved to js/audioEngine.js

function getWPMText(wpm) { return `${parseInt(wpm)} WPM`; }
function getMistakeText(count) { return `${parseInt(count)} Mistake${parseInt(count) === 1 ? '' : 's'}`; }
function getTimeText(count) { return `${parseInt(count)}s`; }

// DOM Elements
var landingScreen = document.getElementById("landing-screen");
var categoryScreen = document.getElementById("category-screen");
var testScreen = document.getElementById("test-screen");
var mainHeader = document.getElementById("main-header");
var diffScreen = document.getElementById("difficulty-screen");
var startScreen = document.getElementById("start-screen");
var shopScreen = document.getElementById("shop-screen");
var craftingScreen = document.getElementById("crafting-screen");
var rewardsScreen = document.getElementById("rewards-screen");
var gameScreen = document.getElementById("game-screen");
var rankUpSequenceScreen = document.getElementById("rank-up-sequence-screen");
var resultScreen = document.getElementById("result-screen");
var rankModal = document.getElementById("rank-modal");

var heatmapModal = document.getElementById("heatmap-modal");
var prestigeModal = document.getElementById("prestige-modal");
var errorModal = document.getElementById("error-modal");
var errorMessageText = document.getElementById("error-message-text");

const modeSelector = document.getElementById("mode-selector");
const hiddenInputField = document.getElementById("hiddenInputField");
const testInputField = document.getElementById("testInputField");
const diffCards = document.querySelectorAll(".diff-card");
const levelMapContainer = document.getElementById("level-map-container");

// Game Engine State moved to js/gameState.js

let hardcoreModeActive = false; let activeFallingWords = []; let hardcoreHearts = 3; 
let fallingSpawnInterval; let fallingPhysicsInterval;
let currentMapPage = 0; 
let visualsActive = localStorage.getItem('typingVisualsActive') !== 'false';

// ULTRA-SAFE DATA RECOVERY & INITIALIZATION
const modesList = ["Words", "Lines", "Paragraphs", "Pages", "Code"];

// UI Controller moved to js/uiController.js

// ── TITLE CASE HELPER  (kept for legacy calls) ──
function toTitleCase(str) {
    return str.replace(/\w\S*/g, w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase());
}

// ── SHUFFLED SAMPLE — no adjacent repeats ──
function shuffledSample(arr, n) {
    if (!arr || !arr.length) return [];
    const a = [...arr];
    // Fisher-Yates shuffle
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    const result = [];
    while (result.length < n) result.push(...a);
    return result.slice(0, n);
}


// ── WIKIPEDIA JS FALLBACK ──
async function fetchTextFromWikipedia(mode, diff, level) {
    try {
        const CODE_SNIPPETS = [
            'def calculate(n):\n    return n * n + 2 * n + 1',
            'for i in range(len(arr)):\n    if arr[i] > maxVal:\n        maxVal = arr[i]',
            'int main() {\n    printf("Hello World\\n");\n    return 0;\n}',
            'function merge(arr, l, m, r) {\n    let left = arr.slice(l, m + 1);\n    let right = arr.slice(m + 1, r + 1);\n}',
            'SELECT * FROM users\nWHERE status = "active"\nORDER BY created_at DESC;',
            'class Node:\n    def __init__(self, val):\n        self.val = val\n        self.next = None',
            'const fetchData = async (url) => {\n    const res = await fetch(url);\n    return res.json();\n};',
        ];
        if (mode === 'Code') {
            const count = Math.min(1 + Math.floor(level / 15), 4);
            const chosen = [];
            for (let i = 0; i < count; i++) chosen.push(CODE_SNIPPETS[Math.floor(Math.random() * CODE_SNIPPETS.length)]);
            return { status: 'success', text: chosen.join('\n\n') };
        }
        const pulls = mode === 'Pages' ? 5 : mode === 'Paragraphs' ? 3 : 2;
        let combined = '';
        for (let i = 0; i < pulls; i++) {
            try {
                const r = await fetch('https://en.wikipedia.org/api/rest_v1/page/random/summary');
                const d = await r.json();
                combined += (d.extract || '') + ' ';
            } catch(e) {}
        }
        const allWords = combined.replace(/[^a-zA-Z\s]/g, ' ').split(/\s+/).filter(Boolean);
        let pool = allWords;
        if (diff === 'Easy') pool = allWords.filter(w => w.length <= 5);
        else if (diff === 'Hard') pool = allWords.filter(w => w.length > 6);
        if (!pool.length) pool = allWords;
        let text = '';
        if (mode === 'Words') {
            const count = 15 + Math.floor(level / 3);
            const chosen = [];
            for (let i = 0; i < count; i++) chosen.push(pool[Math.floor(Math.random() * pool.length)]);
            text = chosen.join(' ');
        } else if (mode === 'Lines') {
            const sents = combined.split(/[.!?]/).map(s => s.trim()).filter(s => s.length > 20);
            const count = 2 + Math.floor(level / 10);
            const chosen = [];
            for (let i = 0; i < count; i++) chosen.push(sents[Math.floor(Math.random() * sents.length)] || '');
            text = chosen.join('. ').trim() + '.';
        } else {
            const paras = combined.split(/\n+/).map(p => p.trim()).filter(p => p.length > 40);
            const count = mode === 'Pages' ? 3 + Math.floor(level / 20) : 1 + Math.floor(level / 30);
            const chosen = [];
            for (let i = 0; i < count; i++) chosen.push(paras[Math.floor(Math.random() * paras.length)] || '');
            text = chosen.join('\n\n');
        }
        return { status: 'success', text: text || 'The Quick Brown Fox Jumps Over The Lazy Dog.' };
    } catch (e) {
        return { status: 'success', text: 'The Quick Brown Fox Jumps Over The Lazy Dog.' };
    }
}

let progressData = {};
modesList.forEach(m => progressData[m] = { "Easy": 1, "Normal": 1, "Hard": 1, "Easy_maxWpm": 0, "Normal_maxWpm": 0, "Hard_maxWpm": 0 });

try {
    let saved = JSON.parse(localStorage.getItem('typingProgressData'));
    if (saved && typeof saved === 'object') {
        modesList.forEach(m => {
            if (saved[m]) {
                progressData[m].Easy = saved[m].Easy || 1;
                progressData[m].Normal = saved[m].Normal || 1;
                progressData[m].Hard = saved[m].Hard || 1;
                progressData[m].Easy_maxWpm = saved[m].Easy_maxWpm || 0;
                progressData[m].Normal_maxWpm = saved[m].Normal_maxWpm || 0;
                progressData[m].Hard_maxWpm = saved[m].Hard_maxWpm || 0;
            }
        });
    }
} catch(e) {}
localStorage.setItem('typingProgressData', JSON.stringify(progressData));

function getProg(mode, diff) { return progressData[mode] ? (progressData[mode][diff] || 1) : 1; }
function getWpmProg(mode, diff) { return progressData[mode] ? (progressData[mode][diff + "_maxWpm"] || 0) : 0; }

// COMPLETELY SEPARATED CURRENCY ENGINE
let emeralds = parseInt(localStorage.getItem('typingEmeralds')) || 0;
let diamonds = parseInt(localStorage.getItem('typingDiamonds')) || 0;

function getActiveCurrency() { return currentCategory === "Coding" ? diamonds : emeralds; }
function addActiveCurrency(amount) {
    if (currentCategory === "Coding") { diamonds += amount; localStorage.setItem('typingDiamonds', diamonds); }
    else { emeralds += amount; localStorage.setItem('typingEmeralds', emeralds); }
}
function deductActiveCurrency(amount) {
    if (currentCategory === "Coding") { diamonds -= amount; localStorage.setItem('typingDiamonds', diamonds); }
    else { emeralds -= amount; localStorage.setItem('typingEmeralds', emeralds); }
}

let prestigeCount = parseInt(localStorage.getItem('typingPrestige')) || 0;
let recommendedLevel = parseInt(localStorage.getItem('recLevel')) || 1;
let recommendedDiff = localStorage.getItem('recDiff') || "Normal";

let ownedUpgradesLit = JSON.parse(localStorage.getItem('typingUpgrades_Owned_Lit')) || [];
let ownedUpgradesCode = JSON.parse(localStorage.getItem('typingUpgrades_Owned_Code')) || [];

function getOwnedUpgrades() { return currentCategory === "Coding" ? ownedUpgradesCode : ownedUpgradesLit; }
function addOwnedUpgrade(item) {
    if (currentCategory === "Coding") { ownedUpgradesCode.push(item); localStorage.setItem('typingUpgrades_Owned_Code', JSON.stringify(ownedUpgradesCode)); }
    else { ownedUpgradesLit.push(item); localStorage.setItem('typingUpgrades_Owned_Lit', JSON.stringify(ownedUpgradesLit)); }
}

let claimedRanks = JSON.parse(localStorage.getItem('typingClaimedRanks')) || [];

// Quest Engine moved to js/questSystem.js

function updateUI() { 
    let currName = currentCategory === "Coding" ? "Diamonds" : "Emeralds";
    let currVal = getActiveCurrency();
    
    document.querySelectorAll(".curr-name").forEach(el => el.innerText = currName);
    
    let ec = document.getElementById("rupees-count-val");
    if(ec) ec.innerHTML = `${currVal} <span class="curr-name">${currName}</span>`; 
    
    let dec = document.getElementById("diff-rupees-count-val");
    if(dec) dec.innerHTML = `${currVal} <span class="curr-name">${currName}</span>`;
    
    let sec = document.getElementById("shop-rupees-count-val");
    if(sec) sec.innerText = currVal;
    
    let rl = document.getElementById("recommended-level");
    if(rl) rl.innerText = `${recommendedDiff} (Lvl ${recommendedLevel})`; 
    
    updateRank(); 
}

function buildLevelMap() { 
    if (!levelMapContainer) return;
    levelMapContainer.innerHTML = ""; 
    updateUI(); 
    
    let currentMaxLvl = getProg(currentMode, currentDiff); 
    let startLevel = (currentMapPage * 40) + 1; 
    let endLevel = startLevel + 39; 
    
    let pi = document.getElementById("page-indicator");
    if(pi) pi.innerText = `Levels ${startLevel} - ${endLevel}`; 
    
    let pb = document.getElementById("prev-page-btn");
    let nb = document.getElementById("next-page-btn");
    if(pb) pb.disabled = currentMapPage === 0; 
    if(nb) nb.disabled = currentMapPage === 4; 
    
    levelMapContainer.style.display = 'flex';
    levelMapContainer.style.flexDirection = 'column-reverse'; // Show lowest level at bottom
    levelMapContainer.style.alignItems = 'center';
    levelMapContainer.style.padding = '40px 0';
    levelMapContainer.style.gap = '25px';
    
    // Create an SVG container for connecting lines
    let svgNS = "http://www.w3.org/2000/svg";
    let svg = document.createElementNS(svgNS, "svg");
    svg.style.position = 'absolute';
    svg.style.top = '0';
    svg.style.left = '0';
    svg.style.width = '100%';
    svg.style.height = '100%';
    svg.style.zIndex = '0';
    svg.style.pointerEvents = 'none';
    levelMapContainer.appendChild(svg);
    
    let containerWidth = levelMapContainer.clientWidth || 300;
    let nodePositions = [];
    
    for (let i = startLevel; i <= endLevel; i++) { 
        let row = document.createElement("div");
        row.style.width = '100%';
        row.style.display = 'flex';
        row.style.justifyContent = 'center';
        row.style.zIndex = '1';
        
        let node = document.createElement("div"); 
        node.className = "map-node"; 
        
        if (i < currentMaxLvl) {
            node.classList.add("completed");
            node.innerText = '⭐';
        } else if (i === currentMaxLvl) {
            node.classList.add("unlocked");
            node.innerText = i;
        } else {
            node.classList.add("locked");
            node.innerText = '🔒';
        }
        
        node.addEventListener("click", () => { 
            if (!node.classList.contains("locked")) { 
                currentLevel = i; 
                startGameProcedural(); 
            } 
        });
        
        let offset = Math.sin(i * 0.5) * 60; // zigzag offset in pixels
        node.style.transform = `translateX(${offset}px)`;
        node.style.width = '70px';
        node.style.height = '70px';
        node.style.fontSize = '1.8rem';
        node.style.borderRadius = '50%';
        node.style.boxShadow = '0 6px 0 rgba(0,0,0,0.4), 0 10px 15px rgba(0,0,0,0.5)';
        
        row.appendChild(node);
        levelMapContainer.appendChild(row); 
    } 
    
    let pBtn = document.getElementById("prestige-btn");
    if (currentMaxLvl >= 200 && pBtn) { 
        pBtn.classList.remove("hidden"); 
    } 
    
    renderQuests(); 
}

function safeAddListener(id, eventType, callback) {
    let el = document.getElementById(id);
    if(el) el.addEventListener(eventType, callback);
}

safeAddListener("prev-page-btn", "click", () => { if(currentMapPage > 0) { currentMapPage--; buildLevelMap(); } });
safeAddListener("next-page-btn", "click", () => { if(currentMapPage < 4) { currentMapPage++; buildLevelMap(); } });

/* --- SHOP --- */
function updateShop() {
    const container = document.getElementById("shop-items-container");
    if(container) container.innerHTML = ""; 
    
    let absoluteMaxLvl = 1;
    modesList.forEach(mode => { ["Easy", "Normal", "Hard"].forEach(diff => { if (getProg(mode, diff) > absoluteMaxLvl) absoluteMaxLvl = getProg(mode, diff); }); });
    
    let cIcon = currentCategory === "Coding" ? "download.png" : "emerald.png";
    let brRad = currentCategory === "Coding" ? "border-radius: 4px;" : "";
    let imgHTML = `<img src="${cIcon}" class="curr-icon" style="width: 18px; height: 18px; vertical-align: middle; margin-bottom: 3px; margin-right: 4px; ${brRad}">`;

    let families = {};
    SHOP_ITEMS_DATA.forEach(item => { if (!families[item.family]) families[item.family] = []; families[item.family].push(item); });

    for (let fam in families) {
        let famItems = families[fam]; let activeItem = null; let isMaxed = false;
        let cOwned = getOwnedUpgrades();
        
        for (let i = 0; i < famItems.length; i++) { 
            if (!cOwned.includes(famItems[i].id)) { activeItem = famItems[i]; break; } 
        }
        if (!activeItem) { activeItem = famItems[famItems.length - 1]; isMaxed = true; }
        
        let lockedByLevel = absoluteMaxLvl < activeItem.lvl;
        let btnText = isMaxed ? 'Maxed Out' : `Buy For ${imgHTML} ${activeItem.cost}`;
        if (!isMaxed && lockedByLevel) btnText = `🔒 Unlocks Lvl ${activeItem.lvl}`;
        
        let isDisabled = isMaxed || lockedByLevel;

        if(container) {
            container.innerHTML += `
                <div class="shop-item" id="shop-item-${activeItem.id}" style="${lockedByLevel && !isMaxed ? 'opacity: 0.6; filter: grayscale(0.8); border-color: #555;' : ''}">
                    <h3>${activeItem.name}</h3>
                    <p>${activeItem.desc}</p>
                    <button class="buy-btn" data-cost="${activeItem.cost}" data-item="${activeItem.id}" data-visual="${activeItem.isVisual || false}" ${isDisabled ? 'disabled' : ''}>${btnText}</button>
                </div>
            `;
        }
    }
    document.querySelectorAll(".shop-grid .buy-btn").forEach(btn => { btn.addEventListener("click", handleBuyProcedural); });
}

function updateCrafting() {
    const eContainer = document.getElementById("enchant-items-container");
    if(eContainer) eContainer.innerHTML = "";
    
    let cIcon = currentCategory === "Coding" ? "download.png" : "emerald.png";
    let brRad = currentCategory === "Coding" ? "border-radius: 4px;" : "";
    let imgHTML = `<img src="${cIcon}" class="curr-icon" style="width: 18px; height: 18px; vertical-align: middle; margin-bottom: 3px; margin-right: 4px; ${brRad}">`;

    if(eContainer) {
        ENCHANTMENTS_DATA.forEach(ench => {
            let cOwned = getOwnedUpgrades();
            let hasReqs = cOwned.includes(ench.req1) && cOwned.includes(ench.req2);
            let isOwned = cOwned.includes(ench.id);
            let btnText = isOwned ? 'Crafted' : (hasReqs ? `Fuse ${imgHTML} ${ench.cost}` : '🔒 Missing Required Max Items');
            
            eContainer.innerHTML += `
                <div class="shop-item enchant-card">
                    <h3>${ench.name}</h3> <p>${ench.desc}</p>
                    <p style="font-size:0.8rem; color:#f44336;">Req: Base Items Maxed</p>
                    <button class="buy-btn" data-cost="${ench.cost}" data-item="${ench.id}" ${(!hasReqs || isOwned) ? 'disabled' : ''}>${btnText}</button>
                </div>`;
        });
    }
    document.querySelectorAll(".shop-grid .buy-btn").forEach(btn => { btn.addEventListener("click", handleBuyProcedural); });
}

function handleBuyProcedural(e) {
    let btn = e.target; if (!btn.classList.contains("buy-btn")) btn = btn.closest(".buy-btn");
    let cost = parseInt(btn.getAttribute("data-cost")); let item = btn.getAttribute("data-item"); let isVisual = btn.getAttribute("data-visual") === "true";

    if (getActiveCurrency() >= cost) {
        deductActiveCurrency(cost);
        addOwnedUpgrade(item); 
        
        if (isVisual) { handleVisualUpgradeProcedural(item); }
        SFX.playWin(); 
        updateUI(); 
        updateShop(); 
        updateCrafting();
    } else {
        let cName = currentCategory === "Coding" ? "Diamonds" : "Emeralds";
        showGameError(`You Need More ${cName} To Afford This Upgrade!`);
    }
}

// RANK REWARD CLAIMING SYSTEM
window.claimRank = function(mode, diff, rankName, rewardAmount) {
    let rankId = `${mode}_${diff}_${rankName}`;
    if (!claimedRanks.includes(rankId)) {
        claimedRanks.push(rankId);
        localStorage.setItem('typingClaimedRanks', JSON.stringify(claimedRanks));
        
        addActiveCurrency(rewardAmount);
        
        SFX.playWin();
        updateUI();
        populateRewardsTrack();
    }
};

function populateRewardsTrack() { 
    const container = document.getElementById("rewards-list-container"); 
    if(!container) return;
    container.innerHTML = ""; 
    let currentLvl = getProg(currentMode, currentDiff); 
    let currentWpm = getWpmProg(currentMode, currentDiff); 
    let tiers = rankTiers[currentMode][currentDiff]; 
    if(!tiers) return;
    
    let cName = currentCategory === "Coding" ? "Diamonds" : "Emeralds";
    
    tiers.forEach((rank) => { 
        let isUnlocked = (currentLvl >= rank.reqLvl && currentWpm >= rank.reqWpm); 
        let statusColor = isUnlocked ? "#4caf50" : "#f44336"; 
        let statusText = isUnlocked ? "✔ Unlocked" : "🔒 Locked"; 
        let bgStyle = isUnlocked ? "background: rgba(76, 175, 80, 0.1); border-left: 5px solid #4caf50;" : "background: rgba(0,0,0,0.4); opacity: 0.8;"; 
        let unlocksHtml = ""; 
        let shopUnlocks = SHOP_ITEMS_DATA.filter(item => item.lvl === rank.reqLvl); 
        if (shopUnlocks.length > 0) { unlocksHtml = "<br><span style='color:#32f0ff; font-size: 0.9rem;'>Also Unlocks In Shop: " + shopUnlocks.map(u => u.name).join(", ") + "</span>"; } 
        
        let claimBtnHtml = "";
        if (isUnlocked) {
            let rankId = `${currentMode}_${currentDiff}_${rank.name}`;
            if (claimedRanks.includes(rankId)) {
                claimBtnHtml = `<button class="quest-claim-btn" disabled style="background:#555; width:100%; margin-top: 10px; display:block;">Claimed</button>`;
            } else {
                claimBtnHtml = `<button class="quest-claim-btn" style="background:#4caf50; width:100%; margin-top: 10px; display:block;" onclick="claimRank('${currentMode}', '${currentDiff}', '${rank.name}', ${rank.reward})">Claim +${rank.reward} ${cName}</button>`;
            }
        }
        
        let rewardHtml = ` <div style="padding: 15px; margin-bottom: 10px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.1); ${bgStyle} position: relative;"> <div style="display: flex; justify-content: space-between; align-items: center;"> <h3 style="margin: 0; color: ${rank.color}; font-size: 1.5rem;">${rank.name}</h3> <b style="color: ${statusColor};">${statusText}</b> </div> <p style="margin: 5px 0; color: #ccc;">Requires Level ${rank.reqLvl} & ${rank.reqWpm} WPM</p> <div style="margin-top: 10px; font-weight: bold;"> Rewards: <span style="color:#b2ff59;">+${rank.reward} ${cName}</span> ${unlocksHtml} </div> ${claimBtnHtml} </div> `; 
        container.innerHTML += rewardHtml; 
    }); 
}

/* --- GAME LOGIC --- */
async function startGameProcedural() { 
    isGameActive = true; 
    showToast(`Level ${currentLevel} — ${currentMode} — ${currentDiff} Mode. Go!`, 'info');

    if(startScreen) startScreen.classList.add("hidden"); 
    if(mainHeader) mainHeader.classList.add("hidden"); 
    if(gameScreen) gameScreen.classList.remove("hidden"); 
    
    let cld = document.getElementById("current-level-display");
    if(cld) cld.innerText = `Level ${currentLevel} - ${currentDiff} [${currentMode}]`; 
    
    let hif = document.getElementById("hiddenInputField");
    if(hif) hif.disabled = false; 
    
    let gpo = document.getElementById("game-pause-overlay");
    if(gpo) gpo.classList.add("hidden"); 
    
    currentStreak = 0; maxStreakInGame = 0; perfectWords = imperfectWords = 0; totalKeystrokes = 0; isOnFire = false; 
    sessionQuestData = { w1: 0, p1: 0, m3: 0, m1: 0, c1: 0, c4: 0, c7: 0, wkc_sp: 0 };
    let strk = document.getElementById("streak"); if(strk) strk.innerText = 0; 
    let gtb = document.getElementById("game-typing-box"); if(gtb) gtb.classList.remove("on-fire");
    
    isBossLevel = (currentLevel % 40 === 0); 
    let bui = document.getElementById("boss-ui");
    if (isBossLevel) { 
        bossHP = 100; 
        if(bui) bui.classList.remove("hidden"); 
        let bhf = document.getElementById("boss-hp-fill"); if(bhf) bhf.style.width = "100%"; 
        let bn = document.getElementById("boss-name"); if(bn) bn.innerText = currentLevel === 200 ? "THE WARDEN" : "THE WITHER"; 
    } else { 
        if(bui) bui.classList.add("hidden"); 
    }

    currentWeatherMult = 1; 
    if(gameScreen) gameScreen.classList.remove("night-mode", "storm-mode");
    if (currentDiff === "Hard") { 
        let cycle = currentLevel % 10; 
        if (cycle >= 4 && cycle <= 6) { if(gameScreen) gameScreen.classList.add("night-mode"); currentWeatherMult = 1.2; } 
        else if (cycle >= 7 && cycle <= 9) { if(gameScreen) gameScreen.classList.add("storm-mode"); currentWeatherMult = 1.5; } 
    }
    
    let baseTime = 60; if (currentMode === "Paragraphs" || currentMode === "Code") baseTime = 120; if (currentMode === "Pages") baseTime = 300; 
    let cOwned = getOwnedUpgrades();
    let bonusTime = 0; if (cOwned.includes('time5')) bonusTime = 30; else if (cOwned.includes('time4')) bonusTime = 20; else if (cOwned.includes('time3')) bonusTime = 15; else if (cOwned.includes('time2')) bonusTime = 10; else if (cOwned.includes('time')) bonusTime = 5; 
    let hasteMod = 0; if (cOwned.includes('haste4')) hasteMod = -4; else if (cOwned.includes('haste3')) hasteMod = -6; else if (cOwned.includes('haste2')) hasteMod = -8; else if (cOwned.includes('haste')) hasteMod = -10; 
    
    maxTime = baseTime + bonusTime + hasteMod; timeLeft = maxTime; charIndex = mistakes = mistakesForgiven = currentWordIndex = 0; isTyping = false; gameWpmHistory = []; 
    clearInterval(timer); clearInterval(fallingSpawnInterval); clearInterval(fallingPhysicsInterval);
    
    if(cOwned.includes('ench-aegis')) hardcoreHearts = 6; else hardcoreHearts = 3;
    if(cOwned.includes('pearl5')) pearlsLeft = 5; else if(cOwned.includes('pearl4')) pearlsLeft = 4; else if(cOwned.includes('pearl3')) pearlsLeft = 3; else if(cOwned.includes('pearl2')) pearlsLeft = 2; else if(cOwned.includes('pearl')) pearlsLeft = 1; else pearlsLeft = 0; 
    
    let pui = document.getElementById("pearl-ui");
    let pl = document.getElementById("pearls-left");
    if(pearlsLeft > 0) { if(pui) pui.style.display = "block"; if(pl) pl.innerText = pearlsLeft; } else { if(pui) pui.style.display = "none"; } 
    
    let tme = document.getElementById("time"); if(tme) tme.innerText = getTimeText(timeLeft); 
    let wp = document.getElementById("wpm"); if(wp) wp.innerText = 0; 
    let mstk = document.getElementById("mistakes"); if(mstk) mstk.innerText = 0; 
    if(hif) hif.value = ""; 
    
    let response;
    try {
        if (window.pywebview && window.pywebview.api) {
            response = await window.pywebview.api.get_new_word_batch(currentLevel, currentMode, currentDiff);
            if (typeof response === 'string') response = JSON.parse(response);
        } else {
            throw new Error('Backend missing');
        }
    } catch(error) {
        console.warn('Using Wikipedia JS Fallback.');
        showToast('Fetching Text From Wikipedia...', 'info', 3000);
        response = await fetchTextFromWikipedia(currentMode, currentDiff, currentLevel);
    }
    
    if (!response || !response.text || response.text.trim() === "") {
        response = { status: 'success', text: "Fallback generated successfully." };
    }
    
    if (response && response.status === 'success') { 
        let safeText = response.text || "Loading...";
        if (currentMode === "Words") { wordsArray = safeText.trim().split(/\s+/); } else { wordsArray = [safeText]; } 
        
        if (currentDiff === "Hard") { 
            initFallingWordsMode(); 
        } else {
            let fwa = document.getElementById("falling-words-area"); if(fwa) fwa.classList.add("hidden"); 
            let hcui = document.getElementById("hardcore-ui"); if(hcui) hcui.classList.add("hidden"); 
            let vkb = document.getElementById("virtual-keyboard"); if(vkb) { vkb.classList.remove("hidden"); vkb.style.opacity = "1"; }
            if(gtb) { gtb.classList.remove("hidden"); }
            let ttc = document.querySelector("#game-screen .typing-text-container"); if(ttc) ttc.style.opacity = "1"; 
            let txt = document.querySelector("#game-screen .typing-text");
            if(txt) { txt.style.textAlign = currentMode === "Code" ? "left" : "center"; txt.style.fontSize = currentMode === "Words" ? "3rem" : "1.6rem"; }
            
            renderTextProcedural(wordsArray[currentWordIndex]); 
        }
        
        let ghostWpmVal = getWpmProg(currentMode, currentDiff) || 10; 
        let currentTrack = 0; 
        let ghostRunner = document.getElementById("ghost-runner"); 
        let playerRunner = document.getElementById("player-runner"); 
        let maxTotalChars = wordsArray.join(" ").length;
        
        if(ghostRunner) { ghostRunner.style.transition = 'none'; ghostRunner.style.left = '0%'; }
        if(playerRunner) { playerRunner.style.transition = 'none'; playerRunner.style.left = '0%'; }
        
        setTimeout(() => { 
            if(ghostRunner) ghostRunner.style.transition = 'left 1s linear'; 
            if(playerRunner) playerRunner.style.transition = 'left 0.2s'; 
        }, 50);
        
        if (window.ghostInterval) clearInterval(window.ghostInterval);
        window.ghostInterval = setInterval(() => { 
            if (isTyping && timeLeft > 0) { 
                let charsPerSec = (ghostWpmVal * 5) / 60; currentTrack += charsPerSec; 
                if(ghostRunner) ghostRunner.style.left = `${Math.min(95, (currentTrack / maxTotalChars) * 100)}%`; 
                if(playerRunner) playerRunner.style.left = `${Math.min(95, (((currentWordIndex * 5) + charIndex) / maxTotalChars) * 100)}%`; 
            } 
        }, 1000);
    }
}

/* --- HARDCORE SURVIVAL: FALLING WORDS MODE --- */
function initFallingWordsMode() { 
    let gtb = document.getElementById("game-typing-box"); if(gtb) gtb.classList.add("hidden"); 
    let vkb = document.getElementById("virtual-keyboard"); if(vkb) vkb.classList.add("hidden"); 
    let fwa = document.getElementById("falling-words-area"); if(fwa) { fwa.classList.remove("hidden"); fwa.innerHTML = ""; }
    let hcui = document.getElementById("hardcore-ui"); if(hcui) hcui.classList.remove("hidden"); 
    
    let sh = document.getElementById("survival-hearts"); if(sh) sh.innerText = "❤️".repeat(hardcoreHearts); 
    activeFallingWords = []; 
    
    let hif = document.getElementById("hiddenInputField");
    if(hif) {
        hif.removeEventListener("input", handleTypingProcedural); 
        hif.addEventListener("input", handleFallingInput); 
        hif.focus(); 
    }
    
    let cOwned = getOwnedUpgrades();
    let spawnRate = Math.max(800, 2500 - (currentLevel * 15)); if (cOwned.includes('ench-chronos')) spawnRate += 500; 
    fallingSpawnInterval = setInterval(spawnFallingWord, spawnRate); fallingPhysicsInterval = setInterval(updateFallingPhysics, 50); 
}

function spawnFallingWord() { 
    if(timeLeft <= 0) return; if(!isTyping) { timer = setInterval(initTimerProcedural, 1000); isTyping = true; } 
    let word = wordsArray[Math.floor(Math.random() * wordsArray.length)]; if(currentMode !== "Words") { word = word.split(" ")[Math.floor(Math.random() * word.split(" ").length)]; } 
    let el = document.createElement("div"); el.className = "falling-word"; el.innerText = word; el.style.left = Math.floor(Math.random() * 80) + "%"; el.style.top = "0%"; 
    let fwa = document.getElementById("falling-words-area"); if(fwa) fwa.appendChild(el); 
    
    activeFallingWords.push({ el: el, text: word.toLowerCase().trim(), top: 0, speed: 0.5 + (Math.random() * 0.5) + (currentLevel * 0.01) }); 
}

function updateFallingPhysics() { 
    for (let i = activeFallingWords.length - 1; i >= 0; i--) { 
        let w = activeFallingWords[i]; w.top += w.speed; w.el.style.top = w.top + "%"; 
        if (w.top > 90) { 
            w.el.remove(); activeFallingWords.splice(i, 1); hardcoreHearts--; 
            let sh = document.getElementById("survival-hearts"); if(sh) sh.innerText = "❤️".repeat(Math.max(0, hardcoreHearts)); 
            SFX.playError(); 
            if (hardcoreHearts <= 0) { triggerEndGamePause(false); } 
        } 
    } 
}

function handleFallingInput() { 
    let hif = document.getElementById("hiddenInputField");
    if(!hif) return;
    let typed = hif.value.toLowerCase().trim(); activeFallingWords.forEach(w => w.el.classList.remove('targeted')); 
    if (typed.length > 0) { 
        totalKeystrokes++;
        sessionQuestData.m3 += 1;
        if(currentMode === "Code") sessionQuestData.c4 += 1;
        let matchedIndex = activeFallingWords.findIndex(w => w.text.startsWith(typed)); 
        if (matchedIndex !== -1) { 
            activeFallingWords[matchedIndex].el.classList.add('targeted'); 
            if (typed === activeFallingWords[matchedIndex].text) { 
                activeFallingWords[matchedIndex].el.remove(); activeFallingWords.splice(matchedIndex, 1); hif.value = ""; SFX.playBlast(); charIndex += typed.length; 
                sessionQuestData.w1 += 1; perfectWords++;
                if(currentMode === "Words") sessionQuestData.m1 += 1;
                
                if(isBossLevel) { 
                    bossHP -= 2; let bhf = document.getElementById("boss-hp-fill"); if(bhf) bhf.style.width = `${Math.max(0, bossHP)}%`; 
                    if (bossHP <= 0) {
                        updateQuestProgress('m4', 1);
                        updateQuestProgress('wk_bss', 1);
                        updateQuestProgress('ch_b5', 1);
                        if(currentMode === "Code") { updateQuestProgress('c5', 1); updateQuestProgress('wkc_bss', 1); updateQuestProgress('chc_b5', 1); }
                        triggerEndGamePause(true); 
                    }
                } 
            } 
        } else { SFX.playError(); mistakes++; hif.value = ""; } 
    } 
}

/* --- STANDARD LOGIC WITH SAFE SPACING --- */
function renderTextProcedural(text) { 
    let txt = document.querySelector("#game-screen .typing-text");
    if(txt) {
        txt.innerHTML = ""; 
        if (!text) text = "Loading...";
        // Normalized new lines to keep typing flow steady
        text = text.replace(/\r\n/g, '\n');
        text.split("").forEach((char) => { txt.innerHTML += `<span>${char}</span>`; }); 
        if (txt.querySelectorAll("span")[0]) txt.querySelectorAll("span")[0].classList.add("active"); 
    }
    
    // Always scroll the typing container to top so first line is visible
    let ttcTop = document.querySelector("#game-screen .typing-text-container");
    if (ttcTop) ttcTop.scrollTop = 0;

    let hif = document.getElementById("hiddenInputField");
    if(hif) {
        hif.value = "";   // clear on every word so charIndex always starts at 0
        hif.removeEventListener("input", handleFallingInput); 
        hif.removeEventListener("input", handleTypingProcedural); 
        hif.addEventListener("input", handleTypingProcedural); 
        hif.focus(); 
    }
}

let wordHasMistake = false;
function handleTypingProcedural() { 
    let txt = document.querySelector("#game-screen .typing-text");
    let hif = document.getElementById("hiddenInputField");
    if(!txt || !hif) return;
    
    const characters = txt.querySelectorAll("span");
    // hif.value is cleared in renderTextProcedural on every new word, so charIndex always
    // reads the correct position for both Words mode and all other modes.
    let typedChar = hif.value.split("")[charIndex];

    if (charIndex < characters.length && timeLeft > 0 && (!isBossLevel || bossHP > 0)) { 
        totalKeystrokes++;
        sessionQuestData.m3 += 1;
        if(currentMode === "Code") sessionQuestData.c4 += 1;
        
        if (!isTyping) { timer = setInterval(initTimerProcedural, 1000); isTyping = true; wordHasMistake = false; } 
        if (typedChar == null) { 
            // Backspace — only go back within the current word (charIndex can't go below 0)
            if (charIndex > 0) { 
                charIndex--; 
                if (characters[charIndex].classList.contains("incorrect")) mistakes--;
                characters[charIndex].classList.remove("correct", "incorrect", "active"); 
                characters[charIndex].classList.add("active"); 
            } 
        } else { 
            let expectedChar = characters[charIndex].innerText; 
            
            if (expectedChar === typedChar || (expectedChar === "\n" && (typedChar === "\n" || typedChar === " "))) { 
                characters[charIndex].classList.add("correct"); SFX.playType(); flashKey(typedChar, true); currentStreak++; 
                if(currentStreak > maxStreakInGame) maxStreakInGame = currentStreak;
                let strk = document.getElementById("streak"); if(strk) strk.innerText = currentStreak; 
                
                sessionQuestData.p1 += 1; 
                if ("[](){};:<>|!@#$%^&*".includes(typedChar)) { sessionQuestData.c1 += 1; sessionQuestData.wkc_sp = (sessionQuestData.wkc_sp||0)+1; }
                if (currentMode === 'Code') sessionQuestData.c7++;

                if (currentStreak >= 50 && !isOnFire) { isOnFire = true; let gtb = document.getElementById("game-typing-box"); if(gtb) gtb.classList.add("on-fire"); } 
                
                if (isBossLevel) { 
                    bossHP -= 1; let bhf = document.getElementById("boss-hp-fill"); if(bhf) bhf.style.width = `${Math.max(0, bossHP)}%`; 
                    if (bossHP <= 0) {
                        updateQuestProgress('m4', 1);
                        updateQuestProgress('wk_bss', 1);
                        updateQuestProgress('ch_b5', 1);
                        if(currentMode === "Code") { updateQuestProgress('c5', 1); updateQuestProgress('wkc_bss', 1); updateQuestProgress('chc_b5', 1); }
                        triggerEndGamePause(true); 
                    }
                } 
                if(expectedChar === " " || expectedChar === "\n") handleWordCompletionProcedural();
            } else { 
                wordHasMistake = true;
                let cOwned = getOwnedUpgrades();
                let currentShieldLimit = 0; if (cOwned.includes('shield5')) currentShieldLimit = 10; else if (cOwned.includes('shield4')) currentShieldLimit = 8; else if (cOwned.includes('shield3')) currentShieldLimit = 6; else if (cOwned.includes('shield2')) currentShieldLimit = 4; else if (cOwned.includes('shield')) currentShieldLimit = 2; 
                if (mistakesForgiven < currentShieldLimit) { characters[charIndex].classList.add("correct"); mistakesForgiven++; SFX.playType(); flashKey(typedChar, true); if(expectedChar === " " || expectedChar === "\n") handleWordCompletionProcedural();} 
                else { 
                    mistakes++; characters[charIndex].classList.add("incorrect"); SFX.playError(); flashKey(typedChar, false); currentStreak = 0; isOnFire = false; 
                    let strk = document.getElementById("streak"); if(strk) strk.innerText = currentStreak; 
                    let gtb = document.getElementById("game-typing-box"); if(gtb) gtb.classList.remove("on-fire"); 
                    let mstk = document.getElementById("mistakes"); if(mstk) mstk.innerText = mistakes;
                    if (isBossLevel) { bossHP = Math.min(100, bossHP + 5); let bhf = document.getElementById("boss-hp-fill"); if(bhf) bhf.style.width = `${bossHP}%`; } 
                } 
            } 
            characters[charIndex].classList.remove("active"); charIndex++; 
            if (charIndex < characters.length) { 
                let nextChar = characters[charIndex]; nextChar.classList.add("active"); 
                let ttc = document.querySelector("#game-screen .typing-text-container");
                if (ttc && currentMode !== "Words" && nextChar.offsetTop > ttc.scrollTop + 100) { ttc.scrollTop = nextChar.offsetTop - 50; } 
            } else { 
                // All characters of this word/block typed — advance
                handleWordCompletionProcedural(); 
                if (currentMode === "Words") {
                    // Words mode: move to next word automatically, no space needed
                    if (currentWordIndex < wordsArray.length - 1 && (!isBossLevel || bossHP > 0)) { 
                        currentWordIndex++; charIndex = 0; 
                        renderTextProcedural(wordsArray[currentWordIndex]); // hif cleared inside
                    } else if (!isBossLevel) { 
                        triggerEndGamePause(true); 
                    }
                } else {
                    triggerEndGamePause(true);
                }
            } 
        } updateRealStatsProcedural(); 
    } 
}

function handleWordCompletionProcedural() { 
    if(wordHasMistake) imperfectWords++; else perfectWords++; 
    if(currentMode === "Words" && !wordHasMistake) sessionQuestData.m1 += 1;
    wordHasMistake = false; 
}

function initTimerProcedural() { 
    if (timeLeft > 0) { 
        timeLeft--; 
        let t = document.getElementById("time"); if(t) t.innerText = getTimeText(timeLeft); 
        updateRealStatsProcedural(); 
        let wp = document.getElementById("wpm");
        let currentWpm = wp ? parseInt(wp.innerText) || 0 : 0; 
        gameWpmHistory.push(currentWpm); 
    } else { 
        triggerEndGamePause(hardcoreHearts > 0); 
    } 
}

// --- Dynamic Themes ---
function applyDynamicTheme(wpm) {
    if (!document.body.classList.contains('dynamic-themes-enabled')) document.body.classList.add('dynamic-themes-enabled');
    
    let root = document.documentElement;
    if (wpm >= 120) {
        root.style.setProperty('--bg-color', '#1a0000'); // Deep Red
        root.style.setProperty('--primary', '#ff1744');
        root.style.setProperty('--surface', 'rgba(255, 23, 68, 0.1)');
        document.body.style.boxShadow = 'inset 0 0 100px rgba(255, 23, 68, 0.3)';
    } else if (wpm >= 80) {
        root.style.setProperty('--bg-color', '#1a0d00'); // Orange
        root.style.setProperty('--primary', '#ff9100');
        root.style.setProperty('--surface', 'rgba(255, 145, 0, 0.1)');
        document.body.style.boxShadow = 'inset 0 0 100px rgba(255, 145, 0, 0.2)';
    } else if (wpm >= 60) {
        root.style.setProperty('--bg-color', '#001a0d'); // Green
        root.style.setProperty('--primary', '#00e676');
        root.style.setProperty('--surface', 'rgba(0, 230, 118, 0.1)');
        document.body.style.boxShadow = 'inset 0 0 100px rgba(0, 230, 118, 0.2)';
    } else {
        // Reset to default
        root.style.setProperty('--bg-color', '#0d0d1a');
        root.style.setProperty('--primary', '#00e5ff');
        root.style.setProperty('--surface', 'rgba(255, 255, 255, 0.05)');
        document.body.style.boxShadow = 'none';
    }
}

function updateRealStatsProcedural() { 
    let mst = document.getElementById("mistakes"); if(mst) mst.innerText = mistakes; 
    let timeElapsed = maxTime - timeLeft; let totalTyped = (currentWordIndex * 5) + charIndex; 
    let wpm = timeElapsed > 0 ? Math.round(((totalTyped - mistakes) / 5 / timeElapsed) * 60) : 0; 
    let wpl = document.getElementById("wpm"); if(wpl) wpl.innerText = wpm > 0 ? wpm : 0;
    applyDynamicTheme(wpm > 0 ? wpm : 0);
}

function animatePercentageProcedural(element, start, end, duration) { 
    if (!visualsActive) {
        if(element) element.innerText = `${Math.floor(end)}%`;
        return;
    }
    let startTime = null; 
    function step(timestamp) { 
        if (!startTime) startTime = timestamp; 
        let progress = Math.min((timestamp - startTime) / duration, 1); 
        let currentVal = Math.floor(start + (end - start) * progress); 
        if(element) element.innerText = `${currentVal}%`; 
        if (progress < 1) { window.requestAnimationFrame(step); } 
        else { if(element) element.innerText = `${Math.floor(end)}%`; } 
    } 
    window.requestAnimationFrame(step); 
}

function removeAllVisuals() {
    let vk = document.getElementById("virtual-keyboard");
    if(vk) {
        vk.classList.remove("rainbow-keyboard");
        vk.classList.remove("netherite-keyboard");
    }
    let st = document.getElementById("start-screen-trophy"); if(st) st.classList.add("hidden");
    let re = document.getElementById("result-dragon-egg"); if(re) re.classList.add("hidden");
    let gtb = document.getElementById("game-typing-box"); 
    if(gtb) {
        gtb.classList.remove("golden-text-glow");
        gtb.classList.remove("diamond-cursor");
        gtb.classList.remove("emerald-glow");
    }
    let vc = document.getElementById("visual-crown-container"); if(vc) vc.classList.add("hidden");
    let gs = document.getElementById("game-screen"); if(gs) gs.classList.remove("enchanted-bg");
    let rht = document.getElementById("result-hero-totem"); if(rht) rht.classList.add("hidden");
    activeAudioProfile = 'default';
}

function handleVisualUpgradeProcedural(item) { 
    if (!visualsActive) return; 
    if (item === 'audio-cherry') activeAudioProfile = 'cherry'; 
    else if (item === 'audio-arcade') activeAudioProfile = 'arcade'; 
    else if (item === 'audio-alien') activeAudioProfile = 'alien'; 
    else if (item === 'visual-rainbow') { let vk = document.getElementById("virtual-keyboard"); if(vk) vk.classList.add("rainbow-keyboard"); } 
    else if (item === 'visual-trophy-start') { let st = document.getElementById("start-screen-trophy"); if(st) st.classList.remove("hidden"); } 
    else if (item === 'visual-dragon-result') { let re = document.getElementById("result-dragon-egg"); if(re) re.classList.remove("hidden"); } 
    else if (item === 'visual-golden-text') { let gtb = document.getElementById("game-typing-box"); if(gtb) gtb.classList.add("golden-text-glow"); } 
    else if (item === 'visual-crown') { let vc = document.getElementById("visual-crown-container"); if(vc) vc.classList.remove("hidden"); } 
    else if (item === 'visual-diamond-cursor') { let gtb = document.getElementById("game-typing-box"); if(gtb) gtb.classList.add("diamond-cursor"); } 
    else if (item === 'visual-netherite-kb') { let vk = document.getElementById("virtual-keyboard"); if(vk) vk.classList.add("netherite-keyboard"); } 
    else if (item === 'visual-emerald-glow') { let gtb = document.getElementById("game-typing-box"); if(gtb) gtb.classList.add("emerald-glow"); } 
    else if (item === 'visual-enchanted-bg') { let gs = document.getElementById("game-screen"); if(gs) gs.classList.add("enchanted-bg"); } 
    else if (item === 'visual-hero-totem') { let rht = document.getElementById("result-hero-totem"); if(rht) rht.classList.remove("hidden"); } 
}

function applyOwnedVisualsOnLoad() { 
    removeAllVisuals();
    if(visualsActive) {
        let cOwned = getOwnedUpgrades();
        cOwned.forEach(item => { if (item.startsWith('visual-') || item.startsWith('audio-')) { handleVisualUpgradeProcedural(item); } }); 
    }
}

function triggerEndGamePause(completedSuccessfully) {
    if (!isGameActive) return; 
    isGameActive = false;

    clearInterval(timer); clearInterval(fallingSpawnInterval); clearInterval(fallingPhysicsInterval); if (window.ghostInterval) clearInterval(window.ghostInterval);

    let hif = document.getElementById("hiddenInputField");
    if(hif) hif.disabled = true;

    let ttc = document.querySelector("#game-screen .typing-text-container"); if(ttc) ttc.style.opacity = "0.3"; 
    let vkb = document.getElementById("virtual-keyboard"); if(vkb) vkb.style.opacity = "0.3"; 

    let gpo = document.getElementById("game-pause-overlay");
    let cDown = document.getElementById("game-pause-countdown");

    if (cDown && gpo) {
        gpo.classList.remove("hidden");
        let pTime = 5;
        cDown.innerText = `Calculating Fate In ${pTime}s...`;
        
        let pInt = setInterval(() => {
            pTime--;
            if (pTime > 0) {
                cDown.innerText = `Calculating Fate In ${pTime}s...`;
            } else {
                clearInterval(pInt);
                gpo.classList.add("hidden");
                executeEndGameSequence(completedSuccessfully);
            }
        }, 1000);
    } else {
        executeEndGameSequence(completedSuccessfully);
    }
}

function forceEndScreen() {
    let rs = document.getElementById("rank-up-sequence-screen");
    let res = document.getElementById("result-screen");
    if(rs) rs.classList.add("hidden"); 
    if(res) res.classList.remove("hidden");
    updateUI(); 
    flushQuestsToStorage();
}

function executeEndGameSequence(completedSuccessfully) { 
    // ── Daily quest IDs ──
    updateQuestProgress('d_w1',  sessionQuestData.w1);
    updateQuestProgress('d_p1',  sessionQuestData.p1);
    updateQuestProgress('d_m3',  sessionQuestData.m3);
    updateQuestProgress('d_m1',  sessionQuestData.m1);
    updateQuestProgress('d_str', maxStreakInGame);
    updateQuestProgress('cd_c1', sessionQuestData.c1);
    updateQuestProgress('cd_c4', sessionQuestData.c4);
    updateQuestProgress('cd_c7', sessionQuestData.c7 || 0);
    if (currentMode === 'Code' && completedSuccessfully && finalAccVal >= 90) updateQuestProgress('cd_c6', 1);
    if (completedSuccessfully) updateQuestProgress('d_lv', 1);
    if (completedSuccessfully) updateQuestProgress('cd_lv', 1);
    if (completedSuccessfully) updateQuestProgress('wk_lv', 1);
    if (completedSuccessfully) updateQuestProgress('wkc_lv', 1);
    // ── Weekly quest IDs ──
    updateQuestProgress('wk_p5', sessionQuestData.m1);
    updateQuestProgress('wk_str', maxStreakInGame);
    updateQuestProgress('wkc_sp', sessionQuestData.wkc_sp||0);
    updateQuestProgress('chc_sp', sessionQuestData.wkc_sp||0);
    updateQuestProgress('wkc_str', maxStreakInGame);
    if (currentMode === 'Code') updateQuestProgress('cd_str', maxStreakInGame);
    // ── Legacy IDs (keep for old data compat) ──
    updateQuestProgress('w1', sessionQuestData.w1);
    updateQuestProgress('p1', sessionQuestData.p1);
    updateQuestProgress('m3', sessionQuestData.m3);
    updateQuestProgress('m1', sessionQuestData.m1);
    updateQuestProgress('c1', sessionQuestData.c1);
    updateQuestProgress('c4', sessionQuestData.c4);
    if (currentMode === 'Code' && completedSuccessfully && finalAccVal >= 90) updateQuestProgress('c6', 1);
    if (currentMode === 'Code') updateQuestProgress('c7', sessionQuestData.c7 || 0);

    if (isBossLevel && bossHP > 0) completedSuccessfully = false;

    let wpmEl = document.getElementById("wpm");
    let finalWpmVal = 0; if (gameWpmHistory.length > 0) { let sum = gameWpmHistory.reduce((a, b) => a + b, 0); finalWpmVal = Math.round(sum / gameWpmHistory.length); } else { finalWpmVal = wpmEl ? parseInt(wpmEl.innerText) || 0 : 0; } if (finalWpmVal < 0) finalWpmVal = 0;
    
    let totalTypedVal = totalKeystrokes || ((currentWordIndex * 5) + charIndex); 
    let finalAccVal = totalTypedVal > 0 ? Math.round(((totalTypedVal - mistakes) / totalTypedVal) * 100) : 100; if (finalAccVal < 0) finalAccVal = 0; 
    let perfectRatio = perfectWords + imperfectWords > 0 ? Math.round((perfectWords / (perfectWords + imperfectWords)) * 100) : 100;

    let titleEl = document.getElementById("result-title");
    if(titleEl) {
        titleEl.innerText = completedSuccessfully ? (isBossLevel ? "BOSS DEFEATED" : "LEVEL MASTERED") : (isBossLevel ? "SLAIN BY BOSS" : "LEVEL FAILED");
        titleEl.style.color = completedSuccessfully ? "#4caf50" : "#f44336";
    }
    showToast(completedSuccessfully ? 'Level Mastered!' : 'Level Failed. Try Again.', completedSuccessfully ? 'success' : 'error');
    
    let rdEl = document.getElementById("result-level-display");
    if(rdEl) rdEl.innerText = `Level ${currentLevel} - ${currentMode} [${currentDiff}]`;
    
    if(document.getElementById("final-wpm")) document.getElementById("final-wpm").innerText = finalWpmVal;
    if(document.getElementById("final-accuracy")) document.getElementById("final-accuracy").innerText = `${finalAccVal}%`;
    if(document.getElementById("final-total-typed")) document.getElementById("final-total-typed").innerText = totalTypedVal;
    if(document.getElementById("final-mistakes")) document.getElementById("final-mistakes").innerText = mistakes;
    if(document.getElementById("final-forgiven")) document.getElementById("final-forgiven").innerText = mistakesForgiven;
    if(document.getElementById("final-max-streak")) document.getElementById("final-max-streak").innerText = maxStreakInGame;
    if(document.getElementById("final-perfect-ratio")) document.getElementById("final-perfect-ratio").innerText = `${perfectRatio}%`;
    
    let rupeesEarned = 0; 
    
    let oldStats = calculateRankStats(getProg(currentMode, currentDiff), getWpmProg(currentMode, currentDiff), currentMode, currentDiff); 

    // Dynamic Rank Demotion / Growth Logic
    let oldMax = getWpmProg(currentMode, currentDiff);
    let newTrackedWpm;
    if (finalWpmVal > oldMax) {
        newTrackedWpm = finalWpmVal;
    } else {
        if (completedSuccessfully) {
            newTrackedWpm = Math.round((oldMax * 0.8) + (finalWpmVal * 0.2));
        } else {
            newTrackedWpm = oldMax; // Don't demote if they outright failed and got 0
        }
    }
    progressData[currentMode][currentDiff + "_maxWpm"] = newTrackedWpm;

    let baseMult = (currentMode === "Lines" || currentMode === "Code") ? 2 : (currentMode === "Paragraphs" ? 4 : (currentMode === "Pages" ? 10 : 1));
    let diffMult = (currentDiff === "Hard") ? 5 : (currentDiff === "Normal" ? 3 : 1.5);
    let prestigeMult = 1 + (prestigeCount * 0.5);
    
    if(document.getElementById("break-mode-lbl")) document.getElementById("break-mode-lbl").innerText = `[${currentMode}]`;
    if(document.getElementById("break-diff-lbl")) document.getElementById("break-diff-lbl").innerText = `[${currentDiff}]`;
    if(document.getElementById("break-mode-mult")) document.getElementById("break-mode-mult").innerText = `x${baseMult}`;
    if(document.getElementById("break-diff-mult")) document.getElementById("break-diff-mult").innerText = `x${diffMult}`;
    if(document.getElementById("break-prestige-mult")) document.getElementById("break-prestige-mult").innerText = `x${prestigeMult}`;

    let cOwned = getOwnedUpgrades();
    if (completedSuccessfully && finalAccVal > 85) { 
        rupeesEarned = Math.round((((finalWpmVal * finalAccVal) / 100) * baseMult * diffMult)) + (currentLevel * 5); 
        let goldMult = 1; if (cOwned.includes('gold5')) goldMult = 4; else if (cOwned.includes('gold4')) goldMult = 3; else if (cOwned.includes('gold3')) goldMult = 2.5; else if (cOwned.includes('gold2')) goldMult = 2; else if (cOwned.includes('gold')) goldMult = 1.5; 
        let hasteMult = 1; if (cOwned.includes('haste4')) hasteMult = 4; else if (cOwned.includes('haste3')) hasteMult = 3; else if (cOwned.includes('haste2')) hasteMult = 2; else if (cOwned.includes('haste')) hasteMult = 1.5; 
        rupeesEarned = Math.round(rupeesEarned * goldMult * hasteMult * currentWeatherMult); 
        
        let fireBonus = isOnFire ? rupeesEarned : 0;
        let bossBonus = isBossLevel ? rupeesEarned * 4 : 0;
        
        if (isOnFire) { rupeesEarned *= 2; } if (isBossLevel) { rupeesEarned *= 5; } if (prestigeCount > 0) { rupeesEarned = Math.round(rupeesEarned * prestigeMult); }

        if(document.getElementById("break-on-fire")) document.getElementById("break-on-fire").innerText = `+${fireBonus}`;
        if(isBossLevel) { if(document.getElementById("break-wither-line")) document.getElementById("break-wither-line").classList.remove("hidden"); if(document.getElementById("break-wither-defeated")) document.getElementById("break-wither-defeated").innerText = `+${bossBonus} BOSS SLAYED`; }
        else { if(document.getElementById("break-wither-line")) document.getElementById("break-wither-line").classList.add("hidden"); }
        if(document.getElementById("break-base-rupees")) document.getElementById("break-base-rupees").innerText = Math.round((finalWpmVal * finalAccVal)/100);

        addActiveCurrency(rupeesEarned); 
        
        // Earn-based
        updateQuestProgress('d_e1',  rupeesEarned);
        updateQuestProgress('cd_e2', rupeesEarned);
        updateQuestProgress('wk_e20',rupeesEarned);
        updateQuestProgress('wkc_d15', rupeesEarned);
        updateQuestProgress('e1', rupeesEarned);
        updateQuestProgress('e2', rupeesEarned);
        // Accuracy-based
        if (currentDiff === 'Easy' && finalAccVal === 100)  { updateQuestProgress('diffez',1); updateQuestProgress('cd_ez',1); }
        if (currentDiff === 'Hard')  { updateQuestProgress('l1',1); updateQuestProgress('d_l1',1); updateQuestProgress('wk_l5',1); }
        if (finalAccVal === 100)     { updateQuestProgress('s1',1); updateQuestProgress('d_s1',1); }
        if (finalAccVal >= 95)       { updateQuestProgress('wk_acc',1); updateQuestProgress('wkc_acc',1); }
        if (finalAccVal === 100 && currentDiff === "Normal") updateQuestProgress('m6', 1);
        if (finalAccVal === 100 && currentDiff === "Normal") updateQuestProgress('d_m6', 1);
        // Mode-based
        if (currentMode === "Paragraphs") { updateQuestProgress('m2',1); updateQuestProgress('d_m2',1); }
        if (currentMode === "Lines")  { updateQuestProgress('modelines',1); updateQuestProgress('d_ln',1); }
        if (currentMode === "Pages")  { updateQuestProgress('modepages',1); updateQuestProgress('d_pg',1); updateQuestProgress('wk_pg2',1); }
        if (currentMode === "Code")   { updateQuestProgress('c2',1); updateQuestProgress('cd_c2',1); updateQuestProgress('wkc_c10',1); }
        // Challenge: level progress
        const topLvl = Math.max(...Object.values(progressData).map(m => Math.max(m.Easy||0, m.Normal||0, m.Hard||0)));
        updateQuestProgress('ch_100', topLvl >= 100 ? 100 : topLvl);
        updateQuestProgress('ch_200', topLvl >= 200 ? 200 : topLvl);
        if (currentMode === 'Code') {
            const codeLvl = Math.max(progressData['Code']?.Easy||0, progressData['Code']?.Normal||0, progressData['Code']?.Hard||0);
            updateQuestProgress('chc_100', codeLvl >= 100 ? 100 : codeLvl);
            updateQuestProgress('chc_200', codeLvl >= 200 ? 200 : codeLvl);
        }
        // WPM challenge
        if (finalWpmVal > 0) { updateQuestProgress('ch_wpm', finalWpmVal); updateQuestProgress('chc_wpm', finalWpmVal); updateQuestProgress('d_p1', maxStreakInGame); }
        if (finalAccVal === 100) updateQuestProgress('ch_acc', 1);
        
        let currentLvlProgress = getProg(currentMode, currentDiff);
        if (currentLevel == currentLvlProgress && currentLvlProgress < 200) { 
            let levelsToAdvance = 1; let currentRankWpm = oldStats.rank.reqWpm; 
            if (finalWpmVal >= currentRankWpm + 10) { levelsToAdvance = Math.floor((finalWpmVal - currentRankWpm) / 10); if (levelsToAdvance < 1) levelsToAdvance = 1; if (levelsToAdvance > 10) levelsToAdvance = 10; } 
            progressData[currentMode][currentDiff] = currentLvlProgress + levelsToAdvance; if (progressData[currentMode][currentDiff] > 200) progressData[currentMode][currentDiff] = 200; 
        } 
    } else {
        if(document.getElementById("break-on-fire")) document.getElementById("break-on-fire").innerText = "+0";
        if(document.getElementById("break-wither-line")) document.getElementById("break-wither-line").classList.add("hidden");
        if(document.getElementById("break-base-rupees")) document.getElementById("break-base-rupees").innerText = "0";
    } 
    
    localStorage.setItem('typingProgressData', JSON.stringify(progressData)); 
    try {
      const pj = encodeURIComponent(JSON.stringify(progressData));
      if (window.pywebview) window.pywebview.api.saveprogress(JSON.stringify(progressData));
      else fetch(`/api/saveprogress?data=${pj}`);
    } catch(e) {}

    if(document.getElementById("final-rupees")) document.getElementById("final-rupees").innerText = rupeesEarned; 
    
    let newStats = calculateRankStats(getProg(currentMode, currentDiff), getWpmProg(currentMode, currentDiff), currentMode, currentDiff); 
    
    const bigBarContainer = document.getElementById("big-progress-container"); const bigBarFill = document.getElementById("big-progress-fill"); const bigPercentageText = document.getElementById("big-progress-percentage"); const bigRankText = document.getElementById("big-rank-text"); const flashOverlay = document.getElementById("epic-flash-overlay"); const rewardText = document.getElementById("rank-reward-text"); 
    let gs = document.getElementById("game-screen"); let rs = document.getElementById("rank-up-sequence-screen");
    
    // SAFE ANIMATION LOGIC - Triggered on ANY rank change (up or down)
    let isRankingUp = newStats.rank.name !== oldStats.rank.name;

    if (visualsActive) {
        if(gs) gs.classList.add("hidden"); 
        if(rs) rs.classList.remove("hidden");
        
        if(bigBarContainer) bigBarContainer.style.opacity = "1"; 
        if(flashOverlay) { flashOverlay.style.opacity = "0"; flashOverlay.style.transition = "opacity 0.2s ease-in"; } 
        if(bigRankText) { bigRankText.className = ""; bigRankText.style.transform = "scale(1)"; bigRankText.style.opacity = "1"; bigRankText.innerText = oldStats.rank.name; bigRankText.style.color = oldStats.rank.color; bigRankText.style.textShadow = "0 5px 15px rgba(0,0,0,0.8)"; }
        if(rewardText) { rewardText.style.opacity = "0"; rewardText.style.transform = "translateY(20px)"; }
        
        if(bigBarFill) { 
            bigBarFill.style.transition = "none";
            bigBarFill.style.width = `${Math.max(2, oldStats.progress)}%`; 
        }
        
        setTimeout(() => {
            if(bigBarFill) { 
                bigBarFill.style.transition = "width 1.5s cubic-bezier(0.25, 1, 0.5, 1)"; 
                bigBarFill.style.width = `${Math.max(2, newStats.progress)}%`; 
            }
            animatePercentageProcedural(bigPercentageText, oldStats.progress, newStats.progress, 1500); 

            if (isRankingUp) {
                SFX.playRankUpCharge();
                setTimeout(() => {
                    if(bigRankText) { 
                        bigRankText.innerText = newStats.rank.name; 
                        bigRankText.style.color = newStats.rank.color; 
                        // Force animation re-trigger by removing class, forcing reflow, then re-adding
                        bigRankText.classList.remove("flash-animation");
                        void bigRankText.offsetWidth; // reflow
                        bigRankText.classList.add("flash-animation"); 
                    }
                    if(flashOverlay) flashOverlay.style.opacity = "1";
                    SFX.playEpicFlash();
                    
                    setTimeout(() => {
                        if(flashOverlay) flashOverlay.style.opacity = "0";
                        if (newStats.index > oldStats.index && newStats.rank.reward > 0 && rewardText) { 
                            let cName = currentCategory === "Coding" ? "Diamonds" : "Emeralds";
                            rewardText.innerText = `New Reward! Claim +${newStats.rank.reward} ${cName} In Menu!`; 
                            rewardText.style.opacity = "1"; 
                            rewardText.style.transform = "translateY(0px)"; 
                        }
                        if (completedSuccessfully) triggerConfetti(3500);
                        setTimeout(() => forceEndScreen(), 3000);
                    }, 500);
                }, 1500);
            } else {
                if (completedSuccessfully && finalAccVal > 85) { SFX.playWin(); triggerConfetti(2500); }
                setTimeout(() => forceEndScreen(), 2000);
            }
        }, 500);
    } else {
        if (completedSuccessfully && finalAccVal > 85) { SFX.playWin(); triggerConfetti(2500); }
        if(gs) gs.classList.add("hidden"); 
        forceEndScreen();
    }

    try { window.pywebview.api.save_session_results(currentLevel, currentMode, currentDiff, finalWpmVal, finalAccVal, rupeesEarned); } catch (e) {} 
}

applyOwnedVisualsOnLoad();

// ═══════════════════════════════════════════════════════════
// CONFETTI SYSTEM
// ═══════════════════════════════════════════════════════════
function triggerConfetti(duration = 2500) {
    if (!visualsActive) return;
    let canvas = document.getElementById('confetti-canvas');
    if (!canvas) {
        canvas = document.createElement('canvas');
        canvas.id = 'confetti-canvas';
        document.body.appendChild(canvas);
    }
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;
    const ctx = canvas.getContext('2d');
    const pieces = [];
    const colors = ['#32f0ff','#4caf50','#ffeb3b','#ff1744','#b388ff','#ff9800','#b2ff59','#fff'];
    for (let i = 0; i < 140; i++) {
        pieces.push({
            x: Math.random() * canvas.width,
            y: Math.random() * -canvas.height * 0.5,
            w: Math.random() * 10 + 5,
            h: Math.random() * 6 + 4,
            color: colors[Math.floor(Math.random() * colors.length)],
            vx: (Math.random() - 0.5) * 4,
            vy: Math.random() * 3 + 2,
            angle: Math.random() * Math.PI * 2,
            spin: (Math.random() - 0.5) * 0.2,
            alpha: 1
        });
    }
    const end = Date.now() + duration;
    function draw() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        const now = Date.now();
        const remaining = (end - now) / duration;
        pieces.forEach(p => {
            p.x += p.vx; p.y += p.vy; p.angle += p.spin;
            p.alpha = Math.min(1, remaining * 2);
            ctx.save();
            ctx.globalAlpha = p.alpha;
            ctx.translate(p.x, p.y);
            ctx.rotate(p.angle);
            ctx.fillStyle = p.color;
            ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
            ctx.restore();
        });
        if (now < end) { requestAnimationFrame(draw); }
        else { ctx.clearRect(0, 0, canvas.width, canvas.height); }
    }
    draw();
}

function showDifficultyScreen() {
    const categoryScreen = document.getElementById("category-screen");
    if (categoryScreen) categoryScreen.classList.add("hidden");

    const diffScreen = document.getElementById("difficulty-screen");
    if (diffScreen) diffScreen.classList.remove("hidden");

    let currVal = getActiveCurrency();
    let dec = document.getElementById("diff-rupees-count-val");
    let cName = currentCategory === "Coding" ? "Diamonds" : "Emeralds";
    if (dec) dec.innerHTML = `${currVal} <span class="curr-name">${cName}</span>`;

    // PROPERLY PULLING THE LEVELS FOR THE UI CARDS 
    let easyProg = getProg(currentMode, "Easy");
    let normalProg = getProg(currentMode, "Normal");
    let hardProg = getProg(currentMode, "Hard");

    // APPLY THE LEVEL TEXT TO EASY
    let easyCard = document.getElementById("diff-easy-card");
    if (easyCard) {
        easyCard.classList.remove("locked-diff");
        let p = easyCard.querySelector(".next-level-text");
        if (p) p.innerText = `Next Available: Lvl ${easyProg}`;
    }

    // APPLY THE LEVEL TEXT TO NORMAL
    let normalCard = document.getElementById("diff-normal-card");
    let normalLock = document.getElementById("lock-normal");
    if (normalCard && normalLock) {
        let p = normalCard.querySelector(".next-level-text");
        if (p) p.innerText = `Next Available: Lvl ${normalProg}`;

        if (easyProg >= 40) {
            normalCard.classList.remove("locked-diff");
            normalLock.classList.add("hidden");
        } else {
            normalCard.classList.add("locked-diff");
            normalLock.classList.remove("hidden");
        }
    }

    // APPLY THE LEVEL TEXT TO HARD
    let hardCard = document.getElementById("diff-hard-card");
    let hardLock = document.getElementById("lock-hard");
    if (hardCard && hardLock) {
        let p = hardCard.querySelector(".next-level-text");
        if (p) p.innerText = `Next Available: Lvl ${hardProg}`;

        if (normalProg >= 40) {
            hardCard.classList.remove("locked-diff");
            hardLock.classList.add("hidden");
        } else {
            hardCard.classList.add("locked-diff");
            hardLock.classList.remove("hidden");
        }
    }
}

// -------------------------------------------------------------
// DYNAMIC PROGRESSION & CALCULATED START LEVEL IN PLACEMENT TEST
// -------------------------------------------------------------
function startPlacementTest() {
    const landingScreen = document.getElementById("landing-screen");
    if(landingScreen) landingScreen.classList.add("hidden");

    const testScreen = document.getElementById("test-screen");
    if(testScreen) testScreen.classList.remove("hidden");

    const testTextContainer = document.getElementById("test-text");
    const testInputField = document.getElementById("testInputField");
    const wpmDisplay = document.getElementById("test-wpm");
    const timeDisplay = document.getElementById("test-time");
    const mistakesDisplay = document.getElementById("test-mistakes");

    // The Exact 150 Character Test
    const textToType = "The quick brown fox jumps over the lazy dog. Programming requires logic, patience, and typing speed. Practice creates perfection and true mastery now.";
    
    if(testTextContainer) {
        testTextContainer.innerHTML = "";
        textToType.split("").forEach((char) => {
            testTextContainer.innerHTML += `<span>${char}</span>`;
        });
        testTextContainer.querySelectorAll("span")[0].classList.add("active");
    }

    if(testInputField) {
        testInputField.disabled = false;
        testInputField.value = "";
        testInputField.focus();

        let charIdx = 0;
        let mistakes = 0;
        let startTime = null;
        let testTimer;

        testInputField.addEventListener("input", function handleTestInput() {
            if (!startTime) {
                startTime = Date.now();
                let timeLeft = 30;
                if(timeDisplay) timeDisplay.innerText = timeLeft + "s";
                
                testTimer = setInterval(() => {
                    timeLeft--;
                    if(timeDisplay) timeDisplay.innerText = timeLeft + "s";
                    
                    let timeElapsed = (Date.now() - startTime) / 1000;
                    let wpm = Math.round(((charIdx - mistakes) / 5) / (timeElapsed / 60));
                    if (wpm < 0) wpm = 0;
                    if(wpmDisplay) wpmDisplay.innerText = wpm + " WPM";
                    applyDynamicTheme(wpm);

                    if (timeLeft <= 0) {
                        clearInterval(testTimer);
                        finishTest(wpm);
                    }
                }, 1000);
            }

            const characters = testTextContainer.querySelectorAll("span");
            let typedChar = testInputField.value.split("")[charIdx];

            if (typedChar == null) {
                if (charIdx > 0) {
                    charIdx--;
                    if (characters[charIdx].classList.contains("incorrect")) mistakes--;
                    characters[charIdx].classList.remove("correct", "incorrect", "active");
                    characters[charIdx].classList.add("active");
                }
            } else {
                let expectedChar = characters[charIdx].innerText;
                if (expectedChar === typedChar) {
                    characters[charIdx].classList.add("correct");
                    SFX.playType();
                } else {
                    mistakes++;
                    characters[charIdx].classList.add("incorrect");
                    SFX.playError();
                }
                
                if(mistakesDisplay) mistakesDisplay.innerText = mistakes + " Mistakes";
                characters[charIdx].classList.remove("active");
                charIdx++;
                
                if (charIdx < characters.length) {
                    characters[charIdx].classList.add("active");
                } else {
                    clearInterval(testTimer);
                    let timeElapsed = (Date.now() - startTime) / 1000;
                    let wpm = Math.round(((charIdx - mistakes) / 5) / (timeElapsed / 60));
                    finishTest(wpm);
                }
            }
        });

        function finishTest(finalWpm) {
            testInputField.disabled = true;
            
            let overlay = document.getElementById("test-pause-overlay");
            let countdown = document.getElementById("test-pause-countdown");
            if (overlay) overlay.classList.remove("hidden");
            
            let pTime = 3;
            if(countdown) countdown.innerText = `Evaluating Fate In ${pTime}s...`;
            
            let pInt = setInterval(() => {
                pTime--;
                if (pTime > 0) {
                    if(countdown) countdown.innerText = `Evaluating Fate In ${pTime}s...`;
                } else {
                    clearInterval(pInt);
                    if (overlay) overlay.classList.add("hidden");
                    
                    localStorage.setItem('hasTested', 'true');
                    
                    let recommended = "Normal";
                    let startLevel = 1;

                    if (finalWpm >= 40) {
                        recommended = "Hard";
                        startLevel = Math.min(200, Math.max(1, finalWpm - 30));
                        modesList.forEach(m => {
                            progressData[m]["Easy"] = 40;
                            progressData[m]["Normal"] = 40;
                            progressData[m]["Hard"] = startLevel;
                            progressData[m]["Hard_maxWpm"] = finalWpm;
                        });
                    } else if (finalWpm >= 20) {
                        recommended = "Normal";
                        startLevel = Math.min(200, Math.max(1, finalWpm - 15));
                        modesList.forEach(m => {
                            progressData[m]["Easy"] = 40;
                            progressData[m]["Normal"] = startLevel;
                            progressData[m]["Normal_maxWpm"] = finalWpm;
                        });
                    } else {
                        recommended = "Easy";
                        startLevel = Math.min(200, Math.max(1, finalWpm));
                        modesList.forEach(m => {
                            progressData[m]["Easy"] = startLevel;
                            progressData[m]["Easy_maxWpm"] = finalWpm;
                        });
                    }

                    showToast(`Placement Done! Hardcore Locked To Level ${startLevel} (Max 200).`, 'success', 4000);
                    localStorage.setItem('typingProgressData', JSON.stringify(progressData));
                    localStorage.setItem('recDiff', recommended);
                    localStorage.setItem('recLevel', startLevel);

                    recommendedDiff = recommended;
                    recommendedLevel = startLevel;
                    
                    let rl = document.getElementById("recommended-level");
                    if(rl) rl.innerText = `${recommendedDiff} (Lvl ${startLevel})`;

                    if(testScreen) testScreen.classList.add("hidden");
                    const categoryScreen = document.getElementById("category-screen");
                    if (categoryScreen) {
                        categoryScreen.classList.remove("hidden");
                        document.getElementById("global-emerald-count").innerText = emeralds || 0;
                        document.getElementById("global-diamond-count").innerText = diamonds || 0;
                        if (typeof updateRank === "function") updateRank();
                    }
                }
            }, 1000);
        }
    }
}
function completelyWipeSaveData() {
    localStorage.clear();
    location.reload();
}

// ═══════════════════════════════════════════════════════════
// ACCOUNT SYSTEM
// ═══════════════════════════════════════════════════════════
let accounts = {};
try { accounts = JSON.parse(localStorage.getItem('tq_accounts') || '{}'); } catch(e) { accounts = {}; }
let currentAccountId = 'guest';
try { currentAccountId = localStorage.getItem('tq_current_account') || 'guest'; } catch(e) {}

function saveAccounts() { localStorage.setItem('tq_accounts', JSON.stringify(accounts)); }

function createAccount(name, pin) {
    const id = 'acc_' + Date.now();
    accounts[id] = { id, name, pin: pin || '', created: Date.now(), loginStreak: 1, lastLoginDay: new Date().toDateString() };
    saveAccounts();
    return id;
}

function switchAccount(id) {
    currentAccountId = id;
    localStorage.setItem('tq_current_account', id);
    if (id !== 'guest' && accounts[id]) {
        const acc = accounts[id];
        const today = new Date().toDateString();
        if (acc.lastLoginDay !== today) {
            const last = new Date(acc.lastLoginDay || 0);
            const diff = Math.floor((new Date(today) - last) / 86400000);
            acc.loginStreak = diff === 1 ? (acc.loginStreak || 0) + 1 : 1;
            acc.lastLoginDay = today;
            saveAccounts();
            // Show login bonus
            const bonus = 250 * Math.min(acc.loginStreak, 7);
            window._pendingLoginBonus = bonus;
            const bar = document.getElementById('bonus-day-bar');
            if (bar) {
                bar.innerHTML = '';
                for (let i = 1; i <= 7; i++) {
                    const d = document.createElement('div');
                    d.className = 'streak-day' + (i < acc.loginStreak ? ' completed' : '') + (i === acc.loginStreak ? ' today' : '');
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
    updateUserIndicators();
}

function getCurrentAccount() {
    if (currentAccountId === 'guest' || !accounts[currentAccountId]) return { id: 'guest', name: 'Guest', loginStreak: 1 };
    return accounts[currentAccountId];
}

window.claimLoginBonus = function() {
    if (window._pendingLoginBonus) {
        addActiveCurrency(window._pendingLoginBonus);
        showToast(`+${window._pendingLoginBonus} Daily Login Bonus!`, 'success', 3000);
        updateUI();
        window._pendingLoginBonus = 0;
    }
    const modal = document.getElementById('login-bonus-modal');
    if (modal) modal.classList.add('hidden');
};

window.createAccountFromForm = function() {
    const nameEl = document.getElementById('new-acc-name');
    const name = nameEl?.value.trim();
    if (!name) { showToast('Please enter a username.', 'error'); return; }
    if (Object.values(accounts).some(a => a.name.toLowerCase() === name.toLowerCase())) {
        showToast('That username is already taken.', 'error'); return;
    }
    const id = createAccount(name);
    switchAccount(id);
    renderAccountPanel();
    showToast(`Welcome, ${name}! 🎉`, 'success');
};

window.deleteAccount = function(id) {
    if (!confirm('Delete this profile? This cannot be undone.')) return;
    delete accounts[id];
    saveAccounts();
    if (currentAccountId === id) { currentAccountId = 'guest'; localStorage.setItem('tq_current_account', 'guest'); updateUserIndicators(); }
    renderAccountPanel();
};

function updateUserIndicators() {
    const acc = getCurrentAccount();
    const initial = acc.name.charAt(0).toUpperCase();
    document.querySelectorAll('[id$="-user-avatar"]').forEach(el => { el.textContent = initial; });
    document.querySelectorAll('[id$="-user-name"]').forEach(el => { el.textContent = acc.name; });
    const ind = document.getElementById('landing-user-indicator');
    if (ind) { if (acc.id === 'guest') ind.classList.add('hidden'); else { ind.classList.remove('hidden'); ind.style.display = 'flex'; } }
}

// ── ACCOUNT CENTRE RENDERER ───────────────────────────────
window.renderAccountPanel = function() {
    const panel = document.getElementById('account-panel-content');
    if (!panel) return;
    const acc   = getCurrentAccount();
    const list  = Object.values(accounts);

    // Build stats for display
    let pd = {}; try { pd = JSON.parse(localStorage.getItem('typingProgressData') || '{}'); } catch(e) {}
    const modes5 = ['Words','Lines','Paragraphs','Pages','Code'];
    const maxLvl = Math.max(0, ...modes5.map(m => Math.max(pd[m]?.Easy||0, pd[m]?.Normal||0, pd[m]?.Hard||0)));
    const bestWpm = Math.max(0, ...modes5.map(m => Math.max(pd[m]?.Easy_maxWpm||0, pd[m]?.Normal_maxWpm||0, pd[m]?.Hard_maxWpm||0)));
    let sessCnt = 0; try { sessCnt = JSON.parse(localStorage.getItem('tq_session_log')||'[]').length; } catch(e) {}

    panel.innerHTML = `
    <h2 style="font-family:var(--font-head);color:var(--primary);margin:0 0 18px;font-size:1.5rem;text-align:center;letter-spacing:0.05em;padding-top:8px;">ACCOUNT CENTRE</h2>

    ${acc.id !== 'guest' ? `
    <div style="display:flex;align-items:center;gap:14px;background:rgba(0,0,0,0.35);border:1px solid var(--card-border);border-radius:16px;padding:14px;margin-bottom:16px;">
        <div style="width:52px;height:52px;border-radius:50%;background:linear-gradient(135deg,var(--primary),var(--prog-grad-2));display:flex;align-items:center;justify-content:center;font-family:var(--font-head);font-size:1.4rem;font-weight:900;color:#000;flex-shrink:0;">${acc.name.charAt(0).toUpperCase()}</div>
        <div>
            <div style="font-family:var(--font-head);font-size:1.1rem;color:var(--primary);">${acc.name}</div>
            <div style="font-family:var(--font-code);font-size:0.74rem;color:rgba(255,255,255,0.35);margin-top:3px;">Login streak: ${acc.loginStreak||1} day${(acc.loginStreak||1)>1?'s':''}</div>
        </div>
    </div>

    <div style="font-family:var(--font-head);font-size:0.68rem;letter-spacing:0.13em;text-transform:uppercase;color:rgba(255,255,255,0.25);margin:0 0 8px;">EDIT USERNAME</div>
    <div style="display:flex;gap:8px;margin-bottom:14px;">
        <input id="edit-acc-name" style="flex:1;background:rgba(0,0,0,0.45);border:1.5px solid rgba(255,255,255,0.1);border-radius:10px;padding:9px 14px;color:#e8e8f0;font-size:0.95rem;font-family:var(--font-main);outline:none;" value="${acc.name}" maxlength="20" placeholder="New username">
        <button onclick="accSaveName()" style="background:var(--primary);color:#000;border:none;border-radius:10px;padding:9px 16px;font-family:var(--font-main);font-size:0.9rem;font-weight:700;cursor:pointer;white-space:nowrap;">Save</button>
    </div>

    <div style="font-family:var(--font-head);font-size:0.68rem;letter-spacing:0.13em;text-transform:uppercase;color:rgba(255,255,255,0.25);margin:0 0 8px;">STATISTICS</div>
    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-bottom:14px;">
        ${[{l:'Max Level',v:maxLvl},{l:'Best WPM',v:bestWpm},{l:'Sessions',v:sessCnt},{l:'Emeralds',v:(emeralds||0).toLocaleString()},{l:'Diamonds',v:(diamonds||0).toLocaleString()},{l:'Prestige',v:prestigeCount||0}].map(s=>`
        <div style="background:rgba(0,0,0,0.4);border:1px solid rgba(255,255,255,0.07);border-radius:12px;padding:11px 8px;text-align:center;">
            <span style="display:block;font-family:var(--font-head);font-size:1.35rem;color:var(--primary);">${s.v}</span>
            <span style="display:block;font-family:var(--font-code);font-size:0.62rem;color:rgba(255,255,255,0.3);text-transform:uppercase;letter-spacing:0.1em;margin-top:3px;">${s.l}</span>
        </div>`).join('')}
    </div>

    <div style="display:flex;gap:8px;margin-bottom:14px;flex-wrap:wrap;">
        <button onclick="if(confirm('Sign out?')){switchAccount('guest');renderAccountPanel();}" style="background:rgba(255,23,68,0.1);border:1px solid rgba(255,23,68,0.28);border-radius:10px;padding:8px 16px;color:#ff5252;font-family:var(--font-main);font-size:0.88rem;font-weight:700;cursor:pointer;">Sign Out</button>
        <button onclick="if(confirm('Delete profile? Cannot be undone.')){deleteAccount('${acc.id}');}" style="background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);border-radius:10px;padding:8px 16px;color:rgba(255,255,255,0.4);font-family:var(--font-main);font-size:0.88rem;cursor:pointer;">Delete Profile</button>
    </div>
    ` : `<p style="text-align:center;color:rgba(255,255,255,0.4);font-size:0.9rem;margin:0 0 18px;line-height:1.6;">Create a profile to track your progress, set a username, and personalise your experience.</p>`}

    <!-- SETTINGS -->
    <div style="font-family:var(--font-head);font-size:0.68rem;letter-spacing:0.13em;text-transform:uppercase;color:rgba(255,255,255,0.25);margin:0 0 8px;">SETTINGS</div>
    <div style="display:flex;flex-direction:column;gap:6px;margin-bottom:14px;">
        ${[
            {key:'sfx',   label:'Sound Effects',  on: localStorage.getItem('tq_sfx_off')!=='1'},
            {key:'vis',   label:'Visual Effects',  on: visualsActive},
            {key:'kb',    label:'Show Keyboard',   on: localStorage.getItem('tq_hide_kb')!=='1'},
            {key:'pause', label:'Post-Level Pause',on: localStorage.getItem('tq_skip_pause')!=='1'},
            {key:'ghost', label:'Ghost Runner',    on: localStorage.getItem('tq_hide_ghost')!=='1'},
        ].map(s=>`
        <div style="display:flex;align-items:center;justify-content:space-between;background:rgba(0,0,0,0.3);border:1px solid rgba(255,255,255,0.07);border-radius:10px;padding:10px 14px;">
            <span style="font-family:var(--font-main);font-size:0.9rem;font-weight:600;color:rgba(255,255,255,0.7);">${s.label}</span>
            <label style="position:relative;display:inline-block;width:40px;height:22px;flex-shrink:0;">
                <input type="checkbox" ${s.on?'checked':''} onchange="accToggleSetting('${s.key}',this.checked)" style="opacity:0;width:0;height:0;">
                <span style="position:absolute;inset:0;background:${s.on?'var(--primary)':'rgba(255,255,255,0.1)'};border-radius:11px;cursor:pointer;transition:background 0.25s;border:1px solid rgba(255,255,255,0.15);"></span>
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

    <!-- SWITCH PROFILE -->
    <div style="font-family:var(--font-head);font-size:0.68rem;letter-spacing:0.13em;text-transform:uppercase;color:rgba(255,255,255,0.25);margin:0 0 8px;">PROFILES (${list.length})</div>
    <div class="profile-list" style="max-height:180px;overflow-y:auto;margin-bottom:12px;">
        ${list.length ? list.map(a=>`
        <div class="profile-item ${a.id===acc.id?'active-profile':''}" onclick="switchAccount('${a.id}');renderAccountPanel();" style="cursor:pointer;">
            <div class="profile-mini-avatar">${a.name.charAt(0).toUpperCase()}</div>
            <div class="profile-info">
                <div class="profile-info-name">${a.name}</div>
                <div class="profile-info-sub">Streak ${a.loginStreak||1}d · ${new Date(a.created||Date.now()).toLocaleDateString()}</div>
            </div>
            ${a.id===acc.id
                ? '<span style="color:var(--primary);font-family:var(--font-code);font-size:0.75rem;">ACTIVE</span>'
                : `<button onclick="event.stopPropagation();deleteAccount('${a.id}');" style="background:rgba(255,23,68,0.1);border:1px solid rgba(255,23,68,0.2);border-radius:6px;padding:3px 9px;color:#ff5252;font-size:0.75rem;cursor:pointer;font-family:var(--font-code);">DEL</button>`}
        </div>`).join('')
        : '<div style="text-align:center;padding:12px;color:rgba(255,255,255,0.2);font-family:var(--font-code);font-size:0.82rem;">No profiles yet — create one below</div>'}
    </div>

    <!-- CREATE NEW -->
    <div style="font-family:var(--font-head);font-size:0.68rem;letter-spacing:0.13em;text-transform:uppercase;color:rgba(255,255,255,0.25);margin:0 0 8px;">CREATE NEW PROFILE</div>
    <div style="display:flex;gap:8px;">
        <input id="new-acc-name" style="flex:1;background:rgba(0,0,0,0.45);border:1.5px solid rgba(255,255,255,0.1);border-radius:10px;padding:9px 14px;color:#e8e8f0;font-size:0.95rem;font-family:var(--font-main);outline:none;" placeholder="Choose a username…" maxlength="20" onkeydown="if(event.key==='Enter')createAccountFromForm()">
        <button onclick="createAccountFromForm()" style="background:var(--primary);color:#000;border:none;border-radius:10px;padding:9px 16px;font-family:var(--font-main);font-size:0.9rem;font-weight:700;cursor:pointer;white-space:nowrap;">Create</button>
    </div>`;
};

window.accSaveName = function() {
    const inp = document.getElementById('edit-acc-name');
    const name = inp?.value.trim();
    if (!name) { showToast('Name cannot be empty.', 'error'); return; }
    if (Object.values(accounts).some(a => a.id !== currentAccountId && a.name.toLowerCase() === name.toLowerCase())) {
        showToast('That username is already taken.', 'error'); return;
    }
    const acc = getCurrentAccount();
    if (!acc || acc.id === 'guest') return;
    accounts[acc.id].name = name;
    saveAccounts();
    updateUserIndicators();
    renderAccountPanel();
    showToast(`Username updated to "${name}"`, 'success');
};

window.accToggleSetting = function(key, val) {
    if (key === 'sfx')   { localStorage.setItem('tq_sfx_off', val ? '0' : '1'); }
    if (key === 'vis')   { visualsActive = val; localStorage.setItem('typingVisualsActive', String(val)); if (val) applyOwnedVisualsOnLoad(); else removeAllVisuals(); }
    if (key === 'kb')    { localStorage.setItem('tq_hide_kb', val ? '0' : '1'); const kb = document.getElementById('virtual-keyboard'); if (kb) kb.style.display = val ? '' : 'none'; }
    if (key === 'pause') { localStorage.setItem('tq_skip_pause', val ? '0' : '1'); }
    if (key === 'ghost') { localStorage.setItem('tq_hide_ghost', val ? '0' : '1'); const gt = document.getElementById('ghost-track'); if (gt) gt.style.display = val ? '' : 'none'; }
    renderAccountPanel();
};

window.accSetTheme = function(theme) {
    localStorage.setItem('tq_theme', theme);
    const root = document.documentElement;
    const themes = {
        cyan:   { p:'#00f5ff', s:'rgba(0,245,255,0.15)',    b:'rgba(0,245,255,0.18)',   g1:'#00f5ff', g2:'#69ff47' },
        purple: { p:'#b388ff', s:'rgba(179,136,255,0.15)',  b:'rgba(179,136,255,0.2)',  g1:'#b388ff', g2:'#f48fb1' },
        green:  { p:'#39ff14', s:'rgba(57,255,20,0.12)',    b:'rgba(57,255,20,0.2)',    g1:'#39ff14', g2:'#00e5ff' },
        orange: { p:'#ff9800', s:'rgba(255,152,0,0.15)',    b:'rgba(255,152,0,0.22)',   g1:'#ff9800', g2:'#ffd54f' },
    };
    const t = themes[theme] || themes.cyan;
    root.style.setProperty('--primary',      t.p);
    root.style.setProperty('--primary-dim',  t.s);
    root.style.setProperty('--card-border',  t.b);
    root.style.setProperty('--text-shadow',  t.p + '99');
    root.style.setProperty('--prog-grad-1',  t.g1);
    root.style.setProperty('--prog-grad-2',  t.g2);
    root.style.setProperty('--card-shadow',  t.p + '55');
    root.style.setProperty('--card-border-hover', t.p);
    showToast(`Theme: ${theme.charAt(0).toUpperCase()+theme.slice(1)}`, 'info', 1200);
};

// Apply saved theme and settings on load
(function applySavedSettings() {
    const theme = localStorage.getItem('tq_theme') || 'cyan';
    window.accSetTheme(theme);
    if (localStorage.getItem('tq_hide_kb') === '1') {
        const kb = document.getElementById('virtual-keyboard');
        if (kb) kb.style.display = 'none';
    }
    if (localStorage.getItem('tq_hide_ghost') === '1') {
        const gt = document.getElementById('ghost-track');
        if (gt) gt.style.display = 'none';
    }
})();

// Wire account modal open buttons
document.addEventListener('DOMContentLoaded', () => {
    const openAccountsBtn  = document.getElementById('open-accounts-btn');
    const headerProfileBtn = document.getElementById('header-profile-btn');
    const landingProfileBtn= document.getElementById('landing-profile-btn');
    const accountModal     = document.getElementById('account-modal');
    function openAccModal() { if (accountModal) { renderAccountPanel(); accountModal.classList.remove('hidden'); } }
    if (openAccountsBtn)   openAccountsBtn.addEventListener('click', openAccModal);
    if (headerProfileBtn)  headerProfileBtn.addEventListener('click', openAccModal);
    if (landingProfileBtn) landingProfileBtn.addEventListener('click', openAccModal);
    updateUserIndicators();
});
// ═══════════════════════════════════════════════════════════
// NEW DOCK BUTTONS — wire after DOM ready
// ═══════════════════════════════════════════════════════════
document.addEventListener('DOMContentLoaded', () => {
    // Daily challenge
    const dailyBtn = document.getElementById('open-daily-btn');
    if (dailyBtn) dailyBtn.addEventListener('click', () => {
        const modal = document.getElementById('daily-challenge-modal');
        if (!modal) return;
        const today = new Date().toLocaleDateString('en-US',{weekday:'long',year:'numeric',month:'long',day:'numeric'});
        const dateEl = document.getElementById('dc-date-display');
        if (dateEl) dateEl.textContent = today;
        const texts = [
            "The quick brown fox jumps over the lazy dog. Practice makes perfect and speed comes with daily dedication.",
            "Programming is the art of telling a computer what to do. Precision and speed are equally important skills.",
            "Artificial intelligence is transforming the modern world. Typing accurately remains a core professional skill.",
            "The history of the keyboard began with the typewriter. Modern keyboards have evolved dramatically since then.",
        ];
        const dayIdx = Math.floor(Date.now() / 86400000) % texts.length;
        const textEl = document.getElementById('dc-text-display');
        if (textEl) textEl.textContent = texts[dayIdx].slice(0,120) + '...';
        const doneKey = 'dc_done_' + new Date().toDateString();
        const done = localStorage.getItem(doneKey);
        const playBtn = document.getElementById('dc-play-btn');
        const doneMsg = document.getElementById('dc-submitted-msg');
        if (playBtn) { playBtn.disabled = !!done; playBtn.textContent = done ? '✅ Completed Today' : '🚀 Start Challenge'; }
        if (doneMsg) doneMsg.classList.toggle('hidden', !done);
        window._dcText = texts[dayIdx];
        window._dcKey  = doneKey;
        modal.classList.remove('hidden');
    });

    // Speed Test
    const stBtn = document.getElementById('open-speed-test-btn');
    if (stBtn) stBtn.addEventListener('click', _openSpeedTest);

    // Achievements
    const achBtn = document.getElementById('open-ach-btn');
    if (achBtn) achBtn.addEventListener('click', () => {
        const modal = document.getElementById('achievements-modal');
        if (!modal) return;
        modal.classList.remove('hidden');
        if (typeof Achievements !== 'undefined') Achievements.renderPanel();
        else _renderBasicAchievements();
    });

    // Tournaments
    const tBtn = document.getElementById('open-tournament-btn');
    if (tBtn) tBtn.addEventListener('click', () => {
        document.getElementById('tournament-modal')?.classList.remove('hidden');
        _loadTournaments();
    });

    // Global LB
    const glbBtn = document.getElementById('open-global-lb-btn');
    if (glbBtn) glbBtn.addEventListener('click', () => {
        document.getElementById('global-lb-modal')?.classList.remove('hidden');
        _loadGlobalLB();
    });

    // Daily play button
    const dcPlayBtn = document.getElementById('dc-play-btn');
    if (dcPlayBtn) dcPlayBtn.addEventListener('click', () => {
        document.getElementById('daily-challenge-modal')?.classList.add('hidden');
        if (window._dcText) {
            window._dcOverrideText = window._dcText;
            window._dcOverrideKey  = window._dcKey;
        }
        currentMode = 'Words'; currentDiff = 'Normal'; currentLevel = 0;
        if (startScreen) startScreen.classList.add('hidden');
        if (mainHeader)  mainHeader.classList.add('hidden');
        startGameProcedural();
    });
});

// ─── Speed Test ───────────────────────────────────────────
function _openSpeedTest() {
    const modal = document.getElementById('speed-test-modal');
    if (!modal) return;
    modal.classList.remove('hidden');
    const TEXTS = [
        "The quick brown fox jumps over the lazy dog. Speed and accuracy improve with consistent daily practice.",
        "Programming requires logical thinking, problem solving, and attention to detail. The best developers type fluently.",
        "Artificial intelligence is reshaping how we work and create. Typing fluency remains one of the most valuable skills.",
        "The history of computing began with mechanical calculators. Modern computers process billions of operations per second.",
        "Typing speed and accuracy improve dramatically with practice. Professional typists reach over a hundred words per minute.",
    ];
    const textEl = document.getElementById('st-text');
    const input  = document.getElementById('st-input');
    const result = document.getElementById('st-result-area');
    if (!textEl || !input) return;

    const txt = TEXTS[Math.floor(Math.random() * TEXTS.length)];
    textEl.innerHTML = '';
    txt.split('').forEach(ch => { const s = document.createElement('span'); s.textContent = ch; textEl.appendChild(s); });
    const spans = textEl.querySelectorAll('span');
    if (spans[0]) spans[0].classList.add('active');
    input.value = ''; input.disabled = false; input.focus();
    if (result) result.classList.add('hidden');
    const wpmEl = document.getElementById('st-wpm-live');
    const accEl = document.getElementById('st-acc-live');
    const timEl = document.getElementById('st-time-live');
    if (wpmEl) wpmEl.textContent = '0 WPM';
    if (accEl) accEl.textContent = '100%';
    if (timEl) timEl.textContent = '60s';

    let charIdx = 0, mistakes = 0, startTime = null, timerInt;

    const finish = () => {
        clearInterval(timerInt); input.disabled = true;
        const elapsed = (Date.now() - startTime) / 60000;
        const wpm = Math.max(0, Math.round(((charIdx - mistakes) / 5) / elapsed));
        const acc = Math.round(((charIdx - mistakes) / Math.max(charIdx, 1)) * 100);
        if (result) result.classList.remove('hidden');
        const fw = document.getElementById('st-final-wpm'); if (fw) fw.textContent = wpm;
        const fa = document.getElementById('st-final-acc'); if (fa) fa.textContent = acc + '%';
        const fc = document.getElementById('st-final-chars'); if (fc) fc.textContent = charIdx;
        if (typeof logSession === 'function') logSession(0, 'SpeedTest', '60s', wpm, acc);
        showToast('Speed Test: ' + wpm + ' WPM, ' + acc + '% accuracy', 'success', 3000);
    };

    const listener = function() {
        if (!startTime) {
            startTime = Date.now(); let tl = 60;
            timerInt = setInterval(() => {
                tl--;
                if (timEl) timEl.textContent = tl + 's';
                const el = (Date.now() - startTime) / 60000;
                const w = Math.max(0, Math.round(((charIdx - mistakes) / 5) / el));
                if (wpmEl) wpmEl.textContent = w + ' WPM';
                if (tl <= 0) { clearInterval(timerInt); finish(); }
            }, 1000);
        }
        const typed = input.value[charIdx];
        if (!typed) return;
        if (typed === spans[charIdx].textContent) {
            spans[charIdx].classList.add('correct');
        } else {
            mistakes++;
            spans[charIdx].classList.add('incorrect');
            if (accEl) accEl.textContent = Math.round(((charIdx - mistakes) / Math.max(charIdx, 1)) * 100) + '%';
        }
        spans[charIdx].classList.remove('active'); charIdx++;
        if (charIdx < spans.length) spans[charIdx].classList.add('active');
        else finish();
    };
    input.removeEventListener('input', input._stL);
    input._stL = listener;
    input.addEventListener('input', listener);
}

// ─── Basic achievements renderer (fallback if achievements.js not loaded) ─
function _renderBasicAchievements() {
    const grid = document.getElementById('ach-grid');
    if (!grid) return;
    let pd = {}; try { pd = JSON.parse(localStorage.getItem('typingProgressData') || '{}'); } catch(e) {}
    const modes5 = ['Words','Lines','Paragraphs','Pages','Code'];
    const maxLvl  = Math.max(0, ...modes5.map(m => Math.max(pd[m]?.Easy||0, pd[m]?.Normal||0, pd[m]?.Hard||0)));
    const bestWpm = Math.max(0, ...modes5.map(m => Math.max(pd[m]?.Easy_maxWpm||0, pd[m]?.Normal_maxWpm||0, pd[m]?.Hard_maxWpm||0)));
    const prestige = parseInt(localStorage.getItem('typingPrestige') || '0');
    const basics = [
        { icon:'⚡', name:'Speed Rookie',    desc:'Hit 20 WPM',      done: bestWpm >= 20  },
        { icon:'🚀', name:'Speed Master',    desc:'Hit 60 WPM',      done: bestWpm >= 60  },
        { icon:'💯', name:'The Century',     desc:'Hit 100 WPM',     done: bestWpm >= 100 },
        { icon:'📍', name:'Getting Started', desc:'Reach Level 10',  done: maxLvl >= 10   },
        { icon:'🏃', name:'Halfway There',   desc:'Reach Level 50',  done: maxLvl >= 50   },
        { icon:'💯', name:'Century Club',    desc:'Reach Level 100', done: maxLvl >= 100  },
        { icon:'🏔', name:'The Pinnacle',    desc:'Reach Level 200', done: maxLvl >= 200  },
        { icon:'⭐', name:'Ascended',        desc:'Prestige 1',      done: prestige >= 1  },
        { icon:'🔥', name:'On Fire',         desc:'50-key streak',   done: false           },
    ];
    const unlocked = basics.filter(a => a.done).length;
    const header = document.getElementById('ach-header-stats');
    if (header) header.innerHTML = [
        { l:'Max Level', v: maxLvl  },
        { l:'Best WPM',  v: bestWpm },
        { l:'Unlocked',  v: unlocked },
        { l:'Total',     v: basics.length },
    ].map(s => `<div style="flex:1;min-width:90px;background:rgba(0,0,0,0.4);border:1px solid rgba(255,255,255,0.07);border-radius:12px;padding:12px 8px;text-align:center;">
        <span style="display:block;font-family:var(--font-head);font-size:1.5rem;color:#b388ff;font-weight:700;">${s.v}</span>
        <span style="display:block;font-family:var(--font-main);font-size:0.62rem;color:rgba(255,255,255,0.3);text-transform:uppercase;letter-spacing:0.08em;margin-top:3px;">${s.l}</span>
    </div>`).join('');

    grid.innerHTML = `<div style="font-family:var(--font-main);font-size:0.7rem;color:rgba(255,255,255,0.25);text-transform:uppercase;letter-spacing:0.08em;margin-bottom:12px;">Core Achievements</div>
    <div style="display:flex;flex-wrap:wrap;gap:10px;">` +
    basics.map(a => `<div style="width:150px;background:rgba(0,0,0,0.4);border:1px solid ${a.done ? 'rgba(179,136,255,0.3)' : 'rgba(255,255,255,0.06)'};border-radius:12px;padding:14px 10px;text-align:center;opacity:${a.done ? 1 : 0.45};">
        <div style="font-size:1.7rem;margin-bottom:6px;">${a.icon}</div>
        <div style="font-family:var(--font-main);font-size:0.78rem;color:#e8e8f0;font-weight:600;margin-bottom:4px;">${a.name}</div>
        <div style="font-family:var(--font-main);font-size:0.68rem;color:rgba(255,255,255,0.35);">${a.desc}</div>
        ${a.done ? '<div style="margin-top:6px;background:#00e676;color:#000;border-radius:50%;width:18px;height:18px;font-size:0.6rem;font-weight:900;display:inline-flex;align-items:center;justify-content:center;">✓</div>' : ''}
    </div>`).join('') + '</div>';
}

// ─── Tournament loader ────────────────────────────────────
async function _loadTournaments() {
    const list = document.getElementById('tournament-list');
    if (!list) return;
    list.innerHTML = '<div style="text-align:center;padding:16px;color:rgba(255,255,255,0.3);font-family:var(--font-code);font-size:0.82rem;">Loading...</div>';
    try {
        const r = await fetch('/api/tournaments');
        const data = await r.json();
        if (!data.length) {
            list.innerHTML = '<div style="text-align:center;padding:24px;color:rgba(255,255,255,0.25);font-family:var(--font-code);font-size:0.85rem;">No active tournaments. Admin can create one in the Settings tab.</div>';
            return;
        }
        list.innerHTML = data.map(t => `
        <div style="background:rgba(0,0,0,0.35);border:1px solid rgba(255,82,82,0.15);border-radius:12px;padding:14px;margin-bottom:10px;">
            <div style="font-family:var(--font-head);font-size:1rem;color:#ff8a80;font-weight:700;margin-bottom:4px;">${t.name}</div>
            <div style="font-family:var(--font-code);font-size:0.72rem;color:rgba(255,255,255,0.3);margin-bottom:8px;">Ends: ${new Date(t.end).toLocaleString()}</div>
            <div style="font-family:var(--font-main);font-size:0.85rem;color:rgba(255,255,255,0.5);margin-bottom:10px;">${(t.text||'').slice(0,80)}...</div>
            <div style="display:flex;gap:8px;">
                <button onclick="_playTournament(${t.id},'${encodeURIComponent(t.text)}')" style="background:rgba(255,82,82,0.15);border:1px solid rgba(255,82,82,0.28);border-radius:8px;padding:7px 16px;color:#ff8a80;font-family:var(--font-main);font-size:0.85rem;font-weight:600;cursor:pointer;">🏁 Play</button>
                <button onclick="_viewTournamentScores(${t.id})" style="background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);border-radius:8px;padding:7px 16px;color:rgba(255,255,255,0.5);font-family:var(--font-main);font-size:0.85rem;cursor:pointer;">🏆 Scores</button>
            </div>
        </div>`).join('');
    } catch(e) {
        list.innerHTML = '<div style="text-align:center;padding:24px;color:rgba(255,255,255,0.25);font-family:var(--font-code);">Backend not running.</div>';
    }
}

window._playTournament = function(id, encoded) {
    document.getElementById('tournament-modal')?.classList.add('hidden');
    window._tournamentOverride = { id, text: decodeURIComponent(encoded) };
    currentMode = 'Words'; currentDiff = 'Normal'; currentLevel = 0;
    startGameProcedural();
};

window._viewTournamentScores = async function(id) {
    const wrapper = document.getElementById('tournament-scores-wrapper');
    const el = document.getElementById('tournament-scores');
    if (!wrapper || !el) return;
    wrapper.classList.remove('hidden');
    try {
        const r = await fetch('/api/tournament_scores?id=' + id);
        const scores = await r.json();
        el.innerHTML = scores.length
            ? scores.map((s, i) => `<div style="display:flex;align-items:center;gap:10px;background:rgba(0,0,0,0.35);border:1px solid rgba(255,255,255,0.07);border-radius:8px;padding:8px 14px;">
                <span style="font-family:var(--font-head);font-size:1rem;color:${i===0?'#ffd54f':i===1?'#b0bec5':i===2?'#a1887f':'rgba(255,255,255,0.4)'};">${i===0?'🥇':i===1?'🥈':i===2?'🥉':'#'+(i+1)}</span>
                <span style="flex:1;font-family:var(--font-main);font-weight:600;">${s.name}</span>
                <span style="font-family:var(--font-main);color:var(--primary);font-weight:700;">${s.wpm} WPM</span>
                <span style="font-family:var(--font-code);font-size:0.8rem;color:rgba(255,255,255,0.4);">${s.acc}%</span>
            </div>`).join('')
            : '<div style="text-align:center;padding:14px;color:rgba(255,255,255,0.25);font-family:var(--font-code);font-size:0.82rem;">No scores yet.</div>';
    } catch(e) {}
};

// ─── Global Leaderboard ───────────────────────────────────
function _loadGlobalLB() {
    const el = document.getElementById('global-lb-list');
    if (!el) return;
    if (typeof GoogleAuth !== 'undefined' && GoogleAuth.isSignedIn()) {
        GoogleAuth.loadGlobalLeaderboard && GoogleAuth.loadGlobalLeaderboard('wpm');
        return;
    }
    // Fallback: local session log
    let sessions = [];
    try { sessions = JSON.parse(localStorage.getItem('tq_session_log') || '[]'); } catch(e) {}
    const sorted = [...sessions].sort((a, b) => b.wpm - a.wpm).slice(0, 20);
    if (!sorted.length) {
        el.innerHTML = '<div style="text-align:center;padding:24px;color:rgba(255,255,255,0.25);font-family:var(--font-code);font-size:0.85rem;">Play some levels to see your personal records here!<br>Connect Firebase for global rankings.</div>';
        return;
    }
    el.innerHTML = sorted.map((s, i) => `
    <div style="display:flex;align-items:center;gap:12px;background:rgba(0,0,0,0.35);border:1px solid rgba(255,255,255,0.07);border-radius:10px;padding:10px 14px;">
        <span style="font-family:var(--font-head);font-size:1.1rem;color:${i===0?'#ffd54f':i===1?'#b0bec5':i===2?'#a1887f':'rgba(255,255,255,0.4)'};">${i===0?'🥇':i===1?'🥈':i===2?'🥉':'#'+(i+1)}</span>
        <span style="flex:1;font-family:var(--font-main);font-weight:500;">${s.mode} [${s.diff}] Lvl ${s.level}</span>
        <span style="font-family:var(--font-main);color:var(--primary);font-weight:700;">${s.wpm} WPM</span>
        <span style="font-family:var(--font-code);font-size:0.8rem;color:rgba(255,255,255,0.4);">${s.acc}%</span>
    </div>`).join('');
}

// ═══════════════════════════════════════════════════════════
// CODE MODE RANK-UP ANIMATION + LEVEL BREAKDOWN
// ═══════════════════════════════════════════════════════════
const _origExecuteEnd = window.executeEndGameSequence;
window.executeEndGameSequence = function(completedSuccessfully) {
    if (currentCategory === 'Coding') {
        // Red theme for Code rank-up
        const rs = document.getElementById('rank-up-sequence-screen');
        if (rs) rs.style.background = 'rgba(12,2,2,0.99)';
        const bigRank = document.getElementById('big-rank-text');
        if (bigRank) bigRank.style.color = '#ff1744';
        const fill = document.getElementById('big-progress-fill');
        if (fill) fill.style.background = 'linear-gradient(90deg,#ff1744,#ff9800)';
        const reward = document.getElementById('rank-reward-text');
        if (reward) reward.style.color = '#00f5ff';
        _codeRankParticles();
    } else {
        // Purple theme for Literature
        const rs = document.getElementById('rank-up-sequence-screen');
        if (rs) rs.style.background = 'rgba(8,5,20,0.99)';
        const bigRank = document.getElementById('big-rank-text');
        if (bigRank) bigRank.style.color = '#b388ff';
        const fill = document.getElementById('big-progress-fill');
        if (fill) fill.style.background = 'linear-gradient(90deg,#b388ff,#f48fb1)';
    }
    _origExecuteEnd && _origExecuteEnd.call(this, completedSuccessfully);
};

function _codeRankParticles() {
    let canvas = document.getElementById('confetti-canvas');
    if (!canvas) { canvas = document.createElement('canvas'); canvas.id = 'confetti-canvas'; document.body.appendChild(canvas); }
    canvas.width = window.innerWidth; canvas.height = window.innerHeight;
    const ctx = canvas.getContext('2d');
    const cols = [];
    const fontSize = 14;
    const colCount = Math.floor(canvas.width / fontSize);
    for (let i = 0; i < colCount; i++) cols[i] = Math.random() * canvas.height;
    const symbols = '01{}();=><+-*/[]#defclassreturnimport'.split('');
    let frame = 0; const maxFrames = 220;
    const draw = () => {
        if (frame++ > maxFrames) { ctx.clearRect(0, 0, canvas.width, canvas.height); return; }
        ctx.fillStyle = 'rgba(12,2,2,0.08)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.font = fontSize + 'px monospace';
        ctx.globalAlpha = Math.max(0, 1 - frame / maxFrames);
        cols.forEach((y, i) => {
            ctx.fillStyle = frame < 80 ? '#ff1744' : '#ff5252';
            ctx.fillText(symbols[Math.floor(Math.random() * symbols.length)], i * fontSize, y);
            if (y > canvas.height && Math.random() > 0.975) cols[i] = 0;
            else cols[i] = y + fontSize;
        });
        ctx.globalAlpha = 1;
        requestAnimationFrame(draw);
    };
    draw();
}

// ── Code Level Breakdown — injected into result screen ────
const _origForceEnd = window.forceEndScreen;
window.forceEndScreen = function() {
    _origForceEnd && _origForceEnd.call(this);
    setTimeout(_injectCodeBreakdown, 80);
};

function _injectCodeBreakdown() {
    const old = document.getElementById('code-level-breakdown');
    if (old) old.remove();
    if (currentCategory !== 'Coding') return;

    const wpm  = parseInt(document.getElementById('final-wpm')?.textContent || '0');
    const acc  = parseInt(document.getElementById('final-accuracy')?.textContent || '0');
    const lvl  = currentLevel;
    const diff = currentDiff;

    const grade = acc >= 98 ? 'S+' : acc >= 95 ? 'S' : acc >= 90 ? 'A' : acc >= 80 ? 'B' : acc >= 70 ? 'C' : 'D';
    const gradeColor = { 'S+':'#ff9800', S:'#ffd54f', A:'#69ff47', B:'#00f5ff', C:'#b388ff', D:'#ff5252' }[grade] || '#fff';

    const totalTyped = parseInt(document.getElementById('final-total-typed')?.textContent || '0');
    const codeBonus  = Math.round(totalTyped * 0.3);

    const targetWpm = Math.round(diff === 'Hard' ? 40 + lvl * 0.2 : diff === 'Normal' ? 25 + lvl * 0.15 : 15 + lvl * 0.1);
    const targetAcc = diff === 'Hard' ? 92 : diff === 'Normal' ? 88 : 82;

    let rankProgressHTML = '';
    try {
        if (typeof calculateRankStats === 'function') {
            const stats = calculateRankStats(getProg(currentMode, currentDiff), getWpmProg(currentMode, currentDiff), currentMode, currentDiff);
            rankProgressHTML = `
            <div style="margin-top:10px;border-top:1px solid rgba(255,255,255,0.06);padding-top:10px;">
                <div style="display:flex;justify-content:space-between;font-family:var(--font-main);font-size:0.75rem;color:rgba(255,255,255,0.4);margin-bottom:5px;">
                    <span>Rank: <b style="color:#ff5252;">${stats.rank?.name || '—'}</b></span>
                    <span>${stats.progress}% to next</span>
                </div>
                <div style="width:100%;height:6px;background:rgba(255,255,255,0.07);border-radius:4px;overflow:hidden;">
                    <div style="height:100%;width:${stats.progress}%;background:linear-gradient(90deg,#ff1744,#ff9800);border-radius:4px;transition:width 0.8s;"></div>
                </div>
            </div>`;
        }
    } catch(e) {}

    const div = document.createElement('div');
    div.id = 'code-level-breakdown';
    div.style.marginTop = '12px';
    div.innerHTML = `
    <div style="background:rgba(255,23,68,0.06);border:1px solid rgba(255,23,68,0.25);border-radius:12px;padding:14px;">
        <div style="font-family:var(--font-head);font-size:0.75rem;color:#ff5252;letter-spacing:0.06em;text-transform:uppercase;margin-bottom:10px;font-weight:700;">⌨ Code Level Breakdown</div>
        <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;margin-bottom:12px;">
            <div style="background:rgba(0,0,0,0.4);border-radius:10px;padding:10px;text-align:center;">
                <div style="font-family:var(--font-head);font-size:1.7rem;color:${gradeColor};font-weight:800;">${grade}</div>
                <div style="font-family:var(--font-main);font-size:0.62rem;color:rgba(255,255,255,0.3);text-transform:uppercase;letter-spacing:0.06em;margin-top:2px;">Grade</div>
            </div>
            <div style="background:rgba(0,0,0,0.4);border-radius:10px;padding:10px;text-align:center;">
                <div style="font-family:var(--font-head);font-size:1.7rem;color:#00f5ff;font-weight:700;">${wpm}</div>
                <div style="font-family:var(--font-main);font-size:0.62rem;color:rgba(255,255,255,0.3);text-transform:uppercase;letter-spacing:0.06em;margin-top:2px;">WPM</div>
            </div>
            <div style="background:rgba(0,0,0,0.4);border-radius:10px;padding:10px;text-align:center;">
                <div style="font-family:var(--font-head);font-size:1.7rem;color:#ff9800;font-weight:700;">+${codeBonus}</div>
                <div style="font-family:var(--font-main);font-size:0.62rem;color:rgba(255,255,255,0.3);text-transform:uppercase;letter-spacing:0.06em;margin-top:2px;">Char Bonus</div>
            </div>
        </div>
        <div style="border-top:1px solid rgba(255,255,255,0.06);padding-top:10px;">
            <div style="font-family:var(--font-main);font-size:0.78rem;color:rgba(255,255,255,0.45);margin-bottom:8px;">Level ${lvl} [${diff}] Standards</div>
            ${[
                { label:'Target WPM', target: targetWpm, actual: wpm, unit:'WPM', met: wpm >= targetWpm },
                { label:'Target Acc', target: targetAcc, actual: acc, unit:'%',   met: acc >= targetAcc },
            ].map(r => `<div style="display:flex;align-items:center;justify-content:space-between;padding:5px 0;border-bottom:1px solid rgba(255,255,255,0.04);">
                <span style="font-family:var(--font-main);font-size:0.78rem;color:rgba(255,255,255,0.45);">${r.label}</span>
                <span style="font-family:var(--font-main);font-size:0.78rem;">
                    <b style="color:${r.met ? '#69ff47' : '#ff5252'};">${r.actual}${r.unit}</b>
                    <span style="color:rgba(255,255,255,0.25);"> / ${r.target}${r.unit}</span>
                    <span style="margin-left:6px;">${r.met ? '✓' : '✗'}</span>
                </span>
            </div>`).join('')}
        </div>
        ${rankProgressHTML}
    </div>`;

    const returnBtn = document.getElementById('return-menu-btn');
    if (returnBtn) {
        returnBtn.parentNode.insertBefore(div, returnBtn);
    } else {
        const card = document.querySelector('.detailed-result-card');
        if (card) card.appendChild(div);
    }
}

console.log('[patches] Dock buttons, Code rank-up animation, Code breakdown — loaded.');