package com.eagleauctioner.test;

import com.eagleauctioner.dto.FinancialClosingDTOs.ClosingPeriodResponse;
import com.eagleauctioner.dto.ReconciliationDTOs.*;
import com.eagleauctioner.entity.*;
import com.eagleauctioner.enums.*;
import com.eagleauctioner.exception.BusinessException;
import com.eagleauctioner.repository.*;
import com.eagleauctioner.service.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class FinancialClosingAndReconciliationTests {

    @Mock
    private ClosingPeriodRepository closingPeriodRepository;
    @Mock
    private OutboxEventRepository outboxEventRepository;
    @Mock
    private SettlementReconciliationRepository settlementReconRepo;
    @Mock
    private BankReconciliationRepository bankReconRepo;
    @Mock
    private SettlementRepository settlementRepository;
    @Mock
    private PaymentRepository paymentRepository;
    @Mock
    private GSTInvoiceRepository invoiceRepository;
    @Mock
    private LedgerRepository ledgerRepository;
    @Mock
    private FinancialRuleEngine financialRuleEngine;

    @InjectMocks
    private FinancialClosingService closingService;

    @InjectMocks
    private ReconciliationService reconciliationService;

    private ClosingPeriod openPeriod;

    @BeforeEach
    void setUp() {
        openPeriod = ClosingPeriod.builder()
                .periodName("2026-07")
                .startDate(LocalDate.of(2026, 7, 1))
                .endDate(LocalDate.of(2026, 7, 31))
                .periodYear(2026)
                .periodMonth(7)
                .status(ClosingStatus.OPEN)
                .createdBy(UUID.randomUUID())
                .build();
        openPeriod.setId(UUID.randomUUID());
    }

    @Test
    void testInitiatePeriod_Success() {
        when(closingPeriodRepository.findByPeriodYearAndPeriodMonth(2026, 7)).thenReturn(Optional.empty());
        when(closingPeriodRepository.findClosedPeriodForDate(any(LocalDate.class))).thenReturn(Optional.empty());
        when(closingPeriodRepository.save(any(ClosingPeriod.class))).thenAnswer(invocation -> invocation.getArgument(0));

        ClosingPeriodResponse response = closingService.initiatePeriod(2026, 7, UUID.randomUUID());

        assertNotNull(response);
        assertEquals("2026-07", response.getPeriodName());
        assertEquals(ClosingStatus.OPEN, response.getStatus());
    }

    @Test
    void testInitiatePeriod_Duplicate_ThrowsException() {
        when(closingPeriodRepository.findByPeriodYearAndPeriodMonth(2026, 7)).thenReturn(Optional.of(openPeriod));

        assertThrows(IllegalStateException.class, () -> {
            closingService.initiatePeriod(2026, 7, UUID.randomUUID());
        });
    }

    @Test
    void testTransitionPeriod_MakerCheckerViolation() {
        UUID creatorId = openPeriod.getCreatedBy();
        when(closingPeriodRepository.findById(openPeriod.getId())).thenReturn(Optional.of(openPeriod));

        // Creator cannot approve
        assertThrows(BusinessException.class, () -> {
            closingService.transitionTo(openPeriod.getId(), ClosingStatus.APPROVED, creatorId, "ADMIN");
        });
    }

    @Test
    void testReconcileSettlement_Success_ExactMatch() {
        UUID settlementId = UUID.randomUUID();
        Settlement settlement = mock(Settlement.class);
        when(settlement.getId()).thenReturn(settlementId);
        when(settlement.getStatus()).thenReturn(SettlementStatus.COMPLETED);
        when(settlement.getWinningAmount()).thenReturn(150000L);

        Payment payment = mock(Payment.class);
        when(payment.getId()).thenReturn(UUID.randomUUID());
        when(payment.getStatus()).thenReturn(PaymentStatus.COMPLETED);
        when(payment.getTotalAmount()).thenReturn(150000L);

        GSTInvoice invoice = mock(GSTInvoice.class);
        when(invoice.getId()).thenReturn(UUID.randomUUID());

        LedgerEntry entry = mock(LedgerEntry.class);
        when(entry.getId()).thenReturn(UUID.randomUUID());

        when(settlementRepository.findById(settlementId)).thenReturn(Optional.of(settlement));
        when(paymentRepository.findBySettlementId(settlementId)).thenReturn(Optional.of(payment));
        when(invoiceRepository.findBySettlementId(settlementId)).thenReturn(Optional.of(invoice));
        when(ledgerRepository.findBySettlementId(settlementId)).thenReturn(List.of(entry));
        when(settlementReconRepo.findBySettlementId(settlementId)).thenReturn(Optional.empty());
        when(financialRuleEngine.getReconciliationTolerance()).thenReturn(0L);
        when(settlementReconRepo.save(any(SettlementReconciliation.class))).thenAnswer(invocation -> invocation.getArgument(0));

        ReconcileSettlementRequest request = ReconcileSettlementRequest.builder()
                .settlementId(settlementId)
                .build();

        SettlementReconciliationResponse response = reconciliationService.reconcileSettlement(request);

        assertNotNull(response);
        assertEquals(ReconciliationStatus.MATCHED, response.getStatus());
        assertTrue(response.getNotes().contains("Exact amount match"));
    }

    @Test
    void testReconcileSettlement_PartialMatch_WithinTolerance() {
        UUID settlementId = UUID.randomUUID();
        Settlement settlement = mock(Settlement.class);
        when(settlement.getId()).thenReturn(settlementId);
        when(settlement.getStatus()).thenReturn(SettlementStatus.COMPLETED);
        when(settlement.getWinningAmount()).thenReturn(150000L);

        Payment payment = mock(Payment.class);
        when(payment.getId()).thenReturn(UUID.randomUUID());
        when(payment.getStatus()).thenReturn(PaymentStatus.COMPLETED);
        when(payment.getTotalAmount()).thenReturn(149995L); // 5 paise diff

        GSTInvoice invoice = mock(GSTInvoice.class);
        when(invoice.getId()).thenReturn(UUID.randomUUID());

        LedgerEntry entry = mock(LedgerEntry.class);
        when(entry.getId()).thenReturn(UUID.randomUUID());

        when(settlementRepository.findById(settlementId)).thenReturn(Optional.of(settlement));
        when(paymentRepository.findBySettlementId(settlementId)).thenReturn(Optional.of(payment));
        when(invoiceRepository.findBySettlementId(settlementId)).thenReturn(Optional.of(invoice));
        when(ledgerRepository.findBySettlementId(settlementId)).thenReturn(List.of(entry));
        when(settlementReconRepo.findBySettlementId(settlementId)).thenReturn(Optional.empty());
        
        // 0.10 INR tolerance (10 paise)
        when(financialRuleEngine.getReconciliationTolerance()).thenReturn(010L);
        when(settlementReconRepo.save(any(SettlementReconciliation.class))).thenAnswer(invocation -> invocation.getArgument(0));

        ReconcileSettlementRequest request = ReconcileSettlementRequest.builder()
                .settlementId(settlementId)
                .build();

        SettlementReconciliationResponse response = reconciliationService.reconcileSettlement(request);

        assertNotNull(response);
        assertEquals(ReconciliationStatus.PARTIAL_MATCH, response.getStatus());
        assertTrue(response.getNotes().contains("Partial Match: Amount variation of 5 paise is within tolerance limit"));
    }

    @Test
    void testReconcileBankPayment_ExactMatch() {
        UUID paymentId = UUID.randomUUID();
        Payment payment = mock(Payment.class);
        when(payment.getId()).thenReturn(paymentId);
        when(payment.getTotalAmount()).thenReturn(25000L);

        when(paymentRepository.findById(paymentId)).thenReturn(Optional.of(payment));
        when(bankReconRepo.findByBankTransactionId("TXN123")).thenReturn(Optional.empty());
        when(bankReconRepo.findByPaymentId(paymentId)).thenReturn(Optional.empty());
        when(financialRuleEngine.getReconciliationTolerance()).thenReturn(0L);
        when(bankReconRepo.save(any(BankReconciliation.class))).thenAnswer(invocation -> invocation.getArgument(0));

        ReconcileBankRequest request = ReconcileBankRequest.builder()
                .paymentId(paymentId)
                .bankTransactionId("TXN123")
                .actualAmount(25000L) // 250.00 in paise
                .build();

        BankReconciliationResponse response = reconciliationService.reconcileBankPayment(request);

        assertNotNull(response);
        assertEquals(ReconciliationStatus.MATCHED, response.getStatus());
        assertTrue(response.getNotes().contains("Exact bank transfer amount matched"));
    }
}
