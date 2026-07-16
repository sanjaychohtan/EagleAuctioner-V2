package com.eagleauctioner.test;

import com.eagleauctioner.entity.*;
import com.eagleauctioner.enums.*;
import com.eagleauctioner.repository.*;
import com.eagleauctioner.service.*;
import com.eagleauctioner.service.impl.DocumentNumberGeneratorServiceImpl;
import lombok.extern.slf4j.Slf4j;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.RoundingMode;
import java.util.*;
import java.util.concurrent.*;
import java.util.concurrent.atomic.AtomicLong;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@Slf4j
@ExtendWith(MockitoExtension.class)
public class DocumentEngineTests {

    @Mock
    private FeeInvoiceRepository feeInvoiceRepository;

    @Mock
    private DocumentNumberGeneratorService documentNumberGenerator;

    @Mock
    private FinancialRuleEngine financialRuleEngine;

    @InjectMocks
    private InvoiceService invoiceService;

    private SaleConfirmation saleConfirmation;

    @BeforeEach
    public void setUp() {
        saleConfirmation = SaleConfirmation.builder()
                .documentNumber("SC-2026-00001")
                .status(SaleConfirmationStatus.DRAFT)
                .saleAmount(180000L)
                .build();
        saleConfirmation.setId(UUID.randomUUID());
    }

    @Test
    public void testDynamicInvoiceCalculationWithRulesEngine() {
        PurchaseOrder po = PurchaseOrder.builder()
                .documentNumber("PO-2026-00001")
                .saleConfirmation(saleConfirmation)
                .status(PurchaseOrderStatus.ISSUED)
                .totalAmount(1000000L)
                .build();
        po.setId(UUID.randomUUID());

        when(financialRuleEngine.getPlatformFeePercentage()).thenReturn(750L);
        when(financialRuleEngine.getVatPercentage()).thenReturn(1500L);
        when(financialRuleEngine.getRoundingMode()).thenReturn(RoundingMode.HALF_UP);
        when(financialRuleEngine.getCurrencyPrecision()).thenReturn(2);

        when(documentNumberGenerator.generateNextNumber(DocumentType.FEE_INVOICE))
                .thenReturn("FI-2026-00001");
        when(feeInvoiceRepository.save(any(FeeInvoice.class)))
                .thenAnswer(inv -> inv.getArgument(0));

        FeeInvoice invoice = invoiceService.calculateAndCreateInvoice(po);

        assertNotNull(invoice);
        assertEquals("FI-2026-00001", invoice.getDocumentNumber());
        assertEquals(75000L, invoice.getSubtotal());
        assertEquals(11250L, invoice.getTaxAmount());
        assertEquals(86250L, invoice.getTotalAmount());
    }

    @Test
    public void testConcurrentSequenceGenerationStressTest() throws InterruptedException {
        int threadCount = 8;
        int requestCount = 100;

        ExecutorService executor = Executors.newFixedThreadPool(threadCount);
        CountDownLatch releaseLatch = new CountDownLatch(1);
        CountDownLatch doneLatch = new CountDownLatch(requestCount);

        List<String> allocatedNumbers = Collections.synchronizedList(new ArrayList<>());
        List<Throwable> threadExceptions = Collections.synchronizedList(new ArrayList<>());

        AtomicLong mockSequenceDatabaseValue = new AtomicLong(1L);

        DocumentSequenceRepository mockSeqRepo = mock(DocumentSequenceRepository.class);
        when(mockSeqRepo.findByCoordinatesForUpdate(anyString(), anyString(), anyInt(), anyString(), any(DocumentType.class)))
                .thenAnswer(inv -> {
                    long currentVal = mockSequenceDatabaseValue.getAndIncrement();
                    DocumentSequence ds = DocumentSequence.builder()
                            .tenantId(inv.getArgument(0))
                            .branchCode(inv.getArgument(1))
                            .year(inv.getArgument(2))
                            .regionCode(inv.getArgument(3))
                            .documentType(inv.getArgument(4))
                            .nextValue(currentVal)
                            .build();
                    return Optional.of(ds);
                });

        DocumentNumberGeneratorServiceImpl stressGenerator = new DocumentNumberGeneratorServiceImpl(mockSeqRepo);

        for (int i = 0; i < requestCount; i++) {
            executor.submit(() -> {
                try {
                    releaseLatch.await();
                    String docNum = stressGenerator.generateNextNumber("DEFAULT", "MAIN", 2026, "GLOBAL", DocumentType.SALE_CONFIRMATION);
                    allocatedNumbers.add(docNum);
                } catch (Throwable ex) {
                    threadExceptions.add(ex);
                } finally {
                    doneLatch.countDown();
                }
            });
        }

        releaseLatch.countDown();
        doneLatch.await(10, TimeUnit.SECONDS);
        executor.shutdown();

        assertTrue(threadExceptions.isEmpty(), "Concurrent execution threw exceptions: " + threadExceptions);
        assertEquals(requestCount, allocatedNumbers.size());

        Set<String> uniqueNumbers = new HashSet<>(allocatedNumbers);
        assertEquals(requestCount, uniqueNumbers.size(), "Duplicates detected!");
    }

    @Test
    public void testPdfEngineDefensiveSanitization() {
        PdfGenerationService pdfService = new PdfGenerationService();

        String unsafeHeader = "attachment;\r\n filename=malicious.pdf";
        String cleanHeader = pdfService.sanitizeHeaderValue(unsafeHeader);
        assertFalse(cleanHeader.contains("\r"));
        assertFalse(cleanHeader.contains("\n"));

        String unsafeFilename = "../../../etc/passwd_invoice.pdf";
        String cleanFilename = pdfService.sanitizeFilename(unsafeFilename);
        assertFalse(cleanFilename.contains("../"));
    }

    @Mock
    private DocumentTemplateRepository documentTemplateRepository;

    @InjectMocks
    private DocumentTemplateService documentTemplateService;

    @Test
    public void testDocumentTemplateLifecycle() {
        DocumentTemplate template = DocumentTemplate.builder()
                .name("Standard SC Template")
                .documentType(DocumentType.SALE_CONFIRMATION)
                .content("<html><body>{{documentNumber}}</body></html>")
                .isActive(true)
                .build();
        template.setId(UUID.randomUUID());

        when(documentTemplateRepository.save(any(DocumentTemplate.class))).thenReturn(template);
        when(documentTemplateRepository.findByDocumentTypeAndIsActiveTrue(DocumentType.SALE_CONFIRMATION))
                .thenReturn(Optional.of(template));

        DocumentTemplate saved = documentTemplateService.createTemplate(template);
        assertNotNull(saved);
        assertEquals("Standard SC Template", saved.getName());

        DocumentTemplate active = documentTemplateService.getActiveTemplate(DocumentType.SALE_CONFIRMATION);
        assertEquals(saved.getId(), active.getId());
    }
}
