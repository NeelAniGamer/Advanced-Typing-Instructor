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
  GhostMode,
  GhostPacingMode,
  ShopItem,
  PlayerSaveData,
  CasingStyleId,
  TypingStyleConfig,
  PromotionCheckResult,
  CoachingInsight,
  BackgroundStats,
  LocalAccountSummary,
  EloDivision,
  DailyQuest
} from '../types/game';
import { calculateRankStats } from '../utils/ranks';
import { soundEngine } from '../services/soundEngine';
import { mpService } from '../services/multiplayerService';
import { getCurriculumText, getCurriculumWords } from '../data/levelCurriculum';
import { UITheme, APP_VERSION } from '../utils/theme';
import { supabaseService } from '../services/supabaseService';
import { sanitizeTypingText, isEquivalentKey } from '../utils/sanitizeText';
import { calculateEarnedWordGems, calculateWordCustomGems, calculateLevelGemCap, EarnedWordGemResult } from '../utils/gemValuation';

export function getLevelWordCount(level: number): number {
  const lvl = Math.max(1, Math.min(200, Math.floor(level) || 1));
  if (lvl <= 25) return 20;
  if (lvl <= 40) return 18;
  if (lvl <= 60) return 15;
  if (lvl <= 80) return 12;
  if (lvl <= 100) return 10;
  if (lvl <= 140) return 8;
  if (lvl <= 160) return 7;
  return 5;
}

interface GameState {
  // Navigation & Screens
  activeScreen: 'dashboard' | 'landing' | 'map' | 'game' | 'results' | 'multiplayer' | 'shop' | 'homerow' | 'tutorial';
  previousScreen: 'dashboard' | 'landing' | 'map' | 'game' | 'results' | 'multiplayer' | 'shop' | 'homerow' | 'tutorial';
  activeModal: 'daily' | 'tournament' | 'achievements' | 'heatmap' | 'admin' | 'settings' | 'profile' | 'account' | 'streak' | 'certificate' | 'customPractice' | 'soundSettings' | 'update' | 'typingStyle' | 'promotion' | null;

  // Player Profile & Career Stats
  user: UserProfile;
  emeralds: number;
  prestige: number;
  unlockedLevels: number;
  dailyStreak: number;

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
  ghostPacingMode: GhostPacingMode;

  // Timed Mode (Countdown Duration in seconds or null for normal mode)
  timedDuration: number | null;

  // Level Progression Boosters & Shop Inventory
  ownedItems: string[];
  equippedBoosters: Record<string, boolean>;
  inventory: Record<string, number>;
  typoShieldsRemaining: number;
  lastShieldAbsorbTime: number | null;

  // Typing Session State
  text: string;
  words: string[];
  currentWordIndex: number;
  currentCharIndex: number;
  currentInput: string;
  typedWords: Record<number, string>;
  wordErrors: Record<number, boolean>;
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
  keystrokeIntervals: number[];
  shiftLatencies: number[];

  // Dynamic Gem Valuation & Micro-Feedback
  sessionGemsEarned: number;
  currentWordErrors: number;
  wordStartTime: number | null;
  levelMaxGemsCap: number;
  lastWordGemResult: (EarnedWordGemResult & { key: number; wordIndex: number }) | null;
  aiWeakKeys: string[];
  fetchWeakSpots: () => Promise<string[]>;

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
  mpError: string | null;
  clearMpError: () => void;

  // Matiks Competitive & Esports State
  isDuel: boolean;
  duelOpponent: { name: string; avatar: string; elo: number; division: EloDivision; targetWpm: number; progress: number } | null;
  duelResult: { won: boolean; eloDelta: number; newElo: number; opponentName: string } | null;
  isSuddenDeath: boolean;
  cleanWordsInRow: number;
  comboMultiplierValue: number;

  // Retention & Habit Systems
  dailyQuests: DailyQuest[];
  dailyMasterCrateClaimed: boolean;
  lastQuestDate: string;
  lastDailyRewardDate: string | null;
  luckyChestReward: { emeralds: number; item?: string; streakShield?: boolean } | null;
  hasOpenedLuckyChest: boolean;

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
  setGhostPacingMode: (mode: GhostPacingMode) => void;
  setTimedDuration: (dur: number | null) => void;
  setDailyStreak: (streak: number) => void;
  buyShopItem: (item: ShopItem) => boolean;
  toggleEquipBooster: (boosterId: string) => void;
  useQuantumLeapToken: () => boolean;
  loadCustomText: (customText: string, title?: string) => void;
  startChallengeSession: (challengeText: string, title?: string, category?: Category) => void;

  // Matiks & Retention Actions
  startInstantDuel: () => Promise<void>;
  startSuddenDeath: () => void;
  claimDailyQuest: (questId: string) => void;
  claimDailyMasterCrate: () => void;
  buyStreakShield: () => boolean;
  openLuckyChest: () => { emeralds: number; streakShield?: boolean } | null;
  
