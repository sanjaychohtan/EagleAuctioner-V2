package com.eagleauctioner.event;

import java.util.UUID;
import lombok.AllArgsConstructor;
import lombok.Getter;

public class CacheCoherencyEvents {

    @Getter
    @AllArgsConstructor
    public static class BidUpdatedEvent {
        private final UUID lotId;
    }

    @Getter
    @AllArgsConstructor
    public static class AuctionUpdatedEvent {
        private final UUID auctionId;
    }

    @Getter
    @AllArgsConstructor
    public static class LotUpdatedEvent {
        private final UUID lotId;
    }

    @Getter
    @AllArgsConstructor
    public static class WinnerUpdatedEvent {
        private final UUID winnerId;
    }

    @Getter
    @AllArgsConstructor
    public static class SettlementUpdatedEvent {
        private final UUID settlementId;
    }
}
