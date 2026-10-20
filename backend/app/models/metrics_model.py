from typing import List
from pydantic import BaseModel, Field

class BackendInstanceStats(BaseModel):
    id: str
    name: str
    capacity_rps: int
    in_flight: int = 0
    is_healthy: bool = True
    processed_count: int = 0
    failed_count: int = 0
    utilization_pct: float = 0.0
    avg_latency_ms: float = 0.0

class TimeSeriesPoint(BaseModel):
    timestamp: float
    time_label: str
    incoming_rps: int
    processed_rps: int
    queued_count: int
    rate_limited_rps: int
    cache_hit_rps: int
    avg_latency_ms: float
    p95_latency_ms: float
    backend_utilization_pct: float

class MetricsSnapshot(BaseModel):
    timestamp: float
    incoming_rps: int = 0
    processed_rps: int = 0
    queued_count: int = 0
    rate_limited_rps: int = 0
    cache_hit_rps: int = 0
    
    # Totals
    total_generated: int = 0
    total_processed_success: int = 0
    total_cache_hits: int = 0
    total_rate_limited: int = 0
    total_queue_overflow: int = 0
    total_queue_timeout: int = 0
    total_suspicious_blocked: int = 0
    total_retries_attempted: int = 0
    total_retries_exhausted: int = 0
    
    # Performance & Ratios
    avg_latency_ms: float = 0.0
    p95_latency_ms: float = 0.0
    cache_hit_ratio_pct: float = 0.0
    backend_utilization_pct: float = 0.0
    
    # Flags & Backends
    flash_crowd_active: bool = False
    backends: List[BackendInstanceStats] = Field(default_factory=list)
