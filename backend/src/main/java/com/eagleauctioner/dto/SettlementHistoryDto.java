package com.eagleauctioner.dto;

import com.eagleauctioner.enums.SettlementStatus;
import lombok.*;

import java.time.Instant;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SettlementHistoryDto {
    private UUID id;
    private UUID settlementId;
    private String actor;
    private Instant actionTimestamp;
    private SettlementStatus previousStatus;
    private SettlementStatus currentStatus;
    private String reason;
    private String remarks;
    private String correlationId;
    private String requestSource;
    private String ipAddress;
}
