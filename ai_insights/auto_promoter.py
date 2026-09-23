"""
auto_promoter.py — Intelligent Word-Level Auto-Promotion Engine
Copyright (C) 2026 Class Of Learners. All rights reserved.

Maps a user's real typing velocity, accuracy, and rhythm index to their
optimal level in the 200-level curriculum, bypassing tedious manual grinding.
"""

from typing import Dict, Any, Optional
from curriculum import LEVEL_THEMES


class AutoPromoter:
    """Evaluates typing performance benchmarks to recommend or execute level promotions."""

    @staticmethod
    def evaluate_promotion(
        current_level: int,
        net_wpm: float,
        accuracy: float,
        rci_score: float = 75.0,
        consecutive_clean_sessions: int = 1
    ) -> Dict[str, Any]:
        """
        Determines whether the user should be promoted to a higher word tier.
        """
        # Minimum baseline requirement: at least 93% accuracy
        if accuracy < 93.0 or net_wpm < 30.0:
            return {
                "should_promote": False,
                "current_level": current_level,
                "target_level": current_level,
                "reason": "Accuracy below promotion baseline (93%). Focus on precision before speed."
            }

        target_level = current_level

        # Grandmaster leap
        if net_wpm >= 100.0 and accuracy >= 97.0 and rci_score >= 80.0:
            target_level = max(current_level, 125)
            tier_name = "Grandmaster Capacitance (13+ Letter Words)"

        # Advanced leap
        elif net_wpm >= 80.0 and accuracy >= 96.0 and rci_score >= 75.0:
            target_level = max(current_level, 85)
            tier_name = "Mechanical Citadel (10+ Letter Words)"

        # Upper Intermediate leap
        elif net_wpm >= 65.0 and accuracy >= 95.0:
            target_level = max(current_level, 50)
            tier_name = "Tactile Catacombs (7-8 Letter Compounds)"

        # Starter leap
        elif net_wpm >= 45.0 and accuracy >= 94.0 and current_level <= 20:
            target_level = max(current_level, 26)
            tier_name = "Five-Letter Fluency"

        # Incremental promotion
        elif net_wpm >= 35.0 and accuracy >= 96.0 and current_level < 200:
            target_level = min(200, current_level + 3)
            tier_name = "Incremental Progression"

        # If the major leap tier is already at or below current level, grant an incremental advancement
        if target_level <= current_level and current_level < 200:
            if accuracy >= 95.0 and net_wpm >= 35.0:
                jump = 5 if net_wpm >= 80.0 else 3
                target_level = min(200, current_level + jump)
                tier_name = "Velocity Surge Progression"

        if target_level > current_level:
            theme_idx = min(target_level - 1, len(LEVEL_THEMES) - 1)
            target_theme = LEVEL_THEMES[theme_idx] if theme_idx >= 0 else "Advanced Mastery"
            levels_jumped = target_level - current_level

            return {
                "should_promote": True,
                "eligible": True,
                "current_level": current_level,
                "target_level": target_level,
                "levels_skipped": levels_jumped,
                "tier_name": tier_name,
                "speed_tier": tier_name,
                "target_theme": target_theme,
                "benchmark_wpm": round(net_wpm, 1),
                "benchmark_acc": round(accuracy, 1),
                "metrics": {
                    "rolling_wpm": round(net_wpm, 1),
                    "rolling_acc": round(accuracy, 1),
                    "rci": round(rci_score, 1),
                    "levels_jumped": levels_jumped
                },
                "reason": f"Your speed of {net_wpm:.1f} WPM and {accuracy:.1f}% accuracy significantly exceeds Level {current_level} difficulty."
            }

        return {
            "should_promote": False,
            "eligible": False,
            "current_level": current_level,
            "target_level": current_level,
            "speed_tier": "Consistent Flow",
            "metrics": {
                "rolling_wpm": round(net_wpm, 1),
                "rolling_acc": round(accuracy, 1),
                "rci": round(rci_score, 1),
                "levels_jumped": 0
            },
            "reason": "Currently in optimal challenge zone for your skill tier."
        }
