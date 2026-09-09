import React, { useState } from 'react';
import { useGameStore } from '../../stores/useGameStore';
import { 
  Play, 
  Calendar, 
  Trophy, 
  Zap, 
  Award, 
  Terminal,
  ChevronRight,
  Sparkles
} from 'lucide-react';
import { motion } from 'framer-motion';

export const LandingScreen: React.FC = () => {
  const { setScreen, setModal, fetchNewBatch } = useGameStore();
  const [versionClicks, setVersionClicks] = useState(0);

  const handleStartTraining = () => {
    fetchNewBatch();
    setScreen('game');
  };

  const handleVersionClick = () => {
    const next = versionClicks + 1;
    setVersionClicks(next);
    if (next >= 5) {
      setVersionClicks(0);
      setModal('admin');
    }
  };

  return (
    <div className="relative min-h-[calc(100vh-70px)] flex flex-col items-center justify-center text-center px-4 py-12">
      
      {/* Background Ambience Glow */}
      <div className="absolute w-[500px] h-[500px] bg-cyan-500/10 rounded-full blur-3xl pointer-events-none -top-20" />
      <div className="absolute w-[400px] h-[400px] bg-purple-500/10 rounded-full blur-3xl pointer-events-none -bottom-20" />

      {/* Main Hero Card */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 max-w-2xl flex flex-col items-center"
      >
        {/* Ready Badge */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-400/30 text-cyan-300 text-xs font-mono font-bold mb-6 shadow-neon-cyan">
          <Sparkles className="w-3.5 h-3.5" />
          <span>SYSTEM READY • v2.5.0</span>
        </div>

        {/* Mega Title */}
        <h1 className="font-display font-black text-5xl sm:text-7xl tracking-tight text-white leading-none">
          Advanced Typing<br />
          <span className="bg-gradient-to-r from-cyan-400 via-purple-400 to-emerald-400 bg-clip-text text-transparent">
            Instructor
          </span>
        </h1>

        {/* Subtitle */}
        <p className="font-sans text-slate-400 text-base sm:text-lg max-w-lg mt-5 leading-relaxed">
          Master the art of speed & precision. Conquer 200 progression levels, defeat latency bosses, and rise to Endgame rank.
        </p>

        {/* Credits */}
        <p className="text-xs text-slate-500 font-mono mt-3">
          — engineered by Neel, Ansh &amp; Aarush —
        </p>

        {/* Massive Start Button */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleStartTraining}
          className="mt-8 px-10 py-4 rounded-2xl bg-gradient-to-r from-cyan-500 via-teal-400 to-blue-500 text-black font-display font-black text-lg tracking-wide shadow-neon-cyan flex items-center gap-3 transition-all"
        >
          <Play className="w-5 h-5 fill-black" />
          <span>START TRAINING</span>
          <ChevronRight className="w-5 h-5" />
        </motion.button>

        {/* Quick Access Badges */}
        <div className="flex flex-wrap items-center justify-center gap-3 mt-10">
          <button
            onClick={() => setModal('daily')}
            className="flex items-center gap-2 px-4 py-2 rounded-xl glass-panel hover:border-amber-400/40 text-xs font-semibold text-amber-300 transition-all"
          >
            <Calendar className="w-4 h-4 text-amber-400" />
            <span>Daily Challenge</span>
          </button>

          <button
            onClick={() => setModal('tournament')}
            className="flex items-center gap-2 px-4 py-2 rounded-xl glass-panel hover:border-red-400/40 text-xs font-semibold text-red-300 transition-all"
          >
            <Trophy className="w-4 h-4 text-red-400" />
            <span>Tournaments</span>
          </button>

          <button
            onClick={() => {
              setScreen('game');
            }}
            className="flex items-center gap-2 px-4 py-2 rounded-xl glass-panel hover:border-emerald-400/40 text-xs font-semibold text-emerald-300 transition-all"
          >
            <Zap className="w-4 h-4 text-emerald-400" />
            <span>Speed Benchmark</span>
          </button>

          <button
            onClick={() => setModal('achievements')}
            className="flex items-center gap-2 px-4 py-2 rounded-xl glass-panel hover:border-purple-400/40 text-xs font-semibold text-purple-300 transition-all"
          >
            <Award className="w-4 h-4 text-purple-400" />
            <span>Achievements</span>
          </button>
        </div>

        {/* Secret version unlock */}
        <button
          onClick={handleVersionClick}
          className="mt-14 text-[11px] font-mono text-slate-600 hover:text-slate-400 transition-colors"
          title="Click 5× to trigger Admin Terminal"
        >
          build-rev 2.5.0-react-tsx {versionClicks > 0 && `(${versionClicks}/5)`}
        </button>

      </motion.div>
    </div>
  );
};
