"""
word_synthesizer.py — Procedural AI Word & Sentence Generator
Copyright (C) 2026 Class Of Learners. All rights reserved.

Generates randomized, novel words, sentences, and paragraphs on demand
leveraging on-device PerceptusLM and curriculum difficulty scaling.
"""

import os
import sys
import random
import re
from typing import List, Optional

from .style_engine import TypingStyleEngine, CasingStyle
from .massive_word_bank import MassiveWordEngine, sanitize_typing_text
try:
    from .micro_llm import get_typolm, TypoLM
    HAS_TYPOLM = True
except ImportError:
    HAS_TYPOLM = False


# Thematic vocabulary seeds by complexity tier
THEMATIC_TIERS = {
    "starter": [
        "red", "sun", "sky", "cup", "box", "key", "air", "run", "joy", "sea", "fox", "ice", "fly", "cat", "car", "day",
        "map", "tag", "law", "ray", "tin", "pen", "row", "bay", "dot", "dog", "hop", "fit", "log", "pit", "mud", "web"
    ],
    "intermediate": [
        "swift", "track", "clean", "focus", "spark", "pulse", "cyber", "drive", "sharp", "blade", "power", "sound",
        "steel", "light", "space", "flash", "forge", "glide", "prism", "react", "scale", "turbo", "vivid", "yield",
        "arrow", "brave", "crest", "drift", "flame", "giant", "hyper", "laser", "nexus", "orbit", "alpha", "burst"
    ],
    "advanced": [
        "resonance", "stabilizer", "microcontroller", "throughput", "dielectric", "capacitance", "entanglement",
        "spectroscopy", "interconnect", "photolithography", "astrophysics", "neuroplasticity", "thermodynamic",
        "architecture", "asynchronous", "synchronization", "cryptographic", "infrastructure", "electromagnetic"
    ],
    "grandmaster": [
        "superconductivity", "bioluminescence", "counterbalancing", "compartmentalization",
        "institutionalization", "interchangeability", "microspectrophotometry", "incomprehensibility",
        "electroencephalography", "psychophysiological", "otorhinolaryngologist", "crystallographically"
    ]
}

THEMATIC_SENTENCES = [
    "The rapid actuation of mechanical key switches delivers distinct auditory and tactile response.",
    "Rhythm and consistent finger cadence are fundamental to sustaining high speed without physical fatigue.",
    "Advanced typists read several words ahead, allowing their fingers to formulate strokes before keys are pressed.",
    "Title case formatting requires balanced actuation of both left and right pinky shift keys.",
    "Spatial hand tracking and cyber mechanical interfaces represent the next evolution of human computing.",
    "Every word typed with precision reinforces neuromuscular pathways in the motor cortex.",
    "Subconscious muscle memory unlocks flow state, eliminating hesitation between key actuations.",
    "Distributed algorithms, compiler pipelines, and neural weights operate in seamless mathematical harmony."
]


def get_level_word_count(level: int) -> int:
    """Scales word limit according to level difficulty curve."""
    lvl = max(1, min(200, int(level)))
    if lvl <= 25:
        return 20
    elif lvl <= 40:
        return 18
    elif lvl <= 60:
        return 15
    elif lvl <= 80:
        return 12
    elif lvl <= 100:
        return 10
    elif lvl <= 140:
        return 8
    elif lvl <= 160:
        return 7
    else:
        return 5


class AIWordSynthesizer:
    """Generates procedural words, sentences, and paragraphs styled to the user's preference."""

    def __init__(self):
        self.engine = None
        self.typolm = None
        self._try_load_perceptus_lm()

    def _load_typolm(self):
        """No-op: disabled in favor of guaranteed real English dictionary words."""
        self.typolm = None

    def _try_load_perceptus_lm(self):
        """Attempts to load local PerceptusLM engine from the CoL Perceptus directory."""
        try:
            col_perceptus_dir = os.path.abspath(
                os.path.join(os.path.dirname(__file__), "..", "..", "Perceptus")
            )
            lm_dir = os.path.join(col_perceptus_dir, "lm")
            ckpt = os.path.join(lm_dir, "perceptus_lm.pt")
            tok = os.path.join(lm_dir, "perceptus_tokenizer.json")

            if os.path.exists(ckpt) and os.path.exists(tok):
                if col_perceptus_dir not in sys.path:
                    sys.path.insert(0, col_perceptus_dir)
                from lm.inference import PerceptusEngine
                self.engine = PerceptusEngine(model_path=ckpt, tokenizer_path=tok)
        except Exception:
            self.engine = None

    def generate_words(self, level: int = 1, count: Optional[int] = None, style: str = "title_case") -> List[str]:
        """Generates authentic English dictionary words scaled strictly to the level difficulty and limit."""
        target_limit = get_level_word_count(level)
        if count is None or int(count) <= 0:
            target_count = target_limit
        else:
            target_count = min(int(count), target_limit)

        pool = MassiveWordEngine.get_tier_pool(level)
        # Filter pool to strictly valid English dictionary words (alphabetic only, no hyphens, no digits)
        clean_pool = [w for w in pool if w and w.isalpha() and 2 <= len(w) <= 45]
        if not clean_pool:
            clean_pool = pool

        if len(clean_pool) >= target_count:
            chosen = random.sample(clean_pool, target_count)
        else:
            chosen = random.choices(clean_pool, k=target_count)

        clean_chosen = [sanitize_typing_text(w) for w in chosen if sanitize_typing_text(w)]
        return TypingStyleEngine.transform_words(clean_chosen, style)

    def generate_sentence(self, level: int = 1, style: str = "title_case") -> str:
        """Generates a complete sentence formatted in the user's typing style with 100% typeable ASCII."""
        base = MassiveWordEngine.generate_sentence(level)
        return TypingStyleEngine.transform_text(sanitize_typing_text(base), style)

    def generate_paragraph(self, level: int = 1, style: str = "title_case") -> str:
        """Generates a cohesive multi-sentence paragraph formatted in the user's typing style with 100% typeable ASCII."""
        sample_count = 3 if level < 50 else 4
        raw_paragraph = MassiveWordEngine.generate_paragraph(level, sentence_count=sample_count)
        return TypingStyleEngine.transform_text(sanitize_typing_text(raw_paragraph), style)


