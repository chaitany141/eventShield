import time
from collections import deque
from typing import Tuple, Dict, Any

class FlashCrowdDetector:
    """
    Heuristic rule-based traffic classification and flash crowd surge detector.
    Transparently evaluates traffic rate of change and capacity ratios without black-box ML.
    """
    def __init__(
        self,
        surge_multiplier: float = 1.8,
        surge_delta_threshold: int = 30,
        window_size: int = 5
    ):
        self.surge_multiplier = surge_multiplier
        self.surge_delta_threshold = surge_delta_threshold
        self.window_size = window_size
        self._rate_history = deque(maxlen=window_size)
        self.is_flash_crowd: bool = False
        self.last_classification_reason: str = "Traffic volume within normal operating limits"
        self.baseline_rps: float = 20.0
        self.consecutive_normal_ticks: int = 0

    def evaluate(self, current_rps: int, total_backend_capacity: int) -> Tuple[bool, str, Dict[str, Any]]:
        """
        Evaluate instantaneous incoming RPS against moving baseline and backend capacity.
        Returns: (is_flash_crowd, reason, diagnostic_metrics)
        """
        self._rate_history.append(current_rps)
        
        # Calculate moving baseline average
        if len(self._rate_history) > 1:
            baseline = sum(list(self._rate_history)[:-1]) / (len(self._rate_history) - 1)
        else:
            baseline = float(current_rps)
        
        self.baseline_rps = round(baseline, 1)
        rate_change = current_rps - baseline
        capacity_ratio = current_rps / max(total_backend_capacity, 1)

        is_surge = False
        reason = "Traffic volume nominal"
        actions = []

        # Heuristic 1: Traffic sharply exceeds nominal capacity
        if current_rps > total_backend_capacity:
            is_surge = True
            reason = (
                f"Surge Detected: Current RPS ({current_rps}) exceeds total backend capacity "
                f"({total_backend_capacity}) by {round((capacity_ratio - 1.0) * 100)}%."
            )
            actions.append("Engage Token Bucket admission control")
            actions.append("Divert excess requests to Virtual Waiting Queue")

        # Heuristic 2: Sudden surge velocity (rate of change delta)
        elif rate_change >= self.surge_delta_threshold or (baseline > 5 and current_rps >= baseline * self.surge_multiplier):
            is_surge = True
            reason = (
                f"Rapid Traffic Acceleration: Surge rate +{int(rate_change)} req/s detected "
                f"({round(current_rps / max(baseline, 1), 1)}x baseline)."
            )
            actions.append("Preemptively restrict burst admission")
            actions.append("Arm virtual queue buffers")

        else:
            self.consecutive_normal_ticks += 1
            if self.consecutive_normal_ticks >= 3:
                is_surge = False
                reason = f"Normal Traffic: Incoming {current_rps} RPS is comfortably within {total_backend_capacity} RPS capacity."

        if is_surge:
            self.consecutive_normal_ticks = 0

        self.is_flash_crowd = is_surge
        self.last_classification_reason = reason

        diagnostics = {
            "current_rps": current_rps,
            "baseline_rps": self.baseline_rps,
            "rate_change": rate_change,
            "capacity_ratio": round(capacity_ratio, 2),
            "total_backend_capacity": total_backend_capacity,
            "actions_taken": actions,
            "is_flash_crowd": is_surge
        }

        return is_surge, reason, diagnostics

    def reset(self):
        self._rate_history.clear()
        self.is_flash_crowd = False
        self.last_classification_reason = "System reset. Nominal baseline."
        self.baseline_rps = 20.0
        self.consecutive_normal_ticks = 0
