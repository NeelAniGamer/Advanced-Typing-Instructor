import React, { useState } from 'react';
import { useGameStore } from '../../stores/useGameStore';
import { calculateRankStats } from '../../utils/ranks';
import { soundEngine } from '../../services/soundEngine';
import { UserAvatar } from '../Common/UserAvatar';
import { isSeriousTheme } from '../../utils/theme';
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
  LayoutDashboard,
  GraduationCap,
  HelpCircle,
  Sparkles,
  Palette,
  Leaf,
  Play,
  MoreHorizontal,
  ChevronDown,
  Keyboard
} from 'lucide-react';
import { SwitchProfile } from '../../types/game';
import { Dropdown } from '../HeroUI';

export const GameHUD: React.FC = () => {
  const { 
    user, 
    level, 
    mode, 
    difficulty, 
    wpm, 
    emeralds, 
    prestige, 
    dailyStreak,
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
    updateAvailable,
    category,
    casingStyle,
    isAIWordMode,
    uiTheme,
    setUITheme,
    backgroundStats
  } = useGameStore();

  const isOrganicLight = uiTheme === 'organic';
  const isOrganicDark = uiTheme === 'organic-dark';
  const isOrganic = isOrganicLight || isOrganicDark;
  const isSerious = !isOrganic && isSeriousTheme(category, mode);

  const activeTabClass = isOrganicLight
    ? 'tab-active-pill bg-[#7C8D81] text-white border border-[#7C8D81] shadow-organic-sage font-bold'
    : isOrganicDark
    ? 'tab-active-pill bg-[#8FA896] text-[#141716] border border-[#8FA896] font-bold'
    : isSerious
    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 shadow-neon-emerald font-bold'
    : 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/40 shadow-neon-cyan font-bold';

  const activeIconClass = isOrganic 
    ? 'w-3.5 h-3.5 text-white'
    : isSerious 
    ? 'w-3.5 h-3.5 text-emerald-400' 
    : 'w-3.5 h-3.5 text-cyan-400';

  const [showControlsPopover, setShowControlsPopover] = useState(false);

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
    <header className={`w-full glass-panel border-b px-3 sm:px-6 py-2.5 sticky top-0 z-40 transition-colors duration-400 ${
      isOrganicLight
        ? 'border-[#E5DFD7] bg-[#FAF8F5]/92 shadow-[0_4px_20px_rgba(51,51,51,0.05)]'
        : isOrganicDark
        ? 'border-[#2E3833] bg-[#181D1B]/95 shadow-[0_4px_20px_rgba(0,0,0,0.5)]'
        : isSerious 
        ? 'border-emerald-500/30 bg-slate-950/90 shadow-[0_4px_25px_rgba(16,185,129,0.08)]' 
        : 'border-white/10'
    }`}>
      <div className="w-full max-w-[1760px] mx-auto flex items-center justify-between gap-2 sm:gap-4 flex-nowrap">
        
        {/* Zone 1: Identity & Google Account */}
        <div 
          onClick={() => setModal('account')}
          className="flex items-center gap-2 sm:gap-3 cursor-pointer group flex-shrink-0 select-none"
          title="Click to manage account, sign in with Google & view stats"
        >
          <div 
            className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl border flex items-center justify-center text-lg group-hover:scale-105 transition-all flex-shrink-0 overflow-hidden ${
              isOrganicLight
                ? 'bg-[#FAF8F5] border-[#E2DDD5] group-hover:border-[#7C8D81] shadow-sm'
                : isOrganicDark
                ? 'bg-[#1C221F] border-[#2E3833] group-hover:border-[#7C8D81] shadow-sm'
                : 'bg-gradient-to-br from-cyan-500/20 to-purple-500/20 border-cyan-400/40 group-hover:border-cyan-400 shadow-neon-cyan'
            }`}
          >
            <UserAvatar avatar={user.avatar} name={user.name} className="w-full h-full" />
          </div>

          <div className="flex flex-col justify-center min-w-0">
            <div className="flex items-center gap-1.5 whitespace-nowrap">
              <span className={`font-display font-extrabold text-xs sm:text-sm tracking-wide transition-colors truncate max-w-[100px] sm:max-w-[140px] ${
                isOrganicLight
                  ? 'text-[#333333] group-hover:text-[#C97D5A]'
                  : isOrganicDark
                  ? 'text-[#FAF8F5] group-hover:text-[#D98A66]'
                  : 'text-white group-hover:text-cyan-300'
              }`}>
                {user.name}
              </span>
              {user.email ? (
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.2 rounded border border-emerald-400/30 font-bold flex items-center gap-0.5">
                  <ShieldCheck className="w-2.5 h-2.5 text-emerald-400" /> G
                </span>
              ) : (
                <span className={`text-[9px] px-1.5 py-0.2 rounded border font-mono font-bold ${
                  isOrganicLight
                    ? 'bg-[#E5DFD7] text-[#555555] border-[#D5CFC7] group-hover:bg-[#D5CFC7]'
                    : isOrganicDark
                    ? 'bg-[#232B26] text-[#A3ACA7] border-[#2E3833] group-hover:bg-[#2E3833]'
                    : 'bg-cyan-500/10 text-cyan-300 border-cyan-400/20 group-hover:bg-cyan-500/20'
                }`}>
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
              <span className={`text-[10px] font-mono font-medium flex-shrink-0 ${
                isOrganicLight ? 'text-[#7C8D81]' : isOrganicDark ? 'text-[#8FA896]' : 'text-slate-400'
              }`}>
                Lvl {level}
              </span>
            </div>
          </div>
        </div>

        {/* Zone 2: Core Loop Navigation + Categorized Activities */}
        <nav className={`flex items-center gap-1 p-1 rounded-2xl border select-none flex-shrink-0 ${
          isOrganicLight 
            ? 'bg-[#F2EFEB] border-[#E2DDD5]' 
            : isOrganicDark
            ? 'bg-[#1C221F] border-[#2E3833]'
            : 'bg-slate-900/80 border-white/10'
        }`}>
          {/* 1. Dashboard */}
          <button 
            onClick={() => { setModal(null); setScreen('dashboard'); }}
            className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
              activeScreen === 'dashboard' && !activeModal
                ? activeTabClass 
                : isOrganicLight
                ? 'text-[#666666] hover:text-[#333333] hover:bg-black/5'
                : isOrganicDark
                ? 'text-[#A3ACA7] hover:text-white hover:bg-white/10'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <LayoutDashboard className={activeScreen === 'dashboard' && !activeModal ? activeIconClass : isOrganicLight ? "w-3.5 h-3.5 text-[#7C8D81]" : isOrganicDark ? "w-3.5 h-3.5 text-[#8FA896]" : "w-3.5 h-3.5 text-slate-400"} />
            <span>Dashboard</span>
          </button>

          {/* 2. Level Select (200 Progressive Levels) */}
          <button 
            onClick={() => { setModal(null); setScreen('map'); }}
            className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
              activeScreen === 'map' && !activeModal
                ? activeTabClass 
                : isOrganicLight
                ? 'text-[#666666] hover:text-[#333333] hover:bg-black/5'
                : isOrganicDark
                ? 'text-[#A3ACA7] hover:text-white hover:bg-white/10'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
            title="Level Select: 200 Progressive Typing Levels"
          >
            <Map className={activeScreen === 'map' && !activeModal ? activeIconClass : isOrganicLight ? "w-3.5 h-3.5 text-[#7C8D81]" : isOrganicDark ? "w-3.5 h-3.5 text-[#8FA896]" : "w-3.5 h-3.5 text-slate-400"} />
            <span>Level Select</span>
          </button>

          {/* 5. Multiplayer */}
          <button 
            onClick={() => { setModal(null); setScreen('multiplayer'); }}
            className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
              activeScreen === 'multiplayer' && !activeModal
                ? activeTabClass 
                : isOrganicLight
                ? 'text-[#666666] hover:text-[#333333] hover:bg-black/5'
                : isOrganicDark
                ? 'text-[#A3ACA7] hover:text-white hover:bg-white/10'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
            title="Live Multiplayer Race Rooms"
          >
            <Users className={activeScreen === 'multiplayer' && !activeModal ? activeIconClass : "w-3.5 h-3.5 text-blue-400"} />
            <span>Multiplayer</span>
          </button>

          {/* 6. Categorized Activities Dropdown */}
          <Dropdown
            selectionMode="none"
            onAction={(key) => {
              if (key === 'shop') {
                setModal(null);
                setScreen('shop');
              } else {
                setModal(key as any);
              }
            }}
          >
            <Dropdown.Trigger>
              <button
                type="button"
                className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                  ['customPractice', 'heatmap', 'daily', 'tournament', 'achievements', 'certificate'].includes(activeModal || '') || activeScreen === 'shop'
                    ? activeTabClass
                    : isOrganicLight
                    ? 'text-[#666666] hover:text-[#333333] hover:bg-black/5'
                    : isOrganicDark
                    ? 'text-[#A3ACA7] hover:text-white hover:bg-white/10'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <Trophy className={`w-3.5 h-3.5 ${['customPractice', 'heatmap', 'daily', 'tournament', 'achievements', 'certificate'].includes(activeModal || '') || activeScreen === 'shop' ? (isOrganic ? 'text-white' : 'text-amber-400') : (isOrganicLight ? 'text-[#7C8D81]' : isOrganicDark ? 'text-[#8FA896]' : 'text-slate-400')}`} />
                <span>Activities</span>
                <ChevronDown className="w-3 h-3 opacity-60" />
              </button>
            </Dropdown.Trigger>
            <Dropdown.Popover 
              placement="bottom-end" 
              className={`w-64 ${
                isOrganicLight
                  ? '!bg-[#FAF8F5] !border-[#E2DDD5] !text-[#1A1F1D] shadow-[0_12px_35px_rgba(45,51,48,0.16)]'
                  : isOrganicDark
                  ? '!bg-[#181D1B] !border-[#2E3833] !text-[#FAF8F5] shadow-[0_14px_40px_rgba(0,0,0,0.65)]'
                  : 'bg-slate-900/95 border-white/15 text-slate-100 shadow-2xl'
              }`}
            >
              <Dropdown.Menu>
                <Dropdown.Section title="Competitive & Events">
                  <Dropdown.Item
                    id="tournament"
                    startContent={<Trophy className="w-4 h-4 text-red-400" />}
                    description="Global leaderboards & cups"
                  >
                    Tournaments
                  </Dropdown.Item>
                  <Dropdown.Item
                    id="daily"
                    startContent={<Calendar className="w-4 h-4 text-amber-400" />}
                    description="Daily XP & word missions"
                  >
                    Daily Challenge
                  </Dropdown.Item>
                </Dropdown.Section>

                <Dropdown.Separator />

                <Dropdown.Section title="Practice & Analytics">
                  <Dropdown.Item
                    id="customPractice"
                    startContent={<FileText className="w-4 h-4 text-cyan-400" />}
                    description="Custom code & syntax buffer"
                  >
                    Custom Practice
                  </Dropdown.Item>
                  <Dropdown.Item
                    id="heatmap"
                    startContent={<Grid3X3 className="w-4 h-4 text-emerald-400" />}
                    description="Keystroke mistake density map"
                  >
                    Keyboard Heatmap
                  </Dropdown.Item>
                </Dropdown.Section>

                <Dropdown.Separator />

                <Dropdown.Section title="Armory & Records">
                  <Dropdown.Item
                    id="shop"
                    startContent={<ShoppingBag className="w-4 h-4 text-purple-400" />}
                    description="Switch sounds & aesthetics"
                  >
                    Shop Forge
                  </Dropdown.Item>
                  <Dropdown.Item
                    id="achievements"
                    startContent={<Award className="w-4 h-4 text-purple-400" />}
                    description="Trophies & milestones"
                  >
                    Achievements
                  </Dropdown.Item>
                  <Dropdown.Item
                    id="certificate"
                    startContent={<GraduationCap className="w-4 h-4 text-amber-400" />}
                    description="Official verified diploma"
                  >
                    Typing Diploma
                  </Dropdown.Item>
                </Dropdown.Section>
              </Dropdown.Menu>
            </Dropdown.Popover>
          </Dropdown>
        </nav>

        {/* Zone 3: Economy Pod, Typing Style & Game Controls Hub */}
        <div className="flex items-center gap-2 sm:gap-2.5 flex-shrink-0">
          
          {/* Update Available Notification Pill */}
          {updateAvailable && (
            <button
              onClick={() => setModal('update')}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-gradient-to-r from-cyan-500/20 to-emerald-500/20 border border-cyan-400 text-cyan-300 text-xs font-mono font-bold shadow-[0_0_15px_rgba(0,245,255,0.4)] hover:scale-105 transition-all animate-pulse"
              title="New version update available - click to install"
            >
              <Zap className="w-3.5 h-3.5 text-cyan-400" />
              <span>Update ⚡</span>
            </button>
          )}

          {/* Unified Economy Pod: [ 💎 1,474 │ 🔥 3x ] */}
          <div className={`flex items-center rounded-xl border p-0.5 text-xs font-mono font-bold select-none ${
            isOrganicLight 
              ? 'bg-[#FAF8F5] border-[#E2DDD5] shadow-sm' 
              : isOrganicDark
              ? 'bg-[#1C221F] border-[#2E3833] shadow-sm'
              : 'bg-slate-900/80 border-white/10'
          }`}>
            {/* Emeralds - Click opens Shop Forge */}
            <button
              onClick={() => { setModal(null); setScreen('shop'); }}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg transition-colors ${
                isOrganic
                  ? 'text-[#C97D5A] hover:bg-[#C97D5A]/10'
                  : 'text-emerald-400 hover:bg-emerald-500/10'
              }`}
              title="Emeralds Vault: Click to open Shop Forge"
            >
              <Gem className={`w-3.5 h-3.5 ${isOrganic ? 'text-[#C97D5A]' : 'text-emerald-400'}`} />
              <span>{emeralds.toLocaleString()}</span>
            </button>

            <div className={`w-px h-3.5 ${isOrganicLight ? 'bg-[#E2DDD5]' : isOrganicDark ? 'bg-[#2E3833]' : 'bg-white/10'}`} />

            {/* Streak - Click opens Streak Rewards */}
            <button
              onClick={() => setModal('streak')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg transition-colors ${
                dailyStreak >= 7
                  ? 'text-amber-300 hover:bg-amber-500/10 animate-pulse'
                  : dailyStreak > 0
                  ? isOrganic 
                    ? 'text-[#C97D5A] hover:bg-[#C97D5A]/10' 
                    : 'text-orange-400 hover:bg-orange-500/10'
                  : isOrganicLight
                  ? 'text-[#888888] hover:bg-black/5'
                  : isOrganicDark
                  ? 'text-[#666666] hover:bg-white/5'
                  : 'text-slate-400 hover:bg-white/5'
              }`}
              title={`Daily Login Streak: ${dailyStreak} Day${dailyStreak === 1 ? '' : 's'} • Click for Rewards`}
            >
              <Flame className={`w-3.5 h-3.5 ${dailyStreak >= 7 ? 'text-amber-400' : isOrganic ? 'text-[#C97D5A]' : 'text-orange-500'}`} />
              <span>{dailyStreak}d</span>
            </button>
          </div>

          {/* Windows Background Cadence Pill */}
          <button
            onClick={() => setModal('typingStyle')}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs font-mono font-bold transition-all ${
              activeModal === 'typingStyle'
                ? isOrganicLight
                  ? 'bg-[#7C8D81]/20 border-[#7C8D81] text-[#333333]'
                  : isOrganicDark
                  ? 'bg-[#8FA896]/20 border-[#8FA896] text-[#FAF8F5]'
                  : 'bg-emerald-500/25 border-emerald-400 text-emerald-300 shadow-neon-emerald'
                : isOrganicLight
                ? 'bg-[#FAF8F5] border-[#E2DDD5] text-[#333333] hover:border-[#7C8D81] shadow-sm'
                : isOrganicDark
                ? 'bg-[#1C221F] border-[#2E3833] text-[#FAF8F5] hover:border-[#8FA896] shadow-sm'
                : 'bg-slate-900/80 border-white/10 text-emerald-300 hover:border-emerald-400/40 hover:bg-white/5'
            }`}
            title={`Windows Background Cadence: ${(backgroundStats?.total_keystrokes_today ?? 0).toLocaleString()} keys tracked today across all desktop apps (${backgroundStats?.active_typing_minutes ?? 0}m active). Click to view analytics & startup.`}
          >
            <Keyboard className={`w-3.5 h-3.5 ${isOrganicLight ? 'text-[#7C8D81]' : isOrganicDark ? 'text-[#8FA896]' : 'text-emerald-400'}`} />
            <span>{(backgroundStats?.total_keystrokes_today ?? 0).toLocaleString()} <span className="text-[10px] opacity-75">BG</span></span>
            <span className="relative flex h-2 w-2 ml-0.5" title="Background Monitor Active">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
          </button>

          {/* Typing Casing Pill */}
          <button
            onClick={() => setModal('typingStyle')}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs font-mono font-bold transition-all ${
              activeModal === 'typingStyle'
                ? isOrganicLight
                  ? 'bg-[#7C8D81]/20 border-[#7C8D81] text-[#333333]'
                  : isOrganicDark
                  ? 'bg-[#8FA896]/20 border-[#8FA896] text-[#FAF8F5]'
                  : 'bg-cyan-500/25 border-cyan-400 text-cyan-300 shadow-neon-cyan'
                : isOrganicLight
                ? 'bg-[#FAF8F5] border-[#E2DDD5] text-[#333333] hover:border-[#7C8D81] shadow-sm'
                : isOrganicDark
                ? 'bg-[#1C221F] border-[#2E3833] text-[#FAF8F5] hover:border-[#8FA896] shadow-sm'
                : 'bg-slate-900/80 border-white/10 text-cyan-300 hover:border-cyan-400/40 hover:bg-white/5'
            }`}
            title="Typing Style & AI Synthesizer Settings"
          >
            <Sparkles className={`w-3.5 h-3.5 ${isOrganicLight ? 'text-[#7C8D81]' : isOrganicDark ? 'text-[#8FA896]' : 'text-cyan-400'}`} />
            <span className="capitalize hidden md:inline">{casingStyle === 'title_case' ? 'Title Case' : casingStyle.replace('_', ' ')}</span>
            <span className="capitalize md:hidden">{casingStyle === 'title_case' ? 'Title' : casingStyle.split('_')[0]}</span>
            {isAIWordMode && (
              <span className="w-1.5 h-1.5 rounded-full bg-purple-400 shadow-[0_0_6px_#c084fc]" title="AI Word Synthesizer Active" />
            )}
          </button>

          {/* Corner Help Button (Academy, Ergonomics & Drills) */}
          <button
            onClick={() => { setModal(null); setScreen('tutorial'); }}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs font-semibold transition-all ${
              activeScreen === 'tutorial' && !activeModal
                ? isOrganicLight
                  ? 'bg-[#7C8D81]/20 border-[#7C8D81] text-[#333333]'
                  : isOrganicDark
                  ? 'bg-[#8FA896]/20 border-[#8FA896] text-[#FAF8F5]'
                  : 'bg-cyan-500/25 border-cyan-400 text-cyan-300 shadow-neon-cyan'
                : isOrganicLight
                ? 'bg-[#FAF8F5] border-[#E2DDD5] text-[#333333] hover:border-[#7C8D81] shadow-sm'
                : isOrganicDark
                ? 'bg-[#1C221F] border-[#2E3833] text-[#FAF8F5] hover:border-[#8FA896] shadow-sm'
                : 'bg-slate-900/80 border-white/10 text-slate-300 hover:text-white hover:border-white/20'
            }`}
            title="Help: Touch Typing Guide, Ergonomics & Tactile Drills"
          >
            <HelpCircle className={`w-3.5 h-3.5 ${isOrganicLight ? 'text-[#7C8D81]' : isOrganicDark ? 'text-[#8FA896]' : 'text-cyan-400'}`} />
            <span className="hidden sm:inline">Help</span>
          </button>

          {/* Consolidated Game Controls Hub Popover */}
          <div className="relative">
            <button
              onClick={() => setShowControlsPopover(!showControlsPopover)}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs font-semibold transition-all ${
                showControlsPopover
                  ? isOrganicLight
                    ? 'bg-[#FAF8F5] border-[#7C8D81] text-[#333333] shadow-sm ring-2 ring-[#7C8D81]/20'
                    : isOrganicDark
                    ? 'bg-[#1C221F] border-[#8FA896] text-[#FAF8F5] shadow-sm ring-2 ring-[#8FA896]/20'
                    : 'bg-cyan-500/25 border-cyan-400 text-cyan-300 shadow-neon-cyan'
                  : isOrganicLight
                  ? 'bg-[#FAF8F5] border-[#E2DDD5] text-[#333333] hover:border-[#7C8D81] shadow-sm'
                  : isOrganicDark
                  ? 'bg-[#1C221F] border-[#2E3833] text-[#FAF8F5] hover:border-[#8FA896] shadow-sm'
                  : 'bg-slate-900/80 border-white/10 text-slate-300 hover:text-white hover:border-white/20'
              }`}
              title="Game Controls, Audio Synthesizer, Theme & Admin"
            >
              {isMuted ? (
                <VolumeX className="w-3.5 h-3.5 text-red-400" />
              ) : (
                <Sliders className={`w-3.5 h-3.5 ${isOrganicLight ? 'text-[#7C8D81]' : isOrganicDark ? 'text-[#8FA896]' : 'text-cyan-400'}`} />
              )}
              <span className="capitalize hidden sm:inline">{switchProfile.split('-')[0]}</span>
              <ChevronDown className={`w-3 h-3 opacity-60 transition-transform duration-200 ${showControlsPopover ? 'rotate-180' : ''}`} />
            </button>

            {/* Full-screen backdrop to handle click-outside gracefully */}
            {showControlsPopover && (
              <div 
                className="fixed inset-0 z-40 bg-black/10" 
                onClick={() => setShowControlsPopover(false)} 
              />
            )}

            {/* Floating Game Controls Panel */}
            {showControlsPopover && (
              <div className={`absolute right-0 top-full mt-2 w-80 rounded-2xl p-4 shadow-2xl z-50 border flex flex-col gap-3.5 animate-in fade-in zoom-in-95 duration-150 ${
                isOrganicLight
                  ? 'bg-[#FDFCFA] border-[#E2DDD5] text-[#2A322D] shadow-[0_10px_35px_rgba(51,51,51,0.12)]'
                  : isOrganicDark
                  ? 'bg-[#181D1B] border-[#2E3833] text-[#FAF8F5] shadow-[0_14px_45px_rgba(0,0,0,0.8)]'
                  : 'bg-slate-950 border border-cyan-500/40 text-slate-200 shadow-[0_10px_40px_rgba(0,0,0,0.8)]'
              }`}>
                {/* Popover Header */}
                <div className={`flex items-center justify-between border-b pb-2.5 ${isOrganicLight ? 'border-[#E2DDD5]' : isOrganicDark ? 'border-[#2E3833]' : 'border-white/10'}`}>
                  <div className="flex items-center gap-2">
                    <Sliders className={`w-4 h-4 ${isOrganicLight ? 'text-[#7C8D81]' : isOrganicDark ? 'text-[#8FA896]' : 'text-cyan-400'}`} />
                    <span className="text-xs font-bold font-mono uppercase tracking-wider">
                      Game Controls & Audio
                    </span>
                  </div>
                  <button
                    onClick={() => setShowControlsPopover(false)}
                    className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs transition-colors ${
                      isOrganicLight ? 'hover:bg-[#E5DFD7] text-[#666666]' : isOrganicDark ? 'hover:bg-white/10 text-[#A3ACA7]' : 'hover:bg-white/10 text-slate-400'
                    }`}
                  >
                    ✕
                  </button>
                </div>

                {/* Section 1: Master Audio & Mute */}
                <div className={`p-3 rounded-xl border flex flex-col gap-2.5 ${
                  isOrganicLight ? 'bg-[#F2EFEB] border-[#E2DDD5]' : isOrganicDark ? 'bg-[#141716] border-[#2E3833]' : 'bg-slate-900/60 border-white/10'
                }`}>
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="flex items-center gap-1.5 font-semibold">
                      {isMuted ? (
                        <VolumeX className="w-4 h-4 text-red-400" />
                      ) : masterVolume > 0.5 ? (
                        <Volume2 className={`w-4 h-4 ${isOrganicLight ? 'text-[#7C8D81]' : isOrganicDark ? 'text-[#8FA896]' : 'text-cyan-400'}`} />
                      ) : (
                        <Volume1 className={`w-4 h-4 ${isOrganicLight ? 'text-[#7C8D81]' : isOrganicDark ? 'text-[#8FA896]' : 'text-cyan-400'}`} />
                      )}
                      <span>Master Audio</span>
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="font-bold">{isMuted ? 'Muted' : `${Math.round(masterVolume * 100)}%`}</span>
                      <button
                        onClick={toggleMute}
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase transition-all ${
                          isMuted
                            ? 'bg-red-500/20 text-red-400 border border-red-500/40'
                            : isOrganicLight
                            ? 'bg-[#E5DFD7] text-[#333333] hover:bg-[#D5CFC7]'
                            : isOrganicDark
                            ? 'bg-[#232B26] text-[#FAF8F5] hover:bg-[#2E3833]'
                            : 'bg-white/10 text-slate-300 hover:bg-white/20'
                        }`}
                      >
                        {isMuted ? 'Unmute' : 'Mute'}
                      </button>
                    </div>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    disabled={isMuted}
                    value={isMuted ? 0 : masterVolume}
                    onChange={(e) => setMasterVolume(parseFloat(e.target.value))}
                    className={`w-full cursor-pointer ${
                      isOrganicLight ? 'accent-[#7C8D81]' : isOrganicDark ? 'accent-[#8FA896]' : 'accent-cyan-400'
                    } ${isMuted ? 'opacity-40 cursor-not-allowed' : ''}`}
                  />
                </div>

                {/* Section 2: Mechanical Switch Synthesizer */}
                <div className="flex flex-col gap-1.5">
                  <span className={`text-[10px] font-bold uppercase tracking-wider px-1 ${
                    isOrganicLight ? 'text-[#7C8D81]' : isOrganicDark ? 'text-[#8FA896]' : 'text-slate-400'
                  }`}>
                    Mechanical Switch Synthesizer
                  </span>
                  <div className="flex flex-col gap-1 max-h-48 overflow-y-auto pr-1">
                    {switchProfiles.map((p) => (
                      <div
                        key={p.id}
                        className={`flex items-center justify-between p-2 rounded-xl text-xs transition-all border ${
                          switchProfile === p.id 
                            ? isOrganicLight
                              ? 'bg-[#7C8D81]/15 text-[#333333] border-[#7C8D81]/40 shadow-sm font-semibold'
                              : isOrganicDark
                              ? 'bg-[#8FA896]/20 text-[#FAF8F5] border-[#8FA896]/50 shadow-sm font-semibold'
                              : 'bg-cyan-500/20 text-cyan-300 border-cyan-400/40 shadow-neon-cyan font-semibold'
                            : isOrganicLight
                            ? 'hover:bg-[#F2EFEB] border-transparent text-[#555555]'
                            : isOrganicDark
                            ? 'hover:bg-[#232B26] border-transparent text-[#A3ACA7]'
                            : 'text-slate-300 hover:bg-white/5 border-transparent'
                        }`}
                      >
                        <button
                          onClick={() => setSwitchProfile(p.id)}
                          className="flex-1 text-left"
                        >
                          <div className="font-bold flex items-center gap-1.5">
                            <span>{p.name}</span>
                            {switchProfile === p.id && (
                              <span className={`text-[9px] px-1.5 py-0.2 rounded-full font-mono font-bold ${
                                isOrganicLight ? 'bg-[#7C8D81] text-white' : isOrganicDark ? 'bg-[#8FA896] text-[#141716]' : 'bg-cyan-400 text-black'
                              }`}>
                                ACTIVE
                              </span>
                            )}
                          </div>
                          <div className={`text-[10px] truncate ${isOrganicLight ? 'text-[#777777]' : isOrganicDark ? 'text-[#8A9490]' : 'text-slate-400'}`}>
                            {p.desc}
                          </div>
                        </button>

                        <button
                          onClick={() => soundEngine.previewSwitch(p.id)}
                          className={`p-1.5 rounded-lg transition-colors ml-2 ${
                            isOrganicLight
                              ? 'bg-[#E5DFD7] hover:bg-[#7C8D81] hover:text-white text-[#333333]'
                              : isOrganicDark
                              ? 'bg-[#232B26] hover:bg-[#8FA896] hover:text-[#141716] text-[#FAF8F5]'
                              : 'bg-slate-800 hover:bg-cyan-500 hover:text-black text-slate-300'
                          }`}
                          title="Preview Acoustic Profile"
                        >
                          <Play className="w-3 h-3 fill-current" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Section 3: Visual Theme & Aesthetic */}
                <div className={`p-3 rounded-xl border flex flex-col gap-2.5 ${
                  isOrganicLight ? 'bg-[#F2EFEB] border-[#E2DDD5]' : isOrganicDark ? 'bg-[#1E2220] border-[#2E3531]' : 'bg-slate-900/60 border-white/10'
                }`}>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold flex items-center gap-1.5">
                      <Leaf className={`w-3.5 h-3.5 ${isOrganic ? 'text-[#C97D5A]' : 'text-cyan-400'}`} />
                      <span>Visual Theme</span>
                    </span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold font-mono ${
                      isOrganicLight ? 'bg-[#FAF8F5] text-[#7C8D81] border border-[#E2DDD5]' :
                      isOrganicDark ? 'bg-[#141716] text-[#8FA896] border border-[#2E3531]' :
                      'bg-cyan-950 text-cyan-400 border border-cyan-500/30'
                    }`}>
                      {uiTheme === 'organic' ? 'Organic Light (Primary)' : uiTheme === 'organic-dark' ? 'Organic Dark' : 'Cyber-Mechanical'}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-1.5 pt-1">
                    <button
                      onClick={() => setUITheme('organic')}
                      className={`p-2 rounded-xl border text-center transition-all flex flex-col items-center gap-1.5 ${
                        uiTheme === 'organic'
                          ? 'bg-[#FAF8F5] border-[#C97D5A] text-[#333333] shadow-sm ring-1 ring-[#C97D5A]'
                          : isOrganicDark ? 'bg-[#141716] hover:bg-[#252A28] border-[#2E3531] text-[#A3ACA7]' : 'bg-slate-800/40 hover:bg-slate-800 border-white/10 text-slate-400'
                      }`}
                      title="Organic Light (Warm Linen & Terracotta)"
                    >
                      <span className="w-3.5 h-3.5 rounded-full bg-[#FAF8F5] border-2 border-[#C97D5A]" />
                      <span className="text-[10px] font-bold leading-none">Organic Light</span>
                    </button>

                    <button
                      onClick={() => setUITheme('organic-dark')}
                      className={`p-2 rounded-xl border text-center transition-all flex flex-col items-center gap-1.5 ${
                        uiTheme === 'organic-dark'
                          ? 'bg-[#141716] border-[#D98A66] text-[#FAF8F5] shadow-sm ring-1 ring-[#D98A66]'
                          : isOrganicLight ? 'bg-[#FAF8F5] hover:bg-[#EAE5DF] border-[#E2DDD5] text-[#666666]' : 'bg-slate-800/40 hover:bg-slate-800 border-white/10 text-slate-400'
                      }`}
                      title="Organic Dark (Deep Espresso & Warm Charcoal)"
                    >
                      <span className="w-3.5 h-3.5 rounded-full bg-[#141716] border-2 border-[#D98A66]" />
                      <span className="text-[10px] font-bold leading-none">Organic Dark</span>
                    </button>

                    <button
                      onClick={() => setUITheme('cyber')}
                      className={`p-2 rounded-xl border text-center transition-all flex flex-col items-center gap-1.5 ${
                        uiTheme === 'cyber'
                          ? 'bg-slate-950 border-cyan-400 text-cyan-300 shadow-neon-cyan ring-1 ring-cyan-400'
                          : isOrganicLight ? 'bg-[#FAF8F5] hover:bg-[#EAE5DF] border-[#E2DDD5] text-[#666666]' : 'bg-[#1E2220] hover:bg-[#252A28] border-[#2E3531] text-[#A3ACA7]'
                      }`}
                      title="Cyber-Mechanical (Dark Blue & Cyan Neon)"
                    >
                      <span className="w-3.5 h-3.5 rounded-full bg-cyan-400 border-2 border-cyan-300" />
                      <span className="text-[10px] font-bold leading-none">Cyber</span>
                    </button>
                  </div>
                </div>

                {/* Section 4: Admin Terminal & Utilities */}
                <div className={`pt-2 border-t flex items-center justify-between ${isOrganicLight ? 'border-[#E2DDD5]' : isOrganicDark ? 'border-[#2E3833]' : 'border-white/10'}`}>
                  <button
                    onClick={() => {
                      setShowControlsPopover(false);
                      setModal('admin');
                    }}
                    className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-mono font-semibold transition-all ${
                      isOrganicLight
                        ? 'text-[#555555] hover:text-[#333333] hover:bg-[#E5DFD7]'
                        : isOrganicDark
                        ? 'text-[#A3ACA7] hover:text-[#FAF8F5] hover:bg-white/10'
                        : 'text-slate-400 hover:text-green-400 hover:bg-white/5'
                    }`}
                    title="Launch Admin & Debug Terminal"
                  >
                    <Terminal className="w-3.5 h-3.5" />
                    <span>Admin Terminal</span>
                  </button>

                  <span className={`text-[10px] font-mono ${isOrganicLight ? 'text-[#888888]' : isOrganicDark ? 'text-[#8A9490]' : 'text-slate-500'}`}>
                    ATI v3.2.1
                  </span>
                </div>

              </div>
            )}
          </div>

        </div>

      </div>
    </header>
  );
};
