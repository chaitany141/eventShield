import pytest
from app.core.detector import FlashCrowdDetector

def test_detector_identifies_surge():
    detector = FlashCrowdDetector(surge_multiplier=1.8, surge_delta_threshold=30)
    
    # Baseline traffic 20 RPS with capacity 60
    is_surge, reason, diag = detector.evaluate(current_rps=20, total_backend_capacity=60)
    assert is_surge is False

    # Surge above capacity: 100 RPS > 60 capacity
    is_surge, reason, diag = detector.evaluate(current_rps=100, total_backend_capacity=60)
    assert is_surge is True
    assert "Surge Detected" in reason
    assert diag["capacity_ratio"] > 1.0

def test_detector_returns_to_normal():
    detector = FlashCrowdDetector()
    detector.evaluate(120, 60) # Surge
    assert detector.is_flash_crowd is True

    # 3 consecutive normal ticks
    detector.evaluate(20, 60)
    detector.evaluate(20, 60)
    is_surge, reason, _ = detector.evaluate(20, 60)
    assert is_surge is False
    assert "Normal Traffic" in reason
