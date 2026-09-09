import React from 'react';
import { useGameStore } from '../../stores/useGameStore';
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
    setModal 
  } = useGameStore();

  const currentVer = '2.5.0';
  const targetVer = updateInfo?.version || '2.5.0';

  const formatMb = (bytes: number) => {
    if (!bytes || isNaN(bytes)) return '0.0 MB';
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative w-full max-w-lg bg-cyber-dark/95 border border-cyan-500/30 rounded-2xl shadow-[0_0_50px_rgba(0,245,255,0.15)] overflow-hidden flex flex-col"
      >
        {/* Top Glowing Header Accent */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-cyan-500 via-emerald-400 to-purple-500 animate-pulse" />

        {/* Modal Header */}
        <div className="p-6 border-b border-cyber-light/10 flex items-center justify-between bg-black/40">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-cyan-500/10 border border-cyan-500/30 rounded-xl text-cyan-400 shadow-[0_0_15px_rgba(0,245,255,0.2)]">
              <Zap className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-black tracking-wider text-white flex items-center gap-2">
                SYSTEM UPDATE
                <span className="text-xs font-mono font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 px-2 py-0.5 rounded-full">
                  LIVE OTA
                </span>
              </h2>
              <p className="text-xs font-mono text-gray-400 mt-0.5">Automated Over-The-Air Binary Dispatch</p>
            </div>
          </div>
          <button 
            onClick={() => setModal(null)}
            className="p-2 text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6">
          {/* Version Transition Banner */}
          <div className="flex items-center justify-between p-4 bg-gradient-to-r from-white/[0.03] to-cyan-950/20 border border-cyan-500/20 rounded-xl">
            <div>
              <div className="text-[10px] font-mono uppercase tracking-widest text-gray-400">Current Build</div>
              <div className="text-sm font-mono font-bold text-gray-300">v{currentVer}</div>
            </div>
            <div className="flex items-center gap-2 px-3 py-1 bg-cyan-500/10 rounded-full border border-cyan-500/30">
              <ArrowRight className="w-4 h-4 text-cyan-400 animate-pulse" />
            </div>
            <div className="text-right">
              <div className="text-[10px] font-mono uppercase tracking-widest text-emerald-400 font-bold">New Release</div>
              <div className="text-sm font-mono font-bold text-emerald-300">v{targetVer}</div>
            </div>
          </div>

          {/* Release Notes Card */}
          <div className="bg-black/50 border border-white/5 rounded-xl p-4 space-y-2">
            <div className="flex items-center justify-between text-xs text-gray-400 font-mono">
              <span className="flex items-center gap-1.5 text-cyan-400 font-bold">
                <Sparkles className="w-3.5 h-3.5" /> Release Intel & Changelog
              </span>
              {updateInfo?.releaseDate && (
                <span className="text-[11px] text-gray-500">{updateInfo.releaseDate}</span>
              )}
            </div>
            <p className="text-xs text-gray-300 font-mono leading-relaxed whitespace-pre-line bg-white/[0.02] p-3 rounded-lg border border-white/5">
              {updateInfo?.changelog || 'Performance telemetry optimization, high-speed acoustic switch synthesizer enhancements, and verified tournament integrity.'}
            </p>
          </div>

          {/* Download & Install Telemetry Bar */}
          {isDownloadingUpdate && (
            <div className="space-y-2 p-4 bg-cyan-950/20 border border-cyan-500/30 rounded-xl">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-cyan-400 flex items-center gap-2">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  Streaming Secure Payload...
                </span>
                <span className="text-cyan-300 font-bold">{updateProgress}%</span>
              </div>

              {/* Progress Bar Container */}
              <div className="w-full h-3 bg-black/60 rounded-full overflow-hidden p-0.5 border border-cyan-500/30">
                <motion.div 
                  className="h-full bg-gradient-to-r from-cyan-500 via-teal-400 to-emerald-400 rounded-full shadow-[0_0_12px_rgba(0,245,255,0.6)]"
                  initial={{ width: 0 }}
                  animate={{ width: `${updateProgress}%` }}
                  transition={{ ease: 'easeOut', duration: 0.3 }}
                />
              </div>

              <div className="flex items-center justify-between text-[11px] font-mono text-gray-400 pt-1">
                <span>{formatMb(downloadBytes.received)} / {formatMb(downloadBytes.total)}</span>
                <span className="text-emerald-400 font-semibold">{downloadSpeed > 0 ? `${downloadSpeed} KB/s` : 'Connecting...'}</span>
              </div>
            </div>
          )}

          {/* Update Ready Success Banner */}
          {isUpdateReady && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className="p-4 bg-emerald-950/30 border border-emerald-500/40 rounded-xl flex items-center gap-3"
            >
              <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0" />
              <div>
                <div className="text-xs font-bold text-emerald-300 uppercase tracking-wide">Payload Verified & Staged</div>
                <div className="text-[11px] text-gray-400">Restart the application to complete seamless in-place installation.</div>
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
          <div className="flex items-center justify-center gap-2 text-[11px] font-mono text-gray-500">
            <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
            <span>SHA-256 Verified Payload &bull; Signed by Class Of Learners</span>
          </div>
        </div>

        {/* Modal Actions Footer */}
        <div className="p-6 border-t border-cyber-light/10 bg-black/40 flex items-center justify-end gap-3">
          <button 
            onClick={() => setModal(null)}
            className="px-4 py-2.5 text-xs font-mono font-bold text-gray-400 hover:text-white hover:bg-white/5 rounded-xl transition-colors"
          >
            {isUpdateReady ? 'Dismiss' : 'Later'}
          </button>

          {!isUpdateReady && !isDownloadingUpdate && (
            <button 
              onClick={() => downloadUpdate()}
              className="px-6 py-2.5 text-xs font-mono font-bold bg-gradient-to-r from-cyan-500 to-emerald-500 text-black rounded-xl hover:shadow-[0_0_20px_rgba(0,245,255,0.4)] transition-all flex items-center gap-2 font-black"
            >
              <Download className="w-4 h-4" />
              DOWNLOAD & UPDATE NOW
            </button>
          )}

          {isDownloadingUpdate && (
            <button 
              disabled
              className="px-6 py-2.5 text-xs font-mono font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 rounded-xl flex items-center gap-2 cursor-not-allowed opacity-80"
            >
              <RefreshCw className="w-4 h-4 animate-spin" />
              DOWNLOADING ({updateProgress}%)
            </button>
          )}

          {isUpdateReady && (
            <button 
              onClick={() => applyUpdate()}
              className="px-6 py-2.5 text-xs font-mono font-bold bg-gradient-to-r from-emerald-400 to-teal-400 text-black rounded-xl hover:shadow-[0_0_25px_rgba(52,211,153,0.5)] transition-all flex items-center gap-2 font-black animate-pulse"
            >
              <Zap className="w-4 h-4" />
              RESTART & APPLY UPDATE 🚀
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
};
