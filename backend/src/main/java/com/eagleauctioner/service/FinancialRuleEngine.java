package com.eagleauctioner.service;

import com.eagleauctioner.entity.FinancialConfiguration;
import com.eagleauctioner.repository.FinancialConfigurationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.concurrent.ConcurrentHashMap;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
public class FinancialRuleEngine {

    private final FinancialConfigurationRepository financialConfigurationRepository;
    private final ConcurrentHashMap<String, String> cache = new ConcurrentHashMap<>();

    public void invalidateCache() {
        cache.clear();
        log.info("Financial Rules Engine cache invalidated successfully.");
    }

    private String getOrLookup(String key, String fallbackDefault) {
        return cache.computeIfAbsent(key, k -> {
            try {
                return financialConfigurationRepository.findById(k)
                        .map(FinancialConfiguration::getConfigValue)
                        .orElseGet(() -> {
                            log.warn("Financial config key '{}' missing from DB. Falling back to default: '{}'", k, fallbackDefault);
                            return fallbackDefault;
                        });
            } catch (Exception ex) {
                log.error("Database lookup failed for key '{}'. Emergency fallback to default: '{}'", k, fallbackDefault, ex);
                return fallbackDefault;
            }
        });
    }

    public BigDecimal getPlatformFeePercentage() {
        return new BigDecimal(getOrLookup("PLATFORM_FEE_PERCENTAGE", "5.00"));
    }

    public BigDecimal getVatPercentage() {
        return new BigDecimal(getOrLookup("VAT_PERCENTAGE", "18.00"));
    }

    public BigDecimal getGstPercentage() {
        return new BigDecimal(getOrLookup("GST_PERCENTAGE", "18.00"));
    }

    public RoundingMode getRoundingMode() {
        String modeStr = getOrLookup("ROUNDING_MODE", "HALF_UP");
        try {
            return RoundingMode.valueOf(modeStr);
        } catch (IllegalArgumentException ex) {
            log.error("Invalid Rounding Mode configured: '{}'. Falling back to HALF_UP.", modeStr);
            return RoundingMode.HALF_UP;
        }
    }

    public int getCurrencyPrecision() {
        String precisionStr = getOrLookup("CURRENCY_PRECISION", "2");
        try {
            return Integer.parseInt(precisionStr);
        } catch (NumberFormatException ex) {
            log.error("Invalid Currency Precision configured: '{}'. Falling back to 2.", precisionStr);
            return 2;
        }
    }

    public BigDecimal getReconciliationTolerance() {
        return new BigDecimal(getOrLookup("RECONCILIATION_TOLERANCE", "0.00"));
    }
}
