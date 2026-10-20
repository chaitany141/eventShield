from fastapi import APIRouter, Depends, Query
from typing import Optional, List
from app.models.event_model import Severity, EventCategory
from app.api.dependencies import get_engine, SimulationEngine

router = APIRouter(prefix="/api/metrics", tags=["metrics"])

@router.get("/history")
def get_metrics_history(engine: SimulationEngine = Depends(get_engine)):
    return engine.metrics_collector.get_history()

@router.get("/logs")
def get_event_logs(
    severity: Optional[Severity] = None,
    category: Optional[EventCategory] = None,
    limit: int = Query(default=100, ge=1, le=300),
    engine: SimulationEngine = Depends(get_engine)
):
    return engine.event_logger.get_events(severity=severity, category=category, limit=limit)

@router.delete("/logs")
def clear_event_logs(engine: SimulationEngine = Depends(get_engine)):
    engine.event_logger.clear()
    return {"status": "cleared"}

@router.post("/cache/clear")
def clear_cache(engine: SimulationEngine = Depends(get_engine)):
    engine.cache_layer.clear()
    return {"status": "cache_cleared", "cache_stats": engine.cache_layer.get_stats()}

@router.get("/components")
def get_component_states(engine: SimulationEngine = Depends(get_engine)):
    return {
        "detector": {
            "is_flash_crowd": engine.detector.is_flash_crowd,
            "reason": engine.detector.last_classification_reason,
            "baseline_rps": engine.detector.baseline_rps,
        },
        "rate_limiter": engine.rate_limiter.get_stats(),
        "waiting_queue": engine.waiting_queue.get_stats(),
        "priority_router": engine.priority_router.get_stats(),
        "load_balancer": {
            "algorithm": engine.load_balancer.algorithm,
            "total_capacity": engine.load_balancer.total_capacity,
            "utilization_pct": engine.load_balancer.aggregate_utilization_pct,
            "instances": engine.load_balancer.get_stats()
        },
        "cache": engine.cache_layer.get_stats(),
        "suspicious_detector": engine.suspicious_detector.get_stats(),
        "retry_handler": engine.retry_handler.get_stats()
    }
