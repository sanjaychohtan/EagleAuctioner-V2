import React, { useState } from "react";
import { 
  ShieldAlert, 
  Gavel, 
  TrendingUp, 
  Server, 
  Search, 
  Tv, 
  MessageSquare,
  AlertTriangle,
  CheckCircle,
  XCircle,
  PlayCircle
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useOperationsDashboard } from "../../hooks/useDashboardQueries";

interface OperationsDashboardProps {
  simulationMode: "normal" | "loading" | "empty" | "error";
  themeMode: "light" | "dark";
  onTriggerAction: (actionName: string, payload?: any) => void;
}

export function OperationsDashboard({
  simulationMode,
  themeMode,
  onTriggerAction
}: OperationsDashboardProps) {
  const [ticketSearch, setTicketSearch] = useState("");
  const { data: dashboardData, isLoading, isError } = useOperationsDashboard();
  const tickets = dashboardData?.recentAlerts || [];

  const handleResolveTicket = (id: string, bidder: string) => {
    onTriggerAction("resolve-dispute", { id, bidder });
  };

  if (isError || simulationMode === "error") {
    return (
      <div className={`p-6 rounded-2xl ${themeMode === "dark" ? "bg-red-900/20 text-red-200" : "bg-red-50 text-red-600"}`}>
        <AlertTriangle className="h-6 w-6 mb-2" />
        <h3 className="text-lg font-medium">Failed to load operations dashboard</h3>
      </div>
    );
  }

  if (isLoading || simulationMode === "loading") {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className={`p-5 rounded-xl border h-28 ${themeMode === "dark" ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"}`} />
          ))}
        </div>
        <div className={`p-6 rounded-2xl border h-[300px] ${themeMode === "dark" ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"}`} />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      
      {/* 1. OPERATIONS KEY COUNTERS */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        
        <div className={`p-4 rounded-xl border shadow-sm flex items-center justify-between gap-4 ${
          themeMode === "dark" ? "bg-slate-900/60 border-slate-800/80" : "bg-white border-slate-200/80"
        }`}>
          <div className="space-y-1">
            <span className="text-[10px] font-mono uppercase text-slate-500">Active Disputes (L1)</span>
            <div className={`text-xl font-bold font-mono ${themeMode === "dark" ? "text-white" : "text-blue-950"}`}>
              {tickets.length} unresolved
            </div>
            <span className="text-[8px] font-mono text-red-500 block">SLA Limit: 15 mins</span>
          </div>
          <div className="p-3 bg-red-500/10 text-red-500 rounded-lg shrink-0 animate-pulse">
            <ShieldAlert className="h-5 w-5" />
          </div>
        </div>

        <div className={`p-4 rounded-xl border shadow-sm flex items-center justify-between gap-4 ${
          themeMode === "dark" ? "bg-slate-900/60 border-slate-800/80" : "bg-white border-slate-200/80"
        }`}>
          <div className="space-y-1">
            <span className="text-[10px] font-mono uppercase text-slate-500">Active Bidders stream</span>
            <div className={`text-xl font-bold font-mono ${themeMode === "dark" ? "text-white" : "text-blue-950"}`}>
              842 Connected
            </div>
            <span className="text-[8px] font-mono text-emerald-400 block">WebSocket channels active</span>
          </div>
          <div className="p-3 bg-blue-500/10 text-blue-500 rounded-lg shrink-0">
            <Tv className="h-5 w-5" />
          </div>
        </div>

        <div className={`p-4 rounded-xl border shadow-sm flex items-center justify-between gap-4 ${
          themeMode === "dark" ? "bg-slate-900/60 border-slate-800/80" : "bg-white border-slate-200/80"
        }`}>
          <div className="space-y-1">
            <span className="text-[10px] font-mono uppercase text-slate-500">Live Lots Bidding</span>
            <div className={`text-xl font-bold font-mono ${themeMode === "dark" ? "text-white" : "text-blue-950"}`}>
              22 lots live
            </div>
            <span className="text-[8px] font-mono text-slate-500 block">6 categories active</span>
          </div>
          <div className="p-3 bg-emerald-500/10 text-emerald-500 rounded-lg shrink-0">
            <Gavel className="h-5 w-5" />
          </div>
        </div>

        <div className={`p-4 rounded-xl border shadow-sm flex items-center justify-between gap-4 ${
          themeMode === "dark" ? "bg-slate-900/60 border-slate-800/80" : "bg-white border-slate-200/80"
        }`}>
          <div className="space-y-1">
            <span className="text-[10px] font-mono uppercase text-slate-500">L1 SLA Compliance</span>
            <div className={`text-xl font-bold font-mono ${themeMode === "dark" ? "text-white" : "text-blue-950"}`}>
              99.8%
            </div>
            <span className="text-[8px] font-mono text-emerald-500 block">Zero historical penalties</span>
          </div>
          <div className="p-3 bg-purple-500/10 text-purple-500 rounded-lg shrink-0">
            <TrendingUp className="h-5 w-5" />
          </div>
        </div>

      </div>

      {/* 2. LIVE DISPUTE TICKETS LISTING */}
      <div className={`p-6 rounded-2xl border shadow-sm ${
        themeMode === "dark" ? "bg-slate-900/40 border-slate-800/80" : "bg-white border-slate-200/80"
      }`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4 mb-4">
          <div>
            <h3 className={`text-xs font-mono uppercase tracking-wider font-extrabold flex items-center gap-1.5 ${
              themeMode === "dark" ? "text-slate-400" : "text-slate-500"
            }`}>
              <AlertTriangle className="h-4.5 w-4.5 text-red-500" />
              <span>Active dispute & support tickets (Operations Desk)</span>
            </h3>
            <p className="text-[10px] text-slate-500 mt-1">L1 & L2 operational logs, compliance reviews, and outbid discrepancies</p>
          </div>

          <div className="relative w-full sm:w-60">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search active tickets..."
              value={ticketSearch}
              onChange={e => setTicketSearch(e.target.value)}
              className={`w-full bg-transparent border rounded-lg pl-8 pr-3 py-1.5 text-xs outline-none ${
                themeMode === "dark" ? "border-slate-800 focus:border-blue-500 text-white" : "border-slate-200 focus:border-blue-600 text-slate-900"
              }`}
            />
          </div>
        </div>

        {tickets.filter(t => t.bidder.toLowerCase().includes(ticketSearch.toLowerCase())).length === 0 ? (
          <div className="py-12 text-center text-slate-500 flex flex-col items-center justify-center gap-2">
            <CheckCircle className="h-8 w-8 text-emerald-500 bg-emerald-500/10 p-1.5 rounded-full" />
            <span className="text-xs font-mono">Disputes & Operations queue is 100% Cleared</span>
          </div>
        ) : (
          <div className="space-y-3.5">
            <AnimatePresence>
              {tickets
                .filter(t => t.bidder.toLowerCase().includes(ticketSearch.toLowerCase()))
                .map(row => (
                  <motion.div
                    key={row.id}
                    layoutId={row.id}
                    className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs ${
                      themeMode === "dark" ? "bg-slate-950/30 border-slate-850" : "bg-slate-50 border-slate-150"
                    }`}
                  >
                    <div className="space-y-1 overflow-hidden">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[10px] font-bold text-slate-500">{row.id}</span>
                        <span className={`text-[8px] font-mono font-bold uppercase px-2 py-0.2 rounded ${
                          row.priority === "CRITICAL" 
                            ? "bg-red-500/15 text-red-500 border border-red-500/20" 
                            : row.priority === "HIGH" 
                            ? "bg-amber-500/15 text-amber-400 border border-amber-500/20" 
                            : "bg-blue-500/15 text-blue-400 border border-blue-500/20"
                        }`}>
                          {row.priority}
                        </span>
                        <span className="text-[10px] font-mono text-slate-500">{row.timeOpened}</span>
                      </div>
                      <span className={`font-semibold block truncate ${themeMode === "dark" ? "text-white" : "text-blue-950"}`}>
                        {row.issue}
                      </span>
                      <span className="text-[10px] font-mono text-slate-400 block">Bidder Party: <code className="bg-slate-100 dark:bg-slate-950 px-1 py-0.2 rounded font-bold">{row.bidder}</code></span>
                    </div>

                    <button 
                      onClick={() => handleResolveTicket(row.id, row.bidder)}
                      className="flex items-center gap-1 px-3.5 py-1.5 text-[10px] font-mono font-bold uppercase tracking-wider bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-all cursor-pointer whitespace-nowrap"
                    >
                      Resolve Dispute
                    </button>
                  </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* 3. OPERATIONS BROADCAST INTERFACE */}
      <div className={`p-6 rounded-2xl border shadow-sm ${
        themeMode === "dark" ? "bg-slate-900/40 border-slate-800/80" : "bg-white border-slate-200/80"
      }`}>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="space-y-1.5 max-w-xl">
            <h4 className={`text-xs font-mono uppercase tracking-wider font-extrabold ${
              themeMode === "dark" ? "text-slate-400" : "text-slate-500"
            }`}>
              Platform broad notifications Broadcast
            </h4>
            <p className="text-slate-500 text-xs leading-relaxed">
              Dispatch global announcement popups or SRE alert banners directly. Broadcasts are transmitted via active WebSocket channels to all live operators instantly.
            </p>
          </div>

          <button
            onClick={() => onTriggerAction("trigger-broadcast")}
            className="flex items-center gap-2 px-5 py-3 text-xs font-mono font-bold uppercase tracking-wider rounded-xl bg-blue-600 hover:bg-blue-500 text-white cursor-pointer shadow-lg shadow-blue-500/10 transition-all hover:scale-[1.01]"
          >
            <MessageSquare className="h-4.5 w-4.5" />
            <span>Broadcast Console Notice</span>
          </button>
        </div>
      </div>

    </div>
  );
}
