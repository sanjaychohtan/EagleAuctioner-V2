package com.eagleauctioner.dto;

import com.eagleauctioner.enums.Module;
import lombok.*;

import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PermissionDTO {
    private UUID id;
    private String name;
    private String actionKey;
    private Module module;
    private String description;
}
