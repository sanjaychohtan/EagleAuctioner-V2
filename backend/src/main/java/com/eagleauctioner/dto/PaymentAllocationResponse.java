package com.eagleauctioner.dto;

import com.eagleauctioner.enums.PaymentAllocationType;
import lombok.*;

import java.time.Instant;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PaymentAllocationResponse {
    private UUID id;
    private Long allocatedAmount;
    private PaymentAllocationType allocationType;
    private Instant allocatedAt;
}
