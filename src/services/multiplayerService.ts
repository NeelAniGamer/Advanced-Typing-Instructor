import { createClient, SupabaseClient, RealtimeChannel } from '@supabase/supabase-js';
import { MultiplayerRoom, MultiplayerPlayer, UserProfile } from '../types/game';
import { supabaseService } from './supabaseService';

type MessageHandler = (data: any) => void;
export type MultiplayerProvider = 'supabase' | 'local';

export const SUPABASE_CONFIG = {
  url: (import.meta as any)?.env?.VITE_SUPABASE_URL || 'https://hvukxajztizsuhfubjws.supabase.co',
  anonKey: (import.meta as any)?.env?.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh2dWt4YWp6dGl6c3VoZnViandzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA4Mzc1MTAsImV4cCI6MjA5NjQxMzUxMH0.KqQRkmhuB_rFlzQ2N3NhSQrftmVZgGE3NUuVHYh3aYE',
  siteUrl: 'https://advancedlogiclabs.dpdns.org',
};

class MultiplayerService {
  private ws: WebSocket | null = null;
  private handlers: Set<MessageHandler> = new Set();
  private wsPort: number = 0;

  // Supabase State
  private supabase: SupabaseClient | null = null;
  private currentChannel: RealtimeChannel | null = null;
  private currentRoomCode: string | null = null;
  private currentProfile: UserProfile | null = null;
  private currentHostId: string | null = null;
  private currentPresenceKey: string | null = null;
  private isHost: boolean = false;
  private roomPodium: any[] = [];
  private roomText: string = '';

