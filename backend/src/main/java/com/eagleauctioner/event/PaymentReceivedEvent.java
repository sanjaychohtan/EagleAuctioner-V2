package com.eagleauctioner.event;

import lombok.Getter;
import lombok.ToString;
import java.util.UUID;

import java.time.Instant;

/**
 * Domain Event published when a Payment is received.
 */
@Getter
@ToString
public class PaymentReceivedEvent {
    private final UUID paymentId;
    private final String paymentNumber;
    private final UUID settlementId;
    private final UUID userId;
    private final Long amount;
    private final Instant timestamp;

    public PaymentReceivedEvent(UUID paymentId, String paymentNumber, UUID settlementId, UUID userId, Long amount) {
        this.paymentId = paymentId;
        this.paymentNumber = paymentNumber;
        this.settlementId = settlementId;
        this.userId = userId;
        this.amount = amount;
        this.timestamp = Instant.now();
    }
}
