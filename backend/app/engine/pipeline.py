import time
import random
from typing import Optional, Dict, Any, Tuple
from app.models.request_model import RequestItem, RequestStatus, StepStatus, PriorityLevel
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

class EventShieldPipeline:
    """
    Unified end-to-end Request Processing Pipeline for EventShield.
    Executes the exact same logical stages for simulated bulk traffic and individual Request Inspector probes.
    """
    def __init__(
        self,
        detector: FlashCrowdDetector,
        rate_limiter: TokenBucketRateLimiter,
        waiting_queue: VirtualWaitingQueue,
        priority_router: PriorityRouter,
        load_balancer: LoadBalancer,
        cache_layer: CacheLayer,
        suspicious_detector: SuspiciousTrafficDetector,
        retry_handler: BoundedRetryHandler,
        event_logger: EventLogger,
        metrics_collector: MetricsCollector
    ):
        self.detector = detector
        self.rate_limiter = rate_limiter
        self.waiting_queue = waiting_queue
        self.priority_router = priority_router
        self.load_balancer = load_balancer
        self.cache_layer = cache_layer
        self.suspicious_detector = suspicious_detector
        self.retry_handler = retry_handler
        self.event_logger = event_logger
        self.metrics_collector = metrics_collector

    def process_request(self, request: RequestItem, allow_enqueue: bool = True) -> RequestItem:
        start_time = time.time()
        self.metrics_collector.total_generated += 1

        # Step 1: Request Ingestion & Classification
        request.add_trace(
            step_name="1. Ingestion & Pre-flight",
            status=StepStatus.PASS,
            reason=f"Request received from client IP {request.client_ip} to endpoint {request.endpoint}.",
            latency_ms=0.5,
            priority=request.priority.value
        )

        # Step 2: Suspicious & Bot Heuristic Detection
        is_suspicious, susp_status, susp_reason, susp_data = self.suspicious_detector.analyze(request)
        request.add_trace(
            step_name="2. Traffic Classification & Suspicious Check",
            status=susp_status,
            reason=susp_reason,
            latency_ms=0.8,
            **susp_data
        )

        if susp_status == StepStatus.REJECTED:
            request.status = RequestStatus.SUSPICIOUS_DROPPED
            request.failure_reason = susp_reason
            self.metrics_collector.total_suspicious_blocked += 1
            self.event_logger.log(
                severity=Severity.WARNING,
                category=EventCategory.DETECTION,
                title="Malicious Traffic Blocked",
                message=f"Request {request.id} from {request.client_ip} dropped (Score: {susp_data.get('heuristic_score')}).",
                request_id=request.id
            )
            request.total_latency_ms = round((time.time() - start_time) * 1000, 1)
            self.metrics_collector.record_completed_request(request.total_latency_ms)
            return request

        # Step 3: Cache Lookup (Bypasses queue & backend on HIT)
        hit, cache_status, cache_reason, cache_data = self.cache_layer.lookup(request)
        request.add_trace(
            step_name="3. In-Memory Cache Lookup",
            status=cache_status,
            reason=cache_reason,
            latency_ms=1.5 if hit else 0.5,
            **cache_data
        )

        if hit:
            request.status = RequestStatus.PROCESSED_CACHE_HIT
            self.metrics_collector.total_cache_hits += 1
            request.total_latency_ms = 1.8
            self.metrics_collector.record_completed_request(request.total_latency_ms)
            return request

        # Step 4: Token Bucket Rate Limiting & Admission Control
        allowed, rl_reason, rl_data = self.rate_limiter.allow_request(cost=1.0)
        
        if not allowed:
            # If rate limited, can we buffer into Virtual Waiting Queue?
            if allow_enqueue:
                drain_rate = float(self.load_balancer.total_capacity)
                enqueued, q_reason, q_data = self.waiting_queue.enqueue(request, drain_rate=drain_rate)
                
                request.add_trace(
                    step_name="4. Rate Limiter & Virtual Queue Admission",
                    status=StepStatus.DELAYED if enqueued else StepStatus.REJECTED,
                    reason=f"{rl_reason} -> {q_reason}",
                    latency_ms=1.0,
                    **q_data
                )

                if enqueued:
                    # Request is successfully buffered in queue; will be drained asynchronously
                    self.event_logger.log(
                        severity=Severity.INFO,
                        category=EventCategory.QUEUE,
                        title="Request Queued",
                        message=f"Request {request.id} ({request.priority.value}) enqueued at position #{q_data.get('position')}.",
                        request_id=request.id
                    )
                    return request
                else:
                    # Queue overflow!
                    request.status = RequestStatus.QUEUE_OVERFLOW
                    request.failure_reason = q_reason
                    self.metrics_collector.total_queue_overflow += 1
                    self.event_logger.log(
                        severity=Severity.ERROR,
                        category=EventCategory.QUEUE,
                        title="Virtual Queue Overflow",
                        message=f"Queue capacity saturated. Request {request.id} dropped with 503.",
                        request_id=request.id
                    )
                    request.total_latency_ms = round((time.time() - start_time) * 1000, 1)
                    self.metrics_collector.record_completed_request(request.total_latency_ms)
                    return request
            else:
                # Direct rate limit rejection
                request.status = RequestStatus.RATE_LIMITED
                request.failure_reason = rl_reason
                self.metrics_collector.total_rate_limited += 1
                request.add_trace(
                    step_name="4. Rate Limiter Admission",
                    status=StepStatus.REJECTED,
                    reason=rl_reason,
                    latency_ms=0.5,
                    **rl_data
                )
                self.event_logger.log(
                    severity=Severity.WARNING,
                    category=EventCategory.RATE_LIMIT,
                    title="Rate Limit Exceeded",
                    message=f"Request {request.id} rejected by Token Bucket.",
                    request_id=request.id
                )
                request.total_latency_ms = round((time.time() - start_time) * 1000, 1)
                self.metrics_collector.record_completed_request(request.total_latency_ms)
                return request

        # Admitted directly via Token Bucket
        request.add_trace(
            step_name="4. Rate Limiter Admission",
            status=StepStatus.PASS,
            reason=rl_reason,
            latency_ms=0.5,
            **rl_data
        )

        # Step 5: Priority Routing Evaluation
        p_status, p_reason, p_data = self.priority_router.evaluate(request)
        request.add_trace(
            step_name="5. Priority Routing & Policy",
            status=p_status,
            reason=p_reason,
            latency_ms=0.4,
            **p_data
        )

        # Step 6: Backend Execution with Load Balancing & Retries
        return self._execute_on_backend(request, start_time)

    def _execute_on_backend(self, request: RequestItem, start_time: float) -> RequestItem:
        # Load balancer selection
        backend, lb_status, lb_reason, lb_data = self.load_balancer.select_backend()
        request.add_trace(
            step_name="6. Load Balancer Routing",
            status=lb_status,
            reason=lb_reason,
            latency_ms=0.6,
            **lb_data
        )

        if not backend or lb_status == StepStatus.REJECTED:
            request.status = RequestStatus.FAILED_RETRY_EXHAUSTED
            request.failure_reason = lb_reason
            request.total_latency_ms = round((time.time() - start_time) * 1000, 1)
            self.metrics_collector.record_completed_request(request.total_latency_ms)
            return request

        request.backend_id = backend.id
        self.load_balancer.acquire_backend(backend)

        # Simulate execution latency and transient failure probability (5% if backend healthy)
        base_service_ms = random.uniform(15.0, 35.0)
        has_transient_error = random.random() < 0.05  # 5% transient network/worker blip

        if has_transient_error:
            self.load_balancer.release_backend(backend, success=False, latency_ms=base_service_ms)
            
            # Check bounded retry
            can_retry, r_status, r_reason, r_data = self.retry_handler.can_retry(
                request, current_window_requests=self.metrics_collector.total_generated
            )
            request.add_trace(
                step_name="7. Transient Error & Bounded Retry",
                status=r_status,
                reason=r_reason,
                latency_ms=r_data.get("backoff_ms", base_service_ms),
                **r_data
            )

            if can_retry:
                self.event_logger.log(
                    severity=Severity.INFO,
                    category=EventCategory.RETRY,
                    title="Bounded Retry Initiated",
                    message=f"Request {request.id} retrying on secondary backend (Attempt #{request.retry_count}).",
                    request_id=request.id
                )
                # Re-execute on another backend
                return self._execute_on_backend(request, start_time)
            else:
                request.status = RequestStatus.FAILED_RETRY_EXHAUSTED
                request.failure_reason = r_reason
                self.metrics_collector.total_retries_exhausted += 1
                request.total_latency_ms = round((time.time() - start_time) * 1000 + base_service_ms, 1)
                self.metrics_collector.record_completed_request(request.total_latency_ms)
                return request

        # Successful processing!
        self.load_balancer.release_backend(backend, success=True, latency_ms=base_service_ms)
        if request.retry_count > 0:
            self.retry_handler.record_retry_success()

        request.status = RequestStatus.PROCESSED_SUCCESS
        request.service_time_ms = round(base_service_ms, 1)
        request.total_latency_ms = round((time.time() - start_time) * 1000 + base_service_ms + request.wait_time_ms, 1)
        
        request.add_trace(
            step_name="7. Backend Execution",
            status=StepStatus.PASS,
            reason=f"Successfully processed by {backend.id} in {request.service_time_ms}ms.",
            latency_ms=request.service_time_ms,
            backend_id=backend.id
        )

        self.metrics_collector.total_processed_success += 1
        self.metrics_collector.record_completed_request(request.total_latency_ms)
        return request

    def drain_queue_batch(self, max_batch_size: int = 40) -> int:
        """
        Drains up to max_batch_size requests from Virtual Waiting Queue
        and executes them on healthy backends.
        """
        processed_count = 0
        now = time.time()
        
        while processed_count < max_batch_size and self.waiting_queue.total_queued > 0:
            req = self.waiting_queue.dequeue(now=now)
            if not req:
                break
            
            # Request was dequeued; now route through priority policy and backend
            p_status, p_reason, p_data = self.priority_router.evaluate(req)
            req.add_trace(
                step_name="5. Priority Routing & Policy",
                status=p_status,
                reason=p_reason,
                latency_ms=0.2,
                **p_data
            )
            
            self._execute_on_backend(req, start_time=req.created_at)
            processed_count += 1

        return processed_count
