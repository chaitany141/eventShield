import pytest
from fastapi.testclient import TestClient
from app.main import app

@pytest.fixture
def client():
    with TestClient(app) as c:
        yield c

def test_api_root(client):
    res = client.get("/")
    assert res.status_code == 200
    assert res.json()["system"] == "EventShield Traffic Orchestrator"

def test_api_simulation_lifecycle(client):
    # Start
    res = client.post("/api/simulation/start")
    assert res.status_code == 200
    assert res.json()["status"] == "started"

    # Pause
    res = client.post("/api/simulation/pause")
    assert res.status_code == 200
    assert res.json()["status"] == "paused"

    # Reset
    res = client.post("/api/simulation/reset")
    assert res.status_code == 200
    assert res.json()["status"] == "reset"

def test_api_request_inspector(client):
    payload = {
        "client_ip": "192.168.1.99",
        "user_agent": "Mozilla/5.0",
        "endpoint": "/api/tickets/reserve",
        "priority": "HIGH",
        "is_cacheable": False,
        "is_suspicious": False,
        "allow_enqueue": True
    }
    res = client.post("/api/inspector/inspect", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert "id" in data
    assert "status" in data
    assert len(data["trace"]) > 0

def test_api_backends_health_toggle(client):
    res = client.get("/api/backends")
    assert res.status_code == 200
    backends = res.json()["backends"]
    assert len(backends) > 0
    target_id = backends[0]["id"]

    # Toggle to unhealthy
    res = client.post(f"/api/backends/{target_id}/toggle-health", json={"is_healthy": False})
    assert res.status_code == 200
    assert res.json()["is_healthy"] is False

    # Restore to healthy
    res = client.post(f"/api/backends/{target_id}/toggle-health", json={"is_healthy": True})
    assert res.status_code == 200
    assert res.json()["is_healthy"] is True

def test_api_demo_status(client):
    res = client.get("/api/demo/status")
    assert res.status_code == 200
    assert "total_phases" in res.json()
    assert res.json()["total_phases"] == 10
