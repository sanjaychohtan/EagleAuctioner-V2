import React, { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useAuctionDetails } from "../hooks/useAuctionQueries";
import { useHighestBid, useBidHistory, usePlaceBidMutation } from "../hooks/useBidQueries";
import { useWebSocket, useWebSocketSubscription } from "../context/WebSocketContext";
import { useBidStore } from "../store/bidStore";
import { STOMP_DESTINATIONS } from "../constants/bidConstants";
import { calculateNextMinimumBid } from "../utils/bidUtils";
import { handleApiError } from "../api/errorHandler";
import { useNotification } from "../providers/NotificationProvider";
import { ArrowLeft, Wifi, WifiOff, Clock } from "lucide-react";
import { WebSocketAuctionEvent, AuctionEventType } from "../types/bid";

import { BidControlsPanel } from "../components/bidding/BidControlsPanel";
import { BidActivityTimeline } from "../components/bidding/BidActivityTimeline";

export const LiveBidConsole: React.FC = () => {
  const { id: auctionId, lotId } = useParams<{ id: string; lotId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showNotification } = useNotification();
  
  const { data: auction, isLoading: isAuctionLoading } = useAuctionDetails(auctionId || "");
  const { data: highestBidData, refetch: refetchHighestBid } = useHighestBid(lotId || "");
  const { data: bidHistoryData, refetch: refetchHistory } = useBidHistory(lotId || "");
  const placeBidMut = usePlaceBidMutation(lotId || "");
  
  const { isConnected } = useWebSocket();
  const { addEvent, updateLotState } = useBidStore();

  const [bidAmount, setBidAmount] = useState<string>("");
  const [bidMode, setBidMode] = useState<"QUICK" | "PROXY">("QUICK");
  const [activeTab, setActiveTab] = useState<"TIMELINE" | "LEADERBOARD">("TIMELINE");
  const historyEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (highestBidData && lotId) {
      updateLotState(lotId, { highestBid: highestBidData.bidAmount, currentWinner: highestBidData.bidderId });
    }
  }, [highestBidData, lotId, updateLotState]);

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
      setTimeRemaining(`${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`);
    }, 1000);
    return () => clearInterval(interval);
  }, [auction?.auctionEnd]);

  const currentHighest = highestBidData?.bidAmount || auction?.lots?.[0]?.startingPrice || 10000;
  const nextMinBid = calculateNextMinimumBid(currentHighest, 500);

  const handleQuickIncrement = (inc: number) => {
    setBidAmount((currentHighest + inc).toString());
  };

  const handlePlaceBid = async (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(bidAmount);
    if (isNaN(val) || val < nextMinBid) {
      showNotification(`Bid must be at least ₹${nextMinBid.toLocaleString()}`, "warning");
      return;
    }

    try {
      await placeBidMut.mutateAsync({ bidAmount: val });
      showNotification(`Successfully submitted bid of ₹${val.toLocaleString()}`, "success");
      setBidAmount("");
    } catch (err: any) {
      const friendly = handleApiError(err);
      showNotification(friendly.message, "error");
    }
  };

  if (isAuctionLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400 font-mono text-xs animate-pulse">
        Connecting to live bidding engine...
      </div>
    );
  }

  const historyList = (bidHistoryData as any[]) || [];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans p-6 space-y-6">
      {/* Top Console Bar */}
      <div className="max-w-7xl mx-auto flex items-center justify-between font-mono">
        <button
          onClick={() => navigate(-1)}
          className="px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 text-xs font-bold hover:text-white flex items-center gap-2 cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Lots</span>
        </button>

        <div className="flex items-center gap-4 text-xs font-bold">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800">
            <Clock className="h-4 w-4 text-amber-400" />
            <span className="text-amber-400">{timeRemaining}</span>
          </div>

          <div className={`px-3 py-1.5 rounded-xl border flex items-center gap-2 ${
            isConnected ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" : "bg-red-500/10 border-red-500/20 text-red-400"
          }`}>
            {isConnected ? <Wifi className="h-4 w-4" /> : <WifiOff className="h-4 w-4" />}
            <span>{isConnected ? "WEBSOCKET LIVE" : "DISCONNECTED"}</span>
          </div>
        </div>
      </div>

      {/* Main Console Layout */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-6 space-y-6">
          <BidControlsPanel
            currentHighest={currentHighest}
            nextMinBid={nextMinBid}
            bidAmount={bidAmount}
            setBidAmount={setBidAmount}
            bidMode={bidMode}
            setBidMode={setBidMode}
            isClosed={isClosed}
            isSubmitting={placeBidMut.isPending}
            onPlaceBid={handlePlaceBid}
            onQuickIncrement={handleQuickIncrement}
          />
        </div>

        <div className="lg:col-span-6 space-y-6">
          <BidActivityTimeline
            bidHistory={historyList}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            historyEndRef={historyEndRef}
          />
        </div>
      </div>
    </div>
  );
};

export default LiveBidConsole;
