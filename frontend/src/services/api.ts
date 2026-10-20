import {
  SimulationConfig,
  SimulatorState,
  MetricsSnapshot,
  TimeSeriesPoint,
  EventLog,
  DemoStatus,
  RequestItem,
  ComponentStats,
  ScenarioType,
  Severity,
  EventCategory,
} from '../types';

const BASE_URL = '';

export const api = {
  // Simulation Controls
  async startSimulation(): Promise<{ status: string; state: SimulatorState }> {
    const res = await fetch(`${BASE_URL}/api/simulation/start`, { method: 'POST' });
    return res.json();
  },

  async pauseSimulation(): Promise<{ status: string; state: SimulatorState }> {
    const res = await fetch(`${BASE_URL}/api/simulation/pause`, { method: 'POST' });
    return res.json();
  },

  async resumeSimulation(): Promise<{ status: string; state: SimulatorState }> {
    const res = await fetch(`${BASE_URL}/api/simulation/resume`, { method: 'POST' });
    return res.json();
  },

  async resetSimulation(): Promise<{ status: string; state: SimulatorState }> {
    const res = await fetch(`${BASE_URL}/api/simulation/reset`, { method: 'POST' });
    return res.json();
  },

  async getConfig(): Promise<{ config: SimulationConfig; state: SimulatorState }> {
    const res = await fetch(`${BASE_URL}/api/simulation/config`);
    return res.json();
  },

  async updateConfig(config: SimulationConfig): Promise<{ status: string; config: SimulationConfig; state: SimulatorState }> {
    const res = await fetch(`${BASE_URL}/api/simulation/config`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config),
    });
    return res.json();
  },

  async setScenario(scenario: ScenarioType): Promise<{ status: string; scenario: string; config: SimulationConfig }> {
    const res = await fetch(`${BASE_URL}/api/simulation/scenario/${scenario}`, { method: 'POST' });
    return res.json();
  },

  // Metrics & Logs
  async getHistory(): Promise<TimeSeriesPoint[]> {
    const res = await fetch(`${BASE_URL}/api/metrics/history`);
    return res.json();
  },

  async getLogs(params?: { severity?: Severity; category?: EventCategory; limit?: number }): Promise<EventLog[]> {
    const searchParams = new URLSearchParams();
    if (params?.severity) searchParams.append('severity', params.severity);
    if (params?.category) searchParams.append('category', params.category);
    if (params?.limit) searchParams.append('limit', params.limit.toString());
    const res = await fetch(`${BASE_URL}/api/metrics/logs?${searchParams.toString()}`);
    return res.json();
  },

  async clearLogs(): Promise<{ status: string }> {
    const res = await fetch(`${BASE_URL}/api/metrics/logs`, { method: 'DELETE' });
    return res.json();
  },

  async clearCache(): Promise<{ status: string; cache_stats: any }> {
    const res = await fetch(`${BASE_URL}/api/metrics/cache/clear`, { method: 'POST' });
    return res.json();
  },

  async getComponentStats(): Promise<ComponentStats> {
    const res = await fetch(`${BASE_URL}/api/metrics/components`);
    return res.json();
  },

  // Backends
  async getBackends(): Promise<any> {
    const res = await fetch(`${BASE_URL}/api/backends`);
    return res.json();
  },

  async toggleBackendHealth(backendId: string, isHealthy?: boolean): Promise<any> {
    const res = await fetch(`${BASE_URL}/api/backends/${backendId}/toggle-health`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_healthy: isHealthy }),
    });
    return res.json();
  },

  async setBackendCapacity(backendId: string, capacityRps: number): Promise<any> {
    const res = await fetch(`${BASE_URL}/api/backends/${backendId}/capacity`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ capacity_rps: capacityRps }),
    });
    return res.json();
  },

  // Request Inspector
  async inspectRequest(payload: {
    client_ip: string;
    endpoint: string;
    priority: string;
    is_cacheable: boolean;
    is_suspicious: boolean;
    allow_enqueue?: boolean;
  }): Promise<RequestItem> {
    const res = await fetch(`${BASE_URL}/api/inspector/inspect`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return res.json();
  },

  // Demo Runner
  async startDemo(): Promise<{ status: string; demo: DemoStatus }> {
    const res = await fetch(`${BASE_URL}/api/demo/start`, { method: 'POST' });
    return res.json();
  },

  async stopDemo(): Promise<{ status: string; demo: DemoStatus }> {
    const res = await fetch(`${BASE_URL}/api/demo/stop`, { method: 'POST' });
    return res.json();
  },

  async getDemoStatus(): Promise<DemoStatus> {
    const res = await fetch(`${BASE_URL}/api/demo/status`);
    return res.json();
  },
};
