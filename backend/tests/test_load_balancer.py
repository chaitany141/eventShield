import pytest
from app.core.load_balancer import LoadBalancer
from app.models.request_model import StepStatus

def test_load_balancer_skips_unhealthy():
    lb = LoadBalancer(instance_count=3, default_capacity=10)
    assert len(lb.instances) == 3
    assert lb.total_capacity == 30

    # Mark server 1 and 2 unhealthy
    lb.toggle_health("srv-east-01", is_healthy=False)
    lb.toggle_health("srv-east-02", is_healthy=False)

    assert lb.total_capacity == 10
    healthy = lb.get_healthy_instances()
    assert len(healthy) == 1
    assert healthy[0].id == "srv-central-01"

    # All requests should route to the only healthy instance
    backend, status, reason, data = lb.select_backend()
    assert status == StepStatus.PASS
    assert backend.id == "srv-central-01"

def test_load_balancer_all_unhealthy():
    lb = LoadBalancer(instance_count=2, default_capacity=10)
    lb.toggle_health(lb.instances[0].id, is_healthy=False)
    lb.toggle_health(lb.instances[1].id, is_healthy=False)

    backend, status, reason, _ = lb.select_backend()
    assert status == StepStatus.REJECTED
    assert backend is None
    assert "All backend instances are down" in reason

def test_load_balancer_least_loaded():
    lb = LoadBalancer(instance_count=2, default_capacity=10, algorithm="least_loaded")
    s1, s2 = lb.instances[0], lb.instances[1]

    # Give s1 in-flight load
    s1.in_flight = 5
    s2.in_flight = 1

    selected, _, _, _ = lb.select_backend()
    assert selected.id == s2.id
