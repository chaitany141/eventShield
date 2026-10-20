import React, { useMemo } from 'react';
import { TimeSeriesPoint, BackendInstanceStats } from '../types';

interface LiveChartsProps {
  history: TimeSeriesPoint[];
  backends: BackendInstanceStats[];
}

export const LiveCharts: React.FC<LiveChartsProps> = ({ history, backends }) => {
  // Ensure we have at least 2 points to render smooth lines
  const points = useMemo(() => {
    if (history.length >= 2) return history;
    const now = Date.now() / 1000;
    return [
      {
        timestamp: now - 1,
        time_label: '00:00:00',
        incoming_rps: 0,
        processed_rps: 0,
        queued_count: 0,
        rate_limited_rps: 0,
        cache_hit_rps: 0,
        avg_latency_ms: 0,
        p95_latency_ms: 0,
        backend_utilization_pct: 0,
      },
      {
        timestamp: now,
        time_label: '00:00:01',
        incoming_rps: 0,
        processed_rps: 0,
        queued_count: 0,
        rate_limited_rps: 0,
        cache_hit_rps: 0,
        avg_latency_ms: 0,
        p95_latency_ms: 0,
        backend_utilization_pct: 0,
      },
    ];
  }, [history]);

  // Chart dimensions
  const width = 500;
  const height = 160;
  const padding = { top: 15, right: 15, bottom: 25, left: 35 };
  const graphWidth = width - padding.left - padding.right;
  const graphHeight = height - padding.top - padding.bottom;

  // 1. Incoming vs Processed SVG Paths
  const maxRps = Math.max(
    50,
    ...points.map((p) => Math.max(p.incoming_rps, p.processed_rps, p.rate_limited_rps))
  );

  const getX = (index: number) =>
    padding.left + (index / Math.max(points.length - 1, 1)) * graphWidth;

  const getY_Rps = (val: number) =>
    padding.top + graphHeight - (val / maxRps) * graphHeight;

  const incomingPath = points
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${getX(i).toFixed(1)} ${getY_Rps(p.incoming_rps).toFixed(1)}`)
    .join(' ');

  const processedPath = points
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${getX(i).toFixed(1)} ${getY_Rps(p.processed_rps).toFixed(1)}`)
    .join(' ');

  const rateLimitedPath = points
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${getX(i).toFixed(1)} ${getY_Rps(p.rate_limited_rps).toFixed(1)}`)
    .join(' ');

  // 2. Latency SVG Paths (Avg vs p95)
  const maxLat = Math.max(80, ...points.map((p) => Math.max(p.avg_latency_ms, p.p95_latency_ms)));
  const getY_Lat = (val: number) =>
    padding.top + graphHeight - (val / maxLat) * graphHeight;

  const avgLatPath = points
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${getX(i).toFixed(1)} ${getY_Lat(p.avg_latency_ms).toFixed(1)}`)
    .join(' ');

  const p95LatPath = points
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${getX(i).toFixed(1)} ${getY_Lat(p.p95_latency_ms).toFixed(1)}`)
    .join(' ');

  // 3. Queue Size Path
  const maxQueue = Math.max(50, ...points.map((p) => p.queued_count));
  const getY_Queue = (val: number) =>
    padding.top + graphHeight - (val / maxQueue) * graphHeight;

  const queuePath = points
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${getX(i).toFixed(1)} ${getY_Queue(p.queued_count).toFixed(1)}`)
    .join(' ');

  const queueAreaPath =
    points.length > 0
      ? `${queuePath} L ${getX(points.length - 1)} ${padding.top + graphHeight} L ${padding.left} ${padding.top + graphHeight} Z`
      : '';

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
      {/* Chart 1: Incoming vs Processed RPS */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h4 className="text-xs font-semibold text-slate-200">Throughput Velocity (RPS)</h4>
            <span className="text-[10px] text-slate-400">Incoming vs Admitted vs Dropped</span>
          </div>
          <div className="flex items-center space-x-3 text-[10px] font-mono">
            <span className="flex items-center space-x-1">
              <span className="w-2 h-0.5 bg-blue-500 inline-block" />
              <span className="text-blue-600">Incoming</span>
            </span>
            <span className="flex items-center space-x-1">
              <span className="w-2 h-0.5 bg-emerald-600 inline-block" />
              <span className="text-emerald-700">Processed</span>
            </span>
            <span className="flex items-center space-x-1">
              <span className="w-2 h-0.5 bg-rose-500 inline-block" />
              <span className="text-rose-700">Throttled</span>
            </span>
          </div>
        </div>

        <div className="relative w-full overflow-hidden">
          <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto select-none">
            {/* Grid Lines */}
            <line x1={padding.left} y1={padding.top} x2={width - padding.right} y2={padding.top} stroke="#e8edf3" strokeDasharray="3 3" />
            <line x1={padding.left} y1={padding.top + graphHeight / 2} x2={width - padding.right} y2={padding.top + graphHeight / 2} stroke="#e8edf3" strokeDasharray="3 3" />
            <line x1={padding.left} y1={padding.top + graphHeight} x2={width - padding.right} y2={padding.top + graphHeight} stroke="#d9e1ea" />

            {/* Y Axis Labels */}
            <text x={padding.left - 6} y={padding.top + 4} fill="#64748b" fontSize="9" textAnchor="end" fontFamily="monospace">
              {Math.round(maxRps)}
            </text>
            <text x={padding.left - 6} y={padding.top + graphHeight / 2 + 3} fill="#64748b" fontSize="9" textAnchor="end" fontFamily="monospace">
              {Math.round(maxRps / 2)}
            </text>
            <text x={padding.left - 6} y={padding.top + graphHeight} fill="#64748b" fontSize="9" textAnchor="end" fontFamily="monospace">
              0
            </text>

            {/* Paths */}
            <path d={incomingPath} fill="none" stroke="#53799f" strokeWidth="2" strokeLinecap="round" />
            <path d={processedPath} fill="none" stroke="#59836e" strokeWidth="2" strokeLinecap="round" />
            <path d={rateLimitedPath} fill="none" stroke="#b77979" strokeWidth="1.5" strokeDasharray="4 2" />
          </svg>
        </div>
      </div>

      {/* Chart 2: Response Latency (Avg vs p95) */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h4 className="text-xs font-semibold text-slate-200">Response Latency Profile</h4>
            <span className="text-[10px] text-slate-400">Mean vs 95th Percentile Latency</span>
          </div>
          <div className="flex items-center space-x-3 text-[10px] font-mono">
            <span className="flex items-center space-x-1">
              <span className="w-2 h-0.5 bg-slate-300 inline-block" />
              <span className="text-slate-300">Avg</span>
            </span>
            <span className="flex items-center space-x-1">
              <span className="w-2 h-0.5 bg-indigo-500 inline-block" />
              <span className="text-indigo-600">p95 Tail</span>
            </span>
          </div>
        </div>

        <div className="relative w-full overflow-hidden">
          <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto select-none">
            <line x1={padding.left} y1={padding.top} x2={width - padding.right} y2={padding.top} stroke="#e8edf3" strokeDasharray="3 3" />
            <line x1={padding.left} y1={padding.top + graphHeight / 2} x2={width - padding.right} y2={padding.top + graphHeight / 2} stroke="#e8edf3" strokeDasharray="3 3" />
            <line x1={padding.left} y1={padding.top + graphHeight} x2={width - padding.right} y2={padding.top + graphHeight} stroke="#d9e1ea" />

            <text x={padding.left - 6} y={padding.top + 4} fill="#64748b" fontSize="9" textAnchor="end" fontFamily="monospace">
              {Math.round(maxLat)}ms
            </text>
            <text x={padding.left - 6} y={padding.top + graphHeight / 2 + 3} fill="#64748b" fontSize="9" textAnchor="end" fontFamily="monospace">
              {Math.round(maxLat / 2)}ms
            </text>
            <text x={padding.left - 6} y={padding.top + graphHeight} fill="#64748b" fontSize="9" textAnchor="end" fontFamily="monospace">
              0ms
            </text>

            <path d={avgLatPath} fill="none" stroke="#8997a8" strokeWidth="1.5" strokeLinecap="round" />
            <path d={p95LatPath} fill="none" stroke="#7889a3" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </div>
      </div>

      {/* Chart 3: Virtual Waiting Queue Depth */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h4 className="text-xs font-semibold text-slate-200">Virtual Waiting Queue Depth</h4>
            <span className="text-[10px] text-slate-400">Buffered Requests Over Time</span>
          </div>
          <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-800/40">
            {points[points.length - 1]?.queued_count ?? 0} in queue
          </span>
        </div>

        <div className="relative w-full overflow-hidden">
          <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto select-none">
            <line x1={padding.left} y1={padding.top} x2={width - padding.right} y2={padding.top} stroke="#e8edf3" strokeDasharray="3 3" />
            <line x1={padding.left} y1={padding.top + graphHeight / 2} x2={width - padding.right} y2={padding.top + graphHeight / 2} stroke="#e8edf3" strokeDasharray="3 3" />
            <line x1={padding.left} y1={padding.top + graphHeight} x2={width - padding.right} y2={padding.top + graphHeight} stroke="#d9e1ea" />

            <text x={padding.left - 6} y={padding.top + 4} fill="#64748b" fontSize="9" textAnchor="end" fontFamily="monospace">
              {Math.round(maxQueue)}
            </text>
            <text x={padding.left - 6} y={padding.top + graphHeight / 2 + 3} fill="#64748b" fontSize="9" textAnchor="end" fontFamily="monospace">
              {Math.round(maxQueue / 2)}
            </text>
            <text x={padding.left - 6} y={padding.top + graphHeight} fill="#64748b" fontSize="9" textAnchor="end" fontFamily="monospace">
              0
            </text>

            <path d={queueAreaPath} fill="#eaf1f7" />
            <path d={queuePath} fill="none" stroke="#537f9e" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </div>
      </div>

      {/* Chart 4: Traffic Distribution across Backend Servers */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h4 className="text-xs font-semibold text-slate-200">Load Balancer Server Distribution</h4>
            <span className="text-[10px] text-slate-400">In-Flight Concurrency & Capacity per Node</span>
          </div>
          <span className="text-[10px] font-mono text-slate-400">
            {backends.filter((b) => b.is_healthy).length}/{backends.length} Healthy
          </span>
        </div>

        <div className="space-y-2.5 pt-1">
          {backends.map((b) => {
            const isDown = !b.is_healthy;
            const util = b.utilization_pct;

            return (
              <div key={b.id} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center space-x-1.5">
                    <span
                      className={`w-2 h-2 rounded-full ${
                        isDown ? 'bg-rose-500' : 'bg-emerald-400'
                      }`}
                    />
                    <span className="font-mono text-slate-300 font-medium">{b.id}</span>
                    <span className="text-[10px] text-slate-400 truncate max-w-32.5 hidden sm:inline">
                      ({b.name})
                    </span>
                  </div>
                  <div className="flex items-center space-x-2 text-[11px] font-mono">
                    <span className="text-slate-400">{b.in_flight}/{b.capacity_rps} in-flight</span>
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
                      {isDown ? 'OFFLINE' : `${util}%`}
                    </span>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="w-full bg-slate-800/80 rounded-full h-1.5 overflow-hidden">
                  <div
                    className={`h-full transition-all duration-300 rounded-full ${
                      isDown
                        ? 'bg-rose-600 w-full opacity-30'
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
            );
          })}
        </div>
      </div>
    </div>
  );
};
