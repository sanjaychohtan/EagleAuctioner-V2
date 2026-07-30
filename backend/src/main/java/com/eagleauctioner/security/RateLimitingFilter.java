package com.eagleauctioner.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.concurrent.ConcurrentHashMap;

@Component
@Slf4j
public class RateLimitingFilter extends OncePerRequestFilter {

    private static class TokenBucket {
        private final double capacity;
        private final double refillRatePerSecond;
        private double tokens;
        private long lastRefillTime;

        public TokenBucket(double capacity, double refillRatePerMinute) {
            this.capacity = capacity;
            this.refillRatePerSecond = refillRatePerMinute / 60.0;
            this.tokens = capacity;
            this.lastRefillTime = System.nanoTime();
        }

        public synchronized boolean tryConsume() {
            refill();
            if (tokens >= 1.0) {
                tokens -= 1.0;
                return true;
            }
            return false;
        }

        private void refill() {
            long now = System.nanoTime();
            long elapsedNanos = now - lastRefillTime;
            double elapsedSeconds = elapsedNanos / 1_000_000_000.0;
            lastRefillTime = now;

            tokens = Math.min(capacity, tokens + (elapsedSeconds * refillRatePerSecond));
        }
    }

    // IP-based rate limiters with eviction tracking
    private final ConcurrentHashMap<String, TokenBucket> authLimiters = new ConcurrentHashMap<>();
    private final ConcurrentHashMap<String, TokenBucket> bidLimiters = new ConcurrentHashMap<>();
    private static final int MAX_BUCKETS = 10_000;

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain
    ) throws ServletException, IOException {
        String uri = request.getRequestURI();
        String ip = request.getRemoteAddr();

        evictIfNecessary(authLimiters);
        evictIfNecessary(bidLimiters);

        if (uri.contains("/api/v1/auth/") || uri.contains("/api/auth/")) {
            TokenBucket bucket = authLimiters.computeIfAbsent(ip, k -> new TokenBucket(10.0, 10.0)); // 10 requests per minute
            if (!bucket.tryConsume()) {
                log.warn("Rate limit exceeded for Auth request from IP: {}", ip);
                response.setStatus(429); // HTTP 429 Too Many Requests
                response.setContentType("application/json");
                response.getWriter().write("{\"error\": \"Too many auth requests. Please try again later.\"}");
                return;
            }
        } else if (uri.contains("/api/bids") || uri.contains("/api/bid")) {
            TokenBucket bucket = bidLimiters.computeIfAbsent(ip, k -> new TokenBucket(60.0, 60.0)); // 60 requests per minute
            if (!bucket.tryConsume()) {
                log.warn("Rate limit exceeded for Bid request from IP: {}", ip);
                response.setStatus(429); // HTTP 429 Too Many Requests
                response.setContentType("application/json");
                response.getWriter().write("{\"error\": \"Too many bid requests. Please try again later.\"}");
                return;
            }
        }

        filterChain.doFilter(request, response);
    }

    private void evictIfNecessary(ConcurrentHashMap<String, TokenBucket> map) {
        if (map.size() > MAX_BUCKETS) {
            long now = System.nanoTime();
            map.entrySet().removeIf(entry -> (now - entry.getValue().lastRefillTime) > 600_000_000_000L); // Evict after 10 min idle
        }
    }
}
