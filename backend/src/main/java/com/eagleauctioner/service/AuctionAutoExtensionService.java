package com.eagleauctioner.service;

import java.time.Instant;
import java.util.UUID;

public interface AuctionAutoExtensionService {
    boolean checkAndExtend(UUID auctionId, UUID lotId, Instant bidTime, String bidderCode);
}
