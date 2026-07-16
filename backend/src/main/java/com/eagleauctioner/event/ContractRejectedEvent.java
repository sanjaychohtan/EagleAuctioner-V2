package com.eagleauctioner.event;

import lombok.Getter;
import org.springframework.context.ApplicationEvent;
import java.util.UUID;

@Getter
public class ContractRejectedEvent extends ApplicationEvent {
    private final UUID contractId;
    private final String reason;
    private final String rejectedBy;

    public ContractRejectedEvent(Object source, UUID contractId, String reason, String rejectedBy) {
        super(source);
        this.contractId = contractId;
        this.reason = reason;
        this.rejectedBy = rejectedBy;
    }
}