  // Profile & Persistence
  fetchProfile: () => Promise<void>;
  updateProfile: (name: string, avatar: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOutGoogle: () => Promise<void>;
  registerLocalAccount: (username: string, password: string, displayName?: string, avatar?: string) => Promise<{ success: boolean; message: string; user?: any }>;
  loginLocalAccount: (username: string, password: string) => Promise<{ success: boolean; message: string; user?: any }>;
  fetchLocalAccounts: () => Promise<LocalAccountSummary[]>;
  deleteAccount: (userId?: string, accountType?: 'local' | 'google') => Promise<{ success: boolean; message: string }>;
  recordMpRaceResult: (won: boolean, wpm: number, acc: number) => Promise<void>;
  savePlayerData: () => Promise<void>;
  loadPlayerData: () => Promise<void>;
  exportPlayerData: () => void;
  importPlayerData: (importedData: Partial<PlayerSaveData>, strategy: 'overwrite' | 'retain_old' | 'merge') => Promise<{ success: boolean; message: string }>;
  cloudSyncStatus: 'synced' | 'syncing' | 'offline' | 'error';
  lastCloudSync: string | null;
  syncToCloud: () => Promise<{ success: boolean; message: string }>;

  // Game Loop
  fetchNewBatch: () => Promise<void>;
  startSession: () => void;
  handleKeyInput: (char: string, isBackspace?: boolean, isCtrl?: boolean) => void;
  jumpToWord: (wordIndex: number) => void;
  finishSession: (liveIntervals?: number[], liveShiftLatencies?: number[]) => Promise<void>;
  recordKeystrokeInterval: (interval: number) => void;
  recordShiftLatency: (latency: number) => void;
  resetTypingState: () => void;
  addEmeralds: (amount: number) => void;

  // Multiplayer Actions
  initMultiplayer: () => void;
  createMpRoom: (mode?: string, text?: string, isPublic?: boolean) => Promise<void>;
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

  // AI & Typing Style Intelligence
  casingStyle: CasingStyleId;
  isAIWordMode: boolean;
  typingStyleDescription: string;
  availableStyles: TypingStyleConfig[];
  backgroundStats: BackgroundStats | null;
  coachingInsights: CoachingInsight | null;
  promotionOffer: PromotionCheckResult | null;
  isGeneratingAIWords: boolean;

  setCasingStyle: (styleId: CasingStyleId) => void;
  setIsAIWordMode: (enabled: boolean) => void;
  fetchTypingStyle: () => Promise<void>;
  saveTypingStyle: (styleId: CasingStyleId, description?: string, notes?: string) => Promise<void>;
  fetchBackgroundStats: () => Promise<void>;
  toggleStartupDaemon: (enabled: boolean) => Promise<boolean>;
  checkAutoPromotion: (wpm?: number, acc?: number, rci?: number, errs?: number) => Promise<PromotionCheckResult | null>;
  executePromotion: (targetLevel: number, reason?: string) => Promise<void>;
  dismissPromotionOffer: () => void;
  fetchCoachingInsights: (wpm?: number, acc?: number, intervals?: number[], shiftLatencies?: number[]) => Promise<CoachingInsight | null>;

  // UI & Color Theme
  uiTheme: UITheme;
  setUITheme: (theme: UITheme) => void;

  // AI Words Prompt
  showAIWordsPrompt: boolean;
  pendingLaunchLevel: number | null;
  setShowAIWordsPrompt: (show: boolean, levelToLaunch?: number | null) => void;
  confirmAIWordsLaunch: (enableAI: boolean) => void;
  requestLaunchSession: (levelToLaunch?: number) => void;

  // Desktop Window Controls (frameless window)
  isMaximized: boolean;
  minimizeWindow: () => Promise<void>;
  toggleMaximizeWindow: () => Promise<void>;
  closeWindow: () => Promise<void>;
}

export const getDivisionForElo = (elo: number): EloDivision => {
  if (elo >= 2800) return 'Apex';
  if (elo >= 2400) return 'Master';
  if (elo >= 2000) return 'Diamond';
  if (elo >= 1600) return 'Platinum';
  if (elo >= 1200) return 'Gold';
  if (elo >= 800) return 'Silver';
  return 'Bronze';
};

export const getDefaultDailyQuests = (dateStr: string): DailyQuest[] => [
  {
    id: `quest_ignition_${dateStr}`,
    title: 'Daily Ignition',
    desc: 'Complete 2 full typing sessions today',
    target: 2,
    current: 0,
    rewardEmeralds: 75,
    completed: false,
    claimed: false,
    icon: '⚡',
  },
  {
    id: `quest_accuracy_${dateStr}`,
    title: 'Deadeye Precision',
    desc: 'Finish a drill with ≥ 96% accuracy',
    target: 1,
    current: 0,
    rewardEmeralds: 100,
    completed: false,
    claimed: false,
    icon: '🎯',
  },
  {
    id: `quest_volume_${dateStr}`,
    title: 'Volume Surge',
    desc: 'Type 150 correct words today',
    target: 150,
    current: 0,
    rewardEmeralds: 150,
    completed: false,
    claimed: false,
    icon: '🔥',
  },
];

const FALLBACK_WORDS: Record<TypingMode, string> = {
  Words: 'Speed precision rhythm accuracy mechanical switch tactile clack velocity keyboard mastery focus flow dexterity keystroke champion',
  Lines: 'The quick brown fox jumps over the lazy dog. Mechanical keyboards provide extraordinary tactile feedback with every keystroke.',
  Paragraphs: 'Touch typing is the ability to type without looking at the keyboard. Muscle memory allows the fingers to naturally find keys with remarkable speed and surgical precision. Daily deliberate practice builds effortless velocity.',
  Pages: 'In the golden era of computing, the mechanical switch reigned supreme. With crisp actuation points and musical acoustic signatures, each typist composed their own rhythmic symphony. Modern enthusiasts revere custom springs, lubricated stems, and aluminum housings that elevate digital composition into pure art.',
  Code: 'const calculateVelocity = (keys, time) => {\n  const wpm = (keys / 5) / (time / 60);\n  return Math.round(wpm);\n};\nexport default calculateVelocity;',
  Time: 'Speed precision rhythm accuracy mechanical switch tactile clack velocity keyboard mastery focus flow dexterity keystroke champion flow sprint velocity cadence surge.',
  SuddenDeath: 'Extreme focus required one single typo terminates session immediately maintain surgical precision and high velocity.',
};

export const useGameStore = create<GameState>((set, get) => ({
  activeScreen: 'dashboard',
  previousScreen: 'dashboard',
  activeModal: null,
  uiTheme: (typeof window !== 'undefined' && (localStorage.getItem('ati_ui_theme') as UITheme)) || 'organic',
  cloudSyncStatus: 'synced',
  lastCloudSync: null,

  user: (() => {
    let guestId = 'guest_' + Math.random().toString(36).substring(2, 9);
    try {
      const storedGuest = localStorage.getItem('ati_guest_id');
      if (storedGuest) {
        guestId = storedGuest;
      } else {
        localStorage.setItem('ati_guest_id', guestId);
      }
    } catch {}

    try {
      const loc = localStorage.getItem('ati_local_user');
      if (loc) {
        const u = JSON.parse(loc);
        const elo = u.eloRating || 1200;
        return {
          id: u.id || guestId,
          name: u.name || 'Champion Typer',
          avatar: u.avatar || '👑',
          username: u.username,
          account_type: 'local' as const,
          level: 1,
          rank: 'Rubber Dome Typer Trainee I',
          rank_color: '#a1887f',
          races: 0,
          wins: 0,
          best_wpm: 0,
          avg_acc: 100,
          eloRating: elo,
          eloDivision: u.eloDivision || getDivisionForElo(elo),
          duelWins: u.duelWins || 0,
          duelLosses: u.duelLosses || 0,
          streakShields: u.streakShields ?? 1,
        };
      }
      const g = localStorage.getItem('tq_google_user');
      if (g) {
        const u = JSON.parse(g);
        const elo = u.eloRating || 1200;
        return {
          id: u.id || guestId,
          name: u.name || 'Champion Typer',
          avatar: '👑',
          email: u.email,
          account_type: 'google' as const,
          level: 1,
          rank: 'Rubber Dome Typer Trainee I',
          rank_color: '#a1887f',
          races: 0,
          wins: 0,
          best_wpm: 0,
          avg_acc: 100,
          eloRating: elo,
          eloDivision: u.eloDivision || getDivisionForElo(elo),
          duelWins: u.duelWins || 0,
          duelLosses: u.duelLosses || 0,
          streakShields: u.streakShields ?? 1,
        };
      }
    } catch {}
    return {
      id: guestId,
      name: 'Champion Typer',
      avatar: '👑',
      level: 1,
      rank: 'Rubber Dome Typer Trainee I',
      rank_color: '#a1887f',
      races: 0,
      wins: 0,
      best_wpm: 0,
      avg_acc: 100,
      account_type: 'guest' as const,
      eloRating: 1200,
      eloDivision: 'Gold',
      duelWins: 0,
      duelLosses: 0,
      streakShields: 1,
    };
  })(),
  emeralds: 1250,
  prestige: 0,
  unlockedLevels: 1,
  dailyStreak: (() => {
    try {
      const s = localStorage.getItem('ati_streak_count');
      return s ? parseInt(s, 10) || 1 : 1;
    } catch {
      return 1;
    }
  })(),

  // Matiks & Retention State
  isDuel: false,
  duelOpponent: null,
  duelResult: null,
  isSuddenDeath: false,
  cleanWordsInRow: 0,
  comboMultiplierValue: 1.0,
  dailyQuests: (() => {
    const today = new Date().toISOString().split('T')[0];
    try {
      const saved = localStorage.getItem('ati_daily_quests');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.date === today && Array.isArray(parsed.quests)) {
          return parsed.quests;
        }
      }
    } catch {}
    return getDefaultDailyQuests(today);
  })(),
  dailyMasterCrateClaimed: (() => {
    const today = new Date().toISOString().split('T')[0];
    try {
      return localStorage.getItem('ati_master_crate_date') === today;
    } catch {
      return false;
    }
  })(),
  lastQuestDate: new Date().toISOString().split('T')[0],
  lastDailyRewardDate: typeof window !== 'undefined' ? (localStorage.getItem('ati_last_reward_date') || null) : null,
  luckyChestReward: null,
  hasOpenedLuckyChest: false,

  level: 1,
  mode: 'Words',
  difficulty: 'Normal',
  category: 'Literature',

  switchProfile: 'cherry-blue',
  isMuted: false,
  masterVolume: 0.7,
  keyboardLayout: (() => {
    try {
      return (localStorage.getItem('ati_keyboard_layout') as KeyboardLayout) || 'qwerty';
    } catch {
      return 'qwerty';
    }
  })(),

  ghostMode: 'pb',
  ghostWpm: 55,
  ghostPacingMode: 'continuous',

  timedDuration: null,

  ownedItems: ['visual-diamond-cursor'],
  equippedBoosters: {},
  inventory: { 'token-quantum-leap': 0, 'consumable-shield-pack': 0 },
  typoShieldsRemaining: 0,
  lastShieldAbsorbTime: null,

  text: getCurriculumText(1, 'Words', 'Normal'),
  words: getCurriculumWords(1, 'Normal'),
  currentWordIndex: 0,
  currentCharIndex: 0,
  currentInput: '',
  typedWords: {},
  wordErrors: {},
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
  keystrokeIntervals: [],
  shiftLatencies: [],

  sessionGemsEarned: 0,
  currentWordErrors: 0,
  wordStartTime: null,
  levelMaxGemsCap: 500,
  lastWordGemResult: null,
  aiWeakKeys: [],

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
  mpError: null,
  clearMpError: () => set({ mpError: null }),

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

  // AI & Typing Style Intelligence State
  casingStyle: 'sentence_case',
  isAIWordMode: false,
  typingStyleDescription: 'Normal English — capitals only at sentence starts',
  availableStyles: [
    { style_id: 'sentence_case', style_name: 'Sentence Case', description: 'Normal English with standard prose capitalization (default)' },
    { style_id: 'standard_lowercase', style_name: 'Standard Lowercase', description: 'Clean lowercase words for continuous flowing speed' },
    { style_id: 'title_case', style_name: 'Title Case (Every Word Capitalized)', description: 'Capitalizes the first letter of each word — a Shift-key coordination drill' },
    { style_id: 'camel_case', style_name: 'camelCase', description: 'Identifiers ideal for frontend and JavaScript developers' },
    { style_id: 'snake_case', style_name: 'snake_case', description: 'Snake case formatting ideal for Python and backend developers' },
    { style_id: 'all_caps', style_name: 'ALL CAPS', description: 'High-impact uppercase for keyboard actuation practice' }
  ],
  backgroundStats: null,
  coachingInsights: null,
  promotionOffer: null,
  isGeneratingAIWords: false,

  showAIWordsPrompt: false,
  pendingLaunchLevel: null,

  setScreen: (activeScreen) => set((state) => ({
    previousScreen: state.activeScreen !== activeScreen ? state.activeScreen : state.previousScreen,
    activeScreen,
  })),
  setModal: (activeModal) => set({ activeModal }),
  setShowAIWordsPrompt: (show, levelToLaunch = null) => {
    set({ showAIWordsPrompt: show, pendingLaunchLevel: levelToLaunch });
  },
  confirmAIWordsLaunch: (enableAI) => {
    const { pendingLaunchLevel, setLevel, fetchNewBatch, setScreen, setIsAIWordMode } = get();
    setIsAIWordMode(enableAI);
    if (pendingLaunchLevel) {
      setLevel(pendingLaunchLevel);
    }
    fetchNewBatch();
    setScreen('game');
    set({ showAIWordsPrompt: false, pendingLaunchLevel: null });
  },
  requestLaunchSession: (levelToLaunch) => {
    const targetLvl = levelToLaunch ?? get().level;
    let remembered = null;
    try {
      remembered = localStorage.getItem('ati_ai_words_remember');
    } catch {}

    if (remembered === 'always_ai') {
      get().confirmAIWordsLaunch(true);
    } else if (remembered === 'always_standard') {
      get().confirmAIWordsLaunch(false);
    } else {
      get().setShowAIWordsPrompt(true, targetLvl);
    }
  },
  setUITheme: (theme: UITheme) => {
    try {
      localStorage.setItem('ati_ui_theme', theme);
    } catch (e) {
      console.warn('Failed to save theme in localStorage', e);
    }
    set({ uiTheme: theme });
  },
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
    get().savePlayerData();
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
    get().savePlayerData();
  },

  toggleMute: () => {
    const isMuted = soundEngine.toggleMute();
    set({ isMuted });
  },

  setMasterVolume: (masterVolume) => {
    soundEngine.setVolume(masterVolume);
    set({ masterVolume });
  },

  setKeyboardLayout: (keyboardLayout) => {
    try {
      localStorage.setItem('ati_keyboard_layout', keyboardLayout);
    } catch {}
    set({ keyboardLayout });
    get().savePlayerData();
  },
  setDailyStreak: (dailyStreak) => {
    try {
      localStorage.setItem('ati_streak_count', String(dailyStreak));
    } catch {}
    set({ dailyStreak });
    get().savePlayerData();
  },
  setGhostMode: (ghostMode) => set({ ghostMode }),
  setGhostWpm: (ghostWpm) => set({ ghostWpm }),
  setGhostPacingMode: (ghostPacingMode) => {
    set({ ghostPacingMode });
    get().savePlayerData();
  },
  setTimedDuration: (timedDuration) => set({ timedDuration }),

