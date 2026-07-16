package com.eagleauctioner.dto;

import com.eagleauctioner.enums.PaymentMethod;
import lombok.*;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;


@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PaymentRequest {
    @NotNull(message = "Amount is required")
    @Positive(message = "Amount must be greater than zero")
    private Long amount;
    
    private PaymentMethod paymentMethod;
    private String referenceNumber;
}
