import React from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  Sliders,
  ShieldAlert,
  Flame,
  CheckCircle2,
  Settings2,
} from 'lucide-react';
import { SimulationConfig, SimulatorState, ScenarioType } from '../types';

interface SimulatorControlsProps {
  config: SimulationConfig;
  state: SimulatorState;
  onStart: () => void;
  onPause: () => void;
  onResume: () => void;
  onReset: () => void;
  onConfigChange: (newConfig: SimulationConfig) => void;
  onScenarioChange: (scenario: ScenarioType) => void;
}

export const SimulatorControls: React.FC<SimulatorControlsProps> = ({
  config,
  state,
  onStart,
  onPause,
  onResume,
  onReset,
  onConfigChange,
  onScenarioChange,
}) => {
  const isRunning = state.is_running;
  const isPaused = state.is_paused;

  const handleSlider = (field: keyof SimulationConfig, value: number) => {
    onConfigChange({
      ...config,
      scenario: 'CUSTOM',
      [field]: value,
    });
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 mb-6 shadow-sm">
      {/* Top Header: Scenario Selector & Engine Actions */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center space-x-2">
            <Sliders className="w-4 h-4 text-cyan-400" />
            <h3 className="text-sm font-bold text-slate-100">Interactive Traffic Simulator</h3>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
              {state.elapsed_seconds}s active
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Select predefined traffic scenarios or manually manipulate parameters to stress-test the pipeline.
          </p>
        </div>

        {/* Engine Play/Pause/Reset Controls */}
        <div className="flex items-center space-x-2">
          {!isRunning ? (
            <button
              onClick={onStart}
              className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-sm transition-all cursor-pointer active:scale-95"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Start Simulation</span>
            </button>
          ) : isPaused ? (
            <button
              onClick={onResume}
              className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-sm transition-all cursor-pointer active:scale-95"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Resume</span>
            </button>
          ) : (
            <button
              onClick={onPause}
              className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold shadow-sm transition-all cursor-pointer active:scale-95"
            >
              <Pause className="w-3.5 h-3.5 fill-current" />
              <span>Pause</span>
            </button>
          )}

          <button
            onClick={onReset}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 text-xs font-medium transition-all cursor-pointer active:scale-95"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>
        </div>
      </div>

      {/* Scenario Preset Buttons */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 my-4">
        <button
          onClick={() => onScenarioChange('NORMAL')}
          className={`flex items-center space-x-2.5 p-3 rounded-lg border text-left transition-all ${
            config.scenario === 'NORMAL'
              ? 'bg-blue-950/60 border-blue-500 text-blue-200 shadow-sm'
              : 'bg-slate-950/60 border-slate-800/80 text-slate-400 hover:border-slate-700 hover:text-slate-300'
          }`}
        >
          <div className="p-1.5 rounded bg-blue-900/40 text-blue-400 border border-blue-800/50">
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs font-semibold">Normal Traffic</div>
            <div className="text-[10px] text-slate-400">25 RPS • Within Capacity</div>
          </div>
        </button>

        <button
          onClick={() => onScenarioChange('FLASH_CROWD')}
          className={`flex items-center space-x-2.5 p-3 rounded-lg border text-left transition-all ${
            config.scenario === 'FLASH_CROWD'
              ? 'bg-rose-950/60 border-rose-500 text-rose-200 shadow-sm'
              : 'bg-slate-950/60 border-slate-800/80 text-slate-400 hover:border-slate-700 hover:text-slate-300'
          }`}
        >
          <div className="p-1.5 rounded bg-rose-900/40 text-rose-400 border border-rose-800/50">
            <Flame className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs font-semibold">Flash Crowd Surge</div>
            <div className="text-[10px] text-slate-400">130 RPS • Overload Peak</div>
          </div>
        </button>

        <button
          onClick={() => onScenarioChange('SUSPICIOUS')}
          className={`flex items-center space-x-2.5 p-3 rounded-lg border text-left transition-all ${
            config.scenario === 'SUSPICIOUS'
              ? 'bg-amber-950/60 border-amber-500 text-amber-200 shadow-sm'
              : 'bg-slate-950/60 border-slate-800/80 text-slate-400 hover:border-slate-700 hover:text-slate-300'
          }`}
        >
          <div className="p-1.5 rounded bg-amber-900/40 text-amber-400 border border-amber-800/50">
            <ShieldAlert className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs font-semibold">Suspicious / Bot Traffic</div>
            <div className="text-[10px] text-slate-400">45% Scrapers & Bursts</div>
          </div>
        </button>

        <button
          onClick={() => onScenarioChange('CUSTOM')}
          className={`flex items-center space-x-2.5 p-3 rounded-lg border text-left transition-all ${
            config.scenario === 'CUSTOM'
              ? 'bg-cyan-950/60 border-cyan-500 text-cyan-200 shadow-sm'
              : 'bg-slate-950/60 border-slate-800/80 text-slate-400 hover:border-slate-700 hover:text-slate-300'
          }`}
        >
          <div className="p-1.5 rounded bg-cyan-900/40 text-cyan-400 border border-cyan-800/50">
            <Settings2 className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs font-semibold">Custom Preset</div>
            <div className="text-[10px] text-slate-400">Manual Parameter Tuning</div>
          </div>
        </button>
      </div>

      {/* Sliders Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-4 pt-2">
        {/* Slider 1: Incoming RPS */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <label className="text-slate-300 font-medium">Incoming Volume (RPS)</label>
            <span className="font-mono text-cyan-400 font-semibold">{config.rps} req/s</span>
          </div>
          <input
            type="range"
            min="5"
            max="250"
            step="5"
            value={config.rps}
            onChange={(e) => handleSlider('rps', parseInt(e.target.value))}
            className="w-full accent-cyan-400 bg-slate-800 rounded-lg cursor-pointer"
          />
          <span className="text-[10px] text-slate-400 block">Total generated requests per simulated second</span>
        </div>

        {/* Slider 2: Backend Capacity per Instance */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <label className="text-slate-300 font-medium">Backend Instance Capacity</label>
            <span className="font-mono text-emerald-400 font-semibold">{config.backend_capacity} req/s</span>
          </div>
          <input
            type="range"
            min="5"
            max="50"
            step="5"
            value={config.backend_capacity}
            onChange={(e) => handleSlider('backend_capacity', parseInt(e.target.value))}
            className="w-full accent-emerald-400 bg-slate-800 rounded-lg cursor-pointer"
          />
          <span className="text-[10px] text-slate-400 block">
            Max processing capacity per server (Total: {config.backend_capacity * config.backend_instances} req/s)
          </span>
        </div>

        {/* Slider 3: Backend Instances */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <label className="text-slate-300 font-medium">Active Backend Nodes</label>
            <span className="font-mono text-blue-400 font-semibold">{config.backend_instances} Servers</span>
          </div>
          <input
            type="range"
            min="1"
            max="8"
            step="1"
            value={config.backend_instances}
            onChange={(e) => handleSlider('backend_instances', parseInt(e.target.value))}
            className="w-full accent-blue-400 bg-slate-800 rounded-lg cursor-pointer"
          />
          <span className="text-[10px] text-slate-400 block">Cluster worker instances for load balancing</span>
        </div>

        {/* Slider 4: Cacheable Traffic % */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <label className="text-slate-300 font-medium">Cache Eligible Traffic</label>
            <span className="font-mono text-cyan-300 font-semibold">{config.cacheable_pct}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            step="5"
            value={config.cacheable_pct}
            onChange={(e) => handleSlider('cacheable_pct', parseInt(e.target.value))}
            className="w-full accent-cyan-400 bg-slate-800 rounded-lg cursor-pointer"
          />
          <span className="text-[10px] text-slate-400 block">Catalog and availability reads served from cache</span>
        </div>

        {/* Slider 5: Suspicious Traffic % */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <label className="text-slate-300 font-medium">Suspicious / Bot Traffic</label>
            <span className="font-mono text-amber-400 font-semibold">{config.suspicious_pct}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="80"
            step="5"
            value={config.suspicious_pct}
            onChange={(e) => handleSlider('suspicious_pct', parseInt(e.target.value))}
            className="w-full accent-amber-400 bg-slate-800 rounded-lg cursor-pointer"
          />
          <span className="text-[10px] text-slate-400 block">Traffic triggering IP burst or scraper heuristics</span>
        </div>

        {/* Slider 6: Priority VIP Traffic % */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <label className="text-slate-300 font-medium">High (VIP) Priority Ratio</label>
            <span className="font-mono text-purple-400 font-semibold">{config.priority_traffic_pct}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="80"
            step="5"
            value={config.priority_traffic_pct}
            onChange={(e) => handleSlider('priority_traffic_pct', parseInt(e.target.value))}
            className="w-full accent-purple-400 bg-slate-800 rounded-lg cursor-pointer"
          />
          <span className="text-[10px] text-slate-400 block">Proportion routed through expedited VIP queue</span>
        </div>
      </div>
    </div>
  );
};
