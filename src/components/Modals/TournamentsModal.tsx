import React, { useEffect, useState } from 'react';
import { useGameStore } from '../../stores/useGameStore';
import { isOrganicTheme } from '../../utils/theme';
import { X, Trophy, Swords, Medal, Play, Clock, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import { Table, Chip, Badge, ProgressBar } from '../HeroUI';
import { NumberTicker } from '../SpectrumUI';

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
  const { setModal, uiTheme, startChallengeSession } = useGameStore();
  const isOrganic = isOrganicTheme(uiTheme);
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
    startChallengeSession(t.text, t.name, 'Competitions');
  };

  return (
    <div 
      onClick={(e) => {
        if (e.target === e.currentTarget) setModal(null);
      }}
      className={`fixed inset-0 z-[100] backdrop-blur-xl flex items-center justify-center p-4 ${
        isOrganic ? 'bg-black/65' : 'bg-black/85'
      }`}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className={`max-w-3xl w-full p-6 sm:p-8 rounded-3xl flex flex-col gap-6 max-h-[90vh] overflow-y-auto transition-all ${
          isOrganic
            ? 'bg-[#FAF8F5] border border-[#E5DFD7] text-[#333333] shadow-2xl'
            : 'glass-panel border border-red-500/30 text-white shadow-[0_0_50px_rgba(239,68,68,0.15)]'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-3 rounded-2xl ${
              isOrganic
                ? 'bg-[#C97D5A]/15 border border-[#C97D5A]/30 text-[#C97D5A]'
                : 'bg-red-500/10 border border-red-500/30 text-red-400'
            }`}>
              <Swords className="w-6 h-6" />
            </div>
            <div>
              <div className={`text-[11px] font-bold uppercase tracking-wider ${
                isOrganic ? 'text-[#C97D5A]' : 'text-red-400'
              }`}>
                Competitive Circuit
              </div>
              <h3 className={`font-display font-extrabold text-2xl ${
                isOrganic ? 'text-[#333333]' : 'text-white'
              }`}>
                Global Tournaments
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

        {/* Selected Tournament Card */}
        {selectedTournament && (
          <div className={`p-6 rounded-2xl flex flex-col gap-4 transition-all ${
            isOrganic
              ? 'bg-white border border-[#E5DFD7] shadow-sm'
              : 'glass-panel border border-white/10 bg-slate-950/60'
          }`}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                  <Chip color={isOrganic ? 'warning' : 'danger'} variant="solid" size="sm" dot>
                    Active Circuit
                  </Chip>
                  <Chip color={isOrganic ? 'default' : 'warning'} variant="outline" size="sm">
                    {selectedTournament.end}
                  </Chip>
                  <Chip color={isOrganic ? 'secondary' : 'primary'} variant="soft" size="sm">
                    Grand Prix
                  </Chip>
                </div>
                <h4 className={`font-display font-bold text-lg ${
                  isOrganic ? 'text-[#333333]' : 'text-white'
                }`}>
                  {selectedTournament.name}
                </h4>
              </div>

              <button
                onClick={() => handleStartTournament(selectedTournament)}
                className={`px-6 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all shrink-0 ${
                  isOrganic
                    ? 'bg-[#C97D5A] hover:bg-[#b56d4c] text-white shadow-md'
                    : 'bg-red-600 hover:bg-red-500 text-white shadow-neon-red'
                }`}
              >
                <Play className="w-3.5 h-3.5 fill-white" />
                <span>Enter Match</span>
              </button>
            </div>

            <p className={`font-mono text-xs italic p-3 rounded-xl border ${
              isOrganic
                ? 'bg-[#FAF8F5] border-[#E5DFD7] text-[#616864]'
                : 'bg-slate-900/60 border-white/5 text-slate-300'
            }`}>
              "{selectedTournament.text}"
            </p>
          </div>
        )}

        {/* Live Leaderboard Standings with HeroUI Table */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <h4 className={`text-xs font-bold uppercase tracking-wider flex items-center gap-2 ${
              isOrganic ? 'text-[#616864]' : 'text-slate-400'
            }`}>
              <Trophy className="w-4 h-4 text-amber-500" /> Current Podium Standings
            </h4>
            <Chip size="sm" variant="soft" color={isOrganic ? 'primary' : 'secondary'}>
              Live Real-Time
            </Chip>
          </div>

          <Table isStriped isCompact aria-label="Current podium standings">
            <Table.Header>
              <Table.Column align="center">Rank</Table.Column>
              <Table.Column align="start">Racer</Table.Column>
              <Table.Column align="start">Speed Velocity</Table.Column>
              <Table.Column align="center">Precision</Table.Column>
              <Table.Column align="end">Recorded</Table.Column>
            </Table.Header>
            <Table.Body>
              {scores.map((s, idx) => {
                return (
                  <Table.Row key={idx}>
                    <Table.Cell align="center">
                      <div className="flex items-center justify-center">
                        <Badge.Anchor>
                          <span
                            className={`w-6 h-6 rounded-full flex items-center justify-center font-mono font-bold text-[11px] ${
                              idx === 0
                                ? 'bg-amber-500 text-black shadow-neon-amber/40'
                                : idx === 1
                                ? 'bg-slate-300 text-black'
                                : idx === 2
                                ? 'bg-amber-700 text-white'
                                : isOrganic
                                ? 'bg-[#E5DFD7] text-[#616864]'
                                : 'bg-slate-800 text-slate-400'
                            }`}
                          >
                            {idx + 1}
                          </span>
                          {idx === 0 && (
                            <Badge
                              size="sm"
                              color="warning"
                              isPulse
                              isDot
                              placement="top-right"
                            />
                          )}
                        </Badge.Anchor>
                      </div>
                    </Table.Cell>

                    <Table.Cell align="start">
                      <span className={`font-semibold ${isOrganic ? 'text-[#333333]' : 'text-white'}`}>
                        {s.name}
                      </span>
                    </Table.Cell>

                    <Table.Cell align="start">
                      <div className="flex flex-col gap-1 w-36 sm:w-44">
                        <div className="flex items-center justify-between text-[11px] font-mono">
                          <span className={`font-bold flex items-center gap-1 ${
                            isOrganic ? 'text-[#C97D5A]' : 'text-cyan-300'
                          }`}>
                            <NumberTicker value={s.wpm} /> WPM
                          </span>
                        </div>
                        <ProgressBar
                          value={s.wpm}
                          minValue={0}
                          maxValue={140}
                          size="sm"
                          color={isOrganic ? (idx === 0 ? 'warning' : 'primary') : (idx === 0 ? 'primary' : 'secondary')}
                        />
                      </div>
                    </Table.Cell>

                    <Table.Cell align="center">
                      <Chip
                        size="sm"
                        variant={s.acc >= 98 ? 'solid' : 'soft'}
                        color={s.acc >= 98 ? 'success' : 'warning'}
                      >
                        <NumberTicker value={s.acc} suffix="%" />
                      </Chip>
                    </Table.Cell>

                    <Table.Cell align="end">
                      <span className={`text-[11px] font-mono ${isOrganic ? 'text-[#7C8D81]' : 'text-slate-500'}`}>
                        {s.ts}
                      </span>
                    </Table.Cell>
                  </Table.Row>
                );
              })}
            </Table.Body>
          </Table>
        </div>

      </motion.div>
    </div>
  );
};
