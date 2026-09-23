"""
style_engine.py — Adaptive Typing Style & Casing Transformation Engine
Copyright (C) 2026 Class Of Learners. All rights reserved.

Adapts curriculum words, sentences, and AI-generated text to match
the user's unique real-world typing habits, with dedicated support
for Title Case (Capitalizing every word), code casings, and symbols.
"""

import re
from enum import Enum
from typing import List, Dict, Any


class CasingStyle(str, Enum):
    TITLE_CASE = "title_case"             # "Every Word Capitalized Like This" (User's natural style)
    STANDARD_PROSE = "standard_prose"     # "Standard capitalization only at sentence starts."
    CODE_CAMEL_CASE = "code_camel_case"   # "camelCaseVariableNamesForDevelopers"
    CODE_SNAKE_CASE = "code_snake_case"   # "snake_case_functions_and_identifiers"
    FAST_LOWERCASE = "fast_lowercase"     # "pure lowercase for raw speed sprints"
    NUMERIC_SYMBOL = "numeric_symbol"     # "Words#42 With$Symbols & Numbers100"


STYLE_METADATA: Dict[str, Dict[str, Any]] = {
    CasingStyle.TITLE_CASE.value: {
        "name": "Title Case (Every Word Capital)",
        "description": "Every word starts with an uppercase letter. Trains rapid Shift-key pinky coordination and actuation cadence.",
        "icon": "🔠",
        "focus_skill": "Shift Key Synchronization & Return Stroke",
        "shift_heavy": True
    },
    CasingStyle.STANDARD_PROSE.value: {
        "name": "Standard Literature Prose",
        "description": "Natural capitalization at the start of sentences and proper nouns.",
        "icon": "📖",
        "focus_skill": "Fluid Sentence Cadence & Reading Ahead",
        "shift_heavy": False
    },
    CasingStyle.CODE_CAMEL_CASE.value: {
        "name": "Developer camelCase",
        "description": "First word lowercase, followed by uppercase initial letters (JavaScript/TypeScript/Java).",
        "icon": "💻",
        "focus_skill": "Subconscious Mid-Word Capitalization",
        "shift_heavy": True
    },
    CasingStyle.CODE_SNAKE_CASE.value: {
        "name": "Backend snake_case",
        "description": "Lowercase words interconnected by underscores (Python/Rust/SQL).",
        "icon": "🐍",
        "focus_skill": "Underscore Reach & Right Pinky Stretch",
        "shift_heavy": True
    },
    CasingStyle.FAST_LOWERCASE.value: {
        "name": "Velocity Lowercase",
        "description": "Zero Shift key actuation for maximum raw bursts and pure finger flow.",
        "icon": "⚡",
        "focus_skill": "Raw Keystroke Velocity & Pure Flow State",
        "shift_heavy": False
    },
    CasingStyle.NUMERIC_SYMBOL.value: {
        "name": "Code & Symbol Heavy",
        "description": "Integrated numbers (#, $, @, %, &) alongside text.",
        "icon": "🔢",
        "focus_skill": "Number Row & Symbol Actuation Precision",
        "shift_heavy": True
    }
}


