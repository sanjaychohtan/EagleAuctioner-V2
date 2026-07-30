package com.eagleauctioner.dto;

import com.eagleauctioner.enums.DataScopeType;
import lombok.*;

import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DataScopeDTO {
    private UUID id;
    private DataScopeType scopeType;
    private UUID scopeValueId;
    private String name;
    private UUID userId;
    private UUID roleId;
}
