import React from 'react';
import {
  Server,
  Power,
  RotateCcw,
  Activity,
  CheckCircle2,
  XCircle,
  Sliders,
  AlertTriangle,
} from 'lucide-react';
import { BackendInstanceStats } from '../types';

interface BackendClusterProps {
  backends: BackendInstanceStats[];
  onToggleHealth: (backendId: string, isHealthy?: boolean) => void;
  onSetCapacity: (backendId: string, capacity: number) => void;
}

export const BackendCluster: React.FC<BackendClusterProps> = ({
  backends,
  onToggleHealth,
  onSetCapacity,
}) => {
  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 mb-6 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center space-x-2">
            <Server className="w-4 h-4 text-cyan-400" />
            <h3 className="text-sm font-bold text-slate-100">Downstream Backend Microservices</h3>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
              {backends.filter((b) => b.is_healthy).length}/{backends.length} Online
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Individual cluster worker instances. Test resiliency by simulating server outages or tuning capacity live.
          </p>
        </div>
      </div>

      {/* Grid of Backend Server Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3.5 mt-4">
        {backends.map((b) => {
          const isDown = !b.is_healthy;
          const util = b.utilization_pct;

          return (
            <div
              key={b.id}
              className={`p-3.5 rounded-xl border transition-all ${
                isDown
                  ? 'bg-rose-950/20 border-rose-500/40 shadow-sm shadow-rose-950'
                  : 'bg-slate-950/80 border-slate-800/90 hover:border-slate-700'
              }`}
            >
              {/* Header: ID & Health Toggle */}
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <span
                    className={`w-2 h-2 rounded-full ${
                      isDown ? 'bg-rose-500 animate-ping' : 'bg-emerald-400'
                    }`}
                  />
                  <span className="font-mono text-xs font-bold text-slate-200">{b.id}</span>
                </div>

                {/* Crash / Recover Button */}
                <button
                  onClick={() => onToggleHealth(b.id, !b.is_healthy)}
                  className={`flex items-center space-x-1 px-2 py-0.5 rounded text-[10px] font-semibold border transition-all cursor-pointer ${
                    isDown
                      ? 'bg-emerald-950/80 hover:bg-emerald-900 border-emerald-500/50 text-emerald-300'
                      : 'bg-rose-950/80 hover:bg-rose-900 border-rose-500/50 text-rose-300'
                  }`}
                  title={isDown ? 'Restore Server to Health' : 'Simulate Outage / Crash'}
                >
                  <Power className="w-2.5 h-2.5" />
                  <span>{isDown ? 'Recover' : 'Crash'}</span>
                </button>
              </div>

              {/* Sub-label */}
              <div className="text-[11px] text-slate-400 truncate mb-3">{b.name}</div>

              {/* Utilization Bar */}
              <div className="space-y-1 mb-3">
                <div className="flex items-center justify-between text-[11px] font-mono">
                  <span className="text-slate-400">Load Utilization</span>
                  <span
                    className={`font-semibold ${
                      isDown
                        ? 'text-rose-400'
                        : util > 85
                        ? 'text-rose-400'
                        : util > 60
                        ? 'text-amber-400'
                        : 'text-cyan-400'
                    }`}
                  >
                    {isDown ? 'CRASHED' : `${util}%`}
                  </span>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                  <div
                    className={`h-full transition-all duration-300 rounded-full ${
                      isDown
                        ? 'bg-rose-600 w-full'
                        : util > 85
                        ? 'bg-rose-500'
                        : util > 60
                        ? 'bg-amber-400'
                        : 'bg-cyan-400'
                    }`}
                    style={{ width: isDown ? '100%' : `${util}%` }}
                  />
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-2 text-[10px] font-mono pt-2 border-t border-slate-800/80">
                <div>
                  <span className="text-slate-500 block">In-Flight:</span>
                  <span className="text-slate-300 font-semibold">{b.in_flight} active</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Capacity:</span>
                  <span className="text-emerald-400 font-semibold">{b.capacity_rps} req/s</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Processed:</span>
                  <span className="text-slate-300 font-semibold">{b.processed_count}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Avg Latency:</span>
                  <span className="text-slate-300 font-semibold">{b.avg_latency_ms} ms</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
