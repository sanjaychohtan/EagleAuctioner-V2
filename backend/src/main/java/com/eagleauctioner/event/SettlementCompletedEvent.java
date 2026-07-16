package com.eagleauctioner.event;

import lombok.Getter;
import lombok.ToString;
import java.util.UUID;
import java.time.Instant;

/**
 * Domain Event published when a Settlement is completed.
 */
@Getter
@ToString
public class SettlementCompletedEvent {
    private final UUID settlementId;
    private final UUID contractId;
    private final String completedBy;
    private final Instant timestamp;

    public SettlementCompletedEvent(UUID settlementId, UUID contractId, String completedBy) {
        this.settlementId = settlementId;
        this.contractId = contractId;
        this.completedBy = completedBy;
        this.timestamp = Instant.now();
    }
}
