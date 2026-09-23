import React, { useEffect, useRef, useState } from 'react';
import { useGameStore } from '../../stores/useGameStore';
import { motion, AnimatePresence } from 'framer-motion';
import { TypingMode, Difficulty, TimedDuration } from '../../types/game';
import { 
  RotateCcw, 
  Activity, 
  Target, 
  Clock, 
  Sparkles,
  Zap,
  Code2,
  FileText,
  AlignLeft,
  BookOpen,
  Type,
  Keyboard
} from 'lucide-react';
import { BossArena } from '../BossFight/BossArena';
import { VirtualKeyboard } from './VirtualKeyboard';
import { UserAvatar } from '../Common/UserAvatar';
import { isSeriousTheme, isOrganicTheme, isOrganicLight, isOrganicDark } from '../../utils/theme';
import { KbdKey } from '../SpectrumUI';
import { SlidingNumber } from '../ui/sliding-number';

export const TypingEngine: React.FC = () => {
  const {
    words,
    currentWordIndex,
    currentInput,
    typedWords,
    jumpToWord,
    wpm,
    rawWpm,
    accuracy,
    elapsedSeconds,
    startTime,
    currentStreak,
    totalErrors,
    mode,
    difficulty,
    category,
    boss,
    level,
    user,
    ghostMode,
    ghostPacingMode,
    timedDuration,
    equippedBoosters,
    typoShieldsRemaining,
    lastShieldAbsorbTime,
    setGhostMode,
    setGhostPacingMode,
    setTimedDuration,
    finishSession,
    recordKeystrokeInterval,
    recordShiftLatency,
    handleKeyInput,
    fetchNewBatch,
    setMode,
    setDifficulty,
    setCategory,
    setScreen,
    uiTheme,
    sessionGemsEarned,
    levelMaxGemsCap,
    lastWordGemResult,
    aiWeakKeys,
    fetchWeakSpots,
    isDuel,
    duelOpponent,
    isSuddenDeath,
    cleanWordsInRow,
    comboMultiplierValue,
  } = useGameStore();

  const isOrganic = isOrganicTheme(uiTheme);
  const isOrganicLightMode = isOrganicLight(uiTheme);
  const isOrganicDarkMode = isOrganicDark(uiTheme);
  const isSerious = !isOrganic && isSeriousTheme(category, mode);

  const [showKeyboard, setShowKeyboard] = useState(true);
  const [lastKey, setLastKey] = useState<string>('');
  const [isGlitching, setIsGlitching] = useState<boolean>(false);
  const [liveElapsed, setLiveElapsed] = useState<number>(0);
  const prevErrorsRef = useRef<number>(totalErrors);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const activeWordRef = useRef<HTMLSpanElement>(null);
  const wordsScrollRef = useRef<HTMLDivElement>(null);

  // Load AI detected weak spots if not already cached
  useEffect(() => {
    fetchWeakSpots().catch(() => {});
  }, [fetchWeakSpots]);

  // Live keystroke biometric telemetry refs
  const lastKeyTimeRef = useRef<number | null>(null);
  const shiftDownTimeRef = useRef<number | null>(null);
  const liveIntervalsRef = useRef<number[]>([]);
  const liveShiftLatenciesRef = useRef<number[]>([]);

  // Smooth auto-scroll long texts (Paragraphs & Pages mode) so active word stays centered
  useEffect(() => {
    if (activeWordRef.current && wordsScrollRef.current) {
      const activeEl = activeWordRef.current;
      const containerEl = wordsScrollRef.current;
      const activeTop = activeEl.offsetTop;
      const activeHeight = activeEl.offsetHeight;
      const containerHeight = containerEl.clientHeight;
      const targetScroll = activeTop - (containerHeight / 2) + (activeHeight / 2);
      containerEl.scrollTo({
        top: Math.max(0, targetScroll),
        behavior: 'smooth'
      });
    }
  }, [currentWordIndex]);

  // Trigger brief glitch/shake on mistype (suppressed by Zen Anti-Stress)
  useEffect(() => {
    if (totalErrors > prevErrorsRef.current) {
      const isZenNullified = !!(equippedBoosters['booster-zen-anti-stress'] || equippedBoosters['forge-tranquil-overdrive']);
      if (!isZenNullified) {
        setIsGlitching(true);
        const timer = setTimeout(() => setIsGlitching(false), 280);
        prevErrorsRef.current = totalErrors;
        return () => clearTimeout(timer);
      }
    }
    prevErrorsRef.current = totalErrors;
  }, [totalErrors, equippedBoosters]);

  // Initialize or fetch text on mount
  useEffect(() => {
    lastKeyTimeRef.current = null;
    shiftDownTimeRef.current = null;
    liveIntervalsRef.current = [];
    liveShiftLatenciesRef.current = [];
    fetchNewBatch();
  }, [mode, difficulty, level]);

  // High-frequency live timer for smooth real-time continuous Ghost pacing and countdown
  useEffect(() => {
    if (!startTime) {
      setLiveElapsed(0);
      return;
    }

    const interval = setInterval(() => {
      const now = Date.now();
      const currentSecs = (now - startTime) / 1000;
      setLiveElapsed(currentSecs);

      // Auto-finish on countdown timer expiration
      if (timedDuration && currentSecs >= timedDuration) {
        clearInterval(interval);
        finishSession(liveIntervalsRef.current, liveShiftLatenciesRef.current);
      }
    }, 50);

    return () => clearInterval(interval);
  }, [startTime, timedDuration, finishSession]);

  const activeElapsed = ghostPacingMode === 'continuous'
    ? (startTime ? liveElapsed : 0)
    : elapsedSeconds;

  const displaySeconds = startTime ? Math.floor(liveElapsed) : elapsedSeconds;
  const timeLeft = timedDuration ? Math.max(0, Math.ceil(timedDuration - (startTime ? liveElapsed : 0))) : null;

  // Keep focus on hidden input without hijacking modal dialogs or text fields
  useEffect(() => {
    inputRef.current?.focus();
    const handleGlobalClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;
      if (
        ['INPUT', 'TEXTAREA', 'BUTTON', 'A', 'SELECT'].includes(target.tagName) ||
        target.closest('input, textarea, button, a, select, [role="dialog"], [role="menu"], [role="menuitem"], [role="combobox"]')
      ) {
        return;
      }
      inputRef.current?.focus();
    };
    window.addEventListener('click', handleGlobalClick);
    return () => window.removeEventListener('click', handleGlobalClick);
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    setLastKey(e.key);
    const now = performance.now();

    if (e.key === 'Shift') {
      if (shiftDownTimeRef.current === null) {
        shiftDownTimeRef.current = now;
      }
      return;
    }

    if (e.key === 'Tab') {
      e.preventDefault();
      fetchNewBatch();
      return;
    }

    // Capture inter-keystroke intervals and shift latencies for active typing keys
    if (e.key.length === 1 || e.key === 'Backspace' || e.key === 'Enter') {
      if (lastKeyTimeRef.current !== null) {
        const interval = Math.round(now - lastKeyTimeRef.current);
        if (interval > 15 && interval < 4000) {
          liveIntervalsRef.current.push(interval);
          recordKeystrokeInterval(interval);
        }
      }
      lastKeyTimeRef.current = now;

      if (e.shiftKey && shiftDownTimeRef.current !== null) {
        const shiftLatency = Math.round(now - shiftDownTimeRef.current);
        if (shiftLatency > 5 && shiftLatency < 2000) {
          liveShiftLatenciesRef.current.push(shiftLatency);
          recordShiftLatency(shiftLatency);
        }
      }
    }

    if (e.key === 'Backspace') {
      e.preventDefault();
      handleKeyInput('', true, e.ctrlKey);
      return;
    }

    // Spacebar word advance
    if (e.key === ' ') {
      e.preventDefault();
      handleKeyInput(' ');
      return;
    }

    // Ignore modifier keys
    if (e.key.length === 1 && !e.ctrlKey && !e.altKey && !e.metaKey) {
      e.preventDefault();
      handleKeyInput(e.key);
    }
  };

  const handleKeyUp = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Shift') {
      shiftDownTimeRef.current = null;
    }
  };

  const modes: { id: TypingMode; label: string; icon: React.ReactNode }[] = [
    { id: 'Words', label: 'Words', icon: <Type className="w-3.5 h-3.5" /> },
    { id: 'Lines', label: 'Lines', icon: <AlignLeft className="w-3.5 h-3.5" /> },
    { id: 'Paragraphs', label: 'Paragraphs', icon: <FileText className="w-3.5 h-3.5" /> },
    { id: 'Pages', label: 'Pages', icon: <BookOpen className="w-3.5 h-3.5" /> },
    { id: 'Code', label: 'Code', icon: <Code2 className="w-3.5 h-3.5" /> },
    { id: 'Time', label: 'Timed', icon: <Clock className="w-3.5 h-3.5" /> },
  ];

  const difficulties: Difficulty[] = ['Easy', 'Normal', 'Hard'];

  const getWpmColor = (val: number) => {
    if (val >= 100) return 'text-cyber-red text-glow-red';
    if (val >= 70) return 'text-amber-400 text-glow-amber';
    if (val >= 40) return 'text-emerald-400 text-glow-green';
    return 'text-cyber-cyan text-glow-cyan';
  };

  const targetGhostWpm = 
    ghostMode === 'pb' ? Math.max(30, user.best_wpm || 50) :
    ghostMode === 'target' ? Math.round(25 + level * 0.45) :
    ghostMode === 'speedster' ? 100 : 0;

  // If chronos time dilator or forged temporal aegis equipped, soften ghost speed
  const ghostDilation = equippedBoosters['forge-temporal-aegis'] ? 0.85 : equippedBoosters['booster-chronos'] ? 0.9 : 1.0;
  const effectiveGhostWpm = Math.round(targetGhostWpm * ghostDilation);

  const totalChars = words.join(' ').length || 1;
  const ghostCharsTyped = (effectiveGhostWpm / 60) * 5 * activeElapsed;
  const ghostProgress = ghostMode === 'off' ? 0 : Math.min(100, Math.round((ghostCharsTyped / totalChars) * 100));
  const deltaWpm = wpm - targetGhostWpm;
  const playerProgress = Math.min(100, Math.round((currentWordIndex / Math.max(1, words.length)) * 100));
  const isPlayerLeading = deltaWpm >= 0 && playerProgress > 0;

  const comboTier = 
    currentStreak >= 50 ? 'hyperdrive' : 
    currentStreak >= 25 ? 'supercharged' : 
    currentStreak >= 10 ? 'onfire' : 'normal';

  const comboMultiplier = 
    currentStreak >= 50 ? '3.0x' : 
    currentStreak >= 25 ? '2.0x' : 
    currentStreak >= 10 ? '1.5x' : '1.0x';

  const activeMultiplier = comboMultiplierValue > 1.0 ? `${comboMultiplierValue.toFixed(1)}x` : comboMultiplier;

  // Matiks 1v1 Duel Telemetry
  const rivalTotalWords = Math.max(1, words.length);
  const rivalWordsTyped = duelOpponent ? Math.min(rivalTotalWords, (duelOpponent.targetWpm / 60) * activeElapsed) : 0;
  const rivalProgress = duelOpponent ? Math.min(100, Math.round((rivalWordsTyped / rivalTotalWords) * 100)) : 0;
  const duelLeadWords = Math.round(currentWordIndex - rivalWordsTyped);

  return (
    <div className="w-full max-w-[1720px] mx-auto px-4 sm:px-8 xl:px-12 py-6 sm:py-8 flex flex-col gap-6">
      
      {/* Top Mode & Difficulty Ribbon */}
      <div className="flex flex-wrap items-center justify-between gap-3 sm:gap-4 glass-panel px-4 sm:px-5 py-3 rounded-2xl border border-white/10">
        
        {/* Module Switcher: Normal vs Coding */}
        <div className="flex items-center gap-1 bg-slate-950/80 p-1 rounded-xl border border-white/10 select-none">
          <button
            onClick={() => {
              setCategory('Literature');
              if (mode === 'Code') setMode('Words');
            }}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              category === 'Literature'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/40 shadow-neon-cyan'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <span>📚 Normal</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-400 font-mono hidden sm:inline">Emeralds</span>
          </button>

          <button
            onClick={() => {
              setCategory('Coding');
              setMode('Code');
            }}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              category === 'Coding'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 shadow-neon-emerald'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <span>💻 Coding</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-400 font-mono hidden sm:inline">Serious IDE</span>
          </button>
        </div>

        {/* Mode Selector */}
        <div className="flex items-center gap-1.5 bg-slate-950/60 p-1 rounded-xl border border-white/5">
          {modes.map((m) => (
            <button
              key={m.id}
              onClick={() => {
                setMode(m.id);
                if (m.id === 'Time') {
                  if (!timedDuration) setTimedDuration(30);
                } else {
                  if (timedDuration) setTimedDuration(null);
                }
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                mode === m.id
                  ? isSerious
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 shadow-neon-emerald'
                    : 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/40 shadow-neon-cyan'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              {m.icon}
              {m.label}
            </button>
          ))}
        </div>

        {/* Timed Mode Duration Picker */}
        {mode === 'Time' && (
          <div className="flex items-center gap-1 bg-slate-950/80 p-1 rounded-xl border border-purple-500/30 select-none">
            <span className="text-[10px] text-purple-400 font-mono font-bold px-1.5 hidden sm:inline">Timer:</span>
            {([15, 30, 60, 120] as TimedDuration[]).map((dur) => (
              <button
                key={dur}
                onClick={() => setTimedDuration(dur)}
                className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition-all ${
                  timedDuration === dur
                    ? 'bg-purple-500/30 text-purple-300 border border-purple-400/50 shadow-neon-purple'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                {dur}s
              </button>
            ))}
          </div>
        )}

        {/* Difficulty Selector */}
        <div className="flex items-center gap-1.5 bg-slate-950/60 p-1 rounded-xl border border-white/5">
          {difficulties.map((d) => (
            <button
              key={d}
              onClick={() => setDifficulty(d)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                difficulty === d
                  ? d === 'Hard'
                    ? 'bg-red-500/20 text-red-400 border border-red-500/40 shadow-neon-red'
                    : d === 'Normal'
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-neon-amber'
                    : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-neon-green'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              {d}
            </button>
          ))}
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setGhostMode(ghostMode === 'off' ? 'pb' : 'off')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all ${
              ghostMode !== 'off'
                ? 'bg-purple-500/20 text-purple-300 border-purple-400/40 shadow-neon-purple'
                : 'bg-slate-900/60 hover:bg-white/10 text-slate-400 hover:text-white border-white/10'
            }`}
            title="Toggle Ghost Pacing Rival"
          >
            <span className="text-xs">👻</span>
            <span>Ghost</span>
          </button>

          <button
            onClick={() => setShowKeyboard(!showKeyboard)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all ${
              showKeyboard
                ? isSerious
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400/40 shadow-neon-emerald'
                  : 'bg-cyan-500/20 text-cyan-300 border-cyan-400/40 shadow-neon-cyan'
                : 'bg-slate-900/60 hover:bg-white/10 text-slate-400 hover:text-white border-white/10'
            }`}
            title="Toggle On-Screen Hardware Keyboard"
          >
            <Keyboard className="w-3.5 h-3.5" />
            <span>Keycaps</span>
          </button>

          <button
            onClick={() => fetchNewBatch()}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900/60 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 text-xs font-semibold transition-all"
            title="Restart Session (Tab)"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>
        </div>
      </div>

      {/* AI Weak-Spot Focus Notification */}
      {aiWeakKeys && aiWeakKeys.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-2.5 px-4 py-2.5 rounded-2xl bg-gradient-to-r from-purple-950/40 via-indigo-950/30 to-purple-950/40 border border-purple-500/30 text-xs font-mono backdrop-blur-md shadow-sm">
          <div className="flex items-center gap-2">
            <span className="flex h-2.5 w-2.5 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-purple-500"></span>
            </span>
            <span className="font-bold text-purple-300 flex items-center gap-1.5">
              <span>🎯</span> AI Adaptive Drill:
            </span>
            <span className="text-slate-300 hidden sm:inline">Targeting weak keys:</span>
            <div className="flex items-center gap-1.5 ml-1">
              {aiWeakKeys.map((keyChar) => (
                <span
                  key={keyChar}
                  className="px-2 py-0.5 rounded-lg bg-purple-500/20 border border-purple-400/40 text-purple-200 font-black text-[11px] shadow-[0_0_8px_rgba(168,85,247,0.3)]"
                >
                  {keyChar.toUpperCase()}
                </span>
              ))}
            </div>
          </div>
          <span className="text-[11px] text-purple-400/80 hidden md:inline">
            Injected 50%+ drill words from your background error telemetry
          </span>
        </div>
      )}

      {/* Boss Arena (if milestone level) */}
      {boss && <BossArena boss={boss} />}

      {/* Matiks 1v1 Live Duel Race Track */}
      {isDuel && duelOpponent && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-950/60 via-slate-900/90 to-purple-950/60 border border-cyan-500/40 shadow-[0_0_30px_rgba(0,245,255,0.1)] flex flex-col gap-3">
          <div className="flex items-center justify-between text-xs font-mono font-bold">
            {/* Player Side */}
            <div className="flex items-center gap-2">
              <span className="text-base">{user.avatar || '👑'}</span>
              <span className="text-white font-black">{user.name} (You)</span>
              <span className="text-cyan-300 font-bold">{wpm} WPM</span>
            </div>

            {/* Duel Gap Telemetry */}
            <div className={`px-2.5 py-0.5 rounded-full text-[11px] font-black uppercase border ${
              duelLeadWords >= 0 
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' 
                : 'bg-rose-500/20 text-rose-300 border-rose-500/30 animate-pulse'
            }`}>
              {duelLeadWords > 0 
                ? `+${duelLeadWords} Words Lead` 
                : duelLeadWords < 0 
                ? `${Math.abs(duelLeadWords)} Words Behind` 
                : 'Neck & Neck'}
            </div>

            {/* Rival Side */}
            <div className="flex items-center gap-2">
              <span className="text-purple-300 font-bold">{duelOpponent.targetWpm} WPM</span>
              <span className="text-white font-black">{duelOpponent.name}</span>
              <span className="text-base">{duelOpponent.avatar}</span>
            </div>
          </div>

          {/* Dual Progress Bars */}
          <div className="flex flex-col gap-1.5">
            {/* Player Progress */}
            <div className="w-full h-2 rounded-full bg-slate-950 overflow-hidden border border-white/10 p-0.5">
              <div 
                className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-blue-500 transition-all duration-150 shadow-[0_0_10px_rgba(0,245,255,0.5)]"
                style={{ width: `${playerProgress}%` }}
              />
            </div>
            {/* Rival Progress */}
            <div className="w-full h-2 rounded-full bg-slate-950 overflow-hidden border border-white/10 p-0.5">
              <div 
                className="h-full rounded-full bg-gradient-to-r from-purple-500 to-rose-500 transition-all duration-150 shadow-[0_0_10px_rgba(168,85,247,0.5)]"
                style={{ width: `${rivalProgress}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Sudden Death Mode Alert Banner */}
      {mode === 'SuddenDeath' && (
        <div className="p-3.5 px-6 rounded-2xl bg-gradient-to-r from-rose-950/80 via-slate-900 to-rose-950/80 border border-rose-500/50 shadow-[0_0_30px_rgba(244,63,94,0.2)] flex items-center justify-between flex-wrap gap-3 animate-pulse">
          <div className="flex items-center gap-2.5">
            <span className="text-xl">💀</span>
            <div>
              <div className="text-sm font-display font-black text-rose-300 tracking-wide">
                SUDDEN DEATH GAUNTLET: 1 Typo = Session Over!
              </div>
              <div className="text-xs text-rose-200/70 font-mono mt-0.5">
                Maintain surgical precision under pressure. Clear all words for a 3x Emerald harvest.
              </div>
            </div>
          </div>
          <div className="px-3 py-1 rounded-xl bg-rose-500/20 border border-rose-400/40 text-rose-200 font-mono font-black text-xs">
            Survived: {currentWordIndex}/{words.length} Words
          </div>
        </div>
      )}

      {/* Unified Studio Telemetry Bar */}
      <div className={`p-3.5 px-6 rounded-2xl border flex items-center justify-between flex-wrap gap-4 transition-all ${
        isOrganicLightMode
          ? 'bg-white border-[#E5DFD7] shadow-sm text-[#2A322D]'
          : isOrganicDarkMode
          ? 'bg-[#181D1B] border-[#2E3531] text-[#FAF8F5]'
          : isSerious
          ? 'bg-[#0f151c] border-emerald-500/20 text-slate-200'
          : 'bg-[#161b22] border-white/10 text-slate-200'
      }`}>
        <div className="flex items-center gap-6 sm:gap-8 flex-wrap">
          {/* Speed */}
          <div className="flex items-baseline gap-1.5">
            <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400">WPM</span>
            <span className={`text-2xl font-mono font-black ${
              isOrganic ? 'text-[#C97D5A]' : isSerious ? 'text-emerald-400' : 'text-sky-400'
            }`}>
              <SlidingNumber number={wpm} />
            </span>
          </div>

          {/* Accuracy */}
          <div className="flex items-baseline gap-1.5">
            <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400">Accuracy</span>
            <span className="text-2xl font-mono font-black text-emerald-400">
              <SlidingNumber number={accuracy} />%
            </span>
          </div>

          {/* Time / Countdown */}
          <div className="flex items-baseline gap-1.5">
            <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400">
              {timedDuration ? 'Remaining' : 'Time'}
            </span>
            <span className={`text-2xl font-mono font-black ${
              timeLeft !== null && timeLeft <= 5 ? 'text-red-400 animate-pulse' : 'text-slate-200'
            }`}>
              <SlidingNumber number={timeLeft !== null ? timeLeft : displaySeconds} />s
            </span>
          </div>

          {/* Streak & Flow Combo Multiplier */}
          <div className="flex items-baseline gap-2">
            <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400">Streak</span>
            <span className="text-2xl font-mono font-black text-amber-400 flex items-baseline gap-1.5">
              <SlidingNumber number={currentStreak} />
              {(comboMultiplierValue > 1.0 || currentStreak >= 10) && (
                <span className="text-[11px] font-mono font-black px-2 py-0.5 rounded-full bg-gradient-to-r from-amber-500/20 to-yellow-500/20 text-amber-300 border border-amber-400/40 shadow-sm animate-pulse">
                  {activeMultiplier} COMBO
                </span>
              )}
            </span>
          </div>
        </div>

        {/* Gems Count */}
        <div className="flex items-center gap-2">
          <span className="text-xs select-none">💎</span>
          <span className="text-sm font-mono font-bold text-emerald-400">
            +{sessionGemsEarned} <span className="text-xs font-normal text-slate-400">/ {levelMaxGemsCap || 500}</span>
          </span>
        </div>
      </div>

      {/* Active Tactical Boosters HUD Bar */}
      {(typoShieldsRemaining > 0 || Object.values(equippedBoosters).some(Boolean)) && (
        <div className="flex flex-wrap items-center gap-2 px-4 py-2 rounded-xl bg-slate-950/60 border border-white/10 text-xs font-mono">
          <span className="text-slate-400 font-bold flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Tactical Boosters:</span>
          </span>

          {/* Forged Legendary Artifacts */}
          {equippedBoosters['forge-tranquil-overdrive'] && (
            <span className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-teal-500/20 border border-teal-400/50 text-teal-300 font-black shadow-[0_0_12px_rgba(20,184,166,0.35)]">
              <span>🧘⚡ Tranquil Overdrive</span>
            </span>
          )}

          {equippedBoosters['forge-neuro-conqueror'] && (
            <span className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-purple-500/20 border border-purple-400/50 text-purple-300 font-black shadow-[0_0_12px_rgba(168,85,247,0.35)]">
              <span>🧠🍀 Neuro Conqueror</span>
            </span>
          )}

          {equippedBoosters['forge-temporal-aegis'] && (
            <span className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-500/20 border border-amber-400/50 text-amber-300 font-black shadow-neon-amber">
              <span>🛡️⏳ Temporal Aegis (4 Shields, -15% Ghost)</span>
            </span>
          )}

          {equippedBoosters['forge-vampiric-piercer'] && (
            <span className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-red-500/20 border border-red-400/50 text-red-300 font-black shadow-neon-red">
              <span>⚔️💎 Vampiric Piercer (38 HP Dmg + Siphon)</span>
            </span>
          )}

          {equippedBoosters['forge-hyperdrive-scanner'] && (
            <span className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-pink-500/20 border border-pink-400/50 text-pink-300 font-black shadow-neon-pink">
              <span>👁️🔥 Hyperdrive Scanner (4 Words + 15 Streak)</span>
            </span>
          )}

          {/* Standard Boosters */}
          {typoShieldsRemaining > 0 && !equippedBoosters['forge-temporal-aegis'] && (
            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-cyan-500/15 border border-cyan-400/40 text-cyan-300 font-bold shadow-neon-cyan/20">
              <span>🛡️ Aegis Shield:</span>
              <span className="text-cyan-100 font-extrabold">{typoShieldsRemaining} charge{typoShieldsRemaining > 1 ? 's' : ''} left</span>
            </span>
          )}

          {equippedBoosters['booster-zen-anti-stress'] && !equippedBoosters['forge-tranquil-overdrive'] && (
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-teal-500/15 border border-teal-400/30 text-teal-300 font-bold">
              <span>🧘 Zen Serenity</span>
            </span>
          )}

          {equippedBoosters['booster-cadence-metronome'] && !equippedBoosters['forge-tranquil-overdrive'] && (
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-500/15 border border-blue-400/30 text-blue-300 font-bold">
              <span>🎵 Rhythm Metronome</span>
            </span>
          )}

          {equippedBoosters['booster-flow-stabilizer'] && !equippedBoosters['forge-tranquil-overdrive'] && (
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-cyan-500/15 border border-cyan-400/30 text-cyan-300 font-bold">
              <span>🌊 Flow Burst</span>
            </span>
          )}

          {equippedBoosters['booster-mistake-buffer'] && !equippedBoosters['forge-tranquil-overdrive'] && (
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-500/15 border border-emerald-400/30 text-emerald-300 font-bold">
              <span>↩️ Mistake Buffer</span>
            </span>
          )}

          {equippedBoosters['booster-weak-spot-conqueror'] && !equippedBoosters['forge-neuro-conqueror'] && (
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-violet-500/15 border border-violet-400/30 text-violet-300 font-bold">
              <span>🎯 Weak-Spot 2x</span>
            </span>
          )}

          {equippedBoosters['booster-overdrive-matrix'] && !equippedBoosters['forge-tranquil-overdrive'] && (
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-500/15 border border-amber-400/30 text-amber-300 font-bold">
              <span>⚡ Velocity Matrix</span>
            </span>
          )}

          {equippedBoosters['booster-lucky-gem-magnet'] && !equippedBoosters['forge-neuro-conqueror'] && (
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-yellow-500/15 border border-yellow-400/30 text-yellow-300 font-bold">
              <span>🍀 Fortune Magnet</span>
            </span>
          )}

          {equippedBoosters['booster-streak-guardian'] && !equippedBoosters['forge-tranquil-overdrive'] && (
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-orange-500/15 border border-orange-400/30 text-orange-300 font-bold">
              <span>🛡️ Flame Guardian</span>
            </span>
          )}

          {equippedBoosters['booster-boss-piercer'] && !equippedBoosters['forge-vampiric-piercer'] && (
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-red-500/15 border border-red-400/40 text-red-300 font-bold">
              <span>⚔️ 2x Boss Damage</span>
            </span>
          )}

          {equippedBoosters['booster-chronos'] && !equippedBoosters['forge-temporal-aegis'] && (
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-purple-500/15 border border-purple-400/40 text-purple-300 font-bold">
              <span>⏳ Ghost Dilated (-10%)</span>
            </span>
          )}

          {equippedBoosters['booster-lookahead'] && !equippedBoosters['forge-hyperdrive-scanner'] && (
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-500/15 border border-emerald-400/40 text-emerald-300 font-bold">
              <span>👁️ Lookahead Scanner</span>
            </span>
          )}

          {equippedBoosters['booster-emerald'] && !equippedBoosters['forge-vampiric-piercer'] && (
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-500/20 border border-emerald-400/50 text-emerald-300 font-bold">
              <span>💎 1.5x Emeralds</span>
            </span>
          )}
        </div>
      )}

      {/* Ghost Racer Dual Track */}
      {ghostMode !== 'off' && (
        <div className="glass-panel p-4 sm:p-5 rounded-2xl border border-white/10 flex flex-col gap-3 bg-slate-950/70">
          <div className="flex items-center justify-between text-xs flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <span className="text-sm">👻</span>
              <span className="font-mono uppercase font-bold text-slate-300 text-[11px]">
                Shadow Typist ({targetGhostWpm} WPM Pace)
              </span>
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold flex items-center gap-1.5 transition-all ${
                isPlayerLeading 
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/40 shadow-neon-cyan/40 animate-pulse' 
                  : deltaWpm >= 0
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
              }`}>
                {isPlayerLeading 
                  ? `💨 Nitro Active (+${deltaWpm} WPM Ahead ⚡)` 
                  : deltaWpm >= 0 
                  ? `Tied Pace (+${deltaWpm} WPM)` 
                  : `${deltaWpm} WPM Behind ⚠️`}
              </span>
            </div>

            <div className="flex items-center gap-2">
              {/* Ghost Pacing Mode: Realtime Continuous vs Step */}
              <div className="flex items-center gap-1 bg-slate-900/80 p-0.5 rounded-xl border border-white/10 text-[10px] font-mono font-bold select-none">
                <button
                  onClick={() => setGhostPacingMode('continuous')}
                  className={`px-2 py-0.5 rounded-lg transition-all flex items-center gap-1 ${
                    ghostPacingMode === 'continuous'
                      ? 'bg-purple-500/30 text-purple-300 border border-purple-400/50 shadow-neon-purple'
                      : 'text-slate-400 hover:text-white'
                  }`}
                  title="Realtime: Ghost races continuously in real-time"
                >
                  <span>⚡ Realtime</span>
                </button>
                <button
                  onClick={() => setGhostPacingMode('turn_based')}
                  className={`px-2 py-0.5 rounded-lg transition-all flex items-center gap-1 ${
                    ghostPacingMode === 'turn_based'
                      ? 'bg-purple-500/30 text-purple-300 border border-purple-400/50 shadow-neon-purple'
                      : 'text-slate-400 hover:text-white'
                  }`}
                  title="Step: Ghost waits and advances only when you type"
                >
                  <span>⏸️ Step</span>
                </button>
              </div>

              {/* Ghost Mode Selector */}
              <div className="flex items-center gap-1 bg-slate-900/80 p-0.5 rounded-xl border border-white/10 text-[10px] font-mono font-bold select-none">
                <button
                  onClick={() => setGhostMode('pb')}
                  className={`px-2 py-0.5 rounded-lg transition-all ${ghostMode === 'pb' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/40 shadow-neon-cyan' : 'text-slate-400 hover:text-white'}`}
                  title="Ghost matches your Personal Best WPM"
                >
                  PB
                </button>
                <button
                  onClick={() => setGhostMode('target')}
                  className={`px-2 py-0.5 rounded-lg transition-all ${ghostMode === 'target' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/40 shadow-neon-cyan' : 'text-slate-400 hover:text-white'}`}
                  title="Ghost matches the level benchmark WPM"
                >
                  Target
                </button>
                <button
                  onClick={() => setGhostMode('speedster')}
                  className={`px-2 py-0.5 rounded-lg transition-all ${ghostMode === 'speedster' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/40 shadow-neon-cyan' : 'text-slate-400 hover:text-white'}`}
                  title="Ghost runs at 100 WPM Master pace"
                >
                  100 WPM
                </button>
                <button
                  onClick={() => setGhostMode('off')}
                  className="px-2 py-0.5 rounded-lg transition-all text-slate-400 hover:text-white hover:bg-white/5"
                  title="Disable Shadow Typist"
                >
                  Off
                </button>
              </div>
            </div>
          </div>

          {/* Dual Racing Lanes */}
          <div className="flex flex-col gap-2.5">
            {/* Player Lane */}
            <div className="flex items-center gap-3">
              <span className={`w-16 text-[10px] font-mono font-bold flex items-center gap-1.5 truncate ${
                isSerious ? 'text-emerald-400' : 'text-sky-400'
              }`}>
                <UserAvatar avatar={user.avatar} fallback="👤" className={`w-4 h-4 rounded-full text-[10px] bg-slate-900 border shrink-0 ${
                  isSerious ? 'border-emerald-400/50' : 'border-sky-400/40'
                }`} />
                <span>You</span>
              </span>
              <div className="flex-1 h-2 rounded-full bg-slate-800/80 border border-white/5 relative">
                <motion.div
                  className={`h-full rounded-full transition-all relative ${
                    isPlayerLeading
                      ? isSerious
                        ? 'bg-emerald-500'
                        : 'bg-sky-500'
                      : isSerious
                      ? 'bg-emerald-600/80'
                      : 'bg-sky-600/80'
                  }`}
                  animate={{ width: `${playerProgress}%` }}
                  transition={{ duration: 0.2 }}
                >
                  {playerProgress > 0 && (
                    <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 w-2.5 h-2.5 rounded-full bg-white shadow-sm" />
                  )}
                </motion.div>
              </div>
              <span className={`w-10 text-right text-[10px] font-mono font-bold ${
                isSerious ? 'text-emerald-300' : 'text-sky-300'
              }`}>
                {playerProgress}%
              </span>
            </div>

            {/* Ghost Lane */}
            <div className="flex items-center gap-3">
              <span className="w-16 text-[10px] font-mono font-bold text-purple-400 flex items-center gap-1.5 truncate">
                <span className="w-2 h-2 rounded-full bg-purple-400 inline-block shrink-0"></span>
                <span>Target</span>
              </span>
              <div className="flex-1 h-2 rounded-full bg-slate-800/80 border border-white/5 relative">
                <motion.div
                  className="h-full bg-purple-500/80 rounded-full relative"
                  animate={{ width: `${ghostProgress}%` }}
                  transition={{ duration: 0.2 }}
                >
                  {ghostProgress > 0 && (
                    <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 w-2.5 h-2.5 rounded-full bg-purple-200 shadow-sm" />
                  )}
                </motion.div>
              </div>
              <span className="w-10 text-right text-[10px] font-mono text-purple-300 font-bold">
                {ghostProgress}%
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Typing Display Box with Studio Aesthetics */}
      <motion.div 
        ref={containerRef}
        onClick={() => inputRef.current?.focus()}
        animate={isGlitching ? { x: [-5, 5, -3, 3, 0] } : { x: 0 }}
        transition={{ duration: 0.2 }}
        className={`p-6 sm:p-8 rounded-3xl border transition-all duration-300 relative overflow-hidden min-h-[260px] max-h-[420px] flex flex-col justify-start cursor-text ${
          isOrganicLightMode
            ? 'bg-[#FAF8F5] border-[#E2DDD5] shadow-organic-card'
            : isOrganicDarkMode
            ? 'bg-[#181D1B] border-[#2E3531] shadow-2xl'
            : isSerious
            ? 'bg-[#0b0f14] border-emerald-500/30 shadow-studio-card'
            : 'bg-[#161b22] border-white/10 shadow-studio-card'
        }`}
      >
        {/* Code Mode Header Bar */}
        {isSerious && (
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-emerald-500/20 text-xs font-mono text-emerald-400 z-10 select-none">
            <div className="flex items-center gap-2 px-3 py-1 rounded-lg bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 text-[11px] font-bold">
              <Code2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Code Practice Mode</span>
            </div>
            <div className="hidden sm:flex items-center gap-3 text-[11px] text-slate-400 font-mono">
              <span>UTF-8</span>
              <span>Python / JS / C++</span>
            </div>
          </div>
        )}

        {/* Active Module Watermark Badge */}
        <div className="absolute top-4 right-5 flex items-center gap-2 select-none pointer-events-none z-10">
          <span className="px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-slate-400 font-mono text-[10px] font-bold tracking-wider uppercase flex items-center gap-1.5">
            {mode.toUpperCase()} MODE
          </span>
        </div>

        {/* Pages Mode Manuscript Header */}
        {mode === 'Pages' && (
          <div className="flex items-center justify-between pb-2.5 mb-2 border-b border-cyan-500/20 text-xs font-mono text-cyan-300 z-10 pr-36">
            <span className="flex items-center gap-2 font-bold tracking-wider uppercase">
              <BookOpen className="w-4 h-4 text-cyan-400" />
              <span>Page Level #{level} • Manuscript</span>
            </span>
            <div className="flex items-center gap-2.5">
              <span className="text-slate-400">
                Word <span className="text-white font-bold">{currentWordIndex + 1}</span> of <span className="text-white font-bold">{words.length}</span>
              </span>
              <span className="px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-400/30 text-[10px] font-bold">
                {Math.min(100, Math.round((currentWordIndex / Math.max(1, words.length)) * 100))}%
              </span>
            </div>
          </div>
        )}

        {/* Invisible Real Input */}
        <input
          ref={inputRef}
          type="text"
          value=""
          onChange={() => {}}
          onKeyDown={handleKeyDown}
          onKeyUp={handleKeyUp}
          className="absolute inset-0 opacity-0 cursor-default pointer-events-none"
          autoFocus
        />

        {/* Words Presentation with Auto-Scroll Viewport */}
        <div 
          ref={wordsScrollRef}
          className={`font-mono text-xl sm:text-2xl leading-relaxed flex flex-wrap gap-x-3 gap-y-2 select-none overflow-y-auto max-h-[260px] pr-2 scrollbar-thin ${
            isSerious ? 'scrollbar-thumb-emerald-500/40' : 'scrollbar-thumb-cyan-500/30'
          } scrollbar-track-transparent scroll-smooth pt-7 pb-4`}
        >
          {words.map((word, wIdx) => {
            const isCompleted = wIdx < currentWordIndex;
            const isCurrent = wIdx === currentWordIndex;
            const isPending = wIdx > currentWordIndex;

            if (isCompleted) {
              const typed = typedWords[wIdx] ?? word;
              const isWordCorrect = typed === word;
              const targetLetters = word.split('');
              const typedLetters = typed.split('');
              const maxLen = Math.max(targetLetters.length, typedLetters.length);

              if (isWordCorrect) {
                return (
                  <span
                    key={wIdx}
                    onClick={() => jumpToWord(wIdx)}
                    className={`relative inline-flex items-center font-medium cursor-pointer hover:underline transition-all select-none ${
                      isOrganic
                        ? 'text-[#7C8D81] font-semibold decoration-[#7C8D81]/40'
                        : isSerious
                        ? 'text-emerald-400 decoration-emerald-500/40'
                        : 'text-sky-300 decoration-sky-400/40'
                    }`}
                    title="Correct! Click to edit"
                  >
                    {word}
                  </span>
                );
              }

              // Word has mistakes! Show letter-by-letter what was right vs wrong
              return (
                <span
                  key={wIdx}
                  onClick={() => jumpToWord(wIdx)}
                  className={`relative inline-flex items-center border-b-2 px-1 py-0.5 rounded cursor-pointer transition-all select-none group ${
                    isOrganic
                      ? 'border-[#C97D5A] bg-[#C97D5A]/15 hover:bg-[#C97D5A]/25'
                      : 'border-red-500/80 bg-red-950/25 hover:bg-red-950/45'
                  }`}
                  title={`Typo! Typed: "${typed}" | Expected: "${word}" — Click or Backspace to fix`}
                >
                  {Array.from({ length: maxLen }).map((_, cIdx) => {
                    const targetChar = targetLetters[cIdx];
                    const typedChar = typedLetters[cIdx];

                    // 1. Matched correct character in imperfect word
                    if (targetChar !== undefined && typedChar !== undefined && targetChar === typedChar) {
                      return (
                        <span key={cIdx} className={isOrganic ? "text-[#7C8D81] font-bold" : isSerious ? "text-emerald-400 font-bold" : "text-sky-300 font-bold"}>
                          {targetChar}
                        </span>
                      );
                    }

                    // 2. Mistyped character (wrong letter)
                    if (targetChar !== undefined && typedChar !== undefined && targetChar !== typedChar) {
                      return (
                        <span
                          key={cIdx}
                          className={isOrganic ? "text-white bg-[#C97D5A] px-0.5 rounded font-black" : "text-red-300 bg-red-900/80 px-0.5 rounded font-black underline decoration-red-400"}
                          title={`Mistyped: '${typedChar}' instead of '${targetChar}'`}
                        >
                          {typedChar}
                        </span>
                      );
                    }

                    // 3. Missing character (omitted by pressing space early)
                    if (targetChar !== undefined && typedChar === undefined) {
                      return (
                        <span
                          key={cIdx}
                          className="text-red-400/60 line-through decoration-red-500 font-bold opacity-75"
                          title={`Missing letter: '${targetChar}'`}
                        >
                          {targetChar}
                        </span>
                      );
                    }

                    // 4. Extra characters (typed past word length)
                    if (targetChar === undefined && typedChar !== undefined) {
                      return (
                        <span
                          key={cIdx}
                          className={isOrganic ? "text-white bg-[#C97D5A] px-0.5 rounded font-black" : "text-red-400 bg-red-900/90 px-0.5 rounded font-black"}
                          title={`Extra letter: '${typedChar}'`}
                        >
                          {typedChar}
                        </span>
                      );
                    }

                    return null;
                  })}
                </span>
              );
            }

            if (isCurrent) {
              const targetLetters = word.split('');
              const typedLetters = currentInput.split('');
              const isOverlength = typedLetters.length > targetLetters.length;

              return (
                <span 
                  ref={activeWordRef}
                  key={wIdx} 
                  className={`relative inline-flex items-center border-b-2 pb-0.5 px-0.5 transition-all ${
                    isOrganic ? 'border-[#C97D5A]' : isSerious ? 'border-emerald-400/90' : 'border-sky-400/80'
                  }`}
                >
                  {targetLetters.map((char, cIdx) => {
                    const typedChar = typedLetters[cIdx];
                    const isTyped = typedChar !== undefined;
                    const isCorrect = typedChar === char;

                    return (
                      <span key={cIdx} className="relative">
                        {/* Smooth Caret */}
                        {cIdx === typedLetters.length && (
                          <span
                            className={`absolute -left-0.5 top-1 bottom-1 w-0.5 rounded-full animate-caret z-10 ${
                              isOrganic
                                ? 'bg-[#C97D5A]'
                                : isSerious 
                                ? 'bg-emerald-400' 
                                : 'bg-sky-400'
                            }`}
                          />
                        )}

                        <span
                          className={`transition-colors font-bold ${
                            !isTyped
                              ? isOrganic ? 'text-[#333333]' : isSerious ? 'text-slate-400' : 'text-slate-300'
                              : isCorrect
                              ? isOrganic ? 'text-[#7C8D81] font-bold font-mono' : isSerious ? 'text-emerald-300 font-mono' : 'text-sky-300 font-mono'
                              : isOrganic ? 'text-white bg-[#C97D5A] px-0.5 rounded font-bold' : 'text-red-400 bg-red-950/60 px-0.5 rounded font-bold'
                          }`}
                        >
                          {char}
                        </span>
                      </span>
                    );
                  })}

                  {/* Overlength errors if user typed extra chars (capped) */}
                  {isOverlength &&
                    typedLetters.slice(targetLetters.length, targetLetters.length + 6).map((extraChar, eIdx) => (
                      <span key={`extra-${eIdx}`} className={isOrganic ? "text-white bg-[#C97D5A] px-0.5 rounded font-bold" : "text-red-400 bg-red-950/80 px-0.5 rounded font-bold"}>
                        {extraChar}
                      </span>
                    ))}

                  {/* Caret at very end of word */}
                  {typedLetters.length >= targetLetters.length && (
                    <span
                      className={`inline-block w-0.5 h-6 rounded-full animate-caret ml-0.5 align-middle ${
                        isOrganic
                          ? 'bg-[#C97D5A]'
                          : isSerious 
                          ? 'bg-emerald-400' 
                          : 'bg-sky-400'
                      }`}
                    />
                  )}
                </span>
              );
            }

            // Pending words
            const lookaheadCount = equippedBoosters['forge-hyperdrive-scanner'] ? 4 : equippedBoosters['booster-lookahead'] ? 3 : 0;
            const isLookahead = lookaheadCount > 0 && wIdx > currentWordIndex && wIdx <= currentWordIndex + lookaheadCount;

            return (
              <span 
                key={wIdx} 
                className={`transition-all ${
                  isLookahead
                    ? isOrganic
                      ? 'text-[#C97D5A] font-bold underline decoration-[#C97D5A]/50 bg-[#F2EFEB] px-1 rounded'
                      : isSerious
                      ? 'text-emerald-300 font-bold underline decoration-emerald-500/50 bg-emerald-950/20 px-1 rounded'
                      : 'text-sky-300 font-bold underline decoration-sky-400/50 bg-sky-950/20 px-1 rounded'
                    : isOrganic ? 'text-[#8E9792] font-normal' : 'text-slate-600 font-normal'
                }`}
                title={isLookahead ? "Lookahead Active (Next 3 words)" : undefined}
              >
                {word}
              </span>
            );
          })}
        </div>

        {/* Helper instructions */}
        <div className="absolute bottom-3 left-6 text-[11px] font-mono text-slate-500 hidden sm:flex items-center gap-2">
          <span className="flex items-center gap-1.5">
            <KbdKey keyName="backspace" size="sm">Backspace</KbdKey> into previous words to fix typos • Click any word to jump back
          </span>
        </div>

        {/* Subtle helper instruction */}
        <div className="absolute bottom-3 right-5 text-[11px] font-mono text-slate-500 flex items-center gap-2">
          <span className="flex items-center gap-1.5">
            Press <KbdKey keyName="tab" size="sm" onPress={fetchNewBatch}>Tab</KbdKey> to restart
          </span>
        </div>
      </motion.div>

      {/* Real-time Hardware Mechanical Keycaps */}
      {showKeyboard && (
        <VirtualKeyboard
          currentKey={
            currentWordIndex < words.length
              ? currentInput.length < words[currentWordIndex].length
                ? words[currentWordIndex][currentInput.length]
                : ' '
              : undefined
          }
          lastKeyTyped={lastKey}
          isSerious={isSerious}
        />
      )}

    </div>
  );
};
