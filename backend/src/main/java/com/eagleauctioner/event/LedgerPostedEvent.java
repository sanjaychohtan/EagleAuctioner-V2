package com.eagleauctioner.event;

import lombok.Getter;
import java.util.UUID;

@Getter
public class LedgerPostedEvent {
    private final UUID batchId;
    private final String batchReference;
    private final String eventVersion;
    private final String schemaVersion;
    private final Long aggregateVersion;

    public LedgerPostedEvent(UUID batchId, String batchReference) {
        this(batchId, batchReference, "1.0", "1.0", 1L);
    }

    public LedgerPostedEvent(UUID batchId, String batchReference, String eventVersion, String schemaVersion, Long aggregateVersion) {
        this.batchId = batchId;
        this.batchReference = batchReference;
        this.eventVersion = eventVersion;
        this.schemaVersion = schemaVersion;
        this.aggregateVersion = aggregateVersion;
    }
}
