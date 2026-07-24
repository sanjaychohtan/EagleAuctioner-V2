package com.eagleauctioner.controller;

import com.eagleauctioner.service.AuthService;
import com.eagleauctioner.dto.ApiResponse;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletResponse;

@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/register")
    public ResponseEntity<ApiResponse<AuthService.AuthResponse>> register(@Valid @RequestBody RegisterRequest request, HttpServletResponse httpServletResponse) {
        AuthService.AuthResponse response = authService.register(
                request.getEmail(),
                request.getMobile(),
                request.getPassword(),
                request.getUserType()
        );
        setRefreshTokenCookie(httpServletResponse, response.getRefreshToken());
        response.setRefreshToken(null);
        return ResponseEntity.ok(ApiResponse.success("User registered successfully", response));
    }

    @PostMapping("/login")
    public ResponseEntity<ApiResponse<AuthService.AuthResponse>> login(@Valid @RequestBody LoginRequest request, HttpServletResponse httpServletResponse) {
        AuthService.AuthResponse response = authService.login(request.getEmail(), request.getPassword());
        setRefreshTokenCookie(httpServletResponse, response.getRefreshToken());
        response.setRefreshToken(null);
        return ResponseEntity.ok(ApiResponse.success("Login successful", response));
    }

    @PostMapping("/refresh")
    public ResponseEntity<ApiResponse<AuthService.AuthResponse>> refresh(
            @CookieValue(name = "ea_refresh_token", required = false) String cookieRefreshToken,
            @Valid @RequestBody(required = false) RefreshRequest request,
            HttpServletResponse httpServletResponse) {
        
        String tokenToUse = cookieRefreshToken;
        if (tokenToUse == null && request != null && request.getRefreshToken() != null) {
            tokenToUse = request.getRefreshToken();
        }
        
        if (tokenToUse == null) {
            throw new org.springframework.security.authentication.BadCredentialsException("Refresh token is missing");
        }

        AuthService.AuthResponse response = authService.refreshToken(tokenToUse);
        setRefreshTokenCookie(httpServletResponse, response.getRefreshToken());
        response.setRefreshToken(null);
        return ResponseEntity.ok(ApiResponse.success("Token refreshed successfully", response));
    }

    @PostMapping("/logout")
    public ResponseEntity<ApiResponse<Void>> logout(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            HttpServletResponse httpServletResponse) {
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            authService.logout(authHeader.substring(7));
        }
        Cookie cookie = new Cookie("ea_refresh_token", null);
        cookie.setHttpOnly(true);
        cookie.setSecure(true);
        cookie.setPath("/");
        cookie.setMaxAge(0);
        httpServletResponse.addCookie(cookie);
        return ResponseEntity.ok(ApiResponse.success("Logout successful", null));
    }

    private void setRefreshTokenCookie(HttpServletResponse response, String refreshToken) {
        if (refreshToken != null) {
            Cookie cookie = new Cookie("ea_refresh_token", refreshToken);
            cookie.setHttpOnly(true);
            cookie.setSecure(true);
            cookie.setPath("/");
            // cookie.setAttribute("SameSite", "Strict"); // Depending on servlet API version
            response.addHeader("Set-Cookie", "ea_refresh_token=" + refreshToken + "; Path=/; HttpOnly; Secure; SameSite=Strict");
        }
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<ApiResponse<Void>> forgotPassword(@Valid @RequestBody ForgotPasswordRequest request) {
        // We generate the token and normally send it via email.
        // We DO NOT return it in the response payload for security.
        authService.forgotPassword(request.getEmail());
        return ResponseEntity.ok(ApiResponse.success("Password reset instructions sent to email", null));
    }

    @PostMapping("/reset-password")
    public ResponseEntity<ApiResponse<Void>> resetPassword(@Valid @RequestBody ResetPasswordRequest request) {
        authService.resetPassword(request.getToken(), request.getNewPassword());
        return ResponseEntity.ok(ApiResponse.success("Password reset successfully", null));
    }

    @Data
    public static class RegisterRequest {
        @NotBlank(message = "Email is required")
        @Email(message = "Invalid email format")
        private String email;

        @Pattern(regexp = "^\\+?[1-9]\\d{1,14}$", message = "Invalid mobile number format")
        private String mobile;

        @NotBlank(message = "Password is required")
        @Pattern(regexp = "^(?=.*[0-9])(?=.*[a-z])(?=.*[A-Z])(?=.*[@#$%^&+=]).{8,}$", 
                 message = "Password must be at least 8 characters long, contain 1 uppercase, 1 lowercase, 1 digit, and 1 special character")
        private String password;

        private String userType; // BIDDER or SELLER
    }

    @Data
    public static class LoginRequest {
        @NotBlank(message = "Email is required")
        @Email(message = "Invalid email format")
        private String email;

        @NotBlank(message = "Password is required")
        private String password;
    }

    @Data
    public static class RefreshRequest {
        @NotBlank(message = "Refresh token is required")
        private String refreshToken;
    }

    @Data
    public static class ForgotPasswordRequest {
        @NotBlank(message = "Email is required")
        @Email(message = "Invalid email format")
        private String email;
    }

    @Data
    public static class ResetPasswordRequest {
        @NotBlank(message = "Token is required")
        private String token;

        @NotBlank(message = "New password is required")
        @Pattern(regexp = "^(?=.*[0-9])(?=.*[a-z])(?=.*[A-Z])(?=.*[@#$%^&+=]).{8,}$", 
                 message = "Password must be at least 8 characters long, contain 1 uppercase, 1 lowercase, 1 digit, and 1 special character")
        private String newPassword;
    }
}
