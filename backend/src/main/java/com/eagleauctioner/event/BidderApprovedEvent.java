package com.eagleauctioner.event;

import java.time.Instant;
import java.util.UUID;
import lombok.Getter;

@Getter
public class BidderApprovedEvent extends BidderOnboardingEvent {
    private final Instant approvedAt;

    public BidderApprovedEvent(Object source, UUID bidderProfileId, UUID userId) {
        super(source, bidderProfileId, userId);
        this.approvedAt = Instant.now();
    }
}
