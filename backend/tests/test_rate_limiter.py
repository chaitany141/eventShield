import pytest
import time
from app.core.rate_limiter import TokenBucketRateLimiter

def test_token_bucket_permits_within_capacity():
    limiter = TokenBucketRateLimiter(capacity=10, refill_rate=5.0)
    
    # First 10 requests should succeed
    for i in range(10):
        allowed, reason, data = limiter.allow_request(cost=1.0)
        assert allowed is True
        assert data["allowed"] is True

    # 11th request should be rejected due to token exhaustion
    allowed, reason, data = limiter.allow_request(cost=1.0)
    assert allowed is False
    assert "Token bucket exhausted" in reason
    assert limiter.total_allowed == 10
    assert limiter.total_limited == 1

def test_token_bucket_refill():
    limiter = TokenBucketRateLimiter(capacity=5, refill_rate=10.0)
    
    # Exhaust tokens
    for _ in range(5):
        limiter.allow_request(cost=1.0)
    
    allowed, _, _ = limiter.allow_request(cost=1.0)
    assert allowed is False
    
    # Sleep 0.25 seconds (should refill 2.5 tokens)
    time.sleep(0.25)
    allowed, _, data = limiter.allow_request(cost=1.0)
    assert allowed is True
    assert data["tokens_remaining"] >= 0.0

def test_token_bucket_reset():
    limiter = TokenBucketRateLimiter(capacity=10, refill_rate=5.0)
    for _ in range(10):
        limiter.allow_request()
    assert limiter.tokens < 1.0
    limiter.reset()
    assert limiter.tokens == 10.0
    assert limiter.total_allowed == 0
    assert limiter.total_limited == 0
