import React, { useState, useMemo } from "react";
import { usePayments, useApprovePaymentMutation, useRejectPaymentMutation } from "../hooks/useFinanceQueries";
import { useNotification } from "../providers/NotificationProvider";
import { useAuth } from "../context/AuthContext";
import { USER_ROLE } from "../constants";
import { formatCurrency } from "../utils/bidUtils";
import { 
  CreditCard, 
  Search, 
  Filter, 
  RefreshCw, 
  CheckCircle, 
  XCircle, 
  Clock, 
  AlertTriangle,
  History,
  ShieldCheck,
  UserCheck2
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export const PaymentApprovalView: React.FC = () => {
  const { showNotification } = useNotification();
  const { hasRole, user } = useAuth();

  const { data: paymentsData, isLoading, refetch } = usePayments();
  const approvePayment = useApprovePaymentMutation();
  const rejectPayment = useRejectPaymentMutation();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [showReasonModal, setShowReasonModal] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  const payments = paymentsData || [];

  const filteredPayments = useMemo(() => {
    return payments.filter(p => {
      const pId = p.id || p.paymentId || "";
      const rNo = p.referenceNumber || p.referenceNo || "";
      const uId = p.userId || p.depositorId || "SYS";

      const matchSearch = 
        pId.toLowerCase().includes(search.toLowerCase()) ||
        rNo.toLowerCase().includes(search.toLowerCase()) ||
        uId.toLowerCase().includes(search.toLowerCase());

      const matchStatus = statusFilter === "ALL" || p.status === statusFilter;

      return matchSearch && matchStatus;
    });
  }, [payments, search, statusFilter]);

  const handleApprove = async (paymentId: string) => {
    if (!hasRole([USER_ROLE.FINANCE, USER_ROLE.ACCOUNTANT, USER_ROLE.SUPER_ADMIN, USER_ROLE.ADMIN])) {
      showNotification("Permission Denied: You do not possess roles authorized to approve manual bank slips.", "error");
      return;
    }
    try {
      await approvePayment.mutateAsync(paymentId);
      showNotification(`Manual bank slip [${paymentId}] has been checked and verified.`, "success");
    } catch (e: any) {
      showNotification(e.response?.data?.message || `Failed to verify payment slip [${paymentId}].`, "error");
    }
  };

  const handleReject = async () => {
    if (!showReasonModal) return;
    if (!rejectReason.trim()) {
      showNotification("Rejection comment cannot be blank.", "error");
      return;
    }
    try {
      await rejectPayment.mutateAsync({ paymentId: showReasonModal, reason: rejectReason });
      showNotification(`Payment slip [${showReasonModal}] rejected.`, "info");
      setShowReasonModal(null);
      setRejectReason("");
    } catch (e: any) {
      showNotification(e.response?.data?.message || `Failed to reject payment slip [${showReasonModal}].`, "error");
    }
  };

  return (
    <div className="space-y-6 font-mono text-xs text-slate-300" id="payment-approval-view">
      {/* HEADER BAR */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-800/60 pb-5">
        <div>
          <h2 className="text-xl font-bold tracking-wider text-white">MANUAL PAYMENT SLIP CLEARANCE</h2>
          <p className="text-[10px] text-slate-500 uppercase mt-1">
            Maker-checker verification portal for wire transfers, NEFT, RTGS bank slips and escrow credits
          </p>
        </div>
        <div>
          <button 
            onClick={() => refetch()}
            className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-800 hover:border-indigo-500 bg-slate-900 rounded text-[10px] uppercase font-bold text-slate-400 hover:text-white transition-all cursor-pointer"
          >
            <RefreshCw className="h-3.5 w-3.5" /> Reload Slip Queue
          </button>
        </div>
      </div>

      {/* FILTER PANEL */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-900/40 border border-slate-800/80 p-4 rounded-xl">
        <div className="space-y-1.5">
          <label className="block text-[9px] font-bold text-slate-500 uppercase">Search Slips</label>
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-500" />
            <input 
              type="text" 
              placeholder="UTR reference No, Payment ID, User ID..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded pl-8 pr-2.5 py-2 text-slate-200 focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="block text-[9px] font-bold text-slate-500 uppercase">Verification Status</label>
          <select 
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-2 text-slate-200 focus:outline-none focus:border-indigo-500"
          >
            <option value="ALL">ALL STATUSES</option>
            <option value="PENDING">PENDING MANUAL CHECK</option>
            <option value="COMPLETED">COMPLETED / CLEARED</option>
            <option value="FAILED">FAILED / REJECTED</option>
          </select>
        </div>
      </div>

      {/* PAYMENTS LIST TABLE */}
      <div className="bg-slate-900/40 border border-slate-800 rounded-xl overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[850px]">
          <thead>
            <tr className="bg-slate-950 text-[9px] text-slate-500 font-bold border-b border-slate-800 uppercase tracking-wider">
              <th className="p-4">Payment ID</th>
              <th className="p-4">UTR Bank Reference</th>
              <th className="p-4">Payment Channel</th>
              <th className="p-4 text-right">Deposited Value</th>
              <th className="p-4">Depositor ID</th>
              <th className="p-4">Registered Date</th>
              <th className="p-4 text-center">Verification Status</th>
              <th className="p-4 text-center">Maker-Checker Authorization</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
            {isLoading && (
              <tr>
                <td colSpan={8} className="p-8 text-center text-slate-500">
                  <RefreshCw className="h-6 w-6 animate-spin mx-auto text-indigo-500 mb-2" />
                  <span>Loading payments...</span>
                </td>
              </tr>
            )}
            {!isLoading && filteredPayments.map((p) => (
              <tr key={p.id || p.paymentId} className="hover:bg-slate-900/30 transition-colors">
                <td className="p-4 font-bold text-slate-400">{p.id || p.paymentId}</td>
                <td className="p-4 font-bold text-slate-200">{p.referenceNumber || p.referenceNo}</td>
                <td className="p-4 text-slate-400 font-bold uppercase">{p.paymentMethod}</td>
                <td className="p-4 text-right font-bold text-white">{formatCurrency(p.totalAmount || p.amount, p.currency)}</td>
                <td className="p-4 font-mono text-indigo-400">{p.userId || p.depositorId || "SYS"}</td>
                <td className="p-4 text-slate-500 text-[10px]">{new Date(p.paymentDate || p.createdAt).toLocaleString()}</td>
                <td className="p-4 text-center">
                  <span className={`px-2 py-0.5 rounded text-[9px] font-bold border uppercase ${
                    p.status === "COMPLETED" 
                      ? "bg-emerald-950/40 text-emerald-400 border-emerald-900/50" 
                      : p.status === "PENDING"
                      ? "bg-amber-950/40 text-amber-500 border-amber-900/50"
                      : "bg-red-950/40 text-red-400 border-red-900/50"
                  }`}>
                    {p.status}
                  </span>
                </td>
                <td className="p-4 text-center">
                  {p.status === "PENDING" ? (
                    <div className="flex items-center justify-center gap-1.5">
                      <button 
                        onClick={() => handleApprove(p.id || p.paymentId)}
                        className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[9px] uppercase rounded transition-all cursor-pointer flex items-center gap-1"
                      >
                        <UserCheck2 className="h-3 w-3" /> Approve
                      </button>
                      <button 
                        onClick={() => setShowReasonModal(p.id || p.paymentId)}
                        className="px-2.5 py-1 bg-red-600/10 hover:bg-red-600 text-red-400 hover:text-white font-bold text-[9px] uppercase rounded border border-red-500/20 transition-all cursor-pointer"
                      >
                        Reject
                      </button>
                    </div>
                  ) : (
                    <span className="text-slate-600 text-[10px] font-bold uppercase">— Audited —</span>
                  )}
                </td>
              </tr>
            ))}
            {!isLoading && filteredPayments.length === 0 && (
              <tr>
                <td colSpan={8} className="p-8 text-center text-slate-500">
                  <div className="flex flex-col items-center justify-center gap-2 py-4">
                    <AlertTriangle className="h-6 w-6 text-slate-600" />
                    <span>Zero manual bank slips match chosen filters.</span>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* REJECTION COMMENT POPUP */}
      <AnimatePresence>
        {showReasonModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 0.6 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black" onClick={() => setShowReasonModal(null)} />
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="relative bg-slate-900 border border-slate-800 p-6 rounded-xl w-full max-w-sm shadow-2xl z-10">
              <h3 className="text-xs font-bold uppercase text-white mb-4 flex items-center gap-1.5">
                <XCircle className="h-4 w-4 text-red-500" /> Provide Rejection Reason
              </h3>
              <div className="space-y-4">
                <p className="text-slate-400">
                  Provide an auditable reason for withholding verification and rejecting Payment slip <span className="font-bold text-slate-200">{showReasonModal}</span>:
                </p>
                <textarea 
                  required 
                  rows={3}
                  placeholder="Specify clear bank slip verification mismatch reasons..."
                  value={rejectReason}
                  onChange={e => setRejectReason(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-white font-mono focus:outline-none focus:border-indigo-500"
                />
                <div className="flex justify-end gap-2 text-[10px]">
                  <button type="button" onClick={() => { setShowReasonModal(null); setRejectReason(""); }} className="px-3 py-1.5 border border-slate-800 rounded uppercase font-bold text-slate-400 hover:text-white">Cancel</button>
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

export default PaymentApprovalView;
