package com.eagleauctioner.event;

import java.util.UUID;
import lombok.Getter;

@Getter
public class BidderCreatedEvent extends BidderOnboardingEvent {
    private final String bidderType;

    public BidderCreatedEvent(Object source, UUID bidderProfileId, UUID userId, String bidderType) {
        super(source, bidderProfileId, userId);
        this.bidderType = bidderType;
    }
}
