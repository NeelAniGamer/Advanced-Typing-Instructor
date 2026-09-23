import React, { useState } from 'react';
import { useGameStore } from '../../stores/useGameStore';
import { isOrganicTheme } from '../../utils/theme';
import { X, Grid3X3, Info, AlertTriangle, CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { Chip } from '../HeroUI';
import { NumberTicker } from '../SpectrumUI';

export const KeyboardHeatmap: React.FC = () => {
  const { heatmap, setModal, uiTheme } = useGameStore();
  const isOrganic = isOrganicTheme(uiTheme);
  const [selectedKey, setSelectedKey] = useState<string | null>(null);

  const keyboardRows = [
    ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p', '[', ']'],
    ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l', ';', "'"],
    ['z', 'x', 'c', 'v', 'b', 'n', 'm', ',', '.', '/'],
  ];

  const getKeyMetrics = (k: string) => {
    const data = heatmap[k.toLowerCase()];
    if (!data || data.hits + data.errors === 0) {
      return {
        hits: 0,
        errors: 0,
        acc: 100,
        color: isOrganic
          ? 'bg-white border-[#E5DFD7] text-[#616864] hover:border-[#7C8D81]'
          : 'bg-slate-900 border-white/10 text-slate-400 hover:border-cyan-400/40',
      };
    }
    const total = data.hits + data.errors;
    const acc = Math.round((data.hits / total) * 100);

    if (acc < 80) {
      return {
        hits: data.hits,
        errors: data.errors,
        acc,
        color: isOrganic
          ? 'bg-red-100 border-red-300 text-red-800 shadow-sm'
          : 'bg-red-950/60 border-red-500/60 text-red-300 shadow-neon-red',
      };
    }
    if (acc < 92) {
      return {
        hits: data.hits,
        errors: data.errors,
        acc,
        color: isOrganic
          ? 'bg-amber-100 border-amber-300 text-amber-800 shadow-sm'
          : 'bg-amber-950/60 border-amber-500/60 text-amber-300 shadow-neon-amber',
      };
    }
    return {
      hits: data.hits,
      errors: data.errors,
      acc,
      color: isOrganic
        ? 'bg-emerald-100 border-emerald-300 text-emerald-800 shadow-sm'
        : 'bg-emerald-950/60 border-emerald-500/60 text-emerald-300 shadow-neon-green',
    };
  };

  const selectedMetrics = selectedKey ? getKeyMetrics(selectedKey) : null;

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) setModal(null);
      }}
      className={`fixed inset-0 z-[100] backdrop-blur-xl flex items-center justify-center p-4 transition-colors ${
        isOrganic ? 'bg-black/65' : 'bg-black/80'
      }`}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className={`max-w-3xl w-full p-6 sm:p-8 rounded-3xl flex flex-col gap-6 transition-all ${
          isOrganic
            ? 'bg-[#FAF8F5] border border-[#E5DFD7] text-[#333333] shadow-2xl'
            : 'glass-panel border border-white/10 text-white shadow-2xl'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className={`p-2.5 rounded-xl border ${
                isOrganic
                  ? 'bg-[#7C8D81]/15 border-[#7C8D81]/30 text-[#7C8D81]'
                  : 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400'
              }`}
            >
              <Grid3X3 className="w-5 h-5" />
            </div>
            <div>
              <h3
                className={`font-display font-bold text-xl ${
                  isOrganic ? 'text-[#333333]' : 'text-white'
                }`}
              >
                Mechanical Keyboard Heatmap
              </h3>
              <p
                className={`text-xs ${
                  isOrganic ? 'text-[#616864]' : 'text-slate-400'
                }`}
              >
                Visualizing keystroke accuracy &amp; mistake density across switches
              </p>
            </div>
          </div>

          <button
            onClick={() => setModal(null)}
            className={`p-2 rounded-xl transition-colors ${
              isOrganic
                ? 'bg-white border border-[#E5DFD7] text-[#616864] hover:text-[#333333] shadow-sm'
                : 'bg-slate-900 border border-white/10 text-slate-400 hover:text-white'
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Keyboard Layout */}
        <div
          className={`flex flex-col gap-2 p-5 rounded-2xl border transition-all ${
            isOrganic
              ? 'bg-[#F4F0EA]/70 border-[#E5DFD7]'
              : 'bg-slate-950/80 border-white/5'
          }`}
        >
          {keyboardRows.map((row, rIdx) => (
            <div 
              key={rIdx} 
              className="flex justify-center gap-1.5 sm:gap-2"
              style={{ paddingLeft: `${rIdx * 14}px` }}
            >
              {row.map((char) => {
                const { color } = getKeyMetrics(char);
                const isSelected = selectedKey === char;

                return (
                  <button
                    key={char}
                    onClick={() => setSelectedKey(char)}
                    className={`w-9 h-10 sm:w-12 sm:h-12 rounded-xl font-mono text-sm sm:text-base uppercase font-bold border transition-all flex flex-col items-center justify-center ${color} ${
                      isSelected
                        ? isOrganic
                          ? 'ring-2 ring-[#C97D5A] scale-105'
                          : 'ring-2 ring-cyan-400 scale-105'
                        : 'hover:scale-105'
                    }`}
                  >
                    <span>{char}</span>
                  </button>
                );
              })}
            </div>
          ))}

          {/* Spacebar */}
          <div className="flex justify-center mt-1">
            <button
              onClick={() => setSelectedKey(' ')}
              className={`w-64 h-10 rounded-xl font-mono text-xs uppercase font-bold border transition-all flex items-center justify-center ${
                getKeyMetrics(' ').color
              }`}
            >
              <span>Spacebar (␣)</span>
            </button>
          </div>
        </div>

        {/* Selected Key Details */}
        <div
          className={`p-4 rounded-2xl border flex items-center justify-between transition-all ${
            isOrganic
              ? 'bg-white border-[#E5DFD7] text-[#333333] shadow-sm'
              : 'glass-panel border-white/10 text-white'
          }`}
        >
          {selectedKey && selectedMetrics ? (
            <div className="flex items-center gap-6">
              <div
                className={`text-center px-4 py-1.5 rounded-xl border font-mono font-bold text-xl ${
                  isOrganic
                    ? 'bg-[#FAF8F5] border-[#E5DFD7] text-[#333333]'
                    : 'bg-slate-900 border-white/10 text-white'
                }`}
              >
                {selectedKey === ' ' ? 'SPACE' : selectedKey.toUpperCase()}
              </div>
              <div
                className={`flex gap-4 text-xs font-mono ${
                  isOrganic ? 'text-[#616864]' : 'text-slate-300'
                }`}
              >
                <div>
                  Hits:{' '}
                  <b className={isOrganic ? 'text-emerald-700' : 'text-emerald-400'}>
                    <NumberTicker value={selectedMetrics.hits} />
                  </b>
                </div>
                <div>
                  Errors:{' '}
                  <b className={isOrganic ? 'text-red-700' : 'text-red-400'}>
                    <NumberTicker value={selectedMetrics.errors} />
                  </b>
                </div>
                <div>
                  Accuracy:{' '}
                  <b className={isOrganic ? 'text-[#C97D5A]' : 'text-cyan-400'}>
                    <NumberTicker value={selectedMetrics.acc} suffix="%" />
                  </b>
                </div>
              </div>
            </div>
          ) : (
            <div
              className={`flex items-center gap-2 text-xs ${
                isOrganic ? 'text-[#616864]' : 'text-slate-400'
              }`}
            >
              <Info
                className={`w-4 h-4 ${
                  isOrganic ? 'text-[#7C8D81]' : 'text-cyan-400'
                }`}
              />
              <span>Click any keycap to inspect mistake frequency and hit metrics.</span>
            </div>
          )}

          {/* Legend */}
          <div className="flex items-center gap-2">
            <Chip size="sm" variant="soft" color="success">
              &gt;92%
            </Chip>
            <Chip size="sm" variant="soft" color="warning">
              80-92%
            </Chip>
            <Chip size="sm" variant="soft" color="danger">
              &lt;80%
            </Chip>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
