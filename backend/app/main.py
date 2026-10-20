import asyncio
from contextlib import asynccontextmanager
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from app.api.dependencies import get_engine
from app.api.routes_simulation import router as simulation_router
from app.api.routes_inspector import router as inspector_router
from app.api.routes_metrics import router as metrics_router
from app.api.routes_backends import router as backends_router
from app.api.routes_demo import router as demo_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: ensure clean state
    engine = get_engine()
    yield
    # Shutdown: cleanly stop simulation loops
    engine.reset()

app = FastAPI(
    title="EventShield API",
    description="Intelligent Flash-Crowd Traffic Orchestration Platform API",
    version="1.0.0",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(simulation_router)
app.include_router(inspector_router)
app.include_router(metrics_router)
app.include_router(backends_router)
app.include_router(demo_router)

@app.get("/")
def root():
    return {
        "system": "EventShield Traffic Orchestrator",
        "status": "operational",
        "documentation": "/docs",
        "version": "1.0.0"
    }

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    engine = get_engine()
    await websocket.accept()
    engine.active_websockets.add(websocket)
    try:
        # Send initial snapshot immediately upon connection
        initial_stats = engine.load_balancer.get_stats()
        await websocket.send_json({
            "type": "INITIAL",
            "state": engine.state.model_dump(),
            "config": engine.config.model_dump(),
            "events": [e.model_dump() for e in engine.event_logger.get_events(limit=25)],
            "backends": [b.model_dump() for b in initial_stats]
        })
        while True:
            # Keep socket open and receive client heartbeats/messages
            data = await websocket.receive_text()
            if data == "PING":
                await websocket.send_text("PONG")
    except WebSocketDisconnect:
        engine.active_websockets.discard(websocket)
    except Exception:
        engine.active_websockets.discard(websocket)
