import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { bidService } from "../api/bidService";
import { PlaceBidRequest, PlaceSealedBidRequest } from "../types/bid";

export const useHighestBid = (lotId: string) => {
  return useQuery({
    queryKey: ["highestBid", lotId],
    queryFn: () => bidService.getHighestBid(lotId),
    enabled: !!lotId,
  });
};

export const useBidHistory = (lotId: string) => {
  return useQuery({
    queryKey: ["bidHistory", lotId],
    queryFn: () => bidService.getBidHistory(lotId),
    enabled: !!lotId,
  });
};

export const useMyRank = (lotId: string) => {
  return useQuery({
    queryKey: ["myRank", lotId],
    queryFn: () => bidService.getMyRank(lotId),
    enabled: !!lotId,
  });
};

export const usePlaceBidMutation = (lotId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (request: PlaceBidRequest) => bidService.placeBid(lotId, request),
    onSuccess: () => {
      // In a real live bidding scenario, WebSockets usually handle cache invalidation,
      // but invalidating here provides an optimistic-like fallback.
      queryClient.invalidateQueries({ queryKey: ["highestBid", lotId] });
      queryClient.invalidateQueries({ queryKey: ["bidHistory", lotId] });
      queryClient.invalidateQueries({ queryKey: ["myRank", lotId] });
      // We might also need to invalidate the auction details to reflect updated lot data
      queryClient.invalidateQueries({ queryKey: ["auction"] });
    },
  });
};

export const usePlaceSealedBidMutation = (lotId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (request: PlaceSealedBidRequest) => bidService.placeSealedBid(lotId, request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bidHistory", lotId] });
      queryClient.invalidateQueries({ queryKey: ["auction"] });
    },
  });
};

export const useOpenSealedBidsMutation = (lotId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => bidService.openSealedBids(lotId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["highestBid", lotId] });
      queryClient.invalidateQueries({ queryKey: ["bidHistory", lotId] });
      queryClient.invalidateQueries({ queryKey: ["auction"] });
    },
  });
};
