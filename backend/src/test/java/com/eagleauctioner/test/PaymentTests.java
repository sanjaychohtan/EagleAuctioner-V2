package com.eagleauctioner.test;

import com.eagleauctioner.dto.*;
import com.eagleauctioner.entity.*;
import com.eagleauctioner.enums.*;
import com.eagleauctioner.event.*;
import com.eagleauctioner.repository.*;
import com.eagleauctioner.service.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.authority.SimpleGrantedAuthority;

import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class PaymentTests {

    @Mock
    private PaymentRepository paymentRepository;
    
    @Mock
    private PaymentAdviceRepository paymentAdviceRepository;
    
    @Mock
    private SettlementRepository settlementRepository;
    
    @Mock
    private SettlementService settlementService;
    
    @Mock
    private DocumentNumberGeneratorService documentNumberGenerator;
    
    @Mock
    private ApplicationEventPublisher eventPublisher;

    @InjectMocks
    private PaymentService paymentService;

    private Settlement settlement;
    private Contract contract;
    private AuctionWinner winner;
    private BidderProfile bidderProfile;
    private User buyer;
    private AuctionLot lot;
    private Auction auction;
    private SellerProfile sellerProfile;
    private User seller;

    @BeforeEach
    void setUp() {
        buyer = User.builder().email("buyer@example.com").build();
        buyer.setId(UUID.randomUUID());

        bidderProfile = BidderProfile.builder().user(buyer).build();
        bidderProfile.setId(UUID.randomUUID());

        seller = User.builder().email("seller@example.com").build();
        seller.setId(UUID.randomUUID());

        sellerProfile = SellerProfile.builder().user(seller).build();
        sellerProfile.setId(UUID.randomUUID());

        auction = Auction.builder().sellerProfile(sellerProfile).build();
        auction.setId(UUID.randomUUID());

        lot = AuctionLot.builder().auction(auction).build();
        lot.setId(UUID.randomUUID());

        winner = AuctionWinner.builder()
                .bidderProfile(bidderProfile)
                .auctionLot(lot)
                .build();
        winner.setId(UUID.randomUUID());

        contract = Contract.builder()
                .winner(winner)
                .status(ContractStatus.ACCEPTED)
                .build();
        contract.setId(UUID.randomUUID());

        settlement = Settlement.builder()
                .contract(contract)
                .contractNumber("SET-001")
                .status(SettlementStatus.PAYMENT_PENDING)
                .winningAmount(116200L)
                .platformFee(10000L)
                .taxAmount(1800L)
                .payoutAmount(106200L)
                .build();
        settlement.setId(UUID.randomUUID());
    }

    private void setupSecurityContext(String username, String role) {
        Authentication authentication = mock(Authentication.class);
        SecurityContext securityContext = mock(SecurityContext.class);
        lenient().when(securityContext.getAuthentication()).thenReturn(authentication);
        SecurityContextHolder.setContext(securityContext);
        lenient().when(authentication.getName()).thenReturn(username);
        
        List<SimpleGrantedAuthority> authorities = Collections.singletonList(new SimpleGrantedAuthority(role));
        lenient().doReturn(authorities).when(authentication).getAuthorities();
    }

    @Test
    void testCreatePaymentAdvice() {
        when(documentNumberGenerator.generateNextNumber(DocumentType.PAYMENT_ADVICE)).thenReturn("PA-123");
        when(paymentAdviceRepository.save(any(PaymentAdvice.class))).thenAnswer(i -> i.getArguments()[0]);
        when(paymentAdviceRepository.findBySettlementId(settlement.getId())).thenReturn(Optional.empty());

        PaymentAdvice advice = paymentService.createPaymentAdvice(settlement);

        assertNotNull(advice);
        assertEquals("PA-123", advice.getAdviceNumber());
        assertEquals(118000L, advice.getAmountDue());
        assertEquals(PaymentAdviceStatus.PENDING, advice.getStatus());
        assertEquals(settlement, advice.getSettlement());
    }

    @Test
    void testCreatePaymentAdvice_Duplicate() {
        when(paymentAdviceRepository.findBySettlementId(settlement.getId())).thenReturn(Optional.of(PaymentAdvice.builder().build()));
        
        assertThrows(IllegalStateException.class, () -> {
            paymentService.createPaymentAdvice(settlement);
        });
    }

    @Test
    void testReceivePayment_Duplicate() {
        setupSecurityContext("buyer@example.com", "ROLE_BIDDER");
        
        PaymentRequest request = PaymentRequest.builder()
                .amount(118000L)
                .paymentMethod(PaymentMethod.BANK_TRANSFER)
                .referenceNumber("REF12345")
                .build();

        when(settlementRepository.findByIdWithRelationsForUpdate(settlement.getId())).thenReturn(Optional.of(settlement));
        when(paymentRepository.existsByReferenceNumber("REF12345")).thenReturn(true);

        assertThrows(IllegalArgumentException.class, () -> {
            paymentService.receivePayment(settlement.getId(), request);
        });
    }

    @Test
    void testReceivePayment_InvalidState() {
        setupSecurityContext("buyer@example.com", "ROLE_BIDDER");
        
        settlement.setStatus(SettlementStatus.COMPLETED);
        
        PaymentRequest request = PaymentRequest.builder()
                .amount(118000L)
                .paymentMethod(PaymentMethod.BANK_TRANSFER)
                .referenceNumber("REF12345")
                .build();

        when(settlementRepository.findByIdWithRelationsForUpdate(settlement.getId())).thenReturn(Optional.of(settlement));

        assertThrows(IllegalStateException.class, () -> {
            paymentService.receivePayment(settlement.getId(), request);
        });
    }

    @Test
    void testReceivePayment_Success() {
        setupSecurityContext("buyer@example.com", "ROLE_BIDDER");
        
        PaymentRequest request = PaymentRequest.builder()
                .amount(118000L)
                .paymentMethod(PaymentMethod.BANK_TRANSFER)
                .referenceNumber("REF12345")
                .build();

        PaymentAdvice advice = PaymentAdvice.builder()
                .adviceNumber("PA-123")
                .amountDue(118000L)
                .status(PaymentAdviceStatus.PENDING)
                .build();

        when(settlementRepository.findByIdWithRelationsForUpdate(settlement.getId())).thenReturn(Optional.of(settlement));
        when(paymentRepository.existsByReferenceNumber("REF12345")).thenReturn(false);
        when(paymentRepository.findCompletedBySettlementId(settlement.getId())).thenReturn(Collections.emptyList());
        when(documentNumberGenerator.generateNextNumber(DocumentType.PAYMENT)).thenReturn("PAY-001");
        
        when(paymentRepository.save(any(Payment.class))).thenAnswer(i -> {
            Payment p = (Payment) i.getArguments()[0];
            p.setId(UUID.randomUUID());
            return p;
        });

        when(paymentAdviceRepository.findBySettlementId(settlement.getId())).thenReturn(Optional.of(advice));

        PaymentResponse response = paymentService.receivePayment(settlement.getId(), request);

        assertNotNull(response);
        assertEquals("PAY-001", response.getPaymentNumber());
        assertEquals(PaymentStatus.COMPLETED, response.getStatus());
        assertEquals(118000L, response.getTotalAmount());
        assertEquals(3, response.getAllocations().size()); // Platform fee, tax, payout
        
        verify(paymentAdviceRepository, times(1)).save(advice);
        assertEquals(PaymentAdviceStatus.COMPLETED, advice.getStatus());
        
        verify(settlementService, times(1)).receivePayment(eq(settlement.getId()), anyString());
        verify(eventPublisher, times(1)).publishEvent(any(PaymentReceivedEvent.class));
    }

    @Test
    void testReceivePayment_PartialPayment() {
        setupSecurityContext("buyer@example.com", "ROLE_BIDDER");
        
        PaymentRequest request = PaymentRequest.builder()
                .amount(50000L)
                .paymentMethod(PaymentMethod.BANK_TRANSFER)
                .referenceNumber("REF12345")
                .build();

        PaymentAdvice advice = PaymentAdvice.builder()
                .adviceNumber("PA-123")
                .amountDue(118000L)
                .status(PaymentAdviceStatus.PENDING)
                .build();

        when(settlementRepository.findByIdWithRelationsForUpdate(settlement.getId())).thenReturn(Optional.of(settlement));
        when(paymentRepository.existsByReferenceNumber("REF12345")).thenReturn(false);
        when(paymentRepository.findCompletedBySettlementId(settlement.getId())).thenReturn(Collections.emptyList());
        when(documentNumberGenerator.generateNextNumber(DocumentType.PAYMENT)).thenReturn("PAY-001");
        
        when(paymentRepository.save(any(Payment.class))).thenAnswer(i -> {
            Payment p = (Payment) i.getArguments()[0];
            p.setId(UUID.randomUUID());
            return p;
        });

        when(paymentAdviceRepository.findBySettlementId(settlement.getId())).thenReturn(Optional.of(advice));

        PaymentResponse response = paymentService.receivePayment(settlement.getId(), request);

        assertNotNull(response);
        assertEquals(PaymentStatus.COMPLETED, response.getStatus());
        
        verify(paymentAdviceRepository, times(1)).save(advice);
        assertEquals(PaymentAdviceStatus.PARTIALLY_PAID, advice.getStatus());
        
        verify(settlementService, never()).receivePayment(any(UUID.class), anyString());
    }

    @Test
    void testReceivePayment_OverAllocation() {
        setupSecurityContext("buyer@example.com", "ROLE_BIDDER");
        
        PaymentRequest request = PaymentRequest.builder()
                .amount(150000L)
                .paymentMethod(PaymentMethod.BANK_TRANSFER)
                .referenceNumber("REF12345")
                .build();

        when(settlementRepository.findByIdWithRelationsForUpdate(settlement.getId())).thenReturn(Optional.of(settlement));
        when(paymentRepository.existsByReferenceNumber("REF12345")).thenReturn(false);
        when(paymentRepository.findCompletedBySettlementId(settlement.getId())).thenReturn(Collections.emptyList());

        assertThrows(IllegalArgumentException.class, () -> {
            paymentService.receivePayment(settlement.getId(), request);
        });
    }

    @Test
    void testValidatePaymentAccess_Success_Buyer() {
        setupSecurityContext("buyer@example.com", "ROLE_BIDDER");
        assertDoesNotThrow(() -> paymentService.validatePaymentAccess(settlement));
    }

    @Test
    void testValidatePaymentAccess_Success_Seller() {
        setupSecurityContext("seller@example.com", "ROLE_SELLER");
        assertDoesNotThrow(() -> paymentService.validatePaymentAccess(settlement));
    }

    @Test
    void testValidatePaymentAccess_Success_Admin() {
        setupSecurityContext("admin@example.com", "ROLE_ADMIN");
        assertDoesNotThrow(() -> paymentService.validatePaymentAccess(settlement));
    }

    @Test
    void testValidatePaymentAccess_Denied_OtherUser() {
        setupSecurityContext("other@example.com", "ROLE_USER");
        assertThrows(AccessDeniedException.class, () -> paymentService.validatePaymentAccess(settlement));
    }
}
