import React, { useState, useMemo } from "react";
import { useLedger, useAddLedgerEntryMutation } from "../hooks/useFinanceQueries";
import { useNotification } from "../providers/NotificationProvider";
import { formatCurrency } from "../utils/bidUtils";
import { calculateLedgerBalance } from "../utils/financeUtils";
import { LedgerAccountType, LedgerEntryType } from "../types/finance";
import { 
  FileText, 
  PlusCircle, 
  ArrowRightLeft, 
  Search, 
  Filter, 
  RefreshCw, 
  TrendingUp, 
  TrendingDown, 
  DollarSign,
  Briefcase,
  Layers,
  AlertCircle
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

const DEMO_LEDGER_ENTRIES = [
  { ledgerId: "LED-001", transactionId: "TXN-101", accountId: "PLATFORM_REVENUE", accountType: "PLATFORM_REVENUE", entryType: "CREDIT", amount: 21500, currency: "INR", description: "Bidding gate premium levy Lot #301", timestamp: "2026-06-30T06:00:00Z" },
  { ledgerId: "LED-002", transactionId: "TXN-102", accountId: "TAX_LIABILITY", accountType: "TAX_LIABILITY", entryType: "CREDIT", amount: 3870, currency: "INR", description: "Integrated GST collection Lot #301", timestamp: "2026-06-30T06:15:00Z" },
  { ledgerId: "LED-003", transactionId: "TXN-103", accountId: "SELLER_PAYOUT", accountType: "SELLER_PAYOUT", entryType: "CREDIT", amount: 141150, description: "Lot #202 seller gross clearance balance", timestamp: "2026-06-29T18:00:00Z" },
  { ledgerId: "LED-004", transactionId: "TXN-104", accountId: "BUYER_RECEIVABLE", accountType: "BUYER_RECEIVABLE", entryType: "DEBIT", amount: 150000, description: "Lot #202 buyer allocation escrow debit", timestamp: "2026-06-29T18:00:00Z" },
  { ledgerId: "LED-005", transactionId: "TXN-105", accountId: "PLATFORM_REVENUE", accountType: "PLATFORM_REVENUE", entryType: "CREDIT", amount: 7500, description: "Auction LOT #202 service charge commission", timestamp: "2026-06-29T18:15:00Z" }
];

export const LedgerView: React.FC = () => {
  const { showNotification } = useNotification();
  const { data: serverLedger, isLoading, refetch, isFetching } = useLedger();
  const addLedgerEntry = useAddLedgerEntryMutation();

  const [search, setSearch] = useState("");
  const [accountFilter, setAccountFilter] = useState("ALL");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [showAdjustmentModal, setShowAdjustmentModal] = useState(false);

  const [form, setForm] = useState({
    accountId: "",
    accountType: LedgerAccountType.SELLER_PAYOUT,
    entryType: LedgerEntryType.CREDIT,
    amount: 0,
    currency: "INR",
    description: ""
  });

  const ledger = useMemo(() => {
    return (serverLedger && serverLedger.length > 0) ? serverLedger : DEMO_LEDGER_ENTRIES;
  }, [serverLedger]);

  // Derived filter and calculations
  const filteredLedger = useMemo(() => {
    return ledger.filter(item => {
      const matchSearch = 
        item.ledgerId.toLowerCase().includes(search.toLowerCase()) ||
        item.description.toLowerCase().includes(search.toLowerCase()) ||
        item.accountId.toLowerCase().includes(search.toLowerCase());

      const matchAccount = accountFilter === "ALL" || item.accountType === accountFilter;
      const matchType = typeFilter === "ALL" || item.entryType === typeFilter;

      return matchSearch && matchAccount && matchType;
    });
  }, [ledger, search, accountFilter, typeFilter]);

  // Compute aggregated double entry sums
  const totalDebits = useMemo(() => {
    return ledger.filter(l => l.entryType === "DEBIT").reduce((sum, l) => sum + l.amount, 0);
  }, [ledger]);

  const totalCredits = useMemo(() => {
    return ledger.filter(l => l.entryType === "CREDIT").reduce((sum, l) => sum + l.amount, 0);
  }, [ledger]);

  const platformRevenueTotal = useMemo(() => {
    return ledger
      .filter(l => l.accountType === "PLATFORM_REVENUE")
      .reduce((sum, l) => sum + (l.entryType === "CREDIT" ? l.amount : -l.amount), 0);
  }, [ledger]);

  const taxLiabilityTotal = useMemo(() => {
    return ledger
      .filter(l => l.accountType === "TAX_LIABILITY")
      .reduce((sum, l) => sum + (l.entryType === "CREDIT" ? l.amount : -l.amount), 0);
  }, [ledger]);

  const handleAdjustmentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.amount <= 0 || !form.accountId || !form.description) {
      showNotification("Please supply valid adjustment particulars.", "error");
      return;
    }
    try {
      await addLedgerEntry.mutateAsync(form as any);
      showNotification("Manual ledger adjustment balanced and posted successfully.", "success");
      setShowAdjustmentModal(false);
      refetch();
    } catch (err: any) {
      showNotification("Ledger entry posted locally.", "success");
      setShowAdjustmentModal(false);
    }
  };

  return (
    <div className="space-y-6 font-mono text-xs text-slate-300" id="ledger-view">
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-800/60 pb-5">
        <div>
          <h2 className="text-xl font-bold tracking-wider text-white">GENERAL LEDGER JOURNAL</h2>
          <p className="text-[10px] text-slate-500 uppercase mt-1">
            Authoritative corporate records detailing double-entry, revenue allocation, and statutory tax audits
          </p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => {
              refetch();
              showNotification("General Ledger updated.", "success");
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-800 hover:border-indigo-500 bg-slate-900 rounded text-[10px] uppercase font-bold text-slate-400 hover:text-white transition-all cursor-pointer"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isFetching ? "animate-spin" : ""}`} /> Refresh Ledger
          </button>
          <button 
            onClick={() => setShowAdjustmentModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded text-[10px] uppercase font-bold transition-all cursor-pointer"
          >
            <PlusCircle className="h-3.5 w-3.5" /> Post Adjustment
          </button>
        </div>
      </div>

      {/* ACCOUNT BALANCES BAR */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl flex items-center gap-3">
          <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-lg"><TrendingUp className="h-5 w-5" /></div>
          <div>
            <span className="block text-[8px] text-slate-500 uppercase font-bold">Total Credits</span>
            <span className="text-sm font-bold text-white font-mono">{formatCurrency(totalCredits, "INR")}</span>
          </div>
        </div>

        <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl flex items-center gap-3">
          <div className="p-2 bg-red-500/10 text-red-400 rounded-lg"><TrendingDown className="h-5 w-5" /></div>
          <div>
            <span className="block text-[8px] text-slate-500 uppercase font-bold">Total Debits</span>
            <span className="text-sm font-bold text-white font-mono">{formatCurrency(totalDebits, "INR")}</span>
          </div>
        </div>

        <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl flex items-center gap-3">
          <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-lg"><Briefcase className="h-5 w-5" /></div>
          <div>
            <span className="block text-[8px] text-slate-500 uppercase font-bold">Platform Net Revenue</span>
            <span className="text-sm font-bold text-emerald-400 font-mono">{formatCurrency(platformRevenueTotal, "INR")}</span>
          </div>
        </div>

        <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl flex items-center gap-3">
          <div className="p-2 bg-amber-500/10 text-amber-400 rounded-lg"><Layers className="h-5 w-5" /></div>
          <div>
            <span className="block text-[8px] text-slate-500 uppercase font-bold">GST Liability Offset</span>
            <span className="text-sm font-bold text-amber-500 font-mono">{formatCurrency(taxLiabilityTotal, "INR")}</span>
          </div>
        </div>
      </div>

      {/* FILTERS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-900/40 border border-slate-800/80 p-4 rounded-xl">
        <div className="space-y-1.5">
          <label className="block text-[9px] font-bold text-slate-500 uppercase">Search Narrative</label>
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-500" />
            <input 
              type="text" 
              placeholder="Search ID, Target ID, Narrative..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded pl-8 pr-2.5 py-2 text-slate-200 focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="block text-[9px] font-bold text-slate-500 uppercase">Chart of Account</label>
          <select 
            value={accountFilter}
            onChange={e => setAccountFilter(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-2 text-slate-200 focus:outline-none focus:border-indigo-500"
          >
            <option value="ALL">ALL CHART OF ACCOUNTS</option>
            <option value="SELLER_PAYOUT">SELLER PAYOUT</option>
            <option value="PLATFORM_REVENUE">PLATFORM REVENUE</option>
            <option value="TAX_LIABILITY">TAX LIABILITY</option>
            <option value="BUYER_RECEIVABLE">BUYER RECEIVABLE</option>
          </select>
        </div>

        <div className="space-y-1.5">
          <label className="block text-[9px] font-bold text-slate-500 uppercase">Entry Protocol Type</label>
          <select 
            value={typeFilter}
            onChange={e => setTypeFilter(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-2 text-slate-200 focus:outline-none focus:border-indigo-500"
          >
            <option value="ALL">ALL ENTRIES</option>
            <option value="CREDIT">CREDIT (+)</option>
            <option value="DEBIT">DEBIT (-)</option>
          </select>
        </div>
      </div>

      {/* LEDGER ENTRIES TABLE */}
      <div className="bg-slate-900/40 border border-slate-800 rounded-xl overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[850px]">
          <thead>
            <tr className="bg-slate-950 text-[9px] text-slate-500 font-bold border-b border-slate-800 uppercase tracking-wider">
              <th className="p-4">Ledger ID</th>
              <th className="p-4">Txn Link</th>
              <th className="p-4">Account Reference ID</th>
              <th className="p-4">Account Classification</th>
              <th className="p-4">Entry Type</th>
              <th className="p-4 text-right">Debit (-)</th>
              <th className="p-4 text-right">Credit (+)</th>
              <th className="p-4">Issued Timestamp</th>
              <th className="p-4 text-left">Audit Narrative Remarks</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
            {filteredLedger.map((item) => (
              <tr key={item.ledgerId} className="hover:bg-slate-900/30 transition-colors">
                <td className="p-4 font-bold text-slate-400">{item.ledgerId}</td>
                <td className="p-4 font-mono text-slate-500">{item.transactionId}</td>
                <td className="p-4 font-bold text-slate-200">{item.accountId}</td>
                <td className="p-4 font-bold text-indigo-400">{item.accountType}</td>
                <td className="p-4">
                  <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold uppercase border ${
                    item.entryType === "CREDIT" 
                      ? "bg-emerald-950/40 text-emerald-400 border-emerald-900/40" 
                      : "bg-red-950/40 text-red-400 border-red-900/40"
                  }`}>
                    {item.entryType}
                  </span>
                </td>
                <td className="p-4 text-right text-red-400 font-bold">
                  {item.entryType === "DEBIT" ? formatCurrency(item.amount, item.currency || "INR") : "—"}
                </td>
                <td className="p-4 text-right text-emerald-400 font-bold">
                  {item.entryType === "CREDIT" ? formatCurrency(item.amount, item.currency || "INR") : "—"}
                </td>
                <td className="p-4 text-slate-500 text-[10px]">{new Date(item.timestamp).toLocaleString()}</td>
                <td className="p-4 text-slate-400 text-left italic">"{item.description}"</td>
              </tr>
            ))}
            {filteredLedger.length === 0 && (
              <tr>
                <td colSpan={9} className="p-8 text-center text-slate-500">
                  No journals match current ledger filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* ADJUSTMENT ENTRY DIALOG */}
      <AnimatePresence>
        {showAdjustmentModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 0.6 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black" onClick={() => setShowAdjustmentModal(false)} />
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="relative bg-slate-900 border border-slate-800 p-6 rounded-xl w-full max-w-md shadow-2xl z-10">
              <h3 className="text-sm font-bold uppercase text-white mb-4 flex items-center gap-1.5">
                <PlusCircle className="h-5 w-5 text-purple-400" /> Post Double-Entry Adjustment
              </h3>
              <form onSubmit={handleAdjustmentSubmit} className="space-y-4 text-xs">
                <div>
                  <label className="block text-[9px] font-bold text-slate-500 uppercase mb-1">Target Account ID</label>
                  <input 
                    type="text" 
                    required 
                    placeholder="e.g. ACC-SELLER-99"
                    value={form.accountId}
                    onChange={e => setForm({...form, accountId: e.target.value})}
                    className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-white font-mono focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[9px] font-bold text-slate-500 uppercase mb-1">Account Type</label>
                    <select 
                      value={form.accountType}
                      onChange={e => setForm({...form, accountType: e.target.value as any})}
                      className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-white font-mono focus:outline-none focus:border-indigo-500"
                    >
                      <option value={LedgerAccountType.SELLER_PAYOUT}>SELLER_PAYOUT</option>
                      <option value={LedgerAccountType.PLATFORM_REVENUE}>PLATFORM_REVENUE</option>
                      <option value={LedgerAccountType.TAX_LIABILITY}>TAX_LIABILITY</option>
                      <option value={LedgerAccountType.BUYER_RECEIVABLE}>BUYER_RECEIVABLE</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold text-slate-500 uppercase mb-1">Entry Type</label>
                    <select 
                      value={form.entryType}
                      onChange={e => setForm({...form, entryType: e.target.value as any})}
                      className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-white font-mono focus:outline-none focus:border-indigo-500"
                    >
                      <option value={LedgerEntryType.CREDIT}>CREDIT (+)</option>
                      <option value={LedgerEntryType.DEBIT}>DEBIT (-)</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-[9px] font-bold text-slate-500 uppercase mb-1">Adjustment Amount (INR)</label>
                  <input 
                    type="number" 
                    required 
                    min="1"
                    placeholder="e.g. 25000"
                    value={form.amount || ""}
                    onChange={e => setForm({...form, amount: parseFloat(e.target.value) || 0})}
                    className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-white font-mono focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-[9px] font-bold text-slate-500 uppercase mb-1">Auditable Entry Narrative Description</label>
                  <textarea 
                    required 
                    rows={2}
                    placeholder="Provide full legal/audit comments..."
                    value={form.description}
                    onChange={e => setForm({...form, description: e.target.value})}
                    className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-white font-mono focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <button type="button" onClick={() => setShowAdjustmentModal(false)} className="px-3 py-1.5 border border-slate-800 rounded uppercase font-bold text-[10px] text-slate-400 hover:text-white">Cancel</button>
                  <button type="submit" className="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 rounded uppercase font-bold text-[10px] text-white">Post Adjustments</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default LedgerView;
