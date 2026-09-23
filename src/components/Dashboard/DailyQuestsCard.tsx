import React from 'react';
import { useGameStore } from '../../stores/useGameStore';
import { CheckCircle2, Gift, Flame, Shield, Sparkles, Check } from 'lucide-react';
import { motion } from 'framer-motion';
import { isOrganicTheme, isOrganicLight } from '../../utils/theme';

export const DailyQuestsCard: React.FC = () => {
  const { 
    dailyQuests, 
    dailyMasterCrateClaimed, 
    claimDailyQuest, 
    claimDailyMasterCrate,
    user,
    buyStreakShield,
    emeralds,
    uiTheme 
  } = useGameStore();

  const isLight = isOrganicLight(uiTheme);
  const isOrganic = isOrganicTheme(uiTheme);

  const completedCount = (dailyQuests || []).filter(q => q.completed).length;
  const isMasterReady = completedCount === 3 && !dailyMasterCrateClaimed;

  return (
    <div className={`p-5 sm:p-6 rounded-2xl border transition-all flex flex-col justify-between gap-4 relative overflow-hidden ${
      isLight 
        ? 'bg-white border-[#E5DFD7] shadow-sm' 
        : 'bg-[#0f141c] border-amber-500/20 shadow-[0_0_25px_rgba(251,191,36,0.06)]'
    }`}>
      {/* Ambient background glow */}
      <div className="absolute -left-10 -bottom-10 w-40 h-40 rounded-full bg-amber-500/5 blur-2xl pointer-events-none" />

      {/* Top Header: Quests & Master Crate Progress */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 border border-amber-400/40 text-amber-300">
            <Flame className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className={`text-[10px] font-mono uppercase tracking-widest font-black ${
                isLight ? 'text-[#758079]' : 'text-slate-400'
              }`}>
                Daily Quests Board
              </span>
              <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold uppercase bg-amber-500/20 text-amber-300 border border-amber-500/30">
                Resets Midnight
              </span>
            </div>
            <h3 className={`font-display font-black text-lg ${isLight ? 'text-[#1C221F]' : 'text-white'}`}>
              Daily Training Goals
            </h3>
          </div>
        </div>

        {/* Master Crate Status Pill */}
        <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-mono font-bold ${
          dailyMasterCrateClaimed
            ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
            : isMasterReady
            ? 'bg-amber-500/25 border-amber-400/50 text-amber-300 animate-pulse'
            : isLight
            ? 'bg-[#F7F5F0] border-[#E8E4DC] text-slate-600'
            : 'bg-[#151b24] border-white/10 text-slate-300'
        }`}>
          <Gift className="w-3.5 h-3.5" />
          <span>Master Crate: {completedCount}/3</span>
        </div>
      </div>

      {/* 3 Rotating Daily Quests List */}
      <div className="flex flex-col gap-2.5">
        {(dailyQuests || []).map((quest) => {
          const pct = Math.min(100, Math.round((quest.current / quest.target) * 100));
          return (
            <div 
              key={quest.id}
              className={`p-3 rounded-xl border transition-all flex items-center justify-between gap-3 ${
                isLight ? 'bg-[#FAF8F5] border-[#E8E4DC]' : 'bg-[#151b24] border-white/5'
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                <span className="text-lg select-none">{quest.icon}</span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className={`font-bold text-xs truncate ${isLight ? 'text-[#1C221F]' : 'text-white'}`}>
                      {quest.title}
                    </span>
                    <span className="text-[10px] font-mono text-emerald-400 font-black">
                      +{quest.rewardEmeralds} 💎
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400 truncate mt-0.5">
                    {quest.desc}
                  </div>
                  {/* Micro Progress Bar */}
                  <div className="w-full h-1.5 bg-slate-900/60 rounded-full mt-1.5 overflow-hidden border border-white/5">
                    <div 
                      className={`h-full rounded-full transition-all duration-300 ${
                        quest.completed ? 'bg-emerald-400' : 'bg-amber-400'
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Progress Count or Claim Button */}
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className="text-[10px] font-mono text-slate-400">
                  {quest.current}/{quest.target}
                </span>
                {quest.claimed ? (
                  <span className="px-2 py-1 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-[10px] font-mono font-bold flex items-center gap-1">
                    <Check className="w-3 h-3" /> Claimed
                  </span>
                ) : quest.completed ? (
                  <button
                    onClick={() => claimDailyQuest(quest.id)}
                    className="px-2.5 py-1 rounded-lg bg-emerald-400 hover:bg-emerald-300 text-black text-[10px] font-mono font-black uppercase transition-all shadow-sm active:scale-95"
                  >
                    Claim 💎
                  </button>
                ) : (
                  <span className="px-2 py-1 rounded-lg bg-white/5 border border-white/10 text-slate-500 text-[10px] font-mono">
                    In Progress
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Master Crate / Streak Shield Loss Aversion Banner */}
      <div className={`p-3 rounded-xl border flex flex-col sm:flex-row items-center justify-between gap-3 ${
        isMasterReady
          ? 'bg-gradient-to-r from-amber-500/20 via-yellow-500/15 to-transparent border-amber-400/50'
          : dailyMasterCrateClaimed
          ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-300'
          : isLight
          ? 'bg-[#F7F5F0] border-[#E8E4DC]'
          : 'bg-[#151b24] border-white/5'
      }`}>
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-400/30 flex-shrink-0">
            <Shield className="w-4 h-4 fill-current" />
          </div>
          <div>
            <div className="text-xs font-bold text-white flex items-center gap-1.5">
              <span>Streak Protection Shield:</span>
              <span className="text-amber-400 font-mono font-black">{user.streakShields || 0}/2 Active</span>
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">
              Auto-consumed if a calendar day is missed to preserve your momentum.
            </div>
          </div>
        </div>

        {isMasterReady ? (
          <button
            onClick={() => claimDailyMasterCrate()}
            className="w-full sm:w-auto px-4 py-2 rounded-xl bg-gradient-to-r from-amber-400 to-yellow-500 hover:from-amber-300 hover:to-yellow-400 text-black font-display font-black text-xs uppercase tracking-wider shadow-neon-amber transition-all flex items-center justify-center gap-1.5 flex-shrink-0 active:scale-95"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Claim Master Crate (+300💎 + 🛡️)</span>
          </button>
        ) : dailyMasterCrateClaimed ? (
          <span className="text-[11px] font-mono text-emerald-400 font-bold flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" /> Today's Crate Claimed
          </span>
        ) : (user.streakShields || 0) < 2 ? (
          <button
            onClick={() => buyStreakShield()}
            disabled={emeralds < 350}
            className={`w-full sm:w-auto px-3 py-1.5 rounded-xl border text-[11px] font-mono font-bold transition-all flex items-center justify-center gap-1.5 flex-shrink-0 ${
              emeralds >= 350
                ? 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border-amber-400/40'
                : 'bg-white/5 text-slate-500 border-white/5 cursor-not-allowed'
            }`}
            title="Purchase extra Streak Shield for 350 💎 (Max 2)"
          >
            <span>+1 Shield (350 💎)</span>
          </button>
        ) : null}
      </div>
    </div>
  );
};
