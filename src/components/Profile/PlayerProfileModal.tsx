import React, { useState } from 'react';
import { useGameStore } from '../../stores/useGameStore';
import { isOrganicTheme } from '../../utils/theme';
import { X, User, Trophy, Zap, Target, Award, Check, Gem, Swords, Flame } from 'lucide-react';
import { motion } from 'framer-motion';
import { UserAvatar, isAvatarUrl } from '../Common/UserAvatar';
import { Chip, Badge } from '../HeroUI';
import { NumberTicker } from '../SpectrumUI';

const AVATAR_PRESETS = ['👑', '🚀', '⚡', '🤖', '🧙', '🏎️', '🐱', '🦊', '🐉', '💎', '🛡️', '🔥'];

export const PlayerProfileModal: React.FC = () => {
  const { user, emeralds, setModal, updateProfile, uiTheme } = useGameStore();
  const isOrganic = isOrganicTheme(uiTheme);

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
    <div 
      onClick={(e) => {
        if (e.target === e.currentTarget) setModal(null);
      }}
      className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-xl flex items-center justify-center p-4"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className={`max-w-lg w-full p-6 sm:p-8 rounded-3xl border flex flex-col gap-6 transition-all duration-300 ${
          isOrganic
            ? 'bg-[#FAF8F5] border-[#E5DFD7] text-[#333333] shadow-organic-card'
            : 'glass-panel border-cyan-500/30 text-white shadow-[0_0_50px_rgba(0,245,255,0.15)] bg-slate-950/95'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-3 rounded-2xl border transition-colors ${
              isOrganic
                ? 'bg-[#7C8D81]/15 border-[#7C8D81]/30 text-[#7C8D81]'
                : 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400'
            }`}>
              <User className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className={`text-[11px] font-bold uppercase tracking-wider ${
                  isOrganic ? 'text-[#C97D5A]' : 'text-cyan-400'
                }`}>
                  Player ID & Credentials
                </span>
                <Chip size="sm" variant={isOrganic ? 'soft' : 'solid'} color={isOrganic ? 'secondary' : 'primary'}>
                  Rank {user.level || 1}
                </Chip>
              </div>
              <h3 className={`font-display font-black text-2xl tracking-wide ${
                isOrganic ? 'text-[#333333]' : 'text-white'
              }`}>
                Gamer Identity
              </h3>
            </div>
          </div>

          <button
            onClick={() => setModal(null)}
            className={`p-2 rounded-xl border transition-all ${
              isOrganic
                ? 'bg-white/80 border-[#E5DFD7] text-[#616864] hover:text-[#333333] hover:bg-[#F2EFEB]'
                : 'bg-slate-900 border-white/10 text-slate-400 hover:text-white hover:bg-white/10'
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Identity Card */}
        <div className={`p-5 rounded-2xl border flex items-center gap-4 transition-colors ${
          isOrganic
            ? 'bg-white border-[#E5DFD7]'
            : 'glass-panel border-white/10 bg-slate-950/60'
        }`}>
          <div className={`w-16 h-16 rounded-2xl border-2 flex items-center justify-center text-3xl shrink-0 overflow-hidden transition-colors ${
            isOrganic
              ? 'bg-gradient-to-br from-[#7C8D81]/20 to-[#C97D5A]/20 border-[#7C8D81]/40'
              : 'bg-gradient-to-br from-cyan-500/20 to-purple-500/20 border-cyan-400/50 shadow-neon-cyan'
          }`}>
            <UserAvatar avatar={selectedAvatar} className="w-full h-full" />
          </div>
          <div className="flex-1">
            <label className={`text-[10px] uppercase font-bold tracking-wider block mb-1 ${
              isOrganic ? 'text-[#616864]' : 'text-slate-400'
            }`}>
              Display Name
            </label>
            <input
              type="text"
              value={displayName}
              maxLength={20}
              onChange={(e) => setDisplayName(e.target.value)}
              className={`w-full rounded-xl px-3 py-2 font-display font-bold text-base focus:outline-none transition-colors border ${
                isOrganic
                  ? 'bg-[#FAF8F5] border-[#E5DFD7] text-[#333333] focus:border-[#C97D5A]'
                  : 'bg-slate-900 border-white/15 focus:border-cyan-400 text-white'
              }`}
            />
          </div>
        </div>

        {/* Avatar Preset Grid */}
        <div>
          <div className="flex items-center justify-between mb-2.5">
            <div className={`text-xs font-bold uppercase tracking-wider ${
              isOrganic ? 'text-[#616864]' : 'text-slate-400'
            }`}>
              Select Avatar Icon
            </div>
            {isAvatarUrl(user.avatar) && (
              <button
                type="button"
                onClick={() => setSelectedAvatar(user.avatar)}
                className={`text-[11px] font-bold px-2.5 py-1 rounded-lg border flex items-center gap-1.5 transition-all ${
                  selectedAvatar === user.avatar
                    ? isOrganic
                      ? 'bg-[#7C8D81]/20 border-[#7C8D81] text-[#58675E]'
                      : 'bg-cyan-500/20 border-cyan-400 text-cyan-300 shadow-neon-cyan'
                    : isOrganic
                    ? 'bg-white border-[#E5DFD7] text-[#616864]'
                    : 'bg-slate-900 border-white/10 text-slate-400 hover:text-white'
                }`}
              >
                <UserAvatar avatar={user.avatar} className="w-3.5 h-3.5 rounded-full" />
                <span>Google Photo</span>
              </button>
            )}
          </div>
          <div className="grid grid-cols-6 gap-2">
            {AVATAR_PRESETS.map((av) => (
              <button
                key={av}
                onClick={() => setSelectedAvatar(av)}
                className={`h-11 rounded-xl text-xl border transition-all flex items-center justify-center ${
                  selectedAvatar === av
                    ? isOrganic
                      ? 'bg-[#C97D5A]/15 border-2 border-[#C97D5A] scale-105 shadow-sm'
                      : 'bg-cyan-500/20 border-cyan-400 shadow-neon-cyan scale-105'
                    : isOrganic
                    ? 'bg-white border-[#E5DFD7] hover:border-[#7C8D81]/60 hover:bg-[#FAF8F5]'
                    : 'bg-slate-900/60 border-white/10 hover:border-white/20'
                }`}
              >
                {av}
              </button>
            ))}
          </div>
        </div>

        {/* Career Statistics with NumberTicker */}
        <div className="grid grid-cols-3 gap-3">
          <div className={`p-3.5 rounded-xl border text-center transition-colors ${
            isOrganic ? 'bg-white border-[#E5DFD7]' : 'glass-panel border-white/10'
          }`}>
            <Zap className={`w-4 h-4 mx-auto mb-1 ${isOrganic ? 'text-[#7C8D81]' : 'text-cyan-400'}`} />
            <div className={`text-[10px] uppercase font-semibold ${isOrganic ? 'text-[#616864]' : 'text-slate-400'}`}>
              Best WPM
            </div>
            <div className={`text-lg font-mono font-black ${isOrganic ? 'text-[#333333]' : 'text-white'}`}>
              <NumberTicker value={user.best_wpm || 0} />
            </div>
          </div>

          <div className={`p-3.5 rounded-xl border text-center transition-colors ${
            isOrganic ? 'bg-white border-[#E5DFD7]' : 'glass-panel border-white/10'
          }`}>
            <Swords className={`w-4 h-4 mx-auto mb-1 ${isOrganic ? 'text-[#C97D5A]' : 'text-red-400'}`} />
            <div className={`text-[10px] uppercase font-semibold ${isOrganic ? 'text-[#616864]' : 'text-slate-400'}`}>
              Races Won
            </div>
            <div className={`text-lg font-mono font-black ${isOrganic ? 'text-[#C97D5A]' : 'text-red-300'}`}>
              <NumberTicker value={user.wins || 0} /> / {user.races || 0}
            </div>
          </div>

          <div className={`p-3.5 rounded-xl border text-center transition-colors ${
            isOrganic ? 'bg-white border-[#E5DFD7]' : 'glass-panel border-white/10'
          }`}>
            <Trophy className={`w-4 h-4 mx-auto mb-1 ${isOrganic ? 'text-[#966E1F]' : 'text-amber-400'}`} />
            <div className={`text-[10px] uppercase font-semibold ${isOrganic ? 'text-[#616864]' : 'text-slate-400'}`}>
              Win Rate
            </div>
            <div className={`text-lg font-mono font-black ${isOrganic ? 'text-[#966E1F]' : 'text-amber-300'}`}>
              <NumberTicker value={winRate} suffix="%" />
            </div>
          </div>
        </div>

        {/* Save Button */}
        <button
          onClick={handleSave}
          className={`w-full py-4 rounded-2xl font-display font-black text-sm tracking-wider flex items-center justify-center gap-2 transition-all ${
            isOrganic
              ? 'bg-[#C97D5A] hover:bg-[#B86B49] text-white shadow-organic-terracotta hover:shadow-[0_8px_24px_rgba(201,125,90,0.4)]'
              : 'bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black shadow-neon-cyan'
          }`}
        >
          {savedToast ? (
            <>
              <Check className="w-5 h-5 text-current" />
              <span>CREDENTIALS SAVED!</span>
            </>
          ) : (
            <span>SAVE CREDENTIALS</span>
          )}
        </button>
      </motion.div>
    </div>
  );
};
