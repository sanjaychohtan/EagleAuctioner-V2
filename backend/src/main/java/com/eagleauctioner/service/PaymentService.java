package com.eagleauctioner.service;

import com.eagleauctioner.dto.*;
import com.eagleauctioner.dto.PaymentDTOs.*;
import com.eagleauctioner.entity.*;
import com.eagleauctioner.enums.*;
import com.eagleauctioner.event.PaymentReceivedEvent;
import com.eagleauctioner.event.SettlementCompletedEvent;
import com.eagleauctioner.exception.ResourceNotFoundException;
import com.eagleauctioner.repository.PaymentRepository;
import com.eagleauctioner.repository.PaymentAdviceRepository;
import com.eagleauctioner.repository.SettlementRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Enterprise service governing cash receipt collections, internal validation,
 * and double-entry allocation structures.
 */
@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
public class PaymentService {

    private final PaymentRepository paymentRepository;
    private final PaymentAdviceRepository paymentAdviceRepository;
    private final SettlementRepository settlementRepository;
    private final SettlementService settlementService;
    private final DocumentNumberGeneratorService documentNumberGenerator;
    private final ApplicationEventPublisher eventPublisher;

    public void voidPaymentObligations(UUID contractId) {
        log.info("Voiding payment obligations for contract: {}", contractId);
        // Additional business rules can be added here
    }

    @Transactional
    public PaymentAdvice createPaymentAdvice(Settlement settlement) {
        log.info("Generating Payment Advice for Settlement: {}", settlement.getContractNumber());
        
        if (paymentAdviceRepository.findBySettlementId(settlement.getId()).isPresent()) {
            throw new IllegalStateException("Payment Advice already exists for settlement: " + settlement.getId());
        }
        
        String adviceNum = documentNumberGenerator.generateNextNumber(DocumentType.PAYMENT_ADVICE);
        
        PaymentAdvice advice = PaymentAdvice.builder()
                .adviceNumber(adviceNum)
                .settlement(settlement)
                .amountDue(settlement.getGrossAmount())
                .dueDate(Instant.now().plus(7, ChronoUnit.DAYS))
                .status(PaymentAdviceStatus.PENDING)
                .build();
                
        PaymentAdvice saved = paymentAdviceRepository.save(advice);
        log.info("Payment Advice {} issued successfully.", saved.getAdviceNumber());
        return saved;
    }

