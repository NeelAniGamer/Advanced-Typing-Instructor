"""
ATI 1.4 — AI Typing Intelligence & Style Engine
Copyright (C) 2026 Class Of Learners. All rights reserved.
"""

from .style_engine import TypingStyleEngine, CasingStyle
from .word_synthesizer import AIWordSynthesizer
from .metrics_analyzer import MetricsAnalyzer
from .auto_promoter import AutoPromoter
from .coaching_insights import CoachingEngine

__all__ = [
    "TypingStyleEngine",
    "CasingStyle",
    "AIWordSynthesizer",
    "MetricsAnalyzer",
    "AutoPromoter",
    "CoachingEngine"
]
