import React, { useState } from 'react';
import { useGameStore } from '../../stores/useGameStore';
import { isOrganicTheme } from '../../utils/theme';
import { 
  X, 
  FileText, 
  Code2, 
  BookOpen, 
  Play, 
  Clock, 
  Sparkles, 
  AlignLeft, 
  Terminal,
  ChevronDown,
  SlidersHorizontal 
} from 'lucide-react';
import { motion } from 'framer-motion';
import { Fieldset, Dropdown, Chip, ProgressBar } from '../HeroUI';
import { NumberTicker } from '../SpectrumUI';

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
    title: 'Kafka Architecture',
    category: 'Literature',
    content: `Kafka is a distributed event store and stream-processing platform. It is designed to handle real-time data feeds with high throughput and low latency. Producers write events to topics, and consumers read them independently.`
  },
  {
    title: 'React Fiber Reconciliation',
    category: 'Literature',
    content: `React Fiber is the complete rewrite of React core algorithm. Its main goal is to enable incremental rendering: the ability to split rendering work into chunks and spread it out over multiple frames.`
  },
  {
    title: 'High-Performance Rust',
    category: 'Literature',
    content: `Rust achieves memory safety without a garbage collector through its ownership and borrowing system. Zero-cost abstractions ensure that expressive high-level code compiles to optimal machine instructions.`
  },
  {
    title: 'Microservices Latency p99',
    category: 'Literature',
    content: `Our high-throughput microservices cluster achieves sub-ten millisecond p99 latency across distributed geographical regions. By decoupling event ingestion using distributed queues and in-memory caches, we maintain maximum fault tolerance even during sudden traffic spikes.`
  }
];

