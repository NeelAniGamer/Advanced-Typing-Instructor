import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface RaceCountdownOverlayProps {
  count: number | null;
}

// Spring countdown overlay: scale-spring + fade per tick, with
// prefers-reduced-motion fallback. Replaces the old animate-ping number.
export const RaceCountdownOverlay: React.FC<RaceCountdownOverlayProps> = ({ count }) => {
  const reduceMotion = typeof window !== 'undefined'
    && typeof window.matchMedia === 'function'
    && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  return (
    <div className="text-center py-6" aria-live="assertive" role="status">
      <AnimatePresence mode="popLayout">
        {count !== null && (
          <motion.span
            key={count}
            initial={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.6 }}
            animate={reduceMotion ? { opacity: 1 } : { opacity: 1, scale: 1 }}
            exit={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 1.4 }}
            transition={{ type: 'spring', stiffness: 320, damping: 22 }}
            className="inline-block font-display font-black text-7xl text-cyan-400 text-glow-cyan"
          >
            {count}
          </motion.span>
        )}
      </AnimatePresence>
    </div>
  );
};
