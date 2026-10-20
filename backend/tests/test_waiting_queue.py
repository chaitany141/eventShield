import pytest
import time
from app.core.waiting_queue import VirtualWaitingQueue
from app.models.request_model import RequestItem, PriorityLevel, RequestStatus

def test_queue_priority_ordering():
    queue = VirtualWaitingQueue(max_capacity=50, queue_timeout_seconds=10.0, starvation_boost_seconds=5.0)
    
    # Enqueue Low, then Normal, then High
    low_req = RequestItem(id="req_low", priority=PriorityLevel.LOW)
    norm_req = RequestItem(id="req_norm", priority=PriorityLevel.NORMAL)
    high_req = RequestItem(id="req_high", priority=PriorityLevel.HIGH)

    queue.enqueue(low_req)
    queue.enqueue(norm_req)
    queue.enqueue(high_req)

    assert queue.total_queued == 3

    # High should dequeue first despite being enqueued last
    d1 = queue.dequeue()
    assert d1.id == "req_high"

    # Normal should dequeue second
    d2 = queue.dequeue()
    assert d2.id == "req_norm"

    # Low should dequeue third
    d3 = queue.dequeue()
    assert d3.id == "req_low"

def test_queue_capacity_overflow():
    queue = VirtualWaitingQueue(max_capacity=3, queue_timeout_seconds=10.0, starvation_boost_seconds=5.0)
    
    r1 = RequestItem(id="r1", priority=PriorityLevel.NORMAL)
    r2 = RequestItem(id="r2", priority=PriorityLevel.NORMAL)
    r3 = RequestItem(id="r3", priority=PriorityLevel.NORMAL)
    r4 = RequestItem(id="r4", priority=PriorityLevel.NORMAL)

    assert queue.enqueue(r1)[0] is True
    assert queue.enqueue(r2)[0] is True
    assert queue.enqueue(r3)[0] is True
    
    # 4th should overflow and reject
    success, reason, data = queue.enqueue(r4)
    assert success is False
    assert data["reason"] == "QUEUE_OVERFLOW"
    assert queue.total_overflows == 1

def test_queue_timeout_expiry():
    # Set short timeout of 0.1s
    queue = VirtualWaitingQueue(max_capacity=10, queue_timeout_seconds=0.1, starvation_boost_seconds=5.0)
    
    r1 = RequestItem(id="r1", priority=PriorityLevel.NORMAL)
    queue.enqueue(r1)
    
    time.sleep(0.15)
    # Dequeue should observe expiry and discard
    dequeued = queue.dequeue()
    assert dequeued is None
    assert queue.total_timeouts == 1

def test_queue_anti_starvation_aging():
    queue = VirtualWaitingQueue(max_capacity=10, queue_timeout_seconds=10.0, starvation_boost_seconds=0.1)
    
    r_normal = RequestItem(id="r_normal", priority=PriorityLevel.NORMAL)
    queue.enqueue(r_normal)
    
    time.sleep(0.15)
    
    # Now enqueue a new VIP request
    r_vip = RequestItem(id="r_vip", priority=PriorityLevel.HIGH)
    queue.enqueue(r_vip)

    # Because normal waited past starvation threshold, it should be boosted and dequeued!
    dequeued = queue.dequeue()
    assert dequeued.id == "r_normal"
    assert dequeued.effective_priority == PriorityLevel.HIGH
    assert queue.total_starvation_boosts >= 1
