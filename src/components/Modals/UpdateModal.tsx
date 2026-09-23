import React from 'react';
import { useGameStore } from '../../stores/useGameStore';
import { isOrganicTheme, APP_VERSION } from '../../utils/theme';
import { 
  X, 
  Sparkles, 
  Download, 
  RefreshCw, 
  CheckCircle2, 
  AlertCircle, 
  ArrowRight,
  ShieldCheck,
  Zap
} from 'lucide-react';
import { motion } from 'framer-motion';
import { Chip, ProgressBar } from '../HeroUI';
import { NumberTicker, StatusBadge } from '../SpectrumUI';

export const UpdateModal: React.FC = () => {
  const { 
    updateInfo, 
    isDownloadingUpdate,
    updateProgress,
    downloadSpeed,
    downloadBytes,
    isUpdateReady,
    updateError,
    downloadUpdate,
    applyUpdate,
    setModal,
    uiTheme
  } = useGameStore();

  const isOrganic = isOrganicTheme(uiTheme);
  const currentVer = APP_VERSION;
  const targetVer = updateInfo?.version || APP_VERSION;

  const formatMb = (bytes: number) => {
    if (!bytes || isNaN(bytes)) return '0.0 MB';
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) setModal(null);
      }}
      className={`fixed inset-0 z-[100] flex items-center justify-center p-4 backdrop-blur-xl transition-colors ${
        isOrganic ? 'bg-black/65' : 'bg-black/80'
      }`}
    >
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className={`relative w-full max-w-lg rounded-3xl overflow-hidden flex flex-col transition-all ${
          isOrganic
            ? 'bg-[#FAF8F5] border border-[#E5DFD7] text-[#333333] shadow-2xl'
            : 'bg-cyber-dark/95 border border-cyan-500/30 text-white shadow-[0_0_50px_rgba(0,245,255,0.15)]'
        }`}
      >
        {/* Top Glowing Header Accent */}
        <div
          className={`absolute top-0 left-0 right-0 h-1 animate-pulse ${
            isOrganic
              ? 'bg-gradient-to-r from-[#C97D5A] via-[#7C8D81] to-[#EBC078]'
              : 'bg-gradient-to-r from-cyan-500 via-emerald-400 to-purple-500'
          }`}
        />

        {/* Modal Header */}
        <div
          className={`p-6 border-b flex items-center justify-between transition-colors ${
            isOrganic
              ? 'bg-white border-[#E5DFD7]'
              : 'bg-black/40 border-cyber-light/10'
          }`}
        >
          <div className="flex items-center gap-3">
            <div
              className={`p-2.5 rounded-xl border ${
                isOrganic
                  ? 'bg-[#C97D5A]/15 border-[#C97D5A]/30 text-[#C97D5A]'
                  : 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400 shadow-[0_0_15px_rgba(0,245,255,0.2)]'
              }`}
            >
              <Zap className="w-6 h-6" />
            </div>
            <div>
              <h2
                className={`text-xl font-black tracking-wider flex items-center gap-2 ${
                  isOrganic ? 'text-[#333333]' : 'text-white'
                }`}
              >
                SYSTEM UPDATE
                <Chip size="sm" variant="solid" color={isOrganic ? 'primary' : 'primary'}>
                  LIVE OTA
                </Chip>
              </h2>
              <p
                className={`text-xs font-mono mt-0.5 ${
                  isOrganic ? 'text-[#616864]' : 'text-gray-400'
                }`}
              >
                Automated Over-The-Air Binary Dispatch
              </p>
            </div>
          </div>
          <button 
            onClick={() => setModal(null)}
            className={`p-2 rounded-xl transition-colors ${
              isOrganic
                ? 'bg-white border border-[#E5DFD7] text-[#616864] hover:text-[#333333] shadow-sm'
                : 'p-2 text-gray-400 hover:text-white bg-white/5 hover:bg-white/10'
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6">
          {/* Version Transition Banner */}
          <div
            className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${
              isOrganic
                ? 'bg-white border-[#E5DFD7]'
                : 'bg-gradient-to-r from-white/[0.03] to-cyan-950/20 border-cyan-500/20'
            }`}
          >
            <div>
              <div
                className={`text-[10px] font-mono uppercase tracking-widest ${
                  isOrganic ? 'text-[#7C8D81]' : 'text-gray-400'
                }`}
              >
                Current Build
              </div>
              <div
                className={`text-sm font-mono font-bold ${
                  isOrganic ? 'text-[#333333]' : 'text-gray-300'
                }`}
              >
                v{currentVer}
              </div>
            </div>
            <div
              className={`flex items-center gap-2 px-3 py-1 rounded-full border ${
                isOrganic
                  ? 'bg-[#C97D5A]/10 border-[#C97D5A]/30 text-[#C97D5A]'
                  : 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400'
              }`}
            >
              <ArrowRight className="w-4 h-4 animate-pulse" />
            </div>
            <div className="text-right">
              <div
                className={`text-[10px] font-mono uppercase tracking-widest font-bold ${
                  isOrganic ? 'text-[#C97D5A]' : 'text-emerald-400'
                }`}
              >
                New Release
              </div>
              <div
                className={`text-sm font-mono font-bold ${
                  isOrganic ? 'text-[#C97D5A]' : 'text-emerald-300'
                }`}
              >
                v{targetVer}
              </div>
            </div>
          </div>

          {/* Release Notes Card */}
          <div
            className={`rounded-2xl p-4 space-y-2 border transition-all ${
              isOrganic
                ? 'bg-white border-[#E5DFD7]'
                : 'bg-black/50 border-white/5'
            }`}
          >
            <div className="flex items-center justify-between text-xs font-mono">
              <span
                className={`flex items-center gap-1.5 font-bold ${
                  isOrganic ? 'text-[#C97D5A]' : 'text-cyan-400'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" /> Release Intel & Changelog
              </span>
              {updateInfo?.releaseDate && (
                <span
                  className={`text-[11px] ${
                    isOrganic ? 'text-[#7C8D81]' : 'text-gray-500'
                  }`}
                >
                  {updateInfo.releaseDate}
                </span>
              )}
            </div>
            <p
              className={`text-xs font-mono leading-relaxed whitespace-pre-line p-3 rounded-xl border ${
                isOrganic
                  ? 'bg-[#FAF8F5] border-[#E5DFD7] text-[#616864]'
                  : 'bg-white/[0.02] border-white/5 text-gray-300'
              }`}
            >
              {updateInfo?.changelog || 'Performance telemetry optimization, high-speed acoustic switch synthesizer enhancements, and verified tournament integrity.'}
            </p>
          </div>

          {/* Download & Install Telemetry Bar */}
          {isDownloadingUpdate && (
            <div
              className={`space-y-2 p-4 rounded-2xl border ${
                isOrganic
                  ? 'bg-white border-[#E5DFD7]'
                  : 'bg-cyan-950/20 border-cyan-500/30'
              }`}
            >
              <div className="flex items-center justify-between text-xs font-mono">
                <span
                  className={`flex items-center gap-2 ${
                    isOrganic ? 'text-[#C97D5A]' : 'text-cyan-400'
                  }`}
                >
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  Streaming Secure Payload...
                </span>
                <span
                  className={`font-bold ${
                    isOrganic ? 'text-[#C97D5A]' : 'text-cyan-300'
                  }`}
                >
                  <NumberTicker value={updateProgress} suffix="%" />
                </span>
              </div>

              {/* Progress Bar Container with HeroUI */}
              <ProgressBar
                value={updateProgress}
                minValue={0}
                maxValue={100}
                size="md"
                color={isOrganic ? 'primary' : 'primary'}
              />

              <div
                className={`flex items-center justify-between text-[11px] font-mono pt-1 ${
                  isOrganic ? 'text-[#7C8D81]' : 'text-gray-400'
                }`}
              >
                <span>{formatMb(downloadBytes.received)} / {formatMb(downloadBytes.total)}</span>
                <span
                  className={`font-semibold ${
                    isOrganic ? 'text-[#7C8D81]' : 'text-emerald-400'
                  }`}
                >
                  {downloadSpeed > 0 ? `${downloadSpeed} KB/s` : 'Connecting...'}
                </span>
              </div>
            </div>
          )}

          {/* Update Ready Success Banner */}
          {isUpdateReady && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className={`p-4 rounded-2xl border flex items-center gap-3 ${
                isOrganic
                  ? 'bg-[#7C8D81]/15 border-[#7C8D81]/40 text-[#333333]'
                  : 'bg-emerald-950/30 border-emerald-500/40 text-white'
              }`}
            >
              <CheckCircle2
                className={`w-6 h-6 shrink-0 ${
                  isOrganic ? 'text-[#7C8D81]' : 'text-emerald-400'
                }`}
              />
              <div>
                <div
                  className={`text-xs font-bold uppercase tracking-wide ${
                    isOrganic ? 'text-[#333333]' : 'text-emerald-300'
                  }`}
                >
                  Update Ready &bull; Installing &amp; Restarting Automatically...
                </div>
                <div
                  className={`text-[11px] ${
                    isOrganic ? 'text-[#616864]' : 'text-gray-400'
                  }`}
                >
                  Silently applying update in the background. The app will restart automatically.
                </div>
              </div>
            </motion.div>
          )}

          {/* Error Banner */}
          {updateError && (
            <div className="p-3 bg-red-950/30 border border-red-500/30 rounded-xl flex items-center gap-2 text-xs text-red-400 font-mono">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{updateError}</span>
            </div>
          )}

          {/* Security & Verification Seal */}
          <div
            className={`flex items-center justify-center gap-2 text-[11px] font-mono ${
              isOrganic ? 'text-[#7C8D81]' : 'text-gray-500'
            }`}
          >
            <ShieldCheck
              className={`w-3.5 h-3.5 ${
                isOrganic ? 'text-[#7C8D81]' : 'text-cyan-400'
              }`}
            />
            <span>SHA-256 Verified Payload &bull; Signed by Class Of Learners</span>
          </div>
        </div>

        {/* Modal Actions Footer */}
        <div
          className={`p-6 border-t flex items-center justify-end gap-3 transition-colors ${
            isOrganic
              ? 'bg-white border-[#E5DFD7]'
              : 'bg-black/40 border-cyber-light/10'
          }`}
        >
          <button 
            onClick={() => setModal(null)}
            className={`px-4 py-2.5 text-xs font-mono font-bold rounded-xl transition-colors ${
              isOrganic
                ? 'text-[#616864] hover:text-[#333333] hover:bg-[#F0EDE8]'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            {isUpdateReady ? 'Dismiss' : 'Later'}
          </button>

          {!isUpdateReady && !isDownloadingUpdate && (
            <button 
              onClick={() => downloadUpdate()}
              className={`px-6 py-2.5 text-xs font-mono font-bold rounded-xl transition-all flex items-center gap-2 font-black ${
                isOrganic
                  ? 'bg-[#C97D5A] hover:bg-[#b56d4c] text-white shadow-md'
                  : 'bg-gradient-to-r from-cyan-500 to-emerald-500 text-black hover:shadow-[0_0_20px_rgba(0,245,255,0.4)]'
              }`}
            >
              <Download className="w-4 h-4" />
              DOWNLOAD &amp; UPDATE NOW
            </button>
          )}

          {isDownloadingUpdate && (
            <button 
              disabled
              className={`px-6 py-2.5 text-xs font-mono font-bold rounded-xl flex items-center gap-2 cursor-not-allowed opacity-80 ${
                isOrganic
                  ? 'bg-[#C97D5A]/20 text-[#C97D5A] border border-[#C97D5A]/40'
                  : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
              }`}
            >
              <RefreshCw className="w-4 h-4 animate-spin" />
              DOWNLOADING ({updateProgress}%)
            </button>
          )}

          {isUpdateReady && (
            <button 
              onClick={() => applyUpdate()}
              className={`px-6 py-2.5 text-xs font-mono font-bold rounded-xl transition-all flex items-center gap-2 font-black animate-pulse ${
                isOrganic
                  ? 'bg-[#7C8D81] hover:bg-[#6a7a6e] text-white shadow-md'
                  : 'bg-gradient-to-r from-emerald-400 to-teal-400 text-black hover:shadow-[0_0_25px_rgba(52,211,153,0.5)]'
              }`}
            >
              <Zap className="w-4 h-4 animate-spin" />
              INSTALLING &amp; RESTARTING... 🚀
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
};
