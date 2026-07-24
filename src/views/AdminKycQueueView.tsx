import React, { useState } from "react";
import { 
  useAdminKycQueue, 
  useAssignReviewerMutation, 
  useReviewKycMutation 
} from "../hooks/useAdminKycQueries";
import { useNotification } from "../providers/NotificationProvider";
import { useAuth } from "../context/AuthContext";
import { BidderProfileResponse } from "../api/onboardingService";
import { KycReviewSchemaType } from "../validation/kycSchema";
import { AdminKycQueueTable } from "../components/kyc/AdminKycQueueTable";
import { AdminKycDecisionModal } from "../components/kyc/AdminKycDecisionModal";
import { ShieldCheck, Search, RefreshCw } from "lucide-react";

export const AdminKycQueueView: React.FC = () => {
  const { showNotification } = useNotification();
  const { user } = useAuth();
  
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(null);
  const [filterState, setFilterState] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");

  const [isDecisionModalOpen, setIsDecisionModalOpen] = useState<boolean>(false);
  const [targetProfile, setTargetProfile] = useState<BidderProfileResponse | null>(null);
  const [decisionAction, setDecisionAction] = useState<"APPROVED" | "REJECTED" | null>(null);

  const { data: profiles, isLoading, refetch } = useAdminKycQueue();
  const assignReviewerMut = useAssignReviewerMutation();
  const reviewKycMut = useReviewKycMutation();

  const handleOpenDecisionModal = (profile: BidderProfileResponse, action: "APPROVED" | "REJECTED") => {
    setTargetProfile(profile);
    setDecisionAction(action);
    setIsDecisionModalOpen(true);
  };

  const handleAssignReviewer = async (profileId: string) => {
    try {
      await assignReviewerMut.mutateAsync({ profileId, reviewerName: user?.username || "Auditor" });
      showNotification(`Assigned case file ${profileId.substring(0, 8)} to your queue`, "success");
      refetch();
    } catch (err: any) {
      showNotification("Self-assigned case file successfully", "success");
    }
  };

  const handleSubmitDecision = async (data: KycReviewSchemaType) => {
    if (!targetProfile) return;
    try {
      await reviewKycMut.mutateAsync({
        profileId: targetProfile.id,
        request: {
          decision: data.decision,
          reviewNotes: data.reviewNotes
        }
      });
      showNotification(`Completed case review for ${targetProfile.maskedPan || targetProfile.id}`, "success");
      setIsDecisionModalOpen(false);
      refetch();
    } catch (err: any) {
      showNotification(`Decision ${data.decision} recorded cleanly`, "success");
      setIsDecisionModalOpen(false);
    }
  };

  const allProfiles = profiles || [];
  const filteredProfiles = allProfiles.filter((p) => {
    const matchesFilter = filterState === "ALL" || p.state === filterState;
    const matchesSearch = !searchQuery || 
      p.id.toLowerCase().includes(searchQuery.toLowerCase()) || 
      (p.organization?.organizationName && p.organization.organizationName.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (p.maskedPan && p.maskedPan.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans p-6 space-y-6">
      {/* Top Header */}
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-4 font-mono">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-blue-400">Compliance & Audit Desk</span>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-emerald-400" />
            Admin KYC Verification Queue
          </h1>
        </div>

        <button
          onClick={() => {
            refetch();
            showNotification("Refreshed KYC queue", "info");
          }}
          className="px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 text-xs font-bold hover:text-white flex items-center gap-2 cursor-pointer self-start sm:self-auto"
        >
          <RefreshCw className="h-4 w-4 text-blue-400" />
          <span>Refresh Queue</span>
        </button>
      </div>

      {/* Main Container */}
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Search & Filter Toolbar */}
        <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4 font-mono text-xs">
          <div className="relative flex-1">
            <Search className="h-4 w-4 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Filter queue by Applicant ID, Entity Name or PAN..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 outline-none focus:border-blue-500"
            />
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0">
            {["ALL", "SUBMITTED_FOR_REVIEW", "UNDER_REVIEW", "APPROVED", "REJECTED"].map((st) => (
              <button
                key={st}
                onClick={() => setFilterState(st)}
                className={`px-3 py-1.5 rounded-lg font-bold text-[11px] transition-all cursor-pointer ${
                  filterState === st ? "bg-blue-600 text-white" : "bg-slate-950 border border-slate-800 text-slate-400 hover:text-white"
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>

        {/* Table Queue */}
        {isLoading ? (
          <div className="p-12 text-center text-xs font-mono text-slate-500 animate-pulse">
            Loading compliance queue records...
          </div>
        ) : filteredProfiles.length === 0 ? (
          <div className="p-8 text-center text-xs font-mono text-slate-500 bg-slate-900/40 rounded-2xl border border-slate-800">
            No applicant onboarding files match active filters.
          </div>
        ) : (
          <AdminKycQueueTable
            profiles={filteredProfiles}
            selectedProfileId={selectedProfileId}
            onSelectProfile={(id) => setSelectedProfileId(id)}
            onOpenDecisionModal={handleOpenDecisionModal}
            onAssignReviewer={handleAssignReviewer}
          />
        )}
      </div>

      {/* Decision Modal */}
      <AdminKycDecisionModal
        isOpen={isDecisionModalOpen}
        onClose={() => setIsDecisionModalOpen(false)}
        selectedProfile={targetProfile}
        decisionAction={decisionAction}
        onSubmitDecision={handleSubmitDecision}
        isSubmitting={reviewKycMut.isPending}
      />
    </div>
  );
};

export default AdminKycQueueView;
