package com.eagleauctioner.entity;

import jakarta.persistence.*;
import lombok.*;
import java.util.UUID;

/**
 * Entity for platform support requests.
 */
@Entity
@Table(name = "support_tickets")

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SupportTicket extends BaseEntity {

    @Column(name = "title", nullable = false, length = 200)
    private String title;

    @Column(name = "description", nullable = false, columnDefinition = "TEXT")
    private String description;

    @Column(name = "category", nullable = false, length = 50)
    private String category;

    @Column(name = "status", nullable = false, length = 30)
    @Builder.Default
    private String status = "OPEN"; // OPEN, IN_PROGRESS, RESOLVED, CLOSED

    @Column(name = "priority", nullable = false, length = 20)
    @Builder.Default
    private String priority = "MEDIUM"; // LOW, MEDIUM, HIGH, CRITICAL

    @Column(name = "assigned_to")
    private UUID assignedTo;

    @Column(name = "user_id", nullable = false)
    private UUID userId;
}
