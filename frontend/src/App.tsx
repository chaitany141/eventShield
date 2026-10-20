import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { DemoBanner } from './components/DemoBanner';
import { MetricCards } from './components/MetricCards';
import { LiveCharts } from './components/LiveCharts';
import { SimulatorControls } from './components/SimulatorControls';
import { BackendCluster } from './components/BackendCluster';
import { EventLogViewer } from './components/EventLogViewer';
import { ArchitectureMap } from './components/ArchitectureMap';
import { RequestInspector } from './components/RequestInspector';
import { VivaGuideModal } from './components/VivaGuideModal';
import { api } from './services/api';
import { realtime } from './services/websocket';
import {
  SimulationConfig,
  SimulatorState,
  MetricsSnapshot,
  TimeSeriesPoint,
  EventLog,
  BackendInstanceStats,
  DemoStatus,
  ScenarioType,
} from './types';

export default function App() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'architecture' | 'inspector' | 'guide'>('dashboard');
  const [isConnected, setIsConnected] = useState<boolean>(false);

  // Core Simulation State
  const [config, setConfig] = useState<SimulationConfig>({
    scenario: 'NORMAL',
    rps: 25,
    backend_capacity: 15,
    backend_instances: 4,
    cacheable_pct: 35,
    suspicious_pct: 3,
    priority_traffic_pct: 20,
    token_bucket_capacity: 60,
    token_refill_rate: 50,
    max_queue_capacity: 350,
    queue_timeout_seconds: 8.0,
    starvation_boost_seconds: 2.5,
    max_retries: 2,
    retry_budget_pct: 10,
    load_balance_algo: 'least_loaded',
  });

  const [state, setState] = useState<SimulatorState>({
    is_running: false,
    is_paused: false,
    scenario: 'NORMAL',
    elapsed_seconds: 0,
    total_generated: 0,
    flash_crowd_detected: false,
    detection_reason: 'Baseline nominal',
  });

  const [snapshot, setSnapshot] = useState<MetricsSnapshot | null>(null);
  const [history, setHistory] = useState<TimeSeriesPoint[]>([]);
  const [logs, setLogs] = useState<EventLog[]>([]);
  const [backends, setBackends] = useState<BackendInstanceStats[]>([]);
  const [demoStatus, setDemoStatus] = useState<DemoStatus | null>(null);

  // Initial Data Fetch
  useEffect(() => {
    const initData = async () => {
      try {
        const cfgData = await api.getConfig();
        if (cfgData.config) setConfig(cfgData.config);
        if (cfgData.state) setState(cfgData.state);

        const hist = await api.getHistory();
        if (hist) setHistory(hist);

        const eventLogs = await api.getLogs({ limit: 50 });
        if (eventLogs) setLogs(eventLogs);

        const bData = await api.getBackends();
        if (bData?.backends) setBackends(bData.backends);

        const demo = await api.getDemoStatus();
        if (demo) setDemoStatus(demo);
      } catch (err) {
        console.warn('Initial REST load fallback:', err);
      }
    };

    initData();

    // Setup WebSockets
    realtime.connect();
    const unsubStatus = realtime.onStatusChange((connected) => {
      setIsConnected(connected);
    });

    const unsubMsg = realtime.onMessage((msg) => {
      if (msg.type === 'TICK') {
        if (msg.snapshot) setSnapshot(msg.snapshot);
        if (msg.state) setState(msg.state);
        if (msg.snapshot?.backends) setBackends(msg.snapshot.backends);
        if (msg.events) {
          setLogs((prev) => {
            const combined = [...msg.events, ...prev];
            const seen = new Set();
            return combined.filter((e) => {
              if (seen.has(e.id)) return false;
              seen.add(e.id);
              return true;
            }).slice(0, 100);
          });
        }

        // Append to history
        if (msg.snapshot) {
          setHistory((prev) => {
            const point: TimeSeriesPoint = {
              timestamp: msg.snapshot.timestamp,
              time_label: new Date(msg.snapshot.timestamp * 1000).toLocaleTimeString(),
              incoming_rps: msg.snapshot.incoming_rps,
              processed_rps: msg.snapshot.processed_rps,
              queued_count: msg.snapshot.queued_count,
              rate_limited_rps: msg.snapshot.rate_limited_rps,
              cache_hit_rps: msg.snapshot.cache_hit_rps,
              avg_latency_ms: msg.snapshot.avg_latency_ms,
              p95_latency_ms: msg.snapshot.p95_latency_ms,
              backend_utilization_pct: msg.snapshot.backend_utilization_pct,
            };
            const updated = [...prev, point];
            return updated.slice(-60);
          });
        }
      } else if (msg.type === 'INITIAL') {
        if (msg.state) setState(msg.state);
        if (msg.config) setConfig(msg.config);
        if (msg.events) setLogs(msg.events);
        if (msg.backends) setBackends(msg.backends);
      }
    });

    // Demo status polling interval
    const demoInterval = setInterval(async () => {
      try {
        const demo = await api.getDemoStatus();
        setDemoStatus(demo);
      } catch {
        // ignore
      }
    }, 1000);

    return () => {
      unsubStatus();
      unsubMsg();
      realtime.disconnect();
      clearInterval(demoInterval);
    };
  }, []);

  // Action Handlers
  const handleStart = async () => {
    const res = await api.startSimulation();
    if (res.state) setState(res.state);
  };

  const handlePause = async () => {
    const res = await api.pauseSimulation();
    if (res.state) setState(res.state);
  };

  const handleResume = async () => {
    const res = await api.resumeSimulation();
    if (res.state) setState(res.state);
  };

  const handleReset = async () => {
    const res = await api.resetSimulation();
    if (res.state) setState(res.state);
    setHistory([]);
    setLogs([]);
    const bData = await api.getBackends();
    if (bData?.backends) setBackends(bData.backends);
  };

  const handleConfigChange = async (newConfig: SimulationConfig) => {
    setConfig(newConfig);
    const res = await api.updateConfig(newConfig);
    if (res.config) setConfig(res.config);
    if (res.state) setState(res.state);
  };

  const handleScenarioChange = async (scenario: ScenarioType) => {
    const res = await api.setScenario(scenario);
    if (res.config) setConfig(res.config);
  };

  const handleRunDemo = async () => {
    const res = await api.startDemo();
    if (res.demo) setDemoStatus(res.demo);
  };

  const handleStopDemo = async () => {
    const res = await api.stopDemo();
    if (res.demo) setDemoStatus(res.demo);
  };

  const handleToggleBackendHealth = async (backendId: string, isHealthy?: boolean) => {
    await api.toggleBackendHealth(backendId, isHealthy);
    const bData = await api.getBackends();
    if (bData?.backends) setBackends(bData.backends);
  };

  const handleSetBackendCapacity = async (backendId: string, cap: number) => {
    await api.setBackendCapacity(backendId, cap);
    const bData = await api.getBackends();
    if (bData?.backends) setBackends(bData.backends);
  };

  const handleClearLogs = async () => {
    await api.clearLogs();
    setLogs([]);
  };

  const handleClearCache = async () => {
    await api.clearCache();
  };

  return (
    <div className="min-h-screen bg-[#0b1120] text-slate-100 flex flex-col font-sans">
      {/* Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isConnected={isConnected}
        state={state}
        demoStatus={demoStatus}
        onRunDemo={handleRunDemo}
        onStopDemo={handleStopDemo}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Flash Crowd Demo Banner & Stepper */}
        <DemoBanner
          demoStatus={demoStatus}
          onRunDemo={handleRunDemo}
          onStopDemo={handleStopDemo}
        />

        {/* Tab 1: Dashboard View */}
        {activeTab === 'dashboard' && (
          <div>
            {/* 8 Live Metric KPI Cards */}
            <MetricCards snapshot={snapshot} />

            {/* Traffic Simulator Controls */}
            <SimulatorControls
              config={config}
              state={state}
              onStart={handleStart}
              onPause={handlePause}
              onResume={handleResume}
              onReset={handleReset}
              onConfigChange={handleConfigChange}
              onScenarioChange={handleScenarioChange}
            />

            {/* Real-time SVG Charts */}
            <LiveCharts history={history} backends={backends} />

            {/* Downstream Backend Microservices */}
            <BackendCluster
              backends={backends}
              onToggleHealth={handleToggleBackendHealth}
              onSetCapacity={handleSetBackendCapacity}
            />

            {/* Live Audit Log Feed */}
            <EventLogViewer logs={logs} onClearLogs={handleClearLogs} />
          </div>
        )}

        {/* Tab 2: Architecture Topology View */}
        {activeTab === 'architecture' && (
          <ArchitectureMap
            snapshot={snapshot}
            backends={backends}
            onClearCache={handleClearCache}
          />
        )}

        {/* Tab 3: Request Inspector View */}
        {activeTab === 'inspector' && <RequestInspector />}

        {/* Tab 4: Viva Voce & Presentation Guide View */}
        {activeTab === 'guide' && <VivaGuideModal />}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-[#090d16] py-4 text-center text-xs text-slate-500 font-mono">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>EventShield — Intelligent Flash-Crowd Traffic Orchestration Platform</span>
          <span className="text-slate-400">Notice: Simulated Metrics Prototype for Demonstration & Viva Evaluation</span>
        </div>
      </footer>
    </div>
  );
}
