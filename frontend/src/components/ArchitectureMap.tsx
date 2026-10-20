import React, { useState } from 'react';
import {
  Shield,
  Activity,
  Layers,
  Zap,
  Server,
  Database,
  RefreshCw,
  Flame,
  ArrowRight,
  Sliders,
  CheckCircle2,
  AlertTriangle,
  X,
  Info,
} from 'lucide-react';
import { MetricsSnapshot, BackendInstanceStats } from '../types';

interface ArchitectureMapProps {
  snapshot: MetricsSnapshot | null;
  backends: BackendInstanceStats[];
  onClearCache?: () => void;
}

interface ModuleModalData {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  mathFormula?: string;
  configSummary: string;
  liveStats: Record<string, string | number>;
  status: 'ACTIVE' | 'THROTTLING' | 'NORMAL';
}

export const ArchitectureMap: React.FC<ArchitectureMapProps> = ({
  snapshot,
  backends,
  onClearCache,
}) => {
  const [selectedModule, setSelectedModule] = useState<ModuleModalData | null>(null);

  const isFlashCrowd = snapshot?.flash_crowd_active ?? false;
  const queuedCount = snapshot?.queued_count ?? 0;
  const rateLimitedRps = snapshot?.rate_limited_rps ?? 0;
  const cacheHitRatio = snapshot?.cache_hit_ratio_pct ?? 0;
  const totalRetries = snapshot?.total_retries_attempted ?? 0;

  // Module Click Handlers
  const openModule = (id: string) => {
    switch (id) {
      case 'detector':
        setSelectedModule({
          id: 'detector',
          title: 'Flash-Crowd Heuristic Detector',
          subtitle: 'Rule-based Traffic Velocity & Acceleration Classifier',
          description:
            'Continuously tracks short-term moving average baseline RPS against total healthy cluster capacity. Detects surge acceleration spikes (+30 RPS jump or 1.8x baseline) transparently without opaque ML.',
          mathFormula: 'Surge Trigger: Current_RPS > Baseline_RPS × 1.8  OR  Current_RPS > Total_Capacity',
          configSummary: 'Window: 5s • Surge Multiplier: 1.8x • Recovery Hysteresis: 3 Nominal Ticks',
          liveStats: {
            'Flash Crowd Active': isFlashCrowd ? 'YES (PROTECTING)' : 'NO (NOMINAL)',
            'Incoming Rate': `${snapshot?.incoming_rps ?? 0} RPS`,
            'Baseline Moving Avg': 'Calculated every tick',
          },
          status: isFlashCrowd ? 'THROTTLING' : 'NORMAL',
        });
        break;

      case 'rate_limiter':
        setSelectedModule({
          id: 'rate_limiter',
          title: 'Token Bucket Rate Limiter',
          subtitle: 'Burst-Permitting Continuous Leak & Refill Engine',
          description:
            'Regulates request ingestion rate into backend services. Allows short bursts up to bucket capacity while enforcing strict refill leak rate. Excess requests are diverted to Virtual Waiting Queue or dropped.',
          mathFormula: 'Tokens(t) = min(Capacity, Tokens(t - Δt) + Δt × Refill_Rate)',
          configSummary: 'Capacity: 60 Tokens • Refill: 50 Tokens/sec • Admission Cost: 1.0 Token',
          liveStats: {
            'Throttled (RPS)': `${rateLimitedRps} req/s`,
            'Total Rate Limited': snapshot?.total_rate_limited ?? 0,
            'Queue Overflow Drops': snapshot?.total_queue_overflow ?? 0,
          },
          status: rateLimitedRps > 0 ? 'THROTTLING' : 'NORMAL',
        });
        break;

      case 'waiting_queue':
        setSelectedModule({
          id: 'waiting_queue',
          title: 'Multi-Priority Virtual Waiting Queue',
          subtitle: 'FIFO In-Memory Queue with Anti-Starvation Aging',
          description:
            'Buffers excess requests during traffic surges. Organizes requests into High (VIP), Normal, and Low queues. Computes queue position and Estimated Wait Time (EWT) via Little\'s Law. Automatically boosts aged requests to prevent starvation.',
          mathFormula: 'EWT = Queue_Position / Total_Backend_Drain_Rate (Little\'s Law)',
          configSummary: 'Capacity: 350 Slots • Max TTL: 8.0s • Starvation Aging Threshold: 2.5s',
          liveStats: {
            'Currently Queued': `${queuedCount} requests`,
            'Lifetime Enqueued': snapshot?.queued_count ?? 0,
            'Queue Timeouts': snapshot?.total_queue_timeout ?? 0,
          },
          status: queuedCount > 0 ? 'ACTIVE' : 'NORMAL',
        });
        break;

      case 'priority_router':
        setSelectedModule({
          id: 'priority_router',
          title: 'Fair Priority Routing Policy',
          subtitle: 'Differentiated Service Classes & Starvation Safeguard',
          description:
            'Grants VIP ticket buyers and exam submitters fast-track dispatch. Monitors queue dwell time and dynamically elevates low-priority items so normal users never experience indefinite starvation.',
          mathFormula: 'Effective_Priority = f(Stated_Priority, Wait_Time, Starvation_Threshold)',
          configSummary: 'Target Ratio: 70% High / 20% Normal / 10% Low',
          liveStats: {
            'VIP Processed': 'Expedited Fast-Track',
            'Starvation Boosts': 'Active Dynamic Aging',
          },
          status: 'ACTIVE',
        });
        break;

      case 'cache_layer':
        setSelectedModule({
          id: 'cache_layer',
          title: 'Deterministic In-Memory Cache',
          subtitle: 'Read-Heavy Surge Absorption Layer',
          description:
            'Intercepts cacheable reads (seat maps, catalog listings, exam schedules) and serves responses in ~1.5ms with 0 downstream database load. Decreases backend utilization during flash crowds.',
          mathFormula: 'Hit_Ratio = Hits / (Hits + Authoritative_Misses) × 100%',
          configSummary: 'Default TTL: 30s • MD5 Key Hash • Instant Invalidation Support',
          liveStats: {
            'Cache Hit Ratio': `${cacheHitRatio}%`,
            'Total Cache Hits': snapshot?.total_cache_hits ?? 0,
            'Current Cache Rate': `${snapshot?.cache_hit_rps ?? 0} req/s`,
          },
          status: cacheHitRatio > 0 ? 'ACTIVE' : 'NORMAL',
        });
        break;

      case 'load_balancer':
        setSelectedModule({
          id: 'load_balancer',
          title: 'Least-Loaded Load Balancer',
          subtitle: 'Health-Aware Dynamic Concurrency Balancer',
          description:
            'Distributes requests to backend workers with the lowest in-flight concurrency. Automatically skips crashed or unhealthy instances and rebalances traffic instantaneously upon recovery.',
          mathFormula: 'Target_Backend = argmin_i (In_Flight_i / Capacity_i) for all Healthy_i',
          configSummary: 'Algorithm: Least-Loaded (fallback Round-Robin) • Health Check: Immediate',
          liveStats: {
            'Healthy Backends': `${backends.filter((b) => b.is_healthy).length}/${backends.length}`,
            'Aggregate Utilization': `${snapshot?.backend_utilization_pct ?? 0}%`,
          },
          status: 'ACTIVE',
        });
        break;

      case 'retry_handler':
        setSelectedModule({
          id: 'retry_handler',
          title: 'Bounded Retry & Circuit Breaker',
          subtitle: 'Exponential Backoff with Retry Storm Prevention',
          description:
            'Catches transient 502/503 network blips and resubmits requests with exponential backoff and jitter. Enforces a strict 10% retry budget to guarantee that retries never trigger a catastrophic cascading collapse.',
          mathFormula: 'Backoff = Base × 2^(retry - 1) + Jitter ; Retry_Budget ≤ 10% of Ingestion',
          configSummary: 'Max Retries: 2 • Retry Budget: 10% • Base Backoff: 20ms',
          liveStats: {
            'Retries Attempted': totalRetries,
            'Retries Exhausted': snapshot?.total_retries_exhausted ?? 0,
            'Circuit Breaker': 'Active & Armed',
          },
          status: totalRetries > 0 ? 'ACTIVE' : 'NORMAL',
        });
        break;
    }
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-6 mb-6 shadow-sm">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800 mb-6">
        <div>
          <div className="flex items-center space-x-2">
            <Layers className="w-5 h-5 text-cyan-400" />
            <h3 className="text-base font-bold text-slate-100">EventShield End-to-End Architecture Map</h3>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800">
              Interactive Topology
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Click on any module to inspect internal state, mathematical invariants, and live telemetry.
          </p>
        </div>

        {/* Closed-loop monitoring badge */}
        <div className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-[11px] font-mono text-cyan-300">
          <RefreshCw className="w-3.5 h-3.5 text-cyan-400 animate-spin" style={{ animationDuration: '8s' }} />
          <span>Loop: Detect → Classify → Control → Route → Observe → Adapt</span>
        </div>
      </div>

      {/* Architecture Flowchart Canvas */}
      <div className="space-y-6">
        {/* Tier 1: Clients & Reverse Proxy */}
        <div className="flex flex-col md:flex-row items-center justify-center gap-4">
          <div className="w-full md:w-48 p-3 rounded-xl bg-slate-950 border border-slate-800 text-center shadow-sm">
            <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">Layer 1</div>
            <div className="text-xs font-bold text-slate-200 mt-0.5">Client Flash Crowd</div>
            <div className="text-[11px] font-mono text-cyan-400 mt-1 font-semibold">
              {snapshot?.incoming_rps ?? 0} RPS
            </div>
          </div>

          <ArrowRight className="w-5 h-5 text-slate-600 hidden md:block" />

          <div className="w-full md:w-56 p-3 rounded-xl bg-slate-950 border border-slate-800 text-center shadow-sm">
            <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">Layer 2</div>
            <div className="text-xs font-bold text-slate-200 mt-0.5">Reverse Proxy & WAF</div>
            <div className="text-[10px] text-slate-400 mt-1">TLS Termination • Ingestion</div>
          </div>
        </div>

        <div className="flex justify-center">
          <div className="w-0.5 h-6 bg-slate-700" />
        </div>

        {/* Tier 2: EventShield Core Shield Modules Grid */}
        <div className="p-5 rounded-2xl bg-[#080d1a] border border-cyan-500/30 shadow-inner">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <Shield className="w-4 h-4 text-cyan-400" />
              <span className="text-xs font-bold text-cyan-300 uppercase tracking-wider font-mono">
                EventShield Intelligent Orchestration Pipeline
              </span>
            </div>
            {isFlashCrowd && (
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-rose-950 text-rose-300 border border-rose-600/50 animate-pulse">
                PROTECTION ENGAGED
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            {/* Module 1: Flash-Crowd Detection */}
            <button
              onClick={() => openModule('detector')}
              className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                isFlashCrowd
                  ? 'bg-rose-950/40 border-rose-500/60 text-rose-200 shadow-md shadow-rose-950'
                  : 'bg-slate-900/90 border-slate-800 hover:border-cyan-500/50 text-slate-200'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] font-mono font-semibold uppercase text-slate-400">Step 1</span>
                <Flame className={`w-3.5 h-3.5 ${isFlashCrowd ? 'text-rose-400' : 'text-slate-500'}`} />
              </div>
              <div className="text-xs font-bold">Surge Detection</div>
              <div className="text-[10px] text-slate-400 mt-1">Heuristic rate of change</div>
              <div className="mt-2 text-[10px] font-mono pt-1.5 border-t border-slate-800/80 text-cyan-300">
                {isFlashCrowd ? 'SURGE ACTIVE' : 'Nominal'}
              </div>
            </button>

            {/* Module 2: Rate Limiter */}
            <button
              onClick={() => openModule('rate_limiter')}
              className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                rateLimitedRps > 0
                  ? 'bg-amber-950/40 border-amber-500/60 text-amber-200 shadow-md shadow-amber-950'
                  : 'bg-slate-900/90 border-slate-800 hover:border-cyan-500/50 text-slate-200'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] font-mono font-semibold uppercase text-slate-400">Step 2</span>
                <Sliders className={`w-3.5 h-3.5 ${rateLimitedRps > 0 ? 'text-amber-400' : 'text-slate-500'}`} />
              </div>
              <div className="text-xs font-bold">Token Bucket Limiter</div>
              <div className="text-[10px] text-slate-400 mt-1">Burst & continuous leak</div>
              <div className="mt-2 text-[10px] font-mono pt-1.5 border-t border-slate-800/80 text-amber-300">
                {rateLimitedRps > 0 ? `${rateLimitedRps} Throttled/s` : 'Admitting'}
              </div>
            </button>

            {/* Module 3: Virtual Waiting Queue */}
            <button
              onClick={() => openModule('waiting_queue')}
              className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                queuedCount > 0
                  ? 'bg-cyan-950/50 border-cyan-500 text-cyan-200 shadow-md shadow-cyan-950'
                  : 'bg-slate-900/90 border-slate-800 hover:border-cyan-500/50 text-slate-200'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] font-mono font-semibold uppercase text-slate-400">Step 3</span>
                <Layers className={`w-3.5 h-3.5 ${queuedCount > 0 ? 'text-cyan-400' : 'text-slate-500'}`} />
              </div>
              <div className="text-xs font-bold">Virtual Waiting Queue</div>
              <div className="text-[10px] text-slate-400 mt-1">Anti-starvation FIFO</div>
              <div className="mt-2 text-[10px] font-mono pt-1.5 border-t border-slate-800/80 text-cyan-300">
                {queuedCount} Buffered Requests
              </div>
            </button>

            {/* Module 4: In-Memory Cache */}
            <button
              onClick={() => openModule('cache_layer')}
              className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                cacheHitRatio > 0
                  ? 'bg-emerald-950/40 border-emerald-500/60 text-emerald-200 shadow-md shadow-emerald-950'
                  : 'bg-slate-900/90 border-slate-800 hover:border-cyan-500/50 text-slate-200'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] font-mono font-semibold uppercase text-slate-400">Step 4</span>
                <Database className={`w-3.5 h-3.5 ${cacheHitRatio > 0 ? 'text-emerald-400' : 'text-slate-500'}`} />
              </div>
              <div className="text-xs font-bold">Cache Layer</div>
              <div className="text-[10px] text-slate-400 mt-1">Instant read offloading</div>
              <div className="mt-2 text-[10px] font-mono pt-1.5 border-t border-slate-800/80 text-emerald-300">
                {cacheHitRatio}% Hit Ratio
              </div>
            </button>

            {/* Module 5: Priority Routing */}
            <button
              onClick={() => openModule('priority_router')}
              className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-cyan-500/50 text-slate-200 text-left transition-all cursor-pointer"
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] font-mono font-semibold uppercase text-slate-400">Step 5</span>
                <Activity className="w-3.5 h-3.5 text-purple-400" />
              </div>
              <div className="text-xs font-bold">Priority Routing</div>
              <div className="text-[10px] text-slate-400 mt-1">VIP fast-path & fairness</div>
              <div className="mt-2 text-[10px] font-mono pt-1.5 border-t border-slate-800/80 text-purple-300">
                Tiered Dispatch
              </div>
            </button>

            {/* Module 6: Load Balancer */}
            <button
              onClick={() => openModule('load_balancer')}
              className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-cyan-500/50 text-slate-200 text-left transition-all cursor-pointer"
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] font-mono font-semibold uppercase text-slate-400">Step 6</span>
                <Server className="w-3.5 h-3.5 text-blue-400" />
              </div>
              <div className="text-xs font-bold">Least-Loaded Balancer</div>
              <div className="text-[10px] text-slate-400 mt-1">Health checks & failover</div>
              <div className="mt-2 text-[10px] font-mono pt-1.5 border-t border-slate-800/80 text-blue-300">
                {backends.filter((b) => b.is_healthy).length} Nodes Active
              </div>
            </button>

            {/* Module 7: Bounded Retries */}
            <button
              onClick={() => openModule('retry_handler')}
              className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-cyan-500/50 text-slate-200 text-left transition-all cursor-pointer"
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] font-mono font-semibold uppercase text-slate-400">Step 7</span>
                <RefreshCw className="w-3.5 h-3.5 text-cyan-400" />
              </div>
              <div className="text-xs font-bold">Bounded Retry Engine</div>
              <div className="text-[10px] text-slate-400 mt-1">Circuit-breaker backoff</div>
              <div className="mt-2 text-[10px] font-mono pt-1.5 border-t border-slate-800/80 text-cyan-300">
                {totalRetries} Attempted
              </div>
            </button>

            {/* Module 8: Observability */}
            <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 text-slate-200 text-left">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] font-mono font-semibold uppercase text-slate-400">Step 8</span>
                <Activity className="w-3.5 h-3.5 text-emerald-400" />
              </div>
              <div className="text-xs font-bold">Metrics & Feedback</div>
              <div className="text-[10px] text-slate-400 mt-1">Real-time WebSocket Push</div>
              <div className="mt-2 text-[10px] font-mono pt-1.5 border-t border-slate-800/80 text-emerald-300">
                p95: {snapshot?.p95_latency_ms ?? 0}ms
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-center">
          <div className="w-0.5 h-6 bg-slate-700" />
        </div>

        {/* Tier 3: Downstream Backend Cluster */}
        <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-center">
          <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wider mb-2">
            Layer 4: Target Backend Services & Distributed DB
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {backends.map((b) => (
              <div
                key={b.id}
                className={`p-2 rounded-lg border text-xs font-mono flex items-center justify-between ${
                  b.is_healthy
                    ? 'bg-slate-900 border-slate-800 text-slate-300'
                    : 'bg-rose-950/40 border-rose-500/50 text-rose-300'
                }`}
              >
                <span>{b.id}</span>
                <span className="text-[10px] font-bold">
                  {b.is_healthy ? `${b.utilization_pct}%` : 'OFFLINE'}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Module Detail Modal / Drawer */}
      {selectedModule && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-mono uppercase text-cyan-400 tracking-wider">
                  Module Deep-Dive Inspection
                </span>
                <h3 className="text-base font-bold text-white mt-0.5">{selectedModule.title}</h3>
                <p className="text-xs text-slate-400">{selectedModule.subtitle}</p>
              </div>
              <button
                onClick={() => setSelectedModule(null)}
                className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-300 leading-relaxed">
              <p>{selectedModule.description}</p>

              {selectedModule.mathFormula && (
                <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 font-mono text-cyan-300 text-[11px]">
                  <span className="text-[10px] text-slate-500 block uppercase mb-1">Mathematical Rule / Invariant:</span>
                  {selectedModule.mathFormula}
                </div>
              )}

              <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                <span className="text-[10px] text-slate-500 block uppercase font-mono mb-1">Configuration:</span>
                <span className="text-slate-200">{selectedModule.configSummary}</span>
              </div>

              <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                <span className="text-[10px] text-slate-500 block uppercase font-mono mb-2">Live Telemetry:</span>
                <div className="grid grid-cols-2 gap-2 font-mono">
                  {Object.entries(selectedModule.liveStats).map(([key, val]) => (
                    <div key={key}>
                      <span className="text-slate-500 block text-[10px]">{key}:</span>
                      <span className="text-slate-200 font-semibold">{val}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setSelectedModule(null)}
                className="px-4 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
