package com.eagleauctioner.event;

import com.eagleauctioner.enums.BidderState;
import lombok.Getter;
import org.springframework.context.ApplicationEvent;

import java.time.Instant;
import java.util.UUID;

@Getter
public abstract class BidderOnboardingEvent extends ApplicationEvent {
    private final UUID bidderProfileId;
    private final UUID userId;
    private final Instant eventTimestamp;

    protected BidderOnboardingEvent(Object source, UUID bidderProfileId, UUID userId) {
        super(source);
        this.bidderProfileId = bidderProfileId;
        this.userId = userId;
        this.eventTimestamp = Instant.now();
    }
}