  buyShopItem: (item: ShopItem) => {
    const s = get();
    if (s.emeralds < item.cost) return false;
    if (s.level < item.lvl) return false;

    // Consumables add to inventory
    if (item.category === 'consumable') {
      const currentQty = s.inventory[item.id] || 0;
      const addAmount = item.id === 'consumable-shield-pack' ? 3 : 1;
      set({
        emeralds: s.emeralds - item.cost,
        inventory: { ...s.inventory, [item.id]: currentQty + addAmount },
      });
      soundEngine.playLevelUp();
      get().savePlayerData();
      return true;
    }

    // Permanent items
    if (s.ownedItems.includes(item.id)) return false;
    const newOwned = [...s.ownedItems, item.id];
    let newBoosters = { ...s.equippedBoosters };
    if (item.category === 'booster') {
      newBoosters[item.id] = true;
    }

    set({
      emeralds: s.emeralds - item.cost,
      ownedItems: newOwned,
      equippedBoosters: newBoosters,
    });
    soundEngine.playLevelUp();
    get().savePlayerData();
    return true;
  },

  toggleEquipBooster: (boosterId: string) => {
    const s = get();
    if (!s.ownedItems.includes(boosterId)) return;
    const current = !!s.equippedBoosters[boosterId];
    const updated = { ...s.equippedBoosters, [boosterId]: !current };
    set({ equippedBoosters: updated });
    soundEngine.playKey(false);
    get().savePlayerData();
  },

  useQuantumLeapToken: () => {
    const s = get();
    const tokens = s.inventory['token-quantum-leap'] || 0;
    if (tokens <= 0) return false;
    const nextLvl = Math.min(200, (s.unlockedLevels || 1) + 1);
    set({
      inventory: { ...s.inventory, ['token-quantum-leap']: tokens - 1 },
      unlockedLevels: nextLvl,
    });
    soundEngine.playLevelUp();
    get().savePlayerData();
    return true;
  },

  loadCustomText: (customText, _title) => {
    const clean = sanitizeTypingText(customText);
    if (!clean) return;
    const words = clean.split(/\s+/);
    const levelCap = calculateLevelGemCap(words, 1, 'Normal');
    set({
      text: clean,
      words,
      currentWordIndex: 0,
      currentCharIndex: 0,
      currentInput: '',
      typedWords: {},
      wordErrors: {},
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
      sessionGemsEarned: 0,
      currentWordErrors: 0,
      wordStartTime: null,
      levelMaxGemsCap: levelCap,
      lastWordGemResult: null,
      boss: null,
      activeScreen: 'game',
      activeModal: null,
      category: 'Literature',
    });
  },

