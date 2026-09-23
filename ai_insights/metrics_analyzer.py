"""
metrics_analyzer.py — Biometric Typing Analytics & Rhythm Index
Copyright (C) 2026 Class Of Learners. All rights reserved.

Calculates Net WPM, Rhythm Consistency Index (RCI), Shift-Key Synchronization
latency (crucial for Title Case typists), burst peaks, and fatigue curves.
"""

import math
from typing import List, Dict, Any, Optional


class MetricsAnalyzer:
    """Analyzes raw keystroke events, timing intervals, and accuracy."""

    @staticmethod
    def calculate_net_wpm(gross_wpm: float, uncorrected_errors: int, time_minutes: float) -> float:
        """Net WPM = Gross WPM - (Uncorrected Errors / Time in Minutes)."""
        if time_minutes <= 0:
            return 0.0
        penalty = uncorrected_errors / time_minutes
        return max(0.0, round(gross_wpm - penalty, 1))

    @staticmethod
    def calculate_rci(intervals: List[float]) -> Dict[str, Any]:
        """
        Calculates the Rhythm Consistency Index (RCI).
        Intervals are in milliseconds between consecutive keystrokes.
        Returns a 0-100 score and qualitative classification.
        """
        if len(intervals) < 5:
            return {"score": 75.0, "rating": "Calibrating", "std_dev_ms": 0.0}

        # Filter out extreme pauses (> 2000ms like looking away)
        valid = [dt for dt in intervals if 10.0 <= dt <= 1500.0]
        if len(valid) < 5:
            return {"score": 70.0, "rating": "Variable", "std_dev_ms": 0.0}

        mean = sum(valid) / len(valid)
        variance = sum((x - mean) ** 2 for x in valid) / len(valid)
        std_dev = math.sqrt(variance)

        # Coefficient of variation = std_dev / mean
        cv = std_dev / max(mean, 1.0)

        # Lower CV means higher rhythm consistency
        # cv of 0.2 -> score ~95, cv of 0.5 -> score ~75, cv of 1.0 -> score ~50
        score = max(20.0, min(99.0, 100.0 - (cv * 55.0)))

        if score >= 88:
            rating = "Metronomic (Flow State)"
        elif score >= 75:
            rating = "Fluid & Consistent"
        elif score >= 60:
            rating = "Burst & Stutter"
        else:
            rating = "Irregular Cadence"

        return {
            "score": round(score, 1),
            "rating": rating,
            "mean_interval_ms": round(mean, 1),
            "std_dev_ms": round(std_dev, 1)
        }

    @staticmethod
    def analyze_shift_sync(shift_latencies: List[float]) -> Dict[str, Any]:
        """
        Analyzes the millisecond gap between Shift actuation and capital letter strike.
        Critical for Title Case typists who capitalize every word's first letter.
        """
        if not shift_latencies:
            return {
                "avg_latency_ms": 110.0,
                "status": "Balanced",
                "stutter_risk": False,
                "dropped_capital_risk": False
            }

        avg = sum(shift_latencies) / len(shift_latencies)
        too_fast = sum(1 for x in shift_latencies if x < 35.0)
        too_slow = sum(1 for x in shift_latencies if x > 280.0)

        dropped_capital_risk = (too_fast / len(shift_latencies)) > 0.15
        stutter_risk = (too_slow / len(shift_latencies)) > 0.20

        if avg < 60:
            status = "Hyper-Fast (Risk of Dropped Capitals)"
        elif avg <= 160:
            status = "Optimal Synchronization"
        elif avg <= 250:
            status = "Mild Shift Hesitation"
        else:
            status = "Prolonged Shift Delay"

        return {
            "avg_latency_ms": round(avg, 1),
            "status": status,
            "stutter_risk": stutter_risk,
            "dropped_capital_risk": dropped_capital_risk,
            "sample_count": len(shift_latencies)
        }

    @staticmethod
    def calculate_fatigue_slope(minute_wpm: List[float]) -> Dict[str, Any]:
        """Measures endurance decay across a session."""
        if len(minute_wpm) < 2:
            return {"slope": 0.0, "decay_percent": 0.0, "status": "Stable"}

        start_wpm = minute_wpm[0]
        end_wpm = minute_wpm[-1]
        diff = end_wpm - start_wpm
        decay_pct = (diff / max(start_wpm, 1.0)) * 100.0

        if decay_pct < -15.0:
            status = "Fatigue Detected (Take Short Break)"
        elif decay_pct > 10.0:
            status = "Warming Up & Accelerating"
        else:
            status = "Rock-Solid Stamina"

        return {
            "slope": round(diff / len(minute_wpm), 2),
            "decay_percent": round(decay_pct, 1),
            "status": status
        }
