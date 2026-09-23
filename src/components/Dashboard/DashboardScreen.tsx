import React, { useState, useEffect } from 'react';
import { useGameStore } from '../../stores/useGameStore';
import { calculateRankStats } from '../../utils/ranks';
import { soundEngine } from '../../services/soundEngine';
import { SwitchProfile } from '../../types/game';
import { UserAvatar } from '../Common/UserAvatar';
import { APP_VERSION } from '../../utils/theme';
import { 
  Play, 
  Zap, 
  Target, 
  Flame, 
  Map, 
  Award, 
  Users, 
  Code2, 
  FileText, 
  Gem, 
  ArrowRight, 
  Sparkles, 
  ShieldCheck, 
  Volume2, 
  ChevronRight,
  Download,
  RefreshCw,
  Compass,
  Sliders,
  BookOpen,
  GraduationCap,
  Leaf,
  Palette,
  Swords,
  Layers,
  CheckCircle2,
  ChevronDown
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { LEVEL_THEMES } from '../../data/levelCurriculum';
import { isSeriousTheme, ORGANIC_PALETTE } from '../../utils/theme';
import { BorderGlow } from '../ReactBits/BorderGlow';
import { KbdKey, NumberTicker } from '../SpectrumUI';
import { Chip, Badge, ProgressBar } from '../HeroUI';
import { MatiksDuelCard } from './MatiksDuelCard';
import { DailyQuestsCard } from './DailyQuestsCard';

export const DashboardScreen: React.FC = () => {
  const { 
    user, 
    level, 
    mode, 
    difficulty, 
    category,
    wpm, 
    emeralds, 
    dailyStreak, 
    unlockedLevels,
    switchProfile,
    isMuted,
    setScreen, 
    setModal,
    setCategory,
    setMode,
    setSwitchProfile,
    fetchNewBatch,
    updateAvailable,
    updateInfo,
    checkForUpdates,
    uiTheme,
    setUITheme,
    requestLaunchSession
  } = useGameStore();

  const [showSwitchboard, setShowSwitchboard] = useState(false);

  const isOrganicLight = uiTheme === 'organic';
  const isOrganicDark = uiTheme === 'organic-dark';
  const isOrganic = isOrganicLight || isOrganicDark;
  const isSerious = !isOrganic && isSeriousTheme(category, mode);
  const rankStats = calculateRankStats(level, user.best_wpm || wpm, mode, difficulty);

  // Switch sound profiles
  const switchProfiles: { id: SwitchProfile; name: string; tag: string; icon: string }[] = [
    { id: 'cherry-blue', name: 'Cherry Blue', tag: 'Clicky', icon: '🍒' },
    { id: 'cherry-red', name: 'Cherry Red', tag: 'Linear', icon: '🔴' },
    { id: 'topre', name: 'Topre', tag: 'Thock', icon: '🔵' },
    { id: 'hall-effect', name: 'Hall Effect', tag: 'Magnetic', icon: '⚡' },
    { id: 'holy-panda', name: 'Holy Panda', tag: 'Tactile', icon: '🐼' },
    { id: 'model-m', name: 'IBM Model M', tag: 'Buckling', icon: '⌨️' },
  ];

  const nextBossLevel = level <= 40 ? 40 : level <= 80 ? 80 : level <= 120 ? 120 : level <= 160 ? 160 : 200;
  const levelsUntilBoss = Math.max(0, nextBossLevel - level);

  const handleStartTyping = () => {
    requestLaunchSession(level);
  };

  const handleSelectMode = (newCategory: 'Literature' | 'Coding', newMode: 'Words' | 'Code') => {
    setCategory(newCategory);
    setMode(newMode);
  };

  // Keyboard shortcut: Space or Enter on dashboard starts typing immediately!
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input/textarea
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) return;
      if (e.code === 'Space' || e.code === 'Enter') {
        e.preventDefault();
        handleStartTyping();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [category, mode, level]);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="w-full max-w-[1760px] mx-auto px-4 sm:px-8 xl:px-12 py-6 sm:py-8 flex flex-col gap-7 pb-24 select-none"
    >
      {/* ── UPDATE ALERT BANNER (If New Release Available) ─────────── */}
      {updateAvailable && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-cyan-950/80 via-slate-900/90 to-emerald-950/80 border border-cyan-400/40 p-4 shadow-[0_0_30px_rgba(0,245,255,0.15)] flex flex-col sm:flex-row items-center justify-between gap-4"
        >
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-cyan-500/20 border border-cyan-400 text-cyan-300 animate-pulse">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <div className="text-sm font-bold text-white flex items-center gap-2">
                New OTA Update Available: <span className="text-cyan-300 font-mono font-black">v{updateInfo?.version || APP_VERSION}</span>
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">Verified</span>
              </div>
              <p className="text-xs text-gray-400 font-mono mt-0.5">
                {updateInfo?.changelog ? updateInfo.changelog.slice(0, 95) + '...' : 'Fresh binary updates ready for automatic 1-click install.'}
              </p>
            </div>
          </div>
          <button
            onClick={() => setModal('update')}
            className="w-full sm:w-auto px-5 py-2 text-xs font-mono font-bold bg-gradient-to-r from-cyan-500 to-emerald-400 text-black rounded-xl hover:shadow-[0_0_20px_rgba(0,245,255,0.4)] transition-all flex items-center justify-center gap-1.5 font-black"
          >
            <Download className="w-3.5 h-3.5" />
            UPDATE NOW
          </button>
        </motion.div>
      )}

      {/* ── STARTER ACADEMY BANNER ─────────────────────────────────── */}
      <div className={`relative overflow-hidden rounded-2xl border p-4 flex flex-col sm:flex-row items-center justify-between gap-4 transition-all ${
        isOrganicLight
          ? 'bg-gradient-to-r from-[#F4F0EA] via-white to-[#FAF8F5] border-[#E5DFD7] shadow-sm'
          : isOrganicDark
          ? 'bg-[#1C211E] border-[#2E3531] text-[#FAF8F5] shadow-sm'
          : 'bg-gradient-to-r from-blue-950/60 via-slate-900/80 to-cyan-950/60 border-cyan-500/30 shadow-[0_0_30px_rgba(0,245,255,0.08)]'
      }`}>
        <div className="flex items-center gap-3">
          <div className={`p-2.5 rounded-xl border ${
            isOrganicLight
              ? 'bg-[#7C8D81]/15 border-[#7C8D81]/30 text-[#7C8D81]'
              : isOrganicDark
              ? 'bg-[#8FA896]/20 border-[#8FA896]/40 text-[#8FA896]'
              : 'bg-cyan-500/20 border-cyan-400/50 text-cyan-300'
          }`}>
            <GraduationCap className="w-5 h-5" />
          </div>
          <div>
            <div className={`text-sm font-bold flex items-center gap-2 ${isOrganicLight ? 'text-[#333333]' : 'text-white'}`}>
              New to Touch Typing? <span className={isOrganicLight ? 'text-[#7C8D81]' : isOrganicDark ? 'text-[#8FA896]' : 'text-cyan-300'}>Starter Academy &amp; Practice Drill</span>
              <span className={`text-[10px] uppercase font-mono px-2 py-0.5 rounded-full border ${
                isOrganicLight
                  ? 'bg-[#EBC078]/25 text-[#8F661B] border-[#EBC078]/40'
                  : isOrganicDark
                  ? 'bg-[#D98A66]/20 text-[#D98A66] border-[#D98A66]/40'
                  : 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30'
              }`}>Beginner Friendly</span>
            </div>
            <p className={`text-xs mt-0.5 ${isOrganicLight ? 'text-[#616864]' : 'text-gray-400'}`}>
              Learn Home Row anchors (F &amp; J bumps), muscle memory rules, and try interactive finger drills.
            </p>
          </div>
        </div>
        <button
          onClick={() => setScreen('tutorial')}
          className={`w-full sm:w-auto px-5 py-2 text-xs font-mono font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 whitespace-nowrap ${
            isOrganicLight
              ? 'bg-[#7C8D81] text-white hover:bg-[#68786D] shadow-sm'
              : isOrganicDark
              ? 'bg-[#8FA896]/25 border border-[#8FA896]/40 text-[#8FA896] hover:bg-[#8FA896]/35'
              : 'bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-400/40 text-cyan-200'
          }`}
        >
          <span>OPEN TUTORIAL</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* ── CENTRAL HERO COMMAND CENTER: 1-CLICK LAUNCHPAD ────────── */}
      <BorderGlow
        edgeSensitivity={28}
        glowRadius={42}
        borderRadius={28}
        glowIntensity={1.15}
        coneSpread={28}
        animated={false}
        backgroundColor={isOrganicLight ? '#FAF8F5' : isOrganicDark ? '#141716' : isSerious ? '#020617' : '#07090e'}
        glowColor={isOrganicLight ? '140 20 60' : isOrganicDark ? '150 20 40' : isSerious ? '160 80 50' : '190 100 60'}
        colors={
          isOrganicLight
            ? ['#7C8D81', '#C97D5A', '#EBC078']
            : isOrganicDark
            ? ['#8FA896', '#D98A66', '#EBC078']
            : isSerious
            ? ['#10b981', '#14b8a6', '#06b6d4']
            : ['#00f5ff', '#b388ff', '#ff1744']
        }
        className={`w-full transition-all duration-400 ${
          isOrganicLight ? 'shadow-organic-card' : isOrganicDark ? 'shadow-2xl' : ''
        }`}
      >
        <div className={`relative overflow-hidden rounded-3xl p-6 sm:p-10 text-center flex flex-col items-center gap-6 w-full ${
          isOrganicLight
            ? 'bg-white/95'
            : isOrganicDark
            ? 'bg-[#1C211E] border border-[#2E3531]'
            : isSerious
            ? 'bg-slate-950/85'
            : 'bg-slate-950/70'
        }`}>
          {/* Ambient Glow Aura */}
          <div className={`absolute -top-24 left-1/2 -translate-x-1/2 w-96 h-96 rounded-full blur-3xl pointer-events-none transition-all duration-500 ${
            isOrganicLight ? 'bg-[#7C8D81]/12' : isOrganicDark ? 'bg-[#8FA896]/15' : isSerious ? 'bg-emerald-500/18' : 'bg-cyan-500/15'
          }`} />
          <div className={`absolute -bottom-24 left-1/2 -translate-x-1/2 w-96 h-96 rounded-full blur-3xl pointer-events-none transition-all duration-500 ${
            isOrganicLight ? 'bg-[#C97D5A]/10' : isOrganicDark ? 'bg-[#D98A66]/15' : isSerious ? 'bg-teal-500/15' : 'bg-purple-500/10'
          }`} />

          {/* User Identity & Rank Pill */}
          <div className="relative z-10 flex items-center gap-3">
            <div 
              onClick={() => setModal('account')}
              className={`w-12 h-12 rounded-2xl border-2 flex items-center justify-center text-2xl cursor-pointer hover:scale-105 transition-all flex-shrink-0 overflow-hidden ${
                isOrganic
                  ? 'bg-gradient-to-br from-[#7C8D81]/20 to-[#C97D5A]/20 border-[#7C8D81]/40 shadow-sm'
                  : isSerious
                  ? 'bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border-emerald-400/40 shadow-neon-emerald'
                  : 'bg-gradient-to-br from-cyan-500/20 to-purple-500/20 border-cyan-400/40 shadow-neon-cyan'
              }`}
              title="Click to customize avatar & account"
            >
              <UserAvatar avatar={user.avatar} name={user.name} className="w-full h-full" />
            </div>
            <div className="text-left">
              <div className="flex items-center gap-2">
                <span className={`font-extrabold text-sm tracking-wide ${isOrganicLight ? 'text-[#333333]' : 'text-[#FAF8F5]'}`}>{user.name}</span>
                {user.email && (
                  <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.2 rounded border border-emerald-400/30 font-bold flex items-center gap-0.5">
                    <ShieldCheck className="w-2.5 h-2.5 text-emerald-400" /> G
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 text-xs">
                <span 
                  className="font-bold px-2 py-0.5 rounded-full border text-[11px]"
                  style={{ 
                    color: rankStats.rank.color,
                    borderColor: `${rankStats.rank.color}40`,
                    backgroundColor: `${rankStats.rank.color}15`
                  }}
                >
                  {rankStats.rank.name}
                </span>
                <span className={`font-mono text-[11px] ${isOrganicLight ? 'text-[#616864]' : isOrganicDark ? 'text-[#8FA896]' : 'text-slate-400'}`}>Level {level}</span>
              </div>
            </div>
          </div>

          {/* Current Stage Headline */}
          <div className="relative z-10 space-y-1">
            <div className={`text-xs font-mono uppercase tracking-widest font-bold flex items-center justify-center gap-1.5 ${
              isOrganicLight ? 'text-[#7C8D81]' : isOrganicDark ? 'text-[#8FA896]' : isSerious ? 'text-emerald-400' : 'text-cyan-400'
            }`}>
              {isOrganic ? (
                <>
                  <Leaf className={`w-4 h-4 ${isOrganicLight ? 'text-[#7C8D81]' : 'text-[#8FA896]'}`} /> Stage {level} of 200 &bull; {LEVEL_THEMES[(level - 1) % LEVEL_THEMES.length]}
                </>
              ) : isSerious ? (
                <>
                  <Code2 className="w-4 h-4 text-emerald-400" /> Stage {level} • Serious Coding Syntax Drill
                </>
              ) : (
                <>
                  <Compass className="w-4 h-4" /> Stage {level} of 200 &bull; {LEVEL_THEMES[(level - 1) % LEVEL_THEMES.length]}
                </>
              )}
            </div>
            <h1 className={`font-display font-black text-3xl sm:text-4xl lg:text-5xl tracking-tight ${
              isOrganicLight ? 'text-[#333333]' : 'text-[#FAF8F5]'
            }`}>
              Touch Typing Practice
            </h1>
            <p className={`text-xs sm:text-sm max-w-2xl mx-auto leading-relaxed ${isOrganicLight ? 'text-[#5D6661]' : isOrganicDark ? 'text-[#A3ACA7]' : 'text-slate-400'}`}>
              Master muscle memory, accuracy, and typing speed step-by-step.
            </p>
          </div>

          {/* ── 2-WAY MODE SELECTOR: LITERATURE vs CODING ───────────── */}
          <div className={`relative z-10 flex items-center justify-center p-1.5 rounded-2xl border gap-2 max-w-xl w-full shadow-inner ${
            isOrganicLight
              ? 'bg-[#EAE6DF] border-[#DDD8CE]'
              : isOrganicDark
              ? 'bg-[#141716] border-[#2E3531]'
              : 'bg-slate-900/90 border-white/10'
          }`}>
            <button
              onClick={() => handleSelectMode('Literature', 'Words')}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl font-mono text-xs font-bold transition-all ${
                category === 'Literature'
                  ? isOrganicLight
                    ? 'bg-[#7C8D81] text-white shadow-organic-sage'
                    : isOrganicDark
                    ? 'bg-[#7C8D81] text-white shadow-md'
                    : 'bg-gradient-to-r from-cyan-500/25 to-blue-500/25 border border-cyan-400 text-cyan-300 shadow-neon-cyan'
                  : isOrganicLight
                  ? 'text-[#5D6661] hover:text-[#1C221F] hover:bg-white/60'
                  : isOrganicDark
                  ? 'text-[#8FA896] hover:text-[#FAF8F5] hover:bg-white/5'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <BookOpen className={`w-4 h-4 ${isOrganic ? (category === 'Literature' ? 'text-white' : isOrganicDark ? 'text-[#8FA896]' : 'text-[#7C8D81]') : 'text-cyan-400'}`} />
              <span>📚 Story / English</span>
            </button>

            <button
              onClick={() => handleSelectMode('Coding', 'Code')}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl font-mono text-xs font-bold transition-all ${
                category === 'Coding'
                  ? isOrganicLight
                    ? 'bg-[#C97D5A] text-white shadow-organic-terracotta'
                    : isOrganicDark
                    ? 'bg-[#D98A66] text-[#141716] font-black shadow-md'
                    : 'bg-gradient-to-r from-emerald-500/30 to-teal-500/30 border border-emerald-400 text-emerald-300 shadow-neon-emerald'
                  : isOrganicLight
                  ? 'text-[#5D6661] hover:text-[#1C221F] hover:bg-white/60'
                  : isOrganicDark
                  ? 'text-[#8FA896] hover:text-[#FAF8F5] hover:bg-white/5'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Code2 className={`w-4 h-4 ${isOrganic ? (category === 'Coding' ? (isOrganicDark ? 'text-[#141716]' : 'text-white') : isOrganicDark ? 'text-[#D98A66]' : 'text-[#C97D5A]') : 'text-emerald-400'}`} />
              <span>💻 Coding Syntax</span>
            </button>
          </div>

          {/* ── GIANT GLOWING PRIMARY CALL-TO-ACTION BUTTON ─────────── */}
          <div className="relative z-10 w-full max-w-xl">
            <button
              onClick={handleStartTyping}
              className={`w-full group relative overflow-hidden py-4 sm:py-5 px-8 rounded-2xl font-display font-black text-lg sm:text-xl hover:scale-[1.01] active:scale-[0.98] transition-all flex items-center justify-center gap-3 tracking-wider ${
                isOrganic
                  ? 'bg-[#C97D5A] hover:bg-[#B86B49] text-white shadow-organic-terracotta hover:shadow-[0_12px_32px_rgba(201,125,90,0.45)]'
                  : isSerious
                  ? 'bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-500 hover:from-emerald-300 hover:via-teal-300 hover:to-cyan-400 text-black shadow-[0_0_40px_rgba(16,185,129,0.45)] hover:shadow-[0_0_60px_rgba(16,185,129,0.7)]'
                  : 'bg-gradient-to-r from-cyan-500 via-blue-500 to-indigo-600 hover:from-cyan-400 hover:via-blue-400 hover:to-indigo-500 text-black shadow-[0_0_40px_rgba(0,245,255,0.4)] hover:shadow-[0_0_60px_rgba(0,245,255,0.7)]'
              }`}
            >
              {isSerious ? <Code2 className="w-6 h-6 fill-current" /> : <Play className={`w-6 h-6 fill-current ${isOrganic ? 'text-white' : ''}`} />}
              <span>{isSerious ? 'LAUNCH SYNTAX DRILL' : isOrganic ? 'START TYPING PRACTICE' : 'START TYPING NOW'}</span>
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1.5 transition-transform" />
            </button>
            <div className={`text-[11px] font-mono mt-3 flex items-center justify-center gap-1.5 flex-wrap ${isOrganic ? 'text-[#616C66]' : 'text-slate-400'}`}>
              <span>Tip: Press</span>
              <KbdKey keyName="space" size="sm" onPress={handleStartTyping}>Space</KbdKey>
              <span>or</span>
              <KbdKey keyName="enter" size="sm" onPress={handleStartTyping}>Enter</KbdKey>
              <span>to launch instantly</span>
            </div>
          </div>
        </div>
      </BorderGlow>

      {/* ── COMPACT 3-PILLAR TELEMETRY BAR (HeroUI Powered) ────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
        {/* Peak Velocity */}
        <div className={`glass-panel p-5 sm:p-6 rounded-2xl flex flex-col gap-3 transition-all smooth-lift ${
          isOrganicLight ? 'bg-white/95 border-[#E8E4DC]' : 'border-cyan-500/20'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`p-2.5 rounded-xl border ${
                isOrganicLight 
                  ? 'bg-[#7C8D81]/15 border-[#7C8D81]/30 text-[#586B60]' 
                  : 'bg-cyan-500/10 border-cyan-500/20 text-cyan-400'
              }`}>
                <Zap className="w-5 h-5" />
              </div>
              <div>
                <div className={`text-[10px] font-bold uppercase tracking-wider font-mono ${isOrganicLight ? 'text-[#758079]' : 'text-slate-400'}`}>Personal Best</div>
                <div className={`text-2xl sm:text-3xl font-mono font-black ${isOrganicLight ? 'text-[#1C221F]' : 'text-white'}`}>
                  <NumberTicker value={user.best_wpm || 0} /> <span className={`text-xs font-sans font-normal ${isOrganicLight ? 'text-[#616C66]' : 'text-slate-400'}`}>WPM</span>
                </div>
              </div>
            </div>
            <Chip size="sm" variant="soft" color="primary">
              Target {Math.round(25 + level * 0.45)}
            </Chip>
          </div>
          <ProgressBar
            value={user.best_wpm || 0}
            minValue={0}
            maxValue={Math.max(100, Math.round(25 + level * 0.45))}
            size="sm"
            color="primary"
          />
        </div>

        {/* Tactile Precision */}
        <div className={`glass-panel p-5 sm:p-6 rounded-2xl flex flex-col gap-3 transition-all smooth-lift ${
          isOrganicLight ? 'bg-white/95 border-[#E8E4DC]' : 'border-emerald-500/20'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`p-2.5 rounded-xl border ${
                isOrganicLight 
                  ? 'bg-[#5EAA7C]/15 border-[#5EAA7C]/30 text-[#3A7E54]' 
                  : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
              }`}>
                <Target className="w-5 h-5" />
              </div>
              <div>
                <div className={`text-[10px] font-bold uppercase tracking-wider font-mono ${isOrganicLight ? 'text-[#758079]' : 'text-slate-400'}`}>Accuracy</div>
                <div className={`text-2xl sm:text-3xl font-mono font-black ${isOrganicLight ? 'text-[#286043]' : 'text-emerald-400'}`}>
                  <NumberTicker value={user.avg_acc || 100} suffix="%" />
                </div>
              </div>
            </div>
            <Chip
              size="sm"
              variant="solid"
              color={(user.avg_acc || 100) >= 96 ? 'success' : 'warning'}
            >
              {(user.avg_acc || 100) >= 96 ? '★ S-Tier' : '● Solid'}
            </Chip>
          </div>
          <ProgressBar
            value={user.avg_acc || 100}
            minValue={50}
            maxValue={100}
            size="sm"
            color="success"
          />
        </div>

        {/* Daily Streak */}
        <div 
          onClick={() => setModal('streak')}
          className={`glass-panel p-5 sm:p-6 rounded-2xl flex flex-col gap-3 cursor-pointer transition-all group smooth-lift ${
            isOrganicLight ? 'bg-white/95 border-[#E8E4DC] hover:border-[#EBC078]' : 'border-amber-500/20 hover:border-amber-400/40'
          }`}
          title="Click to claim daily rewards"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Badge.Anchor>
                <div className={`p-2.5 rounded-xl border group-hover:scale-110 transition-transform ${
                  isOrganicLight 
                    ? 'bg-[#EBC078]/20 border-[#EBC078]/40 text-[#8C6418]' 
                    : 'bg-amber-500/10 border-amber-500/20 text-amber-400'
                }`}>
                  <Flame className="w-5 h-5" />
                </div>
                <Badge size="sm" color="warning" isDot isPulse placement="top-right" />
              </Badge.Anchor>
              <div>
                <div className={`text-[10px] font-bold uppercase tracking-wider font-mono ${isOrganicLight ? 'text-[#758079]' : 'text-slate-400'}`}>Active Streak</div>
                <div className={`text-2xl sm:text-3xl font-mono font-black ${isOrganicLight ? 'text-[#A05C14]' : 'text-amber-400'}`}>
                  <NumberTicker value={dailyStreak || 1} /> <span className={`text-xs font-sans font-normal ${isOrganicLight ? 'text-[#616C66]' : 'text-slate-400'}`}>Days</span>
                </div>
              </div>
            </div>
            <div className={`text-right font-mono text-[11px] flex items-center gap-0.5 ${isOrganicLight ? 'text-[#8C6418]' : 'text-amber-300'}`}>
              <span>Claim</span> <ChevronRight className="w-3.5 h-3.5" />
            </div>
          </div>
          <ProgressBar
            value={Math.min(7, dailyStreak || 1)}
            minValue={0}
            maxValue={7}
            size="sm"
            color="warning"
            label={<span className={`text-[10px] ${isOrganicLight ? 'text-[#616C66]' : 'text-slate-400'}`}>Weekly Cycle</span>}
            showValueLabel
            valueLabel={<span className="text-[10px]">{dailyStreak || 1}/7d</span>}
          />
        </div>
      </div>

      {/* ── MATIKS 1v1 COMPETITIVE ESPORTS & DAILY RETENTION BOARD ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <MatiksDuelCard />
        <DailyQuestsCard />
      </div>

      {/* ── 4 CLEAN TRAINING & MODE CARDS (NO NOISE) ──────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* 1. Level Map */}
        <div 
          onClick={() => setScreen('map')}
          className={`glass-panel p-5 rounded-2xl border cursor-pointer transition-all smooth-lift flex flex-col justify-between gap-3 group ${
            isOrganicLight
              ? 'bg-white/95 border-[#E8E4DC] hover:border-[#2E5E4E]/40 shadow-sm'
              : 'border-white/10 hover:border-cyan-400/40'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className={`p-2.5 rounded-xl border transition-colors ${
              isOrganicLight
                ? 'bg-[#2E5E4E]/10 text-[#245041] border-[#2E5E4E]/25 group-hover:bg-[#2E5E4E]/20'
                : 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20 group-hover:bg-cyan-500/20'
            }`}>
              <Map className="w-5 h-5" />
            </div>
            <span className={`text-xs font-mono font-semibold ${isOrganicLight ? 'text-[#758079]' : 'text-slate-400'}`}>{unlockedLevels}/200</span>
          </div>
          <div>
            <h3 className={`font-bold text-sm transition-colors ${
              isOrganicLight ? 'text-[#1C221F] group-hover:text-[#245041]' : 'text-white group-hover:text-cyan-300'
            }`}>Level Map</h3>
            <p className={`text-xs mt-0.5 ${isOrganicLight ? 'text-[#616C66]' : 'text-slate-400'}`}>Browse all 200 stages across 5 chapters</p>
          </div>
        </div>

        {/* 2. Cyber Multiplayer */}
        <div 
          onClick={() => setScreen('multiplayer')}
          className={`glass-panel p-5 rounded-2xl border cursor-pointer transition-all smooth-lift flex flex-col justify-between gap-3 group ${
            isOrganicLight
              ? 'bg-white/95 border-[#E8E4DC] hover:border-purple-500/40 shadow-sm'
              : 'border-white/10 hover:border-purple-400/40'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className={`p-2.5 rounded-xl border transition-colors ${
              isOrganicLight
                ? 'bg-purple-500/10 text-purple-700 border-purple-500/25 group-hover:bg-purple-500/20'
                : 'bg-purple-500/10 text-purple-400 border-purple-500/20 group-hover:bg-purple-500/20'
            }`}>
              <Users className="w-5 h-5" />
            </div>
            <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border font-bold ${
              isOrganicLight
                ? 'bg-purple-100 text-purple-800 border-purple-200'
                : 'bg-purple-500/20 text-purple-300 border-purple-400/30'
            }`}>Live</span>
          </div>
          <div>
            <h3 className={`font-bold text-sm transition-colors ${
              isOrganicLight ? 'text-[#1C221F] group-hover:text-purple-700' : 'text-white group-hover:text-purple-300'
            }`}>Multiplayer Arena</h3>
            <p className={`text-xs mt-0.5 ${isOrganicLight ? 'text-[#616C66]' : 'text-slate-400'}`}>Race live against friends with custom room codes</p>
          </div>
        </div>

        {/* 3. Boss Arena */}
        <div 
          onClick={() => { setScreen('game'); }}
          className={`glass-panel p-5 rounded-2xl border cursor-pointer transition-all smooth-lift flex flex-col justify-between gap-3 group ${
            isOrganicLight
              ? 'bg-white/95 border-[#E8E4DC] hover:border-red-500/40 shadow-sm'
              : 'border-white/10 hover:border-red-400/40'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className={`p-2.5 rounded-xl border transition-colors ${
              isOrganicLight
                ? 'bg-red-500/10 text-red-700 border-red-500/25 group-hover:bg-red-500/20'
                : 'bg-red-500/10 text-red-400 border-red-500/20 group-hover:bg-red-500/20'
            }`}>
              <Swords className="w-5 h-5" />
            </div>
            <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border font-bold ${
              isOrganicLight
                ? 'bg-red-100 text-red-800 border-red-200'
                : 'bg-red-500/20 text-red-300 border-red-400/30'
            }`}>
              {levelsUntilBoss === 0 ? 'ACTIVE!' : `In ${levelsUntilBoss} stg`}
            </span>
          </div>
          <div>
            <h3 className={`font-bold text-sm transition-colors ${
              isOrganicLight ? 'text-[#1C221F] group-hover:text-red-700' : 'text-white group-hover:text-red-300'
            }`}>Boss Showdown</h3>
            <p className={`text-xs mt-0.5 ${isOrganicLight ? 'text-[#616C66]' : 'text-slate-400'}`}>Overpower cyber bosses with high-accuracy laser barrages</p>
          </div>
        </div>

        {/* 4. Custom Practice Mode */}
        <div 
          onClick={() => setModal('customPractice')}
          className={`glass-panel p-5 rounded-2xl border cursor-pointer transition-all smooth-lift flex flex-col justify-between gap-3 group ${
            isOrganicLight
              ? 'bg-white/95 border-[#E8E4DC] hover:border-blue-500/40 shadow-sm'
              : 'border-white/10 hover:border-blue-400/40'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className={`p-2.5 rounded-xl border transition-colors ${
              isOrganicLight
                ? 'bg-blue-500/10 text-blue-700 border-blue-500/25 group-hover:bg-blue-500/20'
                : 'bg-blue-500/10 text-blue-400 border-blue-500/20 group-hover:bg-blue-500/20'
            }`}>
              <FileText className="w-5 h-5" />
            </div>
            <span className={`text-xs font-mono font-semibold ${isOrganicLight ? 'text-[#758079]' : 'text-slate-400'}`}>Custom</span>
          </div>
          <div>
            <h3 className={`font-bold text-sm transition-colors ${
              isOrganicLight ? 'text-[#1C221F] group-hover:text-blue-700' : 'text-white group-hover:text-blue-300'
            }`}>Custom Text & Code</h3>
            <p className={`text-xs mt-0.5 ${isOrganicLight ? 'text-[#616C66]' : 'text-slate-400'}`}>Paste any essay, article, or source code to practice</p>
          </div>
        </div>
      </div>

      {/* ── EXPANDABLE DRAWER: ACOUSTIC SWITCH SOUNDBOARD ─────────── */}
      <div className={`glass-panel rounded-2xl border overflow-hidden transition-all ${
        isOrganicLight ? 'bg-white/95 border-[#E8E4DC] shadow-sm' : 'border-white/10'
      }`}>
        <button
          onClick={() => setShowSwitchboard(!showSwitchboard)}
          className={`w-full p-4 flex items-center justify-between text-xs font-mono font-bold transition-colors smooth-press ${
            isOrganicLight ? 'text-[#2E3531] hover:text-[#1C221F]' : 'text-slate-300 hover:text-white'
          }`}
        >
          <div className="flex items-center gap-2">
            <Sliders className={`w-4 h-4 ${isOrganicLight ? 'text-[#245041]' : 'text-cyan-400'}`} />
            <span>Mechanical Switch Acoustic Synthesizer</span>
            <span className={`text-[10px] ${isOrganicLight ? 'text-[#758079]' : 'text-slate-500'}`}>(Active: {switchProfiles.find(s => s.id === switchProfile)?.name})</span>
          </div>
          <span className={`text-xs font-bold ${isOrganicLight ? 'text-[#245041]' : 'text-cyan-400'}`}>{showSwitchboard ? 'Hide ▲' : 'Open Soundboard ▼'}</span>
        </button>

        <AnimatePresence>
          {showSwitchboard && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className={`px-4 pb-4 border-t pt-3 ${isOrganicLight ? 'border-[#E8E4DC]' : 'border-white/5'}`}
            >
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
                {switchProfiles.map((sw) => (
                  <button
                    key={sw.id}
                    onClick={() => {
                      setSwitchProfile(sw.id);
                      soundEngine.playKey(false);
                    }}
                    className={`p-3 rounded-xl border text-left transition-all smooth-press ${
                      switchProfile === sw.id
                        ? isOrganicLight
                          ? 'bg-[#2E5E4E]/12 border-[#2E5E4E] text-[#1C221F] font-bold shadow-sm'
                          : 'bg-cyan-500/20 border-cyan-400 text-white shadow-neon-cyan font-bold'
                        : isOrganicLight
                          ? 'bg-[#FAF8F5] border-[#E8E4DC] text-[#4A544E] hover:border-[#2E5E4E]/40 hover:text-[#1C221F]'
                          : 'bg-slate-900/60 border-white/10 text-slate-400 hover:border-white/20 hover:text-white'
                    }`}
                  >
                    <div className="text-lg mb-1">{sw.icon}</div>
                    <div className="text-xs font-bold truncate">{sw.name}</div>
                    <div className={`text-[10px] ${isOrganicLight ? 'text-[#758079]' : 'text-slate-500'}`}>{sw.tag}</div>
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
 
      {/* ── FOOTER KEYBOARD SHORTCUT & SCROLL AFFORDANCE ──────────── */}
      <div className="flex items-center justify-center gap-2 text-xs font-mono opacity-50 py-3 select-none">
        <span>Tip: Press <kbd className="px-1.5 py-0.5 rounded bg-black/10 dark:bg-white/10 font-bold">Space</kbd> or <kbd className="px-1.5 py-0.5 rounded bg-black/10 dark:bg-white/10 font-bold">Enter</kbd> to launch typing session &bull; Scroll for Switchboard</span>
      </div>

    </motion.div>
  );
};

