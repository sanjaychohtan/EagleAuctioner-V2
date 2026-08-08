package com.eagleauctioner.service;

import com.eagleauctioner.entity.RefreshToken;
import com.eagleauctioner.entity.User;
import com.eagleauctioner.repository.RefreshTokenRepository;
import com.eagleauctioner.repository.RoleRepository;
import com.eagleauctioner.repository.UserRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuthServiceLogoutTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private RefreshTokenRepository refreshTokenRepository;

    @Mock
    private JwtService jwtService;

    @InjectMocks
    private AuthService authService;

    @Test
    @DisplayName("Should handle logout gracefully with valid token")
    void testLogout_ValidToken() {
        when(refreshTokenRepository.findByTokenHash(anyString())).thenReturn(Optional.of(new RefreshToken()));
        when(jwtService.extractTokenFamilyId(anyString())).thenReturn("family-123");

        assertDoesNotThrow(() -> authService.logout("valid.jwt.token"));

        verify(jwtService).revokeToken("valid.jwt.token");
        verify(jwtService).revokeTokenFamily("family-123");
        verify(refreshTokenRepository).revokeFamily("family-123");
    }

    @Test
    @DisplayName("Should handle logout gracefully when token is null or blank")
    void testLogout_NullOrBlankToken() {
        assertDoesNotThrow(() -> authService.logout(null));
        assertDoesNotThrow(() -> authService.logout(""));
        assertDoesNotThrow(() -> authService.logout("   "));

        verifyNoInteractions(jwtService);
        verifyNoInteractions(refreshTokenRepository);
    }

    @Test
    @DisplayName("Should handle logout gracefully when JWT service throws exception on expired or malformed token")
    void testLogout_ExpiredOrMalformedToken_ShouldNotThrow500() {
        doThrow(new RuntimeException("Expired token")).when(jwtService).revokeToken(anyString());

        assertDoesNotThrow(() -> authService.logout("expired.or.malformed.token"));
    }
}
