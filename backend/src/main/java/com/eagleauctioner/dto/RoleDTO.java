package com.eagleauctioner.dto;

import lombok.*;

import java.util.List;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RoleDTO {
    private UUID id;
    private String name;
    private String description;
    private boolean systemRole;
    private List<PermissionDTO> permissions;
}
