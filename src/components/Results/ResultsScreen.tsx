import React, { useEffect } from 'react';
import { useGameStore } from '../../stores/useGameStore';
import { calculateRankStats } from '../../utils/ranks';
import confetti from 'canvas-confetti';
import { 
  Trophy, 
  Target, 
  Zap, 
  Clock, 
  RotateCcw, 
  ArrowRight, 
  Map, 
  Gem, 
  Flame,
  Award,
  LayoutDashboard
} from 'lucide-react';
import { motion } from 'framer-motion';

export const ResultsScreen: React.FC = () => {
  const { 
    lastSession, 
    level, 
    mode, 
    difficulty, 
    setLevel, 
    setScreen, 
    setModal,
    fetchNewBatch 
  } = useGameStore();

  useEffect(() => {
    // Fire confetti cannons safely
    try {
      if (typeof confetti === 'function') {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#00f5ff', '#39ff14', '#b388ff', '#ffd54f'],
        });
      }
    } catch (e) {
      console.warn('Confetti animation suppressed:', e);
    }
  }, []);

  const getGrade = (wpm: number, acc: number) => {
    if (wpm >= 90 && acc >= 98) return { grade: 'S+', color: 'text-amber-300 text-glow-amber' };
    if (wpm >= 75 && acc >= 96) return { grade: 'S', color: 'text-amber-400 text-glow-amber' };
    if (wpm >= 60 && acc >= 94) return { grade: 'A', color: 'text-cyan-400 text-glow-cyan' };
    if (wpm >= 45 && acc >= 90) return { grade: 'B', color: 'text-emerald-400 text-glow-green' };
    if (wpm >= 30 && acc >= 85) return { grade: 'C', color: 'text-purple-400 text-glow-purple' };
    return { grade: 'D', color: 'text-slate-400' };
  };

  // Ensure we ALWAYS have a valid session to render — NEVER a blank page
  const currentStore = useGameStore.getState();
  const safeSession = lastSession || {
    level: level || 1,
    mode: mode || 'Words',
    difficulty: difficulty || 'Normal',
    wpm: currentStore.wpm || 0,
    rawWpm: currentStore.rawWpm || 0,
    accuracy: currentStore.accuracy || 100,
    errors: currentStore.totalErrors || 0,
    emeraldsEarned: 100,
    durationSeconds: currentStore.elapsedSeconds || 1,
    timestamp: new Date().toLocaleTimeString(),
  };

  const safeWpm = Number.isFinite(safeSession.wpm) ? safeSession.wpm : 0;
  const safeAcc = Number.isFinite(safeSession.accuracy) ? safeSession.accuracy : 100;
  const safeRawWpm = Number.isFinite(safeSession.rawWpm) ? safeSession.rawWpm : safeWpm;
  const safeDuration = Number.isFinite(safeSession.durationSeconds) ? safeSession.durationSeconds : 1;
  const safeEmeralds = Number.isFinite(safeSession.emeraldsEarned) ? safeSession.emeraldsEarned : 50;
  const safeLevel = Number.isFinite(safeSession.level) ? safeSession.level : (level || 1);

  const { grade, color: gradeColor } = getGrade(safeWpm, safeAcc);
  const rankStats = calculateRankStats(safeLevel, safeWpm, mode || 'Words', difficulty || 'Normal');
  const safeProgress = Number.isFinite(rankStats?.progress) ? Math.min(100, Math.max(0, rankStats.progress)) : 0;
  const rankName = rankStats?.rank?.name || 'Touch Typist';
  const rankColor = rankStats?.rank?.color || '#00f5ff';
  const nextRank = rankStats?.nextRank || null;

  const handleNextLevel = () => {
    setLevel(safeLevel + 1);
    fetchNewBatch();
    setScreen('game');
  };

  const handleReplay = () => {
    fetchNewBatch();
    setScreen('game');
  };

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      className="max-w-3xl mx-auto px-4 py-12 flex flex-col gap-8"
    >
      {/* Top Banner Card */}
      <div className="glass-panel p-8 rounded-3xl border border-cyan-500/30 text-center relative overflow-hidden shadow-[0_0_50px_rgba(0,245,255,0.1)]">
        <div className="text-xs font-bold uppercase tracking-widest text-cyan-400">
          Session Completed • Level {safeLevel}
        </div>
        
        {/* Grade Badge */}
        <div className="my-4">
          <span className={`font-display font-black text-7xl sm:text-8xl tracking-tighter ${gradeColor}`}>
            {grade}
          </span>
          <div className="text-xs text-slate-400 font-medium mt-1">Typing Mastery Rating</div>
        </div>

        {/* Currency Earned Banner */}
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-emerald-950/50 border border-emerald-500/40 text-emerald-300 font-mono font-bold text-sm shadow-[0_0_20px_rgba(16,185,129,0.2)]">
          <Gem className="w-4 h-4 text-emerald-400" />
          <span>+{safeEmeralds} Emeralds Harvested</span>
        </div>
      </div>

      {/* Metric Breakdown Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        
        <div className="glass-panel p-5 rounded-2xl border border-white/10 text-center">
          <Zap className="w-5 h-5 mx-auto text-cyan-400 mb-2" />
          <div className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Net Speed</div>
          <div className="text-3xl font-mono font-extrabold text-white mt-1">
            {safeWpm} <span className="text-xs font-normal text-slate-400">WPM</span>
          </div>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-white/10 text-center">
          <Target className="w-5 h-5 mx-auto text-emerald-400 mb-2" />
          <div className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Accuracy</div>
          <div className="text-3xl font-mono font-extrabold text-emerald-400 mt-1">
            {safeAcc}%
          </div>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-white/10 text-center">
          <Clock className="w-5 h-5 mx-auto text-purple-400 mb-2" />
          <div className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Duration</div>
          <div className="text-3xl font-mono font-extrabold text-purple-300 mt-1">
            {safeDuration}s
          </div>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-white/10 text-center">
          <Flame className="w-5 h-5 mx-auto text-amber-400 mb-2" />
          <div className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Raw Speed</div>
          <div className="text-3xl font-mono font-extrabold text-amber-300 mt-1">
            {safeRawWpm} <span className="text-xs font-normal text-slate-400">WPM</span>
          </div>
        </div>

      </div>

      {/* Rank Progress Bar Card */}
      <div className="glass-panel p-6 rounded-2xl border border-white/10 flex flex-col gap-3">
        <div className="flex items-center justify-between text-xs font-semibold">
          <div className="flex items-center gap-2">
            <Award className="w-4 h-4 text-cyan-400" />
            <span>Current Rank: <b style={{ color: rankColor }}>{rankName}</b></span>
          </div>
          <span className="text-slate-400">{safeProgress}% to Next Tier</span>
        </div>

        <div className="w-full h-3 bg-slate-900 rounded-full border border-white/10 overflow-hidden p-0.5">
          <motion.div 
            className="h-full rounded-full bg-gradient-to-r from-cyan-500 via-purple-500 to-emerald-400"
            initial={{ width: 0 }}
            animate={{ width: `${safeProgress}%` }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
          />
        </div>

        {nextRank && (
          <div className="text-[11px] text-slate-400 text-right">
            Next: <span className="font-semibold" style={{ color: nextRank.color || '#ffd54f' }}>{nextRank.name}</span>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap items-center justify-center gap-4">
        <button
          onClick={handleReplay}
          className="flex items-center gap-2 px-6 py-3 rounded-2xl glass-panel hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 font-semibold text-sm transition-all"
        >
          <RotateCcw className="w-4 h-4" /> Replay Level
        </button>

        <button
          onClick={() => setScreen('dashboard')}
          className="flex items-center gap-2 px-6 py-3 rounded-2xl glass-panel hover:bg-white/10 text-cyan-300 hover:text-white border border-cyan-500/30 font-semibold text-sm transition-all"
        >
          <LayoutDashboard className="w-4 h-4 text-cyan-400" /> Dashboard
        </button>

        <button
          onClick={() => setScreen('map')}
          className="flex items-center gap-2 px-6 py-3 rounded-2xl glass-panel hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 font-semibold text-sm transition-all"
        >
          <Map className="w-4 h-4" /> Level Map
        </button>

        <button
          onClick={() => setModal('certificate')}
          className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 font-semibold text-sm transition-all shadow-[0_0_15px_rgba(245,158,11,0.2)]"
        >
          <Award className="w-4 h-4 text-amber-400" /> View Diploma
        </button>

        <button
          onClick={handleNextLevel}
          className="flex items-center gap-2 px-8 py-3 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black font-display font-extrabold text-sm shadow-neon-cyan transition-all"
        >
          <span>Next Level</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

    </motion.div>
  );
};
