import React from 'react';
import { Play, Square, CheckCircle, Clock, Zap, ArrowRight } from 'lucide-react';
import { DemoStatus } from '../types';

interface DemoBannerProps {
  demoStatus: DemoStatus | null;
  onRunDemo: () => void;
  onStopDemo: () => void;
}

export const DemoBanner: React.FC<DemoBannerProps> = ({
  demoStatus,
  onRunDemo,
  onStopDemo,
}) => {
  if (!demoStatus?.is_running) {
    return (
      <div className="bg-gradient-to-r from-slate-900 via-[#0d1627] to-slate-900 border border-slate-800 rounded-xl p-4 mb-6 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center space-x-3.5">
          <div className="p-2.5 rounded-lg bg-cyan-950/80 border border-cyan-500/30 text-cyan-400">
            <Zap className="w-5 h-5 text-cyan-400" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-100 flex items-center space-x-2">
              <span>Interactive Scripted Flash Crowd Demo</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800 font-mono">
                10 Phases • 45s
              </span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Automates normal traffic, sudden surge acceleration, token bucket throttling, virtual queue buffering, cache absorption, and backend failover.
            </p>
          </div>
        </div>

        <button
          onClick={onRunDemo}
          className="flex-shrink-0 flex items-center space-x-2 px-4 py-2 rounded-lg bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-semibold shadow-md transition-all border border-cyan-400/40 cursor-pointer active:scale-95"
        >
          <Play className="w-3.5 h-3.5 fill-current" />
          <span>Start Presentation Demo</span>
        </button>
      </div>
    );
  }

  const currentPhase = demoStatus.current_phase;
  const currentIdx = demoStatus.current_phase_index;
  const totalPhases = demoStatus.total_phases;
  const duration = currentPhase?.duration_sec || 5;
  const elapsed = demoStatus.elapsed_in_phase;
  const progressPct = Math.min(100, Math.round((elapsed / duration) * 100));

  return (
    <div className="bg-gradient-to-r from-slate-950 via-[#0b1528] to-slate-950 border border-cyan-500/40 rounded-xl p-4 mb-6 shadow-lg shadow-cyan-950/40 animate-pulse-subtle">
      {/* Header and Controls */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2.5">
          <span className="flex h-2.5 w-2.5 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-cyan-500"></span>
          </span>
          <span className="text-xs font-bold uppercase tracking-wider text-cyan-300 font-mono">
            LIVE DEMO IN PROGRESS — PHASE {currentIdx + 1} OF {totalPhases}
          </span>
        </div>

        <button
          onClick={onStopDemo}
          className="flex items-center space-x-1.5 px-3 py-1 rounded-md bg-rose-950/90 hover:bg-rose-900 border border-rose-500/50 text-rose-300 text-xs font-medium transition-all"
        >
          <Square className="w-3 h-3 fill-current" />
          <span>Exit Demo</span>
        </button>
      </div>

      {/* 10-Phase Stepper Dots / Bars */}
      <div className="grid grid-cols-10 gap-1.5 mb-3">
        {demoStatus.all_phases.map((phase, idx) => {
          const isDone = idx < currentIdx;
          const isCurrent = idx === currentIdx;

          return (
            <div key={idx} className="flex flex-col space-y-1">
              <div
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  isDone
                    ? 'bg-emerald-400'
                    : isCurrent
                    ? 'bg-cyan-400 shadow-sm shadow-cyan-400'
                    : 'bg-slate-800'
                }`}
              />
              <span
                className={`text-[9px] font-mono truncate text-center ${
                  isCurrent
                    ? 'text-cyan-300 font-semibold'
                    : isDone
                    ? 'text-emerald-400/80'
                    : 'text-slate-600'
                }`}
              >
                P{idx + 1}
              </span>
            </div>
          );
        })}
      </div>

      {/* Current Phase Highlight Box */}
      {currentPhase && (
        <div className="p-3 bg-slate-900/90 border border-slate-800 rounded-lg flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <h4 className="text-sm font-bold text-slate-100">{currentPhase.title}</h4>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800/60">
                {elapsed}s / {duration}s
              </span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">{currentPhase.description}</p>
          </div>

          <div className="flex-shrink-0 bg-slate-950 px-3 py-2 rounded-md border border-slate-800 text-right">
            <span className="text-[10px] uppercase font-mono text-slate-400 block">Focus Metric</span>
            <span className="text-xs font-semibold text-emerald-400">{currentPhase.key_metrics_focus}</span>
          </div>
        </div>
      )}
    </div>
  );
};
