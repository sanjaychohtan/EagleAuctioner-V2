package com.eagleauctioner.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "refunds")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Refund {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false)
    private Long amount;

    @Column(name = "initiator_id", nullable = false)
    private UUID initiatorId;

    @Column(name = "first_approver_id")
    private UUID firstApproverId;

    @Column(name = "second_approver_id")
    private UUID secondApproverId;

    @Column(nullable = false, length = 50)
    private String status; // PENDING_FIRST_APPROVAL, PENDING_SECOND_APPROVAL, APPROVED, REJECTED

    @Column(name = "rejection_reason")
    private String rejectionReason;

    @Column(name = "audit_log", columnDefinition = "TEXT")
    private String auditLog;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @Column(name = "updated_at")
    private Instant updatedAt;
    
    public void appendAudit(String message) {
        if (this.auditLog == null) {
            this.auditLog = "";
        }
        this.auditLog += "[" + Instant.now() + "] " + message + "\n";
    }
}
