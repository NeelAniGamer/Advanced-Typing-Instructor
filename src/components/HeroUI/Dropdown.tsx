import React, {
  createContext,
  useContext,
  useState,
  useRef,
  useEffect,
  ReactNode,
  KeyboardEvent,
} from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check } from 'lucide-react';

// --- Types & Context ---
interface DropdownContextType {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  toggle: () => void;
  onAction?: (key: string) => void;
  selectionMode?: 'none' | 'single' | 'multiple';
  selectedKeys: Set<string>;
  setSelectedKeys: React.Dispatch<React.SetStateAction<Set<string>>>;
  triggerRef: React.RefObject<HTMLDivElement>;
}

const DropdownContext = createContext<DropdownContextType | null>(null);

function useDropdown() {
  const context = useContext(DropdownContext);
  if (!context) {
    throw new Error('Dropdown subcomponents must be used within a <Dropdown>');
  }
  return context;
}

// --- Root Component ---
export interface DropdownProps {
  children: ReactNode;
  onAction?: (key: string) => void;
  selectionMode?: 'none' | 'single' | 'multiple';
  selectedKeys?: string[] | Set<string>;
  defaultSelectedKeys?: string[] | Set<string>;
  onSelectionChange?: (keys: Set<string>) => void;
  className?: string;
}

export const Dropdown: React.FC<DropdownProps> & {
  Trigger: typeof DropdownTrigger;
  Popover: typeof DropdownPopover;
  Menu: typeof DropdownMenu;
  Item: typeof DropdownItem;
  Section: typeof DropdownSection;
  Header: typeof DropdownHeader;
  Separator: typeof DropdownSeparator;
} = ({
  children,
  onAction,
  selectionMode = 'none',
  selectedKeys: controlledKeys,
  defaultSelectedKeys,
  onSelectionChange,
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [uncontrolledKeys, setUncontrolledKeys] = useState<Set<string>>(
    () => new Set(defaultSelectedKeys || [])
  );
  const triggerRef = useRef<HTMLDivElement>(null);

  const selectedKeys = controlledKeys
    ? new Set(controlledKeys)
    : uncontrolledKeys;

  const handleSetSelectedKeys: React.Dispatch<React.SetStateAction<Set<string>>> = (
    updater
  ) => {
    if (typeof updater === 'function') {
      setUncontrolledKeys((prev) => {
        const next = updater(prev);
        onSelectionChange?.(next);
        return next;
      });
    } else {
      setUncontrolledKeys(updater);
      onSelectionChange?.(updater);
    }
  };

  return (
    <DropdownContext.Provider
      value={{
        isOpen,
        setIsOpen,
        toggle: () => setIsOpen((prev) => !prev),
        onAction,
        selectionMode,
        selectedKeys,
        setSelectedKeys: handleSetSelectedKeys,
        triggerRef,
      }}
    >
      <div ref={triggerRef} className={`relative inline-block text-left ${className}`}>
        {children}
      </div>
    </DropdownContext.Provider>
  );
};

// --- Subcomponents ---

export interface DropdownTriggerProps {
  children: ReactNode;
  className?: string;
}

const DropdownTrigger: React.FC<DropdownTriggerProps> = ({
  children,
  className = '',
}) => {
  const { toggle, isOpen } = useDropdown();

  return (
    <div
      onClick={toggle}
      aria-expanded={isOpen}
      aria-haspopup="menu"
      className={`inline-flex items-center cursor-pointer ${className}`}
    >
      {children}
    </div>
  );
};

export interface DropdownPopoverProps {
  children: ReactNode;
  className?: string;
  placement?: 'bottom-start' | 'bottom-end' | 'top-start' | 'top-end';
}

const DropdownPopover: React.FC<DropdownPopoverProps> = ({
  children,
  className = '',
  placement = 'bottom-start',
}) => {
  const { isOpen, setIsOpen, triggerRef } = useDropdown();
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(event.target as Node) &&
        triggerRef.current &&
        !triggerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, setIsOpen, triggerRef]);

  const placementClasses = {
    'bottom-start': 'top-full left-0 mt-2',
    'bottom-end': 'top-full right-0 mt-2',
    'top-start': 'bottom-full left-0 mb-2',
    'top-end': 'bottom-full right-0 mb-2',
  }[placement];

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          ref={popoverRef}
          initial={{ opacity: 0, scale: 0.96, y: -4 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: -4 }}
          transition={{ duration: 0.15, ease: 'easeOut' }}
          className={`absolute z-50 min-w-[200px] rounded-2xl p-1.5 shadow-2xl backdrop-blur-xl border border-white/10 bg-slate-900/90 text-slate-200 ${placementClasses} ${className}`}
          style={{
            background: 'var(--dropdown-bg, rgba(15, 23, 42, 0.92))',
            borderColor: 'var(--dropdown-border, rgba(255, 255, 255, 0.12))',
          }}
          role="menu"
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export interface DropdownMenuProps {
  children: ReactNode;
  className?: string;
  onAction?: (key: string) => void;
  selectionMode?: 'none' | 'single' | 'multiple';
}

const DropdownMenu: React.FC<DropdownMenuProps> = ({
  children,
  className = '',
  onAction: menuAction,
}) => {
  const { onAction: contextAction } = useDropdown();

  return (
    <div
      className={`flex flex-col gap-0.5 py-1 ${className}`}
      onClick={(e) => {
        // Find if an item key was clicked
        const item = (e.target as HTMLElement).closest('[data-dropdown-item-id]');
        if (item) {
          const key = item.getAttribute('data-dropdown-item-id');
          if (key) {
            menuAction?.(key);
            contextAction?.(key);
          }
        }
      }}
    >
      {children}
    </div>
  );
};

