import React, { useCallback, useEffect, useRef, useState, ReactNode } from 'react';
import { motion, useAnimationControls, useReducedMotion } from 'framer-motion';
import { cn } from '../../lib/utils';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface KbdKeyProps {
  /** Cap legend, e.g. "K", "Space", "Enter" or "esc" */
  children: ReactNode;
  /**
   * Key to match against KeyboardEvent.key, case-insensitively. Friendly
   * names are supported: "meta"/"cmd", "ctrl", "shift", "alt"/"option",
   * "enter", "escape"/"esc", "space", "up"/"down"/"left"/"right".
   */
  keyName?: string;
  /** Depress the cap while the real key is held (window listener). Default true */
  listen?: boolean;
  /** Fires once per press — on a matching keydown or a pointer tap */
  onPress?: () => void;
  /** Visual size of the cap. Default "md" */
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export interface KbdComboProps {
  /** "+"-separated keys, e.g. "meta+k" or "shift+?" */
  keys: string;
  /** Depress each cap while its real key is held. Default true */
  listen?: boolean;
  /** Fires once each time every key in the combo is held down simultaneously */
  onTrigger?: () => void;
  /** Visual size of the caps. Default "md" */
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const PRESS_DEPTH = 2.5;
const PRESS_TRANSITION = { duration: 0.06, ease: 'easeOut' } as const;
const RELEASE_SPRING = { type: 'spring', stiffness: 550, damping: 18 } as const;
const PULSE_SCALE = [1, 1.08, 1];
const PULSE_TRANSITION = { duration: 0.22, ease: 'easeOut' } as const;

const KEY_ALIASES: Record<string, string> = {
  meta: 'Meta',
  cmd: 'Meta',
  command: 'Meta',
  ctrl: 'Control',
  control: 'Control',
  shift: 'Shift',
  alt: 'Alt',
  option: 'Alt',
  enter: 'Enter',
  return: 'Enter',
  escape: 'Escape',
  esc: 'Escape',
  space: ' ',
  up: 'ArrowUp',
  down: 'ArrowDown',
  left: 'ArrowLeft',
  right: 'ArrowRight',
};

const KEY_GLYPHS: Record<string, string> = {
  Meta: '⌘',
  Shift: '⇧',
  Alt: '⌥',
  Control: '⌃',
  Enter: '↵ Enter',
  ' ': '␣ Space',
  Escape: 'esc',
  ArrowUp: '↑',
  ArrowDown: '↓',
  ArrowLeft: '←',
  ArrowRight: '→',
};

const MODIFIERS = new Set(['meta', 'control', 'shift', 'alt']);

const SIZES = {
  sm: 'h-6 min-w-[24px] px-2 text-[10px]',
  md: 'h-7 min-w-[32px] px-2.5 text-xs',
  lg: 'h-8 min-w-[40px] px-3.5 text-sm',
} as const;

function toEventKey(name: string) {
  return KEY_ALIASES[name.toLowerCase()] ?? name;
}

function toGlyph(name: string) {
  const glyph = KEY_GLYPHS[toEventKey(name)];
  return glyph ?? (name.length === 1 ? name.toUpperCase() : name);
}

// ─── KbdKey Component ────────────────────────────────────────────────────────

export const KbdKey: React.FC<KbdKeyProps> = ({
  children,
  keyName,
  listen = true,
  onPress,
  size = 'md',
  className,
}) => {
  const shouldReduceMotion = useReducedMotion();
  const [pressed, setPressed] = useState(false);
  const pressedRef = useRef(false);
  const onPressRef = useRef(onPress);
  onPressRef.current = onPress;
  const pressedCodeRef = useRef<string | null>(null);

  const resolvedKeyName =
    keyName ?? (typeof children === 'string' ? children.toLowerCase() : undefined);

  const press = useCallback(() => {
    if (pressedRef.current) return;
    pressedRef.current = true;
    setPressed(true);
    onPressRef.current?.();
  }, []);

  const release = useCallback(() => {
    if (!pressedRef.current) return;
    pressedRef.current = false;
    pressedCodeRef.current = null;
    setPressed(false);
  }, []);

  useEffect(() => {
    if (!listen || !resolvedKeyName) return;

    const targetKey = toEventKey(resolvedKeyName).toLowerCase();
    const targetIsModifier = MODIFIERS.has(targetKey);

    const handleKeyDown = (event: KeyboardEvent) => {
      // Don't intercept if user is typing in form field
      if (['INPUT', 'TEXTAREA'].includes((event.target as HTMLElement)?.tagName)) {
        return;
      }
      if (event.repeat) return;
      if (event.key.toLowerCase() !== targetKey) return;
      pressedCodeRef.current = event.code;
      press();
    };

    const handleKeyUp = (event: KeyboardEvent) => {
      const releasedMatchingCode =
        pressedCodeRef.current !== null && event.code === pressedCodeRef.current;
      const metaSwallowedKeyUp =
        event.key.toLowerCase() === 'meta' && !targetIsModifier;
      if (
        event.key.toLowerCase() === targetKey ||
        releasedMatchingCode ||
        metaSwallowedKeyUp
      ) {
        release();
      }
    };

    const handleBlur = () => release();

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('blur', handleBlur);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('blur', handleBlur);
    };
  }, [listen, resolvedKeyName, press, release]);

  const cap = (
    <motion.kbd
      initial={false}
      animate={{ y: pressed ? PRESS_DEPTH : 0 }}
      transition={
        shouldReduceMotion
          ? { duration: 0 }
          : pressed
          ? PRESS_TRANSITION
          : RELEASE_SPRING
      }
      onPointerDown={(event) => {
        if (event.button !== 0) return;
        press();
      }}
      onPointerUp={release}
      onPointerLeave={release}
      onPointerCancel={release}
      className={cn(
        'inline-flex select-none items-center justify-center rounded-lg font-mono font-bold border transition-[background-color,box-shadow,border-color] duration-100 ease-out cursor-pointer',
        // Styling that responds to Cyber & Organic themes
        pressed
          ? 'bg-cyan-500/25 text-cyan-300 border-cyan-400/80 shadow-[0_0_0_0_rgba(0,0,0,0)]'
          : 'bg-slate-900/90 text-slate-200 border-white/20 shadow-[0_3px_0_0_rgba(255,255,255,0.12),0_4px_8px_rgba(0,0,0,0.4)] hover:border-white/35 kbd-key',
        SIZES[size],
        className
      )}
    >
      {children}
    </motion.kbd>
  );

  if (!onPress) return cap;

  return (
    <button
      type="button"
      aria-label={`Press ${resolvedKeyName ?? 'key'}`}
      className="inline-flex rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
    >
      {cap}
    </button>
  );
};

// ─── KbdCombo Component ──────────────────────────────────────────────────────

export const KbdCombo: React.FC<KbdComboProps> = ({
  keys,
  listen = true,
  onTrigger,
  size = 'md',
  className,
}) => {
  const shouldReduceMotion = useReducedMotion();
  const controls = useAnimationControls();
  const onTriggerRef = useRef(onTrigger);
  onTriggerRef.current = onTrigger;

  const keyNames = keys
    .split('+')
    .map((name) => name.trim())
    .filter(Boolean);

  useEffect(() => {
    if (!listen) return;

    const targets = keys
      .split('+')
      .map((name) => name.trim())
      .filter(Boolean)
      .map((name) => toEventKey(name).toLowerCase());
    if (targets.length === 0) return;

    const down = new Set<string>();
    const codeToKey = new Map<string, string>();
    let fired = false;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.repeat) return;
      const key = event.key.toLowerCase();
      if (!targets.includes(key)) return;
      down.add(key);
      codeToKey.set(event.code, key);
      if (fired || !targets.every((target) => down.has(target))) return;
      fired = true;
      onTriggerRef.current?.();
      if (!shouldReduceMotion) {
        controls.start({ scale: PULSE_SCALE, transition: PULSE_TRANSITION });
      }
    };

    const handleKeyUp = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();
      if (key === 'meta') {
        down.forEach((held) => {
          if (!MODIFIERS.has(held)) down.delete(held);
        });
        codeToKey.clear();
      }
      const mapped = codeToKey.get(event.code);
      if (mapped) {
        down.delete(mapped);
        codeToKey.delete(event.code);
      }
      down.delete(key);
      if (!targets.every((target) => down.has(target))) fired = false;
    };

    const handleBlur = () => {
      down.clear();
      codeToKey.clear();
      fired = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('blur', handleBlur);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('blur', handleBlur);
    };
  }, [keys, listen, shouldReduceMotion, controls]);

  return (
    <motion.span
      animate={controls}
      className={cn('inline-flex items-center gap-1', className)}
    >
      {keyNames.map((name, index) => (
        <React.Fragment key={`${name}-${index}`}>
          {index > 0 && (
            <span
              aria-hidden="true"
              className="select-none text-[10px] text-slate-400 font-bold"
            >
              +
            </span>
          )}
          <KbdKey keyName={name} listen={listen} size={size}>
            {toGlyph(name)}
          </KbdKey>
        </React.Fragment>
      ))}
    </motion.span>
  );
};

export default KbdKey;
