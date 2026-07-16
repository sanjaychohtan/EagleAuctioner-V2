package com.eagleauctioner.event;

import com.eagleauctioner.enums.BidderState;
import java.util.UUID;
import lombok.Getter;

@Getter
public class BidderStateTransitionEvent extends BidderOnboardingEvent {
    private final BidderState fromState;
    private final BidderState toState;
    private final String reason;

    public BidderStateTransitionEvent(Object source, UUID bidderProfileId, UUID userId, BidderState fromState, BidderState toState, String reason) {
        super(source, bidderProfileId, userId);
        this.fromState = fromState;
        this.toState = toState;
        this.reason = reason;
    }
}
