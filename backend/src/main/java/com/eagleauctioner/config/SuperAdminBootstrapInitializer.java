package com.eagleauctioner.config;

import com.eagleauctioner.entity.Role;
import com.eagleauctioner.entity.User;
import com.eagleauctioner.enums.UserType;
import com.eagleauctioner.repository.RoleRepository;
import com.eagleauctioner.repository.UserRepository;
import com.eagleauctioner.service.AuthService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashSet;
import java.util.Optional;
import java.util.Set;

@Component
@RequiredArgsConstructor
@Slf4j
public class SuperAdminBootstrapInitializer implements ApplicationRunner {

    private static final String DEFAULT_ADMIN_EMAIL = "admin@eagleauctioner.com";
    private static final String DEFAULT_ADMIN_PASSWORD = "Admin@123";
    private static final String SUPER_ADMIN_ROLE_NAME = "ROLE_SUPER_ADMIN";

    private static final String DEFAULT_FINANCE_EMAIL = "finance@eagleauctioner.com";
    private static final String DEFAULT_FINANCE_PASSWORD = "Finance@123";
    private static final String FINANCE_ROLE_NAME = "ROLE_FINANCE";

    private static final String DEFAULT_OPS_EMAIL = "ops@eagleauctioner.com";
    private static final String DEFAULT_OPS_PASSWORD = "Ops@123";
    private static final String OPS_ROLE_NAME = "ROLE_OPS_HEAD";

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthService authService;

    @Value("${bootstrap.enabled:true}")
    private boolean bootstrapEnabled;

    @Value("${bootstrap.create-default-users:true}")
    private boolean createDefaultUsers;

    @Value("${bootstrap.repair-users:false}")
    private boolean repairUsers;

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        if (!bootstrapEnabled) {
            log.info("Bootstrap is disabled via configuration (bootstrap.enabled=false). Skipping bootstrap.");
            return;
        }

        if (!createDefaultUsers) {
            log.info("Default user creation disabled (bootstrap.create-default-users=false). Skipping default user creation.");
            return;
        }

        log.info("Executing Enterprise Production-Safe Initializer...");

        try {
            Role superAdminRole = roleRepository.findByName(SUPER_ADMIN_ROLE_NAME)
                    .orElseGet(() -> roleRepository.findByName("SUPER_ADMIN")
                            .orElseThrow(() -> new IllegalStateException("Required role " + SUPER_ADMIN_ROLE_NAME + " not found in database")));
            ensureSystemUser(DEFAULT_ADMIN_EMAIL, DEFAULT_ADMIN_PASSWORD, UserType.ADMIN, "Super", "Admin", superAdminRole);

            Role financeRole = roleRepository.findByName(FINANCE_ROLE_NAME)
                    .orElseGet(() -> roleRepository.findByName("FINANCE").orElse(null));
            if (financeRole != null) {
                ensureSystemUser(DEFAULT_FINANCE_EMAIL, DEFAULT_FINANCE_PASSWORD, UserType.ADMIN, "Finance", "Lead", financeRole);
            }

            Role opsRole = roleRepository.findByName(OPS_ROLE_NAME)
                    .orElseGet(() -> roleRepository.findByName("ROLE_ADMIN").orElse(null));
            if (opsRole != null) {
                ensureSystemUser(DEFAULT_OPS_EMAIL, DEFAULT_OPS_PASSWORD, UserType.ADMIN, "Operations", "Head", opsRole);
            }

        } catch (Exception e) {
            log.error("Error during enterprise bootstrap initialization: {}", e.getMessage(), e);
        }
    }

    private void ensureSystemUser(String email, String defaultPassword, UserType userType, String firstName, String lastName, Role requiredRole) {
        Optional<User> existingUserOpt = userRepository.findByEmailIgnoreCaseAndDeletedAtIsNull(email);

        if (existingUserOpt.isPresent()) {
            User existingUser = existingUserOpt.get();
            log.info("User ({}) already exists. Preserving existing user state (password, lock status, and verification untouched).", email);

            boolean modified = false;
            if (existingUser.getRoles() == null) {
                existingUser.setRoles(new HashSet<>(Set.of(requiredRole)));
                modified = true;
            } else if (!existingUser.getRoles().contains(requiredRole)) {
                existingUser.getRoles().add(requiredRole);
                modified = true;
            }

            if (modified) {
                userRepository.save(existingUser);
                log.info("Added missing system role ({}) to existing user ({})", requiredRole.getName(), email);
            }

            if (repairUsers) {
                if (!passwordEncoder.matches(defaultPassword, existingUser.getPassword())) {
                    log.warn("bootstrap.repair-users=true is ENABLED. Repairing password for ({})", email);
                    authService.repairUserPassword(email, defaultPassword);
                }
            }
        } else {
            User newUser = User.builder()
                    .email(email)
                    .password(passwordEncoder.encode(defaultPassword))
                    .userType(userType)
                    .isActive(true)
                    .emailVerified(true)
                    .isLocked(false)
                    .failedLoginAttempts(0)
                    .firstName(firstName)
                    .lastName(lastName)
                    .createdBy("SYSTEM_BOOTSTRAP")
                    .roles(new HashSet<>(Set.of(requiredRole)))
                    .build();

            userRepository.save(newUser);
            log.info("Successfully created default system user ({})", email);
        }
    }
}
