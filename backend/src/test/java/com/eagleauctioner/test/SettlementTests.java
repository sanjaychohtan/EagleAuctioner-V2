package com.eagleauctioner.test;

import com.eagleauctioner.entity.*;
import com.eagleauctioner.enums.ContractStatus;
import com.eagleauctioner.enums.SettlementStatus;
import com.eagleauctioner.enums.WinnerStatus;
import com.eagleauctioner.dto.SettlementRequest;
import com.eagleauctioner.dto.SettlementResponse;
import com.eagleauctioner.repository.ContractRepository;
import com.eagleauctioner.repository.SettlementRepository;
import com.eagleauctioner.repository.SettlementHistoryRepository;
import com.eagleauctioner.service.SettlementService;
import com.eagleauctioner.service.FinancialRuleEngine;
import java.math.BigDecimal;
import com.eagleauctioner.event.SettlementGeneratedEvent;
import com.eagleauctioner.event.SettlementApprovedEvent;
import com.eagleauctioner.event.SettlementRejectedEvent;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Spy;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.authority.SimpleGrantedAuthority;

import java.time.Instant;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class SettlementTests {

    @Mock private SettlementRepository settlementRepository;
    @Mock private ContractRepository contractRepository;
    @Mock private SettlementHistoryRepository settlementHistoryRepository;
    @Mock private ApplicationEventPublisher eventPublisher;
    @Mock private FinancialRuleEngine financialRuleEngine;
    @Spy private ObjectMapper objectMapper = new ObjectMapper();

    @InjectMocks private SettlementService settlementService;

    private User buyerUser;
    private BidderProfile buyerProfile;
    private User sellerUser;
    private SellerProfile sellerProfile;
    private SellerCompany sellerCompany;
    private Auction auction;
    private AuctionLot lot;
    private AuctionWinner winner;
    private Contract contract;
    private Settlement settlement;

    @BeforeEach
    void setUp() {
        buyerUser = new User();
        buyerUser.setId(UUID.randomUUID());
        buyerUser.setEmail("buyer@example.com");
        buyerUser.setFirstName("John");
        buyerUser.setLastName("Buyer");
        buyerUser.setMobile("1234567890");

        buyerProfile = new BidderProfile();
        buyerProfile.setId(UUID.randomUUID());
        buyerProfile.setUser(buyerUser);

        sellerUser = new User();
        sellerUser.setId(UUID.randomUUID());
        sellerUser.setEmail("seller@example.com");
        sellerUser.setFirstName("Jane");
        sellerUser.setLastName("Seller");

        sellerProfile = new SellerProfile();
        sellerProfile.setId(UUID.randomUUID());
        sellerProfile.setUser(sellerUser);

        sellerCompany = new SellerCompany();
        sellerCompany.setId(UUID.randomUUID());
        sellerCompany.setCompanyName("Eagle Corp");
        sellerCompany.setGstin("27AAAAA0000A1Z5");
        sellerProfile.setCompany(sellerCompany);

        auction = Auction.builder()
                .sellerProfile(sellerProfile)
                .auctionNumber("AUC-1001")
                .title("Scrap Metal Sale")
                .description("Bulk industrial scrap metal auction")
                .auctionType(com.eagleauctioner.enums.AuctionType.FORWARD)
                .currency("INR")
                .build();
        auction.setId(UUID.randomUUID());

        lot = AuctionLot.builder()
                .auction(auction)
                .lotNumber("LOT-01")
                .title("Heavy Melting Scrap")
                .description("Grade A melting scrap")
                .quantity(java.math.BigDecimal.valueOf(505))
                .unitOfMeasure("MT")
                .build();
        lot.setId(UUID.randomUUID());

        winner = AuctionWinner.builder()
                .auctionLot(lot)
                .bidderProfile(buyerProfile)
                .winningAmount(15000000L)
                .status(WinnerStatus.APPROVED)
                .build();
        winner.setId(UUID.randomUUID());

        contract = Contract.builder()
                .documentNumber("CON-2026-00001")
                .winner(winner)
                .status(ContractStatus.ACCEPTED)
                .totalAmount(15000000L)
                .build();
        contract.setId(UUID.randomUUID());

        settlement = Settlement.builder()
                .contract(contract)
                .status(SettlementStatus.DRAFT)
                .contractNumber(contract.getDocumentNumber())
                .winnerId(winner.getId())
                .buyerSnapshot("{}")
                .sellerSnapshot("{}")
                .auctionSnapshot("{}")
                .lotSnapshot("{}")
                .winningAmount(contract.getTotalAmount())
                .currency("INR")
                .taxSnapshot("{}")
                .generatedTimestamp(Instant.now())
                .build();
        settlement.setId(UUID.randomUUID());

        // Setup generic security context as Buyer
        setupSecurityContext("buyer@example.com", "ROLE_BIDDER");

        lenient().when(financialRuleEngine.getPlatformFeePercentage()).thenReturn(new BigDecimal("5.00"));
    }

    private void setupSecurityContext(String email, String role) {
        SecurityContext securityContext = mock(SecurityContext.class);
        Authentication authentication = mock(Authentication.class);
        when(authentication.getName()).thenReturn(email);
        doReturn(Collections.singletonList(new SimpleGrantedAuthority(role)))
                .when(authentication).getAuthorities();
        when(securityContext.getAuthentication()).thenReturn(authentication);
        SecurityContextHolder.setContext(securityContext);
    }

    @Test
    void testGenerateSettlement_Success() {
        when(contractRepository.findByIdWithRelationsForUpdate(contract.getId())).thenReturn(Optional.of(contract));
        when(settlementRepository.findByContractId(contract.getId())).thenReturn(Optional.empty());
        when(settlementRepository.save(any(Settlement.class))).thenAnswer(invocation -> {
            Settlement s = invocation.getArgument(0);
            s.setId(UUID.randomUUID());
            return s;
        });

        SettlementResponse response = settlementService.generateSettlement(contract.getId());

        assertNotNull(response);
        assertEquals(contract.getDocumentNumber(), response.getContractNumber());
        assertEquals(SettlementStatus.DRAFT, response.getStatus());
        assertEquals(15000000L, response.getWinningAmount());
        assertNotNull(response.getBuyerSnapshot());
        assertNotNull(response.getSellerSnapshot());
        assertNotNull(response.getAuctionSnapshot());
        assertNotNull(response.getLotSnapshot());
        assertNotNull(response.getTaxSnapshot());

        verify(eventPublisher, times(1)).publishEvent(any(SettlementGeneratedEvent.class));
    }

    @Test
    void testGenerateSettlement_DuplicatePrevention_ReturnsExisting() {
        when(contractRepository.findByIdWithRelationsForUpdate(contract.getId())).thenReturn(Optional.of(contract));
        when(settlementRepository.findByContractId(contract.getId())).thenReturn(Optional.of(settlement));

        SettlementResponse response = settlementService.generateSettlement(contract.getId());

        assertNotNull(response);
        assertEquals(settlement.getId(), response.getId());
        verify(settlementRepository, never()).save(any(Settlement.class));
    }

    @Test
    void testGenerateSettlement_ContractStatusValidation_ThrowsException() {
        contract.setStatus(ContractStatus.DRAFT);
        when(contractRepository.findByIdWithRelationsForUpdate(contract.getId())).thenReturn(Optional.of(contract));

        assertThrows(IllegalStateException.class, () -> {
            settlementService.generateSettlement(contract.getId());
        });
    }

    @Test
    void testSubmitForApproval_Success() {
        when(settlementRepository.findByIdWithRelationsForUpdate(settlement.getId())).thenReturn(Optional.of(settlement));
        when(settlementRepository.save(any(Settlement.class))).thenAnswer(invocation -> invocation.getArgument(0));

        SettlementResponse response = settlementService.submitForApproval(settlement.getId());

        assertNotNull(response);
        assertEquals(SettlementStatus.PENDING_APPROVAL, response.getStatus());
    }

    @Test
    void testApproveSettlement_Success() {
        settlement.setStatus(SettlementStatus.PENDING_APPROVAL);
        when(settlementRepository.findByIdWithRelationsForUpdate(settlement.getId())).thenReturn(Optional.of(settlement));
        when(settlementRepository.save(any(Settlement.class))).thenAnswer(invocation -> invocation.getArgument(0));

        setupSecurityContext("seller@example.com", "ROLE_SELLER");

        SettlementResponse response = settlementService.approveSettlement(settlement.getId());

        assertNotNull(response);
        assertEquals(SettlementStatus.APPROVED, response.getStatus());
        verify(eventPublisher, times(1)).publishEvent(any(SettlementApprovedEvent.class));
    }

    @Test
    void testRejectSettlement_Success() {
        settlement.setStatus(SettlementStatus.PENDING_APPROVAL);
        when(settlementRepository.findByIdWithRelationsForUpdate(settlement.getId())).thenReturn(Optional.of(settlement));
        when(settlementRepository.save(any(Settlement.class))).thenAnswer(invocation -> invocation.getArgument(0));

        setupSecurityContext("seller@example.com", "ROLE_SELLER");

        SettlementResponse response = settlementService.rejectSettlement(settlement.getId(), "Disputed snapshots");

        assertNotNull(response);
        assertEquals(SettlementStatus.REJECTED, response.getStatus());
        verify(eventPublisher, times(1)).publishEvent(any(SettlementRejectedEvent.class));
    }

    @Test
    void testTransitionToPaymentPending_Success() {
        settlement.setStatus(SettlementStatus.APPROVED);
        when(settlementRepository.findByIdWithRelationsForUpdate(settlement.getId())).thenReturn(Optional.of(settlement));
        when(settlementRepository.save(any(Settlement.class))).thenAnswer(invocation -> invocation.getArgument(0));

        setupSecurityContext("seller@example.com", "ROLE_SELLER");

        SettlementResponse response = settlementService.transitionToPaymentPending(settlement.getId());

        assertNotNull(response);
        assertEquals(SettlementStatus.PAYMENT_PENDING, response.getStatus());
    }

    @Test
    void testValidateSettlementAccess_IDOR_ThrowsException() {
        settlement.setStatus(SettlementStatus.DRAFT);
        when(settlementRepository.findByIdWithRelationsForUpdate(settlement.getId())).thenReturn(Optional.of(settlement));

        setupSecurityContext("intruder@example.com", "ROLE_BIDDER");

        assertThrows(AccessDeniedException.class, () -> {
            settlementService.getById(settlement.getId());
        });
    }

    @Test
    void testValidateSettlementAccess_Admin_Success() {
        settlement.setStatus(SettlementStatus.DRAFT);
        when(settlementRepository.findByIdWithRelationsForUpdate(settlement.getId())).thenReturn(Optional.of(settlement));

        setupSecurityContext("admin@example.com", "ROLE_ADMIN");

        SettlementResponse response = settlementService.getById(settlement.getId());
        assertNotNull(response);
    }

    @Test
    void testOptimisticLocking_ThrowsException() {
        settlement.setStatus(SettlementStatus.DRAFT);
        when(settlementRepository.findByIdWithRelationsForUpdate(settlement.getId())).thenReturn(Optional.of(settlement));
        when(settlementRepository.save(any(Settlement.class))).thenThrow(new org.springframework.orm.ObjectOptimisticLockingFailureException(Settlement.class, settlement.getId()));

        assertThrows(org.springframework.orm.ObjectOptimisticLockingFailureException.class, () -> {
            settlementService.submitForApproval(settlement.getId());
        });
    }

    @Test
    void testSnapshotCreation() throws Exception {
        when(contractRepository.findByIdWithRelationsForUpdate(contract.getId())).thenReturn(Optional.of(contract));
        when(settlementRepository.findByContractId(contract.getId())).thenReturn(Optional.empty());
        when(settlementRepository.save(any(Settlement.class))).thenAnswer(invocation -> invocation.getArgument(0));

        SettlementResponse response = settlementService.generateSettlement(contract.getId());

        assertNotNull(response);

        Map<?, ?> buyer = objectMapper.readValue(response.getBuyerSnapshot(), Map.class);
        assertEquals("John", buyer.get("firstName"));
        assertEquals("Buyer", buyer.get("lastName"));
        assertEquals("buyer@example.com", buyer.get("email"));

        Map<?, ?> seller = objectMapper.readValue(response.getSellerSnapshot(), Map.class);
        assertEquals("Jane", seller.get("firstName"));
        assertEquals("seller@example.com", seller.get("email"));
        assertEquals("Eagle Corp", seller.get("companyName"));
        assertEquals("27AAAAA0000A1Z5", seller.get("gstin"));

        Map<?, ?> auctionMap = objectMapper.readValue(response.getAuctionSnapshot(), Map.class);
        assertEquals("AUC-1001", auctionMap.get("auctionNumber"));
        assertEquals("Scrap Metal Sale", auctionMap.get("title"));

        Map<?, ?> lotMap = objectMapper.readValue(response.getLotSnapshot(), Map.class);
        assertEquals("LOT-01", lotMap.get("lotNumber"));
        assertEquals("Heavy Melting Scrap", lotMap.get("title"));

        Map<?, ?> taxMap = objectMapper.readValue(response.getTaxSnapshot(), Map.class);
        assertEquals("GST", taxMap.get("taxType"));
        assertEquals("18%", taxMap.get("totalTaxRate"));
    }

    @Test
    void testCompleteSettlement_Success() {
        settlement.setStatus(SettlementStatus.PAYMENT_RECEIVED);
        when(settlementRepository.findByIdWithRelationsForUpdate(settlement.getId())).thenReturn(Optional.of(settlement));
        when(settlementRepository.save(any(Settlement.class))).thenAnswer(invocation -> invocation.getArgument(0));

        setupSecurityContext("seller@example.com", "ROLE_SELLER");

        SettlementResponse response = settlementService.completeSettlement(settlement.getId(), "Payment fully verified.");

        assertNotNull(response);
        assertEquals(SettlementStatus.COMPLETED, response.getStatus());
        assertEquals("seller@example.com", response.getCompletedBy());
        assertNotNull(response.getCompletedAt());
        assertEquals("Payment fully verified.", response.getCompletionRemarks());

        verify(eventPublisher, times(1)).publishEvent(any(com.eagleauctioner.event.SettlementCompletedEvent.class));
        verify(settlementHistoryRepository, times(1)).save(any(SettlementHistory.class));
    }

    @Test
    void testCompleteSettlement_IllegalState_ThrowsException() {
        settlement.setStatus(SettlementStatus.DRAFT);
        when(settlementRepository.findByIdWithRelationsForUpdate(settlement.getId())).thenReturn(Optional.of(settlement));

        setupSecurityContext("seller@example.com", "ROLE_SELLER");

        assertThrows(IllegalStateException.class, () -> {
            settlementService.completeSettlement(settlement.getId(), "Complete draft directly");
        });
    }

    @Test
    void testCompleteSettlement_Duplicate_ThrowsException() {
        settlement.setStatus(SettlementStatus.COMPLETED);
        when(settlementRepository.findByIdWithRelationsForUpdate(settlement.getId())).thenReturn(Optional.of(settlement));

        setupSecurityContext("seller@example.com", "ROLE_SELLER");

        assertThrows(IllegalStateException.class, () -> {
            settlementService.completeSettlement(settlement.getId(), "Complete again");
        });
    }

    @Test
    void testCancelSettlement_Success() {
        settlement.setStatus(SettlementStatus.PAYMENT_PENDING);
        when(settlementRepository.findByIdWithRelationsForUpdate(settlement.getId())).thenReturn(Optional.of(settlement));
        when(settlementRepository.save(any(Settlement.class))).thenAnswer(invocation -> invocation.getArgument(0));

        setupSecurityContext("buyer@example.com", "ROLE_BIDDER");

        SettlementResponse response = settlementService.cancelSettlement(settlement.getId(), "Buyer backed out.");

        assertNotNull(response);
        assertEquals(SettlementStatus.CANCELLED, response.getStatus());
        assertEquals("buyer@example.com", response.getCancelledBy());
        assertNotNull(response.getCancelledAt());
        assertEquals("Buyer backed out.", response.getCancellationReason());

        verify(eventPublisher, times(1)).publishEvent(any(com.eagleauctioner.event.SettlementCancelledEvent.class));
        verify(settlementHistoryRepository, times(1)).save(any(SettlementHistory.class));
    }

    @Test
    void testCancelSettlement_IllegalCompletedCancellation_ThrowsException() {
        settlement.setStatus(SettlementStatus.COMPLETED);
        when(settlementRepository.findByIdWithRelationsForUpdate(settlement.getId())).thenReturn(Optional.of(settlement));

        setupSecurityContext("buyer@example.com", "ROLE_BIDDER");

        assertThrows(IllegalStateException.class, () -> {
            settlementService.cancelSettlement(settlement.getId(), "Cancel completed");
        });
    }

    @Test
    void testGetHistoryAndTimeline_Success() {
        SettlementHistory history1 = SettlementHistory.builder()
                .settlement(settlement)
                .actor("SYSTEM")
                .actionTimestamp(Instant.now().minusSeconds(10))
                .previousStatus(null)
                .currentStatus(SettlementStatus.DRAFT)
                .reason("Generation")
                .remarks("Settlement Draft generated automatically.")
                .build();
        history1.setId(UUID.randomUUID());

        SettlementHistory history2 = SettlementHistory.builder()
                .settlement(settlement)
                .actor("buyer@example.com")
                .actionTimestamp(Instant.now())
                .previousStatus(SettlementStatus.DRAFT)
                .currentStatus(SettlementStatus.PENDING_APPROVAL)
                .reason("Submission")
                .remarks("Please approve.")
                .build();
        history2.setId(UUID.randomUUID());

        when(settlementRepository.findById(settlement.getId())).thenReturn(Optional.of(settlement));
        when(settlementHistoryRepository.findBySettlementIdOrderByActionTimestampAsc(settlement.getId()))
                .thenReturn(Arrays.asList(history1, history2));

        List<com.eagleauctioner.dto.SettlementHistoryDto> historyList = settlementService.getHistory(settlement.getId());

        assertEquals(2, historyList.size());
        assertEquals(SettlementStatus.DRAFT, historyList.get(0).getCurrentStatus());
        assertEquals(SettlementStatus.PENDING_APPROVAL, historyList.get(1).getCurrentStatus());
        assertEquals("buyer@example.com", historyList.get(1).getActor());

        // Chronological timeline matches history
        List<com.eagleauctioner.dto.SettlementHistoryDto> timelineList = settlementService.getTimeline(settlement.getId());
        assertEquals(2, timelineList.size());
    }

    @Test
    void testGetRemarks_Success() {
        SettlementHistory history1 = SettlementHistory.builder()
                .settlement(settlement)
                .remarks("Remark 1")
                .actionTimestamp(Instant.now())
                .build();

        SettlementHistory history2 = SettlementHistory.builder()
                .settlement(settlement)
                .remarks("  ") // should be filtered out
                .actionTimestamp(Instant.now())
                .build();

        SettlementHistory history3 = SettlementHistory.builder()
                .settlement(settlement)
                .remarks("Remark 2")
                .actionTimestamp(Instant.now())
                .build();

        when(settlementRepository.findById(settlement.getId())).thenReturn(Optional.of(settlement));
        when(settlementHistoryRepository.findBySettlementIdOrderByActionTimestampAsc(settlement.getId()))
                .thenReturn(Arrays.asList(history1, history2, history3));

        List<String> remarksList = settlementService.getRemarks(settlement.getId());

        assertEquals(2, remarksList.size());
        assertEquals("Remark 1", remarksList.get(0));
        assertEquals("Remark 2", remarksList.get(1));
    }

    @Test
    void testAddRemark_Success() {
        when(settlementRepository.findByIdWithRelationsForUpdate(settlement.getId())).thenReturn(Optional.of(settlement));

        settlementService.addRemark(settlement.getId(), "Operational update.");

        verify(settlementHistoryRepository, times(1)).save(any(SettlementHistory.class));
    }

    @Test
    void testSaleConfirmationLinkage() {
        // Winner -> Contract -> Sale Confirmation -> Settlement
        SaleConfirmation saleConfirmation = SaleConfirmation.builder()
                .documentNumber("SC-999")
                .build();
        saleConfirmation.setId(UUID.randomUUID());

        contract.setSaleConfirmation(saleConfirmation);

        assertEquals(winner.getId(), contract.getWinner().getId());
        assertEquals(saleConfirmation.getId(), contract.getSaleConfirmation().getId());
        assertEquals(contract.getId(), settlement.getContract().getId());
        assertEquals(saleConfirmation.getDocumentNumber(), settlement.getContract().getSaleConfirmation().getDocumentNumber());
    }

    @Test
    void testAuditMetadata_Success() {
        // Setup AuditContext
        com.eagleauctioner.context.AuditContext auditCtx = com.eagleauctioner.context.AuditContext.builder()
                .actorId(UUID.randomUUID())
                .correlationId("correlation-123")
                .ipAddress("192.168.1.100")
                .userAgent("Mozilla/Firefox")
                .executor("test-operator")
                .build();
        com.eagleauctioner.context.AuditContext.set(auditCtx);

        try {
            when(settlementRepository.findByIdWithRelationsForUpdate(settlement.getId())).thenReturn(Optional.of(settlement));
            settlementService.addRemark(settlement.getId(), "Test Audit Context");

            verify(settlementHistoryRepository, times(1)).save(argThat(h -> 
                "test-operator".equals(h.getActor()) &&
                "correlation-123".equals(h.getCorrelationId()) &&
                "192.168.1.100".equals(h.getIpAddress()) &&
                "Mozilla/Firefox".equals(h.getRequestSource())
            ));
        } finally {
            com.eagleauctioner.context.AuditContext.clear();
        }
    }
}
