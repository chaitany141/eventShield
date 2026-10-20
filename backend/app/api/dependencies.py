from app.engine.simulator import SimulationEngine
from app.engine.demo_runner import DemoRunner

# Global singletons for FastAPI app
engine = SimulationEngine()
demo_runner = DemoRunner(engine)

def get_engine() -> SimulationEngine:
    return engine

def get_demo_runner() -> DemoRunner:
    return demo_runner
