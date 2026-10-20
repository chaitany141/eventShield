from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field
from typing import Optional
from app.models.request_model import RequestItem, PriorityLevel
from app.models.event_model import Severity, EventCategory
from app.api.dependencies import get_engine, SimulationEngine

router = APIRouter(prefix="/api/inspector", tags=["inspector"])

class InspectRequestPayload(BaseModel):
    client_ip: str = "192.168.1.55"
    user_agent: str = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/128.0"
    endpoint: str = "/api/tickets/reserve"
    priority: PriorityLevel = PriorityLevel.HIGH
    is_cacheable: bool = False
    is_suspicious: bool = False
    allow_enqueue: bool = True

@router.post("/inspect")
def inspect_single_request(payload: InspectRequestPayload, engine: SimulationEngine = Depends(get_engine)):
    req = RequestItem(
        client_ip=payload.client_ip,
        user_agent=payload.user_agent,
        endpoint=payload.endpoint,
        priority=payload.priority,
        effective_priority=payload.priority,
        is_cacheable=payload.is_cacheable,
        is_suspicious=payload.is_suspicious
    )

    result = engine.pipeline.process_request(req, allow_enqueue=payload.allow_enqueue)

    engine.event_logger.log(
        severity=Severity.INFO,
        category=EventCategory.SYSTEM,
        title="Request Inspector Probe",
        message=f"Manual probe {result.id} evaluated. Result: {result.status.value} ({result.total_latency_ms}ms).",
        request_id=result.id
    )

    return result.model_dump()
