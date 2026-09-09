/**
 * Advanced Typing Instructor (ATI v2.5) — Standalone Multiplayer Relay Server
 * ============================================================================
 * Host this on your website, domain, VPS, or free cloud (Render, Railway, Fly.io, Glitch).
 *
 * Requirements:
 *   npm install ws
 *
 * Run:
 *   node multiplayer_server.js
 *
 * Environment Variables:
 *   PORT (default: 8765 or process.env.PORT)
 */

const http = require('http');
const { WebSocketServer, WebSocket } = require('ws');

const PORT = process.env.PORT || 8765;

// In-Memory State
const rooms = new Map();   // roomCode -> Room Object
const clients = new Map(); // ws -> { roomCode, playerId, name, avatar, level, rank, rank_color, best_wpm, races_won }

function generateRoomCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 5; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return rooms.has(code) ? generateRoomCode() : code;
}

// Create HTTP server for health checks
const server = http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json');

  if (req.url === '/health' || req.url === '/') {
    let totalPlayers = 0;
    rooms.forEach((r) => { totalPlayers += Object.keys(r.players).length; });

    res.writeHead(200);
    res.end(JSON.stringify({
      name: 'Advanced Typing Instructor Multiplayer Server',
      status: 'online',
      version: '2.5.0',
      active_rooms: rooms.size,
      connected_players: totalPlayers,
      timestamp: new Date().toISOString(),
    }));
  } else {
    res.writeHead(404);
    res.end(JSON.stringify({ error: 'Not Found' }));
  }
});

// Attach WebSocket Server
const wss = new WebSocketServer({ server });

function send(ws, data) {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(data));
  }
}

function broadcastToRoom(roomCode, data, excludeWs = null) {
  const room = rooms.get(roomCode);
  if (!room) return;

  room.sockets.forEach((clientWs) => {
    if (clientWs !== excludeWs && clientWs.readyState === WebSocket.OPEN) {
      send(clientWs, data);
    }
  });
}

function broadcastRoomState(roomCode) {
  const room = rooms.get(roomCode);
  if (!room) return;

  broadcastToRoom(roomCode, {
    type: 'room_state',
    code: roomCode,
    host: room.host,
    mode: room.mode,
    started: room.started,
    finished: room.finished,
    players: room.players,
    text: room.text,
  });
}

