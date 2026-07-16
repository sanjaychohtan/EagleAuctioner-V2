package com.eagleauctioner.event;

import lombok.Getter;
import lombok.ToString;
import java.util.UUID;
import java.time.Instant;

/**
 * Domain Event published when a Settlement is approved by the admin/seller.
 */
@Getter
@ToString
public class SettlementApprovedEvent {
    private final UUID settlementId;
    private final UUID contractId;
    private final String approvedBy;
    private final Instant timestamp;

    public SettlementApprovedEvent(UUID settlementId, UUID contractId, String approvedBy) {
        this.settlementId = settlementId;
        this.contractId = contractId;
        this.approvedBy = approvedBy;
        this.timestamp = Instant.now();
    }
}
