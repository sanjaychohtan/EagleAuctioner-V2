package com.eagleauctioner.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.UUID;

public class FinancialClosingDTOs {

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class ClosePeriodRequest {
        @NotBlank(message = "Period name is required")
        private String periodName;

        @NotNull(message = "Start date is required")
        private LocalDate startDate;

        @NotNull(message = "End date is required")
        private LocalDate endDate;

        @NotNull(message = "Period year is required")
        @Min(2000)
        @Max(2100)
        private Integer periodYear;

        @NotNull(message = "Period month is required")
        @Min(1)
        @Max(12)
        private Integer periodMonth;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class ClosingPeriodResponse {
        private UUID id;
        private String periodName;
        private LocalDate startDate;
        private LocalDate endDate;
        private Integer periodYear;
        private Integer periodMonth;
        private com.eagleauctioner.enums.ClosingStatus status;
        private java.time.Instant closedAt;
        private UUID closedBy;
        private UUID createdBy;
        private UUID approvedBy;
        private java.time.Instant approvedAt;
        private UUID reopenedBy;
        private java.time.Instant reopenedAt;
        private String correlationId;
        private String traceId;
        private String nodeId;
    }
}
