import React from 'react';
import { motion } from 'framer-motion';
import { useGameStore } from '../../stores/useGameStore';
import { KeyboardLayout } from '../../types/game';

interface VirtualKeyboardProps {
  currentKey?: string;
  lastKeyTyped?: string;
}

const LAYOUTS: Record<KeyboardLayout, string[][]> = {
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
};

const HOMING_KEYS: Record<KeyboardLayout, [string, string]> = {
  qwerty: ['f', 'j'],
  dvorak: ['u', 'h'],
  colemak: ['t', 'n'],
};

export const VirtualKeyboard: React.FC<VirtualKeyboardProps> = ({ currentKey, lastKeyTyped }) => {
  const { keyboardLayout, setKeyboardLayout } = useGameStore();

  const rows = LAYOUTS[keyboardLayout] || LAYOUTS.qwerty;
  const [leftHoming, rightHoming] = HOMING_KEYS[keyboardLayout] || ['f', 'j'];

  const target = currentKey?.toLowerCase();
  const last = lastKeyTyped?.toLowerCase();

  return (
    <div className="glass-panel p-4 sm:p-5 rounded-3xl border border-white/10 bg-slate-950/70 flex flex-col gap-2 shadow-2xl max-w-2xl mx-auto w-full">
      {/* Top Layout Switcher Pill */}
      <div className="flex items-center justify-between px-2 pb-1 border-b border-white/5">
        <span className="text-[10px] font-mono uppercase tracking-widest text-slate-500 font-bold">
          Hardware Keycaps
        </span>

        <div className="flex items-center gap-1 bg-slate-900/80 p-0.5 rounded-xl border border-white/10">
          {(['qwerty', 'dvorak', 'colemak'] as KeyboardLayout[]).map((layout) => (
            <button
              key={layout}
              onClick={() => setKeyboardLayout(layout)}
              className={`px-2.5 py-0.5 rounded-lg text-[10px] font-mono uppercase font-bold transition-all ${
                keyboardLayout === layout
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/40 shadow-neon-cyan'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              {layout}
            </button>
          ))}
        </div>
      </div>

      {/* Rows */}
      {rows.map((row, rIdx) => (
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
                    ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 shadow-neon-cyan ring-1 ring-cyan-400'
                    : 'bg-slate-900/80 border-white/10 text-slate-400'
                }`}
              >
                <span>{char}</span>

                {/* Tactile homing bar */}
                {hasHomingBump && (
                  <span className="w-2.5 h-0.5 rounded-full bg-cyan-400/80 mb-0.5" />
                )}
              </motion.div>
            );
          })}
        </div>
      ))}

      {/* Bottom Spacebar Row */}
      <div className="flex justify-center mt-1">
        <motion.div
          animate={last === ' ' ? { y: 2, scale: 0.98 } : { y: 0, scale: 1 }}
          className={`w-52 h-9 sm:h-10 rounded-xl border flex items-center justify-center font-mono text-[11px] uppercase tracking-wider transition-colors select-none ${
            target === ' '
              ? 'bg-amber-500/20 border-amber-400 text-amber-300 shadow-neon-amber ring-1 ring-amber-400'
              : 'bg-slate-900/80 border-white/10 text-slate-500'
          }`}
        >
          SPACEBAR (␣)
        </motion.div>
      </div>
    </div>
  );
};
