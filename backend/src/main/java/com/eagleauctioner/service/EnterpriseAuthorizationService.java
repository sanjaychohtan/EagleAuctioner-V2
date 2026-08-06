package com.eagleauctioner.service;

import com.eagleauctioner.dto.RolePermissionDTOs.*;
import com.eagleauctioner.enums.Module;

import java.util.List;
import java.util.UUID;

public interface EnterpriseAuthorizationService {

    // Role Management
    List<RoleDTO> getAllRoles();
    RoleDTO getRoleById(UUID roleId);
    RoleDTO createRole(RoleCreateRequestDTO request, UUID adminId);
    RoleDTO updateRole(UUID roleId, RoleCreateRequestDTO request, UUID adminId);
    void deleteRole(UUID roleId, UUID adminId);

    // Permission Catalog
    List<PermissionDTO> getAllPermissions();
    List<PermissionDTO> getPermissionsByModule(Module module);

    // Department Management
    List<DepartmentDTO> getAllDepartments();
    DepartmentDTO createDepartment(DepartmentDTO dto, UUID adminId);

    // Data Scope Management
    List<DataScopeDTO> getUserDataScopes(UUID userId);
    DataScopeDTO assignUserDataScope(DataScopeDTO dto, UUID adminId);
    void removeUserDataScope(UUID scopeId, UUID adminId);
}
