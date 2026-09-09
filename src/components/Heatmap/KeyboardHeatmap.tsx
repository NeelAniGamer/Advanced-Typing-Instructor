import React, { useState } from 'react';
import { useGameStore } from '../../stores/useGameStore';
import { X, Grid3X3, Info, AlertTriangle, CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';

export const KeyboardHeatmap: React.FC = () => {
  const { heatmap, setModal } = useGameStore();
  const [selectedKey, setSelectedKey] = useState<string | null>(null);

  const keyboardRows = [
    ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p', '[', ']'],
    ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l', ';', "'"],
    ['z', 'x', 'c', 'v', 'b', 'n', 'm', ',', '.', '/'],
  ];

  const getKeyMetrics = (k: string) => {
    const data = heatmap[k.toLowerCase()];
    if (!data || data.hits + data.errors === 0) {
      return { hits: 0, errors: 0, acc: 100, color: 'bg-slate-900 border-white/10 text-slate-400' };
    }
    const total = data.hits + data.errors;
    const acc = Math.round((data.hits / total) * 100);

    if (acc < 80) return { hits: data.hits, errors: data.errors, acc, color: 'bg-red-950/60 border-red-500/60 text-red-300 shadow-neon-red' };
    if (acc < 92) return { hits: data.hits, errors: data.errors, acc, color: 'bg-amber-950/60 border-amber-500/60 text-amber-300 shadow-neon-amber' };
    return { hits: data.hits, errors: data.errors, acc, color: 'bg-emerald-950/60 border-emerald-500/60 text-emerald-300 shadow-neon-green' };
  };

  const selectedMetrics = selectedKey ? getKeyMetrics(selectedKey) : null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="glass-panel max-w-3xl w-full p-6 sm:p-8 rounded-3xl border border-white/10 shadow-2xl flex flex-col gap-6"
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
              <Grid3X3 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-display font-bold text-xl text-white">
                Mechanical Keyboard Heatmap
              </h3>
              <p className="text-xs text-slate-400">
                Visualizing keystroke accuracy &amp; mistake density across switches
              </p>
            </div>
          </div>

          <button
            onClick={() => setModal(null)}
            className="p-2 rounded-xl bg-slate-900 border border-white/10 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Keyboard Layout */}
        <div className="flex flex-col gap-2 bg-slate-950/80 p-5 rounded-2xl border border-white/5">
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
                      isSelected ? 'ring-2 ring-cyan-400 scale-105' : 'hover:scale-105'
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
              className={`w-64 h-10 rounded-xl font-mono text-xs uppercase font-bold border transition-all flex items-center justify-center ${getKeyMetrics(' ').color}`}
            >
              <span>Spacebar (␣)</span>
            </button>
          </div>
        </div>

        {/* Selected Key Details */}
        <div className="glass-panel p-4 rounded-2xl border border-white/10 flex items-center justify-between">
          {selectedKey && selectedMetrics ? (
            <div className="flex items-center gap-6">
              <div className="text-center px-4 py-1.5 bg-slate-900 rounded-xl border border-white/10 font-mono font-bold text-xl text-white">
                {selectedKey === ' ' ? 'SPACE' : selectedKey.toUpperCase()}
              </div>
              <div className="flex gap-4 text-xs font-mono">
                <div>Hits: <b className="text-emerald-400">{selectedMetrics.hits}</b></div>
                <div>Errors: <b className="text-red-400">{selectedMetrics.errors}</b></div>
                <div>Accuracy: <b className="text-cyan-400">{selectedMetrics.acc}%</b></div>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <Info className="w-4 h-4 text-cyan-400" />
              <span>Click any keycap to inspect mistake frequency and hit metrics.</span>
            </div>
          )}

          {/* Legend */}
          <div className="flex items-center gap-3 text-[11px] font-mono">
            <span className="flex items-center gap-1 text-emerald-400">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-neon-green" /> &gt;92%
            </span>
            <span className="flex items-center gap-1 text-amber-400">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shadow-neon-amber" /> 80-92%
            </span>
            <span className="flex items-center gap-1 text-red-400">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500 shadow-neon-red" /> &lt;80%
            </span>
          </div>
        </div>

      </motion.div>
    </div>
  );
};
