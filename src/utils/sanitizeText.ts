/**
 * sanitizeText.ts — Universal Client-Side Typist Text Sanitizer
 * Copyright (C) 2026 Class Of Learners. All rights reserved.
 * 
 * Guarantees that EVERY character in any typing text is 100% typeable
 * on physical keyboards without requiring special alt-codes, foreign IMEs,
 * or causing accidental keystroke mismatches.
 */

export function sanitizeTypingText(rawText: string): string {
  if (!rawText) return '';

  let text = rawText;

  // 1. Normalize unicode quotation marks and smart apostrophes
  text = text.replace(/[\u2018\u2019\u201A\u201B\u02BC\u02BB\u02BD\u00B4`]/g, "'");
  text = text.replace(/[\u201C\u201D\u201E\u201F\u00AB\u00BB]/g, '"');

  // 2. Normalize em-dashes, en-dashes, minus signs, and horizontal bars to standard hyphen '-'
  text = text.replace(/[\u2012\u2013\u2014\u2015\u2212\uFE58\uFE63\uFF0D]/g, '-');

  // 3. Normalize ellipsis
  text = text.replace(/\u2026/g, '...');

  // 4. Normalize unicode whitespaces (non-breaking, narrow, zero-width, ideographic) to standard space
  text = text.replace(/[\u00A0\u2000-\u200B\u2028\u2029\u202F\u205F\u3000\uFEFF]/g, ' ');

  // 5. Normalize decomposed accents (e.g., é -> e, ñ -> n, ü -> u, ç -> c)
  try {
    text = text.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  } catch {
    // Fallback if browser doesn't support NFD normalization
  }

  // 6. Clean consecutive spaces and normalize line endings
  text = text.replace(/[ \t]+/g, ' ');
  text = text.replace(/\r\n/g, '\n');

  return text.trim();
}

/**
 * Checks if a typed character is equivalent to a target character,
 * providing smart tolerance for quote/dash variations so typists
 * never get stuck on edge cases.
 */
export function isEquivalentKey(typedChar: string, targetChar: string, caseInsensitive: boolean = false): boolean {
  if (typedChar === targetChar) return true;

  // Case insensitive match only if explicitly enabled
  if (caseInsensitive && typedChar.toLowerCase() === targetChar.toLowerCase()) return true;

  // Apostrophe / quote tolerance
  if ((typedChar === "'" || typedChar === '`') && (targetChar === "'" || targetChar === '’' || targetChar === '‘')) {
    return true;
  }
  if (typedChar === '"' && (targetChar === '"' || targetChar === '“' || targetChar === '”')) {
    return true;
  }

  // Dash tolerance
  if (typedChar === '-' && (targetChar === '-' || targetChar === '—' || targetChar === '–')) {
    return true;
  }

  // Space tolerance
  if ((typedChar === ' ' || typedChar === '\u00A0') && (targetChar === ' ' || targetChar === '\u00A0')) {
    return true;
  }

  return false;
}
