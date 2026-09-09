import React, { useState } from 'react';
import { useGameStore } from '../../stores/useGameStore';
import { calculateRankStats } from '../../utils/ranks';
import { soundEngine } from '../../services/soundEngine';
import { 
  Flame, 
  Volume2, 
  VolumeX, 
  Map, 
  ShoppingBag, 
  Calendar, 
  Trophy, 
  Award, 
  Grid3X3, 
  Terminal,
  Gem,
  Sliders,
  Users,
  Zap,
  ShieldCheck,
  FileText,
  Volume1,
  Play,
  LayoutDashboard
} from 'lucide-react';
import { SwitchProfile } from '../../types/game';

export const GameHUD: React.FC = () => {
  const { 
    user, 
    level, 
    mode, 
    difficulty, 
    wpm, 
    emeralds, 
    prestige, 
    currentStreak,
    isMuted,
    switchProfile,
    masterVolume,
    toggleMute,
    setMasterVolume,
    setSwitchProfile,
    setScreen,
    setModal,
    activeScreen,
    activeModal,
    updateAvailable
  } = useGameStore();

  const [showAudioPopover, setShowAudioPopover] = useState(false);

  const rankStats = calculateRankStats(level, wpm, mode, difficulty);

  const switchProfiles: { id: SwitchProfile; name: string; desc: string }[] = [
    { id: 'cherry-blue', name: 'Cherry Blue', desc: 'Clicky, high actuation pitch' },
    { id: 'cherry-red', name: 'Cherry Red', desc: 'Linear smooth, quiet glide' },
    { id: 'topre', name: 'Topre', desc: 'Electro-capacitive deep thock' },
    { id: 'hall-effect', name: 'Hall Effect', desc: 'Magnetic contactless pulse' },
    { id: 'holy-panda', name: 'Holy Panda', desc: 'Deep rounded tactile pop' },
    { id: 'model-m', name: 'IBM Model M', desc: 'Vintage buckling spring ping' },
  ];

  return (
    <header className="w-full glass-panel border-b border-white/10 px-4 sm:px-6 py-2.5 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3 sm:gap-4 flex-nowrap">
        
        {/* Left: Player Profile & Identity / Google Account */}
        <div 
          onClick={() => setModal('account')}
          className="flex items-center gap-2.5 sm:gap-3 cursor-pointer group flex-shrink-0 select-none"
          title="Click to manage account, sign in with Google & view stats"
        >
          <div 
            className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500/20 to-purple-500/20 border border-cyan-400/40 flex items-center justify-center text-lg group-hover:scale-105 group-hover:border-cyan-400 transition-all shadow-neon-cyan flex-shrink-0"
          >
            {user.avatar}
          </div>

          <div className="flex flex-col justify-center min-w-0">
            <div className="flex items-center gap-1.5 whitespace-nowrap">
              <span className="font-display font-extrabold text-xs sm:text-sm tracking-wide text-white group-hover:text-cyan-300 transition-colors truncate max-w-[120px] sm:max-w-[150px]">
                {user.name}
              </span>
              {user.email ? (
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.2 rounded border border-emerald-400/30 font-bold flex items-center gap-0.5">
                  <ShieldCheck className="w-2.5 h-2.5 text-emerald-400" /> G
                </span>
              ) : (
                <span className="text-[9px] bg-cyan-500/10 text-cyan-300 px-1.5 py-0.2 rounded border border-cyan-400/20 font-mono font-bold group-hover:bg-cyan-500/20">
                  Sign In
                </span>
              )}
            </div>

            <div className="flex items-center gap-1.5 mt-0.5 whitespace-nowrap">
              <span 
                className="text-[10px] sm:text-[11px] font-bold px-2 py-0.5 rounded-full border whitespace-nowrap inline-block"
                style={{ 
                  color: rankStats.rank.color,
                  borderColor: `${rankStats.rank.color}40`,
                  backgroundColor: `${rankStats.rank.color}18`
                }}
              >
                {rankStats.rank.name}
              </span>
              <span className="text-[10px] text-slate-400 font-mono font-medium flex-shrink-0">
                Lvl {level}
              </span>
            </div>
          </div>
        </div>

        {/* Center: Navigation Pill Bar */}
        <nav className="flex items-center gap-1 bg-slate-900/80 p-1 rounded-2xl border border-white/10 overflow-x-auto max-w-full select-none flex-shrink">
          {/* Primary Home Screen: Dashboard */}
          <button 
            onClick={() => { setModal(null); setScreen('dashboard'); }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
              activeScreen === 'dashboard' && !activeModal
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/40 shadow-neon-cyan font-bold' 
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <LayoutDashboard className="w-3.5 h-3.5 text-cyan-400" /> Dashboard
          </button>

          <button 
            onClick={() => { setModal(null); setScreen('map'); }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
              activeScreen === 'map' && !activeModal
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/40 shadow-neon-cyan font-bold' 
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Map className="w-3.5 h-3.5 text-cyan-400" /> Levels
          </button>

          <button 
            onClick={() => { setModal(null); setScreen('game'); }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
              activeScreen === 'game' && !activeModal
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/40 shadow-neon-cyan font-bold' 
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Zap className="w-3.5 h-3.5 text-cyan-400" /> Arena
          </button>

          <button 
            onClick={() => { setModal(null); setScreen('multiplayer'); }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
              activeScreen === 'multiplayer' && !activeModal
                ? 'bg-blue-500/20 text-blue-300 border border-blue-400/40 shadow-[0_0_15px_rgba(59,130,246,0.3)] font-bold' 
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Users className="w-3.5 h-3.5 text-blue-400" /> Multiplayer
          </button>

          <button 
            onClick={() => { setModal(null); setScreen('shop'); }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
              activeScreen === 'shop' && !activeModal
                ? 'bg-purple-500/20 text-purple-300 border border-purple-400/40 shadow-neon-purple font-bold' 
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <ShoppingBag className="w-3.5 h-3.5 text-purple-400" /> Shop
          </button>

          <button 
            onClick={() => setModal('customPractice')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
              activeModal === 'customPractice'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/40 shadow-neon-cyan font-bold'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
            title="Custom Practice: Paste your own text or code"
          >
            <FileText className="w-3.5 h-3.5 text-cyan-400" /> Custom
          </button>

          <button 
            onClick={() => setModal('heatmap')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
              activeModal === 'heatmap'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/40 shadow-neon-cyan font-bold'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Grid3X3 className="w-3.5 h-3.5 text-cyan-400" /> Heatmap
          </button>

          <button 
            onClick={() => setModal('daily')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
              activeModal === 'daily'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-400/40 shadow-[0_0_15px_rgba(245,158,11,0.3)] font-bold'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Calendar className="w-3.5 h-3.5 text-amber-400" /> Daily
          </button>

          <button 
            onClick={() => setModal('tournament')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
              activeModal === 'tournament'
                ? 'bg-red-500/20 text-red-300 border border-red-400/40 shadow-[0_0_15px_rgba(239,68,68,0.3)] font-bold'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Trophy className="w-3.5 h-3.5 text-red-400" /> Tournaments
          </button>

          <button 
            onClick={() => setModal('achievements')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
              activeModal === 'achievements'
                ? 'bg-purple-500/20 text-purple-300 border border-purple-400/40 shadow-neon-purple font-bold'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Award className="w-3.5 h-3.5 text-purple-400" /> Badges
          </button>

          <button 
            onClick={() => setModal('certificate')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
              activeModal === 'certificate'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-400/40 shadow-[0_0_15px_rgba(245,158,11,0.3)] font-bold'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
            title="Official Certificate of Touch Typing Mastery"
          >
            <Award className="w-3.5 h-3.5 text-amber-400" /> Diploma
          </button>
        </nav>

        {/* Right: Currency, Streak Claim Button, Audio Settings & Terminal */}
        <div className="flex items-center gap-2 sm:gap-2.5 flex-shrink-0">
          
          {/* Emeralds */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-emerald-400 text-xs font-mono font-bold shadow-[0_0_15px_rgba(16,185,129,0.15)] select-none">
            <Gem className="w-3.5 h-3.5 text-emerald-400" />
            <span>{emeralds.toLocaleString()}</span>
          </div>

          {/* 7-Day Login Streak Reward Button */}
          <button
            onClick={() => setModal('streak')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-mono font-bold transition-all ${
              currentStreak >= 30 
                ? 'bg-amber-500/20 border-amber-400 text-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.3)] animate-pulse' 
                : currentStreak > 0
                ? 'bg-orange-500/15 border-orange-500/40 text-orange-400 hover:bg-orange-500/25'
                : 'bg-slate-900/60 border-white/10 text-slate-400 hover:text-white hover:bg-white/5'
            }`}
            title="7-Day Login Streak Calendar & Daily Rewards"
          >
            <Flame className={`w-3.5 h-3.5 ${currentStreak >= 30 ? 'text-amber-400' : 'text-orange-500'}`} />
            <span>{currentStreak}x Streak</span>
          </button>

          {/* Update Available Notification Pill */}
          {updateAvailable && (
            <button
              onClick={() => setModal('update')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-cyan-500/20 to-emerald-500/20 border border-cyan-400 text-cyan-300 text-xs font-mono font-bold shadow-[0_0_15px_rgba(0,245,255,0.4)] hover:scale-105 transition-all animate-pulse"
              title="New version update available - click to install"
            >
              <Zap className="w-3.5 h-3.5 text-cyan-400" />
              <span>Update ⚡</span>
            </button>
          )}

          {/* Audio Master Settings Popover */}
          <div className="relative">
            <button 
              onClick={() => setShowAudioPopover(!showAudioPopover)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-900/60 border border-white/10 text-xs text-slate-300 hover:text-white hover:border-white/20 transition-all"
              title="Acoustic Switch Settings & Volume"
            >
              <Sliders className="w-3.5 h-3.5 text-cyan-400" />
              <span className="capitalize hidden sm:inline">{switchProfile.split('-')[0]}</span>
            </button>

            {showAudioPopover && (
              <div className="absolute right-0 top-full mt-2 w-72 glass-panel rounded-2xl p-4 shadow-2xl z-50 border border-cyan-500/30 flex flex-col gap-3">
                <div className="flex items-center justify-between border-b border-white/10 pb-2">
                  <span className="text-xs font-bold text-white font-mono uppercase tracking-wider">
                    Audio Settings
                  </span>
                  <button
                    onClick={() => setShowAudioPopover(false)}
                    className="text-xs text-slate-400 hover:text-white"
                  >
                    ✕
                  </button>
                </div>

                {/* Volume Slider */}
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between text-xs font-mono text-slate-300">
                    <span className="flex items-center gap-1">
                      <Volume2 className="w-3.5 h-3.5 text-cyan-400" /> Master Volume
                    </span>
                    <span className="font-bold">{Math.round(masterVolume * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={masterVolume}
                    onChange={(e) => setMasterVolume(parseFloat(e.target.value))}
                    className="w-full accent-cyan-400 cursor-pointer"
                  />
                </div>

                {/* Switch Profiles List */}
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-1">
                    Mechanical Switch Synthesizer
                  </span>
                  {switchProfiles.map((p) => (
                    <div
                      key={p.id}
                      className={`flex items-center justify-between p-2 rounded-xl text-xs transition-all ${
                        switchProfile === p.id 
                          ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/30' 
                          : 'text-slate-300 hover:bg-white/5 border border-transparent'
                      }`}
                    >
                      <button
                        onClick={() => setSwitchProfile(p.id)}
                        className="flex-1 text-left"
                      >
                        <div className="font-bold">{p.name}</div>
                        <div className="text-[10px] text-slate-400 truncate">{p.desc}</div>
                      </button>

                      <button
                        onClick={() => soundEngine.previewSwitch(p.id)}
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-cyan-500 hover:text-black text-slate-300 transition-colors ml-2"
                        title="Preview Key Sound"
                      >
                        <Play className="w-3 h-3 fill-current" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Mute Audio */}
          <button 
            onClick={toggleMute}
            className="p-2 rounded-xl bg-slate-900/60 border border-white/10 text-slate-300 hover:text-white hover:border-white/20 transition-all"
            title={isMuted ? 'Unmute Audio' : 'Mute Audio'}
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-cyan-400" />}
          </button>

          {/* Terminal PIN unlock */}
          <button 
            onClick={() => setModal('admin')}
            className="p-2 rounded-xl bg-slate-900/60 border border-white/10 text-slate-500 hover:text-green-400 hover:border-green-400/40 transition-all"
            title="Admin Terminal"
          >
            <Terminal className="w-4 h-4" />
          </button>
        </div>

      </div>
    </header>
  );
};
