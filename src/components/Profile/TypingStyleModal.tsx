import React, { useState, useEffect } from 'react';
import { useGameStore } from '../../stores/useGameStore';
import { isOrganicTheme } from '../../utils/theme';
import { CasingStyleId } from '../../types/game';
import { 
  Sparkles, 
  Cpu, 
  ShieldCheck, 
  Check, 
  Zap, 
  Activity, 
  Power, 
  Keyboard, 
  X,
  MessageSquare,
  Bot
} from 'lucide-react';
import { motion } from 'framer-motion';
import { BorderGlow } from '../ReactBits/BorderGlow';
import { Chip, Fieldset } from '../HeroUI';
import { NumberTicker, TiltCard, TiltCardItem, StatusBadge, KbdKey } from '../SpectrumUI';

export const TypingStyleModal: React.FC = () => {
  const { 
    setModal, 
    casingStyle, 
    setCasingStyle, 
    isAIWordMode, 
    setIsAIWordMode,
    typingStyleDescription,
    saveTypingStyle,
    backgroundStats,
    fetchBackgroundStats,
    toggleStartupDaemon,
    fetchNewBatch,
    uiTheme
  } = useGameStore();

  const isOrganic = isOrganicTheme(uiTheme);

  const [descriptionInput, setDescriptionInput] = useState(
    typingStyleDescription || 'I type in normal English with capitals only at sentence starts and keep a fast, continuous flow.'
  );
  const [analysisStatus, setAnalysisStatus] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [startupEnabled, setStartupEnabled] = useState(backgroundStats?.is_startup_enabled ?? false);

  useEffect(() => {
    fetchBackgroundStats();
  }, [fetchBackgroundStats]);

  useEffect(() => {
    if (backgroundStats && typeof backgroundStats.is_startup_enabled === 'boolean') {
      setStartupEnabled(backgroundStats.is_startup_enabled);
    }
  }, [backgroundStats]);

  const styleOptions: { id: CasingStyleId; name: string; tag: string; preview: string; desc: string }[] = [
    {
      id: 'sentence_case',
      name: 'Sentence Case',
      tag: 'Default · Normal',
      preview: 'Precision velocity accuracy. Mechanical switches provide feedback.',
      desc: 'Normal English with capitals only at sentence starts. The standard everyday style.'
    },
    {
      id: 'standard_lowercase',
      name: 'Standard Lowercase',
      tag: 'Flow Sprint',
      preview: 'precision velocity accuracy mechanical switches',
      desc: 'Clean, flowing lowercase characters for maximum pure burst speed.'
    },
    {
      id: 'title_case',
      name: 'Title Case',
      tag: 'Shift Drill',
      preview: 'Precision Velocity Accuracy Mechanical Switches',
      desc: 'Capitalizes the first letter of each word. A Shift-key coordination drill — reads oddly, trains pinky cadence.'
    },
    {
      id: 'camel_case',
      name: 'camelCase',
      tag: 'Engineering',
      preview: 'precisionVelocityAccuracy mechanicalSwitches',
      desc: 'Coding identifier style. Great practice for JavaScript, React, and frontend devs.'
    },
    {
      id: 'snake_case',
      name: 'snake_case',
      tag: 'Backend & Data',
      preview: 'precision_velocity_accuracy mechanical_switches',
      desc: 'Python & database styling. Replaces spaces with rapid underscore transitions.'
    },
    {
      id: 'all_caps',
      name: 'ALL CAPS',
      tag: 'Impact Drill',
      preview: 'PRECISION VELOCITY ACCURACY MECHANICAL SWITCHES',
      desc: 'Continuous uppercase actuation practice for high-stress keyboard drills.'
    }
  ];

  const handleSelectStyle = (id: CasingStyleId) => {
    setCasingStyle(id);
  };

  const handleSaveDescription = async () => {
    setIsSaving(true);
    setAnalysisStatus('Calibrating AI neural parameters to your typing profile...');
    await saveTypingStyle(casingStyle, descriptionInput);
    setTimeout(() => {
      setIsSaving(false);
      setAnalysisStatus('✓ Profile Tuned: PerceptusLM calibrated your curriculum & telemetry to your selected style.');
      fetchNewBatch();
    }, 500);
  };

  const handleToggleStartup = async () => {
    const nextState = !startupEnabled;
    setStartupEnabled(nextState);
    await toggleStartupDaemon(nextState);
  };

  return (
    <div 
      onClick={(e) => {
        if (e.target === e.currentTarget) setModal(null);
      }}
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className={`w-full max-w-4xl max-h-[90vh] rounded-3xl border flex flex-col overflow-hidden transition-all duration-300 ${
          isOrganic
            ? 'bg-[#FAF8F5] border-[#E5DFD7] shadow-organic-card text-[#333333]'
            : 'glass-panel border-cyan-500/30 bg-slate-950/95 text-white shadow-[0_0_60px_rgba(0,245,255,0.15)]'
        }`}
      >
        {/* Header */}
        <div className={`p-6 border-b flex items-center justify-between transition-colors ${
          isOrganic
            ? 'bg-gradient-to-r from-[#F4F0EA] via-white to-[#FAF8F5] border-[#E5DFD7]'
            : 'bg-gradient-to-r from-cyan-950/60 via-slate-900 to-purple-950/60 border-white/10'
        }`}>
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-2xl border flex items-center justify-center transition-colors ${
              isOrganic
                ? 'bg-[#7C8D81]/15 border-[#7C8D81]/35 text-[#7C8D81]'
                : 'bg-cyan-500/20 border-cyan-400/40 text-cyan-300 shadow-neon-cyan'
            }`}>
              <Sparkles className={`w-6 h-6 ${isOrganic ? 'text-[#7C8D81]' : 'text-cyan-400'}`} />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className={`text-xl font-display font-black tracking-wide ${
                  isOrganic ? 'text-[#333333]' : 'text-white'
                }`}>
                  Typing Style & AI Parameters
                </h2>
                <Chip size="sm" variant={isOrganic ? 'soft' : 'solid'} color={isOrganic ? 'primary' : 'primary'}>
                  PerceptusLM AI
                </Chip>
              </div>
              <p className={`text-xs mt-0.5 ${isOrganic ? 'text-[#616864]' : 'text-slate-400'}`}>
                Personalize your casing style, enable procedural AI word synthesis, and inspect background cadence telemetry.
              </p>
            </div>
          </div>
          <button
            onClick={() => setModal(null)}
            className={`w-9 h-9 rounded-xl border flex items-center justify-center transition-all ${
              isOrganic
                ? 'bg-white/80 border-[#E5DFD7] text-[#616864] hover:text-[#333333] hover:bg-[#F2EFEB]'
                : 'bg-slate-900 border-white/10 text-slate-400 hover:text-white hover:bg-white/10'
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          
          {/* Section 1: Active Casing Style Selection */}
          <div>
            <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
              <label className={`text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-2 ${
                isOrganic ? 'text-[#C97D5A]' : 'text-cyan-400'
              }`}>
                <Keyboard className="w-4 h-4" /> Choose Active Casing Style
              </label>
              <span className={`text-[11px] font-mono ${isOrganic ? 'text-[#616864]' : 'text-slate-400'}`}>
                Applied to all 200 levels and AI word batches
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {styleOptions.map((opt) => {
                const isSelected = casingStyle === opt.id;
                return (
                  <TiltCard
                    key={opt.id}
                    maxTilt={8}
                    scale={1.02}
                    className={`p-4 rounded-2xl cursor-pointer transition-all relative flex flex-col justify-between h-full ${
                      isSelected
                        ? isOrganic
                          ? 'bg-white border-2 border-[#C97D5A] shadow-[0_4px_24px_rgba(201,125,90,0.22)] ring-1 ring-[#C97D5A]/40'
                          : 'bg-cyan-500/15 border-2 border-cyan-400 shadow-[0_0_24px_rgba(0,245,255,0.25)]'
                        : isOrganic
                        ? 'bg-white/90 border border-[#E5DFD7] hover:border-[#7C8D81]/70 hover:bg-white'
                        : 'bg-slate-900/60 border border-white/10 hover:border-white/20 hover:bg-slate-900/90'
                    }`}
                    onClick={() => handleSelectStyle(opt.id)}
                  >
                    <TiltCardItem depth={12}>
                      <div className="flex items-center justify-between mb-1.5 gap-2">
                        <span className={`font-display font-bold text-sm ${
                          isOrganic ? 'text-[#333333]' : 'text-white'
                        }`}>
                          {opt.name}
                        </span>
                        {isSelected ? (
                          <span className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${
                            isOrganic
                              ? 'bg-[#C97D5A] text-white shadow-organic-terracotta'
                              : 'bg-cyan-400 text-black shadow-neon-cyan'
                          }`}>
                            <Check className="w-3.5 h-3.5 stroke-[3]" />
                          </span>
                        ) : (
                          <Chip size="sm" variant="soft" color="default">
                            {opt.tag}
                          </Chip>
                        )}
                      </div>

                      <p className={`text-[11px] leading-relaxed mb-3 ${
                        isOrganic ? 'text-[#616864]' : 'text-slate-400'
                      }`}>
                        {opt.desc}
                      </p>
                    </TiltCardItem>

                    <TiltCardItem depth={6}>
                      <div className={`p-2.5 rounded-xl border font-mono text-xs truncate ${
                        isOrganic
                          ? 'bg-[#FAF8F5] border-[#E5DFD7] text-[#C97D5A] font-bold'
                          : 'bg-black/50 border-cyan-500/20 text-cyan-300'
                      }`}>
                        {opt.preview}
                      </div>
                    </TiltCardItem>
                  </TiltCard>
                );
              })}
            </div>
          </div>

          {/* Section 2: AI Procedural Word Synthesis Toggle (Wrapped in React Bits BorderGlow) */}
          <BorderGlow
            edgeSensitivity={24}
            glowRadius={32}
            borderRadius={20}
            glowIntensity={1.05}
            coneSpread={26}
            animated={false}
            backgroundColor={isOrganic ? '#FAF8F5' : '#07090e'}
            glowColor={isOrganic ? '140 20 60' : '270 80 60'}
            colors={
              isOrganic
                ? ['#7C8D81', '#C97D5A', '#EBC078']
                : ['#a855f7', '#06b6d4', '#ec4899']
            }
            className="w-full"
          >
            <div className={`p-5 rounded-2xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-colors ${
              isOrganic
                ? 'bg-gradient-to-r from-[#F4F0EA]/70 via-white to-[#FAF8F5]/70 border-[#E5DFD7]'
                : 'bg-gradient-to-r from-purple-950/40 via-slate-900 to-cyan-950/40 border-purple-500/30'
            }`}>
              <div className="flex items-start gap-3">
                <div className={`w-10 h-10 rounded-xl border flex items-center justify-center flex-shrink-0 mt-0.5 ${
                  isOrganic
                    ? 'bg-[#7C8D81]/15 border-[#7C8D81]/30 text-[#7C8D81]'
                    : 'bg-purple-500/20 border-purple-400/40 text-purple-300'
                }`}>
                  <Bot className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className={`text-sm font-display font-bold ${
                      isOrganic ? 'text-[#333333]' : 'text-white'
                    }`}>
                      On-Device AI Procedural Word Generator (PerceptusLM)
                    </h4>
                    <Chip size="sm" variant="soft" color={isOrganic ? 'secondary' : 'accent'}>
                      Offline Neural AI
                    </Chip>
                  </div>
                  <p className={`text-xs mt-1 leading-relaxed ${
                    isOrganic ? 'text-[#616864]' : 'text-slate-400'
                  }`}>
                    Instead of deterministic dictionary batches, our local neural engine synthesizes randomized, dynamically structured words formatted to your active casing style.
                  </p>
                </div>
              </div>

              <button
                onClick={() => {
                  const next = !isAIWordMode;
                  setIsAIWordMode(next);
                }}
                className={`px-5 py-2.5 rounded-xl font-mono text-xs font-bold transition-all flex-shrink-0 flex items-center gap-2 ${
                  isAIWordMode
                    ? isOrganic
                      ? 'bg-[#C97D5A] text-white shadow-organic-terracotta'
                      : 'bg-purple-500 text-white shadow-[0_0_20px_rgba(168,85,247,0.4)]'
                    : isOrganic
                    ? 'bg-[#FAF8F5] border border-[#E5DFD7] text-[#616864] hover:text-[#333333]'
                    : 'bg-slate-800 text-slate-400 hover:text-white border border-white/10'
                }`}
              >
                <Zap className={`w-3.5 h-3.5 ${
                  isAIWordMode
                    ? isOrganic ? 'text-white' : 'text-amber-300'
                    : isOrganic ? 'text-[#616864]' : 'text-slate-400'
                }`} />
                <span>{isAIWordMode ? 'AI Words Active' : 'Enable AI Words'}</span>
              </button>
            </div>
          </BorderGlow>

          {/* Section 3: Describe Your Personal Typing Style (HeroUI Fieldset) */}
          <Fieldset
            variant="card"
            className={isOrganic ? 'bg-white border-[#E5DFD7]' : 'bg-slate-900/60 border-white/10'}
          >
            <Fieldset.Legend
              badge={
                <Chip size="sm" variant="soft" color={isOrganic ? 'primary' : 'secondary'}>
                  Natural Language Tuning
                </Chip>
              }
              icon={<MessageSquare className="w-4 h-4" />}
            >
              Describe Your Typing Style
            </Fieldset.Legend>
            <Fieldset.Description>
              Tells the AI how you naturally type so it can adapt character pacing, casing, and pinky cadence.
            </Fieldset.Description>
            <Fieldset.Item>
              <textarea
                value={descriptionInput}
                onChange={(e) => setDescriptionInput(e.target.value)}
                placeholder="Describe your typing habits (e.g., I capitalize every word's first letter, prefer home-row anchor, hit 85+ WPM with light tactile switches)..."
                rows={3}
                className={`w-full px-4 py-3 rounded-xl text-sm focus:outline-none transition-all resize-none font-sans border ${
                  isOrganic
                    ? 'bg-[#FAF8F5] border-[#E5DFD7] text-[#333333] placeholder-[#B8C0BF] focus:border-[#C97D5A] focus:ring-1 focus:ring-[#C97D5A]'
                    : 'bg-black/50 border-white/10 text-slate-200 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400'
                }`}
              />
            </Fieldset.Item>

            <div className="flex items-center justify-between flex-wrap gap-3 pt-2">
              <div className={`text-xs font-mono ${isOrganic ? 'text-[#616864]' : 'text-slate-400'}`}>
                {analysisStatus ? (
                  <span className={
                    analysisStatus.startsWith('✓')
                      ? isOrganic ? 'text-[#58675E] font-bold' : 'text-emerald-400 font-bold'
                      : isOrganic ? 'text-[#C97D5A]' : 'text-cyan-300'
                  }>
                    {analysisStatus}
                  </span>
                ) : (
                  <span>PerceptusLM will adjust promotion thresholds and shift ergonomics.</span>
                )}
              </div>

              <button
                onClick={handleSaveDescription}
                disabled={isSaving}
                className={`px-5 py-2.5 rounded-xl font-display font-black text-xs transition-all flex items-center gap-1.5 ${
                  isOrganic
                    ? 'bg-[#C97D5A] hover:bg-[#B86B49] text-white shadow-organic-terracotta'
                    : 'bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black shadow-neon-cyan'
                }`}
              >
                <Cpu className="w-3.5 h-3.5" />
                <span>{isSaving ? 'Calibrating...' : 'Save & Calibrate AI'}</span>
              </button>
            </div>
          </Fieldset>

          {/* Section 4: Background Typing Daemon & Privacy-First Telemetry */}
          <div className={`p-5 rounded-2xl border space-y-4 transition-colors ${
            isOrganic
              ? 'bg-white border-[#E5DFD7]'
              : 'bg-slate-900/60 border-white/10'
          }`}>
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2.5 flex-wrap">
                <Activity className={`w-4 h-4 ${isOrganic ? 'text-[#7C8D81]' : 'text-emerald-400'}`} />
                <span className={`text-xs font-mono font-bold uppercase tracking-wider ${
                  isOrganic ? 'text-[#333333]' : 'text-emerald-400'
                }`}>
                  Background Typing Monitor (Outside of Game)
                </span>
                <StatusBadge 
                  status={backgroundStats?.status === 'Active' ? 'success' : 'active'} 
                  label={backgroundStats?.status || 'Active'} 
                  size="sm" 
                />
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleToggleStartup}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-mono font-bold border transition-all ${
                    startupEnabled
                      ? isOrganic
                        ? 'bg-[#7C8D81]/15 border-[#7C8D81]/35 text-[#58675E]'
                        : 'bg-emerald-500/20 border-emerald-400/50 text-emerald-300 shadow-neon-emerald'
                      : isOrganic
                      ? 'bg-[#FAF8F5] border-[#E5DFD7] text-[#616864]'
                      : 'bg-slate-800 border-white/10 text-slate-400'
                  }`}
                  title="Toggle starting monitor on Windows boot via Registry"
                >
                  <Power className="w-3.5 h-3.5" />
                  <span>Start with Windows: {startupEnabled ? 'ON' : 'OFF'}</span>
                </button>
              </div>
            </div>

            {/* Metrics cards with Spectrum UI NumberTicker */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className={`p-3 rounded-xl border text-center ${
                isOrganic ? 'bg-[#FAF8F5] border-[#E5DFD7]' : 'bg-black/30 border-white/5'
              }`}>
                <div className={`text-[10px] uppercase font-mono ${isOrganic ? 'text-[#616864]' : 'text-slate-400'}`}>
                  Keystrokes Today
                </div>
                <div className={`text-xl font-mono font-black mt-1 ${isOrganic ? 'text-[#333333]' : 'text-white'}`}>
                  <NumberTicker value={backgroundStats?.total_keystrokes_today ?? 0} locale />
                </div>
              </div>

              <div className={`p-3 rounded-xl border text-center ${
                isOrganic ? 'bg-[#FAF8F5] border-[#E5DFD7]' : 'bg-black/30 border-white/5'
              }`}>
                <div className={`text-[10px] uppercase font-mono ${isOrganic ? 'text-[#616864]' : 'text-slate-400'}`}>
                  Active Minutes
                </div>
                <div className={`text-xl font-mono font-black mt-1 ${isOrganic ? 'text-[#7C8D81]' : 'text-cyan-300'}`}>
                  <NumberTicker value={backgroundStats?.active_typing_minutes ?? 0} suffix="m" />
                </div>
              </div>

              <div className={`p-3 rounded-xl border text-center ${
                isOrganic ? 'bg-[#FAF8F5] border-[#E5DFD7]' : 'bg-black/30 border-white/5'
              }`}>
                <div className={`text-[10px] uppercase font-mono ${isOrganic ? 'text-[#616864]' : 'text-slate-400'}`}>
                  Cadence (WPM)
                </div>
                <div className={`text-xl font-mono font-black mt-1 ${isOrganic ? 'text-[#C97D5A]' : 'text-emerald-400'}`}>
                  <NumberTicker value={backgroundStats?.average_cadence_wpm ?? 65} />
                </div>
              </div>

              <div className={`p-3 rounded-xl border text-center ${
                isOrganic ? 'bg-[#FAF8F5] border-[#E5DFD7]' : 'bg-black/30 border-white/5'
              }`}>
                <div className={`text-[10px] uppercase font-mono ${isOrganic ? 'text-[#616864]' : 'text-slate-400'}`}>
                  Shift Usage
                </div>
                <div className={`text-xl font-mono font-black mt-1 ${isOrganic ? 'text-[#966E1F]' : 'text-amber-300'}`}>
                  <NumberTicker value={Math.round((backgroundStats?.shift_usage_ratio ?? 0.12) * 100)} suffix="%" />
                </div>
              </div>
            </div>

            {/* Privacy Guarantee Seal */}
            <div className={`p-3 rounded-xl border flex items-center gap-2.5 text-xs ${
              isOrganic
                ? 'bg-[#7C8D81]/10 border-[#7C8D81]/25 text-[#58675E]'
                : 'bg-emerald-950/30 border-emerald-500/20 text-emerald-300'
            }`}>
              <ShieldCheck className={`w-4 h-4 flex-shrink-0 ${isOrganic ? 'text-[#7C8D81]' : 'text-emerald-400'}`} />
              <span>
                <b>100% Zero-Keylogging Privacy Guarantee:</b> Only millisecond event intervals (Δt) and stroke counts are recorded. Keystroke characters, passwords, and text are <b>never</b> logged or stored.
              </span>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className={`p-5 border-t flex items-center justify-between transition-colors ${
          isOrganic
            ? 'bg-[#F4F0EA] border-[#E5DFD7]'
            : 'bg-slate-950 border-white/10'
        }`}>
          <div className={`text-xs font-mono ${isOrganic ? 'text-[#616864]' : 'text-slate-400'}`}>
            Active Style: <span className={`font-bold capitalize ${isOrganic ? 'text-[#C97D5A]' : 'text-cyan-400'}`}>{casingStyle.replace('_', ' ')}</span>
          </div>
          <button
            onClick={() => setModal(null)}
            className={`px-6 py-2.5 rounded-xl font-display font-black text-xs transition-all ${
              isOrganic
                ? 'bg-[#C97D5A] hover:bg-[#B86B49] text-white shadow-organic-terracotta'
                : 'bg-cyan-500 hover:bg-cyan-400 text-black shadow-neon-cyan'
            }`}
          >
            Apply & Close
          </button>
        </div>

      </motion.div>
    </div>
  );
};
