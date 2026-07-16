package com.eagleauctioner.event;

import java.util.UUID;
import lombok.Getter;

@Getter
public class MembershipPendingEvent extends BidderOnboardingEvent {
    public MembershipPendingEvent(Object source, UUID bidderProfileId, UUID userId) {
        super(source, bidderProfileId, userId);
    }
}
