import React from 'react';
import { Users } from 'lucide-react';

interface EmptyStateProps {
  title: string;
  hint?: string;
}

// Shared empty-state (lobbies, friends, leaderboard) — one pattern.
export const EmptyState: React.FC<EmptyStateProps> = ({ title, hint }) => (
  <div className="p-8 rounded-2xl bg-slate-950/60 border border-dashed border-white/10 text-center flex flex-col items-center justify-center gap-2">
    <Users className="w-8 h-8 text-slate-600" />
    <span className="text-xs text-slate-400 font-mono">{title}</span>
    {hint && <span className="text-[11px] text-slate-500">{hint}</span>}
  </div>
);
