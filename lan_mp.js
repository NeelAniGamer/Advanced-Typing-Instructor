
let lanWs = null;

function createLanRoom() {
    let wsPort = null;
    
    // First, try to discover server via HTTP API (if we are in browser)
    fetch('/api/lan_discover').then(res => res.json()).then(data => {
        wsPort = data.ws_port;
        connectLanWs(wsPort, 'create_room');
    }).catch(e => {
        alert('Could not discover local typing server. Are you running main.py?');
    });
}

function showLanJoin() {
    let room = prompt('Enter 4-digit Room Code:');
    if (room) {
        fetch('/api/lan_discover').then(res => res.json()).then(data => {
            let wsPort = data.ws_port;
            connectLanWs(wsPort, 'join_room', room);
        }).catch(e => {
            alert('Could not discover local typing server.');
        });
    }
}

function connectLanWs(port, action, roomCode=null) {
    let host = window.location.hostname || '127.0.0.1';
    lanWs = new WebSocket(`ws://${host}:${port}`);
    
    lanWs.onopen = () => {
        let msg = { action: action, uid: 'user_'+Math.floor(Math.random()*1000), profile: {name: 'Player', wpm: 0} };
        if (roomCode) msg.room = roomCode;
        lanWs.send(JSON.stringify(msg));
    };
    
    lanWs.onmessage = (e) => {
        let data = JSON.parse(e.data);
        if (data.type === 'room_created') {
            alert('Room created! Code: ' + data.room);
            // Hide hub, show waiting room UI
            document.getElementById('mp-hub-modal').classList.add('hidden');
        } else if (data.type === 'joined') {
            alert('Joined room ' + data.room);
            document.getElementById('mp-hub-modal').classList.add('hidden');
        } else if (data.type === 'error') {
            alert('Error: ' + data.msg);
        } else if (data.type === 'state_update') {
            console.log('LAN State:', data.state);
        } else if (data.type === 'race_started') {
            alert('Race started! Text: ' + data.text);
        }
    };
}

function openGlobalMp() {
    document.getElementById('mp-hub-modal').classList.add('hidden');
    document.getElementById('mp-modal').classList.remove('hidden');
}

document.getElementById('open-multiplayer-hub-btn')?.addEventListener('click', () => {
    document.getElementById('mp-hub-modal').classList.remove('hidden');
});
