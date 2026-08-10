package com.eagleauctioner.service;

import com.eagleauctioner.entity.Role;
import com.eagleauctioner.entity.User;
import com.eagleauctioner.entity.RefreshToken;
import com.eagleauctioner.enums.UserType;
import com.eagleauctioner.repository.RoleRepository;
import com.eagleauctioner.repository.UserRepository;
import com.eagleauctioner.repository.RefreshTokenRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.LockedException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Instant;
import java.util.UUID;
import java.util.concurrent.TimeUnit;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuthenticationManager authenticationManager;
    private final UserDetailsService userDetailsService;
    private final StringRedisTemplate redisTemplate;
    private final BidderOnboardingService bidderOnboardingService;
    private final SellerOnboardingService sellerOnboardingService;

    private static final int MAX_FAILED_ATTEMPTS = 5;

    private String hashToken(String token) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(token.getBytes(StandardCharsets.UTF_8));
            return java.util.HexFormat.of().formatHex(hash);
        } catch (NoSuchAlgorithmException e) {
            throw new RuntimeException("Failed to hash token", e);
        }
    }

    private String getIpAddress() {
        ServletRequestAttributes attr = (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
        return (attr != null && attr.getRequest() != null) ? attr.getRequest().getRemoteAddr() : null;
    }

    private String getUserAgent() {
        ServletRequestAttributes attr = (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
        return (attr != null && attr.getRequest() != null) ? attr.getRequest().getHeader("User-Agent") : null;
    }

    private void persistRefreshToken(User user, String token, String familyId) {
        RefreshToken refreshToken = RefreshToken.builder()
                .user(user)
                .tokenHash(hashToken(token))
                .tokenFamilyId(familyId)
                .expiresAt(jwtService.extractExpiration(token).toInstant())
                .ipAddress(getIpAddress())
                .userAgent(getUserAgent())
                .build();
        refreshTokenRepository.save(refreshToken);
    }

    @Transactional
    public AuthResponse register(String email, String mobile, String password, String requestedUserType) {
        
        // Validate userType whitelist (BIDDER, SELLER only for self-registration)
        UserType userType;
        try {
            userType = UserType.valueOf(requestedUserType.toUpperCase());
            if (userType != UserType.BIDDER && userType != UserType.SELLER) {
                throw new IllegalArgumentException("Registration only allowed for BIDDER or SELLER");
            }
        } catch (IllegalArgumentException e) {
            userType = UserType.BIDDER; // Default Role
        }

        if (userRepository.findByEmailIgnoreCaseAndDeletedAtIsNull(email).isPresent()) {
            throw new IllegalStateException("Email is already registered");
        }

        Role defaultRole = roleRepository.findByName(userType.name())
                .orElseThrow(() -> new RuntimeException("Default role not found"));

        User user = User.builder()
                .email(email)
                .mobile(mobile)
                .password(passwordEncoder.encode(password))
                .userType(userType)
                .isActive(true)
                .isLocked(false)
                .failedLoginAttempts(0)
                .emailVerified(true)
                .mobileVerified(true)
                .roles(new java.util.HashSet<>(java.util.Set.of(defaultRole)))
                .build();

        userRepository.save(user);

        UserDetails userDetails = userDetailsService.loadUserByUsername(user.getEmail());
        String familyId = UUID.randomUUID().toString();
        String accessToken = jwtService.generateAccessToken(userDetails, familyId);
        String refreshToken = jwtService.generateRefreshToken(userDetails, familyId);

        persistRefreshToken(user, refreshToken, familyId);

        return AuthResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .build();
    }

    @Transactional(rollbackFor = Exception.class)
    public AuthResponse registerPublicBidder(String email, String mobile, String password, com.eagleauctioner.dto.OnboardingDTOs.BidderRegistrationRequest bidderRequest) {
        if (userRepository.findByEmailIgnoreCaseAndDeletedAtIsNull(email).isPresent()) {
            throw new IllegalStateException("Email is already registered");
        }
        AuthResponse authResponse = register(email, mobile, password, "BIDDER");
        User user = getUserByEmail(email);
        bidderOnboardingService.registerBidder(user.getId(), bidderRequest);
        return authResponse;
    }

    @Transactional(rollbackFor = Exception.class)
    public AuthResponse registerPublicSeller(String email, String mobile, String password, com.eagleauctioner.dto.OnboardingDTOs.SellerRegistrationRequest sellerRequest) {
        if (userRepository.findByEmailIgnoreCaseAndDeletedAtIsNull(email).isPresent()) {
            throw new IllegalStateException("Email is already registered");
        }
        AuthResponse authResponse = register(email, mobile, password, "SELLER");
        User user = getUserByEmail(email);
        sellerOnboardingService.registerSeller(user.getId(), sellerRequest);
        return authResponse;
    }

    public User getUserByEmail(String email) {
        return userRepository.findByEmailIgnoreCaseAndDeletedAtIsNull(email)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
    }

    @Transactional
    public AuthResponse login(String email, String password) {
        log.info("LOGIN START {}", email);

        User user = userRepository.findByEmailIgnoreCaseAndDeletedAtIsNull(email)
                .orElseThrow(() -> new BadCredentialsException("Invalid email or password"));

        log.info("USER FOUND {}", user.getEmail());

        if (user.isLocked()) {
            throw new LockedException("Account is locked due to too many failed attempts");
        }

        if (!user.isEmailVerified()) {
            throw new BadCredentialsException("Email is not verified");
        }

        try {
            authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(email, password)
            );

            // Reset failed attempts on success
            user.setFailedLoginAttempts(0);
            user.setLastLoginAt(Instant.now());
            userRepository.save(user);

        } catch (AuthenticationException e) {
            log.error("Authentication failed", e);
            handleFailedLogin(user);
            throw new BadCredentialsException("Invalid email or password");
        } catch (Exception e) {
            log.error("Authentication failed", e);
            throw e;
        }

        UserDetails userDetails = userDetailsService.loadUserByUsername(user.getEmail());
        String familyId = UUID.randomUUID().toString();
        String accessToken = jwtService.generateAccessToken(userDetails, familyId);
        String refreshToken = jwtService.generateRefreshToken(userDetails, familyId);

        persistRefreshToken(user, refreshToken, familyId);

        return AuthResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .build();
    }

    private void handleFailedLogin(User user) {
        int attempts = user.getFailedLoginAttempts() + 1;
        user.setFailedLoginAttempts(attempts);
        if (attempts >= MAX_FAILED_ATTEMPTS) {
            user.setLocked(true);
            user.setLockedAt(Instant.now());
        }
        userRepository.save(user);
    }

    @Transactional
    public AuthResponse refreshToken(String refreshToken) {
        String userEmail = jwtService.extractUsername(refreshToken);
        String familyId = jwtService.extractTokenFamilyId(refreshToken);
        String tokenHash = hashToken(refreshToken);
        
        if (userEmail != null && familyId != null) {
            UserDetails userDetails = this.userDetailsService.loadUserByUsername(userEmail);
            
            // Database is the source of truth
            RefreshToken dbToken = refreshTokenRepository.findByTokenHash(tokenHash)
                    .orElseThrow(() -> new IllegalArgumentException("Refresh token not found"));

            if (dbToken.isRevoked() || jwtService.isTokenRevoked(refreshToken)) {
                // Reuse detection! Revoke the entire family
                refreshTokenRepository.revokeFamily(familyId);
                jwtService.revokeTokenFamily(familyId); // Also clear cache
                throw new IllegalArgumentException("Invalid refresh token. Token reuse detected. Session terminated.");
            }

            if (jwtService.validateRefreshToken(refreshToken, userDetails)) {
                // Refresh Token Rotation: Revoke the old refresh token
                String newAccessToken = jwtService.generateAccessToken(userDetails, familyId);
                String newRefreshToken = jwtService.generateRefreshToken(userDetails, familyId);

                dbToken.setRevokedAt(Instant.now());
                dbToken.setReplacedByTokenHash(hashToken(newRefreshToken));
                refreshTokenRepository.save(dbToken);

                jwtService.revokeToken(refreshToken); // Cache sync
                
                User user = userRepository.findByEmailIgnoreCaseAndDeletedAtIsNull(userEmail)
                        .orElseThrow(() -> new IllegalArgumentException("User not found"));
                persistRefreshToken(user, newRefreshToken, familyId);

                return AuthResponse.builder()
                        .accessToken(newAccessToken)
                        .refreshToken(newRefreshToken)
                        .build();
            }
        }
        throw new IllegalArgumentException("Invalid refresh token");
    }

    @Transactional
    public void logout(String token) {
        if (token == null || token.isBlank()) {
            return;
        }

        // 1. Revoke DB refresh token if token hash matches an active record
        try {
            String tokenHash = hashToken(token);
            refreshTokenRepository.findByTokenHash(tokenHash).ifPresent(dbToken -> {
                dbToken.setRevokedAt(Instant.now());
                refreshTokenRepository.save(dbToken);
            });
        } catch (Exception e) {
            log.warn("Refresh token DB revocation notice during logout: {}", e.getMessage());
        }

        // 2. Revoke JWT access token & token family safely
        try {
            jwtService.revokeToken(token);
            String familyId = jwtService.extractTokenFamilyId(token);
            if (familyId != null) {
                refreshTokenRepository.revokeFamily(familyId);
                jwtService.revokeTokenFamily(familyId);
            }
        } catch (io.jsonwebtoken.JwtException | IllegalArgumentException e) {
            log.info("Logout JWT processing skipped for invalid/expired token: {}", e.getMessage());
        } catch (Exception e) {
            log.error("Unexpected error during JWT logout processing: {}", e.getMessage(), e);
        }
    }

    public String forgotPassword(String email) {
        User user = userRepository.findByEmailIgnoreCaseAndDeletedAtIsNull(email)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        String resetToken = UUID.randomUUID().toString();
        redisTemplate.opsForValue().set("reset:" + resetToken, user.getEmail(), 15, TimeUnit.MINUTES);
        
        // Return token to controller for sending via email. Do NOT expose token to API consumer directly in production.
        return resetToken;
    }

    @Transactional
    public void resetPassword(String token, String newPassword) {
        String email = redisTemplate.opsForValue().get("reset:" + token);
        if (email == null) {
            throw new IllegalArgumentException("Invalid or expired reset token");
        }

        User user = userRepository.findByEmailIgnoreCaseAndDeletedAtIsNull(email)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        user.setPassword(passwordEncoder.encode(newPassword));
        user.setUpdatedAt(Instant.now());
        user.setLastPasswordChangeAt(Instant.now());
        user.setFailedLoginAttempts(0);
        user.setLocked(false);
        user.setLockedAt(null);
        userRepository.save(user);

        // Invalidate token
        redisTemplate.delete("reset:" + token);
        
        // Invalidate all active sessions for this user (Ideally we maintain a list of active familyIds per user)
        // Here we can store an invalidation timestamp in Redis for the user
        redisTemplate.opsForValue().set("session_invalidated:" + email, String.valueOf(Instant.now().toEpochMilli()));
    }

    @Transactional
    public void repairUserPassword(String email, String newPassword) {
        User user = userRepository.findByEmailIgnoreCaseAndDeletedAtIsNull(email)
                .orElseThrow(() -> new IllegalArgumentException("User not found with email: " + email));

        user.setPassword(passwordEncoder.encode(newPassword));
        user.setUpdatedAt(Instant.now());
        userRepository.save(user);
        log.info("Password repaired manually for user ({})", email);
    }

    @lombok.Data
    @lombok.Builder
    public static class AuthResponse {
        private String accessToken;
        private String refreshToken;
    }
}
