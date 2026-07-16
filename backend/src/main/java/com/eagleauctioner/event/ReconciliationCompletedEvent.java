package com.eagleauctioner.event;

import lombok.Getter;
import java.util.UUID;

@Getter
public class ReconciliationCompletedEvent {
    private final UUID reconciliationId;
    private final String reconciliationType;
    private final String eventVersion;
    private final String schemaVersion;
    private final Long aggregateVersion;

    public ReconciliationCompletedEvent(UUID reconciliationId, String reconciliationType) {
        this(reconciliationId, reconciliationType, "1.0", "1.0", 1L);
    }

    public ReconciliationCompletedEvent(UUID reconciliationId, String reconciliationType, String eventVersion, String schemaVersion, Long aggregateVersion) {
        this.reconciliationId = reconciliationId;
        this.reconciliationType = reconciliationType;
        this.eventVersion = eventVersion;
        this.schemaVersion = schemaVersion;
        this.aggregateVersion = aggregateVersion;
    }
}
