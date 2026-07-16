package com.eagleauctioner.dto;

import com.eagleauctioner.enums.PaymentMethod;
import com.eagleauctioner.enums.PaymentStatus;
import lombok.*;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PaymentResponse {
    private UUID id;
    private String paymentNumber;
    private UUID settlementId;
    private String settlementNumber;
    private PaymentStatus status;
    private Long totalAmount;
    private String referenceNumber;
    private PaymentMethod paymentMethod;
    private Instant paymentDate;
    private List<PaymentAllocationResponse> allocations;
    private List<PaymentTransactionResponse> transactions;
}
