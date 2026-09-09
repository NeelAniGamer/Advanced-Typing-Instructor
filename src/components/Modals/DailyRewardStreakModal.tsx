import React, { useState, useEffect } from 'react';
import { useGameStore } from '../../stores/useGameStore';
import { soundEngine } from '../../services/soundEngine';
import confetti from 'canvas-confetti';
import { 
  X, 
  Flame, 
  Gem, 
  CheckCircle2, 
  Lock, 
  Gift, 
  Sparkles, 
  Clock, 
  Award 
} from 'lucide-react';
import { motion } from 'framer-motion';

interface DailyReward {
  day: number;
  emeralds: number;
  bonusTitle?: string;
  isSpecial?: boolean;
}

const REWARDS: DailyReward[] = [
  { day: 1, emeralds: 50 },
  { day: 2, emeralds: 120 },
  { day: 3, emeralds: 250, bonusTitle: 'Quick Strike' },
  { day: 4, emeralds: 400 },
  { day: 5, emeralds: 600, bonusTitle: 'Tactile Prodigy' },
  { day: 6, emeralds: 900 },
  { day: 7, emeralds: 2000, bonusTitle: 'Shadow Grandmaster', isSpecial: true },
];

export const DailyRewardStreakModal: React.FC = () => {
  const { addEmeralds, setModal } = useGameStore();

  const [currentStreak, setCurrentStreak] = useState(1);
  const [claimedToday, setClaimedToday] = useState(false);
  const [justClaimedReward, setJustClaimedReward] = useState<number | null>(null);

  useEffect(() => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const savedDate = localStorage.getItem('ati_last_streak_date');
      const savedStreak = parseInt(localStorage.getItem('ati_streak_count') || '1', 10);

      if (savedDate === today) {
        setClaimedToday(true);
        setCurrentStreak(Math.min(7, savedStreak));
      } else if (savedDate) {
        const last = new Date(savedDate);
        const curr = new Date(today);
        const diffDays = Math.round((curr.getTime() - last.getTime()) / (1000 * 3600 * 24));
        if (diffDays === 1) {
          // Continuous consecutive day
          const nextStreak = savedStreak >= 7 ? 1 : savedStreak + 1;
          setCurrentStreak(nextStreak);
          setClaimedToday(false);
        } else {
          // Missed a day -> reset to day 1
          setCurrentStreak(1);
          setClaimedToday(false);
        }
      } else {
        // First time
        setCurrentStreak(1);
        setClaimedToday(false);
      }
    } catch {
      setCurrentStreak(1);
      setClaimedToday(false);
    }
  }, []);

  const handleClaim = () => {
    if (claimedToday) return;

    const reward = REWARDS.find((r) => r.day === currentStreak) || REWARDS[0];
    addEmeralds(reward.emeralds);
    soundEngine.playLevelUp();

    // Fire celebration confetti
    confetti({
      particleCount: 100,
      spread: 80,
      origin: { y: 0.6 },
      colors: ['#ffd700', '#00f5ff', '#10b981', '#a855f7'],
    });

    const today = new Date().toISOString().split('T')[0];
    localStorage.setItem('ati_last_streak_date', today);
    localStorage.setItem('ati_streak_count', currentStreak.toString());

    setClaimedToday(true);
    setJustClaimedReward(reward.emeralds);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="glass-panel w-full max-w-2xl p-6 sm:p-7 rounded-3xl border border-amber-500/30 shadow-[0_0_50px_rgba(245,158,11,0.15)] flex flex-col gap-6 relative overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-amber-500/10 border border-amber-400/30 shadow-[0_0_20px_rgba(245,158,11,0.2)]">
              <Flame className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <span className="text-[10px] font-mono uppercase tracking-widest text-amber-400 font-bold">
                Daily Tribute System
              </span>
              <h3 className="font-display font-black text-xl text-white tracking-wide">
                7-Day Login Streak Calendar
              </h3>
            </div>
          </div>

          <button
            onClick={() => setModal(null)}
            className="p-2 rounded-xl bg-slate-900 border border-white/10 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Current Status Banner */}
        <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-transparent border border-amber-500/20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-xl">
              🔥
            </div>
            <div>
              <div className="text-xs font-bold text-amber-300">
                {currentStreak}-Day Active Streak!
              </div>
              <div className="text-[11px] text-slate-400">
                {claimedToday
                  ? "You've collected today's reward. Come back tomorrow for Day " + (currentStreak >= 7 ? 1 : currentStreak + 1) + "!"
                  : "Day " + currentStreak + " reward is unlocked and ready for extraction!"}
              </div>
            </div>
          </div>

          {claimedToday && (
            <span className="flex items-center gap-1 text-xs text-emerald-400 bg-emerald-950/60 border border-emerald-500/30 px-3 py-1.5 rounded-xl font-bold">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Claimed
            </span>
          )}
        </div>

        {/* 7-Day Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2.5">
          {REWARDS.map((r) => {
            const isCompleted = r.day < currentStreak || (r.day === currentStreak && claimedToday);
            const isToday = r.day === currentStreak && !claimedToday;
            const isFuture = r.day > currentStreak;

            return (
              <div
                key={r.day}
                className={`p-3 rounded-2xl border flex flex-col items-center justify-between text-center transition-all relative overflow-hidden ${
                  isToday
                    ? 'bg-amber-500/20 border-amber-400 shadow-[0_0_25px_rgba(245,158,11,0.3)] scale-105'
                    : isCompleted
                    ? 'bg-emerald-950/30 border-emerald-500/30 text-emerald-400 opacity-90'
                    : r.isSpecial
                    ? 'bg-purple-950/40 border-purple-500/40 text-purple-300 shadow-neon-purple/20'
                    : 'bg-slate-950/60 border-white/10 text-slate-400'
                }`}
              >
                {/* Day Badge */}
                <div className="w-full flex items-center justify-between text-[10px] font-mono font-bold">
                  <span>Day {r.day}</span>
                  {isCompleted ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  ) : isFuture ? (
                    <Lock className="w-3 h-3 text-slate-600" />
                  ) : (
                    <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-spin" />
                  )}
                </div>

                {/* Reward Center */}
                <div className="my-2.5 flex flex-col items-center">
                  <div className="text-2xl mb-1">
                    {r.isSpecial ? '👑' : isCompleted ? '💎' : '🎁'}
                  </div>
                  <span className="font-mono font-black text-sm text-white">
                    +{r.emeralds}
                  </span>
                  <span className="text-[9px] text-slate-400 font-medium uppercase">
                    Emeralds
                  </span>
                </div>

                {/* Bonus Title if applicable */}
                {r.bonusTitle ? (
                  <div className="text-[9px] font-bold text-amber-300 bg-amber-500/20 border border-amber-400/30 rounded-md px-1 py-0.5 w-full truncate">
                    {r.bonusTitle}
                  </div>
                ) : (
                  <div className="text-[9px] text-slate-600 font-mono">Standard</div>
                )}
              </div>
            );
          })}
        </div>

        {/* Claim Action Button */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2 border-t border-white/10">
          <div className="text-xs text-slate-400 flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-slate-500" />
            <span>Resets daily at 00:00 midnight local time</span>
          </div>

          <button
            onClick={handleClaim}
            disabled={claimedToday}
            className={`w-full sm:w-auto px-8 py-3 rounded-2xl font-display font-black text-sm tracking-wide transition-all flex items-center justify-center gap-2 ${
              claimedToday
                ? 'bg-slate-900 border border-white/10 text-slate-600 cursor-not-allowed'
                : 'bg-gradient-to-r from-amber-400 to-orange-500 text-black hover:shadow-[0_0_30px_rgba(245,158,11,0.5)] active:scale-95'
            }`}
          >
            <Gift className="w-4 h-4" />
            <span>
              {claimedToday ? 'Claimed for Today' : `Claim Day ${currentStreak} (+${REWARDS[currentStreak - 1]?.emeralds} 💎)`}
            </span>
          </button>
        </div>

      </motion.div>
    </div>
  );
};
