package com.eagleauctioner.service;

import com.eagleauctioner.dto.AuctionDTOs.*;
import java.util.UUID;

/**
 * Service interface for managing lots within auctions.
 */
public interface AuctionLotService {
    AuctionLotResponse createLot(UUID auctionId, CreateLotRequest request, UUID sellerProfileId, UUID userId);
    AuctionLotResponse updateLot(UUID lotId, UpdateLotRequest request, UUID sellerProfileId, UUID userId);
    void deleteDraftLot(UUID lotId, UUID sellerProfileId, UUID userId);
    AuctionLotResponse publishLot(UUID lotId, UUID sellerProfileId, UUID userId);
    void sortLots(UUID auctionId, LotSortRequest request, UUID sellerProfileId, UUID userId);
}
