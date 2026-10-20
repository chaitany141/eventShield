from fastapi import APIRouter, Depends
from app.api.dependencies import get_demo_runner, DemoRunner

router = APIRouter(prefix="/api/demo", tags=["demo"])

@router.post("/start")
async def start_demo(runner: DemoRunner = Depends(get_demo_runner)):
    await runner.start_demo()
    return {"status": "started", "demo": runner.get_status()}

@router.post("/stop")
async def stop_demo(runner: DemoRunner = Depends(get_demo_runner)):
    runner.stop_demo()
    return {"status": "stopped", "demo": runner.get_status()}

@router.get("/status")
async def get_demo_status(runner: DemoRunner = Depends(get_demo_runner)):
    return runner.get_status()