wss.on('connection', (ws) => {
  const playerId = 'p_' + Math.random().toString(36).slice(2, 9);
  clients.set(ws, {
    roomCode: null,
    playerId,
    name: 'Player',
    avatar: '👑',
    level: 1,
    rank: 'Novice',
    rank_color: '#00f5ff',
    best_wpm: 0,
    races_won: 0,
  });

  send(ws, { type: 'connected', id: playerId });

  ws.on('message', (raw) => {
    try {
      const msg = JSON.parse(raw.toString());
      const client = clients.get(ws);
      if (!client) return;

      const { type } = msg;

      // 1. CREATE ROOM
      if (type === 'create_room') {
        const code = generateRoomCode();
        client.name = msg.name || 'Host';
        client.avatar = msg.avatar || '👑';
        client.level = msg.level || 1;
        client.rank = msg.rank || 'Novice';
        client.rank_color = msg.rank_color || '#00f5ff';
        client.best_wpm = msg.best_wpm || 0;
        client.races_won = msg.races_won || 0;
        client.roomCode = code;

        const newRoom = {
          code,
          host: client.playerId,
          mode: msg.mode || 'race',
          text: msg.text || 'Speed and velocity define true keyboard mastery.',
          started: false,
          finished: false,
          podium: [],
          sockets: new Set([ws]),
          players: {
            [client.playerId]: {
              id: client.playerId,
              name: client.name,
              avatar: client.avatar,
              level: client.level,
              rank: client.rank,
              rank_color: client.rank_color,
              best_wpm: client.best_wpm,
              races_won: client.races_won,
              progress: 0,
              wpm: 0,
              ready: true,
              finished: false,
            }
          }
        };

        rooms.set(code, newRoom);
        send(ws, {
          type: 'room_created',
          code,
          mode: newRoom.mode,
          text: newRoom.text,
          host: client.playerId,
        });
        broadcastRoomState(code);
      }

      // 2. JOIN ROOM
      else if (type === 'join_room') {
        const code = (msg.code || '').toUpperCase().trim();
        const room = rooms.get(code);

        if (!room) {
          send(ws, { type: 'error', msg: `Room "${code}" not found.` });
          return;
        }

        if (room.started) {
          send(ws, { type: 'error', msg: 'Race has already started.' });
          return;
        }

        client.name = msg.name || 'Racer';
        client.avatar = msg.avatar || '⚡';
        client.level = msg.level || 1;
        client.rank = msg.rank || 'Novice';
        client.rank_color = msg.rank_color || '#00f5ff';
        client.best_wpm = msg.best_wpm || 0;
        client.races_won = msg.races_won || 0;
        client.roomCode = code;

        room.sockets.add(ws);
        room.players[client.playerId] = {
          id: client.playerId,
          name: client.name,
          avatar: client.avatar,
          level: client.level,
          rank: client.rank,
          rank_color: client.rank_color,
          best_wpm: client.best_wpm,
          races_won: client.races_won,
          progress: 0,
          wpm: 0,
          ready: false,
          finished: false,
        };

        send(ws, {
          type: 'room_joined',
          code,
          host: room.host,
          mode: room.mode,
          text: room.text,
        });
        broadcastRoomState(code);
      }

      // 3. TOGGLE READY
      else if (type === 'ready') {
        const room = rooms.get(client.roomCode);
        if (room && room.players[client.playerId]) {
          room.players[client.playerId].ready = Boolean(msg.ready);
          broadcastRoomState(client.roomCode);
        }
      }

      // 4. START RACE (Countdown)
      else if (type === 'start_race') {
        const room = rooms.get(client.roomCode);
        if (room && room.host === client.playerId && !room.started) {
          room.started = true;
          room.finished = false;
          room.podium = [];

          // Broadcast 3-second countdown
          let countdown = 3;
          broadcastToRoom(client.roomCode, { type: 'race_countdown', count: countdown });

          const timer = setInterval(() => {
            countdown -= 1;
            if (countdown > 0) {
              broadcastToRoom(client.roomCode, { type: 'race_countdown', count: countdown });
            } else {
              clearInterval(timer);
              broadcastToRoom(client.roomCode, { type: 'race_start' });
            }
          }, 1000);
        }
      }

      // 5. PROGRESS UPDATE
      else if (type === 'progress') {
        const room = rooms.get(client.roomCode);
        if (room && room.players[client.playerId]) {
          const player = room.players[client.playerId];
          player.progress = Math.min(100, Math.max(0, msg.progress || 0));
          player.wpm = msg.wpm || 0;

          broadcastToRoom(client.roomCode, {
            type: 'progress_update',
            players: {
              [client.playerId]: player,
            }
          });
        }
      }

      // 6. FINISH RACE
      else if (type === 'finish') {
        const room = rooms.get(client.roomCode);
        if (room && room.players[client.playerId]) {
          const player = room.players[client.playerId];
          if (!player.finished) {
            player.finished = true;
            player.progress = 100;
            player.wpm = msg.wpm || player.wpm;

            room.podium.push({
              name: player.name,
              avatar: player.avatar,
              rank: player.rank,
              rank_color: player.rank_color,
              wpm: player.wpm,
            });

            // Check if all finished
            const allFinished = Object.values(room.players).every((p) => p.finished);
            if (allFinished || room.podium.length >= Object.keys(room.players).length) {
              room.finished = true;
              broadcastToRoom(client.roomCode, {
                type: 'race_over',
                podium: room.podium,
              });
            }
          }
        }
      }

      // 7. CHAT
      else if (type === 'chat') {
        const room = rooms.get(client.roomCode);
        if (room && msg.text) {
          broadcastToRoom(client.roomCode, {
            type: 'chat',
            sender: client.name,
            avatar: client.avatar,
            text: msg.text.slice(0, 200),
            ts: Date.now(),
          });
        }
      }

      // 8. LEAVE ROOM
      else if (type === 'leave_room') {
        handleDisconnect(ws);
      }

      // 9. PING / PONG
      else if (type === 'ping') {
        send(ws, { type: 'pong', ts: Date.now() });
      }

    } catch (err) {
      console.error('[Multiplayer Server Error]', err);
    }
  });

  ws.on('close', () => {
    handleDisconnect(ws);
  });
});

function handleDisconnect(ws) {
  const client = clients.get(ws);
  if (!client) return;

  const { roomCode, playerId } = client;
  if (roomCode && rooms.has(roomCode)) {
    const room = rooms.get(roomCode);
    delete room.players[playerId];
    room.sockets.delete(ws);

    if (room.sockets.size === 0) {
      rooms.delete(roomCode);
      console.log(`[Room ${roomCode}] Closed (no players).`);
    } else {
      if (room.host === playerId) {
        // Assign new host
        room.host = Object.keys(room.players)[0];
      }
      broadcastRoomState(roomCode);
    }
  }

  clients.delete(ws);
}

server.listen(PORT, () => {
  console.log(`===================================================`);
  console.log(` ATI 2.5 Standalone Multiplayer Server`);
  console.log(` Running on port: ${PORT}`);
  console.log(` Health check URL: http://localhost:${PORT}/health`);
  console.log(` WebSocket URL:    ws://localhost:${PORT}`);
  console.log(`===================================================`);
});
