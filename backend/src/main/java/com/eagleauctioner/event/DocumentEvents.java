package com.eagleauctioner.event;

import com.eagleauctioner.enums.DocumentType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;


import java.util.UUID;

public class DocumentEvents {

    @Getter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class DocumentGeneratedEvent {
        private UUID documentId;
        private String documentNumber;
        private DocumentType documentType;
        private UUID ownerId;
        private Long totalAmount;
    }
}
