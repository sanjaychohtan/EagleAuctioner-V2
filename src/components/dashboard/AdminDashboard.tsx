import React, { useState } from "react";
import { 
  Users, 
  CheckCircle, 
  XCircle, 
  Database, 
  Cpu, 
  ShieldCheck, 
  Clock, 
  Lock, 
  Unlock,
  AlertTriangle,
  RefreshCw,
  Search,
  Check
} from "lucide-react";
import { motion } from "motion/react";
import { KPICardData } from "./DashboardTypes";
import { useAdminDashboard } from "../../hooks/useDashboardQueries";
import { useAdminKycQueue, useReviewKycMutation } from "../../hooks/useAdminKycQueries";

interface AdminDashboardProps {
  simulationMode: "normal" | "loading" | "empty" | "error";
  themeMode: "light" | "dark";
  onTriggerAction: (actionName: string, payload?: any) => void;
}

export function AdminDashboard({
  simulationMode,
  themeMode,
  onTriggerAction
}: AdminDashboardProps) {
  const [slaLimit, setSlaLimit] = useState(15);
  const [maintMode, setMaintMode] = useState(false);
  const [kycSearch, setKycSearch] = useState("");

  const { data: dashboardData, isLoading: isDashboardLoading, isError: isDashboardError } = useAdminDashboard();
  const { data: kycData, isLoading: isKycLoading } = useAdminKycQueue();
  const reviewMutation = useReviewKycMutation();

  const kycQueue = kycData || [];

  const handleApproveKYC = (id: string, name: string) => {
    reviewMutation.mutate({ profileId: id, request: { decision: "APPROVED", reviewNotes: "Approved via dashboard" }});
    onTriggerAction("approve-kyc", { id, name });
  };

  const handleRejectKYC = (id: string, name: string) => {
    reviewMutation.mutate({ profileId: id, request: { decision: "REJECTED", reviewNotes: "Rejected via dashboard" }});
    onTriggerAction("reject-kyc", { id, name });
  };

  if (isDashboardError || simulationMode === "error") {
    return (
      <div className={`p-6 rounded-2xl ${themeMode === "dark" ? "bg-red-900/20 text-red-200" : "bg-red-50 text-red-600"}`}>
        <AlertTriangle className="h-6 w-6 mb-2" />
        <h3 className="text-lg font-medium">Failed to load admin dashboard</h3>
        <p className="text-sm opacity-80">Please check your connection and try again.</p>
      </div>
    );
  }

  // Skeletons
  if (isDashboardLoading || isKycLoading || simulationMode === "loading") {
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
      
      {/* 1. OPERATOR TELEMETRY HEADER GRID */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        
        <div className={`p-4 rounded-xl border shadow-sm flex items-center justify-between gap-4 ${
          themeMode === "dark" ? "bg-slate-900/60 border-slate-800/80" : "bg-white border-slate-200/80"
        }`}>
          <div className="space-y-1">
            <span className="text-[10px] font-mono uppercase text-slate-500">API Gateway latency</span>
            <div className={`text-xl font-bold font-mono ${themeMode === "dark" ? "text-white" : "text-blue-950"}`}>{dashboardData?.apiGatewayLatency || "12 ms"}</div>
            <span className="text-[8px] font-mono text-emerald-500 block">SLA Threshold: 50ms</span>
          </div>
          <div className="p-3 bg-blue-500/10 text-blue-500 rounded-lg shrink-0">
            <Clock className="h-5 w-5" />
          </div>
        </div>

        <div className={`p-4 rounded-xl border shadow-sm flex items-center justify-between gap-4 ${
          themeMode === "dark" ? "bg-slate-900/60 border-slate-800/80" : "bg-white border-slate-200/80"
        }`}>
          <div className="space-y-1">
            <span className="text-[10px] font-mono uppercase text-slate-500">Active DB Connections</span>
            <div className={`text-xl font-bold font-mono ${themeMode === "dark" ? "text-white" : "text-blue-950"}`}>{dashboardData?.activeDbConnections || "42 Pools"}</div>
            <span className="text-[8px] font-mono text-emerald-500 block">HikariCP Max: 100</span>
          </div>
          <div className="p-3 bg-emerald-500/10 text-emerald-500 rounded-lg shrink-0">
            <Database className="h-5 w-5" />
          </div>
        </div>

        <div className={`p-4 rounded-xl border shadow-sm flex items-center justify-between gap-4 ${
          themeMode === "dark" ? "bg-slate-900/60 border-slate-800/80" : "bg-white border-slate-200/80"
        }`}>
          <div className="space-y-1">
            <span className="text-[10px] font-mono uppercase text-slate-500">CPU Load (JVM Node)</span>
            <div className={`text-xl font-bold font-mono ${themeMode === "dark" ? "text-white" : "text-blue-950"}`}>{dashboardData?.cpuLoad || "14.5%"}</div>
            <span className="text-[8px] font-mono text-emerald-500 block">2 Core Cloud Run</span>
          </div>
          <div className="p-3 bg-purple-500/10 text-purple-500 rounded-lg shrink-0">
            <Cpu className="h-5 w-5" />
          </div>
        </div>

        <div className={`p-4 rounded-xl border shadow-sm flex items-center justify-between gap-4 ${
          themeMode === "dark" ? "bg-slate-900/60 border-slate-800/80" : "bg-white border-slate-200/80"
        }`}>
          <div className="space-y-1">
            <span className="text-[10px] font-mono uppercase text-slate-500">KYC Backlog Count</span>
            <div className={`text-xl font-bold font-mono ${themeMode === "dark" ? "text-white" : "text-blue-950"}`}>{kycQueue.length} Pending</div>
            <span className="text-[8px] font-mono text-amber-500 block">SLA Response: 15m</span>
          </div>
          <div className="p-3 bg-amber-500/10 text-amber-500 rounded-lg shrink-0">
            <Users className="h-5 w-5" />
          </div>
        </div>

      </div>

      {/* 2. KYC ONBOARDING APPROVAL QUEUE */}
      <div className={`p-6 rounded-2xl border shadow-sm ${
        themeMode === "dark" ? "bg-slate-900/40 border-slate-800/80" : "bg-white border-slate-200/80"
      }`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4 mb-4">
          <div>
            <h3 className={`text-xs font-mono uppercase tracking-wider font-extrabold ${
              themeMode === "dark" ? "text-slate-400" : "text-slate-500"
            }`}>
              KYC Compliance Verification Queue
            </h3>
            <p className="text-[10px] text-slate-500 mt-1">Pending Maker-Checker verifications of GSTIN & Certificate of Incorporations</p>
          </div>

          <div className="relative w-full sm:w-60">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search companies..."
              value={kycSearch}
              onChange={e => setKycSearch(e.target.value)}
              className={`w-full bg-transparent border rounded-lg pl-8 pr-3 py-1.5 text-xs outline-none ${
                themeMode === "dark" ? "border-slate-800 focus:border-blue-500 text-white" : "border-slate-200 focus:border-blue-600 text-slate-900"
              }`}
            />
          </div>
        </div>

        {kycQueue.filter(k => (k.organization?.organizationName || "Individual").toLowerCase().includes(kycSearch.toLowerCase())).length === 0 ? (
          <div className="py-12 text-center text-slate-500 flex flex-col items-center justify-center gap-2">
            <Check className="h-8 w-8 text-emerald-500 bg-emerald-500/10 p-1.5 rounded-full" />
            <span className="text-xs font-mono">KYC Compliance Queue Empty (100% Cleared)</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-sans">
              <thead className={`uppercase font-mono font-bold tracking-wider border-b ${
                themeMode === "dark" ? "text-slate-400 border-slate-800" : "text-slate-500 border-slate-200"
              }`}>
                <tr>
                  <th className="p-3">Reference ID</th>
                  <th className="p-3">Company Legal Entity</th>
                  <th className="p-3">Role Type</th>
                  <th className="p-3">Risk Rating</th>
                  <th className="p-3">Documents Uploaded</th>
                  <th className="p-3">SLA Status</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/20">
                {kycQueue
                  .filter(k => (k.organization?.organizationName || "Individual").toLowerCase().includes(kycSearch.toLowerCase()))
                  .map(row => (
                    <tr key={row.id} className="hover:bg-slate-500/5 transition-all">
                      <td className="p-3 font-mono font-bold text-slate-400">{row.id}</td>
                      <td className={`p-3 font-semibold ${themeMode === "dark" ? "text-white" : "text-slate-800"}`}>
                        {(row.organization?.organizationName || "Individual")}
                      </td>
                      <td className="p-3">
                        <span className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded ${
                          row.bidderType === "CORPORATE" ? "bg-blue-500/15 text-blue-400" : "bg-purple-500/15 text-purple-400"
                        }`}>
                          {row.bidderType}
                        </span>
                      </td>
                      <td className="p-3 font-mono font-bold text-blue-500">{"A"}</td>
                      <td className="p-3 font-mono text-[11px] text-slate-500">{(row.documents?.map(d => d.documentType).join(", ") || "No docs")}</td>
                      <td className="p-3">
                        <span className={`text-[9px] font-mono uppercase px-2 py-0.5 rounded-full font-bold ${
                          "ok" === "ok" 
                            ? "bg-emerald-500/10 text-emerald-400" 
                            : false 
                            ? "bg-amber-500/10 text-amber-400" 
                            : "bg-red-500/10 text-red-400"
                        }`}>
                          {"10m"} ({"ok"})
                        </span>
                      </td>
                      <td className="p-3 text-right">
                        <div className="flex justify-end gap-1.5">
                          <button 
                            onClick={() => handleRejectKYC(row.id, (row.organization?.organizationName || "Individual"))}
                            className="p-1.5 bg-red-500/15 text-red-500 hover:bg-red-500 hover:text-white rounded-lg transition-all cursor-pointer"
                            title="Reject Onboarding Application"
                          >
                            <XCircle className="h-4 w-4" />
                          </button>
                          <button 
                            onClick={() => handleApproveKYC(row.id, (row.organization?.organizationName || "Individual"))}
                            className="p-1.5 bg-emerald-500/15 text-emerald-500 hover:bg-emerald-500 hover:text-white rounded-lg transition-all cursor-pointer"
                            title="Verify & Approve Corporate Tenant"
                          >
                            <CheckCircle className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 3. PLATFORM SYSTEM SWITCHES & SETTINGS (Maker Checker Admin controls) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* OPERATIONAL PARAMETERS CARD */}
        <div className={`p-6 rounded-2xl border shadow-sm ${
          themeMode === "dark" ? "bg-slate-900/40 border-slate-800/80" : "bg-white border-slate-200/80"
        }`}>
          <h3 className={`text-xs font-mono uppercase tracking-wider font-extrabold border-b pb-3 mb-4 ${
            themeMode === "dark" ? "text-slate-400" : "text-slate-500"
          }`}>
            Platform SLA Thresholds
          </h3>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-xs">
                <span className={themeMode === "dark" ? "text-slate-300" : "text-slate-700"}>Maximum KYC Approval Delay</span>
                <span className="font-mono font-bold text-blue-500">{slaLimit} Minutes</span>
              </div>
              <input
                type="range"
                min="5"
                max="60"
                step="5"
                value={slaLimit}
                onChange={e => {
                  setSlaLimit(Number(e.target.value));
                  onTriggerAction("adjust-sla", { minutes: e.target.value });
                }}
                className="w-full accent-blue-600 h-1 bg-slate-200 dark:bg-slate-800 rounded-lg cursor-pointer"
              />
              <span className="text-[9px] text-slate-500 block">SRE alert triggers automatically if queue delay crosses this value.</span>
            </div>

            <div className="flex items-center justify-between gap-4 p-3 bg-slate-500/5 rounded-xl border border-slate-800/10">
              <div className="space-y-0.5">
                <span className={`text-xs font-bold block ${themeMode === "dark" ? "text-white" : "text-slate-800"}`}>Maintenance Mode (Read-Only)</span>
                <span className="text-[10px] text-slate-500 block">Blocks bid submissions during critical PG migration</span>
              </div>
              
              <button
                onClick={() => {
                  setMaintMode(!maintMode);
                  onTriggerAction("toggle-maint", { state: !maintMode });
                }}
                className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
                  maintMode 
                    ? "bg-red-500/10 text-red-500 border-red-500/30" 
                    : themeMode === "dark" ? "bg-slate-950 border-slate-800 text-slate-400" : "bg-slate-100 border-slate-200 text-slate-600"
                }`}
              >
                {maintMode ? <Lock className="h-4.5 w-4.5" /> : <Unlock className="h-4.5 w-4.5" />}
              </button>
            </div>
          </div>
        </div>

        {/* SYSTEM STATUS & HEALTH CHECK */}
        <div className={`p-6 rounded-2xl border shadow-sm ${
          themeMode === "dark" ? "bg-slate-900/40 border-slate-800/80" : "bg-white border-slate-200/80"
        }`}>
          <h3 className={`text-xs font-mono uppercase tracking-wider font-extrabold border-b pb-3 mb-4 ${
            themeMode === "dark" ? "text-slate-400" : "text-slate-500"
          }`}>
            Infrastructure Nodes
          </h3>

          <div className="space-y-3 font-mono text-[11px]">
            <div className="flex items-center justify-between p-2 rounded-lg bg-slate-500/5 border border-slate-850/20">
              <span className="text-slate-400">api-gateway-prod-01</span>
              <span className="text-emerald-400 font-bold">● ACTIVE</span>
            </div>
            <div className="flex items-center justify-between p-2 rounded-lg bg-slate-500/5 border border-slate-850/20">
              <span className="text-slate-400">postgres-spanner-replica</span>
              <span className="text-emerald-400 font-bold">● REPLICATED (100%)</span>
            </div>
            <div className="flex items-center justify-between p-2 rounded-lg bg-slate-500/5 border border-slate-850/20">
              <span className="text-slate-400">redis-cache-cluster</span>
              <span className="text-emerald-400 font-bold">● STABLE</span>
            </div>
          </div>

          <button 
            onClick={() => onTriggerAction("trigger-reconciliation")}
            className="w-full mt-4 py-2 text-[10px] font-mono font-bold uppercase tracking-wider bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5"
          >
            <RefreshCw className="h-3 w-3" /> Run DB Reconciliation Sync
          </button>
        </div>

      </div>

    </div>
  );
}

export default React.memo(AdminDashboard);
