package com.eagleauctioner.event;

import java.util.UUID;
import lombok.Getter;

@Getter
public class BankAccountVerifiedEvent extends BidderOnboardingEvent {
    private final String accountNumberMasked;
    private final String transactionId;

    public BankAccountVerifiedEvent(Object source, UUID bidderProfileId, UUID userId, String accountNumberMasked, String transactionId) {
        super(source, bidderProfileId, userId);
        this.accountNumberMasked = accountNumberMasked;
        this.transactionId = transactionId;
    }
}
