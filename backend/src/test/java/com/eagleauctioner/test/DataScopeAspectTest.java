package com.eagleauctioner.test;

import com.eagleauctioner.aspect.DataScopeAspect;
import com.eagleauctioner.aspect.EnforceDataScope;
import com.eagleauctioner.entity.DataScope;
import com.eagleauctioner.entity.User;
import com.eagleauctioner.enums.DataScopeType;
import com.eagleauctioner.exception.BusinessException;
import com.eagleauctioner.repository.DataScopeRepository;
import com.eagleauctioner.repository.UserRepository;
import com.eagleauctioner.security.EnterprisePermissionEvaluator;
import org.aspectj.lang.JoinPoint;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class DataScopeAspectTest {

    @Mock
    private DataScopeRepository dataScopeRepository;

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private DataScopeAspect dataScopeAspect;

    @Mock
    private JoinPoint joinPoint;

    @Mock
    private com.eagleauctioner.security.AbacPolicyEngine abacPolicyEngine;

    @Mock
    private EnforceDataScope enforceDataScope;

    private EnterprisePermissionEvaluator permissionEvaluator;

    @BeforeEach
    void setUp() {
        permissionEvaluator = new EnterprisePermissionEvaluator(abacPolicyEngine);
    }

    @Test
    @DisplayName("Super Admin should bypass data scope enforcement")
    void testSuperAdminBypassesScope() {
        var context = SecurityContextHolder.createEmptyContext();
        UsernamePasswordAuthenticationToken auth = new UsernamePasswordAuthenticationToken(
                "admin@eagle.com", "pass", Collections.singletonList(new SimpleGrantedAuthority("ROLE_SUPER_ADMIN"))
        );
        context.setAuthentication(auth);
        SecurityContextHolder.setContext(context);

        assertDoesNotThrow(() -> dataScopeAspect.enforceScope(joinPoint, enforceDataScope));
    }

    @Test
    @DisplayName("User with matching data scope should be granted access")
    void testUserWithMatchingScopeAccessGranted() {
        UUID userId = UUID.randomUUID();
        var context = SecurityContextHolder.createEmptyContext();
        UsernamePasswordAuthenticationToken auth = new UsernamePasswordAuthenticationToken(
                "seller@eagle.com", "pass", Collections.singletonList(new SimpleGrantedAuthority("ROLE_SELLER"))
        );
        context.setAuthentication(auth);
        SecurityContextHolder.setContext(context);

        User mockUser = User.builder().id(userId).email("seller@eagle.com").build();
        DataScope mockScope = DataScope.builder().scopeType(DataScopeType.AUCTION).user(mockUser).build();

        lenient().when(userRepository.findByEmailIgnoreCaseAndDeletedAtIsNull("seller@eagle.com")).thenReturn(Optional.of(mockUser));
        lenient().when(dataScopeRepository.findByUserId(userId)).thenReturn(Collections.singletonList(mockScope));
        lenient().when(enforceDataScope.value()).thenReturn(DataScopeType.AUCTION);

        assertDoesNotThrow(() -> dataScopeAspect.enforceScope(joinPoint, enforceDataScope));
    }

    @Test
    @DisplayName("User missing required data scope should be denied access")
    void testUserMissingScopeAccessDenied() {
        UUID userId = UUID.randomUUID();
        var context = SecurityContextHolder.createEmptyContext();
        UsernamePasswordAuthenticationToken auth = new UsernamePasswordAuthenticationToken(
                "user@eagle.com", "pass", Collections.singletonList(new SimpleGrantedAuthority("ROLE_USER"))
        );
        context.setAuthentication(auth);
        SecurityContextHolder.setContext(context);

        User mockUser = User.builder().id(userId).email("user@eagle.com").build();
        DataScope mockScope = DataScope.builder().scopeType(DataScopeType.WAREHOUSE).user(mockUser).build();

        lenient().when(userRepository.findByEmailIgnoreCaseAndDeletedAtIsNull("user@eagle.com")).thenReturn(Optional.of(mockUser));
        lenient().when(dataScopeRepository.findByUserId(userId)).thenReturn(Collections.singletonList(mockScope));
        lenient().when(enforceDataScope.value()).thenReturn(DataScopeType.AUCTION);

        assertThrows(BusinessException.class, () -> dataScopeAspect.enforceScope(joinPoint, enforceDataScope));
    }

    @Test
    @DisplayName("PermissionEvaluator should validate action authorities correctly")
    void testPermissionEvaluator() {
        UsernamePasswordAuthenticationToken auth = new UsernamePasswordAuthenticationToken(
                "user@eagle.com", "pass", Arrays.asList(new SimpleGrantedAuthority("ROLE_SELLER"), new SimpleGrantedAuthority("auction.create"))
        );

        when(abacPolicyEngine.evaluatePolicy(eq("auction.create"), any())).thenReturn(true);

        assertTrue(permissionEvaluator.hasPermission(auth, null, "auction.create"));
        assertFalse(permissionEvaluator.hasPermission(auth, null, "user.disable"));
    }
}
