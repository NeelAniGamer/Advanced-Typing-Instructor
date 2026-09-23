import React, { ReactNode } from 'react';

export interface FieldsetProps {
  children: ReactNode;
  variant?: 'card' | 'plain';
  isDisabled?: boolean;
  className?: string;
}

export const Fieldset: React.FC<FieldsetProps> & {
  Legend: typeof FieldsetLegend;
  Description: typeof FieldsetDescription;
  Item: typeof FieldsetItem;
} = ({
  children,
  variant = 'card',
  isDisabled = false,
  className = '',
}) => {
  const variantStyles = {
    card: 'p-5 sm:p-6 rounded-2xl border border-white/10 bg-slate-900/40 backdrop-blur-md shadow-lg',
    plain: 'p-0 border-none bg-transparent',
  }[variant];

  return (
    <fieldset
      disabled={isDisabled}
      className={`relative flex flex-col gap-4 ${
        isDisabled ? 'opacity-50 pointer-events-none' : ''
      } ${variantStyles} ${className}`}
      style={{
        borderColor: 'var(--fieldset-border, rgba(255, 255, 255, 0.08))',
      }}
    >
      {children}
    </fieldset>
  );
};

// --- Fieldset Legend ---
export interface FieldsetLegendProps {
  children: ReactNode;
  icon?: ReactNode;
  badge?: ReactNode;
  className?: string;
}

const FieldsetLegend: React.FC<FieldsetLegendProps> = ({
  children,
  icon,
  badge,
  className = '',
}) => {
  return (
    <legend
      className={`float-none flex items-center gap-2.5 text-sm sm:text-base font-display font-bold text-white mb-1 ${className}`}
    >
      {icon && <span className="text-cyan-400 shrink-0">{icon}</span>}
      <span>{children}</span>
      {badge && <span className="ml-1 shrink-0">{badge}</span>}
    </legend>
  );
};

// --- Fieldset Description ---
export interface FieldsetDescriptionProps {
  children: ReactNode;
  className?: string;
}

const FieldsetDescription: React.FC<FieldsetDescriptionProps> = ({
  children,
  className = '',
}) => {
  return (
    <p className={`text-xs text-slate-400 -mt-2 mb-2 leading-relaxed ${className}`}>
      {children}
    </p>
  );
};

// --- Fieldset Item ---
export interface FieldsetItemProps {
  children: ReactNode;
  label?: ReactNode;
  description?: ReactNode;
  errorMessage?: ReactNode;
  isRequired?: boolean;
  className?: string;
}

const FieldsetItem: React.FC<FieldsetItemProps> = ({
  children,
  label,
  description,
  errorMessage,
  isRequired = false,
  className = '',
}) => {
  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      {label && (
        <label className="text-xs font-semibold text-slate-300 flex items-center gap-1 select-none">
          <span>{label}</span>
          {isRequired && <span className="text-red-400 font-bold">*</span>}
        </label>
      )}

      {children}

      {description && !errorMessage && (
        <span className="text-[11px] text-slate-500 leading-tight">
          {description}
        </span>
      )}

      {errorMessage && (
        <span className="text-[11px] text-red-400 font-medium leading-tight">
          {errorMessage}
        </span>
      )}
    </div>
  );
};

Fieldset.Legend = FieldsetLegend;
Fieldset.Description = FieldsetDescription;
Fieldset.Item = FieldsetItem;

export default Fieldset;
