package com.eagleauctioner.service;

public record BankVerificationResult(
    boolean success,
    String transactionId,
    String providerName,
    String pennyDropStatus,
    String referenceNumber
) {}
