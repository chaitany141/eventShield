import time
import hashlib
from typing import Optional, Tuple, Dict, Any
from app.models.request_model import RequestItem, StepStatus

class CacheEntry:
    def __init__(self, key: str, data: Any, expires_at: float):
        self.key = key
        self.data = data
        self.expires_at = expires_at

class CacheLayer:
    """
    In-memory deterministic caching layer with TTL expiration.
    Absorbs repetitive reads (seat maps, catalogs, examination schedules)
    to prevent backend database exhaustion.
    """
    def __init__(self, default_ttl_seconds: float = 30.0):
        self.default_ttl = default_ttl_seconds
        self._store: Dict[str, CacheEntry] = {}
        self.total_lookups: int = 0
        self.total_hits: int = 0
        self.total_misses: int = 0
        self._prepopulate_deterministic_keys()

    def _prepopulate_deterministic_keys(self):
        """Pre-populate hot entries for consistent demo reproducibility."""
        now = time.time()
        hot_endpoints = [
            "/api/tickets/availability",
            "/api/events/list",
            "/api/deals/catalog",
            "/api/exam/instructions",
            "/api/results/lookup"
        ]
        for ep in hot_endpoints:
            key = self._generate_key(ep)
            self._store[key] = CacheEntry(
                key=key,
                data={"status": "available", "cached_payload": f"Cached static snapshot for {ep}"},
                expires_at=now + 3600
            )

    def _generate_key(self, endpoint: str) -> str:
        return hashlib.md5(endpoint.encode('utf-8')).hexdigest()[:12]

    def lookup(self, request: RequestItem) -> Tuple[bool, StepStatus, str, Dict[str, Any]]:
        self.total_lookups += 1
        
        if not request.is_cacheable:
            return False, StepStatus.SKIPPED, "Cache bypassed: Request is non-cacheable mutation (POST/PUT).", {
                "cacheable": False,
                "hit": False
            }

        key = self._generate_key(request.endpoint)
        now = time.time()
        entry = self._store.get(key)

        if entry and entry.expires_at > now:
            self.total_hits += 1
            reason = (
                f"Cache HIT [key: {key}]. Served in 1.5ms from in-memory cache. "
                f"Backend execution bypassed (0 backend worker load)."
            )
            return True, StepStatus.PASS, reason, {
                "cacheable": True,
                "hit": True,
                "cache_key": key,
                "ttl_remaining": round(entry.expires_at - now, 1)
            }
        else:
            self.total_misses += 1
            reason = f"Cache MISS [key: {key}]. Forwarding to backend for authoritative data retrieval."
            return False, StepStatus.PASS, reason, {
                "cacheable": True,
                "hit": False,
                "cache_key": key
            }

    def store(self, endpoint: str, data: Any, ttl: Optional[float] = None):
        key = self._generate_key(endpoint)
        ttl = ttl or self.default_ttl
        self._store[key] = CacheEntry(
            key=key,
            data=data,
            expires_at=time.time() + ttl
        )

    @property
    def hit_ratio_pct(self) -> float:
        cacheable_lookups = self.total_hits + self.total_misses
        if cacheable_lookups == 0:
            return 0.0
        return round((self.total_hits / cacheable_lookups) * 100, 1)

    def get_stats(self) -> Dict[str, Any]:
        return {
            "cached_entries_count": len(self._store),
            "total_lookups": self.total_lookups,
            "total_hits": self.total_hits,
            "total_misses": self.total_misses,
            "hit_ratio_pct": self.hit_ratio_pct
        }

    def clear(self):
        self._store.clear()
        self.total_hits = 0
        self.total_misses = 0
        self.total_lookups = 0
        self._prepopulate_deterministic_keys()
