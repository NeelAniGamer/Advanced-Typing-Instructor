import React, { useState, useEffect } from 'react';
import { useGameStore } from '../../stores/useGameStore';
import { 
  Users, 
  Plus, 
  LogIn, 
  Trophy, 
  Crown, 
  Play, 
  Check, 
  Send, 
  Flame, 
  Zap, 
  ArrowLeft,
  Copy,
  CheckCheck,
  Globe,
  Server,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { mpService } from '../../services/multiplayerService';

export const MultiplayerScreen: React.FC = () => {
  const {
    user,
    mpRoom,
    isMpRacing,
    mpCountdown,
    mpPodium,
    mpChatMessages,
    mpIsHost,
    words,
    currentWordIndex,
    currentInput,
    wpm,
    accuracy,
    createMpRoom,
    joinMpRoom,
    leaveMpRoom,
    toggleMpReady,
    startMpRace,
    sendMpChat,
    handleKeyInput,
    initMultiplayer,
    setScreen,
  } = useGameStore();

  const [joinCode, setJoinCode] = useState('');
  const [chatInput, setChatInput] = useState('');
  const [copied, setCopied] = useState(false);
  const [showServerModal, setShowServerModal] = useState(false);
  const [provider, setProviderState] = useState<'supabase' | 'custom_ws' | 'local'>(mpService.getProvider());
  const [serverUrlInput, setServerUrlInput] = useState(mpService.getServerUrl());
  const [serverStatusMsg, setServerStatusMsg] = useState('');

  useEffect(() => {
    initMultiplayer();
  }, []);

  useEffect(() => {
    if (mpPodium && mpPodium.length > 0) {
      confetti({
        particleCount: 100,
        spread: 80,
        origin: { y: 0.6 },
        colors: ['#00f5ff', '#ffd54f', '#ef4444', '#10b981'],
      });
    }
  }, [mpPodium]);

  const handleCopyCode = () => {
    if (mpRoom?.code) {
      navigator.clipboard.writeText(mpRoom.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }
  };

  const handleSelectProvider = async (newProvider: 'supabase' | 'custom_ws' | 'local') => {
    setProviderState(newProvider);
    mpService.setProvider(newProvider);
    setServerStatusMsg(`Switching network to ${newProvider}...`);
    const ok = await mpService.connect(newProvider === 'custom_ws' ? serverUrlInput : undefined);
    if (ok) {
      setServerStatusMsg('Connected successfully!');
      setTimeout(() => {
        setShowServerModal(false);
        setServerStatusMsg('');
      }, 800);
    } else {
      setServerStatusMsg('Connection check completed.');
    }
  };

  const handleSaveCustomServer = async () => {
    mpService.setServerUrl(serverUrlInput);
    handleSelectProvider('custom_ws');
  };

  const handleSendChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (chatInput.trim()) {
      sendMpChat(chatInput.trim());
      setChatInput('');
    }
  };

  const playersList = mpRoom ? Object.values(mpRoom.players) : [];

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 flex flex-col gap-6">
      
      {/* Top Banner */}
      <div className="glass-panel p-6 rounded-3xl border border-cyan-500/30 flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <button
            onClick={() => {
              if (mpRoom) leaveMpRoom();
              setScreen('game');
            }}
            className="p-2.5 rounded-xl bg-slate-900 border border-white/10 text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="text-xs font-bold uppercase tracking-widest text-cyan-400 flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5" /> High-Speed Racing Net
            </div>
            <h2 className="font-display font-extrabold text-2xl text-white">
              Multiplayer Circuit
            </h2>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Server Config Button */}
          <button
            onClick={() => setShowServerModal(true)}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-900 border border-white/10 hover:border-cyan-400/50 text-slate-300 hover:text-white transition-all text-xs font-mono font-bold"
            title="Configure Multiplayer Server URL"
          >
            <Globe className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden sm:inline">SERVER:</span>
            <span className={provider === 'supabase' ? 'text-emerald-400 font-bold' : provider === 'custom_ws' ? 'text-cyan-400 font-bold' : 'text-slate-400'}>
              {provider === 'supabase'
                ? '⚡ SUPABASE (GLOBAL)'
                : provider === 'custom_ws'
                ? '🌐 MY SITE (dpdns.org)'
                : '💻 LOCAL (127.0.0.1)'}
            </span>
          </button>

          {mpRoom && (
            <button
              onClick={handleCopyCode}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 border border-cyan-400/40 text-cyan-300 font-mono font-bold text-xs shadow-neon-cyan transition-all"
            >
              <span>ROOM: {mpRoom.code}</span>
              {copied ? <CheckCheck className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          )}
        </div>
      </div>

      {/* VIEW 1: NOT IN ROOM (LOBBY DISCOVERY) */}
      {!mpRoom && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Create Room Card */}
          <div className="glass-panel p-8 rounded-3xl border border-white/10 flex flex-col justify-between gap-6 hover:border-cyan-400/40 transition-all">
            <div>
              <div className="w-14 h-14 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 flex items-center justify-center mb-4">
                <Plus className="w-7 h-7" />
              </div>
              <h3 className="font-display font-black text-2xl text-white">
                Host a Private Room
              </h3>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                Create a high-speed lobby. Opponents can join using your 5-character room code over LAN or direct connection.
              </p>
            </div>

            <button
              onClick={() => createMpRoom('race')}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black font-display font-black text-sm tracking-wide shadow-neon-cyan flex items-center justify-center gap-2 transition-all"
            >
              <span>CREATE RACE LOBBY</span>
            </button>
          </div>

          {/* Join Room Card */}
          <div className="glass-panel p-8 rounded-3xl border border-white/10 flex flex-col justify-between gap-6 hover:border-purple-400/40 transition-all">
            <div>
              <div className="w-14 h-14 rounded-2xl bg-purple-500/10 border border-purple-500/30 text-purple-400 flex items-center justify-center mb-4">
                <LogIn className="w-7 h-7" />
              </div>
              <h3 className="font-display font-black text-2xl text-white">
                Join Active Race
              </h3>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                Enter your opponent's 5-character match code to enter their lobby.
              </p>

              <input
                type="text"
                placeholder="ENTER CODE (e.g. 7XK9A)"
                maxLength={5}
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                className="w-full mt-4 bg-slate-900 border border-white/15 focus:border-purple-400 rounded-2xl px-4 py-3 font-mono font-bold text-center text-lg text-white uppercase tracking-widest focus:outline-none transition-colors"
              />
            </div>

            <button
              onClick={() => joinCode.length >= 3 && joinMpRoom(joinCode)}
              disabled={joinCode.length < 3}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-400 hover:to-indigo-500 text-white font-display font-black text-sm tracking-wide shadow-neon-purple disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all"
            >
              <span>CONNECT TO ROOM</span>
            </button>
          </div>

        </div>
      )}

      {/* VIEW 2: LOBBY & WAITING ROOM */}
      {mpRoom && !isMpRacing && !mpPodium && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Opponents & Gamer Cards (2 Cols) */}
          <div className="lg:col-span-2 flex flex-col gap-4">
            <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-400">
              <span>Racers In Room ({playersList.length}/8)</span>
              <span>Status</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {playersList.map((player) => {
                const isHost = player.id === mpRoom.host;
                const isMe = player.name === user.name;

                return (
                  <motion.div
                    key={player.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="glass-panel p-5 rounded-2xl border border-white/10 flex items-center justify-between gap-3 bg-slate-950/60"
                  >
                    <div className="flex items-center gap-3.5">
                      <div className="w-12 h-12 rounded-2xl bg-slate-900 border border-cyan-400/30 flex items-center justify-center text-2xl shadow-neon-cyan shrink-0">
                        {player.avatar || '⚡'}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-display font-bold text-sm text-white">
                            {player.name}
                          </span>
                          {isHost && <Crown className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />}
                          {isMe && <span className="text-[10px] bg-cyan-500/20 text-cyan-300 px-1 rounded font-mono font-bold">YOU</span>}
                        </div>
                        <div className="text-[11px] font-mono mt-0.5" style={{ color: player.rank_color || '#00f5ff' }}>
                          {player.rank || 'Novice Typer'} • Lvl {player.level || 1}
                        </div>
                        <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                          Wins: {player.races_won || 0} • Best: {player.best_wpm || 0} WPM
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      {player.ready ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-950/60 border border-emerald-500/40 text-emerald-400 text-[10px] font-bold">
                          <Check className="w-3 h-3" /> Ready
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 rounded-full bg-slate-900 text-slate-500 text-[10px] font-bold">
                          Pending
                        </span>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {/* Launch / Ready Controls */}
            <div className="mt-4 flex gap-3">
              <button
                onClick={toggleMpReady}
                className="flex-1 py-3.5 rounded-2xl glass-panel hover:border-cyan-400/40 font-display font-bold text-sm text-cyan-300 transition-all"
              >
                TOGGLE READY STATUS
              </button>

              {mpIsHost && (
                <button
                  onClick={startMpRace}
                  className="flex-1 py-3.5 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black font-display font-black text-sm tracking-wide shadow-neon-cyan flex items-center justify-center gap-2 transition-all"
                >
                  <Play className="w-4 h-4 fill-black" />
                  <span>START MULTIPLAYER RACE</span>
                </button>
              )}
            </div>

            {mpCountdown !== null && (
              <div className="text-center py-6">
                <span className="font-display font-black text-7xl text-cyan-400 text-glow-cyan animate-ping">
                  {mpCountdown}
                </span>
              </div>
            )}
          </div>

          {/* In-Room Chat (1 Col) */}
          <div className="glass-panel p-5 rounded-2xl border border-white/10 flex flex-col justify-between h-96">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-400 pb-2 border-b border-white/10">
              Lobby Chatter
            </div>

            <div className="flex-1 overflow-y-auto py-3 flex flex-col gap-2.5 pr-2">
              {mpChatMessages.map((msg, i) => (
                <div key={i} className="text-xs">
                  <span className="mr-1">{msg.avatar}</span>
                  <b className="text-cyan-300 mr-1">{msg.sender}:</b>
                  <span className="text-slate-300">{msg.text}</span>
                </div>
              ))}
            </div>

            <form onSubmit={handleSendChat} className="flex gap-2 pt-2 border-t border-white/10">
              <input
                type="text"
                placeholder="Send a quick message..."
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                className="flex-1 bg-slate-900 border border-white/10 focus:border-cyan-400 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none"
              />
              <button
                type="submit"
                className="p-2 rounded-xl bg-cyan-500/20 text-cyan-300 border border-cyan-400/40"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>

        </div>
      )}

      {/* VIEW 3: LIVE RACE ARENA */}
      {isMpRacing && (
        <div className="flex flex-col gap-6">
          
          {/* Dynamic Race Track Lanes */}
          <div className="glass-panel p-6 rounded-3xl border border-cyan-500/30 flex flex-col gap-3">
            <div className="text-xs font-bold uppercase tracking-wider text-cyan-400 mb-1">
              Live Race Telemetry
            </div>

            {playersList.map((p) => {
              const isMe = p.name === user.name;
              return (
                <div key={p.id} className="relative py-2">
                  <div className="flex items-center justify-between text-xs font-mono mb-1">
                    <span className="flex items-center gap-1.5 font-bold text-white">
                      <span>{p.avatar || '🏎️'}</span>
                      <span>{p.name} {isMe && '(YOU)'}</span>
                    </span>
                    <span className="text-cyan-400 font-bold">{p.wpm || 0} WPM • {p.progress || 0}%</span>
                  </div>

                  {/* Track Lane */}
                  <div className="w-full h-3 bg-slate-950 rounded-full border border-white/10 overflow-hidden relative p-0.5">
                    <motion.div
                      className={`h-full rounded-full ${
                        isMe 
                          ? 'bg-gradient-to-r from-cyan-500 to-blue-500 shadow-neon-cyan' 
                          : 'bg-gradient-to-r from-purple-500 to-pink-500'
                      }`}
                      animate={{ width: `${Math.max(2, p.progress || 0)}%` }}
                      transition={{ type: 'spring', stiffness: 100, damping: 20 }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Typing Display Box */}
          <div className="glass-panel p-8 rounded-3xl border border-white/15 relative">
            <input
              type="text"
              value=""
              onChange={() => {}}
              onKeyDown={(e) => {
                if (e.key === 'Backspace') {
                  e.preventDefault();
                  handleKeyInput('', true);
                } else if (e.key === ' ') {
                  e.preventDefault();
                  handleKeyInput(' ');
                } else if (e.key.length === 1 && !e.ctrlKey && !e.altKey && !e.metaKey) {
                  e.preventDefault();
                  handleKeyInput(e.key);
                }
              }}
              autoFocus
              className="absolute inset-0 opacity-0 cursor-default"
            />

            <div className="font-mono text-xl leading-relaxed flex flex-wrap gap-x-3 gap-y-2 select-none">
              {words.map((word, wIdx) => {
                const isCompleted = wIdx < currentWordIndex;
                const isCurrent = wIdx === currentWordIndex;

                if (isCompleted) {
                  return <span key={wIdx} className="text-slate-500">{word}</span>;
                }
                if (isCurrent) {
                  const targetLetters = word.split('');
                  const typedLetters = currentInput.split('');

                  return (
                    <span key={wIdx} className="bg-cyan-500/10 px-2 py-0.5 rounded-lg border border-cyan-400/40 text-white font-bold">
                      {targetLetters.map((char, cIdx) => {
                        const typedChar = typedLetters[cIdx];
                        const isTyped = typedChar !== undefined;
                        const isCorrect = typedChar === char;

                        return (
                          <span
                            key={cIdx}
                            className={
                              !isTyped
                                ? 'text-slate-300'
                                : isCorrect
                                ? 'text-cyan-300 text-glow-cyan'
                                : 'text-red-400 bg-red-950/60 px-0.5 rounded'
                            }
                          >
                            {char}
                          </span>
                        );
                      })}
                    </span>
                  );
                }
                return <span key={wIdx} className="text-slate-600">{word}</span>;
              })}
            </div>
          </div>

        </div>
      )}

      {/* VIEW 4: PODIUM CELEBRATION */}
      {mpPodium && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass-panel p-8 rounded-3xl border border-amber-500/40 text-center flex flex-col items-center gap-6 shadow-[0_0_60px_rgba(245,158,11,0.15)]"
        >
          <div className="text-xs font-bold uppercase tracking-widest text-amber-400 flex items-center gap-1.5">
            <Trophy className="w-4 h-4" /> Race Finished
          </div>

          <h3 className="font-display font-black text-4xl text-white">
            Grand Prix Podium Standings
          </h3>

          <div className="flex flex-wrap items-end justify-center gap-4 my-6">
            {mpPodium.map((racer, idx) => (
              <div
                key={idx}
                className={`glass-panel p-5 rounded-2xl border flex flex-col items-center gap-2 ${
                  idx === 0
                    ? 'border-amber-400 bg-amber-950/20 shadow-neon-amber order-2 h-64 justify-end'
                    : idx === 1
                    ? 'border-slate-300 bg-slate-900/40 order-1 h-56 justify-end'
                    : 'border-amber-700 bg-amber-950/10 order-3 h-48 justify-end'
                }`}
                style={{ width: '170px' }}
              >
                <div className="text-4xl mb-2">{racer.avatar || '🏎️'}</div>
                <div className="font-display font-black text-base text-white truncate max-w-full">
                  {racer.name}
                </div>
                <div className="text-xs font-mono text-cyan-400 font-bold">
                  {racer.wpm} WPM
                </div>
                <div
                  className={`px-3 py-1 rounded-full text-xs font-bold uppercase font-mono ${
                    idx === 0
                      ? 'bg-amber-500 text-black'
                      : idx === 1
                      ? 'bg-slate-300 text-black'
                      : 'bg-amber-800 text-white'
                  }`}
                >
                  #{idx + 1} Place
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={() => useGameStore.setState({ mpPodium: null, isMpRacing: false })}
            className="px-8 py-3 rounded-2xl bg-cyan-500 hover:bg-cyan-400 text-black font-display font-extrabold text-sm shadow-neon-cyan transition-all"
          >
            RETURN TO ROOM LOBBY
          </button>
        </motion.div>
      )}

      {/* SERVER SETTINGS MODAL */}
      <AnimatePresence>
        {showServerModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="glass-panel w-full max-w-xl p-6 rounded-3xl border border-cyan-400/40 flex flex-col gap-5 shadow-2xl relative"
            >
              {/* Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 flex items-center justify-center">
                    <Server className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-display font-black text-lg text-white">
                      Multiplayer Network Configuration
                    </h3>
                    <p className="text-xs text-slate-400">
                      Select how your client synchronizes multiplayer races
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setShowServerModal(false)}
                  className="p-2 rounded-xl bg-slate-900 border border-white/10 text-slate-400 hover:text-white transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Provider Choices */}
              <div className="flex flex-col gap-3">
                {/* Option 1: Supabase Realtime */}
                <div
                  onClick={() => handleSelectProvider('supabase')}
                  className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                    provider === 'supabase'
                      ? 'bg-cyan-500/10 border-cyan-400 shadow-neon-cyan/20'
                      : 'bg-slate-900/60 border-white/10 hover:border-white/20'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-white flex items-center gap-1.5">
                        ⚡ Supabase Realtime (Global Cloud)
                      </span>
                      <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-mono font-bold uppercase tracking-wider">
                        Active & Recommended
                      </span>
                    </div>
                    {provider === 'supabase' && <Check className="w-4 h-4 text-cyan-400" />}
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Zero-configuration global multiplayer. Seamlessly connects players worldwide across firewalls via Supabase Realtime (<code className="text-cyan-300 font-mono text-[11px]">hvukxajztizsuhfubjws.supabase.co</code>).
                  </p>
                </div>

                {/* Option 2: Custom Website / Domain */}
                <div
                  onClick={() => setProviderState('custom_ws')}
                  className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                    provider === 'custom_ws'
                      ? 'bg-cyan-500/10 border-cyan-400 shadow-neon-cyan/20'
                      : 'bg-slate-900/60 border-white/10 hover:border-white/20'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-white flex items-center gap-1.5">
                        🌐 Custom Site / Domain Relay
                      </span>
                      <span className="px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-400 text-[10px] font-mono font-bold uppercase tracking-wider">
                        advancedlogiclabs.dpdns.org
                      </span>
                    </div>
                    {provider === 'custom_ws' && <Check className="w-4 h-4 text-cyan-400" />}
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed mb-3">
                    Connect directly to your hosted website domain or dedicated WebSocket server instance.
                  </p>
                  
                  {provider === 'custom_ws' && (
                    <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="text"
                        placeholder="e.g. wss://advancedlogiclabs.dpdns.org:8765"
                        value={serverUrlInput}
                        onChange={(e) => setServerUrlInput(e.target.value)}
                        className="flex-1 bg-black/60 border border-white/20 focus:border-cyan-400 rounded-xl px-3 py-2 font-mono text-xs text-white placeholder:text-slate-600 focus:outline-none"
                      />
                      <button
                        onClick={handleSaveCustomServer}
                        className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-mono font-bold text-xs shadow-neon-cyan transition-all"
                      >
                        Apply
                      </button>
                    </div>
                  )}
                </div>

                {/* Option 3: Local Offline */}
                <div
                  onClick={() => handleSelectProvider('local')}
                  className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                    provider === 'local'
                      ? 'bg-cyan-500/10 border-cyan-400 shadow-neon-cyan/20'
                      : 'bg-slate-900/60 border-white/10 hover:border-white/20'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-white flex items-center gap-1.5">
                        💻 Localhost / LAN (<code className="text-slate-300 font-mono text-[11px]">127.0.0.1:8765</code>)
                      </span>
                      <span className="px-2 py-0.5 rounded-full bg-slate-700 text-slate-300 text-[10px] font-mono font-bold uppercase tracking-wider">
                        Offline Fallback
                      </span>
                    </div>
                    {provider === 'local' && <Check className="w-4 h-4 text-cyan-400" />}
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Uses the built-in Python background WebSocket server for local machine races or LAN testing.
                  </p>
                </div>
              </div>

              {/* Status Message */}
              {serverStatusMsg && (
                <div className="px-4 py-2.5 rounded-xl bg-slate-900 border border-cyan-400/30 text-xs font-mono text-cyan-300 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                  {serverStatusMsg}
                </div>
              )}

              {/* Footer Button */}
              <div className="flex justify-end pt-2">
                <button
                  onClick={() => setShowServerModal(false)}
                  className="px-6 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-mono text-xs font-bold transition-all"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};
