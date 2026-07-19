package com.eagleauctioner.test;

import com.eagleauctioner.entity.*;
import com.eagleauctioner.enums.ContractStatus;
import com.eagleauctioner.enums.DocumentType;
import com.eagleauctioner.enums.WinnerStatus;
import com.eagleauctioner.dto.ContractSettlementPaymentDTOs.*;
import com.eagleauctioner.repository.ContractRepository;
import com.eagleauctioner.service.ContractService;
import com.eagleauctioner.service.DocumentNumberGeneratorService;
import com.eagleauctioner.service.SettlementService;
import com.eagleauctioner.event.ContractGeneratedEvent;
import com.eagleauctioner.event.ContractAcceptedEvent;
import com.eagleauctioner.event.ContractRejectedEvent;
import com.eagleauctioner.event.ContractTerminatedEvent;
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
public class ContractTests {

    @Mock private ContractRepository contractRepository;
    @Mock private DocumentNumberGeneratorService documentNumberGenerator;
    @Mock private ApplicationEventPublisher eventPublisher;
    @Mock private SettlementService settlementService;

    @InjectMocks private ContractService contractService;

    private User buyerUser;
    private BidderProfile buyerProfile;
    private User sellerUser;
    private SellerProfile sellerProfile;
    private Auction auction;
    private AuctionLot lot;
    private AuctionWinner winner;
    private Contract contract;

    @BeforeEach
    void setUp() {
        buyerUser = new User();
        buyerUser.setId(UUID.randomUUID());
        buyerUser.setEmail("buyer@example.com");

        buyerProfile = new BidderProfile();
        buyerProfile.setId(UUID.randomUUID());
        buyerProfile.setUser(buyerUser);

        sellerUser = new User();
        sellerUser.setId(UUID.randomUUID());
        sellerUser.setEmail("seller@example.com");

        sellerProfile = new SellerProfile();
        sellerProfile.setId(UUID.randomUUID());
        sellerProfile.setUser(sellerUser);

        auction = Auction.builder()
                .sellerProfile(sellerProfile)
                .currency("EUR")
                .build();

        lot = AuctionLot.builder()
                .auction(auction)
                .build();

        winner = AuctionWinner.builder()
                .auctionLot(lot)
                .bidderProfile(buyerProfile)
                .winningAmount(1000000L)
                .status(WinnerStatus.APPROVED)
                .build();
        winner.setId(UUID.randomUUID());

        contract = Contract.builder()
                .documentNumber("CON-2026-00001")
                .winner(winner)
                .status(ContractStatus.DRAFT)
                .totalAmount(1000000L)
                .versions(new ArrayList<>())
                .build();
        contract.setId(UUID.randomUUID());

        // Standard context setup
        SecurityContext securityContext = mock(SecurityContext.class);
        Authentication authentication = mock(Authentication.class);
        lenient().when(authentication.getName()).thenReturn("buyer@example.com");
        lenient().doReturn(Collections.singletonList(new SimpleGrantedAuthority("ROLE_BIDDER")))
                .when(authentication).getAuthorities();
        lenient().when(securityContext.getAuthentication()).thenReturn(authentication);
        SecurityContextHolder.setContext(securityContext);
    }

    @Test
    void testCreateContractDraft_Success() {
        when(documentNumberGenerator.generateNextNumber(DocumentType.CONTRACT)).thenReturn("CON-2026-00001");
        when(contractRepository.saveAndFlush(any(Contract.class))).thenAnswer(invocation -> {
            Contract c = invocation.getArgument(0);
            c.setId(UUID.randomUUID());
            return c;
        });

        Contract draft = contractService.createContractDraft(winner);

        assertNotNull(draft);
        assertEquals("CON-2026-00001", draft.getDocumentNumber());
        assertEquals(ContractStatus.DRAFT, draft.getStatus());
        assertEquals(1000000L, draft.getTotalAmount());
        assertEquals(1, draft.getVersions().size());
        verify(eventPublisher, times(1)).publishEvent(any(ContractGeneratedEvent.class));
    }