  startChallengeSession: (challengeText, _title, challengeCategory) => {
    const clean = sanitizeTypingText(challengeText);
    if (!clean) return;
    const words = clean.split(/\s+/).filter(Boolean);
    const levelCap = calculateLevelGemCap(words, 1, 'Normal');
    set({
      text: clean,
      words,
      currentWordIndex: 0,
      currentCharIndex: 0,
      currentInput: '',
      typedWords: {},
      wordErrors: {},
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
      keystrokeIntervals: [],
      shiftLatencies: [],
      sessionGemsEarned: 0,
      currentWordErrors: 0,
      wordStartTime: null,
      levelMaxGemsCap: levelCap,
      lastWordGemResult: null,
      boss: null,
      activeScreen: 'game',
      activeModal: null,
      category: challengeCategory || 'Literature',
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
                    account_type: 'google'
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
    localStorage.removeItem('ati_local_user');
    set((s) => ({
      user: {
        ...s.user,
        id: 'player_default',
        name: 'Champion Typer',
        email: undefined,
        username: undefined,
        account_type: 'guest'
      }
    }));
  },

  registerLocalAccount: async (username: string, password: string, displayName?: string, avatar?: string) => {
    try {
      const res = await fetch('/api/local_account/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username,
          password,
          display_name: displayName,
          avatar: avatar || '👑'
        })
      });
      const data = await res.json();
      if (data.status === 'success' && data.user) {
        localStorage.setItem('ati_local_user', JSON.stringify(data.user));
        set((s) => ({
          user: {
            ...s.user,
            id: data.user.id,
            name: data.user.name,
            avatar: data.user.avatar,
            username: data.user.username,
            account_type: 'local'
          }
        }));
        await get().savePlayerData();
        return { success: true, message: 'Account created successfully!', user: data.user };
      }
      return { success: false, message: data.msg || 'Registration failed.' };
    } catch (e: any) {
      return { success: false, message: e.message || 'Network error registering account.' };
    }
  },

  loginLocalAccount: async (username: string, password: string) => {
    try {
      const res = await fetch('/api/local_account/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      const data = await res.json();
      if (data.status === 'success' && data.user) {
        localStorage.setItem('ati_local_user', JSON.stringify(data.user));
        set((s) => ({
          user: {
            ...s.user,
            id: data.user.id,
            name: data.user.name,
            avatar: data.user.avatar,
            username: data.user.username,
            account_type: 'local'
          }
        }));
        if (data.progress) {
          await get().importPlayerData(data.progress, 'overwrite');
        } else {
          await get().loadPlayerData();
        }
        return { success: true, message: 'Logged in successfully!', user: data.user };
      }
      return { success: false, message: data.msg || 'Invalid credentials.' };
    } catch (e: any) {
      return { success: false, message: e.message || 'Network error logging in.' };
    }
  },

  fetchLocalAccounts: async () => {
    try {
      const res = await fetch('/api/local_account/list');
      if (res.ok) {
        const data = await res.json();
        return data.accounts || [];
      }
      return [];
    } catch {
      return [];
    }
  },

  deleteAccount: async (userId?: string, accountType?: 'local' | 'google') => {
    const s = get();
    const targetId = userId || s.user.id;
    const targetType = accountType || s.user.account_type || (s.user.email ? 'google' : 'local');
    try {
      const res = await fetch('/api/delete_account', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': targetId
        },
        body: JSON.stringify({
          user_id: targetId,
          account_type: targetType
        })
      });
      const data = await res.json();
      if (data.status === 'success') {
        try {
          // Cloud purge from Supabase tables
          await supabaseService.deleteCloudAccount(targetId);
        } catch {}

        try {
          localStorage.removeItem('tq_google_user');
          localStorage.removeItem('ati_local_user');
          localStorage.removeItem('ati_player_save_v2');
          localStorage.removeItem('tq_last_session');
          localStorage.removeItem('ati_streak_count');
          localStorage.removeItem('ati_streak_last_claimed');
          localStorage.removeItem('ati_daily_reward_streak_v2');
        } catch {}

        set({
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
            account_type: 'guest'
          },
          level: 1,
          unlockedLevels: 1,
          emeralds: 1250,
          prestige: 0,
          dailyStreak: 1,
          heatmap: {},
          lastSession: null,
          ownedItems: ['visual-diamond-cursor'],
          equippedBoosters: {},
          inventory: { 'token-quantum-leap': 0, 'consumable-shield-pack': 0 },
          typoShieldsRemaining: 0,
          activeScreen: 'dashboard',
          activeModal: null,
          cloudSyncStatus: 'synced',
          lastCloudSync: null
        });

        return { success: true, message: data.msg || 'Account purged successfully.' };
      }
      return { success: false, message: data.msg || 'Deletion failed.' };
    } catch (e: any) {
      return { success: false, message: e.message || 'Error executing account deletion.' };
    }
  },

  savePlayerData: async () => {
    const s = get();
    const payload: PlayerSaveData = {
      version: APP_VERSION,
      timestamp: new Date().toISOString(),
      user: s.user,
      level: s.level,
      unlockedLevels: s.unlockedLevels,
      emeralds: s.emeralds,
      prestige: s.prestige,
      switchProfile: s.switchProfile,
      keyboardLayout: s.keyboardLayout,
      heatmap: s.heatmap,
      lastSession: s.lastSession,
      ownedItems: s.ownedItems,
      equippedBoosters: s.equippedBoosters,
      inventory: s.inventory,
      ghostPacingMode: s.ghostPacingMode,
      dailyStreak: s.dailyStreak,
      dailyQuests: s.dailyQuests,
      dailyMasterCrateClaimed: s.dailyMasterCrateClaimed,
      lastQuestDate: s.lastQuestDate,
    };

    try {
      localStorage.setItem('ati_player_save_v2', JSON.stringify(payload));
    } catch (e) {
      console.warn('[Storage] localStorage save failed:', e);
    }

    try {
      const userId = s.user?.id || 'player_default';
      await fetch(`/api/saveprogress?user_id=${encodeURIComponent(userId)}`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'X-User-Id': userId
        },
        body: JSON.stringify(payload)
      });
    } catch {
      // Offline fallback
    }

    // Cloud Shield: Backup to Supabase
    try {
      set({ cloudSyncStatus: 'syncing' });
      const cloudRes = await supabaseService.syncCloudProgress(s.user, payload);
      if (cloudRes.success) {
        set({
          cloudSyncStatus: 'synced',
          lastCloudSync: cloudRes.timestamp || new Date().toLocaleTimeString()
        });
      } else {
        set({ cloudSyncStatus: 'offline' });
      }
    } catch {
      set({ cloudSyncStatus: 'offline' });
    }
  },

  syncToCloud: async () => {
    const s = get();
    set({ cloudSyncStatus: 'syncing' });
    const payload: PlayerSaveData = {
      version: APP_VERSION,
      timestamp: new Date().toISOString(),
      user: s.user,
      level: s.level,
      unlockedLevels: s.unlockedLevels,
      emeralds: s.emeralds,
      prestige: s.prestige,
      switchProfile: s.switchProfile,
      keyboardLayout: s.keyboardLayout,
      heatmap: s.heatmap,
      lastSession: s.lastSession,
      ownedItems: s.ownedItems,
      equippedBoosters: s.equippedBoosters,
      inventory: s.inventory,
      ghostPacingMode: s.ghostPacingMode,
      dailyStreak: s.dailyStreak,
    };

    const res = await supabaseService.syncCloudProgress(s.user, payload);
    if (res.success) {
      set({
        cloudSyncStatus: 'synced',
        lastCloudSync: res.timestamp || new Date().toLocaleTimeString()
      });
      return { success: true, message: res.message };
    } else {
      set({ cloudSyncStatus: 'error' });
      return { success: false, message: res.message };
    }
  },

  loadPlayerData: async () => {
    let localData: PlayerSaveData | null = null;
    let remoteData: PlayerSaveData | null = null;

    try {
      const raw = localStorage.getItem('ati_player_save_v2');
      if (raw) localData = JSON.parse(raw);
    } catch {}

    try {
      const userId = get().user?.id || 'player_default';
      const res = await fetch(`/api/getprogress?user_id=${encodeURIComponent(userId)}`, {
        headers: { 'X-User-Id': userId }
      });
      if (res.ok) {
        const txt = await res.text();
        if (txt && txt.trim() && txt.startsWith('{')) {
          remoteData = JSON.parse(txt);
        }
      }
    } catch {}

    const candidate = remoteData && localData
      ? ((remoteData.level || 1) > (localData.level || 1) || (remoteData.emeralds || 0) > (localData.emeralds || 0) ? remoteData : localData)
      : (localData || remoteData);

    if (candidate) {
      set((s) => ({
        user: {
          ...s.user,
          ...(candidate.user || {}),
          id: s.user.id !== 'player_default' ? s.user.id : (candidate.user?.id || s.user.id),
          name: s.user.email ? s.user.name : (candidate.user?.name || s.user.name),
          avatar: candidate.user?.avatar || s.user.avatar || '👑',
          best_wpm: Math.max(s.user.best_wpm || 0, candidate.user?.best_wpm || 0),
          wins: Math.max(s.user.wins || 0, candidate.user?.wins || 0),
          races: Math.max(s.user.races || 0, candidate.user?.races || 0),
          avg_acc: candidate.user?.avg_acc || s.user.avg_acc || 100,
          eloRating: candidate.user?.eloRating ?? s.user.eloRating ?? 1200,
          eloDivision: candidate.user?.eloDivision ?? s.user.eloDivision ?? 'Gold',
          duelWins: candidate.user?.duelWins ?? s.user.duelWins ?? 0,
          duelLosses: candidate.user?.duelLosses ?? s.user.duelLosses ?? 0,
          streakShields: candidate.user?.streakShields ?? s.user.streakShields ?? 1,
        },
        level: Math.max(s.level, candidate.level || 1),
        unlockedLevels: Math.max(s.unlockedLevels, candidate.unlockedLevels || 1),
        emeralds: candidate.emeralds !== undefined ? candidate.emeralds : s.emeralds,
        prestige: candidate.prestige !== undefined ? candidate.prestige : s.prestige,
        switchProfile: candidate.switchProfile || s.switchProfile,
        keyboardLayout: candidate.keyboardLayout || s.keyboardLayout,
        heatmap: candidate.heatmap || s.heatmap,
        lastSession: candidate.lastSession || s.lastSession,
        ownedItems: candidate.ownedItems || s.ownedItems,
        equippedBoosters: candidate.equippedBoosters || s.equippedBoosters,
        inventory: candidate.inventory || s.inventory,
        ghostPacingMode: candidate.ghostPacingMode || s.ghostPacingMode,
        dailyQuests: candidate.dailyQuests || s.dailyQuests,
        dailyMasterCrateClaimed: candidate.dailyMasterCrateClaimed ?? s.dailyMasterCrateClaimed,
        lastQuestDate: candidate.lastQuestDate || s.lastQuestDate,
      }));

      if (candidate.switchProfile) {
        soundEngine.setProfile(candidate.switchProfile);
      }

      try {
        localStorage.setItem('ati_player_save_v2', JSON.stringify(candidate));
      } catch {}
    }
  },

  exportPlayerData: () => {
    const s = get();
    const payload: PlayerSaveData = {
      version: APP_VERSION,
      timestamp: new Date().toISOString(),
      user: s.user,
      level: s.level,
      unlockedLevels: s.unlockedLevels,
      emeralds: s.emeralds,
      prestige: s.prestige,
      switchProfile: s.switchProfile,
      keyboardLayout: s.keyboardLayout,
      heatmap: s.heatmap,
      lastSession: s.lastSession,
    };

    const jsonStr = JSON.stringify(payload, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const dateStr = new Date().toISOString().slice(0, 10);
    const safeName = (s.user.name || 'player').replace(/[^a-zA-Z0-9_-]/g, '_');
    const a = document.createElement('a');
    a.href = url;
    a.download = `ATI_Player_Backup_${safeName}_${dateStr}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  },

  importPlayerData: async (importedData: Partial<PlayerSaveData>, strategy: 'overwrite' | 'retain_old' | 'merge') => {
    if (strategy === 'retain_old') {
      return { success: true, message: 'Existing player data retained. No changes made.' };
    }

    const current = get();

    if (strategy === 'overwrite') {
      const newUser: UserProfile = {
        ...current.user,
        ...(importedData.user || {}),
        name: importedData.user?.name || current.user.name,
        avatar: importedData.user?.avatar || current.user.avatar || '👑',
        level: importedData.level || current.level || 1,
        best_wpm: importedData.user?.best_wpm ?? current.user.best_wpm ?? 0,
        races: importedData.user?.races ?? current.user.races ?? 0,
        wins: importedData.user?.wins ?? current.user.wins ?? 0,
        avg_acc: importedData.user?.avg_acc ?? current.user.avg_acc ?? 100,
      };
      const newLvl = importedData.level || 1;
      const newUnlocked = importedData.unlockedLevels || newLvl;
      const newEmeralds = importedData.emeralds !== undefined ? importedData.emeralds : 1250;
      const newPrestige = importedData.prestige || 0;
      const newSwitch = importedData.switchProfile || current.switchProfile;
      const newLayout = importedData.keyboardLayout || current.keyboardLayout;
      const newHeatmap = importedData.heatmap || {};
      const newLastSession = importedData.lastSession || null;

      set({
        user: newUser,
        level: newLvl,
        unlockedLevels: newUnlocked,
        emeralds: newEmeralds,
        prestige: newPrestige,
        switchProfile: newSwitch,
        keyboardLayout: newLayout,
        heatmap: newHeatmap,
        lastSession: newLastSession,
      });

      soundEngine.setProfile(newSwitch);
      await get().savePlayerData();
      await get().updateProfile(newUser.name, newUser.avatar);
      return { success: true, message: 'Player data successfully overwritten with imported backup!' };
    }

    if (strategy === 'merge') {
      const impUser = (importedData.user || {}) as Partial<UserProfile>;
      const mergedUser: UserProfile = {
        ...current.user,
        name: current.user.name || impUser.name || 'Champion Typer',
        avatar: current.user.avatar || impUser.avatar || '👑',
        level: Math.max(current.level, importedData.level || 1),
        best_wpm: Math.max(current.user.best_wpm || 0, impUser.best_wpm || 0),
        races: Math.max(current.user.races || 0, impUser.races || 0),
        wins: Math.max(current.user.wins || 0, impUser.wins || 0),
        avg_acc: Math.round(((current.user.avg_acc || 100) + (impUser.avg_acc || 100)) / 2),
      };

      const mergedLvl = Math.max(current.level, importedData.level || 1);
      const mergedUnlocked = Math.max(current.unlockedLevels, importedData.unlockedLevels || 1);
      const mergedEmeralds = Math.max(current.emeralds, importedData.emeralds || 0);
      const mergedPrestige = Math.max(current.prestige, importedData.prestige || 0);

      set({
        user: mergedUser,
        level: mergedLvl,
        unlockedLevels: mergedUnlocked,
        emeralds: mergedEmeralds,
        prestige: mergedPrestige,
      });

      await get().savePlayerData();
      await get().updateProfile(mergedUser.name, mergedUser.avatar);
      return { success: true, message: 'Smart Merge complete! Kept best stats and higher progress.' };
    }

    return { success: false, message: 'Invalid strategy specified.' };
  },

  fetchProfile: async () => {
    // 1. Restore complete saved player state from localStorage / SQLite
    await get().loadPlayerData();

    // 2. Check saved Google Auth from localStorage or SQLite API
    try {
      let u: any = null;
      const savedGoogle = localStorage.getItem('tq_google_user');
      if (savedGoogle) {
        try { u = JSON.parse(savedGoogle); } catch {}
      }
      if (!u || !u.name) {
        const resp = await fetch('/api/google_user');
        if (resp.ok) {
          const data = await resp.json();
          if (data && data.name) {
            u = data;
            try { localStorage.setItem('tq_google_user', JSON.stringify(u)); } catch {}
          }
        }
      }
      if (u && u.name) {
        set((s) => ({
          user: {
            ...s.user,
            id: u.id || s.user.id,
            name: u.name,
            email: u.email,
            avatar: u.picture || s.user.avatar,
          }
        }));
      }
    } catch {}

    // 3. Sync with SQLite Multiplayer Profile table
    try {
      const pid = get().user.id || 'player_default';
      const resp = await fetch(`/api/get_profile?id=${encodeURIComponent(pid)}`);
      if (resp.ok) {
        const data = await resp.json();
        if (data.name) {
          set((s) => ({
            user: {
              ...s.user,
              id: s.user.id !== 'player_default' ? s.user.id : (data.id || 'player_default'),
              name: s.user.email ? s.user.name : data.name,
              avatar: data.avatar || s.user.avatar || '👑',
              level: Math.max(s.user.level || 1, data.level || 1),
              rank: data.rank || s.user.rank || 'Rubber Dome Typer Trainee I',
              rank_color: data.rank_color || s.user.rank_color || '#a1887f',
              races: Math.max(s.user.races || 0, data.races || 0),
              wins: Math.max(s.user.wins || 0, data.wins || 0),
              best_wpm: Math.max(s.user.best_wpm || 0, data.best_wpm || 0),
              avg_acc: data.avg_acc || s.user.avg_acc || 100,
            }
          }));
        }
      }
    } catch {
      // Fallback
    }

    // 4. Fetch user's saved typing style and background typing stats
    try {
      await get().fetchTypingStyle();
      await get().fetchBackgroundStats();
    } catch {}
  },

  updateProfile: async (name, avatar) => {
    const current = get().user;
    const updated = { ...current, name, avatar };
    set({ user: updated });
    get().savePlayerData();

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
    const { level, mode, difficulty, category, casingStyle, isAIWordMode } = get();
    const isBossLevel = level % 40 === 0;

    const activeMode = (category === 'Coding' || mode === 'Code') ? 'Code' : mode;
    let textContent = getCurriculumText(level, activeMode as TypingMode, difficulty);

    let weakKeysTargeted: string[] = [];
    // AI synthesis covers Words, Lines and Paragraphs. Pages and Code always
    // use the curated level curriculum (no AI generator exists for them yet).
    const aiCapable = activeMode === 'Words' || activeMode === 'Lines' || activeMode === 'Paragraphs';
    if (isAIWordMode && aiCapable) {
      try {
        set({ isGeneratingAIWords: true });
        const targetCount = getLevelWordCount(level);
        const aiFormat = activeMode.toLowerCase();
        const resp = await fetch(`/api/generate_ai_words?level=${level}&count=${targetCount}&style=${casingStyle}&format=${aiFormat}`);
        if (resp.ok) {
          const data = await resp.json();
          if (data.text) textContent = data.text;
        }
      } catch {
        // Fallback to standard curriculum
      } finally {
        set({ isGeneratingAIWords: false });
      }
    } else {
      try {
        const resp = await fetch(`/api/getwords?level=${level}&mode=${encodeURIComponent(activeMode)}&diff=${encodeURIComponent(difficulty)}&style=${casingStyle}`);
        if (resp.ok) {
          const data = await resp.json();
          if (data.text) textContent = data.text;
          if (Array.isArray(data.weak_keys_targeted)) {
            weakKeysTargeted = data.weak_keys_targeted;
          }
        }
      } catch {
        // Deterministic curriculum used as reliable offline fallback
      }
    }

    // Sanitize all text to ensure 100% typeable ASCII characters (no curly quotes, em-dashes, or non-breaking spaces)
    textContent = sanitizeTypingText(textContent);

    // Client-side casing enforcement to guarantee user style is 100% active (bypassed for Code mode to preserve indentation and syntax)
    let words = textContent.trim().split(/\s+/);
    if (activeMode !== 'Code' && category !== 'Coding') {
      if (casingStyle === 'title_case') {
        words = words.map(w => w.length > 0 ? (w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()) : w);
        textContent = words.join(' ');
      } else if (casingStyle === 'all_caps') {
        words = words.map(w => w.toUpperCase());
        textContent = words.join(' ');
      } else if (casingStyle === 'standard_lowercase') {
        words = words.map(w => w.toLowerCase());
        textContent = words.join(' ');
      } else if (casingStyle === 'sentence_case') {
        // Normal language: lowercase everything, capitalize sentence starts
        textContent = textContent.toLowerCase().replace(/(^|[.!?]\s+)([a-z])/g, (_m, pre, ch) => pre + ch.toUpperCase());
        words = textContent.trim().split(/\s+/);
      }
    }

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

    const s = get();
    const hasAegis = !!(s.equippedBoosters['booster-aegis-shield'] || s.equippedBoosters['booster-typo-shield'] || s.equippedBoosters['forge-temporal-aegis']);
    const initialShields = s.equippedBoosters['forge-temporal-aegis'] ? 4 : hasAegis ? 3 : ((s.inventory['consumable-shield-pack'] || 0) > 0 ? 1 : 0);
    const initialStreak = s.equippedBoosters['forge-hyperdrive-scanner'] ? 15 : s.equippedBoosters['booster-adrenaline'] ? 10 : 0;
    const levelCap = calculateLevelGemCap(words, level, difficulty);

    set({
      text: textContent,
      words,
      currentWordIndex: 0,
      currentCharIndex: 0,
      currentInput: '',
      typedWords: {},
      wordErrors: {},
      startTime: null,
      endTime: null,
      elapsedSeconds: 0,
      wpm: 0,
      rawWpm: 0,
      accuracy: 100,
      currentStreak: initialStreak,
      maxStreak: initialStreak,
      totalErrors: 0,
      totalKeystrokes: 0,
      keystrokeIntervals: [],
      shiftLatencies: [],
      sessionGemsEarned: 0,
      currentWordErrors: 0,
      wordStartTime: null,
      levelMaxGemsCap: levelCap,
      lastWordGemResult: null,
      cleanWordsInRow: 0,
      comboMultiplierValue: 1.0,
      hasOpenedLuckyChest: false,
      luckyChestReward: null,
      aiWeakKeys: weakKeysTargeted.length > 0 ? weakKeysTargeted : (s.aiWeakKeys || []),
      typoShieldsRemaining: initialShields,
      lastShieldAbsorbTime: null,
      boss,
    });
  },

  startSession: () => {
    set({
      startTime: Date.now(),
      elapsedSeconds: 0,
    });
  },

  jumpToWord: (targetIndex: number) => {
    const s = get();
    if (s.activeScreen !== 'game' && !(s.activeScreen === 'multiplayer' && s.isMpRacing)) return;
    if (targetIndex < 0 || targetIndex >= s.words.length) return;
    if (targetIndex === s.currentWordIndex) return;

    if (targetIndex < s.currentWordIndex) {
      const newTyped = { ...s.typedWords };
      const newWordErrors = { ...s.wordErrors };
      let adjustedErrors = s.totalErrors;

      // Save current input if typist was partway through
      if (s.currentInput.length > 0) {
        newTyped[s.currentWordIndex] = s.currentInput;
      }

      // Refund the error penalty for target word so fixing it doesn't double-penalize
      if (newWordErrors[targetIndex]) {
        adjustedErrors = Math.max(0, adjustedErrors - 1);
        delete newWordErrors[targetIndex];
      }

      const targetTyped = newTyped[targetIndex] ?? s.words[targetIndex] ?? '';
      delete newTyped[targetIndex];

      set({
        currentWordIndex: targetIndex,
        currentInput: targetTyped,
        typedWords: newTyped,
        wordErrors: newWordErrors,
        totalErrors: adjustedErrors,
      });
      soundEngine.playKey(false);
    }
  },

  handleKeyInput: (char, isBackspace = false, isCtrl = false) => {
    const state = get();
    if (state.activeScreen !== 'game' && !(state.activeScreen === 'multiplayer' && state.isMpRacing)) return;
    const {
      words,
      currentWordIndex,
      currentInput,
      typedWords,
      wordErrors,
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

    if (!state.wordStartTime && !isBackspace) {
      set({ wordStartTime: Date.now() });
    }

    const currentTargetWord = words[currentWordIndex] || '';

    // Backspace handling
    if (isBackspace) {
      // Ctrl + Backspace: clear current word input or jump back to previous word
      if (isCtrl) {
        if (currentInput.length > 0) {
          const hasMistakeBuffer = !!(state.equippedBoosters['booster-mistake-buffer'] || state.equippedBoosters['forge-tranquil-overdrive']);
          const updatedWordErrors = hasMistakeBuffer ? Math.max(0, (state.currentWordErrors || 0) - 1) : (state.currentWordErrors || 0);
          set({ currentInput: '', currentWordErrors: updatedWordErrors });
          soundEngine.playKey(false);
        } else if (currentWordIndex > 0) {
          const prevIdx = currentWordIndex - 1;
          const newTyped = { ...typedWords };
          const newWordErrors = { ...wordErrors };
          let adjustedErrors = totalErrors;
          if (newWordErrors[prevIdx]) {
            adjustedErrors = Math.max(0, adjustedErrors - 1);
            delete newWordErrors[prevIdx];
          }
          delete newTyped[prevIdx];
          set({
            currentWordIndex: prevIdx,
            currentInput: '',
            typedWords: newTyped,
            wordErrors: newWordErrors,
            totalErrors: adjustedErrors,
          });
          soundEngine.playKey(false);
        }
        return;
      }

      // Normal Backspace: if user has typed characters in current word, delete last character
      if (currentInput.length > 0) {
        const hasMistakeBuffer = !!(state.equippedBoosters['booster-mistake-buffer'] || state.equippedBoosters['forge-tranquil-overdrive']);
        const updatedWordErrors = hasMistakeBuffer ? Math.max(0, (state.currentWordErrors || 0) - 1) : (state.currentWordErrors || 0);
        set({ 
          currentInput: currentInput.slice(0, -1),
          currentWordErrors: updatedWordErrors,
        });
        return;
      }

      // If current word is empty and user hits Backspace, jump back to previous word!
      if (currentWordIndex > 0) {
        const prevIdx = currentWordIndex - 1;
        const prevTyped = typedWords[prevIdx] ?? words[prevIdx] ?? '';
        const newTyped = { ...typedWords };
        const newWordErrors = { ...wordErrors };
        let adjustedErrors = totalErrors;
        if (newWordErrors[prevIdx]) {
          adjustedErrors = Math.max(0, adjustedErrors - 1);
          delete newWordErrors[prevIdx];
        }
        delete newTyped[prevIdx];

        set({
          currentWordIndex: prevIdx,
          currentInput: prevTyped,
          typedWords: newTyped,
          wordErrors: newWordErrors,
          totalErrors: adjustedErrors,
        });
        soundEngine.playKey(false);
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

      const streakGuardian = !!(state.equippedBoosters['booster-streak-guardian'] || state.equippedBoosters['forge-tranquil-overdrive']);
      const newStreak = isWordCorrect 
        ? currentStreak + 1 
        : streakGuardian 
        ? (currentStreak >= 50 ? 25 : currentStreak >= 25 ? 10 : currentStreak >= 10 ? 5 : 0)
        : 0;

      // Extract user strong keys from heatmap (>95% accuracy with at least 12 keystrokes)
      const userStrongKeys = Object.entries(heatmap)
        .filter(([_, data]) => data.hits >= 12 && (data.hits / Math.max(1, data.hits + data.errors)) >= 0.95)
        .map(([k]) => k);

      // Boosters & multipliers
      const hasFlowStabilizer = !!(state.equippedBoosters['booster-flow-stabilizer'] || state.equippedBoosters['forge-tranquil-overdrive']);
      const hasWeakSpotConqueror = !!(state.equippedBoosters['booster-weak-spot-conqueror'] || state.equippedBoosters['forge-neuro-conqueror']);

      let luckyMultiplier = 1.0;
      if (state.equippedBoosters['booster-lucky-gem-magnet'] || state.equippedBoosters['forge-neuro-conqueror']) {
        if (Math.random() < 0.25) {
          luckyMultiplier = Math.random() < 0.35 ? 3.0 : 2.0;
        }
      }

      const boosterMultiplier = state.equippedBoosters['forge-vampiric-piercer'] 
        ? 1.75 
        : (state.equippedBoosters['booster-emerald-alchemist'] || state.equippedBoosters['booster-emerald']) 
        ? 1.5 
        : (state.equippedBoosters['booster-cadence-metronome'] || state.equippedBoosters['forge-tranquil-overdrive'])
        ? 1.25
        : 1.0;

      const wordDuration = state.wordStartTime ? (Date.now() - state.wordStartTime) : 0;
      const levelCapRemaining = Math.max(0, (state.levelMaxGemsCap || 500) - (state.sessionGemsEarned || 0));

      const gemResult = calculateEarnedWordGems(currentTargetWord, currentInput, state.currentWordErrors, {
        streak: newStreak,
        boosterMultiplier,
        level: state.level,
        wordDurationMs: wordDuration,
        userWeakKeys: state.aiWeakKeys || [],
        userStrongKeys,
        levelCapRemaining,
        luckyMultiplier,
        hasFlowStabilizer,
        hasWeakSpotConqueror,
      });

      let finalStreak = newStreak;
      if (isWordCorrect && (state.equippedBoosters['booster-overdrive-matrix'] || state.equippedBoosters['forge-tranquil-overdrive'])) {
        if (wordDuration > 0 && wordDuration < 1600) {
          finalStreak += 5;
        }
      }
      const newMaxStreak = Math.max(maxStreak, finalStreak);

      const newSessionGems = (state.sessionGemsEarned || 0) + gemResult.earnedGems;
      const newVaultGems = (state.emeralds || 0) + gemResult.earnedGems;

      let updatedBoss = boss;
      if (isWordCorrect) {
        existingKeyData.hits++;
        if (finalStreak > 0 && finalStreak % 15 === 0) {
          soundEngine.playCombo();
        } else {
          soundEngine.playGemPickup(gemResult.difficultyTier === 'hard' || gemResult.difficultyTier === 'legendary');
        }
        if (boss && boss.isBoss) {
          const dmg = state.equippedBoosters['forge-vampiric-piercer'] ? 38 : state.equippedBoosters['booster-boss-piercer'] ? 30 : 15;
          soundEngine.playBossHit();
          updatedBoss = {
            ...boss,
            currentHp: Math.max(0, boss.currentHp - dmg),
          };
          if (state.equippedBoosters['forge-vampiric-piercer']) {
            set((prev) => ({ emeralds: (prev.emeralds || 0) + 5 }));
          }
        }
      } else {
        if (!state.equippedBoosters['booster-zen-anti-stress'] && !state.equippedBoosters['forge-tranquil-overdrive']) {
          soundEngine.playError();
        } else {
          soundEngine.playKey(false);
        }
        existingKeyData.errors++;
      }

      const updatedTypedWords = {
        ...typedWords,
        [currentWordIndex]: currentInput,
      };

      const updatedWordErrors = {
        ...wordErrors,
        [currentWordIndex]: !isWordCorrect,
      };

      const isWordFullyClean = isWordCorrect && (state.currentWordErrors || 0) === 0;
      const nextCleanWords = isWordFullyClean ? (state.cleanWordsInRow || 0) + 1 : 0;
      let nextMultiplier = 1.0;
      if (nextCleanWords >= 35) nextMultiplier = 3.0;
      else if (nextCleanWords >= 20) nextMultiplier = 2.0;
      else if (nextCleanWords >= 10) nextMultiplier = 1.5;
      else if (nextCleanWords >= 5) nextMultiplier = 1.2;

      if (nextCleanWords === 5) soundEngine.playComboChime(1);
      else if (nextCleanWords === 10) soundEngine.playComboChime(2);
      else if (nextCleanWords === 20) soundEngine.playComboChime(3);
      else if (nextCleanWords === 35) soundEngine.playComboChime(4);

      set({
        currentWordIndex: nextWordIndex,
        currentInput: '',
        wordStartTime: null,
        typedWords: updatedTypedWords,
        wordErrors: updatedWordErrors,
        currentStreak: finalStreak,
        maxStreak: newMaxStreak,
        cleanWordsInRow: nextCleanWords,
        comboMultiplierValue: nextMultiplier,
        totalErrors: isWordCorrect ? totalErrors : totalErrors + 1,
        totalKeystrokes: totalKeystrokes + 1,
        sessionGemsEarned: newSessionGems,
        emeralds: newVaultGems,
        lastWordGemResult: { ...gemResult, wordIndex: currentWordIndex, key: Date.now() + Math.random() },
        currentWordErrors: 0,
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
    const isCorrect = isEquivalentKey(char, expectedChar);

    if (isCorrect) {
      existingKeyData.hits++;
      const nextInput = currentInput + expectedChar;
      const newStreak = currentStreak + 1;
      const newMaxStreak = Math.max(maxStreak, newStreak);

      if (newStreak === 50 || (newStreak > 50 && newStreak % 25 === 0)) {
        soundEngine.playHyperdrive();
      } else if (newStreak === 15 || newStreak === 30) {
        soundEngine.playCombo();
      }

      set({
        currentInput: nextInput,
        currentStreak: newStreak,
        maxStreak: newMaxStreak,
        totalKeystrokes: totalKeystrokes + 1,
        heatmap: { ...heatmap, [lowerKey]: existingKeyData },
      });

      // Words mode auto check if end of last word
      if (currentWordIndex === words.length - 1 && nextInput === currentTargetWord) {
        const updatedTypedWords = {
          ...typedWords,
          [currentWordIndex]: nextInput,
        };

        const userStrongKeys = Object.entries(heatmap)
          .filter(([_, data]) => data.hits >= 12 && (data.hits / Math.max(1, data.hits + data.errors)) >= 0.95)
          .map(([k]) => k);

        const hasFlowStabilizer = !!(state.equippedBoosters['booster-flow-stabilizer'] || state.equippedBoosters['forge-tranquil-overdrive']);
        const hasWeakSpotConqueror = !!(state.equippedBoosters['booster-weak-spot-conqueror'] || state.equippedBoosters['forge-neuro-conqueror']);

        let luckyMultiplier = 1.0;
        if (state.equippedBoosters['booster-lucky-gem-magnet'] || state.equippedBoosters['forge-neuro-conqueror']) {
          if (Math.random() < 0.25) {
            luckyMultiplier = Math.random() < 0.35 ? 3.0 : 2.0;
          }
        }

        const boosterMultiplier = state.equippedBoosters['forge-vampiric-piercer'] 
          ? 1.75 
          : (state.equippedBoosters['booster-emerald-alchemist'] || state.equippedBoosters['booster-emerald']) 
          ? 1.5 
          : (state.equippedBoosters['booster-cadence-metronome'] || state.equippedBoosters['forge-tranquil-overdrive'])
          ? 1.25
          : 1.0;

        const wordDuration = state.wordStartTime ? (Date.now() - state.wordStartTime) : 0;
        const levelCapRemaining = Math.max(0, (state.levelMaxGemsCap || 500) - (state.sessionGemsEarned || 0));

        const gemResult = calculateEarnedWordGems(currentTargetWord, nextInput, state.currentWordErrors, {
          streak: newStreak,
          boosterMultiplier,
          level: state.level,
          wordDurationMs: wordDuration,
          userWeakKeys: state.aiWeakKeys || [],
          userStrongKeys,
          levelCapRemaining,
          luckyMultiplier,
          hasFlowStabilizer,
          hasWeakSpotConqueror,
        });

        const newSessionGems = (state.sessionGemsEarned || 0) + gemResult.earnedGems;
        const newVaultGems = (state.emeralds || 0) + gemResult.earnedGems;

        set({
          typedWords: updatedTypedWords,
          sessionGemsEarned: newSessionGems,
          emeralds: newVaultGems,
          wordStartTime: null,
          lastWordGemResult: { ...gemResult, wordIndex: currentWordIndex, key: Date.now() + Math.random() },
          currentWordErrors: 0,
        });

        if (isMpRacing) {
          mpService.sendFinish(get().wpm);
        } else {
          get().finishSession();
        }
      }
    } else {
      // Prevent unbounded overtyping
      if (currentInput.length >= currentTargetWord.length + 6) {
        if (!state.equippedBoosters['booster-zen-anti-stress'] && !state.equippedBoosters['forge-tranquil-overdrive']) {
          soundEngine.playError();
        } else {
          soundEngine.playKey(false);
        }
        return;
      }

      // Aegis Typo Shield absorption
      if (state.typoShieldsRemaining > 0) {
        soundEngine.playKey(false);
        set({
          currentInput: currentInput + char,
          typoShieldsRemaining: state.typoShieldsRemaining - 1,
          lastShieldAbsorbTime: Date.now(),
          totalKeystrokes: totalKeystrokes + 1,
        });
        return;
      }

      // Sudden Death Mode check: 1 typo terminates session immediately
      if (state.mode === 'SuddenDeath') {
        soundEngine.playSuddenDeathFail();
        existingKeyData.errors++;
        set({
          currentInput: currentInput + char,
          totalErrors: totalErrors + 1,
          cleanWordsInRow: 0,
          comboMultiplierValue: 1.0,
          heatmap: { ...heatmap, [lowerKey]: existingKeyData },
        });
        get().finishSession();
        return;
      }

      if (!state.equippedBoosters['booster-zen-anti-stress'] && !state.equippedBoosters['forge-tranquil-overdrive']) {
        soundEngine.playError();
      } else {
        soundEngine.playKey(false);
      }

      existingKeyData.errors++;

      const streakGuardian = !!(state.equippedBoosters['booster-streak-guardian'] || state.equippedBoosters['forge-tranquil-overdrive']);
      const newStreak = streakGuardian 
        ? (currentStreak >= 50 ? 25 : currentStreak >= 25 ? 10 : currentStreak >= 10 ? 5 : 0)
        : 0;

      const nextClean = streakGuardian ? Math.max(0, (state.cleanWordsInRow || 0) - 5) : 0;
      let nextMultiplier = 1.0;
      if (nextClean >= 35) nextMultiplier = 3.0;
      else if (nextClean >= 20) nextMultiplier = 2.0;
      else if (nextClean >= 10) nextMultiplier = 1.5;
      else if (nextClean >= 5) nextMultiplier = 1.2;

      set({
        currentInput: currentInput + char,
        currentStreak: newStreak,
        cleanWordsInRow: nextClean,
        comboMultiplierValue: nextMultiplier,
        totalErrors: totalErrors + 1,
        currentWordErrors: (state.currentWordErrors || 0) + 1,
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

  finishSession: async (liveIntervals?: number[], liveShiftLatencies?: number[]) => {
    const state = get();
    // Guard against multiple calls if already on results screen
    if (state.activeScreen === 'results') return;

    const intervalsToSend = (liveIntervals && liveIntervals.length > 0)
      ? liveIntervals
      : state.keystrokeIntervals;
    const shiftsToSend = (liveShiftLatencies && liveShiftLatencies.length > 0)
      ? liveShiftLatencies
      : state.shiftLatencies;

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

    // Calculate words correct percentage for passing criterion
    const totalWordsCount = Math.max(1, state.words.length);
    let wordsCorrectCount = 0;
    for (let i = 0; i < totalWordsCount; i++) {
      const targetWord = state.words[i] ? state.words[i].trim() : '';
      const typedWord = state.typedWords[i] ? state.typedWords[i].trim() : (i === state.currentWordIndex ? state.currentInput.trim() : '');
      const hasError = state.wordErrors[i];
      if (hasError === false || (!hasError && typedWord === targetWord && targetWord.length > 0)) {
        wordsCorrectCount++;
      }
    }
    const wordsCorrectPercentage = Math.round((wordsCorrectCount / totalWordsCount) * 100);
    const requiredPassPercentage = state.difficulty === 'Easy' ? 70 : state.difficulty === 'Hard' ? 80 : 75;
    const passed = wordsCorrectPercentage >= requiredPassPercentage;

    if (passed) {
      soundEngine.playLevelUp();
    } else {
      soundEngine.playError();
    }

    const emeraldMultiplier = state.equippedBoosters['forge-vampiric-piercer'] 
      ? 1.75 
      : (state.equippedBoosters['booster-emerald-alchemist'] || state.equippedBoosters['booster-emerald']) 
      ? 1.5 
      : 1.0;
    const baseReward = Math.round(finalWpm * 2 * (finalAcc / 100) * emeraldMultiplier);
    const bonus = state.level % 40 === 0 ? 500 : 50;
    const sessionGems = state.sessionGemsEarned || 0;
    const totalEarned = passed ? Math.max(50, (Number.isFinite(baseReward) ? baseReward : 50) + bonus) : 0;
    let totalSessionGems = passed
      ? (sessionGems > 0 ? sessionGems + bonus : totalEarned)
      : sessionGems;
    let vaultAddition = passed ? (sessionGems > 0 ? bonus : totalEarned) : 0;

    // Sudden Death 3x Emerald multiplier on surviving with no errors
    if (state.mode === 'SuddenDeath' && state.totalErrors === 0 && passed) {
      vaultAddition = Math.round(vaultAddition * 3.0);
      totalSessionGems = Math.round(totalSessionGems * 3.0);
    }

    // Matiks 1v1 Duel Evaluation
    let duelOutcome: { won: boolean; eloDelta: number; newElo: number; opponentName: string } | null = null;
    let updatedUser = { ...state.user };

    if (state.isDuel && state.duelOpponent) {
      const opp = state.duelOpponent;
      const oppTimeSecs = Math.max(12, Math.round((totalWordsCount / (opp.targetWpm / 60))));
      const won = (elapsedSeconds <= oppTimeSecs && passed);
      const eloDelta = won ? 24 : -16;
      const currentElo = state.user.eloRating || 1200;
      const newElo = Math.max(400, currentElo + eloDelta);
      const newDivision = getDivisionForElo(newElo);
      const newWins = (state.user.duelWins || 0) + (won ? 1 : 0);
      const newLosses = (state.user.duelLosses || 0) + (won ? 0 : 1);

      if (won) {
        soundEngine.playDuelWin();
      } else {
        soundEngine.playDuelLoss();
      }

      duelOutcome = { won, eloDelta, newElo, opponentName: opp.name };
      updatedUser = {
        ...updatedUser,
        eloRating: newElo,
        eloDivision: newDivision,
        duelWins: newWins,
        duelLosses: newLosses,
      };
    }

    // Daily Quests Progression
    const todayStr = new Date().toISOString().split('T')[0];
    const updatedQuests = (state.dailyQuests || []).map((q) => {
      let current = q.current;
      if (q.id.startsWith('quest_ignition')) {
        current = Math.min(q.target, current + 1);
      } else if (q.id.startsWith('quest_accuracy')) {
        if (finalAcc >= 96) current = 1;
      } else if (q.id.startsWith('quest_volume')) {
        current = Math.min(q.target, current + wordsCorrectCount);
      }
      return {
        ...q,
        current,
        completed: current >= q.target,
      };
    });
    try {
      localStorage.setItem('ati_daily_quests', JSON.stringify({ date: todayStr, quests: updatedQuests }));
    } catch {}

    // Continuous Daily Streak Check with Streak Shield Protection
    const lastDate = state.lastDailyRewardDate;
    let newStreak = state.dailyStreak || 1;
    let shields = updatedUser.streakShields ?? 1;

    if (lastDate && lastDate !== todayStr) {
      const lastTime = new Date(lastDate).getTime();
      const nowTime = new Date(todayStr).getTime();
      const diffDays = Math.round((nowTime - lastTime) / (1000 * 60 * 60 * 24));
      if (diffDays === 1) {
        newStreak += 1;
      } else if (diffDays > 1) {
        if (shields > 0) {
          shields -= 1; // Auto-consume shield to protect momentum!
        } else {
          newStreak = 1;
        }
      }
    }
    updatedUser.streakShields = shields;
    try {
      localStorage.setItem('ati_streak_count', String(newStreak));
      localStorage.setItem('ati_last_reward_date', todayStr);
    } catch {}

    const result: SessionResult = {
      level: state.level || 1,
      mode: state.mode || 'Words',
      difficulty: state.difficulty || 'Normal',
      wpm: Number.isFinite(finalWpm) ? finalWpm : 0,
      rawWpm: Number.isFinite(finalRawWpm) ? finalRawWpm : 0,
      accuracy: Number.isFinite(finalAcc) ? finalAcc : 100,
      errors: state.totalErrors || 0,
      emeraldsEarned: totalSessionGems,
      durationSeconds: elapsedSeconds,
      timestamp: new Date().toLocaleTimeString(),
      passed,
      wordsCorrectPercentage,
      wordsCorrectCount,
      totalWordsCount,
      requiredPassPercentage,
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
      emeralds: (s.emeralds || 0) + vaultAddition,
      unlockedLevels: passed ? Math.max(s.unlockedLevels || 1, (s.level || 1) + 1) : (s.unlockedLevels || 1),
      lastSession: result,
      duelResult: duelOutcome,
      dailyQuests: updatedQuests,
      dailyStreak: newStreak,
      lastDailyRewardDate: todayStr,
      hasOpenedLuckyChest: false,
      luckyChestReward: null,
      user: {
        ...updatedUser,
        best_wpm: Math.max(updatedUser.best_wpm || 0, finalWpm),
      }
    }));

    try {
      await fetch(
        `/api/save?level=${state.level}&mode=${encodeURIComponent(state.mode)}&diff=${encodeURIComponent(state.difficulty)}&wpm=${finalWpm}&accuracy=${finalAcc}&emeralds=${totalSessionGems}`
      );
    } catch {
      // Offline fallback
    }

    // Trigger auto-promotion check with intelligent skill jump
    get().checkAutoPromotion(finalWpm, finalAcc).then((promo) => {
      if (promo && promo.eligible) {
        set({ promotionOffer: promo, activeModal: 'promotion' });
      }
    }).catch(() => {});

    // Generate conversational AI coaching insights with live or recorded biometric stream
    get().fetchCoachingInsights(finalWpm, finalAcc, intervalsToSend, shiftsToSend).catch(() => {});

    // Update AI weak spots from latest session telemetry
    get().fetchWeakSpots().catch(() => {});

    // Persist full player data state to localStorage & SQLite
    await get().savePlayerData();
  },

  recordKeystrokeInterval: (interval: number) => {
    set((s) => ({
      keystrokeIntervals: [...s.keystrokeIntervals.slice(-120), interval],
    }));
  },

  recordShiftLatency: (latency: number) => {
    set((s) => ({
      shiftLatencies: [...s.shiftLatencies.slice(-60), latency],
    }));
  },

  resetTypingState: () => {
    get().fetchNewBatch();
  },

  addEmeralds: (amount) => {
    set((s) => ({ emeralds: s.emeralds + amount }));
    get().savePlayerData();
  },

  // ── MATIKS COMPETITIVE ACTIONS ──────────────────────────────
  startInstantDuel: async () => {
    const s = get();
    const rivals = [
      { name: 'Apex_Viper', avatar: '⚡', wpmOffset: 2, eloOffset: 15 },
      { name: 'Quantum_Nova', avatar: '✨', wpmOffset: -3, eloOffset: -20 },
      { name: 'Shadow_Strike', avatar: '🥷', wpmOffset: 3, eloOffset: 25 },
      { name: 'Echo_Drifter', avatar: '🏎️', wpmOffset: -2, eloOffset: -10 },
      { name: 'Aegis_Vanguard', avatar: '🛡️', wpmOffset: 1, eloOffset: 10 },
      { name: 'Zenith_Ghost', avatar: '🤖', wpmOffset: -4, eloOffset: -30 },
    ];
    const picked = rivals[Math.floor(Math.random() * rivals.length)];
    const rivalElo = Math.max(400, Math.round((s.user.eloRating || 1200) + picked.eloOffset));
    const rivalWpm = Math.max(30, Math.round((s.user.best_wpm || 55) + picked.wpmOffset));

    set({
      isDuel: true,
      isSuddenDeath: false,
      duelResult: null,
      hasOpenedLuckyChest: false,
      luckyChestReward: null,
      duelOpponent: {
        name: picked.name,
        avatar: picked.avatar,
        elo: rivalElo,
        division: getDivisionForElo(rivalElo),
        targetWpm: rivalWpm,
        progress: 0,
      },
      category: 'Competitions',
      mode: 'Words',
      activeScreen: 'game',
    });
    await get().fetchNewBatch();
  },

  startSuddenDeath: () => {
    set({
      isDuel: false,
      isSuddenDeath: true,
      mode: 'SuddenDeath',
      category: 'SpeedTest',
      duelResult: null,
      hasOpenedLuckyChest: false,
      luckyChestReward: null,
      activeScreen: 'game',
    });
    get().fetchNewBatch();
  },

  claimDailyQuest: (questId: string) => {
    const s = get();
    const quests = (s.dailyQuests || []).map((q) => {
      if (q.id === questId && q.completed && !q.claimed) {
        s.addEmeralds(q.rewardEmeralds);
        soundEngine.playGemPickup(true);
        return { ...q, claimed: true };
      }
      return q;
    });
    set({ dailyQuests: quests });
    const todayStr = new Date().toISOString().split('T')[0];
    try {
      localStorage.setItem('ati_daily_quests', JSON.stringify({ date: todayStr, quests }));
    } catch {}
    get().savePlayerData();
  },

  claimDailyMasterCrate: () => {
    const s = get();
    const allDone = s.dailyQuests.length > 0 && s.dailyQuests.every(q => q.completed);
    if (!allDone || s.dailyMasterCrateClaimed) return;

    soundEngine.playChestOpen();
    const newShields = Math.min(2, (s.user.streakShields || 0) + 1);
    const todayStr = new Date().toISOString().split('T')[0];
    try {
      localStorage.setItem('ati_master_crate_date', todayStr);
    } catch {}

    set((state) => ({
      dailyMasterCrateClaimed: true,
      emeralds: state.emeralds + 300,
      user: {
        ...state.user,
        streakShields: newShields,
      },
    }));
    get().savePlayerData();
  },

  buyStreakShield: () => {
    const s = get();
    const currentShields = s.user.streakShields || 0;
    if (s.emeralds < 350 || currentShields >= 2) return false;

    set((state) => ({
      emeralds: state.emeralds - 350,
      user: {
        ...state.user,
        streakShields: currentShields + 1,
      },
    }));
    soundEngine.playLevelUp();
    get().savePlayerData();
    return true;
  },

  openLuckyChest: () => {
    const s = get();
    if (s.hasOpenedLuckyChest) return null;

    soundEngine.playChestOpen();
    const gemReward = 150 + Math.floor(Math.random() * 250); // 150-400 gems
    const getsShield = Math.random() < 0.30 && (s.user.streakShields || 0) < 2;

    const reward = {
      emeralds: gemReward,
      streakShield: getsShield,
    };

    set((state) => ({
      hasOpenedLuckyChest: true,
      luckyChestReward: reward,
      emeralds: state.emeralds + gemReward,
      user: {
        ...state.user,
        streakShields: getsShield ? (state.user.streakShields || 0) + 1 : state.user.streakShields,
      },
    }));

    get().savePlayerData();
    return reward;
  },

  // ── MULTIPLAYER IMPLEMENTATION ────────────────────────────
  initMultiplayer: () => {
    mpService.subscribe((msg) => {
      if (msg.type === 'room_created') {
        const u = get().user;
        set({
          mpRoom: {
            code: msg.code,
            host: u.id,
            mode: msg.mode || 'race',
            text: msg.text,
            started: false,
            finished: false,
            players: {
              [u.id]: {
                id: u.id,
                name: u.name,
                avatar: u.avatar,
                level: u.level,
                rank: u.rank,
                rank_color: u.rank_color,
                best_wpm: u.best_wpm,
                races_won: u.wins,
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
          mpError: null,
        });
      } else if (msg.type === 'room_error') {
        set({ mpError: msg.msg || 'Could not reach the multiplayer server. Check your connection and retry.' });
      } else if (msg.type === 'room_joined') {
        const u = get().user;
        set({
          mpRoom: {
            code: msg.code,
            host: msg.host,
            mode: msg.mode,
            text: msg.text,
            started: false,
            finished: false,
            players: {
              [u.id]: {
                id: u.id,
                name: u.name,
                avatar: u.avatar,
                level: u.level,
                rank: u.rank,
                rank_color: u.rank_color,
                best_wpm: u.best_wpm,
                races_won: u.wins,
                progress: 0,
                wpm: 0,
                ready: false,
                finished: false,
              }
            },
          },
          mpIsHost: false,
          mpPodium: null,
          isMpRacing: false,
          mpError: null,
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
      } else if (msg.type === 'countdown' || msg.type === 'race_countdown') {
        soundEngine.playKey(false);
        set({ mpCountdown: msg.count });
      } else if (msg.type === 'race_start') {
        soundEngine.playLevelUp();
        const textContent = msg.text || get().mpRoom?.text || FALLBACK_WORDS['Words'];
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
        const currentMsgs = get().mpChatMessages;
        const lastMsg = currentMsgs[currentMsgs.length - 1];
        // Avoid duplicating optimistically appended message within 3s
        if (lastMsg && lastMsg.sender === msg.sender && lastMsg.text === msg.text && Math.abs((msg.ts || 0) - lastMsg.ts) < 3000) {
          return;
        }
        set((s) => ({
          mpChatMessages: [
            ...s.mpChatMessages,
            { sender: msg.sender, avatar: msg.avatar || '💬', text: msg.text, ts: msg.ts || Date.now() }
          ].slice(-50)
        }));
      }
    });
  },

  createMpRoom: async (mode = 'race', text, isPublic = true) => {
    await mpService.connect();
    mpService.createRoom(get().user, mode, text, isPublic);
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
    const room = get().mpRoom;
    if (!room) return;
    const u = get().user;
    // Room entries are keyed by per-window session key (not user id), so
    // match by payload id first, then fall back to key or name.
    const entry = Object.entries(room.players).find(([key, p]) =>
      p.id === u.id || key === u.id || p.id === 'me' || p.name === u.name);
    const myPlayer = entry?.[1];
    const myKey = entry?.[0];
    const newReady = myPlayer ? !myPlayer.ready : true;

    // Optimistic local update
    if (myPlayer && myKey) {
      set({
        mpRoom: {
          ...room,
          players: {
            ...room.players,
            [myKey]: {
              ...myPlayer,
              ready: newReady,
            }
          }
        }
      });
    }
    mpService.sendReady(newReady);
  },

  startMpRace: () => {
    mpService.startRace();
  },

  sendMpChat: (text: string) => {
    const u = get().user;
    const optimisticMsg = {
      sender: u.name,
      avatar: u.avatar || '💬',
      text,
      ts: Date.now(),
    };
    set((s) => ({
      mpChatMessages: [...s.mpChatMessages, optimisticMsg].slice(-50),
    }));
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
              // Auto-install and restart without requiring extra clicks
              setTimeout(() => {
                get().applyUpdate();
              }, 1200);
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

  // ── AI & TYPING STYLE INTELLIGENCE ACTIONS ──────────────────
  setCasingStyle: (styleId) => {
    set({ casingStyle: styleId });
    get().saveTypingStyle(styleId);
    get().fetchNewBatch();
  },

  setIsAIWordMode: (enabled) => {
    set({ isAIWordMode: enabled });
    get().fetchNewBatch();
  },

  fetchTypingStyle: async () => {
    try {
      const resp = await fetch('/api/get_typing_style');
      if (resp.ok) {
        const data = await resp.json();
        if (data && data.style_id) {
          set({
            casingStyle: data.style_id as CasingStyleId,
            typingStyleDescription: data.description || 'Normal English — capitals only at sentence starts',
          });
        }
      }
    } catch {}

    try {
      const stylesResp = await fetch('/api/get_styles');
      if (stylesResp.ok) {
        const stylesData = await stylesResp.json();
        const list = Array.isArray(stylesData) ? stylesData : stylesData?.styles;
        if (Array.isArray(list) && list.length > 0) {
          set({ availableStyles: list });
        }
      }
    } catch {}
  },

  saveTypingStyle: async (styleId, description, notes) => {
    set({ casingStyle: styleId, ...(description ? { typingStyleDescription: description } : {}) });
    try {
      await fetch('/api/save_typing_style', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          style_id: styleId,
          description: description || `User configured style: ${styleId}`,
          user_notes: notes || '',
        })
      });
    } catch {}
  },

  fetchBackgroundStats: async () => {
    try {
      const resp = await fetch('/api/background_stats');
      if (resp.ok) {
        const data = await resp.json();
        set({ backgroundStats: data });
      }
    } catch {}
  },

  toggleStartupDaemon: async (enabled) => {
    try {
      const resp = await fetch('/api/toggle_startup_daemon', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled })
      });
      if (resp.ok) {
        const data = await resp.json();
        get().fetchBackgroundStats();
        return data.success ?? true;
      }
    } catch {}
    return false;
  },

  checkAutoPromotion: async (wpmVal, accVal, rciVal, errVal) => {
    const s = get();
    const w = wpmVal !== undefined ? wpmVal : s.wpm;
    const a = accVal !== undefined ? accVal : s.accuracy;
    const r = rciVal !== undefined ? rciVal : 80;
    const e = errVal !== undefined ? errVal : s.totalErrors;

    try {
      const resp = await fetch(`/api/check_promotion?level=${s.level}&wpm=${w}&accuracy=${a}&rci=${r}&errors=${e}`);
      if (resp.ok) {
        const data: PromotionCheckResult = await resp.json();
        if (data && data.eligible) {
          set({ promotionOffer: data });
          return data;
        }
      }
    } catch {}
    return null;
  },

  executePromotion: async (targetLevel, reason) => {
    try {
      await fetch('/api/execute_promotion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ target_level: targetLevel, reason: reason || 'AI Skill Jump' })
      });
    } catch {}

    set((s) => ({
      level: targetLevel,
      unlockedLevels: Math.max(s.unlockedLevels, targetLevel),
      promotionOffer: null,
      activeModal: null,
      emeralds: s.emeralds + 1000,
    }));

    soundEngine.playLevelUp();
    get().fetchNewBatch();
    get().savePlayerData();
  },

  dismissPromotionOffer: () => {
    set({ promotionOffer: null, activeModal: null });
  },

  fetchCoachingInsights: async (wpmVal, accVal, intervals, shiftLatencies) => {
    const s = get();
    try {
      const resp = await fetch('/api/coaching_insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          net_wpm: wpmVal !== undefined ? wpmVal : s.wpm,
          accuracy: accVal !== undefined ? accVal : s.accuracy,
          intervals: intervals || [120, 115, 125, 130, 118, 122],
          shift_latencies: shiftLatencies || [142, 138, 150, 145],
          style: s.casingStyle
        })
      });
      if (resp.ok) {
        const data: CoachingInsight = await resp.json();
        set({ coachingInsights: data });
        return data;
      }
    } catch {}
    return null;
  },

  fetchWeakSpots: async () => {
    try {
      const resp = await fetch('/api/weak_spots');
      if (resp.ok) {
        const data = await resp.json();
        const keys: string[] = data.weak_keys || [];
        set({ aiWeakKeys: keys });
        return keys;
      }
    } catch {}
    return [];
  },

  // ── Desktop Window Controls ──────────────────────────────────
  isMaximized: false,

  minimizeWindow: async () => {
    try { await fetch('/api/window_minimize'); } catch {}
  },

  toggleMaximizeWindow: async () => {
    try {
      const res = await fetch('/api/window_maximize');
      if (res.ok) {
        const data = await res.json();
        set({ isMaximized: data.maximized });
      }
    } catch {}
  },

  closeWindow: async () => {
    try { await fetch('/api/window_close'); } catch {}
  },
}));

if (typeof window !== 'undefined') {
  (window as any).__ati_game_store = useGameStore;
  // Trigger silent update check on startup after brief delay
  setTimeout(() => {
    useGameStore.getState().checkForUpdates(true);
  }, 2000);
}

