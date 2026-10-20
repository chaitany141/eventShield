import pytest
from app.core.retry_handler import BoundedRetryHandler
from app.models.request_model import RequestItem, StepStatus

def test_retry_limits_enforced():
    handler = BoundedRetryHandler(max_retries=2, retry_budget_pct=20)
    req = RequestItem(id="req_fail")

    # Attempt 1
    can_retry, status, reason, data = handler.can_retry(req, current_window_requests=100)
    assert can_retry is True
    assert status == StepStatus.DELAYED
    assert req.retry_count == 1

    # Attempt 2
    can_retry, status, reason, data = handler.can_retry(req, current_window_requests=100)
    assert can_retry is True
    assert req.retry_count == 2

    # Attempt 3 - Should exceed max_retries limit
    can_retry, status, reason, data = handler.can_retry(req, current_window_requests=100)
    assert can_retry is False
    assert status == StepStatus.REJECTED
    assert data["reason"] == "MAX_RETRIES_EXCEEDED"
    assert handler.total_retries_exhausted == 1

def test_retry_budget_prevents_retry_storm():
    # Budget of 5% on 40 requests = max 2 retries allowed
    handler = BoundedRetryHandler(max_retries=3, retry_budget_pct=5)
    
    # Simulate high retry pressure
    for i in range(2):
        r = RequestItem()
        handler.can_retry(r, current_window_requests=40)
    
    # 3rd retry should hit circuit breaker / budget exhaustion
    r3 = RequestItem()
    can_retry, status, reason, data = handler.can_retry(r3, current_window_requests=40)
    assert can_retry is False
    assert data["reason"] == "RETRY_BUDGET_EXCEEDED"
    assert handler.total_retries_budget_aborted >= 1
