package com.eagleauctioner.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;

@Service
@RequiredArgsConstructor
@Slf4j
public class TaxEngine {

    private final FinancialRuleEngine financialRuleEngine;

    public Long calculateTax(Long amount, BigDecimal rate) {
        if (amount == null || rate == null) return 0L;
        RoundingMode roundingMode = financialRuleEngine.getRoundingMode();
        int precision = financialRuleEngine.getCurrencyPrecision();
        return new BigDecimal(amount).multiply(rate.divide(new BigDecimal("100"), precision + 2, roundingMode)).setScale(0, roundingMode).longValueExact();
    }
}
