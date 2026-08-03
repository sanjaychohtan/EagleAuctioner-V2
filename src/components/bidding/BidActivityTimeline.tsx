import React, { memo } from "react";
import { History, Trophy, Clock } from "lucide-react";
import { formatCurrency } from "../../utils/bidUtils";

interface BidActivityTimelineProps {
  bidHistory: any[];
  activeTab: "TIMELINE" | "LEADERBOARD";
  setActiveTab: (tab: "TIMELINE" | "LEADERBOARD") => void;
  historyEndRef: React.RefObject<HTMLDivElement | null>;
  currency?: string;
}

export const BidActivityTimeline: React.FC<BidActivityTimelineProps> = memo(({
  bidHistory,
  activeTab,
  setActiveTab,
  historyEndRef,
  currency
}) => {
  return (
    <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl font-mono space-y-4">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <History className="h-4.5 w-4.5 text-blue-400" />
          <h3 className="text-sm font-bold text-white">Live Activity Stream</h3>
        </div>

        <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
          <button
            onClick={() => setActiveTab("TIMELINE")}
            className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
              activeTab === "TIMELINE" ? "bg-blue-600 text-white" : "text-slate-400 hover:text-white"
            }`}
          >
            History Feed
          </button>
          <button
            onClick={() => setActiveTab("LEADERBOARD")}
            className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
              activeTab === "LEADERBOARD" ? "bg-amber-600 text-white" : "text-slate-400 hover:text-white"
            }`}
          >
            Leaderboard
          </button>
        </div>
      </div>

      <div className="max-h-[350px] overflow-y-auto space-y-2.5 pr-1">
        {bidHistory.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-500 italic border border-dashed border-slate-800 rounded-xl">
            No bids placed yet. Be the first to bid!
          </div>
        ) : (
          bidHistory.map((item, idx) => (
            <div
              key={idx}
              className={`p-3 rounded-xl border flex items-center justify-between text-xs transition-colors ${
                idx === 0
                  ? "bg-amber-500/10 border-amber-500/30 text-amber-300"
                  : "bg-slate-950/60 border-slate-850 text-slate-300"
              }`}
            >
              <div className="flex items-center gap-2.5">
                {idx === 0 ? (
                  <Trophy className="h-4 w-4 text-amber-400 shrink-0" />
                ) : (
                  <Clock className="h-3.5 w-3.5 text-slate-500 shrink-0" />
                )}
                <div>
                  <span className="font-bold text-white block">{formatCurrency(item.bidAmount / 100, currency)}</span>
                  <span className="text-[10px] text-slate-400">{item.bidderName || "Anonymous Bidder"}</span>
                </div>
              </div>

              <span className="text-[10px] text-slate-500 font-bold">
                {new Date(item.timestamp || item.createdAt || Date.now()).toLocaleTimeString()}
              </span>
            </div>
          ))
        )}
        <div ref={historyEndRef} />
      </div>
    </div>
  );
});

BidActivityTimeline.displayName = "BidActivityTimeline";
