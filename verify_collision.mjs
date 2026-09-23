/**
 * verify_collision.mjs — Two windows, SAME login (same presence key).
 * Does each window still see both players, or does one vanish?
 */
import { createClient } from '@supabase/supabase-js';

const URL = 'https://hvukxajztizsuhfubjws.supabase.co';
const ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh2dWt4YWp6dGl6c3VoZnViandzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA4Mzc1MTAsImV4cCI6MjA5NjQxMzUxMH0.KqQRkmhuB_rFlzQ2N3NhSQrftmVZgGE3NUuVHYh3aYE';

const TOPIC = 'room:COLL' + Math.floor(Math.random() * 900 + 100);
const SAME_ID = 'same_google_account_id';

// App's current mapping logic (multiplayerService presence sync)
const mapPlayers = (state) => {
  const players = {};
  Object.entries(state).forEach(([key, presences]) => {
    if (presences && presences.length > 0) {
      const p = presences[0];
      players[key] = { id: p.id || key, name: p.name || 'Player' };
    }
  });
  return players;
};

const mk = () => createClient(URL, ANON).channel(TOPIC, {
  config: { broadcast: { self: true }, presence: { key: SAME_ID } },
});
const chA = mk();
const chB = mk();

const result = { A: null, B: null };
const waitFor = (ch, slot) => new Promise((resolve) => {
  const timer = setTimeout(() => resolve(), 12000);
  ch.on('presence', { event: 'sync' }, () => {
    const players = mapPlayers(ch.presenceState());
    if (Object.keys(players).length >= 1 && result[slot] === null) {
      // wait a beat for the second meta, then snapshot
      setTimeout(() => {
        if (result[slot] === null) {
          result[slot] = mapPlayers(ch.presenceState());
          clearTimeout(timer);
          resolve();
        }
      }, 2500);
    }
  });
});

const wA = waitFor(chA, 'A');
const wB = waitFor(chB, 'B');
chA.subscribe(async (s) => { if (s === 'SUBSCRIBED') await chA.track({ id: SAME_ID, name: 'WinA' }); });
chB.subscribe(async (s) => { if (s === 'SUBSCRIBED') await chB.track({ id: SAME_ID, name: 'WinB' }); });
await Promise.all([wA, wB]);
await new Promise((r) => setTimeout(r, 2000));

const nA = Object.keys(result.A || {}).length;
const nB = Object.keys(result.B || {}).length;
console.log(`topic: ${TOPIC}`);
console.log(`window A sees ${nA} player(s):`, JSON.stringify(result.A));
console.log(`window B sees ${nB} player(s):`, JSON.stringify(result.B));
console.log(nA === 1 && nB === 1
  ? 'COLLISION CONFIRMED: same login on 2 windows -> only 1 player visible (app bug)'
  : 'no collision: both windows see 2 entries');
process.exit(0);
