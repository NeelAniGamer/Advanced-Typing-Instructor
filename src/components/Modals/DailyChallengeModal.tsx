import React, { useEffect, useState } from 'react';
import { useGameStore } from '../../stores/useGameStore';
import { X, Calendar, Flame, Play, Trophy, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';

export const DailyChallengeModal: React.FC = () => {
  const { setModal, setScreen } = useGameStore();
  const [dailyDate, setDailyDate] = useState<string>('');
  const [dailyText, setDailyText] = useState<string>('Loading today\'s synchronized daily challenge...');

  useEffect(() => {
    const fetchDaily = async () => {
      try {
        const resp = await fetch('/api/daily');
        if (resp.ok) {
          const data = await resp.json();
          setDailyDate(data.date || new Date().toISOString().split('T')[0]);
          setDailyText(data.text || 'Mastering rhythm and cadence produces the swiftest velocity.');
        } else {
          setDailyDate(new Date().toISOString().split('T')[0]);
          setDailyText('The daily challenge text syncs across all typists worldwide. Practice focus and calm keystroke rhythm.');
        }
      } catch {
        setDailyDate(new Date().toISOString().split('T')[0]);
        setDailyText('The daily challenge text syncs across all typists worldwide. Practice focus and calm keystroke rhythm.');
      }
    };
    fetchDaily();
  }, []);

  const handleStartDaily = () => {
    useGameStore.setState({
      text: dailyText,
      words: dailyText.trim().split(/\s+/),
      currentWordIndex: 0,
      currentInput: '',
      activeScreen: 'game',
      activeModal: null,
      wpm: 0,
      accuracy: 100,
      currentStreak: 0,
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="glass-panel max-w-xl w-full p-6 sm:p-8 rounded-3xl border border-amber-500/30 shadow-[0_0_50px_rgba(245,158,11,0.15)] flex flex-col gap-6"
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
              <Calendar className="w-6 h-6" />
            </div>
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-amber-400">
                Daily Synchronized Challenge
              </div>
              <h3 className="font-display font-extrabold text-2xl text-white">
                Challenge • {dailyDate}
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

        {/* Text Preview Box */}
        <div className="glass-panel p-5 rounded-2xl border border-white/10 bg-slate-950/60">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" /> Today's Seeded Excerpt
          </div>
          <p className="font-mono text-sm text-slate-300 leading-relaxed italic">
            "{dailyText}"
          </p>
        </div>

        {/* Daily Bonus Details */}
        <div className="flex items-center justify-between px-4 py-3 rounded-2xl bg-amber-950/30 border border-amber-500/20 text-xs text-amber-300">
          <span className="flex items-center gap-1.5 font-semibold">
            <Flame className="w-4 h-4 text-amber-400" /> Completion Reward: +1,500 Emeralds
          </span>
          <span className="font-mono text-slate-400">1 Try Per Day</span>
        </div>

        {/* Launch Button */}
        <button
          onClick={handleStartDaily}
          className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-black font-display font-black text-sm tracking-wide shadow-[0_0_25px_rgba(245,158,11,0.3)] flex items-center justify-center gap-2 transition-all"
        >
          <Play className="w-4 h-4 fill-black" />
          <span>START DAILY CHALLENGE</span>
        </button>
      </motion.div>
    </div>
  );
};
