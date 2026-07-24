import React, { memo } from "react";
import { BidderProfileResponse, BidderState } from "../../api/onboardingService";
import { Eye, CheckCircle, AlertTriangle, UserCheck } from "lucide-react";

interface AdminKycQueueTableProps {
  profiles: BidderProfileResponse[];
  selectedProfileId: string | null;
  onSelectProfile: (id: string) => void;
  onOpenDecisionModal: (profile: BidderProfileResponse, action: "APPROVED" | "REJECTED") => void;
  onAssignReviewer: (profileId: string) => void;
}

export const AdminKycQueueTable: React.FC<AdminKycQueueTableProps> = memo(({
  profiles,
  selectedProfileId,
  onSelectProfile,
  onOpenDecisionModal,
  onAssignReviewer
}) => {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/40 overflow-hidden font-mono text-xs">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead className="bg-slate-950 border-b border-slate-800 text-slate-400 uppercase text-[10px]">
            <tr>
              <th className="py-3 px-4">Applicant ID</th>
              <th className="py-3 px-4">Type</th>
              <th className="py-3 px-4">PAN / Entity</th>
              <th className="py-3 px-4">State Status</th>
              <th className="py-3 px-4">Reviewer</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {profiles.map((p) => {
              const isSel = p.id === selectedProfileId;
              return (
                <tr key={p.id} className={`hover:bg-slate-800/30 transition-colors ${isSel ? "bg-blue-500/5" : ""}`}>
                  <td className="py-3.5 px-4 font-bold text-slate-200">{p.id.substring(0, 8)}...</td>
                  <td className="py-3.5 px-4">
                    <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                      p.bidderType === "CORPORATE" ? "bg-purple-500/10 text-purple-400 border border-purple-500/20" : "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                    }`}>
                      {p.bidderType}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-slate-300 font-bold">
                    {p.organization?.organizationName || p.maskedPan || p.email}
                  </td>
                  <td className="py-3.5 px-4">
                    <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                      p.state === BidderState.UNDER_REVIEW || p.state === BidderState.KYC_PENDING ? "bg-amber-500/10 text-amber-400 border border-amber-500/20" :
                      p.state === BidderState.APPROVED ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" :
                      "bg-red-500/10 text-red-400 border border-red-500/20"
                    }`}>
                      {p.state}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-slate-400">
                    {p.assignedReviewer ? (
                      <span className="text-slate-300 font-bold flex items-center gap-1">
                        <UserCheck className="h-3.5 w-3.5 text-blue-400" />
                        {p.assignedReviewer}
                      </span>
                    ) : (
                      <button
                        onClick={() => onAssignReviewer(p.id)}
                        className="text-[10px] text-blue-400 hover:underline font-bold cursor-pointer"
                      >
                        Self-Assign
                      </button>
                    )}
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => onSelectProfile(p.id)}
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-bold transition-all cursor-pointer"
                        title="View Application Details"
                      >
                        <Eye className="h-3.5 w-3.5" />
                      </button>

                      <button
                        onClick={() => onOpenDecisionModal(p, "APPROVED")}
                        className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-bold transition-all cursor-pointer flex items-center gap-1"
                      >
                        <CheckCircle className="h-3 w-3" />
                        <span>Approve</span>
                      </button>

                      <button
                        onClick={() => onOpenDecisionModal(p, "REJECTED")}
                        className="px-2.5 py-1 rounded-lg bg-red-600 hover:bg-red-500 text-white text-[10px] font-bold transition-all cursor-pointer flex items-center gap-1"
                      >
                        <AlertTriangle className="h-3 w-3" />
                        <span>Reject</span>
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
});

AdminKycQueueTable.displayName = "AdminKycQueueTable";