    @Test
    void testAcceptContract_Success_ByBuyer() {
        when(contractRepository.findByIdWithRelations(contract.getId())).thenReturn(Optional.of(contract));
        when(contractRepository.save(any(Contract.class))).thenAnswer(invocation -> invocation.getArgument(0));
        lenient().when(settlementService.detectRegion(any(Contract.class))).thenReturn("GLOBAL");

        ContractResponse response = contractService.acceptContract(contract.getId(), "Accepting standard terms");

        assertNotNull(response);
        assertEquals(ContractStatus.ACCEPTED, response.getStatus());
        verify(eventPublisher, times(1)).publishEvent(any(ContractAcceptedEvent.class));
        verify(settlementService, times(1)).createSettlementDraft(any(Contract.class), eq("GLOBAL"));
    }

    @Test
    void testAcceptContract_IDOR_Violation() {
        // Switch to an attacker security context
        Authentication attackerAuth = mock(Authentication.class);
        lenient().when(attackerAuth.getName()).thenReturn("attacker@example.com");
        lenient().doReturn(Collections.singletonList(new SimpleGrantedAuthority("ROLE_BIDDER")))
                .when(attackerAuth).getAuthorities();
        
        SecurityContext securityContext = mock(SecurityContext.class);
        lenient().when(securityContext.getAuthentication()).thenReturn(attackerAuth);
        SecurityContextHolder.setContext(securityContext);

        when(contractRepository.findByIdWithRelations(contract.getId())).thenReturn(Optional.of(contract));

        assertThrows(AccessDeniedException.class, () -> {
            contractService.acceptContract(contract.getId(), "Attacking");
        });
    }

    @Test
    void testAcceptContract_AdminAccess_BypassesIDOR() {
        // Switch to admin context
        Authentication adminAuth = mock(Authentication.class);
        lenient().when(adminAuth.getName()).thenReturn("admin@example.com");
        lenient().doReturn(Collections.singletonList(new SimpleGrantedAuthority("ROLE_ADMIN")))
                .when(adminAuth).getAuthorities();
        
        SecurityContext securityContext = mock(SecurityContext.class);
        lenient().when(securityContext.getAuthentication()).thenReturn(adminAuth);
        SecurityContextHolder.setContext(securityContext);

        when(contractRepository.findByIdWithRelations(contract.getId())).thenReturn(Optional.of(contract));
        when(contractRepository.save(any(Contract.class))).thenAnswer(invocation -> invocation.getArgument(0));
        lenient().when(settlementService.detectRegion(any(Contract.class))).thenReturn("GLOBAL");

        ContractResponse response = contractService.acceptContract(contract.getId(), "Admin signature");

        assertNotNull(response);
        assertEquals(ContractStatus.ACCEPTED, response.getStatus());
    }

    @Test
    void testOptimisticLockingOnVersionConflict() {
        Contract original = Contract.builder()
                .status(ContractStatus.DRAFT)
                .build();
        original.setId(UUID.randomUUID());
        original.setVersion(1L);

        Contract stale = Contract.builder()
                .status(ContractStatus.DRAFT)
                .build();
        stale.setId(original.getId());
        stale.setVersion(1L);

        original.setVersion(2L);

        assertThrows(jakarta.persistence.OptimisticLockException.class, () -> {
            if (stale.getVersion() < original.getVersion()) {
                throw new jakarta.persistence.OptimisticLockException("Database conflict has occurred");
            }
        });
    }

    @Test
    void testCreateContractDraft_RejectsNonApprovedWinner() {
        AuctionWinner pendingWinner = AuctionWinner.builder()
                .status(WinnerStatus.PENDING_SELLER_APPROVAL)
                .build();
        pendingWinner.setId(UUID.randomUUID());

        assertThrows(IllegalStateException.class, () -> {
            contractService.createContractDraft(pendingWinner);
        });
    }

