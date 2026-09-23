import React from 'react';
import { useGameStore, getDivisionForElo } from '../../stores/useGameStore';
import { EloDivision } from '../../types/game';
import { Zap, Skull, Trophy, Swords, Shield, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { isOrganicTheme, isOrganicLight } from '../../utils/theme';
import { NumberTicker } from '../SpectrumUI';

export const MatiksDuelCard: React.FC = () => {
  const { 
    user, 
    isDuel, 
    startInstantDuel, 
    startSuddenDeath,
    uiTheme 
  } = useGameStore();

  const isLight = isOrganicLight(uiTheme);
  const isOrganic = isOrganicTheme(uiTheme);

  const elo = user.eloRating || 1200;
  const division: EloDivision = user.eloDivision || getDivisionForElo(elo);
  const wins = user.duelWins || 0;
  const losses = user.duelLosses || 0;
  const totalMatches = wins + losses;
  const winRate = totalMatches > 0 ? Math.round((wins / totalMatches) * 100) : 0;

  // Division visual style mapping
  const divisionStyles: Record<EloDivision, { color: string; bg: string; border: string; icon: string }> = {
    Bronze: { color: 'text-amber-700', bg: 'bg-amber-900/20', border: 'border-amber-700/40', icon: '🥉' },
    Silver: { color: 'text-slate-300', bg: 'bg-slate-700/20', border: 'border-slate-400/40', icon: '🥈' },
    Gold: { color: 'text-amber-400', bg: 'bg-amber-500/15', border: 'border-amber-400/40', icon: '🥇' },
    Platinum: { color: 'text-cyan-300', bg: 'bg-cyan-500/15', border: 'border-cyan-400/40', icon: '💎' },
    Diamond: { color: 'text-sky-300', bg: 'bg-sky-500/20', border: 'border-sky-400/50', icon: '💠' },
    Master: { color: 'text-purple-300', bg: 'bg-purple-500/20', border: 'border-purple-400/50', icon: '👑' },
    Apex: { color: 'text-rose-400', bg: 'bg-rose-500/20', border: 'border-rose-400/50', icon: '🔥' },
  };

  const divStyle = divisionStyles[division] || divisionStyles.Gold;

  return (
    <div className={`p-5 sm:p-6 rounded-2xl border transition-all flex flex-col justify-between gap-5 relative overflow-hidden ${
      isLight 
        ? 'bg-white border-[#E5DFD7] shadow-sm' 
        : 'bg-[#0f141c] border-cyan-500/20 shadow-[0_0_25px_rgba(0,245,255,0.06)]'
    }`}>
      {/* Background ambient accent */}
      <div className="absolute -right-10 -bottom-10 w-40 h-40 rounded-full bg-cyan-500/5 blur-2xl pointer-events-none" />

      {/* Top Header: Matiks Esports & Division */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-gradient-to-br from-cyan-500/20 to-purple-500/20 border border-cyan-400/40 text-cyan-300">
            <Swords className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className={`text-[10px] font-mono uppercase tracking-widest font-black ${
                isLight ? 'text-[#758079]' : 'text-slate-400'
              }`}>
                Matiks Competitive Esports
              </span>
              <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold uppercase bg-rose-500/20 text-rose-300 border border-rose-500/30">
                1v1 Live
              </span>
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              <h3 className={`font-display font-black text-lg ${isLight ? 'text-[#1C221F]' : 'text-white'}`}>
                Competitive Ladder
              </h3>
            </div>
          </div>
        </div>

        {/* Division Badge */}
        <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border ${divStyle.bg} ${divStyle.border}`}>
          <span className="text-sm">{divStyle.icon}</span>
          <span className={`text-xs font-mono font-black ${divStyle.color}`}>{division}</span>
          <span className={`text-xs font-mono font-bold ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>•</span>
          <span className="text-xs font-mono font-black text-white">
            <NumberTicker value={elo} /> <span className="text-[10px] font-normal text-slate-400">Elo</span>
          </span>
        </div>
      </div>

      {/* Stats Breakdown Bar */}
      <div className={`grid grid-cols-3 gap-2 p-3 rounded-xl border text-center ${
        isLight ? 'bg-[#F7F5F0] border-[#E8E4DC]' : 'bg-[#151b24] border-white/5'
      }`}>
        <div>
          <div className="text-[10px] font-mono uppercase text-slate-400">Record</div>
          <div className="text-sm font-mono font-black text-white mt-0.5">
            <span className="text-emerald-400">{wins}W</span>
            <span className="text-slate-500 mx-1">-</span>
            <span className="text-rose-400">{losses}L</span>
          </div>
        </div>
        <div>
          <div className="text-[10px] font-mono uppercase text-slate-400">Win Rate</div>
          <div className="text-sm font-mono font-black text-cyan-300 mt-0.5">
            {winRate}%
          </div>
        </div>
        <div>
          <div className="text-[10px] font-mono uppercase text-slate-400">Shields</div>
          <div className="text-sm font-mono font-black text-amber-400 mt-0.5 flex items-center justify-center gap-1">
            <Shield className="w-3.5 h-3.5 fill-current" />
            <span>{user.streakShields || 0}/2</span>
          </div>
        </div>
      </div>

      {/* CTA Buttons: Quick Duel & Sudden Death */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        <button
          onClick={() => startInstantDuel()}
          className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black font-display font-black text-xs uppercase tracking-wider transition-all shadow-[0_0_20px_rgba(0,245,255,0.25)] hover:scale-[1.02] active:scale-[0.98]"
        >
          <Zap className="w-4 h-4 fill-current" />
          <span>Quick 1v1 Duel</span>
          <ChevronRight className="w-3.5 h-3.5 ml-auto" />
        </button>

        <button
          onClick={() => startSuddenDeath()}
          className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r from-rose-950/80 to-slate-900 border border-rose-500/40 hover:border-rose-400 text-rose-300 hover:text-white font-display font-black text-xs uppercase tracking-wider transition-all shadow-sm hover:scale-[1.02] active:scale-[0.98]"
          title="1 Typo = Instant Elimination! 3x Emerald Multiplier"
        >
          <Skull className="w-4 h-4 text-rose-400" />
          <span>Sudden Death</span>
          <span className="text-[9px] px-1.5 py-0.2 rounded bg-rose-500/30 text-rose-200 ml-auto font-mono">3x 💎</span>
        </button>
      </div>
    </div>
  );
};
