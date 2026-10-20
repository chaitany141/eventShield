import React, { useState } from 'react';
import {
  FileText,
  Trash2,
  Filter,
  CheckCircle2,
  AlertTriangle,
  Info,
  XCircle,
  Zap,
} from 'lucide-react';
import { EventLog, Severity, EventCategory } from '../types';

interface EventLogViewerProps {
  logs: EventLog[];
  onClearLogs: () => void;
}

export const EventLogViewer: React.FC<EventLogViewerProps> = ({ logs, onClearLogs }) => {
  const [selectedSeverity, setSelectedSeverity] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const filteredLogs = logs.filter((log) => {
    if (selectedSeverity !== 'ALL' && log.severity !== selectedSeverity) {
      return false;
    }
    if (
      searchQuery &&
      !log.title.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !log.message.toLowerCase().includes(searchQuery.toLowerCase())
    ) {
      return false;
    }
    return true;
  });

  const getSeverityBadge = (severity: Severity) => {
    switch (severity) {
      case 'SUCCESS':
        return (
          <span className="flex items-center space-x-1 px-1.5 py-0.5 rounded text-[10px] font-mono font-medium bg-emerald-950 text-emerald-400 border border-emerald-800/60">
            <CheckCircle2 className="w-2.5 h-2.5" />
            <span>SUCCESS</span>
          </span>
        );
      case 'WARNING':
        return (
          <span className="flex items-center space-x-1 px-1.5 py-0.5 rounded text-[10px] font-mono font-medium bg-amber-950 text-amber-400 border border-amber-800/60">
            <AlertTriangle className="w-2.5 h-2.5" />
            <span>WARNING</span>
          </span>
        );
      case 'ERROR':
      case 'CRITICAL':
        return (
          <span className="flex items-center space-x-1 px-1.5 py-0.5 rounded text-[10px] font-mono font-medium bg-rose-950 text-rose-400 border border-rose-800/60">
            <XCircle className="w-2.5 h-2.5" />
            <span>{severity}</span>
          </span>
        );
      default:
        return (
          <span className="flex items-center space-x-1 px-1.5 py-0.5 rounded text-[10px] font-mono font-medium bg-blue-950 text-blue-400 border border-blue-800/60">
            <Info className="w-2.5 h-2.5" />
            <span>INFO</span>
          </span>
        );
    }
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 mb-6 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div className="flex items-center space-x-2">
          <FileText className="w-4 h-4 text-cyan-400" />
          <h3 className="text-sm font-bold text-slate-100">Live Orchestration Audit Log</h3>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
            {filteredLogs.length} events
          </span>
        </div>

        {/* Filters and Clear Action */}
        <div className="flex items-center space-x-2">
          {/* Search box */}
          <input
            type="text"
            placeholder="Search events..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="px-2.5 py-1 text-xs bg-slate-950 border border-slate-800 rounded-md text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500/50"
          />

          {/* Severity selector */}
          <select
            value={selectedSeverity}
            onChange={(e) => setSelectedSeverity(e.target.value)}
            className="px-2 py-1 text-xs bg-slate-950 border border-slate-800 rounded-md text-slate-300 focus:outline-none focus:border-cyan-500/50"
          >
            <option value="ALL">All Severities</option>
            <option value="INFO">Info</option>
            <option value="SUCCESS">Success</option>
            <option value="WARNING">Warning</option>
            <option value="ERROR">Error</option>
          </select>

          <button
            onClick={onClearLogs}
            title="Clear Event Log"
            className="p-1.5 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 border border-slate-700 transition-all cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Log Feed */}
      <div className="mt-3 max-h-60 overflow-y-auto space-y-2 pr-1 font-mono text-xs">
        {filteredLogs.length === 0 ? (
          <div className="text-center py-8 text-slate-500 text-xs font-sans">
            No events recorded matching criteria. Run simulation to populate audit trail.
          </div>
        ) : (
          filteredLogs.map((log) => (
            <div
              key={log.id}
              className="p-2.5 rounded-lg bg-slate-950/70 border border-slate-800/80 hover:border-slate-700/80 transition-all flex flex-col sm:flex-row sm:items-baseline justify-between gap-2"
            >
              <div className="flex items-start space-x-2.5 min-w-0">
                <span className="text-[11px] text-slate-500 flex-shrink-0 pt-0.5">
                  {log.time_str || new Date(log.timestamp * 1000).toLocaleTimeString()}
                </span>
                {getSeverityBadge(log.severity)}
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-400 uppercase flex-shrink-0">
                  {log.category}
                </span>
                <div className="min-w-0">
                  <span className="font-semibold text-slate-200">{log.title}: </span>
                  <span className="text-slate-400 font-sans text-xs">{log.message}</span>
                </div>
              </div>

              {log.metadata?.request_id && (
                <span className="text-[10px] font-mono text-cyan-400/80 bg-cyan-950/40 px-1.5 py-0.5 rounded border border-cyan-800/40 flex-shrink-0 self-start sm:self-auto">
                  {log.metadata.request_id}
                </span>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};
