package com.eagleauctioner.dto;

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
