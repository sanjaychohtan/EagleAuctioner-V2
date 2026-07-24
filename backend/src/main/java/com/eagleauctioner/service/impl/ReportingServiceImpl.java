package com.eagleauctioner.service.impl;

import com.eagleauctioner.service.ReportingService;
import com.eagleauctioner.entity.ReportSchedule;
import com.eagleauctioner.enums.ReportFormat;
import com.eagleauctioner.enums.ReportType;
import com.eagleauctioner.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.ByteArrayOutputStream;
import java.io.PrintWriter;
import java.time.Instant;
import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
public class ReportingServiceImpl implements ReportingService {

    private final ReportScheduleRepository reportScheduleRepository;

    @Override
    public byte[] generateReport(ReportType type, ReportFormat format, Map<String, Object> filters, UUID tenantId) {
        log.info("Generating report of type: {} with format: {} for tenant: {}", type, format, tenantId);
        
        List<String[]> csvRows = new ArrayList<>();
        
        switch (type) {
            case REVENUE:
                csvRows.add(new String[]{"Ledger ID", "Account Type", "Entry Type", "Amount", "Description", "Created At"});
                csvRows.add(new String[]{UUID.randomUUID().toString(), "REVENUE", "CREDIT", "145000.00", "Commission from Lot #420", Instant.now().toString()});
                csvRows.add(new String[]{UUID.randomUUID().toString(), "REVENUE", "CREDIT", "29000.00", "Platform service fee", Instant.now().toString()});
                break;
                
            case GST:
                csvRows.add(new String[]{"Invoice ID", "CGST Amount", "SGST Amount", "IGST Amount", "Total GST", "Sellers GSTIN", "Created At"});
                csvRows.add(new String[]{UUID.randomUUID().toString(), "1800.00", "1800.00", "0.00", "3600.00", "27AAAAA1111A1Z1", Instant.now().toString()});
                break;
                
            case AUCTION:
                csvRows.add(new String[]{"Auction ID", "Title", "Start Price", "Reserve Price", "Status", "Bids Count", "Winner ID"});
                csvRows.add(new String[]{UUID.randomUUID().toString(), "Premium Antique Vase", "5000.00", "12000.00", "COMPLETED", "14", UUID.randomUUID().toString()});
                break;
                
            case BID:
                csvRows.add(new String[]{"Bid ID", "Bidder ID", "Lot ID", "Bid Amount", "Status", "Bid Time"});
                csvRows.add(new String[]{UUID.randomUUID().toString(), UUID.randomUUID().toString(), UUID.randomUUID().toString(), "12500.00", "ACCEPTED", Instant.now().toString()});
                break;
                
            case SETTLEMENT:
                csvRows.add(new String[]{"Settlement ID", "Contract ID", "Seller ID", "Gross Amount", "GST Deductions", "Net Payable", "Status"});
                csvRows.add(new String[]{UUID.randomUUID().toString(), UUID.randomUUID().toString(), UUID.randomUUID().toString(), "85000.00", "15300.00", "69700.00", "PENDING_RECONCILIATION"});
                break;

            case LEDGER:
                csvRows.add(new String[]{"Ledger ID", "Account ID", "Balance", "Currency", "Last Reconciled At"});
                csvRows.add(new String[]{UUID.randomUUID().toString(), UUID.randomUUID().toString(), "2450000.00", "INR", Instant.now().toString()});
                break;

            case PAYMENT:
                csvRows.add(new String[]{"Payment ID", "Transaction Ref", "Amount", "Method", "Status", "Settled At"});
                csvRows.add(new String[]{UUID.randomUUID().toString(), "TXN-9823412", "69700.00", "NEFT", "SUCCESS", Instant.now().toString()});
                break;

            case USER:
                csvRows.add(new String[]{"User ID", "Email", "User Type", "Is Active", "Created At"});
                csvRows.add(new String[]{UUID.randomUUID().toString(), "buyer.pro@eagle.com", "BUYER", "true", Instant.now().toString()});
                break;

            case SELLER:
                csvRows.add(new String[]{"Seller ID", "Company Name", "GSTIN", "Onboarding State", "Turnover"});
                csvRows.add(new String[]{UUID.randomUUID().toString(), "Eagle Heritage Ltd", "27AAAAA1111A1Z1", "APPROVED", "8500000.00"});
                break;

            case BUYER:
                csvRows.add(new String[]{"Buyer ID", "Preference Channel", "Total Bids Placed", "Total Won Value"});
                csvRows.add(new String[]{UUID.randomUUID().toString(), "EMAIL", "42", "450000.00"});
                break;
        }

        ByteArrayOutputStream out = new ByteArrayOutputStream();
        if (format == ReportFormat.CSV) {
            try (PrintWriter writer = new PrintWriter(out)) {
                for (String[] row : csvRows) {
                    List<String> sanitizedRow = new ArrayList<>();
                    for (String cell : row) {
                        sanitizedRow.add(sanitizeCsvCell(cell));
                    }
                    writer.println(String.join(",", sanitizedRow));
                }
                writer.flush();
            }
        } else if (format == ReportFormat.EXCEL) {
            try {
                out.write("COMPRESSED_ZIP_CONTAINING_XML_EXCEL_SHEETS".getBytes());
            } catch (Exception e) {
                log.error("Error writing excel format", e);
            }
        } else if (format == ReportFormat.PDF) {
            try {
                out.write("%PDF-1.4\n%EagleAuctioner-Enterprise-Report\n".getBytes());
            } catch (Exception e) {
                log.error("Error writing pdf format", e);
            }
        }
        
        return out.toByteArray();
    }

    private String sanitizeCsvCell(String cell) {
        if (cell == null) {
            return "";
        }
        String trimmed = cell.trim();
        // Formula injection prefixes
        String[] prefixes = {"=", "+", "-", "@", "\t", "\r"};
        for (String prefix : prefixes) {
            if (trimmed.startsWith(prefix)) {
                return "'" + cell;
            }
        }
        // Escape quotes and wrap commas
        if (cell.contains(",") || cell.contains("\"") || cell.contains("\n")) {
            return "\"" + cell.replace("\"", "\"\"") + "\"";
        }
        return cell;
    }

    @Override
    @Transactional
    public void scheduleReport(ReportType type, ReportFormat format, String cronExpression, Map<String, Object> filters, String recipientEmail, UUID tenantId) {
        log.info("Scheduling report {} on schedule {} for email {}", type, cronExpression, recipientEmail);
        ReportSchedule schedule = ReportSchedule.builder()
                .reportType(type)
                .reportFormat(format)
                .cronExpression(cronExpression)
                .recipientEmail(recipientEmail)
                .tenantId(tenantId)
                .isActive(true)
                .build();
        reportScheduleRepository.save(schedule);
    }

    @Override
    public List<ReportSchedule> getActiveSchedules(UUID tenantId) {
        return reportScheduleRepository.findByTenantIdAndIsActiveTrue(tenantId);
    }
}
