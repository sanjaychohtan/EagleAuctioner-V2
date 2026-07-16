package com.eagleauctioner.event;

import lombok.Getter;
import java.util.UUID;

@Getter
public class RefundApprovedEvent {
    private final UUID refundId;
    private final Long amount;
    private final UUID initiatorId;
    private final String eventVersion;
    private final String schemaVersion;
    private final Long aggregateVersion;

    public RefundApprovedEvent(UUID refundId, Long amount, UUID initiatorId) {
        this(refundId, amount, initiatorId, "1.0", "1.0", 1L);
    }

    public RefundApprovedEvent(UUID refundId, Long amount, UUID initiatorId, String eventVersion, String schemaVersion, Long aggregateVersion) {
        this.refundId = refundId;
        this.amount = amount;
        this.initiatorId = initiatorId;
        this.eventVersion = eventVersion;
        this.schemaVersion = schemaVersion;
        this.aggregateVersion = aggregateVersion;
    }
}
