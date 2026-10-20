import asyncio
from typing import Optional, Dict, Any, List
from pydantic import BaseModel
from app.models.simulation_model import SimulationConfig, ScenarioType
from app.models.event_model import Severity, EventCategory

class DemoPhase(BaseModel):
    phase_number: int
    title: str
    duration_sec: int
    description: str
    key_metrics_focus: str

DEMO_PHASES: List[DemoPhase] = [
    DemoPhase(
        phase_number=1,
        title="1. Normal Baseline Traffic",
        duration_sec=4,
        description="Incoming traffic (20 RPS) is within backend capacity (60 RPS). Immediate admission, 0 queue, nominal 22ms latency.",
        key_metrics_focus="100% Admission, 0 Queue, Stable Latency"
    ),
    DemoPhase(
        phase_number=2,
        title="2. Ticket Release Flash Crowd Starts",
        duration_sec=4,
        description="Event goes live! Incoming traffic sharply accelerates from 20 to 80 RPS, exceeding 4-node backend capacity.",
        key_metrics_focus="Rapid Acceleration, Capacity Crossed"
    ),
    DemoPhase(
        phase_number=3,
        title="3. Heuristic Surge Detection Triggers",
        duration_sec=4,
        description="Flash-Crowd Detector identifies +300% surge velocity. EventShield engages protective throttling mode.",
        key_metrics_focus="Flash Crowd Status: ACTIVE, Explainable Rules"
    ),
    DemoPhase(
        phase_number=4,
        title="4. Token Bucket Rate Limiting Engaged",
        duration_sec=4,
        description="Token Bucket drains burst capacity. Rate limiter controls admission rate to protect downstream microservices.",
        key_metrics_focus="Token Drain, Admission Throttling"
    ),
    DemoPhase(
        phase_number=5,
        title="5. Virtual Waiting Queue Buffering",
        duration_sec=5,
        description="Excess legitimate requests enter Virtual Waiting Queue. Position and Estimated Waiting Time calculated for users.",
        key_metrics_focus="Queued Requests Building, Fair Buffering"
    ),
    DemoPhase(
        phase_number=6,
        title="6. Priority Routing & Starvation Protection",
        duration_sec=5,
        description="VIP checkout requests get expedited dispatch. Anti-starvation aging prevents normal/low tiers from stalling.",
        key_metrics_focus="High Priority Expedited, Anti-Starvation Boost"
    ),
    DemoPhase(
        phase_number=7,
        title="7. In-Memory Cache Absorption",
        duration_sec=4,
        description="High volume of read requests (seat availability, event catalog) served from memory with 1.5ms latency and 0 backend load.",
        key_metrics_focus="Cache Hit Ratio > 40%, Backend Load Sparing"
    ),
    DemoPhase(
        phase_number=8,
        title="8. Transient Server Failure & Bounded Retries",
        duration_sec=5,
        description="Server 'srv-east-02' experiences transient failure. Load Balancer reroutes, bounded retry handles blips without retry storm.",
        key_metrics_focus="Automatic Failover, Circuit-Breaker Protected Retry"
    ),
    DemoPhase(
        phase_number=9,
        title="9. Traffic Normalization & Queue Drain",
        duration_sec=5,
        description="Peak surge subsides (30 RPS). Available backend bandwidth smoothly drains buffered requests from the waiting queue.",
        key_metrics_focus="Queue Depletion, Zero Dropped VIPs"
    ),
    DemoPhase(
        phase_number=10,
        title="10. System Equilibrium Restored",
        duration_sec=4,
        description="Queues fully cleared (0). All backend instances healthy. Dashboard confirms resilient overload mitigation.",
        key_metrics_focus="System Healthy, Resilient Protection Proven"
    ),
]

