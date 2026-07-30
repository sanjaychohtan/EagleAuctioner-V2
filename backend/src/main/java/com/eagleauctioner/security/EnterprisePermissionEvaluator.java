package com.eagleauctioner.security;

import lombok.RequiredArgsConstructor;
import org.springframework.security.access.PermissionEvaluator;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.stereotype.Component;

import java.io.Serializable;

@Component
@RequiredArgsConstructor
public class EnterprisePermissionEvaluator implements PermissionEvaluator {

    private final AbacPolicyEngine abacPolicyEngine;

    @Override
    public boolean hasPermission(Authentication authentication, Object targetDomainObject, Object permission) {
        if (authentication == null || permission == null) {
            return false;
        }

        String targetPermission = permission.toString();

        // Super Admin bypass
        boolean isSuperAdmin = authentication.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .anyMatch(a -> a.equals("ROLE_SUPER_ADMIN") || a.equals("SUPER_ADMIN"));

        if (isSuperAdmin) {
            return true;
        }

        // 1. RBAC Authority Match
        boolean hasAuthority = authentication.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .anyMatch(authority -> authority.equalsIgnoreCase(targetPermission) ||
                                       authority.equalsIgnoreCase("ROLE_" + targetPermission));

        if (!hasAuthority) {
            return false;
        }

        // 2. ABAC Contextual Policy Rule Evaluation
        return abacPolicyEngine.evaluatePolicy(targetPermission, targetDomainObject);
    }

    @Override
    public boolean hasPermission(Authentication authentication, Serializable targetId, String targetType, Object permission) {
        return hasPermission(authentication, null, permission);
    }
}
