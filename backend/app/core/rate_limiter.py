import time
from typing import Tuple, Dict, Any

class TokenBucketRateLimiter:
    """
    Standard Token Bucket Rate Limiter with burst allowance and continuous leak/refill.
    Adheres strictly to token bucket algorithm invariants.
    """
    def __init__(self, capacity: int = 60, refill_rate: float = 45.0):
        self.capacity = float(capacity)
        self.refill_rate = float(refill_rate)
        self.tokens = float(capacity)
        self.last_refill = time.time()
        
        self.total_allowed: int = 0
        self.total_limited: int = 0

    def _refill(self):
        now = time.time()
        elapsed = now - self.last_refill
        if elapsed > 0:
            added = elapsed * self.refill_rate
            self.tokens = min(self.capacity, self.tokens + added)
            self.last_refill = now

    def update_config(self, capacity: int, refill_rate: float):
        self._refill()
        self.capacity = float(capacity)
        self.refill_rate = float(refill_rate)
        self.tokens = min(self.tokens, self.capacity)

    def allow_request(self, cost: float = 1.0) -> Tuple[bool, str, Dict[str, Any]]:
        self._refill()
        
        if self.tokens >= cost:
            self.tokens -= cost
            self.total_allowed += 1
            available = round(self.tokens, 1)
            return True, f"Token granted. Tokens remaining: {available}/{int(self.capacity)}", {
                "allowed": True,
                "tokens_remaining": available,
                "capacity": self.capacity,
                "refill_rate": self.refill_rate
            }
        else:
            self.total_limited += 1
            available = round(self.tokens, 2)
            reason = (
                f"Rate limit exceeded: Token bucket exhausted. "
                f"Required {cost} token(s), only {available} available "
                f"(Bucket max: {int(self.capacity)}, refill: {self.refill_rate}/s)."
            )
            return False, reason, {
                "allowed": False,
                "tokens_remaining": available,
                "capacity": self.capacity,
                "refill_rate": self.refill_rate
            }

    def get_stats(self) -> Dict[str, Any]:
        self._refill()
        return {
            "tokens": round(self.tokens, 1),
            "capacity": int(self.capacity),
            "refill_rate": self.refill_rate,
            "fill_percentage": round((self.tokens / max(self.capacity, 1.0)) * 100, 1),
            "total_allowed": self.total_allowed,
            "total_limited": self.total_limited
        }

    def reset(self):
        self.tokens = float(self.capacity)
        self.last_refill = time.time()
        self.total_allowed = 0
        self.total_limited = 0
