from enum import Enum
from typing import Dict, Any
from pydantic import BaseModel, Field
import time
import uuid

class Severity(str, Enum):
    INFO = "INFO"
    SUCCESS = "SUCCESS"
    WARNING = "WARNING"
    ERROR = "ERROR"
    CRITICAL = "CRITICAL"

class EventCategory(str, Enum):
    DETECTION = "DETECTION"
    RATE_LIMIT = "RATE_LIMIT"
    QUEUE = "QUEUE"
    ROUTING = "ROUTING"
    CACHE = "CACHE"
    BACKEND = "BACKEND"
    RETRY = "RETRY"
    SYSTEM = "SYSTEM"

class EventLog(BaseModel):
    id: str = Field(default_factory=lambda: f"evt_{uuid.uuid4().hex[:6]}")
    timestamp: float = Field(default_factory=time.time)
    time_str: str = ""
    severity: Severity = Severity.INFO
    category: EventCategory = EventCategory.SYSTEM
    title: str
    message: str
    metadata: Dict[str, Any] = Field(default_factory=dict)
