package com.eagleauctioner.event;

import lombok.Getter;
import lombok.ToString;
import java.util.UUID;
import java.time.Instant;

/**
 * Domain Event published when an under-reserve winner is rejected by seller/admin.
 */
@Getter
@ToString
public class WinnerRejectedEvent {
    private final UUID winnerId;
    private final UUID auctionLotId;
    private final UUID bidderProfileId;
    private final String rejectedBy;
    private final Instant timestamp;

    public WinnerRejectedEvent(UUID winnerId, UUID auctionLotId, UUID bidderProfileId, String rejectedBy) {
        this.winnerId = winnerId;
        this.auctionLotId = auctionLotId;
        this.bidderProfileId = bidderProfileId;
        this.rejectedBy = rejectedBy;
        this.timestamp = Instant.now();
    }
}
