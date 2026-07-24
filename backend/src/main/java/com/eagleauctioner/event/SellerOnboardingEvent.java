package com.eagleauctioner.event;

import lombok.Getter;
import org.springframework.context.ApplicationEvent;

import java.time.Instant;
import java.util.UUID;

@Getter
public abstract class SellerOnboardingEvent extends ApplicationEvent {
    private final UUID sellerProfileId;
    private final UUID userId;
    private final Instant eventTimestamp;

    protected SellerOnboardingEvent(Object source, UUID sellerProfileId, UUID userId) {
        super(source);
        this.sellerProfileId = sellerProfileId;
        this.userId = userId;
        this.eventTimestamp = Instant.now();
    }
}
