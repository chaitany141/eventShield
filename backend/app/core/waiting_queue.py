import time
from collections import deque
from typing import Optional, Tuple, Dict, Any, List
from app.models.request_model import RequestItem, PriorityLevel, RequestStatus, StepStatus

class VirtualWaitingQueue:
    """
    Multi-priority Virtual Waiting Queue with:
    - Strict FIFO within priority tiers (HIGH, NORMAL, LOW)
    - Aging-based anti-starvation boost
    - Queue position and Estimated Wait Time (EWT) computation
    - Hard bounded capacity with overflow shedding
    - TTL / Expiration enforcement
    """
    def __init__(
        self,
        max_capacity: int = 350,
        queue_timeout_seconds: float = 8.0,
        starvation_boost_seconds: float = 2.5
    ):
        self.max_capacity = max_capacity
        self.queue_timeout_seconds = queue_timeout_seconds
        self.starvation_boost_seconds = starvation_boost_seconds
        
        self._high_queue = deque()
        self._normal_queue = deque()
        self._low_queue = deque()
        
        self.total_enqueued: int = 0
        self.total_dequeued: int = 0
        self.total_overflows: int = 0
        self.total_timeouts: int = 0
        self.total_starvation_boosts: int = 0

    @property
    def total_queued(self) -> int:
        return len(self._high_queue) + len(self._normal_queue) + len(self._low_queue)

    def enqueue(self, request: RequestItem, drain_rate: float = 30.0) -> Tuple[bool, str, Dict[str, Any]]:
        now = time.time()
        
        # Check queue overflow
        if self.total_queued >= self.max_capacity:
            # If high priority arrives and there are low priority items in queue, shed lowest priority to protect VIP
            if request.priority == PriorityLevel.HIGH and len(self._low_queue) > 0:
                evicted = self._low_queue.popleft()
                evicted.status = RequestStatus.QUEUE_OVERFLOW
                evicted.failure_reason = "Evicted to accommodate incoming VIP transaction"
                self.total_overflows += 1
            else:
                self.total_overflows += 1
                reason = (
                    f"Virtual Queue Overflow: Capacity limit ({self.max_capacity}) saturated. "
                    f"Request dropped to prevent server latency cascade."
                )
                return False, reason, {
                    "queued": False,
                    "reason": "QUEUE_OVERFLOW",
                    "total_queued": self.total_queued,
                    "max_capacity": self.max_capacity
                }

        request.queue_enter_time = now
        request.status = RequestStatus.QUEUED

        # Calculate queue position
        if request.priority == PriorityLevel.HIGH:
            pos = len(self._high_queue) + 1
            self._high_queue.append(request)
        elif request.priority == PriorityLevel.NORMAL:
            pos = len(self._high_queue) + len(self._normal_queue) + 1
            self._normal_queue.append(request)
        else:
            pos = self.total_queued + 1
            self._low_queue.append(request)

        self.total_enqueued += 1
        safe_drain = max(drain_rate, 1.0)
        ewt_sec = round(pos / safe_drain, 2)
        ewt_ms = round(ewt_sec * 1000, 1)

        reason = (
            f"Admitted to Virtual Waiting Queue (Priority: {request.priority.value}). "
            f"Queue Position #{pos}, Est. Waiting Time: {ewt_sec}s."
        )

        return True, reason, {
            "queued": True,
            "position": pos,
            "estimated_wait_sec": ewt_sec,
            "estimated_wait_ms": ewt_ms,
            "priority": request.priority.value,
            "total_queued": self.total_queued
        }

    def dequeue(self, now: Optional[float] = None) -> Optional[RequestItem]:
        """
        Dequeues next request based on priority, applying anti-starvation aging and TTL expiration.
        """
        if now is None:
            now = time.time()

        while self.total_queued > 0:
            candidate: Optional[RequestItem] = None
            source_queue = None

            # 1. Anti-Starvation Check:
            # Check if oldest Normal or Low request has been waiting longer than starvation threshold
            if len(self._normal_queue) > 0:
                head_normal = self._normal_queue[0]
                if (now - (head_normal.queue_enter_time or now)) >= self.starvation_boost_seconds:
                    candidate = self._normal_queue.popleft()
                    source_queue = "NORMAL_BOOSTED"
                    candidate.effective_priority = PriorityLevel.HIGH
                    self.total_starvation_boosts += 1
                    candidate.add_trace(
                        step_name="Anti-Starvation Aging",
                        status=StepStatus.PASS,
                        reason=f"Priority boosted from NORMAL to HIGH after {round(now - head_normal.queue_enter_time, 2)}s in queue.",
                        latency_ms=0.0
                    )

            if not candidate and len(self._low_queue) > 0:
                head_low = self._low_queue[0]
                if (now - (head_low.queue_enter_time or now)) >= (self.starvation_boost_seconds * 1.8):
                    candidate = self._low_queue.popleft()
                    source_queue = "LOW_BOOSTED"
                    candidate.effective_priority = PriorityLevel.NORMAL
                    self.total_starvation_boosts += 1
                    candidate.add_trace(
                        step_name="Anti-Starvation Aging",
                        status=StepStatus.PASS,
                        reason=f"Priority boosted from LOW to NORMAL after {round(now - head_low.queue_enter_time, 2)}s in queue.",
                        latency_ms=0.0
                    )

            # 2. Standard Priority Dequeue (HIGH > NORMAL > LOW)
            if not candidate:
                if len(self._high_queue) > 0:
                    candidate = self._high_queue.popleft()
                    source_queue = "HIGH"
                elif len(self._normal_queue) > 0:
                    candidate = self._normal_queue.popleft()
                    source_queue = "NORMAL"
                elif len(self._low_queue) > 0:
                    candidate = self._low_queue.popleft()
                    source_queue = "LOW"

            if not candidate:
                return None

            # 3. Expiry / TTL Check
            wait_time = (now - (candidate.queue_enter_time or now))
            candidate.wait_time_ms = round(wait_time * 1000, 1)

            if wait_time > self.queue_timeout_seconds:
                self.total_timeouts += 1
                candidate.status = RequestStatus.QUEUE_TIMEOUT
                candidate.failure_reason = f"Request expired after waiting {round(wait_time, 2)}s (max TTL: {self.queue_timeout_seconds}s)"
                candidate.add_trace(
                    step_name="Virtual Queue Dispatch",
                    status=StepStatus.REJECTED,
                    reason=candidate.failure_reason,
                    latency_ms=candidate.wait_time_ms
                )
                # Continue loop to get the next non-expired request
                continue

            # Valid dequeued request
            candidate.queue_exit_time = now
            self.total_dequeued += 1
            return candidate

        return None

    def purge_expired(self, now: Optional[float] = None) -> int:
        """Evicts expired requests without dispatching."""
        if now is None:
            now = time.time()
        expired_count = 0
        for q in [self._high_queue, self._normal_queue, self._low_queue]:
            valid_items = deque()
            while len(q) > 0:
                item = q.popleft()
                if (now - (item.queue_enter_time or now)) > self.queue_timeout_seconds:
                    item.status = RequestStatus.QUEUE_TIMEOUT
                    self.total_timeouts += 1
                    expired_count += 1
                else:
                    valid_items.append(item)
            q.extend(valid_items)
        return expired_count

    def get_stats(self) -> Dict[str, Any]:
        return {
            "total_queued": self.total_queued,
            "high_priority_queued": len(self._high_queue),
            "normal_priority_queued": len(self._normal_queue),
            "low_priority_queued": len(self._low_queue),
            "max_capacity": self.max_capacity,
            "fill_pct": round((self.total_queued / max(self.max_capacity, 1)) * 100, 1),
            "total_enqueued": self.total_enqueued,
            "total_dequeued": self.total_dequeued,
            "total_overflows": self.total_overflows,
            "total_timeouts": self.total_timeouts,
            "total_starvation_boosts": self.total_starvation_boosts
        }

    def reset(self):
        self._high_queue.clear()
        self._normal_queue.clear()
        self._low_queue.clear()
        self.total_enqueued = 0
        self.total_dequeued = 0
        self.total_overflows = 0
        self.total_timeouts = 0
        self.total_starvation_boosts = 0
