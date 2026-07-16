import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { useAuth } from "../context/AuthContext";
import { useAuctionDetails, useUpdateSettingsMutation } from "../hooks/useAuctionQueries";
import { updateSettingsSchema } from "../validation/auctionSchema";
import { useNotification } from "../providers/NotificationProvider";
import { handleApiError } from "../api/errorHandler";
import { 
  ArrowLeft, 
  Save, 
  Sliders, 
  ShieldCheck, 
  AlertTriangle, 
  Coins, 
  Loader2,
  Users,
  Percent,
  Clock
} from "lucide-react";
import { AuctionState } from "../types/auction";

interface FormInputs {
  anonymousBidding: boolean;
  allowSellerApproval: boolean;
  allowBidWithdrawal: boolean;
  allowProxyBid: boolean;
  allowRankDisplay: boolean;
  showBidderNames: boolean;
  registrationRequired: boolean;
  emdRequired: boolean;
  maxExtensions: number;
  minimumIncrement: number;
}

export const AuctionSettingsView: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, hasRole } = useAuth();
  const { showNotification } = useNotification();

  const { data: auction, isLoading, isError, error } = useAuctionDetails(id || "");
  const updateSettingsMutation = useUpdateSettingsMutation();

  const [formError, setFormError] = useState<string | null>(null);

  const { register, handleSubmit, reset } = useForm<FormInputs>();

  // Pre-populate settings when loaded
  useEffect(() => {
    if (auction && auction.settings) {
      reset({
        anonymousBidding: auction.settings.anonymousBidding || false,
        allowSellerApproval: auction.settings.allowSellerApproval || false,
        allowBidWithdrawal: auction.settings.allowBidWithdrawal || false,
        allowProxyBid: auction.settings.allowProxyBid || false,
        allowRankDisplay: auction.settings.allowRankDisplay || false,
        showBidderNames: auction.settings.showBidderNames || false,
        registrationRequired: auction.settings.registrationRequired || false,
        emdRequired: auction.settings.emdRequired || false,
        maxExtensions: auction.settings.maxExtensions || 5,
        minimumIncrement: auction.settings.minimumIncrement || 1
      });
    }
  }, [auction, reset]);

  const onSubmit = async (data: FormInputs) => {
    if (!id) return;
    setFormError(null);

    const payload: any = {
      anonymousBidding: data.anonymousBidding,
      allowSellerApproval: data.allowSellerApproval,
      allowBidWithdrawal: data.allowBidWithdrawal,
      allowProxyBid: data.allowProxyBid,
      allowRankDisplay: data.allowRankDisplay,
      showBidderNames: data.showBidderNames,
      registrationRequired: data.registrationRequired,
      emdRequired: data.emdRequired,
      maxExtensions: parseInt(String(data.maxExtensions)),
      minimumIncrement: parseFloat(String(data.minimumIncrement))
    };

    // Manual schema safe-parsing
    const validationResult = updateSettingsSchema.safeParse(payload);

    if (!validationResult.success) {
      const firstIssue = validationResult.error.issues[0];
      const errMsg = firstIssue ? `${firstIssue.path.join(".")}: ${firstIssue.message}` : "Validation failed. Inspect all fields.";
      setFormError(errMsg);
      showNotification(firstIssue ? firstIssue.message : "Validation rules breached", "error");
      return;
    }

    try {
      await updateSettingsMutation.mutateAsync({ id, request: payload });
      showNotification("Business rules and parameters synced successfully!", "success");
      navigate(`/auctions/${id}`);
    } catch (err: any) {
      const friendly = handleApiError(err);
      setFormError(friendly.message);
      showNotification(friendly.message, "error");
    }
  };

  // Role Guard
  if (!hasRole("SELLER")) {
    return (
      <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-8 max-w-xl mx-auto text-center font-mono text-xs space-y-4" id="role-guard-error">
        <AlertTriangle className="h-10 w-10 text-yellow-500 mx-auto" />
        <p className="font-bold text-white uppercase tracking-wider">Access Restrained</p>
        <p className="text-slate-400">
          Only SELLER credentials can configure campaign rules sheets.
        </p>
        <button
          onClick={() => navigate(`/auctions/${id}`)}
          className="px-4 py-2 bg-slate-950 hover:bg-slate-900 border border-slate-800 text-slate-400 rounded-lg cursor-pointer font-bold"
        >
          Return to Operational Sheet
        </button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 font-mono text-xs text-slate-400" id="settings-loading">
        <Loader2 className="h-10 w-10 text-indigo-500 animate-spin mb-4" />
        <span>PULLING BUSINESS RULE SPECIFICATION ARTIFACTS...</span>
      </div>
    );
  }

  if (isError || !auction) {
    return (
      <div className="bg-rose-500/10 border border-rose-500/20 rounded-2xl p-6 text-center max-w-xl mx-auto text-rose-400 font-mono text-xs space-y-3" id="settings-error">
        <AlertTriangle className="h-10 w-10 mx-auto text-rose-500" />
        <p className="font-bold uppercase">Record Retrieval Failure</p>
        <p className="text-slate-400">{error instanceof Error ? error.message : "The requested record could not be securely read."}</p>
        <button
          onClick={() => navigate("/auctions")}
          className="px-4 py-2 bg-rose-950/40 hover:bg-rose-900/30 border border-rose-500/30 rounded-lg text-[10px] font-bold uppercase cursor-pointer"
        >
          Back to Registry
        </button>
      </div>
    );
  }

  // State Guard: Settings can only be edited in DRAFT or REJECTED
  if (auction.state !== AuctionState.DRAFT && auction.state !== AuctionState.REJECTED) {
    return (
      <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-8 max-w-xl mx-auto text-center font-mono text-xs space-y-4" id="state-guard-error">
        <AlertTriangle className="h-10 w-10 text-yellow-500 mx-auto" />
        <p className="font-bold text-white uppercase tracking-wider">Configuration Locked</p>
        <p className="text-slate-400">
          This campaign is currently in <span className="text-yellow-400 font-bold">{auction.state}</span>. Configuration rules can only be modified in DRAFT or REJECTED states.
        </p>
        <button
          onClick={() => navigate(`/auctions/${id}`)}
          className="px-4 py-2 bg-slate-950 hover:bg-slate-900 border border-slate-800 text-slate-400 rounded-lg cursor-pointer font-bold"
        >
          Return to Operational Sheet
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto" id="auction-settings-view-root">
      
      {/* Back Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate(`/auctions/${id}`)}
          className="flex items-center justify-center p-2 rounded-xl border border-slate-800 hover:border-slate-700 bg-slate-900/40 text-slate-400 hover:text-white cursor-pointer transition-all"
          id="btn-settings-back"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div>
          <span className="text-[10px] font-mono text-indigo-400 uppercase tracking-widest font-bold">Business Intelligence Engine</span>
          <h2 className="text-lg font-bold font-mono text-white">CONFIGURE CAMPAIGN RULES: {auction.auctionNumber}</h2>
        </div>
      </div>

      {formError && (
        <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl p-4 text-rose-400 font-mono text-xs flex items-start gap-2.5">
          <AlertTriangle className="h-4.5 w-4.5 shrink-0 mt-0.5 text-rose-500" />
          <div>
            <p className="font-bold uppercase tracking-wider">Validation Handshake Failure</p>
            <p className="text-slate-400 mt-1">{formError}</p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        
        {/* BLOCK 1: COMPLIANCE & RECONCILIATION */}
        <div className="bg-slate-900/30 border border-slate-800 rounded-2xl p-6 space-y-6">
          <div className="flex items-center gap-2 border-b border-slate-800/60 pb-3">
            <ShieldCheck className="h-4.5 w-4.5 text-indigo-400" />
            <h3 className="font-mono text-xs font-bold uppercase tracking-wider text-white">Security & Bidder Compliance</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 font-mono text-xs">
            {/* Anonymous Bidding */}
            <div className="flex items-center justify-between p-4 bg-slate-950 border border-slate-850 rounded-xl">
              <div className="space-y-0.5 pr-2">
                <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-300">Anonymous Bidding Sheet</span>
                <span className="block text-[9px] text-slate-500">Conceal bidder visual handles from co-participants during active sessions.</span>
              </div>
              <input
                type="checkbox"
                {...register("anonymousBidding")}
                className="h-4.5 w-4.5 text-indigo-600 border-slate-800 bg-slate-950 rounded cursor-pointer"
                id="field-anonymous"
              />
            </div>

            {/* Registration Required */}
            <div className="flex items-center justify-between p-4 bg-slate-950 border border-slate-850 rounded-xl">
              <div className="space-y-0.5 pr-2">
                <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-300">Mandatory Registration Gate</span>
                <span className="block text-[9px] text-slate-500">Require direct participant verification approvals before bidding access.</span>
              </div>
              <input
                type="checkbox"
                {...register("registrationRequired")}
                className="h-4.5 w-4.5 text-indigo-600 border-slate-800 bg-slate-950 rounded cursor-pointer"
                id="field-registration"
              />
            </div>

            {/* EMD Compliance */}
            <div className="flex items-center justify-between p-4 bg-slate-950 border border-slate-850 rounded-xl">
              <div className="space-y-0.5 pr-2">
                <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-300">Earnest Money Deposit (EMD) Gate</span>
                <span className="block text-[9px] text-slate-500">Impose deposit mandates to secure valid bidding credentials.</span>
              </div>
              <input
                type="checkbox"
                {...register("emdRequired")}
                className="h-4.5 w-4.5 text-indigo-600 border-slate-800 bg-slate-950 rounded cursor-pointer"
                id="field-emd"
              />
            </div>

            {/* Seller Approval Requirement */}
            <div className="flex items-center justify-between p-4 bg-slate-950 border border-slate-850 rounded-xl">
              <div className="space-y-0.5 pr-2">
                <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-300">Manual Seller Consent</span>
                <span className="block text-[9px] text-slate-500">Reserve right of manual seller approval before award resolution.</span>
              </div>
              <input
                type="checkbox"
                {...register("allowSellerApproval")}
                className="h-4.5 w-4.5 text-indigo-600 border-slate-800 bg-slate-950 rounded cursor-pointer"
                id="field-approval"
              />
            </div>
          </div>
        </div>

        {/* BLOCK 2: SYSTEM BEHAVIORS & LIMITS */}
        <div className="bg-slate-900/30 border border-slate-800 rounded-2xl p-6 space-y-6">
          <div className="flex items-center gap-2 border-b border-slate-800/60 pb-3">
            <Sliders className="h-4.5 w-4.5 text-purple-400" />
            <h3 className="font-mono text-xs font-bold uppercase tracking-wider text-white">System Bidding Dynamics</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 font-mono text-xs">
            {/* Proxy Bidding */}
            <div className="flex items-center justify-between p-4 bg-slate-950 border border-slate-850 rounded-xl">
              <div className="space-y-0.5 pr-2">
                <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-300">Automated Proxy Bidding</span>
                <span className="block text-[9px] text-slate-500">Allow participants to declare max thresholds for automatic incrementing.</span>
              </div>
              <input
                type="checkbox"
                {...register("allowProxyBid")}
                className="h-4.5 w-4.5 text-indigo-600 border-slate-800 bg-slate-950 rounded cursor-pointer"
                id="field-proxy"
              />
            </div>

            {/* Rank Display */}
            <div className="flex items-center justify-between p-4 bg-slate-950 border border-slate-850 rounded-xl">
              <div className="space-y-0.5 pr-2">
                <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-300">Dynamic Participant Rank</span>
                <span className="block text-[9px] text-slate-500">Disclose live ranking positions to bidding participants on their desk.</span>
              </div>
              <input
                type="checkbox"
                {...register("allowRankDisplay")}
                className="h-4.5 w-4.5 text-indigo-600 border-slate-800 bg-slate-950 rounded cursor-pointer"
                id="field-rank"
              />
            </div>

            {/* Bid Withdrawal */}
            <div className="flex items-center justify-between p-4 bg-slate-950 border border-slate-850 rounded-xl">
              <div className="space-y-0.5 pr-2">
                <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-300">Retract active Bids</span>
                <span className="block text-[9px] text-slate-500">Grant operators authorization to retract erroneously dispatched bids.</span>
              </div>
              <input
                type="checkbox"
                {...register("allowBidWithdrawal")}
                className="h-4.5 w-4.5 text-indigo-600 border-slate-800 bg-slate-950 rounded cursor-pointer"
                id="field-withdrawal"
              />
            </div>

            {/* Show Bidder Names */}
            <div className="flex items-center justify-between p-4 bg-slate-950 border border-slate-850 rounded-xl">
              <div className="space-y-0.5 pr-2">
                <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-300">Show Co-Bidder Names</span>
                <span className="block text-[9px] text-slate-500">Display full participant profiles transparently to everyone.</span>
              </div>
              <input
                type="checkbox"
                {...register("showBidderNames")}
                className="h-4.5 w-4.5 text-indigo-600 border-slate-800 bg-slate-950 rounded cursor-pointer"
                id="field-show-names"
              />
            </div>

            {/* Maximum Extensions allowed */}
            <div className="p-4 bg-slate-950 border border-slate-850 rounded-xl">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 text-purple-400" />
                <span>Overtime Extensions limit</span>
              </label>
              <input
                type="number"
                required
                min="1"
                max="50"
                placeholder="5"
                {...register("maxExtensions", { required: true })}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                id="field-max-extensions"
              />
              <span className="text-[9px] text-slate-500 mt-1.5 block">Restrict maximum extension events permitted during shootout.</span>
            </div>

            {/* Global Minimum Increment */}
            <div className="p-4 bg-slate-950 border border-slate-850 rounded-xl">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Coins className="h-3.5 w-3.5 text-emerald-400" />
                <span>Global Minimum Increment multiplier</span>
              </label>
              <input
                type="number"
                step="0.01"
                required
                min="0.01"
                placeholder="1"
                {...register("minimumIncrement", { required: true })}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                id="field-min-increment"
              />
              <span className="text-[9px] text-slate-500 mt-1.5 block">Enforce lowest allowed currency steps for next bids.</span>
            </div>
          </div>
        </div>

        {/* SUBMIT BUTTONS */}
        <div className="flex justify-end gap-3 pb-8 border-t border-slate-800/40 pt-6 font-mono text-xs">
          <button
            type="button"
            disabled={updateSettingsMutation.isPending}
            onClick={() => navigate(`/auctions/${id}`)}
            className="px-5 py-3 border border-slate-800 hover:border-slate-700 bg-slate-900/20 hover:bg-slate-900/60 rounded-xl font-bold uppercase tracking-wider cursor-pointer text-slate-400 hover:text-white transition-all"
            id="btn-settings-discard"
          >
            Discard
          </button>
          <button
            type="submit"
            disabled={updateSettingsMutation.isPending}
            className="flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl font-bold uppercase tracking-wider shadow-lg shadow-indigo-600/15 cursor-pointer transition-all"
            id="btn-settings-submit"
          >
            {updateSettingsMutation.isPending ? (
              <>
                <span className="h-3 w-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Syncing Parameters...</span>
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                <span>Commit Parameters</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AuctionSettingsView;
