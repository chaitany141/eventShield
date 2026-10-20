from typing import List, Optional, Tuple, Dict, Any
from app.models.metrics_model import BackendInstanceStats
from app.models.request_model import StepStatus

class BackendInstance:
    def __init__(self, id: str, name: str, capacity_rps: int = 15):
        self.id = id
        self.name = name
        self.capacity_rps = capacity_rps
        self.in_flight: int = 0
        self.is_healthy: bool = True
        self.processed_count: int = 0
        self.failed_count: int = 0
        self.total_latency_sum_ms: float = 0.0

    @property
    def utilization_pct(self) -> float:
        return min(100.0, round((self.in_flight / max(self.capacity_rps, 1)) * 100, 1))

    @property
    def avg_latency_ms(self) -> float:
        if self.processed_count == 0:
            return 0.0
        return round(self.total_latency_sum_ms / self.processed_count, 1)

    def to_stats(self) -> BackendInstanceStats:
        return BackendInstanceStats(
            id=self.id,
            name=self.name,
            capacity_rps=self.capacity_rps,
            in_flight=self.in_flight,
            is_healthy=self.is_healthy,
            processed_count=self.processed_count,
            failed_count=self.failed_count,
            utilization_pct=self.utilization_pct,
            avg_latency_ms=self.avg_latency_ms
        )

class LoadBalancer:
    """
    Distributes requests across multiple simulated backend service instances using
    Least-Loaded or Round-Robin scheduling. Automatically skips unhealthy backends.
    """
    def __init__(self, instance_count: int = 4, default_capacity: int = 15, algorithm: str = "least_loaded"):
        self.algorithm = algorithm
        self.instances: List[BackendInstance] = []
        self._round_robin_index: int = 0
        self._setup_instances(instance_count, default_capacity)

    def _setup_instances(self, count: int, default_capacity: int):
        self.instances = []
        names = [
            ("srv-east-01", "Primary Ticket & Inventory (US-East)"),
            ("srv-east-02", "Secondary Checkout Worker (US-East)"),
            ("srv-central-01", "Exam Processing Cluster (US-Central)"),
            ("srv-west-01", "High-Volume Catalog Worker (US-West)"),
            ("srv-eu-01", "EU Mirror Replica (Frankfurt)"),
            ("srv-ap-01", "APAC Gateway Worker (Singapore)"),
            ("srv-edge-01", "Edge Compute Microservice 01"),
            ("srv-edge-02", "Edge Compute Microservice 02"),
        ]
        for i in range(count):
            srv_id, name = names[i % len(names)]
            self.instances.append(BackendInstance(id=srv_id, name=name, capacity_rps=default_capacity))

    def update_instances(self, count: int, capacity_per_instance: int):
        count = max(1, min(count, 8))
        if len(self.instances) != count or (self.instances and self.instances[0].capacity_rps != capacity_per_instance):
            self._setup_instances(count, capacity_per_instance)

    @property
    def total_capacity(self) -> int:
        return sum(inst.capacity_rps for inst in self.instances if inst.is_healthy)

    @property
    def total_in_flight(self) -> int:
        return sum(inst.in_flight for inst in self.instances)

    @property
    def aggregate_utilization_pct(self) -> float:
        cap = self.total_capacity
        if cap == 0:
            return 100.0 if any(not inst.is_healthy for inst in self.instances) else 0.0
        return min(100.0, round((self.total_in_flight / cap) * 100, 1))

    def get_healthy_instances(self) -> List[BackendInstance]:
        return [inst for inst in self.instances if inst.is_healthy]

    def select_backend(self) -> Tuple[Optional[BackendInstance], StepStatus, str, Dict[str, Any]]:
        healthy = self.get_healthy_instances()
        if not healthy:
            return None, StepStatus.REJECTED, "503 Service Unavailable: All backend instances are down or unhealthy.", {
                "available_instances": 0,
                "total_instances": len(self.instances)
            }

        selected: BackendInstance
        if self.algorithm == "round_robin":
            selected = healthy[self._round_robin_index % len(healthy)]
            self._round_robin_index = (self._round_robin_index + 1) % len(healthy)
            algo_note = f"Round-Robin index #{self._round_robin_index}"
        else:  # Least-Loaded default
            selected = min(healthy, key=lambda inst: (inst.in_flight / max(inst.capacity_rps, 1)))
            algo_note = f"Least-Loaded (In-flight: {selected.in_flight}, Util: {selected.utilization_pct}%)"

        reason = (
            f"Routed to backend [{selected.id}] via {algo_note}. "
            f"Active healthy instances: {len(healthy)}/{len(self.instances)}."
        )

        return selected, StepStatus.PASS, reason, {
            "backend_id": selected.id,
            "backend_name": selected.name,
            "in_flight": selected.in_flight,
            "capacity": selected.capacity_rps,
            "healthy_count": len(healthy)
        }

    def acquire_backend(self, backend: BackendInstance):
        backend.in_flight += 1

    def release_backend(self, backend: BackendInstance, success: bool, latency_ms: float):
        backend.in_flight = max(0, backend.in_flight - 1)
        if success:
            backend.processed_count += 1
            backend.total_latency_sum_ms += latency_ms
        else:
            backend.failed_count += 1

    def toggle_health(self, backend_id: str, is_healthy: Optional[bool] = None) -> bool:
        for inst in self.instances:
            if inst.id == backend_id:
                inst.is_healthy = not inst.is_healthy if is_healthy is None else is_healthy
                return inst.is_healthy
        return False

    def set_capacity(self, backend_id: str, capacity: int) -> bool:
        for inst in self.instances:
            if inst.id == backend_id:
                inst.capacity_rps = max(1, capacity)
                return True
        return False

    def get_stats(self) -> List[BackendInstanceStats]:
        return [inst.to_stats() for inst in self.instances]

    def reset(self):
        for inst in self.instances:
            inst.in_flight = 0
            inst.is_healthy = True
            inst.processed_count = 0
            inst.failed_count = 0
            inst.total_latency_sum_ms = 0.0
        self._round_robin_index = 0
