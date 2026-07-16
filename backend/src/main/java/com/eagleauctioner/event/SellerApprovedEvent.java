package com.eagleauctioner.event;

import java.time.Instant;
import java.util.UUID;
import lombok.Getter;

@Getter
public class SellerApprovedEvent extends SellerOnboardingEvent {
    private final Instant approvedAt;

    public SellerApprovedEvent(Object source, UUID sellerProfileId, UUID userId) {
        super(source, sellerProfileId, userId);
        this.approvedAt = Instant.now();
    }
}
