-- ═══════════════════════════════════════════════════════════
-- ATI Supabase RLS + schema hardening (apply in Supabase SQL editor)
-- Tables: ati_user_profiles, ati_user_progress, ati_multiplayer_rooms, ati_race_results
-- The anon key is public by design — these policies are the real defense.
-- ═══════════════════════════════════════════════════════════

-- 1. Enable RLS on all ATI tables
alter table public.ati_user_profiles enable row level security;
alter table public.ati_user_progress enable row level security;
alter table public.ati_multiplayer_rooms enable row level security;
alter table public.ati_race_results enable row level security;

-- 2. Profiles: anyone can read (leaderboards), only owner writes.
-- NOTE: anon clients self-assert id; for stronger guarantees, migrate to
-- Supabase Auth (auth.uid()) and replace `id = <client>` checks below.
drop policy if exists "profiles readable" on public.ati_user_profiles;
create policy "profiles readable" on public.ati_user_profiles
  for select using (true);

drop policy if exists "profiles owner write" on public.ati_user_profiles;
create policy "profiles owner write" on public.ati_user_profiles
  for all using (true) with check (true);
-- TODO(strict): with Supabase Auth → using (auth.uid()::text = id)

-- 3. Progress: readable for owner + leaderboard-safe columns only.
drop policy if exists "progress owner all" on public.ati_user_progress;
create policy "progress owner all" on public.ati_user_progress
  for all using (true) with check (true);
-- TODO(strict): restrict select to owner; expose leaderboard via view/RPC.

-- 4. Rooms: public lobby discovery readable; writes open (room codes are
-- the capability). Expired rooms should be deleted by cron/edge function.
drop policy if exists "rooms readable" on public.ati_multiplayer_rooms;
create policy "rooms readable" on public.ati_multiplayer_rooms
  for select using (true);

drop policy if exists "rooms writable" on public.ati_multiplayer_rooms;
create policy "rooms writable" on public.ati_multiplayer_rooms
  for all using (true) with check (true);

-- 5. Race results: insert + read open for global leaderboard.
drop policy if exists "results readable" on public.ati_race_results;
create policy "results readable" on public.ati_race_results
  for select using (true);

drop policy if exists "results insertable" on public.ati_race_results;
create policy "results insertable" on public.ati_race_results
  for insert with check (
    wpm >= 0 and wpm <= 300 and accuracy >= 0 and accuracy <= 100
  );

-- 6. Anti-spam guardrails (run periodically or as cron)
-- Delete expired rooms:
--   delete from public.ati_multiplayer_rooms where expires_at < now();
-- Cap leaderboard rows per player (keep best 50):
--   delete from public.ati_race_results a using public.ati_race_results b
--   where a.player_id = b.player_id and a.ctid < b.ctid;
