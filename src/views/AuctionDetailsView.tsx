import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { 
  useAuctionDetails,
  useSubmitForReviewMutation,
  useApproveAuctionMutation,
  useRejectAuctionMutation,
  usePublishAuctionMutation,
  useCancelAuctionMutation,
  useArchiveAuctionMutation
} from "../hooks/useAuctionQueries";
import { getAuctionStatusConfig, formatAuctionDateTime } from "../utils/auctionUtils";
import { AuctionState, AuctionType, AuctionVisibility } from "../types/auction";
import { useNotification } from "../providers/NotificationProvider";
import { handleApiError } from "../api/errorHandler";
import { 
  ArrowLeft, 
  Edit3, 
  Settings, 
  Send, 
  CheckCircle2, 
  XCircle, 
  VolumeX, 
  Archive, 
  Calendar, 
  Users, 
  Sliders, 
  Coins, 
  Gavel, 
  Compass, 
  Clock, 
  Loader2,
  ShieldAlert,
  AlertCircle
} from "lucide-react";

export const AuctionDetailsView: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, hasRole } = useAuth();
  const { showNotification } = useNotification();

  // Load details
  const { data: auction, isLoading, isError, error, refetch } = useAuctionDetails(id || "");

  // Mutations
  const submitReviewMut = useSubmitForReviewMutation();
  const approveMut = useApproveAuctionMutation();
  const rejectMut = useRejectAuctionMutation();
  const publishMut = usePublishAuctionMutation();
  const cancelMut = useCancelAuctionMutation();
  const archiveMut = useArchiveAuctionMutation();

  const isSeller = hasRole("SELLER");
  const isAdmin = hasRole("ADMIN");

  const handleAction = async (actionName: string, mutationFn: () => Promise<any>) => {
    try {
      await mutationFn();
      showNotification(`State transition [${actionName}] completed successfully.`, "success");
      refetch();
    } catch (err: any) {
      const friendly = handleApiError(err);
      showNotification(friendly.message, "error");
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 font-mono text-xs text-slate-400" id="details-loading">
        <Loader2 className="h-10 w-10 text-indigo-500 animate-spin mb-4" />
        <span>RECONSTRUCTING ENTERPRISE SPECIFICATION DATASET...</span>
      </div>
    );
  }

  if (isError || !auction) {
    return (
      <div className="bg-rose-500/10 border border-rose-500/20 rounded-2xl p-6 text-center max-w-xl mx-auto text-rose-400 font-mono text-xs space-y-3" id="details-error">
        <ShieldAlert className="h-10 w-10 mx-auto text-rose-500" />
        <p className="font-bold uppercase">Handshake Session Terminated</p>
        <p className="text-slate-400">{error instanceof Error ? error.message : "The secure backend API layer did not respond."}</p>
        <button
          onClick={() => navigate("/auctions")}
          className="px-4 py-2 bg-rose-950/40 hover:bg-rose-900/30 border border-rose-500/30 rounded-lg text-[10px] font-bold uppercase cursor-pointer"
        >
          Return to Registry
        </button>
      </div>
    );
  }

  const statusConfig = getAuctionStatusConfig(auction.state);

  return (
    <div className="space-y-6 animate-fadeIn" id="auction-details-view-root">
      
      {/* 1. CRITICAL CONSOLE META HEADER */}
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 pb-5 border-b border-slate-800/40">
        <div className="flex items-start gap-3">
          <button
            onClick={() => navigate("/auctions")}
            className="flex items-center justify-center p-2 rounded-xl border border-slate-800 hover:border-slate-700 bg-slate-900/40 text-slate-400 hover:text-white cursor-pointer transition-all mt-1"
            id="btn-details-back"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <span className="text-xs font-bold font-mono text-indigo-400 uppercase tracking-widest">{auction.auctionNumber}</span>
              <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold border font-mono tracking-wider ${statusConfig.badgeClass}`}>
                {statusConfig.label}
              </span>
              <span className={`px-2.5 py-0.5 rounded-md text-[9px] font-bold font-mono tracking-wide ${
                auction.auctionType === AuctionType.FORWARD 
                  ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" 
                  : "bg-blue-500/10 text-blue-400 border border-blue-500/20"
              }`}>
                {auction.auctionType === AuctionType.FORWARD ? "FORWARD MODEL" : "REVERSE MODEL"}
              </span>
            </div>
            <h2 className="text-lg font-bold font-mono text-white uppercase">{auction.title}</h2>
            <p className="text-xs text-slate-400 mt-1 max-w-2xl">{auction.description || "No supplemental descriptions attached to this campaign draft."}</p>
          </div>
        </div>

        {/* WORKFLOW CONTROLS ACTIONS PANEL */}
        <div className="flex flex-wrap items-center gap-2 font-mono text-xs" id="workflow-actions-panel">
          
          {/* Seller Draft Controls */}
          {isSeller && auction.state === AuctionState.DRAFT && (
            <>
              <button
                onClick={() => navigate(`/auctions/${auction.id}/edit`)}
                className="flex items-center gap-1.5 px-3.5 py-2.5 bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
                id="btn-edit-specs"
              >
                <Edit3 className="h-4 w-4 text-indigo-400" />
                <span>Specs</span>
              </button>

              <button
                onClick={() => navigate(`/auctions/${auction.id}/settings`)}
                className="flex items-center gap-1.5 px-3.5 py-2.5 bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
                id="btn-edit-rules"
              >
                <Settings className="h-4 w-4 text-purple-400" />
                <span>Rules</span>
              </button>

              <button
                onClick={() => handleAction("Submit for Audit", () => submitReviewMut.mutateAsync(auction.id))}
                disabled={submitReviewMut.isPending}
                className="flex items-center gap-1.5 px-4.5 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold uppercase tracking-wider shadow shadow-indigo-600/10 cursor-pointer transition-all"
                id="btn-submit-audit"
              >
                <Send className="h-3.5 w-3.5" />
                <span>Submit Audit</span>
              </button>
            </>
          )}

          {/* Admin Review Controls */}
          {isAdmin && auction.state === AuctionState.UNDER_REVIEW && (
            <>
              <button
                onClick={() => handleAction("Reject Campaign", () => rejectMut.mutateAsync(auction.id))}
                disabled={rejectMut.isPending}
                className="flex items-center gap-1.5 px-4.5 py-2.5 bg-rose-950/40 border border-rose-500/30 hover:bg-rose-900/30 text-rose-400 rounded-xl text-xs font-bold uppercase tracking-wider cursor-pointer transition-all"
                id="btn-reject-campaign"
              >
                <XCircle className="h-4 w-4" />
                <span>Reject</span>
              </button>

              <button
                onClick={() => handleAction("Approve Campaign", () => approveMut.mutateAsync(auction.id))}
                disabled={approveMut.isPending}
                className="flex items-center gap-1.5 px-4.5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold uppercase tracking-wider cursor-pointer transition-all"
                id="btn-approve-campaign"
              >
                <CheckCircle2 className="h-4 w-4" />
                <span>Approve</span>
              </button>
            </>
          )}

          {/* Live Dashboard (All Roles) */}
          {(auction.state === AuctionState.LIVE || auction.state === AuctionState.PUBLISHED || auction.state === AuctionState.ENDED) && (
            <button
              onClick={() => navigate(`/auctions/${auction.id}/live`)}
              className="flex items-center gap-1.5 px-4.5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold uppercase tracking-wider shadow shadow-indigo-600/10 cursor-pointer transition-all"
              id="btn-live-dashboard"
            >
              <Users className="h-4 w-4 animate-pulse" />
              <span>Live Dashboard</span>
            </button>
          )}

          {/* Seller Approved -> Publish Live */}
          {isSeller && auction.state === AuctionState.APPROVED && (
            <button
              onClick={() => handleAction("Publish Live", () => publishMut.mutateAsync(auction.id))}
              disabled={publishMut.isPending}
              className="flex items-center gap-1.5 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold uppercase tracking-wider shadow shadow-emerald-600/15 cursor-pointer transition-all"
              id="btn-publish-live"
            >
              <Compass className="h-4 w-4 animate-pulse" />
              <span>Publish Live</span>
            </button>
          )}

          {/* Seller Live/Published -> Cancel Campaign */}
          {isSeller && (auction.state === AuctionState.PUBLISHED || auction.state === AuctionState.LIVE) && (
            <button
              onClick={() => handleAction("Cancel Campaign", () => cancelMut.mutateAsync(auction.id))}
              disabled={cancelMut.isPending}
              className="flex items-center gap-1.5 px-4 py-2.5 bg-rose-950/40 border border-rose-500/30 hover:bg-rose-900/30 text-rose-400 rounded-xl text-xs font-bold uppercase tracking-wider cursor-pointer transition-all"
              id="btn-cancel-campaign"
            >
              <VolumeX className="h-4 w-4" />
              <span>Cancel Campaign</span>
            </button>
          )}

          {/* Seller Ended/Cancelled -> Archive */}
          {isSeller && (auction.state === AuctionState.ENDED || auction.state === AuctionState.CANCELLED) && (
            <button
              onClick={() => handleAction("Archive Campaign", () => archiveMut.mutateAsync(auction.id))}
              disabled={archiveMut.isPending}
              className="flex items-center gap-1.5 px-4 py-2.5 bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 rounded-xl text-xs font-bold uppercase tracking-wider cursor-pointer transition-all"
              id="btn-archive-campaign"
            >
              <Archive className="h-4 w-4 text-amber-500" />
              <span>Archive Record</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. SPECIFICATIONS DETAILED BENTO GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Bento: Timelines & Schedules */}
        <div className="lg:col-span-2 bg-slate-900/30 border border-slate-800/80 rounded-2xl p-5 space-y-5 font-mono text-xs">
          <div className="flex items-center gap-2 border-b border-slate-800/50 pb-2.5 text-slate-200 uppercase tracking-wider">
            <Calendar className="h-4 w-4 text-indigo-400" />
            <h4 className="font-bold">Execution Timelines & Handshake Windows</h4>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Registration start/end */}
            <div className="p-3.5 bg-slate-950/60 border border-slate-850 rounded-xl space-y-1.5">
              <span className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider">KYC Registration Window</span>
              <div className="flex items-center gap-2 text-slate-300">
                <Clock className="h-3.5 w-3.5 text-slate-500" />
                <span className="font-semibold text-xs">Open:</span>
                <span className="text-[11px] text-slate-400">{formatAuctionDateTime(auction.registrationStart)}</span>
              </div>
              <div className="flex items-center gap-2 text-slate-300">
                <Clock className="h-3.5 w-3.5 text-slate-500" />
                <span className="font-semibold text-xs">Close:</span>
                <span className="text-[11px] text-slate-400">{formatAuctionDateTime(auction.registrationEnd)}</span>
              </div>
            </div>

            {/* Inspection start/end */}
            <div className="p-3.5 bg-slate-950/60 border border-slate-850 rounded-xl space-y-1.5">
              <span className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider">Material Inspection Schedule</span>
              {auction.inspectionStart ? (
                <>
                  <div className="flex items-center gap-2 text-slate-300">
                    <Clock className="h-3.5 w-3.5 text-slate-500" />
                    <span className="font-semibold text-xs">Open:</span>
                    <span className="text-[11px] text-slate-400">{formatAuctionDateTime(auction.inspectionStart)}</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-300">
                    <Clock className="h-3.5 w-3.5 text-slate-500" />
                    <span className="font-semibold text-xs">Close:</span>
                    <span className="text-[11px] text-slate-400">{formatAuctionDateTime(auction.inspectionEnd)}</span>
                  </div>
                </>
              ) : (
                <div className="flex items-center gap-1.5 py-2.5 text-slate-600">
                  <AlertCircle className="h-3.5 w-3.5" />
                  <span>No physical site inspection windows configured.</span>
                </div>
              )}
            </div>

            {/* Bidding window start/end */}
            <div className="md:col-span-2 p-4 bg-indigo-950/10 border border-indigo-500/10 rounded-xl space-y-2">
              <span className="block text-[9px] font-bold text-indigo-400 uppercase tracking-wider">Active Bidding Campaign Horizon</span>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                <div className="flex items-center gap-2 text-slate-300">
                  <Clock className="h-3.5 w-3.5 text-indigo-400" />
                  <span className="font-semibold text-xs text-indigo-300">Commencement:</span>
                  <span className="text-[11px] text-slate-200">{formatAuctionDateTime(auction.auctionStart)}</span>
                </div>
                <div className="flex items-center gap-2 text-slate-300">
                  <Clock className="h-3.5 w-3.5 text-indigo-400" />
                  <span className="font-semibold text-xs text-indigo-300">Settlement Limit:</span>
                  <span className="text-[11px] text-slate-200">{formatAuctionDateTime(auction.auctionEnd)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Bento: Corporate Parameters */}
        <div className="bg-slate-900/30 border border-slate-800/80 rounded-2xl p-5 space-y-5 font-mono text-xs">
          <div className="flex items-center gap-2 border-b border-slate-800/50 pb-2.5 text-slate-200 uppercase tracking-wider">
            <Sliders className="h-4 w-4 text-purple-400" />
            <h4 className="font-bold">Configuration Parameters</h4>
          </div>

          <div className="space-y-3.5 divide-y divide-slate-800/40">
            <div className="flex justify-between items-center py-1">
              <span className="text-slate-500">Corporate Originator</span>
              <span className="text-slate-200 font-semibold">{auction.sellerCompanyName || "Eagle Seller Corp"}</span>
            </div>
            <div className="flex justify-between items-center pt-2.5">
              <span className="text-slate-500">Corporate Shell Code</span>
              <span className="text-[10px] text-indigo-400 font-semibold truncate max-w-[150px]" title={auction.sellerProfileId}>
                {auction.sellerProfileId}
              </span>
            </div>
            <div className="flex justify-between items-center pt-2.5">
              <span className="text-slate-500">Audit Active Zone</span>
              <span className="text-slate-200">{auction.timezone}</span>
            </div>
            <div className="flex justify-between items-center pt-2.5">
              <span className="text-slate-500">Settlement Currency</span>
              <span className="text-slate-200 font-semibold">{auction.currency}</span>
            </div>
            <div className="flex justify-between items-center pt-2.5">
              <span className="text-slate-500">Reserve Pricing Guard</span>
              <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                auction.reservePriceEnabled 
                  ? "bg-amber-500/10 text-amber-400 border border-amber-500/20" 
                  : "bg-slate-950 text-slate-600 border border-slate-850"
              }`}>
                {auction.reservePriceEnabled ? "ENABLED" : "DISABLED"}
              </span>
            </div>
            <div className="flex justify-between items-center pt-2.5">
              <span className="text-slate-500">Overtime Trigger</span>
              <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                auction.autoExtensionEnabled 
                  ? "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20" 
                  : "bg-slate-950 text-slate-600 border border-slate-850"
              }`}>
                {auction.autoExtensionEnabled ? `ACTIVE (${auction.extensionMinutes} MIN)` : "INACTIVE"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. NESTED RULES & SETTINGS SHEET IF POPULATED */}
      {auction.settings && (
        <div className="bg-slate-900/30 border border-slate-800 rounded-2xl p-5 space-y-4 font-mono text-xs" id="auction-settings-overview">
          <div className="flex items-center justify-between border-b border-slate-800/60 pb-2.5">
            <div className="flex items-center gap-2 text-slate-200 uppercase tracking-wider">
              <Coins className="h-4 w-4 text-emerald-400" />
              <h4 className="font-bold">Configured Business Rules Sheet</h4>
            </div>
            {isSeller && auction.state === AuctionState.DRAFT && (
              <button
                onClick={() => navigate(`/auctions/${auction.id}/settings`)}
                className="text-[10px] font-bold uppercase text-indigo-400 hover:text-indigo-300 flex items-center gap-1 cursor-pointer"
              >
                <Settings className="h-3 w-3" />
                <span>Configure Rules</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-slate-950/60 border border-slate-850 rounded-xl p-3">
              <span className="block text-[9px] text-slate-500 uppercase">Anonymous Bids</span>
              <span className="block font-semibold mt-1 text-slate-300">
                {auction.settings.anonymousBidding ? "ACTIVE" : "INACTIVE"}
              </span>
            </div>
            <div className="bg-slate-950/60 border border-slate-850 rounded-xl p-3">
              <span className="block text-[9px] text-slate-500 uppercase">Seller Approval</span>
              <span className="block font-semibold mt-1 text-slate-300">
                {auction.settings.allowSellerApproval ? "REQUIRED" : "AUTOMATIC"}
              </span>
            </div>
            <div className="bg-slate-950/60 border border-slate-850 rounded-xl p-3">
              <span className="block text-[9px] text-slate-500 uppercase">Bid Withdrawal</span>
              <span className="block font-semibold mt-1 text-slate-300">
                {auction.settings.allowBidWithdrawal ? "ALLOWED" : "FORBIDDEN"}
              </span>
            </div>
            <div className="bg-slate-950/60 border border-slate-850 rounded-xl p-3">
              <span className="block text-[9px] text-slate-500 uppercase">Proxy Bidding</span>
              <span className="block font-semibold mt-1 text-slate-300">
                {auction.settings.allowProxyBid ? "ACTIVE" : "INACTIVE"}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* 4. LOT DETAILS NESTED MODULE */}
      <div className="bg-slate-900/30 border border-slate-800 rounded-2xl p-5 space-y-4" id="nested-lots-panel">
        <div className="flex items-center justify-between border-b border-slate-800/60 pb-2.5">
          <div className="flex items-center gap-2 text-slate-200 uppercase tracking-wider font-mono text-xs">
            <Gavel className="h-4 w-4 text-indigo-400" />
            <h4 className="font-bold">Associated Inventory Lots ({auction.lots?.length || 0})</h4>
          </div>
          {isSeller && auction.state === AuctionState.DRAFT && (
            <button
              onClick={() => navigate(`/auctions/${auction.id}/lots`)}
              className="text-[10px] font-bold uppercase text-indigo-400 hover:text-indigo-300 flex items-center gap-1 cursor-pointer"
            >
              <Settings className="h-3 w-3" />
              <span>Manage Lots</span>
            </button>
          )}
        </div>

        {!auction.lots || auction.lots.length === 0 ? (
          <div className="py-8 text-center text-slate-500 font-mono text-xs border border-dashed border-slate-800 rounded-xl bg-slate-950/20">
            <Compass className="h-7 w-7 text-slate-700 mx-auto mb-1.5" />
            <p>No inventory lots have been drafted under this campaign model yet.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300 border-collapse">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950/30 text-[9px] font-bold font-mono tracking-wider text-slate-500 uppercase">
                  <th className="py-3 px-4">Lot ID</th>
                  <th className="py-3 px-3">Title & Material Class</th>
                  <th className="py-3 px-3 text-right">Draft Target Quantity</th>
                  <th className="py-3 px-3 text-right">Starting Minimum Price</th>
                  <th className="py-3 px-3 text-right">Minimum Increment</th>
                  <th className="py-3 px-4 text-center">Lifecycle State</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/40 text-xs">
                {auction.lots.map((lot) => (
                  <tr key={lot.id} className="hover:bg-slate-900/10">
                    <td className="py-3.5 px-4 font-mono font-semibold text-indigo-400">{lot.lotNumber}</td>
                    <td className="py-3.5 px-3">
                      <div className="flex flex-col">
                        <span className="font-semibold text-slate-200 text-xs">{lot.title}</span>
                        <span className="text-[10px] text-slate-500 font-mono uppercase mt-0.5">{lot.materialCategory}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-3 text-right font-mono font-medium text-slate-300">
                      {lot.quantity} <span className="text-[10px] text-slate-500 font-normal">{lot.unitOfMeasure}</span>
                    </td>
                    <td className="py-3.5 px-3 text-right font-mono font-semibold text-emerald-400">
                      {lot.startingPrice.toLocaleString()} <span className="text-[9px] text-slate-500 font-normal">{lot.currency}</span>
                    </td>
                    <td className="py-3.5 px-3 text-right font-mono text-slate-400">
                      {lot.minimumIncrement.toLocaleString()} <span className="text-[9px] text-slate-500 font-normal">{lot.currency}</span>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-semibold font-mono tracking-wider border inline-block ${
                        lot.lotStatus === "SOLD"
                          ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                          : lot.lotStatus === "LIVE"
                          ? "bg-amber-500/10 text-amber-400 border-amber-500/20 animate-pulse"
                          : "bg-slate-950 text-slate-400 border-slate-800"
                      }`}>
                        {lot.lotStatus}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AuctionDetailsView;
