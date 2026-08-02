package com.eagleauctioner.service.impl;

import com.eagleauctioner.dto.*;
import com.eagleauctioner.dto.RolePermissionDTOs.*;
import com.eagleauctioner.entity.*;
import com.eagleauctioner.enums.Module;
import com.eagleauctioner.exception.BusinessException;
import com.eagleauctioner.repository.*;
import com.eagleauctioner.service.EnterpriseAuthorizationService;
import com.eagleauctioner.security.PermissionCacheService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class EnterpriseAuthorizationServiceImpl implements EnterpriseAuthorizationService {

    private final RoleRepository roleRepository;
    private final PermissionRepository permissionRepository;
    private final DepartmentRepository departmentRepository;
    private final DataScopeRepository dataScopeRepository;
    private final UserRepository userRepository;
    private final PermissionCacheService permissionCacheService;

    @Override
    @Transactional(readOnly = true)
    public List<RoleDTO> getAllRoles() {
        return roleRepository.findAll().stream()
                .map(this::mapRoleToDTO)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public RoleDTO getRoleById(UUID roleId) {
        Role role = roleRepository.findById(roleId)
                .orElseThrow(() -> new BusinessException("Role not found with ID: " + roleId));
        return mapRoleToDTO(role);
    }

    @Override
    @Transactional
    public RoleDTO createRole(RoleCreateRequestDTO request, UUID adminId) {
        String roleName = request.getName().trim();
        if (!roleName.startsWith("ROLE_")) {
            roleName = "ROLE_" + roleName.toUpperCase();
        }
        if (roleRepository.findByName(roleName).isPresent()) {
            throw new BusinessException("Role already exists with name: " + roleName);
        }

        List<Permission> permissions = permissionRepository.findAllById(request.getPermissionIds());
        if (permissions.isEmpty()) {
            throw new BusinessException("Valid permissions are required to create a role");
        }

        Role role = Role.builder()
                .name(roleName)
                .description(request.getDescription())
                .systemRole(false)
                .permissions(new HashSet<>(permissions))
                .build();

        Role savedRole = roleRepository.save(role);
        permissionCacheService.evictAllPermissionCaches();
        return mapRoleToDTO(savedRole);
    }

    @Override
    @Transactional
    public RoleDTO updateRole(UUID roleId, RoleCreateRequestDTO request, UUID adminId) {
        Role role = roleRepository.findById(roleId)
                .orElseThrow(() -> new BusinessException("Role not found with ID: " + roleId));

        if (role.isSystemRole()) {
            throw new BusinessException("System roles cannot be modified or renamed");
        }

        String roleName = request.getName().trim();
        if (!roleName.startsWith("ROLE_")) {
            roleName = "ROLE_" + roleName.toUpperCase();
        }

        List<Permission> permissions = permissionRepository.findAllById(request.getPermissionIds());

        role.setName(roleName);
        role.setDescription(request.getDescription());
        role.setPermissions(new HashSet<>(permissions));

        Role updatedRole = roleRepository.save(role);
        permissionCacheService.evictAllPermissionCaches();
        return mapRoleToDTO(updatedRole);
    }

    @Override
    @Transactional
    public void deleteRole(UUID roleId, UUID adminId) {
        Role role = roleRepository.findById(roleId)
                .orElseThrow(() -> new BusinessException("Role not found with ID: " + roleId));

        if (role.isSystemRole()) {
            throw new BusinessException("System roles cannot be deleted");
        }

        roleRepository.delete(role);
        permissionCacheService.evictAllPermissionCaches();
    }

    @Override
    @Transactional(readOnly = true)
    public List<PermissionDTO> getAllPermissions() {
        return permissionRepository.findAll().stream()
                .map(this::mapPermissionToDTO)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<PermissionDTO> getPermissionsByModule(Module module) {
        return permissionRepository.findByModule(module).stream()
                .map(this::mapPermissionToDTO)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<DepartmentDTO> getAllDepartments() {
        return departmentRepository.findByParentIdIsNull().stream()
                .map(this::mapDepartmentToDTO)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public DepartmentDTO createDepartment(DepartmentDTO dto, UUID adminId) {
        if (departmentRepository.findByCode(dto.getCode()).isPresent()) {
            throw new BusinessException("Department code already exists: " + dto.getCode());
        }

        Department parent = null;
        if (dto.getParentId() != null) {
            parent = departmentRepository.findById(dto.getParentId())
                    .orElseThrow(() -> new BusinessException("Parent department not found: " + dto.getParentId()));
        }

        Department department = Department.builder()
                .code(dto.getCode().toUpperCase().trim())
                .name(dto.getName().trim())
                .description(dto.getDescription())
                .parent(parent)
                .build();

        Department saved = departmentRepository.save(department);
        return mapDepartmentToDTO(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public List<DataScopeDTO> getUserDataScopes(UUID userId) {
        return dataScopeRepository.findByUserId(userId).stream()
                .map(this::mapDataScopeToDTO)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public DataScopeDTO assignUserDataScope(DataScopeDTO dto, UUID adminId) {
        User user = userRepository.findById(dto.getUserId())
                .orElseThrow(() -> new BusinessException("User not found: " + dto.getUserId()));

        DataScope dataScope = DataScope.builder()
                .scopeType(dto.getScopeType())
                .scopeValueId(dto.getScopeValueId())
                .name(dto.getName())
                .user(user)
                .build();

        DataScope saved = dataScopeRepository.save(dataScope);
        return mapDataScopeToDTO(saved);
    }

    @Override
    @Transactional
    public void removeUserDataScope(UUID scopeId, UUID adminId) {
        DataScope scope = dataScopeRepository.findById(scopeId)
                .orElseThrow(() -> new BusinessException("Data scope not found: " + scopeId));
        dataScopeRepository.delete(scope);
    }

    private RoleDTO mapRoleToDTO(Role role) {
        return RoleDTO.builder()
                .id(role.getId())
                .name(role.getName())
                .description(role.getDescription())
                .systemRole(role.isSystemRole())
                .permissions(role.getPermissions().stream().map(this::mapPermissionToDTO).collect(Collectors.toList()))
                .build();
    }

    private PermissionDTO mapPermissionToDTO(Permission permission) {
        return PermissionDTO.builder()
                .id(permission.getId())
                .name(permission.getName())
                .actionKey(permission.getActionKey())
                .module(permission.getModule())
                .description(permission.getDescription())
                .build();
    }

    private DepartmentDTO mapDepartmentToDTO(Department dept) {
        List<DepartmentDTO> children = dept.getSubDepartments() != null ?
                dept.getSubDepartments().stream().map(this::mapDepartmentToDTO).collect(Collectors.toList()) :
                Collections.emptyList();

        return DepartmentDTO.builder()
                .id(dept.getId())
                .code(dept.getCode())
                .name(dept.getName())
                .description(dept.getDescription())
                .parentId(dept.getParent() != null ? dept.getParent().getId() : null)
                .subDepartments(children)
                .build();
    }

    private DataScopeDTO mapDataScopeToDTO(DataScope scope) {
        return DataScopeDTO.builder()
                .id(scope.getId())
                .scopeType(scope.getScopeType())
                .scopeValueId(scope.getScopeValueId())
                .name(scope.getName())
                .userId(scope.getUser() != null ? scope.getUser().getId() : null)
                .roleId(scope.getRole() != null ? scope.getRole().getId() : null)
                .build();
    }
}
