package com.eagleauctioner.entity;

import com.eagleauctioner.enums.DocumentType;
import lombok.*;

import java.io.Serializable;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class DocumentSequenceId implements Serializable {
    private String tenantId;
    private String branchCode;
    private Integer year;
    private String regionCode;
    private DocumentType documentType;
}
