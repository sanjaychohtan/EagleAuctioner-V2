import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuctionDetails } from "../hooks/useAuctionQueries";
import { 
  ArrowLeft, 
  Gavel,
  Package,
  DollarSign,
  AlertTriangle,
  Loader2,
  Clock,
  CheckCircle2
} from "lucide-react";

export const LotDetailsView: React.FC = () => {
  const { id: auctionId, lotId } = useParams<{ id: string; lotId: string }>();
  const navigate = useNavigate();

  const { data: auction, isLoading, isError } = useAuctionDetails(auctionId || "");

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 font-mono text-xs text-slate-400">
        <Loader2 className="h-10 w-10 text-indigo-500 animate-spin mb-4" />
        <span>DECRYPTING LOT SPECIFICATIONS...</span>
      </div>
    );
  }

  if (isError || !auction) {
    return (
      <div className="bg-rose-500/10 border border-rose-500/20 rounded-2xl p-6 text-center max-w-xl mx-auto text-rose-400 font-mono text-xs space-y-3">
        <AlertTriangle className="h-10 w-10 mx-auto text-rose-500" />
        <p className="font-bold uppercase">Record Retrieval Failure</p>
        <p className="text-slate-400">Failed to read auction details.</p>
        <button
          onClick={() => navigate("/auctions")}
          className="px-4 py-2 bg-rose-950/40 hover:bg-rose-900/30 border border-rose-500/30 rounded-lg text-[10px] font-bold uppercase cursor-pointer"
        >
          Back to RegistryRegistry
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
        <p className="text-slate-400">The requested lot does not exist in this campaign.</p>
        <button
          onClick={() => navigate(`/auctions/${auctionId}/lots`)}
          className="px-4 py-2 bg-rose-950/40 hover:bg-rose-900/30 border border-rose-500/30 rounded-lg text-[10px] font-bold uppercase cursor-pointer"
        >
          Return to Manifest
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto font-mono text-xs animate-fadeIn">
      {/* Back Header */}
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 pb-5 border-b border-slate-800/40">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(`/auctions/${auctionId}/lots`)}
            className="flex items-center justify-center p-2 rounded-xl border border-slate-800 hover:border-slate-700 bg-slate-900/40 text-slate-400 hover:text-white cursor-pointer transition-all mt-1"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">{lot.lotNumber}</span>
              <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold border tracking-wider ${
                lot.lotStatus === "SOLD"
                  ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                  : lot.lotStatus === "LIVE"
                  ? "bg-amber-500/10 text-amber-400 border-amber-500/20 animate-pulse"
                  : "bg-slate-950 text-slate-400 border-slate-800"
              }`}>
                {lot.lotStatus}
              </span>
            </div>
            <h2 className="text-lg font-bold text-white uppercase">{lot.title}</h2>
            <p className="text-xs text-slate-400 mt-1 max-w-2xl">{lot.description || "No supplemental descriptions attached to this lot."}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Side: Material & Details */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-slate-900/30 border border-slate-800/80 rounded-2xl p-5 space-y-5">
            <div className="flex items-center gap-2 border-b border-slate-800/50 pb-2.5 text-slate-200 uppercase tracking-wider">
              <Package className="h-4 w-4 text-emerald-400" />
              <h4 className="font-bold">Material Specifications</h4>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-3.5 bg-slate-950/60 border border-slate-850 rounded-xl space-y-1">
                <span className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider">Category</span>
                <span className="block font-semibold text-slate-200">{lot.materialCategory}</span>
              </div>
              <div className="p-3.5 bg-slate-950/60 border border-slate-850 rounded-xl space-y-1">
                <span className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider">Quantity</span>
                <span className="block font-semibold text-slate-200">{lot.quantity}</span>
              </div>
              <div className="p-3.5 bg-slate-950/60 border border-slate-850 rounded-xl space-y-1">
                <span className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider">Unit of Measure</span>
                <span className="block font-semibold text-slate-200">{lot.unitOfMeasure}</span>
              </div>
            </div>
          </div>
          
          {/* Winner Details if SOLD */}
          {lot.lotStatus === "SOLD" && lot.winnerBidderId && (
            <div className="bg-emerald-950/10 border border-emerald-500/20 rounded-2xl p-5 space-y-5">
              <div className="flex items-center gap-2 border-b border-emerald-900/50 pb-2.5 text-emerald-400 uppercase tracking-wider">
                <CheckCircle2 className="h-4 w-4" />
                <h4 className="font-bold">Award Information</h4>
              </div>
              <div className="flex flex-col gap-1 text-slate-300">
                <span className="text-[10px] text-slate-500">Winner ID</span>
                <span className="font-mono text-emerald-400">{lot.winnerBidderId}</span>
              </div>
            </div>
          )}
        </div>

        {/* Right Side: Commercial Details */}
        <div className="space-y-6">
          <div className="bg-slate-900/30 border border-slate-800/80 rounded-2xl p-5 space-y-5">
            <div className="flex items-center gap-2 border-b border-slate-800/50 pb-2.5 text-slate-200 uppercase tracking-wider">
              <DollarSign className="h-4 w-4 text-amber-400" />
              <h4 className="font-bold">Commercial Terms</h4>
            </div>

            <div className="space-y-3.5 divide-y divide-slate-800/40">
              <div className="flex justify-between items-center py-1">
                <span className="text-slate-500">Starting Price</span>
                <span className="text-slate-200 font-semibold">{lot.startingPrice.toLocaleString()} {lot.currency}</span>
              </div>
              <div className="flex justify-between items-center pt-2.5">
                <span className="text-slate-500">Reserve Price</span>
                <span className="text-slate-200 font-semibold">
                  {lot.reservePrice ? `${lot.reservePrice.toLocaleString()} ${lot.currency}` : "NOT SET"}
                </span>
              </div>
              <div className="flex justify-between items-center pt-2.5">
                <span className="text-slate-500">Min. Increment</span>
                <span className="text-slate-200 font-semibold">{lot.minimumIncrement.toLocaleString()} {lot.currency}</span>
              </div>
              <div className="flex justify-between items-center pt-2.5">
                <span className="text-slate-500">Current Highest Bid</span>
                <span className="text-emerald-400 font-semibold">
                  {lot.currentHighestBid ? `${lot.currentHighestBid.toLocaleString()} ${lot.currency}` : "NO BIDS"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LotDetailsView;
