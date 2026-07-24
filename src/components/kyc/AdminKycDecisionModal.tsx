import React, { memo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { kycReviewSchema, KycReviewSchemaType } from "../../validation/kycSchema";
import { BidderProfileResponse } from "../../api/onboardingService";
import { X, CheckCircle, AlertTriangle } from "lucide-react";

interface AdminKycDecisionModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedProfile: BidderProfileResponse | null;
  decisionAction: "APPROVED" | "REJECTED" | null;
  onSubmitDecision: (data: KycReviewSchemaType) => void;
  isSubmitting: boolean;
}

export const AdminKycDecisionModal: React.FC<AdminKycDecisionModalProps> = memo(({
  isOpen,
  onClose,
  selectedProfile,
  decisionAction,
  onSubmitDecision,
  isSubmitting
}) => {
  const { register, handleSubmit, formState: { errors } } = useForm<KycReviewSchemaType>({
    resolver: zodResolver(kycReviewSchema),
    defaultValues: {
      decision: decisionAction || "APPROVED",
      reviewNotes: ""
    }
  });

  if (!isOpen || !selectedProfile) return null;

  const isApprove = decisionAction === "APPROVED";
  const entityName = selectedProfile.organization?.organizationName || selectedProfile.maskedPan || selectedProfile.email;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md font-mono">
      <div className="w-full max-w-lg p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl text-slate-100 space-y-6">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className={`h-10 w-10 rounded-xl flex items-center justify-center border ${
              isApprove ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" : "bg-red-500/10 border-red-500/20 text-red-400"
            }`}>
              {isApprove ? <CheckCircle className="h-5 w-5" /> : <AlertTriangle className="h-5 w-5" />}
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">
                {isApprove ? "Approve Onboarding Application" : "Reject & Request Remediation"}
              </h3>
              <p className="text-[10px] text-slate-400">
                Target Entity: <strong className="text-slate-200">{entityName}</strong>
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-200">
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmitDecision)} className="space-y-4 text-xs">
          <div>
            <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
              Auditor Compliance Remarks & Case Notes *
            </label>
            <textarea
              {...register("reviewNotes")}
              rows={4}
              placeholder="Provide detailed compliance audit findings or instructions for applicant (min 10 chars)..."
              className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl outline-none text-white focus:border-blue-500 text-xs"
            />
            {errors.reviewNotes && (
              <p className="text-red-400 text-[10px] mt-1">{errors.reviewNotes.message}</p>
            )}
          </div>

          <div className="flex items-center justify-end gap-3 border-t border-slate-800 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold hover:bg-slate-700 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className={`px-5 py-2 rounded-xl text-white text-xs font-bold transition-all shadow-lg cursor-pointer ${
                isApprove ? "bg-emerald-600 hover:bg-emerald-500 shadow-emerald-500/20" : "bg-red-600 hover:bg-red-500 shadow-red-500/20"
              }`}
            >
              {isSubmitting ? "Submitting..." : isApprove ? "Confirm Approval" : "Confirm Rejection"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
});

AdminKycDecisionModal.displayName = "AdminKycDecisionModal";
