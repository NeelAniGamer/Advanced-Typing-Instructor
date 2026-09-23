import React, { ReactNode } from 'react';

export interface ProgressBarProps {
  value?: number;
  minValue?: number;
  maxValue?: number;
  label?: ReactNode;
  showValueLabel?: boolean;
  valueLabel?: ReactNode;
  color?:
    | 'default'
    | 'primary'
    | 'secondary'
    | 'success'
    | 'warning'
    | 'danger'
    | 'accent';
  size?: 'sm' | 'md' | 'lg';
  isIndeterminate?: boolean;
  isStriped?: boolean;
  className?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  value = 0,
  minValue = 0,
  maxValue = 100,
  label,
  showValueLabel = false,
  valueLabel,
  color = 'primary',
  size = 'md',
  isIndeterminate = false,
  isStriped = false,
  className = '',
}) => {
  const percentage = Math.min(
    100,
    Math.max(0, ((value - minValue) / (maxValue - minValue)) * 100)
  );

  const sizeStyles = {
    sm: 'h-1.5',
    md: 'h-2.5',
    lg: 'h-4',
  }[size];

  const colorStyles = {
    default: 'bg-slate-500 shadow-[0_0_10px_rgba(100,116,139,0.3)]',
    primary: 'bg-cyan-400 shadow-neon-cyan/40',
    secondary: 'bg-purple-500 shadow-neon-purple/40',
    success: 'bg-emerald-400 shadow-neon-emerald/40',
    warning: 'bg-amber-400 shadow-[0_0_10px_rgba(251,191,36,0.4)]',
    danger: 'bg-red-500 shadow-neon-red/40',
    accent: 'bg-indigo-400 shadow-[0_0_10px_rgba(129,140,248,0.4)]',
  }[color];

  const displayLabel = valueLabel || `${Math.round(percentage)}%`;

  return (
    <div className={`w-full flex flex-col gap-1.5 ${className}`}>
      {(label || showValueLabel) && (
        <div className="flex items-center justify-between text-xs font-semibold text-slate-300 select-none">
          {label && <span>{label}</span>}
          {showValueLabel && (
            <span className="font-mono text-slate-400">{displayLabel}</span>
          )}
        </div>
      )}

      <div
        className={`w-full bg-slate-900/80 rounded-full overflow-hidden border border-white/5 p-0.5 ${sizeStyles}`}
        role="progressbar"
        aria-valuenow={isIndeterminate ? undefined : value}
        aria-valuemin={minValue}
        aria-valuemax={maxValue}
      >
        {isIndeterminate ? (
          <div
            className={`h-full w-1/3 rounded-full animate-indeterminate ${colorStyles}`}
          />
        ) : (
          <div
            className={`h-full rounded-full transition-all duration-300 ease-out ${colorStyles} ${
              isStriped ? 'bg-striped' : ''
            }`}
            style={{ width: `${percentage}%` }}
          />
        )}
      </div>
    </div>
  );
};

export default ProgressBar;