    @Transactional
    public PaymentResponse receivePayment(UUID settlementId, PaymentRequest request) {
        log.info("Processing Payment receipt against Settlement ID: {}", settlementId);
        
        Settlement settlement = settlementRepository.findByIdWithRelationsForUpdate(settlementId)
                .orElseThrow(() -> new ResourceNotFoundException("Settlement not found: " + settlementId));
                
        if (settlement.getStatus() == SettlementStatus.COMPLETED || 
            settlement.getStatus() == SettlementStatus.CANCELLED) {
            throw new IllegalStateException("Payments cannot be processed for settlement in status: " + settlement.getStatus());
        }
        
        validatePaymentAccess(settlement);
        
        if (paymentRepository.existsByReferenceNumber(request.getReferenceNumber())) {
            log.warn("Duplicate payment attempt detected for reference: {}", request.getReferenceNumber());
            throw new IllegalArgumentException("Duplicate payment reference detected.");
        }
        
        Long receivedAmount = request.getAmount();
        if (receivedAmount == null || receivedAmount <= 0L) {
            throw new IllegalArgumentException("Payment amount must be greater than zero.");
        }
        
        // Prevent over-allocation vulnerability
        List<Payment> completedPayments = paymentRepository.findCompletedBySettlementId(settlementId);
        Long totalPaidSoFar = 0L;
        for (Payment completed : completedPayments) {
            totalPaidSoFar = Math.addExact(totalPaidSoFar, completed.getTotalAmount());
        }
        
        Long grossAmount = settlement.getGrossAmount();
        Long remainingDue = grossAmount - totalPaidSoFar;
        if (receivedAmount > remainingDue) {
            throw new IllegalArgumentException(String.format(
                    "Payment over-allocation rejected. Remaining due is %s, but received payment of %s.",
                    remainingDue, receivedAmount));
        }
        
        String paymentNum = documentNumberGenerator.generateNextNumber(DocumentType.PAYMENT);
        
        Payment payment = Payment.builder()
                .paymentNumber(paymentNum)
                .settlement(settlement)
                .totalAmount(receivedAmount)
                .paymentMethod(request.getPaymentMethod())
                .referenceNumber(request.getReferenceNumber())
                .paymentDate(Instant.now())
                .status(PaymentStatus.PENDING)
                .allocations(new ArrayList<>())
                .transactions(new ArrayList<>())
                .build();
                
        // Record the transaction locally (No external gateway call)
        String localRef = "TXN-" + UUID.randomUUID().toString().substring(0, 12).toUpperCase();
        PaymentTransaction transaction = PaymentTransaction.builder()
                .payment(payment)
                .gatewayReference(localRef)
                .amount(receivedAmount)
                .status(PaymentTransactionStatus.SUCCESS)
                .errorMessage(null)
                .completedAt(Instant.now())
                .build();
                
        payment.addTransaction(transaction);
        
        // Automatically approve the internal payment
        payment.setStatus(PaymentStatus.COMPLETED);
        
        // Execute Payment Allocations (Supports partial payments and allocation offsets)
        Long allocatedSoFar = 0L;
        
        // Allocate platform fee first
        Long platformFee = settlement.getPlatformFee();
        if (receivedAmount >= platformFee) {
            payment.addAllocation(PaymentAllocation.builder()
                    .payment(payment)
                    .settlement(settlement)
                    .allocatedAmount(platformFee)
                    .allocationType(PaymentAllocationType.PLATFORM_FEE)
                    .allocatedAt(Instant.now())
                    .build());
            allocatedSoFar = Math.addExact(allocatedSoFar, platformFee);
        } else {
            payment.addAllocation(PaymentAllocation.builder()
                    .payment(payment)
                    .settlement(settlement)
                    .allocatedAmount(receivedAmount)
                    .allocationType(PaymentAllocationType.PLATFORM_FEE)
                    .allocatedAt(Instant.now())
                    .build());
            allocatedSoFar = Math.addExact(allocatedSoFar, receivedAmount);
        }
        
        // Allocate taxes if there is remaining amount
        Long remaining = receivedAmount - allocatedSoFar;
        if (remaining > 0L) {
            Long taxes = settlement.getTaxAmount();
            if (remaining >= taxes) {
                payment.addAllocation(PaymentAllocation.builder()
                        .payment(payment)
                        .settlement(settlement)
                        .allocatedAmount(taxes)
                        .allocationType(PaymentAllocationType.TAX)
                        .allocatedAt(Instant.now())
                        .build());
                allocatedSoFar = Math.addExact(allocatedSoFar, taxes);
            } else {
                payment.addAllocation(PaymentAllocation.builder()
                        .payment(payment)
                        .settlement(settlement)
                        .allocatedAmount(remaining)
                        .allocationType(PaymentAllocationType.TAX)
                        .allocatedAt(Instant.now())
                        .build());
                allocatedSoFar = Math.addExact(allocatedSoFar, remaining);
            }
        }
        
        // Allocate net seller payout if there is remaining amount
        remaining = Math.subtractExact(receivedAmount, allocatedSoFar);
        if (remaining > 0L) {
            payment.addAllocation(PaymentAllocation.builder()
                    .payment(payment)
                    .settlement(settlement)
                    .allocatedAmount(remaining)
                    .allocationType(PaymentAllocationType.SELLER_PAYOUT)
                    .allocatedAt(Instant.now())
                    .build());
            allocatedSoFar = Math.addExact(allocatedSoFar, remaining);
        }
        
        Payment savedPayment = paymentRepository.save(payment);
        
        // Check if Settlement is fully closed
        final Long finalTotalPaidSoFar = totalPaidSoFar;
        paymentAdviceRepository.findBySettlementId(settlementId).ifPresent(advice -> {
            if (Math.addExact(finalTotalPaidSoFar, receivedAmount) >= advice.getAmountDue()) {
                advice.setStatus(PaymentAdviceStatus.COMPLETED);
                paymentAdviceRepository.save(advice);
                
                log.info("Settlement {} payment received fully. Transitioning state.", settlement.getContractNumber());
                settlementService.receivePayment(settlementId, "Payment fully allocated.");
                
                eventPublisher.publishEvent(new SettlementCompletedEvent(settlementId, settlement.getContract().getId(), SecurityContextHolder.getContext().getAuthentication().getName()));
            } else {
                advice.setStatus(PaymentAdviceStatus.PARTIALLY_PAID);
                paymentAdviceRepository.save(advice);
            }
        });
        
        eventPublisher.publishEvent(new PaymentReceivedEvent(
                savedPayment.getId(), 
                savedPayment.getPaymentNumber(), 
                settlementId, 
                settlement.getContract().getWinner().getBidderProfile().getUser().getId(),
                receivedAmount
        ));
        
        return mapToResponse(savedPayment);
    }

