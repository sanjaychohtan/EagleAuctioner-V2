package com.eagleauctioner.event;

import lombok.Getter;
import org.springframework.context.ApplicationEvent;
import java.util.UUID;

@Getter
public class ContractTerminatedEvent extends ApplicationEvent {
    private final UUID contractId;
    private final String reason;
    private final String terminatedBy;

    public ContractTerminatedEvent(Object source, UUID contractId, String reason, String terminatedBy) {
        super(source);
        this.contractId = contractId;
        this.reason = reason;
        this.terminatedBy = terminatedBy;
    }
}
