package com.eagleauctioner.service;

import com.eagleauctioner.dto.AuctionDTOs.AuctionResponse;
import java.util.UUID;

/**
 * Specialized service handling the complex publishing workflow of an auction.
 */
public interface AuctionPublishService {
    AuctionResponse publish(UUID auctionId, String publisherId);
}
