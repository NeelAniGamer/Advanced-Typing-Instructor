import React from 'react';
import { motion } from 'framer-motion';
import { useGameStore } from '../../stores/useGameStore';
import { KeyboardLayout } from '../../types/game';
import { isOrganicTheme } from '../../utils/theme';
import { Laptop, Tablet, Keyboard as KeyboardIcon, Binary, Sparkles, Check } from 'lucide-react';

interface VirtualKeyboardProps {
  currentKey?: string;
  lastKeyTyped?: string;
  isSerious?: boolean;
}

const LAYOUT_LABELS: Record<KeyboardLayout, { name: string; tag: string; icon: any }> = {
  qwerty: { name: 'Normal', tag: 'Standard QWERTY', icon: KeyboardIcon },
  macbook: { name: 'MacBook', tag: 'Apple Chiclet', icon: Laptop },
  ipad: { name: 'iPad', tag: 'iPadOS Touch', icon: Tablet },
  stenography: { name: 'Stenography', tag: '22-Key Steno', icon: Binary },
  dvorak: { name: 'Dvorak', tag: 'Ergonomic', icon: KeyboardIcon },
  colemak: { name: 'Colemak', tag: 'Low Strain', icon: KeyboardIcon },
  workman: { name: 'Workman', tag: 'Effort Matrix', icon: KeyboardIcon },
  azerty: { name: 'AZERTY', tag: 'French ISO', icon: KeyboardIcon },
};

