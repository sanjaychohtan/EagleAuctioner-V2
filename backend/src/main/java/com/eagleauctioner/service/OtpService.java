package com.eagleauctioner.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.security.SecureRandom;
import java.util.concurrent.TimeUnit;

@Service
@RequiredArgsConstructor
@Slf4j
public class OtpService {

    private final StringRedisTemplate redisTemplate;
    private final SecureRandom secureRandom = new SecureRandom();

    private static final String OTP_KEY_PREFIX = "otp:mobile:";
    private static final String COOLDOWN_KEY_PREFIX = "otp:cooldown:";
    private static final String ATTEMPTS_KEY_PREFIX = "otp:attempts:";

    private static final int OTP_EXPIRY_MINUTES = 5;
    private static final int COOLDOWN_SECONDS = 60;
    private static final int MAX_ATTEMPTS = 3;

    /**
     * Generates a 6-digit OTP for the given mobile number.
     * Enforces a cooldown period between successive generation requests.
     */
    public String generateOtp(String mobileNumber) {
        String cooldownKey = COOLDOWN_KEY_PREFIX + mobileNumber;
        
        // Atomically set cooldown key with expiration. If it already exists (returns false), cooldown is active.
        Boolean setCooldown = redisTemplate.opsForValue().setIfAbsent(cooldownKey, "active", COOLDOWN_SECONDS, TimeUnit.SECONDS);
        if (Boolean.FALSE.equals(setCooldown) || setCooldown == null) {
            throw new IllegalStateException("Please wait before requesting another OTP. Cooldown active.");
        }

        // Generate 6-digit numeric OTP
        int otpValue = 100000 + secureRandom.nextInt(900000);
        String otp = String.valueOf(otpValue);

        String otpKey = OTP_KEY_PREFIX + mobileNumber;
        String attemptsKey = ATTEMPTS_KEY_PREFIX + mobileNumber;

        // Store OTP and initialize attempts
        redisTemplate.opsForValue().set(otpKey, otp, OTP_EXPIRY_MINUTES, TimeUnit.MINUTES);
        redisTemplate.opsForValue().set(attemptsKey, "0", OTP_EXPIRY_MINUTES, TimeUnit.MINUTES);

        log.info("OTP generated successfully for mobile: {}. Expirations and cooldown active.", mobileNumber);
        
        // Return OTP for integration (e.g. SMS gateway mock/service)
        return otp;
    }

    /**
     * Verifies the OTP for the given mobile number.
     * Limits attempts to prevent brute-forcing.
     */
    public boolean verifyOtp(String mobileNumber, String proposedOtp) {
        String otpKey = OTP_KEY_PREFIX + mobileNumber;
        String attemptsKey = ATTEMPTS_KEY_PREFIX + mobileNumber;

        String storedOtp = redisTemplate.opsForValue().get(otpKey);
        if (storedOtp == null) {
            log.warn("OTP verification failed. No active or expired OTP found for mobile: {}", mobileNumber);
            return false;
        }

        // Increment attempts count
        Long attempts = redisTemplate.opsForValue().increment(attemptsKey);
        if (attempts != null && attempts > MAX_ATTEMPTS) {
            redisTemplate.delete(otpKey);
            redisTemplate.delete(attemptsKey);
            log.warn("OTP verification blocked. Max attempts ({}) exceeded for mobile: {}", MAX_ATTEMPTS, mobileNumber);
            throw new IllegalArgumentException("Maximum verification attempts exceeded. Please generate a new OTP.");
        }

        if (storedOtp.equals(proposedOtp)) {
            // Success: Clean up keys immediately
            redisTemplate.delete(otpKey);
            redisTemplate.delete(attemptsKey);
            log.info("OTP verified successfully for mobile: {}", mobileNumber);
            return true;
        }

        log.warn("Invalid OTP entered for mobile: {}. Attempt {} of {}.", mobileNumber, attempts, MAX_ATTEMPTS);
        return false;
    }
}
