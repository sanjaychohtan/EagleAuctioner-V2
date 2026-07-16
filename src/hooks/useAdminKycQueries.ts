import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { OnboardingService, KycReviewRequest } from "../api/onboardingService";

// React Query Key Constants
export const ADMIN_KYC_KEYS = {
  queue: ["admin", "kyc", "queue"] as const,
};

/**
 * Hook to retrieve the pending KYC compliance queue
 */
export const useAdminKycQueue = () => {
  return useQuery({
    queryKey: ADMIN_KYC_KEYS.queue,
    queryFn: async () => {
      // Ensure seed data is populated
      OnboardingService.seedDemoProfiles();
      return await OnboardingService.getAdminPendingQueue();
    },
    staleTime: 1000 * 15, // Fresh for 15 seconds
  });
};

/**
 * Mutation to assign a reviewer officer to a KYC profile
 */
export const useAssignReviewerMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ profileId, reviewerName }: { profileId: string; reviewerName: string }) => {
      await OnboardingService.assignReviewer(profileId, reviewerName);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ADMIN_KYC_KEYS.queue });
    },
  });
};

/**
 * Mutation to submit a KYC review decision (Approve, Reject, Return for Correction)
 */
export const useReviewKycMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ profileId, request }: { profileId: string; request: KycReviewRequest }) => {
      await OnboardingService.reviewKyc(profileId, request);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ADMIN_KYC_KEYS.queue });
    },
  });
};
