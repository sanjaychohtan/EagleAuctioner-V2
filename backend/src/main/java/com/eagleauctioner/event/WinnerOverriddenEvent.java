package com.eagleauctioner.event;

import lombok.Getter;
import lombok.ToString;
import java.util.UUID;
import java.time.Instant;

/**
 * Domain Event published when an admin manually overrides a lot winner.
 */
@Getter
@ToString
public class WinnerOverriddenEvent {
    private final UUID winnerId;
    private final UUID auctionLotId;
    private final UUID previousBidderProfileId;
    private final UUID newBidderProfileId;
    private final String overriddenBy;
    private final Instant timestamp;

    public WinnerOverriddenEvent(UUID winnerId, UUID auctionLotId, UUID previousBidderProfileId, UUID newBidderProfileId, String overriddenBy) {
        this.winnerId = winnerId;
        this.auctionLotId = auctionLotId;
        this.previousBidderProfileId = previousBidderProfileId;
        this.newBidderProfileId = newBidderProfileId;
        this.overriddenBy = overriddenBy;
        this.timestamp = Instant.now();
    }
}
