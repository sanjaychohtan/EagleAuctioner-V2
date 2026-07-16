package com.eagleauctioner.service;

import com.eagleauctioner.entity.ReportSchedule;
import com.eagleauctioner.enums.ReportFormat;
import com.eagleauctioner.enums.ReportType;
import java.util.Map;
import java.util.UUID;
import java.util.List;

public interface ReportingService {
    byte[] generateReport(ReportType type, ReportFormat format, Map<String, Object> filters, UUID tenantId);
    void scheduleReport(ReportType type, ReportFormat format, String cronExpression, Map<String, Object> filters, String recipientEmail, UUID tenantId);
    List<ReportSchedule> getActiveSchedules(UUID tenantId);
}
