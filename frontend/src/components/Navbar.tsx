import React from 'react';
import {
  Shield,
  Activity,
  Layers,
  Search,
  BookOpen,
  Play,
  Square,
  AlertTriangle,
  Server,
  Zap,
} from 'lucide-react';
import { SimulatorState, DemoStatus } from '../types';

interface NavbarProps {
  activeTab: 'dashboard' | 'architecture' | 'inspector' | 'guide';
  setActiveTab: (tab: 'dashboard' | 'architecture' | 'inspector' | 'guide') => void;
  isConnected: boolean;
  state: SimulatorState;
  demoStatus: DemoStatus | null;
  onRunDemo: () => void;
  onStopDemo: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  isConnected,
  state,
  demoStatus,
  onRunDemo,
  onStopDemo,
}) => {
  const isDemoRunning = demoStatus?.is_running;

  return (
    <header className="sticky top-0 z-50 bg-[#090d16]/95 backdrop-blur-md border-b border-slate-800/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Left: Brand & Status */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2.5">
              <div className="p-2 rounded-lg bg-cyan-950/80 border border-cyan-500/30 text-cyan-400 shadow-sm shadow-cyan-950">
                <Shield className="w-5 h-5 text-cyan-400" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-slate-100 via-slate-200 to-cyan-400 bg-clip-text text-transparent">
                    EventShield
                  </span>
                  <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-slate-800/80 border border-slate-700/60 text-slate-300 uppercase tracking-wider">
                    v1.0 Demo
                  </span>
                </div>
                <div className="flex items-center space-x-2 text-[11px] text-slate-400">
                  <span className="flex items-center space-x-1">
                    <span
                      className={`inline-block w-1.5 h-1.5 rounded-full ${
                        isConnected ? 'bg-emerald-400 animate-pulse' : 'bg-red-500'
                      }`}
                    />
                    <span>{isConnected ? 'Real-Time Sync' : 'Reconnecting...'}</span>
                  </span>
                  <span>•</span>
                  <span className="text-slate-400">Simulated Metrics</span>
                </div>
              </div>
            </div>

            {/* Flash Crowd Indicator Pill */}
            {state.flash_crowd_detected ? (
              <div className="hidden md:flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-rose-950/70 border border-rose-500/50 text-rose-300 text-xs font-medium animate-pulse">
                <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                <span>FLASH CROWD DETECTED</span>
              </div>
            ) : (
              <div className="hidden md:flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-slate-900 border border-slate-800 text-slate-400 text-xs">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                <span>Traffic Nominal</span>
              </div>
            )}
          </div>

          {/* Center: Navigation Tabs */}
          <nav className="flex items-center space-x-1 p-1 bg-slate-900/90 rounded-lg border border-slate-800">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                activeTab === 'dashboard'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Activity className="w-3.5 h-3.5" />
              <span>Dashboard</span>
            </button>

            <button
              onClick={() => setActiveTab('architecture')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                activeTab === 'architecture'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Architecture Map</span>
            </button>

            <button
              onClick={() => setActiveTab('inspector')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                activeTab === 'inspector'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Search className="w-3.5 h-3.5" />
              <span>Request Inspector</span>
            </button>

            <button
              onClick={() => setActiveTab('guide')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                activeTab === 'guide'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Viva & Presentation Guide</span>
            </button>
          </nav>

          {/* Right: Demo Runner CTA */}
          <div className="flex items-center space-x-3">
            {isDemoRunning ? (
              <button
                onClick={onStopDemo}
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-rose-950/80 hover:bg-rose-900 border border-rose-500/40 text-rose-200 text-xs font-medium transition-all shadow-sm"
              >
                <Square className="w-3.5 h-3.5 fill-current" />
                <span>Stop Demo</span>
              </button>
            ) : (
              <button
                onClick={onRunDemo}
                className="flex items-center space-x-2 px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-semibold shadow-md shadow-cyan-950/50 transition-all border border-cyan-400/30 cursor-pointer active:scale-95"
              >
                <Zap className="w-3.5 h-3.5 fill-current text-cyan-200" />
                <span>Run Flash Crowd Demo</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
