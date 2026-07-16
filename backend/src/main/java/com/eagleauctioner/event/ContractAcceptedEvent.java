package com.eagleauctioner.event;

import lombok.Getter;
import lombok.ToString;
import java.util.UUID;
import java.time.Instant;

/**
 * Domain Event published when a Contract is signed and accepted by the buyer.
 */
@Getter
@ToString
public class ContractAcceptedEvent {
    private final UUID contractId;
    private final String documentNumber;
    private final String acceptedBy;
    private final Instant timestamp;

    public ContractAcceptedEvent(UUID contractId, String documentNumber, String acceptedBy) {
        this.contractId = contractId;
        this.documentNumber = documentNumber;
        this.acceptedBy = acceptedBy;
        this.timestamp = Instant.now();
    }
}
