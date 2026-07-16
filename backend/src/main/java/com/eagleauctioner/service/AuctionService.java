package com.eagleauctioner.service;

import com.eagleauctioner.dto.AuctionDTOs.*;
import java.util.UUID;

/**
 * Service interface for managing the auction lifecycle.
 */
public interface AuctionService {
    AuctionResponse createAuction(CreateAuctionRequest request, UUID userId);
    AuctionResponse updateAuction(UUID id, UpdateAuctionRequest request, UUID sellerProfileId, UUID userId);
    AuctionResponse updateSettings(UUID id, UpdateSettingsRequest request, UUID sellerProfileId, UUID userId);
    AuctionResponse submitForReview(UUID id, UUID sellerProfileId, UUID userId);
    AuctionResponse approveAuction(UUID id, String reviewerId);
    AuctionResponse rejectAuction(UUID id, String reviewerId);
    AuctionResponse publishAuction(UUID id, String publisherId);
    AuctionResponse cancelAuction(UUID id, String cancellerId);
    AuctionResponse archiveAuction(UUID id, String archiverId);
    AuctionResponse getAuctionDetails(UUID id);
    PaginatedAuctionResponse listAuctions(int page, int size, String sortBy, String sortDir, String state, String type);
}
