import time
from collections import deque
from datetime import datetime
from typing import List, Dict, Any, Optional
from app.models.metrics_model import TimeSeriesPoint, MetricsSnapshot, BackendInstanceStats

class MetricsCollector:
    """
    Time-series aggregator and live performance telemetry engine.
    Computes exact statistical percentiles (p95, avg) from discrete request event latencies.
    """
    def __init__(self, history_length: int = 60):
        self.history_length = history_length
        self._history = deque(maxlen=history_length)
        
        # Cumulative lifetime counters
        self.total_generated: int = 0
        self.total_processed_success: int = 0
        self.total_cache_hits: int = 0
        self.total_rate_limited: int = 0
        self.total_queue_overflow: int = 0
        self.total_queue_timeout: int = 0
        self.total_suspicious_blocked: int = 0
        self.total_retries_attempted: int = 0
        self.total_retries_exhausted: int = 0
        
        # Window-level latencies for percentile calculations
        self._window_latencies = deque(maxlen=2000)

    def record_completed_request(self, latency_ms: float):
        self._window_latencies.append(latency_ms)

    def record_tick(
        self,
        incoming_count: int,
        processed_count: int,
        queued_count: int,
        rate_limited_count: int,
        cache_hit_count: int,
        backend_utilization_pct: float,
        flash_crowd_active: bool,
        backends_stats: List[BackendInstanceStats]
    ) -> MetricsSnapshot:
        now = time.time()
        time_label = datetime.fromtimestamp(now).strftime("%H:%M:%S")

        # Calculate exact latency percentiles from real window samples
        if self._window_latencies:
            latencies = sorted(list(self._window_latencies))
            avg_lat = round(sum(latencies) / len(latencies), 1)
            p95_index = int(len(latencies) * 0.95)
            p95_lat = round(latencies[min(p95_index, len(latencies) - 1)], 1)
        else:
            avg_lat = 0.0
            p95_lat = 0.0

        point = TimeSeriesPoint(
            timestamp=now,
            time_label=time_label,
            incoming_rps=incoming_count,
            processed_rps=processed_count,
            queued_count=queued_count,
            rate_limited_rps=rate_limited_count,
            cache_hit_rps=cache_hit_count,
            avg_latency_ms=avg_lat,
            p95_latency_ms=p95_lat,
            backend_utilization_pct=backend_utilization_pct
        )
        self._history.append(point)

        total_lookups = self.total_cache_hits + self.total_processed_success
        cache_hit_ratio = round((self.total_cache_hits / max(total_lookups, 1)) * 100, 1) if total_lookups > 0 else 0.0

        snapshot = MetricsSnapshot(
            timestamp=now,
            incoming_rps=incoming_count,
            processed_rps=processed_count,
            queued_count=queued_count,
            rate_limited_rps=rate_limited_count,
            cache_hit_rps=cache_hit_count,
            total_generated=self.total_generated,
            total_processed_success=self.total_processed_success,
            total_cache_hits=self.total_cache_hits,
            total_rate_limited=self.total_rate_limited,
            total_queue_overflow=self.total_queue_overflow,
            total_queue_timeout=self.total_queue_timeout,
            total_suspicious_blocked=self.total_suspicious_blocked,
            total_retries_attempted=self.total_retries_attempted,
            total_retries_exhausted=self.total_retries_exhausted,
            avg_latency_ms=avg_lat,
            p95_latency_ms=p95_lat,
            cache_hit_ratio_pct=cache_hit_ratio,
            backend_utilization_pct=backend_utilization_pct,
            flash_crowd_active=flash_crowd_active,
            backends=backends_stats
        )

        return snapshot

    def get_history(self) -> List[TimeSeriesPoint]:
        return list(self._history)

    def reset(self):
        self._history.clear()
        self._window_latencies.clear()
        self.total_generated = 0
        self.total_processed_success = 0
        self.total_cache_hits = 0
        self.total_rate_limited = 0
        self.total_queue_overflow = 0
        self.total_queue_timeout = 0
        self.total_suspicious_blocked = 0
        self.total_retries_attempted = 0
        self.total_retries_exhausted = 0
