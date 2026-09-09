import React, { useState } from 'react';
import { useGameStore } from '../../stores/useGameStore';
import { 
  X, 
  FileText, 
  Code2, 
  BookOpen, 
  Play, 
  Clock, 
  Sparkles, 
  AlignLeft, 
  Terminal 
} from 'lucide-react';
import { motion } from 'framer-motion';

const PRESETS = [
  {
    title: 'JavaScript Async / Await',
    icon: '⚡',
    category: 'Code',
    content: `async function fetchPlayerData(endpoint, token) {
  try {
    const response = await fetch(endpoint, {
      headers: { Authorization: \`Bearer \${token}\` }
    });
    if (!response.ok) throw new Error("Network latency detected");
    const data = await response.json();
    return { success: true, payload: data };
  } catch (error) {
    console.error("Transmission fault:", error.message);
    return { success: false, error };
  }
}`
  },
  {
    title: 'Python Binary Search Algorithm',
    icon: '🐍',
    category: 'Code',
    content: `def binary_search(array, target):
    low = 0
    high = len(array) - 1
    while low <= high:
        mid = (low + high) // 2
        guess = array[mid]
        if guess == target:
            return mid
        if guess > target:
            high = mid - 1
        else:
            low = mid + 1
    return None`
  },
  {
    title: 'C++ Modern Pointers & Memory',
    icon: '💻',
    category: 'Code',
    content: `#include <memory>
#include <vector>
#include <iostream>

struct KeycapActuator {
    int actuation_force_grams = 45;
    double travel_distance_mm = 2.0;
};

int main() {
    auto switch_ptr = std::make_unique<KeycapActuator>();
    std::cout << "Actuation at: " << switch_ptr->travel_distance_mm << "mm\\n";
    return 0;
}`
  },
  {
    title: 'Cyberpunk Neuromancer Opening',
    icon: '🌌',
    category: 'Literature',
    content: `The sky above the port was the color of television, tuned to a dead channel. It was not a matter of having no choice, but of recognizing that the matrix had its own gravity. Neon reflections spilled across wet asphalt, humming with the static of a billion connected cybernetic conduits.`
  },
  {
    title: 'System Design Architecture Pitch',
    icon: '💼',
    category: 'Literature',
    content: `Our high-throughput microservices cluster achieves sub-ten millisecond p99 latency across distributed geographical regions. By decoupling event ingestion using distributed queues and in-memory caches, we maintain maximum fault tolerance even during sudden traffic spikes.`
  }
];

export const CustomPracticeModal: React.FC = () => {
  const { user, loadCustomText, setModal } = useGameStore();
  const [customText, setCustomText] = useState(PRESETS[0].content);
  const [selectedTitle, setSelectedTitle] = useState(PRESETS[0].title);

  const cleanText = customText.trim();
  const wordCount = cleanText ? cleanText.split(/\s+/).length : 0;
  const charCount = cleanText.length;
  const estimatedSeconds = Math.max(10, Math.round((wordCount / Math.max(20, user.best_wpm || 50)) * 60));

  const handleApplyPreset = (preset: typeof PRESETS[0]) => {
    setCustomText(preset.content);
    setSelectedTitle(preset.title);
  };

  const handleStartSession = () => {
    if (!cleanText) return;
    loadCustomText(cleanText, selectedTitle);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="glass-panel w-full max-w-2xl p-6 sm:p-7 rounded-3xl border border-cyan-500/30 shadow-[0_0_50px_rgba(0,245,255,0.15)] flex flex-col gap-5 relative max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-cyan-500/10 border border-cyan-400/30 shadow-neon-cyan">
              <FileText className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <span className="text-[10px] font-mono uppercase tracking-widest text-cyan-400 font-bold">
                Custom Actuation Protocol
              </span>
              <h3 className="font-display font-black text-xl text-white tracking-wide">
                Custom Practice Mode
              </h3>
            </div>
          </div>

          <button
            onClick={() => setModal(null)}
            className="p-2 rounded-xl bg-slate-900 border border-white/10 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Presets Selection Bar */}
        <div>
          <label className="text-xs font-bold text-slate-400 mb-2 block uppercase tracking-wider font-mono">
            Instant Presets (Click to Load)
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {PRESETS.map((p) => (
              <button
                key={p.title}
                type="button"
                onClick={() => handleApplyPreset(p)}
                className={`p-2.5 rounded-xl border text-left flex items-center gap-2 transition-all ${
                  selectedTitle === p.title
                    ? 'bg-cyan-500/20 border-cyan-400 shadow-neon-cyan text-cyan-300'
                    : 'bg-slate-950/60 border-white/10 text-slate-300 hover:border-white/30 hover:bg-white/5'
                }`}
              >
                <span className="text-lg">{p.icon}</span>
                <span className="text-xs font-semibold truncate">{p.title}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Text Input Area */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-slate-300 font-mono uppercase tracking-wider">
              Paste or Type Your Custom Text / Code
            </label>
            <span className="text-[11px] font-mono text-slate-400">
              {wordCount} words • {charCount} chars
            </span>
          </div>

          <textarea
            value={customText}
            onChange={(e) => {
              setCustomText(e.target.value);
              setSelectedTitle('Custom Session');
            }}
            rows={7}
            placeholder="Paste your code syntax, literature paragraphs, or test prompts here..."
            className="w-full bg-slate-950/90 border border-white/10 rounded-2xl p-4 text-sm font-mono text-cyan-300 placeholder-slate-600 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-all resize-y leading-relaxed"
          />
        </div>

        {/* Telemetry Summary & Launch Button */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2 border-t border-white/10">
          <div className="flex items-center gap-4 text-xs font-mono text-slate-400">
            <div className="flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-cyan-400" />
              <span>Est. Time: ~{estimatedSeconds}s</span>
            </div>
            <div className="hidden sm:inline text-slate-600">•</div>
            <div className="hidden sm:flex items-center gap-1 text-slate-400">
              <span>Personal Pace: {user.best_wpm || 50} WPM</span>
            </div>
          </div>

          <button
            onClick={handleStartSession}
            disabled={wordCount === 0}
            className="w-full sm:w-auto px-8 py-3 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-display font-black text-sm tracking-wide hover:shadow-neon-cyan transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:pointer-events-none active:scale-95"
          >
            <Play className="w-4 h-4" /> Start Custom Session
          </button>
        </div>

      </motion.div>
    </div>
  );
};