  constructor() {
    try {
      this.supabase = createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.anonKey);
    } catch (e) {
      console.warn('[Multiplayer] Supabase client init failed', e);
    }
  }

  public getProvider(): MultiplayerProvider {
    const saved = localStorage.getItem('mp_provider');
    if (saved === 'local' || saved === 'supabase') return saved;
    return 'supabase';
  }

  public setProvider(provider: MultiplayerProvider) {
    localStorage.setItem('mp_provider', provider);
  }

  public getServerUrl(): string {
    return localStorage.getItem('mp_server_url') || SUPABASE_CONFIG.siteUrl;
  }

  public setServerUrl(url: string) {
    if (url.trim()) {
      localStorage.setItem('mp_server_url', url.trim());
    } else {
      localStorage.removeItem('mp_server_url');
    }
  }

  public async getWsPort(): Promise<number> {
    if (this.wsPort > 0) return this.wsPort;
    try {
      const resp = await fetch('/api/ws_port');
      if (resp.ok) {
        const data = await resp.json();
        this.wsPort = data.port || 0;
        return this.wsPort;
      }
    } catch {
      // Fallback
    }
    return 0;
  }

  public normalizeServerUrl(rawUrl: string): string {
    let url = rawUrl.trim();
    if (!url) return '';
    if (url.startsWith('https://')) {
      url = 'wss://' + url.slice(8);
    } else if (url.startsWith('http://')) {
      url = 'ws://' + url.slice(7);
    } else if (!url.startsWith('ws://') && !url.startsWith('wss://')) {
      if (url.includes('localhost') || url.match(/^127\.|^192\.168\.|^10\./)) {
        url = 'ws://' + url;
      } else {
        url = 'wss://' + url;
      }
    }
    return url;
  }

  public subscribe(handler: MessageHandler) {
    this.handlers.add(handler);
    return () => this.handlers.delete(handler);
  }

  private emit(data: any) {
    this.handlers.forEach((h) => h(data));
  }

  // ─────────────────────────────────────────────────────────────
  // CONNECTION LOGIC
  // ─────────────────────────────────────────────────────────────
  public async connect(overrideUrl?: string): Promise<boolean> {
    const provider = this.getProvider();

    if (provider === 'supabase' && this.supabase) {
      console.log('[Multiplayer] Active provider: Supabase Realtime Cloud');
      return true;
    }

    // WebSocket connection (Custom Site or Local)
    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      return true;
    }

    let targetUrl = overrideUrl
      ? this.normalizeServerUrl(overrideUrl)
      : this.normalizeServerUrl(this.getServerUrl());

    if (!targetUrl || provider === 'local') {
      const port = await this.getWsPort();
      if (!port) {
        console.warn('[Multiplayer] No local WebSocket port available.');
        return false;
      }
      targetUrl = `ws://127.0.0.1:${port}`;
    }

    return new Promise((resolve) => {
      try {
        console.log('[Multiplayer] Connecting via WebSocket to:', targetUrl);
        this.ws = new WebSocket(targetUrl);

        this.ws.onopen = () => {
          console.log('[Multiplayer] Connected to WebSocket at', targetUrl);
          resolve(true);
        };

        this.ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            this.emit(data);
          } catch (e) {
            console.error('[Multiplayer] Parse error', e);
          }
        };

        this.ws.onerror = (e) => {
          console.warn('[Multiplayer] Error', e);
          resolve(false);
        };

        this.ws.onclose = () => {
          console.log('[Multiplayer] Disconnected');
          this.emit({ type: 'disconnected' });
        };
      } catch {
        resolve(false);
      }
    });
  }

  // ─────────────────────────────────────────────────────────────
  // ROOM ACTIONS (SUPABASE + WS HYBRID)
  // ─────────────────────────────────────────────────────────────
  public async createRoom(profile: UserProfile, mode: string = 'race', text?: string, isPublic: boolean = true) {
    const provider = this.getProvider();

    if (provider === 'supabase' && this.supabase) {
      this.currentProfile = profile;
      this.isHost = true;
      this.roomPodium = [];
      this.roomText = text || 'Speed, focus, and velocity merge into pure keyboard instinct.';

      // Generate 5-character room code
      const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
      let code = '';
      for (let i = 0; i < 5; i++) {
        code += chars[Math.floor(Math.random() * chars.length)];
      }
      this.currentRoomCode = code;
      this.currentHostId = profile.id;

      const registered: string | null = await supabaseService.createCloudRoom({
        code,
        host_id: profile.id,
        host_name: profile.name,
        mode,
        text: this.roomText,
        status: 'waiting',
        is_public: isPublic,
        max_players: 8,
        current_player_count: 1,
        created_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 7200000).toISOString(),
      }).catch((e: any) => (e?.message || 'Network error') as string);

      if (registered !== null) {
        // Never emit room_created for a phantom lobby no one can discover.
        // Include the server's own message so the cause is visible, not a guess.
        this.emit({
          type: 'room_error',
          msg: `Lobby registration failed: ${registered.slice(0, 160)}`,
        });
        return;
      }

      await this.joinSupabaseChannel(code, profile, true);

      this.emit({
        type: 'room_created',
        code,
        mode,
        text: this.roomText,
        host: profile.id,
      });
      return;
    }

    // WebSocket fallback
    this.send({
      type: 'create_room',
      name: profile.name,
      avatar: profile.avatar,
      level: profile.level,
      rank: profile.rank,
      rank_color: profile.rank_color,
      best_wpm: profile.best_wpm,
      races_won: profile.wins,
      mode,
      text,
      is_public: isPublic,
    });
  }

  public async joinRoom(code: string, profile: UserProfile) {
    const provider = this.getProvider();
    const cleanCode = code.toUpperCase().trim();

    if (provider === 'supabase' && this.supabase) {
      this.currentProfile = profile;
      this.isHost = false;
      this.currentRoomCode = cleanCode;
      this.roomPodium = [];

      // Fix: increment player count from server truth instead of hardcoding 2
      // (3rd/4th joiners previously corrupted the lobby count).
      const roomData = await supabaseService.getCloudRoom(cleanCode);
      const nextCount = Math.min(
        (roomData?.max_players ?? 8),
        (roomData?.current_player_count ?? 1) + 1,
      );
      await supabaseService.updateCloudRoom(cleanCode, {
        current_player_count: nextCount,
      });

      if (roomData?.text) {
        this.roomText = roomData.text;
      }
      this.currentHostId = roomData?.host_id || null;

      await this.joinSupabaseChannel(cleanCode, profile, false);

      this.emit({
        type: 'room_joined',
        code: cleanCode,
        host: roomData?.host_id || 'remote',
        mode: roomData?.mode || 'race',
        text: this.roomText || 'The race is about to begin. Type swiftly and accurately!',
      });
      return;
    }

    // WebSocket fallback
    this.send({
      type: 'join_room',
      code: cleanCode,
      name: profile.name,
      avatar: profile.avatar,
      level: profile.level,
      rank: profile.rank,
      rank_color: profile.rank_color,
      best_wpm: profile.best_wpm,
      races_won: profile.wins,
    });
  }

  private async joinSupabaseChannel(code: string, profile: UserProfile, isHost: boolean) {
    if (!this.supabase) return;

    if (this.currentChannel) {
      await this.supabase.removeChannel(this.currentChannel);
    }

    // Unique presence key per WINDOW, not per account. Two windows logged
    // into the same account must appear as two racers — keying by profile.id
    // collapses them into one entry and each window sees only itself.
    // The payload `id` stays profile.id so YOU/host detection keeps working.
    const sessionKey = `${profile.id}:${Math.random().toString(36).slice(2, 8)}`;
    this.currentPresenceKey = sessionKey;

    const channel = this.supabase.channel(`room:${code}`, {
      config: {
        broadcast: { self: true },
        presence: { key: sessionKey },
      },
    });

    // 1. Presence Sync (tracks all players joining/leaving)
    channel.on('presence', { event: 'sync' }, () => {
      const state = channel.presenceState();
      const players: Record<string, MultiplayerPlayer> = {};

      Object.entries(state).forEach(([key, presences]: [string, any]) => {
        if (presences && presences.length > 0) {
          const p = presences[0];
          players[key] = {
            id: p.id || key,
            name: p.name || 'Player',
            avatar: p.avatar || '👑',
            level: p.level || 1,
            rank: p.rank || 'Novice',
            rank_color: p.rank_color || '#00f5ff',
            best_wpm: p.best_wpm || 0,
            // Tracked profiles carry `wins`, not `races_won` — map it so the
            // lobby cards never zero out a player's win count.
            races_won: p.races_won ?? p.wins ?? 0,
            progress: p.progress || 0,
            wpm: p.wpm || 0,
            ready: Boolean(p.ready),
            finished: Boolean(p.finished),
          };
        }
      });

      // Host id must survive presence re-syncs, otherwise joiners lose the
      // crown icon and host actions. Late joiners also miss the one-shot
      // room_sync broadcast, so the host re-announces on every sync.
      if (isHost) {
        this.currentHostId = profile.id;
      }

      this.emit({
        type: 'room_state',
        code,
        host: this.currentHostId || (isHost ? profile.id : 'remote'),
        mode: 'race',
        started: false,
        finished: false,
        players,
        text: this.roomText,
      });

      if (isHost) {
        channel.send({
          type: 'broadcast',
          event: 'room_sync',
          payload: {
            host: profile.id,
            mode: 'race',
            text: this.roomText,
            started: false,
          },
        });
      }
    });

    // 2. Broadcast listeners
    channel.on('broadcast', { event: 'race_countdown' }, ({ payload }) => {
      this.emit({ type: 'countdown', count: payload.count });
      this.emit({ type: 'race_countdown', count: payload.count });
    });

    channel.on('broadcast', { event: 'race_start' }, ({ payload }) => {
      if (payload?.text) this.roomText = payload.text;
      this.emit({ type: 'race_start', text: payload?.text || this.roomText });
    });

    channel.on('broadcast', { event: 'progress_update' }, ({ payload }) => {
      this.emit({ type: 'progress_update', players: payload.players });
    });

    channel.on('broadcast', { event: 'race_over' }, ({ payload }) => {
      // Fix: merge podiums from all finishers (dedupe by player id/name)
      // instead of replacing. Previously each finisher broadcast only its
      // local single-entry podium, so clients disagreed on standings.
      const incoming: any[] = Array.isArray(payload?.podium) ? payload.podium : [];
      const seen = new Set(this.roomPodium.map((r: any) => r.player_id ?? r.name));
      for (const r of incoming) {
        const key = (r as any).player_id ?? (r as any).name;
        if (!seen.has(key)) {
          seen.add(key);
          this.roomPodium.push(r);
        }
      }
      this.emit({ type: 'race_over', podium: [...this.roomPodium] });
    });

    channel.on('broadcast', { event: 'chat' }, ({ payload }) => {
      this.emit({
        type: 'chat',
        sender: payload.sender,
        avatar: payload.avatar,
        text: payload.text,
        ts: payload.ts,
      });
    });

    channel.on('broadcast', { event: 'room_sync' }, ({ payload }) => {
      if (payload.text) this.roomText = payload.text;
      if (payload.host) this.currentHostId = payload.host;
      this.emit({
        type: 'room_state',
        code,
        host: payload.host,
        mode: payload.mode || 'race',
        started: payload.started,
        text: payload.text,
        players: payload.players || {},
      });
    });

    // Subscribe and track presence
    channel.subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        await channel.track({
          id: profile.id,
          name: profile.name,
          avatar: profile.avatar,
          level: profile.level,
          rank: profile.rank,
          rank_color: profile.rank_color,
          best_wpm: profile.best_wpm,
          races_won: profile.wins,
          progress: 0,
          wpm: 0,
          ready: isHost,
          finished: false,
        });

        if (isHost && this.roomText) {
          channel.send({
            type: 'broadcast',
            event: 'room_sync',
            payload: {
              host: profile.id,
              mode: 'race',
              text: this.roomText,
              started: false,
            },
          });
        }
      }
    });

    this.currentChannel = channel;
  }

  public sendReady(ready: boolean) {
    if (this.currentChannel && this.currentProfile) {
      this.currentChannel.track({
        ...this.currentProfile,
        ready,
        progress: 0,
        wpm: 0,
      });
      // Broadcast ready update immediately to all peers in the room
      this.currentChannel.send({
        type: 'broadcast',
        event: 'progress_update',
        payload: {
          players: {
            [this.currentProfile.id]: {
              ...this.currentProfile,
              ready,
              progress: 0,
              wpm: 0,
            }
          }
        }
      });
      return;
    }
    this.send({ type: 'ready', ready });
  }

  public startRace() {
    if (this.currentChannel) {
      if (this.currentRoomCode) {
        supabaseService.updateCloudRoom(this.currentRoomCode, { status: 'racing' });
      }

      let count = 3;
      this.currentChannel.send({
        type: 'broadcast',
        event: 'race_countdown',
        payload: { count },
      });

      const timer = setInterval(() => {
        count -= 1;
        if (count > 0) {
          this.currentChannel?.send({
            type: 'broadcast',
            event: 'race_countdown',
            payload: { count },
          });
        } else {
          clearInterval(timer);
          this.currentChannel?.send({
            type: 'broadcast',
            event: 'race_start',
            payload: { text: this.roomText },
          });
        }
      }, 1000);
      return;
    }
    this.send({ type: 'start_race' });
  }

  public sendProgress(progress: number, wpm: number) {
    if (this.currentChannel && this.currentProfile) {
      this.currentChannel.send({
        type: 'broadcast',
        event: 'progress_update',
        payload: {
          players: {
            [this.currentProfile.id]: {
              id: this.currentProfile.id,
              name: this.currentProfile.name,
              avatar: this.currentProfile.avatar,
              level: this.currentProfile.level,
              rank: this.currentProfile.rank,
              rank_color: this.currentProfile.rank_color,
              progress,
              wpm,
            },
          },
        },
      });
      return;
    }
    this.send({ type: 'progress', progress, wpm });
  }

  public sendFinish(wpm: number) {
    if (this.currentChannel && this.currentProfile) {
      const racer = {
        player_id: this.currentProfile.id,
        name: this.currentProfile.name,
        avatar: this.currentProfile.avatar,
        rank: this.currentProfile.rank,
        rank_color: this.currentProfile.rank_color,
        wpm,
        finishedAt: Date.now(),
      };

      // Dedupe local finishes (double-finish guard) then claim next placement
      if (!this.roomPodium.some((r: any) => (r.player_id ?? r.name) === (racer.player_id ?? racer.name))) {
        this.roomPodium.push(racer);
      }

      // Record race result in Supabase Cloud Table
      supabaseService.recordRaceResult({
        room_code: this.currentRoomCode || undefined,
        player_id: this.currentProfile.id,
        player_name: this.currentProfile.name,
        player_avatar: this.currentProfile.avatar || '👑',
        wpm,
        accuracy: 100,
        placement: this.roomPodium.length,
        mode: 'race',
      });

      this.currentChannel.send({
        type: 'broadcast',
        event: 'race_over',
        payload: {
          podium: this.roomPodium,
        },
      });
      return;
    }
    this.send({ type: 'finish', wpm });
  }

  public sendChat(text: string) {
    if (this.currentChannel && this.currentProfile) {
      this.currentChannel.send({
        type: 'broadcast',
        event: 'chat',
        payload: {
          sender: this.currentProfile.name,
          avatar: this.currentProfile.avatar,
          text,
          ts: Date.now(),
        },
      });
      return;
    }
    this.send({ type: 'chat', text });
  }

  public async leaveRoom() {
    if (this.currentChannel && this.supabase) {
      if (this.isHost && this.currentRoomCode) {
        supabaseService.deleteCloudRoom(this.currentRoomCode);
      }
      await this.currentChannel.untrack();
      await this.supabase.removeChannel(this.currentChannel);
      this.currentChannel = null;
      this.currentRoomCode = null;
    }
    this.send({ type: 'leave_room' });
  }

  public async fetchPublicRooms(): Promise<any[]> {
    const provider = this.getProvider();
    if (provider === 'supabase') {
      const rooms = await supabaseService.listPublicRooms();
      return rooms.map((r) => ({
        code: r.code,
        players: r.current_player_count,
        max: r.max_players,
        started: r.status === 'racing',
        mode: r.mode,
        host: r.host_name,
        text: r.text,
      }));
    }

    if (provider === 'local') {
      try {
        const resp = await fetch('/api/list_rooms');
        if (resp.ok) {
          const data = await resp.json();
          return (data.rooms || []).map((r: any) => ({
            code: r.code,
            players: r.players || r.player_count || 1,
            max: r.max_players || 8,
            started: Boolean(r.started),
            mode: r.mode || 'race',
            host: r.host_name || r.name || 'Local Host',
            text: r.text || '',
          }));
        }
      } catch {}
    }

    return [];
  }

  public subscribeToPublicRooms(onChange: () => void): () => void {
    return supabaseService.subscribeToRooms(onChange);
  }

  public send(payload: any) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(payload));
    }
  }
}

export const mpService = new MultiplayerService();
