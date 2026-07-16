package com.eagleauctioner.event;

import java.util.UUID;
import lombok.Getter;

@Getter
public class SellerCreatedEvent extends SellerOnboardingEvent {
    private final String sellerType;

    public SellerCreatedEvent(Object source, UUID sellerProfileId, UUID userId, String sellerType) {
        super(source, sellerProfileId, userId);
        this.sellerType = sellerType;
    }
}