const STANDARD_LAYOUTS: Record<string, string[][]> = {
  qwerty: [
    ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0', '-', '='],
    ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p', '[', ']'],
    ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l', ';', "'"],
    ['z', 'x', 'c', 'v', 'b', 'n', 'm', ',', '.', '/'],
  ],
  dvorak: [
    ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0', '[', ']'],
    ["'", ',', '.', 'p', 'y', 'f', 'g', 'c', 'r', 'l', '/', '='],
    ['a', 'o', 'e', 'u', 'i', 'd', 'h', 't', 'n', 's', '-'],
    [';', 'q', 'j', 'k', 'x', 'b', 'm', 'w', 'v', 'z'],
  ],
  colemak: [
    ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0', '-', '='],
    ['q', 'w', 'f', 'p', 'g', 'j', 'l', 'u', 'y', ';', '[', ']'],
    ['a', 'r', 's', 't', 'd', 'h', 'n', 'e', 'i', 'o', "'"],
    ['z', 'x', 'c', 'v', 'b', 'k', 'm', ',', '.', '/'],
  ],
  workman: [
    ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0', '-', '='],
    ['q', 'd', 'r', 'w', 'b', 'j', 'f', 'u', 'p', ';', '[', ']'],
    ['a', 's', 'h', 't', 'g', 'y', 'n', 'e', 'o', 'i', "'"],
    ['z', 'x', 'm', 'c', 'v', 'k', 'l', ',', '.', '/'],
  ],
  azerty: [
    ['&', 'é', '"', "'", '(', '-', 'è', '_', 'ç', 'à', ')', '='],
    ['a', 'z', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p', '^', '$'],
    ['q', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l', 'm', 'ù', '*'],
    ['w', 'x', 'c', 'v', 'b', 'n', ',', ';', ':', '!'],
  ],
};

const HOMING_KEYS: Record<string, [string, string]> = {
  qwerty: ['f', 'j'],
  macbook: ['f', 'j'],
  ipad: ['', ''],
  stenography: ['', ''],
  dvorak: ['u', 'h'],
  colemak: ['t', 'n'],
  workman: ['t', 'n'],
  azerty: ['f', 'j'],
};

// iPad character flicker badges (like real iPadOS on-screen keyboard)
const IPAD_SECONDARY: Record<string, string> = {
  q: '1', w: '2', e: '3', r: '4', t: '5', y: '6', u: '7', i: '8', o: '9', p: '0',
  a: '@', s: '#', d: '$', f: '%', g: '&', h: '-', j: '+', k: '(', l: ')',
  z: '*', x: '"', c: "'", v: ':', b: ';', n: '!', m: '?'
};

export const VirtualKeyboard: React.FC<VirtualKeyboardProps> = ({ currentKey, lastKeyTyped, isSerious = false }) => {
  const { keyboardLayout, setKeyboardLayout, uiTheme } = useGameStore();
  const isOrganic = isOrganicTheme(uiTheme);
  const effectiveIsSerious = !isOrganic && isSerious;

  const target = currentKey?.toLowerCase();
  const last = lastKeyTyped?.toLowerCase();

  // Highlight helper for Stenography keys
  const isStenoKeyActive = (stenoKey: string): boolean => {
    if (!target) return false;
    const cleanKey = stenoKey.replace(/[-*#]/g, '').toLowerCase();
    
    // Exact letter match
    if (cleanKey === target) return true;
    
    // Asterisk matches space or punctuation
    if (stenoKey === '*' && (target === ' ' || target === '.' || target === ',')) return true;

    // Number bar matches any digit
    if (stenoKey === '#' && !isNaN(Number(target)) && target !== ' ') return true;

    // Steno chord mapping hints for court reporting
    if (target === 'c' && (stenoKey === 'K-' || stenoKey === '-G')) return true;
    if (target === 'm' && (stenoKey === 'P-' || stenoKey === 'H-')) return true;
    if (target === 'v' && (stenoKey === 'S-' || stenoKey === 'R-')) return true;
    if (target === 'x' && (stenoKey === 'S-' || stenoKey === 'K-')) return true;
    if (target === 'y' && (stenoKey === 'K-' || stenoKey === 'W-')) return true;
    if (target === 'q' && (stenoKey === 'K-' || stenoKey === 'W-')) return true;

    return false;
  };

  const isStenoKeyPressed = (stenoKey: string): boolean => {
    if (!last) return false;
    const cleanKey = stenoKey.replace(/[-*#]/g, '').toLowerCase();
    return cleanKey === last || (stenoKey === '#' && !isNaN(Number(last)) && last !== ' ');
  };

  return (
    <div className={`glass-panel p-3.5 sm:p-4 rounded-3xl border transition-all duration-300 flex flex-col gap-2 shadow-2xl max-w-2xl mx-auto w-full ${
      isOrganic
        ? 'border-[#E5DFD7] bg-[#FAF8F5]/95 shadow-organic-soft'
        : effectiveIsSerious 
        ? 'border-emerald-500/25 bg-slate-950/85 shadow-[0_0_40px_rgba(16,185,129,0.08)]' 
        : 'border-white/10 bg-slate-950/80'
    }`}>
      {/* Top Layout Switcher Header & Selector */}
      <div className={`flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 px-1 pb-2 border-b ${isOrganic ? 'border-[#E5DFD7]' : 'border-white/5'}`}>
        <div className="flex items-center gap-2">
          <span className={`text-[10px] font-mono uppercase tracking-widest font-bold flex items-center gap-1.5 ${
            isOrganic ? 'text-[#7C8D81]' : effectiveIsSerious ? 'text-emerald-400/80' : 'text-slate-400'
          }`}>
            <Sparkles className="w-3 h-3 text-cyan-400" />
            {LAYOUT_LABELS[keyboardLayout]?.name || 'Keyboard'} Layout
          </span>
          <span className={`text-[9px] px-1.5 py-0.5 rounded-md font-mono border ${
            isOrganic 
              ? 'bg-[#E5DFD7]/40 border-[#E5DFD7] text-[#616864]' 
              : 'bg-white/5 border-white/10 text-slate-400'
          }`}>
            {LAYOUT_LABELS[keyboardLayout]?.tag}
          </span>
        </div>

        {/* Scrollable / Wrap Responsive Layout Pills */}
        <div className={`flex items-center gap-1 p-0.5 rounded-xl border overflow-x-auto max-w-full no-scrollbar ${
          isOrganic ? 'bg-[#F2EFEB] border-[#E5DFD7]' : 'bg-slate-900/90 border-white/10'
        }`}>
          {(Object.keys(LAYOUT_LABELS) as KeyboardLayout[]).map((layout) => {
            const isSelected = keyboardLayout === layout;
            const ItemIcon = LAYOUT_LABELS[layout].icon;
            return (
              <button
                key={layout}
                onClick={() => setKeyboardLayout(layout)}
                className={`flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-mono font-bold transition-all whitespace-nowrap ${
                  isSelected
                    ? isOrganic
                      ? 'bg-[#7C8D81] text-white shadow-sm'
                      : effectiveIsSerious
                      ? 'bg-emerald-500/25 text-emerald-300 border border-emerald-400/50 shadow-neon-emerald'
                      : 'bg-cyan-500/25 text-cyan-300 border border-cyan-400/50 shadow-neon-cyan'
                    : isOrganic
                    ? 'text-[#616864] hover:text-[#333333]'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <ItemIcon className="w-2.5 h-2.5 opacity-70" />
                <span>{LAYOUT_LABELS[layout].name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* RENDERER: STENOGRAPHY 22-KEY MACHINE CONSOLE */}
      {keyboardLayout === 'stenography' ? (
        <div className="flex flex-col gap-2 p-2 rounded-2xl border bg-black/40 border-cyan-500/20 backdrop-blur-md">
          {/* Machine Header */}
          <div className="flex items-center justify-between px-2 text-[10px] font-mono text-cyan-400/80 border-b border-white/5 pb-1">
            <span>COURT REPORTER REALTIME STENOGRAPH</span>
            <span className="text-[9px] text-slate-400">CHORDED SYLLABIC RECOGNITION</span>
          </div>

          {/* Top Number Bar `#` */}
          <div className="flex justify-center">
            <motion.div
              animate={isStenoKeyPressed('#') ? { y: 2, scale: 0.98 } : { y: 0, scale: 1 }}
              className={`w-full max-w-[500px] h-6 rounded-lg font-mono text-[10px] font-black border flex items-center justify-center transition-all select-none ${
                isStenoKeyActive('#')
                  ? 'bg-cyan-500/30 border-cyan-400 text-cyan-200 shadow-neon-cyan'
                  : 'bg-slate-900/80 border-white/10 text-slate-500'
              }`}
            >
              [ # NUMBER BAR ]
            </motion.div>
          </div>

          {/* Main Steno Console Rows */}
          <div className="flex justify-center items-center gap-3 sm:gap-4 my-1">
            {/* Left Consonants Bank */}
            <div className="grid grid-cols-4 gap-1.5">
              {/* S- (Double Height or Column 1) */}
              <div className="flex flex-col gap-1.5">
                {['S-', 'S-'].map((label, idx) => (
                  <motion.div
                    key={`left-s-${idx}`}
                    animate={isStenoKeyPressed('S-') ? { y: 2, scale: 0.95 } : { y: 0, scale: 1 }}
                    className={`w-9 sm:w-11 h-10 rounded-xl font-mono text-xs font-bold border flex items-center justify-center select-none ${
                      isStenoKeyActive('S-')
                        ? 'bg-cyan-500/30 border-cyan-400 text-cyan-200 shadow-neon-cyan font-black ring-1 ring-cyan-400'
                        : 'bg-slate-900/90 border-white/10 text-slate-300'
                    }`}
                  >
                    S
                  </motion.div>
                ))}
              </div>

              {/* T / K */}
              <div className="flex flex-col gap-1.5">
                {[
                  { key: 'T-', label: 'T' },
                  { key: 'K-', label: 'K' }
                ].map(({ key, label }) => (
                  <motion.div
                    key={key}
                    animate={isStenoKeyPressed(key) ? { y: 2, scale: 0.95 } : { y: 0, scale: 1 }}
                    className={`w-9 sm:w-11 h-10 rounded-xl font-mono text-xs font-bold border flex items-center justify-center select-none ${
                      isStenoKeyActive(key)
                        ? 'bg-cyan-500/30 border-cyan-400 text-cyan-200 shadow-neon-cyan font-black ring-1 ring-cyan-400'
                        : 'bg-slate-900/90 border-white/10 text-slate-300'
                    }`}
                  >
                    {label}
                  </motion.div>
                ))}
              </div>

              {/* P / W */}
              <div className="flex flex-col gap-1.5">
                {[
                  { key: 'P-', label: 'P' },
                  { key: 'W-', label: 'W' }
                ].map(({ key, label }) => (
                  <motion.div
                    key={key}
                    animate={isStenoKeyPressed(key) ? { y: 2, scale: 0.95 } : { y: 0, scale: 1 }}
                    className={`w-9 sm:w-11 h-10 rounded-xl font-mono text-xs font-bold border flex items-center justify-center select-none ${
                      isStenoKeyActive(key)
                        ? 'bg-cyan-500/30 border-cyan-400 text-cyan-200 shadow-neon-cyan font-black ring-1 ring-cyan-400'
                        : 'bg-slate-900/90 border-white/10 text-slate-300'
                    }`}
                  >
                    {label}
                  </motion.div>
                ))}
              </div>

              {/* H / R */}
              <div className="flex flex-col gap-1.5">
                {[
                  { key: 'H-', label: 'H' },
                  { key: 'R-', label: 'R' }
                ].map(({ key, label }) => (
                  <motion.div
                    key={key}
                    animate={isStenoKeyPressed(key) ? { y: 2, scale: 0.95 } : { y: 0, scale: 1 }}
                    className={`w-9 sm:w-11 h-10 rounded-xl font-mono text-xs font-bold border flex items-center justify-center select-none ${
                      isStenoKeyActive(key)
                        ? 'bg-cyan-500/30 border-cyan-400 text-cyan-200 shadow-neon-cyan font-black ring-1 ring-cyan-400'
                        : 'bg-slate-900/90 border-white/10 text-slate-300'
                    }`}
                  >
                    {label}
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Center Asterisk `*` Column */}
            <div className="flex flex-col gap-1.5">
              {['*', '*'].map((star, idx) => (
                <motion.div
                  key={`star-${idx}`}
                  animate={isStenoKeyPressed('*') ? { y: 2, scale: 0.95 } : { y: 0, scale: 1 }}
                  className={`w-8 sm:w-9 h-10 rounded-xl font-mono text-base font-bold border flex items-center justify-center select-none ${
                    isStenoKeyActive('*')
                      ? 'bg-purple-500/30 border-purple-400 text-purple-200 shadow-[0_0_20px_rgba(168,85,247,0.4)] font-black ring-1 ring-purple-400'
                      : 'bg-slate-900/90 border-white/10 text-purple-400/80'
                  }`}
                >
                  ✱
                </motion.div>
              ))}
            </div>

            {/* Right Consonants Bank */}
            <div className="grid grid-cols-5 gap-1.5">
              {/* -F / -R */}
              <div className="flex flex-col gap-1.5">
                {[
                  { key: '-F', label: 'F' },
                  { key: '-R', label: 'R' }
                ].map(({ key, label }) => (
                  <motion.div
                    key={key}
                    animate={isStenoKeyPressed(key) ? { y: 2, scale: 0.95 } : { y: 0, scale: 1 }}
                    className={`w-9 sm:w-11 h-10 rounded-xl font-mono text-xs font-bold border flex items-center justify-center select-none ${
                      isStenoKeyActive(key)
                        ? 'bg-cyan-500/30 border-cyan-400 text-cyan-200 shadow-neon-cyan font-black ring-1 ring-cyan-400'
                        : 'bg-slate-900/90 border-white/10 text-slate-300'
                    }`}
                  >
                    {label}
                  </motion.div>
                ))}
              </div>

              {/* -P / -B */}
              <div className="flex flex-col gap-1.5">
                {[
                  { key: '-P', label: 'P' },
                  { key: '-B', label: 'B' }
                ].map(({ key, label }) => (
                  <motion.div
                    key={key}
                    animate={isStenoKeyPressed(key) ? { y: 2, scale: 0.95 } : { y: 0, scale: 1 }}
                    className={`w-9 sm:w-11 h-10 rounded-xl font-mono text-xs font-bold border flex items-center justify-center select-none ${
                      isStenoKeyActive(key)
                        ? 'bg-cyan-500/30 border-cyan-400 text-cyan-200 shadow-neon-cyan font-black ring-1 ring-cyan-400'
                        : 'bg-slate-900/90 border-white/10 text-slate-300'
                    }`}
                  >
                    {label}
                  </motion.div>
                ))}
              </div>

              {/* -L / -G */}
              <div className="flex flex-col gap-1.5">
                {[
                  { key: '-L', label: 'L' },
                  { key: '-G', label: 'G' }
                ].map(({ key, label }) => (
                  <motion.div
                    key={key}
                    animate={isStenoKeyPressed(key) ? { y: 2, scale: 0.95 } : { y: 0, scale: 1 }}
                    className={`w-9 sm:w-11 h-10 rounded-xl font-mono text-xs font-bold border flex items-center justify-center select-none ${
                      isStenoKeyActive(key)
                        ? 'bg-cyan-500/30 border-cyan-400 text-cyan-200 shadow-neon-cyan font-black ring-1 ring-cyan-400'
                        : 'bg-slate-900/90 border-white/10 text-slate-300'
                    }`}
                  >
                    {label}
                  </motion.div>
                ))}
              </div>

              {/* -T / -S */}
              <div className="flex flex-col gap-1.5">
                {[
                  { key: '-T', label: 'T' },
                  { key: '-S', label: 'S' }
                ].map(({ key, label }) => (
                  <motion.div
                    key={key}
                    animate={isStenoKeyPressed(key) ? { y: 2, scale: 0.95 } : { y: 0, scale: 1 }}
                    className={`w-9 sm:w-11 h-10 rounded-xl font-mono text-xs font-bold border flex items-center justify-center select-none ${
                      isStenoKeyActive(key)
                        ? 'bg-cyan-500/30 border-cyan-400 text-cyan-200 shadow-neon-cyan font-black ring-1 ring-cyan-400'
                        : 'bg-slate-900/90 border-white/10 text-slate-300'
                    }`}
                  >
                    {label}
                  </motion.div>
                ))}
              </div>

              {/* -D / -Z */}
              <div className="flex flex-col gap-1.5">
                {[
                  { key: '-D', label: 'D' },
                  { key: '-Z', label: 'Z' }
                ].map(({ key, label }) => (
                  <motion.div
                    key={key}
                    animate={isStenoKeyPressed(key) ? { y: 2, scale: 0.95 } : { y: 0, scale: 1 }}
                    className={`w-9 sm:w-11 h-10 rounded-xl font-mono text-xs font-bold border flex items-center justify-center select-none ${
                      isStenoKeyActive(key)
                        ? 'bg-cyan-500/30 border-cyan-400 text-cyan-200 shadow-neon-cyan font-black ring-1 ring-cyan-400'
                        : 'bg-slate-900/90 border-white/10 text-slate-300'
                    }`}
                  >
                    {label}
                  </motion.div>
                ))}
              </div>
            </div>
          </div>

          {/* Vowel Thumb Cluster (AO / EU) */}
          <div className="flex justify-center items-center gap-6 mt-1">
            {/* Left Thumb: A, O */}
            <div className="flex items-center gap-1.5">
              {[
                { key: 'A', label: 'A' },
                { key: 'O', label: 'O' }
              ].map(({ key, label }) => (
                <motion.div
                  key={key}
                  animate={isStenoKeyPressed(key) ? { y: 2, scale: 0.95 } : { y: 0, scale: 1 }}
                  className={`w-11 sm:w-13 h-9 rounded-xl font-mono text-xs font-bold border flex items-center justify-center select-none ${
                    isStenoKeyActive(key)
                      ? 'bg-amber-500/30 border-amber-400 text-amber-200 shadow-neon-amber font-black ring-1 ring-amber-400'
                      : 'bg-slate-900/90 border-white/10 text-slate-300'
                  }`}
                >
                  {label}
                </motion.div>
              ))}
            </div>

            <span className="text-[9px] font-mono text-slate-600 uppercase tracking-widest">THUMBS</span>

            {/* Right Thumb: E, U */}
            <div className="flex items-center gap-1.5">
              {[
                { key: 'E', label: 'E' },
                { key: 'U', label: 'U' }
              ].map(({ key, label }) => (
                <motion.div
                  key={key}
                  animate={isStenoKeyPressed(key) ? { y: 2, scale: 0.95 } : { y: 0, scale: 1 }}
                  className={`w-11 sm:w-13 h-9 rounded-xl font-mono text-xs font-bold border flex items-center justify-center select-none ${
                    isStenoKeyActive(key)
                      ? 'bg-amber-500/30 border-amber-400 text-amber-200 shadow-neon-amber font-black ring-1 ring-amber-400'
                      : 'bg-slate-900/90 border-white/10 text-slate-300'
                  }`}
                >
                  {label}
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      ) : keyboardLayout === 'macbook' ? (
        /* RENDERER: MACBOOK PRO CHICLET KEYBOARD */
        <div className="flex flex-col gap-1 sm:gap-1.5 p-2 rounded-2xl border bg-[#1E2024]/90 border-white/10 shadow-inner">
          {/* Top Function / Touch Bar Row */}
          <div className="flex justify-between items-center px-1 pb-1 gap-1 text-[9px] font-mono text-slate-400 border-b border-white/5">
            <span className="px-1.5 py-0.5 rounded bg-black/40 border border-white/5">esc</span>
            <div className="flex items-center gap-1 sm:gap-2">
              <span>🔅</span>
              <span>🔆</span>
              <span>🪟</span>
              <span>🔍</span>
              <span>🎙️</span>
              <span>🌙</span>
              <span>⏮️</span>
              <span>⏯️</span>
              <span>⏭️</span>
              <span>🔇</span>
              <span>🔉</span>
              <span>🔊</span>
            </div>
            <span className="px-1.5 py-0.5 rounded bg-black/60 border border-amber-500/30 text-amber-400 text-[8px]">Touch ID ⏻</span>
          </div>

          {/* Number Row */}
          <div className="flex justify-center gap-1 sm:gap-1.5">
            {['~', '1', '2', '3', '4', '5', '6', '7', '8', '9', '0', '-', '='].map((char) => {
              const isTarget = target === char;
              const isPressed = last === char;
              return (
                <motion.div
                  key={char}
                  animate={isPressed ? { y: 1.5, scale: 0.96 } : { y: 0, scale: 1 }}
                  className={`w-7 sm:w-9 h-8 sm:h-9 rounded-lg font-mono text-[11px] font-medium border flex items-center justify-center transition-all select-none ${
                    isTarget
                      ? 'bg-cyan-500/25 border-cyan-400 text-cyan-200 shadow-neon-cyan ring-1 ring-cyan-400'
                      : 'bg-[#2A2D32] border-black/40 text-slate-300 shadow-sm'
                  }`}
                >
                  {char}
                </motion.div>
              );
            })}
            <div className="w-12 sm:w-14 h-8 sm:h-9 rounded-lg font-mono text-[9px] border bg-[#2A2D32] border-black/40 text-slate-400 flex items-center justify-center">
              delete ⌫
            </div>
          </div>

          {/* QWERTY Row */}
          <div className="flex justify-center gap-1 sm:gap-1.5">
            <div className="w-10 sm:w-12 h-8 sm:h-9 rounded-lg font-mono text-[9px] border bg-[#2A2D32] border-black/40 text-slate-400 flex items-center justify-center">
              tab ⇥
            </div>
            {['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p', '[', ']'].map((char) => {
              const isTarget = target === char;
              const isPressed = last === char;
              return (
                <motion.div
                  key={char}
                  animate={isPressed ? { y: 1.5, scale: 0.96 } : { y: 0, scale: 1 }}
                  className={`w-7 sm:w-9 h-8 sm:h-9 rounded-lg font-sans text-xs uppercase font-medium border flex items-center justify-center transition-all select-none ${
                    isTarget
                      ? 'bg-cyan-500/25 border-cyan-400 text-cyan-200 shadow-neon-cyan ring-1 ring-cyan-400'
                      : 'bg-[#2A2D32] border-black/40 text-slate-200 shadow-sm'
                  }`}
                >
                  {char}
                </motion.div>
              );
            })}
          </div>

          {/* Home Row (with Apple homing bumps on F & J) */}
          <div className="flex justify-center gap-1 sm:gap-1.5">
            <div className="w-12 sm:w-14 h-8 sm:h-9 rounded-lg font-mono text-[9px] border bg-[#2A2D32] border-black/40 text-slate-400 flex items-center justify-center">
              caps ⇪
            </div>
            {['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l', ';', "'"].map((char) => {
              const isTarget = target === char;
              const isPressed = last === char;
              const hasHoming = char === 'f' || char === 'j';
              return (
                <motion.div
                  key={char}
                  animate={isPressed ? { y: 1.5, scale: 0.96 } : { y: 0, scale: 1 }}
                  className={`w-7 sm:w-9 h-8 sm:h-9 rounded-lg font-sans text-xs uppercase font-medium border flex flex-col items-center justify-between p-1 transition-all relative select-none ${
                    isTarget
                      ? 'bg-cyan-500/25 border-cyan-400 text-cyan-200 shadow-neon-cyan ring-1 ring-cyan-400'
                      : 'bg-[#2A2D32] border-black/40 text-slate-200 shadow-sm'
                  }`}
                >
                  <span>{char}</span>
                  {hasHoming && <span className="w-2.5 h-[1.5px] rounded-full bg-cyan-400/80 mb-0.5" />}
                </motion.div>
              );
            })}
            <div className="w-12 sm:w-14 h-8 sm:h-9 rounded-lg font-mono text-[9px] border bg-[#2A2D32] border-black/40 text-slate-400 flex items-center justify-center">
              return ⏎
            </div>
          </div>

          {/* Shift Row */}
          <div className="flex justify-center gap-1 sm:gap-1.5">
            <div className="w-14 sm:w-16 h-8 sm:h-9 rounded-lg font-mono text-[9px] border bg-[#2A2D32] border-black/40 text-slate-400 flex items-center justify-center">
              shift ⇧
            </div>
            {['z', 'x', 'c', 'v', 'b', 'n', 'm', ',', '.', '/'].map((char) => {
              const isTarget = target === char;
              const isPressed = last === char;
              return (
                <motion.div
                  key={char}
                  animate={isPressed ? { y: 1.5, scale: 0.96 } : { y: 0, scale: 1 }}
                  className={`w-7 sm:w-9 h-8 sm:h-9 rounded-lg font-sans text-xs uppercase font-medium border flex items-center justify-center transition-all select-none ${
                    isTarget
                      ? 'bg-cyan-500/25 border-cyan-400 text-cyan-200 shadow-neon-cyan ring-1 ring-cyan-400'
                      : 'bg-[#2A2D32] border-black/40 text-slate-200 shadow-sm'
                  }`}
                >
                  {char}
                </motion.div>
              );
            })}
            <div className="w-14 sm:w-16 h-8 sm:h-9 rounded-lg font-mono text-[9px] border bg-[#2A2D32] border-black/40 text-slate-400 flex items-center justify-center">
              shift ⇧
            </div>
          </div>

          {/* Bottom Apple Control Row */}
          <div className="flex justify-center items-center gap-1 sm:gap-1.5 mt-0.5">
            <span className="w-9 h-8 rounded-lg border bg-[#2A2D32] border-black/40 text-[9px] font-mono text-slate-400 flex items-center justify-center">fn 🌐</span>
            <span className="w-9 h-8 rounded-lg border bg-[#2A2D32] border-black/40 text-[9px] font-mono text-slate-400 flex items-center justify-center">control ⌃</span>
            <span className="w-9 h-8 rounded-lg border bg-[#2A2D32] border-black/40 text-[9px] font-mono text-slate-400 flex items-center justify-center">option ⌥</span>
            <span className="w-11 h-8 rounded-lg border bg-[#2A2D32] border-black/40 text-[9px] font-mono text-slate-300 font-bold flex items-center justify-center">command ⌘</span>

            {/* MacBook Spacebar */}
            <motion.div
              animate={last === ' ' ? { y: 1.5, scale: 0.98 } : { y: 0, scale: 1 }}
              className={`w-40 sm:w-56 h-8 rounded-lg border flex items-center justify-center font-mono text-[10px] uppercase tracking-wider transition-all select-none ${
                target === ' '
                  ? 'bg-amber-500/25 border-amber-400 text-amber-200 shadow-neon-amber ring-1 ring-amber-400'
                  : 'bg-[#2A2D32] border-black/40 text-slate-400'
              }`}
            >
              SPACE (␣)
            </motion.div>

            <span className="w-11 h-8 rounded-lg border bg-[#2A2D32] border-black/40 text-[9px] font-mono text-slate-300 font-bold flex items-center justify-center">command ⌘</span>
            <span className="w-9 h-8 rounded-lg border bg-[#2A2D32] border-black/40 text-[9px] font-mono text-slate-400 flex items-center justify-center">option ⌥</span>
            <div className="flex gap-0.5">
              <span className="w-5 h-8 rounded-lg border bg-[#2A2D32] border-black/40 text-[8px] text-slate-400 flex items-center justify-center">◀</span>
              <span className="w-5 h-8 rounded-lg border bg-[#2A2D32] border-black/40 text-[8px] text-slate-400 flex items-center justify-center">▶</span>
            </div>
          </div>
        </div>
      ) : keyboardLayout === 'ipad' ? (
        /* RENDERER: IPADOS ON-SCREEN TOUCH KEYBOARD */
        <div className="flex flex-col gap-1.5 p-3 rounded-3xl border bg-slate-900/60 border-white/10 backdrop-blur-xl shadow-2xl">
          {/* Top Row: QWERTY with secondary flick characters */}
          <div className="flex justify-center gap-1 sm:gap-1.5">
            {['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'].map((char) => {
              const isTarget = target === char;
              const isPressed = last === char;
              const secondary = IPAD_SECONDARY[char];
              return (
                <motion.div
                  key={char}
                  animate={isPressed ? { scale: 1.15, y: -4 } : { scale: 1, y: 0 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 25 }}
                  className={`w-8 sm:w-11 h-10 sm:h-12 rounded-xl font-sans border flex flex-col items-center justify-between p-1 transition-all select-none shadow-md ${
                    isTarget
                      ? 'bg-cyan-500/30 border-cyan-400 text-white shadow-neon-cyan ring-2 ring-cyan-400 font-black'
                      : 'bg-white/10 border-white/15 text-white/90'
                  }`}
                >
                  <span className="text-[9px] text-slate-400 font-mono self-start">{secondary}</span>
                  <span className="text-sm font-semibold uppercase">{char}</span>
                  <span className="w-1" />
                </motion.div>
              );
            })}
            {/* iPad Delete Pill */}
            <div className="w-10 sm:w-12 h-10 sm:h-12 rounded-xl border bg-white/5 border-white/10 text-slate-300 flex items-center justify-center text-sm shadow-md">
              ⌫
            </div>
          </div>

          {/* Row 2: ASDFGHJKL + Bright Blue Return Button */}
          <div className="flex justify-center gap-1 sm:gap-1.5">
            {['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l'].map((char) => {
              const isTarget = target === char;
              const isPressed = last === char;
              const secondary = IPAD_SECONDARY[char];
              return (
                <motion.div
                  key={char}
                  animate={isPressed ? { scale: 1.15, y: -4 } : { scale: 1, y: 0 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 25 }}
                  className={`w-8 sm:w-11 h-10 sm:h-12 rounded-xl font-sans border flex flex-col items-center justify-between p-1 transition-all select-none shadow-md ${
                    isTarget
                      ? 'bg-cyan-500/30 border-cyan-400 text-white shadow-neon-cyan ring-2 ring-cyan-400 font-black'
                      : 'bg-white/10 border-white/15 text-white/90'
                  }`}
                >
                  <span className="text-[9px] text-slate-400 font-mono self-start">{secondary}</span>
                  <span className="text-sm font-semibold uppercase">{char}</span>
                  <span className="w-1" />
                </motion.div>
              );
            })}
            {/* iPad Signature Blue Return Pill */}
            <motion.div
              animate={last === '\n' ? { scale: 0.95 } : { scale: 1 }}
              className="w-14 sm:w-18 h-10 sm:h-12 rounded-xl border bg-blue-600 border-blue-400 text-white font-sans font-bold text-xs flex items-center justify-center shadow-lg shadow-blue-600/30 select-none"
            >
              return
            </motion.div>
          </div>

          {/* Row 3: Shift + ZXCVBNM + Punctuation + Shift */}
          <div className="flex justify-center gap-1 sm:gap-1.5">
            <div className="w-11 sm:w-13 h-10 sm:h-12 rounded-xl border bg-white/5 border-white/10 text-slate-300 flex items-center justify-center text-sm shadow-md">
              ⇧
            </div>
            {['z', 'x', 'c', 'v', 'b', 'n', 'm', ',', '.'].map((char) => {
              const isTarget = target === char;
              const isPressed = last === char;
              const secondary = IPAD_SECONDARY[char];
              return (
                <motion.div
                  key={char}
                  animate={isPressed ? { scale: 1.15, y: -4 } : { scale: 1, y: 0 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 25 }}
                  className={`w-8 sm:w-11 h-10 sm:h-12 rounded-xl font-sans border flex flex-col items-center justify-between p-1 transition-all select-none shadow-md ${
                    isTarget
                      ? 'bg-cyan-500/30 border-cyan-400 text-white shadow-neon-cyan ring-2 ring-cyan-400 font-black'
                      : 'bg-white/10 border-white/15 text-white/90'
                  }`}
                >
                  <span className="text-[9px] text-slate-400 font-mono self-start">{secondary || ''}</span>
                  <span className="text-sm font-semibold uppercase">{char}</span>
                  <span className="w-1" />
                </motion.div>
              );
            })}
            <div className="w-11 sm:w-13 h-10 sm:h-12 rounded-xl border bg-white/5 border-white/10 text-slate-300 flex items-center justify-center text-sm shadow-md">
              ⇧
            </div>
          </div>

          {/* Row 4: .?123 + Globe + Mic + Soft Glass Spacebar + Dismiss */}
          <div className="flex justify-center items-center gap-1.5 sm:gap-2 mt-1">
            <span className="px-3 h-9 sm:h-10 rounded-xl border bg-white/5 border-white/10 text-xs font-mono text-slate-300 flex items-center justify-center">
              .?123
            </span>
            <span className="w-9 h-9 sm:h-10 rounded-xl border bg-white/5 border-white/10 text-sm flex items-center justify-center">
              🌐
            </span>
            <span className="w-9 h-9 sm:h-10 rounded-xl border bg-white/5 border-white/10 text-sm flex items-center justify-center">
              🎙️
            </span>

            {/* iPad Soft Glass Spacebar */}
            <motion.div
              animate={last === ' ' ? { scale: 0.97, y: 1 } : { scale: 1, y: 0 }}
              className={`w-44 sm:w-64 h-9 sm:h-10 rounded-xl border flex items-center justify-center font-sans text-xs font-medium transition-all select-none shadow-md ${
                target === ' '
                  ? 'bg-cyan-500/30 border-cyan-400 text-white shadow-neon-cyan ring-2 ring-cyan-400 font-bold'
                  : 'bg-white/15 border-white/20 text-slate-200'
              }`}
            >
              space
            </motion.div>

            <span className="px-3 h-9 sm:h-10 rounded-xl border bg-white/5 border-white/10 text-xs font-mono text-slate-300 flex items-center justify-center">
              .?123
            </span>
            <span className="w-9 h-9 sm:h-10 rounded-xl border bg-white/5 border-white/10 text-sm flex items-center justify-center">
              ⌨️↓
            </span>
          </div>
        </div>
      ) : (
        /* RENDERER: STANDARD MECHANICAL HARDWARE LAYOUTS (QWERTY, DVORAK, COLEMAK, WORKMAN, AZERTY) */
        <>
          {(STANDARD_LAYOUTS[keyboardLayout] || STANDARD_LAYOUTS.qwerty).map((row, rIdx) => {
            const [leftHoming, rightHoming] = HOMING_KEYS[keyboardLayout] || ['f', 'j'];
            return (
              <div
                key={rIdx}
                className="flex justify-center gap-1 sm:gap-1.5"
                style={{ paddingLeft: `${rIdx * 12}px` }}
              >
                {row.map((char) => {
                  const isTarget = target === char;
                  const isPressed = last === char;
                  const hasHomingBump = char === leftHoming || char === rightHoming;

                  return (
                    <motion.div
                      key={char}
                      animate={isPressed ? { y: 2, scale: 0.95 } : { y: 0, scale: 1 }}
                      transition={{ type: 'spring', stiffness: 500, damping: 20 }}
                      className={`w-8 h-9 sm:w-10 sm:h-11 rounded-xl font-mono text-xs uppercase font-bold border flex flex-col items-center justify-between p-1 transition-colors relative select-none ${
                        isTarget
                          ? isOrganic
                            ? 'bg-[#7C8D81]/20 border-[#7C8D81] text-[#7C8D81] ring-1 ring-[#7C8D81] shadow-sm font-black'
                            : effectiveIsSerious
                            ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300 shadow-neon-emerald ring-1 ring-emerald-400'
                            : 'bg-cyan-500/20 border-cyan-400 text-cyan-300 shadow-neon-cyan ring-1 ring-cyan-400'
                          : isOrganic
                          ? 'bg-white border-[#E5DFD7] text-[#333333] shadow-sm'
                          : 'bg-slate-900/80 border-white/10 text-slate-400'
                      }`}
                    >
                      <span>{char}</span>

                      {/* Tactile homing bar */}
                      {hasHomingBump && (
                        <span className={`w-2.5 h-0.5 rounded-full mb-0.5 ${
                          isOrganic ? 'bg-[#C97D5A]' : effectiveIsSerious ? 'bg-emerald-400/80' : 'bg-cyan-400/80'
                        }`} />
                      )}
                    </motion.div>
                  );
                })}
              </div>
            );
          })}

          {/* Bottom Spacebar Row for Standard Mechanical Layouts */}
          <div className="flex justify-center mt-1">
            <motion.div
              animate={last === ' ' ? { y: 2, scale: 0.98 } : { y: 0, scale: 1 }}
              className={`w-52 h-9 sm:h-10 rounded-xl border flex items-center justify-center font-mono text-[11px] uppercase tracking-wider transition-colors select-none ${
                target === ' '
                  ? isOrganic
                    ? 'bg-[#C97D5A]/20 border-[#C97D5A] text-[#C97D5A] ring-1 ring-[#C97D5A] shadow-sm font-black'
                    : effectiveIsSerious
                    ? 'bg-emerald-500/25 border-emerald-400 text-emerald-300 shadow-neon-emerald ring-1 ring-emerald-400'
                    : 'bg-amber-500/20 border-amber-400 text-amber-300 shadow-neon-amber ring-1 ring-amber-400'
                  : isOrganic
                  ? 'bg-white border-[#E5DFD7] text-[#616864] shadow-sm'
                  : 'bg-slate-900/80 border-white/10 text-slate-500'
              }`}
            >
              SPACEBAR (␣)
            </motion.div>
          </div>
        </>
      )}
    </div>
  );
};
