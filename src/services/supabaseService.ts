import { createClient, SupabaseClient, RealtimeChannel } from '@supabase/supabase-js';
import { UserProfile, PlayerSaveData } from '../types/game';

export const SUPABASE_URL =
  (import.meta as any)?.env?.VITE_SUPABASE_URL ||
  'https://hvukxajztizsuhfubjws.supabase.co';
export const SUPABASE_ANON_KEY =
  (import.meta as any)?.env?.VITE_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh2dWt4YWp6dGl6c3VoZnViandzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA4Mzc1MTAsImV4cCI6MjA5NjQxMzUxMH0.KqQRkmhuB_rFlzQ2N3NhSQrftmVZgGE3NUuVHYh3aYE';

export interface AtiUserProfile {
  id: string;
  username?: string;
  display_name?: string;
  email?: string;
  avatar: string;
  account_type: 'google' | 'local' | 'guest';
  level: number;
  rank: string;
  rank_color: string;
  best_wpm: number;
  avg_accuracy: number;
  races_played: number;
  races_won: number;
  created_at?: string;
  updated_at?: string;
}

export interface AtiUserProgress {
  user_id: string;
  level: number;
  unlocked_levels: number;
  emeralds: number;
  daily_streak: number;
  last_daily_reward_date?: string;
  completed_levels: any[];
  achievements: any[];
  inventory: any[];
  settings: Record<string, any>;
  backup_payload?: PlayerSaveData;
  checksum?: string;
  updated_at?: string;
}

export interface AtiMultiplayerRoom {
  code: string;
  host_id: string;
  host_name: string;
  mode: string;
  text: string;
  status: 'waiting' | 'racing' | 'finished';
  is_public: boolean;
  max_players: number;
  current_player_count: number;
  created_at?: string;
  expires_at?: string;
}

export interface AtiRaceResult {
  id?: string;
  room_code?: string;
  player_id: string;
  player_name: string;
  player_avatar: string;
  wpm: number;
  accuracy: number;
  placement: number;
  mode?: string;
  created_at?: string;
}

class SupabaseService {
  private client: SupabaseClient | null = null;
  private roomSubscriptionChannel: RealtimeChannel | null = null;

