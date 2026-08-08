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
        if (!bootstrapEnabled || !createDefaultUsers) {
            log.info("System bootstrap is disabled via configuration. Skipping user initialization.");
            return;
        }

        log.info("Executing Enterprise Production-Safe Initializer...");
        try {
            ensureSystemUser("admin@eagleauctioner.com", "Admin@123", UserType.ADMIN, "Super", "Admin", "ROLE_SUPER_ADMIN");
            ensureSystemUser("demo.seller@eagleauctioner.com", "DemoSeller@123", UserType.SELLER, "Demo", "Seller", "ROLE_SELLER");
            ensureSystemUser("demo.buyer@eagleauctioner.com", "DemoBuyer@123", UserType.BIDDER, "Demo", "Buyer", "ROLE_BIDDER");
            ensureSystemUser("finance@eagleauctioner.com", "Finance@123", UserType.ADMIN, "Finance", "Lead", "ROLE_FINANCE");
            ensureSystemUser("ops@eagleauctioner.com", "Ops@123", UserType.ADMIN, "Operations", "Head", "ROLE_OPS_HEAD");
        } catch (Exception e) {
            log.error("Error during system bootstrap: {}", e.getMessage(), e);
        }
    }

    private void ensureSystemUser(String email, String defaultPassword, UserType userType, String firstName, String lastName, String roleName) {
        Role role = roleRepository.findByName(roleName)
                .orElseGet(() -> roleRepository.findByName(roleName.replace("ROLE_", "")).orElse(null));
        if (role == null) return;

        Optional<User> existingOpt = userRepository.findByEmailIgnoreCaseAndDeletedAtIsNull(email);
        if (existingOpt.isPresent()) {
            User existing = existingOpt.get();
            boolean roleAdded = false;
            if (existing.getRoles() == null) {
                existing.setRoles(new HashSet<>(Set.of(role)));
                roleAdded = true;
            } else if (!existing.getRoles().contains(role)) {
                existing.getRoles().add(role);
                roleAdded = true;
            }

            if (roleAdded) {
                userRepository.save(existing);
                log.info("Assigned missing role ({}) to existing user ({})", roleName, email);
            }

            if (repairUsers && !passwordEncoder.matches(defaultPassword, existing.getPassword())) {
                authService.repairUserPassword(email, defaultPassword);
            }
        } else {
            userRepository.save(User.builder()
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
                    .roles(new HashSet<>(Set.of(role)))
                    .build());
            log.info("Created default system user ({})", email);
        }
    }
}
