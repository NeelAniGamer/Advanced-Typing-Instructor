import React, { useState } from 'react';
import { useGameStore } from '../../stores/useGameStore';
import { X, User, Trophy, Zap, Target, Award, Check, Gem, Swords, Flame } from 'lucide-react';
import { motion } from 'framer-motion';

const AVATAR_PRESETS = ['👑', '🚀', '⚡', '🤖', '🧙', '🏎️', '🐱', '🦊', '🐉', '💎', '🛡️', '🔥'];

export const PlayerProfileModal: React.FC = () => {
  const { user, emeralds, setModal, updateProfile } = useGameStore();
  const [selectedAvatar, setSelectedAvatar] = useState(user.avatar);
  const [displayName, setDisplayName] = useState(user.name);
  const [savedToast, setSavedToast] = useState(false);

  const handleSave = async () => {
    await updateProfile(displayName.trim() || 'Champion Typer', selectedAvatar);
    setSavedToast(true);
    setTimeout(() => {
      setSavedToast(false);
      setModal(null);
    }, 600);
  };

  const winRate = user.races > 0 ? Math.round((user.wins / user.races) * 100) : 0;

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="glass-panel max-w-lg w-full p-6 sm:p-8 rounded-3xl border border-cyan-500/30 shadow-[0_0_50px_rgba(0,245,255,0.15)] flex flex-col gap-6"
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
              <User className="w-6 h-6" />
            </div>
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-cyan-400">
                Player ID &amp; Credentials
              </div>
              <h3 className="font-display font-extrabold text-2xl text-white">
                Gamer Identity
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

        {/* Identity Card */}
        <div className="glass-panel p-5 rounded-2xl border border-white/10 bg-slate-950/60 flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-purple-500/20 border-2 border-cyan-400/50 flex items-center justify-center text-3xl shadow-neon-cyan shrink-0">
            {selectedAvatar}
          </div>
          <div className="flex-1">
            <label className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block mb-1">
              Display Name
            </label>
            <input
              type="text"
              value={displayName}
              maxLength={20}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full bg-slate-900 border border-white/15 focus:border-cyan-400 rounded-xl px-3 py-1.5 font-display font-bold text-white text-base focus:outline-none transition-colors"
            />
          </div>
        </div>

        {/* Avatar Preset Grid */}
        <div>
          <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2.5">
            Select Avatar Icon
          </div>
          <div className="grid grid-cols-6 gap-2">
            {AVATAR_PRESETS.map((av) => (
              <button
                key={av}
                onClick={() => setSelectedAvatar(av)}
                className={`h-11 rounded-xl text-xl border transition-all flex items-center justify-center ${
                  selectedAvatar === av
                    ? 'bg-cyan-500/20 border-cyan-400 shadow-neon-cyan scale-105'
                    : 'bg-slate-900/60 border-white/10 hover:border-white/20'
                }`}
              >
                {av}
              </button>
            ))}
          </div>
        </div>

        {/* Career Statistics */}
        <div className="grid grid-cols-3 gap-3">
          <div className="glass-panel p-3.5 rounded-xl border border-white/10 text-center">
            <Zap className="w-4 h-4 mx-auto text-cyan-400 mb-1" />
            <div className="text-[10px] text-slate-400 uppercase font-semibold">Best WPM</div>
            <div className="text-lg font-mono font-bold text-white">{user.best_wpm}</div>
          </div>

          <div className="glass-panel p-3.5 rounded-xl border border-white/10 text-center">
            <Swords className="w-4 h-4 mx-auto text-red-400 mb-1" />
            <div className="text-[10px] text-slate-400 uppercase font-semibold">Races Won</div>
            <div className="text-lg font-mono font-bold text-red-300">{user.wins} / {user.races}</div>
          </div>

          <div className="glass-panel p-3.5 rounded-xl border border-white/10 text-center">
            <Trophy className="w-4 h-4 mx-auto text-amber-400 mb-1" />
            <div className="text-[10px] text-slate-400 uppercase font-semibold">Win Rate</div>
            <div className="text-lg font-mono font-bold text-amber-300">{winRate}%</div>
          </div>
        </div>

        {/* Save Button */}
        <button
          onClick={handleSave}
          className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black font-display font-black text-sm tracking-wide shadow-neon-cyan flex items-center justify-center gap-2 transition-all"
        >
          {savedToast ? (
            <>
              <Check className="w-5 h-5 text-black" />
              <span>SAVED!</span>
            </>
          ) : (
            <span>SAVE CREDENTIALS</span>
          )}
        </button>

      </motion.div>
    </div>
  );
};
