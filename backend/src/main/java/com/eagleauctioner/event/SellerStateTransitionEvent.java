package com.eagleauctioner.event;

import com.eagleauctioner.enums.SellerState;
import java.util.UUID;
import lombok.Getter;

@Getter
public class SellerStateTransitionEvent extends SellerOnboardingEvent {
    private final SellerState fromState;
    private final SellerState toState;
    private final String reason;

    public SellerStateTransitionEvent(Object source, UUID sellerProfileId, UUID userId, SellerState fromState, SellerState toState, String reason) {
        super(source, sellerProfileId, userId);
        this.fromState = fromState;
        this.toState = toState;
        this.reason = reason;
    }
}
