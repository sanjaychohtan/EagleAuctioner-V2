package com.eagleauctioner.dto;

import com.eagleauctioner.enums.PaymentTransactionStatus;
import lombok.*;

import java.time.Instant;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PaymentTransactionResponse {
    private UUID id;
    private String gatewayReference;
    private Long amount;
    private PaymentTransactionStatus status;
    private String errorMessage;
    private Instant completedAt;
}