class TypingStyleEngine:
    """Transforms words and text into the user's preferred typing style."""

    @staticmethod
    def canonicalize_style(style_name: str) -> str:
        s = str(style_name or "").strip().lower()
        mapping = {
            "title_case": CasingStyle.TITLE_CASE.value,
            "standard_prose": CasingStyle.STANDARD_PROSE.value,
            "sentence_case": CasingStyle.STANDARD_PROSE.value,
            "code_camel_case": CasingStyle.CODE_CAMEL_CASE.value,
            "camel_case": CasingStyle.CODE_CAMEL_CASE.value,
            "code_snake_case": CasingStyle.CODE_SNAKE_CASE.value,
            "snake_case": CasingStyle.CODE_SNAKE_CASE.value,
            "fast_lowercase": CasingStyle.FAST_LOWERCASE.value,
            "standard_lowercase": CasingStyle.FAST_LOWERCASE.value,
            "all_caps": "all_caps",
            "numeric_symbol": CasingStyle.NUMERIC_SYMBOL.value,
        }
        return mapping.get(s, CasingStyle.TITLE_CASE.value)

    @staticmethod
    def get_style_info(style_name: str) -> Dict[str, Any]:
        can = TypingStyleEngine.canonicalize_style(style_name)
        return STYLE_METADATA.get(can, STYLE_METADATA[CasingStyle.TITLE_CASE.value])

    @staticmethod
    def list_styles() -> List[Dict[str, Any]]:
        return [{"id": k, **v} for k, v in STYLE_METADATA.items()]

    @staticmethod
    def detect_style(sample_text: str) -> str:
        """Analyzes a text sample to detect the user's natural typing style."""
        words = [w for w in re.findall(r"\b\w+\b", sample_text) if len(w) > 1]
        if not words:
            return CasingStyle.STANDARD_PROSE.value

        if all(w.islower() for w in words):
            return CasingStyle.FAST_LOWERCASE.value

        title_count = sum(1 for w in words if w[0].isupper() and w[1:].islower())
        ratio = title_count / len(words)

        if ratio >= 0.65:
            return CasingStyle.TITLE_CASE.value

        if "_" in sample_text and any(w.islower() for w in words):
            return CasingStyle.CODE_SNAKE_CASE.value

        camel_count = sum(1 for w in words if any(c.isupper() for c in w[1:]) and w[0].islower())
        if camel_count / len(words) >= 0.35:
            return CasingStyle.CODE_CAMEL_CASE.value

        return CasingStyle.STANDARD_PROSE.value

    @staticmethod
    def transform_word(word: str, style: str) -> str:
        """Transforms an individual word according to the casing style."""
        w = word.strip()
        if not w:
            return ""

        st = TypingStyleEngine.canonicalize_style(style)

        if st == CasingStyle.TITLE_CASE.value:
            return w[0].upper() + w[1:].lower() if len(w) > 1 else w.upper()

        elif st == CasingStyle.STANDARD_PROSE.value:
            # Normal language: plain lowercase word (sentence starts are
            # capitalized by transform_text, not per word).
            return w.lower()

        elif st == CasingStyle.FAST_LOWERCASE.value:
            return w.lower()

        elif st == "all_caps":
            return w.upper()

        elif st == CasingStyle.CODE_SNAKE_CASE.value:
            return w.lower()

        elif st == CasingStyle.CODE_CAMEL_CASE.value:
            return w[0].lower() + w[1:] if len(w) > 1 else w.lower()

        elif st == CasingStyle.NUMERIC_SYMBOL.value:
            symbols = ["#", "$", "@", "_", "1", "2", "3", "7", "9"]
            seed = sum(ord(c) for c in w)
            if len(w) > 4 and seed % 3 == 0:
                sym = symbols[seed % len(symbols)]
                return f"{w.capitalize()}{sym}"
            return w.capitalize()

        return w

    @staticmethod
    def transform_words(words: List[str], style: str) -> List[str]:
        """Transforms a list of words."""
        st = TypingStyleEngine.canonicalize_style(style)
        transformed = []
        for i, w in enumerate(words):
            if st == CasingStyle.CODE_CAMEL_CASE.value:
                if i % 2 == 1 and transformed:
                    prev = transformed.pop()
                    camel = prev.lower() + w.capitalize()
                    transformed.append(camel)
                else:
                    transformed.append(w.lower())
            elif st == CasingStyle.CODE_SNAKE_CASE.value:
                if i % 2 == 1 and transformed:
                    prev = transformed.pop()
                    snake = f"{prev.lower()}_{w.lower()}"
                    transformed.append(snake)
                else:
                    transformed.append(w.lower())
            else:
                transformed.append(TypingStyleEngine.transform_word(w, st))

        return transformed

    @staticmethod
    def transform_text(text: str, style: str) -> str:
        """Transforms a full paragraph or sentence to match the selected style."""
        if not text:
            return ""

        st = TypingStyleEngine.canonicalize_style(style)

        if st == CasingStyle.STANDARD_PROSE.value:
            # Normal language: lowercase everything, then capitalize only
            # sentence starts (and the very first letter).
            lowered = text.lower()

            def cap_sentence(match):
                return match.group(1) + match.group(2).upper()

            return re.sub(r"(^|[.!?]\s+)([a-z])", cap_sentence, lowered)

        if st == CasingStyle.TITLE_CASE.value:
            def cap_word(match):
                word = match.group(0)
                return word[0].upper() + word[1:].lower() if len(word) > 1 else word.upper()

            return re.sub(r"\b[a-zA-Z]+\b", cap_word, text)

        elif st == CasingStyle.FAST_LOWERCASE.value:
            return text.lower()

        elif st == "all_caps":
            return text.upper()

        elif st == CasingStyle.CODE_CAMEL_CASE.value:
            words = text.split()
            out = []
            for i, w in enumerate(words):
                m = re.match(r"^([^\w]*)([\w]+)([^\w]*)$", w)
                if m:
                    pre, core, post = m.groups()
                    if i % 2 == 1 and out:
                        prev = out.pop()
                        out.append(f"{prev}{core.capitalize()}{post}")
                    else:
                        out.append(f"{pre}{core.lower()}{post}")
                else:
                    out.append(w)
            return " ".join(out)

        elif st == CasingStyle.CODE_SNAKE_CASE.value:
            words = text.split()
            out = []
            for i, w in enumerate(words):
                m = re.match(r"^([^\w]*)([\w]+)([^\w]*)$", w)
                if m:
                    pre, core, post = m.groups()
                    if i % 2 == 1 and out:
                        prev = out.pop()
                        out.append(f"{prev}_{core.lower()}{post}")
                    else:
                        out.append(f"{pre}{core.lower()}{post}")
                else:
                    out.append(w)
            return " ".join(out)

        elif st == CasingStyle.NUMERIC_SYMBOL.value:
            def sym_word(match):
                word = match.group(0)
                return TypingStyleEngine.transform_word(word, st)
            return re.sub(r"\b[a-zA-Z]+\b", sym_word, text)

        return text
