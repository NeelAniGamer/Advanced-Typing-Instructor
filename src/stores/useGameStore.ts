import { create } from 'zustand';
import { 
  TypingMode, 
  Difficulty, 
  Category, 
  RankStats, 
  BossState, 
  KeyHeatmapData,
  SwitchProfile,
  SessionResult,
  UserProfile,
  MultiplayerRoom,
  MultiplayerPlayer,
  KeyboardLayout,
  GhostMode
} from '../types/game';
import { calculateRankStats } from '../utils/ranks';
import { soundEngine } from '../services/soundEngine';
import { mpService } from '../services/multiplayerService';

interface GameState {
  // Navigation & Screens
  activeScreen: 'dashboard' | 'landing' | 'map' | 'game' | 'results' | 'multiplayer' | 'shop' | 'homerow';
  activeModal: 'daily' | 'tournament' | 'achievements' | 'heatmap' | 'admin' | 'settings' | 'profile' | 'account' | 'streak' | 'certificate' | 'customPractice' | 'soundSettings' | 'update' | null;

  // Player Profile & Career Stats
  user: UserProfile;
  emeralds: number;
  prestige: number;
  unlockedLevels: number;

  // Current Solo Level Config
  level: number;
  mode: TypingMode;
  difficulty: Difficulty;
  category: Category;

  // Audio & Hardware Configuration
  switchProfile: SwitchProfile;
  isMuted: boolean;
  masterVolume: number;
  keyboardLayout: KeyboardLayout;

  // Ghost Racer
  ghostMode: GhostMode;
  ghostWpm: number;

  // Typing Session State
  text: string;
  words: string[];
  currentWordIndex: number;
  currentCharIndex: number;
  currentInput: string;
  startTime: number | null;
  endTime: number | null;
  elapsedSeconds: number;
  
  // Real-time Metrics
  wpm: number;
  rawWpm: number;
  accuracy: number;
  currentStreak: number;
  maxStreak: number;
  totalErrors: number;
  totalKeystrokes: number;

  // Boss Battle
  boss: BossState | null;

  // Analytics & Heatmap
  heatmap: KeyHeatmapData;
  lastSession: SessionResult | null;

  // Multiplayer State
  mpRoom: MultiplayerRoom | null;
  mpMyId: string | null;
  mpIsHost: boolean;
  mpCountdown: number | null;
  mpPodium: any[] | null;
  mpChatMessages: { sender: string; avatar: string; text: string; ts: number }[];
  isMpRacing: boolean;

  // Actions
  setScreen: (screen: GameState['activeScreen']) => void;
  setModal: (modal: GameState['activeModal']) => void;
  setLevel: (level: number) => void;
  setMode: (mode: TypingMode) => void;
  setDifficulty: (diff: Difficulty) => void;
  setCategory: (cat: Category) => void;
  setSwitchProfile: (profile: SwitchProfile) => void;
  toggleMute: () => void;
  setMasterVolume: (vol: number) => void;
  setKeyboardLayout: (layout: KeyboardLayout) => void;
  setGhostMode: (mode: GhostMode) => void;
  setGhostWpm: (wpm: number) => void;
  loadCustomText: (customText: string, title?: string) => void;
  
