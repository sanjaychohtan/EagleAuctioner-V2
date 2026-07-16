package com.eagleauctioner.entity;

import com.eagleauctioner.enums.ReportFormat;
import com.eagleauctioner.enums.ReportType;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.envers.Audited;
import java.util.UUID;

/**
 * Entity for scheduled reports.
 */
@Entity
@Table(name = "report_schedules")
@Audited
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ReportSchedule extends BaseEntity {

    @Enumerated(EnumType.STRING)
    @Column(name = "report_type", nullable = false)
    private ReportType reportType;

    @Enumerated(EnumType.STRING)
    @Column(name = "report_format", nullable = false)
    private ReportFormat reportFormat;

    @Column(name = "cron_expression", nullable = false)
    private String cronExpression;

    @Column(name = "recipient_email", nullable = false)
    private String recipientEmail;

    @Column(name = "filters_json", columnDefinition = "TEXT")
    private String filtersJson;

    @Column(name = "tenant_id")
    private UUID tenantId;

    @Column(name = "is_active", nullable = false)
    @Builder.Default
    private boolean isActive = true;
}
