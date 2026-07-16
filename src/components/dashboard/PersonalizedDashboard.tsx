import React, { useState, useEffect } from "react";
import { 
  Sparkles, 
  Settings2, 
  Plus, 
  Trash2, 
  Maximize2, 
  Minimize2, 
  Pin, 
  RefreshCw, 
  Save, 
  X, 
  Compass, 
  Clock, 
  Gavel, 
  Coins, 
  Lock, 
  TrendingUp, 
  Users, 
  ArrowRight,
  TrendingDown,
  Activity,
  Award,
  AlertTriangle,
  CheckSquare,
  FileSpreadsheet,
  ChevronDown,
  Download,
  Terminal,
  Grid
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

// Import custom high-fidelity helper components
import { QuickActionsBar } from "./QuickActionsBar";
import { WalletWidget } from "./WalletWidget";
import { AIInsights } from "./AIInsights";
import { EnterpriseCalendar } from "./EnterpriseCalendar";
import { SystemHealth } from "./SystemHealth";
import { NotificationsWidget } from "./NotificationsWidget";
import { ActivityTimeline } from "./ActivityTimeline";
import { ExportCenter } from "./ExportCenter";

// Recharts for data widgets
import { 
  AreaChart, Area, 
  BarChart, Bar, 
  PieChart, Pie, Cell, 
  LineChart, Line, 
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from "recharts";

interface WidgetItem {
  id: string;
  title: string;
  desc: string;
  category: "finance" | "bidding" | "operations" | "system";
  size: "half" | "full";
  isPinned: boolean;
  isEnabled: boolean;
  order: number;
  date?: string;
}

interface PersonalizedDashboardProps {
  simulationMode: "normal" | "loading" | "empty" | "error";
  themeMode: "light" | "dark";
  onTriggerAction: (action: string, payload?: any) => void;
  showToast: (msg: string, type: "success" | "info" | "warning") => void;
}

const DEFAULT_WIDGETS: WidgetItem[] = [
  { id: "ai-insights", title: "AI Daily Insights Panel", desc: "Predictive neural vectors, daily recommendations & fraud logs", category: "operations", size: "full", isPinned: true, isEnabled: true, order: 0 },
  { id: "quick-actions", title: "Quick Command Center", desc: "Launch lot, onboard seller, lock wire payouts, trigger broadcasts", category: "operations", size: "full", isPinned: true, isEnabled: true, order: 1 },
  { id: "wallet-escrow", title: "Wallet & Escrow Summary", desc: "Available balance, instant deposits, check releases & transaction list", category: "finance", size: "half", isPinned: false, isEnabled: true, order: 2 },
  { id: "system-health", title: "SRE Cluster System Health", desc: "Envoy gateway, Postgres Hikari pools, active memory & latency sparkline", category: "system", size: "half", isPinned: false, isEnabled: true, order: 3 },
  { id: "revenue-weekly", title: "Revenue Analysis Chart", desc: "Weekly platform commission accruals & tax GST ledgers", category: "finance", size: "full", isPinned: false, isEnabled: true, order: 4 },
  { id: "live-auctions", title: "Live Concessions Bidding Stream", desc: "Live bid placement interface with blink alerts and concurrency counters", category: "bidding", size: "half", isPinned: false, isEnabled: true, order: 5 },
  { id: "auction-calendar", title: "Enterprise Scheduler", date: "2026-07-06", desc: "Month, Agenda & Timeline views for scheduled mining launches", category: "bidding", size: "half", isPinned: false, isEnabled: true, order: 6 },
  { id: "emd-security", title: "Locked EMD Pool Logs", desc: "Check state security deposits locked on active coal & steel bid lots", category: "finance", size: "half", isPinned: false, isEnabled: true, order: 7 },
  { id: "notifications", title: "Enterprise Notification Center", desc: "Filterable priority outbids, compliance and SRE system warnings", category: "operations", size: "half", isPinned: false, isEnabled: true, order: 8 },
  { id: "activity-feed", title: "Activity Timeline & Audits", desc: "Cryptographic dual-signed log stream of platform bid transactions", category: "operations", size: "half", isPinned: false, isEnabled: true, order: 9 },
  { id: "gmv-growth", title: "GMV & Category Growth", desc: "Industrial salvage metals shares & monthly expansion statistics", category: "finance", size: "half", isPinned: false, isEnabled: true, order: 10 },
  { id: "settlement-payouts", title: "Maker-Checker Payout Releases", desc: "Dual signature bank wire clearance queue for successful bidders", category: "finance", size: "half", isPinned: false, isEnabled: true, order: 11 },
  { id: "top-sellers", title: "Top Sellers Concessions", desc: "Enterprise seller leaderboard, credit ratings & active lots", category: "operations", size: "half", isPinned: false, isEnabled: true, order: 12 },
  { id: "top-buyers", title: "High Rollers Buyer Ledger", desc: "Escrow funds volume, active bid lot sizes & win ratios", category: "operations", size: "half", isPinned: false, isEnabled: true, order: 13 },
  { id: "export-center", title: "Dual-Signed Report Export", desc: "Generate PDF, Excel, CSV formats & scheduled Cron jobs", category: "system", size: "full", isPinned: false, isEnabled: true, order: 14 }
];

export function PersonalizedDashboard({
  simulationMode,
  themeMode,
  onTriggerAction,
  showToast
}: PersonalizedDashboardProps) {
  const [widgets, setWidgets] = useState<WidgetItem[]>(DEFAULT_WIDGETS);
  const [isMarketplaceOpen, setIsMarketplaceOpen] = useState(false);
  const [draggedItemIdx, setDraggedItemIdx] = useState<number | null>(null);

  // Live Auctions bid states for interactive simulation
  const [liveLots, setLiveLots] = useState([
    { id: "LOT-402", title: "50 Tons A-Grade Steel Billets", currentBid: 14500000, bidsCount: 22, category: "Metals", timeRemaining: "24m 12s" },
    { id: "LOT-308", title: "Coal Block Grade G6 Concession", currentBid: 48000000, bidsCount: 14, category: "Energy & Coal", timeRemaining: "1h 45m" },
    { id: "LOT-112", title: "30 Metric Tons Copper Wire Recycler", currentBid: 7200000, bidsCount: 18, category: "Metals", timeRemaining: "closed" }
  ]);

  // Load layout from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem("eagle_personalized_layout_v2");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Map saved parameters
        const merged = DEFAULT_WIDGETS.map(def => {
          const matchingSaved = parsed.find((p: any) => p.id === def.id);
          if (matchingSaved) {
            return {
              ...def,
              size: matchingSaved.size,
              isPinned: matchingSaved.isPinned,
              isEnabled: matchingSaved.isEnabled,
              order: matchingSaved.order
            };
          }
          return def;
        });
        setWidgets(merged.sort((a, b) => a.order - b.order));
      } catch (e) {
        setWidgets(DEFAULT_WIDGETS);
      }
    }
  }, []);

  const saveLayout = () => {
    const layoutToSave = widgets.map(({ id, size, isPinned, isEnabled, order }) => ({
      id, size, isPinned, isEnabled, order
    }));
    localStorage.setItem("eagle_personalized_layout_v2", JSON.stringify(layoutToSave));
    showToast("Dashboard personalization layout committed securely to local profile", "success");
  };

  const resetLayout = () => {
    setWidgets(DEFAULT_WIDGETS);
    localStorage.removeItem("eagle_personalized_layout_v2");
    showToast("Dashboard workspace restored to system factory settings", "info");
  };

  const toggleWidget = (id: string) => {
    setWidgets(prev => prev.map(w => w.id === id ? { ...w, isEnabled: !w.isEnabled } : w));
    const isNowEnabled = !widgets.find(w => w.id === id)?.isEnabled;
    showToast(isNowEnabled ? "Widget deployed to active cockpit grid" : "Widget removed and returned to marketplace", isNowEnabled ? "success" : "warning");
  };

  const togglePin = (id: string) => {
    setWidgets(prev => {
      const updated = prev.map(w => w.id === id ? { ...w, isPinned: !w.isPinned } : w);
      // Sort pinned to the top
      return updated.sort((a, b) => {
        if (a.isPinned && !b.isPinned) return -1;
        if (!a.isPinned && b.isPinned) return 1;
        return a.order - b.order;
      });
    });
    const isPinned = !widgets.find(w => w.id === id)?.isPinned;
    showToast(isPinned ? "Widget pinned at the top of the cockpit" : "Widget unpinned", "info");
  };

  const toggleSize = (id: string) => {
    setWidgets(prev => prev.map(w => w.id === id ? { ...w, size: w.size === "half" ? "full" : "half" } : w));
    showToast("Widget dimensions recalculated", "info");
  };

  const handlePlaceBid = (lotId: string, nextBidAmount: number) => {
    setLiveLots(prev => prev.map(lot => {
      if (lot.id === lotId) {
        return {
          ...lot,
          currentBid: nextBidAmount,
          bidsCount: lot.bidsCount + 1
        };
      }
      return lot;
    }));
    onTriggerAction("place-bid", { title: lotId, nextBid: nextBidAmount });
  };

  // Recharts Static Data
  const weeklyRevenueData = [
    { name: "Mon", Commission: 45000, PlatformFees: 12000, TaxGst: 10260 },
    { name: "Tue", Commission: 52000, PlatformFees: 15000, TaxGst: 12060 },
    { name: "Wed", Commission: 49000, PlatformFees: 14000, TaxGst: 11340 },
    { name: "Thu", Commission: 68000, PlatformFees: 18000, TaxGst: 15480 },
    { name: "Fri", Commission: 75000, PlatformFees: 22000, TaxGst: 17460 },
    { name: "Sat", Commission: 35000, PlatformFees: 9000, TaxGst: 7920 },
    { name: "Sun", Commission: 40000, PlatformFees: 10000, TaxGst: 9000 },
  ];

  const categoryDistributionData = [
    { name: "Salvage Metals", value: 4500000, color: "#2563eb" },
    { name: "Energy & Coal", value: 3200000, color: "#0ea5e9" },
    { name: "Chemical Blocks", value: 1800000, color: "#10b981" },
    { name: "Agri-Salvage", value: 1200000, color: "#f59e0b" },
  ];

  // Reorder list triggers (simulates drag/drop with buttons for accessibility!)
  const moveWidget = (idx: number, direction: "up" | "down") => {
    const nextIdx = direction === "up" ? idx - 1 : idx + 1;
    if (nextIdx < 0 || nextIdx >= widgets.length) return;
    
    setWidgets(prev => {
      const copy = [...prev];
      const temp = copy[idx];
      copy[idx] = copy[nextIdx];
      copy[nextIdx] = temp;
      // Re-assign order keys
      return copy.map((w, i) => ({ ...w, order: i }));
    });
    showToast("Reordered widget grid layout sequence", "info");
  };

  // 4. RENDERING CONDITIONAL STATES
  if (simulationMode === "loading") {
    return (
      <div className="space-y-6">
        {/* WELCOME BANNER SKELETON */}
        <div className={`p-6 rounded-2xl animate-pulse ${themeMode === "dark" ? "bg-slate-900" : "bg-white"}`}>
          <div className="h-6 w-1/3 bg-slate-300 dark:bg-slate-800 rounded mb-2" />
          <div className="h-4 w-1/2 bg-slate-300 dark:bg-slate-800 rounded" />
        </div>

        {/* KPI SKELETONS */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className={`p-5 rounded-xl border h-28 animate-pulse ${themeMode === "dark" ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"}`} />
          ))}
        </div>

        {/* CHART GRID SKELETON */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className={`lg:col-span-8 p-6 rounded-2xl border h-[340px] animate-pulse ${themeMode === "dark" ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"}`} />
          <div className={`lg:col-span-4 p-6 rounded-2xl border h-[340px] animate-pulse ${themeMode === "dark" ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"}`} />
        </div>
      </div>
    );
  }

  if (simulationMode === "error") {
    return (
      <div className={`p-12 rounded-2xl border text-center space-y-4 max-w-xl mx-auto my-12 ${
        themeMode === "dark" ? "bg-slate-900 border-red-900/40" : "bg-red-50 border-red-200"
      }`}>
        <AlertTriangle className="h-12 w-12 text-red-500 mx-auto animate-bounce" />
        <div>
          <h3 className={`text-lg font-bold ${themeMode === "dark" ? "text-white" : "text-slate-900"}`}>
            SLA Warning: Connection Timeout
          </h3>
          <p className="text-slate-500 text-xs mt-1.5 leading-relaxed font-mono">
            Error Code: 504 Gateway Timeout. The platform could not establish a keepalive WebSocket session with the active Spring database node.
          </p>
        </div>
        <button 
          onClick={() => onTriggerAction("refresh")}
          className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white font-semibold text-xs rounded-xl shadow-lg shadow-red-500/10 cursor-pointer"
        >
          Retry Connection Sync
        </button>
      </div>
    );
  }

  if (simulationMode === "empty") {
    return (
      <div className={`p-12 rounded-2xl border text-center space-y-4 max-w-lg mx-auto my-12 ${
        themeMode === "dark" ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"
      }`}>
        <FileSpreadsheet className="h-12 w-12 text-slate-400 mx-auto" />
        <div>
          <h3 className={`text-sm font-bold uppercase ${themeMode === "dark" ? "text-white" : "text-slate-900"}`}>
            No Bidding Transactions Found
          </h3>
          <p className="text-slate-500 text-xs mt-1.5 leading-relaxed">
            There are zero active lots registered in the current tenant partition. Please seed database or check onboarding logs.
          </p>
        </div>
        <button 
          onClick={() => onTriggerAction("seed-data")}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs rounded-xl cursor-pointer"
        >
          Seed Mock Lot Listings
        </button>
      </div>
    );
  }

  const enabledWidgets = widgets.filter(w => w.isEnabled);

  return (
    <div className="space-y-6">
      
      {/* 1. PERSONALIZED COCKPIT WELCOME BANNER */}
      <div className={`p-6 rounded-2xl border flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm relative overflow-hidden transition-all ${
        themeMode === "dark" 
          ? "bg-gradient-to-r from-slate-900 to-slate-900/50 border-slate-800/80" 
          : "bg-gradient-to-r from-blue-50/70 to-white border-slate-200/80"
      }`}>
        <div className="absolute right-0 top-0 h-full w-48 bg-radial-gradient from-blue-500/10 to-transparent pointer-events-none" />
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-full bg-blue-600/10 text-blue-600 flex items-center justify-center font-bold text-lg shadow-inner">
            SC
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className={`text-lg font-bold tracking-tight ${themeMode === "dark" ? "text-white" : "text-blue-950"}`}>
                Welcome Back, Sanjay Chohtan
              </h2>
              <span className="text-[9px] font-mono uppercase bg-blue-600/10 text-blue-600 px-1.5 py-0.5 rounded border border-blue-500/10">
                Corporate Analyst
              </span>
            </div>
            <p className={`text-xs mt-1 ${themeMode === "dark" ? "text-slate-400" : "text-slate-500"}`}>
              Sovereign cockpit fully customizable. Double-signed escrow gates secure with Rotated TLS 1.3 keys.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 self-start md:self-auto font-mono text-xs">
          <Clock className="h-4 w-4 text-blue-500 animate-pulse" />
          <span className={themeMode === "dark" ? "text-slate-300" : "text-slate-600"}>
            Session Active (UTC+5:30)
          </span>
        </div>
      </div>

      {/* 2. DASHBOARD PERSONALIZATION CONTROLLER BAR */}
      <div className={`p-3.5 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs ${
        themeMode === "dark" ? "bg-slate-950/40 border-slate-850" : "bg-white border-slate-200"
      }`}>
        <div className="flex items-center gap-2.5">
          <Settings2 className="h-4 w-4 text-blue-500" />
          <span className={`text-[11px] font-mono uppercase tracking-wider font-extrabold ${
            themeMode === "dark" ? "text-slate-300" : "text-slate-600"
          }`}>Personalized Work Desk Manager</span>
          <span className="text-[10px] font-mono text-blue-500 bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/10 font-bold">
            {enabledWidgets.length} Active / {widgets.length} Available
          </span>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setIsMarketplaceOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[9px] font-mono font-extrabold uppercase tracking-wider bg-blue-600 hover:bg-blue-500 text-white cursor-pointer"
          >
            <Plus className="h-3.5 w-3.5" /> Deploy Widgets
          </button>
          <button
            onClick={saveLayout}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[9px] font-mono font-extrabold uppercase tracking-wider border border-slate-750 text-slate-400 hover:text-white cursor-pointer"
          >
            <Save className="h-3.5 w-3.5" /> Save Layout
          </button>
          <button
            onClick={resetLayout}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[9px] font-mono font-extrabold uppercase tracking-wider border border-red-500/30 text-red-400 hover:bg-red-500/10 cursor-pointer"
          >
            <RefreshCw className="h-3.5 w-3.5" /> Reset Layout
          </button>
        </div>
      </div>

      {/* 3. DYNAMIC WORKSPACE GRID (With layout animations) */}
      <div className="grid grid-cols-12 gap-6 items-start">
        <AnimatePresence mode="popLayout">
          {enabledWidgets.map((widget, idx) => {
            const isFull = widget.size === "full";
            
            return (
              <motion.div
                layout
                key={widget.id}
                initial={{ opacity: 0, scale: 0.98, y: 15 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: -15 }}
                transition={{ type: "spring", stiffness: 140, damping: 18 }}
                className={`${isFull ? "col-span-12" : "col-span-12 md:col-span-6"} transition-all`}
              >
                {/* WIDGET CARD ENVELOPE */}
                <div className={`relative group flex flex-col justify-between rounded-2xl border p-1 transition-all ${
                  themeMode === "dark" 
                    ? "bg-slate-900/15 border-slate-850 hover:border-slate-800" 
                    : "bg-white border-slate-200 hover:shadow-md"
                }`}>
                  
                  {/* METADATA COCKPIT HEADER */}
                  <div className={`px-4 py-2 flex items-center justify-between border-b text-[10px] font-mono rounded-t-xl shrink-0 ${
                    themeMode === "dark" ? "border-slate-850/80 bg-slate-950/40 text-slate-500" : "border-slate-150 bg-slate-50/50 text-slate-500"
                  }`}>
                    <div className="flex items-center gap-2 overflow-hidden w-full">
                      <span className="h-2 w-2 rounded-full bg-blue-500 shrink-0" />
                      <span className="font-extrabold uppercase tracking-wide truncate">{widget.title}</span>
                      {widget.isPinned && (
                        <span className="text-[8px] bg-indigo-500/10 text-indigo-400 px-1.5 py-0.2 rounded border border-indigo-500/15 font-bold uppercase shrink-0 flex items-center gap-0.5">
                          <Pin className="h-2.5 w-2.5 fill-indigo-400" /> PINNED
                        </span>
                      )}
                    </div>

                    {/* CONTROL TRIGGERS */}
                    <div className="flex items-center gap-1 opacity-60 group-hover:opacity-100 transition-opacity pl-4 shrink-0">
                      {/* Move Up */}
                      <button
                        onClick={() => moveWidget(idx, "up")}
                        disabled={idx === 0}
                        className="p-1 rounded hover:bg-slate-800 text-slate-500 hover:text-white disabled:opacity-30 cursor-pointer font-bold"
                        title="Move sequence backward"
                      >
                        ←
                      </button>
                      {/* Move Down */}
                      <button
                        onClick={() => moveWidget(idx, "down")}
                        disabled={idx === enabledWidgets.length - 1}
                        className="p-1 rounded hover:bg-slate-800 text-slate-500 hover:text-white disabled:opacity-30 cursor-pointer font-bold"
                        title="Move sequence forward"
                      >
                        →
                      </button>
                      {/* Pin Trigger */}
                      <button
                        onClick={() => togglePin(widget.id)}
                        className={`p-1 rounded hover:bg-slate-800 cursor-pointer ${widget.isPinned ? "text-indigo-400" : "text-slate-500 hover:text-white"}`}
                        title={widget.isPinned ? "Unpin widget" : "Pin to cockpit head"}
                      >
                        <Pin className="h-3 w-3" />
                      </button>
                      {/* Resize Trigger */}
                      <button
                        onClick={() => toggleSize(widget.id)}
                        className="p-1 rounded hover:bg-slate-800 text-slate-500 hover:text-white cursor-pointer"
                        title={isFull ? "Shrink width" : "Expand to wide-view"}
                      >
                        {isFull ? <Minimize2 className="h-3 w-3" /> : <Maximize2 className="h-3 w-3" />}
                      </button>
                      {/* Remove/Hide Trigger */}
                      <button
                        onClick={() => toggleWidget(widget.id)}
                        className="p-1 rounded hover:bg-slate-800 text-slate-500 hover:text-red-400 cursor-pointer"
                        title="Hide widget"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  </div>

                  {/* ACTIVE COMPONENT COMPILATION */}
                  <div className="p-1.5 flex-1">
                    {widget.id === "quick-actions" && <QuickActionsBar themeMode={themeMode} showToast={showToast} onTriggerAction={onTriggerAction} />}
                    {widget.id === "wallet-escrow" && <WalletWidget themeMode={themeMode} showToast={showToast} onTriggerAction={onTriggerAction} />}
                    {widget.id === "ai-insights" && <AIInsights themeMode={themeMode} showToast={showToast} />}
                    {widget.id === "auction-calendar" && <EnterpriseCalendar themeMode={themeMode} showToast={showToast} />}
                    {widget.id === "system-health" && <SystemHealth themeMode={themeMode} showToast={showToast} />}
                    {widget.id === "notifications" && <NotificationsWidget themeMode={themeMode} showToast={showToast} />}
                    {widget.id === "activity-feed" && <ActivityTimeline themeMode={themeMode} showToast={showToast} />}
                    {widget.id === "export-center" && <ExportCenter themeMode={themeMode} showToast={showToast} />}

                    {/* DYNAMIC METRIC REPRESENTATION WIDGETS */}
                    {widget.id === "revenue-weekly" && (
                      <div className={`p-4 rounded-xl ${themeMode === "dark" ? "bg-slate-950/20" : ""}`}>
                        <div className="flex items-center justify-between border-b border-slate-850 pb-3 mb-3">
                          <span className="text-[10px] text-slate-400 uppercase font-mono font-bold">Weekly Platform Revenue Generation</span>
                          <span className="text-xs text-blue-500 font-mono font-bold">Today: +₹1.87 Lakhs</span>
                        </div>
                        <div className="h-[200px] w-full">
                          <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={weeklyRevenueData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                              <defs>
                                <linearGradient id="commGrad" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="5%" stopColor="#2563eb" stopOpacity={0.2}/>
                                  <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                                </linearGradient>
                              </defs>
                              <CartesianGrid strokeDasharray="3 3" stroke={themeMode === "dark" ? "#1e293b" : "#e2e8f0"} />
                              <XAxis dataKey="name" stroke="#64748b" fontSize={9} />
                              <YAxis stroke="#64748b" fontSize={9} />
                              <Tooltip contentStyle={{ backgroundColor: themeMode === "dark" ? "#0f172a" : "#ffffff", borderColor: "#1e293b" }} />
                              <Area type="monotone" dataKey="Commission" stroke="#2563eb" fillOpacity={1} fill="url(#commGrad)" strokeWidth={2} />
                            </AreaChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                    )}

                    {widget.id === "live-auctions" && (
                      <div className="p-4 space-y-3 font-mono">
                        <div className="flex items-center justify-between text-[10px] text-slate-400 font-bold border-b border-slate-850 pb-2">
                          <span>Active Bid lots stream</span>
                          <span className="text-emerald-500 block">● Concurrency: 842</span>
                        </div>

                        <div className="space-y-2">
                          {liveLots.map((lot) => (
                            <div key={lot.id} className="p-3 bg-slate-950/30 rounded-xl border border-slate-850 flex items-center justify-between gap-4 text-xs">
                              <div>
                                <span className="font-extrabold block text-slate-300">{lot.title}</span>
                                <span className="text-[9px] text-slate-500 uppercase mt-0.5 block">{lot.category} • {lot.timeRemaining}</span>
                              </div>
                              <div className="text-right shrink-0">
                                <span className="text-blue-500 block font-bold">₹{lot.currentBid.toLocaleString()}</span>
                                {lot.timeRemaining !== "closed" ? (
                                  <button
                                    onClick={() => handlePlaceBid(lot.id, lot.currentBid + 100000)}
                                    className="px-2 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded font-mono font-bold text-[8px] uppercase tracking-wider block mt-1.5 ml-auto cursor-pointer"
                                  >
                                    Bid +1L
                                  </button>
                                ) : (
                                  <span className="text-slate-500 block text-[9px] uppercase font-bold mt-1">LOT CLOSED</span>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {widget.id === "emd-security" && (
                      <div className="p-4 space-y-3 font-mono">
                        <div className="flex items-center justify-between text-[10px] text-slate-400 font-bold border-b border-slate-850 pb-2">
                          <span>Locked sovereign EMD balance checks</span>
                          <span className="text-indigo-400 font-bold">₹3.20 Cr Locked</span>
                        </div>
                        <div className="space-y-1.5 text-xs">
                          <div className="p-2 bg-slate-950/20 rounded border border-slate-850 flex justify-between">
                            <span className="text-slate-400">Lot #402 (Steel Billets)</span>
                            <span className="font-bold text-amber-500">₹1,50,00,000</span>
                          </div>
                          <div className="p-2 bg-slate-950/20 rounded border border-slate-850 flex justify-between">
                            <span className="text-slate-400">Lot #308 (Coal Block G6)</span>
                            <span className="font-bold text-indigo-400">₹1,20,00,000</span>
                          </div>
                          <div className="p-2 bg-slate-950/20 rounded border border-slate-850 flex justify-between">
                            <span className="text-slate-400">Lot #291 (Solvent Oil)</span>
                            <span className="font-bold text-emerald-500">₹50,00,000</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {widget.id === "gmv-growth" && (
                      <div className="p-4">
                        <span className="text-[10px] text-slate-400 uppercase font-mono font-bold block border-b border-slate-850 pb-2 mb-3">GMV Commodity Category Shares</span>
                        <div className="h-[180px] w-full flex items-center justify-center relative">
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie data={categoryDistributionData} cx="50%" cy="50%" innerRadius={42} outerRadius={65} paddingAngle={4} dataKey="value">
                                {categoryDistributionData.map((entry, idx) => <Cell key={`cell-${idx}`} fill={entry.color} />)}
                              </Pie>
                              <Tooltip formatter={(v: any) => `₹${(v/100000).toFixed(1)} Lakhs`} />
                            </PieChart>
                          </ResponsiveContainer>
                          <div className="absolute text-center">
                            <span className="text-[8px] text-slate-500 block font-mono">Total GMV</span>
                            <span className="text-xs font-bold font-mono text-slate-200">₹1.14 Cr</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {widget.id === "settlement-payouts" && (
                      <div className="p-4 space-y-3 font-mono">
                        <span className="text-[10px] text-slate-400 uppercase font-bold block border-b border-slate-850 pb-2">Inter-bank payout releasing queue</span>
                        <div className="space-y-2 text-xs">
                          <div className="p-2.5 bg-slate-950/20 rounded border border-slate-850 flex items-center justify-between">
                            <div>
                              <span className="font-extrabold block text-slate-300">Hindalco copper recycling</span>
                              <span className="text-[9px] text-slate-500 block mt-0.5">Ref: HIND-PAY-882</span>
                            </div>
                            <span className="font-bold text-emerald-500">₹1.24 Cr</span>
                          </div>
                          <div className="p-2.5 bg-slate-950/20 rounded border border-slate-850 flex items-center justify-between opacity-60">
                            <div>
                              <span className="font-extrabold block text-slate-300">Singhal alloys salvage</span>
                              <span className="text-[9px] text-slate-500 block mt-0.5">Ref: SING-REF-401</span>
                            </div>
                            <span className="font-bold text-amber-500">₹45.00 L</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {widget.id === "top-sellers" && (
                      <div className="p-4 font-mono text-xs space-y-3">
                        <span className="text-[10px] text-slate-400 uppercase font-bold block border-b border-slate-850 pb-2">Preferred Partner Sellers</span>
                        <div className="space-y-1.5">
                          <div className="flex justify-between p-1.5 border-b border-slate-900">
                            <span className="text-slate-300 font-extrabold">JSW Steel Concessions</span>
                            <span className="text-blue-500 font-bold">A++ Rating</span>
                          </div>
                          <div className="flex justify-between p-1.5 border-b border-slate-900">
                            <span className="text-slate-300 font-extrabold">Tata Minerals Corp</span>
                            <span className="text-blue-500 font-bold">AAA Rating</span>
                          </div>
                          <div className="flex justify-between p-1.5 border-b border-slate-900">
                            <span className="text-slate-300 font-extrabold">Deccan Mining Concessionaires</span>
                            <span className="text-blue-500 font-bold">AA Rating</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {widget.id === "top-buyers" && (
                      <div className="p-4 font-mono text-xs space-y-3">
                        <span className="text-[10px] text-slate-400 uppercase font-bold block border-b border-slate-850 pb-2">High Roller Buyers volume</span>
                        <div className="space-y-1.5">
                          <div className="flex justify-between p-1.5 border-b border-slate-900">
                            <span className="text-slate-300 font-extrabold">Mumbai Steel Corporation</span>
                            <span className="text-indigo-400 font-bold">₹4.20 Cr Escrow</span>
                          </div>
                          <div className="flex justify-between p-1.5 border-b border-slate-900">
                            <span className="text-slate-300 font-extrabold">GMR Coal trade Pvt Ltd</span>
                            <span className="text-indigo-400 font-bold">₹3.50 Cr Escrow</span>
                          </div>
                          <div className="flex justify-between p-1.5 border-b border-slate-900">
                            <span className="text-slate-300 font-extrabold">Singhal alloys trade desk</span>
                            <span className="text-indigo-400 font-bold">₹1.80 Cr Escrow</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* 4. WIDGET MARKETPLACE DRAWER PANEL (Task 5) */}
      <AnimatePresence>
        {isMarketplaceOpen && (
          <div className="fixed inset-0 z-50 flex justify-end">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMarketplaceOpen(false)}
              className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs"
            />

            {/* Slide-out Drawer Panel */}
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", duration: 0.4, bounce: 0.05 }}
              className={`relative w-full max-w-md h-full shadow-2xl flex flex-col justify-between border-l p-6 overflow-hidden ${
                themeMode === "dark" ? "bg-slate-900 border-slate-800 text-slate-100" : "bg-white border-slate-200 text-slate-950"
              }`}
            >
              <div>
                {/* Header */}
                <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4 mb-4">
                  <div className="flex items-center gap-2">
                    <Grid className="h-5 w-5 text-blue-500 animate-pulse" />
                    <div>
                      <h4 className="text-sm font-bold font-mono uppercase tracking-wider">Widget Marketplace</h4>
                      <p className="text-[10px] text-slate-500 font-mono">15 Available Sovereign Modules</p>
                    </div>
                  </div>
                  <button onClick={() => setIsMarketplaceOpen(false)} className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 cursor-pointer">
                    <X className="h-5 w-5" />
                  </button>
                </div>

                {/* Marketplace List */}
                <div className="space-y-3 overflow-y-auto max-h-[80vh] pr-1.5">
                  {widgets.map((widget) => {
                    const isEnabled = widget.isEnabled;
                    return (
                      <div
                        key={widget.id}
                        className={`p-3.5 rounded-xl border flex items-center justify-between gap-4 transition-all ${
                          isEnabled
                            ? "bg-blue-600/5 border-blue-500/30"
                            : themeMode === "dark" ? "bg-slate-950/30 border-slate-850 hover:border-slate-800" : "bg-slate-50 border-slate-200 hover:border-blue-300"
                        }`}
                      >
                        <div className="space-y-0.5 overflow-hidden">
                          <span className={`text-xs font-bold block tracking-wide truncate ${
                            isEnabled ? "text-blue-400" : themeMode === "dark" ? "text-slate-200" : "text-slate-800"
                          }`}>{widget.title}</span>
                          <span className="text-[9px] text-slate-500 leading-normal block">{widget.desc}</span>
                          <div className="flex gap-2 pt-1.5 font-mono text-[7px] font-bold">
                            <span className="bg-slate-950/40 text-slate-400 px-1.5 py-0.2 rounded border border-slate-850 uppercase">{widget.category}</span>
                            <span className="bg-slate-950/40 text-slate-400 px-1.5 py-0.2 rounded border border-slate-850 uppercase">{widget.size} width</span>
                          </div>
                        </div>

                        {/* Toggle Check/Action button */}
                        <button
                          onClick={() => toggleWidget(widget.id)}
                          className={`px-3 py-1.5 rounded-lg text-[9px] font-mono font-extrabold uppercase tracking-wider border cursor-pointer shrink-0 transition-all ${
                            isEnabled
                              ? "bg-red-500/15 border-red-500/20 text-red-500 hover:bg-red-500/20"
                              : "bg-blue-600 hover:bg-blue-500 border-blue-500 text-white"
                          }`}
                        >
                          {isEnabled ? "Uninstall" : "Deploy"}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Reset defaults */}
              <div className="border-t border-slate-200 dark:border-slate-800 pt-4 mt-4 flex justify-between gap-4">
                <button
                  onClick={resetLayout}
                  className="w-full text-center py-2 bg-slate-950 border border-slate-850 text-slate-400 hover:text-white rounded-lg font-mono text-[10px] font-bold uppercase cursor-pointer"
                >
                  Factory Defaults
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