    public List<PaymentResponse> getAllPayments() {
        return paymentRepository.findAll().stream()
                .map(this::mapToResponse)
                .toList();
    }

    public PaymentResponse getById(UUID id) {
        Payment payment = paymentRepository.findByIdWithRelations(id)
                .orElseThrow(() -> new ResourceNotFoundException("Payment not found: " + id));
        validatePaymentAccess(payment.getSettlement());
        return mapToResponse(payment);
    }

    public void validatePaymentAccess(Settlement settlement) {
        if (settlement == null) {
            throw new IllegalArgumentException("Settlement cannot be null");
        }
        if (settlement.getContract() == null) {
            throw new IllegalArgumentException("Settlement contract association is missing.");
        }
        if (settlement.getContract().getWinner() == null) {
            throw new IllegalArgumentException("Settlement contract winner association is missing.");
        }
        
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null) {
            throw new AccessDeniedException("[SECURITY_VIOLATION] Unauthenticated request during payment access.");
        }
        
        String username = auth.getName();
        boolean isAdmin = auth.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
                
        if (isAdmin) return;
        
        // Verify if buyer matches winner with explicit null safety
        if (settlement.getContract().getWinner().getBidderProfile() == null ||
            settlement.getContract().getWinner().getBidderProfile().getUser() == null ||
            settlement.getContract().getWinner().getBidderProfile().getUser().getEmail() == null) {
            throw new IllegalArgumentException("Incomplete or corrupt buyer relationship data in settlement contract.");
        }
        String buyerEmail = settlement.getContract().getWinner().getBidderProfile().getUser().getEmail();
        if (username.equalsIgnoreCase(buyerEmail)) return;
        
        // Verify if seller matches winner's seller with explicit null safety
        if (settlement.getContract().getWinner().getAuctionLot() == null ||
            settlement.getContract().getWinner().getAuctionLot().getAuction() == null ||
            settlement.getContract().getWinner().getAuctionLot().getAuction().getSellerProfile() == null ||
            settlement.getContract().getWinner().getAuctionLot().getAuction().getSellerProfile().getUser() == null ||
            settlement.getContract().getWinner().getAuctionLot().getAuction().getSellerProfile().getUser().getEmail() == null) {
            throw new IllegalArgumentException("Incomplete or corrupt seller relationship data in settlement contract's lot snapshot.");
        }
        String sellerEmail = settlement.getContract().getWinner().getAuctionLot().getAuction().getSellerProfile().getUser().getEmail();
        if (username.equalsIgnoreCase(sellerEmail)) return;
        
        log.error("[IDOR_ATTEMPT] User '{}' tried to access payments for Settlement '{}'", username, settlement.getContractNumber());
        throw new AccessDeniedException("Access Denied: You do not have permissions to access these payment details.");
    }

    public PaymentResponse mapToResponse(Payment payment) {
        if (payment == null) return null;
        
        List<PaymentAllocationResponse> allocations = payment.getAllocations().stream()
                .map(a -> PaymentAllocationResponse.builder()
                        .id(a.getId())
                        .allocatedAmount(a.getAllocatedAmount())
                        .allocationType(a.getAllocationType())
                        .allocatedAt(a.getAllocatedAt())
                        .build())
                .collect(Collectors.toList());
                
        List<PaymentTransactionResponse> txs = payment.getTransactions().stream()
                .map(t -> PaymentTransactionResponse.builder()
                        .id(t.getId())
                        .gatewayReference(t.getGatewayReference())
                        .amount(t.getAmount())
                        .status(t.getStatus())
                        .errorMessage(t.getErrorMessage())
                        .completedAt(t.getCompletedAt())
                        .build())
                .collect(Collectors.toList());
                
        return PaymentResponse.builder()
                .id(payment.getId())
                .paymentNumber(payment.getPaymentNumber())
                .settlementId(payment.getSettlement().getId())
                .settlementNumber(payment.getSettlement().getContractNumber())
                .status(payment.getStatus())
                .totalAmount(payment.getTotalAmount())
                .referenceNumber(payment.getReferenceNumber())
                .paymentMethod(payment.getPaymentMethod())
                .paymentDate(payment.getPaymentDate())
                .allocations(allocations)
                .transactions(txs)
                .build();
    }
}
