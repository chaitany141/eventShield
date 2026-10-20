import React from 'react';
import {
  ArrowDownRight,
  CheckCircle2,
  Clock,
  Database,
  Layers,
  Percent,
  Server,
  TrendingUp,
  XCircle,
  Zap,
} from 'lucide-react';
import { MetricsSnapshot } from '../types';

interface MetricCardsProps {
  snapshot: MetricsSnapshot | null;
}

export const MetricCards: React.FC<MetricCardsProps> = ({ snapshot }) => {
  const incomingRps = snapshot?.incoming_rps ?? 0;
  const processedRps = snapshot?.processed_rps ?? 0;
  const queuedCount = snapshot?.queued_count ?? 0;
  const rateLimitedRps = snapshot?.rate_limited_rps ?? 0;
  const avgLatency = snapshot?.avg_latency_ms ?? 0;
  const p95Latency = snapshot?.p95_latency_ms ?? 0;
  const cacheHitRatio = snapshot?.cache_hit_ratio_pct ?? 0;
  const backendUtil = snapshot?.backend_utilization_pct ?? 0;

  // Totals for secondary badges
  const totalProcessed = snapshot?.total_processed_success ?? 0;
  const totalRejected = (snapshot?.total_rate_limited ?? 0) + (snapshot?.total_queue_overflow ?? 0);
  const totalCached = snapshot?.total_cache_hits ?? 0;

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5 mb-6">
      {/* 1. Incoming Requests Per Second */}
      <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 shadow-sm hover:border-slate-700/80 transition-all">
        <div className="flex items-center justify-between text-slate-400 mb-2">
          <span className="text-xs font-medium text-slate-300">Incoming Traffic</span>
          <div className="p-1.5 rounded-md bg-blue-950/60 text-blue-400 border border-blue-800/40">
            <Zap className="w-3.5 h-3.5" />
          </div>
        </div>
        <div className="flex items-baseline space-x-2">
          <span className="text-2xl font-bold font-mono tracking-tight text-slate-900">{incomingRps}</span>
          <span className="text-xs font-mono text-slate-400">req/s</span>
        </div>
        <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-800/60">
          <span>Total Ingested:</span>
          <span className="font-mono text-slate-300">{snapshot?.total_generated ?? 0}</span>
        </div>
      </div>

      {/* 2. Successfully Processed */}
      <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 shadow-sm hover:border-slate-700/80 transition-all">
        <div className="flex items-center justify-between text-slate-400 mb-2">
          <span className="text-xs font-medium text-slate-300">Processed (Success)</span>
          <div className="p-1.5 rounded-md bg-emerald-950/60 text-emerald-400 border border-emerald-800/40">
            <CheckCircle2 className="w-3.5 h-3.5" />
          </div>
        </div>
        <div className="flex items-baseline space-x-2">
          <span className="text-2xl font-bold font-mono tracking-tight text-emerald-400">{processedRps}</span>
          <span className="text-xs font-mono text-slate-400">req/s</span>
        </div>
        <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-800/60">
          <span>Lifetime Success:</span>
          <span className="font-mono text-emerald-400/90 font-medium">{totalProcessed}</span>
        </div>
      </div>

      {/* 3. Waiting Queue */}
      <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 shadow-sm hover:border-slate-700/80 transition-all">
        <div className="flex items-center justify-between text-slate-400 mb-2">
          <span className="text-xs font-medium text-slate-300">Virtual Waiting Queue</span>
          <div className={`p-1.5 rounded-md border ${
            queuedCount > 50
              ? 'bg-amber-950/70 text-amber-400 border-amber-800/40'
              : 'bg-cyan-950/60 text-cyan-400 border-cyan-800/40'
          }`}>
            <Layers className="w-3.5 h-3.5" />
          </div>
        </div>
        <div className="flex items-baseline space-x-2">
          <span className={`text-2xl font-bold font-mono tracking-tight ${
            queuedCount > 50 ? 'text-amber-400' : 'text-cyan-400'
          }`}>
            {queuedCount}
          </span>
          <span className="text-xs font-mono text-slate-400">buffered</span>
        </div>
        <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-800/60">
          <span>Priority FIFO:</span>
          <span className="font-mono text-slate-300">Aging Protected</span>
        </div>
      </div>

      {/* 4. Rate-Limited / Dropped */}
      <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 shadow-sm hover:border-slate-700/80 transition-all">
        <div className="flex items-center justify-between text-slate-400 mb-2">
          <span className="text-xs font-medium text-slate-300">Limited / Dropped</span>
          <div className={`p-1.5 rounded-md border ${
            rateLimitedRps > 0
              ? 'bg-rose-950/70 text-rose-400 border-rose-800/40'
              : 'bg-slate-800 text-slate-400 border-slate-700'
          }`}>
            <XCircle className="w-3.5 h-3.5" />
          </div>
        </div>
        <div className="flex items-baseline space-x-2">
          <span className={`text-2xl font-bold font-mono tracking-tight ${
            rateLimitedRps > 0 ? 'text-rose-400' : 'text-slate-300'
          }`}>
            {rateLimitedRps}
          </span>
          <span className="text-xs font-mono text-slate-400">req/s</span>
        </div>
        <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-800/60">
          <span>Total Throttled:</span>
          <span className="font-mono text-rose-400/90 font-medium">{totalRejected}</span>
        </div>
      </div>

      {/* 5. Average Latency */}
      <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 shadow-sm hover:border-slate-700/80 transition-all">
        <div className="flex items-center justify-between text-slate-400 mb-2">
          <span className="text-xs font-medium text-slate-300">Avg Response Latency</span>
          <div className="p-1.5 rounded-md bg-blue-950/60 text-blue-400 border border-blue-800/40">
            <Clock className="w-3.5 h-3.5" />
          </div>
        </div>
        <div className="flex items-baseline space-x-2">
          <span className="text-2xl font-bold font-mono tracking-tight text-slate-900">{avgLatency}</span>
          <span className="text-xs font-mono text-slate-400">ms</span>
        </div>
        <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-800/60">
          <span>Target SLA:</span>
          <span className="font-mono text-emerald-400">&lt; 100ms</span>
        </div>
      </div>

      {/* 6. p95 Latency */}
      <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 shadow-sm hover:border-slate-700/80 transition-all">
        <div className="flex items-center justify-between text-slate-400 mb-2">
          <span className="text-xs font-medium text-slate-300">p95 Tail Latency</span>
          <div className={`p-1.5 rounded-md border ${
            p95Latency > 150
              ? 'bg-amber-950/70 text-amber-400 border-amber-800/40'
              : 'bg-indigo-950/60 text-indigo-400 border-indigo-800/40'
          }`}>
            <TrendingUp className="w-3.5 h-3.5" />
          </div>
        </div>
        <div className="flex items-baseline space-x-2">
          <span className={`text-2xl font-bold font-mono tracking-tight ${
            p95Latency > 150 ? 'text-amber-400' : 'text-indigo-300'
          }`}>
            {p95Latency}
          </span>
          <span className="text-xs font-mono text-slate-400">ms</span>
        </div>
        <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-800/60">
          <span>Statistical Rank:</span>
          <span className="font-mono text-slate-300">95th Percentile</span>
        </div>
      </div>

      {/* 7. Cache Hit Ratio */}
      <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 shadow-sm hover:border-slate-700/80 transition-all">
        <div className="flex items-center justify-between text-slate-400 mb-2">
          <span className="text-xs font-medium text-slate-300">Cache Hit Ratio</span>
          <div className="p-1.5 rounded-md bg-cyan-950/60 text-cyan-400 border border-cyan-800/40">
            <Database className="w-3.5 h-3.5" />
          </div>
        </div>
        <div className="flex items-baseline space-x-2">
          <span className="text-2xl font-bold font-mono tracking-tight text-cyan-400">{cacheHitRatio}</span>
          <span className="text-xs font-mono text-slate-400">%</span>
        </div>
        <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-800/60">
          <span>Served from Cache:</span>
          <span className="font-mono text-cyan-300">{totalCached}</span>
        </div>
      </div>

      {/* 8. Backend Utilization */}
      <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 shadow-sm hover:border-slate-700/80 transition-all">
        <div className="flex items-center justify-between text-slate-400 mb-2">
          <span className="text-xs font-medium text-slate-300">Backend Utilization</span>
          <div className={`p-1.5 rounded-md border ${
            backendUtil > 85
              ? 'bg-rose-950/70 text-rose-400 border-rose-800/40'
              : backendUtil > 60
              ? 'bg-amber-950/70 text-amber-400 border-amber-800/40'
              : 'bg-blue-950/60 text-blue-400 border-blue-800/40'
          }`}>
            <Server className="w-3.5 h-3.5" />
          </div>
        </div>
        <div className="flex items-baseline space-x-2">
          <span className={`text-2xl font-bold font-mono tracking-tight ${
            backendUtil > 85
              ? 'text-rose-400'
              : backendUtil > 60
              ? 'text-amber-400'
              : 'text-blue-400'
          }`}>
            {backendUtil}
          </span>
          <span className="text-xs font-mono text-slate-400">%</span>
        </div>
        <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-800/60">
          <span>Active Capacity:</span>
          <span className="font-mono text-slate-300">
            {snapshot?.backends ? snapshot.backends.filter((b) => b.is_healthy).length : 4} Instances
          </span>
        </div>
      </div>
    </div>
  );
};
