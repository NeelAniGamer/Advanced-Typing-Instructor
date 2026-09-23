import React, { useState, useMemo } from 'react';
import { useGameStore } from '../../stores/useGameStore';
import { Achievement } from '../../types/game';
import { X, Award, CheckCircle2, Lock, Sparkles, Trophy, Zap, Target, Flame } from 'lucide-react';
import { motion } from 'framer-motion';
import { Chip, Badge, ProgressBar } from '../HeroUI';
import { TiltCard, NumberTicker, StatusBadge } from '../SpectrumUI';
import BorderGlow from '../ReactBits/BorderGlow';

import { isOrganicTheme } from '../../utils/theme';

const RAW_ACHIEVEMENTS: Achievement[] = [
  { id: 'spd_20', cat: 'speed', name: 'Speed Rookie', desc: 'Hit 20 WPM in any typing session.', icon: '⚡', unlocked: false },
  { id: 'spd_40', cat: 'speed', name: 'Speed Adept', desc: 'Hit 40 WPM in any typing session.', icon: '⚡⚡', unlocked: false },
  { id: 'spd_60', cat: 'speed', name: 'Speed Master', desc: 'Hit 60 WPM in any typing session.', icon: '🚀', unlocked: false },
  { id: 'spd_80', cat: 'speed', name: 'Speed Legend', desc: 'Hit 80 WPM in any typing session.', icon: '🔥', unlocked: false },
  { id: 'spd_100', cat: 'speed', name: 'The Century', desc: 'Hit 100 WPM — insane supersonic velocity!', icon: '💯', secret: true, unlocked: false },
  { id: 'spd_120', cat: 'speed', name: 'Mechanical Machine', desc: 'Hit 120 WPM. Pure biomechanical rhythm.', icon: '🤖', secret: true, unlocked: false },

  { id: 'acc_95', cat: 'acc', name: 'Sharp Eye', desc: 'Complete a level with 95%+ accuracy.', icon: '🎯', unlocked: false },
  { id: 'acc_100', cat: 'acc', name: 'Flawless Execution', desc: 'Finish with 100% surgical accuracy.', icon: '💎', unlocked: false },
  { id: 'acc_100x5', cat: 'acc', name: 'Perfectionist', desc: 'Finish with 100% accuracy across 5 sessions.', icon: '✨', unlocked: false },

  { id: 'lvl_10', cat: 'lvl', name: 'Getting Started', desc: 'Reach Level 10 on the adventure map.', icon: '📍', unlocked: false },
  { id: 'lvl_50', cat: 'lvl', name: 'Halfway There', desc: 'Reach Level 50 on the adventure map.', icon: '🏃', unlocked: false },
  { id: 'lvl_100', cat: 'lvl', name: 'Century Club', desc: 'Reach Level 100 on the adventure map.', icon: '🎖️', unlocked: false },
  { id: 'lvl_200', cat: 'lvl', name: 'The Pinnacle', desc: 'Reach Level 200 (The Endgame).', icon: '🏔️', secret: true, unlocked: false },

  { id: 'boss_1', cat: 'boss', name: 'Boss Slayer', desc: 'Defeat your first latency boss.', icon: '⚔️', unlocked: false },
  { id: 'boss_10', cat: 'boss', name: 'Master Hunter', desc: 'Defeat 10 milestone bosses.', icon: '🗡️', secret: true, unlocked: false },

  { id: 'cur_10k', cat: 'cur', name: 'Millionaire Mindset', desc: 'Accumulate 10,000 Emeralds total.', icon: '💰', unlocked: false },
  { id: 'pre_1', cat: 'pre', name: 'Ascended Typist', desc: 'Ascend to Prestige I.', icon: '⭐', secret: true, unlocked: false },
];

