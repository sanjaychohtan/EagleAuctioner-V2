import React, { useState, useEffect } from "react";
import { 
  Cpu, 
  Database, 
  Zap, 
  Activity, 
  Server, 
  RefreshCw, 
  CheckCircle2, 
  AlertTriangle,
  Clock,
  TrendingUp,
  Terminal,
  LineChart,
  HardDrive
} from "lucide-react";
import { ResponsiveContainer, AreaChart, Area } from "recharts";
import { motion, AnimatePresence } from "motion/react";

interface SystemHealthProps {
  themeMode: "light" | "dark";
  showToast: (msg: string, type: "success" | "info" | "warning") => void;
}

export function SystemHealth({ themeMode, showToast }: SystemHealthProps) {
  const [isDiagnosticsRunning, setIsDiagnosticsRunning] = useState(false);
  const [latencySparkline, setLatencySparkline] = useState([
    { val: 12 }, { val: 14 }, { val: 11 }, { val: 15 }, { val: 13 }, { val: 12 }, { val: 11 }, { val: 13 }, { val: 12 }
  ]);
  const [cpuUsage, setCpuUsage] = useState(22);
  const [memoryUsage, setMemoryUsage] = useState(42);
  const [activeUsers, setActiveUsers] = useState(842);

  // Simulated metrics flux
  useEffect(() => {
    const interval = setInterval(() => {
      setCpuUsage((prev) => Math.max(15, Math.min(65, prev + Math.floor(Math.random() * 7) - 3)));
      setMemoryUsage((prev) => Math.max(38, Math.min(50, prev + Math.floor(Math.random() * 3) - 1)));
      setActiveUsers((prev) => Math.max(810, Math.min(880, prev + Math.floor(Math.random() * 5) - 2)));
      setLatencySparkline((prev) => {
        const next = [...prev.slice(1), { val: Math.floor(10 + Math.random() * 6) }];
        return next;
      });
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const runDiagnostics = () => {
    setIsDiagnosticsRunning(true);
    showToast("Triggering full cluster SRE diagnostics audit...", "info");
    
    setTimeout(() => {
      setIsDiagnosticsRunning(false);
      showToast("All system parameters SLA compliant. No cluster drifts detected.", "success");
    }, 2000);
  };

  const serviceStatus = [
    { name: "API Gateway", status: "HEALTHY", desc: "Kong Envoy Proxy Routing", icon: Activity, color: "text-emerald-500 bg-emerald-500/10 border-emerald-500/15" },
    { name: "PostgreSQL Master", status: "HEALTHY", desc: "HikariCP Conn: 42 Pools", icon: Database, color: "text-emerald-500 bg-emerald-500/10 border-emerald-500/15" },
    { name: "Redis Ledger Cache", status: "HEALTHY", desc: "99.9% Cache Hit Ratio", icon: Zap, color: "text-emerald-500 bg-emerald-500/10 border-emerald-500/15" },
    { name: "RabbitMQ Message Queue", status: "HEALTHY", desc: "0 Message Delay Pool", icon: Server, color: "text-emerald-500 bg-emerald-500/10 border-emerald-500/15" },
    { name: "Cron Task Scheduler", status: "HEALTHY", desc: "Next job triggers in 5m", icon: Clock, color: "text-emerald-500 bg-emerald-500/10 border-emerald-500/15" },
    { name: "AWS S3 Cloud Assets", status: "HEALTHY", desc: "8.2 GB / 100 GB Consumed", icon: HardDrive, color: "text-emerald-500 bg-emerald-500/10 border-emerald-500/15" }
  ];

  return (
    <div className={`p-6 rounded-2xl border flex flex-col justify-between ${
      themeMode === "dark" ? "bg-slate-900/40 border-slate-800/80" : "bg-white border-slate-200"
    }`}>
      {/* HEADER */}
      <div className="flex items-center justify-between border-b border-slate-150 dark:border-slate-800/85 pb-4 mb-4 gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-blue-600/10 text-blue-500">
            <Cpu className="h-5 w-5" />
          </div>
          <div>
            <h4 className="text-xs font-bold font-mono uppercase tracking-wider text-slate-400">System Telemetry</h4>
            <p className="text-[10px] text-slate-500 font-mono">Real-time SRE Health Stats</p>
          </div>
        </div>

        {/* DIAGNOSTICS CONTROL */}
        <button
          onClick={runDiagnostics}
          disabled={isDiagnosticsRunning}
          className={`px-3 py-1.5 rounded-lg text-[9px] font-mono font-bold uppercase tracking-wider border transition-all flex items-center gap-1.5 cursor-pointer ${
            isDiagnosticsRunning 
              ? "border-slate-800 text-slate-500 bg-slate-950" 
              : "border-blue-500/30 text-blue-500 hover:bg-blue-500/10"
          }`}
        >
          <RefreshCw className={`h-3 w-3 ${isDiagnosticsRunning ? "animate-spin" : ""}`} />
          {isDiagnosticsRunning ? "Checking nodes..." : "Deep Diagnostics"}
        </button>
      </div>

      {/* METRICS ROW (CPU, MEMORY, LATENCY, ACTIVE USERS) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 mb-5 font-mono">
        <div className="p-3 bg-slate-950/25 border border-slate-800 rounded-xl flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="text-[8px] text-slate-400 uppercase tracking-wider block">Cluster CPU</span>
            <span className="text-sm font-extrabold text-blue-500 block">{cpuUsage}%</span>
            <div className="w-16 h-1 bg-slate-800 rounded-full overflow-hidden mt-1">
              <div className="bg-blue-500 h-full" style={{ width: `${cpuUsage}%` }} />
            </div>
          </div>
          <Cpu className="h-4 w-4 text-slate-600" />
        </div>

        <div className="p-3 bg-slate-950/25 border border-slate-800 rounded-xl flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="text-[8px] text-slate-400 uppercase tracking-wider block">JVM Memory</span>
            <span className="text-sm font-extrabold text-indigo-400 block">{memoryUsage}%</span>
            <div className="w-16 h-1 bg-slate-800 rounded-full overflow-hidden mt-1">
              <div className="bg-indigo-500 h-full" style={{ width: `${memoryUsage}%` }} />
            </div>
          </div>
          <Server className="h-4 w-4 text-slate-600" />
        </div>

        <div className="p-3 bg-slate-950/25 border border-slate-800 rounded-xl flex items-center justify-between">
          <div className="space-y-0.5 w-full">
            <div className="flex justify-between items-center w-full">
              <span className="text-[8px] text-slate-400 uppercase tracking-wider">Gateway Ping</span>
              <span className="text-xs font-extrabold text-emerald-500 font-mono">{latencySparkline[latencySparkline.length - 1].val} ms</span>
            </div>
            
            {/* Real-time mini Sparkline Area Chart */}
            <div className="h-6 w-full mt-1.5">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={latencySparkline} margin={{ top: 0, bottom: 0, left: 0, right: 0 }}>
                  <defs>
                    <linearGradient id="latencyGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <Area type="monotone" dataKey="val" stroke="#10b981" strokeWidth={1} fill="url(#latencyGrad)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="p-3 bg-slate-950/25 border border-slate-800 rounded-xl flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="text-[8px] text-slate-400 uppercase tracking-wider block">Client Sockets</span>
            <span className="text-sm font-extrabold text-amber-500 block">{activeUsers} Online</span>
            <span className="text-[8px] text-emerald-500 block">● WebSockets live</span>
          </div>
          <Activity className="h-4 w-4 text-slate-600" />
        </div>
      </div>

      {/* DETAILED CLUSTER SERVICES HEALTH list */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-[9px] uppercase tracking-wider font-extrabold text-slate-500 font-mono">
          <div className="flex items-center gap-1">
            <Terminal className="h-3 w-3" />
            <span>Monitored Microservices & Cluster Nodes</span>
          </div>
          <span className="text-[8px] text-emerald-500">ALL NODES OPERATIONAL</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-[220px] overflow-y-auto">
          {serviceStatus.map((service, i) => {
            const Icon = service.icon;
            return (
              <div
                key={i}
                className={`p-2.5 rounded-xl border flex items-center justify-between gap-3 text-xs ${
                  themeMode === "dark" ? "bg-slate-950/40 border-slate-850" : "bg-slate-50 border-slate-150"
                }`}
              >
                <div className="flex items-center gap-2.5 overflow-hidden">
                  <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-500 shrink-0 border border-emerald-500/15">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                  </div>
                  <div className="overflow-hidden">
                    <span className={`font-mono text-[10px] font-bold block ${themeMode === "dark" ? "text-slate-200" : "text-slate-700"}`}>
                      {service.name}
                    </span>
                    <span className="text-[8px] font-mono text-slate-400 truncate block mt-0.5">{service.desc}</span>
                  </div>
                </div>

                <span className="text-[8px] font-mono font-extrabold text-emerald-400 shrink-0">
                  {service.status}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* SRE TELEMETRY DIALOG OVERLAYS */}
      <AnimatePresence>
        {isDiagnosticsRunning && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 0.5 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-slate-950/70" />
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative w-full max-w-sm rounded-2xl border p-5 bg-slate-950 border-slate-800 text-slate-100 font-mono shadow-2xl"
            >
              <div className="flex items-center gap-2 border-b border-slate-800 pb-3 mb-3">
                <Terminal className="h-4 w-4 text-blue-500 animate-pulse" />
                <h4 className="text-xs font-bold uppercase tracking-wider">Cluster Diagnostic Terminal</h4>
              </div>
              <div className="text-[10px] space-y-1 h-[140px] overflow-y-auto select-none text-slate-400">
                <p className="text-blue-400">[info] Connecting to Kong API Envoy Gate...</p>
                <p className="text-emerald-500">[ok] Proxy connection established in 4ms.</p>
                <p className="text-blue-400">[info] Checking PostgreSQL HikariCP pool health...</p>
                <p className="text-emerald-500">[ok] Hikari pool allocation healthy. 42 active conns.</p>
                <p className="text-blue-400">[info] Running Redis cluster memory sanity check...</p>
                <p className="text-emerald-500">[ok] Cache hit rating: 99.98%.</p>
                <p className="text-blue-400">[info] Scanning RabbitMQ delayed buffers...</p>
                <p className="text-emerald-500">[ok] Scan completed. 0 dead-letter queue items.</p>
              </div>
              <div className="flex justify-end gap-2 border-t border-slate-800 pt-3 mt-3">
                <span className="text-[8px] bg-blue-500/10 text-blue-400 px-2 py-1 rounded">AUDITING...</span>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
