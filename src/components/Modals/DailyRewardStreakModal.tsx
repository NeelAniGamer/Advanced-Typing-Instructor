import React, { useState, useEffect } from 'react';
import { useGameStore } from '../../stores/useGameStore';
import { isOrganicTheme } from '../../utils/theme';
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
import { BorderGlow } from '../ReactBits/BorderGlow';
import { Chip, Badge } from '../HeroUI';
import { NumberTicker, TiltCard, TiltCardItem } from '../SpectrumUI';

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
  const { addEmeralds, setModal, uiTheme, setDailyStreak, dailyStreak: storeStreak } = useGameStore();
  const isOrganic = isOrganicTheme(uiTheme);

  const [currentStreak, setCurrentStreak] = useState(storeStreak || 1);
  const [claimedToday, setClaimedToday] = useState(false);
  const [justClaimedReward, setJustClaimedReward] = useState<number | null>(null);

  useEffect(() => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const savedDate = localStorage.getItem('ati_last_streak_date');
      const savedStreak = parseInt(localStorage.getItem('ati_streak_count') || String(storeStreak || 1), 10);

      if (savedDate === today) {
        setClaimedToday(true);
        setCurrentStreak(Math.min(7, savedStreak));
        setDailyStreak(Math.min(7, savedStreak));
      } else if (savedDate) {
        const last = new Date(savedDate);
        const curr = new Date(today);
        const diffDays = Math.round((curr.getTime() - last.getTime()) / (1000 * 3600 * 24));
        if (diffDays === 1) {
          const nextStreak = savedStreak >= 7 ? 1 : savedStreak + 1;
          setCurrentStreak(nextStreak);
          setDailyStreak(nextStreak);
          setClaimedToday(false);
        } else {
          setCurrentStreak(1);
          setDailyStreak(1);
          setClaimedToday(false);
        }
      } else {
        setCurrentStreak(1);
        setDailyStreak(1);
        setClaimedToday(false);
      }
    } catch {
      setCurrentStreak(1);
      setDailyStreak(1);
      setClaimedToday(false);
    }
  }, []);

  const handleClaim = () => {
    if (claimedToday) return;

    const reward = REWARDS[currentStreak - 1] || REWARDS[0];
    addEmeralds(reward.emeralds);
    soundEngine.playLevelUp();

    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 }
    });

    const today = new Date().toISOString().split('T')[0];
    localStorage.setItem('ati_last_streak_date', today);
    localStorage.setItem('ati_streak_count', currentStreak.toString());
    setDailyStreak(currentStreak);

    setClaimedToday(true);
    setJustClaimedReward(reward.emeralds);
  };

  return (
    <div 
      onClick={(e) => {
        if (e.target === e.currentTarget) setModal(null);
      }}
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className={`w-full max-w-4xl p-6 sm:p-7 rounded-3xl border flex flex-col gap-6 relative overflow-hidden transition-all duration-300 ${
          isOrganic
            ? 'bg-[#FAF8F5] border-[#E5DFD7] text-[#333333] shadow-organic-card'
            : 'glass-panel border-amber-500/30 text-white shadow-[0_0_50px_rgba(245,158,11,0.15)] bg-slate-950/95'
        }`}
      >
        {/* Header */}
        <div className={`flex items-center justify-between border-b pb-4 transition-colors ${
          isOrganic ? 'border-[#E5DFD7]' : 'border-white/10'
        }`}>
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-2xl border transition-colors ${
              isOrganic
                ? 'bg-[#EBC078]/25 border-[#EBC078]/40 text-[#966E1F]'
                : 'bg-amber-500/10 border-amber-400/30 text-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.2)]'
            }`}>
              <Flame className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className={`text-[10px] font-mono uppercase tracking-widest font-bold ${
                  isOrganic ? 'text-[#C97D5A]' : 'text-amber-400'
                }`}>
                  Daily Tribute System
                </span>
                <Chip size="sm" variant={isOrganic ? 'soft' : 'solid'} color={isOrganic ? 'warning' : 'warning'}>
                  Consecutive
                </Chip>
              </div>
              <h3 className={`font-display font-black text-xl tracking-wide ${
                isOrganic ? 'text-[#333333]' : 'text-white'
              }`}>
                7-Day Login Streak Calendar
              </h3>
            </div>
          </div>

          <button
            onClick={() => setModal(null)}
            className={`p-2 rounded-xl border transition-all ${
              isOrganic
                ? 'bg-white/80 border-[#E5DFD7] text-[#616864] hover:text-[#333333] hover:bg-[#F2EFEB]'
                : 'bg-slate-900 border-white/10 text-slate-400 hover:text-white hover:bg-white/10'
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Current Status Banner (Wrapped in BorderGlow) */}
        <BorderGlow
          edgeSensitivity={22}
          glowRadius={30}
          borderRadius={18}
          glowIntensity={1.05}
          coneSpread={26}
          animated={false}
          backgroundColor={isOrganic ? '#FFFFFF' : '#0d1117'}
          glowColor={isOrganic ? '40 80 80' : '45 100 50'}
          colors={
            isOrganic
              ? ['#7C8D81', '#C97D5A', '#EBC078']
              : ['#f59e0b', '#fbbf24', '#f97316']
          }
          className="w-full"
        >
          <div className={`p-4 rounded-2xl border flex items-center justify-between gap-3 transition-colors ${
            isOrganic
              ? 'bg-gradient-to-r from-[#F4F0EA]/80 via-white to-[#FAF8F5]/80 border-[#E5DFD7]'
              : 'bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-transparent border-amber-500/20'
          }`}>
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl border flex items-center justify-center text-xl shrink-0 ${
                isOrganic
                  ? 'bg-[#EBC078]/25 border-[#EBC078]/40'
                  : 'bg-amber-500/20 border-amber-400/40'
              }`}>
                🔥
              </div>
              <div>
                <div className={`text-xs font-bold ${
                  isOrganic ? 'text-[#333333]' : 'text-amber-300'
                }`}>
                  <NumberTicker value={currentStreak} />-Day Active Streak!
                </div>
                <div className={`text-[11px] ${isOrganic ? 'text-[#616864]' : 'text-slate-400'}`}>
                  {claimedToday
                    ? "You've collected today's reward. Come back tomorrow for Day " + (currentStreak >= 7 ? 1 : currentStreak + 1) + "!"
                    : "Day " + currentStreak + " reward is unlocked and ready for extraction!"}
                </div>
              </div>
            </div>

            {claimedToday && (
              <Chip size="sm" variant="solid" color="success">
                ✓ Claimed Today
              </Chip>
            )}
          </div>
        </BorderGlow>

        {/* 7-Day Grid with TiltCard */}
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2.5">
          {REWARDS.map((r) => {
            const isCompleted = r.day < currentStreak || (r.day === currentStreak && claimedToday);
            const isToday = r.day === currentStreak && !claimedToday;
            const isFuture = r.day > currentStreak;

            return (
              <TiltCard
                key={r.day}
                maxTilt={10}
                scale={1.04}
                className={`p-3 rounded-2xl border flex flex-col items-center justify-between text-center transition-all relative overflow-hidden h-full ${
                  isToday
                    ? isOrganic
                      ? 'bg-white border-2 border-[#C97D5A] shadow-[0_4px_20px_rgba(201,125,90,0.25)] ring-1 ring-[#C97D5A]/40'
                      : 'bg-amber-500/20 border-amber-400 shadow-[0_0_25px_rgba(245,158,11,0.3)]'
                    : isCompleted
                    ? isOrganic
                      ? 'bg-[#7C8D81]/15 border-[#7C8D81]/35 text-[#58675E]'
                      : 'bg-emerald-950/30 border-emerald-500/30 text-emerald-400 opacity-90'
                    : r.isSpecial
                    ? isOrganic
                      ? 'bg-[#EBC078]/25 border-[#EBC078]/50 text-[#966E1F]'
                      : 'bg-purple-950/40 border-purple-500/40 text-purple-300'
                    : isOrganic
                    ? 'bg-white border-[#E5DFD7] text-[#616864]'
                    : 'bg-slate-950/60 border-white/10 text-slate-400'
                }`}
              >
                <TiltCardItem depth={10}>
                  {/* Day Badge */}
                  <div className="w-full flex items-center justify-between text-[10px] font-mono font-bold mb-1">
                    <span>Day {r.day}</span>
                    {isCompleted ? (
                      <CheckCircle2 className={`w-3.5 h-3.5 ${isOrganic ? 'text-[#7C8D81]' : 'text-emerald-400'}`} />
                    ) : isFuture ? (
                      <Lock className={`w-3 h-3 ${isOrganic ? 'text-[#B8C0BF]' : 'text-slate-600'}`} />
                    ) : (
                      <Sparkles className={`w-3.5 h-3.5 animate-spin ${isOrganic ? 'text-[#C97D5A]' : 'text-amber-400'}`} />
                    )}
                  </div>

                  {/* Reward Center */}
                  <div className="my-2 flex flex-col items-center">
                    <div className="text-2xl mb-1">
                      {r.isSpecial ? '👑' : isCompleted ? '💎' : '🎁'}
                    </div>
                    <span className={`font-mono font-black text-sm ${
                      isOrganic ? 'text-[#333333]' : 'text-white'
                    }`}>
                      +<NumberTicker value={r.emeralds} />
                    </span>
                    <span className={`text-[9px] uppercase font-medium ${
                      isOrganic ? 'text-[#616864]' : 'text-slate-400'
                    }`}>
                      Emeralds
                    </span>
                  </div>

                  {/* Bonus Title */}
                  {r.bonusTitle ? (
                    <div className={`text-[9px] font-bold rounded-md px-1 py-0.5 w-full truncate border ${
                      isOrganic
                        ? 'bg-[#EBC078]/25 border-[#EBC078]/40 text-[#966E1F]'
                        : 'text-amber-300 bg-amber-500/20 border-amber-400/30'
                    }`}>
                      {r.bonusTitle}
                    </div>
                  ) : (
                    <div className={`text-[9px] font-mono ${isOrganic ? 'text-[#B8C0BF]' : 'text-slate-600'}`}>
                      Standard
                    </div>
                  )}
                </TiltCardItem>
              </TiltCard>
            );
          })}
        </div>

        {/* Claim Action Button */}
        <div className={`flex flex-col sm:flex-row items-center justify-between gap-4 pt-2 border-t transition-colors ${
          isOrganic ? 'border-[#E5DFD7]' : 'border-white/10'
        }`}>
          <div className={`text-xs flex items-center gap-1.5 ${
            isOrganic ? 'text-[#616864]' : 'text-slate-400'
          }`}>
            <Clock className={`w-4 h-4 ${isOrganic ? 'text-[#7C8D81]' : 'text-slate-500'}`} />
            <span>Resets daily at 00:00 midnight local time</span>
          </div>

          <button
            onClick={handleClaim}
            disabled={claimedToday}
            className={`w-full sm:w-auto px-8 py-3.5 rounded-2xl font-display font-black text-sm tracking-wider transition-all flex items-center justify-center gap-2 ${
              claimedToday
                ? isOrganic
                  ? 'bg-[#F2EFEB] border border-[#E5DFD7] text-[#B8C0BF] cursor-not-allowed'
                  : 'bg-slate-900 border border-white/10 text-slate-600 cursor-not-allowed'
                : isOrganic
                ? 'bg-[#C97D5A] hover:bg-[#B86B49] text-white shadow-organic-terracotta hover:shadow-[0_8px_24px_rgba(201,125,90,0.4)] active:scale-95'
                : 'bg-gradient-to-r from-amber-400 to-orange-500 text-black hover:shadow-[0_0_30px_rgba(245,158,11,0.5)] active:scale-95'
            }`}
          >
            <Gift className="w-4 h-4" />
            <span>
              {claimedToday
                ? 'Claimed for Today'
                : `Claim Day ${currentStreak} (+${REWARDS[currentStreak - 1]?.emeralds} 💎)`}
            </span>
          </button>
        </div>

      </motion.div>
    </div>
  );
};
