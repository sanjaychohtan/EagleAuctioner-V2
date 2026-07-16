import React, { useEffect, useState, useRef, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useAuctionDetails } from "../hooks/useAuctionQueries";
import { useHighestBid, useBidHistory, usePlaceBidMutation } from "../hooks/useBidQueries";
import { useWebSocket, useWebSocketSubscription } from "../context/WebSocketContext";
import { useBidStore } from "../store/bidStore";
import { STOMP_DESTINATIONS } from "../constants/bidConstants";
import { AuctionState } from "../types/auction";
import { calculateNextMinimumBid, formatCurrency, isValidBidAmount } from "../utils/bidUtils";
import { handleApiError } from "../api/errorHandler";
import { useNotification } from "../providers/NotificationProvider";
import { 
  ArrowLeft, 
  Wifi, 
  WifiOff,
  Gavel, 
  ShieldAlert,
  Loader2,
  TrendingUp,
  Clock,
  History,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Info,
  Trophy,
  Zap,
  Target,
  ListOrdered
} from "lucide-react";
import { WebSocketAuctionEvent, AuctionEventType } from "../types/bid";
import { motion, AnimatePresence } from "motion/react";

export const LiveBidConsole: React.FC = () => {
  const { id: auctionId, lotId } = useParams<{ id: string; lotId: string }>();
  const navigate = useNavigate();
  const { user, hasRole } = useAuth();
  const { showNotification } = useNotification();
  
  const { data: auction, isLoading: isAuctionLoading, isError: isAuctionError, error: auctionError } = useAuctionDetails(auctionId || "");
  const { data: highestBidData, refetch: refetchHighestBid } = useHighestBid(lotId || "");
  const { data: bidHistoryData, refetch: refetchHistory } = useBidHistory(lotId || "");
  const placeBidMut = usePlaceBidMutation(lotId || "");
  
  const { isConnected } = useWebSocket();
  const { activeLots, recentEvents, addEvent, updateLotState, myProxyBids, setProxyBid } = useBidStore();

  const [bidAmount, setBidAmount] = useState<string>("");
  const [bidMode, setBidMode] = useState<"QUICK" | "PROXY">("QUICK");
  const [activeTab, setActiveTab] = useState<"TIMELINE" | "LEADERBOARD">("TIMELINE");
  const historyEndRef = useRef<HTMLDivElement>(null);

  // Sync highest bid data to store
  useEffect(() => {
    if (highestBidData && lotId) {
      updateLotState(lotId, { highestBid: highestBidData.bidAmount, currentWinner: highestBidData.bidderId });
    }
  }, [highestBidData, lotId, updateLotState]);

  // Handle WebSockets
  useWebSocketSubscription(
    lotId ? STOMP_DESTINATIONS.LOT_TOPIC(lotId) : null,
    (message: WebSocketAuctionEvent) => {
      addEvent(message);
      if (message.eventType === AuctionEventType.BID_PLACED || message.eventType === AuctionEventType.OUTBID) {
        refetchHighestBid();
        refetchHistory();
      }
    }
  );

  useEffect(() => {
    if (activeTab === "TIMELINE") {
      historyEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [bidHistoryData, recentEvents, activeTab]);

  const [timeRemaining, setTimeRemaining] = useState<string>("00:00:00");
  const [isClosed, setIsClosed] = useState(false);
  
  useEffect(() => {
    if (!auction?.auctionEnd) return;
    
    const interval = setInterval(() => {
      const now = new Date().getTime();
      const end = new Date(auction.auctionEnd).getTime();
      const distance = end - now;

      if (distance < 0) {
        setTimeRemaining("CLOSED");
        setIsClosed(true);
        clearInterval(interval);
        return;
      }

      const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((distance % (1000 * 60)) / 1000);

      setTimeRemaining(
        `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`
      );
    }, 1000);

    return () => clearInterval(interval);
  }, [auction?.auctionEnd]);

  if (isAuctionLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 font-mono text-xs text-slate-400">
        <Loader2 className="h-10 w-10 text-indigo-500 animate-spin mb-4" />
        <span>INITIALIZING SECURE BIDDING CONSOLE...</span>
      </div>
    );
  }

  if (isAuctionError || !auction || !lotId) {
    return (
      <div className="bg-rose-500/10 border border-rose-500/20 rounded-2xl p-6 text-center max-w-xl mx-auto text-rose-400 font-mono text-xs space-y-3">
        <ShieldAlert className="h-10 w-10 mx-auto text-rose-500" />
        <p className="font-bold uppercase">Connection Fault</p>
        <p className="text-slate-400">{auctionError instanceof Error ? auctionError.message : "Failed to load lot information."}</p>
        <button
          onClick={() => navigate(`/auctions/${auctionId}/live`)}
          className="px-4 py-2 bg-rose-950/40 hover:bg-rose-900/30 border border-rose-500/30 rounded-lg text-[10px] font-bold uppercase cursor-pointer"
        >
          Return to Dashboard
        </button>
      </div>
    );
  }

  const lot = auction.lots?.find((l) => l.id === lotId);
  if (!lot) {
    return (
      <div className="bg-rose-500/10 border border-rose-500/20 rounded-2xl p-6 text-center max-w-xl mx-auto text-rose-400 font-mono text-xs space-y-3">
        <AlertTriangle className="h-10 w-10 mx-auto text-rose-500" />
        <p className="font-bold uppercase">Lot Not Found</p>
        <p className="text-slate-400">The requested lot ID does not match any items in this campaign.</p>
        <button
          onClick={() => navigate(`/auctions/${auctionId}/live`)}
          className="px-4 py-2 bg-rose-950/40 hover:bg-rose-900/30 border border-rose-500/30 rounded-lg text-[10px] font-bold uppercase cursor-pointer"
        >
          Return to Dashboard
        </button>
      </div>
    );
  }

  const lotState = activeLots[lot.id];
  const currentHighest = lotState?.highestBid ?? highestBidData?.bidAmount ?? lot.startingPrice;
  const isWinning = lotState?.currentWinner === user?.id || highestBidData?.bidderId === user?.id;
  const minNextBid = calculateNextMinimumBid(lot.startingPrice, lot.minimumIncrement, currentHighest);
  const myProxyAmount = myProxyBids[lot.id];

  const canBid = hasRole("BIDDER") || hasRole("ROLE_BUYER");
  const isLive = auction.state === AuctionState.LIVE || auction.state === AuctionState.PUBLISHED;

  const handlePlaceBid = async () => {
    if (!canBid) return;
    const amount = parseFloat(bidAmount);
    if (isNaN(amount)) {
      showNotification("Invalid bid amount.", "error");
      return;
    }
    if (!isValidBidAmount(amount, lot.startingPrice, lot.minimumIncrement, currentHighest)) {
      showNotification(`Bid must be at least ${formatCurrency(minNextBid, lot.currency)}`, "error");
      return;
    }

    try {
      await placeBidMut.mutateAsync({ bidAmount: amount });
      showNotification(bidMode === "PROXY" ? "Proxy bid activated successfully." : "Bid placed successfully.", "success");
      
      if (bidMode === "PROXY") {
        setProxyBid(lot.id, amount);
      }
      setBidAmount("");
    } catch (err: any) {
      const friendly = handleApiError(err);
      showNotification(friendly.message, "error");
    }
  };

  const handleQuickBid = () => {
    if (bidMode === "PROXY") setBidMode("QUICK");
    setBidAmount(minNextBid.toString());
  };

  // Leaderboard Calculation
  const leaderboard = useMemo(() => {
    if (!bidHistoryData) return [];
    const map = new Map<string, number>();
    bidHistoryData.forEach((bid) => {
      if (bid.anonymousWinnerAfter) {
        const current = map.get(bid.anonymousWinnerAfter) || 0;
        if (bid.newHighestBid > current) {
          map.set(bid.anonymousWinnerAfter, bid.newHighestBid);
        }
      }
    });
    return Array.from(map.entries())
      .map(([alias, amount]) => ({ alias, amount }))
      .sort((a, b) => b.amount - a.amount);
  }, [bidHistoryData]);

  // Extension count
  const extensionCount = recentEvents.filter(e => e.eventType === AuctionEventType.AUTO_EXTENSION).length;

  return (
    <div className="space-y-6 max-w-7xl mx-auto font-mono text-xs animate-fadeIn pb-12">
      {/* 1. Header & Connectivity Banner */}
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 pb-5 border-b border-slate-800/40">
        <div className="flex items-start gap-3">
          <button
            onClick={() => navigate(`/auctions/${auctionId}/live`)}
            className="flex items-center justify-center p-2 rounded-xl border border-slate-800 hover:border-slate-700 bg-slate-900/40 text-slate-400 hover:text-white cursor-pointer transition-all mt-1"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] text-indigo-400 uppercase tracking-widest font-bold">Live Bid Console</span>
              <span className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[9px] font-bold border ${isConnected ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-rose-500/10 text-rose-400 border-rose-500/20 animate-pulse"}`}>
                {isConnected ? <Wifi className="h-2.5 w-2.5" /> : <WifiOff className="h-2.5 w-2.5" />}
                {isConnected ? "SECURE WS CONNECTED" : "RECONNECTING..."}
              </span>
            </div>
            <h2 className="text-xl font-bold text-white uppercase">{lot.lotNumber}: {lot.title}</h2>
            <p className="text-slate-400 text-[10px] mt-1">{lot.quantity} {lot.unitOfMeasure} • {lot.materialCategory}</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-4">
          <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-3 flex flex-col items-center min-w-[120px]">
            <span className="text-[9px] text-slate-500 uppercase tracking-wider mb-1">Time Remaining</span>
            <div className="flex items-center gap-1.5">
              <Clock className={`h-4 w-4 ${isClosed ? "text-rose-500" : "text-amber-400"}`} />
              <span className={`text-lg font-bold font-mono ${isClosed ? "text-rose-500" : "text-amber-400 animate-pulse"}`}>
                {timeRemaining}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Connection Loss / Extended Banners */}
      <AnimatePresence>
        {!isConnected && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="bg-rose-500/10 border border-rose-500/20 p-4 rounded-xl flex items-center gap-3 text-rose-400">
            <WifiOff className="h-5 w-5 animate-pulse" />
            <div>
              <p className="font-bold uppercase text-[11px]">Connection Interrupted</p>
              <p className="text-[10px] text-slate-300">Attempting to reconnect to live stream. Bids cannot be placed until connection is restored.</p>
            </div>
          </motion.div>
        )}
        {recentEvents.length > 0 && recentEvents[0].eventType === AuctionEventType.AUTO_EXTENSION && !isClosed && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="bg-indigo-500/10 border border-indigo-500/20 p-4 rounded-xl flex items-center gap-3 text-indigo-400">
            <Clock className="h-5 w-5 animate-pulse" />
            <div>
              <p className="font-bold uppercase text-[11px]">Anti-Sniping Protocol Triggered</p>
              <p className="text-[10px] text-slate-300">Auction extended due to late bid. Total Extensions: {extensionCount}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Bid Input & Status */}
        <div className="lg:col-span-2 space-y-6">
          
          {isClosed ? (
            <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-8 relative overflow-hidden text-center">
              <div className="absolute top-0 left-0 w-full h-1 bg-rose-500" />
              <Trophy className="h-12 w-12 mx-auto text-emerald-400 mb-4" />
              <h3 className="text-2xl font-bold text-white uppercase mb-2">Auction Closed</h3>
              <div className="inline-flex items-center gap-2 bg-emerald-500/10 text-emerald-400 px-4 py-2 rounded-xl border border-emerald-500/20 mb-6">
                <span className="text-[10px] uppercase font-bold tracking-wider">Winning Bid</span>
                <span className="text-lg font-bold">{formatCurrency(currentHighest, lot.currency)}</span>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-2xl mx-auto">
                <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-850">
                  <span className="block text-[9px] text-slate-500 uppercase mb-1">Total Bids</span>
                  <span className="text-sm font-bold text-white">{bidHistoryData?.length || 0}</span>
                </div>
                <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-850">
                  <span className="block text-[9px] text-slate-500 uppercase mb-1">Extensions</span>
                  <span className="text-sm font-bold text-white">{extensionCount}</span>
                </div>
                <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-850">
                  <span className="block text-[9px] text-slate-500 uppercase mb-1">Winner Alias</span>
                  <span className="text-sm font-bold text-white font-mono">{leaderboard[0]?.alias || "N/A"}</span>
                </div>
                <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-850">
                  <span className="block text-[9px] text-slate-500 uppercase mb-1">Avg Increment</span>
                  <span className="text-sm font-bold text-white">
                    {bidHistoryData && bidHistoryData.length > 1 ? 
                      formatCurrency((currentHighest - lot.startingPrice) / bidHistoryData.length, lot.currency) 
                      : formatCurrency(0, lot.currency)}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-slate-900/30 border border-slate-800 rounded-2xl p-6 relative overflow-hidden">
              {/* Status Background Glow */}
              <div className={`absolute top-0 left-0 w-full h-1 ${
                isWinning ? "bg-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.5)]" : 
                (currentHighest > lot.startingPrice ? "bg-rose-500 shadow-[0_0_20px_rgba(244,63,94,0.5)]" : "bg-indigo-500")
              }`} />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                <div>
                  <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold block mb-2">Highest Authorized Bid</span>
                  <div className="flex items-end gap-2">
                    <span className={`text-4xl font-bold tracking-tight ${isWinning ? "text-emerald-400" : "text-white"}`}>
                      {formatCurrency(currentHighest, lot.currency)}
                    </span>
                    <span className="text-sm text-slate-500 mb-1">{lot.currency}</span>
                  </div>
                  
                  {canBid && (
                    <div className="mt-4 flex flex-col gap-2">
                      {isWinning ? (
                        <span className="inline-flex items-center w-max gap-1.5 text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-lg border border-emerald-500/20 font-bold uppercase tracking-wider text-[10px]">
                          <CheckCircle className="h-3.5 w-3.5" />
                          You hold the winning rank
                        </span>
                      ) : (currentHighest > lot.startingPrice) ? (
                        <span className="inline-flex items-center w-max gap-1.5 text-rose-400 bg-rose-500/10 px-3 py-1 rounded-lg border border-rose-500/20 font-bold uppercase tracking-wider text-[10px]">
                          <XCircle className="h-3.5 w-3.5" />
                          You have been outbid
                        </span>
                      ) : null}

                      {myProxyAmount && myProxyAmount > currentHighest && (
                        <span className="inline-flex items-center w-max gap-1.5 text-indigo-400 bg-indigo-500/10 px-3 py-1 rounded-lg border border-indigo-500/20 font-bold uppercase tracking-wider text-[10px]">
                          <Target className="h-3.5 w-3.5" />
                          Auto Bid Active (Max: {formatCurrency(myProxyAmount, lot.currency)})
                        </span>
                      )}
                    </div>
                  )}
                </div>

                <div className="bg-slate-950/60 p-5 rounded-xl border border-slate-850">
                  <div className="flex gap-2 mb-4">
                    <button
                      onClick={() => setBidMode("QUICK")}
                      className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-[10px] font-bold uppercase tracking-wider rounded-lg transition-all ${
                        bidMode === "QUICK" 
                          ? "bg-slate-800 text-white border border-slate-700" 
                          : "bg-slate-900/50 text-slate-500 border border-slate-800 hover:text-slate-300"
                      }`}
                    >
                      <Zap className="h-3 w-3" />
                      Quick Bid
                    </button>
                    <button
                      onClick={() => setBidMode("PROXY")}
                      className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-[10px] font-bold uppercase tracking-wider rounded-lg transition-all ${
                        bidMode === "PROXY" 
                          ? "bg-indigo-600/20 text-indigo-400 border border-indigo-500/30" 
                          : "bg-slate-900/50 text-slate-500 border border-slate-800 hover:text-slate-300"
                      }`}
                    >
                      <Target className="h-3 w-3" />
                      Proxy Bid
                    </button>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="flex justify-between text-[10px]">
                      <span className="text-slate-400">
                        {bidMode === "PROXY" ? "Max Authorized Limit:" : "Minimum Next Bid:"}
                      </span>
                      <span className="font-bold text-indigo-400">{formatCurrency(minNextBid, lot.currency)}</span>
                    </div>
                    
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-bold">{lot.currency}</span>
                      <input
                        type="number"
                        value={bidAmount}
                        onChange={(e) => setBidAmount(e.target.value)}
                        placeholder={minNextBid.toString()}
                        className="w-full bg-slate-900 border border-slate-700 focus:border-indigo-500 rounded-lg py-3 pl-12 pr-4 text-white font-bold font-mono placeholder:text-slate-600 outline-none transition-all"
                        disabled={!canBid || !isLive || isClosed || !isConnected || placeBidMut.isPending}
                      />
                    </div>

                    <div className="flex gap-3">
                      {bidMode === "QUICK" && (
                        <button
                          onClick={handleQuickBid}
                          disabled={!canBid || !isLive || isClosed || !isConnected || placeBidMut.isPending}
                          className="flex-[1] px-3 py-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 disabled:opacity-50 text-white rounded-lg font-bold uppercase tracking-wider text-[10px] transition-all cursor-pointer"
                        >
                          Fill Min
                        </button>
                      )}
                      <button
                        onClick={handlePlaceBid}
                        disabled={!canBid || !isLive || isClosed || !isConnected || placeBidMut.isPending || !bidAmount}
                        className={`flex-[2] flex justify-center items-center gap-2 px-3 py-2.5 disabled:opacity-50 text-white rounded-lg font-bold uppercase tracking-wider text-[10px] transition-all cursor-pointer ${
                          bidMode === "PROXY" 
                            ? "bg-indigo-600 hover:bg-indigo-500 shadow shadow-indigo-600/20" 
                            : "bg-emerald-600 hover:bg-emerald-500 shadow shadow-emerald-600/20"
                        }`}
                      >
                        {placeBidMut.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Gavel className="h-3.5 w-3.5" />}
                        {bidMode === "PROXY" ? "Set Auto Bid" : "Submit Bid"}
                      </button>
                    </div>
                  </div>

                  {!canBid && (
                    <div className="mt-3 flex items-start gap-1.5 text-yellow-500/80 bg-yellow-500/10 p-2 rounded text-[9px]">
                      <AlertTriangle className="h-3 w-3 shrink-0 mt-0.5" />
                      <span>Your account roles restrict you from placing bids on this lot. Viewing only.</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
          
          {/* Rules / Configuration Summary */}
          <div className="bg-slate-900/30 border border-slate-800 rounded-2xl p-5">
            <div className="flex items-center gap-2 border-b border-slate-800/60 pb-3 mb-4 text-slate-200 uppercase tracking-wider">
              <Info className="h-4 w-4 text-purple-400" />
              <h3 className="font-bold">Lot Parameters</h3>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-slate-950/40 p-3 rounded-lg border border-slate-850">
                <span className="text-[9px] text-slate-500 uppercase block mb-1">Starting Price</span>
                <span className="font-bold text-slate-300">{formatCurrency(lot.startingPrice, lot.currency)}</span>
              </div>
              <div className="bg-slate-950/40 p-3 rounded-lg border border-slate-850">
                <span className="text-[9px] text-slate-500 uppercase block mb-1">Min Increment</span>
                <span className="font-bold text-slate-300">{formatCurrency(lot.minimumIncrement, lot.currency)}</span>
              </div>
              <div className="bg-slate-950/40 p-3 rounded-lg border border-slate-850">
                <span className="text-[9px] text-slate-500 uppercase block mb-1">Reserve</span>
                <span className="font-bold text-slate-300">{auction.reservePriceEnabled ? "ACTIVE" : "NONE"}</span>
              </div>
              <div className="bg-slate-950/40 p-3 rounded-lg border border-slate-850">
                <span className="text-[9px] text-slate-500 uppercase block mb-1">Auto-Extension</span>
                <span className="font-bold text-slate-300">{auction.autoExtensionEnabled ? `${auction.extensionMinutes} MIN` : "OFF"}</span>
              </div>
            </div>
          </div>

        </div>

        {/* Right Column: Bid History & Leaderboard */}
        <div className="bg-slate-900/30 border border-slate-800 rounded-2xl p-0 flex flex-col h-[600px] overflow-hidden">
          <div className="flex border-b border-slate-800/60 bg-slate-900/50">
            <button
              onClick={() => setActiveTab("TIMELINE")}
              className={`flex-1 flex items-center justify-center gap-2 py-4 uppercase text-[10px] font-bold tracking-wider border-b-2 transition-all ${
                activeTab === "TIMELINE" ? "border-indigo-500 text-indigo-400" : "border-transparent text-slate-500 hover:text-slate-300"
              }`}
            >
              <History className="h-4 w-4" />
              Live Timeline
            </button>
            <button
              onClick={() => setActiveTab("LEADERBOARD")}
              className={`flex-1 flex items-center justify-center gap-2 py-4 uppercase text-[10px] font-bold tracking-wider border-b-2 transition-all ${
                activeTab === "LEADERBOARD" ? "border-emerald-500 text-emerald-400" : "border-transparent text-slate-500 hover:text-slate-300"
              }`}
            >
              <ListOrdered className="h-4 w-4" />
              Leaderboard
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-5 custom-scrollbar">
            {activeTab === "TIMELINE" ? (
              <div className="space-y-3">
                {!bidHistoryData || bidHistoryData.length === 0 ? (
                  <div className="text-center text-slate-500 py-12">
                    <TrendingUp className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>No bids have been recorded yet.</p>
                  </div>
                ) : (
                  <AnimatePresence>
                    {bidHistoryData.map((bid, idx) => (
                      <motion.div 
                        key={`${bid.timestamp}-${idx}`}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="flex flex-col bg-slate-950/60 p-3 rounded-xl border border-slate-850"
                      >
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-[10px] text-slate-400">{new Date(bid.timestamp).toLocaleTimeString()}</span>
                          <span className="text-[9px] font-bold text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20 uppercase tracking-wider">
                            {bid.eventType.replace('_', ' ')}
                          </span>
                        </div>
                        <div className="flex justify-between items-end mt-1">
                          <div className="flex flex-col">
                            <span className="text-[9px] text-slate-500 uppercase">Bidder Code</span>
                            <span className="font-bold text-slate-300 font-mono text-[11px]">{bid.anonymousWinnerAfter || "ANON-0000"}</span>
                          </div>
                          <span className="text-sm font-bold text-emerald-400">{formatCurrency(bid.newHighestBid, lot.currency)}</span>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                )}
                <div ref={historyEndRef} />
              </div>
            ) : (
              <div className="space-y-3">
                {leaderboard.length === 0 ? (
                  <div className="text-center text-slate-500 py-12">
                    <Trophy className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>Leaderboard is empty.</p>
                  </div>
                ) : (
                  <AnimatePresence>
                    {leaderboard.map((bidder, idx) => (
                      <motion.div 
                        key={bidder.alias}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className={`flex items-center justify-between p-3 rounded-xl border ${
                          idx === 0 
                            ? "bg-emerald-500/10 border-emerald-500/30" 
                            : "bg-slate-950/60 border-slate-850"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span className={`flex items-center justify-center h-6 w-6 rounded-full text-[10px] font-bold ${
                            idx === 0 ? "bg-emerald-500 text-slate-900" : "bg-slate-800 text-slate-400"
                          }`}>
                            {idx + 1}
                          </span>
                          <span className={`font-mono text-[11px] font-bold ${idx === 0 ? "text-emerald-400" : "text-slate-300"}`}>
                            {bidder.alias}
                          </span>
                        </div>
                        <span className={`font-bold ${idx === 0 ? "text-emerald-400" : "text-white"}`}>
                          {formatCurrency(bidder.amount, lot.currency)}
                        </span>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
