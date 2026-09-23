import React, { ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export interface SkeletonProps {
  isLoaded?: boolean;
  children?: ReactNode;
  className?: string;
}

export const Skeleton: React.FC<SkeletonProps> & {
  Item: typeof SkeletonItem;
} = ({ isLoaded = false, children, className = '' }) => {
  if (isLoaded) {
    return (
      <AnimatePresence mode="wait">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          className="w-full h-full"
        >
          {children}
        </motion.div>
      </AnimatePresence>
    );
  }

  return (
    <div
      className={`relative overflow-hidden bg-slate-800/60 rounded-xl ${className}`}
      style={{
        background: 'var(--skeleton-bg, rgba(30, 41, 59, 0.5))',
      }}
      aria-hidden="true"
    >
      <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.8s_infinite] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
      {/* Invisible children placeholder to preserve layout box size if children exist */}
      {children && <div className="opacity-0 pointer-events-none">{children}</div>}
    </div>
  );
};

export interface SkeletonItemProps {
  className?: string;
  shape?: 'rectangle' | 'circle' | 'text';
}

const SkeletonItem: React.FC<SkeletonItemProps> = ({
  className = '',
  shape = 'rectangle',
}) => {
  const shapeStyles = {
    rectangle: 'rounded-xl',
    circle: 'rounded-full aspect-square',
    text: 'h-3 rounded-md',
  }[shape];

  return (
    <div
      className={`relative overflow-hidden bg-slate-800/60 ${shapeStyles} ${className}`}
      style={{
        background: 'var(--skeleton-bg, rgba(30, 41, 59, 0.5))',
      }}
      aria-hidden="true"
    >
      <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.8s_infinite] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
    </div>
  );
};

Skeleton.Item = SkeletonItem;

export default Skeleton;
