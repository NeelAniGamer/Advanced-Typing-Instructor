import { TypingMode, Difficulty, RankTier, RankStats } from '../types/game';

const materials = [
  { prefix: 'Rubber Dome', color: '#a1887f', minLvl: 1, maxLvl: 29 },
  { prefix: 'Membrane', color: '#90a4ae', minLvl: 30, maxLvl: 49 },
  { prefix: 'Scissor Key', color: '#80cbc4', minLvl: 50, maxLvl: 79 },
  { prefix: 'Cherry Blue', color: '#42a5f5', minLvl: 80, maxLvl: 119 },
  { prefix: 'Cherry Red', color: '#ef5350', minLvl: 120, maxLvl: 159 },
  { prefix: 'Topre', color: '#b388ff', minLvl: 160, maxLvl: 189 },
  { prefix: 'Hall Effect', color: '#26c6da', minLvl: 190, maxLvl: 199 },
  { prefix: 'Endgame', color: '#ffd54f', minLvl: 200, maxLvl: 200 },
];

const numerals = ['I', 'II', 'III'];

const modesDef: Record<TypingMode, string> = {
  Words: 'Typer',
  Lines: 'Scribe',
  Paragraphs: 'Scholar',
  Pages: 'Novelist',
  Code: 'Coder',
  Time: 'Speedster',
  SuddenDeath: 'Survivor',
};

const diffDef: Record<Difficulty, string> = {
  Easy: 'Trainee',
  Normal: 'Adept',
  Hard: 'Expert',
};

export function getRankTiers(mode: TypingMode = 'Words', diff: Difficulty = 'Normal'): RankTier[] {
  const tiers: RankTier[] = [];
  const safeMode = modesDef[mode] ? mode : 'Words';
  const safeDiff = diffDef[diff] ? diff : 'Normal';
  const baseWpm = safeDiff === 'Hard' ? 30 : safeDiff === 'Normal' ? 20 : 10;
  const wpmStep = safeDiff === 'Hard' ? 4 : safeDiff === 'Normal' ? 3 : 2;
  let globalRankIdx = 0;

  materials.forEach((mat) => {
    const lvlRange = mat.maxLvl - mat.minLvl + 1;
    const stepLvl = Math.max(1, Math.floor(lvlRange / 3));

    numerals.forEach((num, idx) => {
      const reqLvl = mat.minLvl + idx * stepLvl;
      tiers.push({
        name: `${mat.prefix} ${modesDef[safeMode] || 'Typer'} ${diffDef[safeDiff] || 'Adept'} ${num}`,
        color: mat.color,
        material: mat.prefix,
        reqLvl,
        reqWpm: baseWpm + globalRankIdx * wpmStep,
        reward: (globalRankIdx + 1) * 100,
      });
      globalRankIdx++;
    });
  });

  return tiers;
}

export function calculateRankStats(
  lvl: number = 1,
  wpm: number = 0,
  mode: TypingMode = 'Words',
  diff: Difficulty = 'Normal'
): RankStats {
  const safeLvl = Math.max(1, Number.isFinite(lvl) ? lvl : 1);
  const safeWpm = Math.max(0, Number.isFinite(wpm) ? wpm : 0);
  const tiers = getRankTiers(mode, diff);
  let rankIdx = 0;

  for (let i = 0; i < tiers.length; i++) {
    if (safeLvl >= tiers[i].reqLvl && safeWpm >= tiers[i].reqWpm) {
      rankIdx = i;
    } else {
      break;
    }
  }

  const rank = tiers[rankIdx] || tiers[0] || {
    name: 'Rubber Dome Typer Adept I',
    color: '#a1887f',
    material: 'Rubber Dome',
    reqLvl: 1,
    reqWpm: 20,
    reward: 100,
  };

  let nextRank: RankTier | null = null;
  let progress = 0;

  if (rankIdx < tiers.length - 1) {
    nextRank = tiers[rankIdx + 1] || null;
    if (nextRank) {
      const lvlDiff = Math.max(1, nextRank.reqLvl - rank.reqLvl);
      const wpmDiff = Math.max(1, nextRank.reqWpm - rank.reqWpm);
      const lvlProg = Math.min(1, Math.max(0, (safeLvl - rank.reqLvl) / lvlDiff));
      const wpmProg = Math.min(1, Math.max(0, (safeWpm - rank.reqWpm) / wpmDiff));
      const calcProg = Math.round((lvlProg * 0.5 + wpmProg * 0.5) * 100);
      progress = Number.isFinite(calcProg) ? Math.min(100, Math.max(0, calcProg)) : 0;
    } else {
      progress = 100;
    }
  } else {
    progress = 100;
  }

  return { index: rankIdx, rank, nextRank, progress };
}
