import React from 'react';
import { useGameStore } from '../../stores/useGameStore';
import { 
  Zap, 
  ArrowRight, 
  Trophy, 
  Gem, 
  Sparkles, 
  CheckCircle2, 
  X,
  Gauge
} from 'lucide-react';
import { motion } from 'framer-motion';
import confetti from 'canvas-confetti';

export const PromotionModal: React.FC = () => {
  const { promotionOffer, executePromotion, dismissPromotionOffer, level } = useGameStore();

  if (!promotionOffer || !promotionOffer.eligible) return null;

  const handleAccept = () => {
    try {
      if (typeof confetti === 'function') {
        confetti({
          particleCount: 120,
          spread: 80,
          origin: { y: 0.5 },
          colors: ['#00f5ff', '#ffd700', '#39ff14', '#b388ff']
        });
      }
    } catch {}
    executePromotion(promotionOffer.target_level, promotionOffer.reason);
  };

  const currentLvl = promotionOffer.current_level || level || 1;
  const targetLvl = promotionOffer.target_level;
  const levelsJumped = targetLvl - currentLvl;

  return (
    <div 
      onClick={(e) => {
        if (e.target === e.currentTarget) dismissPromotionOffer();
      }}
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/85 backdrop-blur-xl"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="glass-panel w-full max-w-xl rounded-3xl border border-amber-400/40 flex flex-col overflow-hidden shadow-[0_0_80px_rgba(251,191,36,0.25)] bg-slate-950/95"
      >
        {/* Banner Header */}
        <div className="p-6 text-center bg-gradient-to-b from-amber-500/20 via-slate-900 to-transparent relative border-b border-white/10">
          <button
            onClick={dismissPromotionOffer}
            className="absolute top-4 right-4 w-8 h-8 rounded-xl glass-panel hover:bg-white/10 flex items-center justify-center text-slate-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="w-16 h-16 mx-auto rounded-3xl bg-gradient-to-br from-amber-400 to-yellow-600 flex items-center justify-center text-black shadow-[0_0_30px_rgba(251,191,36,0.5)] mb-3">
            <Zap className="w-9 h-9 fill-current stroke-[2.5]" />
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-400/30 text-amber-300 font-mono text-[11px] font-bold uppercase tracking-widest mb-1.5 shadow-[0_0_15px_rgba(251,191,36,0.2)]">
            <Sparkles className="w-3 h-3 text-amber-300" />
            <span>AI Curriculum Calibration</span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-display font-black text-white tracking-wide">
            Auto-Promotion Skill Jump!
          </h2>
          <p className="text-xs text-slate-300 mt-1 max-w-md mx-auto">
            PerceptusLM analyzed your typing velocity and accuracy. You have mastered early drills and qualify for a skill jump!
          </p>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-5">
          
          {/* Level Transition Visual */}
          <div className="flex items-center justify-center gap-4 py-4 px-6 rounded-2xl bg-black/50 border border-white/10">
            <div className="text-center">
              <div className="text-[10px] uppercase font-mono text-slate-400 font-bold">Current</div>
              <div className="text-2xl font-mono font-bold text-slate-300 mt-0.5">Lvl {currentLvl}</div>
            </div>

            <div className="flex flex-col items-center px-4">
              <span className="text-xs font-mono font-bold text-amber-400 mb-1">+{levelsJumped} Levels</span>
              <div className="w-20 h-1 bg-gradient-to-r from-slate-600 via-amber-400 to-cyan-400 rounded-full flex items-center justify-end">
                <ArrowRight className="w-4 h-4 text-cyan-400 -mr-1" />
              </div>
            </div>

            <div className="text-center">
              <div className="text-[10px] uppercase font-mono text-amber-400 font-bold">Recommended</div>
              <div className="text-3xl font-mono font-black text-cyan-300 mt-0.5 shadow-neon-cyan">Lvl {targetLvl}</div>
            </div>
          </div>

          {/* AI Diagnostic Metrics */}
          <div className="grid grid-cols-3 gap-3">
            <div className="p-3 rounded-xl bg-slate-900/60 border border-white/5 text-center">
              <div className="text-[10px] text-slate-400 uppercase font-mono">Rolling Speed</div>
              <div className="text-lg font-mono font-extrabold text-cyan-400 mt-0.5">
                {promotionOffer.metrics?.rolling_wpm || 0} <span className="text-xs text-slate-400">WPM</span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-900/60 border border-white/5 text-center">
              <div className="text-[10px] text-slate-400 uppercase font-mono">Accuracy</div>
              <div className="text-lg font-mono font-extrabold text-emerald-400 mt-0.5">
                {promotionOffer.metrics?.rolling_acc || 100}%
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-900/60 border border-white/5 text-center">
              <div className="text-[10px] text-slate-400 uppercase font-mono">Cadence Index</div>
              <div className="text-lg font-mono font-extrabold text-purple-300 mt-0.5">
                {promotionOffer.metrics?.rci || 85}/100
              </div>
            </div>
          </div>

          {/* Reason explanation */}
          <div className="p-4 rounded-2xl bg-amber-950/20 border border-amber-500/20 text-xs text-slate-300 leading-relaxed flex items-start gap-2.5">
            <Trophy className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-amber-300">{promotionOffer.speed_tier || 'Advanced Typer'}: </span>
              {promotionOffer.reason}
            </div>
          </div>

          {/* Reward preview */}
          <div className="p-3 rounded-xl bg-emerald-950/30 border border-emerald-500/30 flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-mono font-bold text-emerald-300">
              <Gem className="w-4 h-4 text-emerald-400" />
              <span>Skill Jump Bonus Reward:</span>
            </div>
            <span className="text-xs font-mono font-extrabold text-emerald-400">+1,000 Emeralds</span>
          </div>

        </div>

        {/* Action Buttons */}
        <div className="p-5 border-t border-white/10 flex items-center justify-end gap-3 bg-slate-950">
          <button
            onClick={dismissPromotionOffer}
            className="px-5 py-2.5 rounded-xl glass-panel hover:bg-white/10 text-slate-400 hover:text-white text-xs font-semibold transition-all"
          >
            Stay on Level {currentLvl}
          </button>

          <button
            onClick={handleAccept}
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 to-yellow-500 hover:from-amber-300 hover:to-yellow-400 text-black font-display font-black text-xs shadow-[0_0_20px_rgba(251,191,36,0.4)] transition-all flex items-center gap-2"
          >
            <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
            <span>Accept Skill Jump to Level {targetLvl}</span>
          </button>
        </div>

      </motion.div>
    </div>
  );
};
