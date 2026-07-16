package com.eagleauctioner.event;

import com.eagleauctioner.enums.NotificationType;
import com.eagleauctioner.service.NotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@Component
@Slf4j
@RequiredArgsConstructor
public class NotificationEventListener {

    private final NotificationService notificationService;

    @Async
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void handleWinnerApproved(WinnerApprovedEvent event) {
        log.info("NotificationListener processing WinnerApprovedEvent: {}", event);
        Map<String, String> vars = new HashMap<>();
        vars.put("winnerId", event.getWinnerId().toString());
        vars.put("lotId", event.getAuctionLotId().toString());
        vars.put("amount", event.getWinningAmount().toString());
        
        // Using winner's user ID (winnerId is likely user ID or profile ID, let's assume userId for notification)
        // In reality, we'd look up the user ID from the profile if winnerId is a profileId.
        notificationService.sendTemplatedNotification(
            event.getWinnerId(), 
            NotificationType.WINNER_NOTIFICATION, 
            "WINNER_APPROVAL_TEMPLATE", 
            vars
        );
    }

    @Async
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void handlePaymentReceived(PaymentReceivedEvent event) {
        log.info("NotificationListener processing PaymentReceivedEvent: {}", event);
        Map<String, String> vars = new HashMap<>();
        vars.put("paymentId", event.getPaymentId().toString());
        vars.put("amount", event.getAmount().toString());
        
        notificationService.sendTemplatedNotification(
            event.getUserId(), 
            NotificationType.PAYMENT_NOTIFICATION, 
            "PAYMENT_RECEIVED_TEMPLATE", 
            vars
        );
    }

    @Async
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void handleRefundApproved(RefundApprovedEvent event) {
        log.info("NotificationListener processing RefundApprovedEvent: {}", event);
        Map<String, String> vars = new HashMap<>();
        vars.put("refundId", event.getRefundId().toString());
        vars.put("amount", event.getAmount().toString());
        
        notificationService.sendTemplatedNotification(
            event.getInitiatorId(), 
            NotificationType.PAYMENT_NOTIFICATION, 
            "REFUND_APPROVED_TEMPLATE", 
            vars
        );
    }

    @Async
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void handleSettlementCompleted(SettlementCompletedEvent event) {
        log.info("NotificationListener processing SettlementCompletedEvent: {}", event);
        Map<String, String> vars = new HashMap<>();
        vars.put("settlementId", event.getSettlementId().toString());
        
        // In a real scenario, we'd look up the winner's userId from the settlement/contract
        // For now, if we don't have it in the event, we can't notify a specific user easily without repo lookup.
        log.warn("SettlementCompletedEvent received but userId missing for notification");
    }
}
