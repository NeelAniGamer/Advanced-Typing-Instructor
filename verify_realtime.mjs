/**
 * verify_realtime.mjs — Does postgres_changes fire for ati_multiplayer_rooms?
 * The lobby browser depends on it to auto-refresh. If it never fires,
 * the second window never sees a new lobby until manual Refresh.
 */
import { createClient } from '@supabase/supabase-js';

const URL = 'https://hvukxajztizsuhfubjws.supabase.co';
const ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh2dWt4YWp6dGl6c3VoZnViandzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA4Mzc1MTAsImV4cCI6MjA5NjQxMzUxMH0.KqQRkmhuB_rFlzQ2N3NhSQrftmVZgGE3NUuVHYh3aYE';

const sb = createClient(URL, ANON);
const CODE = 'RT' + Math.floor(Math.random() * 90 + 10);

let fired = 0;
const ch = sb.channel('public:ati_multiplayer_rooms')
  .on('postgres_changes', { event: '*', schema: 'public', table: 'ati_multiplayer_rooms' }, () => { fired++; })
  .subscribe();

await new Promise((r) => setTimeout(r, 3000)); // let subscription establish

const now = new Date().toISOString();
await sb.from('ati_multiplayer_rooms').upsert({
  code: CODE, host_id: 'rt', host_name: 'RT', mode: 'race', text: 'rt',
  status: 'waiting', is_public: true, max_players: 8, current_player_count: 1,
  created_at: now, expires_at: new Date(Date.now() + 3600000).toISOString(),
}, { onConflict: 'code' });

await new Promise((r) => setTimeout(r, 5000)); // wait for realtime event
await sb.from('ati_multiplayer_rooms').delete().eq('code', CODE);
await sb.removeChannel(ch);

console.log(`postgres_changes events received: ${fired}`);
console.log(fired > 0 ? 'REALTIME OK' : 'REALTIME MISSING — table likely not in supabase_realtime publication');
process.exit(fired > 0 ? 0 : 2);
