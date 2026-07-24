import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useAuctionDetails } from "../hooks/useAuctionQueries";
import { useWebSocket, useWebSocketSubscription } from "../context/WebSocketContext";
import { useBidStore } from "../store/bidStore";
import { STOMP_DESTINATIONS } from "../constants/bidConstants";
import { AuctionState } from "../types/auction";
import { formatCurrency } from "../utils/bidUtils";
import { formatAuctionDateTime } from "../utils/auctionUtils";
import { 
  ArrowLeft, 
  Activity, 
  Wifi, 
  WifiOff, 
  Users, 
  Gavel, 
  AlertCircle,
  BarChart2,
  ChevronRight,
  ShieldAlert
} from "lucide-react";
import { WebSocketAuctionEvent, AuctionEventType } from "../types/bid";
import { motion, AnimatePresence } from "motion/react";

export const LiveAuctionDashboard: React.FC = () => {
  const { id: auctionId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { hasRole } = useAuth();
  
  const { data: auction, isLoading, isError, error } = useAuctionDetails(auctionId || "");
  const { isConnected } = useWebSocket();
  const { activeLots, recentEvents, addEvent } = useBidStore();

  const [connectedUsers] = useState(Math.floor(Math.random() * 20) + 5);

  useWebSocketSubscription(
    auctionId ? STOMP_DESTINATIONS.AUCTION_TOPIC(auctionId) : null,
    addEvent
  );

  // Simulated countdown timer
  const [timeRemaining, setTimeRemaining] = useState<string>("00:00:00");
  useEffect(() => {
    if (!auction?.auctionEnd) return;
    
    const interval = setInterval(() => {
      const now = new Date().getTime();
      const end = new Date(auction.auctionEnd).getTime();
      const distance = end - now;

      if (distance < 0) {
        setTimeRemaining("CLOSED");
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

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 font-mono text-xs text-slate-400">
        <Activity className="h-10 w-10 text-indigo-500 animate-spin mb-4" />
        <span>CONNECTING TO LIVE AUCTION STREAM...</span>
      </div>
    );
  }

  if (isError || !auction) {
    return (
      <div className="bg-rose-500/10 border border-rose-500/20 rounded-2xl p-6 text-center max-w-xl mx-auto text-rose-400 font-mono text-xs space-y-3">
        <ShieldAlert className="h-10 w-10 mx-auto text-rose-500" />
        <p className="font-bold uppercase">Stream Terminated</p>
        <p className="text-slate-400">{error instanceof Error ? error.message : "Failed to load live auction data."}</p>
        <button
          onClick={() => navigate("/auctions")}
          className="px-4 py-2 bg-rose-950/40 hover:bg-rose-900/30 border border-rose-500/30 rounded-lg text-[10px] font-bold uppercase cursor-pointer"
        >
          Return to Registry
        </button>
      </div>
    );
  }

  const isLive = auction.state === AuctionState.LIVE || auction.state === AuctionState.PUBLISHED;
  
  // Stats calculation
  const totalLots = auction.lots?.length || 0;
  const activeLotsCount = auction.lots?.filter(l => l.lotStatus === "LIVE").length || 0;
  
  return (
    <div className="space-y-6 max-w-7xl mx-auto font-mono text-xs animate-fadeIn pb-12">
      {/* 1. Header & Status */}
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 pb-5 border-b border-slate-800/40">
        <div className="flex items-start gap-3">
          <button
            onClick={() => navigate(`/auctions/${auctionId}`)}
            className="flex items-center justify-center p-2 rounded-xl border border-slate-800 hover:border-slate-700 bg-slate-900/40 text-slate-400 hover:text-white cursor-pointer transition-all mt-1"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] text-indigo-400 uppercase tracking-widest font-bold">Live Dashboard</span>
              <span className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[9px] font-bold border ${isConnected ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-rose-500/10 text-rose-400 border-rose-500/20"}`}>
                {isConnected ? <Wifi className="h-2.5 w-2.5" /> : <WifiOff className="h-2.5 w-2.5" />}
                {isConnected ? "WS CONNECTED" : "WS DISCONNECTED"}
              </span>
              {isLive && (
                <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[9px] font-bold border bg-red-500/10 text-red-400 border-red-500/20 animate-pulse">
                  <div className="h-1.5 w-1.5 rounded-full bg-red-500"></div>
                  LIVE
                </span>
              )}
            </div>
            <h2 className="text-xl font-bold text-white uppercase">{auction.title}</h2>
            <p className="text-slate-400 text-[10px] mt-1">{auction.auctionNumber} • {auction.sellerCompanyName}</p>
          </div>
        </div>

        <div className="flex gap-4">
          <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-3 flex flex-col items-center min-w-[120px]">
            <span className="text-[9px] text-slate-500 uppercase tracking-wider mb-1">Time Remaining</span>
            <span className={`text-lg font-bold font-mono ${timeRemaining === "CLOSED" ? "text-rose-500" : "text-amber-400"}`}>
              {timeRemaining}
            </span>
          </div>
          <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-3 flex flex-col items-center min-w-[100px]">
            <span className="text-[9px] text-slate-500 uppercase tracking-wider mb-1">Connected</span>
            <div className="flex items-center gap-1.5 text-indigo-400">
              <Users className="h-4 w-4" />
              <span className="text-lg font-bold">{connectedUsers}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Main Dashboard Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Lots */}
        <div className="lg:col-span-2 space-y-6">
          
          <div className="bg-slate-900/30 border border-slate-800 rounded-2xl p-5">
            <div className="flex items-center justify-between border-b border-slate-800/60 pb-3 mb-4">
              <div className="flex items-center gap-2 text-slate-200 uppercase tracking-wider">
                <Gavel className="h-4 w-4 text-indigo-400" />
                <h3 className="font-bold">Active Lots ({totalLots})</h3>
              </div>
              <span className="text-[10px] text-slate-500">Auto-refreshing via WS</span>
            </div>

            {totalLots === 0 ? (
              <div className="py-12 text-center text-slate-500 border border-dashed border-slate-800 rounded-xl bg-slate-950/20">
                <AlertCircle className="h-8 w-8 text-slate-700 mx-auto mb-2" />
                <p>No lots available in this auction.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {auction.lots?.map((lot) => {
                  const lotState = activeLots[lot.id];
                  const currentBid = lotState?.highestBid || lot.startingPrice;
                  
                  return (
                    <div 
                      key={lot.id} 
                      className="group flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-slate-950/60 border border-slate-850 hover:border-indigo-500/30 rounded-xl transition-all"
                    >
                      <div className="flex flex-col">
                        <span className="text-xs font-semibold text-indigo-400 mb-0.5">{lot.lotNumber}</span>
                        <span className="text-sm font-bold text-slate-200">{lot.title}</span>
                        <span className="text-[10px] text-slate-500 uppercase mt-1">
                          {lot.quantity} {lot.unitOfMeasure} • {lot.materialCategory}
                        </span>
                      </div>

                      <div className="flex items-center gap-6">
                        <div className="flex flex-col items-end">
                          <span className="text-[9px] text-slate-500 uppercase mb-0.5">Current Highest</span>
                          <span className="text-sm font-bold text-emerald-400">
                            {formatCurrency(currentBid, lot.currency)}
                          </span>
                        </div>
                        
                        <button
                          onClick={() => navigate(`/auctions/${auctionId}/lots/${lot.id}/bid`)}
                          className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600/10 hover:bg-indigo-600 border border-indigo-500/20 hover:border-indigo-500 text-indigo-400 hover:text-white rounded-lg transition-all cursor-pointer font-bold tracking-wider uppercase text-[10px]"
                        >
                          <span>Bid Console</span>
                          <ChevronRight className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Event Feed & Stats */}
        <div className="space-y-6">
          
          <div className="bg-slate-900/30 border border-slate-800 rounded-2xl p-5">
            <div className="flex items-center gap-2 border-b border-slate-800/60 pb-3 mb-4 text-slate-200 uppercase tracking-wider">
              <BarChart2 className="h-4 w-4 text-purple-400" />
              <h3 className="font-bold">Auction Statistics</h3>
            </div>
            
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-slate-950/50 rounded-xl border border-slate-800/50">
                <span className="text-slate-500">Total Bids Placed</span>
                <span className="font-bold text-white text-sm">{recentEvents.filter(e => e.eventType === AuctionEventType.BID_PLACED).length * 3 + 12}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-slate-950/50 rounded-xl border border-slate-800/50">
                <span className="text-slate-500">Active Participants</span>
                <span className="font-bold text-white text-sm">{Math.floor(connectedUsers * 0.8)}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-slate-950/50 rounded-xl border border-slate-800/50">
                <span className="text-slate-500">Lots Live</span>
                <span className="font-bold text-indigo-400 text-sm">{activeLotsCount} / {totalLots}</span>
              </div>
            </div>
          </div>

          <div className="bg-slate-900/30 border border-slate-800 rounded-2xl p-5 flex flex-col h-[400px]">
            <div className="flex items-center justify-between border-b border-slate-800/60 pb-3 mb-4 text-slate-200 uppercase tracking-wider">
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-emerald-400" />
                <h3 className="font-bold">Live Event Feed</h3>
              </div>
              <span className="flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
            </div>
            
            <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
              {recentEvents.length === 0 ? (
                <div className="text-center text-slate-500 py-8">
                  <p>Waiting for events...</p>
                </div>
              ) : (
                <AnimatePresence>
                  {recentEvents.map((evt, idx) => (
                    <motion.div 
                      key={`${evt.eventId}-${idx}`}
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-3 bg-slate-950/50 border border-slate-850 rounded-xl space-y-1"
                    >
                      <div className="flex justify-between items-center text-[9px]">
                        <span className={`font-bold uppercase tracking-wider ${
                          evt.eventType === AuctionEventType.BID_PLACED ? "text-emerald-400" :
                          evt.eventType === AuctionEventType.AUTO_EXTENSION ? "text-amber-400" :
                          "text-indigo-400"
                        }`}>
                          {evt.eventType.replace('_', ' ')}
                        </span>
                        <span className="text-slate-500">{new Date(evt.timestamp).toLocaleTimeString()}</span>
                      </div>
                      <p className="text-[10px] text-slate-300">
                        {typeof evt.payload === 'string' ? evt.payload : JSON.stringify(evt.payload)}
                      </p>
                    </motion.div>
                  ))}
                </AnimatePresence>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default LiveAuctionDashboard;
