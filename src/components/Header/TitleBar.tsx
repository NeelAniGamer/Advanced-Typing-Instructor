import React, { useState, useEffect } from 'react';
import { useGameStore } from '../../stores/useGameStore';
import { UserAvatar } from '../Common/UserAvatar';
import {
  PanelLeft,
  Bell,
  Minus,
  Square,
  X,
  Zap,
  Flame,
  Gem,
  Keyboard,
  ChevronRight,
} from 'lucide-react';

export const TitleBar: React.FC = () => {
  const {
    user,
    uiTheme,
    emeralds,
    dailyStreak,
    updateAvailable,
    backgroundStats,
    setModal,
    isMaximized,
    minimizeWindow,
    toggleMaximizeWindow,
    closeWindow,
  } = useGameStore();

  const [showNotifications, setShowNotifications] = useState(false);

  const isOrganicLight = uiTheme === 'organic';
  const isOrganicDark = uiTheme === 'organic-dark';
  const isOrganic = isOrganicLight || isOrganicDark;

  // Count notification badges
  const notifCount = [
    updateAvailable,
    dailyStreak > 0,
    (backgroundStats?.total_keystrokes_today ?? 0) > 500,
  ].filter(Boolean).length;

  // Theme-aware colour tokens
  const bg = isOrganicLight
    ? 'bg-[#F4F2EC] border-[#E5DFD7]'
    : isOrganicDark
    ? 'bg-[#141716] border-[#2A2E2C]'
    : 'bg-[#06080D] border-white/10';

  const iconBtn = isOrganicLight
    ? 'text-[#666666] hover:text-[#333333] hover:bg-black/5 rounded-lg transition-all'
    : isOrganicDark
    ? 'text-[#8A9490] hover:text-[#FAF8F5] hover:bg-white/10 rounded-lg transition-all'
    : 'text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-all';

  const notifPanel = isOrganicLight
    ? 'bg-[#FDFCFA] border-[#E2DDD5] shadow-[0_12px_35px_rgba(45,51,48,0.14)]'
    : isOrganicDark
    ? 'bg-[#1A1E1C] border-[#2E3531] shadow-[0_14px_40px_rgba(0,0,0,0.7)]'
    : 'bg-slate-950 border-white/15 shadow-[0_14px_40px_rgba(0,0,0,0.9)]';

  // Handle double-click on drag region → toggle maximize
  const handleDragAreaDoubleClick = () => {
    toggleMaximizeWindow();
  };

  // Close notification panel on outside click
  useEffect(() => {
    if (!showNotifications) return;
    const handler = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('[data-notif-panel]')) setShowNotifications(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showNotifications]);

  // Intercept F11 (WebView2 native fullscreen crashes frameless windows).
  // Route it through our safe ctypes maximize path instead.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'F11') {
        e.preventDefault();
        toggleMaximizeWindow();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [toggleMaximizeWindow]);

  // Sync maximize icon with real OS state (Aero Snap / Win+Up bypass toggle).
  useEffect(() => {
    let alive = true;
    const sync = async () => {
      try {
        const res = await fetch('/api/window_state');
        if (res.ok && alive) {
          const data = await res.json();
          useGameStore.setState({ isMaximized: !!data.maximized });
        }
      } catch {}
    };
    sync();
    window.addEventListener('focus', sync);
    return () => {
      alive = false;
      window.removeEventListener('focus', sync);
    };
  }, []);

  return (
    <div
      className={`w-full h-10 flex items-stretch border-b flex-shrink-0 sticky top-0 z-50 ${bg}`}
      style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
    >
      {/* ── Left: Sidebar toggle + Profile ─────────────────────── */}
      <div className="flex items-center gap-1.5 px-3 flex-shrink-0">
        {/* Sidebar / PanelLeft icon matching the reference */}
        <button
          className={`w-7 h-7 flex items-center justify-center ${iconBtn}`}
          title="Sidebar Navigation"
          onClick={() => {
            // Can toggle sidebar or focus mode
          }}
        >
          <PanelLeft className="w-4 h-4" />
        </button>

        {/* Profile / Account avatar icon */}
        <button
          className={`w-7 h-7 flex items-center justify-center ${iconBtn} overflow-hidden`}
          title={`Signed in as ${user.name} — click to manage account`}
          onClick={() => setModal('account')}
        >
          <UserAvatar avatar={user.avatar} name={user.name} className="w-5 h-5 rounded-full" />
        </button>
      </div>

      {/* ── Center: Draggable titlebar region ───────────────────── */}
      <div
        className="flex-1 pywebview-drag-region cursor-default select-none"
        onMouseDown={(e) => {
          // Backend decides: restores soft-maximize then drags (native feel),
          // skips OS-maximized drags that hang frameless hosts.
          if (e.button === 0) {
            fetch('/api/window_drag').catch(() => {});
          }
        }}
        onDoubleClick={handleDragAreaDoubleClick}
        style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}
      />

      {/* ── Right: Notifications + Window caption buttons ────────── */}
      <div className="flex items-center gap-0 flex-shrink-0">
        {/* Notification Bell */}
        <div className="relative" data-notif-panel>
          <button
            className={`w-9 h-10 flex items-center justify-center ${iconBtn} relative`}
            title="Notifications"
            onClick={() => setShowNotifications((v) => !v)}
          >
            <Bell className="w-4 h-4" />
            {notifCount > 0 && (
              <span className="absolute top-2.5 right-2 w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
            )}
          </button>

          {/* Notifications Popover */}
          {showNotifications && (
            <div
              className={`absolute right-0 top-full mt-1 w-72 rounded-xl border p-2 z-[100] ${notifPanel}`}
              data-notif-panel
            >
              <div
                className={`text-[10px] font-bold uppercase tracking-widest px-2 py-1.5 ${
                  isOrganic ? 'text-[#7C8D81]' : 'text-slate-500'
                }`}
              >
                Notifications
              </div>

              {/* Update */}
              {updateAvailable && (
                <button
                  onClick={() => {
                    setModal('update');
                    setShowNotifications(false);
                  }}
                  className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-left text-xs transition-colors ${
                    isOrganic ? 'hover:bg-black/5 text-[#1A1F1D]' : 'hover:bg-white/5 text-slate-200'
                  }`}
                >
                  <Zap className="w-4 h-4 text-cyan-400 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold">Update Available</div>
                    <div className={`text-[10px] ${isOrganic ? 'text-[#666666]' : 'text-slate-400'}`}>
                      New version ready to install
                    </div>
                  </div>
                  <ChevronRight className="w-3 h-3 opacity-40" />
                </button>
              )}

              {/* Streak */}
              {dailyStreak > 0 && (
                <button
                  onClick={() => {
                    setModal('streak');
                    setShowNotifications(false);
                  }}
                  className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-left text-xs transition-colors ${
                    isOrganic ? 'hover:bg-black/5 text-[#1A1F1D]' : 'hover:bg-white/5 text-slate-200'
                  }`}
                >
                  <Flame
                    className={`w-4 h-4 flex-shrink-0 ${
                      dailyStreak >= 7 ? 'text-amber-400' : 'text-orange-500'
                    }`}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold">{dailyStreak}-Day Streak 🔥</div>
                    <div className={`text-[10px] ${isOrganic ? 'text-[#666666]' : 'text-slate-400'}`}>
                      Claim daily reward
                    </div>
                  </div>
                  <ChevronRight className="w-3 h-3 opacity-40" />
                </button>
              )}

              {/* Emeralds quick view */}
              <div
                className={`flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs ${
                  isOrganic ? 'text-[#555555]' : 'text-slate-400'
                }`}
              >
                <Gem
                  className={`w-4 h-4 flex-shrink-0 ${isOrganic ? 'text-[#C97D5A]' : 'text-emerald-400'}`}
                />
                <span>{emeralds.toLocaleString()} Emeralds in vault</span>
              </div>

              {/* Background stats */}
              {(backgroundStats?.total_keystrokes_today ?? 0) > 0 && (
                <div
                  className={`flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs ${
                    isOrganic ? 'text-[#555555]' : 'text-slate-400'
                  }`}
                >
                  <Keyboard
                    className={`w-4 h-4 flex-shrink-0 ${isOrganic ? 'text-[#7C8D81]' : 'text-emerald-400'}`}
                  />
                  <span>
                    {(backgroundStats?.total_keystrokes_today ?? 0).toLocaleString()} bg keystrokes today
                  </span>
                </div>
              )}

              {notifCount === 0 && (
                <div
                  className={`px-2.5 py-4 text-center text-xs ${
                    isOrganic ? 'text-[#888888]' : 'text-slate-500'
                  }`}
                >
                  All caught up ✓
                </div>
              )}
            </div>
          )}
        </div>

        {/* Divider */}
        <div className={`w-px h-4 mx-1 ${isOrganic ? 'bg-[#E5DFD7]' : 'bg-white/10'}`} />

        {/* ── Caption Buttons (Minimize / Maximize / Close) ─── */}
        {/* Minimize */}
        <button
          className={`w-10 h-10 flex items-center justify-center transition-colors ${
            isOrganicLight
              ? 'hover:bg-black/5 text-[#666666]'
              : isOrganicDark
              ? 'hover:bg-white/10 text-[#8A9490]'
              : 'hover:bg-white/10 text-slate-400'
          }`}
          title="Minimize"
          onClick={minimizeWindow}
        >
          <Minus className="w-3.5 h-3.5" />
        </button>

        {/* Maximize / Restore */}
        <button
          className={`w-10 h-10 flex items-center justify-center transition-colors ${
            isOrganicLight
              ? 'hover:bg-black/5 text-[#666666]'
              : isOrganicDark
              ? 'hover:bg-white/10 text-[#8A9490]'
              : 'hover:bg-white/10 text-slate-400'
          }`}
          title={isMaximized ? 'Restore' : 'Maximize'}
          onClick={toggleMaximizeWindow}
        >
          {isMaximized ? (
            <svg className="w-3.5 h-3.5" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5">
              <rect x="3" y="1" width="8" height="8" rx="0.5" />
              <path d="M1 4v8a1 1 0 001 1h8" />
            </svg>
          ) : (
            <Square className="w-3 h-3" />
          )}
        </button>

        {/* Close */}
        <button
          className={`w-11 h-10 flex items-center justify-center transition-colors group ${
            isOrganicLight
              ? 'hover:bg-[#E81123] text-[#666666] hover:text-white'
              : isOrganicDark
              ? 'hover:bg-[#E81123] text-[#8A9490] hover:text-white'
              : 'hover:bg-[#E81123] text-slate-400 hover:text-white'
          }`}
          title="Close to System Tray (runs in background)"
          onClick={closeWindow}
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
