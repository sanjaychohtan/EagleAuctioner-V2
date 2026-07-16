package com.eagleauctioner.dto;

import java.util.UUID;

public record BankAccountDto(
        UUID id,
        String accountHolderName,
        String maskedAccountNumber,
        String ifscCode,
        String bankName,
        String branchName,
        boolean isVerified,
        String pennyDropTransactionId
) {}
