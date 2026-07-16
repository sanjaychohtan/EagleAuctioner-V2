package com.eagleauctioner.event;

import lombok.Getter;
import lombok.ToString;
import java.util.UUID;
import java.time.Instant;

/**
 * Domain Event published when a Settlement draft is generated.
 */
@Getter
@ToString
public class SettlementGeneratedEvent {
    private final UUID settlementId;
    private final UUID contractId;
    private final String contractNumber;
    private final Instant timestamp;

    public SettlementGeneratedEvent(UUID settlementId, UUID contractId, String contractNumber) {
        this.settlementId = settlementId;
        this.contractId = contractId;
        this.contractNumber = contractNumber;
        this.timestamp = Instant.now();
    }
}
