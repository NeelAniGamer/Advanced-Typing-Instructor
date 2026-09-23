import React, { useRef } from 'react';
import { useGameStore } from '../../stores/useGameStore';
import { calculateRankStats } from '../../utils/ranks';
import { APP_VERSION } from '../../utils/theme';
import { 
  X, 
  Printer, 
  Award, 
  ShieldCheck, 
  Download, 
  Sparkles, 
  Calendar, 
  Zap, 
  Target 
} from 'lucide-react';
import { motion } from 'framer-motion';

export const CertificateModal: React.FC = () => {
  const { user, level, wpm, accuracy, mode, difficulty, setModal } = useGameStore();
  const certRef = useRef<HTMLDivElement>(null);

  const rankStats = calculateRankStats(level, user.best_wpm || wpm, mode, difficulty);
  const certWpm = Math.max(user.best_wpm, wpm, 35);
  const certAcc = Math.max(user.avg_acc, accuracy, 92);
  const certDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  // Deterministic certificate verification serial
  const serialHash = Math.abs(
    (user.name + certWpm + level).split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0);
      return a & a;
    }, 0)
  ) % 90000 + 10000;

  const certId = `ATI-CERT-${serialHash}`;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div 
      onClick={(e) => {
        if (e.target === e.currentTarget) setModal(null);
      }}
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/85 backdrop-blur-xl overflow-y-auto"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="glass-panel w-full max-w-3xl p-6 sm:p-8 rounded-3xl border border-amber-500/40 shadow-[0_0_60px_rgba(245,158,11,0.2)] flex flex-col gap-6 relative my-auto"
      >
        {/* Top Control Bar */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4 print:hidden">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-amber-500/10 border border-amber-400/30 shadow-[0_0_15px_rgba(245,158,11,0.2)]">
              <Award className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <span className="text-[10px] font-mono uppercase tracking-widest text-amber-400 font-bold">
                Accredited Typing Achievement
              </span>
              <h3 className="font-display font-black text-xl text-white tracking-wide">
                Certificate of Touch Typing Mastery
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-400 to-orange-500 text-black font-extrabold text-xs hover:shadow-[0_0_20px_rgba(245,158,11,0.4)] transition-all flex items-center gap-1.5"
              title="Print or Save as PDF"
            >
              <Printer className="w-4 h-4" /> Print / PDF
            </button>

            <button
              onClick={() => setModal(null)}
              className="p-2 rounded-xl bg-slate-900 border border-white/10 text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* The Printable Diploma Card */}
        <div
          ref={certRef}
          id="ati-printable-certificate"
          className="relative bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 border-4 border-amber-500/60 rounded-3xl p-8 sm:p-12 flex flex-col items-center text-center shadow-2xl overflow-hidden"
        >
          {/* Ornate Corner Accents */}
          <div className="absolute top-3 left-3 w-8 h-8 border-t-2 border-l-2 border-amber-400" />
          <div className="absolute top-3 right-3 w-8 h-8 border-t-2 border-r-2 border-amber-400" />
          <div className="absolute bottom-3 left-3 w-8 h-8 border-b-2 border-l-2 border-amber-400" />
          <div className="absolute bottom-3 right-3 w-8 h-8 border-b-2 border-r-2 border-amber-400" />

          {/* Watermark Logo */}
          <div className="text-[80px] opacity-5 select-none pointer-events-none absolute inset-0 flex items-center justify-center font-display font-black">
            ATI 2.5
          </div>

          {/* Academic Header */}
          <div className="flex flex-col items-center mb-5">
            <div className="text-3xl mb-2">🏅</div>
            <h4 className="font-mono text-xs font-bold tracking-[0.25em] text-amber-400 uppercase">
              Advanced Typing Instructor Academy
            </h4>
            <h1 className="font-display font-black text-2xl sm:text-3xl text-white tracking-wide mt-1">
              Certificate of Touch Typing Mastery
            </h1>
            <div className="w-32 h-0.5 bg-gradient-to-r from-transparent via-amber-400 to-transparent my-2" />
          </div>

          {/* Recipient Statement */}
          <p className="text-xs sm:text-sm text-slate-300 font-sans italic max-w-lg mb-2">
            This credential is officially conferred upon
          </p>

          <h2 className="font-display font-black text-3xl sm:text-4xl text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-amber-400 to-yellow-300 tracking-wide mb-3">
            {user.name}
          </h2>

          <p className="text-xs sm:text-sm text-slate-300 max-w-md mb-6 leading-relaxed">
            in recognition of exceptional dexterity, mechanical actuation velocity, and surgical touch-typing accuracy under competitive pressure.
          </p>

          {/* Achievement Badges Row */}
          <div className="grid grid-cols-3 gap-3 sm:gap-6 w-full max-w-lg mb-8">
            <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex flex-col items-center">
              <span className="text-[10px] uppercase font-mono tracking-wider text-amber-400 font-bold">
                Actuation Speed
              </span>
              <span className="font-mono font-black text-2xl text-white mt-1">
                {certWpm} <span className="text-xs font-sans text-amber-300">WPM</span>
              </span>
            </div>

            <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex flex-col items-center">
              <span className="text-[10px] uppercase font-mono tracking-wider text-emerald-400 font-bold">
                Accuracy Rating
              </span>
              <span className="font-mono font-black text-2xl text-emerald-300 mt-1">
                {certAcc}%
              </span>
            </div>

            <div className="p-3 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex flex-col items-center">
              <span className="text-[10px] uppercase font-mono tracking-wider text-cyan-400 font-bold">
                Certified Rank
              </span>
              <span 
                className="font-extrabold text-xs mt-2 truncate w-full text-center"
                style={{ color: rankStats.rank.color }}
              >
                {rankStats.rank.name}
              </span>
            </div>
          </div>

          {/* Footer: Signatures & Gold Seal */}
          <div className="w-full flex items-end justify-between pt-6 border-t border-white/10 text-left">
            {/* Left Signatory */}
            <div className="flex flex-col">
              <div className="font-serif italic text-amber-300/90 text-sm font-bold tracking-wider mb-1">
                A. Vance, Grandmaster
              </div>
              <div className="w-36 h-0.5 bg-slate-600 mb-1" />
              <div className="text-[10px] text-slate-400 uppercase font-mono">
                Director of Touch Typing
              </div>
              <div className="text-[9px] text-slate-500 font-mono mt-0.5">
                Date: {certDate}
              </div>
            </div>

            {/* Center Official Gold Seal */}
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 rounded-full border-2 border-dashed border-amber-400 flex items-center justify-center p-1 shadow-[0_0_20px_rgba(245,158,11,0.3)] bg-amber-500/20">
                <div className="w-full h-full rounded-full border border-amber-300 flex flex-col items-center justify-center text-center">
                  <ShieldCheck className="w-5 h-5 text-amber-300" />
                  <span className="text-[7px] font-black uppercase tracking-tighter text-amber-200">
                    VERIFIED
                  </span>
                </div>
              </div>
              <span className="text-[9px] font-mono text-amber-400/80 mt-1">
                {certId}
              </span>
            </div>

            {/* Right Signatory */}
            <div className="flex flex-col text-right">
              <div className="font-serif italic text-cyan-300/90 text-sm font-bold tracking-wider mb-1">
                System Engine Core
              </div>
              <div className="w-36 h-0.5 bg-slate-600 ml-auto mb-1" />
              <div className="text-[10px] text-slate-400 uppercase font-mono">
                Algorithmic Evaluation
              </div>
              <div className="text-[9px] text-slate-500 font-mono mt-0.5">
                Ver: ATI {APP_VERSION} Native Desktop
              </div>
            </div>
          </div>
        </div>

      </motion.div>
    </div>
  );
};
