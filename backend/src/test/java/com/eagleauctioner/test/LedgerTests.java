package com.eagleauctioner.test;

import com.eagleauctioner.entity.*;
import com.eagleauctioner.enums.*;
import com.eagleauctioner.repository.*;
import com.eagleauctioner.service.LedgerService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Arrays;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class LedgerTests {

    @Mock
    private LedgerTransactionRepository ledgerTransactionRepository;

    @Mock
    private PaymentRepository paymentRepository;

    @Mock
    private WalletRepository walletRepository;

    @InjectMocks
    private LedgerService ledgerService;

    private Payment payment;
    private Wallet sellerWallet;

    @BeforeEach
    void setUp() {
        UUID sellerUserId = UUID.randomUUID();
        User sellerUser = User.builder().id(sellerUserId).email("seller@example.com").build();
        SellerProfile sellerProfile = SellerProfile.builder().id(UUID.randomUUID()).user(sellerUser).build();
        Auction auction = Auction.builder().id(UUID.randomUUID()).sellerProfile(sellerProfile).build();
        AuctionLot lot = AuctionLot.builder().id(UUID.randomUUID()).auction(auction).build();
        AuctionWinner winner = AuctionWinner.builder().id(UUID.randomUUID()).auctionLot(lot).build();
        Contract contract = Contract.builder().id(UUID.randomUUID()).winner(winner).build();
        Settlement settlement = Settlement.builder().id(UUID.randomUUID()).contract(contract).documentNumber("SET-123").build();

        payment = Payment.builder()
                .id(UUID.randomUUID())
                .paymentNumber("PAY-001")
                .settlement(settlement)
                .totalAmount(118000L)
                .status(PaymentStatus.COMPLETED)
                .build();

        PaymentAllocation feeAlloc = PaymentAllocation.builder().allocatedAmount(10000L).allocationType(PaymentAllocationType.PLATFORM_FEE).build();
        PaymentAllocation taxAlloc = PaymentAllocation.builder().allocatedAmount(1800L).allocationType(PaymentAllocationType.TAX).build();
        PaymentAllocation payoutAlloc = PaymentAllocation.builder().allocatedAmount(106200L).allocationType(PaymentAllocationType.SELLER_PAYOUT).build();
        
        payment.setAllocations(Arrays.asList(feeAlloc, taxAlloc, payoutAlloc));

        sellerWallet = Wallet.builder().id(UUID.randomUUID()).userId(sellerUserId).availableBalance(0L).build();
    }

    @Test
    void testPostPayment_Success_DoubleEntryBalanced() {
        when(paymentRepository.findByIdWithRelations(payment.getId())).thenReturn(Optional.of(payment));
        when(ledgerTransactionRepository.findByPaymentId(payment.getId())).thenReturn(Optional.empty());
        when(walletRepository.findByUserIdForUpdate(any(UUID.class))).thenReturn(Optional.of(sellerWallet));
        
        when(ledgerTransactionRepository.save(any())).thenAnswer(i -> i.getArgument(0));
        when(walletRepository.save(any())).thenAnswer(i -> i.getArgument(0));

        assertDoesNotThrow(() -> ledgerService.postPayment(payment.getId(), "SYSTEM"));

        verify(ledgerTransactionRepository).save(any(LedgerTransaction.class));
        verify(walletRepository).save(sellerWallet);
        assertEquals(106200L, sellerWallet.getAvailableBalance());
    }

    @Test
    void testPostPayment_Unbalanced_ThrowsException() {
        payment.setTotalAmount(999900L); // Mismatched total

        when(paymentRepository.findByIdWithRelations(payment.getId())).thenReturn(Optional.of(payment));
        when(ledgerTransactionRepository.findByPaymentId(payment.getId())).thenReturn(Optional.empty());
        when(walletRepository.findByUserIdForUpdate(any(UUID.class))).thenReturn(Optional.of(sellerWallet));

        IllegalStateException ex = assertThrows(IllegalStateException.class, () -> ledgerService.postPayment(payment.getId(), "SYSTEM"));
        assertTrue(ex.getMessage().contains("Double-entry accounting violation"));
    }

    @Test
    void testReverseTransaction_Success() {
        LedgerTransaction tx = LedgerTransaction.builder()
                .id(UUID.randomUUID())
                .transactionReference("LEDGER-PAY-001")
                .paymentId(payment.getId())
                .status(LedgerTransactionStatus.POSTED)
                .build();
        tx.addEntry(LedgerEntry.builder().accountType(LedgerAccountType.BUYER_RECEIVABLE).entryType(LedgerEntryType.DEBIT).amount(118000L).build());
        tx.addEntry(LedgerEntry.builder().accountType(LedgerAccountType.SELLER_PAYOUT).entryType(LedgerEntryType.CREDIT).amount(106200L).build());

        sellerWallet.setAvailableBalance(106200L);

        when(ledgerTransactionRepository.findByTransactionReference(tx.getTransactionReference())).thenReturn(Optional.of(tx));
        when(paymentRepository.findById(payment.getId())).thenReturn(Optional.of(payment));
        when(walletRepository.findByUserIdForUpdate(any(UUID.class))).thenReturn(Optional.of(sellerWallet));

        ledgerService.reverseTransaction(tx.getTransactionReference(), "ADMIN", "Fraud");

        assertEquals(LedgerTransactionStatus.REVERSED, tx.getStatus());
        assertEquals(0L, sellerWallet.getAvailableBalance());
        verify(ledgerTransactionRepository, times(2)).save(any(LedgerTransaction.class));
    }

    @Test
    void testPostPayment_Idempotency_PreventDuplicates() {
        when(paymentRepository.findByIdWithRelations(payment.getId())).thenReturn(Optional.of(payment));
        // Mock existing transaction
        when(ledgerTransactionRepository.findByPaymentId(payment.getId())).thenReturn(Optional.of(new LedgerTransaction()));

        ledgerService.postPayment(payment.getId(), "SYSTEM");

        // Verify save was NOT called
        verify(ledgerTransactionRepository, never()).save(any());
    }

    @Test
    void testAddLedgerEntry_MandatoryDescription() {
        com.eagleauctioner.dto.FinanceDTOs.LedgerAdjustmentRequest request = new com.eagleauctioner.dto.FinanceDTOs.LedgerAdjustmentRequest();
        request.setAccountType("USER_WALLET");
        request.setEntryType("CREDIT");
        request.setAmount(1000L);
        request.setCurrency("USD");
        request.setDescription(""); // Empty reason

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () -> ledgerService.addLedgerEntry(request, "ADMIN"));
        assertTrue(ex.getMessage().contains("mandatory"));
    }

    @Test
    void testWalletLocking_Verified() {
        when(paymentRepository.findByIdWithRelations(payment.getId())).thenReturn(Optional.of(payment));
        when(walletRepository.findByUserIdForUpdate(any(UUID.class))).thenReturn(Optional.of(sellerWallet));
        when(ledgerTransactionRepository.save(any())).thenAnswer(i -> i.getArgument(0));
        when(walletRepository.save(any())).thenAnswer(i -> i.getArgument(0));

        ledgerService.postPayment(payment.getId(), "SYSTEM");

        // Verify findByUserIdForUpdate was called (Pessimistic Locking)
        verify(walletRepository).findByUserIdForUpdate(any());
    }
}