  // Profile & Persistence
  fetchProfile: () => Promise<void>;
  updateProfile: (name: string, avatar: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOutGoogle: () => Promise<void>;
  recordMpRaceResult: (won: boolean, wpm: number, acc: number) => Promise<void>;

  // Game Loop
  fetchNewBatch: () => Promise<void>;
  startSession: () => void;
  handleKeyInput: (char: string, isBackspace?: boolean) => void;
  finishSession: () => Promise<void>;
  resetTypingState: () => void;
  addEmeralds: (amount: number) => void;

  // Multiplayer Actions
  initMultiplayer: () => void;
  createMpRoom: (mode?: string, text?: string) => Promise<void>;
  joinMpRoom: (code: string) => Promise<void>;
  leaveMpRoom: () => void;
  toggleMpReady: () => void;
  startMpRace: () => void;
  sendMpChat: (text: string) => void;

  // Live Auto-Updater
  updateAvailable: boolean;
  updateInfo: {
    version: string;
    releaseDate: string;
    changelog: string;
    downloadUrl: string;
    exeUrl?: string;
    isMandatory?: boolean;
  } | null;
  isCheckingUpdate: boolean;
  isDownloadingUpdate: boolean;
  updateProgress: number;
  downloadSpeed: number;
  downloadBytes: { received: number; total: number };
  isUpdateReady: boolean;
  updateError: string | null;

  checkForUpdates: (silent?: boolean) => Promise<void>;
  downloadUpdate: () => Promise<void>;
  applyUpdate: () => Promise<void>;
}

const FALLBACK_WORDS: Record<TypingMode, string> = {
  Words: 'Speed precision rhythm accuracy mechanical switch tactile clack velocity keyboard mastery focus flow dexterity keystroke champion',
  Lines: 'The quick brown fox jumps over the lazy dog. Mechanical keyboards provide extraordinary tactile feedback with every keystroke.',
  Paragraphs: 'Touch typing is the ability to type without looking at the keyboard. Muscle memory allows the fingers to naturally find keys with remarkable speed and surgical precision. Daily deliberate practice builds effortless velocity.',
  Pages: 'In the golden era of computing, the mechanical switch reigned supreme. With crisp actuation points and musical acoustic signatures, each typist composed their own rhythmic symphony. Modern enthusiasts revere custom springs, lubricated stems, and aluminum housings that elevate digital composition into pure art.',
  Code: 'const calculateVelocity = (keys, time) => {\n  const wpm = (keys / 5) / (time / 60);\n  return Math.round(wpm);\n};\nexport default calculateVelocity;'
};

export const useGameStore = create<GameState>((set, get) => ({
  activeScreen: 'dashboard',
  activeModal: null,

  user: {
    id: 'player_default',
    name: 'Champion Typer',
    avatar: '👑',
    level: 1,
    rank: 'Rubber Dome Typer Trainee I',
    rank_color: '#a1887f',
    races: 0,
    wins: 0,
    best_wpm: 0,
    avg_acc: 100,
  },
  emeralds: 1250,
  prestige: 0,
  unlockedLevels: 1,

  level: 1,
  mode: 'Words',
  difficulty: 'Normal',
  category: 'Literature',

  switchProfile: 'cherry-blue',
  isMuted: false,
  masterVolume: 0.7,
  keyboardLayout: 'qwerty',

  ghostMode: 'pb',
  ghostWpm: 55,

  text: FALLBACK_WORDS['Words'],
  words: FALLBACK_WORDS['Words'].split(' '),
  currentWordIndex: 0,
  currentCharIndex: 0,
  currentInput: '',
  startTime: null,
  endTime: null,
  elapsedSeconds: 0,

  wpm: 0,
  rawWpm: 0,
  accuracy: 100,
  currentStreak: 0,
  maxStreak: 0,
  totalErrors: 0,
  totalKeystrokes: 0,

  boss: null,
  heatmap: {},
  lastSession: (() => {
    try {
      const saved = localStorage.getItem('tq_last_session');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  })(),

  // Multiplayer
  mpRoom: null,
  mpMyId: null,
  mpIsHost: false,
  mpCountdown: null,
  mpPodium: null,
  mpChatMessages: [],
  isMpRacing: false,

  // Live Auto-Updater
  updateAvailable: false,
  updateInfo: null,
  isCheckingUpdate: false,
  isDownloadingUpdate: false,
  updateProgress: 0,
  downloadSpeed: 0,
  downloadBytes: { received: 0, total: 0 },
  isUpdateReady: false,
  updateError: null,

  setScreen: (activeScreen) => set({ activeScreen }),
  setModal: (activeModal) => set({ activeModal }),
  setLevel: (level) => {
    set({ level });
    const rank = calculateRankStats(level, get().user.best_wpm || 30, get().mode, get().difficulty);
    set((s) => ({
      user: {
        ...s.user,
        level,
        rank: rank.rank.name,
        rank_color: rank.rank.color,
      }
    }));
  },
  setMode: (mode) => set({ mode }),
  setDifficulty: (difficulty) => set({ difficulty }),
  setCategory: (category) => {
    set({ category });
    get().fetchNewBatch();
  },
  
  setSwitchProfile: (profile) => {
    soundEngine.setProfile(profile);
    set({ switchProfile: profile });
  },

  toggleMute: () => {
    const isMuted = soundEngine.toggleMute();
    set({ isMuted });
  },

  setMasterVolume: (masterVolume) => {
    soundEngine.setVolume(masterVolume);
    set({ masterVolume });
  },

  setKeyboardLayout: (keyboardLayout) => set({ keyboardLayout }),
  setGhostMode: (ghostMode) => set({ ghostMode }),
  setGhostWpm: (ghostWpm) => set({ ghostWpm }),

  loadCustomText: (customText, _title) => {
    const clean = customText.trim();
    if (!clean) return;
    const words = clean.split(/\s+/);
    set({
      text: clean,
      words,
      currentWordIndex: 0,
      currentCharIndex: 0,
      currentInput: '',
      startTime: null,
      endTime: null,
      elapsedSeconds: 0,
      wpm: 0,
      rawWpm: 0,
      accuracy: 100,
      currentStreak: 0,
      maxStreak: 0,
      totalErrors: 0,
      totalKeystrokes: 0,
      boss: null,
      activeScreen: 'game',
      activeModal: null,
      category: 'Literature',
    });
  },

  signInWithGoogle: async () => {
    try {
      const resp = await fetch('/api/google_login');
      if (resp.ok) {
        let attempts = 0;
        const interval = setInterval(async () => {
          attempts++;
          try {
            const cb = await fetch('/api/google_callback');
            if (cb.ok) {
              const u = await cb.json();
              if (u && u.id) {
                clearInterval(interval);
                localStorage.setItem('tq_google_user', JSON.stringify(u));
                set((s) => ({
                  user: {
                    ...s.user,
                    id: u.id,
                    name: u.name || s.user.name,
                    email: u.email,
                  }
                }));
                get().updateProfile(u.name, get().user.avatar);
              }
            }
          } catch {}
          if (attempts > 30) clearInterval(interval);
        }, 2500);
      }
    } catch (e) {
      console.error('[OAuth] Google Sign-in Error:', e);
    }
  },

  signOutGoogle: async () => {
    try {
      await fetch('/api/google_logout');
    } catch {}
    localStorage.removeItem('tq_google_user');
    set((s) => ({
      user: {
        ...s.user,
        id: 'player_default',
        email: undefined,
      }
    }));
  },

  fetchProfile: async () => {
    // Check saved Google Auth
    try {
      const savedGoogle = localStorage.getItem('tq_google_user');
      if (savedGoogle) {
        const u = JSON.parse(savedGoogle);
        if (u && u.name) {
          set((s) => ({
            user: {
              ...s.user,
              id: u.id || s.user.id,
              name: u.name,
              email: u.email,
            }
          }));
        }
      }
    } catch {}

    try {
      const resp = await fetch('/api/get_profile');
      if (resp.ok) {
        const data = await resp.json();
        if (data.name) {
          set((s) => ({
            user: {
              ...s.user,
              id: s.user.id !== 'player_default' ? s.user.id : (data.id || 'player_default'),
              name: s.user.email ? s.user.name : data.name,
              avatar: data.avatar || s.user.avatar || '👑',
              level: data.level || 1,
              rank: data.rank || 'Rubber Dome Typer Trainee I',
              rank_color: data.rank_color || '#a1887f',
              races: data.races || 0,
              wins: data.wins || 0,
              best_wpm: data.best_wpm || 0,
              avg_acc: data.avg_acc || 100,
            }
          }));
        }
      }
    } catch {
      // Fallback
    }
  },

  updateProfile: async (name, avatar) => {
    const current = get().user;
    const updated = { ...current, name, avatar };
    set({ user: updated });

    try {
      await fetch(`/api/update_profile?id=${current.id}&name=${encodeURIComponent(name)}&avatar=${encodeURIComponent(avatar)}&level=${current.level}&rank=${encodeURIComponent(current.rank)}&rank_color=${encodeURIComponent(current.rank_color)}`);
    } catch {
      // Offline fallback
    }
  },

  recordMpRaceResult: async (won, wpm, acc) => {
    const u = get().user;
    const newWins = u.wins + (won ? 1 : 0);
    const newRaces = u.races + 1;
    const newBestWpm = Math.max(u.best_wpm, wpm);
    const newAvgAcc = Math.round((u.avg_acc + acc) / 2);

    set({
      user: {
        ...u,
        wins: newWins,
        races: newRaces,
        best_wpm: newBestWpm,
        avg_acc: newAvgAcc,
      },
      emeralds: get().emeralds + (won ? 500 : 150),
    });

    try {
      await fetch(`/api/record_mp_race?id=${u.id}&won=${won ? 1 : 0}&wpm=${wpm}&acc=${acc}`);
    } catch {
      // Offline
    }
  },

  fetchNewBatch: async () => {
    const { level, mode, difficulty, category } = get();
    const isBossLevel = level % 40 === 0;

    let textContent = FALLBACK_WORDS[mode];

    if (category === 'Coding' || mode === 'Code') {
      const codingList = [
        "const calculateVelocity = (keys, time) => {\n  const wpm = (keys / 5) / (time / 60);\n  return Math.round(wpm);\n};\nexport default calculateVelocity;",
        "function binarySearch(arr, target) {\n  let left = 0, right = arr.length - 1;\n  while (left <= right) {\n    const mid = Math.floor((left + right) / 2);\n    if (arr[mid] === target) return mid;\n    if (arr[mid] < target) left = mid + 1; else right = mid - 1;\n  }\n  return -1;\n}",
        "import React, { useState, useEffect } from 'react';\nexport const Arena = () => {\n  const [wpm, setWpm] = useState(0);\n  useEffect(() => { console.log('Ready'); }, []);\n  return <div>Speed: {wpm}</div>;\n};",
        "def quick_sort(arr):\n    if len(arr) <= 1: return arr\n    pivot = arr[len(arr) // 2]\n    return quick_sort([x for x in arr if x < pivot]) + [x for x in arr if x == pivot] + quick_sort([x for x in arr if x > pivot])",
        "#include <vector>\n#include <iostream>\nint main() {\n  std::vector<int> nums = {10, 20, 30};\n  for (int n : nums) std::cout << n << std::endl;\n  return 0;\n}"
      ];
      textContent = codingList[Math.floor(Math.random() * codingList.length)];
    }

    try {
      const activeMode = (category === 'Coding' || mode === 'Code') ? 'Code' : mode;
      const resp = await fetch(`/api/getwords?level=${level}&mode=${encodeURIComponent(activeMode)}&diff=${encodeURIComponent(difficulty)}`);
      if (resp.ok) {
        const data = await resp.json();
        if (data.text) textContent = data.text;
      }
    } catch {
      // Fallback used if Python API is offline
    }

    const words = textContent.trim().split(/\s+/);

    const boss: BossState | null = isBossLevel
      ? {
          isBoss: true,
          name: level === 40 ? 'Gargoyle of Latency' : level === 80 ? 'The Obsidian Warden' : level === 120 ? 'Wither Protocol' : 'Endgame Synthesizer',
          maxHp: 100 + level * 5,
          currentHp: 100 + level * 5,
          portrait: level === 40 ? '🗿' : level === 80 ? '🛡️' : level === 120 ? '☠️' : '👑',
          phase: 1,
        }
      : null;

    set({
      text: textContent,
      words,
      currentWordIndex: 0,
      currentCharIndex: 0,
      currentInput: '',
      startTime: null,
      endTime: null,
      elapsedSeconds: 0,
      wpm: 0,
      rawWpm: 0,
      accuracy: 100,
      currentStreak: 0,
      maxStreak: 0,
      totalErrors: 0,
      totalKeystrokes: 0,
      boss,
    });
  },

  startSession: () => {
    set({
      startTime: Date.now(),
      elapsedSeconds: 0,
    });
  },

  handleKeyInput: (char, isBackspace = false) => {
    const state = get();
    if (state.activeScreen !== 'game') return;
    const {
      words,
      currentWordIndex,
      currentInput,
      startTime,
      currentStreak,
      maxStreak,
      totalErrors,
      totalKeystrokes,
      heatmap,
      boss,
      isMpRacing,
    } = state;

    if (!startTime) {
      get().startSession();
    }

    const currentTargetWord = words[currentWordIndex] || '';

    // Backspace handling
    if (isBackspace) {
      if (currentInput.length > 0) {
        set({ currentInput: currentInput.slice(0, -1) });
      }
      return;
    }

    const isSpace = char === ' ';
    soundEngine.playKey(isSpace);

    // Track Heatmap for key
    const lowerKey = char.toLowerCase();
    const existingKeyData = heatmap[lowerKey] || { hits: 0, errors: 0, totalLatencyMs: 0 };

    // Spacebar word completion check
    if (isSpace) {
      if (currentInput.length === 0) return;

      const isWordCorrect = currentInput === currentTargetWord;
      const nextWordIndex = currentWordIndex + 1;
      const newStreak = isWordCorrect ? currentStreak + 1 : 0;
      const newMaxStreak = Math.max(maxStreak, newStreak);

      let updatedBoss = boss;
      if (isWordCorrect) {
        existingKeyData.hits++;
        if (newStreak > 0 && newStreak % 15 === 0) {
          soundEngine.playCombo();
        }
        if (boss && boss.isBoss) {
          const dmg = 15;
          soundEngine.playBossHit();
          updatedBoss = {
            ...boss,
            currentHp: Math.max(0, boss.currentHp - dmg),
          };
        }
      } else {
        soundEngine.playError();
        existingKeyData.errors++;
      }

      set({
        currentWordIndex: nextWordIndex,
        currentInput: '',
        currentStreak: newStreak,
        maxStreak: newMaxStreak,
        totalErrors: isWordCorrect ? totalErrors : totalErrors + 1,
        totalKeystrokes: totalKeystrokes + 1,
        boss: updatedBoss,
        heatmap: { ...heatmap, [lowerKey]: existingKeyData },
      });

      // Broadcast progress in MP
      if (isMpRacing && words.length > 0) {
        const prog = Math.min(100, Math.round((nextWordIndex / words.length) * 100));
        mpService.sendProgress(prog, get().wpm);
      }

      // Check if finished
      if (nextWordIndex >= words.length) {
        if (isMpRacing) {
          mpService.sendFinish(get().wpm);
        } else {
          get().finishSession();
        }
      }
      return;
    }

    // Normal Character Typing
    const expectedChar = currentTargetWord[currentInput.length];
    const isCorrect = char === expectedChar;

    if (isCorrect) {
      existingKeyData.hits++;
      const nextInput = currentInput + char;
      const newStreak = currentStreak + 1;
      const newMaxStreak = Math.max(maxStreak, newStreak);

      set({
        currentInput: nextInput,
        currentStreak: newStreak,
        maxStreak: newMaxStreak,
        totalKeystrokes: totalKeystrokes + 1,
        heatmap: { ...heatmap, [lowerKey]: existingKeyData },
      });

      // Words mode auto check if end of last word
      if (currentWordIndex === words.length - 1 && nextInput === currentTargetWord) {
        if (isMpRacing) {
          mpService.sendFinish(get().wpm);
        } else {
          get().finishSession();
        }
      }
    } else {
      // Prevent unbounded overtyping
      if (currentInput.length >= currentTargetWord.length + 6) {
        soundEngine.playError();
        return;
      }
      soundEngine.playError();
      existingKeyData.errors++;
      set({
        currentInput: currentInput + char,
        currentStreak: 0,
        totalErrors: totalErrors + 1,
        totalKeystrokes: totalKeystrokes + 1,
        heatmap: { ...heatmap, [lowerKey]: existingKeyData },
      });
    }

    // Update real-time metrics
    const now = Date.now();
    const start = get().startTime || now;
    const elapsedMinutes = Math.max((now - start) / 60000, 0.01);
    const calculatedRawWpm = Math.round((get().totalKeystrokes / 5) / elapsedMinutes);
    const correctKeystrokes = Math.max(0, get().totalKeystrokes - get().totalErrors);
    const calculatedNetWpm = Math.round((correctKeystrokes / 5) / elapsedMinutes);
    const calculatedAcc = Math.max(0, Math.min(100, Math.round((correctKeystrokes / Math.max(1, get().totalKeystrokes)) * 100)));

    set({
      wpm: calculatedNetWpm,
      rawWpm: calculatedRawWpm,
      accuracy: calculatedAcc,
      elapsedSeconds: Math.round((now - start) / 1000),
    });
  },

  finishSession: async () => {
    const state = get();
    // Guard against multiple calls if already on results screen
    if (state.activeScreen === 'results') return;

    const now = Date.now();
    const start = state.startTime || now;
    const elapsedSeconds = Math.max(1, Math.round((now - start) / 1000));
    const elapsedMinutes = Math.max((now - start) / 60000, 0.01);

    // Calculate final metrics accurately from keystrokes and time
    const totalKeys = Math.max(1, state.totalKeystrokes);
    const correctKeys = Math.max(0, totalKeys - state.totalErrors);
    const calculatedRaw = Math.round((totalKeys / 5) / elapsedMinutes);
    const calculatedNet = Math.round((correctKeys / 5) / elapsedMinutes);
    const calculatedAcc = Math.max(0, Math.min(100, Math.round((correctKeys / totalKeys) * 100)));

    const finalWpm = Math.max(state.wpm, calculatedNet);
    const finalRawWpm = Math.max(state.rawWpm, calculatedRaw);
    const finalAcc = Math.min(state.accuracy, calculatedAcc);

    soundEngine.playLevelUp();

    const baseReward = Math.round(finalWpm * 2 * (finalAcc / 100));
    const bonus = state.level % 40 === 0 ? 500 : 50;
    const totalEarned = Math.max(50, (Number.isFinite(baseReward) ? baseReward : 50) + bonus);

    const result: SessionResult = {
      level: state.level || 1,
      mode: state.mode || 'Words',
      difficulty: state.difficulty || 'Normal',
      wpm: Number.isFinite(finalWpm) ? finalWpm : 0,
      rawWpm: Number.isFinite(finalRawWpm) ? finalRawWpm : 0,
      accuracy: Number.isFinite(finalAcc) ? finalAcc : 100,
      errors: state.totalErrors || 0,
      emeraldsEarned: totalEarned,
      durationSeconds: elapsedSeconds,
      timestamp: new Date().toLocaleTimeString(),
    };

    try {
      localStorage.setItem('tq_last_session', JSON.stringify(result));
    } catch {}

    set((s) => ({
      activeScreen: 'results',
      endTime: now,
      wpm: finalWpm,
      rawWpm: finalRawWpm,
      accuracy: finalAcc,
      emeralds: (s.emeralds || 0) + totalEarned,
      unlockedLevels: Math.max(s.unlockedLevels || 1, (s.level || 1) + 1),
      lastSession: result,
      user: {
        ...s.user,
        best_wpm: Math.max(s.user.best_wpm || 0, finalWpm),
      }
    }));

    try {
      await fetch(
        `/api/save?level=${state.level}&mode=${encodeURIComponent(state.mode)}&diff=${encodeURIComponent(state.difficulty)}&wpm=${finalWpm}&accuracy=${finalAcc}&emeralds=${totalEarned}`
      );
    } catch {
      // Offline fallback
    }
  },

  resetTypingState: () => {
    get().fetchNewBatch();
  },

  addEmeralds: (amount) => set((s) => ({ emeralds: s.emeralds + amount })),

  // ── MULTIPLAYER IMPLEMENTATION ────────────────────────────
  initMultiplayer: () => {
    mpService.subscribe((msg) => {
      if (msg.type === 'room_created') {
        set({
          mpRoom: {
            code: msg.code,
            host: 'me',
            mode: msg.mode || 'race',
            text: msg.text,
            started: false,
            finished: false,
            players: {
              me: {
                id: 'me',
                name: get().user.name,
                avatar: get().user.avatar,
                level: get().user.level,
                rank: get().user.rank,
                rank_color: get().user.rank_color,
                best_wpm: get().user.best_wpm,
                races_won: get().user.wins,
                progress: 0,
                wpm: 0,
                ready: true,
                finished: false,
              }
            }
          },
          mpIsHost: true,
          mpPodium: null,
          isMpRacing: false,
        });
      } else if (msg.type === 'room_joined') {
        set({
          mpRoom: {
            code: msg.code,
            host: msg.host,
            mode: msg.mode,
            text: msg.text,
            started: false,
            finished: false,
            players: {},
          },
          mpIsHost: false,
          mpPodium: null,
          isMpRacing: false,
        });
      } else if (msg.type === 'room_state') {
        const currentRoom = get().mpRoom;
        if (currentRoom) {
          set({
            mpRoom: {
              ...currentRoom,
              players: msg.players || {},
              host: msg.host,
              started: msg.started,
              text: msg.text || currentRoom.text,
            },
          });
        }
      } else if (msg.type === 'progress_update') {
        const currentRoom = get().mpRoom;
        if (currentRoom && msg.players) {
          set({
            mpRoom: {
              ...currentRoom,
              players: {
                ...currentRoom.players,
                ...msg.players,
              }
            }
          });
        }
      } else if (msg.type === 'countdown') {
        soundEngine.playKey(false);
        set({ mpCountdown: msg.count });
      } else if (msg.type === 'race_start') {
        soundEngine.playLevelUp();
        const textContent = msg.text || FALLBACK_WORDS['Words'];
        const words = textContent.trim().split(/\s+/);
        set({
          mpCountdown: null,
          isMpRacing: true,
          text: textContent,
          words,
          currentWordIndex: 0,
          currentInput: '',
          startTime: Date.now(),
          wpm: 0,
          rawWpm: 0,
          accuracy: 100,
          currentStreak: 0,
          totalErrors: 0,
          totalKeystrokes: 0,
        });
      } else if (msg.type === 'race_over') {
        soundEngine.playCombo();
        set({
          isMpRacing: false,
          mpPodium: msg.podium || [],
        });
        // Check if I won
        const podium = msg.podium || [];
        if (podium.length > 0 && podium[0].name === get().user.name) {
          get().recordMpRaceResult(true, get().wpm, get().accuracy);
        } else {
          get().recordMpRaceResult(false, get().wpm, get().accuracy);
        }
      } else if (msg.type === 'chat') {
        set((s) => ({
          mpChatMessages: [
            ...s.mpChatMessages,
            { sender: msg.sender, avatar: msg.avatar || '💬', text: msg.text, ts: msg.ts }
          ].slice(-50)
        }));
      }
    });
  },

  createMpRoom: async (mode = 'race', text) => {
    await mpService.connect();
    mpService.createRoom(get().user, mode, text);
  },

  joinMpRoom: async (code: string) => {
    await mpService.connect();
    mpService.joinRoom(code, get().user);
  },

  leaveMpRoom: () => {
    mpService.leaveRoom();
    set({ mpRoom: null, isMpRacing: false, mpPodium: null, mpCountdown: null });
  },

  toggleMpReady: () => {
    mpService.sendReady(true);
  },

  startMpRace: () => {
    mpService.startRace();
  },

  sendMpChat: (text: string) => {
    mpService.sendChat(text);
  },

  checkForUpdates: async (silent = false) => {
    set({ isCheckingUpdate: true, updateError: null });
    try {
      const res = await fetch('/api/check_update');
      if (res.ok) {
        const data = await res.json();
        if (data.status === 'update_available') {
          set({
            updateAvailable: true,
            updateInfo: {
              version: data.remote_version,
              releaseDate: data.release_date || '',
              changelog: data.changelog || 'Performance improvements and cybernetic polish.',
              downloadUrl: data.download_url || '',
              exeUrl: data.exe_url,
              isMandatory: data.is_mandatory,
            },
          });
          if (!silent) {
            set({ activeModal: 'update' });
          }
        } else if (!silent) {
          if (data.status === 'no_update') {
            alert('Your system is up to date! You are running the latest ATI version.');
          } else if (data.status === 'error') {
            set({ updateError: data.error || 'Failed to check for updates' });
            set({ activeModal: 'update' });
          }
        }
      }
    } catch (err: any) {
      if (!silent) {
        set({ updateError: err?.message || 'Network connection failed' });
        set({ activeModal: 'update' });
      }
    } finally {
      set({ isCheckingUpdate: false });
    }
  },

  downloadUpdate: async () => {
    set({ isDownloadingUpdate: true, updateProgress: 0, updateError: null, isUpdateReady: false });
    try {
      const res = await fetch('/api/download_update');
      if (!res.ok) throw new Error('Failed to initiate update download');
      
      const pollTimer = setInterval(async () => {
        try {
          const pRes = await fetch('/api/update_progress');
          if (pRes.ok) {
            const pData = await pRes.json();
            set({
              updateProgress: pData.progress || 0,
              downloadSpeed: pData.speed_kbps || 0,
              downloadBytes: {
                received: pData.downloaded_bytes || 0,
                total: pData.total_bytes || 0,
              },
            });

            if (pData.status === 'ready') {
              clearInterval(pollTimer);
              set({ isDownloadingUpdate: false, isUpdateReady: true, updateProgress: 100 });
            } else if (pData.status === 'error') {
              clearInterval(pollTimer);
              set({ isDownloadingUpdate: false, updateError: pData.error || 'Download failed' });
            }
          }
        } catch {
          // ignore transient poll error
        }
      }, 350);
    } catch (err: any) {
      set({ isDownloadingUpdate: false, updateError: err?.message || 'Download error' });
    }
  },

  applyUpdate: async () => {
    try {
      await fetch('/api/apply_update');
    } catch {
      // server exit expected
    }
  },
}));

if (typeof window !== 'undefined') {
  (window as any).__ati_game_store = useGameStore;
  // Trigger silent update check on startup after brief delay
  setTimeout(() => {
    useGameStore.getState().checkForUpdates(true);
  }, 2000);
}

