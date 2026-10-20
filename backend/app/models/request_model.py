from enum import Enum
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field
import time
import uuid

class PriorityLevel(str, Enum):
    HIGH = "HIGH"       # VIP / Critical Transactions
    NORMAL = "NORMAL"   # Regular Users
    LOW = "LOW"         # Background / Batch

class RequestStatus(str, Enum):
    PENDING = "PENDING"
    ADMITTED = "ADMITTED"
    QUEUED = "QUEUED"
    RATE_LIMITED = "RATE_LIMITED"
    QUEUE_OVERFLOW = "QUEUE_OVERFLOW"
    QUEUE_TIMEOUT = "QUEUE_TIMEOUT"
    SUSPICIOUS_DROPPED = "SUSPICIOUS_DROPPED"
    PROCESSED_SUCCESS = "PROCESSED_SUCCESS"
    PROCESSED_CACHE_HIT = "PROCESSED_CACHE_HIT"
    FAILED_RETRY_EXHAUSTED = "FAILED_RETRY_EXHAUSTED"

class StepStatus(str, Enum):
    PASS = "PASS"
    DELAYED = "DELAYED"
    REJECTED = "REJECTED"
    SKIPPED = "SKIPPED"

class TraceStep(BaseModel):
    step_name: str
    status: StepStatus
    latency_ms: float = 0.0
    reason: str
    details: Dict[str, Any] = Field(default_factory=dict)

class RequestItem(BaseModel):
    id: str = Field(default_factory=lambda: f"req_{uuid.uuid4().hex[:8]}")
    client_ip: str = "192.168.1.10"
    user_agent: str = "EventShield-Client/1.0"
    endpoint: str = "/api/tickets/reserve"
    priority: PriorityLevel = PriorityLevel.NORMAL
    effective_priority: PriorityLevel = PriorityLevel.NORMAL
    is_cacheable: bool = False
    is_suspicious: bool = False
    created_at: float = Field(default_factory=time.time)
    queue_enter_time: Optional[float] = None
    queue_exit_time: Optional[float] = None
    service_time_ms: float = 25.0
    wait_time_ms: float = 0.0
    total_latency_ms: float = 0.0
    backend_id: Optional[str] = None
    retry_count: int = 0
    status: RequestStatus = RequestStatus.PENDING
    failure_reason: Optional[str] = None
    trace: List[TraceStep] = Field(default_factory=list)

    def add_trace(self, step_name: str, status: StepStatus, reason: str, latency_ms: float = 0.0, **details):
        self.trace.append(
            TraceStep(
                step_name=step_name,
                status=status,
                latency_ms=round(latency_ms, 2),
                reason=reason,
                details=details
            )
        )
