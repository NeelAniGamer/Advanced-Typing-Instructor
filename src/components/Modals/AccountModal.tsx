import React, { useState } from 'react';
import { useGameStore } from '../../stores/useGameStore';
import { calculateRankStats } from '../../utils/ranks';
import { 
  X, 
  User, 
  ShieldCheck, 
  LogOut, 
  Save, 
  Zap, 
  Trophy, 
  Target, 
  Clock, 
  Award,
  Sparkles,
  Check
} from 'lucide-react';
import { motion } from 'framer-motion';

const AVATAR_OPTIONS = [
  '👑', '⚡', '🚀', '🤖', '🎮', '🦄', '🐱', '🐉', 
  '💎', '🛡️', '⚔️', '🔥', '🏆', '🌌', '🧠', '🕶️'
];

export const AccountModal: React.FC = () => {
  const { 
    user, 
    level, 
    wpm, 
    mode, 
    difficulty, 
    updateProfile, 
    signInWithGoogle, 
    signOutGoogle, 
    setModal 
  } = useGameStore();

  const [nameInput, setNameInput] = useState(user.name);
  const [selectedAvatar, setSelectedAvatar] = useState(user.avatar);
  const [savedNotice, setSavedNotice] = useState(false);
  const [isSigningIn, setIsSigningIn] = useState(false);

  const rankStats = calculateRankStats(level, user.best_wpm || wpm, mode, difficulty);

  const handleSaveIdentity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nameInput.trim()) return;
    await updateProfile(nameInput.trim(), selectedAvatar);
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 2500);
  };

  const handleGoogleSignIn = async () => {
    setIsSigningIn(true);
    await signInWithGoogle();
    setTimeout(() => setIsSigningIn(false), 4000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="glass-panel w-full max-w-xl p-6 sm:p-7 rounded-3xl border border-cyan-500/30 shadow-[0_0_50px_rgba(0,245,255,0.15)] flex flex-col gap-6 relative overflow-hidden max-h-[90vh] overflow-y-auto"
      >
        {/* Top Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-cyan-500/10 border border-cyan-400/30 shadow-neon-cyan">
              <User className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <span className="text-[10px] font-mono uppercase tracking-widest text-cyan-400 font-bold">
                Identity & Cloud Sync
              </span>
              <h3 className="font-display font-black text-xl text-white tracking-wide">
                Player Profile
              </h3>
            </div>
          </div>

          <button
            onClick={() => setModal(null)}
            className="p-2 rounded-xl bg-slate-900 border border-white/10 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Google Authentication Status Card */}
        <div className="p-4 rounded-2xl bg-slate-950/80 border border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3.5 w-full sm:w-auto">
            <div className="w-12 h-12 rounded-2xl bg-slate-900 border border-white/10 flex items-center justify-center text-2xl flex-shrink-0">
              {user.avatar}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm text-white truncate max-w-[170px]">
                  {user.name}
                </span>
                {user.email ? (
                  <span className="flex items-center gap-1 text-[10px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full font-bold">
                    <ShieldCheck className="w-3 h-3 text-emerald-400" /> Google Verified
                  </span>
                ) : (
                  <span className="text-[10px] bg-slate-800 text-slate-400 border border-white/10 px-2 py-0.5 rounded-full font-medium">
                    Guest Account
                  </span>
                )}
              </div>
              <div className="text-xs text-slate-400 font-mono truncate">
                {user.email || 'Local profile saved to SQLite'}
              </div>
            </div>
          </div>

          {user.email ? (
            <button
              onClick={signOutGoogle}
              className="w-full sm:w-auto px-4 py-2 rounded-xl bg-red-950/40 border border-red-500/30 text-red-400 hover:bg-red-900/30 text-xs font-bold transition-all flex items-center justify-center gap-1.5 flex-shrink-0"
            >
              <LogOut className="w-3.5 h-3.5" /> Sign Out
            </button>
          ) : (
            <button
              onClick={handleGoogleSignIn}
              disabled={isSigningIn}
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-white text-black hover:bg-slate-200 text-xs font-extrabold transition-all flex items-center justify-center gap-2 shadow-lg hover:shadow-cyan-500/20 flex-shrink-0 active:scale-95"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>{isSigningIn ? 'Opening Browser...' : 'Sign In with Google'}</span>
            </button>
          )}
        </div>

        {/* Identity Customizer */}
        <form onSubmit={handleSaveIdentity} className="flex flex-col gap-4">
          <div>
            <label className="text-xs font-bold text-slate-300 mb-1.5 block">
              Display Name
            </label>
            <input
              type="text"
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              maxLength={20}
              placeholder="Enter your typist handle"
              className="w-full bg-slate-950/80 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-all font-medium"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-300 mb-2 block">
              Choose Typist Avatar
            </label>
            <div className="grid grid-cols-8 gap-2">
              {AVATAR_OPTIONS.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => setSelectedAvatar(emoji)}
                  className={`aspect-square rounded-xl flex items-center justify-center text-xl transition-all ${
                    selectedAvatar === emoji
                      ? 'bg-cyan-500/20 border-2 border-cyan-400 shadow-neon-cyan scale-110'
                      : 'bg-slate-900 border border-white/10 hover:border-white/30 hover:bg-white/5'
                  }`}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <span className="text-xs text-emerald-400 flex items-center gap-1">
              {savedNotice && (
                <>
                  <Check className="w-4 h-4 text-emerald-400" /> Identity saved successfully!
                </>
              )}
            </span>

            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold text-xs hover:shadow-neon-cyan transition-all flex items-center gap-1.5"
            >
              <Save className="w-3.5 h-3.5" /> Save Changes
            </button>
          </div>
        </form>

        {/* Career Telemetry Matrix */}
        <div className="border-t border-white/10 pt-4 flex flex-col gap-3">
          <div className="text-[10px] font-mono uppercase tracking-widest text-slate-400 font-bold">
            Career Records & Statistics
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <div className="p-3 rounded-2xl bg-slate-950/60 border border-white/10 flex flex-col">
              <span className="text-[10px] text-slate-400 uppercase font-medium">Rank Tier</span>
              <span 
                className="font-extrabold text-xs mt-1 truncate"
                style={{ color: rankStats.rank.color }}
              >
                {rankStats.rank.name}
              </span>
            </div>

            <div className="p-3 rounded-2xl bg-slate-950/60 border border-white/10 flex flex-col">
              <span className="text-[10px] text-slate-400 uppercase font-medium">Peak Speed</span>
              <span className="font-mono font-extrabold text-lg text-cyan-400 mt-0.5">
                {user.best_wpm} <span className="text-xs text-slate-400 font-sans">WPM</span>
              </span>
            </div>

            <div className="p-3 rounded-2xl bg-slate-950/60 border border-white/10 flex flex-col">
              <span className="text-[10px] text-slate-400 uppercase font-medium">All-Time Accuracy</span>
              <span className="font-mono font-extrabold text-lg text-emerald-400 mt-0.5">
                {user.avg_acc}%
              </span>
            </div>

            <div className="p-3 rounded-2xl bg-slate-950/60 border border-white/10 flex flex-col">
              <span className="text-[10px] text-slate-400 uppercase font-medium">Multiplayer Wins</span>
              <span className="font-mono font-extrabold text-lg text-amber-400 mt-0.5">
                {user.wins} <span className="text-xs text-slate-400 font-sans">/ {user.races}</span>
              </span>
            </div>
          </div>
        </div>

      </motion.div>
    </div>
  );
};
