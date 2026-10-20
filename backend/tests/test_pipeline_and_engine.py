import pytest
import asyncio
from app.engine.simulator import SimulationEngine
from app.models.simulation_model import SimulationConfig, ScenarioType
from app.models.request_model import RequestItem, PriorityLevel, RequestStatus

def test_pipeline_trace_generation():
    engine = SimulationEngine()
    req = RequestItem(
        endpoint="/api/tickets/reserve",
        priority=PriorityLevel.HIGH,
        is_cacheable=False,
        is_suspicious=False
    )

    result = engine.pipeline.process_request(req, allow_enqueue=True)
    assert len(result.trace) >= 4
    step_names = [s.step_name for s in result.trace]
    assert any("Ingestion" in name for name in step_names)
    assert any("Classification" in name for name in step_names)
    assert any("Cache" in name for name in step_names)
    assert any("Rate Limiter" in name for name in step_names)

def test_engine_lifecycle_and_reset():
    engine = SimulationEngine()
    assert engine.state.is_running is False

    engine.start()
    assert engine.state.is_running is True
    assert engine.state.is_paused is False

    # Calling start multiple times should not leak or duplicate tasks
    old_task = engine._loop_task
    engine.start()
    assert engine._loop_task == old_task

    engine.pause()
    assert engine.state.is_paused is True

    engine.resume()
    assert engine.state.is_paused is False

    # Reset
    engine.reset()
    assert engine.state.is_running is False
    assert engine.state.is_paused is False
    assert engine.state.elapsed_seconds == 0
    assert engine.waiting_queue.total_queued == 0
    assert engine.rate_limiter.total_allowed == 0

def test_metrics_consistency():
    engine = SimulationEngine()
    collector = engine.metrics_collector
    
    # Process 5 requests through pipeline
    for i in range(5):
        r = RequestItem(endpoint=f"/api/tickets/{i}", is_cacheable=False)
        engine.pipeline.process_request(r)

    assert collector.total_generated == 5
    assert (collector.total_processed_success + collector.total_rate_limited + collector.total_queue_overflow) == 5
