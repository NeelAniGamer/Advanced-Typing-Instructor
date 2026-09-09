// ═══════════════════════════════════════════════════════════
//  GLOBAL MULTIPLAYER ENGINE — Firebase Firestore v2.5
//  Replaces multiplayer.js entirely.
//  Requires firebase_config.js loaded first (see SETUP_GUIDE.md)
// ═══════════════════════════════════════════════════════════

const MP = (() => {
    // ── Firebase refs (set after init) ─────────────────────
    let db   = null;
    let auth = null;

    // ── State ──────────────────────────────────────────────
    let currentRoomId   = null;
    let currentRoomCode = null;
    let isHost          = false;
    let raceActive      = false;
    let raceText        = '';
    let raceCharIndex   = 0;
    let raceStartTime   = null;
    let raceTimer       = null;
    let progressThrottle= null;

    // Firestore unsubscribe handles
    let unsubRoom     = null;
    let unsubPlayers  = null;
    let unsubChat     = null;
    let unsubRooms    = null;

    // Heartbeat
    let heartbeatInterval = null;

    // ── Wait for Firebase to be ready ─────────────────────
    function waitForFirebase(cb) {
        if (window._firebaseReady) { cb(); return; }
        document.addEventListener('firebase-ready', cb, { once: true });
    }

    // ── Helpers ────────────────────────────────────────────
    function uid()  { return auth?.currentUser?.uid  || ('anon_' + Math.random().toString(36).slice(2,10)); }
    function uname(){ return auth?.currentUser?.displayName || localStorage.getItem('mp_display_name') || 'Player'; }
    function uphoto(){ return auth?.currentUser?.photoURL || null; }

    function genCode() {
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
        return Array.from({length:5}, () => chars[Math.floor(Math.random()*chars.length)]).join('');
    }

    function escHtml(str) {
        return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
    }

    function showSection(id) {
        document.querySelectorAll('.mp-section').forEach(s => s.classList.add('hidden'));
        const el = document.getElementById(id);
        if (el) el.classList.remove('hidden');
    }

    function updateOnlineIndicator(online) {
        const dot   = document.getElementById('mp-connection-dot');
        const label = document.getElementById('mp-connection-label');
        if (dot)   dot.className   = 'mp-connection-dot ' + (online ? 'connected' : 'disconnected');
        if (label) label.textContent = online ? 'Online' : 'Connecting...';
    }

    // ── Initialise ─────────────────────────────────────────
    function init() {
        waitForFirebase(() => {
            db   = window._firebaseDB;
            auth = window._firebaseAuth;
            updateOnlineIndicator(true);
        });
    }

    // ── Create Room ────────────────────────────────────────
    async function createRoom() {
        if (!db) { showToast('Firebase not initialised. Check your config.', 'error', 4000); return; }
        const nameInput = document.getElementById('mp-player-name-input');
        const name = (nameInput?.value.trim() || uname()).slice(0, 20);
        localStorage.setItem('mp_display_name', name);

        const customText = document.getElementById('mp-custom-text')?.value.trim()
            || 'The quick brown fox jumps over the lazy dog. Speed and accuracy are the twin pillars of typing mastery.';
        const isPublic = document.getElementById('mp-public-toggle')?.checked ?? true;
        const mode = document.getElementById('mp-mode-select')?.value || 'race';

        let code = genCode();
        // Ensure unique code
        try {
            let snap = await db.collection('rooms').where('code','==',code).where('status','in',['waiting','racing']).get();
            while (!snap.empty) { code = genCode(); snap = await db.collection('rooms').where('code','==',code).where('status','in',['waiting','racing']).get(); }
        } catch(e) {}

        const roomRef = db.collection('rooms').doc();
        const myUid   = uid();

        await roomRef.set({
            code,
            hostId:    myUid,
            text:      customText,
            mode,
            status:    'waiting',
            isPublic,
            maxPlayers: 8,
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            startedAt: null,
            finishOrder: [],
        });

        await roomRef.collection('players').doc(myUid).set({
            uid: myUid, name, photoURL: uphoto(),
            progress: 0, wpm: 0, finished: false, rank: 0,
            ready: false,
            joinedAt: firebase.firestore.FieldValue.serverTimestamp(),
            heartbeat: firebase.firestore.FieldValue.serverTimestamp(),
        });

        currentRoomId   = roomRef.id;
        currentRoomCode = code;
        isHost          = true;

        subscribeRoom(roomRef.id);
        subscribeChat(roomRef.id);
        startHeartbeat(roomRef.id, myUid);

        document.getElementById('mp-room-code-display').textContent = code;
        document.getElementById('mp-host-ip-display').textContent   = 'Share this code with friends!';
        updateHostControls();
        showSection('mp-waiting-room');
        showToast(`Room ${code} created! Share the code.`, 'success', 3000);
    }

    // ── Join Room ──────────────────────────────────────────
    async function joinRoom(codeOverride) {
        if (!db) { showToast('Firebase not initialised.', 'error'); return; }
        const code = (codeOverride || document.getElementById('mp-join-code-input')?.value.trim() || '').toUpperCase();
        if (!code || code.length < 4) { showToast('Enter a valid room code.', 'error'); return; }

        const nameInput = document.getElementById('mp-player-name-input');
        const name = (nameInput?.value.trim() || uname()).slice(0, 20);
        localStorage.setItem('mp_display_name', name);

        let snap;
        try {
            snap = await db.collection('rooms').where('code','==',code).where('status','in',['waiting']).limit(1).get();
        } catch(e) { showToast('Connection error. Try again.','error'); return; }

        if (snap.empty) { showToast(`Room "${code}" not found or race already started.`, 'error'); return; }

        const roomDoc  = snap.docs[0];
        const roomData = roomDoc.data();
        const myUid    = uid();

        const players = await roomDoc.ref.collection('players').get();
        if (players.size >= (roomData.maxPlayers || 8)) { showToast('Room is full!', 'error'); return; }

        await roomDoc.ref.collection('players').doc(myUid).set({
            uid: myUid, name, photoURL: uphoto(),
            progress: 0, wpm: 0, finished: false, rank: 0,
            ready: false,
            joinedAt: firebase.firestore.FieldValue.serverTimestamp(),
            heartbeat: firebase.firestore.FieldValue.serverTimestamp(),
        });

        currentRoomId   = roomDoc.id;
        currentRoomCode = code;
        isHost          = (roomData.hostId === myUid);

        subscribeRoom(roomDoc.id);
        subscribeChat(roomDoc.id);
        startHeartbeat(roomDoc.id, myUid);

        document.getElementById('mp-room-code-display').textContent = code;
        document.getElementById('mp-host-ip-display').textContent   = '';
        updateHostControls();
        showSection('mp-waiting-room');
        showToast(`Joined room ${code}!`, 'success', 2000);
    }

    // ── Leave Room ─────────────────────────────────────────
    async function leaveRoom() {
        stopAllListeners();
        clearInterval(heartbeatInterval);
        if (db && currentRoomId) {
            try {
                const myUid = uid();
                await db.collection('rooms').doc(currentRoomId).collection('players').doc(myUid).delete();
                // If host left, promote next player
                const roomRef = db.collection('rooms').doc(currentRoomId);
                const roomDoc = await roomRef.get();
                if (roomDoc.exists && roomDoc.data().hostId === myUid) {
                    const remaining = await roomRef.collection('players').limit(1).get();
                    if (!remaining.empty) {
                        await roomRef.update({ hostId: remaining.docs[0].id });
                    } else {
                        await roomRef.update({ status: 'closed' });
                    }
                }
            } catch(e) {}
        }
        currentRoomId = null; currentRoomCode = null; isHost = false; raceActive = false;
        clearInterval(raceTimer);
        showSection('mp-lobby');
        loadPublicRooms();
    }

    // ── Ready toggle ───────────────────────────────────────
    async function setReady(ready) {
        if (!db || !currentRoomId) return;
        await db.collection('rooms').doc(currentRoomId)
                .collection('players').doc(uid())
                .update({ ready });
    }

    // ── Start Race (host only) ─────────────────────────────
    async function startRace() {
        if (!db || !currentRoomId || !isHost) return;
        const roomRef = db.collection('rooms').doc(currentRoomId);

        // Countdown: write status each second
        await roomRef.update({ status: 'countdown', countdownVal: 3, startedAt: firebase.firestore.FieldValue.serverTimestamp() });

        let count = 3;
        const tick = async () => {
            await roomRef.update({ countdownVal: count });
            count--;
            if (count >= 0) setTimeout(tick, 1000);
            else await roomRef.update({ status: 'racing', countdownVal: 0 });
        };
        setTimeout(tick, 0);
    }

    // ── Subscriptions ──────────────────────────────────────
    function subscribeRoom(roomId) {
        unsubRoom && unsubRoom();
        unsubRoom = db.collection('rooms').doc(roomId).onSnapshot(snap => {
            if (!snap.exists) return;
            const data = snap.data();
            onRoomUpdate(data);
        }, err => console.warn('[MP] room listen error:', err));

        unsubPlayers && unsubPlayers();
        unsubPlayers = db.collection('rooms').doc(roomId).collection('players')
            .onSnapshot(snap => {
                const players = {};
                snap.docs.forEach(d => { players[d.id] = d.data(); });
                onPlayersUpdate(players);
            }, err => console.warn('[MP] players listen error:', err));
    }

    function subscribeChat(roomId) {
        unsubChat && unsubChat();
        const cutoff = new Date();
        unsubChat = db.collection('rooms').doc(roomId).collection('chat')
            .orderBy('ts').startAfter(cutoff)
            .onSnapshot(snap => {
                snap.docChanges().forEach(change => {
                    if (change.type === 'added') {
                        const d = change.doc.data();
                        appendChat(d.name, d.text, d.ts?.seconds || Date.now()/1000);
                    }
                });
            }, err => console.warn('[MP] chat listen error:', err));
    }

    function stopAllListeners() {
        unsubRoom && unsubRoom(); unsubRoom = null;
        unsubPlayers && unsubPlayers(); unsubPlayers = null;
        unsubChat && unsubChat(); unsubChat = null;
        unsubRooms && unsubRooms(); unsubRooms = null;
    }

    // ── Room update handler ────────────────────────────────
    let lastStatus = null;
    function onRoomUpdate(data) {
        if (!data) return;

        if (data.status === 'countdown' && lastStatus !== 'countdown') {
            showSection('mp-countdown');
        }
        if (data.status === 'countdown' && data.countdownVal > 0) {
            const el = document.getElementById('mp-countdown-number');
            if (el) {
                el.textContent = data.countdownVal;
                el.style.animation = 'none';
                void el.offsetWidth;
                el.style.animation = 'countdownPop 0.9s ease forwards';
            }
            playBeep(data.countdownVal === 1 ? 880 : 440);
        }
        if (data.status === 'racing' && lastStatus !== 'racing') {
            raceText      = data.text || '';
            raceActive    = true;
            raceCharIndex = 0;
            raceStartTime = Date.now();
            showSection('mp-race');
            initRaceUI(raceText);
            showToast('🏁 Race started!', 'success', 1500);
            startProgressTimer();
        }
        if (data.status === 'closed') {
            stopAllListeners(); clearInterval(heartbeatInterval);
            showToast('Room was closed by the host.', 'error', 3000);
            showSection('mp-lobby'); loadPublicRooms();
        }
        lastStatus = data.status;
    }

    // ── Players update handler ─────────────────────────────
    let _renderedPlayers = {};
    function onPlayersUpdate(players) {
        _renderedPlayers = players;
        const myUid = uid();

        // Waiting room player list
        if (!raceActive) {
            renderPlayerList(players);
            const count = Object.keys(players).length;
            const startBtn = document.getElementById('mp-start-race-btn');
            if (startBtn) startBtn.disabled = count < 2;
        } else {
            // Race lanes
            updateRaceLanes(players);
            // Check if all finished
            const all = Object.values(players);
            if (all.length > 0 && all.every(p => p.finished)) {
                onRaceOver(all);
            }
        }
    }

    // ── Progress reporting ─────────────────────────────────
    function startProgressTimer() {
        clearInterval(raceTimer);
        raceTimer = setInterval(async () => {
            if (!raceActive || !db || !currentRoomId) return;
            const elapsed = (Date.now() - raceStartTime) / 60000;
            const wpm = elapsed > 0 ? Math.round((raceCharIndex / 5) / elapsed) : 0;
            const progress = raceText.length > 0 ? Math.round((raceCharIndex / raceText.length) * 100) : 0;
            const wpmEl = document.getElementById('mp-live-wpm');
            if (wpmEl) wpmEl.textContent = wpm + ' WPM';
            // Throttle Firestore writes to ~2/s
            clearTimeout(progressThrottle);
            progressThrottle = setTimeout(async () => {
                try {
                    await db.collection('rooms').doc(currentRoomId)
                            .collection('players').doc(uid())
                            .update({ progress, wpm, heartbeat: firebase.firestore.FieldValue.serverTimestamp() });
                } catch(e) {}
            }, 400);
        }, 500);
    }

    // ── Race UI ────────────────────────────────────────────
    function initRaceUI(text) {
        const textEl = document.getElementById('mp-race-text');
        if (!textEl) return;
        textEl.innerHTML = '';
        text.split('').forEach(ch => {
            const span = document.createElement('span');
            span.textContent = ch;
            textEl.appendChild(span);
        });
        const spans = textEl.querySelectorAll('span');
        if (spans[0]) spans[0].classList.add('active');
        // Clear lanes
        const lanesEl = document.getElementById('mp-race-lanes');
        if (lanesEl) lanesEl.innerHTML = '';

        const input = document.getElementById('mp-race-input');
        if (input) { input.value = ''; input.disabled = false; input.focus(); }
    }

    function handleRaceInput() {
        if (!raceActive) return;
        const textEl = document.getElementById('mp-race-text');
        const input  = document.getElementById('mp-race-input');
        if (!textEl || !input) return;
        const chars = textEl.querySelectorAll('span');
        const typedChar = input.value[raceCharIndex];
        if (typedChar === undefined) return;

        // Feed the same heatmap the solo game uses, so multiplayer races
        // count toward weak-key detection instead of being a silo of their
        // own that contributes nothing to adaptive practice.
        const expectedChar = chars[raceCharIndex].textContent;
        if (typeof flashKey === 'function') flashKey(typedChar, typedChar === expectedChar);

        if (typedChar === expectedChar) {
            chars[raceCharIndex].classList.remove('active');
            chars[raceCharIndex].classList.add('correct');
            raceCharIndex++;
            if (raceCharIndex < chars.length) {
                chars[raceCharIndex].classList.add('active');
            } else {
                finishRace();
            }
        } else {
            chars[raceCharIndex].classList.add('mp-incorrect-flash');
            setTimeout(() => chars[raceCharIndex]?.classList.remove('mp-incorrect-flash'), 200);
        }
    }

    async function finishRace() {
        if (!raceActive) return;
        raceActive = false;
        clearInterval(raceTimer);
        const elapsed = (Date.now() - raceStartTime) / 60000;
        const wpm     = Math.round((raceText.length / 5) / elapsed);
        const myUid   = uid();

        const input = document.getElementById('mp-race-input');
        if (input) input.disabled = true;

        // Declared here (not inside the block below) so it's still in
        // scope for the quest-progress check further down.
        let finalRank = 1;

        // Atomic rank assignment via transaction
        if (db && currentRoomId) {
            const roomRef = db.collection('rooms').doc(currentRoomId);
            await db.runTransaction(async t => {
                const roomDoc = await t.get(roomRef);
                const order   = roomDoc.data().finishOrder || [];
                finalRank     = order.length + 1;
                t.update(roomRef, { finishOrder: firebase.firestore.FieldValue.arrayUnion(myUid) });
            });
            await roomRef.collection('players').doc(myUid).update({
                finished: true, rank: finalRank, wpm,
                finishedAt: firebase.firestore.FieldValue.serverTimestamp(),
            });
        }

        const medals = ['🥇','🥈','🥉'];
        const medal  = medals[0] || '#1';
        showToast(`You finished! ${wpm} WPM 🎉`, 'success', 3000);
        if (typeof Achievements !== 'undefined') {
            Achievements.check({ mpRace: true, mpWin: true }); // optimistic — actual rank checked server-side
        }
        // Update global user stats
        updateGlobalStats({ lastRaceWpm: wpm, racesFinished: 1 });

        // Feed the multiplayer quests (Finish/Win a race) — see
        // updateMultiplayerQuestProgress in script.js for why this
        // bypasses the usual Literature/Code category gate.
        if (typeof updateMultiplayerQuestProgress === 'function') {
            updateMultiplayerQuestProgress('d_mp1', 1);
            updateMultiplayerQuestProgress('wk_mp5', 1);
            if (finalRank === 1) {
                updateMultiplayerQuestProgress('wk_mpw2', 1);
                updateMultiplayerQuestProgress('ch_mp10', 1);
            }
        }
    }

    // ── Race over ──────────────────────────────────────────
    function onRaceOver(players) {
        clearInterval(raceTimer);
        const sorted = [...players].sort((a,b) => (a.rank||99)-(b.rank||99));
        showSection('mp-podium');
        renderPodium(sorted);
        if (typeof triggerConfetti === 'function') triggerConfetti(4000);
        if (typeof SFX !== 'undefined') SFX.playWin();
    }

    // ── Lanes ──────────────────────────────────────────────
    function updateRaceLanes(players) {
        const lanesEl = document.getElementById('mp-race-lanes');
        if (!lanesEl) return;
        const myUid = uid();
        Object.values(players).forEach(p => {
            const laneId = 'mp-lane-' + (p.uid||'?');
            let lane = document.getElementById(laneId);
            if (!lane) {
                lane = document.createElement('div');
                lane.id = laneId;
                lane.className = 'mp-race-lane' + (p.uid === myUid ? ' mp-lane-self' : '');
                lane.innerHTML = `
                    <div class="mp-lane-header">
                        ${p.photoURL ? `<img class="mp-lane-avatar" src="${escHtml(p.photoURL)}" alt="">` : `<div class="mp-lane-avatar-letter">${escHtml((p.name||'?').charAt(0).toUpperCase())}</div>`}
                        <span class="mp-lane-name">${escHtml(p.name||'?')}${p.uid===myUid?' <span style="color:var(--primary);font-size:0.7rem;">(you)</span>':''}</span>
                        <span class="mp-lane-wpm">${p.wpm||0} WPM</span>
                        <span class="mp-lane-finish-badge"></span>
                    </div>
                    <div class="mp-lane-track">
                        <div class="mp-lane-car" style="left:0%">🏎</div>
                        <div class="mp-lane-bar" style="width:0%"></div>
                    </div>`;
                lanesEl.appendChild(lane);
            }
            lane.querySelector('.mp-lane-bar').style.width  = (p.progress||0) + '%';
            lane.querySelector('.mp-lane-car').style.left   = Math.max(0,(p.progress||0)-3) + '%';
            lane.querySelector('.mp-lane-wpm').textContent  = (p.wpm||0) + ' WPM';
            const badge = lane.querySelector('.mp-lane-finish-badge');
            if (p.finished && badge) {
                const medals = ['🥇','🥈','🥉'];
                badge.textContent = medals[(p.rank||1)-1] || '#'+(p.rank||'?');
                lane.classList.add('mp-lane-finished');
            }
        });
    }

    // ── Player list (waiting room) ────────────────────────
    function renderPlayerList(players) {
        const el = document.getElementById('mp-player-list');
        if (!el) return;
        const myUid = uid();
        el.innerHTML = Object.values(players).map(p => `
            <div class="mp-player-row ${p.ready?'mp-player-ready':''}">
                ${p.photoURL
                    ? `<img class="mp-player-google-avatar" src="${escHtml(p.photoURL)}" alt="">`
                    : `<div class="mp-player-avatar">${escHtml((p.name||'?').charAt(0).toUpperCase())}</div>`}
                <span class="mp-player-name">${escHtml(p.name||'?')}</span>
                <span class="mp-ready-badge ${p.ready?'ready':'not-ready'}">${p.ready?'READY':'WAITING'}</span>
                ${isHost && p.uid !== myUid
                    ? `<button class="mp-kick-btn" onclick="MP.kickPlayer('${escHtml(p.uid)}')">✕</button>`
                    : ''}
            </div>`).join('');
    }

    // ── Podium ────────────────────────────────────────────
    function renderPodium(sorted) {
        const el = document.getElementById('mp-podium-list');
        if (!el) return;
        const medals = ['🥇','🥈','🥉'];
        el.innerHTML = sorted.map((p,i) => `
            <div class="mp-podium-row ${i===0?'mp-podium-gold':i===1?'mp-podium-silver':i===2?'mp-podium-bronze':''}">
                <span class="mp-podium-medal">${medals[i]||'#'+(i+1)}</span>
                ${p.photoURL ? `<img class="mp-podium-avatar" src="${escHtml(p.photoURL)}" alt="">` : `<div class="mp-podium-avatar-letter">${escHtml((p.name||'?').charAt(0))}</div>`}
                <span class="mp-podium-name">${escHtml(p.name||'?')}</span>
                <span class="mp-podium-wpm">${p.wpm||0} WPM</span>
            </div>`).join('');
    }

    // ── Chat ──────────────────────────────────────────────
    function appendChat(sender, text, tsSeconds) {
        const logs = document.querySelectorAll('.mp-chat-log');
        const time = new Date(tsSeconds*1000).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'});
        logs.forEach(el => {
            const div = document.createElement('div');
            div.className = 'mp-chat-line';
            div.innerHTML = `<span class="mp-chat-time">${time}</span> <span class="mp-chat-sender">${escHtml(sender)}:</span> <span class="mp-chat-text">${escHtml(text)}</span>`;
            el.appendChild(div);
            el.scrollTop = el.scrollHeight;
        });
    }

    async function sendChat() {
        const inputs = ['mp-chat-input','mp-race-chat-input'];
        let text = '';
        for (const id of inputs) {
            const el = document.getElementById(id);
            if (el && el.value.trim()) { text = el.value.trim().slice(0,200); el.value = ''; break; }
        }
        if (!text || !db || !currentRoomId) return;
        await db.collection('rooms').doc(currentRoomId).collection('chat').add({
            uid:  uid(),
            name: uname(),
            text,
            ts:   firebase.firestore.FieldValue.serverTimestamp(),
        });
    }

    // ── Public room browser ───────────────────────────────
    function loadPublicRooms() {
        if (!db) return;
        unsubRooms && unsubRooms();
        unsubRooms = db.collection('rooms')
            .where('isPublic','==',true)
            .where('status','in',['waiting'])
            .orderBy('createdAt','desc')
            .limit(20)
            .onSnapshot(snap => {
                const rooms = snap.docs.map(d => ({id:d.id,...d.data()}));
                renderPublicRooms(rooms);
            }, () => {
                renderPublicRooms([]);
            });
    }

    function renderPublicRooms(rooms) {
        const el = document.getElementById('mp-public-rooms');
        if (!el) return;
        if (!rooms.length) {
            el.innerHTML = '<div class="mp-empty-state">No open rooms right now. Be the first to create one!</div>';
            return;
        }
        el.innerHTML = rooms.map(r => `
            <div class="mp-room-row">
                <span class="mp-room-code-badge">${escHtml(r.code||'?')}</span>
                <span class="mp-room-mode">${escHtml(r.mode||'race')}</span>
                <span class="mp-room-players" style="margin-left:auto;">${r.playerCount||'?'} players</span>
                <span class="mp-room-status open">Open</span>
                <button class="mp-join-quick-btn" onclick="MP.quickJoin('${escHtml(r.code)}')">Join</button>
            </div>`).join('');
    }

    // ── Kick player (host only) ────────────────────────────
    async function kickPlayer(targetUid) {
        if (!isHost || !db || !currentRoomId) return;
        try {
            await db.collection('rooms').doc(currentRoomId).collection('players').doc(targetUid).delete();
            showToast('Player removed.', 'info', 1500);
        } catch(e) {}
    }

    // ── Host controls ──────────────────────────────────────
    function updateHostControls() {
        const panel    = document.getElementById('mp-host-panel');
        const startBtn = document.getElementById('mp-start-race-btn');
        if (panel)    panel.style.display    = isHost ? 'block' : 'none';
        if (startBtn) startBtn.style.display = isHost ? 'block' : 'none';
    }

    // ── Heartbeat (presence) ───────────────────────────────
    function startHeartbeat(roomId, playerId) {
        clearInterval(heartbeatInterval);
        heartbeatInterval = setInterval(async () => {
            if (!db) return;
            try {
                await db.collection('rooms').doc(roomId).collection('players').doc(playerId)
                        .update({ heartbeat: firebase.firestore.FieldValue.serverTimestamp() });
            } catch(e) { clearInterval(heartbeatInterval); }
        }, 15000);
    }

    // ── Global user stats (cloud save) ─────────────────────
    async function updateGlobalStats(delta) {
        if (!db || !auth?.currentUser) return;
        const userRef = db.collection('users').doc(auth.currentUser.uid);
        const updates = { lastSeen: firebase.firestore.FieldValue.serverTimestamp() };
        if (delta.lastRaceWpm)   updates.bestWpm      = firebase.firestore.FieldValue.increment(0); // handled below
        if (delta.racesFinished) updates.totalRaces   = firebase.firestore.FieldValue.increment(1);
        try {
            const doc = await userRef.get();
            if (!doc.exists) {
                // A short, shareable code (last 6 of the UID, uppercased)
                // so friends can find each other without exposing email —
                // same idea as the multiplayer room codes.
                const playerCode = auth.currentUser.uid.slice(-6).toUpperCase();
                await userRef.set({ displayName: auth.currentUser.displayName, email: auth.currentUser.email, photoURL: auth.currentUser.photoURL, totalRaces:0, wins:0, bestWpm:0, playerCode, friends: [], createdAt: firebase.firestore.FieldValue.serverTimestamp(), ...updates });
            } else {
                const existing = doc.data();
                if (delta.lastRaceWpm && delta.lastRaceWpm > (existing.bestWpm||0)) {
                    updates.bestWpm = delta.lastRaceWpm;
                }
                if (!existing.playerCode) updates.playerCode = auth.currentUser.uid.slice(-6).toUpperCase();
                await userRef.update(updates);
            }
        } catch(e) {}
    }

    // ── Global leaderboard (Phase 7 — was called from script.js as
    //    GoogleAuth.loadGlobalLeaderboard, which was never actually
    //    defined anywhere; that call silently did nothing and the
    //    leaderboard stayed blank for every signed-in user. Implemented
    //    here since this module already holds the real db reference. ──
    async function loadGlobalLeaderboard(sortField) {
        const el = document.getElementById('global-lb-list');
        if (!el || !db) return;
        try {
            const snap = await db.collection('users').orderBy(sortField || 'bestWpm', 'desc').limit(20).get();
            if (snap.empty) {
                el.innerHTML = '<div style="text-align:center;padding:24px;color:rgba(255,255,255,0.25);font-family:var(--font-code);font-size:0.85rem;">No global scores yet — be the first!</div>';
                return;
            }
            let i = 0;
            el.innerHTML = snap.docs.map(d => {
                const u = d.data(); const rank = i++;
                const medal = rank===0?'🥇':rank===1?'🥈':rank===2?'🥉':'#'+(rank+1);
                const color = rank===0?'#ffd54f':rank===1?'#b0bec5':rank===2?'#a1887f':'rgba(255,255,255,0.4)';
                return `<div style="display:flex;align-items:center;gap:12px;background:rgba(0,0,0,0.35);border:1px solid rgba(255,255,255,0.07);border-radius:10px;padding:10px 14px;">
                    <span style="font-family:var(--font-head);font-size:1.1rem;color:${color};">${medal}</span>
                    <span style="flex:1;font-family:var(--font-main);font-weight:600;">${u.displayName || 'Player'}</span>
                    <span style="font-family:var(--font-main);color:var(--primary);font-weight:700;">${u.bestWpm||0} WPM</span>
                    <span style="font-family:var(--font-code);font-size:0.8rem;color:rgba(255,255,255,0.4);">${u.wins||0} wins</span>
                </div>`;
            }).join('');
        } catch(e) {
            el.innerHTML = '<div style="text-align:center;padding:24px;color:rgba(255,255,255,0.3);font-family:var(--font-code);font-size:0.82rem;">Couldn\'t load rankings right now.</div>';
        }
    }

    // ── Friends (Phase 7) ──────────────────────────────────
    // Friend codes are the same short-code idea as room codes — no email
    // exposed, easy to read out loud or paste into a chat.
    async function addFriendByCode(code) {
        if (!db || !auth?.currentUser) { showToast('Sign in with Google to add friends.', 'error'); return; }
        const cleanCode = (code || '').trim().toUpperCase();
        if (!cleanCode) return;
        try {
            const snap = await db.collection('users').where('playerCode', '==', cleanCode).limit(1).get();
            if (snap.empty) { showToast('No player found with that code.', 'error'); return; }
            const friendDoc = snap.docs[0];
            if (friendDoc.id === auth.currentUser.uid) { showToast("That's your own code!", 'error'); return; }
            await db.collection('users').doc(auth.currentUser.uid).update({
                friends: firebase.firestore.FieldValue.arrayUnion(friendDoc.id)
            });
            showToast(`Added ${friendDoc.data().displayName || 'Player'} as a friend!`, 'success');
            loadFriends();
        } catch(e) {
            showToast('Could not add friend right now.', 'error');
        }
    }

    async function loadFriends() {
        const el = document.getElementById('friends-list');
        if (!el) return;
        if (!db || !auth?.currentUser) {
            el.innerHTML = '<div style="text-align:center;padding:20px;color:rgba(255,255,255,0.25);font-family:var(--font-code);font-size:0.82rem;">Sign in with Google to add friends and compare stats.</div>';
            return;
        }
        el.innerHTML = '<div style="text-align:center;padding:20px;color:rgba(255,255,255,0.3);font-family:var(--font-code);font-size:0.8rem;">Loading friends...</div>';
        try {
            const meDoc = await db.collection('users').doc(auth.currentUser.uid).get();
            const me = meDoc.exists ? meDoc.data() : { bestWpm: 0, playerCode: '------' };
            const codeDisplay = document.getElementById('my-friend-code');
            if (codeDisplay) codeDisplay.textContent = me.playerCode || '------';

            const friendIds = (me.friends || []).slice(0, 30);
            if (!friendIds.length) {
                el.innerHTML = '<div style="text-align:center;padding:20px;color:rgba(255,255,255,0.25);font-family:var(--font-code);font-size:0.82rem;">No friends added yet — share your code above!</div>';
                return;
            }
            const friendDocs = await Promise.all(friendIds.map(id => db.collection('users').doc(id).get()));
            const rows = friendDocs.filter(d => d.exists).map(d => {
                const f = d.data();
                const diff = (f.bestWpm||0) - (me.bestWpm||0);
                const diffLabel = diff > 0 ? `<span style="color:#ff8a80;">+${diff} ahead of you</span>` : diff < 0 ? `<span style="color:#69f0ae;">${Math.abs(diff)} behind you</span>` : `<span style="color:rgba(255,255,255,0.4);">tied with you</span>`;
                return `<div style="display:flex;align-items:center;gap:12px;background:rgba(0,0,0,0.3);border:1px solid rgba(255,255,255,0.08);border-radius:10px;padding:10px 14px;">
                    <span style="flex:1;font-family:var(--font-main);font-weight:600;">${f.displayName || 'Player'}</span>
                    <span style="font-family:var(--font-main);color:var(--primary);font-weight:700;">${f.bestWpm||0} WPM</span>
                    <span style="font-family:var(--font-code);font-size:0.76rem;">${diffLabel}</span>
                </div>`;
            }).join('');
            el.innerHTML = rows || '<div style="text-align:center;padding:20px;color:rgba(255,255,255,0.25);font-family:var(--font-code);font-size:0.82rem;">No friends found.</div>';
        } catch(e) {
            el.innerHTML = '<div style="text-align:center;padding:20px;color:rgba(255,255,255,0.3);font-family:var(--font-code);font-size:0.82rem;">Couldn\'t load friends right now.</div>';
        }
    }

    // ── Challenge message (Phase 7) — the practical version of a
    //    "shareable link" for a desktop app with no public URL scheme:
    //    a copyable text blurb with the room code, ready to paste into
    //    any chat app. ──
    function copyChallengeMessage() {
        if (!currentRoomCode) { showToast('Create or join a room first.', 'error'); return; }
        const msg = `Race me in Advanced Typing Instructor! Join with room code: ${currentRoomCode}`;
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(msg)
                .then(() => showToast('Challenge message copied!', 'success'))
                .catch(() => showToast(`Room code: ${currentRoomCode} (copy failed — clipboard blocked)`, 'info', 5000));
        } else {
            showToast(`Room code: ${currentRoomCode} (copy it to share)`, 'info', 5000);
        }
    }

    // ── SFX helper ─────────────────────────────────────────
    function playBeep(freq) {
        try {
            const ctx = window.audioCtx || new AudioContext();
            const osc = ctx.createOscillator(); const g = ctx.createGain();
            osc.type = 'sine'; osc.frequency.value = freq;
            g.gain.setValueAtTime(0.2, ctx.currentTime);
            g.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime+0.3);
            osc.connect(g); g.connect(ctx.destination); osc.start(); osc.stop(ctx.currentTime+0.3);
        } catch(e) {}
    }

    // ── Public API ─────────────────────────────────────────
    return {
        init,
        async openLobby() {
            const modal = document.getElementById('mp-modal');
            if (modal) modal.classList.remove('hidden');
            // Pre-fill name from Google account or local name
            const nameInput = document.getElementById('mp-player-name-input');
            if (nameInput) {
                nameInput.value = auth?.currentUser?.displayName
                    || localStorage.getItem('mp_display_name')
                    || (typeof getCurrentAccount==='function' ? getCurrentAccount()?.name : null)
                    || 'Player';
            }
            showSection('mp-lobby');
            if (!db) {
                // Try to init
                waitForFirebase(() => {
                    db = window._firebaseDB;
                    auth = window._firebaseAuth;
                    updateOnlineIndicator(true);
                    loadPublicRooms();
                });
            } else {
                updateOnlineIndicator(true);
                loadPublicRooms();
            }
        },
        closeLobby() {
            const modal = document.getElementById('mp-modal');
            if (modal) modal.classList.add('hidden');
        },
        createRoom,
        joinRoom: () => joinRoom(),
        quickJoin: (code) => joinRoom(code),
        leaveRoom,
        startRace,
        setReady,
        kickPlayer,
        sendChat,
        handleRaceInput,
        finishRace,
        refreshRooms: loadPublicRooms,
        spectate: () => showToast('Spectate mode coming soon!', 'info'),
        isConnected: () => !!db,
        isInRoom:    () => !!currentRoomId,
        getRoom:     () => currentRoomCode,
        loadGlobalLeaderboard,
        addFriendByCode,
        loadFriends,
        copyChallengeMessage,
    };
})();

// Auto-init when Firebase ready
document.addEventListener('firebase-ready', () => MP.init());
