import React, { useState, useEffect, lazy, Suspense, useCallback } from "react";
import { 
  Layers, 
  Zap, 
  CalendarDays, 
  KeyRound, 
  Activity
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useAppStore } from "../store/useAppStore";
import { useAuthStore } from "../store/useAuthStore";
import { DashboardRole } from "../components/dashboard/DashboardTypes";

const getRoleFromUser = (roles?: string[]): DashboardRole => {
  if (!roles || roles.length === 0) return "seller";
  const rSet = new Set(roles.map((r) => r.toUpperCase()));
  if (
    rSet.has("ROLE_SUPER_ADMIN") ||
    rSet.has("SUPER_ADMIN") ||
    rSet.has("ROLE_ADMIN") ||
    rSet.has("ADMIN") ||
    rSet.has("ROLE_EXECUTIVE") ||
    rSet.has("EXECUTIVE")
  ) {
    return "executive";
  }
  if (rSet.has("ROLE_SELLER") || rSet.has("SELLER")) {
    return "seller";
  }
  if (
    rSet.has("ROLE_BUYER") ||
    rSet.has("BUYER") ||
    rSet.has("ROLE_BIDDER") ||
    rSet.has("BIDDER")
  ) {
    return "buyer";
  }
  if (
    rSet.has("ROLE_FINANCE") ||
    rSet.has("FINANCE") ||
    rSet.has("ROLE_ACCOUNTANT") ||
    rSet.has("ACCOUNTANT")
  ) {
    return "finance";
  }
  if (
    rSet.has("ROLE_OPERATIONS") ||
    rSet.has("OPERATIONS") ||
    rSet.has("ROLE_OPS_HEAD") ||
    rSet.has("OPS_HEAD")
  ) {
    return "operations";
  }
  return "seller";
};

import { EnterpriseHeaderToolbar } from "../components/dashboard/enterprise/EnterpriseHeaderToolbar";
import { SchemaViewerTab } from "../components/dashboard/enterprise/SchemaViewerTab";
import { MonitoringBugsTab } from "../components/dashboard/enterprise/MonitoringBugsTab";

// LAZY LOADED ROLE DASHBOARDS
const GlobalCommandPalette = lazy(() => import("../components/dashboard/GlobalCommandPalette"));
const ExecutiveDashboard = lazy(() => import("../components/dashboard/ExecutiveDashboard"));
const AdminDashboard = lazy(() => import("../components/dashboard/AdminDashboard"));
const BuyerDashboard = lazy(() => import("../components/dashboard/BuyerDashboard"));
const SellerDashboard = lazy(() => import("../components/dashboard/SellerDashboard"));
const FinanceDashboard = lazy(() => import("../components/dashboard/FinanceDashboard"));
const OperationsDashboard = lazy(() => import("../components/dashboard/OperationsDashboard"));
const PersonalizedDashboard = lazy(() => import("../components/dashboard/PersonalizedDashboard"));

const DashboardFallback: React.FC = () => (
  <div className="flex items-center justify-center p-12 font-mono text-xs text-slate-500 uppercase tracking-wider animate-pulse">
    Loading workspace telemetry...
  </div>
);

