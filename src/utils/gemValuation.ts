/**
 * gemValuation.ts — Dynamic Word & Letter Gem Valuation Engine
 * Copyright (C) 2026 Class Of Learners. All rights reserved.
 * 
 * Every word has a custom, difficulty-scaled gem value based on:
 * 1. Letter rarity, finger reach, and uppercase Shift-key mechanics.
 * 2. Phonetic complexity, rare consonant clusters, and unusual letter blends.
 * 3. Word length and syllable depth (longer/harder words award significantly more gems).
 * 4. Typo penalties: Typos on a word reduce its reward dynamically.
 */

// Letter Base Weights (reach ergonomics & linguistic frequency)
const CHAR_WEIGHTS: Record<string, number> = {
  // Ultra-frequent & home row (1 gem)
  e: 1, t: 1, a: 1, o: 1, i: 1, n: 1, s: 1, h: 1, r: 1, d: 1, l: 1, c: 1, u: 1, m: 1,
  // Moderate reaches (2 gems)
  f: 2, p: 2, g: 2, w: 2, y: 2, b: 2, v: 2,
  // High effort finger reaches (3 gems)
  k: 3,
  // Rare & unusual keys (5 gems)
  j: 5, x: 5, q: 5, z: 5,
};

// Rare / unusual syllabic patterns that grant extra complexity bonuses
const COMPLEXITY_PATTERNS: { pattern: RegExp; bonus: number; reason: string }[] = [
  { pattern: /crypt/i, bonus: 12, reason: 'Cryptographic' },
  { pattern: /rhythm|sphinx|glyph|nymph|psalm/i, bonus: 15, reason: 'Vowelless Cluster' },
  { pattern: /quiz|puzzl|fizz|dizz/i, bonus: 12, reason: 'Z-Double Tap' },
  { pattern: /awk|kn|wr|gn|ps/i, bonus: 6, reason: 'Silent Onset' },
  { pattern: /sync|async|poly|phth/i, bonus: 10, reason: 'Technical Cluster' },
  { pattern: /algo|quantum|neuro|cyber/i, bonus: 10, reason: 'Academic Compound' },
  { pattern: /[0-9]/, bonus: 4, reason: 'Number Row Reach' },
  { pattern: /[!@#$%^&*()_+=\[\]{}|\\:;"'<>,.?/-]/, bonus: 6, reason: 'Symbol Punctuation' },
];

export type WordDifficultyTier = 'common' | 'moderate' | 'hard' | 'legendary';

export interface WordGemValuation {
  baseGems: number;
  difficultyTier: WordDifficultyTier;
  tierLabel: string;
  rarityBonus: number;
}

export interface EarnedWordGemResult {
  word: string;
  baseGems: number;
  earnedGems: number;
  typoCount: number;
  penaltyPercent: number;
  isClean: boolean;
  difficultyTier: WordDifficultyTier;
  tierLabel: string;
  bonusReason?: string;
  masteryBadge?: string;
  speedMultiplier?: number;
  masteryMultiplier?: number;
  isCapped?: boolean;
}

/**
 * Calculates a single character's base gem worth
 */
export function getCharGemValue(char: string): number {
  if (!char) return 0;
  const isUpper = char >= 'A' && char <= 'Z';
  const lower = char.toLowerCase();
  
  let val = CHAR_WEIGHTS[lower] ?? 3; // Default 3 for numbers/symbols
  if (isUpper) {
    val += 2; // Shift key coordination bonus
  }
  return val;
}

/**
 * Calculates the custom base gem value for a word based on length, letters, and complexity.
 */
export function calculateWordCustomGems(word: string, level: number = 1): WordGemValuation {
  if (!word || word.trim().length === 0) {
    return { baseGems: 0, difficultyTier: 'common', tierLabel: 'COMMON', rarityBonus: 0 };
  }

  const clean = word.trim();
  const len = clean.length;

  // 1. Sum letter weights
  let charSum = 0;
  for (let i = 0; i < len; i++) {
    charSum += getCharGemValue(clean[i]);
  }

  // 2. Length scaling (longer words require sustained finger endurance)
  let lengthBonus = 0;
  if (len >= 6) lengthBonus += (len - 5) * 2;
  if (len >= 10) lengthBonus += (len - 9) * 3;
  if (len >= 14) lengthBonus += (len - 13) * 4;

  // 3. Syllabic & unusual pattern bonus
  let rarityBonus = 0;
  let detectedReason: string | undefined = undefined;

  for (const { pattern, bonus, reason } of COMPLEXITY_PATTERNS) {
    if (pattern.test(clean)) {
      rarityBonus += bonus;
      if (!detectedReason) detectedReason = reason;
    }
  }

  // 4. Level factor (higher stages in curriculum have subtle prestige value)
  const lvlMult = 1 + Math.min(level, 200) * 0.005; // Up to +100% at level 200

  const totalRaw = (charSum + lengthBonus + rarityBonus) * lvlMult;
  // Floor to minimum 3 gems so even tiny words like "a" or "in" give a reward
  const baseGems = Math.max(3, Math.round(totalRaw));

  // Determine difficulty tier
  let difficultyTier: WordDifficultyTier = 'common';
  let tierLabel = 'COMMON';

  if (baseGems >= 45) {
    difficultyTier = 'legendary';
    tierLabel = detectedReason ? `LEGENDARY: ${detectedReason}` : 'LEGENDARY';
  } else if (baseGems >= 24) {
    difficultyTier = 'hard';
    tierLabel = detectedReason ? `HARD: ${detectedReason}` : 'HARD';
  } else if (baseGems >= 11) {
    difficultyTier = 'moderate';
    tierLabel = 'MODERATE';
  }

  return {
    baseGems,
    difficultyTier,
    tierLabel,
    rarityBonus,
  };
}

/**
 * Calculates the fair, balanced maximum gem ceiling for a specific level.
 * Prevents run-away economy inflation while rewarding high skill.
 */
export function calculateLevelGemCap(words: string[], level: number = 1, difficulty: string = 'Normal'): number {
  if (!words || words.length === 0) return 450;

  let expectedSum = 0;
  for (const w of words) {
    const val = calculateWordCustomGems(w, level);
    expectedSum += val.baseGems;
  }

  const diffMultiplier = difficulty === 'Hard' ? 1.75 : difficulty === 'Easy' ? 1.35 : 1.55;
  const levelBonus = Math.min(level * 8, 800);
  const cap = Math.round(expectedSum * diffMultiplier + levelBonus + 120);
  return Math.max(380, cap);
}

/**
 * Calculates actual gems awarded based on THREE PRIMARY VARIABLES:
 * 1. The Time It Took To Type That Word (Keystroke cadence & speed burst)
 * 2. The Difficulty Of That Word (Length, finger reach, phonetic complexity, shift casing)
 * 3. The Weak Keys Or Strong Keys Of That User (AI Mastery & Flow-State bonus)
 *
 * Subject to:
 * - Dynamic Typo Penalty (Clean = 100%, 1 typo = 70%, 2 typos = 45%, 3+ = 20%)
 * - Level Maximum Gem Ceiling (levelCapRemaining)
 */
export function calculateEarnedWordGems(
  targetWord: string,
  typedWord: string,
  typoCount: number,
  options: {
    streak?: number;
    boosterMultiplier?: number;
    level?: number;
    wordDurationMs?: number;
    userWeakKeys?: string[];
    userStrongKeys?: string[];
    levelCapRemaining?: number;
    luckyMultiplier?: number;
    hasFlowStabilizer?: boolean;
    hasWeakSpotConqueror?: boolean;
  } = {}
): EarnedWordGemResult {
  const {
    streak = 0,
    boosterMultiplier = 1.0,
    level = 1,
    wordDurationMs = 0,
    userWeakKeys = [],
    userStrongKeys = [],
    levelCapRemaining,
    luckyMultiplier = 1.0,
    hasFlowStabilizer = false,
    hasWeakSpotConqueror = false,
  } = options;

  const cleanTarget = (targetWord || '').trim();
  const valuation = calculateWordCustomGems(cleanTarget, level);
  const baseGems = valuation.baseGems;

  const isExactMatch = typedWord === targetWord;
  const isClean = typoCount === 0 && isExactMatch;

  // ── 1. Typo Penalty Degradation ──────────────────────────
  let penaltyPercent = 0;
  let typoMultiplier = 1.0;

  if (isClean) {
    typoMultiplier = 1.0;
    penaltyPercent = 0;
  } else if (typoCount === 1) {
    typoMultiplier = 0.70;
    penaltyPercent = 30;
  } else if (typoCount === 2) {
    typoMultiplier = 0.45;
    penaltyPercent = 55;
  } else {
    typoMultiplier = 0.20;
    penaltyPercent = 80;
  }

  if (!isExactMatch && typedWord.length === 0) {
    typoMultiplier = 0.0;
    penaltyPercent = 100;
  }

  // ── 2. VARIABLE 1: Time Taken To Type That Word (Speed Bonus) ──
  let speedMultiplier = 1.0;
  let speedBadge: string | undefined = undefined;

  if (wordDurationMs > 0 && cleanTarget.length > 0 && isExactMatch) {
    const msPerChar = wordDurationMs / cleanTarget.length;
    // < 150ms/char (~75+ WPM) -> High speed
    if (msPerChar < 140) {
      speedMultiplier = hasFlowStabilizer ? 1.50 : 1.35;
      speedBadge = '⚡ ULTRA SPEED';
    } else if (msPerChar < 195) {
      speedMultiplier = hasFlowStabilizer ? 1.30 : 1.20;
      speedBadge = '⚡ SWIFT FLOW';
    } else if (msPerChar < 270) {
      speedMultiplier = 1.08;
    } else if (msPerChar > 700 && !isClean) {
      speedMultiplier = 0.88; // Hesitation penalty
    }
  }

  // ── 3. VARIABLE 3: User Weak Keys vs Strong Keys (AI Mastery) ──
  let masteryMultiplier = 1.0;
  let masteryBadge: string | undefined = speedBadge;

  const lowerWord = cleanTarget.toLowerCase();
  const normalizedWeak = userWeakKeys.map((k) => (k || '').toLowerCase()).filter(Boolean);
  const normalizedStrong = userStrongKeys.map((k) => (k || '').toLowerCase()).filter(Boolean);

  const matchedWeakKey = normalizedWeak.find((wk) => lowerWord.includes(wk));
  const isAllStrongKeys =
    normalizedStrong.length >= 4 &&
    cleanTarget.length >= 3 &&
    lowerWord.split('').every((c) => !c.match(/[a-z]/i) || normalizedStrong.includes(c));

  if (matchedWeakKey) {
    if (isClean) {
      const baseWeakBonus = hasWeakSpotConqueror ? 1.90 : 1.45;
      masteryMultiplier = baseWeakBonus;
      masteryBadge = `🎯 WEAK KEY '${matchedWeakKey.toUpperCase()}' CONQUERED!`;
    } else if (typoCount === 1) {
      masteryMultiplier = hasWeakSpotConqueror ? 1.40 : 1.20;
      masteryBadge = `🎯 WEAK KEY '${matchedWeakKey.toUpperCase()}' CLEARED`;
    }
  } else if (isAllStrongKeys && isClean && speedMultiplier > 1.0) {
    masteryMultiplier = 1.15;
    if (!masteryBadge) masteryBadge = '✨ FLOW STATE!';
  }

  // ── 4. Streak Multiplier ────────────────────────────────
  let streakMultiplier = 1.0;
  if (streak >= 50) {
    streakMultiplier = 1.50;
  } else if (streak >= 30) {
    streakMultiplier = 1.25;
  } else if (streak >= 15) {
    streakMultiplier = 1.10;
  }

  // ── 5. Lucky Gem Magnet Multiplier ───────────────────────
  const finalLucky = Math.max(1.0, luckyMultiplier);
  if (finalLucky > 1.0) {
    masteryBadge = `🍀 ${finalLucky}X LUCKY CASCADE!`;
  }

  // ── Combined Raw Reward Calculation ───────────────────────
  const rawCalculated = Math.round(
    baseGems *
      typoMultiplier *
      boosterMultiplier *
      streakMultiplier *
      speedMultiplier *
      masteryMultiplier *
      finalLucky
  );

  let earnedGems =
    isExactMatch || (typedWord.length > 0 && rawCalculated > 0)
      ? Math.max(isClean ? 3 : 1, rawCalculated)
      : 0;

  // ── 6. Level Maximum Gem Ceiling Enforcement ─────────────
  let isCapped = false;
  if (levelCapRemaining !== undefined && levelCapRemaining >= 0) {
    if (earnedGems > levelCapRemaining) {
      earnedGems = levelCapRemaining;
      isCapped = true;
      if (levelCapRemaining <= 0) {
        masteryBadge = '💎 LEVEL CAP REACHED';
      }
    }
  }

  return {
    word: cleanTarget,
    baseGems,
    earnedGems,
    typoCount,
    penaltyPercent,
    isClean,
    difficultyTier: valuation.difficultyTier,
    tierLabel: valuation.tierLabel,
    bonusReason: valuation.tierLabel,
    masteryBadge,
    speedMultiplier,
    masteryMultiplier,
    isCapped,
  };
}
