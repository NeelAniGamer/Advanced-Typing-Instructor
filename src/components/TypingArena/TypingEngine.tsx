import React, { useEffect, useRef, useState } from 'react';
import { useGameStore } from '../../stores/useGameStore';
import { motion, AnimatePresence } from 'framer-motion';
import { TypingMode, Difficulty } from '../../types/game';
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

export const TypingEngine: React.FC = () => {
  const {
    words,
    currentWordIndex,
    currentInput,
    wpm,
    rawWpm,
    accuracy,
    elapsedSeconds,
    currentStreak,
    mode,
    difficulty,
    category,
    boss,
    level,
    user,
    ghostMode,
    setGhostMode,
    handleKeyInput,
    fetchNewBatch,
    setMode,
    setDifficulty,
    setCategory,
    setScreen,
  } = useGameStore();

  const [showKeyboard, setShowKeyboard] = useState(true);
  const [lastKey, setLastKey] = useState<string>('');
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Initialize or fetch text on mount
  useEffect(() => {
    fetchNewBatch();
  }, [mode, difficulty, level]);

  // Keep focus on hidden input
  useEffect(() => {
    inputRef.current?.focus();
    const handleGlobalClick = () => inputRef.current?.focus();
    window.addEventListener('click', handleGlobalClick);
    return () => window.removeEventListener('click', handleGlobalClick);
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    setLastKey(e.key);

    if (e.key === 'Tab') {
      e.preventDefault();
      fetchNewBatch();
      return;
    }

    if (e.key === 'Backspace') {
      e.preventDefault();
      handleKeyInput('', true);
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

  const modes: { id: TypingMode; label: string; icon: React.ReactNode }[] = [
    { id: 'Words', label: 'Words', icon: <Type className="w-3.5 h-3.5" /> },
    { id: 'Lines', label: 'Lines', icon: <AlignLeft className="w-3.5 h-3.5" /> },
    { id: 'Paragraphs', label: 'Paragraphs', icon: <FileText className="w-3.5 h-3.5" /> },
    { id: 'Pages', label: 'Pages', icon: <BookOpen className="w-3.5 h-3.5" /> },
    { id: 'Code', label: 'Code', icon: <Code2 className="w-3.5 h-3.5" /> },
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

  const totalChars = words.join(' ').length || 1;
  const ghostCharsTyped = (targetGhostWpm / 60) * 5 * elapsedSeconds;
  const ghostProgress = ghostMode === 'off' ? 0 : Math.min(100, Math.round((ghostCharsTyped / totalChars) * 100));
  const playerProgress = Math.min(100, Math.round((currentWordIndex / Math.max(1, words.length)) * 100));
  const deltaWpm = wpm - targetGhostWpm;

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 flex flex-col gap-6">
      
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
                ? 'bg-purple-500/20 text-purple-300 border border-purple-400/40 shadow-neon-purple'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <span>💻 Coding</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded bg-purple-500/20 text-purple-400 font-mono hidden sm:inline">Code Syntax</span>
          </button>
        </div>

        {/* Mode Selector */}
        <div className="flex items-center gap-1.5 bg-slate-950/60 p-1 rounded-xl border border-white/5">
          {modes.map((m) => (
            <button
              key={m.id}
              onClick={() => setMode(m.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                mode === m.id
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/40 shadow-neon-cyan'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              {m.icon}
              {m.label}
            </button>
          ))}
        </div>

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
                ? 'bg-cyan-500/20 text-cyan-300 border-cyan-400/40 shadow-neon-cyan'
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

      {/* Boss Arena (if milestone level) */}
      {boss && <BossArena boss={boss} />}

      {/* Live Telemetry Gauges */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        
        {/* Speedometer */}
        <div className="glass-panel p-4 rounded-2xl border border-white/10 flex items-center gap-3.5">
          <div className="p-3 rounded-xl bg-cyan-500/10 border border-cyan-500/20">
            <Zap className="w-5 h-5 text-cyan-400" />
          </div>
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Velocity</div>
            <div className={`text-2xl font-mono font-extrabold tracking-tight ${getWpmColor(wpm)}`}>
              {wpm} <span className="text-xs text-slate-400 font-sans font-normal">WPM</span>
            </div>
          </div>
        </div>

        {/* Precision Dial */}
        <div className="glass-panel p-4 rounded-2xl border border-white/10 flex items-center gap-3.5">
          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
            <Target className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Precision</div>
            <div className="text-2xl font-mono font-extrabold text-emerald-400 text-glow-green tracking-tight">
              {accuracy}%
            </div>
          </div>
        </div>

        {/* Stopwatch */}
        <div className="glass-panel p-4 rounded-2xl border border-white/10 flex items-center gap-3.5">
          <div className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/20">
            <Clock className="w-5 h-5 text-purple-400" />
          </div>
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Duration</div>
            <div className="text-2xl font-mono font-extrabold text-purple-300 tracking-tight">
              {elapsedSeconds}s
            </div>
          </div>
        </div>

        {/* Combo Fire */}
        <div className="glass-panel p-4 rounded-2xl border border-white/10 flex items-center gap-3.5">
          <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
            <Sparkles className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Streak</div>
            <div className="text-2xl font-mono font-extrabold text-amber-400 text-glow-amber tracking-tight">
              {currentStreak}
            </div>
          </div>
        </div>
      </div>

      {/* Ghost Racer Dual Track */}
      {ghostMode !== 'off' && (
        <div className="glass-panel p-4 sm:p-5 rounded-2xl border border-white/10 flex flex-col gap-3 bg-slate-950/70">
          <div className="flex items-center justify-between text-xs flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <span className="text-sm">👻</span>
              <span className="font-mono uppercase font-bold text-slate-300 text-[11px]">
                Shadow Typist ({targetGhostWpm} WPM Pace)
              </span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                deltaWpm >= 0 
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                  : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
              }`}>
                {deltaWpm >= 0 ? `+${deltaWpm} WPM Ahead ⚡` : `${deltaWpm} WPM Behind ⚠️`}
              </span>
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

          {/* Dual Racing Lanes */}
          <div className="flex flex-col gap-2">
            {/* Player Lane */}
            <div className="flex items-center gap-3">
              <span className="w-16 text-[10px] font-mono font-bold text-cyan-400 flex items-center gap-1 truncate">
                <span>{user.avatar}</span> <span>You</span>
              </span>
              <div className="flex-1 h-2.5 rounded-full bg-slate-900 overflow-hidden border border-white/5 relative">
                <motion.div
                  className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 shadow-neon-cyan rounded-full"
                  animate={{ width: `${playerProgress}%` }}
                  transition={{ duration: 0.2 }}
                />
              </div>
              <span className="w-10 text-right text-[10px] font-mono text-cyan-300 font-bold">
                {playerProgress}%
              </span>
            </div>

            {/* Ghost Lane */}
            <div className="flex items-center gap-3">
              <span className="w-16 text-[10px] font-mono font-bold text-purple-400 flex items-center gap-1 truncate">
                <span>👻</span> <span>Ghost</span>
              </span>
              <div className="flex-1 h-2.5 rounded-full bg-slate-900 overflow-hidden border border-white/5 relative">
                <motion.div
                  className="h-full bg-gradient-to-r from-purple-500 to-pink-500 shadow-neon-purple rounded-full opacity-80"
                  animate={{ width: `${ghostProgress}%` }}
                  transition={{ duration: 0.2 }}
                />
              </div>
              <span className="w-10 text-right text-[10px] font-mono text-purple-300 font-bold">
                {ghostProgress}%
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Typing Display Box */}
      <div 
        ref={containerRef}
        onClick={() => inputRef.current?.focus()}
        className={`glass-panel p-8 sm:p-10 rounded-3xl border transition-all duration-300 relative overflow-hidden min-h-[260px] flex flex-col justify-center cursor-text ${
          currentStreak >= 30
            ? 'border-purple-500/60 shadow-[0_0_60px_rgba(168,85,247,0.35)] bg-purple-950/20'
            : currentStreak >= 15
            ? 'border-amber-500/50 shadow-[0_0_50px_rgba(245,158,11,0.25)] bg-amber-950/10'
            : 'border-cyan-500/20 shadow-[0_0_50px_rgba(0,245,255,0.06)]'
        }`}
      >
        {/* Active Module Watermark Badge */}
        <div className="absolute top-4 right-5 flex items-center gap-2 select-none pointer-events-none">
          {category === 'Coding' ? (
            <span className="px-2.5 py-1 rounded-lg bg-purple-500/10 border border-purple-500/30 text-purple-300 font-mono text-[10px] font-bold tracking-wider uppercase flex items-center gap-1.5 shadow-neon-purple/20">
              <Code2 className="w-3.5 h-3.5 text-purple-400" /> CODING MODULE
            </span>
          ) : (
            <span className="px-2.5 py-1 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 font-mono text-[10px] font-bold tracking-wider uppercase flex items-center gap-1.5 shadow-neon-cyan/20">
              <BookOpen className="w-3.5 h-3.5 text-cyan-400" /> NORMAL LITERATURE
            </span>
          )}
        </div>

        {/* Invisible Real Input */}
        <input
          ref={inputRef}
          type="text"
          value=""
          onChange={() => {}}
          onKeyDown={handleKeyDown}
          className="absolute inset-0 opacity-0 cursor-default pointer-events-none"
          autoFocus
        />

        {/* Words Presentation */}
        <div className="font-mono text-xl sm:text-2xl leading-relaxed flex flex-wrap gap-x-3 gap-y-2 select-none">
          {words.map((word, wIdx) => {
            const isCompleted = wIdx < currentWordIndex;
            const isCurrent = wIdx === currentWordIndex;
            const isPending = wIdx > currentWordIndex;

            if (isCompleted) {
              return (
                <span key={wIdx} className="text-slate-500/80 font-medium transition-colors">
                  {word}
                </span>
              );
            }

            if (isCurrent) {
              const targetLetters = word.split('');
              const typedLetters = currentInput.split('');
              const isOverlength = typedLetters.length > targetLetters.length;

              return (
                <span 
                  key={wIdx} 
                  className="relative inline-flex items-center border-b-2 border-cyan-400/80 pb-0.5 px-0.5 transition-all"
                >
                  {targetLetters.map((char, cIdx) => {
                    const typedChar = typedLetters[cIdx];
                    const isTyped = typedChar !== undefined;
                    const isCorrect = typedChar === char;

                    return (
                      <span key={cIdx} className="relative">
                        {/* Smooth Spring Caret */}
                        {cIdx === typedLetters.length && (
                          <span
                            className="absolute -left-0.5 top-1 bottom-1 w-0.5 bg-cyan-400 shadow-[0_0_10px_#00f5ff] rounded-full animate-caret z-10"
                          />
                        )}

                        <span
                          className={`transition-colors font-bold ${
                            !isTyped
                              ? 'text-slate-300'
                              : isCorrect
                              ? 'text-cyan-300 text-glow-cyan'
                              : 'text-red-400 bg-red-950/60 px-0.5 rounded text-glow-red'
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
                      <span key={`extra-${eIdx}`} className="text-red-400 bg-red-950/80 px-0.5 rounded font-bold">
                        {extraChar}
                      </span>
                    ))}

                  {/* Caret at very end of word */}
                  {typedLetters.length >= targetLetters.length && (
                    <span
                      className="inline-block w-0.5 h-6 bg-cyan-400 shadow-[0_0_10px_#00f5ff] rounded-full animate-caret ml-0.5 align-middle"
                    />
                  )}
                </span>
              );
            }

            // Pending words
            return (
              <span key={wIdx} className="text-slate-600 font-normal">
                {word}
              </span>
            );
          })}
        </div>

        {/* Subtle helper instruction */}
        <div className="absolute bottom-3 right-5 text-[11px] font-mono text-slate-500 flex items-center gap-2">
          <span>Press <kbd className="px-1.5 py-0.5 bg-slate-900 border border-white/10 rounded text-slate-400">Tab</kbd> to restart</span>
        </div>
      </div>

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
        />
      )}

    </div>
  );
};
