package com.eagleauctioner.event;

import lombok.Getter;
import lombok.ToString;
import java.util.UUID;

import java.time.Instant;

/**
 * Domain Event published when a Payment fails.
 */
@Getter
@ToString
public class PaymentFailedEvent {
    private final UUID paymentId;
    private final UUID settlementId;
    private final Long amount;
    private final String reason;
    private final Instant timestamp;

    public PaymentFailedEvent(UUID paymentId, UUID settlementId, Long amount, String reason) {
        this.paymentId = paymentId;
        this.settlementId = settlementId;
        this.amount = amount;
        this.reason = reason;
        this.timestamp = Instant.now();
    }
}