class DemoRunner:
    """
    Coordinates the 10-phase scripted Flash Crowd demonstration for presentations.
    Controls simulation parameters sequentially while logging descriptive milestones.
    """
    def __init__(self, simulator_engine):
        self.engine = simulator_engine
        self.is_running: bool = False
        self.current_phase_index: int = 0
        self.elapsed_in_phase: int = 0
        self._task: Optional[asyncio.Task] = None

    def start_demo(self):
        if self.is_running:
            return
        self.is_running = True
        self.current_phase_index = 0
        self.elapsed_in_phase = 0
        self._task = asyncio.create_task(self._run_phases())

    def stop_demo(self):
        self.is_running = False
        if self._task and not self._task.done():
            self._task.cancel()
            self._task = None
        self.engine.pause()

    async def _run_phases(self):
        try:
            self.engine.reset()
            self.engine.start()

            for idx, phase in enumerate(DEMO_PHASES):
                if not self.is_running:
                    break
                self.current_phase_index = idx
                self.elapsed_in_phase = 0
                
                # Apply Phase Settings
                await self._apply_phase_settings(phase.phase_number)
                
                self.engine.event_logger.log(
                    severity=Severity.INFO,
                    category=EventCategory.SYSTEM,
                    title=f"Demo Milestone: {phase.title}",
                    message=phase.description
                )

                for sec in range(phase.duration_sec):
                    if not self.is_running:
                        break
                    self.elapsed_in_phase = sec + 1
                    await asyncio.sleep(1.0)

            if self.is_running:
                self.engine.event_logger.log(
                    severity=Severity.SUCCESS,
                    category=EventCategory.SYSTEM,
                    title="Flash Crowd Demo Completed",
                    message="All 10 stages demonstrated successfully. EventShield prevented backend cascade failure."
                )
                self.is_running = False

        except asyncio.CancelledError:
            pass

    async def _apply_phase_settings(self, phase_num: int):
        cfg = self.engine.config
        
        if phase_num == 1:
            cfg.scenario = ScenarioType.NORMAL
            cfg.rps = 20
            cfg.backend_instances = 4
            cfg.backend_capacity = 15
            cfg.cacheable_pct = 30
            cfg.suspicious_pct = 2
            cfg.priority_traffic_pct = 15
            self.engine.update_config(cfg)

        elif phase_num == 2:
            cfg.scenario = ScenarioType.FLASH_CROWD
            cfg.rps = 80
            cfg.cacheable_pct = 35
            cfg.priority_traffic_pct = 25
            self.engine.update_config(cfg)

        elif phase_num == 3:
            cfg.rps = 130
            cfg.token_bucket_capacity = 50
            cfg.token_refill_rate = 45
            self.engine.update_config(cfg)

        elif phase_num == 4:
            cfg.rps = 140
            self.engine.update_config(cfg)

        elif phase_num == 5:
            cfg.rps = 120
            cfg.priority_traffic_pct = 30
            self.engine.update_config(cfg)

        elif phase_num == 6:
            cfg.rps = 110
            cfg.priority_traffic_pct = 40
            self.engine.update_config(cfg)

        elif phase_num == 7:
            cfg.cacheable_pct = 60
            self.engine.update_config(cfg)

        elif phase_num == 8:
            # Simulate failure on backend srv-east-02
            self.engine.load_balancer.toggle_health("srv-east-02", is_healthy=False)
            self.engine.event_logger.log(
                severity=Severity.WARNING,
                category=EventCategory.BACKEND,
                title="Simulated Server Failure",
                message="srv-east-02 marked UNHEALTHY. Load Balancer immediately sheds traffic to remaining healthy nodes."
            )

        elif phase_num == 9:
            # Recover backend and drop traffic
            self.engine.load_balancer.toggle_health("srv-east-02", is_healthy=True)
            self.engine.event_logger.log(
                severity=Severity.SUCCESS,
                category=EventCategory.BACKEND,
                title="Server Recovered",
                message="srv-east-02 recovered and rejoined active pool."
            )
            cfg.rps = 25
            cfg.scenario = ScenarioType.NORMAL
            self.engine.update_config(cfg)

        elif phase_num == 10:
            cfg.rps = 18
            self.engine.update_config(cfg)

    def get_status(self) -> Dict[str, Any]:
        curr = DEMO_PHASES[self.current_phase_index] if self.current_phase_index < len(DEMO_PHASES) else None
        return {
            "is_running": self.is_running,
            "current_phase_index": self.current_phase_index,
            "total_phases": len(DEMO_PHASES),
            "current_phase": curr.model_dump() if curr else None,
            "elapsed_in_phase": self.elapsed_in_phase,
            "all_phases": [p.model_dump() for p in DEMO_PHASES]
        }
