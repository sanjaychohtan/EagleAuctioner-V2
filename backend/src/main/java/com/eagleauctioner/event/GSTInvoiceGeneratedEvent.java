package com.eagleauctioner.event;

import lombok.Getter;
import java.util.UUID;

@Getter
public class GSTInvoiceGeneratedEvent {
    private final UUID invoiceId;
    private final UUID settlementId;
    private final String invoiceNumber;
    private final String eventVersion;
    private final String schemaVersion;
    private final Long aggregateVersion;

    public GSTInvoiceGeneratedEvent(UUID invoiceId, UUID settlementId, String invoiceNumber) {
        this(invoiceId, settlementId, invoiceNumber, "1.0", "1.0", 1L);
    }

    public GSTInvoiceGeneratedEvent(UUID invoiceId, UUID settlementId, String invoiceNumber, String eventVersion, String schemaVersion, Long aggregateVersion) {
        this.invoiceId = invoiceId;
        this.settlementId = settlementId;
        this.invoiceNumber = invoiceNumber;
        this.eventVersion = eventVersion;
        this.schemaVersion = schemaVersion;
        this.aggregateVersion = aggregateVersion;
    }
}
