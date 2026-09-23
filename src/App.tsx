import React, { useEffect, Suspense } from 'react';
import { useGameStore } from './stores/useGameStore';
import { TitleBar } from './components/Header/TitleBar';
import { GameHUD } from './components/Header/GameHUD';
import { LandingScreen } from './components/Landing/LandingScreen';
import { TypingEngine } from './components/TypingArena/TypingEngine';
import { LevelPath } from './components/LevelMap/LevelPath';
import { ResultsScreen } from './components/Results/ResultsScreen';
import { DailyChallengeModal } from './components/Modals/DailyChallengeModal';
import { AchievementsModal } from './components/Modals/AchievementsModal';
import { MultiplayerScreen } from './components/Multiplayer/MultiplayerScreen';
import { PlayerProfileModal } from './components/Profile/PlayerProfileModal';
import { AccountModal } from './components/Modals/AccountModal';
import { DailyRewardStreakModal } from './components/Modals/DailyRewardStreakModal';
import { UpdateModal } from './components/Modals/UpdateModal';
import { TypingStyleModal } from './components/Profile/TypingStyleModal';
import { PromotionModal } from './components/Results/PromotionModal';
import { DashboardScreen } from './components/Dashboard/DashboardScreen';
import { AIWordsPromptModal } from './components/Modals/AIWordsPromptModal';
import { ErrorBoundary } from './components/Common/ErrorBoundary';
import { AnimatePresence, motion } from 'framer-motion';
import { isSeriousTheme } from './utils/theme';

// Code-split heavy, rarely-opened surfaces so the initial bundle shrinks.
// TitleBar + GameHUD stay eager (frameless window chrome must paint first).
const ShopModal = React.lazy(() => import('./components/ShopForge/ShopModal').then(m => ({ default: m.ShopModal })));
const StarterTutorialScreen = React.lazy(() => import('./components/Tutorial/StarterTutorialScreen').then(m => ({ default: m.StarterTutorialScreen })));
const KeyboardHeatmap = React.lazy(() => import('./components/Heatmap/KeyboardHeatmap').then(m => ({ default: m.KeyboardHeatmap })));
const TournamentsModal = React.lazy(() => import('./components/Modals/TournamentsModal').then(m => ({ default: m.TournamentsModal })));
const AdminTerminalModal = React.lazy(() => import('./components/Modals/AdminTerminalModal').then(m => ({ default: m.AdminTerminalModal })));
const CertificateModal = React.lazy(() => import('./components/Modals/CertificateModal').then(m => ({ default: m.CertificateModal })));
const CustomPracticeModal = React.lazy(() => import('./components/Modals/CustomPracticeModal').then(m => ({ default: m.CustomPracticeModal })));

const LazyFallback: React.FC = () => (
  <div className="flex items-center justify-center py-16 text-sm font-mono text-slate-400" aria-label="Loading">
    <span className="animate-pulse">Loading…</span>
  </div>
);

