import React, { memo } from "react";
import { Gavel, Target, Zap, ShieldAlert } from "lucide-react";
import { formatCurrency } from "../../utils/bidUtils";

interface BidControlsPanelProps {
  currentHighest: number;
  nextMinBid: number;
  bidAmount: string;
  setBidAmount: (val: string) => void;
  bidMode: "QUICK" | "PROXY";
  setBidMode: (mode: "QUICK" | "PROXY") => void;
  isClosed: boolean;
  isSubmitting: boolean;
  onPlaceBid: (e: React.FormEvent) => void;
  onQuickIncrement: (increment: number) => void;
}

export const BidControlsPanel: React.FC<BidControlsPanelProps> = memo(({
  currentHighest,
  nextMinBid,
  bidAmount,
  setBidAmount,
  bidMode,
  setBidMode,
  isClosed,
  isSubmitting,
  onPlaceBid,
  onQuickIncrement
}) => {
  return (
    <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl font-mono space-y-6">
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div>
          <span className="text-[10px] text-slate-500 uppercase font-bold">Minimum Next Valid Bid</span>
          <div className="text-2xl font-bold text-emerald-400">{formatCurrency(nextMinBid)}</div>
        </div>

        <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
          <button
            type="button"
            onClick={() => setBidMode("QUICK")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              bidMode === "QUICK" ? "bg-blue-600 text-white" : "text-slate-400 hover:text-white"
            }`}
          >
            Quick Bid
          </button>
          <button
            type="button"
            onClick={() => setBidMode("PROXY")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              bidMode === "PROXY" ? "bg-purple-600 text-white" : "text-slate-400 hover:text-white"
            }`}
          >
            Auto Proxy
          </button>
        </div>
      </div>

      <form onSubmit={onPlaceBid} className="space-y-4">
        <div>
          <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
            {bidMode === "QUICK" ? "Custom Bid Amount (INR)" : "Maximum Auto-Proxy Ceiling (INR)"}
          </label>
          <div className="relative">
            <span className="absolute left-3.5 top-3 text-slate-500 font-bold">₹</span>
            <input
              type="number"
              value={bidAmount}
              onChange={(e) => setBidAmount(e.target.value)}
              placeholder={nextMinBid.toString()}
              disabled={isClosed}
              required
              className="w-full pl-8 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white font-bold outline-none focus:border-blue-500 text-base"
            />
          </div>
        </div>

        {/* Quick Increment Pills */}
        <div className="grid grid-cols-3 gap-2">
          {[500, 1000, 5000].map((inc) => (
            <button
              key={inc}
              type="button"
              disabled={isClosed}
              onClick={() => onQuickIncrement(inc)}
              className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 transition-all cursor-pointer flex items-center justify-center gap-1"
            >
              <Zap className="h-3 w-3 text-amber-400" />
              <span>+{inc}</span>
            </button>
          ))}
        </div>

        <button
          type="submit"
          disabled={isClosed || isSubmitting}
          className={`w-full py-3.5 rounded-2xl text-white font-bold text-sm transition-all shadow-xl flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 ${
            bidMode === "QUICK" ? "bg-emerald-600 hover:bg-emerald-500 shadow-emerald-500/20" : "bg-purple-600 hover:bg-purple-500 shadow-purple-500/20"
          }`}
        >
          <Gavel className="h-5 w-5" />
          <span>{isSubmitting ? "Submitting Bid..." : isClosed ? "Auction Closed" : bidMode === "QUICK" ? "Submit Live Bid" : "Set Auto-Proxy Ceiling"}</span>
        </button>
      </form>
    </div>
  );
});

BidControlsPanel.displayName = "BidControlsPanel";
