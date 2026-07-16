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
public class SettlementCreatedEvent {
    private final UUID settlementId;
    private final String documentNumber;
    private final UUID contractId;
    private final Long grossAmount;
    private final Instant timestamp;

    public SettlementCreatedEvent(UUID settlementId, String documentNumber, UUID contractId, Long grossAmount) {
        this.settlementId = settlementId;
        this.documentNumber = documentNumber;
        this.contractId = contractId;
        this.grossAmount = grossAmount;
        this.timestamp = Instant.now();
    }
}
