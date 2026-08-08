package com.eagleauctioner.test;

import com.eagleauctioner.dto.RolePermissionDTOs.*;
import com.eagleauctioner.entity.Permission;
import com.eagleauctioner.entity.Role;
import com.eagleauctioner.enums.Module;
import com.eagleauctioner.repository.DataScopeRepository;
import com.eagleauctioner.repository.DepartmentRepository;
import com.eagleauctioner.repository.PermissionRepository;
import com.eagleauctioner.repository.RoleRepository;
import com.eagleauctioner.repository.UserRepository;
import com.eagleauctioner.service.impl.EnterpriseAuthorizationServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class EnterpriseAuthorizationServiceTest {

    @Mock
    private RoleRepository roleRepository;

    @Mock
    private PermissionRepository permissionRepository;

    @Mock
    private DepartmentRepository departmentRepository;

    @Mock
    private DataScopeRepository dataScopeRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private com.eagleauctioner.security.PermissionCacheService permissionCacheService;

    @InjectMocks
    private EnterpriseAuthorizationServiceImpl authorizationService;

    private UUID sampleRoleId;
    private UUID samplePermissionId;
    private Permission samplePermission;
    private Role sampleRole;

    @BeforeEach
    void setUp() {
        sampleRoleId = UUID.randomUUID();
        samplePermissionId = UUID.randomUUID();

        samplePermission = Permission.builder()
                .id(samplePermissionId)
                .name("Create Auction")
                .actionKey("auction.create")
                .module(Module.AUCTION)
                .description("Permission to create auctions")
                .build();

        sampleRole = Role.builder()
                .id(sampleRoleId)
                .name("ROLE_CUSTOM_MANAGER")
                .description("Custom Manager Role")
                .systemRole(false)
                .permissions(new HashSet<>(Collections.singletonList(samplePermission)))
                .build();
    }

    @Test
    @DisplayName("Should list all roles successfully")
    void testGetAllRoles() {
        when(roleRepository.findAll()).thenReturn(Collections.singletonList(sampleRole));

        List<RoleDTO> roles = authorizationService.getAllRoles();

        assertNotNull(roles);
        assertEquals(1, roles.size());
        assertEquals("ROLE_CUSTOM_MANAGER", roles.get(0).getName());
        verify(roleRepository, times(1)).findAll();
    }

    @Test
    @DisplayName("Should create custom role with action permissions")
    void testCreateCustomRole() {
        RoleCreateRequestDTO request = RoleCreateRequestDTO.builder()
                .name("MARKETING_LEAD")
                .description("Marketing Lead Role")
                .permissionIds(Collections.singletonList(samplePermissionId))
                .build();

        when(roleRepository.findByName("ROLE_MARKETING_LEAD")).thenReturn(Optional.empty());
        when(permissionRepository.findAllById(request.getPermissionIds())).thenReturn(Collections.singletonList(samplePermission));
        when(roleRepository.save(any(Role.class))).thenAnswer(invocation -> {
            Role r = invocation.getArgument(0);
            r.setId(UUID.randomUUID());
            return r;
        });

        RoleDTO createdRole = authorizationService.createRole(request, UUID.randomUUID());

        assertNotNull(createdRole);
        assertEquals("ROLE_MARKETING_LEAD", createdRole.getName());
        assertFalse(createdRole.isSystemRole());
        assertEquals(1, createdRole.getPermissions().size());
        assertEquals("auction.create", createdRole.getPermissions().get(0).getActionKey());
    }

    @Test
    @DisplayName("Should list all permissions across SELLER, BUYER, SETTLEMENT, NOTIFICATION, and SYSTEM modules")
    void testGetAllPermissionsWithNewModules() {
        Permission sellerPerm = Permission.builder()
                .id(UUID.randomUUID())
                .name("Create Seller")
                .actionKey("seller.create")
                .module(Module.SELLER)
                .description("Register seller")
                .build();

        Permission settlementPerm = Permission.builder()
                .id(UUID.randomUUID())
                .name("View Settlement")
                .actionKey("settlement.view")
                .module(Module.SETTLEMENT)
                .description("View settlement")
                .build();

        Permission systemPerm = Permission.builder()
                .id(UUID.randomUUID())
                .name("Admin Access")
                .actionKey("admin.access")
                .module(Module.SYSTEM)
                .description("Admin access")
                .build();

        when(permissionRepository.findAll()).thenReturn(Arrays.asList(samplePermission, sellerPerm, settlementPerm, systemPerm));

        List<PermissionDTO> permissions = authorizationService.getAllPermissions();

        assertNotNull(permissions);
        assertEquals(4, permissions.size());
        assertEquals(Module.SELLER, permissions.get(1).getModule());
        assertEquals(Module.SETTLEMENT, permissions.get(2).getModule());
        assertEquals(Module.SYSTEM, permissions.get(3).getModule());
    }

    @Test
    @DisplayName("Should throw exception when creating duplicate role name")
    void testCreateDuplicateRoleName() {
        RoleCreateRequestDTO request = RoleCreateRequestDTO.builder()
                .name("ROLE_CUSTOM_MANAGER")
                .description("Duplicate role test")
                .permissionIds(Collections.singletonList(samplePermissionId))
                .build();

        when(roleRepository.findByName("ROLE_CUSTOM_MANAGER")).thenReturn(Optional.of(sampleRole));

        assertThrows(RuntimeException.class, () -> authorizationService.createRole(request, UUID.randomUUID()));
    }
}
