package com.eagleauctioner.test;

import com.eagleauctioner.entity.*;
import com.eagleauctioner.enums.*;
import com.eagleauctioner.dto.WinnerDTOs.WinnerRequest;
import com.eagleauctioner.dto.WinnerDTOs.WinnerResponse;
import com.eagleauctioner.dto.WinnerDTOs.AuctionResultResponse;
import com.eagleauctioner.repository.*;
import com.eagleauctioner.service.*;
import com.eagleauctioner.policy.ReserveEvaluationPolicy;
import com.eagleauctioner.event.WinnerApprovedEvent;
import com.eagleauctioner.event.WinnerRejectedEvent;
import com.eagleauctioner.event.WinnerOverriddenEvent;
import com.eagleauctioner.context.AuditContext;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.context.ApplicationEventPublisher;

import java.time.Instant;
import java.util.Arrays;
import java.util.ArrayList;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class WinnerTests {

    @Mock
    private AuctionWinnerRepository auctionWinnerRepository;

    @Mock
    private AuctionResultRepository auctionResultRepository;

    @Mock
    private WinnerHistoryRepository winnerHistoryRepository;

    @Mock
    private AuctionLotRepository auctionLotRepository;

    @Mock
    private BidRepository bidRepository;

    @Mock
    private com.eagleauctioner.repository.BidderProfileRepository bidderProfileRepository;

    @Mock
    private ApplicationEventPublisher eventPublisher;

    @Mock
    private ReserveEvaluationPolicy reserveEvaluationPolicy;

    @InjectMocks
    private AuctionResultService auctionResultService;

    @InjectMocks
    private WinnerService winnerService;

    private User sellerUser;
    private SellerProfile sellerProfile;
    private Auction auction;
    private AuctionLot lot;
    private BidderProfile bidder1;
    private BidderProfile bidder2;

    @BeforeEach
    void setUp() {
        sellerUser = new User();
        sellerUser.setId(UUID.randomUUID());
        sellerUser.setEmail("seller@example.com");

        sellerProfile = new SellerProfile();
        sellerProfile.setId(UUID.randomUUID());
        sellerProfile.setUser(sellerUser);
        sellerProfile.setCompanyName("Seller Corp");

        auction = Auction.builder()
                .sellerProfile(sellerProfile)
                .reservePriceEnabled(true)
                .currency("EUR")
                .taxProfile("VAT_EU")
                .build();
        auction.setState(AuctionState.ENDED);

        lot = AuctionLot.builder()
                .auction(auction)
                .startingPrice(10000L)
                .reservePrice(50000L)
                .build();
        lot.setId(UUID.randomUUID());
        lot.setLotStatus(AuctionLotStatus.SOLD);

        bidder1 = new BidderProfile();
        bidder1.setId(UUID.randomUUID());
        bidder1.setCompanyName("Bidder 1 Corp");
        bidder1.setDisplayName("John Doe");
        bidder1.setAnonymousCode("B-101");

        bidder2 = new BidderProfile();
        bidder2.setId(UUID.randomUUID());
        bidder2.setCompanyName("Bidder 2 Corp");
        bidder2.setDisplayName("Jane Smith");
        bidder2.setAnonymousCode("B-102");
    }

    @Test
    void testEvaluateLotOutcome_NoBids() {
        when(auctionLotRepository.findById(lot.getId())).thenReturn(Optional.of(lot));
        when(auctionResultRepository.findByAuctionLotId(lot.getId())).thenReturn(Optional.empty());
        when(bidRepository.findActiveBidsByLotIdWithBidderProfile(lot.getId())).thenReturn(new ArrayList<>());
        when(auctionResultRepository.save(any(AuctionResult.class))).thenAnswer(i -> i.getArgument(0));

        AuctionResultResponse response = auctionResultService.evaluateLotOutcome(lot.getId());

        assertNotNull(response);
        assertEquals(AuctionResultStatus.NO_BIDS, response.getStatus());
        assertNull(response.getWinner());
    }

    @Test
    void testEvaluateLotOutcome_ReserveMet_AutoApproved_WithSnapshots() {
        Bid highestBid = Bid.builder()
                .auctionLot(lot)
                .bidderProfile(bidder1)
                .bidAmount(60000L)
                .bidTime(Instant.now())
                .bidStatus(BidStatus.WINNING)
                .build();
        highestBid.setId(UUID.randomUUID());

        when(auctionLotRepository.findById(lot.getId())).thenReturn(Optional.of(lot));
        when(auctionResultRepository.findByAuctionLotId(lot.getId())).thenReturn(Optional.empty());
        when(bidRepository.findActiveBidsByLotIdWithBidderProfile(lot.getId())).thenReturn(Arrays.asList(highestBid));
        
        // Mock Strategy evaluation
        when(reserveEvaluationPolicy.isReserveMet(eq(lot), any(Long.class))).thenReturn(true);
        
        when(auctionWinnerRepository.save(any(AuctionWinner.class))).thenAnswer(i -> i.getArgument(0));
        when(auctionResultRepository.save(any(AuctionResult.class))).thenAnswer(i -> i.getArgument(0));

        AuctionResultResponse response = auctionResultService.evaluateLotOutcome(lot.getId());

        assertNotNull(response);
        assertEquals(AuctionResultStatus.COMPLETED, response.getStatus());
        assertTrue(response.getReserveMet());
        assertNotNull(response.getWinner());
        assertEquals(WinnerStatus.AUTO_APPROVED, response.getWinner().getStatus());
        assertEquals(60000L, response.getWinner().getWinningAmount());

        // Verify strategy was executed
        verify(reserveEvaluationPolicy, times(1)).isReserveMet(eq(lot), eq(60000L));
    }

    @Test
    void testEvaluateLotOutcome_ReserveNotMet_PendingSellerApproval() {
        Bid highestBid = Bid.builder()
                .auctionLot(lot)
                .bidderProfile(bidder1)
                .bidAmount(45000L)
                .bidTime(Instant.now())
                .bidStatus(BidStatus.WINNING)
                .build();
        highestBid.setId(UUID.randomUUID());

        when(auctionLotRepository.findById(lot.getId())).thenReturn(Optional.of(lot));
        when(auctionResultRepository.findByAuctionLotId(lot.getId())).thenReturn(Optional.empty());
        when(bidRepository.findActiveBidsByLotIdWithBidderProfile(lot.getId())).thenReturn(Arrays.asList(highestBid));
        
        // Mock Strategy evaluation
        when(reserveEvaluationPolicy.isReserveMet(eq(lot), any(Long.class))).thenReturn(false);

        when(auctionWinnerRepository.save(any(AuctionWinner.class))).thenAnswer(i -> i.getArgument(0));
        when(auctionResultRepository.save(any(AuctionResult.class))).thenAnswer(i -> i.getArgument(0));

        AuctionResultResponse response = auctionResultService.evaluateLotOutcome(lot.getId());

        assertNotNull(response);
        assertEquals(AuctionResultStatus.PENDING_APPROVAL, response.getStatus());
        assertFalse(response.getReserveMet());
        assertNotNull(response.getWinner());
        assertEquals(WinnerStatus.PENDING_SELLER_APPROVAL, response.getWinner().getStatus());
    }

    @Test
    void testEvaluateLotOutcome_TieBreaker_EarlierBidWins() {
        Instant now = Instant.now();
        Bid earlierBid = Bid.builder()
                .auctionLot(lot)
                .bidderProfile(bidder1)
                .bidAmount(30000L)
                .bidTime(now.minusSeconds(10))
                .bidStatus(BidStatus.PLACED)
                .build();
        earlierBid.setId(UUID.randomUUID());

        Bid laterBid = Bid.builder()
                .auctionLot(lot)
                .bidderProfile(bidder2)
                .bidAmount(30000L)
                .bidTime(now)
                .bidStatus(BidStatus.WINNING)
                .build();
        laterBid.setId(UUID.randomUUID());

        when(auctionLotRepository.findById(lot.getId())).thenReturn(Optional.of(lot));
        when(auctionResultRepository.findByAuctionLotId(lot.getId())).thenReturn(Optional.empty());
        when(bidRepository.findActiveBidsByLotIdWithBidderProfile(lot.getId())).thenReturn(Arrays.asList(earlierBid, laterBid));
        
        when(reserveEvaluationPolicy.isReserveMet(eq(lot), any(Long.class))).thenReturn(true);
        when(auctionWinnerRepository.save(any(AuctionWinner.class))).thenAnswer(i -> i.getArgument(0));
        when(auctionResultRepository.save(any(AuctionResult.class))).thenAnswer(i -> i.getArgument(0));

        AuctionResultResponse response = auctionResultService.evaluateLotOutcome(lot.getId());

        assertNotNull(response);
        assertEquals(bidder1.getId(), response.getWinner().getBidderProfileId());
    }

    @Test
    void testSellerApproveWinner_Success() {
        AuctionWinner winner = AuctionWinner.builder()
                .auctionLot(lot)
                .bidderProfile(bidder1)
                .status(WinnerStatus.PENDING_SELLER_APPROVAL)
                .winningAmount(45000L)
                .build();
        winner.setId(UUID.randomUUID());

        AuctionResult result = AuctionResult.builder()
                .auctionLot(lot)
                .status(AuctionResultStatus.PENDING_APPROVAL)
                .highestBidAmount(45000L)
                .build();

        when(auctionWinnerRepository.findByIdWithRelations(winner.getId())).thenReturn(Optional.of(winner));
        when(auctionWinnerRepository.save(any(AuctionWinner.class))).thenAnswer(i -> i.getArgument(0));
        when(auctionResultRepository.findByAuctionLotId(lot.getId())).thenReturn(Optional.of(result));

        WinnerResponse response = winnerService.approveUnderReserveWinner(
                winner.getId(), "Accepting under reserve price", sellerUser.getId(), "seller@example.com", false);

        assertNotNull(response);
        assertEquals(WinnerStatus.APPROVED, response.getStatus());
        assertEquals(AuctionResultStatus.COMPLETED, result.getStatus());
        assertFalse(result.getReserveMet()); // Should remain false because the reserve was not met
        
        // Verify history recorded and Event published
        verify(winnerHistoryRepository, times(1)).save(any(WinnerHistory.class));
        verify(eventPublisher, times(1)).publishEvent(any(WinnerApprovedEvent.class));
    }

    @Test
    void testSellerApproveWinner_Unauthorized_Throws() {
        AuctionWinner winner = AuctionWinner.builder()
                .auctionLot(lot)
                .bidderProfile(bidder1)
                .status(WinnerStatus.PENDING_SELLER_APPROVAL)
                .winningAmount(45000L)
                .build();
        winner.setId(UUID.randomUUID());

        when(auctionWinnerRepository.findByIdWithRelations(winner.getId())).thenReturn(Optional.of(winner));

        UUID maliciousUserId = UUID.randomUUID();

        assertThrows(AccessDeniedException.class, () -> winnerService.approveUnderReserveWinner(
                winner.getId(), "Accepting other's bid", maliciousUserId, "malicious@example.com", false));
        
        // Verify event never published
        verifyNoInteractions(eventPublisher);
    }

    @Test
    void testManualOverrideWinner_Success() {
        lot.setLotStatus(AuctionLotStatus.SOLD);
        auction.setState(AuctionState.ENDED);

        WinnerRequest request = WinnerRequest.builder()
                .auctionLotId(lot.getId())
                .bidderProfileId(bidder2.getId())
                .remarks("Overriding for premium bidder")
                .build();

        when(auctionLotRepository.findById(lot.getId())).thenReturn(Optional.of(lot));
        when(bidderProfileRepository.findById(bidder2.getId())).thenReturn(Optional.of(bidder2));
        when(auctionWinnerRepository.findByAuctionLotId(lot.getId())).thenReturn(Optional.empty());
        when(auctionWinnerRepository.save(any(AuctionWinner.class))).thenAnswer(i -> i.getArgument(0));
        when(auctionResultRepository.findByAuctionLotId(lot.getId())).thenReturn(Optional.empty());

        UUID adminId = UUID.randomUUID();
        WinnerResponse response = winnerService.manualOverrideWinner(request, "admin@example.com", adminId);

        assertNotNull(response);
        assertEquals(WinnerStatus.MANUAL_OVERRIDE, response.getStatus());
        assertEquals(bidder2.getId(), response.getBidderProfileId());
        
        // Assert snapshot fields returned in Response DTO
        assertNotNull(response.getWinnerAnonymousCode());
        assertEquals("B-102", response.getWinnerAnonymousCode());
        assertEquals("EUR", response.getCurrencySnapshot());
        
        verify(winnerHistoryRepository, times(1)).save(any(WinnerHistory.class));
        verify(eventPublisher, times(1)).publishEvent(any(WinnerOverriddenEvent.class));
    }

    @Test
    void testManualOverrideWinner_BackwardCompatibility_Success() {
        lot.setLotStatus(AuctionLotStatus.SOLD);
        auction.setState(AuctionState.ENDED);

        WinnerRequest request = WinnerRequest.builder()
                .auctionLotId(lot.getId())
                .bidderProfileId(bidder2.getId())
                .remarks("Overriding via backward compatible 2-parameter flow")
                .build();

        when(auctionLotRepository.findById(lot.getId())).thenReturn(Optional.of(lot));
        when(bidderProfileRepository.findById(bidder2.getId())).thenReturn(Optional.of(bidder2));
        when(auctionWinnerRepository.findByAuctionLotId(lot.getId())).thenReturn(Optional.empty());
        when(auctionWinnerRepository.save(any(AuctionWinner.class))).thenAnswer(i -> i.getArgument(0));
        when(auctionResultRepository.findByAuctionLotId(lot.getId())).thenReturn(Optional.empty());

        UUID adminIdFromContext = UUID.randomUUID();
        AuditContext auditContext = AuditContext.builder()
                .actorId(adminIdFromContext)
                .build();
        AuditContext.set(auditContext);

        try {
            WinnerResponse response = winnerService.manualOverrideWinner(request, "admin@example.com");

            assertNotNull(response);
            assertEquals(WinnerStatus.MANUAL_OVERRIDE, response.getStatus());
            assertEquals(bidder2.getId(), response.getBidderProfileId());
            
            verify(winnerHistoryRepository, times(1)).save(any(WinnerHistory.class));
            verify(eventPublisher, times(1)).publishEvent(any(WinnerOverriddenEvent.class));
        } finally {
            AuditContext.clear();
        }
    }

    @Test
    void testManualOverrideWinner_BeforeCompletion_Throws() {
        // Active/Draft status is forbidden for override
        lot.setLotStatus(AuctionLotStatus.LIVE);
        auction.setState(AuctionState.LIVE);

        WinnerRequest request = WinnerRequest.builder()
                .auctionLotId(lot.getId())
                .bidderProfileId(bidder2.getId())
                .remarks("Overriding while active")
                .build();

        when(auctionLotRepository.findById(lot.getId())).thenReturn(Optional.of(lot));

        UUID adminId = UUID.randomUUID();
        assertThrows(IllegalStateException.class, () -> 
            winnerService.manualOverrideWinner(request, "admin@example.com", adminId)
        );

        verifyNoInteractions(eventPublisher);
    }

    @Test
    void testWinnerSnapshotFactory_StableAnonCode() {
        bidder1.setAnonymousCode(null);
        lot.setLotStatus(AuctionLotStatus.SOLD);
        auction.setState(AuctionState.ENDED);

        WinnerRequest request = WinnerRequest.builder()
                .auctionLotId(lot.getId())
                .bidderProfileId(bidder1.getId())
                .remarks("Overriding")
                .build();

        when(auctionLotRepository.findById(lot.getId())).thenReturn(Optional.of(lot));
        when(bidderProfileRepository.findById(bidder1.getId())).thenReturn(Optional.of(bidder1));
        when(auctionWinnerRepository.findByAuctionLotId(lot.getId())).thenReturn(Optional.empty());
        when(auctionWinnerRepository.save(any(AuctionWinner.class))).thenAnswer(i -> i.getArgument(0));
        when(auctionResultRepository.findByAuctionLotId(lot.getId())).thenReturn(Optional.empty());

        UUID adminId = UUID.randomUUID();
        WinnerResponse response = winnerService.manualOverrideWinner(request, "admin@example.com", adminId);

        assertNotNull(response);
        String expectedStableCode = "BIDDER-" + bidder1.getId().toString().substring(0, 8).toUpperCase();
        assertEquals(expectedStableCode, response.getWinnerAnonymousCode());
    }

    @Test
    void testManualOverrideWinner_BidFromAnotherLot_Throws() {
        lot.setLotStatus(AuctionLotStatus.SOLD);
        auction.setState(AuctionState.ENDED);

        AuctionLot anotherLot = new AuctionLot();
        anotherLot.setId(UUID.randomUUID());

        Bid badBid = Bid.builder()
                .auctionLot(anotherLot)
                .bidderProfile(bidder2)
                .bidAmount(60000L)
                .build();
        badBid.setId(UUID.randomUUID());

        WinnerRequest request = WinnerRequest.builder()
                .auctionLotId(lot.getId())
                .bidderProfileId(bidder2.getId())
                .bidId(badBid.getId())
                .remarks("Overriding with invalid bid")
                .build();

        when(auctionLotRepository.findById(lot.getId())).thenReturn(Optional.of(lot));
        when(bidderProfileRepository.findById(bidder2.getId())).thenReturn(Optional.of(bidder2));
        when(bidRepository.findById(badBid.getId())).thenReturn(Optional.of(badBid));

        UUID adminId = UUID.randomUUID();
        assertThrows(IllegalArgumentException.class, () ->
            winnerService.manualOverrideWinner(request, "admin@example.com", adminId)
        );
    }

    @Test
    void testManualOverrideWinner_DuplicateOverride_Throws() {
        lot.setLotStatus(AuctionLotStatus.SOLD);
        auction.setState(AuctionState.ENDED);

        WinnerRequest request = WinnerRequest.builder()
                .auctionLotId(lot.getId())
                .bidderProfileId(bidder2.getId())
                .remarks("Duplicate override test")
                .build();

        AuctionWinner existingWinner = AuctionWinner.builder()
                .auctionLot(lot)
                .bidderProfile(bidder2)
                .status(WinnerStatus.MANUAL_OVERRIDE)
                .build();

        when(auctionLotRepository.findById(lot.getId())).thenReturn(Optional.of(lot));
        when(bidderProfileRepository.findById(bidder2.getId())).thenReturn(Optional.of(bidder2));
        when(auctionWinnerRepository.findByAuctionLotId(lot.getId())).thenReturn(Optional.of(existingWinner));

        UUID adminId = UUID.randomUUID();
        assertThrows(IllegalStateException.class, () ->
            winnerService.manualOverrideWinner(request, "admin@example.com", adminId)
        );
    }

    @Test
    void testEvaluateLotOutcome_ConcurrentEvaluation_ReturnsExistingResult() {
        AuctionResult existingResult = AuctionResult.builder()
                .auctionLot(lot)
                .status(AuctionResultStatus.COMPLETED)
                .highestBidAmount(50000L)
                .build();

        when(auctionLotRepository.findById(lot.getId())).thenReturn(Optional.of(lot));
        when(auctionResultRepository.findByAuctionLotId(lot.getId())).thenReturn(Optional.of(existingResult));

        AuctionResultResponse response = auctionResultService.evaluateLotOutcome(lot.getId());

        assertNotNull(response);
        assertEquals(AuctionResultStatus.COMPLETED, response.getStatus());
        verify(auctionResultRepository, never()).save(any());
    }
}
