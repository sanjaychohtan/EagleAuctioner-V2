package com.eagleauctioner.dto;

import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SettlementRequest {

    private UUID contractId;

    private String reason;

    private String remarks;
}
