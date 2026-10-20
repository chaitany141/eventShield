export type ScenarioType = 'NORMAL' | 'FLASH_CROWD' | 'SUSPICIOUS' | 'CUSTOM';
export type PriorityLevel = 'HIGH' | 'NORMAL' | 'LOW';
export type RequestStatus =
  | 'PENDING'
  | 'ADMITTED'
  | 'QUEUED'
  | 'RATE_LIMITED'
  | 'QUEUE_OVERFLOW'
  | 'QUEUE_TIMEOUT'
  | 'SUSPICIOUS_DROPPED'
  | 'PROCESSED_SUCCESS'
  | 'PROCESSED_CACHE_HIT'
  | 'FAILED_RETRY_EXHAUSTED';

export type StepStatus = 'PASS' | 'DELAYED' | 'REJECTED' | 'SKIPPED';
export type Severity = 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR' | 'CRITICAL';
export type EventCategory =
  | 'DETECTION'
  | 'RATE_LIMIT'
  | 'QUEUE'
  | 'ROUTING'
  | 'CACHE'
  | 'BACKEND'
  | 'RETRY'
  | 'SYSTEM';

export interface TraceStep {
  step_name: string;
  status: StepStatus;
  latency_ms: number;
  reason: string;
  details: Record<string, any>;
}

export interface RequestItem {
  id: string;
  client_ip: string;
  user_agent: string;
  endpoint: string;
  priority: PriorityLevel;
  effective_priority: PriorityLevel;
  is_cacheable: boolean;
  is_suspicious: boolean;
  created_at: number;
  queue_enter_time?: number;
  service_time_ms: number;
  wait_time_ms: number;
  total_latency_ms: number;
  backend_id?: string;
  retry_count: number;
  status: RequestStatus;
  failure_reason?: string;
  trace: TraceStep[];
}

export interface SimulationConfig {
  scenario: ScenarioType;
  rps: number;
  backend_capacity: number;
  backend_instances: number;
  cacheable_pct: number;
  suspicious_pct: number;
  priority_traffic_pct: number;
  token_bucket_capacity: number;
  token_refill_rate: number;
  max_queue_capacity: number;
  queue_timeout_seconds: number;
  starvation_boost_seconds: number;
  max_retries: number;
  retry_budget_pct: number;
  load_balance_algo: string;
}

export interface SimulatorState {
  is_running: boolean;
  is_paused: boolean;
  scenario: ScenarioType;
  elapsed_seconds: number;
  total_generated: number;
  flash_crowd_detected: boolean;
  detection_reason: string;
}

export interface BackendInstanceStats {
  id: string;
  name: string;
  capacity_rps: number;
  in_flight: number;
  is_healthy: boolean;
  processed_count: number;
  failed_count: number;
  utilization_pct: number;
  avg_latency_ms: number;
}

export interface TimeSeriesPoint {
  timestamp: number;
  time_label: string;
  incoming_rps: number;
  processed_rps: number;
  queued_count: number;
  rate_limited_rps: number;
  cache_hit_rps: number;
  avg_latency_ms: number;
  p95_latency_ms: number;
  backend_utilization_pct: number;
}

export interface MetricsSnapshot {
  timestamp: number;
  incoming_rps: number;
  processed_rps: number;
  queued_count: number;
  rate_limited_rps: number;
  cache_hit_rps: number;
  total_generated: number;
  total_processed_success: number;
  total_cache_hits: number;
  total_rate_limited: number;
  total_queue_overflow: number;
  total_queue_timeout: number;
  total_suspicious_blocked: number;
  total_retries_attempted: number;
  total_retries_exhausted: number;
  avg_latency_ms: number;
  p95_latency_ms: number;
  cache_hit_ratio_pct: number;
  backend_utilization_pct: number;
  flash_crowd_active: boolean;
  backends: BackendInstanceStats[];
}

export interface EventLog {
  id: string;
  timestamp: number;
  time_str: string;
  severity: Severity;
  category: EventCategory;
  title: string;
  message: string;
  metadata: Record<string, any>;
}

export interface DemoPhase {
  phase_number: number;
  title: string;
  duration_sec: number;
  description: string;
  key_metrics_focus: string;
}

export interface DemoStatus {
  is_running: boolean;
  current_phase_index: number;
  total_phases: number;
  current_phase: DemoPhase | null;
  elapsed_in_phase: number;
  all_phases: DemoPhase[];
}

export interface ComponentStats {
  detector: {
    is_flash_crowd: boolean;
    reason: string;
    baseline_rps: number;
  };
  rate_limiter: {
    tokens: number;
    capacity: number;
    refill_rate: number;
    fill_percentage: number;
    total_allowed: number;
    total_limited: number;
  };
  waiting_queue: {
    total_queued: number;
    high_priority_queued: number;
    normal_priority_queued: number;
    low_priority_queued: number;
    max_capacity: number;
    fill_pct: number;
    total_enqueued: number;
    total_dequeued: number;
    total_overflows: number;
    total_timeouts: number;
    total_starvation_boosts: number;
  };
  priority_router: {
    high_processed: number;
    normal_processed: number;
    low_processed: number;
    total_routed: number;
    policy_description: string;
  };
  load_balancer: {
    algorithm: string;
    total_capacity: number;
    utilization_pct: number;
    instances: BackendInstanceStats[];
  };
  cache: {
    cached_entries_count: number;
    total_lookups: number;
    total_hits: number;
    total_misses: number;
    hit_ratio_pct: number;
  };
  suspicious_detector: {
    total_analyzed: number;
    total_flagged: number;
    total_demoted: number;
    total_blocked: number;
    suspicious_ratio_pct: number;
  };
  retry_handler: {
    max_retries: number;
    retry_budget_pct: number;
    total_retries_attempted: number;
    total_retries_succeeded: number;
    total_retries_exhausted: number;
    total_retries_budget_aborted: number;
  };
}
