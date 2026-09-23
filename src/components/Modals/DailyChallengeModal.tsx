import React, { useEffect, useState } from 'react';
import { useGameStore } from '../../stores/useGameStore';
import { X, Calendar, Flame, Play, Sparkles, BookOpen, AlignLeft, ListOrdered, Layers, Code2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { BorderGlow } from '../ReactBits/BorderGlow';
import { Chip } from '../HeroUI';
import { NumberTicker, KbdKey } from '../SpectrumUI';

type DailyMode = 'words' | 'sentences' | 'paragraphs' | 'pages' | 'code';

const MODE_DEFAULTS: Record<DailyMode, { text: string; reward: number; label: string; desc: string }> = {
  words: {
    label: 'Vocabulary Words',
    desc: 'High-speed isolated word cadence',
    reward: 1000,
    text: 'rhythm velocity precision accuracy keystroke tactile cadence mechanical focus discipline balance ergonomics actuation posture speed flow harmony clarity endurance muscle memory homerow anchor feedback dexterity zen reflex tempo agility mastery'
  },
  sentences: {
    label: 'Natural Sentences',
    desc: 'Fluid sentence structures with punctuation',
    reward: 1500,
    text: 'Mastering consistent keystroke rhythm and relaxed hand posture unlocks rapid typing speed. Resting index fingers on the home row bumps allows flawless navigation without looking down. Focus on crisp accuracy before attempting to accelerate your raw words per minute. Daily deliberate drills build unbreakable tactile muscle memory across all finger zones.'
  },
  paragraphs: {
    label: 'Endurance Paragraphs',
    desc: 'Deep multi-paragraph literature and stamina drill',
    reward: 2500,
    text: 'Touch typing is not merely the mechanical pressing of plastic caps; it is the seamless translation of conscious thought into digital expression. When the hands rest naturally upon the home row anchors, every key stroke flows with rhythmic grace, transforming physical effort into effortless velocity.\n\nTrue mastery demands consistent deliberate practice and unwavering calm. Rather than chasing raw speed at the cost of errors, high performance typists cultivate flawless accuracy first. With deep muscle memory established, velocity expands naturally without tension or fatigue.\n\nAcross every tier of engineering, literature, and competitive typing, rhythm reigns supreme. The keyboard becomes an extension of the mind, where ideas materialize at the exact speed of contemplation.'
  },
  pages: {
    label: 'Full Pages',
    desc: 'Long-form page endurance with varied prose',
    reward: 3000,
    text: 'Touch typing is not merely the mechanical pressing of plastic caps; it is the seamless translation of conscious thought into digital expression. When the hands rest naturally upon the home row anchors, every key stroke flows with rhythmic grace, transforming physical effort into effortless velocity.\n\nIn the golden era of computing, the mechanical switch reigned supreme. With crisp actuation points and musical acoustic signatures, each typist composed their own rhythmic symphony.\n\nConsistency beats intensity on every leaderboard. Short daily sessions with full attention build faster fingers than exhausted weekend marathons.'
  },
  code: {
    label: 'Real Code',
    desc: 'Syntax, symbols, brackets and indentation',
    reward: 3000,
    text: 'def binary_search(array, target):\n    low = 0\n    high = len(array) - 1\n    while low <= high:\n        mid = (low + high) // 2\n        if array[mid] == target:\n            return mid\n    return None'
  }
};

export const DailyChallengeModal: React.FC = () => {
  const { setModal, setScreen, uiTheme, startChallengeSession } = useGameStore();
  const isOrganic = uiTheme === 'organic' || uiTheme === 'organic-dark';

  const [challengeMode, setChallengeMode] = useState<DailyMode>('sentences');
  const [dailyDate, setDailyDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [dailyText, setDailyText] = useState<string>(MODE_DEFAULTS.sentences.text);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    let isCancelled = false;
    const fetchDaily = async () => {
      setIsLoading(true);
      try {
        const resp = await fetch(`/api/daily?mode=${challengeMode}`);
        if (resp.ok) {
          const data = await resp.json();
          if (!isCancelled) {
            setDailyDate(data.date || new Date().toISOString().split('T')[0]);
            setDailyText(data.text || MODE_DEFAULTS[challengeMode].text);
          }
        } else if (!isCancelled) {
          setDailyText(MODE_DEFAULTS[challengeMode].text);
        }
      } catch {
        if (!isCancelled) {
          setDailyText(MODE_DEFAULTS[challengeMode].text);
        }
      } finally {
        if (!isCancelled) setIsLoading(false);
      }
    };
    fetchDaily();
    return () => { isCancelled = true; };
  }, [challengeMode]);

  const wordList = dailyText.trim().split(/\s+/).filter(Boolean);
  const wordCount = wordList.length;
  const activeConfig = MODE_DEFAULTS[challengeMode];

  const handleStartDaily = () => {
    startChallengeSession(dailyText, `Daily Challenge: ${activeConfig.label}`, 'Daily Challenge');
  };

  return (
    <div 
      onClick={(e) => {
        if (e.target === e.currentTarget) setModal(null);
      }}
      className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-xl flex items-center justify-center p-4"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className={`max-w-2xl w-full p-6 sm:p-8 rounded-3xl border flex flex-col gap-5 transition-all duration-300 ${
          uiTheme === 'organic'
            ? 'bg-[#FAF8F5] border-[#E5DFD7] text-[#333333] shadow-organic-card'
            : uiTheme === 'organic-dark'
            ? 'bg-[#1A1E1C] border-[#2E3531] text-[#FAF8F5] shadow-2xl'
            : 'glass-panel border-amber-500/30 text-white shadow-[0_0_50px_rgba(245,158,11,0.15)] bg-slate-950/95'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-3 rounded-2xl border transition-colors ${
              uiTheme === 'organic'
                ? 'bg-[#EBC078]/25 border-[#EBC078]/40 text-[#966E1F]'
                : uiTheme === 'organic-dark'
                ? 'bg-[#D98A66]/20 border-[#D98A66]/40 text-[#D98A66]'
                : 'bg-amber-500/10 border-amber-500/30 text-amber-400'
            }`}>
              <Calendar className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className={`text-[11px] font-bold uppercase tracking-wider ${
                  isOrganic ? 'text-[#C97D5A]' : 'text-amber-400'
                }`}>
                  Daily Synchronized Challenge
                </span>
                <Chip size="sm" variant="soft" color="warning">
                  Global Seed
                </Chip>
              </div>
              <h3 className={`font-display font-black text-2xl tracking-wide ${
                uiTheme === 'organic' ? 'text-[#333333]' : 'text-white'
              }`}>
                Daily Challenge • {dailyDate}
              </h3>
            </div>
          </div>

          <button
            onClick={() => setModal(null)}
            className={`p-2 rounded-xl border transition-all ${
              uiTheme === 'organic'
                ? 'bg-white/80 border-[#E5DFD7] text-[#616864] hover:text-[#333333] hover:bg-[#F2EFEB]'
                : uiTheme === 'organic-dark'
                ? 'bg-[#252A28] border-[#2E3531] text-[#A3ACA7] hover:text-white'
                : 'bg-slate-900 border-white/10 text-slate-400 hover:text-white hover:bg-white/10'
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mode Selector Tabs: Words, Sentences, Paragraphs */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className={`text-xs font-mono uppercase font-bold tracking-wider ${
              uiTheme === 'organic' ? 'text-[#616864]' : 'text-slate-400'
            }`}>
              Select Excerpt Format:
            </span>
            <span className={`text-[11px] font-mono ${uiTheme === 'organic' ? 'text-[#7C8D81]' : 'text-amber-400'}`}>
              {wordCount} words • ~{Math.ceil(wordCount / 50)} min
            </span>
          </div>

          <div className={`grid grid-cols-2 sm:grid-cols-5 gap-2 p-1.5 rounded-2xl border ${
            uiTheme === 'organic' 
              ? 'bg-white border-[#E5DFD7]' 
              : uiTheme === 'organic-dark'
              ? 'bg-[#141716] border-[#2E3531]'
              : 'bg-slate-900/80 border-white/10'
          }`}>
            {(
              [
                { id: 'words', label: 'Words', icon: ListOrdered },
                { id: 'sentences', label: 'Sentences', icon: AlignLeft },
                { id: 'paragraphs', label: 'Paragraphs', icon: BookOpen },
                { id: 'pages', label: 'Pages', icon: Layers },
                { id: 'code', label: 'Code', icon: Code2 },
              ] as { id: DailyMode; label: string; icon: typeof ListOrdered }[]
            ).map((tab) => {
              const Icon = tab.icon;
              const active = challengeMode === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setChallengeMode(tab.id)}
                  className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-bold transition-all ${
                    active
                      ? uiTheme === 'organic'
                        ? 'bg-[#C97D5A] text-white shadow-sm'
                        : uiTheme === 'organic-dark'
                        ? 'bg-[#D98A66] text-[#141716] shadow-sm font-black'
                        : 'bg-amber-500 text-black shadow-neon-amber'
                      : isOrganic
                      ? 'text-[#616864] hover:text-[#333333]'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Text Preview Box with BorderGlow */}
        <BorderGlow
          edgeSensitivity={20}
          glowRadius={28}
          borderRadius={18}
          glowIntensity={1.05}
          coneSpread={24}
          animated={false}
          backgroundColor={uiTheme === 'organic' ? '#FFFFFF' : uiTheme === 'organic-dark' ? '#141716' : '#07090e'}
          glowColor={isOrganic ? '40 80 80' : '45 100 50'}
          colors={
            isOrganic
              ? ['#7C8D81', '#C97D5A', '#EBC078']
              : ['#f59e0b', '#fbbf24', '#f97316']
          }
          className="w-full"
        >
          <div className={`p-4 sm:p-5 rounded-2xl border max-h-48 overflow-y-auto transition-colors ${
            uiTheme === 'organic'
              ? 'bg-white border-[#E5DFD7]'
              : uiTheme === 'organic-dark'
              ? 'bg-[#141716] border-[#2E3531]'
              : 'bg-slate-950/70 border-white/10'
          }`}>
            <div className={`text-xs font-bold uppercase tracking-wider mb-2 flex items-center justify-between ${
              uiTheme === 'organic' ? 'text-[#616864]' : 'text-slate-400'
            }`}>
              <span className="flex items-center gap-1.5">
                <Sparkles className={`w-3.5 h-3.5 ${isOrganic ? 'text-[#C97D5A]' : 'text-amber-400'}`} />
                <span>{activeConfig.label} ({activeConfig.desc})</span>
              </span>
              {isLoading && <span className="animate-pulse text-[10px] font-mono">Syncing...</span>}
            </div>
            <p className={`font-mono text-xs sm:text-sm leading-relaxed whitespace-pre-line italic ${
              uiTheme === 'organic' ? 'text-[#333333]' : 'text-slate-200'
            }`}>
              "{dailyText}"
            </p>
          </div>
        </BorderGlow>

        {/* Daily Bonus Details */}
        <div className={`flex items-center justify-between px-4 py-3 rounded-2xl border text-xs transition-colors ${
          uiTheme === 'organic'
            ? 'bg-[#EBC078]/20 border-[#EBC078]/40 text-[#84621A]'
            : uiTheme === 'organic-dark'
            ? 'bg-[#D98A66]/15 border-[#D98A66]/30 text-[#D98A66]'
            : 'bg-amber-950/30 border-amber-500/20 text-amber-300'
        }`}>
          <span className="flex items-center gap-1.5 font-bold">
            <Flame className={`w-4 h-4 ${isOrganic ? 'text-[#C97D5A]' : 'text-amber-400'}`} />
            <span>Completion Reward: +<NumberTicker value={activeConfig.reward} /> Emeralds</span>
          </span>
          <Chip size="sm" variant="soft" color="default">
            Synchronized Global Seed
          </Chip>
        </div>

        {/* Launch Button */}
        <div className="flex flex-col items-center gap-2">
          <button
            onClick={handleStartDaily}
            className={`w-full py-3.5 sm:py-4 rounded-2xl font-display font-black text-sm tracking-wider flex items-center justify-center gap-2 transition-all ${
              uiTheme === 'organic'
                ? 'bg-[#C97D5A] hover:bg-[#B86B49] text-white shadow-organic-terracotta hover:shadow-[0_8px_24px_rgba(201,125,90,0.4)]'
                : uiTheme === 'organic-dark'
                ? 'bg-[#D98A66] hover:bg-[#C97D5A] text-[#141716] shadow-sm hover:shadow-[0_8px_24px_rgba(217,138,102,0.4)]'
                : 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-black shadow-[0_0_25px_rgba(245,158,11,0.3)]'
            }`}
          >
            <Play className={`w-4 h-4 fill-current ${isOrganic ? (uiTheme === 'organic-dark' ? 'text-[#141716]' : 'text-white') : 'text-black'}`} />
            <span>START {challengeMode.toUpperCase()} CHALLENGE</span>
          </button>
          <div className={`text-[11px] font-mono flex items-center gap-1.5 ${uiTheme === 'organic' ? 'text-[#616864]' : 'text-slate-400'}`}>
            <span>Tip: Press</span>
            <KbdKey keyName="enter" size="sm" onPress={handleStartDaily}>Enter</KbdKey>
            <span>to launch</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
