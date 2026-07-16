import { create } from "zustand";
import { BidderRegistrationRequest, BidderProfileResponse, OnboardingService } from "../api/onboardingService";

export interface KycStoreState {
  activeStep: number;
  draftData: Partial<BidderRegistrationRequest>;
  profile: BidderProfileResponse | null;
  isLoading: boolean;
  isSubmitting: boolean;
  isVerifyingBank: boolean;
  
  setStep: (step: number) => void;
  nextStep: () => void;
  prevStep: () => void;
  saveDraft: (data: Partial<BidderRegistrationRequest>) => void;
  loadDraft: () => Partial<BidderRegistrationRequest>;
  clearDraft: () => void;
  setProfile: (profile: BidderProfileResponse | null) => void;
  fetchProfile: () => Promise<void>;
  registerProfile: (data: BidderRegistrationRequest) => Promise<BidderProfileResponse>;
  verifyBank: (profileId: string) => Promise<void>;
  submitDocs: (profileId: string, docs: any[]) => Promise<void>;
}

const DRAFT_STORAGE_KEY = "ea_kyc_onboarding_draft";

export const useKycStore = create<KycStoreState>((set, get) => ({
  activeStep: 0,
  draftData: {},
  profile: null,
  isLoading: false,
  isSubmitting: false,
  isVerifyingBank: false,

  setStep: (step) => set({ activeStep: Math.max(0, Math.min(step, 4)) }),
  
  nextStep: () => set((state) => ({ activeStep: Math.min(state.activeStep + 1, 4) })),
  
  prevStep: () => set((state) => ({ activeStep: Math.max(state.activeStep - 1, 0) })),

  saveDraft: (data) => {
    const updatedDraft = { ...get().draftData, ...data };
    localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(updatedDraft));
    set({ draftData: updatedDraft });
  },

  loadDraft: () => {
    try {
      const stored = localStorage.getItem(DRAFT_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        set({ draftData: parsed });
        return parsed;
      }
    } catch (e) {
      console.error("Error loading KYC draft", e);
    }
    return {};
  },

  clearDraft: () => {
    localStorage.removeItem(DRAFT_STORAGE_KEY);
    set({ draftData: {}, activeStep: 0 });
  },

  setProfile: (profile) => set({ profile }),

  fetchProfile: async () => {
    set({ isLoading: true });
    try {
      const profile = await OnboardingService.getMyProfile();
      set({ profile });
    } catch (err) {
      console.error("Failed to fetch KYC profile", err);
    } finally {
      set({ isLoading: false });
    }
  },

  registerProfile: async (data) => {
    set({ isSubmitting: true });
    try {
      const res = await OnboardingService.registerBidder(data);
      set({ profile: res });
      get().clearDraft();
      return res;
    } finally {
      set({ isSubmitting: false });
    }
  },

  verifyBank: async (profileId) => {
    set({ isVerifyingBank: true });
    try {
      await OnboardingService.verifyBankAccount(profileId);
      await get().fetchProfile();
    } finally {
      set({ isVerifyingBank: false });
    }
  },

  submitDocs: async (profileId, docs) => {
    set({ isSubmitting: true });
    try {
      await OnboardingService.submitDocuments(profileId, docs);
      await get().fetchProfile();
    } finally {
      set({ isSubmitting: false });
    }
  }
}));
