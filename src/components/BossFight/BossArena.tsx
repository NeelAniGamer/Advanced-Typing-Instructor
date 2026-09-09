import React from 'react';
import { BossState } from '../../types/game';
import { Skull, ShieldAlert, Zap } from 'lucide-react';
import { motion } from 'framer-motion';

interface BossArenaProps {
  boss: BossState;
}

export const BossArena: React.FC<BossArenaProps> = ({ boss }) => {
  const hpPercent = Math.max(0, Math.min(100, Math.round((boss.currentHp / boss.maxHp) * 100)));

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-panel p-5 rounded-2xl border border-red-500/30 bg-gradient-to-r from-red-950/30 via-slate-900/60 to-red-950/30 shadow-[0_0_30px_rgba(239,68,68,0.15)] flex flex-col gap-3"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-red-950/60 border border-red-500/50 flex items-center justify-center text-2xl shadow-neon-red">
            {boss.portrait}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-widest text-red-400 flex items-center gap-1">
                <Skull className="w-3.5 h-3.5" /> Boss Encounter
              </span>
              <span className="text-[10px] bg-red-500/20 text-red-300 px-1.5 py-0.5 rounded border border-red-500/30 font-mono font-bold">
                Phase {boss.phase}
              </span>
            </div>
            <h3 className="font-display font-extrabold text-lg text-white tracking-wide">
              {boss.name}
            </h3>
          </div>
        </div>

        <div className="text-right">
          <div className="text-xs font-mono font-bold text-red-300">
            {boss.currentHp} / {boss.maxHp} HP
          </div>
          <div className="text-[10px] text-slate-400 font-sans">
            Every correct word strikes the boss!
          </div>
        </div>
      </div>

      {/* Segmented Boss HP Bar */}
      <div className="w-full h-4 bg-slate-950 rounded-full border border-red-900/60 p-0.5 overflow-hidden relative shadow-inner">
        <motion.div
          className="h-full rounded-full bg-gradient-to-r from-red-600 via-amber-500 to-red-500 shadow-[0_0_15px_rgba(239,68,68,0.6)]"
          initial={{ width: '100%' }}
          animate={{ width: `${hpPercent}%` }}
          transition={{ type: 'spring', stiffness: 200, damping: 25 }}
        />
      </div>
    </motion.div>
  );
};
