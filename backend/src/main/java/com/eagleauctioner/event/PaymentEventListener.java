package com.eagleauctioner.event;

import com.eagleauctioner.entity.Settlement;
import com.eagleauctioner.exception.ResourceNotFoundException;
import com.eagleauctioner.repository.PaymentAdviceRepository;
import com.eagleauctioner.repository.SettlementRepository;
import com.eagleauctioner.service.PaymentService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

/**
 * Decoupled Domain Event listener to automatically issue Payment Advice when Settlements are approved.
 */
@Component
@Slf4j
@RequiredArgsConstructor
public class PaymentEventListener {

    private final PaymentService paymentService;
    private final SettlementRepository settlementRepository;
    private final PaymentAdviceRepository paymentAdviceRepository;

    @Async
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void handleSettlementApproved(SettlementApprovedEvent event) {
        log.info("Payment Advice Engine Latch: Processing approved settlement: {}", event.getSettlementId());
        try {
            if (paymentAdviceRepository.findBySettlementId(event.getSettlementId()).isPresent()) {
                log.info("Payment Advice already exists for Settlement: {}. Skipping auto-generation.", event.getSettlementId());
                return;
            }
            Settlement settlement = settlementRepository.findById(event.getSettlementId())
                    .orElseThrow(() -> new ResourceNotFoundException("Settlement not found: " + event.getSettlementId()));
            
            paymentService.createPaymentAdvice(settlement);
            
            log.info("Auto Payment Advice generated successfully for Settlement: {}", event.getSettlementId());
        } catch (Exception ex) {
            log.error("Failed to auto-create Payment Advice for Settlement: " + event.getSettlementId(), ex);
        }
    }
}
