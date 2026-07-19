package com.eagleauctioner.event;

import com.eagleauctioner.service.LedgerService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

@Component
@Slf4j
@RequiredArgsConstructor
public class FinanceEventListener {

    private final LedgerService ledgerService;

    /**
     * Process received payments to post to the ledger.
     * NOTE: For production, this should implement a transactional outbox pattern
     * or a reliable retry mechanism to handle transient failures during ledger posting.
     */
    @Async
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void handlePaymentReceived(PaymentReceivedEvent event) {
        log.info("Ledger Engine: Processing received payment event: {}", event.getPaymentId());
        try {
            ledgerService.postPayment(event.getPaymentId(), "SYSTEM_EVENT");
            log.info("Ledger Posting completed for Payment: {}", event.getPaymentId());
        } catch (Exception ex) {
            log.error("Failed to post ledger entries for Payment: " + event.getPaymentId(), ex);
        }
    }

    @Async
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void handleRefundApproved(RefundApprovedEvent event) {
        log.info("Ledger Engine: Processing approved refund event: {}", event.getRefundId());
        try {
            ledgerService.postRefund(event.getRefundId(), event.getAmount(), "SYSTEM_EVENT");
            log.info("Ledger Posting completed for Refund: {}", event.getRefundId());
        } catch (Exception ex) {
            log.error("Failed to post ledger entries for Refund: " + event.getRefundId(), ex);
        }
    }
}
