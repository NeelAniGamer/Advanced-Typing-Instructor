export type TypingMode = 'Words' | 'Lines' | 'Paragraphs' | 'Pages' | 'Code';
export type Difficulty = 'Easy' | 'Normal' | 'Hard';
export type Category = 'Literature' | 'Coding' | 'Homerow' | 'SpeedTest';

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

export interface ShopItem {
  id: string;
  name: string;
  desc: string;
  cost: number;
  lvl: number;
  isVisual?: boolean;
  category: 'visual' | 'consumable' | 'enchantment';
  icon: string;
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

export type KeyboardLayout = 'qwerty' | 'dvorak' | 'colemak';

export type GhostMode = 'pb' | 'target' | 'speedster' | 'off';

