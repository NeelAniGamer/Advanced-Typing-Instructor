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
  LayoutDashboard,
  Sparkles,
  Lock,
  CheckCircle2,
  XCircle,
  AlertTriangle
} from 'lucide-react';
import { motion } from 'framer-motion';
import { CoachingInsightsCard } from './CoachingInsightsCard';
import { SlidingNumber } from '../ui/sliding-number';
import { isOrganicTheme } from '../../utils/theme';

export const ResultsScreen: React.FC = () => {
  const { 
    lastSession, 
    level, 
    mode, 
    difficulty, 
    category,
    timedDuration,
    uiTheme,
    setLevel, 
    setScreen, 
    setModal,
    fetchNewBatch,
    promotionOffer,
    duelResult,
    isDuel,
    user,
    startInstantDuel,
    luckyChestReward,
    hasOpenedLuckyChest,
    openLuckyChest,
  } = useGameStore();

  const isOrganic = isOrganicTheme(uiTheme);
  const isCampaign = !timedDuration && category !== 'Daily Challenge' && category !== 'Competitions';

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
    passed: true,
    wordsCorrectPercentage: 100,
    requiredPassPercentage: 75,
  };

  const isPassed = safeSession.passed !== false;
  const wordsCorrectPct = safeSession.wordsCorrectPercentage ?? Math.round(safeSession.accuracy || 100);
  const wordsCorrectCount = safeSession.wordsCorrectCount ?? 0;
  const totalWordsCount = safeSession.totalWordsCount ?? 0;
  const requiredPassPct = safeSession.requiredPassPercentage ?? (difficulty === 'Easy' ? 70 : difficulty === 'Hard' ? 80 : 75);

  useEffect(() => {
    // Fire confetti cannons safely ONLY if level passed
    if (!isPassed) return;
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
  }, [isPassed]);

  const getGrade = (wpm: number, acc: number) => {
    if (wpm >= 90 && acc >= 98) return { grade: 'S+', color: 'text-amber-300' };
    if (wpm >= 75 && acc >= 96) return { grade: 'S', color: 'text-amber-400' };
    if (wpm >= 60 && acc >= 94) return { grade: 'A', color: 'text-sky-400' };
    if (wpm >= 45 && acc >= 90) return { grade: 'B', color: 'text-emerald-400' };
    if (wpm >= 30 && acc >= 85) return { grade: 'C', color: 'text-purple-400' };
    return { grade: 'D', color: 'text-slate-400' };
  };

  const safeWpm = Number.isFinite(safeSession.wpm) ? safeSession.wpm : 0;
  const safeAcc = Number.isFinite(safeSession.accuracy) ? safeSession.accuracy : 100;
  const safeRawWpm = Number.isFinite(safeSession.rawWpm) ? safeSession.rawWpm : safeWpm;
  const safeDuration = Number.isFinite(safeSession.durationSeconds) ? safeSession.durationSeconds : 1;
  const safeEmeralds = Number.isFinite(safeSession.emeraldsEarned) ? safeSession.emeraldsEarned : 0;
  const safeLevel = Number.isFinite(safeSession.level) ? safeSession.level : (level || 1);

  const { grade, color: gradeColor } = getGrade(safeWpm, safeAcc);
  const rankStats = calculateRankStats(safeLevel, safeWpm, mode || 'Words', difficulty || 'Normal');
  const safeProgress = Number.isFinite(rankStats?.progress) ? Math.min(100, Math.max(0, rankStats.progress)) : 0;
  const rankName = rankStats?.rank?.name || 'Touch Typist';
  const rankColor = rankStats?.rank?.color || '#00f5ff';
  const nextRank = rankStats?.nextRank || null;

  const handleNextLevel = () => {
    if (!isPassed) return;
    setLevel(safeLevel + 1);
    fetchNewBatch();
    setScreen('game');
  };

  const handleNewSprint = () => {
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
      <div className={`glass-panel p-8 rounded-3xl border text-center relative overflow-hidden ${
        isPassed 
          ? 'border-emerald-500/40 shadow-[0_0_50px_rgba(16,185,129,0.15)]' 
          : 'border-rose-500/40 shadow-[0_0_50px_rgba(244,63,94,0.15)]'
      }`}>
        <div className={`text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2 ${
          isPassed ? 'text-emerald-400' : 'text-rose-400'
        }`}>
          {isPassed ? (
            <>
              <CheckCircle2 className="w-4 h-4" />
              <span>
                {isCampaign
                  ? `Level ${safeLevel} Mastered`
                  : category === 'Daily Challenge'
                  ? 'Daily Challenge Completed'
                  : 'Speed Sprint Completed'}
              </span>
            </>
          ) : (
            <>
              <AlertTriangle className="w-4 h-4" />
              <span>
                {isCampaign
                  ? `Level ${safeLevel} Incomplete — Pass Criterion Not Met`
                  : category === 'Daily Challenge'
                  ? 'Daily Challenge Incomplete'
                  : 'Speed Sprint Incomplete'}
              </span>
            </>
          )}
        </div>
        
        {/* Grade Badge */}
        <div className="my-4">
          <span className={`font-display font-black text-7xl sm:text-8xl tracking-tighter ${
            isPassed ? gradeColor : 'text-rose-400'
          }`}>
            {isPassed ? grade : 'RETRY'}
          </span>
          <div className="text-xs text-slate-400 font-medium mt-1">
            {isPassed ? 'Typing Mastery Rating' : 'Passing Criterion: Percentage of Words Correct'}
          </div>
        </div>

        {/* Passing criteria breakdown pill */}
        <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-mono font-bold mb-4 border ${
          isPassed 
            ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-300' 
            : 'bg-rose-950/40 border-rose-500/30 text-rose-300'
        }`}>
          <span>
            Words Correct: <b>{wordsCorrectPct}%</b> ({wordsCorrectCount}/{totalWordsCount || '—'} words) • Passing Threshold: <b>≥{requiredPassPct}%</b>
          </span>
        </div>

        {/* Currency Earned Banner */}
        <div>
          {isPassed ? (
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-emerald-950/50 border border-emerald-500/40 text-emerald-300 font-mono font-bold text-sm shadow-[0_0_20px_rgba(16,185,129,0.2)]">
              <Gem className="w-4 h-4 text-emerald-400" />
              <span>+<SlidingNumber number={safeEmeralds} fromNumber={0} thousandSeparator="," /> Emeralds Harvested</span>
            </div>
          ) : (
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-slate-900/60 border border-rose-500/20 text-slate-400 font-mono font-bold text-sm">
              <Gem className="w-4 h-4 text-slate-500" />
              <span>0 Emeralds Earned (Requires ≥{requiredPassPct}% words correct)</span>
            </div>
          )}
        </div>
      </div>

      {/* Metric Breakdown Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        
        <div className="glass-panel p-5 rounded-2xl border border-white/10 text-center">
          <Zap className="w-5 h-5 mx-auto text-cyan-400 mb-2" />
          <div className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Net Speed</div>
          <div className="text-3xl font-mono font-extrabold text-white mt-1 flex items-baseline justify-center gap-1">
            <SlidingNumber number={safeWpm} fromNumber={0} /> <span className="text-xs font-normal text-slate-400">WPM</span>
          </div>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-white/10 text-center">
          <Target className="w-5 h-5 mx-auto text-emerald-400 mb-2" />
          <div className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Accuracy</div>
          <div className="text-3xl font-mono font-extrabold text-emerald-400 mt-1 flex items-baseline justify-center">
            <SlidingNumber number={safeAcc} fromNumber={0} />%
          </div>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-white/10 text-center">
          <Clock className="w-5 h-5 mx-auto text-purple-400 mb-2" />
          <div className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Duration</div>
          <div className="text-3xl font-mono font-extrabold text-purple-300 mt-1 flex items-baseline justify-center">
            <SlidingNumber number={safeDuration} fromNumber={0} />s
          </div>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-white/10 text-center">
          <Flame className="w-5 h-5 mx-auto text-amber-400 mb-2" />
          <div className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Raw Speed</div>
          <div className="text-3xl font-mono font-extrabold text-amber-300 mt-1 flex items-baseline justify-center gap-1">
            <SlidingNumber number={safeRawWpm} fromNumber={0} /> <span className="text-xs font-normal text-slate-400">WPM</span>
          </div>
        </div>

      </div>

      {/* ── MATIKS 1v1 DUEL OUTCOME CARD ────────────────────────────── */}
      {duelResult && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className={`p-6 rounded-3xl border relative overflow-hidden flex flex-col sm:flex-row items-center justify-between gap-5 ${
            duelResult.won
              ? 'bg-gradient-to-r from-emerald-950/70 via-slate-900 to-cyan-950/70 border-emerald-500/50 shadow-[0_0_35px_rgba(16,185,129,0.2)]'
              : 'bg-gradient-to-r from-rose-950/70 via-slate-900 to-slate-950 border-rose-500/40 shadow-[0_0_35px_rgba(244,63,94,0.15)]'
          }`}
        >
          <div className="flex items-center gap-4">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-3xl font-black shadow-lg flex-shrink-0 ${
              duelResult.won
                ? 'bg-emerald-400 text-black shadow-neon-green'
                : 'bg-rose-500 text-white'
            }`}>
              {duelResult.won ? '🏆' : '💀'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold uppercase tracking-widest text-slate-400">
                  Matiks Esports 1v1
                </span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-black uppercase border ${
                  duelResult.won 
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' 
                    : 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                }`}>
                  {duelResult.won ? '+24 ELO VICTORY' : '-16 ELO DEFEAT'}
                </span>
              </div>
              <h3 className="font-display font-black text-xl text-white mt-0.5">
                {duelResult.won ? 'Rival Outpaced!' : 'Rival Clinched Victory!'}
              </h3>
              <p className="text-xs text-slate-300 font-mono mt-0.5">
                Rival: <b>{duelResult.opponentName}</b> • New Rating: <b className="text-cyan-300">{duelResult.newElo} Elo</b> ({user.eloDivision || 'Gold'})
              </p>
            </div>
          </div>

          <button
            onClick={() => startInstantDuel()}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-300 hover:to-blue-400 text-black font-display font-black text-xs uppercase tracking-wider shadow-neon-cyan transition-all flex items-center justify-center gap-1.5 flex-shrink-0 active:scale-95"
          >
            <Zap className="w-4 h-4 fill-current" />
            <span>Find Next Rival</span>
          </button>
        </motion.div>
      )}

      {/* ── SUDDEN DEATH GAUNTLET CARD ───────────────────────────────── */}
      {mode === 'SuddenDeath' && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className={`p-6 rounded-3xl border flex flex-col sm:flex-row items-center justify-between gap-4 ${
            isPassed && safeSession.errors === 0
              ? 'bg-gradient-to-r from-rose-950/60 via-slate-900 to-amber-950/60 border-amber-400/50 shadow-[0_0_30px_rgba(251,191,36,0.15)]'
              : 'bg-slate-900/80 border-rose-500/30'
          }`}
        >
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/20 border border-rose-400/40 text-rose-300 flex items-center justify-center text-2xl flex-shrink-0">
              💀
            </div>
            <div>
              <div className="text-xs font-mono font-bold uppercase tracking-wider text-rose-400">
                Sudden Death Focus Gauntlet
              </div>
              <h4 className="text-lg font-display font-black text-white mt-0.5">
                {safeSession.errors === 0 
                  ? 'Flawless Survival! 3x Emerald Harvest Awarded' 
                  : `Eliminated at Word ${wordsCorrectCount}`}
              </h4>
              <p className="text-xs text-slate-400 font-mono mt-0.5">
                {wordsCorrectCount}/{totalWordsCount} words navigated with laser focus.
              </p>
            </div>
          </div>
          <div className="px-3 py-1.5 rounded-xl bg-amber-500/20 border border-amber-400/40 text-amber-300 font-mono font-bold text-xs">
            {safeSession.errors === 0 ? '3.0x Multiplier' : '1.0x Base'}
          </div>
        </motion.div>
      )}

      {/* ── INTERACTIVE LUCKY MYSTERY REWARD CHEST ──────────────────── */}
      {isPassed && (grade === 'S+' || grade === 'S' || wordsCorrectPct >= 96 || mode === 'SuddenDeath') && (
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          className="p-6 rounded-3xl border bg-gradient-to-r from-amber-950/40 via-slate-900 to-purple-950/40 border-amber-400/40 shadow-[0_0_35px_rgba(251,191,36,0.15)] flex flex-col sm:flex-row items-center justify-between gap-5 relative overflow-hidden"
        >
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-400 to-yellow-600 text-black flex items-center justify-center text-3xl shadow-neon-amber flex-shrink-0 animate-bounce">
              🎁
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-mono uppercase tracking-widest font-black text-amber-400">
                  High Mastery Bonus Drop
                </span>
                <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold uppercase bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  Mystery Loot
                </span>
              </div>
              <h4 className="font-display font-black text-lg text-white mt-0.5">
                {hasOpenedLuckyChest && luckyChestReward ? 'Lucky Chest Unboxed!' : 'Lucky Reward Chest Available!'}
              </h4>
              <p className="text-xs text-slate-300 mt-0.5">
                {hasOpenedLuckyChest && luckyChestReward
                  ? `Harvested +${luckyChestReward.emeralds} 💎 Emeralds${luckyChestReward.streakShield ? ' + 1 🛡️ Streak Shield!' : '!'}`
                  : 'Earned for S-tier mastery or flawless sudden death focus. Tap to unlock mystery rewards.'}
              </p>
            </div>
          </div>

          {hasOpenedLuckyChest && luckyChestReward ? (
            <div className="px-4 py-2 rounded-xl bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 font-mono font-bold text-xs flex items-center gap-1.5 flex-shrink-0">
              <CheckCircle2 className="w-4 h-4" />
              <span>+{luckyChestReward.emeralds} 💎 Claimed</span>
            </div>
          ) : (
            <button
              onClick={() => openLuckyChest()}
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-gradient-to-r from-amber-400 to-yellow-500 hover:from-amber-300 hover:to-yellow-400 text-black font-display font-black text-xs uppercase tracking-wider shadow-neon-amber transition-all flex items-center justify-center gap-1.5 flex-shrink-0 active:scale-95"
            >
              <Sparkles className="w-4 h-4" />
              <span>OPEN MYSTERY CHEST</span>
            </button>
          )}
        </motion.div>
      )}

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

      {/* Auto-Promotion Skill Jump Notification Banner */}
      {promotionOffer && promotionOffer.eligible && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-5 rounded-2xl bg-gradient-to-r from-amber-500/20 via-yellow-500/10 to-transparent border border-amber-400/40 shadow-[0_0_30px_rgba(251,191,36,0.2)] flex items-center justify-between flex-wrap gap-4"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-400 text-black flex items-center justify-center font-bold shadow-neon-amber flex-shrink-0">
              <Zap className="w-5 h-5 fill-current" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-display font-black text-amber-300">
                  AI Skill Jump Unlocked: Level {promotionOffer.target_level}!
                </h4>
                <span className="px-2 py-0.2 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/30 text-[10px] font-mono font-bold uppercase">
                  Fast-Track
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                {promotionOffer.reason}
              </p>
            </div>
          </div>

          <button
            onClick={() => setModal('promotion')}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 to-yellow-500 hover:from-amber-300 hover:to-yellow-400 text-black font-display font-extrabold text-xs shadow-neon-amber transition-all flex items-center gap-1.5 flex-shrink-0"
          >
            <span>Review Skill Jump</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </motion.div>
      )}

      {/* AI Coaching Insights Card */}
      <CoachingInsightsCard />

      {/* Action Buttons */}
      <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4">
        <button
          onClick={handleReplay}
          className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-semibold text-sm transition-all ${
            !isPassed
              ? 'bg-gradient-to-r from-amber-500 to-rose-600 hover:from-amber-400 hover:to-rose-500 text-white font-display font-extrabold shadow-neon-amber'
              : 'glass-panel hover:bg-white/10 text-slate-300 hover:text-white border border-white/10'
          }`}
        >
          <RotateCcw className="w-4 h-4" /> {isPassed ? 'Replay Level' : 'Retry Level (Earn Gems)'}
        </button>

        <button
          onClick={() => setModal('typingStyle')}
          className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-400/30 font-semibold text-sm transition-all shadow-[0_0_15px_rgba(0,245,255,0.15)]"
          title="Customize casing style (Title Case, camelCase) and inspect background telemetry"
        >
          <Sparkles className="w-4 h-4 text-cyan-400" /> AI Style
        </button>

        <button
          onClick={() => setScreen('dashboard')}
          className="flex items-center gap-2 px-5 py-3 rounded-2xl glass-panel hover:bg-white/10 text-cyan-300 hover:text-white border border-cyan-500/30 font-semibold text-sm transition-all"
        >
          <LayoutDashboard className="w-4 h-4 text-cyan-400" /> Dashboard
        </button>

        <button
          onClick={() => setScreen('map')}
          className="flex items-center gap-2 px-5 py-3 rounded-2xl glass-panel hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 font-semibold text-sm transition-all"
        >
          <Map className="w-4 h-4" /> Level Map
        </button>

        <button
          onClick={() => setModal('certificate')}
          className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 font-semibold text-sm transition-all shadow-[0_0_15px_rgba(245,158,11,0.2)]"
        >
          <Award className="w-4 h-4 text-amber-400" /> View Diploma
        </button>

        {isPassed ? (
          <button
            onClick={isCampaign ? handleNextLevel : handleNewSprint}
            className="flex items-center gap-2 px-7 py-3 rounded-2xl bg-gradient-to-r from-sky-400 to-blue-600 hover:from-sky-300 hover:to-blue-500 text-black font-display font-extrabold text-sm shadow-md transition-all"
          >
            <span>{isCampaign ? 'Next Level' : 'New Sprint'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        ) : (
          <button
            onClick={handleReplay}
            title={isCampaign ? `Pass Level ${safeLevel} with at least ${requiredPassPct}% words correct to unlock next level.` : 'Retry this sprint session'}
            className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-300 font-display font-semibold text-sm hover:bg-amber-500/30 transition-all"
          >
            <RotateCcw className="w-4 h-4" />
            <span>{isCampaign ? 'Retry Level' : 'Retry Sprint'}</span>
          </button>
        )}
      </div>

    </motion.div>
  );
};
