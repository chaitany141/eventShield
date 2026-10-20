import random
from typing import List
from app.models.request_model import RequestItem, PriorityLevel
from app.models.simulation_model import SimulationConfig, ScenarioType

class TrafficGenerator:
    """
    Synthesizes incoming traffic streams for EventShield simulation.
    Configures priority ratios, cache eligibility, and suspicious client profiles.
    """
    def __init__(self):
        self._endpoints_read = [
            "/api/tickets/availability",
            "/api/events/list",
            "/api/deals/catalog",
            "/api/exam/instructions",
            "/api/results/lookup"
        ]
        self._endpoints_write = [
            "/api/tickets/reserve",
            "/api/cart/checkout",
            "/api/exam/submit",
            "/api/deals/claim",
            "/api/auth/token"
        ]
        self._legitimate_ips = [
            "192.168.1.101", "192.168.1.102", "10.0.0.45", "10.0.0.78",
            "172.16.2.14", "172.16.2.89", "198.51.100.12", "203.0.113.4"
        ]
        self._suspicious_ips = [
            "185.220.101.5", "185.220.101.6", "45.154.255.88", "194.26.29.112"
        ]

    def generate_batch(self, config: SimulationConfig) -> List[RequestItem]:
        batch: List[RequestItem] = []
        count = config.rps

        for _ in range(count):
            # 1. Determine Priority
            is_high_priority = random.random() < (config.priority_traffic_pct / 100.0)
            if is_high_priority:
                priority = PriorityLevel.HIGH
            else:
                priority = PriorityLevel.NORMAL if random.random() < 0.8 else PriorityLevel.LOW

            # 2. Determine Suspicious flag
            is_suspicious = random.random() < (config.suspicious_pct / 100.0)
            if is_suspicious:
                client_ip = random.choice(self._suspicious_ips)
                user_agent = random.choice(["python-requests/2.31.0", "curl/8.1.2", "Scrapy/2.11.0 BotNet"])
            else:
                client_ip = random.choice(self._legitimate_ips)
                user_agent = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/128.0"

            # 3. Determine Cache Eligibility and Endpoint
            is_cacheable = random.random() < (config.cacheable_pct / 100.0)
            if is_cacheable:
                endpoint = random.choice(self._endpoints_read)
            else:
                endpoint = random.choice(self._endpoints_write)

            req = RequestItem(
                client_ip=client_ip,
                user_agent=user_agent,
                endpoint=endpoint,
                priority=priority,
                effective_priority=priority,
                is_cacheable=is_cacheable,
                is_suspicious=is_suspicious
            )
            batch.append(req)

        return batch
