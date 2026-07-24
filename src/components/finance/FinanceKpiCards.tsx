import React, { memo } from "react";
import { DollarSign, FileText, CreditCard, Wallet as WalletIcon } from "lucide-react";
import { formatCurrency } from "../../utils/bidUtils";

interface FinanceKpiCardsProps {
  settlementsCount: number;
  refundsCount: number;
  pendingPaymentsCount: number;
  ledgerBalance: number;
}

export const FinanceKpiCards: React.FC<FinanceKpiCardsProps> = memo(({
  settlementsCount,
  refundsCount,
  pendingPaymentsCount,
  ledgerBalance
}) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 font-mono">
      <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-sm">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-slate-400 font-bold uppercase">Pending Settlements</span>
          <div className="h-8 w-8 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
            <DollarSign className="h-4 w-4" />
          </div>
        </div>
        <div className="text-2xl font-bold text-white">{settlementsCount}</div>
        <span className="text-[10px] text-slate-500 mt-1 block">Awaiting Checker Authorization</span>
      </div>

      <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-sm">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-slate-400 font-bold uppercase">Refund Requests</span>
          <div className="h-8 w-8 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
            <FileText className="h-4 w-4" />
          </div>
        </div>
        <div className="text-2xl font-bold text-white">{refundsCount}</div>
        <span className="text-[10px] text-slate-500 mt-1 block">Escrow EMD Reversals</span>
      </div>

      <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-sm">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-slate-400 font-bold uppercase">Payment Queue</span>
          <div className="h-8 w-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <CreditCard className="h-4 w-4" />
          </div>
        </div>
        <div className="text-2xl font-bold text-white">{pendingPaymentsCount}</div>
        <span className="text-[10px] text-slate-500 mt-1 block">NEFT/RTGS Verification</span>
      </div>

      <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-sm">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-slate-400 font-bold uppercase">Ledger Net Revenue</span>
          <div className="h-8 w-8 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
            <WalletIcon className="h-4 w-4" />
          </div>
        </div>
        <div className="text-2xl font-bold text-emerald-400">{formatCurrency(ledgerBalance)}</div>
        <span className="text-[10px] text-slate-500 mt-1 block">Platform Double-Entry Ledger</span>
      </div>
    </div>
  );
});

FinanceKpiCards.displayName = "FinanceKpiCards";
