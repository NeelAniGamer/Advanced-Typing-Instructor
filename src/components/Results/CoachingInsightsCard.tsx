import React from 'react';
import { useGameStore } from '../../stores/useGameStore';
import { 
  Bot, 
  Sparkles, 
  Clock, 
  Activity, 
  Lightbulb, 
  CheckCircle, 
  ChevronRight,
  ShieldCheck
} from 'lucide-react';

export const CoachingInsightsCard: React.FC = () => {
  const { coachingInsights, casingStyle, lastSession } = useGameStore();

  if (!coachingInsights) {
    return (
      <div className="glass-panel p-6 rounded-2xl border border-cyan-500/20 bg-slate-900/50 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center text-cyan-300">
            <Bot className="w-5 h-5 text-cyan-400" />
          </div>
          <div>
            <div className="text-xs font-mono font-bold uppercase tracking-wider text-cyan-400">
              PerceptusLM AI Coach
            </div>
            <div className="text-xs text-slate-400 mt-0.5">
              Analyzing keystroke intervals, shift synchronization, and cadence rhythm...
            </div>
          </div>
        </div>
      </div>
    );
  }

  const { headline, summary, tips, shift_latency_ms, rhythm_score, style_alignment } = coachingInsights;

  return (
    <div className="glass-panel p-6 rounded-3xl border border-cyan-500/30 bg-slate-950/90 shadow-[0_0_40px_rgba(0,245,255,0.08)] flex flex-col gap-4 relative overflow-hidden">
      
      {/* Subtle background glow */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2 border-b border-white/10 pb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center text-cyan-300 shadow-neon-cyan flex-shrink-0">
            <Bot className="w-5 h-5 text-cyan-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-cyan-400">
                AI Coaching Insights & Telemetry
              </span>
              <span className="px-2 py-0.2 rounded-full bg-cyan-500/10 border border-cyan-400/20 text-[10px] font-mono text-cyan-300 font-bold">
                {style_alignment || `Tuned for ${casingStyle.replace('_', ' ')}`}
              </span>
            </div>
            <h3 className="text-base font-display font-bold text-white mt-0.5">
              {headline}
            </h3>
          </div>
        </div>

        {/* Telemetry quick badges */}
        <div className="flex items-center gap-2 font-mono text-xs">
          {shift_latency_ms !== undefined && (
            <div className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-black/40 border border-white/10 text-slate-300">
              <Clock className="w-3.5 h-3.5 text-cyan-400" />
              <span>Shift Latency: <b className="text-cyan-300">{shift_latency_ms}ms</b></span>
            </div>
          )}
          {rhythm_score !== undefined && (
            <div className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-black/40 border border-white/10 text-slate-300">
              <Activity className="w-3.5 h-3.5 text-emerald-400" />
              <span>RCI: <b className="text-emerald-300">{rhythm_score}/100</b></span>
            </div>
          )}
        </div>
      </div>

      {/* Summary Narrative */}
      <p className="text-xs text-slate-300 leading-relaxed font-sans">
        {summary}
      </p>

      {/* Actionable Tips */}
      {tips && tips.length > 0 && (
        <div className="space-y-2 pt-1">
          <div className="text-[11px] font-mono uppercase tracking-wider text-slate-400 font-semibold flex items-center gap-1.5">
            <Lightbulb className="w-3.5 h-3.5 text-amber-400" /> Key Coaching Recommendations:
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {tips.map((tip, idx) => (
              <div 
                key={idx}
                className="p-3 rounded-xl bg-black/40 border border-white/5 text-xs text-slate-300 flex items-start gap-2 leading-relaxed hover:border-cyan-500/30 transition-colors"
              >
                <ChevronRight className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0 mt-0.5" />
                <span>{tip}</span>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
};
