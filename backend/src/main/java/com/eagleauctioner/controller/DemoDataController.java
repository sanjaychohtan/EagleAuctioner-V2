package com.eagleauctioner.controller;

import com.eagleauctioner.service.DemoDataService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/admin/demo-data")
@ConditionalOnProperty(
    name = "eagle.demo-data.enabled",
    havingValue = "true"
)
@RequiredArgsConstructor
@Slf4j
public class DemoDataController {

    private final DemoDataService demoDataService;

    @PostMapping("/generate")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<Map<String, Object>> generateDemoData() {
        log.info("REST request to generate demo data triggered by Super Admin");
        long startMs = System.currentTimeMillis();

        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String username = (auth != null) ? auth.getName() : "SUPER_ADMIN";

        Map<String, Object> serviceResult = demoDataService.generateDemoData();
        long executionTimeMs = System.currentTimeMillis() - startMs;

        int createdUsers = (int) serviceResult.getOrDefault("createdUsers", 2);
        int createdSellers = (int) serviceResult.getOrDefault("createdSellers", 1);
        int createdBuyers = (int) serviceResult.getOrDefault("createdBuyers", 1);
        int createdAuctions = (int) serviceResult.getOrDefault("liveAuctionsCreated", 0);
        int createdLots = (int) serviceResult.getOrDefault("lotsCreated", 0);
        int createdBids = (int) serviceResult.getOrDefault("bidsCreated", 0);
        int duplicatesSkipped = (int) serviceResult.getOrDefault("duplicatesSkipped", 0);

        // Enterprise Audit Log Output
        log.info("""
                
                Demo Data Generation
                
                Executed By:
                {}
                
                Time:
                {}
                
                Created Auctions:
                {}
                
                Created Lots:
                {}
                
                Created Bids:
                {}
                
                Duplicates Skipped:
                {}
                
                Execution Time:
                {} ms
                """,
                username,
                Instant.now(),
                createdAuctions,
                createdLots,
                createdBids,
                duplicatesSkipped,
                executionTimeMs
        );

        // Structured JSON Summary Response
        Map<String, Object> dataMap = new LinkedHashMap<>();
        dataMap.put("createdUsers", createdUsers);
        dataMap.put("createdSellers", createdSellers);
        dataMap.put("createdBuyers", createdBuyers);
        dataMap.put("createdAuctions", createdAuctions);
        dataMap.put("createdLots", createdLots);
        dataMap.put("createdBids", createdBids);
        dataMap.put("duplicatesSkipped", duplicatesSkipped);

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("success", true);
        response.put("message", "Demo data generated successfully");
        response.put("data", dataMap);

        return ResponseEntity.ok(response);
    }
}
