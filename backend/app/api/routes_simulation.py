from fastapi import APIRouter, Depends
from app.models.simulation_model import SimulationConfig, ScenarioType
from app.api.dependencies import get_engine, SimulationEngine

router = APIRouter(prefix="/api/simulation", tags=["simulation"])

@router.post("/start")
async def start_simulation(engine: SimulationEngine = Depends(get_engine)):
    engine.start()
    return {"status": "started", "state": engine.state.model_dump()}

@router.post("/pause")
async def pause_simulation(engine: SimulationEngine = Depends(get_engine)):
    engine.pause()
    return {"status": "paused", "state": engine.state.model_dump()}

@router.post("/resume")
async def resume_simulation(engine: SimulationEngine = Depends(get_engine)):
    engine.resume()
    return {"status": "resumed", "state": engine.state.model_dump()}

@router.post("/reset")
async def reset_simulation(engine: SimulationEngine = Depends(get_engine)):
    engine.reset()
    return {"status": "reset", "state": engine.state.model_dump()}

@router.get("/config")
async def get_config(engine: SimulationEngine = Depends(get_engine)):
    return {
        "config": engine.config.model_dump(),
        "state": engine.state.model_dump()
    }

@router.post("/config")
async def update_config(config: SimulationConfig, engine: SimulationEngine = Depends(get_engine)):
    engine.update_config(config)
    return {
        "status": "updated",
        "config": engine.config.model_dump(),
        "state": engine.state.model_dump()
    }

@router.post("/scenario/{scenario_name}")
async def set_scenario(scenario_name: ScenarioType, engine: SimulationEngine = Depends(get_engine)):
    cfg = engine.config.model_copy()
    cfg.scenario = scenario_name

    if scenario_name == ScenarioType.NORMAL:
        cfg.rps = 25
        cfg.backend_instances = 4
        cfg.backend_capacity = 15
        cfg.cacheable_pct = 35
        cfg.suspicious_pct = 3
        cfg.priority_traffic_pct = 15

    elif scenario_name == ScenarioType.FLASH_CROWD:
        cfg.rps = 130
        cfg.backend_instances = 4
        cfg.backend_capacity = 15
        cfg.cacheable_pct = 40
        cfg.suspicious_pct = 5
        cfg.priority_traffic_pct = 25

    elif scenario_name == ScenarioType.SUSPICIOUS:
        cfg.rps = 80
        cfg.backend_instances = 4
        cfg.backend_capacity = 15
        cfg.cacheable_pct = 20
        cfg.suspicious_pct = 45
        cfg.priority_traffic_pct = 10

    engine.update_config(cfg)
    return {
        "status": "scenario_applied",
        "scenario": scenario_name.value,
        "config": engine.config.model_dump()
    }
