import random
from typing import Tuple, Dict, Any
from app.models.request_model import RequestItem, StepStatus

class BoundedRetryHandler:
    """
    Bounded Retry Handler with Exponential Backoff and Retry Budget Circuit Breaker.
    Guarantees retry storms cannot overwhelm degraded backends during peak surges.
    """
    def __init__(self, max_retries: int = 2, retry_budget_pct: int = 10, base_backoff_ms: float = 20.0):
        self.max_retries = max_retries
        self.retry_budget_pct = retry_budget_pct
        self.base_backoff_ms = base_backoff_ms
        
        self.total_retries_attempted: int = 0
        self.total_retries_succeeded: int = 0
        self.total_retries_exhausted: int = 0
        self.total_retries_budget_aborted: int = 0

    def can_retry(self, request: RequestItem, current_window_requests: int) -> Tuple[bool, StepStatus, str, Dict[str, Any]]:
        # Check 1: Max retry attempts limit
        if request.retry_count >= self.max_retries:
            self.total_retries_exhausted += 1
            reason = (
                f"Retry limit exhausted ({request.retry_count}/{self.max_retries} attempts). "
                f"Halting retry loop to preserve downstream stability."
            )
            return False, StepStatus.REJECTED, reason, {
                "can_retry": False,
                "retry_count": request.retry_count,
                "max_retries": self.max_retries,
                "reason": "MAX_RETRIES_EXCEEDED"
            }

        # Check 2: Retry Budget (Circuit Breaker against Retry Storms)
        # Retries must not exceed configured percentage of total system traffic
        max_allowed_retries = max(2, int((current_window_requests * self.retry_budget_pct) / 100))
        if self.total_retries_attempted >= max_allowed_retries and current_window_requests > 20:
            self.total_retries_budget_aborted += 1
            reason = (
                f"Retry Budget Exhausted ({self.retry_budget_pct}% limit reached). "
                f"Retry suppressed to protect failing backend cluster from cascading collapse."
            )
            return False, StepStatus.REJECTED, reason, {
                "can_retry": False,
                "retry_count": request.retry_count,
                "retry_budget_pct": self.retry_budget_pct,
                "reason": "RETRY_BUDGET_EXCEEDED"
            }

        # Calculate bounded exponential backoff with full jitter
        request.retry_count += 1
        self.total_retries_attempted += 1
        
        exponential_ms = self.base_backoff_ms * (2 ** (request.retry_count - 1))
        jitter_ms = random.uniform(2.0, 10.0)
        backoff_ms = round(exponential_ms + jitter_ms, 1)

        reason = (
            f"Transient failure detected. Scheduling Bounded Retry #{request.retry_count}/{self.max_retries} "
            f"after {backoff_ms}ms backoff (Exponential backoff + jitter)."
        )

        return True, StepStatus.DELAYED, reason, {
            "can_retry": True,
            "retry_count": request.retry_count,
            "backoff_ms": backoff_ms,
            "max_retries": self.max_retries
        }

    def record_retry_success(self):
        self.total_retries_succeeded += 1

    def get_stats(self) -> Dict[str, Any]:
        return {
            "max_retries": self.max_retries,
            "retry_budget_pct": self.retry_budget_pct,
            "total_retries_attempted": self.total_retries_attempted,
            "total_retries_succeeded": self.total_retries_succeeded,
            "total_retries_exhausted": self.total_retries_exhausted,
            "total_retries_budget_aborted": self.total_retries_budget_aborted
        }

    def reset(self):
        self.total_retries_attempted = 0
        self.total_retries_succeeded = 0
        self.total_retries_exhausted = 0
        self.total_retries_budget_aborted = 0
