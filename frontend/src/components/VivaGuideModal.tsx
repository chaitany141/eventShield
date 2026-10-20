import React, { useState } from 'react';
import {
  BookOpen,
  Award,
  HelpCircle,
  Cpu,
  Layers,
  Shield,
  Activity,
  CheckCircle2,
  FileText,
} from 'lucide-react';

export const VivaGuideModal: React.FC = () => {
  const [activeSubTab, setActiveSubTab] = useState<'viva' | 'script' | 'theory'>('viva');

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-6 mb-6 shadow-sm">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800 mb-6">
        <div>
          <div className="flex items-center space-x-2">
            <BookOpen className="w-5 h-5 text-cyan-400" />
            <h3 className="text-base font-bold text-slate-100">Viva Voce & Technical Presentation Guide</h3>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800">
              Exam & Demo Ready
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Comprehensive reference sheet for professors, evaluators, and presenters explaining system mechanics and lifecycle.
          </p>
        </div>

        {/* Sub-tabs */}
        <div className="flex items-center space-x-1 p-1 bg-slate-950 rounded-lg border border-slate-800 text-xs">
          <button
            onClick={() => setActiveSubTab('viva')}
            className={`px-3 py-1.5 rounded-md font-medium transition-all ${
              activeSubTab === 'viva'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Viva Q&A
          </button>
          <button
            onClick={() => setActiveSubTab('script')}
            className={`px-3 py-1.5 rounded-md font-medium transition-all ${
              activeSubTab === 'script'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            3-Min Demo Script
          </button>
          <button
            onClick={() => setActiveSubTab('theory')}
            className={`px-3 py-1.5 rounded-md font-medium transition-all ${
              activeSubTab === 'theory'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Architecture Theory
          </button>
        </div>
      </div>

      {/* Tab 1: Viva Voce Q&A */}
      {activeSubTab === 'viva' && (
        <div className="space-y-4 text-xs text-slate-300">
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
            <h4 className="font-bold text-cyan-300 flex items-center space-x-2">
              <span className="font-mono text-xs bg-cyan-950 px-1.5 py-0.5 rounded border border-cyan-800">Q1</span>
              <span>What is a flash crowd, and why do traditional web servers collapse under it?</span>
            </h4>
            <p className="leading-relaxed text-slate-400">
              A <strong className="text-slate-200">flash crowd</strong> is an instantaneous spike in legitimate traffic caused by time-critical events (ticket releases, flash sales, online exam submissions, exam results). Traditional servers fail due to <strong className="text-slate-200">thread starvation</strong>, database connection pool exhaustion, memory ballooning, and cascading latency timeouts that cause client refreshes, generating a self-inflicted DDoS storm.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
            <h4 className="font-bold text-cyan-300 flex items-center space-x-2">
              <span className="font-mono text-xs bg-cyan-950 px-1.5 py-0.5 rounded border border-cyan-800">Q2</span>
              <span>How does EventShield's Token Bucket algorithm work?</span>
            </h4>
            <p className="leading-relaxed text-slate-400">
              The <strong className="text-slate-200">Token Bucket</strong> holds up to a maximum capacity <em className="text-slate-300">C</em> (burst allowance) and refills continuously at rate <em className="text-slate-300">r</em> tokens/second. When a request arrives, if tokens ≥ 1, a token is decremented and the request passes immediately. If tokens &lt; 1, the request is diverted to the Virtual Waiting Queue or dropped with 429, guaranteeing downstream backends never receive more than their rated capacity.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
            <h4 className="font-bold text-cyan-300 flex items-center space-x-2">
              <span className="font-mono text-xs bg-cyan-950 px-1.5 py-0.5 rounded border border-cyan-800">Q3</span>
              <span>How is starvation of low-priority traffic prevented in the Virtual Waiting Queue?</span>
            </h4>
            <p className="leading-relaxed text-slate-400">
              EventShield implements <strong className="text-slate-200">dynamic wait-time aging</strong>. While High (VIP) traffic is expedited, if a Normal or Low priority request dwells in the queue longer than the starvation threshold (e.g. 2.5 seconds), its effective priority is dynamically boosted to HIGH. This guarantees fairness and bounds tail latency without compromising VIP transaction SLAs.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
            <h4 className="font-bold text-cyan-300 flex items-center space-x-2">
              <span className="font-mono text-xs bg-cyan-950 px-1.5 py-0.5 rounded border border-cyan-800">Q4</span>
              <span>What is a "Retry Storm" and how does the Bounded Retry Handler prevent it?</span>
            </h4>
            <p className="leading-relaxed text-slate-400">
              When a backend experiences transient overload, naive clients resubmit failed requests rapidly. Multiplying incoming load by retry attempts leads to an exponential failure cascade called a <strong className="text-slate-200">retry storm</strong>. EventShield bounds retries to a maximum of 2 attempts, injects exponential backoff with randomized jitter, and enforces a strict <strong className="text-slate-200">Retry Budget</strong> (retries cannot exceed 10% of total ingestion), aborting retries if the budget is depleted.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
            <h4 className="font-bold text-cyan-300 flex items-center space-x-2">
              <span className="font-mono text-xs bg-cyan-950 px-1.5 py-0.5 rounded border border-cyan-800">Q5</span>
              <span>How does the Least-Loaded Load Balancer handle backend node failures?</span>
            </h4>
            <p className="leading-relaxed text-slate-400">
              The load balancer actively tracks in-flight concurrency and health status of all worker nodes. When a node is marked unhealthy or crashes, it is immediately pruned from the active pool. Work is redistributed among healthy nodes according to current in-flight load. When the node recovers, it re-enters the active pool seamlessly.
            </p>
          </div>
        </div>
      )}

      {/* Tab 2: 3-Minute Demo Script */}
      {activeSubTab === 'script' && (
        <div className="space-y-4 text-xs text-slate-300 leading-relaxed">
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-mono font-bold text-cyan-400">Minute 0:00 – 0:45</span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300">Baseline Phase</span>
            </div>
            <p className="text-slate-400">
              <strong className="text-slate-200">What to click:</strong> Click <em>"Run Flash Crowd Demo"</em> or select <em>"Normal Traffic"</em> scenario.<br />
              <strong className="text-slate-200">What to say:</strong> "Good morning professors. This is EventShield, an intelligent traffic orchestration platform designed to protect distributed web applications during flash crowds. Currently, we observe normal traffic at 20 RPS. With 4 backend instances handling 15 RPS each (60 RPS total capacity), all requests are admitted directly, queues are zero, and response latency stays at a nominal 22ms."
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-mono font-bold text-cyan-400">Minute 0:45 – 1:45</span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300">Flash Crowd Surge & Admission</span>
            </div>
            <p className="text-slate-400">
              <strong className="text-slate-200">What to observe:</strong> Traffic surges to 130 RPS. Watch the red <em>"FLASH CROWD DETECTED"</em> badge activate.<br />
              <strong className="text-slate-200">What to say:</strong> "Now, ticket bookings open. Traffic suddenly leaps by 300% to 130 RPS, exceeding backend capacity. Notice how EventShield's heuristic detector triggers immediately. Instead of crashing our backend services, the Token Bucket rate limiter caps admission, while excess legitimate requests are buffered into the Virtual Waiting Queue."
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-mono font-bold text-cyan-400">Minute 1:45 – 2:30</span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300">Priority, Cache & Failover</span>
            </div>
            <p className="text-slate-400">
              <strong className="text-slate-200">What to observe:</strong> Point to Cache Hit Ratio (&gt;35%) and Simulated Server Crash.<br />
              <strong className="text-slate-200">What to say:</strong> "Notice three critical distributed systems optimizations: First, read-heavy catalog requests are absorbed by the in-memory cache layer in 1.5ms with zero backend work. Second, VIP transactions are expedited through priority queues. Third, when a backend server crashes, our load balancer immediately sheds work to surviving nodes and applies bounded retries without causing a retry storm."
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-mono font-bold text-cyan-400">Minute 2:30 – 3:00</span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300">Recovery & Request Inspector</span>
            </div>
            <p className="text-slate-400">
              <strong className="text-slate-200">What to click:</strong> Open <em>"Request Inspector"</em> tab and submit a probe request.<br />
              <strong className="text-slate-200">What to say:</strong> "Finally, as the surge recedes, the virtual queue smoothly drains to zero. On our Request Inspector tab, evaluators can submit individual transaction probes to observe the transparent step-by-step decision trace through all 7 stages of our pipeline."
            </p>
          </div>
        </div>
      )}

      {/* Tab 3: Architecture Theory */}
      {activeSubTab === 'theory' && (
        <div className="space-y-4 text-xs text-slate-300 leading-relaxed">
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
            <h4 className="font-bold text-white text-sm">Distributed Systems Pipeline Lifecycle</h4>
            <div className="p-3 bg-slate-900 rounded-lg font-mono text-[11px] text-cyan-300">
              Client Ingestion → Heuristic Surge Classification → Bot / Abuse Check → In-Memory Cache Lookup → Token Bucket Admission Control → Virtual Waiting Queue Buffering → Weighted Priority Routing → Least-Loaded Load Balancing → Downstream Microservices → Observability Telemetry
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
              <h5 className="font-semibold text-cyan-300">Little's Law in Waiting Queue</h5>
              <p className="text-slate-400">
                L = λ × W. Queue depth (L) is the product of arrival rate (λ) and average wait time (W). By knowing the total cluster drain rate, EventShield computes accurate Estimated Waiting Time for every buffered user.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
              <h5 className="font-semibold text-cyan-300">Bounded Retries & Jitter</h5>
              <p className="text-slate-400">
                Exponential backoff doubles sleep time per attempt: Backoff = Base × 2^(attempt - 1). Full randomized jitter prevents synchronized thundering herd retries hitting recovered backends simultaneously.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
