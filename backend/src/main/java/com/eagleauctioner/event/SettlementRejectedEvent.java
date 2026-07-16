package com.eagleauctioner.event;

import lombok.Getter;
import lombok.ToString;
import java.util.UUID;
import java.time.Instant;

/**
 * Domain Event published when a Settlement is rejected during approval.
 */
@Getter
@ToString
public class SettlementRejectedEvent {
    private final UUID settlementId;
    private final UUID contractId;
    private final String rejectedBy;
    private final String reason;
    private final Instant timestamp;

    public SettlementRejectedEvent(UUID settlementId, UUID contractId, String rejectedBy, String reason) {
        this.settlementId = settlementId;
        this.contractId = contractId;
        this.rejectedBy = rejectedBy;
        this.reason = reason;
        this.timestamp = Instant.now();
    }
}
