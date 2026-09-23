export type TypingMode = 'Words' | 'Lines' | 'Paragraphs' | 'Pages' | 'Code' | 'Time' | 'SuddenDeath';
export type EloDivision = 'Bronze' | 'Silver' | 'Gold' | 'Platinum' | 'Diamond' | 'Master' | 'Apex';
export type Difficulty = 'Easy' | 'Normal' | 'Hard';
export type Category = 'Literature' | 'Coding' | 'Homerow' | 'SpeedTest' | 'Daily Challenge' | 'Competitions';
export type GhostPacingMode = 'continuous' | 'turn_based';
export type TimedDuration = 15 | 30 | 60 | 120;

export interface RankTier {
  name: string;
  color: string;
  material: string;
  reqLvl: number;
  reqWpm: number;
  reward: number;
}

export interface RankStats {
  index: number;
  rank: RankTier;
  nextRank: RankTier | null;
  progress: number;
}

export type ShopCategory = 'booster' | 'consumable' | 'theme' | 'switch' | 'caret' | 'visual' | 'enchantment';

export interface ShopItem {
  id: string;
  name: string;
  desc: string;
  cost: number;
  lvl: number;
  isVisual?: boolean;
  category: ShopCategory;
  icon: string;
  effectDesc?: string;
}

export interface Enchantment {
  id: string;
  name: string;
  desc: string;
  cost: number;
  req1: string;
  req2: string;
}

export interface Quest {
  id: string;
  text: string;
  target: number;
  current: number;
  reward: number;
  completed: boolean;
  type: 'daily' | 'weekly' | 'challenge';
}

export interface DailyQuest {
  id: string;
  title: string;
  desc: string;
  target: number;
  current: number;
  rewardEmeralds: number;
  completed: boolean;
  claimed: boolean;
  icon: string;
}

export interface Achievement {
  id: string;
  cat: 'speed' | 'acc' | 'lvl' | 'streak' | 'mode' | 'boss' | 'cur' | 'pre' | 'mp' | 'fun';
  name: string;
  desc: string;
  icon: string;
  secret?: boolean;
  unlocked?: boolean;
  unlockedAt?: string;
}

export interface SessionResult {
  level: number;
  mode: TypingMode;
  difficulty: Difficulty;
  wpm: number;
  rawWpm: number;
  accuracy: number;
  errors: number;
  emeraldsEarned: number;
  durationSeconds: number;
  timestamp: string;
  passed?: boolean;
  wordsCorrectPercentage?: number;
  wordsCorrectCount?: number;
  totalWordsCount?: number;
  requiredPassPercentage?: number;
}

export interface BossState {
  isBoss: boolean;
  name: string;
  maxHp: number;
  currentHp: number;
  portrait: string;
  phase: number;
}

export interface KeyHeatmapData {
  [key: string]: {
    hits: number;
    errors: number;
    totalLatencyMs: number;
  };
}

export interface UserProfile {
  id: string;
  name: string;
  avatar: string;
  level: number;
  rank: string;
  rank_color: string;
  races: number;
  wins: number;
  best_wpm: number;
  avg_acc: number;
  email?: string;
  username?: string;
  account_type?: 'google' | 'local' | 'guest';
  eloRating?: number;
  eloDivision?: EloDivision;
  duelWins?: number;
  duelLosses?: number;
  streakShields?: number;
}

export interface LocalAccountSummary {
  id: string;
  username: string;
  name: string;
  avatar: string;
  last_login?: string;
  level?: number;
}

export interface MultiplayerPlayer {
  id: string;
  name: string;
  avatar: string;
  level: number;
  rank: string;
  rank_color: string;
  best_wpm: number;
  races_won: number;
  progress: number;
  wpm: number;
  ready: boolean;
  finished: boolean;
  rank_position?: number;
}

export interface MultiplayerRoom {
  code: string;
  host: string;
  mode: string;
  text: string;
  started: boolean;
  finished: boolean;
  players: Record<string, MultiplayerPlayer>;
}

export type SwitchProfile = 'cherry-blue' | 'cherry-red' | 'topre' | 'hall-effect' | 'holy-panda' | 'model-m';

export type KeyboardLayout = 'qwerty' | 'macbook' | 'ipad' | 'stenography' | 'dvorak' | 'colemak' | 'workman' | 'azerty';

export type GhostMode = 'pb' | 'target' | 'speedster' | 'off';

export interface PlayerSaveData {
  version: string;
  timestamp: string;
  user: UserProfile;
  level: number;
  unlockedLevels: number;
  emeralds: number;
  prestige: number;
  switchProfile: SwitchProfile;
  keyboardLayout: KeyboardLayout;
  heatmap?: KeyHeatmapData;
  lastSession?: SessionResult | null;
  ownedItems?: string[];
  equippedBoosters?: Record<string, boolean>;
  inventory?: Record<string, number>;
  ghostPacingMode?: GhostPacingMode;
  dailyStreak?: number;
  lastDailyRewardDate?: string;
  dailyQuests?: DailyQuest[];
  dailyMasterCrateClaimed?: boolean;
  lastQuestDate?: string;
  completedLevels?: any[];
  achievements?: any[];
  uiTheme?: string;
  masterVolume?: number;
  keySoundStyle?: string;
  customKeybinds?: any;
  savedAt?: string;
}

export type CasingStyleId = 
  | 'title_case' 
  | 'standard_lowercase' 
  | 'sentence_case' 
  | 'all_caps' 
  | 'camel_case' 
  | 'snake_case' 
  | 'kebab_case' 
  | 'random_cased';

export interface TypingStyleConfig {
  style_id: CasingStyleId;
  style_name: string;
  description: string;
  user_notes?: string;
  is_ai_promoted?: boolean;
}

export interface PromotionCheckResult {
  eligible: boolean;
  current_level: number;
  target_level: number;
  reason: string;
  speed_tier: string;
  metrics: {
    rolling_wpm: number;
    rolling_acc: number;
    rci: number;
    levels_jumped: number;
  };
}

export interface CoachingInsight {
  headline: string;
  summary: string;
  tips: string[];
  shift_latency_ms?: number;
  rhythm_score?: number;
  style_alignment?: string;
}

export interface BackgroundStats {
  status: string;
  total_keystrokes_today: number;
  active_typing_minutes: number;
  average_cadence_wpm: number;
  peak_burst_wpm: number;
  shift_usage_ratio: number;
  is_startup_enabled: boolean;
  privacy_guarantee: string;
}
