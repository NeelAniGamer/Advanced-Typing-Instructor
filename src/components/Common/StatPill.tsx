import React from 'react';

interface StatPillProps {
  icon: React.ReactNode;
  value: string;
  title: string;
  accent?: 'cyan' | 'emerald' | 'amber';
  onClick?: () => void;
  pulseDot?: boolean;
}

const ACCENTS: Record<string, string> = {
  cyan: 'text-cyan-300 border-white/10 hover:border-cyan-400/40',
  emerald: 'text-emerald-300 border-white/10 hover:border-emerald-400/40',
  amber: 'text-amber-300 border-white/10 hover:border-amber-400/40',
};

// Small presentational pill (props only, no store): extracts the repeated
// HUD pill pattern into one component per tailwind extraction guidance.
export const StatPill: React.FC<StatPillProps> = ({
  icon,
  value,
  title,
  accent = 'cyan',
  onClick,
  pulseDot = false,
}) => (
  <button
    onClick={onClick}
    title={title}
    className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs font-mono font-bold transition-all bg-slate-900/80 hover:bg-white/5 ${ACCENTS[accent]}`}
  >
    {icon}
    <span>{value}</span>
    {pulseDot && (
      <span className="relative flex h-2 w-2 ml-0.5">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
      </span>
    )}
  </button>
);
