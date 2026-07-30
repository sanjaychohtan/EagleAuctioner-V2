package com.eagleauctioner.entity;

import com.eagleauctioner.enums.SettlementStatus;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.time.Instant;

@Entity
@Table(name = "settlement_histories", indexes = {
    @Index(name = "idx_settlement_histories_settlement", columnList = "settlement_id")
})

@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SettlementHistory extends BaseEntity {

    @NotNull
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "settlement_id", nullable = false)
    private Settlement settlement;

    @NotNull
    @Column(name = "actor", nullable = false, length = 255)
    private String actor;

    @NotNull
    @Column(name = "action_timestamp", nullable = false)
    private Instant actionTimestamp;

    @Enumerated(EnumType.STRING)
    @Column(name = "previous_status", length = 50)
    private SettlementStatus previousStatus;

    @NotNull
    @Enumerated(EnumType.STRING)
    @Column(name = "current_status", nullable = false, length = 50)
    private SettlementStatus currentStatus;

    @Column(name = "reason", length = 1000)
    private String reason;

    @Column(name = "remarks", columnDefinition = "TEXT")
    private String remarks;

    @Column(name = "correlation_id", length = 255)
    private String correlationId;

    @Column(name = "request_source", length = 255)
    private String requestSource;

    @Column(name = "ip_address", length = 50)
    private String ipAddress;
}
