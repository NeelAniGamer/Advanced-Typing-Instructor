import React, { Component, ErrorInfo, ReactNode } from 'react';
import { RotateCcw, Map, AlertTriangle } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallbackScreen?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[ATI ErrorBoundary] Uncaught interface exception:', error, errorInfo);
  }

  private handleReset = (targetScreen: 'map' | 'game' = 'map') => {
    this.setState({ hasError: false, error: null });
    try {
      const store = (window as any).__ati_game_store;
      if (store && store.getState) {
        store.getState().setScreen(targetScreen);
      } else {
        window.location.reload();
      }
    } catch {
      window.location.reload();
    }
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="max-w-xl mx-auto my-12 px-4 flex flex-col items-center justify-center text-center">
          <div className="glass-panel w-full p-8 rounded-3xl border border-cyan-500/30 shadow-[0_0_50px_rgba(0,245,255,0.15)] flex flex-col items-center gap-6">
            <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 border border-cyan-400/40 flex items-center justify-center text-cyan-400 shadow-neon-cyan">
              <AlertTriangle className="w-8 h-8" />
            </div>

            <div>
              <h2 className="text-2xl font-display font-black text-white tracking-wide">
                Session Complete
              </h2>
              <p className="text-sm text-slate-400 mt-2">
                Your typing telemetry was saved. The interface encountered a display refresh glitch.
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-3 w-full pt-2">
              <button
                onClick={() => this.handleReset('map')}
                className="flex-1 min-w-[140px] flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 text-black font-display font-extrabold text-sm shadow-neon-cyan hover:brightness-110 transition-all"
              >
                <Map className="w-4 h-4" />
                <span>Level Map</span>
              </button>

              <button
                onClick={() => this.handleReset('game')}
                className="flex-1 min-w-[140px] flex items-center justify-center gap-2 px-5 py-3 rounded-2xl glass-panel hover:bg-white/10 text-slate-200 border border-white/10 font-semibold text-sm transition-all"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Next Session</span>
              </button>
            </div>

            {this.state.error && (
              <details className="w-full text-left mt-2">
                <summary className="text-[11px] font-mono text-slate-500 cursor-pointer hover:text-slate-300">
                  Diagnostics Data
                </summary>
                <pre className="mt-2 p-3 rounded-xl bg-black/60 border border-white/5 text-[10px] font-mono text-red-400 overflow-x-auto">
                  {this.state.error.message || String(this.state.error)}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
