/**
 * verify_supabase.mjs — Live Supabase multiplayer test (same calls the app makes)
 * Usage: node verify_supabase.mjs
 * Exit 0 = all checks passed. Uses a TEST room code, cleaned up afterwards.
 */
import { createClient } from '@supabase/supabase-js';

const URL = process.env.VITE_SUPABASE_URL || 'https://hvukxajztizsuhfubjws.supabase.co';
const ANON = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh2dWt4YWp6dGl6c3VoZnViandzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA4Mzc1MTAsImV4cCI6MjA5NjQxMzUxMH0.KqQRkmhuB_rFlzQ2N3NhSQrftmVZgGE3NUuVHYh3aYE';

const sb = createClient(URL, ANON);
const TEST_CODE = 'TST' + Math.floor(Math.random() * 90 + 10);
let failures = 0;

function check(name, cond, extra = '') {
  console.log(`${cond ? '  [PASS]' : '  [FAIL]'} ${name}${extra && !cond ? ' — ' + extra : ''}`);
  if (!cond) failures++;
}

// ── 1. CREATE (what Host clicks) ──────────────────────────
console.log('[1] createCloudRoom (upsert ati_multiplayer_rooms)');
const room = {
  code: TEST_CODE,
  host_id: 'verify_host',
  host_name: 'VerifyHost',
  mode: 'race',
  text: 'Speed focus test.',
  status: 'waiting',
  is_public: true,
  max_players: 8,
  current_player_count: 1,
  created_at: new Date().toISOString(),
  expires_at: new Date(Date.now() + 7200000).toISOString(),
};
{
  const { error } = await sb.from('ati_multiplayer_rooms').upsert(room, { onConflict: 'code' });
  check('upsert room succeeds', !error, error?.message);
}

// ── 2. LIST (what Live Public Lobbies shows) ──────────────
console.log('[2] listPublicRooms (is_public + expires_at filter)');
{
  const now = new Date().toISOString();
  const { data, error } = await sb.from('ati_multiplayer_rooms')
    .select('*').eq('is_public', true).gt('expires_at', now)
    .order('created_at', { ascending: false }).limit(30);
  check('select succeeds', !error, error?.message);
  check('test room visible in public list', (data || []).some((r) => r.code === TEST_CODE),
    `got ${(data || []).length} rows`);
}

// ── 3. GET (what Join does) ───────────────────────────────
console.log('[3] getCloudRoom by code');
{
  const { data, error } = await sb.from('ati_multiplayer_rooms')
    .select('*').eq('code', TEST_CODE).maybeSingle();
  check('fetch succeeds', !error, error?.message);
  check('host_id matches', data?.host_id === 'verify_host', JSON.stringify(data)?.slice(0, 120));
}

// ── 4. PRESENCE (what Racers In Room shows) ───────────────
console.log('[4] presence: two clients must see EACH OTHER');
{
  const mk = (id, name) => {
    const c = createClient(URL, ANON);
    const ch = c.channel(`room:${TEST_CODE}`, {
      config: { broadcast: { self: true }, presence: { key: id } },
    });
    return { c, ch, id, name };
  };
  const A = mk('verify_host', 'VerifyHost');
  const B = mk('verify_guest', 'VerifyGuest');

  const waitSync = (peer, want, timeoutMs = 15000) => new Promise((resolve) => {
    let done = false;
    const timer = setTimeout(() => { if (!done) { done = true; resolve({ ok: false, size: -1 }); } }, timeoutMs);
    peer.ch.on('presence', { event: 'sync' }, () => {
      const n = Object.keys(peer.ch.presenceState()).length;
      if (!done && n >= want) { done = true; clearTimeout(timer); resolve({ ok: true, size: n }); }
    });
  });

  const pA = waitSync(A, 2);
  const pB = waitSync(B, 2);
  A.ch.subscribe(async (s) => {
    if (s === 'SUBSCRIBED') {
      await A.ch.track({ id: A.id, name: A.name, ready: true, progress: 0, wpm: 0 });
    }
  });
  B.ch.subscribe(async (s) => {
    if (s === 'SUBSCRIBED') {
      await B.ch.track({ id: B.id, name: B.name, ready: false, progress: 0, wpm: 0 });
    }
  });
  const [rA, rB] = await Promise.all([pA, pB]);
  check('host sees 2 presences', rA.ok, `saw ${rA.size}`);
  check('guest sees 2 presences', rB.ok, `saw ${rB.size}`);

  // Same-account collision check: two tabs, SAME presence key
  console.log('[4b] same-key collision (two windows, one login)');
  const C = mk('verify_same', 'SameOne');
  const D = mk('verify_same', 'SameTwo');
  const wC = waitSync(C, 2, 8000);
  const wD = waitSync(D, 2, 8000);
  C.ch.subscribe(async (s) => { if (s === 'SUBSCRIBED') await C.ch.track({ id: 'verify_same', name: 'Same' }); });
  D.ch.subscribe(async (s) => { if (s === 'SUBSCRIBED') await D.ch.track({ id: 'verify_same', name: 'Same' }); });
  const [rC, rD] = await Promise.all([wC, wD]);
  console.log(`      same-key view: C sees ${rC.size}, D sees ${rD.size} (2 = fine, 1 = collision hides a player)`);

  await sb.removeChannel(A.ch); await sb.removeChannel(B.ch);
  await sb.removeChannel(C.ch); await sb.removeChannel(D.ch);
}

// ── 5. BROADCAST (race start / progress) ──────────────────
console.log('[5] broadcast race_start reaches peer');
{
  const c1 = createClient(URL, ANON);
  const c2 = createClient(URL, ANON);
  const ch1 = c1.channel(`room:${TEST_CODE}b`, { config: { broadcast: { self: true } } });
  const ch2 = c2.channel(`room:${TEST_CODE}b`, { config: { broadcast: { self: true } } });
  const got = new Promise((resolve) => {
    const timer = setTimeout(() => resolve(null), 12000);
    ch2.on('broadcast', { event: 'race_start' }, ({ payload }) => {
      clearTimeout(timer); resolve(payload);
    });
  });
  ch1.subscribe(async (s) => {
    if (s === 'SUBSCRIBED') {
      await new Promise((r) => setTimeout(r, 1500)); // let peer subscribe
      ch1.send({ type: 'broadcast', event: 'race_start', payload: { text: 'go' } });
    }
  });
  ch2.subscribe();
  const payload = await got;
  check('peer received race_start', payload?.text === 'go');
  await sb.removeChannel(ch1); await sb.removeChannel(ch2);
}

// ── 6. CLEANUP ────────────────────────────────────────────
console.log('[6] cleanup test room');
{
  const { error } = await sb.from('ati_multiplayer_rooms').delete().eq('code', TEST_CODE);
  check('delete succeeds', !error, error?.message);
}

console.log(failures === 0 ? '\nALL SUPABASE CHECKS PASSED' : `\n${failures} CHECK(S) FAILED`);
process.exit(failures === 0 ? 0 : 1);
