import time
from collections import defaultdict, deque
from typing import Tuple, Dict, Any
from app.models.request_model import RequestItem, PriorityLevel, StepStatus

class SuspiciousTrafficDetector:
    """
    Transparent rule-based heuristic detector for botnets, credential stuffers, and abusive scrapers.
    Does NOT use opaque ML; uses explainable thresholds and multi-factor scoring.
    """
    def __init__(self, per_ip_burst_threshold: int = 15, score_block_threshold: int = 80):
        self.per_ip_burst_threshold = per_ip_burst_threshold
        self.score_block_threshold = score_block_threshold
        self._ip_request_windows = defaultdict(lambda: deque())
        
        self.total_analyzed: int = 0
        self.total_flagged: int = 0
        self.total_blocked: int = 0
        self.total_demoted: int = 0

    def analyze(self, request: RequestItem) -> Tuple[bool, StepStatus, str, Dict[str, Any]]:
        self.total_analyzed += 1
        now = time.time()
        client_ip = request.client_ip
        
        # 1. Update sliding window for client IP (last 2 seconds)
        window = self._ip_request_windows[client_ip]
        window.append(now)
        while window and (now - window[0]) > 2.0:
            window.popleft()

        burst_rate = len(window)
        score = 0
        reasons = []
        action = "ALLOW"

        # Rule 1: Synthetic bot flag or suspicious User-Agent
        if request.is_suspicious or "bot" in request.user_agent.lower() or "curl" in request.user_agent.lower():
            score += 50
            reasons.append("Identified automated scraping user-agent pattern")

        # Rule 2: IP velocity burst
        if burst_rate > self.per_ip_burst_threshold:
            score += 45
            reasons.append(f"Abnormal IP burst velocity ({burst_rate} reqs/2s > threshold {self.per_ip_burst_threshold})")

        # Rule 3: High-frequency rapid polling on checkout or reservation endpoint
        if burst_rate > 8 and "reserve" in request.endpoint:
            score += 20
            reasons.append("High-concurrency contention on high-value transaction endpoint")

        is_flagged = score >= 40

        if is_flagged:
            self.total_flagged += 1
            if score >= self.score_block_threshold:
                self.total_blocked += 1
                action = "BLOCK"
                status = StepStatus.REJECTED
                explanation = (
                    f"Traffic flagged as Malicious/Abusive (Heuristic Score: {score}/100). "
                    f"Reasons: {'; '.join(reasons)}. Request dropped with 403 Forbidden."
                )
            else:
                self.total_demoted += 1
                action = "DEMOTE_TO_LOW_PRIORITY"
                status = StepStatus.PASS
                # Demote priority to LOW to protect legitimate users
                request.effective_priority = PriorityLevel.LOW
                explanation = (
                    f"Traffic flagged as Suspicious (Heuristic Score: {score}/100). "
                    f"Reasons: {'; '.join(reasons)}. Demoted to LOW priority queue with throttled concurrency."
                )
        else:
            status = StepStatus.PASS
            explanation = "Traffic verified as Legitimate Client (Heuristic score: nominal)."

        return is_flagged, status, explanation, {
            "heuristic_score": score,
            "burst_rate": burst_rate,
            "action_taken": action,
            "reasons": reasons,
            "is_flagged": is_flagged
        }

    def get_stats(self) -> Dict[str, Any]:
        return {
            "total_analyzed": self.total_analyzed,
            "total_flagged": self.total_flagged,
            "total_demoted": self.total_demoted,
            "total_blocked": self.total_blocked,
            "suspicious_ratio_pct": round((self.total_flagged / max(self.total_analyzed, 1)) * 100, 1)
        }

    def reset(self):
        self._ip_request_windows.clear()
        self.total_analyzed = 0
        self.total_flagged = 0
        self.total_blocked = 0
        self.total_demoted = 0
