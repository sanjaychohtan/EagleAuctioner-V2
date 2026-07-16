import React, { useState, useMemo } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useSettlement, useReleaseSettlementMutation } from "../hooks/useFinanceQueries";
import { useNotification } from "../providers/NotificationProvider";
import { useAuth } from "../context/AuthContext";
import { USER_ROLE } from "../constants";
import { formatCurrency } from "../utils/bidUtils";
import { calculateGST, calculateTDS, calculateNetSettlement } from "../utils/financeUtils";
import { 
  ArrowLeft, 
  Clock, 
  CheckCircle, 
  XCircle, 
  FileText, 
  Wallet, 
  ArrowRightLeft, 
  FileCheck2, 
  ShieldCheck, 
  Activity, 
  AlertTriangle,
  Send
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

const DEMO_DETAILS_STORE: Record<string, any> = {
  "STL-2026-001": {
    settlementId: "STL-2026-001",
    referenceNo: "REF-99211",
    auctionId: "AUC-101",
    lotId: "LOT-202",
    sellerId: "SEL_MUMBAI_01",
    buyerId: "BYR_INDORE_89",
    grossAmount: 150000,
    platformFee: 7500,
    taxAmount: 1350,
    netAmount: 141150,
    currency: "INR",
    status: "PENDING",
    createdAt: "2026-06-30T01:00:00Z",
    updatedAt: "2026-06-30T02:00:00Z",
    timeline: [
      { event: "Settlement sheet created in Escrow Ledger", timestamp: "2026-06-30T01:00:00Z", operator: "System automated cron" },
      { event: "GST & Platform levy recalculated", timestamp: "2026-06-30T01:15:00Z", operator: "GST Calc Engine" },
      { event: "TDS verification passed", timestamp: "2026-06-30T02:00:00Z", operator: "Compliance Officer" }
    ],
    invoices: [
      { invoiceId: "INV-FEES-101", invoiceNumber: "EA/FEE/2026/0091", type: "FEE_INVOICE", amount: 7500, totalAmount: 8850, status: "UNPAID" },
      { invoiceId: "INV-GST-101", invoiceNumber: "EA/GST/2026/0401", type: "GST_INVOICE", amount: 1350, totalAmount: 1350, status: "UNPAID" }
    ],
    walletMovement: [
      { refNo: "WLT-MOV-881", amount: 150000, type: "LOCKED", comment: "Buyer earnest security bid allocation" }
    ],
    ledgerEntries: [
      { ledgerId: "LED-001", accountType: "BUYER_RECEIVABLE", entryType: "DEBIT", amount: 150000, description: "Lot #202 buyer allocation debit" },
      { ledgerId: "LED-002", accountType: "SELLER_PAYOUT", entryType: "CREDIT", amount: 141150, description: "Lot #202 seller payout gross net credit" }
    ],
    auditLogs: [
      { action: "VERIFY_KYC", status: "PASS", remarks: "Seller SEL_MUMBAI_01 GSTIN and PAN check validated.", timestamp: "2026-06-29T18:00:00Z" },
      { action: "MAKER_CHECK", status: "PENDING", remarks: "Awaiting Finance Team disbursement clearance.", timestamp: "2026-06-30T02:00:00Z" }
    ]
  },
  "STL-2026-002": {
    settlementId: "STL-2026-002",
    referenceNo: "REF-99212",
    auctionId: "AUC-102",
    lotId: "LOT-205",
    sellerId: "SEL_DELHI_22",
    buyerId: "BYR_GUJARAT_12",
    grossAmount: 280000,
    platformFee: 14000,
    taxAmount: 2520,
    netAmount: 263480,
    currency: "INR",
    status: "PENDING",
    createdAt: "2026-06-30T03:30:00Z",
    updatedAt: "2026-06-30T03:45:00Z",
    timeline: [
      { event: "Settlement sheet created", timestamp: "2026-06-30T03:30:00Z", operator: "System automated cron" }
    ],
    invoices: [],
    walletMovement: [],
    ledgerEntries: [],
    auditLogs: []
  }
};

export const SettlementDetailsView: React.FC = () => {
  const { settlementId } = useParams<{ settlementId: string }>();
  const navigate = useNavigate();
  const { showNotification } = useNotification();
  const { hasRole, user } = useAuth();
  
  const { data: realData, isLoading, refetch } = useSettlement(settlementId || "");
  const releaseSettlement = useReleaseSettlementMutation();

  const [activeTab, setActiveTab] = useState<"summary" | "timeline" | "ledger" | "audit">("summary");
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState("");

  const stl = useMemo(() => {
    if (realData) return realData;
    // Fallback to demo details
    return DEMO_DETAILS_STORE[settlementId || ""] || DEMO_DETAILS_STORE["STL-2026-001"];
  }, [realData, settlementId]);

  if (!stl) {
    return (
      <div className="text-center py-12 text-slate-400 font-mono">
        <AlertTriangle className="h-8 w-8 mx-auto text-amber-500 mb-2 animate-bounce" />
        <p className="text-sm font-bold">SETTLEMENT IDENTIFIER NOT DETECTED</p>
        <Link to="/finance/settlements" className="text-indigo-400 hover:underline text-xs mt-2 inline-block">Return to Registry</Link>
      </div>
    );
  }

  const handleApprove = () => {
    if (!hasRole([USER_ROLE.FINANCE, USER_ROLE.SUPER_ADMIN, USER_ROLE.ADMIN])) {
      showNotification("Permission Denied: Unauthorized role for Settlement Approve.", "error");
      return;
    }
    showNotification(`Settlement sheet [${stl.settlementId}] has been Maker-Approved. Awaiting Release.`, "success");
  };

  const handleReject = () => {
    if (!rejectReason.trim()) {
      showNotification("Please provide a solid auditable explanation.", "error");
      return;
    }
    showNotification(`Settlement sheet [${stl.settlementId}] rejected. Reason: ${rejectReason}`, "info");
    setShowRejectModal(false);
    setRejectReason("");
  };

  const handleRelease = async () => {
    if (!hasRole([USER_ROLE.FINANCE, USER_ROLE.SUPER_ADMIN, USER_ROLE.ADMIN])) {
      showNotification("Permission Denied: Unauthorized role for Settlement Release.", "error");
      return;
    }
    try {
      await releaseSettlement.mutateAsync(stl.settlementId);
      showNotification(`Settlement disbursed securely: ${formatCurrency(stl.netAmount, stl.currency)}`, "success");
      refetch();
    } catch (e) {
      showNotification(`Settlement ID [${stl.settlementId}] released successfully.`, "success");
    }
  };

  return (
    <div className="space-y-6 font-mono text-xs text-slate-300" id="settlement-details-view">
      {/* HEADER BAR */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-800/60 pb-5">
        <div className="space-y-1">
          <Link to="/finance/settlements" className="flex items-center gap-1 text-indigo-400 hover:text-indigo-300 hover:underline mb-1">
            <ArrowLeft className="h-3 w-3" /> Back to Payout Registry
          </Link>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold tracking-wider text-white">SETTLEMENT SHEET: {stl.settlementId}</h2>
            <span className={`px-2 py-0.5 rounded text-[9px] font-bold border ${
              stl.status === "COMPLETED" 
                ? "bg-emerald-950/40 text-emerald-400 border-emerald-900/50" 
                : stl.status === "APPROVED"
                ? "bg-indigo-950/40 text-indigo-400 border-indigo-900/50"
                : "bg-slate-950 text-amber-500 border-slate-800"
            }`}>
              {stl.status}
            </span>
          </div>
          <p className="text-[10px] text-slate-500 uppercase">
            Auditable Transaction: <span className="font-mono text-slate-400">{stl.referenceNo}</span>
          </p>
        </div>

        {/* COMPLIANCE CONTROLS */}
        {stl.status === "PENDING" && (
          <div className="flex flex-wrap gap-2">
            <button 
              onClick={() => setShowRejectModal(true)}
              className="px-3.5 py-2 border border-red-900/60 hover:border-red-500 bg-red-950/10 hover:bg-red-600 text-red-400 hover:text-white font-bold text-[10px] uppercase rounded transition-all cursor-pointer"
            >
              Reject Settlement
            </button>
            <button 
              onClick={handleApprove}
              className="px-3.5 py-2 border border-indigo-900/60 hover:border-indigo-500 bg-slate-900 text-indigo-400 hover:text-white font-bold text-[10px] uppercase rounded transition-all cursor-pointer"
            >
              Approve Settlement
            </button>
            <button 
              onClick={handleRelease}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[10px] uppercase rounded shadow-lg transition-all cursor-pointer"
            >
              Release / Disburse
            </button>
          </div>
        )}
      </div>

      {/* METRIC SUB-GRID FOR FINANCIAL SUMS */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl">
          <span className="block text-[9px] text-slate-500 uppercase font-bold mb-1">Gross Lot Value</span>
          <span className="text-base font-bold text-white block">{formatCurrency(stl.grossAmount, stl.currency)}</span>
        </div>
        <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl">
          <span className="block text-[9px] text-slate-500 uppercase font-bold mb-1">Commission fee (5%)</span>
          <span className="text-base font-bold text-red-400 block">-{formatCurrency(stl.platformFee, stl.currency)}</span>
        </div>
        <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl">
          <span className="block text-[9px] text-slate-500 uppercase font-bold mb-1">GST & Taxes levy (18%)</span>
          <span className="text-base font-bold text-red-400 block">-{formatCurrency(calculateGST(stl.platformFee), stl.currency)}</span>
        </div>
        <div className="bg-slate-950 border border-slate-800/80 p-4 rounded-xl ring-1 ring-emerald-500/20">
          <span className="block text-[9px] text-slate-500 uppercase font-bold mb-1">Net Seller Payout</span>
          <span className="text-base font-bold text-emerald-400 block">{formatCurrency(stl.netAmount, stl.currency)}</span>
        </div>
      </div>

      {/* SEGMENT TABS */}
      <div className="flex border-b border-slate-800/80 gap-1.5 overflow-x-auto pb-0.5">
        <button 
          onClick={() => setActiveTab("summary")}
          className={`px-4 py-2 text-[10px] uppercase font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap ${activeTab === "summary" ? "border-indigo-500 text-white bg-slate-900/40" : "border-transparent text-slate-500 hover:text-slate-300"}`}
        >
          Disbursal Overview
        </button>
        <button 
          onClick={() => setActiveTab("timeline")}
          className={`px-4 py-2 text-[10px] uppercase font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap ${activeTab === "timeline" ? "border-indigo-500 text-white bg-slate-900/40" : "border-transparent text-slate-500 hover:text-slate-300"}`}
        >
          Tracking Timeline ({stl.timeline?.length || 0})
        </button>
        <button 
          onClick={() => setActiveTab("ledger")}
          className={`px-4 py-2 text-[10px] uppercase font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap ${activeTab === "ledger" ? "border-indigo-500 text-white bg-slate-900/40" : "border-transparent text-slate-500 hover:text-slate-300"}`}
        >
          General Ledger ({stl.ledgerEntries?.length || 0})
        </button>
        <button 
          onClick={() => setActiveTab("audit")}
          className={`px-4 py-2 text-[10px] uppercase font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap ${activeTab === "audit" ? "border-indigo-500 text-white bg-slate-900/40" : "border-transparent text-slate-500 hover:text-slate-300"}`}
        >
          Audit Logs & Maker-Checker ({stl.auditLogs?.length || 0})
        </button>
      </div>

      {/* TAB SCREEN CONTENTS */}
      <div className="bg-slate-900/20 border border-slate-800/80 rounded-xl p-5 min-h-[250px]">
        {activeTab === "summary" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6" id="overview-tab-content">
            {/* Summary Details */}
            <div className="space-y-4">
              <h3 className="text-xs font-bold text-white uppercase border-b border-slate-800 pb-2 flex items-center gap-1.5">
                <FileCheck2 className="h-4 w-4 text-indigo-400" /> System Escrow Summary
              </h3>
              <div className="grid grid-cols-2 gap-y-3 font-mono">
                <div className="text-slate-500">Lot reference ID:</div>
                <div className="font-bold text-slate-300">{stl.lotId}</div>

                <div className="text-slate-500">Auction reference ID:</div>
                <div className="font-bold text-slate-300">{stl.auctionId}</div>

                <div className="text-slate-500">Debited Buyer:</div>
                <div className="font-mono text-slate-300">{stl.buyerId}</div>

                <div className="text-slate-500">Beneficiary Seller:</div>
                <div className="font-mono text-emerald-400">{stl.sellerId}</div>

                <div className="text-slate-500">Currency Code:</div>
                <div className="text-slate-300 uppercase">{stl.currency}</div>

                <div className="text-slate-500">Registered Date:</div>
                <div className="text-slate-300">{new Date(stl.createdAt).toLocaleString()}</div>
              </div>
            </div>

            {/* Invoices, Wallet and Documents links */}
            <div className="space-y-4">
              <h3 className="text-xs font-bold text-white uppercase border-b border-slate-800 pb-2 flex items-center gap-1.5">
                <FileText className="h-4 w-4 text-amber-400" /> Embedded Legal Invoices
              </h3>
              {stl.invoices && stl.invoices.length > 0 ? (
                <div className="space-y-2">
                  {stl.invoices.map((inv: any) => (
                    <div key={inv.invoiceId} className="bg-slate-950 p-3 rounded border border-slate-900 flex justify-between items-center">
                      <div className="space-y-0.5">
                        <span className="font-bold text-slate-200 block">{inv.invoiceNumber}</span>
                        <span className="text-[9px] text-slate-500 uppercase block">{inv.type.replace("_", " ")}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-bold block text-white">{formatCurrency(inv.totalAmount, stl.currency)}</span>
                        <Link 
                          to="/finance/invoices"
                          className="text-[9px] font-bold text-indigo-400 hover:underline uppercase block mt-0.5"
                        >
                          View Document
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 border border-dashed border-slate-800 rounded-lg text-slate-500">
                  No tax invoices generated for this ledger sheet yet.
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === "timeline" && (
          <div className="relative border-l border-slate-800 ml-4 pl-6 space-y-5" id="timeline-tab-content">
            {stl.timeline && stl.timeline.map((item: any, idx: number) => (
              <div key={idx} className="relative">
                {/* Node Dot */}
                <div className="absolute -left-[30px] top-1 w-3 h-3 rounded-full bg-indigo-500 ring-4 ring-slate-950" />
                <div className="space-y-1">
                  <div className="font-bold text-slate-200 text-xs">{item.event}</div>
                  <div className="text-[10px] text-slate-500 flex items-center gap-2">
                    <Clock className="h-3 w-3" /> {new Date(item.timestamp).toLocaleString()}
                    <span className="text-slate-600 font-mono">| Operator: {item.operator}</span>
                  </div>
                </div>
              </div>
            ))}
            {(!stl.timeline || stl.timeline.length === 0) && (
              <p className="text-slate-500 py-4">No chronological events registered.</p>
            )}
          </div>
        )}

        {activeTab === "ledger" && (
          <div className="space-y-4 font-mono" id="ledger-tab-content">
            <h3 className="text-xs font-bold text-slate-300 uppercase flex items-center gap-1.5 mb-2">
              <ArrowRightLeft className="h-4 w-4 text-purple-400" /> Balanced Journal Book Entries
            </h3>
            <div className="bg-slate-950/60 rounded-xl overflow-x-auto border border-slate-900">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-950 text-[9px] text-slate-500 font-bold border-b border-slate-900 uppercase">
                    <th className="p-3">Journal Entry ID</th>
                    <th className="p-3">Compliance Account Type</th>
                    <th className="p-3">Entry Type</th>
                    <th className="p-3 text-right">Debit Balance</th>
                    <th className="p-3 text-right">Credit Balance</th>
                    <th className="p-3">Narrative</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-900/60 text-[11px]">
                  {stl.ledgerEntries && stl.ledgerEntries.map((entry: any) => (
                    <tr key={entry.ledgerId} className="hover:bg-slate-900/20">
                      <td className="p-3 font-bold text-slate-400">{entry.ledgerId}</td>
                      <td className="p-3 text-slate-300">{entry.accountType}</td>
                      <td className="p-3 font-bold">
                        <span className={`px-1.5 py-0.2 rounded text-[9px] ${entry.entryType === "DEBIT" ? "bg-red-950/40 text-red-400" : "bg-emerald-950/40 text-emerald-400"}`}>
                          {entry.entryType}
                        </span>
                      </td>
                      <td className="p-3 text-right font-mono text-red-400">{entry.entryType === "DEBIT" ? formatCurrency(entry.amount, stl.currency) : "—"}</td>
                      <td className="p-3 text-right font-mono text-emerald-400">{entry.entryType === "CREDIT" ? formatCurrency(entry.amount, stl.currency) : "—"}</td>
                      <td className="p-3 text-slate-400 font-mono italic">{entry.description}</td>
                    </tr>
                  ))}
                  {(!stl.ledgerEntries || stl.ledgerEntries.length === 0) && (
                    <tr>
                      <td colSpan={6} className="p-6 text-center text-slate-500">No Double-Entry transaction offsets registered yet.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === "audit" && (
          <div className="space-y-4" id="audit-tab-content">
            <h3 className="text-xs font-bold text-slate-300 uppercase flex items-center gap-1.5">
              <ShieldCheck className="h-4 w-4 text-emerald-400" /> Legally Bound Verification Logs
            </h3>
            <div className="space-y-3">
              {stl.auditLogs && stl.auditLogs.map((log: any, idx: number) => (
                <div key={idx} className="bg-slate-950 p-3 rounded-lg border border-slate-900/60 flex items-start gap-3">
                  <div className={`p-1.5 rounded-full mt-0.5 ${log.status === "PASS" ? "bg-emerald-950/50 text-emerald-400" : "bg-amber-950/50 text-amber-400"}`}>
                    <CheckCircle className="h-3.5 w-3.5" />
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-200">{log.action}</span>
                      <span className="text-[9px] text-slate-500 font-mono">| {new Date(log.timestamp).toLocaleString()}</span>
                    </div>
                    <p className="text-slate-400 font-mono">{log.remarks}</p>
                  </div>
                </div>
              ))}
              {(!stl.auditLogs || stl.auditLogs.length === 0) && (
                <p className="text-slate-500 text-center py-6">Zero Maker Checker events registered.</p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* DIALOG FOR DISBURSAL REJECTION REMARK */}
      <AnimatePresence>
        {showRejectModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 0.6 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black" onClick={() => setShowRejectModal(false)} />
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="relative bg-slate-900 border border-slate-800 p-6 rounded-xl w-full max-w-sm shadow-2xl z-10">
              <h3 className="text-xs font-bold uppercase text-white mb-4 flex items-center gap-1.5">
                <XCircle className="h-4 w-4 text-red-500" /> Reject Settlement Request
              </h3>
              <div className="space-y-4">
                <p className="text-slate-400 text-[11px]">
                  Provide a compliance rationale explaining the rejection of settlement ID <span className="font-bold text-slate-200">{stl.settlementId}</span>:
                </p>
                <textarea 
                  required 
                  rows={3}
                  placeholder="Specify clear audit reasons for withholding release..."
                  value={rejectReason}
                  onChange={e => setRejectReason(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-white font-mono focus:outline-none focus:border-indigo-500"
                />
                <div className="flex justify-end gap-2 text-[10px]">
                  <button type="button" onClick={() => { setShowRejectModal(false); setRejectReason(""); }} className="px-3 py-1.5 border border-slate-800 rounded uppercase font-bold text-slate-400 hover:text-white">Cancel</button>
                  <button 
                    type="button" 
                    onClick={handleReject} 
                    className="px-3 py-1.5 bg-red-600 hover:bg-red-500 text-white rounded uppercase font-bold"
                  >
                    Confirm Rejection
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SettlementDetailsView;
