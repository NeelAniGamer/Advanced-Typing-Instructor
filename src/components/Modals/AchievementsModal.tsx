import React, { useState } from 'react';
import { useGameStore } from '../../stores/useGameStore';
import { Achievement } from '../../types/game';
import { X, Award, CheckCircle2, Lock, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';

const ACHIEVEMENTS_LIST: Achievement[] = [
  { id: 'spd_20', cat: 'speed', name: 'Speed Rookie', desc: 'Hit 20 WPM in any typing session.', icon: '⚡', unlocked: true },
  { id: 'spd_40', cat: 'speed', name: 'Speed Adept', desc: 'Hit 40 WPM in any typing session.', icon: '⚡⚡', unlocked: true },
  { id: 'spd_60', cat: 'speed', name: 'Speed Master', desc: 'Hit 60 WPM in any typing session.', icon: '🚀', unlocked: false },
  { id: 'spd_80', cat: 'speed', name: 'Speed Legend', desc: 'Hit 80 WPM in any typing session.', icon: '🔥', unlocked: false },
  { id: 'spd_100', cat: 'speed', name: 'The Century', desc: 'Hit 100 WPM — insane supersonic velocity!', icon: '💯', secret: true, unlocked: false },
  { id: 'spd_120', cat: 'speed', name: 'Mechanical Machine', desc: 'Hit 120 WPM. Pure biomechanical rhythm.', icon: '🤖', secret: true, unlocked: false },

  { id: 'acc_95', cat: 'acc', name: 'Sharp Eye', desc: 'Complete a level with 95%+ accuracy.', icon: '🎯', unlocked: true },
  { id: 'acc_100', cat: 'acc', name: 'Flawless Execution', desc: 'Finish with 100% surgical accuracy.', icon: '💎', unlocked: true },
  { id: 'acc_100x5', cat: 'acc', name: 'Perfectionist', desc: 'Finish with 100% accuracy across 5 sessions.', icon: '✨', unlocked: false },

  { id: 'lvl_10', cat: 'lvl', name: 'Getting Started', desc: 'Reach Level 10 on the adventure map.', icon: '📍', unlocked: true },
  { id: 'lvl_50', cat: 'lvl', name: 'Halfway There', desc: 'Reach Level 50 on the adventure map.', icon: '🏃', unlocked: false },
  { id: 'lvl_100', cat: 'lvl', name: 'Century Club', desc: 'Reach Level 100 on the adventure map.', icon: '🎖️', unlocked: false },
  { id: 'lvl_200', cat: 'lvl', name: 'The Pinnacle', desc: 'Reach Level 200 (The Endgame).', icon: '🏔️', secret: true, unlocked: false },

  { id: 'boss_1', cat: 'boss', name: 'Boss Slayer', desc: 'Defeat your first latency boss.', icon: '⚔️', unlocked: true },
  { id: 'boss_10', cat: 'boss', name: 'Master Hunter', desc: 'Defeat 10 milestone bosses.', icon: '🗡️', secret: true, unlocked: false },

  { id: 'cur_10k', cat: 'cur', name: 'Millionaire Mindset', desc: 'Accumulate 10,000 Emeralds total.', icon: '💰', unlocked: false },
  { id: 'pre_1', cat: 'pre', name: 'Ascended Typist', desc: 'Ascend to Prestige I.', icon: '⭐', secret: true, unlocked: false },
];

export const AchievementsModal: React.FC = () => {
  const { setModal } = useGameStore();
  const [filter, setFilter] = useState<'all' | 'unlocked' | 'locked'>('all');

  const filtered = ACHIEVEMENTS_LIST.filter((a) => {
    if (filter === 'unlocked') return a.unlocked;
    if (filter === 'locked') return !a.unlocked;
    return true;
  });

  const unlockedCount = ACHIEVEMENTS_LIST.filter((a) => a.unlocked).length;

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="glass-panel max-w-3xl w-full p-6 sm:p-8 rounded-3xl border border-purple-500/30 shadow-[0_0_50px_rgba(179,136,255,0.15)] flex flex-col gap-6 max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-purple-500/10 border border-purple-500/30 text-purple-400">
              <Award className="w-6 h-6" />
            </div>
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-purple-400">
                Hall of Honor
              </div>
              <h3 className="font-display font-extrabold text-2xl text-white">
                Badges &amp; Achievements ({unlockedCount}/{ACHIEVEMENTS_LIST.length})
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

        {/* Filter Pills */}
        <div className="flex gap-2">
          {(['all', 'unlocked', 'locked'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
                filter === f
                  ? 'bg-purple-500/20 text-purple-300 border border-purple-400/40 shadow-neon-purple'
                  : 'glass-panel text-slate-400 hover:text-white'
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        {/* Badges Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {filtered.map((item) => (
            <div
              key={item.id}
              className={`glass-panel p-4 rounded-2xl border flex items-center gap-4 transition-all ${
                item.unlocked
                  ? 'border-purple-500/30 bg-purple-950/10'
                  : 'border-white/5 opacity-60'
              }`}
            >
              <div
                className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl border ${
                  item.unlocked
                    ? 'bg-purple-900/30 border-purple-400/30 shadow-neon-purple'
                    : 'bg-slate-900 border-white/5'
                }`}
              >
                {item.secret && !item.unlocked ? '❓' : item.icon}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h4 className="font-display font-bold text-sm text-white truncate">
                    {item.secret && !item.unlocked ? 'Secret Achievement' : item.name}
                  </h4>
                  {item.unlocked ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  ) : (
                    <Lock className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                  )}
                </div>
                <p className="text-xs text-slate-400 mt-0.5 leading-relaxed line-clamp-2">
                  {item.secret && !item.unlocked ? 'Keep training to unlock this milestone.' : item.desc}
                </p>
              </div>
            </div>
          ))}
        </div>

      </motion.div>
    </div>
  );
};
