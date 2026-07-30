package com.eagleauctioner.aspect;

import com.eagleauctioner.entity.DataScope;
import com.eagleauctioner.entity.User;
import com.eagleauctioner.enums.DataScopeType;
import com.eagleauctioner.exception.BusinessException;
import com.eagleauctioner.repository.DataScopeRepository;
import com.eagleauctioner.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.aspectj.lang.JoinPoint;
import org.aspectj.lang.annotation.Aspect;
import org.aspectj.lang.annotation.Before;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

import java.util.List;

@Aspect
@Component
@RequiredArgsConstructor
@Slf4j
public class DataScopeAspect {

    private final DataScopeRepository dataScopeRepository;
    private final UserRepository userRepository;

    @Before("@annotation(enforceDataScope)")
    public void enforceScope(JoinPoint joinPoint, EnforceDataScope enforceDataScope) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated()) {
            throw new BusinessException("Unauthorized: Security context authentication required for data scope enforcement");
        }

        String username = auth.getName();

        // Super Admin bypasses scope check
        boolean isSuperAdmin = auth.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_SUPER_ADMIN") || a.getAuthority().equals("SUPER_ADMIN"));

        if (isSuperAdmin) {
            log.debug("Data scope enforcement bypassed for Super Admin: {}", username);
            return;
        }

        User user = userRepository.findByEmailIgnoreCaseAndDeletedAtIsNull(username)
                .orElse(null);

        if (user == null) {
            log.warn("Authenticated user details not found for scope check: {}", username);
            return;
        }

        DataScopeType requiredType = enforceDataScope.value();
        List<DataScope> userScopes = dataScopeRepository.findByUserId(user.getId());

        // If specific scope constraints are defined, verify the user has access
        if (!userScopes.isEmpty()) {
            boolean hasMatchingScope = userScopes.stream()
                    .anyMatch(s -> s.getScopeType() == requiredType || s.getScopeType() == DataScopeType.COMPANY);

            if (!hasMatchingScope) {
                log.warn("Access denied for user {} due to missing data scope: {}", username, requiredType);
                throw new BusinessException("Forbidden: User does not possess the required data scope boundary: " + requiredType);
            }
        }
    }
}
