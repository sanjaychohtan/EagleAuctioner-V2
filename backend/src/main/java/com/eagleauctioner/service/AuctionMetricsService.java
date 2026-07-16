package com.eagleauctioner.service;

import com.eagleauctioner.enums.AuctionState;
import com.eagleauctioner.repository.AuctionRepository;
import io.micrometer.core.instrument.MeterRegistry;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import jakarta.annotation.PostConstruct;
import java.util.concurrent.atomic.AtomicLong;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuctionMetricsService {

    private final AuctionRepository auctionRepository;
    private final MeterRegistry meterRegistry;
    private AtomicLong activeAuctionsGauge;

    @PostConstruct
    public void init() {
        activeAuctionsGauge = meterRegistry.gauge("auctions.active", new AtomicLong(0));
    }

    @Scheduled(fixedRate = 15000)
    public void updateMetrics() {
        long activeAuctions = auctionRepository.countByState(AuctionState.LIVE);
        if (activeAuctionsGauge != null) {
            activeAuctionsGauge.set(activeAuctions);
        }
    }
}
