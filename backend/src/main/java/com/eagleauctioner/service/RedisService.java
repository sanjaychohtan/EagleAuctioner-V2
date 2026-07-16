package com.eagleauctioner.service;

import com.eagleauctioner.dto.AuctionRealTimeDTOs.LiveBidResponse;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.util.concurrent.TimeUnit;
import java.util.UUID;

/**
 * High-performance transient caching wrapper with Jackson JSON serialization.
 */
@Service
@Slf4j
@RequiredArgsConstructor
public class RedisService {

    private final StringRedisTemplate redisTemplate;
    private final ObjectMapper objectMapper;

    private static final String HIGHEST_BID_KEY_PREFIX = "auction:lot:highest-bid:";
    private static final String REMAINING_TIME_KEY_PREFIX = "auction:remaining-time:";

    public void cacheHighestBid(UUID lotId, LiveBidResponse liveBid) {
        try {
            String key = HIGHEST_BID_KEY_PREFIX + lotId.toString();
            String json = objectMapper.writeValueAsString(liveBid);
            redisTemplate.opsForValue().set(key, json, 1, TimeUnit.HOURS);
            log.info("Cached highest bid for lot {}: {}", lotId, json);
        } catch (Exception e) {
            log.error("Failed to cache highest bid in Redis for lot {}", lotId, e);
        }
    }

    public LiveBidResponse getHighestBid(UUID lotId) {
        try {
            String key = HIGHEST_BID_KEY_PREFIX + lotId.toString();
            String json = redisTemplate.opsForValue().get(key);
            if (json != null) {
                return objectMapper.readValue(json, LiveBidResponse.class);
            }
        } catch (Exception e) {
            log.error("Failed to get highest bid from Redis for lot {}", lotId, e);
        }
        return null;
    }

    public void cacheRemainingTime(UUID auctionId, Long remainingSeconds) {
        String key = REMAINING_TIME_KEY_PREFIX + auctionId.toString();
        redisTemplate.opsForValue().set(key, String.valueOf(remainingSeconds), 1, TimeUnit.MINUTES);
    }

    public Long getRemainingTime(UUID auctionId) {
        String key = REMAINING_TIME_KEY_PREFIX + auctionId.toString();
        String val = redisTemplate.opsForValue().get(key);
        return val != null ? Long.parseLong(val) : null;
    }

    public void evictRemainingTime(UUID auctionId) {
        String key = REMAINING_TIME_KEY_PREFIX + auctionId.toString();
        redisTemplate.delete(key);
    }

    public void evictHighestBid(UUID lotId) {
        String key = HIGHEST_BID_KEY_PREFIX + lotId.toString();
        redisTemplate.delete(key);
    }
}
