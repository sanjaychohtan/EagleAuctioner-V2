import { apiClient } from "./client";
import { API_ENDPOINTS } from "../constants";
import {
  ApiResponse,
  AuctionResponse,
  AuctionSummaryResponse,
  AuctionLotResponse,
  CreateAuctionRequest,
  UpdateAuctionRequest,
  UpdateSettingsRequest,
  CreateLotRequest,
  UpdateLotRequest,
  LotSortRequest,
} from "../types/auction";

const unwrapData = <T>(res: any): T => {
  if (res?.data?.data !== undefined) return res.data.data;
  if (res?.data?.content !== undefined) return res.data.content;
  return res?.data;
};

export const AuctionService = {
  /**
   * Creates a new auction in DRAFT state.
   * Path: POST /api/v1/auctions
   */
  async createAuction(request: CreateAuctionRequest): Promise<AuctionResponse> {
    console.log("[AuctionService] Creating a new auction draft with title:", request.title);
    const response = await apiClient.post(
      API_ENDPOINTS.AUCTION.CREATE,
      request
    );
    return unwrapData<AuctionResponse>(response);
  },

  /**
   * Updates an existing auction draft or rejected draft.
   * Path: PUT /api/v1/auctions/{id}
   */
  async updateAuction(id: string, request: UpdateAuctionRequest): Promise<AuctionResponse> {
    console.log(`[AuctionService] Updating auction draft ID: ${id}`);
    const response = await apiClient.put(
      API_ENDPOINTS.AUCTION.UPDATE(id),
      request
    );
    return unwrapData<AuctionResponse>(response);
  },

  /**
   * Updates settings/rules of an auction.
   * Path: PUT /api/v1/auctions/{id}/settings
   */
  async updateSettings(id: string, request: UpdateSettingsRequest): Promise<AuctionResponse> {
    console.log(`[AuctionService] Updating settings for auction ID: ${id}`);
    const response = await apiClient.put(
      API_ENDPOINTS.AUCTION.UPDATE_SETTINGS(id),
      request
    );
    return unwrapData<AuctionResponse>(response);
  },

  /**
   * Submits a draft auction for admin review.
   * Path: POST /api/v1/auctions/{id}/submit-review
   */
  async submitForReview(id: string): Promise<AuctionResponse> {
    console.log(`[AuctionService] Submitting auction ID: ${id} for admin review`);
    const response = await apiClient.post(
      API_ENDPOINTS.AUCTION.SUBMIT_REVIEW(id)
    );
    return unwrapData<AuctionResponse>(response);
  },

  /**
   * Approves an auction (Admin only).
   * Path: POST /api/v1/auctions/{id}/approve
   */
  async approveAuction(id: string): Promise<AuctionResponse> {
    console.log(`[AuctionService] Approving auction ID: ${id} (Admin action)`);
    const response = await apiClient.post(
      API_ENDPOINTS.AUCTION.APPROVE(id)
    );
    return unwrapData<AuctionResponse>(response);
  },

  /**
   * Rejects an auction draft (Admin only).
   * Path: POST /api/v1/auctions/{id}/reject
   */
  async rejectAuction(id: string): Promise<AuctionResponse> {
    console.log(`[AuctionService] Rejecting auction ID: ${id} (Admin action)`);
    const response = await apiClient.post(
      API_ENDPOINTS.AUCTION.REJECT(id)
    );
    return unwrapData<AuctionResponse>(response);
  },

  /**
   * Publishes an approved auction live.
   * Path: POST /api/v1/auctions/{id}/publish
   */
  async publishAuction(id: string): Promise<AuctionResponse> {
    console.log(`[AuctionService] Publishing approved auction ID: ${id} to active state`);
    const response = await apiClient.post(
      API_ENDPOINTS.AUCTION.PUBLISH(id)
    );
    return unwrapData<AuctionResponse>(response);
  },

  /**
   * Cancels an active or scheduled auction.
   * Path: POST /api/v1/auctions/{id}/cancel
   */
  async cancelAuction(id: string): Promise<AuctionResponse> {
    console.log(`[AuctionService] Cancelling auction ID: ${id}`);
    const response = await apiClient.post(
      API_ENDPOINTS.AUCTION.CANCEL(id)
    );
    return unwrapData<AuctionResponse>(response);
  },

  /**
   * Archives a settled or cancelled auction.
   * Path: POST /api/v1/auctions/{id}/archive
   */
  async archiveAuction(id: string): Promise<AuctionResponse> {
    console.log(`[AuctionService] Archiving auction ID: ${id}`);
    const response = await apiClient.post(
      API_ENDPOINTS.AUCTION.ARCHIVE(id)
    );
    return unwrapData<AuctionResponse>(response);
  },

  /**
   * Retrieves complete details of an auction.
   * Path: GET /api/v1/auctions/{id}
   */
  async getAuctionDetails(id: string): Promise<AuctionResponse> {
    console.log(`[AuctionService] Retrieving full details for auction ID: ${id}`);
    const response = await apiClient.get(
      API_ENDPOINTS.AUCTION.DETAIL(id)
    );
    return unwrapData<AuctionResponse>(response);
  },

  /**
   * Retrieves list of all auctions.
   * Path: GET /api/v1/auctions
   */
  async listAuctions(): Promise<AuctionSummaryResponse[]> {
    console.log("[AuctionService] Retrieving summary list of all auctions");
    const response = await apiClient.get(
      API_ENDPOINTS.AUCTION.LIST
    );
    const data = unwrapData<AuctionSummaryResponse[]>(response);
    return Array.isArray(data) ? data : [];
  },

  /**
   * Creates a new lot inside an auction.
   * Path: POST /api/v1/lots/auctions/{auctionId}
   */
  async createLot(auctionId: string, request: CreateLotRequest, sellerProfileId?: string): Promise<AuctionLotResponse> {
    console.log(`[AuctionService] Creating new lot for auction ID: ${auctionId}`);
    const response = await apiClient.post<ApiResponse<AuctionLotResponse>>(
      API_ENDPOINTS.LOT.CREATE(auctionId, sellerProfileId),
      request
    );
    return response.data.data;
  },

  /**
   * Updates an existing lot details.
   * Path: PUT /api/v1/auctions/{auctionId}/lots/{lotId}
   */
  async updateLot(auctionId: string, lotId: string, request: UpdateLotRequest, sellerProfileId?: string): Promise<AuctionLotResponse> {
    console.log(`[AuctionService] Updating existing lot ID: ${lotId}`);
    const response = await apiClient.put<ApiResponse<AuctionLotResponse>>(
      API_ENDPOINTS.LOT.UPDATE(auctionId, lotId, sellerProfileId),
      request
    );
    return response.data.data;
  },

  /**
   * Deletes a draft lot from an auction.
   * Path: DELETE /api/v1/auctions/{auctionId}/lots/{lotId}
   */
  async deleteLot(auctionId: string, lotId: string, sellerProfileId?: string): Promise<void> {
    console.log(`[AuctionService] Deleting draft lot ID: ${lotId}`);
    await apiClient.delete<ApiResponse<void>>(
      API_ENDPOINTS.LOT.DELETE(auctionId, lotId, sellerProfileId)
    );
  },

  /**
   * Publishes a draft lot inside an auction.
   * Path: POST /api/v1/auctions/{auctionId}/lots/{lotId}/publish
   */
  async publishLot(auctionId: string, lotId: string, sellerProfileId?: string): Promise<AuctionLotResponse> {
    console.log(`[AuctionService] Publishing draft lot ID: ${lotId}`);
    const response = await apiClient.post<ApiResponse<AuctionLotResponse>>(
      API_ENDPOINTS.LOT.PUBLISH(auctionId, lotId, sellerProfileId)
    );
    return response.data.data;
  },

  /**
   * Re-orders display order of lots inside an auction.
   * Path: POST /api/v1/auctions/{auctionId}/lots/sort
   */
  async sortLots(auctionId: string, request: LotSortRequest, sellerProfileId?: string): Promise<void> {
    console.log(`[AuctionService] Re-sorting display order of lots for auction ID: ${auctionId}`);
    await apiClient.post<ApiResponse<void>>(
      API_ENDPOINTS.LOT.SORT(auctionId, sellerProfileId),
      request
    );
  },

  /**
   * Imports lots in bulk from an Excel or CSV file.
   * Path: POST /api/v1/lots/import/auctions/{auctionId}
   */
  async importLots(auctionId: string, file: File): Promise<any> {
    console.log(`[AuctionService] Importing bulk lots for auction ID: ${auctionId}`);
    const formData = new FormData();
    formData.append("file", file);
    const response = await apiClient.post<ApiResponse<any>>(
      API_ENDPOINTS.LOT.IMPORT(auctionId),
      formData,
      {
        headers: { "Content-Type": "multipart/form-data" },
      }
    );
    return response.data.data;
  },
};

export default AuctionService;
