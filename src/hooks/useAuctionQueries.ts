import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AuctionService } from "../api/auctionService";
import { useAuctionStore } from "../store/useAuctionStore";
import {
  CreateAuctionRequest,
  UpdateAuctionRequest,
  UpdateSettingsRequest,
  CreateLotRequest,
  UpdateLotRequest,
  LotSortRequest,
} from "../types/auction";

// TanStack Query Keys
export const AUCTION_KEYS = {
  all: ["auctions"] as const,
  lists: () => [...AUCTION_KEYS.all, "list"] as const,
  details: () => [...AUCTION_KEYS.all, "detail"] as const,
  detail: (id: string) => [...AUCTION_KEYS.details(), id] as const,
};

/**
 * Hook to retrieve all auctions.
 * Updates the local Zustand store on successful load.
 */
export const useAuctions = (options?: { enabled?: boolean }) => {
  const setAuctions = useAuctionStore((state) => state.setAuctions);

  return useQuery({
    queryKey: AUCTION_KEYS.lists(),
    queryFn: async () => {
      const data = await AuctionService.listAuctions();
      setAuctions(data);
      return data;
    },
    staleTime: 1000 * 30, // 30 seconds stale time
    enabled: options?.enabled ?? true,
  });
};

/**
 * Hook to retrieve detailed information for a single auction.
 * Updates the local Zustand store currentAuction on successful load.
 */
export const useAuctionDetails = (id: string) => {
  const setCurrentAuction = useAuctionStore((state) => state.setCurrentAuction);

  return useQuery({
    queryKey: AUCTION_KEYS.detail(id),
    queryFn: async () => {
      if (!id) return null;
      const data = await AuctionService.getAuctionDetails(id);
      setCurrentAuction(data);
      return data;
    },
    enabled: !!id,
    staleTime: 1000 * 10, // 10 seconds stale time for detailed sheets
  });
};

/**
 * Mutation hook to create a new auction.
 */
export const useCreateAuctionMutation = () => {
  const queryClient = useQueryClient();
  const addAuctionSummary = useAuctionStore((state) => state.addAuctionSummary);

  return useMutation({
    mutationFn: (request: CreateAuctionRequest) => AuctionService.createAuction(request),
    onSuccess: (data) => {
      // Optimistically add to Zustand
      addAuctionSummary({
        id: data.id,
        auctionNumber: data.auctionNumber,
        title: data.title,
        state: data.state,
        auctionType: data.auctionType,
        visibility: data.visibility,
        auctionStart: data.auctionStart,
        auctionEnd: data.auctionEnd,
        lotCount: data.lots?.length || 0,
      });
      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: AUCTION_KEYS.lists() });
    },
  });
};

/**
 * Mutation hook to update an auction's basic details.
 */
export const useUpdateAuctionMutation = () => {
  const queryClient = useQueryClient();
  const updateAuctionInList = useAuctionStore((state) => state.updateAuctionInList);
  const setCurrentAuction = useAuctionStore((state) => state.setCurrentAuction);

  return useMutation({
    mutationFn: ({ id, request }: { id: string; request: UpdateAuctionRequest }) =>
      AuctionService.updateAuction(id, request),
    onSuccess: (data) => {
      // Sync local store
      updateAuctionInList({
        id: data.id,
        auctionNumber: data.auctionNumber,
        title: data.title,
        state: data.state,
        auctionType: data.auctionType,
        visibility: data.visibility,
        auctionStart: data.auctionStart,
        auctionEnd: data.auctionEnd,
        lotCount: data.lots?.length || 0,
      });
      setCurrentAuction(data);
      queryClient.invalidateQueries({ queryKey: AUCTION_KEYS.lists() });
      queryClient.invalidateQueries({ queryKey: AUCTION_KEYS.detail(data.id) });
    },
  });
};

/**
 * Mutation hook to update auction business rules/settings.
 */
export const useUpdateSettingsMutation = () => {
  const queryClient = useQueryClient();
  const setCurrentAuction = useAuctionStore((state) => state.setCurrentAuction);

  return useMutation({
    mutationFn: ({ id, request }: { id: string; request: UpdateSettingsRequest }) =>
      AuctionService.updateSettings(id, request),
    onSuccess: (data) => {
      setCurrentAuction(data);
      queryClient.invalidateQueries({ queryKey: AUCTION_KEYS.detail(data.id) });
    },
  });
};

/**
 * Mutation hook to submit an auction draft for administrative review.
 */
export const useSubmitForReviewMutation = () => {
  const queryClient = useQueryClient();
  const setCurrentAuction = useAuctionStore((state) => state.setCurrentAuction);

  return useMutation({
    mutationFn: (id: string) => AuctionService.submitForReview(id),
    onSuccess: (data) => {
      setCurrentAuction(data);
      queryClient.invalidateQueries({ queryKey: AUCTION_KEYS.lists() });
      queryClient.invalidateQueries({ queryKey: AUCTION_KEYS.detail(data.id) });
    },
  });
};

/**
 * Mutation hook to approve an auction (Admin only).
 */
export const useApproveAuctionMutation = () => {
  const queryClient = useQueryClient();
  const setCurrentAuction = useAuctionStore((state) => state.setCurrentAuction);

  return useMutation({
    mutationFn: (id: string) => AuctionService.approveAuction(id),
    onSuccess: (data) => {
      setCurrentAuction(data);
      queryClient.invalidateQueries({ queryKey: AUCTION_KEYS.lists() });
      queryClient.invalidateQueries({ queryKey: AUCTION_KEYS.detail(data.id) });
    },
  });
};