export function EnterpriseDashboard({ initialTab = "monitoring" }: { initialTab?: "visual" | "code" | "queries" | "java" | "monitoring" | "audit" }) {
  const [activeTab, setActiveTab] = useState<"visual" | "code" | "queries" | "java" | "monitoring" | "audit">(initialTab);
  const [selectedTableName, setSelectedTableName] = useState<string>("users");
  const [sqlSearch, setSqlSearch] = useState<string>("");
  const [copiedAll, setCopiedAll] = useState<boolean>(false);
  const [copiedQueryIndex, setCopiedQueryIndex] = useState<number | null>(null);

  const { themeMode } = useAppStore();
  const user = useAuthStore((state) => state.user);

  const [perspective, setPerspective] = useState<"business" | "developer">("business");
  const [activeRole, setActiveRole] = useState<DashboardRole>(() => getRoleFromUser(user?.roles));

  useEffect(() => {
    if (user?.roles) {
      setActiveRole(getRoleFromUser(user.roles));
    }
  }, [user]);
  const [simulationMode, setSimulationMode] = useState<"normal" | "loading" | "empty" | "error">("normal");
  const [isAutoRefreshing, setIsAutoRefreshing] = useState<boolean>(true);
  const [refreshCountdown, setRefreshCountdown] = useState<number>(15);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState<boolean>(false);
  const [showNotifications, setShowNotifications] = useState<boolean>(false);
  const [toastNotice, setToastNotice] = useState<{ id: string; message: string; type: "success" | "info" | "warning" } | null>(null);

  const showToast = useCallback((message: string, type: "success" | "info" | "warning" = "success") => {
    setToastNotice({ id: Math.random().toString(), message, type });
  }, []);

  useEffect(() => {
    if (toastNotice) {
      const timer = setTimeout(() => setToastNotice(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toastNotice]);

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
  }, [isAutoRefreshing, showToast]);

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

  const handleTriggerAction = useCallback((actionName: string, payload?: any) => {
    if (actionName === "refresh") {
      setRefreshCountdown(15);
      showToast("Triggered out-of-band databases synchronization.", "success");
    } else {
      showToast(`Triggered action: ${actionName}`, "info");
    }
  }, [showToast]);

  const handleCopyAll = useCallback(() => {
    setCopiedAll(true);
    setTimeout(() => setCopiedAll(false), 2000);
  }, []);

  const handleCopyQuery = useCallback((sql: string, index: number) => {
    navigator.clipboard.writeText(sql);
    setCopiedQueryIndex(index);
    setTimeout(() => setCopiedQueryIndex(null), 2000);
  }, []);

  const handleDownloadFile = useCallback(() => {
    showToast("Downloaded SQL schema file", "success");
  }, [showToast]);

  return (
    <div className={`min-h-screen font-sans selection:bg-blue-500/30 transition-all duration-300 ${
      themeMode === "dark" ? "bg-slate-950 text-slate-100" : "bg-slate-50 text-slate-900"
    }`}>
      
      {/* GLOBAL TOAST */}
      <AnimatePresence>
        {toastNotice && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            className={`fixed top-20 right-4 z-50 flex items-center gap-3 px-4 py-3 rounded-xl border shadow-xl max-w-sm font-mono text-xs font-semibold ${
              themeMode === "dark" ? "bg-slate-900 border-slate-800 text-slate-100" : "bg-white border-slate-200 text-slate-900"
            }`}
          >
            {toastNotice.message}
          </motion.div>
        )}
      </AnimatePresence>

      {/* COMMAND PALETTE */}
      <Suspense fallback={null}>
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
      </Suspense>

      {/* HEADER CONTROLS */}
      <EnterpriseHeaderToolbar
        themeMode={themeMode}
        perspective={perspective}
        setPerspective={setPerspective}
        activeRole={activeRole}
        setActiveRole={setActiveRole}
        simulationMode={simulationMode}
        setSimulationMode={setSimulationMode}
        isAutoRefreshing={isAutoRefreshing}
        setIsAutoRefreshing={setIsAutoRefreshing}
        refreshCountdown={refreshCountdown}
        isCommandPaletteOpen={isCommandPaletteOpen}
        setIsCommandPaletteOpen={setIsCommandPaletteOpen}
        showNotifications={showNotifications}
        setShowNotifications={setShowNotifications}
        onTriggerRefresh={() => handleTriggerAction("refresh")}
        showToast={showToast}
      />

      {/* MAIN CONTAINER */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {perspective === "business" ? (
          <Suspense fallback={<DashboardFallback />}>
            {activeRole === "personalized" && <PersonalizedDashboard simulationMode={simulationMode} themeMode={themeMode} showToast={showToast} onTriggerAction={handleTriggerAction} />}
            {activeRole === "executive" && <ExecutiveDashboard simulationMode={simulationMode} themeMode={themeMode} onTriggerAction={handleTriggerAction} />}
            {activeRole === "admin" && <AdminDashboard simulationMode={simulationMode} themeMode={themeMode} onTriggerAction={handleTriggerAction} />}
            {activeRole === "buyer" && <BuyerDashboard simulationMode={simulationMode} themeMode={themeMode} onTriggerAction={handleTriggerAction} />}
            {activeRole === "seller" && <SellerDashboard simulationMode={simulationMode} themeMode={themeMode} onTriggerAction={handleTriggerAction} />}
            {activeRole === "finance" && <FinanceDashboard simulationMode={simulationMode} themeMode={themeMode} onTriggerAction={handleTriggerAction} />}
            {activeRole === "operations" && <OperationsDashboard simulationMode={simulationMode} themeMode={themeMode} onTriggerAction={handleTriggerAction} />}
          </Suspense>
        ) : (
          <div className="space-y-6">
            {/* STATS TILES */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className={`p-4 rounded-xl border ${themeMode === "dark" ? "bg-slate-900/60 border-slate-800" : "bg-white border-slate-200"}`}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-slate-400 font-mono">Core Tables</span>
                  <Layers className="h-4 w-4 text-indigo-400" />
                </div>
                <div className="text-2xl font-bold font-mono">6</div>
              </div>
              <div className={`p-4 rounded-xl border ${themeMode === "dark" ? "bg-slate-900/60 border-slate-800" : "bg-white border-slate-200"}`}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-slate-400 font-mono">Indexes</span>
                  <Zap className="h-4 w-4 text-cyan-400" />
                </div>
                <div className="text-2xl font-bold font-mono">10</div>
              </div>
              <div className={`p-4 rounded-xl border ${themeMode === "dark" ? "bg-slate-900/60 border-slate-800" : "bg-white border-slate-200"}`}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-slate-400 font-mono">Triggers</span>
                  <CalendarDays className="h-4 w-4 text-emerald-400" />
                </div>
                <div className="text-2xl font-bold font-mono">6</div>
              </div>
              <div className={`p-4 rounded-xl border ${themeMode === "dark" ? "bg-slate-900/60 border-slate-800" : "bg-white border-slate-200"}`}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-slate-400 font-mono">Auth Tokens</span>
                  <KeyRound className="h-4 w-4 text-amber-400" />
                </div>
                <div className="text-2xl font-bold font-mono">Rotation</div>
              </div>
            </div>

            {/* TAB SELECTOR */}
            <div className="flex border-b border-slate-800 mb-6 gap-2 overflow-x-auto font-mono text-xs">
              <button
                onClick={() => setActiveTab("monitoring")}
                className={`px-4 py-3 font-semibold transition-all border-b-2 cursor-pointer flex items-center gap-2 ${
                  activeTab === "monitoring" ? "border-indigo-500 text-white" : "border-transparent text-slate-400"
                }`}
              >
                <Activity className="h-4 w-4 text-emerald-400" />
                <span>Security Audit & Diagnostics</span>
              </button>
              <button
                onClick={() => setActiveTab("visual")}
                className={`px-4 py-3 font-semibold transition-all border-b-2 cursor-pointer flex items-center gap-2 ${
                  activeTab === "visual" ? "border-indigo-500 text-white" : "border-transparent text-slate-400"
                }`}
              >
                <Layers className="h-4 w-4 text-indigo-400" />
                <span>Interactive ER Visualizer</span>
              </button>
              <button
                onClick={() => setActiveTab("code")}
                className={`px-4 py-3 font-semibold transition-all border-b-2 cursor-pointer ${
                  activeTab === "code" ? "border-indigo-500 text-white" : "border-transparent text-slate-400"
                }`}
              >
                <span>PostgreSQL DDL</span>
              </button>
              <button
                onClick={() => setActiveTab("queries")}
                className={`px-4 py-3 font-semibold transition-all border-b-2 cursor-pointer ${
                  activeTab === "queries" ? "border-indigo-500 text-white" : "border-transparent text-slate-400"
                }`}
              >
                <span>Common Queries</span>
              </button>
              <button
                onClick={() => setActiveTab("java")}
                className={`px-4 py-3 font-semibold transition-all border-b-2 cursor-pointer ${
                  activeTab === "java" ? "border-indigo-500 text-white" : "border-transparent text-slate-400"
                }`}
              >
                <span>Java JPA Entities</span>
              </button>
            </div>

            {/* TAB CONTENT */}
            {activeTab === "monitoring" ? (
              <MonitoringBugsTab themeMode={themeMode} showToast={showToast} />
            ) : (
              <SchemaViewerTab
                themeMode={themeMode}
                activeTab={activeTab as "visual" | "code" | "queries" | "java"}
                selectedTableName={selectedTableName}
                setSelectedTableName={setSelectedTableName}
                sqlSearch={sqlSearch}
                setSqlSearch={setSqlSearch}
                copiedAll={copiedAll}
                copiedQueryIndex={copiedQueryIndex}
                handleCopyAll={handleCopyAll}
                handleCopyQuery={handleCopyQuery}
                handleDownloadFile={handleDownloadFile}
              />
            )}
          </div>
        )}
      </main>
    </div>
  );
}

export default EnterpriseDashboard;
