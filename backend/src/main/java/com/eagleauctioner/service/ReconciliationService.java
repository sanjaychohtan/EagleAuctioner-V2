package com.eagleauctioner.service;

import com.eagleauctioner.entity.SettlementReconciliation;
import com.eagleauctioner.entity.BankReconciliation;
import com.eagleauctioner.enums.ReconciliationStatus;
import com.eagleauctioner.repository.SettlementReconciliationRepository;
import com.eagleauctioner.repository.BankReconciliationRepository;
import com.eagleauctioner.dto.ReconciliationDTOs.*;
import com.eagleauctioner.entity.Settlement;
import com.eagleauctioner.enums.SettlementStatus;
import com.eagleauctioner.repository.SettlementRepository;
import com.eagleauctioner.entity.Payment;
import com.eagleauctioner.enums.PaymentStatus;
import com.eagleauctioner.repository.PaymentRepository;
import com.eagleauctioner.entity.GSTInvoice;
import com.eagleauctioner.repository.GSTInvoiceRepository;
import com.eagleauctioner.entity.OutboxEvent;
import com.eagleauctioner.repository.OutboxEventRepository;
import com.eagleauctioner.exception.BusinessException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class ReconciliationService {

    private final SettlementReconciliationRepository settlementReconRepo;
    private final BankReconciliationRepository bankReconRepo;
    private final SettlementRepository settlementRepository;
    private final PaymentRepository paymentRepository;
    private final GSTInvoiceRepository invoiceRepository;
    private final OutboxEventRepository outboxEventRepository;
    private final com.eagleauctioner.service.FinancialRuleEngine financialRuleEngine;
    private final com.eagleauctioner.repository.LedgerRepository ledgerRepository;

    @Transactional
    public SettlementReconciliationResponse reconcileSettlement(ReconcileSettlementRequest request) {
        Settlement settlement = settlementRepository.findById(request.getSettlementId())
            .orElseThrow(() -> new IllegalArgumentException("Settlement not found"));

        Optional<Payment> paymentOpt = paymentRepository.findBySettlementId(settlement.getId());
        Optional<GSTInvoice> invoiceOpt = invoiceRepository.findBySettlementId(settlement.getId());
        
        ReconciliationStatus status = ReconciliationStatus.MATCHED;
        StringBuilder notes = new StringBuilder();
        
        UUID paymentId = null;
        UUID invoiceId = null;
        
        // 1. Duplicate Detection check
        Optional<SettlementReconciliation> existingReconOpt = settlementReconRepo.findBySettlementId(settlement.getId());
        if (existingReconOpt.isPresent() && existingReconOpt.get().getStatus() == ReconciliationStatus.MATCHED) {
            throw new BusinessException("Duplicate execution detected: Settlement is already successfully reconciled.");
        }

        // 2. Settlement Status check
        if (settlement.getStatus() != SettlementStatus.COMPLETED) {
            status = ReconciliationStatus.UNRECONCILED;
            notes.append("Settlement is in unstable state: ").append(settlement.getStatus()).append(". ");
        }
        
        // 3. Payment checks
        if (paymentOpt.isPresent()) {
            Payment payment = paymentOpt.get();
            paymentId = payment.getId();
            
            // Payment Status verification
            if (payment.getStatus() != PaymentStatus.COMPLETED) {
                status = ReconciliationStatus.UNRECONCILED;
                notes.append("Payment status is incomplete: ").append(payment.getStatus()).append(". ");
            }
            
            Long settlementAmountDec = settlement.getWinningAmount();
            Long paymentAmountDec = payment.getTotalAmount();
            long settlementAmountPaise = settlementAmountDec != null ? settlementAmountDec : 0L;
            long paymentAmountPaise = paymentAmountDec != null ? paymentAmountDec : 0L;
            long diffPaise = Math.abs(settlementAmountPaise - paymentAmountPaise);
            
            long toleranceLimitPaise = financialRuleEngine.getReconciliationTolerance().movePointRight(2).setScale(0, java.math.RoundingMode.HALF_UP).longValueExact();
            if (diffPaise == 0) {
                // Exact Match
                notes.append("Exact amount match. ");
            } else if (diffPaise <= toleranceLimitPaise) {
                // Partial Match within tolerance
                if (status == ReconciliationStatus.MATCHED) {
                    status = ReconciliationStatus.PARTIAL_MATCH;
                }
                notes.append("Partial Match: Amount variation of ").append(diffPaise).append(" paise is within tolerance limit. ");
            } else {
                // Out of tolerance
                status = ReconciliationStatus.MISMATCH_AMOUNT;
                notes.append("Amount mismatch: Settlement=").append(settlementAmountPaise)
                     .append(" paise, Payment=").append(paymentAmountPaise).append(" paise. ");
            }
        } else {
            status = ReconciliationStatus.MISSING_TRANSACTION;
            notes.append("Missing payment. ");
        }
        
        // 4. GST Invoice checks
        if (invoiceOpt.isPresent()) {
            invoiceId = invoiceOpt.get().getId();
            notes.append("GST Invoice verified successfully. ");
        } else {
            // Only raise missing transaction if it was matched or only minor partial mismatch
            if (status == ReconciliationStatus.MATCHED) {
                status = ReconciliationStatus.MISSING_TRANSACTION;
            }
            notes.append("Missing GST Invoice. ");
        }
        
        // 5. Ledger Batch Linkage check (Fetch real ledger entries)
        List<com.eagleauctioner.entity.LedgerEntry> ledgerEntries = ledgerRepository.findBySettlementId(settlement.getId());
        UUID ledgerBatchId = null;
        if (!ledgerEntries.isEmpty()) {
            ledgerBatchId = ledgerEntries.get(0).getId();
            notes.append("Linked to real ledger entry: ").append(ledgerBatchId).append(". ");
        } else {
            status = ReconciliationStatus.MISSING_TRANSACTION;
            notes.append("Missing Ledger postings. ");
        }
        
        SettlementReconciliation recon = existingReconOpt.orElse(new SettlementReconciliation());
            
        recon.setSettlementId(settlement.getId());
        recon.setPaymentId(paymentId);
        recon.setGstInvoiceId(invoiceId);
        recon.setLedgerBatchId(ledgerBatchId);
        recon.setStatus(status);
        recon.setNotes(notes.toString().trim());
        recon.setReconciledAt(Instant.now());
        
        SettlementReconciliation saved = settlementReconRepo.save(recon);
        
        // Save Outbox Event
        saveOutboxEvent(saved.getId(), "SettlementReconciliation", "ReconciliationCompletedEvent",
                String.format("{\"reconciliationId\":\"%s\",\"reconciliationType\":\"SETTLEMENT\"}", saved.getId()));
        
        return mapToSettlementReconResponse(saved);
    }
    
    @Transactional
    public BankReconciliationResponse reconcileBankPayment(ReconcileBankRequest request) {
        Payment payment = paymentRepository.findById(request.getPaymentId())
            .orElseThrow(() -> new IllegalArgumentException("Payment not found"));
            
        ReconciliationStatus status = ReconciliationStatus.MATCHED;
        StringBuilder notes = new StringBuilder();
        
        // 1. Duplicate Detection on Bank Transaction number
        Optional<BankReconciliation> existingBankRecon = bankReconRepo.findByBankTransactionId(request.getBankTransactionId());
        if (existingBankRecon.isPresent()) {
            throw new BusinessException("Duplicate bank transaction number detected: " + request.getBankTransactionId());
        }

        Long paymentAmountDec = payment.getTotalAmount();
        long expectedAmountPaise = paymentAmountDec != null ? paymentAmountDec : 0L;
        long actualAmountPaise = request.getActualAmount();
        long diffPaise = Math.abs(expectedAmountPaise - actualAmountPaise);
        long toleranceLimitPaise = financialRuleEngine.getReconciliationTolerance().movePointRight(2).setScale(0, java.math.RoundingMode.HALF_UP).longValueExact();
        
        if (diffPaise == 0) {
            notes.append("Exact bank transfer amount matched. ");
        } else if (diffPaise <= toleranceLimitPaise) {
            status = ReconciliationStatus.PARTIAL_MATCH;
            notes.append("Bank amount matches within tolerance (Difference: ").append(diffPaise).append(" paise). ");
        } else {
            status = ReconciliationStatus.MISMATCH_AMOUNT;
            notes.append("Bank amount mismatch (Expected: ").append(expectedAmountPaise)
                 .append(" paise, Actual: ").append(actualAmountPaise).append(" paise). ");
        }
        
        BankReconciliation recon = bankReconRepo.findByPaymentId(payment.getId())
            .orElse(new BankReconciliation());
            
        recon.setPaymentId(payment.getId());
        recon.setBankTransactionId(request.getBankTransactionId());
        recon.setExpectedAmount(expectedAmountPaise);
        recon.setActualAmount(actualAmountPaise);
        recon.setStatus(status);
        recon.setNotes(notes.toString().trim());
        recon.setReconciledAt(Instant.now());
        
        BankReconciliation saved = bankReconRepo.save(recon);
        
        // Save Outbox Event
        saveOutboxEvent(saved.getId(), "BankReconciliation", "ReconciliationCompletedEvent",
                String.format("{\"reconciliationId\":\"%s\",\"reconciliationType\":\"BANK\"}", saved.getId()));
        
        return mapToBankReconResponse(saved);
    }
    
    private void saveOutboxEvent(UUID aggregateId, String aggregateType, String eventType, String jsonPayload) {
        try {
            String augmentedPayload = jsonPayload;
            if (jsonPayload.endsWith("}")) {
                augmentedPayload = jsonPayload.substring(0, jsonPayload.length() - 1) + 
                    ",\"eventVersion\":\"1.0\",\"schemaVersion\":\"1.0\",\"aggregateVersion\":1}";
            }
            OutboxEvent outbox = OutboxEvent.builder()
                    .aggregateId(aggregateId)
                    .aggregateType(aggregateType)
                    .eventType(eventType)
                    .payload(augmentedPayload)
                    .createdAt(Instant.now())
                    .processed(false)
                    .status("PENDING")
                    .retryCount(0)
                    .eventVersion("1.0")
                    .schemaVersion("1.0")
                    .aggregateVersion(1L)
                    .build();
            outboxEventRepository.save(outbox);
        } catch (Exception e) {
            log.error("Outbox logging failed: ", e);
        }
    }

    private SettlementReconciliationResponse mapToSettlementReconResponse(SettlementReconciliation r) {
        return SettlementReconciliationResponse.builder()
            .id(r.getId())
            .settlementId(r.getSettlementId())
            .paymentId(r.getPaymentId())
            .ledgerBatchId(r.getLedgerBatchId())
            .gstInvoiceId(r.getGstInvoiceId())
            .status(r.getStatus())
            .notes(r.getNotes())
            .reconciledAt(r.getReconciledAt())
            .correlationId(r.getCorrelationId())
            .traceId(r.getTraceId())
            .nodeId(r.getNodeId())
            .build();
    }
    
    private BankReconciliationResponse mapToBankReconResponse(BankReconciliation r) {
        return BankReconciliationResponse.builder()
            .id(r.getId())
            .paymentId(r.getPaymentId())
            .bankTransactionId(r.getBankTransactionId())
            .expectedAmount(r.getExpectedAmount())
            .actualAmount(r.getActualAmount())
            .status(r.getStatus())
            .reconciledAt(r.getReconciledAt())
            .notes(r.getNotes())
            .correlationId(r.getCorrelationId())
            .traceId(r.getTraceId())
            .nodeId(r.getNodeId())
            .build();
    }
}
