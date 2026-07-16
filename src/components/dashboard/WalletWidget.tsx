import React, { useState } from "react";
import { 
  Coins, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Lock, 
  RefreshCw, 
  CheckCircle2, 
  X,
  CreditCard,
  History,
  TrendingUp,
  Clock,
  ExternalLink
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useWallet, useLedger, useAddLedgerEntryMutation } from "../../hooks/useFinanceQueries";

interface WalletWidgetProps {
  themeMode: "light" | "dark";
  showToast: (msg: string, type: "success" | "info" | "warning") => void;
  onTriggerAction: (action: string, payload?: any) => void;
}

export function WalletWidget({ themeMode, showToast, onTriggerAction }: WalletWidgetProps) {
  const { data: walletData, isLoading: isWalletLoading } = useWallet();
  const { data: ledgerData, isLoading: isLedgerLoading } = useLedger();
  const addLedgerEntry = useAddLedgerEntryMutation();

  const balances = {
    available: walletData?.availableBalance || 0,
    blocked: walletData?.lockedBalance || 0,
    permanentEmd: walletData?.permanentEmd || 0,
    refundPending: walletData?.refundPending || 0,
    settlementPending: walletData?.settlementPending || 0
  };

  const transactions = ledgerData?.slice(0, 4).map(l => ({
    id: l.ledgerId,
    type: l.entryType === "CREDIT" ? "deposit" : "withdraw",
    bank: l.accountId || "System Escrow",
    amount: l.amount,
    status: "completed",
    date: new Date(l.timestamp).toLocaleString(),
    ref: l.transactionId
  })) || [];

  const [activeForm, setActiveForm] = useState<"deposit" | "withdraw" | null>(null);
  const [formAmount, setFormAmount] = useState("");
  const [formBank, setFormBank] = useState("State Bank of India");

  const formatCurrency = (val: number) => {
    if (val >= 10000000) {
      return `₹${(val / 10000000).toFixed(2)} Cr`;
    } else if (val >= 100000) {
      return `₹${(val / 100000).toFixed(2)} L`;
    }
    return `₹${val.toLocaleString()}`;
  };

  const handleDepositSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = Number(formAmount);
    if (!formAmount || amt <= 0) {
      showToast("Please enter a valid deposit amount", "warning");
      return;
    }
    
    addLedgerEntry.mutate({
      accountId: formBank,
      accountType: "USER_WALLET" as any,
      entryType: "CREDIT" as any,
      amount: amt,
      currency: "INR",
      description: "Wallet Deposit"
    }, {
      onSuccess: () => {
        onTriggerAction("deposit-emd", { amount: amt, title: "Wallet Deposit" });
        showToast(`Successfully deposited ${formatCurrency(amt)} via ${formBank}`, "success");
        setActiveForm(null);
        setFormAmount("");
      }
    });
  };

  const handleWithdrawSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = Number(formAmount);
    if (!formAmount || amt <= 0) {
      showToast("Please enter a valid withdrawal amount", "warning");
      return;
    }
    if (amt > balances.available) {
      showToast("Insufficient available cash balance", "warning");
      return;
    }
    
    addLedgerEntry.mutate({
      accountId: formBank,
      accountType: "USER_WALLET" as any,
      entryType: "DEBIT" as any,
      amount: amt,
      currency: "INR",
      description: "Wallet Withdrawal"
    }, {
      onSuccess: () => {
        onTriggerAction("approve-finance-payout", { amount: amt });
        showToast(`Withdrawal of ${formatCurrency(amt)} initiated under SLA check`, "success");
        setActiveForm(null);
        setFormAmount("");
      }
    });
  };

  if (isWalletLoading || isLedgerLoading) {
    return (
      <div className={`p-6 rounded-2xl border flex items-center justify-center h-full ${
        themeMode === "dark" ? "bg-slate-900/40 border-slate-800/80" : "bg-white border-slate-200"
      }`}>
        <div className="animate-pulse flex flex-col items-center gap-2">
          <div className="h-8 w-8 rounded-full bg-slate-500/20"></div>
          <div className="h-4 w-24 bg-slate-500/20 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className={`p-6 rounded-2xl border flex flex-col justify-between ${
      themeMode === "dark" ? "bg-slate-900/40 border-slate-800/80" : "bg-white border-slate-200"
    }`}>
      {/* HEADER */}
      <div className="flex items-center justify-between border-b border-slate-150 dark:border-slate-800/85 pb-4 mb-4">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-blue-600/10 text-blue-500">
            <Coins className="h-5 w-5" />
          </div>
          <div>
            <h4 className="text-xs font-bold font-mono uppercase tracking-wider text-slate-400">Escrow Wallet Ledger</h4>
            <p className="text-[10px] text-slate-500 font-mono">Consolidated SBI Gateways</p>
          </div>
        </div>

        {/* ACTIONS */}
        <div className="flex gap-1.5">
          <button
            onClick={() => setActiveForm("deposit")}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[9px] font-mono font-bold uppercase border border-emerald-500/30 text-emerald-500 hover:bg-emerald-500/10 cursor-pointer"
          >
            <ArrowDownLeft className="h-3 w-3" /> Deposit
          </button>
          <button
            onClick={() => setActiveForm("withdraw")}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[9px] font-mono font-bold uppercase border border-red-500/30 text-red-500 hover:bg-red-500/10 cursor-pointer"
          >
            <ArrowUpRight className="h-3 w-3" /> Withdraw
          </button>
        </div>
      </div>

      {/* BALANCES GRID */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3.5 mb-5">
        <div className="p-3 bg-blue-600/5 border border-blue-500/10 rounded-xl space-y-1">
          <span className="text-[8px] font-mono text-slate-400 uppercase tracking-wider block">Available Balance</span>
          <span className="text-base font-bold font-mono text-blue-500 block leading-tight">{formatCurrency(balances.available)}</span>
          <span className="text-[8px] font-mono text-slate-500 block">Instant clearing enabled</span>
        </div>

        <div className="p-3 bg-amber-500/5 border border-amber-500/10 rounded-xl space-y-1">
          <span className="text-[8px] font-mono text-slate-400 uppercase tracking-wider block">Blocked Balance</span>
          <span className="text-base font-bold font-mono text-amber-500 block leading-tight">{formatCurrency(balances.blocked)}</span>
          <span className="text-[8px] font-mono text-slate-500 block">Active auction bid holds</span>
        </div>

        <div className="p-3 bg-indigo-500/5 border border-indigo-500/10 rounded-xl space-y-1">
          <span className="text-[8px] font-mono text-slate-400 uppercase tracking-wider block">Permanent EMD Pool</span>
          <span className="text-base font-bold font-mono text-indigo-400 block leading-tight">{formatCurrency(balances.permanentEmd)}</span>
          <span className="text-[8px] font-mono text-slate-500 block">Locked security base</span>
        </div>

        <div className="p-3 bg-purple-500/5 border border-purple-500/10 rounded-xl space-y-1">
          <span className="text-[8px] font-mono text-slate-400 uppercase tracking-wider block">Refund Pending</span>
          <span className="text-base font-bold font-mono text-purple-400 block leading-tight">{formatCurrency(balances.refundPending)}</span>
          <span className="text-[8px] font-mono text-slate-500 block">Awaiting bank clearing</span>
        </div>

        <div className="p-3 bg-emerald-500/5 border border-emerald-500/10 rounded-xl space-y-1">
          <span className="text-[8px] font-mono text-slate-400 uppercase tracking-wider block">Settlement Pipeline</span>
          <span className="text-base font-bold font-mono text-emerald-400 block leading-tight">{formatCurrency(balances.settlementPending)}</span>
          <span className="text-[8px] font-mono text-slate-500 block">Approved maker payouts</span>
        </div>
      </div>

      {/* RECENT TRANSACTION LEDGER */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-[9px] uppercase tracking-wider font-extrabold text-slate-500 font-mono">
          <div className="flex items-center gap-1">
            <History className="h-3 w-3" />
            <span>Recent Settlement Records</span>
          </div>
          <span className="text-[8px]">SBI Reconciled Live</span>
        </div>

        <div className="space-y-1.5 max-h-[160px] overflow-y-auto">
          {transactions.map((txn) => (
            <div
              key={txn.id}
              className={`p-2.5 rounded-xl border flex items-center justify-between gap-3 text-xs ${
                themeMode === "dark" ? "bg-slate-950/40 border-slate-850" : "bg-slate-50 border-slate-150"
              }`}
            >
              <div className="flex items-center gap-2.5 overflow-hidden">
                <div className={`p-1.5 rounded-lg shrink-0 ${
                  txn.type === "deposit" ? "bg-emerald-500/10 text-emerald-500" :
                  txn.type === "withdraw" ? "bg-red-500/10 text-red-500" : "bg-slate-500/10 text-slate-400"
                }`}>
                  {txn.type === "deposit" ? <ArrowDownLeft className="h-3.5 w-3.5" /> : <ArrowUpRight className="h-3.5 w-3.5" />}
                </div>
                <div className="overflow-hidden">
                  <span className={`font-mono text-[10px] font-bold block ${themeMode === "dark" ? "text-slate-200" : "text-slate-700"}`}>
                    {txn.type === "deposit" ? "Wire Credit" : txn.type === "withdraw" ? "Wire Payout" : "Security Lock"}
                  </span>
                  <span className="text-[8px] font-mono text-slate-400 truncate block mt-0.5">{txn.bank} • Ref: {txn.ref}</span>
                </div>
              </div>

              <div className="text-right shrink-0">
                <span className={`font-mono text-[11px] font-bold block ${
                  txn.type === "deposit" ? "text-emerald-500" : "text-red-500"
                }`}>
                  {txn.type === "deposit" ? "+" : "-"} {formatCurrency(txn.amount)}
                </span>
                <span className={`text-[8px] font-mono block mt-0.5 ${
                  txn.status === "completed" ? "text-emerald-500" : "text-amber-500 animate-pulse"
                }`}>
                  {txn.status === "completed" ? "COMPLETED" : "PROCESSING"}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* QUICK TRANSACTION DIALOG POPUPS */}
      <AnimatePresence>
        {activeForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setActiveForm(null)}
              className="fixed inset-0 bg-slate-950/70"
            />

            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className={`relative w-full max-w-sm rounded-2xl border p-5 shadow-2xl overflow-hidden ${
                themeMode === "dark" ? "bg-slate-900 border-slate-800 text-slate-100" : "bg-white border-slate-200 text-slate-950"
              }`}
            >
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3 mb-4">
                <h4 className="text-xs font-mono font-bold uppercase tracking-wider">
                  {activeForm === "deposit" ? "SBI Portal Payment Gateway" : "Inter-Bank Settlement Wire"}
                </h4>
                <button onClick={() => setActiveForm(null)} className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 cursor-pointer">
                  <X className="h-4 w-4" />
                </button>
              </div>

              <form onSubmit={activeForm === "deposit" ? handleDepositSubmit : handleWithdrawSubmit} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[9px] font-mono font-bold uppercase text-slate-400">Routing Bank Account</label>
                  <select
                    value={formBank}
                    onChange={e => setFormBank(e.target.value)}
                    className={`w-full text-xs font-semibold px-3 py-2 rounded-xl border outline-none ${
                      themeMode === "dark" ? "bg-slate-950 border-slate-800" : "bg-slate-50 border-slate-200"
                    }`}
                  >
                    <option>State Bank of India</option>
                    <option>ICICI Commercial Gate</option>
                    <option>HDFC Wholesale Escrow</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-mono font-bold uppercase text-slate-400">Transfer Capital (INR)</label>
                  <input
                    type="number"
                    required
                    placeholder="e.g. 500000"
                    value={formAmount}
                    onChange={e => setFormAmount(e.target.value)}
                    className={`w-full text-xs font-mono font-bold px-3 py-2 rounded-xl border outline-none ${
                      themeMode === "dark" ? "bg-slate-950 border-slate-800" : "bg-slate-50 border-slate-200"
                    }`}
                  />
                </div>

                <div className="p-2.5 bg-blue-500/5 border border-blue-500/15 rounded-xl text-[9px] font-mono text-slate-400 flex gap-2">
                  <Clock className="h-4 w-4 text-blue-500 shrink-0" />
                  <span>Clears in 5 seconds via unified API router hooks. Real-time JWS ledger logs synchronized.</span>
                </div>

                <button
                  type="submit"
                  className={`w-full font-mono text-xs font-bold uppercase py-2.5 rounded-xl cursor-pointer ${
                    activeForm === "deposit"
                      ? "bg-emerald-600 hover:bg-emerald-500 text-white"
                      : "bg-red-600 hover:bg-red-500 text-white"
                  }`}
                >
                  {activeForm === "deposit" ? "Authorize Credit" : "Initiate Checker Release"}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
