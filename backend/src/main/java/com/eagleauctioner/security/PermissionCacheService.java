package com.eagleauctioner.security;

import com.eagleauctioner.entity.Permission;
import com.eagleauctioner.entity.Role;
import com.eagleauctioner.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
public class PermissionCacheService {

    private final UserRepository userRepository;

    @Cacheable(value = "user_permissions", key = "#userId")
    @Transactional(readOnly = true)
    public Set<String> getUserAuthorities(UUID userId) {
        log.debug("Cache miss for user authorities: {}. Fetching from DB...", userId);
        return userRepository.findById(userId)
                .map(user -> {
                    Set<String> authorities = new HashSet<>();
                    if (user.getRoles() != null) {
                        for (Role role : user.getRoles()) {
                            authorities.add(role.getName().startsWith("ROLE_") ? role.getName() : "ROLE_" + role.getName());
                            if (role.getPermissions() != null) {
                                for (Permission p : role.getPermissions()) {
                                    authorities.add(p.getName());
                                    if (p.getActionKey() != null && !p.getActionKey().isBlank()) {
                                        authorities.add(p.getActionKey());
                                    }
                                }
                            }
                        }
                    }
                    return authorities;
                })
                .orElse(Collections.emptySet());
    }

    @CacheEvict(value = "user_permissions", allEntries = true)
    public void evictAllPermissionCaches() {
        log.info("Evicting all user permission caches following role/permission update.");
    }
}
