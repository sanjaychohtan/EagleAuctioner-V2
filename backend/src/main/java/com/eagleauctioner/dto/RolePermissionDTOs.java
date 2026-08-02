package com.eagleauctioner.dto;

import com.eagleauctioner.enums.Module;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Size;
import lombok.*;

import java.util.List;
import java.util.UUID;

public final class RolePermissionDTOs {

    private RolePermissionDTOs() {}

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class PermissionDTO {
        private UUID id;
        private String name;
        private String actionKey;
        private Module module;
        private String description;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class RoleDTO {
        private UUID id;
        private String name;
        private String description;
        private boolean systemRole;
        private List<PermissionDTO> permissions;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class RoleCreateRequestDTO {
        @NotBlank(message = "Role name is required")
        @Size(min = 3, max = 50, message = "Role name must be between 3 and 50 characters")
        private String name;

        @Size(max = 255, message = "Description must not exceed 255 characters")
        private String description;

        @NotEmpty(message = "At least one permission ID is required")
        private List<UUID> permissionIds;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class DataScopeDTO {
        private UUID id;
        private com.eagleauctioner.enums.DataScopeType scopeType;
        private UUID scopeValueId;
        private String name;
        private UUID userId;
        private UUID roleId;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class DepartmentDTO {
        private UUID id;
        private String code;
        private String name;
        private String description;
        private UUID parentId;
        private List<DepartmentDTO> subDepartments;
    }
}
