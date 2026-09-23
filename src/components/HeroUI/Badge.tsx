import React, { ReactNode } from 'react';

export interface BadgeProps {
  children?: ReactNode;
  variant?: 'solid' | 'flat' | 'dot';
  color?:
    | 'default'
    | 'primary'
    | 'secondary'
    | 'success'
    | 'warning'
    | 'danger'
    | 'accent';
  size?: 'sm' | 'md' | 'lg';
  placement?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
  isDot?: boolean;
  isInvisible?: boolean;
  isOneChar?: boolean;
  showOutline?: boolean;
  isPulse?: boolean;
  className?: string;
}

export const Badge: React.FC<BadgeProps> & {
  Anchor: typeof BadgeAnchor;
} = ({
  children,
  variant = 'solid',
  color = 'primary',
  size = 'md',
  placement = 'top-right',
  isDot = false,
  isInvisible = false,
  isOneChar = false,
  showOutline = true,
  isPulse = false,
  className = '',
}) => {
  if (isInvisible) return null;

  // Sizes
  const sizeClass = isDot
    ? {
        sm: 'w-2 h-2',
        md: 'w-2.5 h-2.5',
        lg: 'w-3 h-3',
      }[size]
    : {
        sm: isOneChar
          ? 'w-4 h-4 text-[9px] p-0'
          : 'h-4 min-w-4 text-[9px] px-1',
        md: isOneChar
          ? 'w-5 h-5 text-[10px] p-0'
          : 'h-5 min-w-5 text-[10px] px-1.5',
        lg: isOneChar
          ? 'w-6 h-6 text-xs p-0'
          : 'h-6 min-w-6 text-xs px-2',
      }[size];

  // Placements (relative to an Anchor parent or standalone)
  const placementClass = {
    'top-right': 'top-0 right-0 -translate-y-1/3 translate-x-1/3',
    'top-left': 'top-0 left-0 -translate-y-1/3 -translate-x-1/3',
    'bottom-right': 'bottom-0 right-0 translate-y-1/3 translate-x-1/3',
    'bottom-left': 'bottom-0 left-0 translate-y-1/3 -translate-x-1/3',
  }[placement];

  // Color Matrix
  const colorMap: Record<string, { solid: string; flat: string; dot: string }> = {
    default: {
      solid: 'bg-slate-700 text-white',
      flat: 'bg-slate-800 text-slate-300',
      dot: 'bg-slate-400',
    },
    primary: {
      solid: 'bg-cyan-500 text-black font-bold shadow-neon-cyan/30',
      flat: 'bg-cyan-500/15 text-cyan-300',
      dot: 'bg-cyan-400',
    },
    secondary: {
      solid: 'bg-purple-600 text-white font-bold shadow-neon-purple/30',
      flat: 'bg-purple-500/15 text-purple-300',
      dot: 'bg-purple-400',
    },
    success: {
      solid: 'bg-emerald-500 text-black font-bold shadow-neon-emerald/30',
      flat: 'bg-emerald-500/15 text-emerald-300',
      dot: 'bg-emerald-400',
    },
    warning: {
      solid: 'bg-amber-500 text-black font-bold',
      flat: 'bg-amber-500/15 text-amber-300',
      dot: 'bg-amber-400',
    },
    danger: {
      solid: 'bg-red-500 text-white font-bold shadow-neon-red/30',
      flat: 'bg-red-500/15 text-red-300',
      dot: 'bg-red-400',
    },
    accent: {
      solid: 'bg-indigo-500 text-white font-bold',
      flat: 'bg-indigo-500/15 text-indigo-300',
      dot: 'bg-indigo-400',
    },
  };

  const selectedColor = colorMap[color] || colorMap.primary;
  const variantClass = isDot
    ? selectedColor.dot
    : variant === 'flat'
    ? selectedColor.flat
    : selectedColor.solid;

  const outlineClass = showOutline
    ? 'border-2 border-slate-950'
    : 'border-transparent';

  return (
    <span
      className={`absolute z-10 flex items-center justify-center rounded-full font-mono select-none font-bold uppercase ${placementClass} ${sizeClass} ${variantClass} ${outlineClass} ${className}`}
    >
      {isPulse && (
        <span
          className={`absolute inset-0 rounded-full animate-ping opacity-75 ${
            isDot ? selectedColor.dot : selectedColor.solid
          }`}
        />
      )}
      {!isDot && children}
    </span>
  );
};

// --- Badge Anchor ---
export interface BadgeAnchorProps {
  children: ReactNode;
  className?: string;
}

const BadgeAnchor: React.FC<BadgeAnchorProps> = ({
  children,
  className = '',
}) => {
  return (
    <div className={`relative inline-flex shrink-0 ${className}`}>
      {children}
    </div>
  );
};

Badge.Anchor = BadgeAnchor;

export default Badge;
