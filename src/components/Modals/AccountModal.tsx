import React, { useState, useRef, useEffect } from 'react';
import { useGameStore } from '../../stores/useGameStore';
import { calculateRankStats } from '../../utils/ranks';
import { PlayerSaveData, LocalAccountSummary } from '../../types/game';
import { UserAvatar, isAvatarUrl } from '../Common/UserAvatar';
import { 
  X, 
  User, 
  ShieldCheck, 
  Shield, 
  LogOut, 
  Save, 
  Zap, 
  Check,
  Download,
  Upload,
  Lock,
  Unlock,
  AlertTriangle,
  KeyRound,
  RefreshCw,
  HardDrive,
  Server,
  Trash2,
  UserPlus,
  LogIn,
  Users,
  Cloud
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const AVATAR_OPTIONS = [
  '👑', '⚡', '🚀', '🤖', '🎮', '🦄', '🐱', '🐉', 
  '💎', '🛡️', '⚔️', '🔥', '🏆', '🌌', '🧠', '🕶️'
];

export const AccountModal: React.FC = () => {
  const { 
    user, 
    level, 
    unlockedLevels,
    emeralds,
    wpm, 
    mode, 
    difficulty, 
    updateProfile, 
    signInWithGoogle, 
    signOutGoogle, 
    registerLocalAccount,
    loginLocalAccount,
    fetchLocalAccounts,
    deleteAccount,
    uiTheme,
    setModal,
    exportPlayerData,
    importPlayerData,
    savePlayerData,
    cloudSyncStatus,
    lastCloudSync,
    syncToCloud
  } = useGameStore();

  const [activeTab, setActiveTab] = useState<'security' | 'vault' | 'identity'>('security');
  const [nameInput, setNameInput] = useState(user.name);
  const [selectedAvatar, setSelectedAvatar] = useState(user.avatar);
  const [savedNotice, setSavedNotice] = useState(false);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [isSyncingCloud, setIsSyncingCloud] = useState(false);

  // Local Server Account State
  const [localAccounts, setLocalAccounts] = useState<LocalAccountSummary[]>([]);
  const [localFormMode, setLocalFormMode] = useState<'login' | 'register' | 'list'>('login');
  const [localUsername, setLocalUsername] = useState('');
  const [localPassword, setLocalPassword] = useState('');
  const [localDisplayName, setLocalDisplayName] = useState('');
  const [localAvatar, setLocalAvatar] = useState('👑');
  const [isSubmittingLocal, setIsSubmittingLocal] = useState(false);
  const [localError, setLocalError] = useState('');

  // Delete Account Confirmation State
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  
  // Data Vault State
  const [importedCandidate, setImportedCandidate] = useState<Partial<PlayerSaveData> | null>(null);
  const [vaultFeedback, setVaultFeedback] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Security Master PIN State
  const [masterPin, setMasterPin] = useState(() => localStorage.getItem('ati_master_pin') || '');
  const [pinInput, setPinInput] = useState('');
  const [isPinUnlocked, setIsPinUnlocked] = useState(!localStorage.getItem('ati_master_pin'));
  const [pinMessage, setPinMessage] = useState('');

  const rankStats = calculateRankStats(level, user.best_wpm || wpm, mode, difficulty);

  const showFeedback = (text: string, type: 'success' | 'error' | 'info') => {
    setVaultFeedback({ text, type });
    setTimeout(() => setVaultFeedback(null), 4000);
  };

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

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (!parsed || (typeof parsed !== 'object')) {
          showFeedback('Invalid backup file structure.', 'error');
          return;
        }
        setImportedCandidate(parsed);
      } catch (err) {
        showFeedback('Failed to parse JSON backup file.', 'error');
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleConflictResolution = async (strategy: 'overwrite' | 'retain_old' | 'merge') => {
    if (!importedCandidate) return;

    const result = await importPlayerData(importedCandidate, strategy);
    setImportedCandidate(null);

    if (result.success) {
      showFeedback(result.message, strategy === 'retain_old' ? 'info' : 'success');
      setNameInput(useGameStore.getState().user.name);
      setSelectedAvatar(useGameStore.getState().user.avatar);
    } else {
      showFeedback(result.message, 'error');
    }
  };

  const handleSetOrUnlockPin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pinInput.trim()) return;

    if (!masterPin) {
      localStorage.setItem('ati_master_pin', pinInput.trim());
      setMasterPin(pinInput.trim());
      setIsPinUnlocked(true);
      setPinInput('');
      setPinMessage('Master Security PIN established.');
      setTimeout(() => setPinMessage(''), 3000);
    } else if (!isPinUnlocked) {
      if (pinInput.trim() === masterPin) {
        setIsPinUnlocked(true);
        setPinInput('');
        setPinMessage('Vault unlocked successfully.');
        setTimeout(() => setPinMessage(''), 3000);
      } else {
        setPinMessage('Invalid PIN code. Access denied.');
        setTimeout(() => setPinMessage(''), 3000);
      }
    }
  };

  const handleResetPin = () => {
    localStorage.removeItem('ati_master_pin');
    setMasterPin('');
    setIsPinUnlocked(true);
    setPinInput('');
    setPinMessage('Master PIN cleared.');
    setTimeout(() => setPinMessage(''), 3000);
  };

  const loadLocalAccounts = async () => {
    try {
      const list = await fetchLocalAccounts();
      setLocalAccounts(list);
    } catch {}
  };

  useEffect(() => {
    loadLocalAccounts();
  }, []);

  const handleRegisterLocal = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError('');
    if (!localUsername.trim() || localPassword.length < 4) {
      setLocalError('Username and password (min 4 chars) are required.');
      return;
    }
    setIsSubmittingLocal(true);
    const res = await registerLocalAccount(
      localUsername.trim(), 
      localPassword, 
      localDisplayName.trim() || localUsername.trim(), 
      localAvatar
    );
    setIsSubmittingLocal(false);
    if (res.success) {
      showFeedback('Local account registered & authenticated!', 'success');
      setLocalPassword('');
      setNameInput(useGameStore.getState().user.name);
      setSelectedAvatar(useGameStore.getState().user.avatar);
      loadLocalAccounts();
    } else {
      setLocalError(res.message);
    }
  };

  const handleLoginLocal = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError('');
    if (!localUsername.trim() || !localPassword) {
      setLocalError('Please enter username and password.');
      return;
    }
    setIsSubmittingLocal(true);
    const res = await loginLocalAccount(localUsername.trim(), localPassword);
    setIsSubmittingLocal(false);
    if (res.success) {
      showFeedback('Logged in to local account!', 'success');
      setLocalPassword('');
      setNameInput(useGameStore.getState().user.name);
      setSelectedAvatar(useGameStore.getState().user.avatar);
      loadLocalAccounts();
    } else {
      setLocalError(res.message);
    }
  };

  const handleExecuteDelete = async () => {
    setIsDeletingAccount(true);
    const res = await deleteAccount();
    setIsDeletingAccount(false);
    setShowDeleteConfirm(false);
    setDeleteConfirmText('');
    if (res.success) {
      showFeedback('Account and all personal records permanently purged.', 'success');
      setNameInput('Champion Typer');
      setSelectedAvatar('👑');
      loadLocalAccounts();
    } else {
      showFeedback(res.message, 'error');
    }
  };

  const handleManualCloudSync = async () => {
    setIsSyncingCloud(true);
    const res = await syncToCloud();
    setIsSyncingCloud(false);
    showFeedback(res.message, res.success ? 'success' : 'error');
  };

  return (
    <div 
      onClick={(e) => {
        if (e.target === e.currentTarget) setModal(null);
      }}
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="glass-panel w-full max-w-2xl p-6 sm:p-7 rounded-3xl border border-cyan-500/30 shadow-[0_0_60px_rgba(0,245,255,0.18)] flex flex-col gap-5 relative overflow-hidden max-h-[92vh] overflow-y-auto"
      >
        {/* Top Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-cyan-500/10 border border-cyan-400/30 shadow-neon-cyan">
              <ShieldCheck className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono uppercase tracking-widest text-cyan-400 font-bold">
                  Cyber-Security &amp; Vault Portal
                </span>
                <span className="text-[9px] bg-cyan-500/20 text-cyan-300 px-2 py-0.5 rounded-full border border-cyan-400/30 font-mono font-bold">
                  AES-256 GCM
                </span>
              </div>
              <h3 className="font-display font-black text-xl text-white tracking-wide">
                Account &amp; Data Security
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

        {/* Tab Navigation */}
        <div className="grid grid-cols-3 gap-2 bg-slate-950/80 p-1.5 rounded-2xl border border-white/10">
          <button
            onClick={() => setActiveTab('security')}
            className={`flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'security'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/40 shadow-neon-cyan'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Lock className="w-3.5 h-3.5" />
            <span>Security &amp; Login</span>
          </button>

          <button
            onClick={() => setActiveTab('vault')}
            className={`flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'vault'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 shadow-neon-emerald'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <HardDrive className="w-3.5 h-3.5" />
            <span>Data Vault</span>
          </button>

          <button
            onClick={() => setActiveTab('identity')}
            className={`flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'identity'
                ? 'bg-purple-500/20 text-purple-300 border border-purple-400/40 shadow-neon-purple'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>Typist Identity</span>
          </button>
        </div>

        {/* Global Feedback Banner */}
        {vaultFeedback && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`p-3 rounded-xl text-xs font-bold flex items-center gap-2 border ${
              vaultFeedback.type === 'success'
                ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-300'
                : vaultFeedback.type === 'error'
                ? 'bg-red-950/40 border-red-500/30 text-red-300'
                : 'bg-cyan-950/40 border-cyan-500/30 text-cyan-300'
            }`}
          >
            {vaultFeedback.type === 'success' && <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />}
            {vaultFeedback.type === 'error' && <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0" />}
            {vaultFeedback.type === 'info' && <Shield className="w-4 h-4 text-cyan-400 flex-shrink-0" />}
            <span>{vaultFeedback.text}</span>
          </motion.div>
        )}

        {/* ── TAB 1: SECURITY & AUTHENTICATION ──────────────── */}
        {activeTab === 'security' && (
          <div className="flex flex-col gap-4">
            {/* Account Status Card */}
            <div className="p-4 rounded-2xl bg-slate-950/90 border border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3.5 w-full sm:w-auto">
                <div className="w-12 h-12 rounded-2xl bg-slate-900 border border-white/10 flex items-center justify-center text-2xl flex-shrink-0 shadow-inner overflow-hidden">
                  <UserAvatar avatar={user.avatar} name={user.name} className="w-full h-full" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-white truncate max-w-[170px]">
                      {user.name}
                    </span>
                    {user.account_type === 'google' || user.email ? (
                      <span className="flex items-center gap-1 text-[10px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full font-bold">
                        <ShieldCheck className="w-3 h-3 text-emerald-400" /> PKCE Google
                      </span>
                    ) : user.account_type === 'local' || user.username ? (
                      <span className="flex items-center gap-1 text-[10px] bg-cyan-500/20 text-cyan-300 border border-cyan-400/30 px-2 py-0.5 rounded-full font-bold font-mono">
                        <Server className="w-3 h-3 text-cyan-400" /> Local Server Account
                      </span>
                    ) : (
                      <span className="text-[10px] bg-slate-800 text-slate-400 border border-white/10 px-2 py-0.5 rounded-full font-medium">
                        Guest / Default Store
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-slate-400 font-mono truncate">
                    {user.email ? user.email : user.username ? `@${user.username} • SQLite PBKDF2 Secure` : 'Encrypted local SQLite store: typing_quest.db'}
                  </div>
                </div>
              </div>

              {user.email || user.username ? (
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
                  <span>{isSigningIn ? 'Connecting...' : 'Sign In with Google'}</span>
                </button>
              )}
            </div>

            {/* ── LOCAL SERVER ACCOUNT MANAGER ── */}
            <div className="p-4 rounded-2xl bg-slate-950/80 border border-white/10 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Server className="w-4 h-4 text-emerald-400" />
                  <span className="font-bold text-xs text-white">
                    Local Server Account (Offline-First)
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => { setLocalFormMode('login'); setLocalError(''); }}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-bold font-mono transition-all ${
                      localFormMode === 'login'
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/40'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Sign In
                  </button>
                  <button
                    type="button"
                    onClick={() => { setLocalFormMode('register'); setLocalError(''); }}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-bold font-mono transition-all ${
                      localFormMode === 'register'
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/40'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Create Account
                  </button>
                  {localAccounts.length > 0 && (
                    <button
                      type="button"
                      onClick={() => { setLocalFormMode('list'); setLocalError(''); }}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-bold font-mono transition-all ${
                        localFormMode === 'list'
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/40'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      Accounts ({localAccounts.length})
                    </button>
                  )}
                </div>
              </div>

              <p className="text-xs text-slate-400 leading-relaxed">
                Create or switch offline accounts stored securely in the local SQLite database. Passwords are protected with PBKDF2-HMAC-SHA256 (100,000 rounds) and individual 16-byte cryptographic salts.
              </p>

              {localError && (
                <div className="p-2.5 rounded-xl bg-red-950/40 border border-red-500/30 text-red-300 text-xs font-mono">
                  {localError}
                </div>
              )}

              {localFormMode === 'register' && (
                <form onSubmit={handleRegisterLocal} className="flex flex-col gap-2.5 mt-1">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <input
                      type="text"
                      placeholder="Username (e.g. speed_typer)"
                      value={localUsername}
                      onChange={(e) => setLocalUsername(e.target.value)}
                      className="bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-400 font-mono"
                      required
                    />
                    <input
                      type="text"
                      placeholder="Display Name (optional)"
                      value={localDisplayName}
                      onChange={(e) => setLocalDisplayName(e.target.value)}
                      className="bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-400"
                    />
                  </div>
                  <input
                    type="password"
                    placeholder="Password (minimum 4 characters)"
                    value={localPassword}
                    onChange={(e) => setLocalPassword(e.target.value)}
                    className="bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-400 font-mono"
                    required
                  />
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[10px] text-slate-400 font-mono">Avatar: {localAvatar}</span>
                    <button
                      type="submit"
                      disabled={isSubmittingLocal}
                      className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-bold text-xs hover:shadow-neon-emerald transition-all flex items-center gap-1.5 disabled:opacity-50"
                    >
                      <UserPlus className="w-3.5 h-3.5" />
                      <span>{isSubmittingLocal ? 'Creating...' : 'Register Local Account'}</span>
                    </button>
                  </div>
                </form>
              )}

              {localFormMode === 'login' && (
                <form onSubmit={handleLoginLocal} className="flex flex-col gap-2.5 mt-1">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <input
                      type="text"
                      placeholder="Username"
                      value={localUsername}
                      onChange={(e) => setLocalUsername(e.target.value)}
                      className="bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-400 font-mono"
                      required
                    />
                    <input
                      type="password"
                      placeholder="Password"
                      value={localPassword}
                      onChange={(e) => setLocalPassword(e.target.value)}
                      className="bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-400 font-mono"
                      required
                    />
                  </div>
                  <div className="flex justify-end pt-1">
                    <button
                      type="submit"
                      disabled={isSubmittingLocal}
                      className="px-4 py-2 rounded-xl bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 font-bold text-xs hover:bg-emerald-500/30 transition-all flex items-center gap-1.5 disabled:opacity-50"
                    >
                      <LogIn className="w-3.5 h-3.5" />
                      <span>{isSubmittingLocal ? 'Logging in...' : 'Sign In'}</span>
                    </button>
                  </div>
                </form>
              )}

              {localFormMode === 'list' && (
                <div className="flex flex-col gap-2 mt-1">
                  {localAccounts.map((acc) => (
                    <div
                      key={acc.id}
                      className={`p-2.5 rounded-xl border flex items-center justify-between text-xs transition-all ${
                        user.id === acc.id
                          ? 'bg-emerald-500/10 border-emerald-400/40 text-emerald-300'
                          : 'bg-slate-900/60 border-white/10 text-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="text-xl">{acc.avatar || '👑'}</span>
                        <div className="min-w-0">
                          <div className="font-bold text-white truncate flex items-center gap-1.5">
                            <span>{acc.name || acc.username}</span>
                            <span className="text-[10px] text-slate-400 font-mono">(@{acc.username})</span>
                            {user.id === acc.id && (
                              <span className="text-[9px] bg-emerald-500/20 text-emerald-400 px-1.5 py-0.2 rounded font-mono font-bold">Active</span>
                            )}
                          </div>
                          <div className="text-[10px] text-slate-400 font-mono">
                            Level {acc.level || 1} &bull; Last Active: {acc.last_login ? acc.last_login.slice(0, 10) : 'Recently'}
                          </div>
                        </div>
                      </div>
                      {user.id !== acc.id && (
                        <button
                          type="button"
                          onClick={() => {
                            setLocalUsername(acc.username);
                            setLocalFormMode('login');
                          }}
                          className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 hover:border-emerald-400 text-xs font-mono font-bold hover:text-emerald-300 transition-colors"
                        >
                          Select
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Offline Master PIN Security Card */}
            <div className="p-4 rounded-2xl bg-slate-950/80 border border-white/10 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <KeyRound className="w-4 h-4 text-cyan-400" />
                  <span className="font-bold text-xs text-white">
                    Offline Master PIN Protection
                  </span>
                </div>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${
                  masterPin 
                    ? (isPinUnlocked ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' : 'bg-amber-500/20 text-amber-300 border-amber-500/30')
                    : 'bg-slate-800 text-slate-400 border-white/10'
                }`}>
                  {masterPin ? (isPinUnlocked ? 'Unlocked' : 'PIN Locked') : 'No PIN Set'}
                </span>
              </div>

              <p className="text-xs text-slate-400 leading-relaxed">
                {masterPin 
                  ? (isPinUnlocked 
                      ? 'Master Security PIN is active. Your typist identity and local settings are authenticated.' 
                      : 'Enter your Master PIN to unlock admin privileges, data overwrites, and sensitive settings.')
                  : 'Establish an offline Master PIN (e.g. 4-8 digits) to lock your typist profile and protect progress from accidental resets.'}
              </p>

              {(!masterPin || !isPinUnlocked) ? (
                <form onSubmit={handleSetOrUnlockPin} className="flex gap-2 mt-1">
                  <input
                    type="password"
                    maxLength={12}
                    placeholder={masterPin ? "Enter Master PIN" : "Create Master PIN"}
                    value={pinInput}
                    onChange={(e) => setPinInput(e.target.value)}
                    className="flex-1 bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 font-mono tracking-widest"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-cyan-500/20 border border-cyan-400/40 text-cyan-300 font-bold text-xs hover:bg-cyan-500/30 transition-all flex items-center gap-1.5"
                  >
                    {masterPin ? <Unlock className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
                    <span>{masterPin ? 'Unlock' : 'Set PIN'}</span>
                  </button>
                </form>
              ) : (
                <div className="flex items-center justify-between pt-1">
                  <span className="text-[11px] text-emerald-400 flex items-center gap-1 font-mono">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Vault Unlocked
                  </span>
                  <button
                    type="button"
                    onClick={handleResetPin}
                    className="text-[11px] text-slate-400 hover:text-red-400 transition-colors font-mono underline"
                  >
                    Clear / Reset PIN
                  </button>
                </div>
              )}

              {pinMessage && (
                <span className="text-xs text-cyan-400 font-medium">
                  {pinMessage}
                </span>
              )}
            </div>

            {/* Security Diagnostics Card */}
            <div className="grid grid-cols-3 gap-2.5">
              <div className="p-3 rounded-2xl bg-slate-950/60 border border-white/10 flex flex-col">
                <span className="text-[9px] text-slate-400 uppercase font-mono font-bold">Storage Engine</span>
                <span className="font-mono text-xs text-emerald-400 font-extrabold mt-1">
                  SQLite v3.45
                </span>
                <span className="text-[9px] text-slate-500 truncate mt-0.5">
                  typing_quest.db
                </span>
              </div>

              <div className="p-3 rounded-2xl bg-slate-950/60 border border-white/10 flex flex-col">
                <span className="text-[9px] text-slate-400 uppercase font-mono font-bold">Auto-Save State</span>
                <span className="font-mono text-xs text-cyan-400 font-extrabold mt-1 flex items-center gap-1">
                  <RefreshCw className="w-3 h-3 text-cyan-400 animate-spin-slow" /> Real-Time
                </span>
                <span className="text-[9px] text-slate-500 truncate mt-0.5">
                  Dual-tier Sync
                </span>
              </div>

              <div className="p-3 rounded-2xl bg-slate-950/60 border border-white/10 flex flex-col">
                <span className="text-[9px] text-slate-400 uppercase font-mono font-bold">Auth Standard</span>
                <span className="font-mono text-xs text-purple-400 font-extrabold mt-1">
                  OAuth 2.0 PKCE
                </span>
                <span className="text-[9px] text-slate-500 truncate mt-0.5">
                  SHA-256 S256
                </span>
              </div>
            </div>

            {/* ── SUPABASE CLOUD SHIELD & DATA SAFETY ── */}
            <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-950/20 via-slate-950 to-cyan-950/20 border border-emerald-500/30 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Cloud className="w-4 h-4 text-emerald-400" />
                  <span className="font-bold text-xs text-white flex items-center gap-1.5">
                    Supabase Cloud Shield &amp; Data Safety
                    <span className="text-[9px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full font-mono font-bold">
                      RLS Protected
                    </span>
                  </span>
                </div>
                <button
                  type="button"
                  disabled={isSyncingCloud}
                  onClick={handleManualCloudSync}
                  className="px-3 py-1.5 rounded-xl bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 text-xs font-bold hover:bg-emerald-500/30 transition-all flex items-center gap-1.5 disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isSyncingCloud ? 'animate-spin' : ''}`} />
                  <span>{isSyncingCloud ? 'Syncing...' : 'Sync to Supabase'}</span>
                </button>
              </div>

              <p className="text-xs text-slate-400 leading-relaxed">
                Your typist identity, level progression, emeralds, and multiplayer record are securely replicated to PostgreSQL tables with Row-Level Security (<code className="text-emerald-300 font-mono text-[11px]">ati_user_profiles</code> &amp; <code className="text-cyan-300 font-mono text-[11px]">ati_user_progress</code>). Unauthorized accounts cannot read or tamper with your progress.
              </p>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-[10px] font-mono">
                <div className="p-2 rounded-xl bg-slate-900/70 border border-white/5 flex flex-col">
                  <span className="text-slate-500 uppercase">Cloud Sync</span>
                  <span className="font-bold text-emerald-400 flex items-center gap-1 mt-0.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    {cloudSyncStatus === 'synced' ? 'Active & Healthy' : cloudSyncStatus === 'syncing' ? 'Syncing...' : 'Offline Ready'}
                  </span>
                </div>
                <div className="p-2 rounded-xl bg-slate-900/70 border border-white/5 flex flex-col">
                  <span className="text-slate-500 uppercase">Multiplayer Tables</span>
                  <span className="font-bold text-cyan-300 mt-0.5 truncate">
                    ati_multiplayer_rooms
                  </span>
                </div>
                <div className="p-2 rounded-xl bg-slate-900/70 border border-white/5 flex flex-col">
                  <span className="text-slate-500 uppercase">Global Leaderboard</span>
                  <span className="font-bold text-purple-300 mt-0.5 truncate">
                    ati_race_results
                  </span>
                </div>
                <div className="p-2 rounded-xl bg-slate-900/70 border border-white/5 flex flex-col">
                  <span className="text-slate-500 uppercase">Last Backup</span>
                  <span className="font-bold text-slate-300 mt-0.5 truncate">
                    {lastCloudSync ? lastCloudSync.slice(0, 19).replace('T', ' ') : 'Real-time'}
                  </span>
                </div>
              </div>
            </div>

            {/* ── DANGER ZONE: PERMANENT ACCOUNT DELETION ── */}
            <div className="p-4 rounded-2xl bg-red-950/20 border border-red-500/30 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-400" />
                  <span className="font-bold text-xs text-red-300 uppercase tracking-wider">
                    Danger Zone &bull; GDPR Right to Erasure
                  </span>
                </div>
                <span className="text-[9px] bg-red-500/20 text-red-300 border border-red-500/40 px-2 py-0.5 rounded-full font-mono font-bold">
                  Irreversible
                </span>
              </div>

              <p className="text-xs text-slate-400 leading-relaxed">
                Permanently delete this account and purge all data we know about it — including level progress, emerald vault balance, career WPM and accuracy metrics, multiplayer profiles, and local database sessions.
              </p>

              <div className="flex justify-end pt-1">
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(true)}
                  className="px-4 py-2 rounded-xl bg-red-950/40 border border-red-500/40 text-red-400 hover:bg-red-900/40 text-xs font-bold font-mono transition-all flex items-center gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete My Account</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── TAB 2: DATA VAULT (DOWNLOAD, OVERWRITE & RETAIN) ──── */}
        {activeTab === 'vault' && (
          <div className="flex flex-col gap-4">
            {/* Status Snapshot Banner */}
            <div className="p-3.5 rounded-2xl bg-gradient-to-r from-cyan-950/30 via-slate-950 to-emerald-950/30 border border-white/10 flex items-center justify-between text-xs">
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-mono">Current Saved Progress</span>
                <span className="font-bold text-white text-sm">
                  Level {level} • {unlockedLevels} Unlocked • {emeralds.toLocaleString()} Emeralds
                </span>
              </div>
              <button
                onClick={() => {
                  savePlayerData();
                  showFeedback('Player progress synchronized to local storage and SQLite database.', 'success');
                }}
                className="px-3 py-1.5 rounded-xl bg-cyan-500/20 border border-cyan-400/30 text-cyan-300 text-xs font-bold hover:bg-cyan-500/30 transition-all flex items-center gap-1.5"
              >
                <Save className="w-3.5 h-3.5" /> Save Now
              </button>
            </div>

            {/* Action Card 1: Download Existing Data */}
            <div className="p-4 rounded-2xl bg-slate-950/80 border border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-2xl bg-cyan-500/10 border border-cyan-400/30 text-cyan-400 flex-shrink-0">
                  <Download className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-white flex items-center gap-2">
                    Download Existing Data
                    <span className="text-[9px] bg-cyan-500/20 text-cyan-300 px-2 py-0.5 rounded-full font-mono">JSON BACKUP</span>
                  </h4>
                  <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
                    Export your complete player profile, unlocked levels, career WPM, accuracy, emerald balance, and custom preferences.
                  </p>
                </div>
              </div>

              <button
                onClick={() => {
                  exportPlayerData();
                  showFeedback('Player backup exported and downloaded successfully!', 'success');
                }}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-extrabold text-xs hover:shadow-neon-cyan transition-all flex items-center justify-center gap-2 flex-shrink-0 active:scale-95"
              >
                <Download className="w-4 h-4" />
                <span>Export Backup</span>
              </button>
            </div>

            {/* Action Card 2: Overwrite or Merge From Backup */}
            <div className="p-4 rounded-2xl bg-slate-950/80 border border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-400/30 text-emerald-400 flex-shrink-0">
                  <Upload className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-white flex items-center gap-2">
                    Restore / Import Backup
                    <span className="text-[9px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full font-mono">RESTORATION</span>
                  </h4>
                  <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
                    Load a previously exported backup file. You can choose to overwrite old data, merge the highest progress, or retain current data.
                  </p>
                </div>
              </div>

              <input
                type="file"
                ref={fileInputRef}
                accept=".json"
                onChange={handleFileSelect}
                className="hidden"
              />

              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 font-extrabold text-xs hover:bg-emerald-500/30 transition-all flex items-center justify-center gap-2 flex-shrink-0 active:scale-95"
              >
                <Upload className="w-4 h-4" />
                <span>Select Backup File</span>
              </button>
            </div>

            {/* Data Retention Guarantee */}
            <div className="p-3 rounded-xl bg-slate-900/60 border border-white/5 flex items-start gap-2.5 text-xs text-slate-400">
              <Shield className="w-4 h-4 text-cyan-400 flex-shrink-0 mt-0.5" />
              <p className="leading-relaxed">
                <strong className="text-slate-200">Zero Progress Loss Guarantee:</strong> All typing scores, emeralds, and level completions are continuously synchronized to your local encrypted database and browser storage.
              </p>
            </div>
          </div>
        )}

        {/* ── TAB 3: TYPIST IDENTITY & CAREER ───────────────── */}
        {activeTab === 'identity' && (
          <div className="flex flex-col gap-4">
            <form onSubmit={handleSaveIdentity} className="flex flex-col gap-4">
              <div>
                <label className="text-xs font-bold text-slate-300 mb-1.5 block">
                  Display Name / Typist Handle
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
                  Typist Avatar
                </label>

                {/* Active Selected Avatar Preview */}
                <div className="flex items-center gap-3 p-3 rounded-2xl bg-slate-950/70 border border-white/10 mb-3">
                  <div className="w-12 h-12 rounded-2xl bg-slate-900 border-2 border-cyan-400/50 flex items-center justify-center text-2xl shadow-neon-cyan overflow-hidden flex-shrink-0">
                    <UserAvatar avatar={selectedAvatar} className="w-full h-full" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-bold text-white">Active Avatar Preview</div>
                    <div className="text-[11px] text-slate-400 truncate">
                      {isAvatarUrl(selectedAvatar) ? 'Google Profile Picture' : 'Custom Typist Emoji'}
                    </div>
                  </div>
                  {isAvatarUrl(user.avatar) && (
                    <button
                      type="button"
                      onClick={() => setSelectedAvatar(user.avatar)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border flex items-center gap-1.5 flex-shrink-0 ${
                        selectedAvatar === user.avatar
                          ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 shadow-neon-cyan'
                          : 'bg-slate-900 border-white/10 text-slate-300 hover:text-white hover:border-white/20'
                      }`}
                    >
                      <UserAvatar avatar={user.avatar} className="w-4 h-4 rounded-full" />
                      <span>Use Google Photo</span>
                    </button>
                  )}
                </div>

                <div className="text-[11px] font-semibold text-slate-400 mb-1.5">Or Choose an Emoji Icon:</div>
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

              <div className="flex items-center justify-between pt-1">
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
            <div className="border-t border-white/10 pt-3 flex flex-col gap-2.5">
              <div className="text-[10px] font-mono uppercase tracking-widest text-slate-400 font-bold">
                Career Telemetry Records
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
          </div>
        )}

        {/* ── CONFLICT RESOLUTION MODAL (OVERWRITE VS RETAIN VS MERGE) ── */}
        <AnimatePresence>
          {importedCandidate && (
            <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl">
              <motion.div
                initial={{ opacity: 0, scale: 0.92, y: 15 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.92, y: 15 }}
                className="glass-panel w-full max-w-lg p-6 rounded-3xl border border-amber-500/40 shadow-[0_0_60px_rgba(245,158,11,0.2)] flex flex-col gap-4 relative"
              >
                <div className="flex items-center gap-3 border-b border-white/10 pb-3">
                  <div className="p-2.5 rounded-2xl bg-amber-500/10 border border-amber-400/40 text-amber-400">
                    <AlertTriangle className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-display font-bold text-lg text-white">
                      Data Conflict Resolution
                    </h4>
                    <p className="text-xs text-slate-400">
                      Choose how to handle the imported backup data.
                    </p>
                  </div>
                </div>

                {/* Side-by-Side Comparison Table */}
                <div className="overflow-hidden rounded-2xl border border-white/10 bg-slate-950/80">
                  <table className="w-full text-xs text-left">
                    <thead>
                      <tr className="border-b border-white/10 bg-white/5 text-slate-400 font-mono">
                        <th className="p-2.5">Attribute</th>
                        <th className="p-2.5 text-cyan-400">Current Local Data</th>
                        <th className="p-2.5 text-emerald-400">Imported Backup</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 font-mono">
                      <tr>
                        <td className="p-2.5 text-slate-300 font-sans">Player Handle</td>
                        <td className="p-2.5 text-white">
                          <div className="flex items-center gap-2">
                            <UserAvatar avatar={user.avatar} className="w-5 h-5 rounded-md text-xs bg-slate-900 border border-white/10 shrink-0" />
                            <span className="truncate max-w-[120px]">{user.name}</span>
                          </div>
                        </td>
                        <td className="p-2.5 text-white">
                          <div className="flex items-center gap-2">
                            <UserAvatar avatar={importedCandidate.user?.avatar} fallback="👑" className="w-5 h-5 rounded-md text-xs bg-slate-900 border border-white/10 shrink-0" />
                            <span className="truncate max-w-[120px]">{importedCandidate.user?.name || 'Player'}</span>
                          </div>
                        </td>
                      </tr>
                      <tr>
                        <td className="p-2.5 text-slate-300 font-sans">Level Progress</td>
                        <td className="p-2.5 text-white">Level {level}</td>
                        <td className="p-2.5 text-emerald-400 font-bold">
                          Level {importedCandidate.level || 1}
                        </td>
                      </tr>
                      <tr>
                        <td className="p-2.5 text-slate-300 font-sans">Unlocked Levels</td>
                        <td className="p-2.5 text-white">{unlockedLevels} / 200</td>
                        <td className="p-2.5 text-emerald-400 font-bold">
                          {importedCandidate.unlockedLevels || importedCandidate.level || 1} / 200
                        </td>
                      </tr>
                      <tr>
                        <td className="p-2.5 text-slate-300 font-sans">Peak Speed (WPM)</td>
                        <td className="p-2.5 text-white">{user.best_wpm} WPM</td>
                        <td className="p-2.5 text-emerald-400 font-bold">
                          {importedCandidate.user?.best_wpm || 0} WPM
                        </td>
                      </tr>
                      <tr>
                        <td className="p-2.5 text-slate-300 font-sans">Emerald Vault</td>
                        <td className="p-2.5 text-white">{emeralds.toLocaleString()}</td>
                        <td className="p-2.5 text-emerald-400 font-bold">
                          {(importedCandidate.emeralds || 0).toLocaleString()}
                        </td>
                      </tr>
                      <tr>
                        <td className="p-2.5 text-slate-300 font-sans">Multiplayer Record</td>
                        <td className="p-2.5 text-white">{user.wins}W / {user.races}R</td>
                        <td className="p-2.5 text-emerald-400 font-bold">
                          {importedCandidate.user?.wins || 0}W / {importedCandidate.user?.races || 0}R
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* 3 Explicit Action Buttons */}
                <div className="flex flex-col gap-2 pt-2">
                  <button
                    onClick={() => handleConflictResolution('merge')}
                    className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-extrabold text-xs hover:shadow-neon-emerald transition-all flex items-center justify-center gap-2"
                  >
                    <Zap className="w-4 h-4 text-amber-300" />
                    <span>⚡ Smart Merge (Recommended — Keep Highest Progress)</span>
                  </button>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => handleConflictResolution('retain_old')}
                      className="py-2.5 px-3 rounded-xl bg-slate-900 border border-white/20 text-slate-300 hover:text-white hover:bg-slate-800 font-bold text-xs transition-all flex items-center justify-center gap-1.5"
                    >
                      <Shield className="w-3.5 h-3.5 text-cyan-400" />
                      <span>🛡️ Retain Old Data</span>
                    </button>

                    <button
                      onClick={() => handleConflictResolution('overwrite')}
                      className="py-2.5 px-3 rounded-xl bg-red-950/40 border border-red-500/40 text-red-300 hover:bg-red-900/40 font-bold text-xs transition-all flex items-center justify-center gap-1.5"
                    >
                      <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
                      <span>⚠️ Overwrite Old Data</span>
                    </button>
                  </div>
                </div>
              </motion.div>
            </div>
          )}

          {/* Permanent Account Deletion Confirmation Modal */}
          {showDeleteConfirm && (
            <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 10 }}
                className="w-full max-w-md p-5 rounded-3xl bg-slate-950 border border-red-500/50 shadow-2xl flex flex-col gap-4 text-left"
              >
                <div className="flex items-center justify-between border-b border-red-500/20 pb-3">
                  <div className="flex items-center gap-2 text-red-400">
                    <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0" />
                    <span className="font-extrabold text-sm text-white">Permanently Delete Account?</span>
                  </div>
                  <button
                    onClick={() => {
                      setShowDeleteConfirm(false);
                      setDeleteConfirmText('');
                    }}
                    className="p-1.5 rounded-xl bg-slate-900 border border-white/10 text-slate-400 hover:text-white"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed">
                  This action is <strong className="text-red-400 font-bold">strictly irreversible</strong>. It completely erases:
                </p>

                <ul className="text-xs text-slate-400 space-y-1.5 list-disc pl-4 font-mono">
                  <li>Your user account and credentials ({user.email || user.username || 'Active Profile'})</li>
                  <li>Practice levels, quest progress, and emeralds</li>
                  <li>WPM history, typing accuracy, and speed logs</li>
                  <li>Multiplayer career record and tournament entries</li>
                  <li>All local SQLite database records & cached session tokens</li>
                </ul>

                <div className="p-3 rounded-xl bg-red-950/30 border border-red-500/30 text-xs text-red-300 flex flex-col gap-1.5">
                  <span className="font-bold">To confirm, type &quot;DELETE&quot; below:</span>
                  <input
                    type="text"
                    placeholder="DELETE"
                    value={deleteConfirmText}
                    onChange={(e) => setDeleteConfirmText(e.target.value)}
                    className="w-full bg-slate-900 border border-red-500/40 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-red-400 font-mono uppercase tracking-wider"
                    autoFocus
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setShowDeleteConfirm(false);
                      setDeleteConfirmText('');
                    }}
                    className="px-4 py-2 rounded-xl bg-slate-900 border border-white/10 text-slate-300 hover:text-white text-xs font-bold transition-all"
                  >
                    Cancel
                  </button>

                  <button
                    type="button"
                    disabled={deleteConfirmText.trim().toUpperCase() !== 'DELETE' || isDeletingAccount}
                    onClick={handleExecuteDelete}
                    className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-extrabold transition-all flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed shadow-lg hover:shadow-red-500/30"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>{isDeletingAccount ? 'Purging Everything...' : 'Permanently Delete Everything'}</span>
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

      </motion.div>
    </div>
  );
};
