import React from 'react';
import { useGameStore } from '../../stores/useGameStore';
import { calculateRankStats } from '../../utils/ranks';
import { soundEngine } from '../../services/soundEngine';
import { SwitchProfile } from '../../types/game';
import { 
  Play, 
  Zap, 
  Target, 
  Flame, 
  Map, 
  Award, 
  Trophy, 
  Users, 
  Code2, 
  FileText, 
  Gem, 
  ArrowRight, 
  Clock, 
  Sparkles, 
  ShieldCheck, 
  RotateCcw, 
  Volume2, 
  Calendar, 
  Keyboard, 
  Compass, 
  CheckCircle2, 
  ChevronRight,
  TrendingUp,
  Download,
  RefreshCw
} from 'lucide-react';
import { motion } from 'framer-motion';

export const DashboardScreen: React.FC = () => {
  const { 
    user, 
    level, 
    mode, 
    difficulty, 
    wpm, 
    emeralds, 
    currentStreak, 
    unlockedLevels,
    lastSession,
    switchProfile,
    isMuted,
    setScreen, 
    setModal,
    setLevel,
    setCategory,
    setMode,
    setSwitchProfile,
    fetchNewBatch,
    updateAvailable,
    updateInfo,
    checkForUpdates
  } = useGameStore();

  const rankStats = calculateRankStats(level, user.best_wpm || wpm, mode, difficulty);

  // Switch sound definitions
  const switchProfiles: { id: SwitchProfile; name: string; tag: string; icon: string }[] = [
    { id: 'cherry-blue', name: 'Cherry Blue', tag: 'Clicky', icon: '🍒' },
    { id: 'cherry-red', name: 'Cherry Red', tag: 'Linear', icon: '🔴' },
    { id: 'topre', name: 'Topre', tag: 'Thock', icon: '🔵' },
    { id: 'hall-effect', name: 'Hall Effect', tag: 'Magnetic', icon: '⚡' },
    { id: 'holy-panda', name: 'Holy Panda', tag: 'Tactile', icon: '🐼' },
    { id: 'model-m', name: 'IBM Model M', tag: 'Buckling', icon: '⌨️' },
  ];

  // Milestone boss calculation
  const nextBossLevel = level <= 40 ? 40 : level <= 80 ? 80 : level <= 120 ? 120 : level <= 160 ? 160 : 200;
  const levelsUntilBoss = Math.max(0, nextBossLevel - level);

  const handleLaunchCampaign = () => {
    fetchNewBatch();
    setScreen('game');
  };

  const handleLaunchCoding = () => {
    setCategory('Coding');
    setMode('Code');
    fetchNewBatch();
    setScreen('game');
  };

  const handleSoundTest = (profileId: SwitchProfile) => {
    setSwitchProfile(profileId);
    soundEngine.playKey(false);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8 flex flex-col gap-8 pb-20"
    >
      {/* ── UPDATE AVAILABLE ALERT BANNER ─────────────────────────── */}
      {updateAvailable && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-cyan-950/70 via-slate-900/90 to-emerald-950/70 border border-cyan-400/40 p-4 shadow-[0_0_30px_rgba(0,245,255,0.15)] flex flex-col sm:flex-row items-center justify-between gap-4"
        >
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-cyan-500/20 border border-cyan-400 text-cyan-300 animate-pulse">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <div className="text-sm font-bold text-white flex items-center gap-2">
                New OTA Update Ready: <span className="text-cyan-300 font-mono font-black">v{updateInfo?.version || '2.5.0'}</span>
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">Verified</span>
              </div>
              <p className="text-xs text-gray-400 font-mono mt-0.5">
                {updateInfo?.changelog ? updateInfo.changelog.slice(0, 95) + '...' : 'Fresh binary updates available for auto-download.'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={() => setModal('update')}
              className="w-full sm:w-auto px-5 py-2 text-xs font-mono font-bold bg-gradient-to-r from-cyan-500 to-emerald-400 text-black rounded-xl hover:shadow-[0_0_20px_rgba(0,245,255,0.4)] transition-all flex items-center justify-center gap-1.5 font-black"
            >
              <Download className="w-3.5 h-3.5" />
              VIEW & INSTALL UPDATE
            </button>
          </div>
        </motion.div>
      )}

      {/* ── TOP HERO BANNER: COMMAND CENTER ─────────────────────────── */}
      <div className="relative overflow-hidden glass-panel rounded-3xl border border-cyan-500/30 p-6 sm:p-8 shadow-[0_0_60px_rgba(0,245,255,0.08)]">
        {/* Ambient Neon Gradients */}
        <div className="absolute -right-20 -top-20 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -left-20 -bottom-20 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 sm:gap-8">
          
          {/* User Profile & Rank Callout */}
          <div className="flex items-center gap-4 sm:gap-5">
            <div 
              onClick={() => setModal('account')}
              className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-cyan-500/20 via-purple-500/20 to-blue-500/20 border-2 border-cyan-400/50 flex items-center justify-center text-3xl sm:text-4xl shadow-neon-cyan cursor-pointer hover:scale-105 hover:border-cyan-300 transition-all select-none flex-shrink-0"
              title="Click to customize profile avatar & Google Auth"
            >
              {user.avatar}
            </div>

            <div className="flex flex-col gap-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[11px] font-mono font-bold uppercase tracking-widest text-cyan-400 flex items-center gap-1.5">
                  <Compass className="w-3.5 h-3.5" /> Command Center Operative
                </span>
                {user.email && (
                  <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-400/30 font-bold flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3 text-emerald-400" /> Google Verified
                  </span>
                )}
              </div>

              <h1 className="font-display font-black text-2xl sm:text-3xl lg:text-4xl text-white tracking-tight">
                Welcome, <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400">{user.name}</span>
              </h1>

              <div className="flex flex-wrap items-center gap-2 mt-1">
                <span 
                  className="text-xs font-bold px-2.5 py-1 rounded-full border shadow-sm flex items-center gap-1.5"
                  style={{ 
                    color: rankStats.rank.color,
                    borderColor: `${rankStats.rank.color}50`,
                    backgroundColor: `${rankStats.rank.color}15`
                  }}
                >
                  <Award className="w-3.5 h-3.5" />
                  {rankStats.rank.name}
                </span>

                <span className="text-xs font-mono font-semibold px-2.5 py-1 rounded-full bg-slate-900/80 text-slate-300 border border-white/10">
                  Sector Stage {level} of 200
                </span>

                {levelsUntilBoss > 0 ? (
                  <span className="text-xs font-mono text-purple-300 px-2 py-1 rounded-full bg-purple-950/40 border border-purple-500/30">
                    Boss Milestone in {levelsUntilBoss} {levelsUntilBoss === 1 ? 'stage' : 'stages'} 🛡️
                  </span>
                ) : (
                  <span className="text-xs font-mono text-red-400 px-2 py-1 rounded-full bg-red-950/50 border border-red-500/40 font-bold animate-pulse">
                    Boss Gate Active! 🗿
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Primary Quick-Launch Actions */}
          <div className="flex flex-wrap sm:flex-nowrap items-center gap-3 w-full lg:w-auto">
            <button
              onClick={handleLaunchCampaign}
              className="flex-1 sm:flex-none flex items-center justify-center gap-3 px-7 py-3.5 rounded-2xl bg-gradient-to-r from-cyan-500 via-blue-500 to-indigo-600 hover:from-cyan-400 hover:via-blue-400 hover:to-indigo-500 text-black font-display font-black text-sm sm:text-base shadow-neon-cyan hover:scale-[1.02] active:scale-[0.98] transition-all"
            >
              <Play className="w-5 h-5 fill-current" />
              <span>Resume Stage {level}</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={() => setScreen('map')}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-3.5 rounded-2xl glass-panel hover:bg-white/10 text-slate-200 hover:text-white border border-white/10 font-semibold text-sm transition-all"
            >
              <Map className="w-4 h-4 text-cyan-400" />
              <span>Explore Map</span>
            </button>

            <button
              onClick={() => checkForUpdates(false)}
              className="p-3.5 rounded-2xl glass-panel hover:bg-white/10 text-slate-400 hover:text-cyan-300 border border-white/10 font-semibold text-sm transition-all flex items-center justify-center"
              title="Check for Latest Over-The-Air Updates"
            >
              <RefreshCw className="w-4 h-4 text-cyan-400" />
            </button>
          </div>

        </div>
      </div>

      {/* ── CORE TELEMETRY & KPI CARDS ──────────────────────────────── */}
      <div>
        <div className="flex items-center justify-between mb-3 px-1">
          <h2 className="text-xs font-mono uppercase tracking-widest text-slate-400 font-bold flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-cyan-400" /> Tactical Performance Telemetry
          </h2>
          <span className="text-xs text-slate-500 font-mono">Live Sync</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
          
          {/* Peak WPM */}
          <div className="glass-panel p-4 rounded-2xl border border-cyan-500/20 flex flex-col justify-between relative overflow-hidden group hover:border-cyan-400/50 transition-all">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Top Velocity</span>
              <Zap className="w-4 h-4 text-cyan-400" />
            </div>
            <div className="text-2xl sm:text-3xl font-mono font-extrabold text-white">
              {user.best_wpm || 0} <span className="text-xs font-normal text-slate-400">WPM</span>
            </div>
            <div className="text-[11px] text-cyan-300/80 font-mono mt-2 flex items-center gap-1">
              <span>Benchmark Target:</span> <b>{Math.round(25 + level * 0.45)}</b>
            </div>
          </div>

          {/* Tactile Precision */}
          <div className="glass-panel p-4 rounded-2xl border border-emerald-500/20 flex flex-col justify-between relative overflow-hidden group hover:border-emerald-400/50 transition-all">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Precision</span>
              <Target className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl sm:text-3xl font-mono font-extrabold text-emerald-400">
              {user.avg_acc || 100}%
            </div>
            <div className="text-[11px] text-emerald-300/80 font-mono mt-2">
              {(user.avg_acc || 100) >= 96 ? '★ S-Tier Accuracy' : '● Solid Accuracy'}
            </div>
          </div>

          {/* Daily Streak */}
          <div 
            onClick={() => setModal('streak')}
            className="glass-panel p-4 rounded-2xl border border-amber-500/20 flex flex-col justify-between relative overflow-hidden group hover:border-amber-400/50 cursor-pointer transition-all shadow-sm"
            title="Click to open 7-day reward calendar"
          >
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Streak</span>
              <Flame className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-2xl sm:text-3xl font-mono font-extrabold text-amber-400">
              {currentStreak} <span className="text-xs font-normal text-slate-400">Days</span>
            </div>
            <div className="text-[11px] text-amber-300 font-medium mt-2 flex items-center gap-1">
              <span>Claim Gift</span> <ChevronRight className="w-3 h-3" />
            </div>
          </div>

          {/* Emeralds Vault */}
          <div 
            onClick={() => setScreen('shop')}
            className="glass-panel p-4 rounded-2xl border border-emerald-500/20 flex flex-col justify-between relative overflow-hidden group hover:border-emerald-400/50 cursor-pointer transition-all"
            title="Click to visit Shop & Keycap Forge"
          >
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Emeralds</span>
              <Gem className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl sm:text-3xl font-mono font-extrabold text-emerald-300 truncate">
              {emeralds.toLocaleString()}
            </div>
            <div className="text-[11px] text-emerald-400 font-medium mt-2 flex items-center gap-1">
              <span>Visit Shop</span> <ChevronRight className="w-3 h-3" />
            </div>
          </div>

          {/* Stages Cleared */}
          <div 
            onClick={() => setScreen('map')}
            className="glass-panel p-4 rounded-2xl border border-purple-500/20 flex flex-col justify-between relative overflow-hidden group hover:border-purple-400/50 cursor-pointer transition-all"
            title="Click to view full 200 level path"
          >
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Cleared</span>
              <CheckCircle2 className="w-4 h-4 text-purple-400" />
            </div>
            <div className="text-2xl sm:text-3xl font-mono font-extrabold text-purple-300">
              {unlockedLevels - 1} <span className="text-xs font-normal text-slate-400">/ 200</span>
            </div>
            <div className="text-[11px] text-purple-400 font-medium mt-2 flex items-center gap-1">
              <span>View Map</span> <ChevronRight className="w-3 h-3" />
            </div>
          </div>

          {/* Active Switch Sound */}
          <div className="glass-panel p-4 rounded-2xl border border-white/10 flex flex-col justify-between relative overflow-hidden">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Switch</span>
              <Volume2 className="w-4 h-4 text-cyan-400" />
            </div>
            <div className="text-sm font-bold text-white truncate">
              {switchProfiles.find(s => s.id === switchProfile)?.name || 'Cherry Blue'}
            </div>
            <div className="text-[11px] text-slate-400 font-mono mt-2">
              {isMuted ? '🔇 Audio Muted' : '🔊 Acoustic ON'}
            </div>
          </div>

        </div>
      </div>

      {/* ── TRAINING & ADVENTURE GATEWAYS ───────────────────────────── */}
      <div>
        <div className="flex items-center justify-between mb-3 px-1">
          <h2 className="text-xs font-mono uppercase tracking-widest text-slate-400 font-bold flex items-center gap-2">
            <Keyboard className="w-4 h-4 text-cyan-400" /> Training Modes & Arenas
          </h2>
          <span className="text-xs text-slate-500 font-mono">Select Module</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          
          {/* Card 1: Adventure Campaign (200 Stages) */}
          <div 
            onClick={() => setScreen('map')}
            className="glass-panel p-6 rounded-3xl border border-cyan-500/20 hover:border-cyan-400/50 transition-all cursor-pointer group flex flex-col justify-between gap-4 relative overflow-hidden shadow-sm hover:shadow-[0_0_30px_rgba(0,245,255,0.12)]"
          >
            <div className="flex items-start justify-between">
              <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-400/30 flex items-center justify-center text-cyan-400 group-hover:scale-110 transition-transform">
                <Map className="w-6 h-6" />
              </div>
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-400/30">
                200 Stages
              </span>
            </div>

            <div>
              <h3 className="text-lg font-display font-black text-white group-hover:text-cyan-300 transition-colors">
                Campaign Adventure
              </h3>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Journey through 8 keycap eras from Rubber Dome Trainee to Hall Effect Endgame with milestone boss gates.
              </p>
            </div>

            <div className="flex items-center justify-between text-xs font-bold text-cyan-400 pt-2 border-t border-white/5">
              <span>View Level Path</span>
              <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* Card 2: Typing Arena (Live Simulation) */}
          <div 
            onClick={() => { fetchNewBatch(); setScreen('game'); }}
            className="glass-panel p-6 rounded-3xl border border-blue-500/20 hover:border-blue-400/50 transition-all cursor-pointer group flex flex-col justify-between gap-4 relative overflow-hidden shadow-sm hover:shadow-[0_0_30px_rgba(59,130,246,0.12)]"
          >
            <div className="flex items-start justify-between">
              <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-400/30 flex items-center justify-center text-blue-400 group-hover:scale-110 transition-transform">
                <Zap className="w-6 h-6" />
              </div>
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-300 border border-blue-400/30">
                Ghost Rival Pace
              </span>
            </div>

            <div>
              <h3 className="text-lg font-display font-black text-white group-hover:text-blue-300 transition-colors">
                Typing Arena
              </h3>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Speedometer telemetry, smooth spring caret, dual-lane shadow ghost racer, and mechanical acoustics.
              </p>
            </div>

            <div className="flex items-center justify-between text-xs font-bold text-blue-400 pt-2 border-t border-white/5">
              <span>Enter Arena</span>
              <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* Card 3: Cyber Multiplayer */}
          <div 
            onClick={() => setScreen('multiplayer')}
            className="glass-panel p-6 rounded-3xl border border-indigo-500/20 hover:border-indigo-400/50 transition-all cursor-pointer group flex flex-col justify-between gap-4 relative overflow-hidden shadow-sm hover:shadow-[0_0_30px_rgba(99,102,241,0.12)]"
          >
            <div className="flex items-start justify-between">
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-400/30 flex items-center justify-center text-indigo-400 group-hover:scale-110 transition-transform">
                <Users className="w-6 h-6" />
              </div>
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-400/30">
                Real-Time PVP
              </span>
            </div>

            <div>
              <h3 className="text-lg font-display font-black text-white group-hover:text-indigo-300 transition-colors">
                Cyber Multiplayer
              </h3>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Create or join live multiplayer rooms, race with friends, broadcast telemetry, and claim podium emeralds.
              </p>
            </div>

            <div className="flex items-center justify-between text-xs font-bold text-indigo-400 pt-2 border-t border-white/5">
              <span>Open Race Lobby</span>
              <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* Card 4: Coding Syntax Forge */}
          <div 
            onClick={handleLaunchCoding}
            className="glass-panel p-6 rounded-3xl border border-purple-500/20 hover:border-purple-400/50 transition-all cursor-pointer group flex flex-col justify-between gap-4 relative overflow-hidden shadow-sm hover:shadow-[0_0_30px_rgba(168,85,247,0.12)]"
          >
            <div className="flex items-start justify-between">
              <div className="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-400/30 flex items-center justify-center text-purple-400 group-hover:scale-110 transition-transform">
                <Code2 className="w-6 h-6" />
              </div>
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-purple-500/10 text-purple-300 border border-purple-400/30">
                Dev Muscle Memory
              </span>
            </div>

            <div>
              <h3 className="text-lg font-display font-black text-white group-hover:text-purple-300 transition-colors">
                Coding Syntax Forge
              </h3>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Build instinctual speed on programming characters: brackets, arrow functions, curly braces, and algorithmic syntax.
              </p>
            </div>

            <div className="flex items-center justify-between text-xs font-bold text-purple-400 pt-2 border-t border-white/5">
              <span>Launch Code Practice</span>
              <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* Card 5: Touch Typing Diploma */}
          <div 
            onClick={() => setModal('certificate')}
            className="glass-panel p-6 rounded-3xl border border-amber-500/20 hover:border-amber-400/50 transition-all cursor-pointer group flex flex-col justify-between gap-4 relative overflow-hidden shadow-sm hover:shadow-[0_0_30px_rgba(245,158,11,0.12)]"
          >
            <div className="flex items-start justify-between">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-400/30 flex items-center justify-center text-amber-400 group-hover:scale-110 transition-transform">
                <Award className="w-6 h-6" />
              </div>
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-300 border border-amber-400/30">
                Official PDF Export
              </span>
            </div>

            <div>
              <h3 className="text-lg font-display font-black text-white group-hover:text-amber-300 transition-colors">
                Mastery Diploma
              </h3>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                View your formal touch typing certificate with serial verification, seal, and one-click PDF print formatting.
              </p>
            </div>

            <div className="flex items-center justify-between text-xs font-bold text-amber-400 pt-2 border-t border-white/5">
              <span>View Certificate</span>
              <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* Card 6: Custom Practice Forge */}
          <div 
            onClick={() => setModal('customPractice')}
            className="glass-panel p-6 rounded-3xl border border-emerald-500/20 hover:border-emerald-400/50 transition-all cursor-pointer group flex flex-col justify-between gap-4 relative overflow-hidden shadow-sm hover:shadow-[0_0_30px_rgba(16,185,129,0.12)]"
          >
            <div className="flex items-start justify-between">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-400/30 flex items-center justify-center text-emerald-400 group-hover:scale-110 transition-transform">
                <FileText className="w-6 h-6" />
              </div>
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-400/30">
                Paste Any Text
              </span>
            </div>

            <div>
              <h3 className="text-lg font-display font-black text-white group-hover:text-emerald-300 transition-colors">
                Custom Practice
              </h3>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Paste essays, articles, documentation, or choose from 5 built-in presets (Async JS, Binary Search, Neuromancer).
              </p>
            </div>

            <div className="flex items-center justify-between text-xs font-bold text-emerald-400 pt-2 border-t border-white/5">
              <span>Configure Custom Text</span>
              <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

        </div>
      </div>

      {/* ── MECHANICAL SWITCH SOUNDBOARD LAB ────────────────────────── */}
      <div className="glass-panel p-6 rounded-3xl border border-white/10 flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-display font-black text-white flex items-center gap-2">
              <Volume2 className="w-4 h-4 text-cyan-400" /> Acoustic Synthesizer Laboratory
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Select or test-click your active mechanical key switch audio soundboard profile:
            </p>
          </div>
          <span className="text-[11px] font-mono text-cyan-400">
            Current: <b>{switchProfiles.find(s => s.id === switchProfile)?.name}</b>
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
          {switchProfiles.map((sw) => {
            const isSelected = switchProfile === sw.id;
            return (
              <button
                key={sw.id}
                onClick={() => handleSoundTest(sw.id)}
                className={`p-3 rounded-2xl border text-left transition-all flex flex-col justify-between gap-2 group ${
                  isSelected 
                    ? 'bg-cyan-500/20 text-cyan-300 border-cyan-400/50 shadow-neon-cyan' 
                    : 'glass-panel hover:bg-white/10 text-slate-300 hover:text-white border-white/10'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-lg">{sw.icon}</span>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-black/40 text-slate-400">
                    {sw.tag}
                  </span>
                </div>
                <div>
                  <div className="text-xs font-bold truncate">{sw.name}</div>
                  <div className="text-[10px] text-slate-400 font-mono mt-0.5">Click to test 🔊</div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── LAST SESSION BREAKDOWN (if exists) ─────────────────────── */}
      {lastSession && (
        <div className="glass-panel p-6 rounded-3xl border border-cyan-500/20 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-cyan-500/10 border border-cyan-400/30 flex items-center justify-center font-display font-black text-2xl text-cyan-400 shadow-neon-cyan flex-shrink-0">
              {lastSession.wpm >= 75 ? 'S' : lastSession.wpm >= 60 ? 'A' : lastSession.wpm >= 45 ? 'B' : 'C'}
            </div>
            <div>
              <div className="text-[11px] font-mono text-cyan-400 uppercase tracking-widest font-semibold">
                Latest Completed Session • Stage {lastSession.level}
              </div>
              <div className="text-sm font-bold text-white mt-0.5">
                {lastSession.wpm} WPM Net Speed • {lastSession.accuracy}% Accuracy • {lastSession.durationSeconds}s Duration
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              onClick={() => { fetchNewBatch(); setScreen('game'); }}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl glass-panel hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 text-xs font-semibold transition-all"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Replay
            </button>

            <button
              onClick={() => { setLevel(lastSession.level + 1); fetchNewBatch(); setScreen('game'); }}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black font-display font-bold text-xs shadow-neon-cyan transition-all"
            >
              <span>Next Stage {lastSession.level + 1}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

    </motion.div>
  );
};
