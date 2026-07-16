package com.eagleauctioner.event;

import lombok.Getter;
import lombok.ToString;
import java.util.UUID;
import java.time.Instant;

/**
 * Domain Event published when a Settlement is cancelled.
 */
@Getter
@ToString
public class SettlementCancelledEvent {
    private final UUID settlementId;
    private final UUID contractId;
    private final String cancelledBy;
    private final Instant timestamp;

    public SettlementCancelledEvent(UUID settlementId, UUID contractId, String cancelledBy) {
        this.settlementId = settlementId;
        this.contractId = contractId;
        this.cancelledBy = cancelledBy;
        this.timestamp = Instant.now();
    }
}
