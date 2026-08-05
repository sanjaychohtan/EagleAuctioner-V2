package com.eagleauctioner.config;

import com.eagleauctioner.entity.Role;
import com.eagleauctioner.entity.User;
import com.eagleauctioner.enums.UserType;
import com.eagleauctioner.repository.RoleRepository;
import com.eagleauctioner.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashSet;
import java.util.Set;

@Component
@RequiredArgsConstructor
@Slf4j
public class SuperAdminBootstrapInitializer implements ApplicationRunner {

    private static final String DEFAULT_ADMIN_EMAIL = "admin@eagleauctioner.com";
    private static final String DEFAULT_ADMIN_PASSWORD = "Admin@123";
    private static final String SUPER_ADMIN_ROLE_NAME = "ROLE_SUPER_ADMIN";

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        try {
            long userCount = userRepository.count();
            if (userCount > 0) {
                log.info("Users table is not empty (count: {}). Skipping default Super Admin bootstrap.", userCount);
                return;
            }

            if (userRepository.existsByEmailIgnoreCase(DEFAULT_ADMIN_EMAIL)) {
                log.info("Super Admin user ({}) already exists. Skipping bootstrap.", DEFAULT_ADMIN_EMAIL);
                return;
            }

            Role superAdminRole = roleRepository.findByName(SUPER_ADMIN_ROLE_NAME)
                    .orElseGet(() -> roleRepository.findByName("SUPER_ADMIN")
                            .orElseThrow(() -> new IllegalStateException("Required role " + SUPER_ADMIN_ROLE_NAME + " not found in database")));

            User superAdmin = User.builder()
                    .email(DEFAULT_ADMIN_EMAIL)
                    .password(passwordEncoder.encode(DEFAULT_ADMIN_PASSWORD))
                    .userType(UserType.ADMIN)
                    .isActive(true)
                    .emailVerified(true)
                    .isLocked(false)
                    .firstName("Super")
                    .lastName("Admin")
                    .createdBy("SYSTEM_BOOTSTRAP")
                    .roles(new HashSet<>(Set.of(superAdminRole)))
                    .build();

            userRepository.save(superAdmin);
            log.info("Successfully bootstrapped default Super Admin user ({})", DEFAULT_ADMIN_EMAIL);
        } catch (Exception e) {
            log.error("Failed to bootstrap default Super Admin user: {}", e.getMessage(), e);
        }
    }
}
