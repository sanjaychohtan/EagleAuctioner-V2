package com.eagleauctioner.service;

import com.eagleauctioner.dto.FinanceDTOs.LedgerAdjustmentRequest;
import com.eagleauctioner.dto.FinanceDTOs.LedgerResponse;
import com.eagleauctioner.dto.FinanceDTOs.WalletResponse;
import com.eagleauctioner.entity.*;
import com.eagleauctioner.enums.LedgerAccountType;
import com.eagleauctioner.enums.LedgerEntryType;
import com.eagleauctioner.enums.LedgerTransactionStatus;
import com.eagleauctioner.enums.PaymentAllocationType;
import com.eagleauctioner.repository.LedgerTransactionRepository;
import com.eagleauctioner.repository.PaymentRepository;
import com.eagleauctioner.repository.WalletRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;


import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class LedgerService {

    private final LedgerTransactionRepository ledgerTransactionRepository;
    private final PaymentRepository paymentRepository;
    private final WalletRepository walletRepository;

    @Transactional(readOnly = true)
    public WalletResponse getWallet(UUID userId) {
        Wallet wallet = walletRepository.findByUserId(userId).orElseThrow(() -> 
            new IllegalArgumentException("Wallet not found for user: " + userId)
        );
        
        return WalletResponse.builder()
                .walletId(wallet.getId())
                .userId(wallet.getUserId())
                .availableBalance(wallet.getAvailableBalance())
                .lockedBalance(wallet.getLockedBalance())
                .currency(wallet.getCurrency())
                .lastUpdated(wallet.getLastUpdated())
                .permanentEmd(wallet.getPermanentEmd())
                .refundPending(wallet.getRefundPending())
                .settlementPending(wallet.getSettlementPending())
                .build();
    }

    @Transactional(readOnly = true)
    public List<LedgerResponse> getLedger() {
        return ledgerTransactionRepository.findAll().stream()
                .flatMap(tx -> tx.getEntries().stream().map(entry -> 
                    LedgerResponse.builder()
                        .ledgerId(entry.getId())
                        .transactionId(tx.getId())
                        .accountType(entry.getAccountType().name())
                        .entryType(entry.getEntryType().name())
                        .amount(entry.getAmount())
                        .currency(entry.getCurrency())
                        .description(tx.getDescription())
                        .timestamp(tx.getPostedAt())
                        .build()
                )).collect(Collectors.toList());
    }

    @Transactional
    public LedgerResponse addLedgerEntry(LedgerAdjustmentRequest request, String actor) {
        if (request.getDescription() == null || request.getDescription().trim().isEmpty()) {
            throw new IllegalArgumentException("Adjustment reason (description) is mandatory");
        }
        
        LedgerTransaction tx = LedgerTransaction.builder()
                .transactionReference("ADJ-" + UUID.randomUUID().toString().substring(0, 8))
                .description(request.getDescription())
                .status(LedgerTransactionStatus.POSTED)
                .postedAt(Instant.now())
                .postedBy(actor)
                .build();

        LedgerEntry entry = LedgerEntry.builder()
                .accountType(LedgerAccountType.valueOf(request.getAccountType()))
                .entryType(LedgerEntryType.valueOf(request.getEntryType()))
                .amount(request.getAmount())
                .currency(request.getCurrency() != null ? request.getCurrency() : "USD") // Fallback if needed, but should be from request
                .build();

        tx.addEntry(entry);
        LedgerTransaction saved = ledgerTransactionRepository.save(tx);
        
        return LedgerResponse.builder()
                .ledgerId(saved.getEntries().get(0).getId())
                .transactionId(saved.getId())
                .accountType(entry.getAccountType().name())
                .entryType(entry.getEntryType().name())
                .amount(entry.getAmount())
                .currency(entry.getCurrency())
                .description(tx.getDescription())
                .timestamp(tx.getPostedAt())
                .build();
    }

    @Transactional
    public void postPayment(UUID paymentId, String actor) {
        log.info("Posting Ledger for Payment ID: {}", paymentId);
        
        Payment payment = paymentRepository.findByIdWithRelations(paymentId)
                .orElseThrow(() -> new IllegalArgumentException("Payment not found: " + paymentId));
                
        if (ledgerTransactionRepository.findByPaymentId(payment.getId()).isPresent()) {
            log.info("Ledger transaction already posted for payment {}. Skipping.", payment.getId());
            return;
        }

        String currency = payment.getSettlement().getCurrency();

        LedgerTransaction transaction = LedgerTransaction.builder()
                .transactionReference("LEDGER-PAY-" + payment.getPaymentNumber())
                .description("Payment receipt for settlement " + payment.getSettlement().getContractNumber())
                .status(LedgerTransactionStatus.POSTED)
                .settlementId(payment.getSettlement().getId())
                .paymentId(payment.getId())
                .postedAt(Instant.now())
                .postedBy(actor)
                .build();

        // 1. Debit: Buyer Receivables (Total Payment Amount)
        transaction.addEntry(LedgerEntry.builder()
                .accountType(LedgerAccountType.BUYER_RECEIVABLE)
                .entryType(LedgerEntryType.DEBIT)
                .amount(payment.getTotalAmount())
                .currency(currency)
                .build());

        Long totalCredits = 0L;

        for (PaymentAllocation allocation : payment.getAllocations()) {
            LedgerAccountType targetAccount;
            if (allocation.getAllocationType() == PaymentAllocationType.PLATFORM_FEE) {
                targetAccount = LedgerAccountType.PLATFORM_REVENUE;
            } else if (allocation.getAllocationType() == PaymentAllocationType.TAX) {
                targetAccount = LedgerAccountType.TAX_LIABILITY;
            } else if (allocation.getAllocationType() == PaymentAllocationType.SELLER_PAYOUT) {
                targetAccount = LedgerAccountType.SELLER_PAYOUT;
                
                // Credit seller's wallet
                UUID sellerUserId = payment.getSettlement().getContract().getWinner().getAuctionLot().getAuction().getSellerProfile().getUser().getId();
                Wallet sellerWallet = walletRepository.findByUserIdForUpdate(sellerUserId)
                        .orElseGet(() -> walletRepository.save(Wallet.builder()
                                .userId(sellerUserId)
                                .availableBalance(0L)
                                .lockedBalance(0L)
                                .currency(currency)
                                .build()));
                
                if (!sellerWallet.getCurrency().equals(currency)) {
                    log.warn("Currency mismatch: Wallet ({}) vs Payment ({}) for user {}", 
                            sellerWallet.getCurrency(), currency, sellerUserId);
                    // In a multi-currency system, we'd convert or have multiple wallets. 
                    // Requirement says reuse project currency.
                }
                
                sellerWallet.credit(allocation.getAllocatedAmount());
                walletRepository.save(sellerWallet);
                log.info("Credited Seller {} wallet with payout amount: {}", sellerUserId, allocation.getAllocatedAmount());
            } else {
                continue;
            }
            
            transaction.addEntry(LedgerEntry.builder()
                    .accountType(targetAccount)
                    .entryType(LedgerEntryType.CREDIT)
                    .amount(allocation.getAllocatedAmount())
                    .currency(currency)
                    .build());
                    
            totalCredits = Math.addExact(totalCredits, allocation.getAllocatedAmount());
        }

        // Double-entry validation
        if (!payment.getTotalAmount().equals(totalCredits)) {
            throw new IllegalStateException("Double-entry accounting violation: Debits (" + payment.getTotalAmount() + ") do not equal Credits (" + totalCredits + ")");
        }

        ledgerTransactionRepository.save(transaction);
        log.info("Ledger transaction successfully posted for payment {}", payment.getId());
    }

    @Transactional
    public void reverseTransaction(String transactionReference, String actor, String reason) {
        log.info("Reversing Ledger Transaction: {}", transactionReference);
        
        LedgerTransaction original = ledgerTransactionRepository.findByTransactionReferenceForUpdate(transactionReference)
                .orElseThrow(() -> new IllegalArgumentException("Ledger transaction not found"));
                
        if (original.getStatus() == LedgerTransactionStatus.REVERSED) {
            throw new IllegalStateException("Transaction is already reversed");
        }
        
        LedgerTransaction reversal = LedgerTransaction.builder()
                .transactionReference("REV-" + original.getTransactionReference() + "-" + UUID.randomUUID().toString().substring(0, 4))
                .description("Reversal of " + original.getTransactionReference() + ". Reason: " + reason)
                .status(LedgerTransactionStatus.POSTED)
                .settlementId(original.getSettlementId())
                .paymentId(original.getPaymentId())
                .postedAt(Instant.now())
                .postedBy(actor)
                .build();
                
        for (LedgerEntry entry : original.getEntries()) {
            LedgerEntryType reverseType = entry.getEntryType() == LedgerEntryType.DEBIT ? LedgerEntryType.CREDIT : LedgerEntryType.DEBIT;
            
            reversal.addEntry(LedgerEntry.builder()
                    .accountType(entry.getAccountType())
                    .entryType(reverseType)
                    .amount(entry.getAmount())
                    .currency(entry.getCurrency())
                    .build());
                    
            // Also reverse wallet balances if it was a SELLER_PAYOUT
            if (entry.getAccountType() == LedgerAccountType.SELLER_PAYOUT && entry.getEntryType() == LedgerEntryType.CREDIT) {
                // Find the seller user id from the settlement
                Payment payment = paymentRepository.findById(original.getPaymentId())
                    .orElseThrow(() -> new IllegalStateException("Payment not found for reversal"));
                UUID sellerUserId = payment.getSettlement().getContract().getWinner().getAuctionLot().getAuction().getSellerProfile().getUser().getId();
                
                Wallet sellerWallet = walletRepository.findByUserIdForUpdate(sellerUserId)
                        .orElseThrow(() -> new IllegalStateException("Seller wallet not found for reversal"));
                
                sellerWallet.debit(entry.getAmount());
                walletRepository.save(sellerWallet);
                log.info("Debited Seller {} wallet for reversed payout amount: {}", sellerUserId, entry.getAmount());
            }
        }
        
        original.setStatus(LedgerTransactionStatus.REVERSED);
        ledgerTransactionRepository.save(original);
        ledgerTransactionRepository.save(reversal);
        
        log.info("Reversal completed for {}", transactionReference);
    }

    @Transactional
    public void postRefund(UUID refundId, Long amountPaise, String actor) {
        log.info("Posting Ledger for Refund ID: {}, Amount: {} paise", refundId, amountPaise);
        
        LedgerTransaction transaction = LedgerTransaction.builder()
                .transactionReference("LEDGER-REFUND-" + refundId.toString().substring(0, 8))
                .description("Refund payout for refund request " + refundId)
                .status(LedgerTransactionStatus.POSTED)
                .postedAt(Instant.now())
                .postedBy(actor)
                .build();

        transaction.addEntry(LedgerEntry.builder()
                .accountType(LedgerAccountType.SELLER_PAYOUT)
                .entryType(LedgerEntryType.DEBIT)
                .amount(amountPaise)
                .currency("INR")
                .build());

        transaction.addEntry(LedgerEntry.builder()
                .accountType(LedgerAccountType.BUYER_RECEIVABLE)
                .entryType(LedgerEntryType.CREDIT)
                .amount(amountPaise)
                .currency("INR")
                .build());

        ledgerTransactionRepository.save(transaction);
        log.info("Ledger transaction successfully posted for Refund {}", refundId);
    }

    @Transactional
    public void reverseEntries(UUID contractId) {
        log.info("Reversing ledger entries for Contract ID: {}", contractId);
        // Look up by paymentId or settlementId, or other relations as appropriate.
        // We find by settlementId or reverse relevant transactions
        List<LedgerTransaction> transactions = ledgerTransactionRepository.findBySettlementId(contractId);
        for (LedgerTransaction tx : transactions) {
            if (tx.getStatus() != LedgerTransactionStatus.REVERSED) {
                reverseTransaction(tx.getTransactionReference(), "SYSTEM", "Contract Terminated");
            }
        }
    }
}
