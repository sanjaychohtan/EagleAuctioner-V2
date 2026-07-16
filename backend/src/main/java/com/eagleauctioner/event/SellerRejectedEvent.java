package com.eagleauctioner.event;

import java.util.UUID;
import lombok.Getter;

@Getter
public class SellerRejectedEvent extends SellerOnboardingEvent {
    private final String rejectionReason;

    public SellerRejectedEvent(Object source, UUID sellerProfileId, UUID userId, String rejectionReason) {
        super(source, sellerProfileId, userId);
        this.rejectionReason = rejectionReason;
    }
}
