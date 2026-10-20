import React, { useState } from 'react';
import {
  Search,
  Send,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock,
  ArrowRight,
  Server,
  Database,
  Shield,
  Layers,
  Zap,
} from 'lucide-react';
import { api } from '../services/api';
import { RequestItem, StepStatus, PriorityLevel } from '../types';

export const RequestInspector: React.FC = () => {
  const [endpoint, setEndpoint] = useState<string>('/api/tickets/reserve');
  const [priority, setPriority] = useState<PriorityLevel>('HIGH');
  const [isCacheable, setIsCacheable] = useState<boolean>(false);
  const [isSuspicious, setIsSuspicious] = useState<boolean>(false);
  const [clientIp, setClientIp] = useState<string>('192.168.1.155');
  const [allowEnqueue, setAllowEnqueue] = useState<boolean>(true);

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [inspectedRequest, setInspectedRequest] = useState<RequestItem | null>(null);

  const handleInspect = async () => {
    setIsLoading(true);
    try {
      const result = await api.inspectRequest({
        client_ip: clientIp,
        endpoint,
        priority,
        is_cacheable: isCacheable,
        is_suspicious: isSuspicious,
        allow_enqueue: allowEnqueue,
      });
      setInspectedRequest(result);
    } catch (err) {
      console.error('Inspector error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = (status: StepStatus) => {
    switch (status) {
      case 'PASS':
        return (
          <span className="flex items-center space-x-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-950 text-emerald-400 border border-emerald-800/60">
            <CheckCircle2 className="w-2.5 h-2.5" />
            <span>PASS</span>
          </span>
        );
      case 'DELAYED':
        return (
          <span className="flex items-center space-x-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-950 text-amber-400 border border-amber-800/60">
            <Clock className="w-2.5 h-2.5" />
            <span>DELAYED / QUEUED</span>
          </span>
        );
      case 'REJECTED':
        return (
          <span className="flex items-center space-x-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-rose-950 text-rose-400 border border-rose-800/60">
            <XCircle className="w-2.5 h-2.5" />
            <span>REJECTED</span>
          </span>
        );
      case 'SKIPPED':
        return (
          <span className="flex items-center space-x-1 px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-slate-800 text-slate-400 border border-slate-700">
            <span>SKIPPED</span>
          </span>
        );
    }
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-6 mb-6 shadow-sm">
      <div className="pb-4 border-b border-slate-800 mb-6">
        <div className="flex items-center space-x-2">
          <Search className="w-5 h-5 text-cyan-400" />
          <h3 className="text-base font-bold text-slate-100">Live Request Inspector & Trace Analyzer</h3>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800">
            Single Probe Diagnostics
          </span>
        </div>
        <p className="text-xs text-slate-400 mt-1">
          Submit individual transaction probes into the live pipeline. Trace step-by-step admission decisions, token bucket evaluation, queue latency, cache hits, and backend routing.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Form: Parameters */}
        <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-4">
          <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider font-mono">
            Probe Request Parameters
          </h4>

          {/* Endpoint */}
          <div className="space-y-1">
            <label className="text-xs text-slate-400 font-medium">Target Endpoint</label>
            <select
              value={endpoint}
              onChange={(e) => {
                setEndpoint(e.target.value);
                if (e.target.value.includes('availability') || e.target.value.includes('lookup') || e.target.value.includes('list')) {
                  setIsCacheable(true);
                } else {
                  setIsCacheable(false);
                }
              }}
              className="w-full px-3 py-1.5 text-xs bg-slate-900 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-cyan-500 font-mono"
            >
              <option value="/api/tickets/reserve">POST /api/tickets/reserve (Ticket Booking)</option>
              <option value="/api/tickets/availability">GET /api/tickets/availability (Seat Availability)</option>
              <option value="/api/exam/submit">POST /api/exam/submit (Exam Submission)</option>
              <option value="/api/deals/checkout">POST /api/deals/checkout (Flash Sale Checkout)</option>
              <option value="/api/results/lookup">GET /api/results/lookup (Exam Results)</option>
            </select>
          </div>

          {/* Priority */}
          <div className="space-y-1">
            <label className="text-xs text-slate-400 font-medium">Priority Level</label>
            <div className="grid grid-cols-3 gap-2">
              {(['HIGH', 'NORMAL', 'LOW'] as PriorityLevel[]).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPriority(p)}
                  className={`py-1.5 rounded-lg text-xs font-mono font-semibold border transition-all cursor-pointer ${
                    priority === p
                      ? p === 'HIGH'
                        ? 'bg-purple-950/80 border-purple-500 text-purple-200'
                        : p === 'NORMAL'
                        ? 'bg-blue-950/80 border-blue-500 text-blue-200'
                        : 'bg-slate-800 border-slate-600 text-slate-200'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-300'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          {/* Client IP */}
          <div className="space-y-1">
            <label className="text-xs text-slate-400 font-medium">Simulated Client IP</label>
            <input
              type="text"
              value={clientIp}
              onChange={(e) => setClientIp(e.target.value)}
              className="w-full px-3 py-1.5 text-xs bg-slate-900 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-cyan-500 font-mono"
            />
          </div>

          {/* Toggles */}
          <div className="space-y-2.5 pt-2 border-t border-slate-800">
            <label className="flex items-center space-x-2 text-xs text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={isCacheable}
                onChange={(e) => setIsCacheable(e.target.checked)}
                className="rounded accent-cyan-500"
              />
              <span>Cache Eligible (Deterministic Read)</span>
            </label>

            <label className="flex items-center space-x-2 text-xs text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={isSuspicious}
                onChange={(e) => setIsSuspicious(e.target.checked)}
                className="rounded accent-amber-500"
              />
              <span>Simulate Suspicious Scraper / Bot Pattern</span>
            </label>

            <label className="flex items-center space-x-2 text-xs text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={allowEnqueue}
                onChange={(e) => setAllowEnqueue(e.target.checked)}
                className="rounded accent-blue-500"
              />
              <span>Allow Virtual Queue Buffering</span>
            </label>
          </div>

          {/* Submit Probe Button */}
          <button
            onClick={handleInspect}
            disabled={isLoading}
            className="w-full mt-3 flex items-center justify-center space-x-2 py-2 rounded-lg bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-bold transition-all shadow-md cursor-pointer disabled:opacity-50"
          >
            <Send className="w-3.5 h-3.5" />
            <span>{isLoading ? 'Tracing Request...' : 'Send Probe Request'}</span>
          </button>
        </div>

        {/* Right 2 Columns: Step-by-Step Decision Trace */}
        <div className="lg:col-span-2 p-4 rounded-xl bg-slate-950 border border-slate-800">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
            <div>
              <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider font-mono">
                Lifecycle Processing Trace
              </h4>
              <span className="text-[10px] text-slate-400">
                Synchronously evaluated through the exact production pipeline modules
              </span>
            </div>

            {inspectedRequest && (
              <div className="flex items-center space-x-2 font-mono text-xs">
                <span className="text-slate-400">Final Status:</span>
                <span
                  className={`font-bold px-2 py-0.5 rounded text-[11px] ${
                    inspectedRequest.status.includes('SUCCESS') || inspectedRequest.status.includes('CACHE')
                      ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                      : inspectedRequest.status.includes('QUEUED')
                      ? 'bg-cyan-950 text-cyan-400 border border-cyan-800'
                      : 'bg-rose-950 text-rose-400 border border-rose-800'
                  }`}
                >
                  {inspectedRequest.status}
                </span>
                <span className="text-cyan-400 font-bold">({inspectedRequest.total_latency_ms}ms)</span>
              </div>
            )}
          </div>

          {!inspectedRequest ? (
            <div className="py-16 text-center text-slate-500 text-xs">
              <Zap className="w-8 h-8 mx-auto text-slate-700 mb-2" />
              Configure parameters on the left and click "Send Probe Request" to visualize the step-by-step pipeline execution.
            </div>
          ) : (
            <div className="space-y-3 font-sans">
              {inspectedRequest.trace.map((step, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-lg bg-slate-900 border border-slate-800/80 hover:border-slate-700 transition-all"
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center space-x-2">
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-semibold">
                        Step {idx + 1}
                      </span>
                      <span className="text-xs font-bold text-slate-100">{step.step_name}</span>
                    </div>

                    <div className="flex items-center space-x-2">
                      <span className="text-[10px] font-mono text-slate-400">+{step.latency_ms}ms</span>
                      {getStatusBadge(step.status)}
                    </div>
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed">{step.reason}</p>

                  {step.details && Object.keys(step.details).length > 0 && (
                    <div className="mt-2 pt-2 border-t border-slate-800 flex flex-wrap gap-x-4 gap-y-1 text-[10px] font-mono text-slate-400">
                      {Object.entries(step.details).map(([k, v]) => (
                        <span key={k}>
                          <span className="text-slate-500">{k}:</span>{' '}
                          <span className="text-cyan-300">{String(v)}</span>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