export const AchievementsModal: React.FC = () => {
  const { setModal, uiTheme, user, level, emeralds, wpm } = useGameStore();
  const isOrganic = isOrganicTheme(uiTheme);
  const [filter, setFilter] = useState<'all' | 'unlocked' | 'locked'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  const liveAchievements = useMemo(() => {
    const bestWpm = Math.max(user.best_wpm || 0, wpm || 0);
    return RAW_ACHIEVEMENTS.map((a) => {
      let isUnlocked = a.unlocked;
      if (a.id === 'spd_20') isUnlocked = bestWpm >= 20 || isUnlocked;
      if (a.id === 'spd_40') isUnlocked = bestWpm >= 40 || isUnlocked;
      if (a.id === 'spd_60') isUnlocked = bestWpm >= 60 || isUnlocked;
      if (a.id === 'spd_80') isUnlocked = bestWpm >= 80 || isUnlocked;
      if (a.id === 'spd_100') isUnlocked = bestWpm >= 100 || isUnlocked;
      if (a.id === 'spd_120') isUnlocked = bestWpm >= 120 || isUnlocked;
      if (a.id === 'lvl_10') isUnlocked = level >= 10 || isUnlocked;
      if (a.id === 'lvl_50') isUnlocked = level >= 50 || isUnlocked;
      if (a.id === 'lvl_100') isUnlocked = level >= 100 || isUnlocked;
      if (a.id === 'lvl_200') isUnlocked = level >= 200 || isUnlocked;
      if (a.id === 'cur_10k') isUnlocked = (emeralds || 0) >= 10000 || isUnlocked;
      return { ...a, unlocked: isUnlocked };
    });
  }, [user.best_wpm, wpm, level, emeralds]);

  const unlockedCount = useMemo(() => {
    return liveAchievements.filter((a) => a.unlocked).length;
  }, [liveAchievements]);

  const completionPct = Math.round((unlockedCount / liveAchievements.length) * 100);

  const filtered = useMemo(() => {
    return liveAchievements.filter((a) => {
      if (filter === 'unlocked' && !a.unlocked) return false;
      if (filter === 'locked' && a.unlocked) return false;
      if (categoryFilter !== 'all' && a.cat !== categoryFilter) return false;
      return true;
    });
  }, [liveAchievements, filter, categoryFilter]);

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) setModal(null);
      }}
      className={`fixed inset-0 z-[100] backdrop-blur-xl flex items-center justify-center p-4 transition-colors ${
        isOrganic ? 'bg-black/65' : 'bg-black/85'
      }`}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className={`max-w-3xl w-full p-6 sm:p-8 rounded-3xl flex flex-col gap-6 max-h-[90vh] overflow-y-auto transition-all ${
          isOrganic
            ? 'bg-[#FAF8F5] border border-[#E5DFD7] text-[#333333] shadow-2xl'
            : 'glass-panel border border-purple-500/30 text-white shadow-[0_0_50px_rgba(179,136,255,0.15)]'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className={`p-3 rounded-2xl border ${
                isOrganic
                  ? 'bg-[#7C8D81]/15 border-[#7C8D81]/30 text-[#7C8D81]'
                  : 'bg-purple-500/10 border-purple-500/30 text-purple-400'
              }`}
            >
              <Award className="w-6 h-6" />
            </div>
            <div>
              <div
                className={`text-[11px] font-bold uppercase tracking-wider ${
                  isOrganic ? 'text-[#7C8D81]' : 'text-purple-400'
                }`}
              >
                Hall of Honor
              </div>
              <h3
                className={`font-display font-extrabold text-2xl flex items-center gap-2 ${
                  isOrganic ? 'text-[#333333]' : 'text-white'
                }`}
              >
                Badges &amp; Achievements (
                <NumberTicker value={unlockedCount} /> / {liveAchievements.length})
              </h3>
            </div>
          </div>

          <button
            onClick={() => setModal(null)}
            className={`p-2 rounded-xl transition-colors ${
              isOrganic
                ? 'bg-white border border-[#E5DFD7] text-[#616864] hover:text-[#333333] shadow-sm'
                : 'bg-slate-900 border border-white/10 text-slate-400 hover:text-white'
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Completion Progress Banner */}
        <BorderGlow
          edgeSensitivity={20}
          borderRadius={20}
          glowIntensity={0.6}
          colors={
            isOrganic
              ? ['#C97D5A', '#7C8D81', '#EBC078']
              : ['#c084fc', '#38bdf8', '#a855f7']
          }
        >
          <div
            className={`p-4 rounded-2xl border flex flex-col gap-2 transition-all ${
              isOrganic
                ? 'bg-white/90 border-[#E5DFD7] text-[#333333]'
                : 'bg-slate-950/70 border-white/10 text-white'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Trophy
                  className={`w-4 h-4 ${
                    isOrganic ? 'text-[#C97D5A]' : 'text-amber-400'
                  }`}
                />
                <span className="text-xs font-bold uppercase tracking-wider">
                  Overall Progress Completion
                </span>
              </div>
              <Chip
                size="sm"
                variant="solid"
                color={isOrganic ? 'primary' : 'secondary'}
              >
                <NumberTicker value={completionPct} suffix="%" />
              </Chip>
            </div>
            <ProgressBar
              value={completionPct}
              minValue={0}
              maxValue={100}
              size="md"
              color={isOrganic ? 'primary' : 'secondary'}
            />
          </div>
        </BorderGlow>

        {/* Filter Pills & Categories */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 flex-wrap">
            {(
              [
                { id: 'all', label: 'All Badges' },
                { id: 'unlocked', label: 'Unlocked' },
                { id: 'locked', label: 'Locked' },
              ] as const
            ).map((f) => (
              <Chip
                key={f.id}
                onClick={() => setFilter(f.id)}
                size="sm"
                variant={filter === f.id ? 'solid' : 'soft'}
                color={
                  filter === f.id
                    ? isOrganic
                      ? 'primary'
                      : 'secondary'
                    : 'default'
                }
              >
                {f.label}
              </Chip>
            ))}
          </div>

          {/* Category Pills */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {[
              { id: 'all', label: 'All Categories' },
              { id: 'speed', label: 'Velocity' },
              { id: 'acc', label: 'Precision' },
              { id: 'lvl', label: 'Adventure' },
            ].map((cat) => (
              <Chip
                key={cat.id}
                onClick={() => setCategoryFilter(cat.id)}
                size="sm"
                variant={categoryFilter === cat.id ? 'solid' : 'outline'}
                color={
                  categoryFilter === cat.id
                    ? isOrganic
                      ? 'secondary'
                      : 'primary'
                    : 'default'
                }
              >
                {cat.label}
              </Chip>
            ))}
          </div>
        </div>

        {/* Badges Grid with Spectrum UI TiltCard */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {filtered.map((item) => (
            <TiltCard
              key={item.id}
              maxTilt={7}
              scale={1.01}
              className="rounded-2xl"
            >
              <div
                className={`p-4 rounded-2xl border flex items-center gap-4 transition-all h-full ${
                  isOrganic
                    ? item.unlocked
                      ? 'border-[#7C8D81]/40 bg-white shadow-sm'
                      : 'border-[#E5DFD7] bg-[#F4F0EA]/60 opacity-60'
                    : item.unlocked
                    ? 'border-purple-500/30 bg-purple-950/20 shadow-neon-purple/20'
                    : 'border-white/5 bg-slate-900/40 opacity-60'
                }`}
              >
                <div
                  className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl border shrink-0 ${
                    item.unlocked
                      ? isOrganic
                        ? 'bg-[#FAF8F5] border-[#7C8D81]/30 text-[#C97D5A] shadow-sm'
                        : 'bg-purple-900/40 border-purple-400/40 shadow-neon-purple'
                      : isOrganic
                      ? 'bg-[#E5DFD7] border-transparent text-[#7C8D81]'
                      : 'bg-slate-900 border-white/5'
                  }`}
                >
                  {item.secret && !item.unlocked ? '❓' : item.icon}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1">
                    <h4
                      className={`font-display font-bold text-sm truncate ${
                        isOrganic ? 'text-[#333333]' : 'text-white'
                      }`}
                    >
                      {item.secret && !item.unlocked
                        ? 'Secret Achievement'
                        : item.name}
                    </h4>
                    {item.unlocked ? (
                      <StatusBadge status="success" label="Unlocked" />
                    ) : (
                      <StatusBadge status="offline" label="Locked" />
                    )}
                  </div>
                  <p
                    className={`text-xs mt-0.5 leading-relaxed line-clamp-2 ${
                      isOrganic ? 'text-[#616864]' : 'text-slate-400'
                    }`}
                  >
                    {item.secret && !item.unlocked
                      ? 'Keep training to unlock this milestone.'
                      : item.desc}
                  </p>
                  {item.secret && (
                    <div className="mt-1.5">
                      <Chip size="sm" variant="soft" color="warning">
                        Secret
                      </Chip>
                    </div>
                  )}
                </div>
              </div>
            </TiltCard>
          ))}
        </div>
      </motion.div>
    </div>
  );
};
