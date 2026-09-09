import React, { useState } from 'react';
import { useGameStore } from '../../stores/useGameStore';
import { 
  Lock, 
  Play, 
  Skull, 
  ChevronLeft, 
  ChevronRight, 
  CheckCircle2, 
  Target, 
  Zap, 
  Gem, 
  Sparkles, 
  BookOpen, 
  Code2, 
  X,
  Flame,
  Clock
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { TypingMode, Difficulty, Category } from '../../types/game';

export const LevelPath: React.FC = () => {
  const { 
    level, 
    unlockedLevels, 
    mode, 
    difficulty, 
    category,
    user,
    setLevel, 
    setMode, 
    setDifficulty, 
    setCategory, 
    setScreen 
  } = useGameStore();

  const [currentChapter, setCurrentChapter] = useState(Math.floor((level - 1) / 40));
  const [briefingLevel, setBriefingLevel] = useState<number | null>(null);

  const chapters = [
    { title: 'Chapter I: The Rubber Foundry', range: [1, 40], bossName: 'Gargoyle of Latency', color: 'from-amber-500/20 to-stone-500/20', border: 'border-amber-500/30' },
    { title: 'Chapter II: The Tactile Catacombs', range: [41, 80], bossName: 'The Obsidian Warden', color: 'from-cyan-500/20 to-blue-500/20', border: 'border-cyan-500/30' },
    { title: 'Chapter III: The Mechanical Citadel', range: [81, 120], bossName: 'Wither Protocol', color: 'from-red-500/20 to-purple-500/20', border: 'border-red-500/30' },
    { title: 'Chapter IV: The Hall of Capacitance', range: [121, 160], bossName: 'Quantum Core', color: 'from-purple-500/20 to-pink-500/20', border: 'border-purple-500/30' },
    { title: 'Chapter V: The Endgame Zenith', range: [161, 200], bossName: 'Endgame Synthesizer', color: 'from-yellow-500/20 to-amber-500/20', border: 'border-yellow-500/30' },
  ];

  const activeChap = chapters[currentChapter] || chapters[0];
  const [startLvl, endLvl] = activeChap.range;
  const levelList = Array.from({ length: endLvl - startLvl + 1 }, (_, i) => startLvl + i);

  const handleSelectLevel = (lvl: number) => {
    if (lvl <= unlockedLevels + 1) {
      setBriefingLevel(lvl);
    }
  };

  const handleLaunchMission = (lvl: number) => {
    setLevel(lvl);
    setScreen('game');
  };

  const targetWpm = briefingLevel ? Math.round(25 + briefingLevel * 0.45) : 30;
  const rewardEmeralds = briefingLevel ? 150 + briefingLevel * 10 : 200;
  const isBossMission = briefingLevel ? briefingLevel % 40 === 0 : false;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 flex flex-col gap-6 relative">
      
      {/* Quick Resume Adventure Banner */}
      <div className="glass-panel p-5 sm:p-6 rounded-3xl border border-cyan-500/30 shadow-[0_0_30px_rgba(0,245,255,0.08)] flex flex-col sm:flex-row items-center justify-between gap-4 bg-gradient-to-r from-cyan-950/40 via-slate-900/60 to-purple-950/30">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-cyan-500/20 border border-cyan-400/50 flex items-center justify-center text-3xl shadow-neon-cyan flex-shrink-0">
            {level % 40 === 0 ? '☠️' : '🚀'}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono uppercase tracking-widest text-cyan-400 font-bold">
                Current Standby Mission
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-bold">
                Level {level}
              </span>
            </div>
            <h3 className="font-display font-black text-xl text-white mt-0.5">
              {level % 40 === 0 ? `Boss Battle: ${activeChap.bossName}` : `Sector Mission ${level}: Touch Actuation`}
            </h3>
            <p className="text-xs text-slate-400">
              Highest Career Velocity: <span className="text-cyan-300 font-mono font-bold">{user.best_wpm || 0} WPM</span> • Unlocked: {unlockedLevels}/200
            </p>
          </div>
        </div>

        <button
          onClick={() => handleLaunchMission(level)}
          className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-gradient-to-r from-cyan-400 to-blue-500 text-black font-display font-black text-sm tracking-wide hover:shadow-neon-cyan transition-all flex items-center justify-center gap-2 active:scale-95 flex-shrink-0"
        >
          <Play className="w-4 h-4 fill-black" />
          <span>Launch Mission #{level}</span>
        </button>
      </div>

      {/* Chapter Navigation Header */}
      <div className="glass-panel p-6 rounded-3xl border border-white/10 flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-widest text-cyan-400">
            Adventure Progression
          </span>
          <h2 className="font-display font-extrabold text-2xl text-white mt-1">
            {activeChap.title}
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Levels {startLvl} – {endLvl} • Chapter Boss: <span className="text-red-400 font-semibold">{activeChap.bossName}</span>
          </p>
        </div>

        {/* Chapter Switcher */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setCurrentChapter((c) => Math.max(0, c - 1))}
            disabled={currentChapter === 0}
            className="p-2.5 rounded-xl bg-slate-900 border border-white/10 text-slate-300 hover:text-white disabled:opacity-40 disabled:pointer-events-none transition-all"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <div className="flex gap-1.5 px-2">
            {chapters.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentChapter(idx)}
                className={`h-3 rounded-full transition-all ${
                  currentChapter === idx
                    ? 'w-8 bg-cyan-400 shadow-neon-cyan'
                    : 'w-3 bg-slate-700 hover:bg-slate-500'
                }`}
              />
            ))}
          </div>

          <button
            onClick={() => setCurrentChapter((c) => Math.min(chapters.length - 1, c + 1))}
            disabled={currentChapter === chapters.length - 1}
            className="p-2.5 rounded-xl bg-slate-900 border border-white/10 text-slate-300 hover:text-white disabled:opacity-40 disabled:pointer-events-none transition-all"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Grid of Level Nodes */}
      <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-8 gap-3.5">
        {levelList.map((lvl) => {
          const isBoss = lvl % 40 === 0;
          const isUnlocked = lvl <= unlockedLevels + 1;
          const isCurrent = lvl === level;
          const isCompleted = lvl <= unlockedLevels;

          return (
            <motion.button
              key={lvl}
              whileHover={isUnlocked ? { scale: 1.05 } : {}}
              whileTap={isUnlocked ? { scale: 0.95 } : {}}
              onClick={() => handleSelectLevel(lvl)}
              disabled={!isUnlocked}
              className={`relative aspect-square rounded-2xl p-2 flex flex-col items-center justify-between border transition-all ${
                isCurrent
                  ? 'bg-cyan-500/20 border-cyan-400 shadow-neon-cyan text-cyan-300 ring-2 ring-cyan-400/40'
                  : isBoss
                  ? 'bg-red-950/40 border-red-500/40 text-red-400 shadow-[0_0_20px_rgba(239,68,68,0.2)] hover:border-red-400'
                  : isCompleted
                  ? 'glass-panel border-emerald-500/30 text-emerald-400 hover:border-emerald-400'
                  : isUnlocked
                  ? 'glass-panel border-white/20 text-white hover:border-cyan-400'
                  : 'bg-slate-950/50 border-white/5 text-slate-700 cursor-not-allowed opacity-60'
              }`}
            >
              {/* Top Badge Indicator */}
              <div className="w-full flex items-center justify-between text-[10px]">
                {isBoss ? (
                  <Skull className="w-3.5 h-3.5 text-red-400 animate-pulse" />
                ) : isCompleted ? (
                  <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                ) : (
                  <span />
                )}

                {isCurrent && (
                  <span className="w-2 h-2 rounded-full bg-cyan-400 shadow-neon-cyan animate-ping" />
                )}
              </div>

              {/* Level Number or Lock */}
              <div className="my-auto text-center">
                {isUnlocked ? (
                  <span className="font-display font-extrabold text-lg sm:text-xl">
                    {lvl}
                  </span>
                ) : (
                  <Lock className="w-4 h-4 mx-auto text-slate-600" />
                )}
              </div>

              {/* Subtitle / Type */}
              <div className="text-[9px] font-mono tracking-tight opacity-75">
                {isBoss ? 'BOSS' : `LVL`}
              </div>
            </motion.button>
          );
        })}
      </div>

      {/* Mission Briefing Modal */}
      <AnimatePresence>
        {briefingLevel !== null && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="glass-panel w-full max-w-lg p-6 sm:p-7 rounded-3xl border border-cyan-500/40 shadow-[0_0_60px_rgba(0,245,255,0.18)] flex flex-col gap-5 relative overflow-hidden"
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <div className="flex items-center gap-3">
                  <div className={`p-2.5 rounded-2xl border ${
                    isBossMission 
                      ? 'bg-red-500/10 border-red-500/30 text-red-400 shadow-neon-red' 
                      : 'bg-cyan-500/10 border-cyan-400/30 text-cyan-400 shadow-neon-cyan'
                  }`}>
                    {isBossMission ? <Skull className="w-5 h-5 text-red-400" /> : <Target className="w-5 h-5 text-cyan-400" />}
                  </div>
                  <div>
                    <span className="text-[10px] font-mono uppercase tracking-widest text-cyan-400 font-bold">
                      Mission Briefing
                    </span>
                    <h3 className="font-display font-black text-xl text-white">
                      {isBossMission ? `Boss Encounter: ${activeChap.bossName}` : `Stage ${briefingLevel}: Velocity Test`}
                    </h3>
                  </div>
                </div>

                <button
                  onClick={() => setBriefingLevel(null)}
                  className="p-2 rounded-xl bg-slate-900 border border-white/10 text-slate-400 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Mission Objectives Matrix */}
              <div className="grid grid-cols-3 gap-3">
                <div className="p-3 rounded-2xl bg-slate-950/60 border border-white/10 flex flex-col items-center text-center">
                  <Zap className="w-4 h-4 text-cyan-400 mb-1" />
                  <span className="text-[10px] text-slate-400 font-mono uppercase">Target WPM</span>
                  <span className="font-mono font-black text-lg text-white mt-0.5">
                    {targetWpm} <span className="text-[10px] text-slate-500 font-sans">WPM</span>
                  </span>
                </div>

                <div className="p-3 rounded-2xl bg-slate-950/60 border border-white/10 flex flex-col items-center text-center">
                  <Target className="w-4 h-4 text-emerald-400 mb-1" />
                  <span className="text-[10px] text-slate-400 font-mono uppercase">Precision</span>
                  <span className="font-mono font-black text-lg text-emerald-300 mt-0.5">
                    95%
                  </span>
                </div>

                <div className="p-3 rounded-2xl bg-slate-950/60 border border-white/10 flex flex-col items-center text-center">
                  <Gem className="w-4 h-4 text-emerald-400 mb-1" />
                  <span className="text-[10px] text-slate-400 font-mono uppercase">Reward</span>
                  <span className="font-mono font-black text-lg text-emerald-400 mt-0.5">
                    +{rewardEmeralds}
                  </span>
                </div>
              </div>

              {/* Module Switcher: Normal vs Coding */}
              <div>
                <label className="text-xs font-bold text-slate-400 mb-1.5 block font-mono uppercase tracking-wider">
                  Text Module
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => {
                      setCategory('Literature');
                      if (mode === 'Code') setMode('Words');
                    }}
                    className={`p-2.5 rounded-xl border flex items-center justify-center gap-2 text-xs font-bold transition-all ${
                      category === 'Literature'
                        ? 'bg-cyan-500/20 border-cyan-400 shadow-neon-cyan text-cyan-300'
                        : 'bg-slate-950/60 border-white/10 text-slate-400 hover:text-white'
                    }`}
                  >
                    <BookOpen className="w-4 h-4 text-cyan-400" />
                    <span>Literature (Normal)</span>
                  </button>

                  <button
                    onClick={() => {
                      setCategory('Coding');
                      setMode('Code');
                    }}
                    className={`p-2.5 rounded-xl border flex items-center justify-center gap-2 text-xs font-bold transition-all ${
                      category === 'Coding'
                        ? 'bg-purple-500/20 border-purple-400 shadow-neon-purple text-purple-300'
                        : 'bg-slate-950/60 border-white/10 text-slate-400 hover:text-white'
                    }`}
                  >
                    <Code2 className="w-4 h-4 text-purple-400" />
                    <span>Coding Syntax</span>
                  </button>
                </div>
              </div>

              {/* Difficulty Selection */}
              <div>
                <label className="text-xs font-bold text-slate-400 mb-1.5 block font-mono uppercase tracking-wider">
                  Actuation Difficulty
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['Easy', 'Normal', 'Hard'] as Difficulty[]).map((d) => (
                    <button
                      key={d}
                      onClick={() => setDifficulty(d)}
                      className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                        difficulty === d
                          ? d === 'Hard'
                            ? 'bg-red-500/20 text-red-400 border-red-500/40 shadow-neon-red'
                            : d === 'Normal'
                            ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-neon-amber'
                            : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-neon-green'
                          : 'bg-slate-950/60 border-white/10 text-slate-400 hover:text-white'
                      }`}
                    >
                      {d}
                    </button>
                  ))}
                </div>
              </div>

              {/* Launch Action */}
              <div className="pt-2 border-t border-white/10 flex items-center justify-between gap-3">
                <button
                  onClick={() => setBriefingLevel(null)}
                  className="px-4 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-slate-400 hover:text-white text-xs font-semibold"
                >
                  Cancel
                </button>

                <button
                  onClick={() => handleLaunchMission(briefingLevel)}
                  className="flex-1 py-3 rounded-2xl bg-gradient-to-r from-cyan-400 to-blue-500 text-black font-display font-black text-sm tracking-wide hover:shadow-neon-cyan transition-all flex items-center justify-center gap-2 active:scale-95"
                >
                  <Play className="w-4 h-4 fill-black" />
                  <span>Enter Typing Arena</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};
