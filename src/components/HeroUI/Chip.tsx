import React, { ReactNode } from 'react';
import { X } from 'lucide-react';

export interface ChipProps {
  children: ReactNode;
  variant?: 'solid' | 'outline' | 'soft';
  color?:
    | 'default'
    | 'primary'
    | 'secondary'
    | 'success'
    | 'warning'
    | 'danger'
    | 'accent';
  size?: 'sm' | 'md' | 'lg';
  avatar?: ReactNode;
  startContent?: ReactNode;
  endContent?: ReactNode;
  dot?: boolean;
  onClose?: () => void;
  isDisabled?: boolean;
  className?: string;
  onClick?: () => void;
}

export const Chip: React.FC<ChipProps> = ({
  children,
  variant = 'solid',
  color = 'default',
  size = 'md',
  avatar,
  startContent,
  endContent,
  dot = false,
  onClose,
  isDisabled = false,
  className = '',
  onClick,
}) => {
  // Sizes
  const sizeStyles = {
    sm: 'text-[10px] px-2 py-0.5 gap-1.5 h-5 rounded-md',
    md: 'text-xs px-2.5 py-1 gap-2 h-6 rounded-lg',
    lg: 'text-sm px-3.5 py-1.5 gap-2.5 h-8 rounded-xl',
  }[size];

  // Variant + Color matrix
  const colorMap: Record<
    string,
    { solid: string; outline: string; soft: string; dot: string }
  > = {
    default: {
      solid: 'bg-slate-800 text-slate-200 border-transparent',
      outline: 'bg-transparent text-slate-300 border-slate-700',
      soft: 'bg-slate-800/50 text-slate-300 border-slate-700/50',
      dot: 'bg-slate-400',
    },
    primary: {
      solid: 'bg-cyan-500 text-black font-semibold border-transparent shadow-neon-cyan/20',
      outline: 'bg-transparent text-cyan-400 border-cyan-500/40',
      soft: 'bg-cyan-500/10 text-cyan-300 border-cyan-500/20',
      dot: 'bg-cyan-400',
    },
    secondary: {
      solid: 'bg-purple-600 text-white font-semibold border-transparent shadow-neon-purple/20',
      outline: 'bg-transparent text-purple-400 border-purple-500/40',
      soft: 'bg-purple-500/10 text-purple-300 border-purple-500/20',
      dot: 'bg-purple-400',
    },
    success: {
      solid: 'bg-emerald-500 text-black font-semibold border-transparent shadow-neon-emerald/20',
      outline: 'bg-transparent text-emerald-400 border-emerald-500/40',
      soft: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20',
      dot: 'bg-emerald-400',
    },
    warning: {
      solid: 'bg-amber-500 text-black font-semibold border-transparent',
      outline: 'bg-transparent text-amber-400 border-amber-500/40',
      soft: 'bg-amber-500/10 text-amber-300 border-amber-500/20',
      dot: 'bg-amber-400',
    },
    danger: {
      solid: 'bg-red-500 text-white font-semibold border-transparent shadow-neon-red/20',
      outline: 'bg-transparent text-red-400 border-red-500/40',
      soft: 'bg-red-500/10 text-red-300 border-red-500/20',
      dot: 'bg-red-400',
    },
    accent: {
      solid: 'bg-indigo-500 text-white font-semibold border-transparent',
      outline: 'bg-transparent text-indigo-400 border-indigo-500/40',
      soft: 'bg-indigo-500/10 text-indigo-300 border-indigo-500/20',
      dot: 'bg-indigo-400',
    },
  };

  const selectedColor = colorMap[color] || colorMap.default;
  const variantClass = selectedColor[variant];
  const dotColor = selectedColor.dot;

  return (
    <span
      onClick={isDisabled ? undefined : onClick}
      className={`inline-flex items-center justify-center font-medium border transition-all duration-200 select-none ${
        onClick && !isDisabled ? 'cursor-pointer hover:opacity-85' : ''
      } ${isDisabled ? 'opacity-40 pointer-events-none' : ''} ${sizeStyles} ${variantClass} ${className}`}
      style={{
        // Organic Mode overrides can plug in via css variables if present
      }}
    >
      {avatar && <span className="-ml-1 mr-1 shrink-0">{avatar}</span>}
      {dot && (
        <span
          className={`w-1.5 h-1.5 rounded-full shrink-0 ${dotColor}`}
        />
      )}
      {startContent && <span className="shrink-0">{startContent}</span>}
      <span className="truncate">{children}</span>
      {endContent && <span className="shrink-0">{endContent}</span>}
      {onClose && (
        <button
          type="button"
          aria-label="Remove chip"
          onClick={(e) => {
            e.stopPropagation();
            if (!isDisabled) onClose();
          }}
          className="-mr-1 p-0.5 rounded-full hover:bg-black/20 text-current/80 hover:text-current transition-colors"
        >
          <X className="w-3 h-3" />
        </button>
      )}
    </span>
  );
};

export default Chip;
