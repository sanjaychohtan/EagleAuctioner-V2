package com.eagleauctioner.bootstrap;

import com.eagleauctioner.config.SuperAdminBootstrapInitializer;
import com.eagleauctioner.entity.Role;
import com.eagleauctioner.entity.User;
import com.eagleauctioner.enums.UserType;
import com.eagleauctioner.repository.RoleRepository;
import com.eagleauctioner.repository.UserRepository;
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

import java.util.Optional;

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
    private ApplicationArguments applicationArguments;

    @InjectMocks
    private SuperAdminBootstrapInitializer initializer;

    private Role superAdminRole;

    @BeforeEach
    void setUp() {
        superAdminRole = Role.builder()
                .name("ROLE_SUPER_ADMIN")
                .description("Super Administrator")
                .systemRole(true)
                .build();
    }

    @Test
    @DisplayName("Should seed Super Admin user when users table is empty")
    void testBootstrap_WhenUsersTableIsEmpty_ShouldCreateSuperAdmin() {
        when(userRepository.count()).thenReturn(0L);
        when(userRepository.existsByEmailIgnoreCase("admin@eagleauctioner.com")).thenReturn(false);
        when(roleRepository.findByName("ROLE_SUPER_ADMIN")).thenReturn(Optional.of(superAdminRole));
        when(passwordEncoder.encode("Admin@123")).thenReturn("$2a$10$hashedPasswordValueExample");

        initializer.run(applicationArguments);

        ArgumentCaptor<User> userCaptor = ArgumentCaptor.forClass(User.class);
        verify(userRepository, times(1)).save(userCaptor.capture());

        User savedUser = userCaptor.getValue();
        assertEquals("admin@eagleauctioner.com", savedUser.getEmail());
        assertEquals("$2a$10$hashedPasswordValueExample", savedUser.getPassword());
        assertEquals(UserType.ADMIN, savedUser.getUserType());
        assertTrue(savedUser.isActive());
        assertTrue(savedUser.isEmailVerified());
        assertFalse(savedUser.isLocked());
        assertTrue(savedUser.getRoles().contains(superAdminRole));
    }

    @Test
    @DisplayName("Should skip bootstrap when users table is not empty")
    void testBootstrap_WhenUsersTableIsNotEmpty_ShouldSkip() {
        when(userRepository.count()).thenReturn(5L);

        initializer.run(applicationArguments);

        verify(userRepository, never()).save(any(User.class));
        verify(roleRepository, never()).findByName(anyString());
    }

    @Test
    @DisplayName("Should skip bootstrap when Super Admin email already exists")
    void testBootstrap_WhenSuperAdminAlreadyExists_ShouldSkip() {
        when(userRepository.count()).thenReturn(0L);
        when(userRepository.existsByEmailIgnoreCase("admin@eagleauctioner.com")).thenReturn(true);

        initializer.run(applicationArguments);

        verify(userRepository, never()).save(any(User.class));
        verify(roleRepository, never()).findByName(anyString());
    }
}
