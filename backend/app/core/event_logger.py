import time
from collections import deque
from typing import List, Optional
from datetime import datetime
from app.models.event_model import EventLog, Severity, EventCategory

class EventLogger:
    def __init__(self, max_capacity: int = 300):
        self._events = deque(maxlen=max_capacity)

    def log(
        self,
        severity: Severity,
        category: EventCategory,
        title: str,
        message: str,
        **metadata
    ) -> EventLog:
        now = time.time()
        time_str = datetime.fromtimestamp(now).strftime("%H:%M:%S.%f")[:-3]
        evt = EventLog(
            timestamp=now,
            time_str=time_str,
            severity=severity,
            category=category,
            title=title,
            message=message,
            metadata=metadata
        )
        self._events.append(evt)
        return evt

    def get_events(
        self,
        severity: Optional[Severity] = None,
        category: Optional[EventCategory] = None,
        limit: int = 100
    ) -> List[EventLog]:
        results = list(self._events)
        if severity:
            results = [e for e in results if e.severity == severity]
        if category:
            results = [e for e in results if e.category == category]
        return results[-limit:]

    def clear(self):
        self._events.clear()
