import asyncio
import time
from typing import Set, Optional, Callable
from fastapi import WebSocket
from app.models.simulation_model import SimulationConfig, SimulatorState, ScenarioType
from app.models.request_model import RequestStatus
from app.models.event_model import Severity, EventCategory
from app.core.detector import FlashCrowdDetector
from app.core.rate_limiter import TokenBucketRateLimiter
from app.core.waiting_queue import VirtualWaitingQueue
from app.core.priority_router import PriorityRouter
from app.core.load_balancer import LoadBalancer
from app.core.cache import CacheLayer
from app.core.suspicious_detector import SuspiciousTrafficDetector
from app.core.retry_handler import BoundedRetryHandler
from app.core.event_logger import EventLogger
from app.core.metrics_collector import MetricsCollector
from app.engine.pipeline import EventShieldPipeline
from app.engine.traffic_generator import TrafficGenerator

class SimulationEngine:
    """
    Central orchestration engine driving continuous real-time simulation,
    algorithmic pipeline execution, time-series telemetry, and WebSocket broadcasts.
    """
    def __init__(self):
        self.config = SimulationConfig()
        self.state = SimulatorState()
        
        # Instantiate Core Algorithmic Components
        self.event_logger = EventLogger(max_capacity=300)
        self.metrics_collector = MetricsCollector(history_length=60)
        self.detector = FlashCrowdDetector(surge_multiplier=1.8, surge_delta_threshold=30)
        self.rate_limiter = TokenBucketRateLimiter(
            capacity=self.config.token_bucket_capacity,
            refill_rate=self.config.token_refill_rate
        )
        self.waiting_queue = VirtualWaitingQueue(
            max_capacity=self.config.max_queue_capacity,
            queue_timeout_seconds=self.config.queue_timeout_seconds,
            starvation_boost_seconds=self.config.starvation_boost_seconds
        )
        self.priority_router = PriorityRouter()
        self.load_balancer = LoadBalancer(
            instance_count=self.config.backend_instances,
            default_capacity=self.config.backend_capacity,
            algorithm=self.config.load_balance_algo
        )
        self.cache_layer = CacheLayer(default_ttl_seconds=30.0)
        self.suspicious_detector = SuspiciousTrafficDetector(per_ip_burst_threshold=15)
        self.retry_handler = BoundedRetryHandler(
            max_retries=self.config.max_retries,
            retry_budget_pct=self.config.retry_budget_pct
        )

        # Pipeline & Generator
        self.pipeline = EventShieldPipeline(
            detector=self.detector,
            rate_limiter=self.rate_limiter,
            waiting_queue=self.waiting_queue,
            priority_router=self.priority_router,
            load_balancer=self.load_balancer,
            cache_layer=self.cache_layer,
            suspicious_detector=self.suspicious_detector,
            retry_handler=self.retry_handler,
            event_logger=self.event_logger,
            metrics_collector=self.metrics_collector
        )
        self.generator = TrafficGenerator()

        # WebSockets and Task Management
        self.active_websockets: Set[WebSocket] = set()
        self._loop_task: Optional[asyncio.Task] = None
        self._is_ticking = False

    def start(self):
        if not self.state.is_running:
            self.state.is_running = True
            self.state.is_paused = False
            self.event_logger.log(
                severity=Severity.INFO,
                category=EventCategory.SYSTEM,
                title="Simulation Started",
                message=f"EventShield simulation started in {self.config.scenario.value} mode at {self.config.rps} RPS."
            )
            try:
                loop = asyncio.get_running_loop()
                if self._loop_task is None or self._loop_task.done():
                    self._loop_task = loop.create_task(self._simulation_loop())
            except RuntimeError:
                # No running event loop (e.g. in synchronous tests)
                pass

    def pause(self):
        self.state.is_paused = True
        self.event_logger.log(
            severity=Severity.INFO,
            category=EventCategory.SYSTEM,
            title="Simulation Paused",
            message="Traffic simulation paused by presenter."
        )

    def resume(self):
        if self.state.is_running:
            self.state.is_paused = False
            self.event_logger.log(
                severity=Severity.INFO,
                category=EventCategory.SYSTEM,
                title="Simulation Resumed",
                message="Traffic flow resumed."
            )

    def reset(self):
        self.state.is_running = False
        self.state.is_paused = False
        self.state.elapsed_seconds = 0
        self.state.total_generated = 0
        self.state.flash_crowd_detected = False
        self.state.detection_reason = "Nominal baseline"

        # Cancel loop task cleanly
        if self._loop_task and not self._loop_task.done():
            self._loop_task.cancel()
            self._loop_task = None

        # Reset all core algorithmic components
        self.detector.reset()
        self.rate_limiter.reset()
        self.waiting_queue.reset()
        self.priority_router.reset()
        self.load_balancer.reset()
        self.cache_layer.clear()
        self.suspicious_detector.reset()
        self.retry_handler.reset()
        self.metrics_collector.reset()
        self.event_logger.clear()

        self.event_logger.log(
            severity=Severity.INFO,
            category=EventCategory.SYSTEM,
            title="Simulation Reset",
            message="All queues drained, metrics cleared, and token buckets restored to capacity."
        )

    def update_config(self, new_config: SimulationConfig):
        old_scenario = self.config.scenario
        self.config = new_config
        self.state.scenario = new_config.scenario

        # Sync components with new configurations
        self.rate_limiter.update_config(
            capacity=new_config.token_bucket_capacity,
            refill_rate=new_config.token_refill_rate
        )
        self.waiting_queue.max_capacity = new_config.max_queue_capacity
        self.waiting_queue.queue_timeout_seconds = new_config.queue_timeout_seconds
        self.waiting_queue.starvation_boost_seconds = new_config.starvation_boost_seconds
        self.load_balancer.algorithm = new_config.load_balance_algo
        self.load_balancer.update_instances(new_config.backend_instances, new_config.backend_capacity)
        self.retry_handler.max_retries = new_config.max_retries
        self.retry_handler.retry_budget_pct = new_config.retry_budget_pct

        if old_scenario != new_config.scenario:
            self.event_logger.log(
                severity=Severity.INFO,
                category=EventCategory.SYSTEM,
                title="Scenario Switched",
                message=f"Switched scenario to {new_config.scenario.value} ({new_config.rps} RPS)."
            )

    async def _simulation_loop(self):
        """Asynchronous ticker driving 1-second simulation cycles."""
        try:
            while self.state.is_running:
                if not self.state.is_paused:
                    await self._tick()
                await asyncio.sleep(1.0)
        except asyncio.CancelledError:
            pass
        except Exception as e:
            self.event_logger.log(
                severity=Severity.CRITICAL,
                category=EventCategory.SYSTEM,
                title="Simulation Engine Error",
                message=str(e)
            )

    async def _tick(self):
        self.state.elapsed_seconds += 1

        # 1. Evaluate Flash Crowd Detector
        total_backend_cap = self.load_balancer.total_capacity
        is_surge, surge_reason, diag = self.detector.evaluate(self.config.rps, total_backend_cap)
        
        if is_surge and not self.state.flash_crowd_detected:
            self.state.flash_crowd_detected = True
            self.state.detection_reason = surge_reason
            self.event_logger.log(
                severity=Severity.WARNING,
                category=EventCategory.DETECTION,
                title="Flash Crowd Surge Detected!",
                message=surge_reason
            )
        elif not is_surge and self.state.flash_crowd_detected:
            self.state.flash_crowd_detected = False
            self.state.detection_reason = surge_reason
            self.event_logger.log(
                severity=Severity.SUCCESS,
                category=EventCategory.DETECTION,
                title="Flash Crowd Subsided",
                message="Traffic volume has normalized back into backend capacity."
            )

        # 2. Generate and Process Batch of Requests
        batch = self.generator.generate_batch(self.config)
        self.state.total_generated += len(batch)
        
        tick_processed = 0
        tick_cache_hits = 0
        tick_rate_limited = 0

        for req in batch:
            res = self.pipeline.process_request(req, allow_enqueue=True)
            if res.status == RequestStatus.PROCESSED_SUCCESS:
                tick_processed += 1
            elif res.status == RequestStatus.PROCESSED_CACHE_HIT:
                tick_cache_hits += 1
                tick_processed += 1
            elif res.status in (RequestStatus.RATE_LIMITED, RequestStatus.QUEUE_OVERFLOW):
                tick_rate_limited += 1

        # 3. Drain Virtual Queue Based on Backend Capacity
        # Available drain slots = total healthy backend capacity minus directly admitted work
        available_slots = max(10, total_backend_cap)
        drained = self.pipeline.drain_queue_batch(max_batch_size=available_slots)
        tick_processed += drained

        # 4. Record Metrics Snapshot
        snapshot = self.metrics_collector.record_tick(
            incoming_count=len(batch),
            processed_count=tick_processed,
            queued_count=self.waiting_queue.total_queued,
            rate_limited_count=tick_rate_limited,
            cache_hit_count=tick_cache_hits,
            backend_utilization_pct=self.load_balancer.aggregate_utilization_pct,
            flash_crowd_active=self.state.flash_crowd_detected,
            backends_stats=self.load_balancer.get_stats()
        )

        # 5. Broadcast to connected WebSocket clients
        await self.broadcast({
            "type": "TICK",
            "snapshot": snapshot.model_dump(),
            "state": self.state.model_dump(),
            "events": [e.model_dump() for e in self.event_logger.get_events(limit=10)],
            "queue_stats": self.waiting_queue.get_stats(),
            "cache_stats": self.cache_layer.get_stats(),
            "rate_limiter_stats": self.rate_limiter.get_stats(),
            "suspicious_stats": self.suspicious_detector.get_stats()
        })

    async def broadcast(self, message: dict):
        if not self.active_websockets:
            return
        dead_sockets = set()
        for ws in self.active_websockets:
            try:
                await ws.send_json(message)
            except Exception:
                dead_sockets.add(ws)
        self.active_websockets.difference_update(dead_sockets)
