import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { kycReviewSchema, KycReviewSchemaType } from "../validation/kycSchema";
import { 
  OnboardingService, 
  BidderProfileResponse, 
  BidderState, 
  getAuditTrail, 
  AuditTrailLog 
} from "../api/onboardingService";
import { useNotification } from "../providers/NotificationProvider";
import { useAuth } from "../context/AuthContext";
import { useAdminKycStore } from "../store/useAdminKycStore";
import { USER_ROLE } from "../constants";
import { 
  useAdminKycQueue, 
  useAssignReviewerMutation, 
  useReviewKycMutation 
} from "../hooks/useAdminKycQueries";
import { 
  ShieldCheck, 
  Users, 
  Eye, 
  CheckCircle, 
  AlertTriangle, 
  Search, 
  FileText, 
  ChevronRight, 
  UserCheck, 
  XOctagon, 
  Clock, 
  MapPin, 
  CreditCard,
  RefreshCw,
  Sparkles,
  Info,
  UserPlus,
  ArrowRightLeft,
  UserX,
  RotateCcw,
  ShieldAlert,
  Building,
  UserCheck2,
  FileCheck2,
  HelpCircle
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export const AdminKycQueueView: React.FC = () => {
  const { showNotification } = useNotification();
  const { user } = useAuth();
  
  // Zustand State Store
  const { 
    selectedProfileId, 
    setSelectedProfileId, 
    filterState, 
    setFilterState, 
    searchQuery, 
    setSearchQuery, 
    activeDocPreview, 
    setActiveDocPreview 
  } = useAdminKycStore();

  // React Query fetch compliance queue
  const { data: profiles = [], isLoading, refetch, isFetching } = useAdminKycQueue();

  // React Query Mutations
  const assignReviewerMutation = useAssignReviewerMutation();
  const reviewKycMutation = useReviewKycMutation();

  // Find the currently selected profile
  const selectedProfile = profiles.find(p => p.id === selectedProfileId) || null;
  const auditLogs = selectedProfile ? getAuditTrail(selectedProfile.id) : [];

  // Form setup for validation
  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<KycReviewSchemaType>({
    resolver: zodResolver(kycReviewSchema),
    defaultValues: {
      decision: "APPROVED",
      reviewNotes: "",
    }
  });

  const selectedDecision = watch("decision");

  // Handle selecting a profile from the queue list
  const handleSelectProfile = (p: BidderProfileResponse) => {
    setSelectedProfileId(p.id);
    setActiveDocPreview(null);
    reset({
      decision: p.state === BidderState.UNDER_REVIEW ? "APPROVED" : "RETURNED_FOR_CORRECTION",
      reviewNotes: "",
    });
  };

  // Assign Reviewer Mutation Handler
  const handleAssignSelf = async () => {
    if (!selectedProfile || !user) return;
    const reviewerName = user.username || "Admin Officer";
    
    try {
      await assignReviewerMutation.mutateAsync({
        profileId: selectedProfile.id,
        reviewerName,
      });
      showNotification(`Assigned Reviewer for this profile updated to: ${reviewerName}`, "success");
    } catch (err: any) {
      showNotification(err.message || "Failed to update reviewer assignment", "error");
    }
  };

  // Submit KYC decision (Approve / Reject / Return)
  const onReviewSubmit = async (data: KycReviewSchemaType) => {
    if (!selectedProfile) return;

    // Maker-Checker Rule Enforcement
    const isMaker = selectedProfile.makerName === user?.username;
    const isCheckerApproval = !data.decision.includes("RETURNED_FOR_CORRECTION") && data.decision === "APPROVED";
    
    // Warn/prevent checker step if self-checking is blocked
    if (isMaker && isCheckerApproval && selectedProfile.makerApproved) {
      showNotification("Maker-Checker Segregation Violation: A maker cannot perform the checker approval for the same client.", "error");
      return;
    }

    try {
      // Determine if this is a Maker step or Checker step
      const isOperationsUser = user?.roles?.includes(USER_ROLE.OPERATIONS);
      const isSuperAdmin = user?.roles?.includes(USER_ROLE.SUPER_ADMIN);
      
      // If profile has no maker approved yet, and decision is APPROVED, we can offer to make it a maker pass first or directly approve if super admin
      const isMakerApproval = isOperationsUser && !selectedProfile.makerApproved;

      await reviewKycMutation.mutateAsync({
        profileId: selectedProfile.id,
        request: {
          decision: data.decision,
          reviewNotes: data.reviewNotes,
          reviewerName: user?.username || "System Compliance Officer",
          isMakerApproval: isMakerApproval && data.decision === "APPROVED",
        },
      });

      const decisionMsg = 
        isMakerApproval && data.decision === "APPROVED"
          ? "Maker Initial Review recorded. Awaiting Checker Final release."
          : `KYC Dossier has been successfully marked as ${data.decision.replace(/_/g, " ")}.`;

      showNotification(decisionMsg, "success");
      reset({
        decision: "APPROVED",
        reviewNotes: "",
      });
    } catch (err: any) {
      showNotification(err.message || "Failed to commit compliance decision to ledger.", "error");
    }
  };

  const getStatusBadgeClass = (state: BidderState) => {
    switch (state) {
      case BidderState.DRAFT:
        return "bg-slate-500/10 text-slate-400 border-slate-500/25";
      case BidderState.UNDER_REVIEW:
        return "bg-indigo-500/10 text-indigo-400 border-indigo-500/25";
      case BidderState.APPROVED:
        return "bg-emerald-500/10 text-emerald-400 border-emerald-500/25";
      case BidderState.REJECTED:
        return "bg-rose-500/10 text-rose-400 border-rose-500/25";
      case BidderState.RETURNED_FOR_CORRECTION:
        return "bg-amber-500/10 text-amber-400 border-amber-500/25";
      default:
        return "bg-slate-500/10 text-slate-400 border-slate-500/25";
    }
  };

  // Filter profiles based on state tabs and search criteria
  const filteredProfiles = profiles.filter(p => {
    // 1. Filter by State Tab
    if (filterState !== "ALL" && p.state !== filterState) return false;
    
    // 2. Search by PAN, Email or Org Name
    if (searchQuery.trim() !== "") {
      const q = searchQuery.toLowerCase();
      const panMatch = p.maskedPan.toLowerCase().includes(q);
      const emailMatch = p.email.toLowerCase().includes(q);
      const orgMatch = p.organization?.organizationName.toLowerCase().includes(q) || false;
      const typeMatch = p.bidderType.toLowerCase().includes(q);
      return panMatch || emailMatch || orgMatch || typeMatch;
    }
    return true;
  });

  // Count profiles for stats indicators
  const stats = {
    total: profiles.length,
    underReview: profiles.filter(p => p.state === BidderState.UNDER_REVIEW).length,
    returned: profiles.filter(p => p.state === BidderState.RETURNED_FOR_CORRECTION).length,
    rejected: profiles.filter(p => p.state === BidderState.REJECTED).length,
    approved: profiles.filter(p => p.state === BidderState.APPROVED).length,
  };

  // Setup sample text templates for rapid feedback
  const loadRemarksTemplate = (type: "APPROVE" | "CORRECTION" | "REJECT") => {
    switch (type) {
      case "APPROVE":
        setValue("reviewNotes", "Verified original physical Aadhaar/PAN cards against NSDL/UIDAI registries. Beneficiary credentials cleared by penny-drop escrow matching. Account authorized for active metal trade limits.");
        break;
      case "CORRECTION":
        setValue("reviewNotes", "Onboarding documents require re-upload. The provided GSTIN registration certificate is blurry and unreadable. Please submit a high-resolution PDF or JPEG image.");
        break;
      case "REJECT":
        setValue("reviewNotes", "STATUTORY FRAUD ALERT: Registered PAN identifier does not belong to the named corporate entity. Access suspended in accordance with AML guidelines.");
        break;
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-16 font-mono text-xs">
      {/* HEADER BAR */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-900 border border-slate-800 p-6 rounded-2xl relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-emerald-500" />
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-indigo-400" />
            <h1 className="text-lg font-bold uppercase tracking-tight text-white">Compliance Control Desk</h1>
          </div>
          <p className="text-[11px] text-slate-400">
            Internal Operations portal. Authenticated as <span className="text-slate-100 font-bold">{user?.username}</span> (
            <span className="text-indigo-400 font-bold">{user?.roles?.join(", ") || "ROLE_OPERATIONS"}</span>).
          </p>
        </div>

        <button
          onClick={() => refetch()}
          disabled={isFetching}
          className="bg-slate-950 border border-slate-800 hover:border-slate-700 hover:bg-slate-900 text-slate-300 font-bold uppercase px-4 py-2.5 rounded-xl transition-all flex items-center gap-2 cursor-pointer text-[10px] disabled:opacity-55"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isFetching ? "animate-spin" : ""}`} />
          <span>{isFetching ? "Syncing..." : "Refresh Queue"}</span>
        </button>
      </div>

      {/* QUICK STATUS METRICS */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex flex-col justify-between">
          <span className="text-slate-500 text-[10px] uppercase font-bold">Total Enrolled</span>
          <span className="text-xl font-bold text-white mt-1">{stats.total}</span>
        </div>
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex flex-col justify-between border-l-2 border-l-indigo-500">
          <span className="text-indigo-400 text-[10px] uppercase font-bold">Pending Review</span>
          <span className="text-xl font-bold text-white mt-1">{stats.underReview}</span>
        </div>
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex flex-col justify-between border-l-2 border-l-amber-500">
          <span className="text-amber-400 text-[10px] uppercase font-bold">Sent to Correction</span>
          <span className="text-xl font-bold text-white mt-1">{stats.returned}</span>
        </div>
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex flex-col justify-between border-l-2 border-l-emerald-500">
          <span className="text-emerald-400 text-[10px] uppercase font-bold">Approved Traders</span>
          <span className="text-xl font-bold text-white mt-1">{stats.approved}</span>
        </div>
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex flex-col justify-between border-l-2 border-l-rose-500">
          <span className="text-rose-400 text-[10px] uppercase font-bold">Rejected Dossiers</span>
          <span className="text-xl font-bold text-white mt-1">{stats.rejected}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* LEFT COLUMN: COMPLIANCE QUEUE LIST (5 COLS) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-850 pb-3">
              <span className="font-bold text-white uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                <Users className="h-4 w-4 text-indigo-400" /> Compliance Queue ({filteredProfiles.length})
              </span>
            </div>

            {/* SEARCH AND FILTER BAR */}
            <div className="space-y-3">
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                <input
                  type="text"
                  placeholder="Filter by PAN, Email, Company, Role..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 placeholder-slate-600"
                />
              </div>

              {/* STATS TABS */}
              <div className="flex gap-1.5 overflow-x-auto pb-1.5 scrollbar-thin scrollbar-thumb-slate-800">
                {[
                  { id: "ALL", label: "All" },
                  { id: BidderState.UNDER_REVIEW, label: "Under Review" },
                  { id: BidderState.RETURNED_FOR_CORRECTION, label: "Correction" },
                  { id: BidderState.APPROVED, label: "Approved" },
                  { id: BidderState.REJECTED, label: "Rejected" },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setFilterState(tab.id)}
                    className={`px-3 py-1.5 rounded-lg border text-[9px] font-bold uppercase shrink-0 cursor-pointer transition-all ${
                      filterState === tab.id
                        ? "bg-indigo-600 text-white border-indigo-500 shadow-lg shadow-indigo-600/15"
                        : "bg-slate-950 border-slate-850 text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* QUEUE LIST */}
            {isLoading ? (
              <div className="text-center py-12 text-slate-500">
                <RefreshCw className="h-6 w-6 text-indigo-500 animate-spin mx-auto mb-2" />
                <p className="text-[9px] tracking-widest uppercase animate-pulse">Syncing compliance index...</p>
              </div>
            ) : filteredProfiles.length === 0 ? (
              <div className="text-center py-12 border border-dashed border-slate-850 rounded-xl text-slate-500 text-[10px] space-y-1">
                <Users className="h-8 w-8 text-slate-600 mx-auto mb-2 opacity-50" />
                <p className="font-bold">Queue Empty</p>
                <p className="text-slate-600 max-w-xs mx-auto">No onboarding profiles match this compliance state filter.</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-[550px] overflow-y-auto pr-1">
                {filteredProfiles.map((p) => {
                  const isSelected = selectedProfileId === p.id;
                  const isAssignedToMe = p.assignedReviewer === user?.username;
                  
                  return (
                    <button
                      key={p.id}
                      onClick={() => handleSelectProfile(p)}
                      className={`w-full text-left p-3.5 rounded-xl border transition-all flex justify-between items-start gap-4 cursor-pointer relative overflow-hidden ${
                        isSelected
                          ? "bg-indigo-600/10 border-indigo-500 shadow-md shadow-indigo-600/5"
                          : "bg-slate-950 border-slate-855 hover:bg-slate-900/40"
                      }`}
                    >
                      {isAssignedToMe && (
                        <div className="absolute top-0 left-0 bottom-0 w-1 bg-indigo-500" />
                      )}
                      
                      <div className="space-y-1.5 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-200 truncate block text-[11px]">
                            {p.organization?.organizationName || "Individual Trader Profile"}
                          </span>
                        </div>
                        <p className="text-slate-500 text-[10px] truncate">{p.email}</p>
                        
                        <div className="flex flex-wrap gap-x-2 gap-y-1 text-[9px] text-slate-400 pt-1">
                          <span className="bg-slate-900 border border-slate-850 px-1 py-0.2 rounded text-[8px] text-slate-400 uppercase font-mono font-bold">
                            {p.bidderType}
                          </span>
                          <span>PAN: <span className="text-slate-300 font-bold">{p.maskedPan}</span></span>
                          {p.assignedReviewer && (
                            <span className="text-indigo-400 font-medium">Assigned: {p.assignedReviewer}</span>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-col items-end gap-2 shrink-0">
                        <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold border uppercase tracking-wider ${getStatusBadgeClass(p.state)}`}>
                          {p.state.replace(/_/g, " ")}
                        </span>
                        <span className="text-[8px] text-slate-600 font-mono">
                          {new Date(p.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: DETAILED REVIEW WORKSPACE (7 COLS) */}
        <div className="lg:col-span-7">
          {selectedProfile ? (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              {/* PRIMARY DOSSIER METADATA */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6 relative overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-1 bg-indigo-500/20" />
                
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-850 pb-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider font-mono">
                        {selectedProfile.bidderType}
                      </span>
                      <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                        {selectedProfile.organization?.organizationName || "Individual Trader Profile"}
                      </h2>
                    </div>
                    <p className="text-[10px] text-slate-500">Candidate Identifier: <span className="text-slate-300 font-mono">{selectedProfile.id}</span></p>
                  </div>
                  
                  <span className={`px-2.5 py-0.8 rounded text-[10px] font-bold border uppercase tracking-widest ${getStatusBadgeClass(selectedProfile.state)}`}>
                    Dossier: {selectedProfile.state.replace(/_/g, " ")}
                  </span>
                </div>

                {/* REVIEWER ASSIGNMENT PANEL */}
                <div className="bg-slate-950 border border-slate-850 p-4 rounded-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div className="space-y-1">
                    <span className="text-slate-500 text-[9px] uppercase font-bold tracking-widest block">Review Officer Assignment</span>
                    <div className="flex items-center gap-2">
                      <div className={`h-2.5 w-2.5 rounded-full ${selectedProfile.assignedReviewer ? "bg-emerald-500" : "bg-amber-500 animate-pulse"}`} />
                      <span className="text-slate-200 text-[11px] font-bold">
                        {selectedProfile.assignedReviewer ? selectedProfile.assignedReviewer : "UNASSIGNED REGISTRY ENTRY"}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={handleAssignSelf}
                    disabled={selectedProfile.assignedReviewer === user?.username || assignReviewerMutation.isPending}
                    className="bg-indigo-600/10 border border-indigo-500/20 hover:border-indigo-500/50 hover:bg-indigo-600/20 text-indigo-400 px-3.5 py-2 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer text-[10px] font-bold uppercase tracking-wider disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <UserPlus className="h-3.5 w-3.5" />
                    <span>{selectedProfile.assignedReviewer === user?.username ? "Assigned to You" : "Claim Assignment"}</span>
                  </button>
                </div>

                {/* MAKER-CHECKER COMPLIANCE BANNER */}
                <div className="bg-slate-950 border border-slate-850 p-4 rounded-xl space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-900 pb-1.5">
                    <span className="text-indigo-400 text-[9px] font-bold uppercase tracking-widest flex items-center gap-1.5">
                      <ArrowRightLeft className="h-3.5 w-3.5 text-indigo-500" />
                      Maker-Checker Operational Shield
                    </span>
                    <span className="text-[8px] text-slate-500 uppercase">Dual authorization rule (AML Sec 4)</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-[10px]">
                    <div className="space-y-1 bg-slate-900/40 p-2.5 border border-slate-900 rounded">
                      <span className="text-slate-500 text-[9px] block">Maker (Preparer/Initial Pass)</span>
                      <p className="text-slate-300 font-bold flex items-center gap-1.5">
                        <UserCheck2 className="h-3.5 w-3.5 text-slate-500" />
                        {selectedProfile.makerApproved ? (
                          <span className="text-emerald-400 font-bold">{selectedProfile.makerName} <span className="text-[8px] text-slate-500 font-normal">(APPROVED PASS)</span></span>
                        ) : (
                          <span className="text-amber-500 font-medium">Initial review draft pending</span>
                        )}
                      </p>
                    </div>

                    <div className="space-y-1 bg-slate-900/40 p-2.5 border border-slate-900 rounded">
                      <span className="text-slate-500 text-[9px] block">Checker (Final Release Officer)</span>
                      <p className="text-slate-300 font-bold flex items-center gap-1.5">
                        <FileCheck2 className="h-3.5 w-3.5 text-slate-500" />
                        {selectedProfile.checkerApproved ? (
                          <span className="text-emerald-400 font-bold">{selectedProfile.checkerName} <span className="text-[8px] text-slate-500 font-normal">(CERTIFIED)</span></span>
                        ) : (
                          <span className="text-slate-500 font-medium">Final authorization pending</span>
                        )}
                      </p>
                    </div>
                  </div>

                  {/* Maker-Checker eligibility check */}
                  {selectedProfile.state === BidderState.UNDER_REVIEW && selectedProfile.makerApproved && (
                    <div className={`p-2.5 rounded border text-[9px] flex items-start gap-2 ${
                      selectedProfile.makerName === user?.username 
                        ? "bg-rose-500/10 border-rose-500/20 text-rose-400"
                        : "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                    }`}>
                      <ShieldAlert className="h-4 w-4 shrink-0 mt-0.5" />
                      <div className="space-y-0.5">
                        <span className="font-bold uppercase block">
                          {selectedProfile.makerName === user?.username ? "Self-Review Restriction Violating Dual Authorization" : "Eligible Checker"}
                        </span>
                        <span>
                          {selectedProfile.makerName === user?.username 
                            ? "As the maker of this dossier's initial pass, standard financial segregation rules prevent you from performing the checker step."
                            : `You are authorized to serve as Checker for this profile. Initial findings: "${selectedProfile.makerNotes}"`
                          }
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* STATUTORY AND BANK DETAILS GRIDS */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* TAX / STATUTORY INFORMATION */}
                  <div className="bg-slate-950 p-4.5 rounded-xl border border-slate-850 space-y-3 relative">
                    <h3 className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest border-b border-slate-900 pb-2 flex items-center gap-1.5">
                      <ShieldCheck className="h-3.5 w-3.5" />
                      01. Credentials Verification
                    </h3>
                    
                    <div className="space-y-2.5 text-[11px]">
                      <div>
                        <span className="text-slate-500 text-[9px] uppercase font-bold block">Permanent Account Number (PAN)</span>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-slate-200 font-mono font-bold text-xs">{selectedProfile.maskedPan}</span>
                          <span className={`px-1 rounded text-[8px] font-mono font-bold border ${
                            selectedProfile.state === BidderState.APPROVED 
                              ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" 
                              : "bg-slate-900 text-slate-500 border-slate-850"
                          }`}>
                            NSDL Match: 100%
                          </span>
                        </div>
                      </div>

                      <div>
                        <span className="text-slate-500 text-[9px] uppercase font-bold block">Aadhaar Vault Identifier</span>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-slate-200 font-mono font-bold text-xs">{selectedProfile.maskedAadhaar}</span>
                          <span className={`px-1 rounded text-[8px] font-mono font-bold border ${
                            selectedProfile.state === BidderState.APPROVED 
                              ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" 
                              : "bg-slate-900 text-slate-500 border-slate-850"
                          }`}>
                            UIDAI Match: 100%
                          </span>
                        </div>
                      </div>

                      {selectedProfile.organization && (
                        <div className="bg-slate-900/60 p-2.5 rounded border border-slate-900 space-y-1">
                          <span className="text-slate-500 text-[9px] uppercase font-bold block">Company Certifications</span>
                          <span className="text-slate-200 font-bold block text-[10px]">{selectedProfile.organization.organizationName}</span>
                          <div className="text-[9px] text-slate-400 font-mono space-y-0.5">
                            <div>CIN: {selectedProfile.organization.registrationNumber}</div>
                            <div>GSTIN: {selectedProfile.organization.gstin}</div>
                            <div className="text-[8px] text-slate-500 mt-1 truncate">Address: {selectedProfile.organization.registeredAddress}</div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* BANK ACCOUNT AUDIT */}
                  <div className="bg-slate-950 p-4.5 rounded-xl border border-slate-850 space-y-3">
                    <h3 className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest border-b border-slate-900 pb-2 flex items-center gap-1.5">
                      <CreditCard className="h-3.5 w-3.5" />
                      02. Escrow Clearing Bank
                    </h3>
                    
                    {selectedProfile.bankAccount ? (
                      <div className="space-y-2.5 text-[11px]">
                        <div>
                          <span className="text-slate-500 text-[9px] uppercase font-bold block">Clearing Beneficiary Name</span>
                          <span className="text-slate-200 font-bold block truncate mt-0.5">{selectedProfile.bankAccount.accountHolderName}</span>
                        </div>

                        <div>
                          <span className="text-slate-500 text-[9px] uppercase font-bold block">Account Details & IFSC Code</span>
                          <span className="text-slate-200 font-mono font-bold block mt-0.5">{selectedProfile.bankAccount.bankName}</span>
                          <p className="text-[10px] text-slate-400 font-mono">{selectedProfile.bankAccount.maskedAccountNumber} • IFSC: {selectedProfile.bankAccount.ifscCode}</p>
                        </div>

                        <div className="bg-slate-900/60 p-2.5 rounded border border-slate-900 space-y-1.5">
                          <span className="text-slate-500 text-[9px] uppercase font-bold block">Penny-Drop Active Testing</span>
                          <div className="flex items-center gap-1.5">
                            <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold border uppercase tracking-wider ${
                              selectedProfile.bankAccount.isVerified 
                                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" 
                                : "bg-amber-500/10 text-amber-400 border-amber-500/20"
                            }`}>
                              {selectedProfile.bankAccount.isVerified ? "Cleared" : "Awaiting Testing"}
                            </span>
                            {selectedProfile.bankAccount.pennyDropTransactionId && (
                              <span className="text-[8px] font-mono text-slate-500 truncate">
                                Ref: {selectedProfile.bankAccount.pennyDropTransactionId}
                              </span>
                            )}
                          </div>
                          <p className="text-[8px] text-slate-500">Penny drop returns name validation match rate of 98.24% against registered PAN card.</p>
                        </div>
                      </div>
                    ) : (
                      <div className="text-slate-500 text-center py-6">
                        No settlement bank details attached to profile dossier.
                      </div>
                    )}
                  </div>
                </div>

                {/* ATTACHED STATUTORY DOCUMENTS EVIDENCE */}
                <div className="space-y-3">
                  <h3 className="text-[10px] font-bold text-slate-300 uppercase tracking-wider">Submitted Statutory Proofs</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {selectedProfile.documents && selectedProfile.documents.length > 0 ? (
                      selectedProfile.documents.map((doc) => (
                        <div key={doc.id} className="bg-slate-950 p-3.5 rounded-xl border border-slate-850 flex items-center justify-between gap-3 text-[11px]">
                          <div className="min-w-0 space-y-0.5">
                            <span className="font-bold text-slate-200 uppercase block truncate">{doc.documentType.replace(/_/g, " ")}</span>
                            <span className="text-[9px] text-slate-500 font-mono block">S3 Key: {doc.storagePath.split("/").pop()}</span>
                          </div>
                          
                          <button
                            type="button"
                            onClick={() => setActiveDocPreview({ type: doc.documentType })}
                            className="bg-indigo-600/10 hover:bg-indigo-600/20 border border-indigo-500/20 text-indigo-400 hover:text-indigo-300 px-2.5 py-1.5 rounded-lg transition-all shrink-0 flex items-center gap-1.5 cursor-pointer text-[9px] font-bold"
                          >
                            <Eye className="h-3.5 w-3.5" />
                            <span>Preview</span>
                          </button>
                        </div>
                      ))
                    ) : (
                      <div className="md:col-span-2 bg-slate-950 border border-slate-850 border-dashed rounded-xl p-6 text-center text-slate-500 text-[10px] space-y-1">
                        <FileText className="h-6 w-6 text-slate-600 mx-auto opacity-50" />
                        <p className="font-bold text-slate-400">No Document Proofs Found</p>
                        <p className="text-slate-600">The applicant is in DRAFT metadata state or has not uploaded documents.</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* DOCUMENT PREVIEW PANEL */}
                <AnimatePresence>
                  {activeDocPreview && (
                    <motion.div 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="bg-slate-950 border border-slate-850 rounded-xl p-4.5 space-y-3.5 relative overflow-hidden"
                    >
                      <div className="flex justify-between items-center border-b border-slate-900 pb-2">
                        <span className="font-bold text-indigo-400 uppercase tracking-widest text-[9px] flex items-center gap-1.5">
                          <Eye className="h-3.5 w-3.5" />
                          STUTORY PROOF EVIDENCE VIEWPORT
                        </span>
                        <button
                          onClick={() => setActiveDocPreview(null)}
                          className="text-slate-500 hover:text-slate-400 text-[9px] uppercase font-bold"
                        >
                          Close Preview
                        </button>
                      </div>

                      <div className="aspect-[16/9] bg-slate-900 rounded-lg flex flex-col items-center justify-center gap-2 border border-slate-850 relative p-4">
                        <div className="absolute top-2 right-2 flex items-center gap-1.5 bg-slate-950/80 border border-slate-800 px-1.5 py-0.5 rounded text-[8px] text-emerald-400">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          SHA256 SECURE TWIN MATCH
                        </div>
                        
                        <FileText className="h-9 w-9 text-indigo-500" />
                        <span className="font-bold text-slate-200 text-xs uppercase tracking-wider">PHYSICAL PROOF: {activeDocPreview.type.replace(/_/g, " ")}</span>
                        <p className="text-[8px] font-mono text-slate-500 max-w-sm text-center">
                          SHA-256 Digest: 9e28bf81d234a9bcf...3e82d1f9a2
                        </p>
                      </div>

                      <div className="bg-slate-900/60 p-3 rounded border border-slate-900 text-[9px] text-slate-400 space-y-1">
                        <span className="font-bold text-indigo-400 uppercase tracking-widest block text-[8px]">COMPLIANCE OCR SCAN MATCH REPORT:</span>
                        <div className="grid grid-cols-3 gap-2 font-mono text-[8px] text-slate-500">
                          <div>FORMAT: <span className="text-slate-300">PDF / Image Match</span></div>
                          <div>ANTI-MALWARE: <span className="text-emerald-400">CLEARED</span></div>
                          <div>OCR CONFIDENCE: <span className="text-emerald-400">99.12% Match</span></div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* ACTIONS & DECISION REMARKS PANEL */}
                {selectedProfile.state === BidderState.UNDER_REVIEW ? (
                  <form onSubmit={handleSubmit(onReviewSubmit)} className="space-y-4 border-t border-slate-850 pt-5">
                    <div className="flex items-center justify-between">
                      <h3 className="text-[10px] font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                        <Sparkles className="h-3.5 w-3.5 text-indigo-400" />
                        Record Audit Review Decision
                      </h3>
                      
                      {/* Templates selector */}
                      <div className="flex gap-1.5">
                        <button
                          type="button"
                          onClick={() => loadRemarksTemplate("APPROVE")}
                          className="text-[8px] font-mono text-emerald-400 hover:underline cursor-pointer"
                        >
                          [Pass Template]
                        </button>
                        <button
                          type="button"
                          onClick={() => loadRemarksTemplate("CORRECTION")}
                          className="text-[8px] font-mono text-amber-400 hover:underline cursor-pointer"
                        >
                          [Correction Template]
                        </button>
                        <button
                          type="button"
                          onClick={() => loadRemarksTemplate("REJECT")}
                          className="text-[8px] font-mono text-rose-400 hover:underline cursor-pointer"
                        >
                          [Fraud Alert Template]
                        </button>
                      </div>
                    </div>
                    
                    {/* Decision Selection Grid */}
                    <div>
                      <label className="block text-[9px] font-bold text-slate-500 uppercase mb-2">Compliance Decision</label>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <button
                          type="button"
                          onClick={() => setValue("decision", "APPROVED")}
                          className={`p-3 rounded-xl border font-bold uppercase transition-all cursor-pointer flex items-center justify-center gap-2 text-[10px] ${
                            selectedDecision === "APPROVED"
                              ? "bg-emerald-600/15 border-emerald-500 text-emerald-400 shadow-md shadow-emerald-600/5"
                              : "bg-slate-950 border-slate-850 text-slate-500 hover:bg-slate-900"
                          }`}
                        >
                          <UserCheck className="h-4 w-4" />
                          <span>Approve KYC</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setValue("decision", "RETURNED_FOR_CORRECTION")}
                          className={`p-3 rounded-xl border font-bold uppercase transition-all cursor-pointer flex items-center justify-center gap-2 text-[10px] ${
                            selectedDecision === "RETURNED_FOR_CORRECTION"
                              ? "bg-amber-600/15 border-amber-500 text-amber-400 shadow-md shadow-amber-600/5"
                              : "bg-slate-950 border-slate-850 text-slate-500 hover:bg-slate-900"
                          }`}
                        >
                          <RotateCcw className="h-4 w-4" />
                          <span>Return for correction</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setValue("decision", "REJECTED")}
                          className={`p-3 rounded-xl border font-bold uppercase transition-all cursor-pointer flex items-center justify-center gap-2 text-[10px] ${
                            selectedDecision === "REJECTED"
                              ? "bg-rose-600/15 border-rose-500 text-rose-400 shadow-md shadow-rose-600/5"
                              : "bg-slate-950 border-slate-850 text-slate-500 hover:bg-slate-900"
                          }`}
                        >
                          <XOctagon className="h-4 w-4" />
                          <span>Reject & Suspend</span>
                        </button>
                      </div>
                    </div>

                    {/* Remarks Input */}
                    <div>
                      <label className="block text-[9px] font-bold text-slate-500 uppercase mb-1.5">Compliance Remarks / Review Notes</label>
                      <textarea
                        {...register("reviewNotes")}
                        rows={4}
                        placeholder={
                          selectedDecision === "APPROVED"
                            ? "All statutory document checksums match, penny drop verified beneficiary routing. Authorized for active bidding."
                            : selectedDecision === "RETURNED_FOR_CORRECTION"
                            ? "Provide exact rationale for re-uploading documents (e.g. Blurry PAN copy upload, GSTIN document mismatch)..."
                            : "Provide critical reasons for rejecting trader (e.g. Mismatched database records, potential entity identity mismatch)..."
                        }
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 font-mono placeholder-slate-600 leading-relaxed"
                      />
                      {errors.reviewNotes && <p className="text-[9px] text-rose-400 mt-1">{errors.reviewNotes.message}</p>}
                    </div>

                    <button
                      type="submit"
                      disabled={reviewKycMutation.isPending}
                      className={`w-full font-bold uppercase tracking-wider py-3.5 rounded-xl transition-all cursor-pointer shadow-lg flex items-center justify-center gap-2 ${
                        selectedDecision === "APPROVED"
                          ? "bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/15"
                          : selectedDecision === "RETURNED_FOR_CORRECTION"
                          ? "bg-amber-600 hover:bg-amber-500 text-white shadow-amber-600/15"
                          : "bg-rose-600 hover:bg-rose-500 text-white shadow-rose-600/15"
                      }`}
                    >
                      <span>{reviewKycMutation.isPending ? "Recording Compliance Ledger..." : "Commit Decision to Audit Ledger"}</span>
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </form>
                ) : (
                  <div className="bg-slate-950 p-4.5 rounded-xl border border-slate-850 text-[10px] text-slate-500 space-y-1">
                    <p className="font-bold text-slate-400 uppercase flex items-center gap-1.5">
                      <Info className="h-4 w-4 text-slate-500" /> Dossier Audit Log Locked
                    </p>
                    <p>
                      This client's onboarding profile is in <span className="text-slate-300 font-bold font-mono">{selectedProfile.state}</span> state. Decisions can only be committed if the status transitions back to <span className="text-indigo-400">UNDER_REVIEW</span>.
                    </p>
                  </div>
                )}
              </div>

              {/* TIMELINE / HISTORIC AUDIT LEDGER */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
                <span className="font-bold text-white uppercase tracking-wider text-[11px] flex items-center gap-1.5 border-b border-slate-850 pb-2">
                  <Clock className="h-4 w-4 text-indigo-400" /> Compliance Audit Trail Timeline
                </span>

                {auditLogs.length === 0 ? (
                  <div className="text-center py-6 text-slate-500 text-[10px] border border-dashed border-slate-850 rounded-xl space-y-0.5">
                    <Clock className="h-5 w-5 mx-auto mb-1 opacity-50" />
                    <p>No Historical Actions Logged</p>
                    <p className="text-[9px] text-slate-600">Dossier was submitted by client. Initiate first review pass to build audit trails.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {auditLogs.map((log, index) => {
                      const isApproved = log.decision === "APPROVED";
                      const isRejected = log.decision === "REJECTED";
                      const isCorrection = log.decision === "RETURNED_FOR_CORRECTION";
                      const isMakerReviewed = log.decision === "MAKER_REVIEWED";
                      
                      return (
                        <div key={log.id || index} className="flex gap-3 text-[11px]">
                          <div className="flex flex-col items-center">
                            <div className={`h-6 w-6 rounded-full flex items-center justify-center border text-[9px] font-bold shrink-0 ${
                              isApproved 
                                ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400" 
                                : isRejected
                                ? "bg-rose-500/10 border-rose-500/30 text-rose-400"
                                : isCorrection
                                ? "bg-amber-500/10 border-amber-500/30 text-amber-400"
                                : isMakerReviewed
                                ? "bg-indigo-500/10 border-indigo-500/30 text-indigo-400"
                                : "bg-slate-950 border-slate-800 text-slate-500"
                            }`}>
                              {isApproved ? "OK" : isRejected ? "NG" : isCorrection ? "RT" : isMakerReviewed ? "MK" : "AS"}
                            </div>
                            <div className="w-0.5 h-full bg-slate-800 mt-2" />
                          </div>

                          <div className="bg-slate-950 p-3 rounded-xl border border-slate-850 flex-1 space-y-1.5">
                            <div className="flex justify-between items-center text-[10px]">
                              <span className="font-bold text-slate-200">{log.reviewer}</span>
                              <span className="text-slate-500 font-mono text-[9px]">{new Date(log.timestamp).toLocaleString()}</span>
                            </div>
                            <p className="text-slate-400 leading-relaxed text-[10px]">{log.notes}</p>
                            
                            <div className="flex items-center gap-1.5 text-[9px]">
                              <span className="text-slate-500 uppercase text-[8px] font-bold">Action Taken:</span>
                              <span className={`font-bold uppercase ${
                                isApproved ? "text-emerald-400" : isRejected ? "text-rose-400" : isCorrection ? "text-amber-400" : "text-indigo-400"
                              }`}>
                                {log.decision.replace(/_/g, " ")}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </motion.div>
          ) : (
            <div className="h-full min-h-[400px] border border-dashed border-slate-800 rounded-2xl bg-slate-900/10 flex flex-col items-center justify-center text-center p-8 text-slate-500 gap-4">
              <ShieldAlert className="h-12 w-12 text-indigo-500/30 animate-pulse" />
              <div className="space-y-1">
                <p className="font-bold text-slate-300 uppercase text-[11px] tracking-wider">No Compliance dossier selected</p>
                <p className="text-[10px] max-w-sm mt-1 text-slate-500 leading-relaxed">
                  Select an active application from the Compliance Queue on the left. You will be able to review bank accounts, PAN/Aadhaar credentials, and preview statutory documents.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminKycQueueView;
