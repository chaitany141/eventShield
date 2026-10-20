# EventShield — Intelligent Flash-Crowd Traffic Orchestration Platform

[![Python 3.12](https://img.shields.io/badge/Python-3.12-blue.svg)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115+-emerald.svg)](https://fastapi.tiangolo.com/)
[![React 19](https://img.shields.io/badge/React-19-cyan.svg)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue.svg)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-8+-purple.svg)](https://vitejs.dev/)
[![Tests](https://img.shields.io/badge/Tests-24%20Passing-brightgreen.svg)]()

> **Honest Simulation Notice:** EventShield is a functional distributed systems prototype and simulation platform designed for college engineering presentations, technical viva examinations, and architectural defense. Metrics and network traffic are simulated internally using real mathematical models rather than external load injectors.

---

## 1. Project Overview

**EventShield** sits in front of backend microservices and databases to protect distributed web applications during sudden, catastrophic traffic spikes ("flash crowds") such as:
- Ticket drops (concerts, sporting tournaments)
- University examination submissions & national result announcements
- E-commerce flash sales & limited-quantity product drops

Instead of crashing under thread exhaustion and database connection starvation, EventShield orchestrates incoming traffic through a multi-tier protective pipeline:

```
Clients → Reverse Proxy → EventShield Core Modules → Backend Services → Data Store
```

### Core Capabilities Demonstrated
1. **Normal Baseline Handling**: Low queue, immediate admission, nominal ~22ms response latency.
2. **Flash Crowd Detection**: Heuristic detection based on moving baseline and surge velocity ($\Delta \text{RPS} / \Delta t$).
3. **Token Bucket Admission Control**: Enforces hard burst and continuous refill bounds.
4. **Virtual Waiting Queue**: In-memory multi-priority FIFO queue with Estimated Waiting Time (EWT) via Little's Law.
5. **Anti-Starvation Priority Routing**: VIP fast-track with dynamic wait-time aging to protect lower tiers.
6. **Least-Loaded Load Balancer**: Dynamically routes to the backend with minimum in-flight concurrency; prunes dead nodes instantly.
7. **In-Memory Cache Layer**: Absorbs read-heavy traffic (seat maps, catalogs) with 1.5ms latency and 0 backend load.
8. **Suspicious / Bot Traffic Detection**: Heuristic multi-factor scoring of IP burst velocity and scraper patterns.
9. **Bounded Retries with Circuit Breaker**: Exponential backoff with jitter and a 10% Retry Budget preventing retry storms.
10. **Real-Time Observability**: Full-duplex WebSockets, live SVG charts, filterable audit trail, and Request Inspector.

---

## 2. Technology Stack

- **Frontend**: React 19, TypeScript, Vite 8, Tailwind CSS v4, Lucide Icons.
- **Backend**: Python 3.12, FastAPI, Uvicorn, WebSockets, Pydantic v2.
- **Testing**: Pytest, Pytest-Asyncio, HTTPX.
- **Containerization**: Docker, Docker Compose, Nginx.

---

## 3. Quick Start & Installation

### Option A: Local Development (Recommended)

#### Prerequisites
- Python 3.12+ installed
- Node.js 20+ & npm installed

#### 1. Start the FastAPI Backend
```bash
# In repository root:
python -m venv venv

# Windows PowerShell:
.\venv\Scripts\activate
# Linux/macOS:
source venv/bin/activate

# Install dependencies:
pip install -r backend/requirements.txt

# Launch FastAPI backend on port 8000:
python backend/run.py
```
Backend API will be running at: `http://localhost:8000` (Swagger docs at: `http://localhost:8000/docs`)

#### 2. Start the React Frontend
```bash
# In repository root (open a second terminal):
cd frontend
npm install
npm run dev
```
Open your browser at: **`http://localhost:5174/`** (or `http://localhost:5173/`).

---

### Option B: Docker Compose (One Command)

```bash
docker-compose up --build
```
Access the application at: `http://localhost:5173`.

---

## 4. Architecture & Execution Order

EventShield executes requests in the following sequential order:

```
[ Request Arrives ]
        │
        ▼
1. Pre-flight & Timestamping
        │
        ▼
2. Suspicious & Bot Heuristic Check (Demote/Block if score ≥ threshold)
        │
        ▼
3. In-Memory Cache Lookup (If cache hit: return immediately in 1.5ms, bypass queue & backends)
        │
        ▼
4. Token Bucket Rate Limiter
        ├── If tokens available: Consume token & admit immediately
        └── If tokens exhausted: Divert to Virtual Waiting Queue (or drop if queue full)
        │
        ▼
5. Virtual Waiting Queue Draining (FIFO within priority lanes)
        └── Dynamic Aging: Boost priority if wait time exceeds starvation threshold
        │
        ▼
6. Priority Routing Policy Evaluation
        │
        ▼
7. Least-Loaded Load Balancer (Selects healthy backend with minimum in-flight load)
        │
        ▼
8. Backend Microservice Execution
        └── On transient error: Bounded retry with exponential backoff & retry budget check
        │
        ▼
9. Metrics Recording & Real-Time WebSocket Push
```

---

## 5. API Endpoints Reference

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/simulation/start` | Starts the continuous simulation engine ticker |
| `POST` | `/api/simulation/pause` | Pauses simulated traffic flow |
| `POST` | `/api/simulation/resume` | Resumes traffic simulation |
| `POST` | `/api/simulation/reset` | Resets queues, token buckets, and metrics to baseline |
| `GET` | `/api/simulation/config` | Retrieves current configuration and simulation state |
| `POST` | `/api/simulation/config` | Updates simulation slider parameters |
| `POST` | `/api/simulation/scenario/{name}` | Switches scenario preset (`NORMAL`, `FLASH_CROWD`, `SUSPICIOUS`, `CUSTOM`) |
| `POST` | `/api/inspector/inspect` | Submits a single probe request and returns full step-by-step trace |
| `GET` | `/api/metrics/history` | Retrieves 60-second time-series history for charts |
| `GET` | `/api/metrics/logs` | Retrieves filterable system event audit logs |
| `DELETE` | `/api/metrics/logs` | Clears event log buffer |
| `POST` | `/api/metrics/cache/clear` | Flushes in-memory cache layer |
| `GET` | `/api/backends` | Lists all backend instances with load, in-flight, and health status |
| `POST` | `/api/backends/{id}/toggle-health`| Simulates server crash or restores backend to health |
| `POST` | `/api/demo/start` | Launches the scripted 10-phase presentation demo |
| `POST` | `/api/demo/stop` | Halts active presentation demo |
| `GET` | `/api/demo/status` | Returns current demo phase progress and explanations |
| `WS` | `/ws` | Full-duplex WebSocket push stream for live metrics and events |

---

## 6. Automated Testing & Verification

A comprehensive automated test suite covers all algorithmic guarantees:

```bash
# Run backend test suite:
.\venv\Scripts\pytest -v
```

### Verified Test Cases (24/24 Passing)
- `test_rate_limiter.py`: Permits requests within capacity, enforces token drain, refilled continuously, reset works.
- `test_waiting_queue.py`: Priority ordering (HIGH > NORMAL > LOW), capacity overflow shedding, TTL expiry, anti-starvation dynamic aging.
- `test_load_balancer.py`: Least-Loaded selection, automatic failover around unhealthy backends, all-down safety check.
- `test_cache.py`: Deterministic cache hit/miss, latency reduction, cache clear.
- `test_retry_handler.py`: Maximum retry bound, circuit-breaker retry budget preventing retry storms.
- `test_detector.py`: Heuristic surge identification, automatic recovery to nominal.
- `test_pipeline_and_engine.py`: Single trace generation, safe lifecycle (no duplicate loops on multi-start), metrics agreement.
- `test_api_endpoints.py`: End-to-end REST routes for simulation, inspector, backends, and demo runner.

---

## 7. Interactive Presentation Features

1. **One-Click Scripted Demo**:
   Click **"Run Flash Crowd Demo"** in the top bar to run an automated 10-phase presentation (Normal → Acceleration → Surge Detection → Token Bucket Drain → Virtual Queue Buffering → Priority Routing → Cache Absorption → Server Failure & Failover → Surge Drainage → System Recovery).
2. **Interactive Architecture Map**:
   Click on any of the 8 modules in the topology map to open a deep-dive modal detailing mathematical invariants, configuration, and live telemetry.
3. **Single-Request Inspector**:
   Submit individual transaction probes to trace step-by-step decisions, latency deltas, and pass/delayed/rejected reasons.
4. **Built-in Presentation & Viva Guide**:
   Access comprehensive viva Q&A, a 3-minute demo script, and architecture theory directly within the UI.

---

## 8. Known Limitations

- **Simulated Metrics**: Latencies and requests are synthesized within an in-memory event simulation engine to avoid physical network bottlenecks during presentation.
- **In-Memory Volatility**: Queue buffers and cache entries reside in-memory; restarting the backend clears non-persistent historical logs.
- **Single Machine Node**: While the architecture simulates multiple distributed backend nodes (`srv-east-01`, `srv-east-02`, etc.), all workers run inside the Python process for zero-dependency local execution.

---

## 9. Documentation Links
- [Viva Voce & Technical Defense Guide](file:///c:/Users/chait/OneDrive/Desktop/be%20project%20demo/VIVA_GUIDE.md)
- [3–5 Minute Presentation & Live Demo Script](file:///c:/Users/chait/OneDrive/Desktop/be%20project%20demo/DEMO_SCRIPT.md)
