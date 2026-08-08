import React, { memo } from "react";
import { 
  Sparkles, 
  Sliders, 
  Search, 
  Bell, 
  X, 
  RotateCw, 
  ChevronRight, 
  Database,
  TrendingUp,
  ShieldAlert,
  KeyRound,
  Tag,
  Coins,
  Gavel
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import type { DashboardRole } from "../DashboardTypes";
import { useAuthStore } from "../../../store/useAuthStore";

interface HeaderToolbarProps {
  themeMode: "light" | "dark";
  perspective: "business" | "developer";
  setPerspective: (p: "business" | "developer") => void;
  activeRole: DashboardRole;
  setActiveRole: (role: DashboardRole) => void;
  simulationMode: "normal" | "loading" | "empty" | "error";
  setSimulationMode: (mode: "normal" | "loading" | "empty" | "error") => void;
  isAutoRefreshing: boolean;
  setIsAutoRefreshing: (val: boolean) => void;
  refreshCountdown: number;
  isCommandPaletteOpen: boolean;
  setIsCommandPaletteOpen: (val: boolean) => void;
  showNotifications: boolean;
  setShowNotifications: (val: boolean) => void;
  onTriggerRefresh: () => void;
  showToast: (message: string, type?: "success" | "info" | "warning") => void;
}

export const EnterpriseHeaderToolbar: React.FC<HeaderToolbarProps> = memo(({
  themeMode,
  perspective,
  setPerspective,
  activeRole,
  setActiveRole,
  simulationMode,
  setSimulationMode,
  isAutoRefreshing,
  setIsAutoRefreshing,
  refreshCountdown,
  setIsCommandPaletteOpen,
  showNotifications,
  setShowNotifications,
  onTriggerRefresh,
  showToast
}) => {
  return (
    <>
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
                <span>AUCTBIZ</span>
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

      {/* VIEW PERSPECTIVE CONTROLS BAR */}
      {perspective === "business" && (
        <div className="space-y-6 mb-6 mt-6">
          <div className={`p-4 rounded-2xl border flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all ${
            themeMode === "dark" ? "bg-slate-900/40 border-slate-800/80" : "bg-white border-slate-200"
          }`}>
            
            {/* ROLES SELECTION BADGES */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 scrollbar-none">
              {(() => {
                const user = useAuthStore.getState().user;
                const userRoles = new Set((user?.roles || []).map((r) => r.toUpperCase()));
                const isSuperAdminOrAdmin =
                  userRoles.has("ROLE_SUPER_ADMIN") ||
                  userRoles.has("SUPER_ADMIN") ||
                  userRoles.has("ROLE_ADMIN") ||
                  userRoles.has("ADMIN");

                const allItems = [
                  { id: "personalized", name: "Personalized Cockpit", icon: Sparkles },
                  { id: "executive", name: "Executive Desk", icon: TrendingUp, roles: ["ROLE_SUPER_ADMIN", "SUPER_ADMIN", "ROLE_ADMIN", "ADMIN", "ROLE_EXECUTIVE", "EXECUTIVE"] },
                  { id: "admin", name: "Admin Control", icon: ShieldAlert, roles: ["ROLE_SUPER_ADMIN", "SUPER_ADMIN", "ROLE_ADMIN", "ADMIN"] },
                  { id: "buyer", name: "Buyer Desk", icon: KeyRound, roles: ["ROLE_SUPER_ADMIN", "SUPER_ADMIN", "ROLE_ADMIN", "ADMIN", "ROLE_BUYER", "BUYER", "ROLE_BIDDER", "BIDDER"] },
                  { id: "seller", name: "Seller Desk", icon: Tag, roles: ["ROLE_SUPER_ADMIN", "SUPER_ADMIN", "ROLE_ADMIN", "ADMIN", "ROLE_SELLER", "SELLER"] },
                  { id: "finance", name: "Finance Desk", icon: Coins, roles: ["ROLE_SUPER_ADMIN", "SUPER_ADMIN", "ROLE_ADMIN", "ADMIN", "ROLE_FINANCE", "FINANCE", "ROLE_ACCOUNTANT", "ACCOUNTANT"] },
                  { id: "operations", name: "Operations Desk", icon: Gavel, roles: ["ROLE_SUPER_ADMIN", "SUPER_ADMIN", "ROLE_ADMIN", "ADMIN", "ROLE_OPERATIONS", "OPERATIONS", "ROLE_OPS_HEAD", "OPS_HEAD"] }
                ];

                const visibleItems = allItems.filter(item => {
                  if (isSuperAdminOrAdmin || item.id === "personalized") return true;
                  return item.roles?.some(r => userRoles.has(r));
                });

                return visibleItems.map((item) => {
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
                });
              })()}
            </div>

            {/* SIMULATION TUNER */}
            <div className="flex items-center gap-4 shrink-0 font-mono text-[11px] self-end md:self-auto">
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
                  onClick={onTriggerRefresh}
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
      )}
    </>
  );
});

EnterpriseHeaderToolbar.displayName = "EnterpriseHeaderToolbar";
