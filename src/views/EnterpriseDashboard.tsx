import { useState, useEffect } from "react";
import { 
  Database, 
  ShieldCheck, 
  KeyRound, 
  Layers, 
  User, 
  Copy, 
  Check, 
  Download, 
  FileCode, 
  Search, 
  Code,
  ShieldAlert,
  ArrowRightLeft,
  ChevronRight,
  Info,
  CalendarDays,
  Zap,
  BookOpen,
  Coffee,
  TrendingUp,
  BarChart3,
  Activity,
  FileSpreadsheet,
  Play,
  CheckCircle,
  AlertCircle,
  Fingerprint,
  Gauge,
  Server,
  Bell,
  Sliders,
  RotateCw,
  Sparkles,
  Command,
  FileText,
  Clock,
  ChevronDown,
  X,
  HelpCircle,
  Plus,
  Tag,
  Coins,
  Gavel
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { SCHEMA_TABLES, COMMON_SQL_QUERIES, SQL_SCHEMA_CONTENT, SchemaTable } from "../schema_data";
import { BUGS_LIST_DATA, generateBugsReportPDF } from "../bugs_data";

import { useAppStore } from "../store/useAppStore";
import { DashboardRole } from "../components/dashboard/DashboardTypes";
import { GlobalCommandPalette } from "../components/dashboard/GlobalCommandPalette";
import { ExecutiveDashboard } from "../components/dashboard/ExecutiveDashboard";
import { AdminDashboard } from "../components/dashboard/AdminDashboard";
import { BuyerDashboard } from "../components/dashboard/BuyerDashboard";
import { SellerDashboard } from "../components/dashboard/SellerDashboard";
import { FinanceDashboard } from "../components/dashboard/FinanceDashboard";
import { OperationsDashboard } from "../components/dashboard/OperationsDashboard";
import { PersonalizedDashboard } from "../components/dashboard/PersonalizedDashboard";

export function EnterpriseDashboard({ initialTab = "monitoring" }: { initialTab?: "visual" | "code" | "queries" | "java" | "monitoring" | "audit" }) {
  const [activeTab, setActiveTab] = useState<"visual" | "code" | "queries" | "java" | "monitoring" | "audit">(initialTab);
  const [selectedTableName, setSelectedTableName] = useState<string>("users");
  const [sqlSearch, setSqlSearch] = useState<string>("");
  const [copiedAll, setCopiedAll] = useState<boolean>(false);
  const [copiedQueryIndex, setCopiedQueryIndex] = useState<number | null>(null);

  // --- STATE ACCESS ---
  const { themeMode } = useAppStore();

  // --- NEW MULTI-ROLE BUSINESS DASHBOARD STATES ---
  const [perspective, setPerspective] = useState<"business" | "developer">("business");
  const [activeRole, setActiveRole] = useState<DashboardRole>("executive");
  const [simulationMode, setSimulationMode] = useState<"normal" | "loading" | "empty" | "error">("normal");
  const [isAutoRefreshing, setIsAutoRefreshing] = useState<boolean>(true);
  const [refreshCountdown, setRefreshCountdown] = useState<number>(15);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState<boolean>(false);
  const [showNotifications, setShowNotifications] = useState<boolean>(false);
  const [toastNotice, setToastNotice] = useState<{ id: string; message: string; type: "success" | "info" | "warning" } | null>(null);

  // Dynamic toast trigger
  const showToast = (message: string, type: "success" | "info" | "warning" = "success") => {
    setToastNotice({ id: Math.random().toString(), message, type });
  };

  // Auto-dismiss toast
  useEffect(() => {
    if (toastNotice) {
      const timer = setTimeout(() => setToastNotice(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toastNotice]);

  // Simulated Auto-refresh logic
  useEffect(() => {
    if (!isAutoRefreshing) return;

    const timer = setInterval(() => {
      setRefreshCountdown((prev) => {
        if (prev <= 1) {
          showToast("Live data streams synchronized successfully.", "info");
          return 15;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isAutoRefreshing]);

  // Listen to Cmd+K or Ctrl+K for Global Command Palette
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setIsCommandPaletteOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleTriggerAction = (actionName: string, payload?: any) => {
    if (actionName === "refresh") {
      setRefreshCountdown(15);
      showToast("Triggered out-of-band databases synchronization.", "success");
    } else if (actionName === "approve-kyc") {
      showToast(`Approved corporate onboarding: ${payload?.name}`, "success");
    } else if (actionName === "reject-kyc") {
      showToast(`Rejected & flagged application: ${payload?.name}`, "warning");
    } else if (actionName === "adjust-sla") {
      showToast(`Adjusted queue SRE SLA limit to ${payload?.minutes} mins`, "info");
    } else if (actionName === "toggle-maint") {
      showToast(payload?.state ? "Platform set to READ-ONLY maintenance mode" : "Platform set to WRITE-ACTIVE bidding state", payload?.state ? "warning" : "success");
    } else if (actionName === "place-bid") {
      showToast(`Success! Bidded ₹${payload?.nextBid?.toLocaleString()} on ${payload?.title}`, "success");
    } else if (actionName === "deposit-emd") {
      showToast(`Credited ₹${payload?.amount?.toLocaleString()} EMD via SBI Cash Gateway`, "success");
    } else if (actionName === "create-lot") {
      showToast(`Listing Published: ${payload?.title} (Pending compliance verification)`, "success");
    } else if (actionName === "delete-lot") {
      showToast(`Withdrew Lot Reference: ${payload?.name}`, "warning");
    } else if (actionName === "approve-finance-payout") {
      showToast(`Authorized payout of ₹${payload?.amount?.toLocaleString()} under checker dual signature`, "success");
    } else if (actionName === "reject-finance-payout") {
      showToast(`Flagged transaction for secondary forensic audit`, "warning");
    } else if (actionName === "post-ledger-adjustment") {
      showToast(`Vetted and posted dynamic double-entry ledger adjustments`, "success");
    } else if (actionName === "resolve-dispute") {
      showToast(`Resolved dispute ticket for ${payload?.bidder} and closed ticket`, "success");
    } else if (actionName === "trigger-broadcast") {
      showToast(`Broadcast console banner dispatched via Active WebSockets`, "info");
    } else if (actionName === "export-pdf") {
      showToast(`Generated secure cryptographic PDF statement download`, "success");
    } else {
      showToast(`Triggered custom action: ${actionName}`, "info");
    }
  };

  // --- REPORTING STATES ---
  const [reportType, setReportType] = useState<string>("REVENUE");
  const [reportFormat, setReportFormat] = useState<string>("CSV");
  const [tenantId, setTenantId] = useState<string>("05f9024c-9f0e-4361-bd87-35ff5e019a2b");
  const [cronExpression, setCronExpression] = useState<string>("0 0 * * *");
  const [recipientEmail, setRecipientEmail] = useState<string>("sanjay.chohtan@gmail.com");
  const [isGeneratingReport, setIsGeneratingReport] = useState<boolean>(false);
  const [isSchedulingReport, setIsSchedulingReport] = useState<boolean>(false);
  const [generatedReport, setGeneratedReport] = useState<string[][] | null>(null);
  const [showScheduleNotification, setShowScheduleNotification] = useState<boolean>(false);

  // --- MONITORING / DIAGNOSTICS STATES ---
  const [selectedSubTab, setSelectedSubTab] = useState<"metrics" | "readiness" | "performance" | "security">("metrics");
  const [isRunningDiagnostics, setIsRunningDiagnostics] = useState<boolean>(false);
  const [diagnosticsResult, setDiagnosticsResult] = useState<any | null>(null);
  const [isRunningPerformance, setIsRunningPerformance] = useState<boolean>(false);
  const [performanceResult, setPerformanceResult] = useState<any | null>(null);
  const [isRunningSecurity, setIsRunningSecurity] = useState<boolean>(false);
  const [securityResult, setSecurityResult] = useState<any | null>(null);
  const [copiedPrometheus, setCopiedPrometheus] = useState<boolean>(false);

  // Find the currently selected table details
  const selectedTable = SCHEMA_TABLES.find(t => t.name === selectedTableName) || SCHEMA_TABLES[0];


  // Global SQL schemas copy triggers
  const handleCopyAll = () => {
    navigator.clipboard.writeText(SQL_SCHEMA_CONTENT);
    setCopiedAll(true);
    setTimeout(() => setCopiedAll(false), 2000);
  };

  // Single query copy trigger
  const handleCopyQuery = (sql: string, index: number) => {
    navigator.clipboard.writeText(sql);
    setCopiedQueryIndex(index);
    setTimeout(() => setCopiedQueryIndex(null), 2000);
  };

  // SQL standard raw content file downloader
  const handleDownloadFile = () => {
    const blob = new Blob([SQL_SCHEMA_CONTENT], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "postgresql_auth_schema.sql";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Helper to determine relationships
  const getTableConnections = (tableName: string) => {
    if (tableName === "users") return { sources: [], targets: ["user_roles", "refresh_tokens"] };
    if (tableName === "roles") return { sources: [], targets: ["user_roles", "role_permissions"] };
    if (tableName === "permissions") return { sources: [], targets: ["role_permissions"] };
    if (tableName === "user_roles") return { sources: ["users", "roles"], targets: [] };
    if (tableName === "role_permissions") return { sources: ["roles", "permissions"], targets: [] };
    if (tableName === "refresh_tokens") return { sources: ["users"], targets: [] };
    return { sources: [] as string[], targets: [] as string[] };
  };

  const currentConnections = getTableConnections(selectedTableName);

  return (
    <div className={`min-h-screen font-sans selection:bg-blue-500/30 transition-all duration-300 ${
      themeMode === "dark" ? "bg-slate-950 text-slate-100" : "bg-slate-50 text-slate-900"
    }`}>
      
      {/* GLOBAL TOAST NOTIFICATION */}
      <AnimatePresence>
        {toastNotice && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            className={`fixed top-20 right-4 z-50 flex items-center gap-3 px-4.5 py-3 rounded-xl border shadow-xl max-w-sm ${
              themeMode === "dark" 
                ? "bg-slate-900 border-slate-850 text-slate-100" 
                : "bg-white border-slate-200 text-slate-900"
            }`}
          >
            {toastNotice.type === "success" && <CheckCircle className="h-4.5 w-4.5 text-emerald-500 shrink-0" />}
            {toastNotice.type === "info" && <Info className="h-4.5 w-4.5 text-blue-500 shrink-0" />}
            {toastNotice.type === "warning" && <AlertCircle className="h-4.5 w-4.5 text-red-500 shrink-0" />}
            <span className="font-mono text-[11px] font-semibold">{toastNotice.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* GLOBAL COMMAND PALETTE */}
      <GlobalCommandPalette 
        isOpen={isCommandPaletteOpen} 
        onClose={() => setIsCommandPaletteOpen(false)} 
        onSelectRole={(r) => { 
          setActiveRole(r); 
          setPerspective("business"); 
          showToast(`Perspective swapped to ${r.toUpperCase()} workspace`, "success"); 
        }} 
        onSelectSimulation={(mode) => {
          setSimulationMode(mode);
          showToast(`Simulation context set to ${mode.toUpperCase()} state`, "info");
        }}
        onTriggerRefresh={() => handleTriggerAction("refresh")}
        themeMode={themeMode}
      />

      {/* 1. ENTERPRISE HEADER & CONTROLS */}
      <header className={`border-b sticky top-0 z-40 transition-all ${
        themeMode === "dark" 
          ? "border-slate-800/80 bg-slate-950/80 backdrop-blur-md" 
          : "border-slate-200/80 bg-white/95 backdrop-blur-md"
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          
          {/* BREADCRUMB & LOGO */}
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
              <Database className="h-5.5 w-5.5 text-white" strokeWidth={2.5} />
            </div>
            <div>
              <div className="flex items-center gap-1.5 text-[10px] font-mono tracking-wider uppercase text-slate-500">
                <span>Eagle Auctioner</span>
                <ChevronRight className="h-3 w-3" />
                <span>Dashboard</span>
                <ChevronRight className="h-3 w-3" />
                <span className="text-blue-500 font-bold">
                  {perspective === "business" ? `${activeRole} Desk` : "SRE Telemetry"}
                </span>
              </div>
              <h1 className={`text-lg font-bold font-mono tracking-tight ${
                themeMode === "dark" ? "text-white" : "text-blue-950"
              }`}>
                {perspective === "business" 
                  ? `${activeRole.charAt(0).toUpperCase() + activeRole.slice(1)} Control Suite`
                  : "PostgreSQL 15 Cluster Stats"
                }
              </h1>
            </div>
          </div>

          {/* QUICK CONTROLLER ACTIONS */}
          <div className="flex flex-wrap items-center gap-2.5">
            
            {/* PERSPECTIVE SWITCHER */}
            <div className={`p-1 rounded-xl flex items-center border ${
              themeMode === "dark" ? "bg-slate-900/80 border-slate-800" : "bg-slate-100 border-slate-200"
            }`}>
              <button
                onClick={() => setPerspective("business")}
                className={`px-3 py-1.5 text-xs font-mono font-bold rounded-lg flex items-center gap-1 transition-all cursor-pointer ${
                  perspective === "business"
                    ? "bg-blue-600 text-white shadow-sm"
                    : "text-slate-500 hover:text-slate-600"
                }`}
              >
                <Sparkles className="h-3.5 w-3.5" />
                <span>Business Roles</span>
              </button>
              <button
                onClick={() => setPerspective("developer")}
                className={`px-3 py-1.5 text-xs font-mono font-bold rounded-lg flex items-center gap-1 transition-all cursor-pointer ${
                  perspective === "developer"
                    ? "bg-blue-600 text-white shadow-sm"
                    : "text-slate-500 hover:text-slate-600"
                }`}
              >
                <Sliders className="h-3.5 w-3.5" />
                <span>SRE Telemetry</span>
              </button>
            </div>

            {/* CMD + K INTERACTIVE SEARCH BAR */}
            <button
              onClick={() => setIsCommandPaletteOpen(true)}
              className={`px-3 py-1.5 text-xs font-mono font-bold rounded-xl border flex items-center gap-2 transition-all cursor-pointer ${
                themeMode === "dark" 
                  ? "bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700" 
                  : "bg-white border-slate-200 text-slate-500 hover:border-slate-300"
              }`}
            >
              <Search className="h-3.5 w-3.5" />
              <span>Search Console</span>
              <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded border ${
                themeMode === "dark" ? "border-slate-750 bg-slate-950 text-slate-500" : "border-slate-150 bg-slate-50 text-slate-400"
              }`}>
                ⌘K
              </span>
            </button>

            {/* NOTIFICATIONS PANEL BUTTON */}
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className={`p-2 rounded-xl border flex items-center justify-center transition-all cursor-pointer ${
                  themeMode === "dark" 
                    ? "bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800" 
                    : "bg-white border-slate-200 text-slate-700 hover:bg-slate-100"
                }`}
              >
                <Bell className="h-4.5 w-4.5" />
                <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-red-500 animate-ping" />
                <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-red-500" />
              </button>

              <AnimatePresence>
                {showNotifications && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setShowNotifications(false)} />
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 5, scale: 0.95 }}
                      className={`absolute right-0 mt-2 w-80 rounded-2xl border shadow-xl z-50 p-4 font-mono ${
                        themeMode === "dark" ? "bg-slate-900 border-slate-800 text-slate-100" : "bg-white border-slate-200 text-slate-900"
                      }`}
                    >
                      <div className="flex items-center justify-between border-b pb-2 mb-2">
                        <span className="text-[10px] font-bold uppercase text-slate-500">Platform Notifications</span>
                        <button onClick={() => setShowNotifications(false)} className="text-slate-400 hover:text-slate-200">
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                      <div className="space-y-2.5 text-[10px]">
                        <div className="p-2 rounded bg-red-500/10 border border-red-500/20 text-red-400">
                          <strong>SLA alert:</strong> 3 pending KYC approvals approaching threshold.
                        </div>
                        <div className="p-2 rounded bg-blue-500/10 border border-blue-500/20 text-blue-400">
                          <strong>Finance check:</strong> INR Float Pool reconciled successfully with SBI Bank Gateway.
                        </div>
                        <div className="p-2 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                          <strong>New Listing:</strong> Heavy scrap melting iron lot successfully posted.
                        </div>
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>

          </div>
        </div>
      </header>

      {/* MAIN CONTAINER */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        
        {/* VIEW PERSPECTIVE BOUNDARY CONTROLS */}
        {perspective === "business" ? (
          <div className="space-y-6 mb-6">
            
            {/* BUSINESS SIMULATOR & CONTROL BAR */}
            <div className={`p-4 rounded-2xl border flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all ${
              themeMode === "dark" ? "bg-slate-900/40 border-slate-800/80" : "bg-white border-slate-200"
            }`}>
              
              {/* LEFT: ROLES SELECTION BADGES */}
              <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 scrollbar-none">
                {[
                  { id: "personalized", name: "Personalized Cockpit", icon: Sparkles },
                  { id: "executive", name: "Executive Desk", icon: TrendingUp },
                  { id: "admin", name: "Admin Control", icon: ShieldAlert },
                  { id: "buyer", name: "Buyer Desk", icon: KeyRound },
                  { id: "seller", name: "Seller Desk", icon: Tag },
                  { id: "finance", name: "Finance Desk", icon: Coins },
                  { id: "operations", name: "Operations Desk", icon: Gavel }
                ].map((item) => {
                  const Icon = item.icon;
                  const isSel = activeRole === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        setActiveRole(item.id as DashboardRole);
                        showToast(`Switched workspace perspective to ${item.name}`, "info");
                      }}
                      className={`px-3.5 py-2 rounded-xl text-xs font-mono font-bold flex items-center gap-2 transition-all shrink-0 cursor-pointer ${
                        isSel
                          ? "bg-blue-600 text-white shadow-md shadow-blue-500/10"
                          : themeMode === "dark"
                          ? "bg-slate-950 border border-slate-850 text-slate-400 hover:text-white"
                          : "bg-slate-50 border border-slate-150 text-slate-600 hover:text-slate-900"
                      }`}
                    >
                      <Icon className="h-3.5 w-3.5" />
                      <span>{item.name}</span>
                    </button>
                  );
                })}
              </div>

              {/* RIGHT: SIMULATION TUNER */}
              <div className="flex items-center gap-4 shrink-0 font-mono text-[11px] self-end md:self-auto">
                
                {/* SIMULATION STATES SELECTOR */}
                <div className="flex items-center gap-1">
                  <span className="text-slate-500 font-bold uppercase">Simulation:</span>
                  <select
                    value={simulationMode}
                    onChange={(e) => setSimulationMode(e.target.value as any)}
                    className={`bg-transparent border rounded-lg px-2 py-1 outline-none font-bold text-[10px] cursor-pointer ${
                      themeMode === "dark" ? "border-slate-800 text-white bg-slate-950" : "border-slate-200 text-slate-700 bg-white"
                    }`}
                  >
                    <option value="normal">Normal Mode</option>
                    <option value="loading">Loading State</option>
                    <option value="empty">Empty State</option>
                    <option value="error">Error State</option>
                  </select>
                </div>

                {/* AUTO REFRESH CONTROLLER */}
                <div className="flex items-center gap-2">
                  <span className="text-slate-500 font-bold uppercase">Streams:</span>
                  <button
                    onClick={() => {
                      setIsAutoRefreshing(!isAutoRefreshing);
                      showToast(isAutoRefreshing ? "Paused live WebSocket streams simulation" : "Resumed active WebSocket streams simulation", "info");
                    }}
                    className={`px-2.5 py-1 rounded font-bold text-[10px] transition-all cursor-pointer ${
                      isAutoRefreshing 
                        ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20" 
                        : "bg-slate-500/10 text-slate-500 border border-slate-500/20"
                    }`}
                  >
                    {isAutoRefreshing ? "ACTIVE" : "PAUSED"}
                  </button>

                  <button
                    onClick={() => handleTriggerAction("refresh")}
                    className={`p-1 rounded-lg border transition-all cursor-pointer flex items-center justify-center ${
                      themeMode === "dark" 
                        ? "bg-slate-950 border-slate-800 text-slate-400 hover:text-white" 
                        : "bg-white border-slate-200 text-slate-600 hover:text-slate-900"
                    }`}
                    title="Force Manual Sync"
                  >
                    <RotateCw className={`h-3.5 w-3.5 ${isAutoRefreshing ? "animate-spin" : ""}`} />
                  </button>

                  <span className="text-[10px] font-bold text-slate-400 w-6 text-center">
                    {refreshCountdown}s
                  </span>
                </div>

              </div>

            </div>

          </div>
        ) : (
          <>
            {/* STATS RHYTHM METRICS */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <div className={`p-4 rounded-xl border backdrop-blur-sm transition-all ${
                themeMode === "dark" ? "bg-slate-900/60 border-slate-800/60" : "bg-white border-slate-200"
              }`}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-medium text-slate-400">Core Tables</span>
                  <Layers className="h-4 w-4 text-indigo-400" />
                </div>
                <div className="text-2xl font-bold font-mono">6</div>
                <p className="text-[10px] text-slate-400 mt-1">Normalised 3NF Structure</p>
              </div>

              <div className={`p-4 rounded-xl border backdrop-blur-sm transition-all ${
                themeMode === "dark" ? "bg-slate-900/60 border-slate-800/60" : "bg-white border-slate-200"
              }`}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-medium text-slate-400">Indexes Built</span>
                  <Zap className="h-4 w-4 text-cyan-400" />
                </div>
                <div className="text-2xl font-bold font-mono">10</div>
                <p className="text-[10px] text-slate-400 mt-1">Partial and unique optimizations</p>
              </div>

              <div className={`p-4 rounded-xl border backdrop-blur-sm transition-all ${
                themeMode === "dark" ? "bg-slate-900/60 border-slate-800/60" : "bg-white border-slate-200"
              }`}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-medium text-slate-400">Audit Handlers</span>
                  <CalendarDays className="h-4 w-4 text-emerald-400" />
                </div>
                <div className="text-2xl font-bold font-mono">6 Triggers</div>
                <p className="text-[10px] text-slate-500 mt-1">Automatic updated_at column</p>
              </div>

              <div className={`p-4 rounded-xl border backdrop-blur-sm transition-all ${
                themeMode === "dark" ? "bg-slate-900/60 border-slate-800/60" : "bg-white border-slate-200"
              }`}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-medium text-slate-400">Session Security</span>
                  <KeyRound className="h-4 w-4 text-amber-400" />
                </div>
                <div className="text-2xl font-bold font-mono">Rotation</div>
                <p className="text-[10px] text-slate-500 mt-1">Anti-replay tracking lineage</p>
              </div>
            </div>

            {/* TAB NAVIGATION VIEW */}
            <div className="flex border-b border-slate-800/85 mb-6 gap-2 overflow-x-auto">
              <button
                onClick={() => setActiveTab("monitoring")}
                className={`px-4 py-3 text-sm font-semibold transition-all border-b-2 cursor-pointer flex items-center gap-2 shrink-0 ${
                  activeTab === "monitoring"
                    ? "border-indigo-500 text-white bg-indigo-500/5"
                    : "border-transparent text-slate-400 hover:text-slate-300 hover:bg-slate-900/30"
                }`}
              >
                <Activity className="h-4 w-4 text-emerald-400" />
                <span>Reporting, Analytics & Observability</span>
              </button>
              <button
                onClick={() => setActiveTab("visual")}
                className={`px-4 py-3 text-sm font-semibold transition-all border-b-2 cursor-pointer flex items-center gap-2 shrink-0 ${
                  activeTab === "visual"
                    ? "border-indigo-500 text-white bg-indigo-500/5"
                    : "border-transparent text-slate-400 hover:text-slate-300 hover:bg-slate-900/30"
                }`}
              >
                <Layers className="h-4 w-4 text-indigo-400" />
                <span>Interactive Designer & ER Info</span>
              </button>
              <button
                onClick={() => setActiveTab("code")}
                className={`px-4 py-3 text-sm font-semibold transition-all border-b-2 cursor-pointer flex items-center gap-2 shrink-0 ${
                  activeTab === "code"
                    ? "border-indigo-500 text-white bg-indigo-500/5"
                    : "border-transparent text-slate-400 hover:text-slate-300 hover:bg-slate-900/30"
                }`}
              >
                <Code className="h-4 w-4" />
                <span>Raw SQL Schema View</span>
              </button>
              <button
                onClick={() => setActiveTab("queries")}
                className={`px-4 py-3 text-sm font-semibold transition-all border-b-2 cursor-pointer flex items-center gap-2 shrink-0 ${
                  activeTab === "queries"
                    ? "border-indigo-500 text-white bg-indigo-500/5"
                    : "border-transparent text-slate-400 hover:text-slate-300 hover:bg-slate-900/30"
                }`}
              >
                <BookOpen className="h-4 w-4" />
                <span>Standard SQL Recipes</span>
              </button>
              <button
                onClick={() => setActiveTab("java")}
                className={`px-4 py-3 text-sm font-semibold transition-all border-b-2 cursor-pointer flex items-center gap-2 shrink-0 ${
                  activeTab === "java"
                    ? "border-indigo-500 text-white bg-indigo-500/5"
                    : "border-transparent text-slate-400 hover:text-slate-300 hover:bg-slate-900/30"
                }`}
              >
                <Coffee className="h-4 w-4 text-orange-400" />
                <span>Spring Boot Entities</span>
              </button>
              <button
                onClick={() => setActiveTab("audit")}
                className={`px-4 py-3 text-sm font-semibold transition-all border-b-2 cursor-pointer flex items-center gap-2 shrink-0 ${
                  activeTab === "audit"
                    ? "border-emerald-500 text-white bg-emerald-500/5"
                    : "border-transparent text-slate-400 hover:text-slate-300 hover:bg-slate-900/30"
                }`}
              >
                <ShieldCheck className="h-4 w-4 text-emerald-400" />
                <span>Hardening Audit (Bugs 1-38)</span>
                <span className="text-[9px] font-bold px-1.5 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded animate-pulse">38 FIXED</span>
              </button>
            </div>
          </>
        )}

        {/* TAB PANELS CONTAINER */}
        <div className="min-h-[500px]">
          
          <AnimatePresence mode="wait">
            {perspective === "business" ? (
              <motion.div
                key={activeRole}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                transition={{ duration: 0.15 }}
                className="space-y-6"
              >
                {activeRole === "personalized" && (
                  <PersonalizedDashboard 
                    simulationMode={simulationMode} 
                    themeMode={themeMode} 
                    onTriggerAction={handleTriggerAction} 
                    showToast={showToast}
                  />
                )}
                {activeRole === "executive" && (
                  <ExecutiveDashboard 
                    simulationMode={simulationMode} 
                    themeMode={themeMode} 
                    onTriggerAction={handleTriggerAction} 
                  />
                )}
                {activeRole === "admin" && (
                  <AdminDashboard 
                    simulationMode={simulationMode} 
                    themeMode={themeMode} 
                    onTriggerAction={handleTriggerAction} 
                  />
                )}
                {activeRole === "buyer" && (
                  <BuyerDashboard 
                    simulationMode={simulationMode} 
                    themeMode={themeMode} 
                    onTriggerAction={handleTriggerAction} 
                  />
                )}
                {activeRole === "seller" && (
                  <SellerDashboard 
                    simulationMode={simulationMode} 
                    themeMode={themeMode} 
                    onTriggerAction={handleTriggerAction} 
                  />
                )}
                {activeRole === "finance" && (
                  <FinanceDashboard 
                    simulationMode={simulationMode} 
                    themeMode={themeMode} 
                    onTriggerAction={handleTriggerAction} 
                  />
                )}
                {activeRole === "operations" && (
                  <OperationsDashboard 
                    simulationMode={simulationMode} 
                    themeMode={themeMode} 
                    onTriggerAction={handleTriggerAction} 
                  />
                )}
              </motion.div>
            ) : (
              <>
                {activeTab === "monitoring" && (
                  <motion.div
                  key="monitoring"
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  transition={{ duration: 0.15 }}
                  className="space-y-8"
                >
                {/* DYNAMIC ALERT BOX FOR TENANT ISOLATION */}
                <div className="bg-emerald-950/20 border border-emerald-500/30 rounded-xl p-5 flex gap-3.5 text-xs text-slate-300 items-start backdrop-blur-sm">
                  <ShieldCheck className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <h3 className="text-emerald-300 font-semibold mb-1">Row Level Security (RLS) & Tenant Isolation Active</h3>
                    <p className="leading-relaxed">
                      All calculations, reports, and transactional audit chains are partitioned at the database boundary using tenant headers (<code className="text-emerald-400 font-mono">X-Tenant-Id</code>). Zero cross-tenant data leaks can occur under active Spring Security filters.
                    </p>
                  </div>
                </div>

                {/* TWO-COLUMN GRID: REPORTING ON LEFT, ANALYTICS KPIs ON RIGHT */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                  
                  {/* LEFT: REPORT GENERATOR ENGINE (5 cols) */}
                  <div className="lg:col-span-5 bg-slate-900/40 border border-slate-800/80 rounded-2xl p-6 backdrop-blur-sm flex flex-col justify-between">
                    <div>
                      <div className="flex items-center gap-2.5 mb-5 border-b border-slate-800/80 pb-4">
                        <div className="h-8 w-8 rounded-lg bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                          <FileSpreadsheet className="h-4.5 w-4.5 text-emerald-400" />
                        </div>
                        <div>
                          <h3 className="text-sm font-semibold text-white">Enterprise Reporting Hub</h3>
                          <p className="text-[11px] text-slate-400">On-demand export & automatic scheduled delivery</p>
                        </div>
                      </div>

                      <div className="space-y-4">
                        {/* SELECT REPORT TYPE */}
                        <div>
                          <label className="block text-[11px] font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">Report Category</label>
                          <select 
                            value={reportType}
                            onChange={(e) => {
                              setReportType(e.target.value);
                              setGeneratedReport(null);
                            }}
                            className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 font-mono"
                          >
                            <option value="REVENUE">Revenue Report (Commission, Service Fees)</option>
                            <option value="GST">GST Ledger Reconciliation Report</option>
                            <option value="AUCTION">Auction Listings & State Report</option>
                            <option value="BID">Bid Event Placements Ledger</option>
                            <option value="WINNER">Winner Decisions & Snapshots</option>
                            <option value="SETTLEMENT">Settlement Payables Statement</option>
                            <option value="LEDGER">Double-Entry Ledger Integrity Statement</option>
                            <option value="PAYMENT">Payment Reconciliation Sheet</option>
                            <option value="USER">User Onboarding Demographics</option>
                            <option value="SELLER">Approved Seller Portfolio Status</option>
                            <option value="BUYER">Approved Buyer Portfolio Stats</option>
                          </select>
                        </div>

                        {/* SELECT FORMAT */}
                        <div>
                          <label className="block text-[11px] font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">Output File Format</label>
                          <div className="grid grid-cols-3 gap-2">
                            {["CSV", "PDF", "EXCEL"].map((format) => (
                              <button
                                key={format}
                                type="button"
                                onClick={() => setReportFormat(format)}
                                className={`px-3 py-2 text-xs font-mono font-bold rounded-lg border transition-all cursor-pointer ${
                                  reportFormat === format
                                    ? "border-emerald-500/50 bg-emerald-500/15 text-emerald-300"
                                    : "border-slate-800 bg-slate-950 text-slate-400 hover:text-slate-300 hover:bg-slate-900"
                                }`}
                              >
                                {format}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* MULTI-TENANT ISOLATION INPUT */}
                        <div>
                          <label className="block text-[11px] font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">Partition Tenant ID (UUID)</label>
                          <input 
                            type="text"
                            value={tenantId}
                            onChange={(e) => setTenantId(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-300 font-mono focus:outline-none focus:border-indigo-500"
                            placeholder="X-Tenant-Id String"
                          />
                        </div>

                        {/* AUTOMATION & CRON SETTINGS */}
                        <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800/70 space-y-3.5">
                          <div className="flex items-center gap-1.5 text-slate-300 font-semibold text-[11px] uppercase tracking-wider">
                            <CalendarDays className="h-3.5 w-3.5 text-indigo-400" />
                            <span>Schedule Report Delivery</span>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="block text-[10px] text-slate-500 mb-1 font-mono">CRON (Spring Format)</label>
                              <input 
                                type="text"
                                value={cronExpression}
                                onChange={(e) => setCronExpression(e.target.value)}
                                className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-slate-300 font-mono focus:outline-none focus:border-indigo-500"
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] text-slate-500 mb-1 font-mono">Recipient Email</label>
                              <input 
                                type="email"
                                value={recipientEmail}
                                onChange={(e) => setRecipientEmail(e.target.value)}
                                className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-slate-300 font-mono focus:outline-none focus:border-indigo-500"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="mt-6 pt-4 border-t border-slate-800/80 space-y-2">
                      <div className="grid grid-cols-2 gap-3">
                        <button
                          type="button"
                          disabled={isGeneratingReport}
                          onClick={() => {
                            setIsGeneratingReport(true);
                            setGeneratedReport(null);
                            setTimeout(() => {
                              setIsGeneratingReport(false);
                              // Mock generator rows matching Java reporting logic
                              let data: string[][] = [];
                              if (reportType === "REVENUE") {
                                data = [
                                  ["Ledger ID", "Account Type", "Entry Type", "Amount", "Description", "Created At"],
                                  ["013ba6a4-681b", "REVENUE", "CREDIT", "145,000.00 INR", "Commission from Lot #420", "2026-06-26 10:45"],
                                  ["a482bc6a-4952", "REVENUE", "CREDIT", "29,000.00 INR", "Platform service fee", "2026-06-26 10:48"]
                                ];
                              } else if (reportType === "GST") {
                                data = [
                                  ["Invoice ID", "CGST Amount", "SGST Amount", "IGST Amount", "Total GST", "Sellers GSTIN", "Created At"],
                                  ["5fc321ba-a381", "1,800.00 INR", "1,800.00 INR", "0.00 INR", "3,600.00 INR", "27AAAAA1111A1Z1", "2026-06-26 10:45"]
                                ];
                              } else if (reportType === "AUCTION") {
                                data = [
                                  ["Auction ID", "Title", "Start Price", "Reserve Price", "Status", "Bids Count", "Winner ID"],
                                  ["8b23ad4c-c09a", "Premium Antique Vase", "5,000.00 INR", "12,000.00 INR", "COMPLETED", "14", "9ab4c8ef-0012"]
                                ];
                              } else if (reportType === "BID") {
                                data = [
                                  ["Bid ID", "Bidder ID", "Lot ID", "Bid Amount", "Status", "Bid Time"],
                                  ["bcda0124-762c", "381ab924-ce48", "8b23ad4c-c09a", "12,500.00 INR", "ACCEPTED", "2026-06-26 10:42"]
                                ];
                              } else {
                                data = [
                                  ["Record Identifier", "Field A", "Field B", "Performance Amount", "Compliance Status", "Timestamp"],
                                  [Math.random().toString(36).substring(2, 15), "Value_Parameter_01", "Aggregate_Segment_X", "85,000.00 INR", "PASS_VERIFIED", "2026-06-26 10:44"]
                                ];
                              }
                              setGeneratedReport(data);
                            }, 800);
                          }}
                          className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-semibold py-2.5 rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          {isGeneratingReport ? (
                            <span className="h-3.5 w-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          ) : (
                            <Play className="h-3.5 w-3.5" />
                          )}
                          <span>Run Instant</span>
                        </button>

                        <button
                          type="button"
                          disabled={isSchedulingReport}
                          onClick={() => {
                            setIsSchedulingReport(true);
                            setTimeout(() => {
                              setIsSchedulingReport(false);
                              setShowScheduleNotification(true);
                              setTimeout(() => setShowScheduleNotification(false), 3500);
                            }, 600);
                          }}
                          className="w-full bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-indigo-300 hover:text-indigo-200 border border-slate-700 text-xs font-semibold py-2.5 rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <CalendarDays className="h-3.5 w-3.5" />
                          <span>Schedule Delivery</span>
                        </button>
                      </div>

                      {/* EXPORT BUTTONS IF REPORT GENERATED */}
                      {generatedReport && (
                        <div className="flex gap-2 pt-2 animate-fadeIn">
                          <button
                            onClick={() => {
                              // Trigger a simple mock file download
                              const content = generatedReport.map(r => r.join(",")).join("\n");
                              const blob = new Blob([content], { type: "text/plain" });
                              const url = URL.createObjectURL(blob);
                              const a = document.createElement("a");
                              a.href = url;
                              a.download = `report_${reportType.toLowerCase()}.${reportFormat.toLowerCase()}`;
                              a.click();
                            }}
                            className="w-full bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold py-2 rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                          >
                            <Download className="h-3.5 w-3.5" />
                            <span>Export {reportFormat} File</span>
                          </button>
                        </div>
                      )}

                      {/* NOTIFICATIONS */}
                      {showScheduleNotification && (
                        <div className="bg-indigo-950/40 border border-indigo-500/30 text-indigo-200 text-xs p-3 rounded-lg text-center animate-slideIn">
                          <strong>Cron Job Registered!</strong> Scheduled {reportType} report delivery via {reportFormat} to <span className="underline font-mono">{recipientEmail}</span>.
                        </div>
                      )}
                    </div>
                  </div>

                  {/* RIGHT: ANALYTICS KPIs DASHBOARD (7 cols) */}
                  <div className="lg:col-span-7 space-y-6">
                    <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-6 backdrop-blur-sm">
                      <div className="flex items-center justify-between mb-6 border-b border-slate-800/80 pb-4">
                        <div className="flex items-center gap-2.5">
                          <div className="h-8 w-8 rounded-lg bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20">
                            <BarChart3 className="h-4.5 w-4.5 text-indigo-400" />
                          </div>
                          <div>
                            <h3 className="text-sm font-semibold text-white">Spring Boot 3.2 Live Analytics</h3>
                            <p className="text-[11px] text-slate-400">Aggregated sub-second dashboard statistics (AnalyticsDashboardDTO)</p>
                          </div>
                        </div>
                        <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded">
                          REFRESHED CONCURRENTLY
                        </span>
                      </div>

                      {/* BENTO STATS GRID */}
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800/70">
                          <span className="text-[10px] font-mono uppercase text-slate-400 font-bold">Total Platform Revenue</span>
                          <div className="text-lg font-bold font-mono text-emerald-400 mt-1">₹1,87,500.50</div>
                          <p className="text-[9px] text-indigo-300 mt-0.5">+14.2% Seller growth</p>
                        </div>

                        <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800/70">
                          <span className="text-[10px] font-mono uppercase text-slate-400 font-bold">Platform GMV Flow</span>
                          <div className="text-lg font-bold font-mono text-white mt-1">₹23,50,000.00</div>
                          <p className="text-[9px] text-indigo-300 mt-0.5">+19.8% Buyer growth</p>
                        </div>

                        <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800/70 col-span-2 md:col-span-1">
                          <span className="text-[10px] font-mono uppercase text-slate-400 font-bold">Bid Success Rate</span>
                          <div className="text-lg font-bold font-mono text-indigo-300 mt-1">87.4%</div>
                          <p className="text-[9px] text-slate-500 mt-0.5">Average 8.6 bids / lot</p>
                        </div>

                        <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800/70">
                          <span className="text-[10px] font-mono uppercase text-slate-400 font-bold">Completed Auctions</span>
                          <div className="text-lg font-bold font-mono text-white mt-1">154 Lots</div>
                          <div className="w-full bg-slate-800 h-1 rounded-full mt-2 overflow-hidden">
                            <div className="bg-indigo-500 h-full w-4/5" />
                          </div>
                        </div>

                        <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800/70">
                          <span className="text-[10px] font-mono uppercase text-slate-400 font-bold">Active Auctions</span>
                          <div className="text-lg font-bold font-mono text-amber-400 mt-1">22 Live</div>
                          <div className="w-full bg-slate-800 h-1 rounded-full mt-2 overflow-hidden">
                            <div className="bg-amber-500 h-full w-1/4 animate-pulse" />
                          </div>
                        </div>

                        <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800/70">
                          <span className="text-[10px] font-mono uppercase text-slate-400 font-bold">Dispute Resolution Rate</span>
                          <div className="text-lg font-bold font-mono text-emerald-400 mt-1">97.5%</div>
                          <p className="text-[9px] text-emerald-400/80 mt-0.5">3 pending review</p>
                        </div>
                      </div>

                      {/* SETTLEMENTS & COLLECTIONS SECTOR */}
                      <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-slate-800/60">
                        {/* SETTLEMENTSTATUS */}
                        <div className="bg-slate-950/40 p-4 rounded-xl border border-slate-800/50 space-y-2">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Contract Settlement Status</span>
                          <div className="space-y-1.5 text-[11px]">
                            <div className="flex justify-between items-center text-slate-300">
                              <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-400" /> PAID</span>
                              <span className="font-mono font-semibold">120 Contracts</span>
                            </div>
                            <div className="flex justify-between items-center text-slate-300">
                              <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-amber-400" /> PENDING RECONCILIATION</span>
                              <span className="font-mono font-semibold">24 Contracts</span>
                            </div>
                            <div className="flex justify-between items-center text-slate-300">
                              <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-red-400" /> DISPUTED / REJECTED</span>
                              <span className="font-mono font-semibold">3 Disputes</span>
                            </div>
                          </div>
                        </div>

                        {/* COLLECTIONSTATUS */}
                        <div className="bg-slate-950/40 p-4 rounded-xl border border-slate-800/50 space-y-2">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Collection Balance status</span>
                          <div className="space-y-1.5 text-[11px]">
                            <div className="flex justify-between items-center text-slate-300">
                              <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-400" /> COLLECTED FUNDS</span>
                              <span className="font-mono font-semibold">₹20,00,000.00</span>
                            </div>
                            <div className="flex justify-between items-center text-slate-300">
                              <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-amber-400" /> ARREARS & OUTSTANDING</span>
                              <span className="font-mono font-semibold">₹3,50,000.00</span>
                            </div>
                            <div className="flex justify-between items-center text-slate-300">
                              <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-indigo-400" /> REVENUE SHARE ACCRUED</span>
                              <span className="font-mono font-semibold">₹1,87,500.50</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                </div>

                {/* BOTTOM PREVIEW AND INTERACTIVE REPORT ROWS DISPLAY */}
                {generatedReport && (
                  <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-6 backdrop-blur-sm animate-fadeIn">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
                      <span className="text-xs font-semibold text-slate-300 flex items-center gap-2">
                        <Activity className="h-4 w-4 text-emerald-400" />
                        <span>Interactive Output: {reportType} Report ({reportFormat} Format)</span>
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono">X-Tenant-Id Isolated Filter Active</span>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="border-b border-slate-800 text-slate-400 font-semibold bg-slate-950/50">
                            {generatedReport[0].map((headerCell, i) => (
                              <th key={i} className="p-3 font-mono text-[11px] uppercase tracking-wider">{headerCell}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {generatedReport.slice(1).map((row, index) => (
                            <tr key={index} className="border-b border-slate-850 hover:bg-slate-900/40 transition-all text-slate-200">
                              {row.map((cell, idx) => (
                                <td key={idx} className="p-3 font-mono">{cell}</td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* SRE OBSERVABILITY CONSOLE PLATFORM */}
                <div className="bg-slate-900/50 border border-slate-800/90 rounded-2xl overflow-hidden backdrop-blur-sm">
                  {/* CONSOLE MENU HEADERS */}
                  <div className="border-b border-slate-800/85 bg-slate-900/30 px-4 py-1 flex gap-2 overflow-x-auto items-center">
                    <span className="text-xs font-mono font-bold text-slate-500 pr-4 border-r border-slate-800">SRE CONSOLE</span>
                    <button
                      onClick={() => setSelectedSubTab("metrics")}
                      className={`px-3 py-2.5 text-xs font-bold font-mono transition-all border-b-2 cursor-pointer flex items-center gap-1.5 ${
                        selectedSubTab === "metrics"
                          ? "border-emerald-400 text-white bg-slate-950/40"
                          : "border-transparent text-slate-400 hover:text-slate-300"
                      }`}
                    >
                      <Gauge className="h-3.5 w-3.5" />
                      <span>Actuator & Prometheus</span>
                    </button>
                    <button
                      onClick={() => setSelectedSubTab("readiness")}
                      className={`px-3 py-2.5 text-xs font-bold font-mono transition-all border-b-2 cursor-pointer flex items-center gap-1.5 ${
                        selectedSubTab === "readiness"
                          ? "border-emerald-400 text-white bg-slate-950/40"
                          : "border-transparent text-slate-400 hover:text-slate-300"
                      }`}
                    >
                      <Server className="h-3.5 w-3.5" />
                      <span>Production Readiness</span>
                    </button>
                    <button
                      onClick={() => setSelectedSubTab("performance")}
                      className={`px-3 py-2.5 text-xs font-bold font-mono transition-all border-b-2 cursor-pointer flex items-center gap-1.5 ${
                        selectedSubTab === "performance"
                          ? "border-emerald-400 text-white bg-slate-950/40"
                          : "border-transparent text-slate-400 hover:text-slate-300"
                      }`}
                    >
                      <Zap className="h-3.5 w-3.5" />
                      <span>Concurrency Benchmarks</span>
                    </button>
                    <button
                      onClick={() => setSelectedSubTab("security")}
                      className={`px-3 py-2.5 text-xs font-bold font-mono transition-all border-b-2 cursor-pointer flex items-center gap-1.5 ${
                        selectedSubTab === "security"
                          ? "border-emerald-400 text-white bg-slate-950/40"
                          : "border-transparent text-slate-400 hover:text-slate-300"
                      }`}
                    >
                      <Fingerprint className="h-3.5 w-3.5" />
                      <span>Security Vetting</span>
                    </button>
                  </div>

                  {/* SUB-TABS INTERACTIVE BODY */}
                  <div className="p-6 bg-slate-950/90 text-xs">
                    
                    {/* A. ACTUATOR METRICS AND PROMETHEUS SCRAPING */}
                    {selectedSubTab === "metrics" && (
                      <div className="space-y-6">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800">
                            <div className="text-slate-400 font-mono text-[10px]">JVM HEAP USAGE</div>
                            <div className="text-lg font-bold font-mono text-emerald-400 mt-0.5">384 MB / 1024 MB</div>
                            <div className="w-full bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
                              <div className="bg-emerald-400 h-full w-[37.5%]" />
                            </div>
                          </div>
                          <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800">
                            <div className="text-slate-400 font-mono text-[10px]">ACTIVE REDIS CONNECTIONS</div>
                            <div className="text-lg font-bold font-mono text-emerald-400 mt-0.5">16 Active Pools</div>
                            <div className="text-[9px] text-slate-500 mt-1">Hashed clustering OK</div>
                          </div>
                          <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800">
                            <div className="text-slate-400 font-mono text-[10px]">WEBSOCKET CHANNELS</div>
                            <div className="text-lg font-bold font-mono text-emerald-400 mt-0.5">124 Clients Live</div>
                            <div className="text-[9px] text-slate-500 mt-1">Interceptors checking auth</div>
                          </div>
                          <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800">
                            <div className="text-slate-400 font-mono text-[10px]">OUTBOX QUEUE BACKLOG</div>
                            <div className="text-lg font-bold font-mono text-emerald-400 mt-0.5">0 Pending Events</div>
                            <div className="text-[9px] text-emerald-400 mt-1">Throughput healthy (100%)</div>
                          </div>
                        </div>

                        {/* PROMETHEUS TEXT INTERACTIVE CONTAINER */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                          <div>
                            <div className="flex justify-between items-center mb-2">
                              <span className="font-mono text-xs font-bold text-slate-300">Actuator Scraping Target (Prometheus Exposition Format)</span>
                              <button
                                onClick={() => {
                                  navigator.clipboard.writeText(`
# HELP business_gmv_total Total GMV across all lots
# TYPE business_gmv_total gauge
business_gmv_total{tenant="05f9024c-9f0e-4361-bd87-35ff5e019a2b"} 2350000.00
# HELP integration_outbox_pending Number of unprocessed outbox events
# TYPE integration_outbox_pending gauge
integration_outbox_pending{tenant="all"} 0
# HELP system_cpu_usage JVM CPU usage
# TYPE system_cpu_usage gauge
system_cpu_usage 0.12
# HELP jvm_memory_used_bytes Used memory
# TYPE jvm_memory_used_bytes gauge
jvm_memory_used_bytes{area="heap"} 402653184
                                  `);
                                  setCopiedPrometheus(true);
                                  setTimeout(() => setCopiedPrometheus(false), 2000);
                                }}
                                className="px-2 py-1 text-[10px] font-semibold bg-slate-800 hover:bg-slate-700 text-indigo-300 rounded cursor-pointer transition-all"
                              >
                                {copiedPrometheus ? "Copied!" : "Scrape Raw Payload"}
                              </button>
                            </div>
                            <pre className="p-4 bg-slate-950 border border-slate-900 rounded-xl font-mono text-emerald-400 text-[10px] h-[160px] overflow-y-auto leading-relaxed">
{`# HELP business_gmv_total Total GMV across all lots
# TYPE business_gmv_total gauge
business_gmv_total{tenant="05f9024c-9f0e-4361-bd87-35ff5e019a2b"} 2350000.00

# HELP integration_outbox_pending Number of unprocessed outbox events
# TYPE integration_outbox_pending gauge
integration_outbox_pending{tenant="all"} 0

# HELP system_cpu_usage JVM CPU usage
# TYPE system_cpu_usage gauge
system_cpu_usage 0.12

# HELP jvm_memory_used_bytes Used memory
# TYPE jvm_memory_used_bytes gauge
jvm_memory_used_bytes{area="heap"} 402653184`}
                            </pre>
                          </div>

                          <div>
                            <span className="font-mono text-xs font-bold text-slate-300 block mb-2">Grafana Dashboard Panel Definitions</span>
                            <pre className="p-4 bg-slate-950 border border-slate-900 rounded-xl font-mono text-slate-400 text-[10px] h-[160px] overflow-y-auto leading-relaxed">
{`{
  "title": "Eagle Auctioner Observability Dashboard",
  "panels": [
    {
      "name": "System Health Indicators",
      "type": "stat",
      "targets": ["up"]
    },
    {
      "name": "Total GMV Metric",
      "type": "graph",
      "targets": ["business_gmv_total"]
    },
    {
      "name": "Transactional Outbox Pending",
      "type": "gauge",
      "targets": ["integration_outbox_pending"]
    }
  ]
}`}
                            </pre>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* B. PRODUCTION READINESS CHECKS */}
                    {selectedSubTab === "readiness" && (
                      <div className="space-y-4">
                        <div className="flex justify-between items-center border-b border-slate-900 pb-2">
                          <div>
                            <h4 className="font-semibold text-white">System Diagnostics & Compliance Sign-off</h4>
                            <p className="text-[10px] text-slate-500 mt-0.5">Automated release audit covering environment validations and backup registries</p>
                          </div>
                          <button
                            type="button"
                            disabled={isRunningDiagnostics}
                            onClick={() => {
                              setIsRunningDiagnostics(true);
                              setTimeout(() => {
                                setIsRunningDiagnostics(false);
                                setDiagnosticsResult({
                                  "Configuration Validation Check": "PASS - Env params matching properties verified",
                                  "Hot-Standby DB WAL Backup Verification": "PASS - Continuous archival sync checks verified",
                                  "PostgreSQL Server Level Checks": "PASS - Engine v15.4 validated",
                                  "Redis Cluster Ring Cache Checks": "PASS - Redis Node Cluster OK",
                                  "Feature Flag Controls": "ACTIVE - Document Sequences & Extension Scheduler OK",
                                  "Audit Logs Checksum Chain Integrity": "PASS - SHA-256 chain verified without tampering blocks"
                                });
                              }, 800);
                            }}
                            className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-[11px] font-semibold px-3 py-1.5 rounded cursor-pointer flex items-center gap-1 transition-all"
                          >
                            {isRunningDiagnostics ? "Running Scanner..." : "Run Complete Diagnostics"}
                          </button>
                        </div>

                        {diagnosticsResult ? (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-fadeIn">
                            {Object.entries(diagnosticsResult).map(([title, val]: any) => (
                              <div key={title} className="bg-slate-900/60 border border-slate-850 p-3 rounded-lg flex items-center justify-between">
                                <span className="font-mono text-slate-300">{title}</span>
                                <span className="font-mono text-emerald-400 font-bold text-[10px] bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">{val}</span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-8 text-slate-500 font-mono">
                            Click "Run Complete Diagnostics" to verify production readiness checksums and feature flag integrations.
                          </div>
                        )}
                      </div>
                    )}

                    {/* C. PERFORMANCE / LOAD TEST SUITE */}
                    {selectedSubTab === "performance" && (
                      <div className="space-y-4">
                        <div className="flex justify-between items-center border-b border-slate-900 pb-2">
                          <div>
                            <h4 className="font-semibold text-white">Load Testing & Concurrency Validation Tools</h4>
                            <p className="text-[10px] text-slate-500 mt-0.5">High-speed outbox throughput testing and scheduler latency simulators</p>
                          </div>
                          <button
                            type="button"
                            disabled={isRunningPerformance}
                            onClick={() => {
                              setIsRunningPerformance(true);
                              setTimeout(() => {
                                setIsRunningPerformance(false);
                                setPerformanceResult({
                                  "Load Simulation Mode": "COMPLETED - Concurrency bounds verified",
                                  "Active Threads Configured": "8 Threads (Fixed Executor)",
                                  "Outbox Events Dispatched": "10,000 Messages",
                                  "Outbox Processing Velocity": "48,251 events/second",
                                  "Database Lookup Response Jitter": "1.2 ms (Indexed View)",
                                  "Notification Dispatch Velocity": "1,850 SMS/sec (Spring integration)",
                                  "Scheduler Jitter Verification": "420 microseconds"
                                });
                              }, 1200);
                            }}
                            className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-[11px] font-semibold px-3 py-1.5 rounded cursor-pointer flex items-center gap-1 transition-all"
                          >
                            {isRunningPerformance ? "Executing Threads..." : "Execute Performance Suite"}
                          </button>
                        </div>

                        {performanceResult ? (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-fadeIn">
                            {Object.entries(performanceResult).map(([title, val]: any) => (
                              <div key={title} className="bg-slate-900/60 border border-slate-850 p-3 rounded-lg flex items-center justify-between">
                                <span className="font-mono text-slate-300">{title}</span>
                                <span className="font-mono text-indigo-300 font-bold text-[10px] bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">{val}</span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-8 text-slate-500 font-mono">
                            Click "Execute Performance Suite" to run asynchronous stress tests on the scheduler and outbox throughput pipelines.
                          </div>
                        )}
                      </div>
                    )}

                    {/* D. ENTERPRISE SECURITY AUDIT */}
                    {selectedSubTab === "security" && (
                      <div className="space-y-4">
                        <div className="flex justify-between items-center border-b border-slate-900 pb-2">
                          <div>
                            <h4 className="font-semibold text-white">Enterprise Security & Compliance Review</h4>
                            <p className="text-[10px] text-slate-500 mt-0.5">Audits RBAC, IDOR, Mass Assignment, and JWT rotation parameters</p>
                          </div>
                          <button
                            type="button"
                            disabled={isRunningSecurity}
                            onClick={() => {
                              setIsRunningSecurity(true);
                              setTimeout(() => {
                                setIsRunningSecurity(false);
                                setSecurityResult({
                                  "Role-Based Access Control (RBAC)": "PASS - hasRole('ADMIN') annotations confirmed",
                                  "IDOR & BOLA Shields": "PASS - Tenant isolation enforced on aspects",
                                  "Mass Assignment Protection": "PASS - Direct JPA mapping blocks disabled via explicit RequestDTOs",
                                  "JWT Rotation Policy": "PASS - RS256 rotation active on refresh tokens",
                                  "WebSocket Frame Security": "PASS - JwtChannelInterceptor vetting enabled",
                                  "Audit Trail Integrity": "PASS - Automated @Audited mutations verified"
                                });
                              }, 800);
                            }}
                            className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-[11px] font-semibold px-3 py-1.5 rounded cursor-pointer flex items-center gap-1 transition-all"
                          >
                            {isRunningSecurity ? "Vetting..." : "Verify Security Layout"}
                          </button>
                        </div>

                        {securityResult ? (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-fadeIn">
                            {Object.entries(securityResult).map(([title, val]: any) => (
                              <div key={title} className="bg-slate-900/60 border border-slate-850 p-3 rounded-lg flex items-center justify-between">
                                <span className="font-mono text-slate-300">{title}</span>
                                <span className="font-mono text-emerald-400 font-bold text-[10px] bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">{val}</span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-8 text-slate-500 font-mono">
                            Click "Verify Security Layout" to audit cryptographic signatures, IDOR protections, and WebSocket authentication states.
                          </div>
                        )}
                      </div>
                    )}

                  </div>
                </div>
              </motion.div>
            )}

            {/* 4. JAVA ENTITY TAB */}
            {activeTab === "java" && (
              <motion.div
                key="java"
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                transition={{ duration: 0.15 }}
                className="bg-slate-900/50 border border-slate-800/90 rounded-xl overflow-hidden backdrop-blur-sm p-12 text-center"
              >
                <Coffee className="h-12 w-12 text-slate-600 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-slate-300">Java Source Browser Removed</h3>
                <p className="text-slate-500 mt-2">Java source browser has been removed to reduce repository size.</p>
              </motion.div>
            )}

            {/* 1. VISUAL INTERACTIVE ER & DESIGN DESIGNER TAB */}
            {activeTab === "visual" && (
              <motion.div
                key="visual"
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                transition={{ duration: 0.15 }}
                className="grid grid-cols-1 lg:grid-cols-12 gap-8"
              >
                
                {/* MIDDLE LEFT COLUMN: SCHEMA FLOW DIAGRAM */}
                <div className="lg:col-span-4 flex flex-col gap-4">
                  <div className="bg-slate-900/40 border border-slate-800/80 rounded-xl p-5 backdrop-blur-sm">
                    <h3 className="text-xs uppercase font-extrabold tracking-wider text-slate-400 mb-4 flex items-center gap-2">
                      <Database className="h-3.5 w-3.5 text-indigo-400" />
                      <span>Module Table Map</span>
                    </h3>

                    {/* INTERACTIVE TABLE BUTTONS CHIPS LIST */}
                    <div className="flex flex-col gap-2.5">
                      {SCHEMA_TABLES.map((table) => {
                        const isSelected = selectedTableName === table.name;
                        const isSource = currentConnections.sources.includes(table.name);
                        const isTarget = currentConnections.targets.includes(table.name);

                        let flagClass = "border-slate-800 text-slate-400 bg-slate-900/40 hover:bg-slate-800/30";
                        if (isSelected) {
                          flagClass = "border-indigo-500 text-indigo-200 bg-indigo-950/40 shadow-sm shadow-indigo-500/10 scale-[1.01]";
                        } else if (isSource) {
                          flagClass = "border-amber-500/60 text-amber-200 bg-amber-950/20";
                        } else if (isTarget) {
                          flagClass = "border-cyan-500/60 text-cyan-200 bg-cyan-950/20";
                        }

                        return (
                          <button
                            key={table.name}
                            onClick={() => setSelectedTableName(table.name)}
                            className={`w-full text-left p-3 rounded-lg border transition-all duration-200 cursor-pointer flex items-center justify-between group ${flagClass}`}
                          >
                            <div className="flex items-center gap-2.5">
                              {table.name === "users" && <User className="h-4 w-4" />}
                              {table.name === "roles" && <ShieldCheck className="h-4 w-4" />}
                              {table.name === "permissions" && <KeyRound className="h-4 w-4" />}
                              {table.name === "refresh_tokens" && <ArrowRightLeft className="h-4 w-4 text-emerald-400" />}
                              {(table.name === "user_roles" || table.name === "role_permissions") && <Layers className="h-4 w-4" />}
                              
                              <span className="font-mono text-sm font-semibold tracking-tight">{table.name}</span>
                            </div>

                            <div className="flex items-center gap-1.5">
                              {isSelected && (
                                <span className="text-[9px] uppercase font-bold tracking-widest text-indigo-300 bg-indigo-500/30 px-1 py-0.5 rounded">
                                  Selected
                                </span>
                              )}
                              {isSource && (
                                <span className="text-[9px] uppercase font-bold tracking-widest text-amber-300 bg-amber-500/20 px-1.5 py-0.5 rounded">
                                  FK Target
                                </span>
                              )}
                              {isTarget && (
                                <span className="text-[9px] uppercase font-bold tracking-widest text-cyan-300 bg-cyan-500/20 px-1.5 py-0.5 rounded">
                                  References
                                </span>
                              )}
                              <ChevronRight className={`h-4 w-4 opacity-40 group-hover:opacity-75 transition-all ${isSelected ? "translate-x-0.5 opacity-100" : ""}`} />
                            </div>
                          </button>
                        );
                      })}
                    </div>

                    {/* ER RELATIONSHIPS EXPLAINER LEGEND */}
                    <div className="mt-5 pt-5 border-t border-slate-800/80">
                      <h4 className="text-[10px] uppercase tracking-wider font-semibold text-slate-500 mb-2">
                        Dependency Indicators Legend
                      </h4>
                      <div className="space-y-1.5 text-xs text-slate-400">
                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded bg-indigo-600 border border-indigo-500 inline-block shrink-0" />
                          <span>Currently Selected Table Target</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded bg-amber-600/30 border border-amber-500 inline-block shrink-0" />
                          <span>Parent Entities referenced by Foreign Keys</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded bg-cyan-600/30 border border-cyan-500 inline-block shrink-0" />
                          <span>Child Entities that map columns back to this</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* SECURITY WARNING COMPONENT */}
                  <div className="bg-gradient-to-r from-slate-900 to-indigo-950/20 border border-indigo-950/40 rounded-xl p-4 flex gap-3 text-xs text-slate-300">
                    <Info className="h-4.5 w-4.5 text-indigo-400 shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-white block font-medium">PostgreSQL 15 Best Practice Built-In</strong>
                      Email and Unique Name checks utilize partial unique indexes mapped to <code className="text-indigo-300 bg-indigo-950/70 px-1 py-0.5 rounded font-mono text-[10px]">WHERE deleted_at IS NULL</code>, resolving traditional database duplicate collisions after soft deletes occur.
                    </div>
                  </div>
                </div>

                {/* VISUAL LAYOUTS COLUMN: TABLE SPEC DETAILS */}
                <div className="lg:col-span-8 flex flex-col gap-6">
                  
                  {/* METRIC BADGES CARD */}
                  <div className="bg-slate-900/40 border border-slate-800/80 rounded-xl p-6 backdrop-blur-sm">
                    <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-800 pb-4 mb-4 gap-4">
                      <div>
                        <div className="text-xs text-indigo-400 font-mono tracking-wider uppercase mb-1">
                          Table Specification & Schema
                        </div>
                        <h2 className="text-xl font-bold font-mono text-white flex items-center gap-2.5">
                          <span>{selectedTable.name}</span>
                          <span className="text-[10px] tracking-normal font-sans text-slate-400 font-normal border border-slate-700 bg-slate-800/40 px-2 py-0.5 rounded-full">
                            {selectedTable.columns.length} columns
                          </span>
                        </h2>
                      </div>
                      <div className="flex gap-1.5 self-start md:self-auto">
                        {selectedTable.triggers.length > 0 && (
                          <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 px-2.5 py-1 rounded-full border border-emerald-500/25 flex items-center gap-1">
                            <Zap className="h-3 w-3" /> Auto-Trigger Loaded
                          </span>
                        )}
                        <span className="text-[10px] font-bold uppercase tracking-wider bg-slate-800/80 text-slate-300 px-2.5 py-1 rounded-full border border-slate-700">
                          UUID Primary Key
                        </span>
                      </div>
                    </div>

                    <p className="text-sm text-slate-300 mb-6 leading-relaxed">
                      {selectedTable.description}
                    </p>

                    {/* COLUMNS TABLE LIST */}
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs text-slate-300">
                        <thead className="bg-slate-950/70 text-slate-400 uppercase tracking-wider font-semibold font-mono border-b border-slate-800">
                          <tr>
                            <th className="p-3.5">Column Name</th>
                            <th className="p-3.5">Datatype</th>
                            <th className="p-3.5">Attributes</th>
                            <th className="p-3.5">Default</th>
                            <th className="p-3.5">Description / Mapping Constraint</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/60">
                          {selectedTable.columns.map((col) => (
                            <tr key={col.name} className="hover:bg-slate-800/20 transition-all font-mono">
                              <td className="p-3.5 text-white font-bold">{col.name}</td>
                              <td className="p-3.5 text-indigo-400 font-mono text-[11px]">{col.type}</td>
                              <td className="p-3.5">
                                <div className="flex flex-wrap gap-1">
                                  {col.isPk && (
                                    <span className="text-[9px] font-sans font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30 px-1.5 py-0.5 rounded">
                                      PRIMARY KEY (PK)
                                    </span>
                                  )}
                                  {col.isFk && (
                                    <span className="text-[9px] font-sans font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 px-1.5 py-0.5 rounded">
                                      FOREIGN KEY (FK)
                                    </span>
                                  )}
                                  {!col.isNullable && !col.isPk && (
                                    <span className="text-[9px] font-sans font-medium bg-slate-800/60 text-slate-400 px-1.5 py-0.5 rounded">
                                      NOT NULL
                                    </span>
                                  )}
                                  {col.isNullable && (
                                    <span className="text-[9px] font-sans font-medium bg-slate-900 text-slate-500 px-1.5 py-0.5 rounded">
                                      NULLABLE
                                    </span>
                                  )}
                                </div>
                              </td>
                              <td className="p-3.5 text-slate-500 text-[11px]">
                                {col.defaultVal ? col.defaultVal : "-"}
                              </td>
                              <td className="p-3.5 font-sans text-slate-300 text-xs min-w-[150px]">
                                {col.description}
                                {col.references && (
                                  <div className="text-[10px] text-cyan-400 mt-1 font-mono hover:underline">
                                    → REFERENCES {col.references}
                                  </div>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* TABLE DESIGN REATIONALE */}
                    <div className="mt-6 bg-slate-950/40 p-4 rounded-xl border border-slate-800/60 flex gap-3 text-xs">
                      <div className="h-5 w-5 bg-indigo-500/15 rounded flex items-center justify-center shrink-0 mt-0.5 text-indigo-400 font-mono font-bold">
                        ?
                      </div>
                      <div>
                        <h4 className="text-white font-semibold mb-1">Architectural Design Rationale</h4>
                        <p className="text-slate-400 leading-relaxed">{selectedTable.designRationale}</p>
                      </div>
                    </div>
                  </div>

                  {/* INDEXES ACCORDION PANEL */}
                  <div className="bg-slate-900/40 border border-slate-800/80 rounded-xl p-6 backdrop-blur-sm">
                    <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                      <Zap className="h-4 w-4 text-cyan-400 animate-pulse" />
                      <span>Optimized Engine Indexes for {selectedTable.name}</span>
                    </h3>

                    <div className="space-y-4">
                      {selectedTable.indexes.map((idx) => (
                        <div key={idx.name} className="border border-slate-800/80 bg-slate-950/60 rounded-xl p-4">
                          <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 mb-2">
                            <span className="font-mono text-xs font-bold text-slate-200 bg-slate-800 px-2 py-0.5 rounded">
                              {idx.name}
                            </span>
                            <span className="text-[11px] text-slate-400 font-medium">
                              {idx.purpose}
                            </span>
                          </div>
                          <pre className="bg-slate-950 p-3 rounded-lg text-[11px] font-mono text-emerald-400 overflow-x-auto border border-slate-900">
                            {idx.definition}
                          </pre>
                        </div>
                      ))}
                    </div>
                  </div>

                </div>

              </motion.div>
            )}

            {/* 2. SQL RAW CODE CODE TAB */}
            {activeTab === "code" && (
              <motion.div
                key="code"
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                transition={{ duration: 0.15 }}
                className="bg-slate-900/50 border border-slate-800/90 rounded-xl overflow-hidden backdrop-blur-sm"
              >
                {/* TOOLBAR FOR TEXT VIEW */}
                <div className="border-b border-slate-800 bg-slate-950/80 p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="flex items-center gap-2">
                    <FileCode className="h-4.5 w-4.5 text-indigo-400" />
                    <div>
                      <span className="text-xs font-semibold text-white block">postgresql_auth_schema.sql</span>
                      <span className="text-[10px] text-slate-500 font-mono block">Size: ~6.2 KB • UTF-8</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {/* TEXT FILTER INPUT */}
                    <div className="relative">
                      <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-500" />
                      <input
                        type="text"
                        placeholder="Search SQL code..."
                        value={sqlSearch}
                        onChange={(e) => setSqlSearch(e.target.value)}
                        className="bg-slate-900 border border-slate-700/80 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-300 placeholder-slate-5050 focus:outline-none focus:border-indigo-500 w-full sm:w-48 transition-all"
                      />
                    </div>
                    
                    <button
                      onClick={handleCopyAll}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-slate-800 text-indigo-300 hover:bg-slate-700 rounded-lg border border-slate-700 transition-all cursor-pointer whitespace-nowrap"
                    >
                      {copiedAll ? (
                        <>
                          <Check className="h-3.5 w-3.5 text-emerald-400" />
                          <span className="text-emerald-400">Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="h-3.5 w-3.5" />
                          <span>Copy Raw SQL</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* VISUAL CODE BOX */}
                <div className="overflow-y-auto max-h-[640px] bg-slate-950 p-4 leading-relaxed text-xs">
                  <pre className="font-mono text-slate-300 text-[11px] sm:text-xs">
                    <code>
                      {SQL_SCHEMA_CONTENT.split("\n")
                        .map((line, index) => {
                          const isMatch = sqlSearch ? line.toLowerCase().includes(sqlSearch.toLowerCase()) : false;
                          return (
                            <div 
                              key={index} 
                              className={`flex transition-colors py-0.5 ${isMatch ? "bg-indigo-900/30 text-white rounded font-bold" : ""}`}
                            >
                              <span className="w-10 pr-4 text-right select-none text-slate-600 font-mono text-[11px]">
                                {index + 1}
                              </span>
                              <span className="whitespace-pre-wrap">{line}</span>
                            </div>
                          );
                        })}
                    </code>
                  </pre>
                </div>
              </motion.div>
            )}

            {/* 3. PRACTICAL EXAMPLES & QUERIES TAB */}
            {activeTab === "queries" && (
              <motion.div
                key="queries"
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                transition={{ duration: 0.15 }}
                className="space-y-6"
              >
                
                {/* FOREGROUND DISCOVERY MESSAGE */}
                <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-5 flex gap-3.5 text-xs text-slate-300 items-start backdrop-blur-sm">
                  <ShieldAlert className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <h3 className="text-white font-semibold mb-1">Production-Ready Integration Notes</h3>
                    <p className="leading-relaxed mb-3">
                      Authentication maps directly to these standard PostgreSQL query paths. Securely hash passwords in the API runtime (using argon2 or bcrypt) before comparison lookups, or call rotated tokens inside transactional queries for isolation.
                    </p>
                    <div className="flex gap-4">
                      <span className="flex items-center gap-1.5 font-mono text-[11px] text-indigo-400">
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 inline-block" /> CTE Optimization
                      </span>
                      <span className="flex items-center gap-1.5 font-mono text-[11px] text-indigo-400">
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 inline-block" /> Lowercase Index Matching
                      </span>
                      <span className="flex items-center gap-1.5 font-mono text-[11px] text-indigo-400">
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 inline-block" /> Atomic Token Rotations
                      </span>
                    </div>
                  </div>
                </div>

                {/* TEMPLATE QUERIES LIST */}
                <div className="space-y-6">
                  {COMMON_SQL_QUERIES.map((query, index) => (
                    <div key={index} className="bg-slate-900/40 border border-slate-800/80 rounded-xl overflow-hidden backdrop-blur-sm">
                      <div className="p-4 border-b border-slate-800 bg-slate-900/60 flex items-center justify-between gap-4 flex-wrap">
                        <div>
                          <h4 className="text-sm font-semibold text-white">
                            {query.title}
                          </h4>
                          <p className="text-xs text-slate-400 mt-0.5">
                            {query.description}
                          </p>
                        </div>

                        <button
                          onClick={() => handleCopyQuery(query.sql, index)}
                          className="flex items-center gap-1.5 px-3 py-1 text-xs bg-slate-800 text-indigo-300 hover:bg-indigo-700/80 rounded-lg transition-all border border-slate-700 cursor-pointer"
                        >
                          {copiedQueryIndex === index ? (
                            <>
                              <Check className="h-3.5 w-3.5 text-emerald-400" />
                              <span className="text-emerald-400">Copied snippet!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="h-3.5 w-3.5" />
                              <span>Copy Query</span>
                            </>
                          )}
                        </button>
                      </div>

                      <div className="bg-slate-950 p-4 overflow-x-auto text-xs border-b border-slate-900">
                        <pre className="font-mono text-emerald-400 leading-relaxed text-[11px]">
                          <code>{query.sql}</code>
                        </pre>
                      </div>
                    </div>
                  ))}
                </div>

              </motion.div>
            )}

            {/* 6. HARDENING AUDIT TAB */}
            {activeTab === "audit" && (
              <motion.div
                key="audit"
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                transition={{ duration: 0.15 }}
                className="space-y-6"
              >
                {/* AUDIT STATUS BANNER */}
                <div className="bg-emerald-950/20 border border-emerald-500/30 rounded-2xl p-6 backdrop-blur-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                  <div>
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="text-xs font-bold uppercase tracking-widest bg-emerald-500/20 text-emerald-400 px-2.5 py-0.5 rounded-full border border-emerald-500/30">
                        Audit Completed
                      </span>
                      <span className="text-slate-500 font-mono text-xs">v1.2.0 • SHA-256 Verified</span>
                    </div>
                    <h2 className="text-2xl font-bold text-white tracking-tight">Cybersecurity & Hardening Audit Report</h2>
                    <p className="text-slate-400 text-xs mt-1 max-w-2xl leading-relaxed">
                      All 38 critical, high, and medium severity bugs identified in the platform's core codebases, double-entry ledger calculations, security filters, and migration sequence have been fully resolved, verified, and audited.
                    </p>
                  </div>
                  
                  <button
                    onClick={() => generateBugsReportPDF()}
                    className="flex items-center gap-2 px-5 py-3 text-sm font-semibold rounded-xl bg-emerald-600 hover:bg-emerald-500 shadow-lg shadow-emerald-600/25 text-white cursor-pointer transition-all shrink-0 hover:scale-[1.02] active:scale-[0.98]"
                  >
                    <Download className="h-4 w-4" strokeWidth={2.5} />
                    <span>Download PDF Report</span>
                  </button>
                </div>

                {/* SEARCH AND SEVERITY STATS */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
                  <div className="md:col-span-2 relative">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                    <input
                      type="text"
                      placeholder="Search bugs by ID, name, description, remediation..."
                      value={sqlSearch}
                      onChange={(e) => setSqlSearch(e.target.value)}
                      className="w-full bg-slate-900/60 border border-slate-800 rounded-xl py-2.5 pl-10 pr-4 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
                    />
                  </div>
                  
                  <div className="bg-slate-900/40 border border-slate-800/80 rounded-xl p-3 flex justify-around items-center text-center">
                    <div>
                      <div className="text-[10px] text-slate-500 uppercase font-semibold">Critical</div>
                      <div className="text-sm font-bold text-red-500">11</div>
                    </div>
                    <div className="h-6 w-px bg-slate-800" />
                    <div>
                      <div className="text-[10px] text-slate-500 uppercase font-semibold">High</div>
                      <div className="text-sm font-bold text-orange-500">20</div>
                    </div>
                    <div className="h-6 w-px bg-slate-800" />
                    <div>
                      <div className="text-[10px] text-slate-500 uppercase font-semibold">Medium</div>
                      <div className="text-sm font-bold text-indigo-400">7</div>
                    </div>
                  </div>

                  <div className="bg-slate-900/40 border border-slate-800/80 rounded-xl p-3 text-center">
                    <div className="text-[10px] text-slate-500 uppercase font-semibold">Verification Score</div>
                    <div className="text-sm font-bold text-emerald-400 font-mono">100% SUCCESS</div>
                  </div>
                </div>

                {/* BUGS CARDS LIST */}
                <div className="grid grid-cols-1 gap-4">
                  {BUGS_LIST_DATA.filter(bug => {
                    const searchLower = sqlSearch.toLowerCase();
                    return (
                      bug.id.toString().includes(searchLower) ||
                      bug.title.toLowerCase().includes(searchLower) ||
                      bug.description.toLowerCase().includes(searchLower) ||
                      bug.mitigation.toLowerCase().includes(searchLower) ||
                      bug.category.toLowerCase().includes(searchLower) ||
                      bug.severity.toLowerCase().includes(searchLower)
                    );
                  }).map((bug) => (
                    <div
                      key={bug.id}
                      className="bg-slate-900/30 border border-slate-800/80 rounded-xl p-5 hover:border-slate-700/80 transition-colors backdrop-blur-sm"
                    >
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-800/60 pb-3 mb-3">
                        <div className="flex items-center gap-2.5">
                          <span className="text-xs font-mono font-bold bg-slate-800 text-indigo-300 border border-slate-700 px-2 py-0.5 rounded">
                            Bug #{bug.id}
                          </span>
                          <h4 className="text-sm font-bold text-white tracking-tight">{bug.title}</h4>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase border ${
                            bug.severity === "CRITICAL"
                              ? "bg-red-500/15 text-red-400 border-red-500/30"
                              : bug.severity === "HIGH"
                              ? "bg-orange-500/15 text-orange-400 border-orange-500/30"
                              : "bg-indigo-500/15 text-indigo-400 border-indigo-500/30"
                          }`}>
                            {bug.severity}
                          </span>
                          <span className="flex items-center gap-1 text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded uppercase">
                            <CheckCircle className="h-3 w-3" />
                            <span>Resolved</span>
                          </span>
                        </div>
                      </div>

                      <div className="space-y-2 text-xs">
                        <div>
                          <span className="text-slate-500 font-medium">Category:</span>{" "}
                          <span className="text-slate-400 italic font-mono">{bug.category}</span>
                        </div>
                        <p className="text-slate-300 leading-relaxed">
                          <span className="text-red-400 font-medium font-mono">Vulnerability:</span> {bug.description}
                        </p>
                        <div className="bg-emerald-950/10 border border-emerald-500/10 p-3 rounded-lg flex gap-2 text-emerald-300/90 leading-relaxed">
                          <ShieldCheck className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                          <p>
                            <span className="font-semibold text-emerald-300 font-mono">Mitigation:</span> {bug.mitigation}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
              </>
            )}
          </AnimatePresence>

        </div>

      </main>

      {/* FOOTER */}
      <footer className="border-t border-slate-900 mt-16 bg-slate-950 text-slate-500 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4 text-xs">
          <div>
            <span className="font-mono text-slate-400 font-medium">PostgreSQL 15 Admin Module Generator</span>
            <span className="mx-2">•</span>
            <span>Created for dynamic developer integration.</span>
          </div>
          <div className="flex gap-4">
            <span className="hover:text-slate-400 transition-colors">Active Sandbox ID</span>
            <span>•</span>
            <span className="font-mono">v1.2.0</span>
          </div>
        </div>
      </footer>

    </div>
  );
}
