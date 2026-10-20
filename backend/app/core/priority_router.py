from typing import Tuple, Dict, Any
from app.models.request_model import RequestItem, PriorityLevel, StepStatus

class PriorityRouter:
    """
    Priority routing policy that evaluates request classification, ensures VIP fast-pathing,
    and documents fairness rules to prevent lower-priority starvation.
    """
    def __init__(self, vip_ratio_target: float = 0.7):
        self.vip_ratio_target = vip_ratio_target
        self.high_processed_count: int = 0
        self.normal_processed_count: int = 0
        self.low_processed_count: int = 0

    def evaluate(self, request: RequestItem) -> Tuple[StepStatus, str, Dict[str, Any]]:
        effective = request.effective_priority

        if effective == PriorityLevel.HIGH:
            self.high_processed_count += 1
            reason = (
                "Priority Class: HIGH (VIP/Critical). "
                "Route assigned: Fast-track lane with lowest queue latency."
            )
            return StepStatus.PASS, reason, {
                "assigned_lane": "FAST_TRACK",
                "effective_priority": effective.value,
                "fairness_tier": "VIP"
            }
        elif effective == PriorityLevel.NORMAL:
            self.normal_processed_count += 1
            reason = (
                "Priority Class: NORMAL (Standard User). "
                "Route assigned: Standard FIFO queue with aging-based starvation protection."
            )
            return StepStatus.PASS, reason, {
                "assigned_lane": "STANDARD",
                "effective_priority": effective.value,
                "fairness_tier": "STANDARD"
            }
        else:
            self.low_processed_count += 1
            reason = (
                "Priority Class: LOW (Background/Batch). "
                "Route assigned: Background lane; deferred during surge peaks."
            )
            return StepStatus.PASS, reason, {
                "assigned_lane": "BACKGROUND",
                "effective_priority": effective.value,
                "fairness_tier": "LOW"
            }

    def get_stats(self) -> Dict[str, Any]:
        total = self.high_processed_count + self.normal_processed_count + self.low_processed_count
        return {
            "high_processed": self.high_processed_count,
            "normal_processed": self.normal_processed_count,
            "low_processed": self.low_processed_count,
            "total_routed": total,
            "policy_description": (
                "Fair weighted priority: High (VIP) gets expedited dispatch; "
                "Normal/Low protected via dynamic wait-time aging."
            )
        }

    def reset(self):
        self.high_processed_count = 0
        self.normal_processed_count = 0
        self.low_processed_count = 0
