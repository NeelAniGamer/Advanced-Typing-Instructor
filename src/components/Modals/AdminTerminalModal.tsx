import React, { useState } from 'react';
import { useGameStore } from '../../stores/useGameStore';
import { X, Terminal, ShieldAlert, KeyRound, Check, Gem, Unlock } from 'lucide-react';
import { motion } from 'framer-motion';

export const AdminTerminalModal: React.FC = () => {
  const { setModal, addEmeralds, setLevel, unlockedLevels } = useGameStore();
  const [pin, setPin] = useState<string>('');
  const [isUnlocked, setIsUnlocked] = useState<boolean>(false);
  const [pinError, setPinError] = useState<boolean>(false);

  const handlePinPress = (digit: string) => {
    if (pin.length < 4) {
      const next = pin + digit;
      setPin(next);
      if (next.length === 4) {
        // Default PIN: 1337 or 1984
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
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="glass-panel max-w-lg w-full p-6 sm:p-8 rounded-3xl border border-green-500/40 shadow-[0_0_50px_rgba(57,255,20,0.15)] flex flex-col gap-6"
      >
        {/* Terminal Header */}
        <div className="flex items-center justify-between border-b border-green-500/20 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-green-500/10 border border-green-500/30 text-green-400">
              <Terminal className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[10px] font-mono uppercase tracking-widest text-green-500">
                [ SECURE DEBUG TERMINAL ]
              </div>
              <h3 className="font-mono font-bold text-lg text-green-400">
                root@typing-instructor:~$
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

        {!isUnlocked ? (
          /* PIN Keypad Screen */
          <div className="flex flex-col items-center gap-4 py-4">
            <KeyRound className="w-8 h-8 text-green-400 animate-pulse" />
            <p className="font-mono text-xs text-green-400/80 text-center">
              ENTER 4-DIGIT AUTHORIZATION PIN<br />
              <span className="text-[10px] text-slate-500">(Default: 1337 or 0000)</span>
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
                        : 'bg-green-400 border-green-400 shadow-neon-green'
                      : 'border-green-500/30 bg-green-950/20'
                  }`}
                />
              ))}
            </div>

            {/* Keypad */}
            <div className="grid grid-cols-3 gap-2 w-52">
              {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((num) => (
                <button
                  key={num}
                  onClick={() => handlePinPress(num)}
                  className="h-11 rounded-xl bg-slate-950 border border-green-500/20 font-mono text-green-400 hover:border-green-400 hover:bg-green-950/30 font-bold transition-all"
                >
                  {num}
                </button>
              ))}
              <button
                onClick={() => setPin('')}
                className="h-11 rounded-xl bg-slate-950 border border-white/10 font-mono text-xs text-slate-400 hover:text-white"
              >
                CLR
              </button>
              <button
                onClick={() => handlePinPress('0')}
                className="h-11 rounded-xl bg-slate-950 border border-green-500/20 font-mono text-green-400 hover:border-green-400 hover:bg-green-950/30 font-bold"
              >
                0
              </button>
              <button
                onClick={() => handlePinPress('1')}
                className="h-11 rounded-xl bg-slate-950 border border-green-500/30 font-mono text-xs text-green-400 hover:bg-green-900/30"
              >
                OK
              </button>
            </div>
          </div>
        ) : (
          /* Unlocked Admin Controls */
          <div className="flex flex-col gap-4 font-mono text-xs">
            <div className="p-3 rounded-xl bg-green-950/30 border border-green-500/30 text-green-400 flex items-center gap-2">
              <Check className="w-4 h-4" /> Root Authorization Granted
            </div>

            <div className="flex flex-col gap-2.5">
              <div className="text-slate-400 font-bold uppercase text-[10px]">
                Developer Quick Commands:
              </div>

              <button
                onClick={() => addEmeralds(25000)}
                className="w-full py-2.5 px-4 rounded-xl bg-slate-900 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-950/30 text-left flex items-center justify-between transition-all"
              >
                <span className="flex items-center gap-2">
                  <Gem className="w-4 h-4" /> Grant +25,000 Emeralds
                </span>
                <span className="text-[10px] text-slate-500">[RUN]</span>
              </button>

              <button
                onClick={handleUnlockAll}
                className="w-full py-2.5 px-4 rounded-xl bg-slate-900 border border-cyan-500/30 text-cyan-400 hover:bg-cyan-950/30 text-left flex items-center justify-between transition-all"
              >
                <span className="flex items-center gap-2">
                  <Unlock className="w-4 h-4" /> Unlock All 200 Progression Levels
                </span>
                <span className="text-[10px] text-slate-500">[RUN]</span>
              </button>

              <button
                onClick={() => setLevel(40)}
                className="w-full py-2.5 px-4 rounded-xl bg-slate-900 border border-red-500/30 text-red-400 hover:bg-red-950/30 text-left flex items-center justify-between transition-all"
              >
                <span>Jump to Level 40 (First Boss Fight)</span>
                <span className="text-[10px] text-slate-500">[RUN]</span>
              </button>
            </div>
          </div>
        )}

      </motion.div>
    </div>
  );
};
