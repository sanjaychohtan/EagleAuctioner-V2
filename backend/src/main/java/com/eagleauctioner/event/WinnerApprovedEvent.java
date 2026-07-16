package com.eagleauctioner.event;

import lombok.Getter;
import lombok.ToString;
import java.util.UUID;
import java.time.Instant;


/**
 * Domain Event published when an under-reserve winner is approved by seller/admin.
 */
@Getter
@ToString
public class WinnerApprovedEvent {
    private final UUID winnerId;
    private final UUID auctionLotId;
    private final UUID bidderProfileId;
    private final Long winningAmount;
    private final String approvedBy;
    private final Instant timestamp;

    public WinnerApprovedEvent(UUID winnerId, UUID auctionLotId, UUID bidderProfileId, Long winningAmount, String approvedBy) {
        this.winnerId = winnerId;
        this.auctionLotId = auctionLotId;
        this.bidderProfileId = bidderProfileId;
        this.winningAmount = winningAmount;
        this.approvedBy = approvedBy;
        this.timestamp = Instant.now();
    }
}
