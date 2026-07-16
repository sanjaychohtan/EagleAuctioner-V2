package com.eagleauctioner.event;

import lombok.Getter;
import java.util.UUID;

@Getter
public class FinancialPeriodClosedEvent {
    private final UUID periodId;
    private final String periodName;
    private final String eventVersion;
    private final String schemaVersion;
    private final Long aggregateVersion;

    public FinancialPeriodClosedEvent(UUID periodId, String periodName) {
        this(periodId, periodName, "1.0", "1.0", 1L);
    }

    public FinancialPeriodClosedEvent(UUID periodId, String periodName, String eventVersion, String schemaVersion, Long aggregateVersion) {
        this.periodId = periodId;
        this.periodName = periodName;
        this.eventVersion = eventVersion;
        this.schemaVersion = schemaVersion;
        this.aggregateVersion = aggregateVersion;
    }
}
