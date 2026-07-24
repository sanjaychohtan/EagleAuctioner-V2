import React, { memo } from "react";
import { CheckCircle, ArrowRightLeft } from "lucide-react";
import { formatCurrency } from "../../utils/bidUtils";

interface SettlementItem {
  settlementId: string;
  referenceNo: string;
  auctionId: string;
  sellerId: string;
  buyerId: string;
  grossAmount: number;
  platformFee: number;
  taxAmount: number;
  netAmount: number;
  status: string;
  createdAt: string;
}

interface SettlementReleasePanelProps {
  settlements: SettlementItem[];
  onRelease: (id: string) => void;
  isReleasing: boolean;
}

export const SettlementReleasePanel: React.FC<SettlementReleasePanelProps> = memo(({
  settlements,
  onRelease,
  isReleasing
}) => {
  return (
    <div className="space-y-4 font-mono">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-bold uppercase text-slate-400 tracking-wider flex items-center gap-2">
          <ArrowRightLeft className="h-4 w-4 text-blue-400" />
          Pending Settlement Approvals ({settlements.length})
        </h3>
      </div>

      <div className="rounded-2xl border border-slate-800 bg-slate-900/40 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead className="bg-slate-950 border-b border-slate-800 text-slate-400 uppercase text-[10px]">
              <tr>
                <th className="py-3 px-4">Settlement Ref</th>
                <th className="py-3 px-4">Seller / Buyer</th>
                <th className="py-3 px-4">Gross Lot Value</th>
                <th className="py-3 px-4">Net Payout</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {settlements.map((s) => (
                <tr key={s.settlementId} className="hover:bg-slate-800/30 transition-colors">
                  <td className="py-3.5 px-4 font-bold text-slate-200">{s.settlementId}</td>
                  <td className="py-3.5 px-4 text-slate-400">
                    <div>{s.sellerId}</div>
                    <div className="text-[10px] text-slate-500">{s.buyerId}</div>
                  </td>
                  <td className="py-3.5 px-4 font-bold text-slate-300">{formatCurrency(s.grossAmount)}</td>
                  <td className="py-3.5 px-4 font-bold text-emerald-400">{formatCurrency(s.netAmount)}</td>
                  <td className="py-3.5 px-4">
                    <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                      {s.status}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <button
                      onClick={() => onRelease(s.settlementId)}
                      disabled={isReleasing}
                      className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold transition-all shadow-md cursor-pointer disabled:opacity-50 flex items-center gap-1 ml-auto"
                    >
                      <CheckCircle className="h-3.5 w-3.5" />
                      <span>Release Payout</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
});

SettlementReleasePanel.displayName = "SettlementReleasePanel";
