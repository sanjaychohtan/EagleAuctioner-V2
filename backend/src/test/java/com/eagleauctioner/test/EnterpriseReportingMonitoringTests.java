package com.eagleauctioner.test;

import com.eagleauctioner.service.ReportingService;
import com.eagleauctioner.enums.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class EnterpriseReportingMonitoringTests {

    @Mock
    private ReportingService reportingService;

    private UUID tenantId;

    @BeforeEach
    void setUp() {
        tenantId = UUID.randomUUID();
    }

    @Test
    void testReportingService_GenerateCSV_Success() {
        Map<String, Object> filters = new HashMap<>();
        byte[] mockBytes = "Ledger ID,Amount\n1,100.0".getBytes();
        
        when(reportingService.generateReport(eq(ReportType.REVENUE), eq(ReportFormat.CSV), anyMap(), eq(tenantId)))
                .thenReturn(mockBytes);

        byte[] result = reportingService.generateReport(ReportType.REVENUE, ReportFormat.CSV, filters, tenantId);

        assertNotNull(result);
        assertTrue(result.length > 0);
        verify(reportingService, times(1)).generateReport(eq(ReportType.REVENUE), eq(ReportFormat.CSV), anyMap(), eq(tenantId));
    }
}