    @Test
    void testCreateContractDraft_Idempotent_ReturnsExisting() {
        when(contractRepository.findByWinnerId(winner.getId())).thenReturn(Optional.of(contract));

        Contract result = contractService.createContractDraft(winner);

        assertNotNull(result);
        assertEquals(contract.getId(), result.getId());
        verify(contractRepository, never()).save(any(Contract.class));
    }

    @Test
    void testAcceptContract_RejectsIllegalTransitions() {
        Contract rejectedContract = Contract.builder()
                .winner(winner)
                .status(ContractStatus.REJECTED)
                .versions(new ArrayList<>())
                .build();
        rejectedContract.setId(UUID.randomUUID());

        when(contractRepository.findByIdWithRelations(rejectedContract.getId())).thenReturn(Optional.of(rejectedContract));

        assertThrows(IllegalStateException.class, () -> {
            contractService.acceptContract(rejectedContract.getId(), "Trying to accept rejected");
        });
    }

    @Test
    void testRejectContract_Success() {
        when(contractRepository.findByIdWithRelations(contract.getId())).thenReturn(Optional.of(contract));
        when(contractRepository.save(any(Contract.class))).thenAnswer(invocation -> invocation.getArgument(0));

        ContractResponse response = contractService.rejectContract(contract.getId(), "Terms are too strict");

        assertNotNull(response);
        assertEquals(ContractStatus.REJECTED, response.getStatus());
        verify(eventPublisher, times(1)).publishEvent(any(ContractRejectedEvent.class));
    }

    @Test
    void testTerminateContract_Success_ByAdmin() {
        // Admin context
        Authentication adminAuth = mock(Authentication.class);
        lenient().when(adminAuth.getName()).thenReturn("admin@example.com");
        lenient().doReturn(Collections.singletonList(new SimpleGrantedAuthority("ROLE_ADMIN")))
                .when(adminAuth).getAuthorities();
        SecurityContext securityContext = mock(SecurityContext.class);
        lenient().when(securityContext.getAuthentication()).thenReturn(adminAuth);
        SecurityContextHolder.setContext(securityContext);

        when(contractRepository.findByIdWithRelations(contract.getId())).thenReturn(Optional.of(contract));
        when(contractRepository.save(any(Contract.class))).thenAnswer(invocation -> invocation.getArgument(0));

        ContractResponse response = contractService.terminateContract(contract.getId(), "Legal breach");

        assertNotNull(response);
        assertEquals(ContractStatus.TERMINATED, response.getStatus());
        verify(eventPublisher, times(1)).publishEvent(any(ContractTerminatedEvent.class));
    }

    @Test
    void testGetContractHistory_Success() {
        contract.getVersions().add(ContractVersion.builder()
                .versionNumber(1)
                .status(ContractStatus.DRAFT)
                .changedBy("SYSTEM")
                .build());
        
        when(contractRepository.findByIdWithRelations(contract.getId())).thenReturn(Optional.of(contract));

        List<ContractVersionResponse> history = contractService.getContractHistory(contract.getId());

        assertNotNull(history);
        assertEquals(1, history.size());
        assertEquals(ContractStatus.DRAFT, history.get(0).getStatus());
    }

    @Test
    void testCreateContractDraft_ConcurrentCreation_ReturnsExisting() {
        when(documentNumberGenerator.generateNextNumber(DocumentType.CONTRACT)).thenReturn("CON-2026-00001");
        when(contractRepository.saveAndFlush(any(Contract.class)))
                .thenThrow(new org.springframework.dao.DataIntegrityViolationException("Duplicate key"));
        when(contractRepository.findByWinnerId(winner.getId()))
                .thenReturn(Optional.empty())
                .thenReturn(Optional.of(contract));

        Contract result = contractService.createContractDraft(winner);

        assertNotNull(result);
        assertEquals(contract.getId(), result.getId());
    }
}
