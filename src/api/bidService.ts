import { apiClient } from "./client";
import { ApiResponse } from "../types/auction";
import { 
  PlaceBidRequest, 
  PlaceSealedBidRequest,
  BidResponse, 
  BidHistoryResponse,
  RankStatusResponse,
  SealedBidOpeningResponse
} from "../types/bid";
import { API_ENDPOINTS } from "../constants";

export const bidService = {
  placeBid: async (lotId: string, data: PlaceBidRequest): Promise<BidResponse> => {
    const response = await apiClient.post<ApiResponse<BidResponse>>(API_ENDPOINTS.BID.PLACE(lotId), data);
    return response.data.data;
  },

  placeSealedBid: async (lotId: string, data: PlaceSealedBidRequest): Promise<BidResponse> => {
    const response = await apiClient.post<ApiResponse<BidResponse>>(API_ENDPOINTS.BID.PLACE_SEALED(lotId), data);
    return response.data.data;
  },

  getHighestBid: async (lotId: string): Promise<BidResponse | null> => {
    const response = await apiClient.get<ApiResponse<BidResponse | null>>(API_ENDPOINTS.BID.HIGHEST(lotId));
    return response.data.data;
  },

  getBidHistory: async (lotId: string): Promise<BidHistoryResponse[]> => {
    const response = await apiClient.get<ApiResponse<BidHistoryResponse[]>>(API_ENDPOINTS.BID.HISTORY(lotId));
    return response.data.data;
  },

  getMyRank: async (lotId: string): Promise<RankStatusResponse> => {
    const response = await apiClient.get<ApiResponse<RankStatusResponse>>(API_ENDPOINTS.BID.MY_RANK(lotId));
    return response.data.data;
  },

  openSealedBids: async (lotId: string): Promise<SealedBidOpeningResponse> => {
    const response = await apiClient.post<ApiResponse<SealedBidOpeningResponse>>(API_ENDPOINTS.BID.OPEN_SEALED(lotId));
    return response.data.data;
  }
};
