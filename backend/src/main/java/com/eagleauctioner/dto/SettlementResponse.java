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
public class SettlementResponse {
    private UUID id;
    private UUID contractId;
    private String contractNumber;
    private UUID winnerId;
    private SettlementStatus status;
    private String buyerSnapshot;
    private String sellerSnapshot;
    private String auctionSnapshot;
    private String lotSnapshot;
    private Long winningAmount;
    private String currency;
    private String taxSnapshot;
    private Instant generatedTimestamp;
    private Instant createdAt;
    private Instant updatedAt;
    private Long version;

    private String completedBy;
    private Instant completedAt;
    private String completionRemarks;
    private String cancelledBy;
    private Instant cancelledAt;
    private String cancellationReason;
}
