import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { useAuth } from "../context/AuthContext";
import { useAuctionDetails, useUpdateAuctionMutation } from "../hooks/useAuctionQueries";
import { auctionSchema } from "../validation/auctionSchema";
import { AuctionState, AuctionType, AuctionVisibility } from "../types/auction";
import { useNotification } from "../providers/NotificationProvider";
import { handleApiError } from "../api/errorHandler";
import { 
  ArrowLeft, 
  Save, 
  Calendar, 
  Info, 
  AlertTriangle,
  FileCode,
  Globe,
  DollarSign,
  Loader2
} from "lucide-react";

interface FormInputs {
  title: string;
  description: string;
  auctionType: AuctionType;
  visibility: AuctionVisibility;
  currency: string;
  timezone: string;
  registrationStart: string;
  registrationEnd: string;
  inspectionStart: string;
  inspectionEnd: string;
  auctionStart: string;
  auctionEnd: string;
  reservePriceEnabled: boolean;
  autoExtensionEnabled: boolean;
  extensionMinutes: string;
}

const toLocalDatetimeString = (date: Date): string => {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

const toDatetimeLocal = (isoStr?: string): string => {
  if (!isoStr) return "";
  try {
    return toLocalDatetimeString(new Date(isoStr));
  } catch {
    return "";
  }
};

export const EditAuctionView: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, hasRole } = useAuth();
  const { showNotification } = useNotification();
  
  // Fetch existing details
  const { data: auction, isLoading, isError, error } = useAuctionDetails(id || "");
  const updateMutation = useUpdateAuctionMutation();

  const [formError, setFormError] = useState<string | null>(null);

  const { register, handleSubmit, watch, reset, formState: { errors } } = useForm<FormInputs>();

  const autoExtensionEnabled = watch("autoExtensionEnabled");

  // Populate form once data is loaded
  useEffect(() => {
    if (auction) {
      reset({
        title: auction.title,
        description: auction.description || "",
        auctionType: auction.auctionType,
        visibility: auction.visibility,
        currency: auction.currency,
        timezone: auction.timezone,
        registrationStart: toDatetimeLocal(auction.registrationStart),
        registrationEnd: toDatetimeLocal(auction.registrationEnd),
        inspectionStart: toDatetimeLocal(auction.inspectionStart),
        inspectionEnd: toDatetimeLocal(auction.inspectionEnd),
        auctionStart: toDatetimeLocal(auction.auctionStart),
        auctionEnd: toDatetimeLocal(auction.auctionEnd),
        reservePriceEnabled: auction.reservePriceEnabled || false,
        autoExtensionEnabled: auction.autoExtensionEnabled || false,
        extensionMinutes: String(auction.extensionMinutes || 5)
      });
    }
  }, [auction, reset]);

  const onSubmit = async (data: FormInputs) => {
    if (!id) return;
    setFormError(null);

    const mapToIso = (localStr: string): string => {
      if (!localStr) return "";
      return new Date(localStr).toISOString();
    };

    const payload: any = {
      title: data.title,
      description: data.description || undefined,
      auctionType: data.auctionType,
      visibility: data.visibility,
      currency: data.currency,
      timezone: data.timezone,
      registrationStart: mapToIso(data.registrationStart),
      registrationEnd: mapToIso(data.registrationEnd),
      inspectionStart: data.inspectionStart ? mapToIso(data.inspectionStart) : undefined,
      inspectionEnd: data.inspectionEnd ? mapToIso(data.inspectionEnd) : undefined,
      auctionStart: mapToIso(data.auctionStart),
      auctionEnd: mapToIso(data.auctionEnd),
      reservePriceEnabled: data.reservePriceEnabled,
      autoExtensionEnabled: data.autoExtensionEnabled,
      extensionMinutes: data.autoExtensionEnabled ? parseInt(data.extensionMinutes) : undefined
    };

    // Zod validation manual validation
    const validationResult = auctionSchema.safeParse(payload);

    if (!validationResult.success) {
      const firstIssue = validationResult.error.issues[0];
      const errMsg = firstIssue ? `${firstIssue.path.join(".")}: ${firstIssue.message}` : "Validation failed. Inspect all fields.";
      setFormError(errMsg);
      showNotification(firstIssue ? firstIssue.message : "Validation rules breached", "error");
      return;
    }

    try {
      await updateMutation.mutateAsync({ id, request: payload });
      showNotification("Campaign specifications updated successfully!", "success");
      navigate(`/auctions/${id}`);
    } catch (err: any) {
      const friendly = handleApiError(err);
      setFormError(friendly.message);
      showNotification(friendly.message, "error");
    }
  };

  // Role Guard: Only Sellers can modify campaigns
  if (!hasRole("SELLER")) {
    return (
      <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-8 max-w-xl mx-auto text-center font-mono text-xs space-y-4" id="role-guard-error">
        <AlertTriangle className="h-10 w-10 text-yellow-500 mx-auto" />
        <p className="font-bold text-white uppercase tracking-wider">Access Restrained</p>
        <p className="text-slate-400">
          Only operators certified as SELLER are authorized to update auction drafts.
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
      <div className="flex flex-col items-center justify-center py-24 font-mono text-xs text-slate-400" id="edit-loading">
        <Loader2 className="h-10 w-10 text-indigo-500 animate-spin mb-4" />
        <span>RETRIEVING AUDIT RECORD SPECIFICATIONS...</span>
      </div>
    );
  }

  if (isError || !auction) {
    return (
      <div className="bg-rose-500/10 border border-rose-500/20 rounded-2xl p-6 text-center max-w-xl mx-auto text-rose-400 font-mono text-xs space-y-3" id="edit-error">
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

  // State Guard: Only DRAFT or REJECTED auctions can be edited
  if (auction.state !== AuctionState.DRAFT && auction.state !== AuctionState.REJECTED) {
    return (
      <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-8 max-w-xl mx-auto text-center font-mono text-xs space-y-4" id="state-guard-error">
        <AlertTriangle className="h-10 w-10 text-yellow-500 mx-auto" />
        <p className="font-bold text-white uppercase tracking-wider">Modification Locked</p>
        <p className="text-slate-400">
          This campaign is currently in <span className="text-yellow-400 font-bold">{auction.state}</span>. Campaign details can only be modified when in DRAFT or REJECTED states.
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
    <div className="space-y-6 max-w-4xl mx-auto" id="edit-auction-view-root">
      {/* Back to details */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate(`/auctions/${id}`)}
          className="flex items-center justify-center p-2 rounded-xl border border-slate-800 hover:border-slate-700 bg-slate-900/40 text-slate-400 hover:text-white cursor-pointer transition-all"
          id="btn-back-to-details"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div>
          <span className="text-[10px] font-mono text-indigo-400 uppercase tracking-widest font-bold">Campaign Revision Matrix</span>
          <h2 className="text-lg font-bold font-mono text-white">REVISE CAMPAIGN: {auction.auctionNumber}</h2>
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
        {/* SECTION 1: CORE SPECIFICATIONS */}
        <div className="bg-slate-900/30 border border-slate-800 rounded-2xl p-6 space-y-6">
          <div className="flex items-center gap-2 border-b border-slate-800/60 pb-3">
            <FileCode className="h-4 w-4 text-indigo-400" />
            <h3 className="font-mono text-xs font-bold uppercase tracking-wider text-white">Core Specifications</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Title */}
            <div className="md:col-span-2">
              <label className="block text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                Campaign Title *
              </label>
              <input
                type="text"
                required
                placeholder="Enterprise Material Disposal Campaign"
                {...register("title", { required: true })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 font-mono"
                id="field-edit-title"
              />
            </div>

            {/* Description */}
            <div className="md:col-span-2">
              <label className="block text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                Campaign Scope & Description
              </label>
              <textarea
                rows={4}
                placeholder="Detailed catalog summary..."
                {...register("description")}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 font-mono resize-none"
                id="field-edit-description"
              />
            </div>

            {/* Auction Type */}
            <div>
              <label className="block text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                Auction Model *
              </label>
              <select
                {...register("auctionType")}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-300 focus:outline-none focus:border-indigo-500 font-mono cursor-pointer"
                id="field-edit-auction-type"
              >
                <option value={AuctionType.FORWARD}>FORWARD BIDDING (Highest Bid Wins)</option>
                <option value={AuctionType.REVERSE}>REVERSE PROCUREMENT (Lowest Quote Wins)</option>
              </select>
            </div>

            {/* Visibility */}
            <div>
              <label className="block text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                Visibility Category *
              </label>
              <select
                {...register("visibility")}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-300 focus:outline-none focus:border-indigo-500 font-mono cursor-pointer"
                id="field-edit-visibility"
              >
                <option value={AuctionVisibility.PUBLIC}>PUBLIC (Visible on Open Board)</option>
                <option value={AuctionVisibility.PRIVATE}>PRIVATE (Invite Only)</option>
                <option value={AuctionVisibility.RESTRICTED}>RESTRICTED (KYC Verified Only)</option>
              </select>
            </div>

            {/* Currency */}
            <div>
              <label className="block text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                Currency Code (ISO 4217) *
              </label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
                <input
                  type="text"
                  required
                  placeholder="INR"
                  {...register("currency", { required: true, maxLength: 3 })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 p-3 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 font-mono"
                  id="field-edit-currency"
                />
              </div>
            </div>

            {/* Timezone */}
            <div>
              <label className="block text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                Active Zone Timezone *
              </label>
              <div className="relative">
                <Globe className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
                <input
                  type="text"
                  required
                  placeholder="Asia/Kolkata"
                  {...register("timezone", { required: true })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 p-3 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 font-mono"
                  id="field-edit-timezone"
                />
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 2: REGISTRATION & INSPECTION TIMINGS */}
        <div className="bg-slate-900/30 border border-slate-800 rounded-2xl p-6 space-y-6">
          <div className="flex items-center gap-2 border-b border-slate-800/60 pb-3">
            <Calendar className="h-4 w-4 text-indigo-400" />
            <h3 className="font-mono text-xs font-bold uppercase tracking-wider text-white">Verification & Inspection Timelines</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Registration Start */}
            <div>
              <label className="block text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                Registration Opens *
              </label>
              <input
                type="datetime-local"
                required
                {...register("registrationStart", { required: true })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 font-mono"
                id="field-edit-reg-start"
              />
            </div>

            {/* Registration End */}
            <div>
              <label className="block text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                Registration Closes *
              </label>
              <input
                type="datetime-local"
                required
                {...register("registrationEnd", { required: true })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 font-mono"
                id="field-edit-reg-end"
              />
            </div>

            {/* Inspection Start */}
            <div>
              <label className="block text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                Material Inspection Start
              </label>
              <input
                type="datetime-local"
                {...register("inspectionStart")}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 font-mono"
                id="field-edit-insp-start"
              />
            </div>

            {/* Inspection End */}
            <div>
              <label className="block text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                Material Inspection End
              </label>
              <input
                type="datetime-local"
                {...register("inspectionEnd")}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 font-mono"
                id="field-edit-insp-end"
              />
            </div>
          </div>
        </div>

        {/* SECTION 3: BIDDING WINDOW & RULES */}
        <div className="bg-slate-900/30 border border-slate-800 rounded-2xl p-6 space-y-6">
          <div className="flex items-center gap-2 border-b border-slate-800/60 pb-3">
            <Info className="h-4 w-4 text-indigo-400" />
            <h3 className="font-mono text-xs font-bold uppercase tracking-wider text-white">Active Bidding Window & Extension Protocol</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Auction Start */}
            <div>
              <label className="block text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                Active Bidding Starts *
              </label>
              <input
                type="datetime-local"
                required
                {...register("auctionStart", { required: true })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 font-mono"
                id="field-edit-auc-start"
              />
            </div>

            {/* Auction End */}
            <div>
              <label className="block text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                Active Bidding Ends *
              </label>
              <input
                type="datetime-local"
                required
                {...register("auctionEnd", { required: true })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 font-mono"
                id="field-edit-auc-end"
              />
            </div>

            {/* Reserve Price Switch */}
            <div className="flex items-center justify-between p-4 bg-slate-950 border border-slate-850 rounded-xl">
              <div className="space-y-0.5 pr-2">
                <span className="block text-[10px] font-mono font-bold uppercase tracking-wider text-slate-300">Reserve Pricing Guard</span>
                <span className="block text-[9px] text-slate-500">Enable secret threshold evaluation before sell execution.</span>
              </div>
              <input
                type="checkbox"
                {...register("reservePriceEnabled")}
                className="h-4.5 w-4.5 text-indigo-600 border-slate-800 bg-slate-950 rounded cursor-pointer"
                id="field-edit-reserve-price-enabled"
              />
            </div>

            {/* Auto Extension Switch */}
            <div className="flex items-center justify-between p-4 bg-slate-950 border border-slate-850 rounded-xl">
              <div className="space-y-0.5 pr-2">
                <span className="block text-[10px] font-mono font-bold uppercase tracking-wider text-slate-300">Overtime Bidding Trigger</span>
                <span className="block text-[9px] text-slate-500">Auto-extend bidding timer on close actions.</span>
              </div>
              <input
                type="checkbox"
                {...register("autoExtensionEnabled")}
                className="h-4.5 w-4.5 text-indigo-600 border-slate-800 bg-slate-950 rounded cursor-pointer"
                id="field-edit-auto-extension"
              />
            </div>

            {/* Extension Minutes */}
            {autoExtensionEnabled && (
              <div className="md:col-span-2 bg-indigo-950/20 border border-indigo-500/10 rounded-2xl p-4 mt-2">
                <label className="block text-[10px] font-mono font-bold text-indigo-300 uppercase tracking-wider mb-1.5">
                  Overtime Extension Window (Minutes) *
                </label>
                <input
                  type="number"
                  required
                  placeholder="5"
                  min="1"
                  {...register("extensionMinutes", { required: autoExtensionEnabled })}
                  className="w-full bg-slate-950 border border-indigo-500/20 rounded-xl p-3 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 font-mono"
                  id="field-edit-extension-minutes"
                />
              </div>
            )}
          </div>
        </div>

        {/* SUBMIT BUTTONS */}
        <div className="flex justify-end gap-3 pb-8 border-t border-slate-800/40 pt-6 font-mono text-xs">
          <button
            type="button"
            disabled={updateMutation.isPending}
            onClick={() => navigate(`/auctions/${id}`)}
            className="px-5 py-3 border border-slate-800 hover:border-slate-700 bg-slate-900/20 hover:bg-slate-900/60 rounded-xl font-bold uppercase tracking-wider cursor-pointer text-slate-400 hover:text-white transition-all"
            id="btn-cancel-edit"
          >
            Discard
          </button>
          <button
            type="submit"
            disabled={updateMutation.isPending}
            className="flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl font-bold uppercase tracking-wider shadow-lg shadow-indigo-600/15 cursor-pointer transition-all"
            id="btn-submit-edit"
          >
            {updateMutation.isPending ? (
              <>
                <span className="h-3 w-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Saving Specifications...</span>
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                <span>Save Specifications</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default EditAuctionView;
