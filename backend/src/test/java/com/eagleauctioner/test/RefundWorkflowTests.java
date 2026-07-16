package com.eagleauctioner.test;

import com.eagleauctioner.entity.Refund;
import com.eagleauctioner.repository.RefundRepository;
import com.eagleauctioner.service.RefundService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.context.ApplicationEventPublisher;
import java.util.Optional;
import java.util.UUID;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class RefundWorkflowTests {

    @Mock
    private RefundRepository refundRepository;

    @Mock
    private ApplicationEventPublisher eventPublisher;

    @InjectMocks
    private RefundService refundService;

    @Test
    void testInitiateRefund_Success() {
        UUID initiatorId = UUID.randomUUID();
        Long amount = 50000L; // 500.00 INR represented as paise

        when(refundRepository.save(any(Refund.class))).thenAnswer(inv -> inv.getArgument(0));

        Refund result = refundService.initiateRefund(initiatorId, "SELLER", amount);

        assertNotNull(result);
        assertEquals("PENDING_FIRST_APPROVAL", result.getStatus());
        assertEquals(amount, result.getAmount());
        assertEquals(initiatorId, result.getInitiatorId());
    }

    @Test
    void testApproveRefund_MakerCannotApproveSelf_ThrowsException() {
        UUID refundId = UUID.randomUUID();
        UUID userAndMakerId = UUID.randomUUID();
        Refund refund = Refund.builder()
                .id(refundId)
                .initiatorId(userAndMakerId)
                .amount(10000L) // 100.00 INR represented as paise
                .status("PENDING_FIRST_APPROVAL")
                .build();

        when(refundRepository.findById(refundId)).thenReturn(Optional.of(refund));

        assertThrows(SecurityException.class, () -> {
            refundService.approveRefund(refundId, userAndMakerId, "ADMIN");
        });
    }

    @Test
    void testDualApprovalThresholdRequirement() {
        UUID refundId = UUID.randomUUID();
        UUID initiatorId = UUID.randomUUID();
        UUID approver1 = UUID.randomUUID();
        UUID approver2 = UUID.randomUUID();

        Refund refund = Refund.builder()
                .id(refundId)
                .initiatorId(initiatorId)
                .amount(1200000L) // 12,000.00 INR represented as paise (> 1,000,000 threshold)
                .status("PENDING_FIRST_APPROVAL")
                .build();

        when(refundRepository.findById(refundId)).thenReturn(Optional.of(refund));
        when(refundRepository.save(any(Refund.class))).thenAnswer(inv -> inv.getArgument(0));

        Refund step1 = refundService.approveRefund(refundId, approver1, "FINANCE");
        assertEquals("PENDING_SECOND_APPROVAL", step1.getStatus());

        assertThrows(org.springframework.security.access.AccessDeniedException.class, () -> {
            refundService.approveRefund(refundId, approver2, "SELLER");
        });

        Refund step2 = refundService.approveRefund(refundId, approver2, "FINANCE_DIRECTOR");
        assertEquals("APPROVED", step2.getStatus());
        assertEquals(approver2, step2.getSecondApproverId());
    }
}
