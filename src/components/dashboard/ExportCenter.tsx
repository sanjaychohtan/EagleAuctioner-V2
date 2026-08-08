import React, { useState } from "react";
import { 
  Download, 
  FileSpreadsheet, 
  Printer, 
  Clock, 
  Check, 
  Mail, 
  Calendar,
  Layers,
  Sparkles,
  Info
} from "lucide-react";
import { motion } from "motion/react";
import { useExportReportMutation, useScheduleReportMutation } from "../../hooks/useDashboardQueries";

interface ExportCenterProps {
  themeMode: "light" | "dark";
  showToast: (msg: string, type: "success" | "info" | "warning") => void;
}

export function ExportCenter({ themeMode, showToast }: ExportCenterProps) {
  const [format, setFormat] = useState<"PDF" | "CSV" | "EXCEL" | "PRINT">("EXCEL");
  const [scope, setScope] = useState<string>("REVENUE");
  
  // Column toggles
  const [columns, setColumns] = useState({
    lotId: true,
    bidPrice: true,
    bidderName: true,
    timestamp: true,
    escrowLocked: true,
    gstCharge: false,
    auditHash: false
  });

  // Scheduled Export states
  const [scheduleCron, setScheduleCron] = useState("0 0 * * *"); // daily midnight
  const [recipient, setRecipient] = useState("sanjay.chohtan@gmail.com");
  
  const exportMutation = useExportReportMutation();
  const scheduleMutation = useScheduleReportMutation();
  
  const isExporting = exportMutation.isPending;
  const isScheduling = scheduleMutation.isPending;

  const handleExportNow = () => {
    exportMutation.mutate({ format, scope, columns }, {
      onSuccess: () => {
        showToast(`Audit document ready for download: auctbiz_ledger_${scope.toLowerCase()}.${format.toLowerCase()}`, "success");
      },
      onError: () => {
        showToast("Failed to export report", "warning");
      }
    });
  };

  const handleScheduleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!recipient) {
      showToast("Recipient email is required for schedules", "warning");
      return;
    }
    
    showToast(`Registering cron schedule '${scheduleCron}' on Spring Scheduler cluster...`, "info");
    
    scheduleMutation.mutate({ scheduleCron, recipient, scope, format }, {
      onSuccess: () => {
        showToast(`Success! Out-of-band reports scheduled for dispatch to ${recipient}`, "success");
      },
      onError: () => {
        showToast("Failed to schedule report", "warning");
      }
    });
  };

  return (
    <div className={`p-6 rounded-2xl border flex flex-col justify-between ${
      themeMode === "dark" ? "bg-slate-900/40 border-slate-800/80" : "bg-white border-slate-200"
    }`}>
      {/* HEADER */}
      <div className="flex items-center justify-between border-b border-slate-150 dark:border-slate-800/85 pb-4 mb-4 gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-blue-600/10 text-blue-500">
            <Download className="h-5 w-5" />
          </div>
          <div>
            <h4 className="text-xs font-bold font-mono uppercase tracking-wider text-slate-400">Export Center</h4>
            <p className="text-[10px] text-slate-500 font-mono">Dual-Signed Commercial PDF/Excel reports</p>
          </div>
        </div>

        <span className="text-[9px] font-mono uppercase bg-blue-600/10 text-blue-500 border border-blue-500/10 px-2 py-0.5 rounded">
          SHA-256 Ledger Seals
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* MANUAL DIRECT EXPORT SECTION */}
        <div className="space-y-4">
          <h5 className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-extrabold">Instant Report Compile</h5>
          
          <div className="space-y-3.5">
            {/* Format Toggle Buttons */}
            <div className="space-y-1">
              <label className="text-[9px] font-mono font-bold uppercase text-slate-400">File Output Format</label>
              <div className="grid grid-cols-4 gap-1.5 font-mono text-[9px] font-bold">
                {["PDF", "CSV", "EXCEL", "PRINT"].map((f) => (
                  <button
                    key={f}
                    onClick={() => setFormat(f as any)}
                    className={`px-2 py-2 rounded-lg border text-center uppercase cursor-pointer transition-all ${
                      format === f
                        ? "bg-blue-600 border-blue-500 text-white"
                        : "bg-slate-950/20 border-slate-800 text-slate-400"
                    }`}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>

            {/* Scope selection */}
            <div className="space-y-1">
              <label className="text-[9px] font-mono font-bold uppercase text-slate-400">Report Scope</label>
              <select
                value={scope}
                onChange={e => setScope(e.target.value)}
                className={`w-full text-xs font-semibold px-3 py-2 rounded-xl border outline-none ${
                  themeMode === "dark" ? "bg-slate-950 border-slate-800" : "bg-slate-50 border-slate-200"
                }`}
              >
                <option value="REVENUE">Commission and Platform Fee Receipts</option>
                <option value="EMD">Earnest Money (EMD) Locked Ledgers</option>
                <option value="DISPUTES">L1/L2 Active Disputes History</option>
                <option value="AUDIT">SLA Readiness Audit Trails</option>
              </select>
            </div>

            {/* Column Selections */}
            <div className="space-y-1.5">
              <label className="text-[9px] font-mono font-bold uppercase text-slate-400">Included Columns</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 font-mono text-[9px]">
                {Object.entries(columns).map(([col, val]) => (
                  <button
                    key={col}
                    onClick={() => setColumns(prev => ({ ...prev, [col]: !prev[col as keyof typeof columns] }))}
                    className={`px-2 py-1.5 rounded-lg border text-left flex items-center justify-between cursor-pointer transition-all ${
                      val 
                        ? "bg-blue-600/10 border-blue-500/30 text-blue-400" 
                        : "bg-slate-950/10 border-slate-900 text-slate-500"
                    }`}
                  >
                    <span className="truncate">{col}</span>
                    {val && <Check className="h-3 w-3 shrink-0 ml-1" />}
                  </button>
                ))}
              </div>
            </div>

            {/* Export trigger */}
            <button
              onClick={handleExportNow}
              disabled={isExporting}
              className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-slate-850 text-white font-mono text-xs font-bold uppercase py-2.5 rounded-xl cursor-pointer shadow-lg shadow-blue-500/10"
            >
              {isExporting ? "Compiling Sheets..." : "Compile and Download Signed Document"}
            </button>
          </div>
        </div>

        {/* SCHEDULED EXPORT SECTION */}
        <div className="space-y-4">
          <h5 className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-extrabold">Out-of-band Schedules</h5>
          
          <form onSubmit={handleScheduleSubmit} className="space-y-4">
            <div className="space-y-1">
              <label className="text-[9px] font-mono font-bold uppercase text-slate-400">SRE Cron Frequency</label>
              <select
                value={scheduleCron}
                onChange={e => setScheduleCron(e.target.value)}
                className={`w-full text-xs font-semibold px-3 py-2 rounded-xl border outline-none ${
                  themeMode === "dark" ? "bg-slate-950 border-slate-800" : "bg-slate-50 border-slate-200"
                }`}
              >
                <option value="0 0 * * *">Daily Midnight (0 0 * * *)</option>
                <option value="0 0 * * 0">Weekly Sunday (0 0 * * 0)</option>
                <option value="0 0 1 * *">Monthly 1st (0 0 1 * *)</option>
                <option value="*/15 * * * *">Simulate: Every 15 minutes (*/15 * * * *)</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[9px] font-mono font-bold uppercase text-slate-400">Recipient Corporate Email</label>
              <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border ${
                themeMode === "dark" ? "bg-slate-950 border-slate-800" : "bg-slate-50 border-slate-200"
              }`}>
                <Mail className="h-4 w-4 text-blue-500 shrink-0" />
                <input
                  type="email"
                  required
                  placeholder="sanjay.chohtan@gmail.com"
                  value={recipient}
                  onChange={e => setRecipient(e.target.value)}
                  className="w-full text-xs bg-transparent border-none outline-none text-slate-300"
                />
              </div>
            </div>

            <div className="p-3 bg-blue-500/5 border border-blue-500/15 rounded-xl text-[9px] font-mono text-slate-400 flex gap-2">
              <Clock className="h-4 w-4 text-blue-500 shrink-0 mt-0.5" />
              <span>Schedules rely on the Spring Boot @Scheduled cron pools and require active, valid SMTP keys in settings.</span>
            </div>

            <button
              type="submit"
              disabled={isScheduling}
              className="w-full bg-slate-950 border border-slate-800 hover:border-slate-700 text-slate-300 font-mono text-xs font-bold uppercase py-2.5 rounded-xl cursor-pointer"
            >
              {isScheduling ? "Registering Job..." : "Deploy Scheduled Job"}
            </button>
          </form>
        </div>

      </div>
    </div>
  );
}