export const App: React.FC = () => {
  const { activeScreen, activeModal, fetchProfile, fetchBackgroundStats, category, mode, uiTheme } = useGameStore();
  const isSerious = isSeriousTheme(category, mode);

  useEffect(() => {
    fetchProfile();
    fetchBackgroundStats();

    // Poll background stats every 10s so the user sees real-time keystroke accumulation
    const interval = setInterval(() => {
      fetchBackgroundStats();
    }, 10000);

    // Also immediately refresh whenever user focuses or tabs back to ATI
    const onFocus = () => {
      fetchBackgroundStats();
    };
    window.addEventListener('focus', onFocus);

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', onFocus);
    };
  }, [fetchProfile, fetchBackgroundStats]);

  useEffect(() => {
    document.body.classList.remove('theme-serious', 'theme-organic', 'theme-organic-dark');
    if (uiTheme === 'organic') {
      document.body.classList.add('theme-organic');
    } else if (uiTheme === 'organic-dark') {
      document.body.classList.add('theme-organic-dark');
    } else if (isSerious) {
      document.body.classList.add('theme-serious');
    }
  }, [uiTheme, isSerious]);

  return (
    <div className={`h-screen w-screen overflow-hidden flex flex-col transition-colors duration-400 ${
      uiTheme === 'organic'
        ? 'theme-organic bg-[#F4F2EC] text-[#2A322D] selection:bg-[#C97D5A] selection:text-white'
        : uiTheme === 'organic-dark'
        ? 'theme-organic-dark bg-[#141716] text-[#FAF8F5] selection:bg-[#D98A66] selection:text-[#141716]'
        : isSerious 
        ? 'theme-serious bg-[#06080d] text-slate-100 selection:bg-emerald-500 selection:text-black' 
        : 'bg-background text-slate-100 selection:bg-cyan-500 selection:text-black'
    }`}>
      {/* Sleek Frameless Desktop Titlebar (Matching Reference) */}
      <TitleBar />

      {/* Global Top HUD */}
      <GameHUD />

      {/* Main Content View with Smooth Screen Transitions */}
      <main className="flex-1 relative overflow-y-auto min-h-0">
        <ErrorBoundary>
          <AnimatePresence>
            {activeScreen === 'dashboard' && (
              <motion.div
                key="dashboard"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.15 }}
              >
                <DashboardScreen />
              </motion.div>
            )}

            {activeScreen === 'map' && (
              <motion.div
                key="map"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.15 }}
              >
                <LevelPath />
              </motion.div>
            )}

            {activeScreen === 'results' && (
              <motion.div
                key="results"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.15 }}
              >
                <ResultsScreen />
              </motion.div>
            )}

          {activeScreen === 'shop' && (
            <motion.div
              key="shop"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.15 }}
            >
              <Suspense fallback={<LazyFallback />}>
                <ShopModal />
              </Suspense>
            </motion.div>
          )}

          {activeScreen === 'multiplayer' && (
            <motion.div
              key="multiplayer"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.15 }}
            >
              <MultiplayerScreen />
            </motion.div>
          )}

          {activeScreen === 'landing' && (
            <motion.div
              key="landing"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.15 }}
            >
              <LandingScreen />
            </motion.div>
          )}

          {activeScreen === 'tutorial' && (
            <motion.div
              key="tutorial"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.15 }}
            >
              <Suspense fallback={<LazyFallback />}>
                <StarterTutorialScreen />
              </Suspense>
            </motion.div>
          )}

          {/* Default to Typing Arena for 'game' or any unmapped route */}
          {(activeScreen === 'game' || !['dashboard', 'map', 'results', 'shop', 'multiplayer', 'landing', 'tutorial'].includes(activeScreen)) && (
            <motion.div
              key="game"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.15 }}
            >
              <TypingEngine />
            </motion.div>
          )}
        </AnimatePresence>
        </ErrorBoundary>
      </main>

      {/* Modals Suite */}
      <AnimatePresence>
        {activeModal === 'heatmap' && <Suspense fallback={<LazyFallback />}><KeyboardHeatmap /></Suspense>}
        {activeModal === 'daily' && <DailyChallengeModal />}
        {activeModal === 'tournament' && <Suspense fallback={<LazyFallback />}><TournamentsModal /></Suspense>}
        {activeModal === 'achievements' && <AchievementsModal />}
        {activeModal === 'admin' && <Suspense fallback={<LazyFallback />}><AdminTerminalModal /></Suspense>}
        {activeModal === 'profile' && <PlayerProfileModal />}
        {activeModal === 'account' && <AccountModal />}
        {activeModal === 'streak' && <DailyRewardStreakModal />}
        {activeModal === 'certificate' && <Suspense fallback={<LazyFallback />}><CertificateModal /></Suspense>}
        {activeModal === 'customPractice' && <Suspense fallback={<LazyFallback />}><CustomPracticeModal /></Suspense>}
        {activeModal === 'update' && <UpdateModal />}
        {activeModal === 'typingStyle' && <TypingStyleModal />}
        {activeModal === 'promotion' && <PromotionModal />}
      </AnimatePresence>

      {/* AI Words Launch Prompt */}
      <AIWordsPromptModal />
    </div>
  );
};
