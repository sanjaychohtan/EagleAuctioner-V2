package com.eagleauctioner.controller;

import com.eagleauctioner.dto.*;
import com.eagleauctioner.dto.RolePermissionDTOs.*;
import com.eagleauctioner.entity.User;
import com.eagleauctioner.enums.Module;
import com.eagleauctioner.exception.BusinessException;
import com.eagleauctioner.repository.UserRepository;
import com.eagleauctioner.service.EnterpriseAuthorizationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

import com.eagleauctioner.aspect.EnforceDataScope;
import com.eagleauctioner.enums.DataScopeType;

@RestController
@RequestMapping({"/api/v1/admin/authorization", "/api/admin/authorization"})
@PreAuthorize("hasAuthority('role.manage') or hasAuthority('admin.access') or hasRole('ADMIN') or hasRole('SUPER_ADMIN')")
@Validated
@RequiredArgsConstructor
public class EnterpriseAuthorizationController {

    private final EnterpriseAuthorizationService authorizationService;
    private final UserRepository userRepository;

    private UUID getAdminId() {
        if (SecurityContextHolder.getContext().getAuthentication() == null) {
            throw new BusinessException("Unauthorized: No authentication context available");
        }
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        try {
            return UUID.fromString(username);
        } catch (Exception ex) {
            return userRepository.findByEmailIgnoreCaseAndDeletedAtIsNull(username)
                    .map(User::getId)
                    .orElseThrow(() -> new BusinessException("Unauthorized: Admin user not found with username: " + username));
        }
    }

    // --- Role Management Endpoints ---

    @GetMapping("/roles")
    @EnforceDataScope(DataScopeType.COMPANY)
    public ResponseEntity<List<RoleDTO>> getAllRoles() {
        return ResponseEntity.ok(authorizationService.getAllRoles());
    }

    @GetMapping("/roles/{roleId}")
    @EnforceDataScope(DataScopeType.COMPANY)
    public ResponseEntity<RoleDTO> getRoleById(@PathVariable UUID roleId) {
        return ResponseEntity.ok(authorizationService.getRoleById(roleId));
    }

    @PostMapping("/roles")
    @EnforceDataScope(DataScopeType.COMPANY)
    public ResponseEntity<RoleDTO> createRole(@RequestBody @Valid RoleCreateRequestDTO request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(authorizationService.createRole(request, getAdminId()));
    }

    @PutMapping("/roles/{roleId}")
    @EnforceDataScope(DataScopeType.COMPANY)
    public ResponseEntity<RoleDTO> updateRole(@PathVariable UUID roleId, @RequestBody @Valid RoleCreateRequestDTO request) {
        return ResponseEntity.ok(authorizationService.updateRole(roleId, request, getAdminId()));
    }

    @DeleteMapping("/roles/{roleId}")
    @EnforceDataScope(DataScopeType.COMPANY)
    public ResponseEntity<Void> deleteRole(@PathVariable UUID roleId) {
        authorizationService.deleteRole(roleId, getAdminId());
        return ResponseEntity.noContent().build();
    }

    // --- Permission Catalog Endpoints ---

    @GetMapping("/permissions")
    @EnforceDataScope(DataScopeType.COMPANY)
    public ResponseEntity<List<PermissionDTO>> getAllPermissions() {
        return ResponseEntity.ok(authorizationService.getAllPermissions());
    }

    @GetMapping("/permissions/module/{module}")
    @EnforceDataScope(DataScopeType.COMPANY)
    public ResponseEntity<List<PermissionDTO>> getPermissionsByModule(@PathVariable Module module) {
        return ResponseEntity.ok(authorizationService.getPermissionsByModule(module));
    }

    // --- Department Endpoints ---

    @GetMapping("/departments")
    @EnforceDataScope(DataScopeType.COMPANY)
    public ResponseEntity<List<DepartmentDTO>> getAllDepartments() {
        return ResponseEntity.ok(authorizationService.getAllDepartments());
    }

    @PostMapping("/departments")
    @EnforceDataScope(DataScopeType.COMPANY)
    public ResponseEntity<DepartmentDTO> createDepartment(@RequestBody @Valid DepartmentDTO dto) {
        return ResponseEntity.status(HttpStatus.CREATED).body(authorizationService.createDepartment(dto, getAdminId()));
    }

    // --- Data Scope Endpoints ---

    @GetMapping("/users/{userId}/scopes")
    @EnforceDataScope(DataScopeType.COMPANY)
    public ResponseEntity<List<DataScopeDTO>> getUserDataScopes(@PathVariable UUID userId) {
        return ResponseEntity.ok(authorizationService.getUserDataScopes(userId));
    }

    @PostMapping("/scopes")
    @EnforceDataScope(DataScopeType.COMPANY)
    public ResponseEntity<DataScopeDTO> assignUserDataScope(@RequestBody @Valid DataScopeDTO dto) {
        return ResponseEntity.status(HttpStatus.CREATED).body(authorizationService.assignUserDataScope(dto, getAdminId()));
    }

    @DeleteMapping("/scopes/{scopeId}")
    @EnforceDataScope(DataScopeType.COMPANY)
    public ResponseEntity<Void> removeUserDataScope(@PathVariable UUID scopeId) {
        authorizationService.removeUserDataScope(scopeId, getAdminId());
        return ResponseEntity.noContent().build();
    }
}
