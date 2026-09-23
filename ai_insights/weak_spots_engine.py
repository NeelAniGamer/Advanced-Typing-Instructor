"""
weak_spots_engine.py — AI Weak-Spot Intelligence Engine for ATI
Copyright (C) 2026 Class Of Learners. All rights reserved.

Synthesizes telemetry from:
1. Low-level Windows background typing monitor (cadence, shift balance, backspace corrections).
2. Real-time in-game key heatmap (accuracy, mis-hits, latency per key).
Identifies the user's top biomechanical weak spots and passes them to the curriculum generator.
"""

import sqlite3
import json
import os
from typing import List, Dict, Any, Optional


DEFAULT_BIOMECHANICAL_WEAK_KEYS = ['p', 'b', 'q', 'z', 'x']


class WeakSpotsEngine:
    """Analyzes keystroke telemetry to isolate error-prone and hesitant keys."""

    @staticmethod
    def _get_db_path() -> str:
        appdata = os.environ.get('APPDATA')
        if not appdata:
            appdata = os.path.expanduser('~')
        folder = os.path.join(appdata, 'AdvancedTypingInstructor')
        return os.path.join(folder, 'typing_quest.db')

    @classmethod
    def get_user_weak_keys(cls, user_id: Optional[str] = None, max_keys: int = 4) -> List[str]:
        """Extracts top weak keys from the user's heatmap and background telemetry."""
        db_path = cls._get_db_path()
        if not os.path.exists(db_path):
            return DEFAULT_BIOMECHANICAL_WEAK_KEYS[:max_keys]

        weak_candidates: Dict[str, float] = {}

        try:
            conn = sqlite3.connect(db_path, timeout=5.0)
            c = conn.cursor()

            # 1. Retrieve progress JSON containing key heatmap
            progress_json = None
            if user_id:
                row = c.execute("SELECT progress_json FROM user_progress WHERE user_id=? ORDER BY last_updated DESC LIMIT 1", (user_id,)).fetchone()
                if row and row[0]:
                    progress_json = row[0]

            if not progress_json:
                row = c.execute("SELECT progress_json FROM progress WHERE id=1").fetchone()
                if row and row[0]:
                    progress_json = row[0]

            if progress_json:
                try:
                    data = json.loads(progress_json)
                    heatmap = data.get('heatmap', {})
                    for key, stats in heatmap.items():
                        # Only consider alphanumeric keys and common punctuation
                        if len(key) == 1 and key.isalnum():
                            hits = stats.get('hits', 0)
                            errors = stats.get('errors', 0)
                            total = hits + errors
                            if total >= 3:
                                error_rate = errors / total
                                avg_latency = stats.get('totalLatencyMs', 0) / max(hits, 1)
                                # Composite weakness score: error rate heavily weighted + latency hesitation
                                score = (error_rate * 10.0) + (min(avg_latency, 800) / 400.0)
                                if errors > 0 or avg_latency > 350:
                                    weak_candidates[key.lower()] = score
                except Exception as parse_err:
                    print(f"[WeakSpots] Heatmap parse warning: {parse_err}")

            # 2. Check background telemetry for shift or reach issues
            try:
                bg_row = c.execute("SELECT shift_keystrokes, total_keystrokes FROM background_telemetry ORDER BY date DESC LIMIT 1").fetchone()
                if bg_row and bg_row[1] and bg_row[1] > 50:
                    shift_ratio = float(bg_row[0] or 0) / max(float(bg_row[1]), 1.0)
                    # If shift ratio is exceptionally low, user avoids capital letters/pinky extension
                    if shift_ratio < 0.05:
                        weak_candidates['p'] = weak_candidates.get('p', 1.0) + 1.5
                        weak_candidates['q'] = weak_candidates.get('q', 1.0) + 1.5
            except Exception:
                pass

            conn.close()
        except Exception as e:
            print(f"[WeakSpotsEngine Error] {e}")

        if not weak_candidates:
            return DEFAULT_BIOMECHANICAL_WEAK_KEYS[:max_keys]

        # Sort by weakness score descending
        sorted_keys = sorted(weak_candidates.items(), key=lambda x: x[1], reverse=True)
        result = [k for k, _ in sorted_keys if len(k) == 1 and k.isalpha()]

        # Ensure we return at least 2 and at most max_keys
        if len(result) < 2:
            for fallback in DEFAULT_BIOMECHANICAL_WEAK_KEYS:
                if fallback not in result:
                    result.append(fallback)
                if len(result) >= max_keys:
                    break

        return result[:max_keys]

    @classmethod
    def get_weak_spots_report(cls, user_id: Optional[str] = None) -> Dict[str, Any]:
        """Returns structured weak spots and coaching recommendations."""
        weak_keys = cls.get_user_weak_keys(user_id=user_id, max_keys=5)
        formatted_keys = [k.upper() for k in weak_keys]

        recommendations = []
        for k in weak_keys:
            if k in ('p', 'q', 'a', 'z'):
                recommendations.append(f"Key '{k.upper()}': Strengthen outer pinky anchor and reach coordination.")
            elif k in ('b', 'v', 'c', 'x'):
                recommendations.append(f"Key '{k.upper()}': Practice lower-row thumb-index pivot to eliminate micro-hesitations.")
            elif k in ('t', 'y', 'u', 'i'):
                recommendations.append(f"Key '{k.upper()}': Focus on index and middle finger stretch across the top row.")
            else:
                recommendations.append(f"Key '{k.upper()}': Targeted in upcoming level drills.")

        return {
            'weak_keys': weak_keys,
            'display_keys': formatted_keys,
            'drill_headline': f"AI Focused Drills: [{', '.join(formatted_keys)}]",
            'recommendations': recommendations[:3],
            'status': 'success'
        }
