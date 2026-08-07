package com.eagleauctioner.bootstrap;

import com.eagleauctioner.config.SuperAdminBootstrapInitializer;
import com.eagleauctioner.entity.Role;
import com.eagleauctioner.entity.User;
import com.eagleauctioner.enums.UserType;
import com.eagleauctioner.repository.RoleRepository;
import com.eagleauctioner.repository.UserRepository;
import com.eagleauctioner.service.AuthService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.boot.ApplicationArguments;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.HashSet;
import java.util.Optional;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class SuperAdminBootstrapInitializerTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private RoleRepository roleRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private AuthService authService;

    @Mock
    private ApplicationArguments applicationArguments;

    @InjectMocks
    private SuperAdminBootstrapInitializer initializer;

    private Role superAdminRole;
    private Role financeRole;
    private Role opsRole;

    @BeforeEach
    void setUp() {
        superAdminRole = Role.builder()
                .name("ROLE_SUPER_ADMIN")
                .description("Super Administrator")
                .systemRole(true)
                .build();
        financeRole = Role.builder()
                .name("ROLE_FINANCE")
                .description("Finance")
                .systemRole(true)
                .build();
        opsRole = Role.builder()
                .name("ROLE_OPS_HEAD")
                .description("Operations Head")
                .systemRole(true)
                .build();

        ReflectionTestUtils.setField(initializer, "bootstrapEnabled", true);
        ReflectionTestUtils.setField(initializer, "createDefaultUsers", true);
        ReflectionTestUtils.setField(initializer, "repairUsers", false);
    }

    @Test
    @DisplayName("Should skip bootstrap execution when bootstrap.enabled is false")
    void testBootstrap_WhenBootstrapDisabled_ShouldSkip() {
        ReflectionTestUtils.setField(initializer, "bootstrapEnabled", false);

        initializer.run(applicationArguments);

        verify(userRepository, never()).save(any(User.class));
        verify(roleRepository, never()).findByName(anyString());
    }

    @Test
    @DisplayName("Should create default Super Admin, Finance, and Operations users when none exist")
    void testBootstrap_WhenUsersDoNotExist_ShouldCreateDefaultUsers() {
        when(roleRepository.findByName("ROLE_SUPER_ADMIN")).thenReturn(Optional.of(superAdminRole));
        when(roleRepository.findByName("ROLE_FINANCE")).thenReturn(Optional.of(financeRole));
        when(roleRepository.findByName("ROLE_OPS_HEAD")).thenReturn(Optional.of(opsRole));

        when(userRepository.findByEmailIgnoreCaseAndDeletedAtIsNull("admin@eagleauctioner.com")).thenReturn(Optional.empty());
        when(userRepository.findByEmailIgnoreCaseAndDeletedAtIsNull("finance@eagleauctioner.com")).thenReturn(Optional.empty());
        when(userRepository.findByEmailIgnoreCaseAndDeletedAtIsNull("ops@eagleauctioner.com")).thenReturn(Optional.empty());

        when(passwordEncoder.encode("Admin@123")).thenReturn("$2a$10$hashedAdmin");
        when(passwordEncoder.encode("Finance@123")).thenReturn("$2a$10$hashedFinance");
        when(passwordEncoder.encode("Ops@123")).thenReturn("$2a$10$hashedOps");

        initializer.run(applicationArguments);

        ArgumentCaptor<User> userCaptor = ArgumentCaptor.forClass(User.class);
        verify(userRepository, times(3)).save(userCaptor.capture());

        User adminUser = userCaptor.getAllValues().get(0);
        assertEquals("admin@eagleauctioner.com", adminUser.getEmail());
        assertEquals("$2a$10$hashedAdmin", adminUser.getPassword());
        assertTrue(adminUser.isActive());
        assertTrue(adminUser.getRoles().contains(superAdminRole));

        User financeUser = userCaptor.getAllValues().get(1);
        assertEquals("finance@eagleauctioner.com", financeUser.getEmail());
        assertEquals("$2a$10$hashedFinance", financeUser.getPassword());
        assertTrue(financeUser.isActive());

        User opsUser = userCaptor.getAllValues().get(2);
        assertEquals("ops@eagleauctioner.com", opsUser.getEmail());
        assertEquals("$2a$10$hashedOps", opsUser.getPassword());
        assertTrue(opsUser.isActive());
    }

    @Test
    @DisplayName("Should leave existing admin completely unchanged (password, lock status, verification, attempts untouched)")
    void testBootstrap_WhenAdminExists_ShouldLeaveUnchanged() {
        User existingAdmin = User.builder()
                .email("admin@eagleauctioner.com")
                .password("$2a$10$existingHash")
                .userType(UserType.ADMIN)
                .isActive(true)
                .emailVerified(false)
                .isLocked(true)
                .failedLoginAttempts(5)
                .roles(new HashSet<>(Set.of(superAdminRole)))
                .build();

        when(roleRepository.findByName("ROLE_SUPER_ADMIN")).thenReturn(Optional.of(superAdminRole));
        when(roleRepository.findByName("ROLE_FINANCE")).thenReturn(Optional.of(financeRole));
        when(roleRepository.findByName("ROLE_OPS_HEAD")).thenReturn(Optional.of(opsRole));

        when(userRepository.findByEmailIgnoreCaseAndDeletedAtIsNull("admin@eagleauctioner.com")).thenReturn(Optional.of(existingAdmin));
        when(userRepository.findByEmailIgnoreCaseAndDeletedAtIsNull("finance@eagleauctioner.com")).thenReturn(Optional.empty());
        when(userRepository.findByEmailIgnoreCaseAndDeletedAtIsNull("ops@eagleauctioner.com")).thenReturn(Optional.empty());

        initializer.run(applicationArguments);

        verify(authService, never()).repairUserPassword(anyString(), anyString());
        assertEquals("$2a$10$existingHash", existingAdmin.getPassword());
        assertTrue(existingAdmin.isLocked());
        assertFalse(existingAdmin.isEmailVerified());
        assertEquals(5, existingAdmin.getFailedLoginAttempts());
    }

    @Test
    @DisplayName("Should add missing required role to existing user without removing existing roles or modifying state")
    void testBootstrap_WhenExistingUserMissingRole_ShouldAddMissingRoleOnly() {
        Role customRole = Role.builder().name("ROLE_CUSTOM").build();
        User existingAdminMissingRole = User.builder()
                .email("admin@eagleauctioner.com")
                .password("$2a$10$existingHash")
                .userType(UserType.ADMIN)
                .isActive(true)
                .emailVerified(true)
                .isLocked(false)
                .roles(new HashSet<>(Set.of(customRole)))
                .build();

        when(roleRepository.findByName("ROLE_SUPER_ADMIN")).thenReturn(Optional.of(superAdminRole));
        when(roleRepository.findByName("ROLE_FINANCE")).thenReturn(Optional.of(financeRole));
        when(roleRepository.findByName("ROLE_OPS_HEAD")).thenReturn(Optional.of(opsRole));

        when(userRepository.findByEmailIgnoreCaseAndDeletedAtIsNull("admin@eagleauctioner.com")).thenReturn(Optional.of(existingAdminMissingRole));
        when(userRepository.findByEmailIgnoreCaseAndDeletedAtIsNull("finance@eagleauctioner.com")).thenReturn(Optional.empty());
        when(userRepository.findByEmailIgnoreCaseAndDeletedAtIsNull("ops@eagleauctioner.com")).thenReturn(Optional.empty());

        initializer.run(applicationArguments);

        assertTrue(existingAdminMissingRole.getRoles().contains(customRole));
        assertTrue(existingAdminMissingRole.getRoles().contains(superAdminRole));
        verify(userRepository, times(3)).save(any(User.class));
    }
}