/**
 * Mutation hook to reject an auction draft (Admin only).
 */
export const useRejectAuctionMutation = () => {
  const queryClient = useQueryClient();
  const setCurrentAuction = useAuctionStore((state) => state.setCurrentAuction);

  return useMutation({
    mutationFn: (id: string) => AuctionService.rejectAuction(id),
    onSuccess: (data) => {
      setCurrentAuction(data);
      queryClient.invalidateQueries({ queryKey: AUCTION_KEYS.lists() });
      queryClient.invalidateQueries({ queryKey: AUCTION_KEYS.detail(data.id) });
    },
  });
};

/**
 * Mutation hook to publish an approved auction live.
 */
export const usePublishAuctionMutation = () => {
  const queryClient = useQueryClient();
  const setCurrentAuction = useAuctionStore((state) => state.setCurrentAuction);

  return useMutation({
    mutationFn: (id: string) => AuctionService.publishAuction(id),
    onSuccess: (data) => {
      setCurrentAuction(data);
      queryClient.invalidateQueries({ queryKey: AUCTION_KEYS.lists() });
      queryClient.invalidateQueries({ queryKey: AUCTION_KEYS.detail(data.id) });
    },
  });
};

/**
 * Mutation hook to cancel an active or scheduled auction.
 */
export const useCancelAuctionMutation = () => {
  const queryClient = useQueryClient();
  const setCurrentAuction = useAuctionStore((state) => state.setCurrentAuction);

  return useMutation({
    mutationFn: (id: string) => AuctionService.cancelAuction(id),
    onSuccess: (data) => {
      setCurrentAuction(data);
      queryClient.invalidateQueries({ queryKey: AUCTION_KEYS.lists() });
      queryClient.invalidateQueries({ queryKey: AUCTION_KEYS.detail(data.id) });
    },
  });
};

/**
 * Mutation hook to archive a completed, settled, or cancelled auction.
 */
export const useArchiveAuctionMutation = () => {
  const queryClient = useQueryClient();
  const setCurrentAuction = useAuctionStore((state) => state.setCurrentAuction);

  return useMutation({
    mutationFn: (id: string) => AuctionService.archiveAuction(id),
    onSuccess: (data) => {
      setCurrentAuction(data);
      queryClient.invalidateQueries({ queryKey: AUCTION_KEYS.lists() });
      queryClient.invalidateQueries({ queryKey: AUCTION_KEYS.detail(data.id) });
    },
  });
};

// ==========================================
// LOT MUTATION HOOKS
// ==========================================

/**
 * Mutation hook to create a lot inside an auction.
 */
export const useCreateLotMutation = () => {
  const queryClient = useQueryClient();
  const addLotToCurrent = useAuctionStore((state) => state.addLotToCurrent);

  return useMutation({
    mutationFn: ({ auctionId, request }: { auctionId: string; request: CreateLotRequest }) =>
      AuctionService.createLot(auctionId, request),
    onSuccess: (data, variables) => {
      addLotToCurrent(data);
      queryClient.invalidateQueries({ queryKey: AUCTION_KEYS.detail(variables.auctionId) });
    },
  });
};

/**
 * Mutation hook to update a lot.
 */
export const useUpdateLotMutation = ({ auctionId }: { auctionId: string }) => {
  const queryClient = useQueryClient();
  const updateLotInCurrent = useAuctionStore((state) => state.updateLotInCurrent);

  return useMutation({
    mutationFn: ({ lotId, request }: { lotId: string; request: UpdateLotRequest }) =>
      AuctionService.updateLot(auctionId, lotId, request),
    onSuccess: (data) => {
      updateLotInCurrent(data);
      queryClient.invalidateQueries({ queryKey: AUCTION_KEYS.detail(auctionId) });
    },
  });
};

/**
 * Mutation hook to delete a draft lot.
 */
export const useDeleteLotMutation = ({ auctionId }: { auctionId: string }) => {
  const queryClient = useQueryClient();
  const removeLotFromCurrent = useAuctionStore((state) => state.removeLotFromCurrent);

  return useMutation({
    mutationFn: (lotId: string) => AuctionService.deleteLot(auctionId, lotId),
    onSuccess: (_, lotId) => {
      removeLotFromCurrent(lotId);
      queryClient.invalidateQueries({ queryKey: AUCTION_KEYS.detail(auctionId) });
    },
  });
};

/**
 * Mutation hook to publish a draft lot.
 */
export const usePublishLotMutation = ({ auctionId }: { auctionId: string }) => {
  const queryClient = useQueryClient();
  const updateLotInCurrent = useAuctionStore((state) => state.updateLotInCurrent);

  return useMutation({
    mutationFn: (lotId: string) => AuctionService.publishLot(auctionId, lotId),
    onSuccess: (data) => {
      updateLotInCurrent(data);
      queryClient.invalidateQueries({ queryKey: AUCTION_KEYS.detail(auctionId) });
    },
  });
};

/**
 * Mutation hook to re-order the display order of lots inside an auction.
 */
export const useSortLotsMutation = () => {
  const queryClient = useQueryClient();
  const reorderLotsInCurrent = useAuctionStore((state) => state.reorderLotsInCurrent);

  return useMutation({
    mutationFn: ({ auctionId, request }: { auctionId: string; request: LotSortRequest }) =>
      AuctionService.sortLots(auctionId, request),
    onSuccess: (_, variables) => {
      reorderLotsInCurrent(variables.request.sortedLotIds);
      queryClient.invalidateQueries({ queryKey: AUCTION_KEYS.detail(variables.auctionId) });
    },
  });
};
