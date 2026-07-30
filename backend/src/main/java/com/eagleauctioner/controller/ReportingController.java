package com.eagleauctioner.controller;

import com.eagleauctioner.service.ReportingService;
import com.eagleauctioner.enums.*;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;

import com.eagleauctioner.aspect.EnforceDataScope;
import com.eagleauctioner.enums.DataScopeType;

@RestController
@RequestMapping({"/api/v1/reports", "/api/reports"})
@RequiredArgsConstructor
@PreAuthorize("hasAuthority('reports.export') or hasAuthority('reports.view') or hasRole('ADMIN') or hasRole('FINANCE')")
public class ReportingController {

    private final ReportingService reportingService;

    @PostMapping("/generate")
    @EnforceDataScope(DataScopeType.COMPANY)
    public ResponseEntity<byte[]> generateReport(
            @RequestParam ReportType type,
            @RequestParam ReportFormat format,
            @RequestBody Map<String, Object> filters,
            @RequestHeader(value = "X-Tenant-Id", required = false) String tenantHeader) {
            
        UUID tenantId = tenantHeader != null ? UUID.fromString(tenantHeader) : UUID.fromString("00000000-0000-0000-0000-000000000000");
        byte[] content = reportingService.generateReport(type, format, filters, tenantId);
        
        String extension = format == ReportFormat.CSV ? ".csv" : format == ReportFormat.EXCEL ? ".xlsx" : ".pdf";
        String filename = "report_" + type.name().toLowerCase() + "_" + System.currentTimeMillis() + extension;
                
        MediaType mediaType = format == ReportFormat.CSV ? MediaType.parseMediaType("text/csv") : 
                format == ReportFormat.EXCEL ? MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet") : 
                MediaType.APPLICATION_PDF;

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=" + filename)
                .contentType(mediaType)
                .body(content);
    }

    @PostMapping("/schedule")
    @EnforceDataScope(DataScopeType.COMPANY)
    public ResponseEntity<Void> scheduleReport(
            @RequestParam ReportType type,
            @RequestParam ReportFormat format,
            @RequestParam String cron,
            @RequestParam String email,
            @RequestBody Map<String, Object> filters,
            @RequestHeader(value = "X-Tenant-Id", required = false) String tenantHeader) {
            
        UUID tenantId = tenantHeader != null ? UUID.fromString(tenantHeader) : UUID.fromString("00000000-0000-0000-0000-000000000000");
        reportingService.scheduleReport(type, format, cron, filters, email, tenantId);
        return ResponseEntity.ok().build();
    }
}
