import React, { useState } from "react";
import { useWallet, useLedger, useAddLedgerEntryMutation } from "../hooks/useFinanceQueries";
import { useNotification } from "../providers/NotificationProvider";
import { handleApiError } from "../api/errorHandler";
import { formatCurrency } from "../utils/bidUtils";
import { 
  Wallet as WalletIcon, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Lock, 
  Unlock, 
  RefreshCw, 
  Clock, 
  PlusCircle, 
  ArrowRightLeft,
  AlertTriangle,
  History,
  TrendingUp,
  ArrowDownRight
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

const DEMO_TRANSACTIONS = [
  { txnId: "TXN-8829101", amount: 150000, type: "DEPOSIT", status: "COMPLETED", description: "NEFT Manual Wire transfer deposit", date: "2026-06-30T04:15:00Z" },
  { txnId: "TXN-8829102", amount: 3200000, type: "LOCK", status: "COMPLETED", description: "Lien allocation block for auction LOT #210", date: "2026-06-29T11:00:00Z" },
  { txnId: "TXN-8829103", amount: 141150, type: "WITHDRAWAL", status: "COMPLETED", description: "Disbursal to verified seller banker channel", date: "2026-06-28T14:30:00Z" },
  { txnId: "TXN-8829104", amount: 50000, type: "UNLOCK", status: "COMPLETED", description: "Lien release for bidding lot refund", date: "2026-06-27T10:00:00Z" },
];

export const WalletView: React.FC = () => {
  const { showNotification } = useNotification();
  const { data: serverWallet, isLoading, refetch, isFetching } = useWallet();
  const { data: ledgerData, isLoading: isLedgerLoading } = useLedger();
  const addLedgerEntry = useAddLedgerEntryMutation();

  // Modals / forms state
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [showWithdrawalModal, setShowWithdrawalModal] = useState(false);
  const [showLienModal, setShowLienModal] = useState(false);

  const [depositForm, setDepositForm] = useState({ amount: 0, paymentMethod: "NEFT", referenceNo: "" });
  const [withdrawalForm, setWithdrawalForm] = useState({ amount: 0, bankAccount: "", branchCode: "" });
  const [lienForm, setLienForm] = useState({ amount: 0, reason: "", lock: true });

  const wallet = serverWallet || { availableBalance: 12450000, lockedBalance: 3200000, currency: "INR" };

  const handleDepositSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (depositForm.amount <= 0 || !depositForm.referenceNo) {
      showNotification("Please provide complete transaction details.", "error");
      return;
    }
    try {
      await addLedgerEntry.mutateAsync({
        accountId: "ACC-BUYER-CURRENT",
        amount: Math.round(depositForm.amount * 100),
        entryType: "CREDIT" as any,
        accountType: "BUYER_RECEIVABLE" as any,
        currency: "INR",
        description: `NEFT Deposit Ref: ${depositForm.referenceNo}`
      });
      showNotification(`NEFT payment slip of ${formatCurrency(depositForm.amount, "INR")} registered successfully.`, "success");
      setShowDepositModal(false);
      setDepositForm({ amount: 0, paymentMethod: "NEFT", referenceNo: "" });
      refetch();
    } catch (err: any) {
      const friendly = handleApiError(err);
      showNotification(`Deposit registration failed: ${friendly.message}`, "error");
    }
  };

  const handleWithdrawalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (withdrawalForm.amount <= 0 || !withdrawalForm.bankAccount) {
      showNotification("Please complete banker allocation fields.", "error");
      return;
    }
    if (withdrawalForm.amount > wallet.availableBalance) {
      showNotification("Insufficient balance for withdrawal.", "error");
      return;
    }
    try {
      await addLedgerEntry.mutateAsync({
        accountId: withdrawalForm.bankAccount,
        amount: Math.round(withdrawalForm.amount * 100),
        entryType: "DEBIT" as any,
        accountType: "SELLER_PAYOUT" as any,
        currency: "INR",
        description: `Withdrawal to Bank: ${withdrawalForm.bankAccount} IFSC: ${withdrawalForm.branchCode}`
      });
      showNotification(`Payout ledger order for ${formatCurrency(withdrawalForm.amount, "INR")} scheduled successfully.`, "success");
      setShowWithdrawalModal(false);
      setWithdrawalForm({ amount: 0, bankAccount: "", branchCode: "" });
      refetch();
    } catch (err: any) {
      const friendly = handleApiError(err);
      showNotification(`Withdrawal request failed: ${friendly.message}`, "error");
    }
  };

  const handleLienSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (lienForm.amount <= 0 || !lienForm.reason) {
      showNotification("Please specify the sum and lien reason.", "error");
      return;
    }
    if (lienForm.lock && lienForm.amount > wallet.availableBalance) {
      showNotification("Insufficient available pool to lock.", "error");
      return;
    }
    if (!lienForm.lock && lienForm.amount > wallet.lockedBalance) {
      showNotification("Lien amount exceeds locked balance.", "error");
      return;
    }
    try {
      await addLedgerEntry.mutateAsync({
        accountId: "ACC-LIEN-HOLD",
        amount: Math.round(lienForm.amount * 100),
        entryType: lienForm.lock ? ("DEBIT" as any) : ("CREDIT" as any),
        accountType: "BUYER_RECEIVABLE" as any,
        currency: "INR",
        description: `Lien ${lienForm.lock ? "Lock" : "Unlock"}: ${lienForm.reason}`
      });
      showNotification(`Escrow funds ${lienForm.lock ? "locked" : "unlocked"} successfully: ${formatCurrency(lienForm.amount, "INR")}.`, "success");
      setShowLienModal(false);
      refetch();
    } catch (err: any) {
      const friendly = handleApiError(err);
      showNotification(`Lien operation failed: ${friendly.message}`, "error");
    }
  };

  return (
    <div className="space-y-6 font-mono text-xs text-slate-300" id="wallet-view">
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-800/60 pb-5">
        <div>
          <h2 className="text-xl font-bold tracking-wider text-white">ESCROW CODES & CASH POOLS</h2>
          <p className="text-[10px] text-slate-500 uppercase mt-1">
            Control center for security deposits, bidder earnest funds, and release channels
          </p>
        </div>
        <div>
          <button 
            onClick={() => {
              refetch();
              showNotification("Escrow cash pool synced.", "success");
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-800 hover:border-indigo-500 bg-slate-900 rounded text-[10px] uppercase font-bold text-slate-400 hover:text-white transition-all cursor-pointer"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isFetching ? "animate-spin" : ""}`} /> Refresh Pool
          </button>
        </div>
      </div>

      {/* BALANCE SHEET STATS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-slate-950 border border-slate-800 p-5 rounded-xl relative overflow-hidden flex flex-col justify-between h-[120px]">
          <div className="absolute right-4 top-4 text-emerald-500/20"><WalletIcon className="h-12 w-12" /></div>
          <div>
            <span className="block text-[9px] text-slate-500 uppercase tracking-widest font-bold">Unrestricted Balance</span>
            <span className="text-2xl font-bold text-emerald-400 block mt-2">{formatCurrency(wallet.availableBalance, wallet.currency)}</span>
          </div>
          <span className="text-[9px] text-slate-500 uppercase font-mono">Available for treasury payout</span>
        </div>

        <div className="bg-slate-950 border border-slate-800 p-5 rounded-xl relative overflow-hidden flex flex-col justify-between h-[120px]">
          <div className="absolute right-4 top-4 text-amber-500/20"><Lock className="h-12 w-12" /></div>
          <div>
            <span className="block text-[9px] text-slate-500 uppercase tracking-widest font-bold">Lien / Blocked Balance</span>
            <span className="text-2xl font-bold text-amber-500 block mt-2">{formatCurrency(wallet.lockedBalance, wallet.currency)}</span>
          </div>
          <span className="text-[9px] text-slate-500 uppercase font-mono">Held in active bid events</span>
        </div>

        <div className="bg-slate-950 border border-slate-800 p-5 rounded-xl relative overflow-hidden flex flex-col justify-between h-[120px]">
          <div className="absolute right-4 top-4 text-indigo-500/20"><TrendingUp className="h-12 w-12" /></div>
          <div>
            <span className="block text-[9px] text-slate-500 uppercase tracking-widest font-bold">Escrow Aggregate Pool</span>
            <span className="text-2xl font-bold text-indigo-400 block mt-2">{formatCurrency(wallet.availableBalance + wallet.lockedBalance, wallet.currency)}</span>
          </div>
          <span className="text-[9px] text-slate-500 uppercase font-mono">Total cash under system vault</span>
        </div>
      </div>

      {/* QUICK OPERATIONS DESK */}
      <div className="bg-slate-900/40 border border-slate-800/80 p-5 rounded-xl">
        <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-1.5">
          <ArrowRightLeft className="h-4.5 w-4.5 text-indigo-400" /> Treasury Clearance Desk
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <button 
            onClick={() => setShowDepositModal(true)}
            className="p-4 rounded-lg bg-slate-950 border border-slate-800 hover:border-emerald-500 text-left hover:bg-slate-900/60 transition-all group cursor-pointer"
          >
            <div className="w-8 h-8 rounded bg-emerald-600/10 text-emerald-400 flex items-center justify-center mb-3 group-hover:bg-emerald-600 group-hover:text-white transition-all">
              <ArrowDownLeft className="h-4.5 w-4.5" />
            </div>
            <span className="font-bold text-slate-200 block">Log Manual Deposit</span>
            <span className="text-[9px] text-slate-500 block mt-0.5">Wire reference verification</span>
          </button>

          <button 
            onClick={() => setShowWithdrawalModal(true)}
            className="p-4 rounded-lg bg-slate-950 border border-slate-800 hover:border-red-500 text-left hover:bg-slate-900/60 transition-all group cursor-pointer"
          >
            <div className="w-8 h-8 rounded bg-red-600/10 text-red-400 flex items-center justify-center mb-3 group-hover:bg-red-600 group-hover:text-white transition-all">
              <ArrowUpRight className="h-4.5 w-4.5" />
            </div>
            <span className="font-bold text-slate-200 block">Withdraw / Cash-Out</span>
            <span className="text-[9px] text-slate-500 block mt-0.5">Process beneficiary cash-out</span>
          </button>

          <button 
            onClick={() => setShowLienModal(true)}
            className="p-4 rounded-lg bg-slate-950 border border-slate-800 hover:border-amber-500 text-left hover:bg-slate-900/60 transition-all group cursor-pointer"
          >
            <div className="w-8 h-8 rounded bg-amber-600/10 text-amber-400 flex items-center justify-center mb-3 group-hover:bg-amber-600 group-hover:text-white transition-all">
              <Lock className="h-4.5 w-4.5" />
            </div>
            <span className="font-bold text-slate-200 block">Lien Allocation</span>
            <span className="text-[9px] text-slate-500 block mt-0.5">Lien / release pool funds</span>
          </button>
        </div>
      </div>

      {/* TRANSACTION HISTORY LEDGER */}
      <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-5">
        <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-1.5 border-b border-slate-800 pb-3">
          <History className="h-4.5 w-4.5 text-indigo-400" /> Vault Transaction Ledger
        </h3>
        <div className="space-y-3">
          {(ledgerData || []).map((txn: any) => (
            <div key={txn.transactionId} className="bg-slate-950/80 p-3.5 border border-slate-900/80 rounded-lg flex justify-between items-center hover:border-slate-850 transition-colors">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-200">{txn.txnId}</span>
                  <span className={`text-[8px] font-bold px-1.5 py-0.2 rounded border uppercase ${
                    (txn.entryType === "CREDIT" ? "DEPOSIT" : "WITHDRAWAL") === "DEPOSIT" || txn.type === "UNLOCK" 
                      ? "bg-emerald-950 text-emerald-400 border-emerald-900/50" 
                      : "bg-red-950 text-red-400 border-red-900/50"
                  }`}>
                    {txn.type}
                  </span>
                </div>
                <p className="text-slate-400 text-[10px]">{txn.description}</p>
                <span className="text-[9px] text-slate-600 block">{new Date(txn.timestamp).toLocaleString()}</span>
              </div>
              <div className="text-right">
                <span className={`font-bold text-xs ${
                  txn.type === "DEPOSIT" || txn.type === "UNLOCK" ? "text-emerald-400" : "text-red-400"
                }`}>
                  {txn.type === "DEPOSIT" || txn.type === "UNLOCK" ? "+" : "-"}{formatCurrency(txn.amount, "INR")}
                </span>
                <span className="block text-[8px] text-slate-600 font-bold uppercase mt-1">Status: {"COMPLETED"}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* MODAL 1: DEPOSIT FUND */}
      <AnimatePresence>
        {showDepositModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 0.6 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black" onClick={() => setShowDepositModal(false)} />
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="relative bg-slate-900 border border-slate-800 p-6 rounded-xl w-full max-w-sm shadow-2xl z-10">
              <h3 className="text-sm font-bold uppercase text-white mb-4 flex items-center gap-1.5">
                <ArrowDownLeft className="h-5 w-5 text-emerald-400" /> Log Wire Deposit Slip
              </h3>
              <form onSubmit={handleDepositSubmit} className="space-y-4 text-xs">
                <div>
                  <label className="block text-[9px] font-bold text-slate-500 uppercase mb-1">Deposit Amount (INR)</label>
                  <input 
                    type="number" 
                    required 
                    min="1"
                    placeholder="e.g. 500000"
                    value={depositForm.amount || ""}
                    onChange={e => setDepositForm({...depositForm, amount: parseFloat(e.target.value) || 0})}
                    className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-white font-mono focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-[9px] font-bold text-slate-500 uppercase mb-1">Transfer Protocol</label>
                  <select 
                    value={depositForm.paymentMethod}
                    onChange={e => setDepositForm({...depositForm, paymentMethod: e.target.value})}
                    className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-white font-mono focus:outline-none focus:border-indigo-500"
                  >
                    <option value="NEFT">NEFT BANK WIRE</option>
                    <option value="RTGS">RTGS SYSTEM</option>
                    <option value="IMPS">IMPS INSTANT</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[9px] font-bold text-slate-500 uppercase mb-1">Bank Reference No (UTR)</label>
                  <input 
                    type="text" 
                    required 
                    placeholder="e.g. UTIBN261899121"
                    value={depositForm.referenceNo}
                    onChange={e => setDepositForm({...depositForm, referenceNo: e.target.value})}
                    className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-white font-mono focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <button type="button" onClick={() => setShowDepositModal(false)} className="px-3 py-1.5 border border-slate-800 rounded uppercase font-bold text-[10px] text-slate-400 hover:text-white">Cancel</button>
                  <button type="submit" className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 rounded uppercase font-bold text-[10px] text-white">Log Deposit</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL 2: WITHDRAWAL */}
      <AnimatePresence>
        {showWithdrawalModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 0.6 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black" onClick={() => setShowWithdrawalModal(false)} />
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="relative bg-slate-900 border border-slate-800 p-6 rounded-xl w-full max-w-sm shadow-2xl z-10">
              <h3 className="text-sm font-bold uppercase text-white mb-4 flex items-center gap-1.5">
                <ArrowUpRight className="h-5 w-5 text-red-400" /> Cash-out Beneficiary Funds
              </h3>
              <form onSubmit={handleWithdrawalSubmit} className="space-y-4 text-xs">
                <div>
                  <label className="block text-[9px] font-bold text-slate-500 uppercase mb-1">Withdrawal Amount (INR)</label>
                  <input 
                    type="number" 
                    required 
                    min="1"
                    placeholder="e.g. 200000"
                    value={withdrawalForm.amount || ""}
                    onChange={e => setWithdrawalForm({...withdrawalForm, amount: parseFloat(e.target.value) || 0})}
                    className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-white font-mono focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-[9px] font-bold text-slate-500 uppercase mb-1">Beneficiary Bank Account (IFS / IBAN)</label>
                  <input 
                    type="text" 
                    required 
                    placeholder="e.g. SBIN00010928112"
                    value={withdrawalForm.bankAccount}
                    onChange={e => setWithdrawalForm({...withdrawalForm, bankAccount: e.target.value})}
                    className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-white font-mono focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-[9px] font-bold text-slate-500 uppercase mb-1">Bank Swift / IFSC Branch Code</label>
                  <input 
                    type="text" 
                    placeholder="e.g. IFSC-SBIN000102"
                    value={withdrawalForm.branchCode}
                    onChange={e => setWithdrawalForm({...withdrawalForm, branchCode: e.target.value})}
                    className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-white font-mono focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <button type="button" onClick={() => setShowWithdrawalModal(false)} className="px-3 py-1.5 border border-slate-800 rounded uppercase font-bold text-[10px] text-slate-400 hover:text-white">Cancel</button>
                  <button type="submit" className="px-3 py-1.5 bg-red-600 hover:bg-red-500 rounded uppercase font-bold text-[10px] text-white">Execute cash-out</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL 3: LIEN MANAGEMENT */}
      <AnimatePresence>
        {showLienModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 0.6 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black" onClick={() => setShowLienModal(false)} />
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="relative bg-slate-900 border border-slate-800 p-6 rounded-xl w-full max-w-sm shadow-2xl z-10">
              <h3 className="text-sm font-bold uppercase text-white mb-4 flex items-center gap-1.5">
                <Lock className="h-5 w-5 text-amber-400" /> Allocate / Unlock System Lien
              </h3>
              <form onSubmit={handleLienSubmit} className="space-y-4 text-xs">
                <div>
                  <label className="block text-[9px] font-bold text-slate-500 uppercase mb-1">Lien Sum (INR)</label>
                  <input 
                    type="number" 
                    required 
                    min="1"
                    placeholder="Lien value to hold or free"
                    value={lienForm.amount || ""}
                    onChange={e => setLienForm({...lienForm, amount: parseFloat(e.target.value) || 0})}
                    className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-white font-mono focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-[9px] font-bold text-slate-500 uppercase mb-1">Action Type</label>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-1.5 text-slate-300">
                      <input 
                        type="radio" 
                        name="lien_type" 
                        checked={lienForm.lock}
                        onChange={() => setLienForm({...lienForm, lock: true})}
                      /> Lock / Set Lien
                    </label>
                    <label className="flex items-center gap-1.5 text-slate-300">
                      <input 
                        type="radio" 
                        name="lien_type" 
                        checked={!lienForm.lock}
                        onChange={() => setLienForm({...lienForm, lock: false})}
                      /> Release / Free Lien
                    </label>
                  </div>
                </div>
                <div>
                  <label className="block text-[9px] font-bold text-slate-500 uppercase mb-1">Auditable Clearance Reason</label>
                  <input 
                    type="text" 
                    required 
                    placeholder="e.g. Lien hold for Bid Lot #990"
                    value={lienForm.reason}
                    onChange={e => setLienForm({...lienForm, reason: e.target.value})}
                    className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-white font-mono focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <button type="button" onClick={() => setShowLienModal(false)} className="px-3 py-1.5 border border-slate-800 rounded uppercase font-bold text-[10px] text-slate-400 hover:text-white">Cancel</button>
                  <button type="submit" className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 rounded uppercase font-bold text-[10px] text-white">Commit Lien</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default WalletView;
