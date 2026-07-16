package com.eagleauctioner.test;

import com.eagleauctioner.service.RedisService;
import com.eagleauctioner.service.CacheCoherencyListener;
import com.eagleauctioner.event.CacheCoherencyEvents.*;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.UUID;

import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class CacheCoherencyTests {

    @Mock
    private RedisService redisService;

    @InjectMocks
    private CacheCoherencyListener cacheCoherencyListener;

    @Test
    void testBidUpdateEviction() {
        UUID lotId = UUID.randomUUID();
        BidUpdatedEvent event = new BidUpdatedEvent(lotId);
        cacheCoherencyListener.handleBidUpdate(event);
        verify(redisService, times(1)).evictHighestBid(lotId);
    }

    @Test
    void testAuctionUpdateEviction() {
        UUID auctionId = UUID.randomUUID();
        AuctionUpdatedEvent event = new AuctionUpdatedEvent(auctionId);
        cacheCoherencyListener.handleAuctionUpdate(event);
        verify(redisService, times(1)).evictRemainingTime(auctionId);
    }

    @Test
    void testLotUpdateEviction() {
        UUID lotId = UUID.randomUUID();
        LotUpdatedEvent event = new LotUpdatedEvent(lotId);
        cacheCoherencyListener.handleLotUpdate(event);
        verify(redisService, times(1)).evictHighestBid(lotId);
    }
}
