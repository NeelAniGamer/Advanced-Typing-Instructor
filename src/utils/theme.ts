export type UITheme = 'organic' | 'organic-dark' | 'cyber';

/**
 * Organic Innovation Palette Tokens (Project Kairos)
 * A deliberately human-centric and refreshing departure from dark mode and neon blues.
 */
export const ORGANIC_PALETTE = {
  sage: '#7C8D81',       // Sage Slate: calming active tabs, focus states, secondary accents
  linen: '#FAF8F5',      // Warm Linen: primary background, soft organic canvas
  terracotta: '#C97D5A', // Terracotta: primary CTA buttons, carets, vital actions
  graphite: '#333333',   // Graphite: high-contrast headers and body text
  ochre: '#EBC078',      // Soft Ochre: highlights, streaks, badges, charts
  steel: '#B8C0BF',      // Muted Steel: subtle borders, dividers, secondary tags
  cardBg: '#FFFFFF',     // Clean card background
  cardBorder: '#E5DFD7', // Clean card border
  surfaceMuted: '#F4F0EA'// Muted secondary container surface
} as const;

/**
 * Organic Dark Mode Palette Tokens
 * Soothing, warm espresso & earth charcoal aesthetics with terracotta and sage accents.
 */
export const ORGANIC_DARK_PALETTE = {
  canvas: '#141716',       // Deep Earth Charcoal: foundational dark canvas
  cardBg: '#1E2220',       // Warm Graphite Card: elevated dark container
  cardBorder: '#2E3531',   // Earth Muted Border: subtle separation
  surfaceMuted: '#191D1B', // Secondary surface
  terracotta: '#D98A66',   // Warm Terracotta: primary actions and highlights
  sage: '#8FA896',         // Soft Sage: active tabs, status, focused state
  linen: '#FAF8F5',        // Warm Bone/Linen: high-contrast headers
  graphite: '#E0DDD7',     // Soft Graphite: primary body text
  ochre: '#EBC078',        // Ochre: streaks and stars
  steel: '#68736E',        // Muted Slate: dividers and secondary tags
} as const;

/**
 * Studio Obsidian Palette Tokens (Master Typist Studio)
 * A refined, low-glare dark instrument aesthetic (Linear, GitHub, Monkeytype).
 */
export const STUDIO_OBSIDIAN_PALETTE = {
  canvas: '#0d1117',        // Deep Obsidian Canvas
  cardBg: '#161b22',        // Elevated Studio Card
  cardBorder: '#30363d',    // Crisp Quiet Border
  surfaceMuted: '#1f242c',  // Muted Control Surface
  textPrimary: '#f0f6fc',   // Crisp, High-Contrast Text
  textSecondary: '#8b949e', // Muted Secondary Slate
  accent: '#38bdf8',        // Sky Blue Accent (Calibrated, Non-glaring)
  success: '#34d399',       // Clean Emerald
  warning: '#fbbf24',       // Warm Amber
  error: '#f87171',         // High-Contrast Soft Rose
} as const;

/**
 * Universal Theme Helpers
 */
export const isOrganicLight = (theme?: UITheme): boolean => theme === 'organic';
export const isOrganicDark = (theme?: UITheme): boolean => theme === 'organic-dark';
export const isOrganicTheme = (theme?: UITheme): boolean => theme === 'organic' || theme === 'organic-dark';
export const isStudioDark = (theme?: UITheme): boolean => !theme || theme === 'cyber';

/**
 * Determines whether the current active mode should display the Serious Theme.
 * Serious Theme is triggered whenever the user enters the Coding module or selects Code mode
 * when in Studio / Dark mode.
 */
export const isSeriousTheme = (category?: string, mode?: string): boolean => {
  return category === 'Coding' || mode === 'Code';
};

/**
 * Global App & Version Constants
 */
export const APP_VERSION = '3.2.1';
export const APP_BUILD_REV = '3.2.1-desktop';

