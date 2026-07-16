import React, { useState } from "react";
import { 
  FileSpreadsheet, 
  Coins, 
  ArrowRightLeft, 
  Activity, 
  FileCheck, 
  AlertCircle, 
  PlusCircle, 
  FileText,
  Search,
  CheckCircle,
  XCircle,
  TrendingUp,
  Download
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useFinanceDashboard } from "../../hooks/useDashboardQueries";

interface FinanceDashboardProps {
  simulationMode: "normal" | "loading" | "empty" | "error";
  themeMode: "light" | "dark";
  onTriggerAction: (actionName: string, payload?: any) => void;
}

export function FinanceDashboard({
  simulationMode,
  themeMode,
  onTriggerAction
}: FinanceDashboardProps) {
  const [reconSearch, setReconSearch] = useState("");
  const [floatPool, setFloatPool] = useState(124500000);
  const [disbursementQueue, setDisbursementQueue] = useState([
    { id: "TXN-901", vendor: "Hindalco Copper Corp", amount: 12400000, type: "Payout", bank: "HDFC Bank Ltd", status: "pending_checker" },
    { id: "TXN-902", vendor: "Mumbai Scrap Dealers", amount: 450000, type: "Refund", bank: "ICICI Bank Ltd", status: "pending_checker" },
    { id: "TXN-903", vendor: "Tata Steel Salvage", amount: 18500000, type: "Payout", bank: "State Bank of India", status: "pending_checker" }
  ]);

  const handleApproveTxn = (id: string, amount: number) => {
    setDisbursementQueue(prev => prev.filter(t => t.id !== id));
    setFloatPool(prev => prev - amount);
    onTriggerAction("approve-finance-payout", { id, amount });
  };

  const handleRejectTxn = (id: string) => {
    setDisbursementQueue(prev => prev.filter(t => t.id !== id));
    onTriggerAction("reject-finance-payout", { id });
  };

  if (simulationMode === "loading") {
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
      
      {/* 1. CORPORATE BALANCES */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        
        <div className={`p-4 rounded-xl border shadow-sm flex items-center justify-between gap-4 ${
          themeMode === "dark" ? "bg-slate-900/60 border-slate-800/80" : "bg-white border-slate-200/80"
        }`}>
          <div className="space-y-1">
            <span className="text-[10px] font-mono uppercase text-slate-500">Corporate Float Pool</span>
            <div className={`text-lg font-bold font-mono ${themeMode === "dark" ? "text-white" : "text-blue-950"}`}>
              ₹{(floatPool / 10000000).toFixed(2)} Cr
            </div>
            <span className="text-[8px] font-mono text-emerald-500 block">INR Reserve accounts stable</span>
          </div>
          <div className="p-3 bg-blue-500/10 text-blue-500 rounded-lg shrink-0">
            <Coins className="h-5 w-5" />
          </div>
        </div>

        <div className={`p-4 rounded-xl border shadow-sm flex items-center justify-between gap-4 ${
          themeMode === "dark" ? "bg-slate-900/60 border-slate-800/80" : "bg-white border-slate-200/80"
        }`}>
          <div className="space-y-1">
            <span className="text-[10px] font-mono uppercase text-slate-500">Escrow Security deposits</span>
            <div className={`text-lg font-bold font-mono ${themeMode === "dark" ? "text-white" : "text-blue-950"}`}>
              ₹3.20 Cr
            </div>
            <span className="text-[8px] font-mono text-slate-500 block">Locked B2B EMDs</span>
          </div>
          <div className="p-3 bg-amber-500/10 text-amber-500 rounded-lg shrink-0">
            <ArrowRightLeft className="h-5 w-5" />
          </div>
        </div>

        <div className={`p-4 rounded-xl border shadow-sm flex items-center justify-between gap-4 ${
          themeMode === "dark" ? "bg-slate-900/60 border-slate-800/80" : "bg-white border-slate-200/80"
        }`}>
          <div className="space-y-1">
            <span className="text-[10px] font-mono uppercase text-slate-500">Pending Checker approvals</span>
            <div className={`text-lg font-bold font-mono ${themeMode === "dark" ? "text-white" : "text-blue-950"}`}>
              {disbursementQueue.length} approvals
            </div>
            <span className="text-[8px] font-mono text-red-500 block">SLA Target: under 10m</span>
          </div>
          <div className="p-3 bg-red-500/10 text-red-500 rounded-lg shrink-0">
            <AlertCircle className="h-5 w-5" />
          </div>
        </div>

        <div className={`p-4 rounded-xl border shadow-sm flex items-center justify-between gap-4 ${
          themeMode === "dark" ? "bg-slate-900/60 border-slate-800/80" : "bg-white border-slate-200/80"
        }`}>
          <div className="space-y-1">
            <span className="text-[10px] font-mono uppercase text-slate-500">GST Levies collected</span>
            <div className={`text-lg font-bold font-mono ${themeMode === "dark" ? "text-white" : "text-blue-950"}`}>
              ₹1,87,500
            </div>
            <span className="text-[8px] font-mono text-emerald-500 block">18% CGST + SGST reconciled</span>
          </div>
          <div className="p-3 bg-emerald-500/10 text-emerald-500 rounded-lg shrink-0">
            <FileSpreadsheet className="h-5 w-5" />
          </div>
        </div>

      </div>

      {/* 2. MAKER-CHECKER DISBURSEMENT APPROVAL QUEUE */}
      <div className={`p-6 rounded-2xl border shadow-sm ${
        themeMode === "dark" ? "bg-slate-900/40 border-slate-800/80" : "bg-white border-slate-200/80"
      }`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4 mb-4">
          <div>
            <h3 className={`text-xs font-mono uppercase tracking-wider font-extrabold flex items-center gap-1.5 ${
              themeMode === "dark" ? "text-slate-400" : "text-slate-500"
            }`}>
              <FileCheck className="h-4.5 w-4.5 text-blue-500" />
              <span>Maker-Checker Disbursements queue (Checker Terminal)</span>
            </h3>
            <p className="text-[10px] text-slate-500 mt-1">Authorized corporate ledger payouts and security deposits releases</p>
          </div>

          <div className="relative w-full sm:w-60">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search payees..."
              value={reconSearch}
              onChange={e => setReconSearch(e.target.value)}
              className={`w-full bg-transparent border rounded-lg pl-8 pr-3 py-1.5 text-xs outline-none ${
                themeMode === "dark" ? "border-slate-800 focus:border-blue-500 text-white" : "border-slate-200 focus:border-blue-600 text-slate-900"
              }`}
            />
          </div>
        </div>

        {disbursementQueue.filter(t => t.vendor.toLowerCase().includes(reconSearch.toLowerCase())).length === 0 ? (
          <div className="py-12 text-center text-slate-500 flex flex-col items-center justify-center gap-2">
            <CheckCircle className="h-8 w-8 text-emerald-500 bg-emerald-500/10 p-1.5 rounded-full animate-bounce" />
            <span className="text-xs font-mono">Checker Disbursals Queue Empty (100% Authorized)</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className={`uppercase font-mono font-bold tracking-wider border-b ${
                themeMode === "dark" ? "text-slate-400 border-slate-800" : "text-slate-500 border-slate-200"
              }`}>
                <tr>
                  <th className="p-3">Reference ID</th>
                  <th className="p-3">Corporate Payee</th>
                  <th className="p-3">Disbursement type</th>
                  <th className="p-3">Payout Amount</th>
                  <th className="p-3">Destination Bank</th>
                  <th className="p-3">Dual Auth Status</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/20">
                {disbursementQueue
                  .filter(t => t.vendor.toLowerCase().includes(reconSearch.toLowerCase()))
                  .map(row => (
                    <tr key={row.id} className="hover:bg-slate-500/5 transition-all">
                      <td className="p-3 font-mono font-bold text-slate-400">{row.id}</td>
                      <td className={`p-3 font-semibold ${themeMode === "dark" ? "text-white" : "text-slate-800"}`}>
                        {row.vendor}
                      </td>
                      <td className="p-3">
                        <span className={`text-[9px] font-mono uppercase px-2 py-0.5 rounded ${
                          row.type === "Payout" ? "bg-blue-500/15 text-blue-400" : "bg-purple-500/15 text-purple-400"
                        }`}>
                          {row.type}
                        </span>
                      </td>
                      <td className="p-3 font-mono font-bold text-slate-200">
                        ₹{row.amount.toLocaleString()}
                      </td>
                      <td className="p-3 font-mono text-[11px] text-slate-500">{row.bank}</td>
                      <td className="p-3">
                        <span className="text-[9px] font-mono bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded-full font-bold">
                          Pending Checker Signature
                        </span>
                      </td>
                      <td className="p-3 text-right">
                        <div className="flex justify-end gap-1.5">
                          <button 
                            onClick={() => handleRejectTxn(row.id)}
                            className="p-1.5 bg-red-500/15 text-red-500 hover:bg-red-500 hover:text-white rounded-lg transition-all cursor-pointer"
                            title="Reject Transaction"
                          >
                            <XCircle className="h-4 w-4" />
                          </button>
                          <button 
                            onClick={() => handleApproveTxn(row.id, row.amount)}
                            className="p-1.5 bg-emerald-500/15 text-emerald-500 hover:bg-emerald-500 hover:text-white rounded-lg transition-all cursor-pointer"
                            title="Approve & Disburse Funds via NEFT"
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

      {/* 3. RECON QUICK UTILITY CARD */}
      <div className={`p-6 rounded-2xl border shadow-sm ${
        themeMode === "dark" ? "bg-slate-900/40 border-slate-800/80" : "bg-white border-slate-200/80"
      }`}>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="space-y-1.5 max-w-xl">
            <h4 className={`text-xs font-mono uppercase tracking-wider font-extrabold ${
              themeMode === "dark" ? "text-slate-400" : "text-slate-500"
            }`}>
              Post General Ledger adjustment
            </h4>
            <p className="text-slate-500 text-xs leading-relaxed">
              Post out-of-band banking general ledger adjustment entries directly. Ledger adjustments are double-entry vetted, audited for compliance, and instantly reported in tax ledger schedules.
            </p>
          </div>

          <button
            onClick={() => onTriggerAction("post-ledger-adjustment")}
            className="flex items-center gap-2 px-5 py-3 text-xs font-mono font-bold uppercase tracking-wider rounded-xl bg-blue-600 hover:bg-blue-500 text-white cursor-pointer shadow-lg shadow-blue-500/10 transition-all hover:scale-[1.01]"
          >
            <PlusCircle className="h-4.5 w-4.5" />
            <span>Ledger Adjustment Entries</span>
          </button>
        </div>
      </div>

    </div>
  );
}
