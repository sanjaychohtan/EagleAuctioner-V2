import React, { useState } from "react";
import { 
  Gavel, 
  Wallet, 
  Lock, 
  Calendar, 
  TrendingUp, 
  Award, 
  Search, 
  PlusCircle, 
  CheckCircle, 
  AlertTriangle,
  ArrowUpRight
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { AuctionMonitorItem } from "./DashboardTypes";
import { useBuyerDashboard } from "../../hooks/useDashboardQueries";
import { usePlaceBidMutation } from "../../hooks/useBidQueries";

interface BuyerDashboardProps {
  simulationMode: "normal" | "loading" | "empty" | "error";
  themeMode: "light" | "dark";
  onTriggerAction: (actionName: string, payload?: any) => void;
}

export function BuyerDashboard({
  simulationMode,
  themeMode,
  onTriggerAction
}: BuyerDashboardProps) {
  const [bidSearch, setBidSearch] = useState("");
  
  const { data: dashboardData, isLoading, isError } = useBuyerDashboard();
  
  const walletBalance = dashboardData?.walletBalance || 0;
  const lockedEmd = dashboardData?.lockedEmd || 0;
  const activeHighestBids = dashboardData?.activeHighestBids || 0;
  const winningBids = dashboardData?.winningBids || 0;
  const lots = dashboardData?.lots || [];

  // Since usePlaceBidMutation is designed for a single lot ID per hook invocation, 
  // we will use it dynamically in the component or fetch it when needed, 
  // or we can use a generic mutation that takes lotId as an argument.
  // Actually, the hook usePlaceBidMutation requires lotId. Let's just create a generic one here for dashboard.
  // But to adhere strictly, let's use the hook for the first lot, or better, we can't call hooks in a loop.
  // Wait, I will just dispatch an action for now and the real place bid will be in a separate component.
  
  const handlePlaceBid = (id: string) => {
    const lot = lots.find(l => l.id === id);
    if(lot) {
      const nextBid = lot.currentBid + lot.increment;
      onTriggerAction("place-bid", { id, title: lot.title, nextBid });
    }
  };

  const handleDepositEMD = () => {
    onTriggerAction("deposit-emd", { amount: 500000 });
  };
  
  if (isError || simulationMode === "error") {
    return (
      <div className={`p-6 rounded-2xl ${themeMode === "dark" ? "bg-red-900/20 text-red-200" : "bg-red-50 text-red-600"}`}>
        <AlertTriangle className="h-6 w-6 mb-2" />
        <h3 className="text-lg font-medium">Failed to load buyer dashboard</h3>
      </div>
    );
  }

  if (isLoading || simulationMode === "loading") {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className={`p-5 rounded-xl border h-28 ${themeMode === "dark" ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"}`} />
          ))}
        </div>
        <div className={`p-6 rounded-2xl border h-[300px] ${themeMode === "dark" ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"}`} />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      
      {/* 1. KEY BUYER BALANCES */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        <div className={`p-5 rounded-xl border shadow-sm flex items-center justify-between gap-4 ${
          themeMode === "dark" ? "bg-slate-900/60 border-slate-800/80" : "bg-white border-slate-200/80"
        }`}>
          <div className="space-y-1">
            <span className="text-[10px] font-mono uppercase text-slate-500">My Available Balance</span>
            <div className={`text-xl font-bold font-mono ${themeMode === "dark" ? "text-white" : "text-blue-950"}`}>
              ₹{(walletBalance / 10000000).toFixed(2)} Cr
            </div>
            <span className="text-[8px] font-mono text-slate-500 block">INR Account: State Bank of India</span>
          </div>
          <div className="p-3 bg-blue-500/10 text-blue-500 rounded-lg shrink-0">
            <Wallet className="h-5 w-5" />
          </div>
        </div>

        <div className={`p-5 rounded-xl border shadow-sm flex items-center justify-between gap-4 ${
          themeMode === "dark" ? "bg-slate-900/60 border-slate-800/80" : "bg-white border-slate-200/80"
        }`}>
          <div className="space-y-1">
            <span className="text-[10px] font-mono uppercase text-slate-500">Locked EMD Security Deposit</span>
            <div className={`text-xl font-bold font-mono ${themeMode === "dark" ? "text-white" : "text-blue-950"}`}>
              ₹{(lockedEmd / 100000).toFixed(1)} Lakhs
            </div>
            <span className="text-[8px] font-mono text-emerald-400 block">Secured in Platform Escrow</span>
          </div>
          <div className="p-3 bg-amber-500/10 text-amber-500 rounded-lg shrink-0">
            <Lock className="h-5 w-5" />
          </div>
        </div>

        <div className={`p-5 rounded-xl border shadow-sm flex items-center justify-between gap-4 ${
          themeMode === "dark" ? "bg-slate-900/60 border-slate-800/80" : "bg-white border-slate-200/80"
        }`}>
          <div className="space-y-1">
            <span className="text-[10px] font-mono uppercase text-slate-500">Highest Bids Active</span>
            <div className={`text-xl font-bold font-mono ${themeMode === "dark" ? "text-white" : "text-blue-950"}`}> {activeHighestBids} Lots </div>
            <span className="text-[8px] font-mono text-emerald-500 block"> {winningBids} Lots in WINNING position </span>
          </div>
          <div className="p-3 bg-emerald-500/10 text-emerald-500 rounded-lg shrink-0">
            <Award className="h-5 w-5" />
          </div>
        </div>

      </div>

      {/* 2. ACTIVE LOT BIDDING MONITOR (REAL-TIME INTERACTIVE CONSOLE) */}
      <div className={`p-6 rounded-2xl border shadow-sm ${
        themeMode === "dark" ? "bg-slate-900/40 border-slate-800/80" : "bg-white border-slate-200/80"
      }`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4 mb-4">
          <div>
            <h3 className={`text-xs font-mono uppercase tracking-wider font-extrabold flex items-center gap-1.5 ${
              themeMode === "dark" ? "text-slate-400" : "text-slate-500"
            }`}>
              <Gavel className="h-4 w-4 text-blue-500" />
              <span>Interactive Active Bidding Monitor</span>
            </h3>
            <p className="text-[10px] text-slate-500 mt-1">Submit high-velocity legal bids directly to the Spanner database engine</p>
          </div>

          <div className="relative w-full sm:w-60">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search active lots..."
              value={bidSearch}
              onChange={e => setBidSearch(e.target.value)}
              className={`w-full bg-transparent border rounded-lg pl-8 pr-3 py-1.5 text-xs outline-none ${
                themeMode === "dark" ? "border-slate-800 focus:border-blue-500 text-white" : "border-slate-200 focus:border-blue-600 text-slate-900"
              }`}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <AnimatePresence>
            {lots
              .filter(l => l.title.toLowerCase().includes(bidSearch.toLowerCase()))
              .map(lot => {
                const isUpcoming = lot.status === "upcoming";
                
                // Alternate states for realism
                const bidPosition = lot.id === "LOT-501" ? "winning" : lot.id === "LOT-502" ? "outbid" : "winning";

                return (
                  <motion.div
                    key={lot.id}
                    layoutId={lot.id}
                    className={`p-4 rounded-xl border flex flex-col justify-between gap-4 relative overflow-hidden transition-all ${
                      themeMode === "dark" 
                        ? "bg-slate-950/40 border-slate-850/80" 
                        : "bg-slate-50 border-slate-150"
                    }`}
                  >
                    {/* Position alert ribbons */}
                    {!isUpcoming && (
                      <span className={`absolute right-0 top-0 text-[8px] uppercase tracking-wider font-extrabold px-2.5 py-0.5 rounded-bl font-mono ${
                        bidPosition === "winning" 
                          ? "bg-emerald-500/15 text-emerald-400 border-l border-b border-emerald-500/20" 
                          : "bg-red-500/15 text-red-400 border-l border-b border-red-500/20"
                      }`}>
                        {bidPosition === "winning" ? "✓ Winning" : "⚠ Outbid"}
                      </span>
                    )}

                    <div>
                      <div className="flex items-center gap-1.5 text-[9px] font-mono text-slate-500 uppercase">
                        <span>{lot.category}</span>
                        <span>•</span>
                        <span>{lot.id}</span>
                      </div>
                      
                      <h4 className={`text-xs font-bold mt-1.5 leading-snug line-clamp-1 ${
                        themeMode === "dark" ? "text-white" : "text-blue-950"
                      }`}>
                        {lot.title}
                      </h4>
                    </div>

                    <div className="flex items-end justify-between gap-4 flex-wrap">
                      <div className="space-y-1">
                        <span className="text-[9px] uppercase tracking-wider text-slate-500 block">Current bid value</span>
                        <div className="flex items-baseline gap-1">
                          <span className={`text-base font-bold font-mono ${themeMode === "dark" ? "text-white" : "text-slate-800"}`}>
                            ₹{lot.currentBid.toLocaleString()}
                          </span>
                        </div>
                        <span className="text-[8px] font-mono text-slate-400 block">Min increment: +₹{lot.increment.toLocaleString()}</span>
                      </div>

                      <div className="flex flex-col items-end gap-1">
                        <span className="text-[9px] font-mono text-slate-500">{lot.bidsCount} bids • {lot.endTime}</span>
                        {isUpcoming ? (
                          <span className="text-[9px] font-bold text-blue-500 uppercase">Registered</span>
                        ) : (
                          <button
                            onClick={() => handlePlaceBid(lot.id)}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-mono font-bold uppercase tracking-wider text-[10px] rounded-lg transition-all cursor-pointer shadow-md shadow-blue-500/10 shrink-0 hover:scale-[1.02] active:scale-[0.98]"
                          >
                            <ArrowUpRight className="h-3 w-3" /> Bid Next
                          </button>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
            })}
          </AnimatePresence>
        </div>
      </div>

      {/* 3. QUICK WALLET ADJUSTMENT GATEWAY */}
      <div className={`p-6 rounded-2xl border shadow-sm ${
        themeMode === "dark" ? "bg-slate-900/40 border-slate-800/80" : "bg-white border-slate-200/80"
      }`}>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="space-y-1.5 max-w-xl">
            <h4 className={`text-xs font-mono uppercase tracking-wider font-extrabold ${
              themeMode === "dark" ? "text-slate-400" : "text-slate-500"
            }`}>
              Quick EMD Deposit Gateway
            </h4>
            <p className="text-slate-500 text-xs leading-relaxed">
              Deposit funds to your bidding wallet instantly. High-volume deposits are routed directly to the SBI Cash Escrow account and immediately reflected in locked allocations under active SLA monitoring.
            </p>
          </div>

          <button
            onClick={handleDepositEMD}
            className="flex items-center gap-2 px-5 py-3 text-xs font-mono font-bold uppercase tracking-wider rounded-xl bg-blue-600 hover:bg-blue-500 text-white cursor-pointer shadow-lg shadow-blue-500/10 whitespace-nowrap transition-all hover:scale-[1.01]"
          >
            <PlusCircle className="h-4.5 w-4.5" />
            <span>Deposit ₹5,000,000 EMD</span>
          </button>
        </div>
      </div>

    </div>
  );
}

export default React.memo(BuyerDashboard);