export const CustomPracticeModal: React.FC = () => {
  const { user, loadCustomText, setModal, uiTheme } = useGameStore();
  const isOrganic = isOrganicTheme(uiTheme);
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
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) setModal(null);
      }}
      className={`fixed inset-0 z-[100] flex items-center justify-center p-4 backdrop-blur-xl transition-colors ${
        isOrganic ? 'bg-black/65' : 'bg-black/80'
      }`}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className={`w-full max-w-2xl p-6 sm:p-7 rounded-3xl flex flex-col gap-5 relative max-h-[90vh] overflow-y-auto transition-all ${
          isOrganic
            ? 'bg-[#FAF8F5] border border-[#E5DFD7] text-[#333333] shadow-2xl'
            : 'glass-panel border border-cyan-500/30 text-white shadow-[0_0_50px_rgba(0,245,255,0.15)]'
        }`}
      >
        {/* Header */}
        <div
          className={`flex items-center justify-between border-b pb-4 ${
            isOrganic ? 'border-[#E5DFD7]' : 'border-white/10'
          }`}
        >
          <div className="flex items-center gap-3">
            <div
              className={`p-2.5 rounded-2xl border ${
                isOrganic
                  ? 'bg-[#C97D5A]/15 border-[#C97D5A]/30 text-[#C97D5A]'
                  : 'bg-cyan-500/10 border-cyan-400/30 shadow-neon-cyan text-cyan-400'
              }`}
            >
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <span
                className={`text-[10px] font-mono uppercase tracking-widest font-bold ${
                  isOrganic ? 'text-[#C97D5A]' : 'text-cyan-400'
                }`}
              >
                Custom Actuation Protocol
              </span>
              <h3
                className={`font-display font-black text-xl tracking-wide ${
                  isOrganic ? 'text-[#333333]' : 'text-white'
                }`}
              >
                Custom Practice Mode
              </h3>
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

        {/* HeroUI Fieldset Architecture */}
        <Fieldset variant="card">
          <div className="flex items-center justify-between">
            <Fieldset.Legend icon={<SlidersHorizontal className="w-4 h-4" />}>
              Practice Configuration
            </Fieldset.Legend>
            <div className="flex items-center gap-1.5">
              <Chip size="sm" variant="soft" color={isOrganic ? 'primary' : 'primary'}>
                {wordCount} words
              </Chip>
              <Chip size="sm" variant="outline" color="default">
                {charCount} chars
              </Chip>
            </div>
          </div>
          <Fieldset.Description>
            Select a verified algorithmic snippet, literary passage, or paste your custom code buffer.
          </Fieldset.Description>

          {/* Curated Preset Selector via HeroUI Dropdown */}
          <Fieldset.Item label="Curated Preset Library">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <Dropdown
                selectionMode="single"
                selectedKeys={[selectedTitle]}
                onAction={(key) => {
                  const found = PRESETS.find((p) => p.title === key);
                  if (found) handleApplyPreset(found);
                }}
                className="w-full sm:w-80"
              >
                <Dropdown.Trigger className="w-full">
                  <div
                    className={`w-full px-4 py-2.5 rounded-xl border flex items-center justify-between text-xs transition-all ${
                      isOrganic
                        ? 'bg-white border-[#E5DFD7] text-[#333333] hover:border-[#C97D5A]'
                        : 'bg-slate-950/80 border-white/10 text-white hover:border-cyan-400/50'
                    }`}
                  >
                    <span className="flex items-center gap-2 truncate">
                      <span className="text-base">
                        {PRESETS.find((p) => p.title === selectedTitle)?.icon || '📝'}
                      </span>
                      <span className="font-semibold truncate">{selectedTitle}</span>
                    </span>
                    <ChevronDown className="w-4 h-4 text-slate-400 shrink-0 ml-2" />
                  </div>
                </Dropdown.Trigger>
                <Dropdown.Popover placement="bottom-start" className="w-80">
                  <Dropdown.Menu>
                    <Dropdown.Section title="Code & Algorithms">
                      {PRESETS.filter((p) => p.category === 'Code').map((p) => (
                        <Dropdown.Item
                          key={p.title}
                          id={p.title}
                          description={`${p.content.split('\n').length} lines • Code`}
                          startContent={<span className="text-base">{p.icon}</span>}
                        >
                          {p.title}
                        </Dropdown.Item>
                      ))}
                    </Dropdown.Section>

                    <Dropdown.Separator />

                    <Dropdown.Section title="Literature & Design">
                      {PRESETS.filter((p) => p.category === 'Literature').map((p) => (
                        <Dropdown.Item
                          key={p.title}
                          id={p.title}
                          description="Prose typography"
                          startContent={<span className="text-base">{p.icon}</span>}
                        >
                          {p.title}
                        </Dropdown.Item>
                      ))}
                    </Dropdown.Section>
                  </Dropdown.Menu>
                </Dropdown.Popover>
              </Dropdown>

              {/* Quick Chip Pill Filters */}
              <div className="flex items-center gap-1.5 flex-wrap">
                {PRESETS.slice(0, 3).map((p) => (
                  <Chip
                    key={p.title}
                    size="sm"
                    variant={selectedTitle === p.title ? 'solid' : 'soft'}
                    color={
                      selectedTitle === p.title
                        ? isOrganic
                          ? 'primary'
                          : 'primary'
                        : 'default'
                    }
                    onClick={() => handleApplyPreset(p)}
                  >
                    {p.title.split(' ')[0]}
                  </Chip>
                ))}
              </div>
            </div>
          </Fieldset.Item>

          {/* Text Buffer Field */}
          <Fieldset.Item
            label="Source Code / Text Buffer"
            description="Type or modify the text in the buffer below before commencing the session."
          >
            <textarea
              value={customText}
              onChange={(e) => {
                setCustomText(e.target.value);
                setSelectedTitle('Custom Buffer');
              }}
              rows={6}
              placeholder="Paste custom text or syntax..."
              className={`w-full rounded-2xl p-4 text-xs font-mono transition-all resize-y leading-relaxed focus:outline-none ${
                isOrganic
                  ? 'bg-white border border-[#E5DFD7] text-[#333333] placeholder-[#B8C0BF] focus:border-[#C97D5A] focus:ring-1 focus:ring-[#C97D5A]'
                  : 'bg-slate-950/90 border border-white/10 text-cyan-300 placeholder-slate-600 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400'
              }`}
            />
          </Fieldset.Item>

          {/* Session Length Gauge */}
          <div className="pt-1">
            <ProgressBar
              label="Estimated Session Scope"
              value={Math.min(100, Math.round((wordCount / 150) * 100))}
              minValue={0}
              maxValue={100}
              size="sm"
              color={wordCount > 150 ? 'warning' : 'success'}
              showValueLabel
              valueLabel={`~${estimatedSeconds}s pacing (${wordCount} words)`}
            />
          </div>
        </Fieldset>

        {/* Telemetry Summary & Launch Button */}
        <div
          className={`flex flex-col sm:flex-row items-center justify-between gap-4 pt-2 border-t ${
            isOrganic ? 'border-[#E5DFD7]' : 'border-white/10'
          }`}
        >
          <div
            className={`flex items-center gap-4 text-xs font-mono ${
              isOrganic ? 'text-[#616864]' : 'text-slate-400'
            }`}
          >
            <div className="flex items-center gap-1.5">
              <Clock
                className={`w-4 h-4 ${
                  isOrganic ? 'text-[#C97D5A]' : 'text-cyan-400'
                }`}
              />
              <span>
                Est. Time: ~<NumberTicker value={estimatedSeconds} />s
              </span>
            </div>
            <div
              className={`hidden sm:inline ${
                isOrganic ? 'text-[#B8C0BF]' : 'text-slate-600'
              }`}
            >
              •
            </div>
            <div className="hidden sm:flex items-center gap-1">
              <span>
                Personal Pace: <NumberTicker value={user.best_wpm || 50} /> WPM
              </span>
            </div>
          </div>

          <button
            onClick={handleStartSession}
            disabled={wordCount === 0}
            className={`w-full sm:w-auto px-8 py-3 rounded-2xl font-display font-black text-sm tracking-wide transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:pointer-events-none active:scale-95 ${
              isOrganic
                ? 'bg-[#C97D5A] hover:bg-[#b56d4c] text-white shadow-md'
                : 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white hover:shadow-neon-cyan'
            }`}
          >
            <Play className="w-4 h-4" /> Start Custom Session
          </button>
        </div>
      </motion.div>
    </div>
  );
};
