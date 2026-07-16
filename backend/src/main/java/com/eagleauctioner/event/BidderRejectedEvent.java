package com.eagleauctioner.event;

import java.util.UUID;
import lombok.Getter;

@Getter
public class BidderRejectedEvent extends BidderOnboardingEvent {
    private final String rejectionReason;

    public BidderRejectedEvent(Object source, UUID bidderProfileId, UUID userId, String rejectionReason) {
        super(source, bidderProfileId, userId);
        this.rejectionReason = rejectionReason;
    }
}
