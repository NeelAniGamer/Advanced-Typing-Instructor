import React, { useState } from 'react';
import { useGameStore } from '../../stores/useGameStore';
import { isOrganicTheme } from '../../utils/theme';
import { X, Terminal, ShieldAlert, KeyRound, Check, Gem, Unlock } from 'lucide-react';
import { motion } from 'framer-motion';
import { KbdKey } from '../SpectrumUI';
import { Chip } from '../HeroUI';

export const AdminTerminalModal: React.FC = () => {
  const { setModal, addEmeralds, setLevel, unlockedLevels, uiTheme } = useGameStore();
  const isOrganic = isOrganicTheme(uiTheme);
  const [pin, setPin] = useState<string>('');
  const [isUnlocked, setIsUnlocked] = useState<boolean>(false);
  const [pinError, setPinError] = useState<boolean>(false);

  const handlePinPress = (digit: string) => {
    if (pin.length < 4) {
      const next = pin + digit;
      setPin(next);
      if (next.length === 4) {
        // Default PIN: 1337, 1984, or 0000
        if (next === '1337' || next === '1984' || next === '0000') {
          setIsUnlocked(true);
          setPinError(false);
        } else {
          setPinError(true);
          setTimeout(() => {
            setPin('');
            setPinError(false);
          }, 800);
        }
      }
    }
  };

  const handleUnlockAll = () => {
    useGameStore.setState({ unlockedLevels: 200 });
  };

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) setModal(null);
      }}
      className={`fixed inset-0 z-[100] backdrop-blur-xl flex items-center justify-center p-4 transition-colors ${
        isOrganic ? 'bg-black/65' : 'bg-black/90'
      }`}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className={`max-w-lg w-full p-6 sm:p-8 rounded-3xl flex flex-col gap-6 transition-all ${
          isOrganic
            ? 'bg-[#FAF8F5] border border-[#E5DFD7] text-[#333333] shadow-2xl'
            : 'glass-panel border border-green-500/40 text-white shadow-[0_0_50px_rgba(57,255,20,0.15)]'
        }`}
      >
        {/* Terminal Header */}
        <div
          className={`flex items-center justify-between border-b pb-4 ${
            isOrganic ? 'border-[#E5DFD7]' : 'border-green-500/20'
          }`}
        >
          <div className="flex items-center gap-3">
            <div
              className={`p-2.5 rounded-xl border ${
                isOrganic
                  ? 'bg-[#7C8D81]/15 border-[#7C8D81]/30 text-[#7C8D81]'
                  : 'bg-green-500/10 border-green-500/30 text-green-400'
              }`}
            >
              <Terminal className="w-5 h-5" />
            </div>
            <div>
              <div
                className={`text-[10px] font-mono uppercase tracking-widest ${
                  isOrganic ? 'text-[#7C8D81]' : 'text-green-500'
                }`}
              >
                [ SECURE DEBUG TERMINAL ]
              </div>
              <h3
                className={`font-mono font-bold text-lg ${
                  isOrganic ? 'text-[#333333]' : 'text-green-400'
                }`}
              >
                root@typing-instructor:~$
              </h3>
            </div>
          </div>

          <button
            onClick={() => setModal(null)}
            className={`p-2 rounded-xl transition-colors ${
              isOrganic
                ? 'bg-white border border-[#E5DFD7] text-[#616864] hover:text-[#333333] shadow-sm'
                : 'bg-slate-900 border border-white/10 text-slate-400 hover:text-white'
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {!isUnlocked ? (
          /* PIN Keypad Screen */
          <div className="flex flex-col items-center gap-4 py-4">
            <KeyRound
              className={`w-8 h-8 animate-pulse ${
                isOrganic ? 'text-[#C97D5A]' : 'text-green-400'
              }`}
            />
            <p
              className={`font-mono text-xs text-center ${
                isOrganic ? 'text-[#616864]' : 'text-green-400/80'
              }`}
            >
              ENTER 4-DIGIT AUTHORIZATION PIN<br />
              <span className="text-[10px] opacity-70">(Default: 1337 or 0000)</span>
            </p>

            {/* PIN Dots */}
            <div className="flex gap-3 my-2">
              {[0, 1, 2, 3].map((idx) => (
                <div
                  key={idx}
                  className={`w-3.5 h-3.5 rounded-full border transition-all ${
                    pin.length > idx
                      ? pinError
                        ? 'bg-red-500 border-red-500 shadow-neon-red'
                        : isOrganic
                        ? 'bg-[#7C8D81] border-[#7C8D81] shadow-md'
                        : 'bg-green-400 border-green-400 shadow-neon-green'
                      : isOrganic
                      ? 'border-[#E5DFD7] bg-[#E5DFD7]/40'
                      : 'border-green-500/30 bg-green-950/20'
                  }`}
                />
              ))}
            </div>

            {/* Tactile Keypad using Spectrum UI KbdKey */}
            <div className="grid grid-cols-3 gap-3 w-60 justify-items-center">
              {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((num) => (
                <KbdKey
                  key={num}
                  keyName={num}
                  onPress={() => handlePinPress(num)}
                  size="md"
                  className="w-16 h-12 flex items-center justify-center font-mono font-bold text-sm"
                >
                  {num}
                </KbdKey>
              ))}
              <KbdKey
                keyName="escape"
                onPress={() => setPin('')}
                size="md"
                className="w-16 h-12 flex items-center justify-center font-mono text-xs text-red-400 font-bold"
              >
                CLR
              </KbdKey>
              <KbdKey
                keyName="0"
                onPress={() => handlePinPress('0')}
                size="md"
                className="w-16 h-12 flex items-center justify-center font-mono font-bold text-sm"
              >
                0
              </KbdKey>
              <KbdKey
                keyName="enter"
                onPress={() => {
                  if (pin.length === 4) handlePinPress('');
                }}
                size="md"
                className="w-16 h-12 flex items-center justify-center font-mono text-xs text-emerald-400 font-bold"
              >
                OK
              </KbdKey>
            </div>
          </div>
        ) : (
          /* Unlocked Admin Controls */
          <div className="flex flex-col gap-4 font-mono text-xs">
            <div
              className={`p-3 rounded-2xl border flex items-center gap-2 ${
                isOrganic
                  ? 'bg-white border-[#7C8D81]/40 text-[#7C8D81] shadow-sm'
                  : 'bg-green-950/30 border-green-500/30 text-green-400'
              }`}
            >
              <Check className="w-4 h-4" /> Root Authorization Granted
            </div>

            <div className="flex flex-col gap-2.5">
              <div
                className={`font-bold uppercase text-[10px] ${
                  isOrganic ? 'text-[#7C8D81]' : 'text-slate-400'
                }`}
              >
                Developer Quick Commands:
              </div>

              <button
                onClick={() => addEmeralds(25000)}
                className={`w-full py-2.5 px-4 rounded-xl border text-left flex items-center justify-between transition-all ${
                  isOrganic
                    ? 'bg-white border-[#E5DFD7] text-[#333333] hover:border-[#7C8D81] shadow-sm'
                    : 'bg-slate-900 border-emerald-500/30 text-emerald-400 hover:bg-emerald-950/30'
                }`}
              >
                <span className="flex items-center gap-2">
                  <Gem className="w-4 h-4 text-emerald-500" /> Grant +25,000 Emeralds
                </span>
                <span className="text-[10px] opacity-70">[RUN]</span>
              </button>

              <button
                onClick={handleUnlockAll}
                className={`w-full py-2.5 px-4 rounded-xl border text-left flex items-center justify-between transition-all ${
                  isOrganic
                    ? 'bg-white border-[#E5DFD7] text-[#333333] hover:border-[#C97D5A] shadow-sm'
                    : 'bg-slate-900 border-cyan-500/30 text-cyan-400 hover:bg-cyan-950/30'
                }`}
              >
                <span className="flex items-center gap-2">
                  <Unlock className="w-4 h-4 text-cyan-500" /> Unlock All 200 Progression Levels
                </span>
                <span className="text-[10px] opacity-70">[RUN]</span>
              </button>

              <button
                onClick={() => setLevel(40)}
                className={`w-full py-2.5 px-4 rounded-xl border text-left flex items-center justify-between transition-all ${
                  isOrganic
                    ? 'bg-white border-[#E5DFD7] text-[#333333] hover:border-[#C97D5A] shadow-sm'
                    : 'bg-slate-900 border-red-500/30 text-red-400 hover:bg-red-950/30'
                }`}
              >
                <span>Jump to Level 40 (First Boss Fight)</span>
                <span className="text-[10px] opacity-70">[RUN]</span>
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
};
