package com.eagleauctioner.test;

import com.eagleauctioner.entity.*;
import com.eagleauctioner.enums.Action;
import com.eagleauctioner.repository.*;
import com.eagleauctioner.service.impl.AdminOperationsServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class AdminOperationsTest {

    @Mock
    private UserRepository userRepository;
    
    @Mock
    private AuditLogRepository auditLogRepository;
    
    @Mock
    private FeatureFlagRepository featureFlagRepository;

    @InjectMocks
    private AdminOperationsServiceImpl adminService;

    private UUID userId;
    private UUID adminId;

    @BeforeEach
    void setUp() {
        userId = UUID.randomUUID();
        adminId = UUID.randomUUID();
    }

    @Test
    void testUpdateUserStatus_Success() {
        User user = new User();
        user.setId(userId);
        user.setActive(true);
        user.setLocked(false);

        when(userRepository.findById(userId)).thenReturn(Optional.of(user));
        when(userRepository.save(any(User.class))).thenReturn(user);

        User updated = adminService.updateUserStatus(userId, false, true, adminId);

        assertNotNull(updated);
        assertFalse(updated.isActive());
        assertTrue(updated.isLocked());
        verify(auditLogRepository, times(1)).save(any(AuditLog.class));
    }

    @Test
    void testSetFeatureFlag_CreateNew() {
        String flagKey = "ENABLE_NEW_UI";
        when(featureFlagRepository.findByFlagKey(flagKey)).thenReturn(Optional.empty());
        when(featureFlagRepository.save(any(FeatureFlag.class))).thenAnswer(i -> i.getArguments()[0]);

        FeatureFlag flag = adminService.setFeatureFlag(flagKey, true, "New UI Flag", adminId);

        assertNotNull(flag);
        assertEquals(flagKey, flag.getFlagKey());
        assertTrue(flag.isEnabled());
    }
}
