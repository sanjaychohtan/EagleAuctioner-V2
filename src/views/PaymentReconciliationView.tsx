import React, { useState } from "react";
import { useNotification } from "../providers/NotificationProvider";
import { 
  ArrowRightLeft, 
  Upload, 
  RefreshCw, 
  CheckCircle, 
  AlertTriangle, 
  FileCheck2, 
  Activity, 
  Download,
  Terminal,
  HelpCircle
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

const DEMO_MISMATCH_LOGS = [
  { logId: "MIS-901", utr: "UTIBN261899121", expectedAmount: 280000, actualAmount: 279500, status: "DISCREPANCY", type: "BANK_CHARGE_UNDERPOST", description: "Payment slip has INR 500 bank charge discrepancy from wire slip value.", date: "2026-06-30T04:15:00Z" },
  { logId: "MIS-902", utr: "SBI210928112", expectedAmount: 150000, actualAmount: 150000, status: "RECONCILED", type: "EXACT_MATCH", description: "UTR matched transaction sheet perfectly.", date: "2026-06-30T05:20:00Z" }
];

export const PaymentReconciliationView: React.FC = () => {
  const { showNotification } = useNotification();
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [reconciling, setReconciling] = useState(false);
  const [reconciliationLogs, setReconciliationLogs] = useState(DEMO_MISMATCH_LOGS);
  const [filter, setFilter] = useState("ALL");

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setSelectedFile(e.dataTransfer.files[0]);
      showNotification(`Statement file [${e.dataTransfer.files[0].name}] received.`, "success");
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
      showNotification(`Statement file [${e.target.files[0].name}] parsed successfully.`, "success");
    }
  };

  const executeReconciliation = () => {
    if (!selectedFile) {
      showNotification("Please upload or drop a bank statement file (.csv, .xlsx, .txt) first.", "error");
      return;
    }
    setReconciling(true);
    showNotification("Executing advanced transaction matching engine...", "info");
    
    setTimeout(() => {
      setReconciling(false);
      showNotification("Bank statement parsed. 1 new discrepancy reported.", "warning");
      // Add a simulated mismatch
      setReconciliationLogs(prev => [
        {
          logId: `MIS-${Date.now().toString().slice(-3)}`,
          utr: "BARC91028112",
          expectedAmount: 640000,
          actualAmount: 635000,
          status: "DISCREPANCY",
          type: "FEE_DEDUCTION_MISMATCH",
          description: "Bank intermediary deducted service charges without reporting.",
          date: new Date().toISOString()
        },
        ...prev
      ]);
    }, 2000);
  };

  const resolveDiscrepancy = (logId: string) => {
    showNotification(`Posting resolving credit offsets to align Ledger balance for log [${logId}].`, "success");
    setReconciliationLogs(prev => prev.map(log => log.logId === logId ? { ...log, status: "RECONCILED" } : log));
  };

  const filteredLogs = reconciliationLogs.filter(log => filter === "ALL" || log.status === filter);

  return (
    <div className="space-y-6 font-mono text-xs text-slate-300" id="payment-reconciliation-view">
      {/* HEADER BAR */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-800/60 pb-5">
        <div>
          <h2 className="text-xl font-bold tracking-wider text-white">BANK STATEMENT RECONCILIATION</h2>
          <p className="text-[10px] text-slate-500 uppercase mt-1">
            Automated discrepancy auditing matching gateway deposits, NEFT entries, and local system ledger journals
          </p>
        </div>
      </div>

      {/* CORE TWO-COLUMN WORKSPACE */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* LEFT COLUMN: STATEMENT UPLOAD BOX */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-slate-900/60 border border-slate-800 p-5 rounded-xl space-y-4">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-850 pb-2">
              <Upload className="h-4.5 w-4.5 text-indigo-400" /> Upload Bank Statement
            </h3>
            
            {/* Drag and Drop Zone */}
            <div 
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-xl p-6 text-center transition-all flex flex-col items-center justify-center gap-3 min-h-[180px] relative ${
                dragActive ? "border-indigo-500 bg-indigo-500/10 scale-98" : "border-slate-800 bg-slate-950/60"
              }`}
            >
              <Upload className={`h-8 w-8 ${selectedFile ? "text-emerald-400" : "text-slate-500"}`} />
              <div className="space-y-1">
                <p className="font-bold text-slate-200">
                  {selectedFile ? selectedFile.name : "Drag & Drop bank file"}
                </p>
                <p className="text-[9px] text-slate-500 uppercase">Supports CSV, XLSX, TXT feeds</p>
              </div>
              <label className="px-3 py-1.5 bg-slate-900 hover:bg-slate-850 border border-slate-800 rounded font-bold text-[10px] uppercase cursor-pointer text-slate-300 hover:text-white transition-all">
                Select File
                <input 
                  type="file" 
                  className="hidden" 
                  accept=".csv,.xlsx,.txt"
                  onChange={handleFileChange}
                />
              </label>
            </div>

            {selectedFile && (
              <div className="space-y-3 bg-slate-950 p-3 rounded-lg border border-slate-850">
                <div className="flex justify-between items-center text-[10px]">
                  <span className="text-slate-500 uppercase">Parsed File Size:</span>
                  <span className="font-bold text-slate-300 font-mono">{(selectedFile.size / 1024).toFixed(1)} KB</span>
                </div>
                <div className="flex justify-between items-center text-[10px]">
                  <span className="text-slate-500 uppercase">Parser Status:</span>
                  <span className="font-bold text-emerald-400 uppercase">Ready</span>
                </div>
              </div>
            )}

            <button 
              onClick={executeReconciliation}
              disabled={reconciling || !selectedFile}
              className={`w-full py-2.5 rounded font-bold text-[10px] uppercase transition-all flex items-center justify-center gap-2 ${
                reconciling 
                  ? "bg-slate-800 text-slate-500" 
                  : selectedFile 
                  ? "bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg cursor-pointer" 
                  : "bg-slate-800 text-slate-500 cursor-not-allowed"
              }`}
            >
              <RefreshCw className={`h-4 w-4 ${reconciling ? "animate-spin" : ""}`} />
              {reconciling ? "Checking logs..." : "Trigger Reconcile"}
            </button>
          </div>

          {/* ENGINE TERMINAL OUTPUT */}
          <div className="bg-slate-950 border border-slate-900 rounded-xl p-4 space-y-2">
            <span className="text-[9px] font-bold text-indigo-400 uppercase tracking-widest flex items-center gap-1">
              <Terminal className="h-3.5 w-3.5" /> RECONCILE ENGINE TERMINAL
            </span>
            <div className="bg-black/80 rounded border border-slate-900 p-2 font-mono text-[9px] text-slate-500 leading-relaxed min-h-[90px] overflow-y-auto">
              <div>[SYSTEM INT] Bank statements parser compiled successfully.</div>
              {reconciling && <div className="text-indigo-400">[PARSING] Reading columns, matching UTR registers...</div>}
              {selectedFile && <div className="text-emerald-400">[FILE] Bank Statement: {selectedFile.name} accepted.</div>}
              <div>[STANDBY] Awaiting statement file stream.</div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: RECONCILIATION SUMMARY & LOGS */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-slate-900/60 border border-slate-800 p-5 rounded-xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 border-b border-slate-850 pb-3">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                <Activity className="h-4.5 w-4.5 text-emerald-400" /> Reconciliation Audit Trail
              </h3>
              
              <div className="flex items-center gap-2">
                <label className="text-[9px] font-bold text-slate-500 uppercase whitespace-nowrap">Filter Logs</label>
                <select 
                  value={filter}
                  onChange={e => setFilter(e.target.value)}
                  className="bg-slate-950 border border-slate-850 rounded px-2 py-1 text-slate-300 focus:outline-none"
                >
                  <option value="ALL">ALL LOGS</option>
                  <option value="DISCREPANCY">DISCREPANCIES</option>
                  <option value="RECONCILED">RECONCILED</option>
                </select>
              </div>
            </div>

            {/* Logs List */}
            <div className="space-y-3">
              {filteredLogs.map(log => (
                <div key={log.logId} className="bg-slate-950 p-4 border border-slate-900 rounded-lg space-y-3">
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2">
                    <div className="space-y-1">
                      <div className="flex items-center flex-wrap gap-2">
                        <span className="font-bold text-slate-200">{log.logId}</span>
                        <span className="text-[10px] text-slate-500 font-mono">UTR Link: <span className="text-slate-300 font-bold">{log.utr}</span></span>
                        <span className={`text-[8px] font-bold px-1.5 py-0.2 rounded border uppercase ${
                          log.status === "RECONCILED" 
                            ? "bg-emerald-950 text-emerald-400 border-emerald-900/50" 
                            : "bg-red-950 text-red-400 border-red-900/50 animate-pulse"
                        }`}>
                          {log.status}
                        </span>
                      </div>
                      <p className="text-slate-400 font-mono">{log.description}</p>
                    </div>

                    <div className="text-left sm:text-right font-mono text-[10px]">
                      <div className="text-slate-500 uppercase">Discrepancy value:</div>
                      <div className="font-bold text-red-400">
                        {log.expectedAmount !== log.actualAmount 
                          ? `-${(log.expectedAmount - log.actualAmount).toLocaleString()} INR` 
                          : "0 INR"
                        }
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-between items-center pt-2.5 border-t border-slate-900/60 text-[10px]">
                    <span className="text-slate-600 font-mono">{new Date(log.date).toLocaleString()}</span>
                    
                    {log.status === "DISCREPANCY" && (
                      <button 
                        onClick={() => resolveDiscrepancy(log.logId)}
                        className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[9px] uppercase rounded cursor-pointer transition-all flex items-center gap-1"
                      >
                        <FileCheck2 className="h-3 w-3" /> Resolve Mismatch
                      </button>
                    )}
                  </div>
                </div>
              ))}

              {filteredLogs.length === 0 && (
                <div className="text-center py-8 text-slate-500">
                  No discrepancy or reconciled logs match selected criteria.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentReconciliationView;
