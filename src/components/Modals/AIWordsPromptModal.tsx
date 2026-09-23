import React, { useState, useEffect } from 'react';
import { useGameStore } from '../../stores/useGameStore';
import { TypingMode } from '../../types/game';
import { ModeSelector } from '../Common/ModeSelector';
import { Sparkles, BookOpen, Bot, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const AIWordsPromptModal: React.FC = () => {
  const { 
    showAIWordsPrompt, 
    setShowAIWordsPrompt, 
    confirmAIWordsLaunch, 
    uiTheme, 
    casingStyle,
    pendingLaunchLevel,
    level,
    mode,
    setMode,
  } = useGameStore();

  const [rememberChoice, setRememberChoice] = useState(false);
  const [sessionMode, setSessionMode] = useState<TypingMode>('Words');

  // Reset the format picker to the current game mode each time it opens
  useEffect(() => {
    if (showAIWordsPrompt) {
      const m = (mode === 'Code' || mode === 'Time' || mode === 'SuddenDeath') ? 'Words' : (mode as TypingMode);
      setSessionMode(m);
      setRememberChoice(false);
    }
  }, [showAIWordsPrompt, mode]);

  useEffect(() => {
    if (!showAIWordsPrompt) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowAIWordsPrompt(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showAIWordsPrompt, setShowAIWordsPrompt]);

  const isOrganic = uiTheme === 'organic';
  const isOrganicDark = uiTheme === 'organic-dark';
  const targetLvl = pendingLaunchLevel ?? level;

  const handleChoose = (enableAI: boolean) => {
    if (rememberChoice) {
      try {
        localStorage.setItem('ati_ai_words_remember', enableAI ? 'always_ai' : 'always_standard');
      } catch {}
    }
    // Train every format, not just short word lists
    setMode(sessionMode);
    confirmAIWordsLaunch(enableAI);
  };

  const aiCoversFormat = sessionMode === 'Words' || sessionMode === 'Lines' || sessionMode === 'Paragraphs';

  return (
    <AnimatePresence>
      {showAIWordsPrompt && (
        <motion.div
          key="ai-words-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-black/75 backdrop-blur-xl"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowAIWordsPrompt(false);
            }
          }}
        >
          <motion.div
            key="ai-words-dialog"
            initial={{ opacity: 0, scale: 0.92, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 20 }}
            transition={{ type: 'spring', damping: 26, stiffness: 360 }}
            className={`w-full max-w-lg rounded-3xl border p-6 sm:p-7 shadow-2xl relative overflow-hidden ${
              isOrganic
                ? 'bg-[#FAF8F5] border-[#E5DFD7] text-[#333333] shadow-[0_25px_60px_rgba(51,51,51,0.25)]'
                : isOrganicDark
                ? 'bg-[#1E2220] border-[#2E3531] text-[#FAF8F5] shadow-[0_25px_60px_rgba(0,0,0,0.8)]'
                : 'bg-slate-900 border-cyan-500/30 text-white shadow-[0_0_60px_rgba(0,245,255,0.25)]'
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              onClick={() => setShowAIWordsPrompt(false)}
              className={`absolute top-5 right-5 p-2 rounded-full transition-colors ${
                isOrganic
                  ? 'text-[#7C8D81] hover:bg-[#EAE5DF] hover:text-[#333333]'
                  : isOrganicDark
                  ? 'text-[#8FA896] hover:bg-[#2A302D] hover:text-[#FAF8F5]'
                  : 'text-slate-400 hover:bg-white/10 hover:text-white'
              }`}
              title="Cancel (Esc)"
            >
              <X className="w-5 h-5" />
        </button>

        {/* Header Badge & Title */}
        <div className="flex items-center gap-3 mb-4">
          <div className={`p-3 rounded-2xl flex items-center justify-center text-xl ${
            isOrganic
              ? 'bg-[#C97D5A]/15 text-[#C97D5A] border border-[#C97D5A]/30'
              : isOrganicDark
              ? 'bg-[#D98A66]/20 text-[#D98A66] border border-[#D98A66]/40'
              : 'bg-cyan-500/20 text-cyan-400 border border-cyan-400/40 shadow-neon-cyan'
          }`}>
            <Bot className="w-6 h-6" />
          </div>
          <div>
            <div className={`text-[11px] font-mono uppercase tracking-widest font-bold ${
              isOrganic ? 'text-[#7C8D81]' : isOrganicDark ? 'text-[#8FA896]' : 'text-cyan-400'
            }`}>
              Session Initialization • Level {targetLvl}
            </div>
            <h3 className="text-xl font-bold font-display">
              Turn On AI Words?
            </h3>
          </div>
        </div>

        {/* Explanation */}
        <p className={`text-sm leading-relaxed mb-4 ${
          isOrganic ? 'text-[#555555]' : isOrganicDark ? 'text-[#A3ACA7]' : 'text-slate-300'
        }`}>
          Practice with on-demand procedural AI vocabulary generated dynamically for your skill tier and casing style, or proceed with standard curated curriculum.
        </p>

        {/* Drill format: train Words, Lines, Paragraphs, Pages and Code */}
        <div className="mb-5">
          <ModeSelector
            value={sessionMode}
            onChange={(id) => setSessionMode(id as TypingMode)}
            label="Session format — train every skill, not just words:"
          />
          {!aiCoversFormat && (
            <p className={`text-[11px] mt-1.5 font-mono ${isOrganic ? 'text-[#7C8D81]' : isOrganicDark ? 'text-[#8FA896]' : 'text-slate-400'}`}>
              AI synthesis covers Words, Lines and Paragraphs — {sessionMode} uses the curated Level {targetLvl} curriculum.
            </p>
          )}
        </div>

        {/* Option Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
          {/* AI Option */}
          <button
            onClick={() => handleChoose(true)}
            className={`p-4 rounded-2xl border text-left flex flex-col justify-between transition-all group ${
              isOrganic
                ? 'bg-white border-[#C97D5A]/40 hover:border-[#C97D5A] hover:shadow-md'
                : isOrganicDark
                ? 'bg-[#191D1B] border-[#D98A66]/50 hover:border-[#D98A66] hover:shadow-lg'
                : 'bg-slate-950/60 border-cyan-500/30 hover:border-cyan-400 hover:shadow-neon-cyan'
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className={`p-1.5 rounded-lg ${
                  isOrganic ? 'bg-[#C97D5A]/15 text-[#C97D5A]' : isOrganicDark ? 'bg-[#D98A66]/20 text-[#D98A66]' : 'bg-cyan-500/20 text-cyan-300'
                }`}>
                  <Sparkles className="w-4 h-4" />
                </span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  isOrganic ? 'bg-[#C97D5A] text-white' : isOrganicDark ? 'bg-[#D98A66] text-[#141716]' : 'bg-cyan-400 text-black'
                }`}>
                  RECOMMENDED
                </span>
              </div>
              <h4 className="font-bold text-sm">Turn On AI Words</h4>
              <p className={`text-xs mt-1 leading-snug ${isOrganic ? 'text-[#777777]' : isOrganicDark ? 'text-[#8A9590]' : 'text-slate-400'}`}>
                Procedural {sessionMode.toLowerCase()} scaled to Level {targetLvl} with your active {casingStyle.replace('_', ' ')} style.
              </p>
            </div>
            <div className={`mt-3 text-xs font-bold flex items-center gap-1 group-hover:translate-x-1 transition-transform ${
              isOrganic ? 'text-[#C97D5A]' : isOrganicDark ? 'text-[#D98A66]' : 'text-cyan-400'
            }`}>
              <span>Launch with AI</span> &rarr;
            </div>
          </button>

          {/* Standard Option */}
          <button
            onClick={() => handleChoose(false)}
            className={`p-4 rounded-2xl border text-left flex flex-col justify-between transition-all group ${
              isOrganic
                ? 'bg-white border-[#E5DFD7] hover:border-[#7C8D81] hover:shadow-md'
                : isOrganicDark
                ? 'bg-[#191D1B] border-[#2E3531] hover:border-[#8FA896] hover:shadow-lg'
                : 'bg-slate-950/60 border-white/10 hover:border-white/30'
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className={`p-1.5 rounded-lg ${
                  isOrganic ? 'bg-[#7C8D81]/15 text-[#7C8D81]' : isOrganicDark ? 'bg-[#8FA896]/20 text-[#8FA896]' : 'bg-slate-800 text-slate-300'
                }`}>
                  <BookOpen className="w-4 h-4" />
                </span>
              </div>
              <h4 className="font-bold text-sm">Standard {sessionMode}</h4>
              <p className={`text-xs mt-1 leading-snug ${isOrganic ? 'text-[#777777]' : isOrganicDark ? 'text-[#8A9590]' : 'text-slate-400'}`}>
                Fixed curated {sessionMode.toLowerCase()} text for Level {targetLvl} milestones and boss fights.
              </p>
            </div>
            <div className={`mt-3 text-xs font-bold flex items-center gap-1 group-hover:translate-x-1 transition-transform ${
              isOrganic ? 'text-[#7C8D81]' : isOrganicDark ? 'text-[#8FA896]' : 'text-slate-300'
            }`}>
              <span>Launch Standard</span> &rarr;
            </div>
          </button>
        </div>

        {/* Remember choice toggle */}
        <div className="flex items-center justify-between pt-3 border-t border-inherit/20 text-xs">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={rememberChoice}
              onChange={(e) => setRememberChoice(e.target.checked)}
              className="rounded border-gray-400 text-[#C97D5A] focus:ring-[#C97D5A] w-4 h-4 cursor-pointer"
            />
            <span className={isOrganic ? 'text-[#666666]' : isOrganicDark ? 'text-[#A3ACA7]' : 'text-slate-400'}>
              Remember choice and don&apos;t ask again
            </span>
          </label>
        </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
