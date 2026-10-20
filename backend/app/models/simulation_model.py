from enum import Enum
from typing import Optional
from pydantic import BaseModel, Field

class ScenarioType(str, Enum):
    NORMAL = "NORMAL"
    FLASH_CROWD = "FLASH_CROWD"
    SUSPICIOUS = "SUSPICIOUS"
    CUSTOM = "CUSTOM"

class SimulationConfig(BaseModel):
    scenario: ScenarioType = ScenarioType.NORMAL
    rps: int = Field(default=25, ge=1, le=500, description="Incoming requests per second")
    backend_capacity: int = Field(default=15, ge=5, le=100, description="Requests per second capacity per instance")
    backend_instances: int = Field(default=4, ge=1, le=8, description="Number of active backend instances")
    cacheable_pct: int = Field(default=35, ge=0, le=100, description="Percentage of requests eligible for caching")
    suspicious_pct: int = Field(default=5, ge=0, le=100, description="Percentage of traffic exhibiting suspicious patterns")
    priority_traffic_pct: int = Field(default=20, ge=0, le=100, description="Percentage of High (VIP) priority requests")
    
    # Internal algorithm tuning
    token_bucket_capacity: int = Field(default=60, ge=10, le=500)
    token_refill_rate: int = Field(default=50, ge=5, le=500)
    max_queue_capacity: int = Field(default=350, ge=50, le=2000)
    queue_timeout_seconds: float = Field(default=8.0, ge=1.0, le=30.0)
    starvation_boost_seconds: float = Field(default=2.5, ge=0.5, le=10.0)
    max_retries: int = Field(default=2, ge=0, le=5)
    retry_budget_pct: int = Field(default=10, ge=0, le=50)
    load_balance_algo: str = Field(default="least_loaded", description="least_loaded or round_robin")

class SimulatorState(BaseModel):
    is_running: bool = False
    is_paused: bool = False
    scenario: ScenarioType = ScenarioType.NORMAL
    elapsed_seconds: int = 0
    total_generated: int = 0
    flash_crowd_detected: bool = False
    detection_reason: str = "Baseline traffic nominal"
