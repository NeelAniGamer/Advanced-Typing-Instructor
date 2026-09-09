import React, { useEffect, useState } from 'react';
import { useGameStore } from '../../stores/useGameStore';
import { X, Trophy, Swords, Medal, Play, Clock, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';

interface TournamentItem {
  id: number;
  name: string;
  text: string;
  start: string;
  end: string;
}

interface ScoreEntry {
  name: string;
  wpm: number;
  acc: number;
  ts: string;
}

export const TournamentsModal: React.FC = () => {
  const { setModal } = useGameStore();
  const [tournaments, setTournaments] = useState<TournamentItem[]>([
    {
      id: 1,
      name: 'Grand Prix of Mechanical Speed',
      text: 'Synchronized tactile rhythms distinguish novice keystrokes from master level velocity.',
      start: 'Active',
      end: '24h remaining',
    },
  ]);
  const [selectedTournament, setSelectedTournament] = useState<TournamentItem>(tournaments[0]);
  const [scores, setScores] = useState<ScoreEntry[]>([
    { name: 'Neel (Host)', wpm: 124, acc: 99, ts: '10m ago' },
    { name: 'Aarush', wpm: 108, acc: 97, ts: '25m ago' },
    { name: 'Ansh', wpm: 96, acc: 98, ts: '1h ago' },
    { name: 'CyberTypist', wpm: 84, acc: 95, ts: '2h ago' },
  ]);

  useEffect(() => {
    const fetchTourneys = async () => {
      try {
        const resp = await fetch('/api/tournaments');
        if (resp.ok) {
          const data = await resp.json();
          if (Array.isArray(data) && data.length > 0) {
            setTournaments(data);
            setSelectedTournament(data[0]);
          }
        }
      } catch {
        // Fallback demo scores
      }
    };
    fetchTourneys();
  }, []);

  const handleStartTournament = (t: TournamentItem) => {
    useGameStore.setState({
      text: t.text,
      words: t.text.trim().split(/\s+/),
      currentWordIndex: 0,
      currentInput: '',
      activeScreen: 'game',
      activeModal: null,
      wpm: 0,
      accuracy: 100,
      currentStreak: 0,
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="glass-panel max-w-3xl w-full p-6 sm:p-8 rounded-3xl border border-red-500/30 shadow-[0_0_50px_rgba(239,68,68,0.15)] flex flex-col gap-6 max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-400">
              <Swords className="w-6 h-6" />
            </div>
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-red-400">
                Competitive Circuit
              </div>
              <h3 className="font-display font-extrabold text-2xl text-white">
                Global Tournaments
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

        {/* Selected Tournament Card */}
        {selectedTournament && (
          <div className="glass-panel p-6 rounded-2xl border border-white/10 bg-slate-950/60 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-display font-bold text-lg text-white">
                  {selectedTournament.name}
                </h4>
                <div className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5">
                  <Clock className="w-3.5 h-3.5 text-red-400" />
                  <span>{selectedTournament.end}</span>
                </div>
              </div>

              <button
                onClick={() => handleStartTournament(selectedTournament)}
                className="px-6 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs shadow-neon-red flex items-center gap-2 transition-all"
              >
                <Play className="w-3.5 h-3.5 fill-white" />
                <span>Enter Match</span>
              </button>
            </div>

            <p className="font-mono text-xs text-slate-300 italic bg-slate-900/60 p-3 rounded-xl border border-white/5">
              "{selectedTournament.text}"
            </p>
          </div>
        )}

        {/* Live Leaderboard Standings */}
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-2">
            <Trophy className="w-4 h-4 text-amber-400" /> Current Podium Standings
          </h4>

          <div className="flex flex-col gap-2">
            {scores.map((s, idx) => (
              <div
                key={idx}
                className="glass-panel px-4 py-3 rounded-xl border border-white/5 flex items-center justify-between text-xs"
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`w-6 h-6 rounded-full flex items-center justify-center font-bold font-mono ${
                      idx === 0
                        ? 'bg-amber-500 text-black shadow-neon-amber'
                        : idx === 1
                        ? 'bg-slate-300 text-black'
                        : idx === 2
                        ? 'bg-amber-700 text-white'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {idx + 1}
                  </span>
                  <span className="font-semibold text-white">{s.name}</span>
                </div>

                <div className="flex items-center gap-6 font-mono">
                  <span className="text-cyan-300 font-bold">{s.wpm} WPM</span>
                  <span className="text-emerald-400">{s.acc}%</span>
                  <span className="text-slate-500 text-[11px]">{s.ts}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

      </motion.div>
    </div>
  );
};
