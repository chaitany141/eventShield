import pytest
from app.core.cache import CacheLayer
from app.models.request_model import RequestItem, StepStatus

def test_cache_hit_and_miss():
    cache = CacheLayer(default_ttl_seconds=10.0)
    
    # Non-cacheable request
    req_write = RequestItem(endpoint="/api/cart/checkout", is_cacheable=False)
    hit, status, reason, data = cache.lookup(req_write)
    assert hit is False
    assert status == StepStatus.SKIPPED
    assert data["cacheable"] is False

    # Cacheable request for pre-populated key
    req_read = RequestItem(endpoint="/api/tickets/availability", is_cacheable=True)
    hit, status, reason, data = cache.lookup(req_read)
    assert hit is True
    assert status == StepStatus.PASS
    assert data["hit"] is True
    assert cache.total_hits >= 1

def test_cache_clear():
    cache = CacheLayer(default_ttl_seconds=10.0)
    req_read = RequestItem(endpoint="/api/tickets/availability", is_cacheable=True)
    
    cache.lookup(req_read)
    assert cache.total_hits >= 1
    
    cache.clear()
    assert cache.total_hits == 0
    assert cache.total_misses == 0
