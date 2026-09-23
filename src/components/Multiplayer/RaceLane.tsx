import React from 'react';
import { motion } from 'framer-motion';
import { UserAvatar } from '../Common/UserAvatar';

interface RaceLaneProps {
  id: string;
  name: string;
  avatar?: string;
  wpm?: number;
  progress?: number;
  finished?: boolean;
  rank?: number;
  isMe?: boolean;
}

// Presentational race lane: spring bar, finish badge, reduced-motion guard.
export const RaceLane: React.FC<RaceLaneProps> = ({
  name,
  avatar,
  wpm = 0,
  progress = 0,
  finished = false,
  rank,
  isMe = false,
}) => {
  const reduceMotion = typeof window !== 'undefined'
    && typeof window.matchMedia === 'function'
    && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const medals = ['🥇', '🥈', '🥉'];
  const badge = finished ? (medals[(rank ?? 1) - 1] || `#${rank ?? '?'}`) : null;

  return (
    <div className="relative py-2">
      <div className="flex items-center justify-between text-xs font-mono mb-1">
        <span className="flex items-center gap-1.5 font-bold text-white">
          <UserAvatar avatar={avatar} fallback="🏎️" className="w-4 h-4 rounded-full text-[10px] inline-flex shrink-0 bg-slate-900 border border-white/10" />
          <span>{name} {isMe && '(YOU)'}</span>
          {badge && <span aria-label="finished">{badge}</span>}
        </span>
        <span className="text-cyan-400 font-bold">{wpm} WPM • {progress}%</span>
      </div>
      <div className="w-full h-3 bg-slate-950 rounded-full border border-white/10 overflow-hidden relative p-0.5">
        {reduceMotion ? (
          <div
            className={`h-full rounded-full ${isMe
              ? 'bg-gradient-to-r from-cyan-500 to-blue-500'
              : 'bg-gradient-to-r from-purple-500 to-pink-500'}`}
            style={{ width: `${Math.max(2, progress)}%` }}
          />
        ) : (
          <motion.div
            className={`h-full rounded-full ${isMe
              ? 'bg-gradient-to-r from-cyan-500 to-blue-500 shadow-neon-cyan'
              : 'bg-gradient-to-r from-purple-500 to-pink-500'}`}
            animate={{ width: `${Math.max(2, progress)}%` }}
            transition={{ type: 'spring', stiffness: 100, damping: 20 }}
          />
        )}
      </div>
    </div>
  );
};
