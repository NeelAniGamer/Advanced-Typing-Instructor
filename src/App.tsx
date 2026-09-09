import React, { useEffect } from 'react';
import { useGameStore } from './stores/useGameStore';
import { GameHUD } from './components/Header/GameHUD';
import { LandingScreen } from './components/Landing/LandingScreen';
import { TypingEngine } from './components/TypingArena/TypingEngine';
import { LevelPath } from './components/LevelMap/LevelPath';
import { ResultsScreen } from './components/Results/ResultsScreen';
import { ShopModal } from './components/ShopForge/ShopModal';
import { KeyboardHeatmap } from './components/Heatmap/KeyboardHeatmap';
import { DailyChallengeModal } from './components/Modals/DailyChallengeModal';
import { TournamentsModal } from './components/Modals/TournamentsModal';
import { AchievementsModal } from './components/Modals/AchievementsModal';
import { AdminTerminalModal } from './components/Modals/AdminTerminalModal';
import { MultiplayerScreen } from './components/Multiplayer/MultiplayerScreen';
import { PlayerProfileModal } from './components/Profile/PlayerProfileModal';
import { AccountModal } from './components/Modals/AccountModal';
import { DailyRewardStreakModal } from './components/Modals/DailyRewardStreakModal';
import { CertificateModal } from './components/Modals/CertificateModal';
import { CustomPracticeModal } from './components/Modals/CustomPracticeModal';
import { UpdateModal } from './components/Modals/UpdateModal';
import { DashboardScreen } from './components/Dashboard/DashboardScreen';
import { ErrorBoundary } from './components/Common/ErrorBoundary';
import { AnimatePresence, motion } from 'framer-motion';

export const App: React.FC = () => {
  const { activeScreen, activeModal, fetchProfile } = useGameStore();

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  return (
    <div className="min-h-screen bg-background text-slate-100 flex flex-col selection:bg-cyan-500 selection:text-black">
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
              <ShopModal />
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

          {/* Default to Typing Arena for 'game' or any unmapped route */}
          {(activeScreen === 'game' || !['dashboard', 'map', 'results', 'shop', 'multiplayer', 'landing'].includes(activeScreen)) && (
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
        {activeModal === 'heatmap' && <KeyboardHeatmap />}
        {activeModal === 'daily' && <DailyChallengeModal />}
        {activeModal === 'tournament' && <TournamentsModal />}
        {activeModal === 'achievements' && <AchievementsModal />}
        {activeModal === 'admin' && <AdminTerminalModal />}
        {activeModal === 'profile' && <PlayerProfileModal />}
        {activeModal === 'account' && <AccountModal />}
        {activeModal === 'streak' && <DailyRewardStreakModal />}
        {activeModal === 'certificate' && <CertificateModal />}
        {activeModal === 'customPractice' && <CustomPracticeModal />}
        {activeModal === 'update' && <UpdateModal />}
      </AnimatePresence>
    </div>
  );
};
