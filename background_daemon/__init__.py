"""
ATI 1.4 — Privacy-First Windows Background Typing Service
Copyright (C) 2026 Class Of Learners. All rights reserved.
"""

from .typing_tracker import BackgroundTypingTracker
from .startup_manager import WindowsStartupManager

__all__ = ["BackgroundTypingTracker", "WindowsStartupManager"]
