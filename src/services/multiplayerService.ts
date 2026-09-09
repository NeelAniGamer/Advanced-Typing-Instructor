import { createClient, SupabaseClient, RealtimeChannel } from '@supabase/supabase-js';
import { MultiplayerRoom, MultiplayerPlayer, UserProfile } from '../types/game';

type MessageHandler = (data: any) => void;
export type MultiplayerProvider = 'supabase' | 'custom_ws' | 'local';

export const SUPABASE_CONFIG = {
  url: 'https://hvukxajztizsuhfubjws.supabase.co',
  anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh2dWt4YWp6dGl6c3VoZnViandzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA4Mzc1MTAsImV4cCI6MjA5NjQxMzUxMH0.KqQRkmhuB_rFlzQ2N3NhSQrftmVZgGE3NUuVHYh3aYE',
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
    return (localStorage.getItem('mp_provider') as MultiplayerProvider) || 'supabase';
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
  public async createRoom(profile: UserProfile, mode: string = 'race', text?: string) {
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

      await this.joinSupabaseChannel(cleanCode, profile, false);

      this.emit({
        type: 'room_joined',
        code: cleanCode,
        host: 'remote',
        mode: 'race',
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

    const channel = this.supabase.channel(`room:${code}`, {
      config: {
        broadcast: { self: true },
        presence: { key: profile.id },
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
            races_won: p.races_won || 0,
            progress: p.progress || 0,
            wpm: p.wpm || 0,
            ready: Boolean(p.ready),
            finished: Boolean(p.finished),
          };
        }
      });

      this.emit({
        type: 'room_state',
        code,
        host: isHost ? profile.id : 'remote',
        mode: 'race',
        started: false,
        finished: false,
        players,
        text: this.roomText,
      });
    });

    // 2. Broadcast listeners
    channel.on('broadcast', { event: 'race_countdown' }, ({ payload }) => {
      this.emit({ type: 'race_countdown', count: payload.count });
    });

    channel.on('broadcast', { event: 'race_start' }, () => {
      this.emit({ type: 'race_start' });
    });

    channel.on('broadcast', { event: 'progress_update' }, ({ payload }) => {
      this.emit({ type: 'progress_update', players: payload.players });
    });

    channel.on('broadcast', { event: 'race_over' }, ({ payload }) => {
      this.emit({ type: 'race_over', podium: payload.podium });
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
      return;
    }
    this.send({ type: 'ready', ready });
  }

  public startRace() {
    if (this.currentChannel) {
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
            payload: {},
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
        name: this.currentProfile.name,
        avatar: this.currentProfile.avatar,
        rank: this.currentProfile.rank,
        rank_color: this.currentProfile.rank_color,
        wpm,
      };

      this.roomPodium.push(racer);

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
      await this.currentChannel.untrack();
      await this.supabase.removeChannel(this.currentChannel);
      this.currentChannel = null;
      this.currentRoomCode = null;
    }
    this.send({ type: 'leave_room' });
  }

  public send(payload: any) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(payload));
    }
  }
}

export const mpService = new MultiplayerService();
