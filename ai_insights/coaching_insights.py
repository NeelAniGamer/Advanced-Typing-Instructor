"""
coaching_insights.py — Personalized AI Typing Insights & Biomechanical Advice
Copyright (C) 2026 Class Of Learners. All rights reserved.

Produces conversational, actionable guidance tailored to the user's specific
typing style (such as Title Case), Shift key latency, rhythm, and accuracy.
"""

from typing import Dict, Any, List
from .style_engine import CasingStyle, TypingStyleEngine


class CoachingEngine:
    """Generates personalized conversational coaching based on real typing mechanics."""

    @staticmethod
    def generate_session_insights(
        net_wpm: float,
        accuracy: float,
        rci: Dict[str, Any],
        shift_sync: Dict[str, Any],
        style: str = "title_case"
    ) -> Dict[str, Any]:
        """Synthesizes comprehensive, human-like coaching advice."""
        insights: List[str] = []
        strengths: List[str] = []
        improvements: List[str] = []

        # 1. Evaluate Overall Speed & Accuracy Balance
        if accuracy >= 97.0:
            strengths.append(f"Outstanding surgical precision ({accuracy:.1f}% accuracy) with negligible error correction overhead.")
        elif accuracy < 93.0:
            improvements.append(f"Accuracy is currently {accuracy:.1f}%. Dialing speed back by ~5 WPM will reduce backspace pauses and boost Net WPM overall.")

        # 2. Evaluate Rhythm & Flow (RCI)
        rci_score = rci.get("score", 75.0)
        if rci_score >= 85.0:
            strengths.append("High rhythmic consistency: your finger actuation cadence indicates steady subconscious flow state.")
        elif rci_score < 65.0:
            improvements.append("Burst-and-stutter cadence detected: try keeping a steady metronome rhythm rather than sprinting through easy words and freezing on transitions.")

        # 3. Dedicated Style-Specific Insights (Title Case, Code, etc.)
        if style == CasingStyle.TITLE_CASE.value:
            avg_shift_lat = shift_sync.get("avg_latency_ms", 110.0)
            if shift_sync.get("dropped_capital_risk"):
                improvements.append(
                    f"In Title Case mode, your Shift-to-character actuation gap is very tight ({avg_shift_lat:.0f}ms). "
                    "Ensure your pinky firmly depresses the Shift key before your index or middle finger strikes the letter."
                )
            elif shift_sync.get("stutter_risk"):
                improvements.append(
                    f"Shift hesitation detected ({avg_shift_lat:.0f}ms average delay). "
                    "Practice alternating between Left Shift (for right-hand letters) and Right Shift (for left-hand letters) to prevent finger clashing."
                )
            else:
                strengths.append(f"Excellent Shift synchronization ({avg_shift_lat:.0f}ms latency) with fluid capitalization on every word.")

        elif style == CasingStyle.CODE_SNAKE_CASE.value:
            improvements.append("In snake_case mode, stretch your right pinky smoothly to the underscore without lifting your entire palm off the wrist rest.")

        elif style == CasingStyle.CODE_CAMEL_CASE.value:
            strengths.append("Quick mid-word Shift coordination for camelCase variable names.")

        # 4. Generate Conversational Summary
        if net_wpm >= 70.0 and accuracy >= 95.0:
            headline = "🔥 Velocity Flow Mastered"
            coaching_summary = (
                f"You are typing with impressive velocity ({net_wpm:.1f} Net WPM). "
                + " ".join(strengths) + " " + " ".join(improvements)
            )
        elif net_wpm >= 45.0:
            headline = "⚡ Solid Cadence & Growing Dexterity"
            coaching_summary = (
                f"Solid session at {net_wpm:.1f} Net WPM. "
                + " ".join(strengths) + " " + " ".join(improvements)
            )
        else:
            headline = "🎯 Precision & Muscle Memory Building"
            coaching_summary = (
                f"Focus on muscle memory lock-in ({accuracy:.1f}% accuracy). "
                + " ".join(improvements)
            )

        avg_shift = shift_sync.get("avg_latency_ms", 110.0)
        tips_list = improvements if improvements else strengths

        return {
            "headline": headline,
            "summary": coaching_summary,
            "tips": tips_list,
            "strengths": strengths,
            "improvements": improvements,
            "shift_latency_ms": round(avg_shift, 1),
            "rhythm_score": round(rci_score, 1),
            "style_alignment": f"Tuned for {style.replace('_', ' ').title()}",
            "metrics": {
                "net_wpm": net_wpm,
                "accuracy": accuracy,
                "rci_score": rci_score,
                "shift_latency_ms": avg_shift
            }
        }
