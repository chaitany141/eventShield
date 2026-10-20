from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from typing import Optional
from app.api.dependencies import get_engine, SimulationEngine
from app.models.event_model import Severity, EventCategory

router = APIRouter(prefix="/api/backends", tags=["backends"])

class SetCapacityPayload(BaseModel):
    capacity_rps: int = Field(..., ge=1, le=100)

class ToggleHealthPayload(BaseModel):
    is_healthy: Optional[bool] = None

@router.get("")
def list_backends(engine: SimulationEngine = Depends(get_engine)):
    return {
        "algorithm": engine.load_balancer.algorithm,
        "total_capacity": engine.load_balancer.total_capacity,
        "total_in_flight": engine.load_balancer.total_in_flight,
        "utilization_pct": engine.load_balancer.aggregate_utilization_pct,
        "backends": engine.load_balancer.get_stats()
    }

@router.post("/{backend_id}/toggle-health")
def toggle_backend_health(backend_id: str, payload: ToggleHealthPayload = None, engine: SimulationEngine = Depends(get_engine)):
    override_val = payload.is_healthy if payload else None
    new_state = engine.load_balancer.toggle_health(backend_id, is_healthy=override_val)
    
    status_str = "HEALTHY" if new_state else "UNHEALTHY (OFFLINE)"
    engine.event_logger.log(
        severity=Severity.INFO if new_state else Severity.WARNING,
        category=EventCategory.BACKEND,
        title=f"Backend Status Changed: {backend_id}",
        message=f"Backend [{backend_id}] is now {status_str}."
    )
    return {
        "backend_id": backend_id,
        "is_healthy": new_state,
        "total_active_capacity": engine.load_balancer.total_capacity
    }

@router.post("/{backend_id}/capacity")
def set_backend_capacity(backend_id: str, payload: SetCapacityPayload, engine: SimulationEngine = Depends(get_engine)):
    success = engine.load_balancer.set_capacity(backend_id, payload.capacity_rps)
    if not success:
        raise HTTPException(status_code=404, detail="Backend not found")
    
    engine.event_logger.log(
        severity=Severity.INFO,
        category=EventCategory.BACKEND,
        title=f"Backend Capacity Updated: {backend_id}",
        message=f"Backend [{backend_id}] capacity tuned to {payload.capacity_rps} RPS."
    )
    return {"backend_id": backend_id, "capacity_rps": payload.capacity_rps}