  constructor() {
    try {
      this.client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
        },
      });
    } catch (err) {
      console.warn('[SupabaseService] Client initialization failed:', err);
    }
  }

  public getClient(): SupabaseClient | null {
    return this.client;
  }

  public isAvailable(): boolean {
    return this.client !== null;
  }

  // ─────────────────────────────────────────────────────────────
  // 1. USER DATA SAFETY & CLOUD BACKUP
  // ─────────────────────────────────────────────────────────────

  /**
   * Generates a tamper-evident checksum for saved progress payload.
   */
  private generateChecksum(userId: string, data: PlayerSaveData): string {
    const raw = `${userId}:${data.level}:${data.unlockedLevels}:${data.emeralds}:${data.dailyStreak || 0}:${data.version}`;
    let hash = 0;
    for (let i = 0; i < raw.length; i++) {
      const chr = raw.charCodeAt(i);
      hash = (hash << 5) - hash + chr;
      hash |= 0;
    }
    return `ati_${Math.abs(hash).toString(16)}`;
  }

  /**
   * Synchronize typist profile and full game progress to Supabase cloud.
   */
  public async syncCloudProgress(
    profile: UserProfile,
    saveData: PlayerSaveData
  ): Promise<{ success: boolean; message: string; timestamp?: string }> {
    if (!this.client) {
      return { success: false, message: 'Supabase client unavailable' };
    }

    try {
      const now = new Date().toISOString();
      const checksum = this.generateChecksum(profile.id, saveData);

      // 1. Upsert Profile
      const { error: profileError } = await this.client
        .from('ati_user_profiles')
        .upsert(
          {
            id: profile.id,
            username: profile.username || null,
            display_name: profile.name,
            email: profile.email || null,
            avatar: profile.avatar || '👑',
            account_type: profile.account_type || (profile.email ? 'google' : profile.username ? 'local' : 'guest'),
            level: saveData.level || profile.level || 1,
            rank: profile.rank || 'Rubber Dome Typer Trainee I',
            rank_color: profile.rank_color || '#a1887f',
            best_wpm: profile.best_wpm || 0,
            avg_accuracy: 100,
            races_played: profile.races || 0,
            races_won: profile.wins || 0,
            updated_at: now,
          },
          { onConflict: 'id' }
        );

      if (profileError) {
        console.warn('[SupabaseService] Profile sync error:', profileError);
        return { success: false, message: `Profile sync failed: ${profileError.message}` };
      }

      // 2. Upsert Progress Data
      const { error: progressError } = await this.client
        .from('ati_user_progress')
        .upsert(
          {
            user_id: profile.id,
            level: saveData.level || 1,
            unlocked_levels: saveData.unlockedLevels || 1,
            emeralds: saveData.emeralds || 0,
            daily_streak: saveData.dailyStreak || 0,
            last_daily_reward_date: saveData.lastDailyRewardDate || null,
            completed_levels: saveData.completedLevels || [],
            achievements: saveData.achievements || [],
            inventory: saveData.inventory || [],
            settings: {
              keyboardLayout: saveData.keyboardLayout,
              uiTheme: saveData.uiTheme,
              masterVolume: saveData.masterVolume,
              keySoundStyle: saveData.keySoundStyle,
              customKeybinds: saveData.customKeybinds,
            },
            backup_payload: saveData,
            checksum,
            updated_at: now,
          },
          { onConflict: 'user_id' }
        );

      if (progressError) {
        console.warn('[SupabaseService] Progress sync error:', progressError);
        return { success: false, message: `Progress sync failed: ${progressError.message}` };
      }

      return {
        success: true,
        message: 'Successfully backed up to Supabase Cloud Shield.',
        timestamp: now,
      };
    } catch (err: any) {
      console.warn('[SupabaseService] Sync exception:', err);
      return { success: false, message: err?.message || 'Network error during cloud sync' };
    }
  }

  /**
   * Retrieve saved progress from Supabase Cloud.
   */
  public async fetchCloudProgress(
    userId: string
  ): Promise<{ success: boolean; data?: PlayerSaveData; profile?: Partial<UserProfile>; message: string }> {
    if (!this.client) {
      return { success: false, message: 'Supabase client unavailable' };
    }

    try {
      const [profileRes, progressRes] = await Promise.all([
        this.client.from('ati_user_profiles').select('*').eq('id', userId).maybeSingle(),
        this.client.from('ati_user_progress').select('*').eq('user_id', userId).maybeSingle(),
      ]);

      if (progressRes.error) {
        return { success: false, message: progressRes.error.message };
      }

      if (!progressRes.data) {
        return { success: false, message: 'No cloud backup found for this typist ID.' };
      }

      const row = progressRes.data;
      let loadedData: PlayerSaveData;

      if (row.backup_payload && typeof row.backup_payload === 'object') {
        loadedData = row.backup_payload as PlayerSaveData;
      } else {
        const profileUser = profileRes.data;
        const userObj: UserProfile = profileUser
          ? {
              id: profileUser.id,
              name: profileUser.display_name || profileUser.username || 'Champion Typer',
              avatar: profileUser.avatar || '👑',
              email: profileUser.email || undefined,
              username: profileUser.username || undefined,
              account_type: profileUser.account_type || 'guest',
              level: profileUser.level || 1,
              rank: profileUser.rank || 'Rubber Dome Typer Trainee I',
              rank_color: profileUser.rank_color || '#a1887f',
              best_wpm: profileUser.best_wpm || 0,
              races: profileUser.races_played || 0,
              wins: profileUser.races_won || 0,
              avg_acc: profileUser.avg_accuracy || 100,
            }
          : {
              id: userId,
              name: 'Champion Typer',
              avatar: '👑',
              level: row.level || 1,
              rank: 'Rubber Dome Typer Trainee I',
              rank_color: '#a1887f',
              races: 0,
              wins: 0,
              best_wpm: 0,
              avg_acc: 100,
              account_type: 'guest',
            };

        loadedData = {
          version: '3.0.0',
          timestamp: row.updated_at || new Date().toISOString(),
          user: userObj,
          level: row.level || 1,
          unlockedLevels: row.unlocked_levels || 1,
          emeralds: row.emeralds || 0,
          prestige: 0,
          switchProfile: 'cherry-blue',
          keyboardLayout: 'qwerty',
          dailyStreak: row.daily_streak || 0,
          lastDailyRewardDate: row.last_daily_reward_date,
          completedLevels: row.completed_levels || [],
          achievements: row.achievements || [],
          inventory: {},
          savedAt: row.updated_at || new Date().toISOString(),
        };
      }

      return {
        success: true,
        data: loadedData,
        profile: profileRes.data
          ? {
              id: profileRes.data.id,
              name: profileRes.data.display_name,
              avatar: profileRes.data.avatar,
              email: profileRes.data.email,
              username: profileRes.data.username,
              account_type: profileRes.data.account_type,
              level: profileRes.data.level,
              rank: profileRes.data.rank,
              rank_color: profileRes.data.rank_color,
              best_wpm: profileRes.data.best_wpm,
              races: profileRes.data.races_played,
              wins: profileRes.data.races_won,
            }
          : undefined,
        message: 'Cloud backup loaded successfully.',
      };
    } catch (err: any) {
      return { success: false, message: err?.message || 'Failed to query cloud progress' };
    }
  }

  /**
   * GDPR Right to Erasure: Permanently scrub all user records from Supabase tables.
   */
  public async deleteCloudAccount(userId: string): Promise<{ success: boolean; message: string }> {
    if (!this.client) {
      return { success: false, message: 'Supabase client unavailable' };
    }

    try {
      // 1. Scrub race results
      await this.client.from('ati_race_results').delete().eq('player_id', userId);

      // 2. Scrub user progress
      await this.client.from('ati_user_progress').delete().eq('user_id', userId);

      // 3. Scrub user profile (cascades any remaining FK references)
      const { error } = await this.client.from('ati_user_profiles').delete().eq('id', userId);

      if (error) {
        console.warn('[SupabaseService] Cloud account deletion error:', error);
        return { success: false, message: error.message };
      }

      return { success: true, message: 'Cloud records permanently purged from Supabase.' };
    } catch (err: any) {
      console.warn('[SupabaseService] Delete account exception:', err);
      return { success: false, message: err?.message || 'Error purging cloud account' };
    }
  }

  // ─────────────────────────────────────────────────────────────
  // 2. MULTIPLAYER ROOMS & REALTIME DISCOVERY
  // ─────────────────────────────────────────────────────────────

  /**
   * List active public multiplayer rooms that have not expired.
   */
  public async listPublicRooms(): Promise<AtiMultiplayerRoom[]> {
    if (!this.client) return [];

    try {
      const now = new Date().toISOString();
      const { data, error } = await this.client
        .from('ati_multiplayer_rooms')
        .select('*')
        .eq('is_public', true)
        .gt('expires_at', now)
        .order('created_at', { ascending: false })
        .limit(30);

      if (error) {
        console.warn('[SupabaseService] listPublicRooms error:', error);
        return [];
      }

      return data || [];
    } catch (err) {
      console.warn('[SupabaseService] listPublicRooms exception:', err);
      return [];
    }
  }

  /**
   * Create or register a multiplayer room in Supabase.
   * Returns null on success, or the server's error text on failure
   * (surfaced in the UI so silent phantom lobbies never happen).
   */
  public async createCloudRoom(room: AtiMultiplayerRoom): Promise<string | null> {
    if (!this.client) return 'Supabase client unavailable';

    try {
      const { error } = await this.client.from('ati_multiplayer_rooms').upsert(room, { onConflict: 'code' });
      if (error) {
        console.warn('[SupabaseService] createCloudRoom error:', error);
        return `${error.message}${error.code ? ` (${error.code})` : ''}`;
      }
      return null;
    } catch (err: any) {
      console.warn('[SupabaseService] createCloudRoom exception:', err);
      return err?.message || 'Network error';
    }
  }

  /**
   * Self-test: REST table access + realtime presence round-trip.
   * Returns human-readable lines for the Server settings modal.
   */
  public async connectionTest(timeoutMs = 12000): Promise<{ rest: string; realtime: string }> {
    if (!this.client) return { rest: 'FAILED: client unavailable', realtime: 'FAILED: client unavailable' };

    let rest: string;
    try {
      const { error } = await this.client.from('ati_multiplayer_rooms').select('code').limit(1);
      rest = error ? `FAILED: ${error.message}${error.code ? ` (${error.code})` : ''}` : 'OK: lobby table readable';
    } catch (err: any) {
      rest = `FAILED: ${err?.message || 'network error'}`;
    }

    let realtime: string;
    try {
      const probe = `probe:${Date.now().toString(36)}`;
      const ch = this.client.channel(probe, { config: { broadcast: { self: true }, presence: { key: probe } } });
      const seen = await new Promise<boolean>((resolve) => {
        const timer = setTimeout(() => resolve(false), timeoutMs);
        ch.on('presence', { event: 'sync' }, () => {
          if (Object.keys(ch.presenceState()).length >= 1) {
            clearTimeout(timer);
            resolve(true);
          }
        });
        ch.subscribe(async (status) => {
          if (status === 'SUBSCRIBED') {
            await ch.track({ probe: true });
          } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
            clearTimeout(timer);
            resolve(false);
          }
        });
      });
      try { await this.client.removeChannel(ch); } catch {}
      realtime = seen ? 'OK: realtime presence alive' : 'FAILED: no presence sync (offline or blocked)';
    } catch (err: any) {
      realtime = `FAILED: ${err?.message || 'network error'}`;
    }

    return { rest, realtime };
  }

  /**
   * Fetch single multiplayer room by code.
   */
  public async getCloudRoom(code: string): Promise<AtiMultiplayerRoom | null> {
    if (!this.client) return null;
    try {
      const { data, error } = await this.client
        .from('ati_multiplayer_rooms')
        .select('*')
        .eq('code', code.toUpperCase().trim())
        .maybeSingle();

      if (error || !data) return null;
      return data;
    } catch {
      return null;
    }
  }

  /**
   * Update room metadata (status, text, player count).
   */
  public async updateCloudRoom(code: string, updates: Partial<AtiMultiplayerRoom>): Promise<boolean> {
    if (!this.client) return false;

    try {
      const { error } = await this.client.from('ati_multiplayer_rooms').update(updates).eq('code', code);
      if (error) {
        console.warn('[SupabaseService] updateCloudRoom error:', error);
        return false;
      }
      return true;
    } catch (err) {
      return false;
    }
  }

  /**
   * Remove or close a multiplayer room when the race ends or host departs.
   */
  public async deleteCloudRoom(code: string): Promise<boolean> {
    if (!this.client) return false;

    try {
      const { error } = await this.client.from('ati_multiplayer_rooms').delete().eq('code', code);
      if (error) {
        console.warn('[SupabaseService] deleteCloudRoom error:', error);
        return false;
      }
      return true;
    } catch (err) {
      return false;
    }
  }

  /**
   * Subscribe to live postgres changes on ati_multiplayer_rooms for real-time lobby updates.
   */
  public subscribeToRooms(onChange: () => void): () => void {
    if (!this.client) return () => {};

    try {
      if (this.roomSubscriptionChannel) {
        this.client.removeChannel(this.roomSubscriptionChannel);
      }

      const channel = this.client
        .channel('public:ati_multiplayer_rooms')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'ati_multiplayer_rooms',
          },
          () => {
            onChange();
          }
        )
        .subscribe();

      this.roomSubscriptionChannel = channel;

      return () => {
        if (this.roomSubscriptionChannel && this.client) {
          this.client.removeChannel(this.roomSubscriptionChannel);
          this.roomSubscriptionChannel = null;
        }
      };
    } catch (err) {
      console.warn('[SupabaseService] subscribeToRooms exception:', err);
      return () => {};
    }
  }

  // ─────────────────────────────────────────────────────────────
  // 3. GLOBAL RACE LEADERBOARD & STATS
  // ─────────────────────────────────────────────────────────────

  /**
   * Record a completed race result to the global leaderboard.
   */
  public async recordRaceResult(result: Omit<AtiRaceResult, 'id' | 'created_at'>): Promise<boolean> {
    if (!this.client) return false;

    try {
      const { error } = await this.client.from('ati_race_results').insert(result);
      if (error) {
        console.warn('[SupabaseService] recordRaceResult error:', error);
        return false;
      }
      return true;
    } catch (err) {
      return false;
    }
  }

  /**
   * Fetch global top typing speed race records.
   */
  public async getGlobalLeaderboard(limit = 15): Promise<AtiRaceResult[]> {
    if (!this.client) return [];

    try {
      const { data, error } = await this.client
        .from('ati_race_results')
        .select('*')
        .order('wpm', { ascending: false })
        .order('accuracy', { ascending: false })
        .limit(limit);

      if (error) {
        console.warn('[SupabaseService] getGlobalLeaderboard error:', error);
        return [];
      }

      return data || [];
    } catch (err) {
      return [];
    }
  }
}

export const supabaseService = new SupabaseService();