export interface DropdownItemProps {
  id: string;
  children: ReactNode;
  textValue?: string;
  description?: string;
  startContent?: ReactNode;
  endContent?: ReactNode;
  variant?: 'default' | 'accent' | 'danger';
  isDisabled?: boolean;
  className?: string;
  onClick?: () => void;
}

const DropdownItem: React.FC<DropdownItemProps> = ({
  id,
  children,
  description,
  startContent,
  endContent,
  variant = 'default',
  isDisabled = false,
  className = '',
  onClick,
}) => {
  const {
    setIsOpen,
    selectionMode,
    selectedKeys,
    setSelectedKeys,
    onAction,
  } = useDropdown();

  const isSelected = selectedKeys.has(id);

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isDisabled) return;

    if (selectionMode === 'single') {
      setSelectedKeys(new Set([id]));
      setIsOpen(false);
    } else if (selectionMode === 'multiple') {
      setSelectedKeys((prev) => {
        const next = new Set(prev);
        if (next.has(id)) {
          next.delete(id);
        } else {
          next.add(id);
        }
        return next;
      });
    } else {
      setIsOpen(false);
    }

    onClick?.();
    onAction?.(id);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (isDisabled) return;
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick(e as unknown as React.MouseEvent);
    }
  };

  const variantStyles = {
    default:
      'text-inherit hover:bg-black/5 dark:hover:bg-white/10 [.theme-organic_&]:hover:bg-[#EBE7DF] [.theme-organic-dark_&]:hover:bg-[#252C28] data-[selected=true]:bg-[#7C8D81]/20 data-[selected=true]:text-[#C97D5A] dark:data-[selected=true]:bg-cyan-500/15 dark:data-[selected=true]:text-cyan-400',
    accent:
      'text-cyan-500 dark:text-cyan-400 hover:bg-cyan-500/15 hover:text-cyan-600 dark:hover:text-cyan-300 data-[selected=true]:bg-cyan-500/20 data-[selected=true]:text-cyan-500',
    danger:
      'text-red-500 dark:text-red-400 hover:bg-red-500/15 hover:text-red-600 dark:hover:text-red-300 data-[selected=true]:bg-red-500/20 data-[selected=true]:text-red-500',
  }[variant];

  return (
    <div
      role="menuitem"
      tabIndex={isDisabled ? -1 : 0}
      data-dropdown-item-id={id}
      data-selected={isSelected}
      aria-disabled={isDisabled}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      className={`group flex items-center justify-between px-3 py-2 text-xs font-medium rounded-xl cursor-pointer transition-all duration-150 outline-none select-none ${
        isDisabled ? 'opacity-40 pointer-events-none' : ''
      } ${variantStyles} ${className}`}
    >
      <div className="flex items-center gap-2.5 min-w-0">
        {selectionMode !== 'none' && (
          <span
            className={`w-3.5 h-3.5 rounded flex items-center justify-center transition-colors ${
              isSelected
                ? 'bg-cyan-500 text-black'
                : 'border border-white/20 text-transparent'
            }`}
          >
            <Check className="w-2.5 h-2.5 stroke-[3]" />
          </span>
        )}
        {startContent && (
          <span className="shrink-0 text-slate-400 group-hover:text-white transition-colors">
            {startContent}
          </span>
        )}
        <div className="flex flex-col min-w-0">
          <span className="truncate font-bold text-sm tracking-tight text-slate-900 dark:text-slate-100 [.theme-organic_&]:text-[#1A1F1D] [.theme-organic-dark_&]:text-[#FAF8F5]">
            {children}
          </span>
          {description && (
            <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 [.theme-organic_&]:text-[#4D5752] [.theme-organic-dark_&]:text-[#A8B4AD] truncate mt-0.5">
              {description}
            </span>
          )}
        </div>
      </div>

      {endContent && (
        <span className="shrink-0 text-slate-500 text-[11px] ml-3">
          {endContent}
        </span>
      )}
    </div>
  );
};

export interface DropdownSectionProps {
  title?: string;
  children: ReactNode;
  className?: string;
}

const DropdownSection: React.FC<DropdownSectionProps> = ({
  title,
  children,
  className = '',
}) => {
  return (
    <div className={`py-1 ${className}`}>
      {title && (
        <div className="px-3 py-1 text-[10px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-400 [.theme-organic_&]:text-[#C97D5A] [.theme-organic-dark_&]:text-[#EBC078]">
          {title}
        </div>
      )}
      <div className="flex flex-col gap-0.5">{children}</div>
    </div>
  );
};

export interface DropdownHeaderProps {
  children: ReactNode;
  className?: string;
}

const DropdownHeader: React.FC<DropdownHeaderProps> = ({
  children,
  className = '',
}) => {
  return (
    <div
      className={`px-3 py-2 text-xs font-bold text-slate-300 border-b border-white/5 mb-1 ${className}`}
    >
      {children}
    </div>
  );
};

export interface DropdownSeparatorProps {
  className?: string;
}

const DropdownSeparator: React.FC<DropdownSeparatorProps> = ({
  className = '',
}) => {
  return <div className={`my-1 h-px bg-white/10 ${className}`} />;
};

Dropdown.Trigger = DropdownTrigger;
Dropdown.Popover = DropdownPopover;
Dropdown.Menu = DropdownMenu;
Dropdown.Item = DropdownItem;
Dropdown.Section = DropdownSection;
Dropdown.Header = DropdownHeader;
Dropdown.Separator = DropdownSeparator;

export default Dropdown;
