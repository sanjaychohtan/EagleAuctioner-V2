package com.eagleauctioner.event;

import java.util.UUID;
import lombok.Getter;

@Getter
public class KycSubmittedEvent extends BidderOnboardingEvent {
    public KycSubmittedEvent(Object source, UUID bidderProfileId, UUID userId) {
        super(source, bidderProfileId, userId);
    }
}
