package com.eagleauctioner.event;

import lombok.Getter;
import lombok.ToString;
import java.util.UUID;
import java.time.Instant;


/**
 * Domain Event published when a new Contract Draft is generated.
 */
@Getter
@ToString
public class ContractGeneratedEvent {
    private final UUID contractId;
    private final String documentNumber;
    private final UUID winnerId;
    private final Long totalAmount;
    private final Instant timestamp;

    public ContractGeneratedEvent(UUID contractId, String documentNumber, UUID winnerId, Long totalAmount) {
        this.contractId = contractId;
        this.documentNumber = documentNumber;
        this.winnerId = winnerId;
        this.totalAmount = totalAmount;
        this.timestamp = Instant.now();
    }
}
