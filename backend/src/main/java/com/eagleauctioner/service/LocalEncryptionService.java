package com.eagleauctioner.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Service;
import javax.crypto.Cipher;
import javax.crypto.spec.GCMParameterSpec;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.SecureRandom;
import java.util.Base64;

@Service
@Profile("local")
public class LocalEncryptionService implements KmsEncryptionService {

    private static final String ALGORITHM = "AES/GCM/NoPadding";
    private final byte[] keyBytes;
    private final SecureRandom secureRandom = new SecureRandom();

    public LocalEncryptionService(@Value("${security.encryption.key:}") String base64Key) {
        if (base64Key == null || base64Key.trim().isEmpty()) {
            // Default key for development if not provided via env/properties
            base64Key = Base64.getEncoder().encodeToString("12345678901234561234567890123456".getBytes());
        }
        try {
            this.keyBytes = Base64.getDecoder().decode(base64Key.trim());
            if (this.keyBytes.length != 16 && this.keyBytes.length != 24 && this.keyBytes.length != 32) {
                throw new IllegalArgumentException("Invalid key length: AES key must be 128, 192, or 256 bits.");
            }
        } catch (Exception e) {
            throw new IllegalArgumentException("Failed to decode base64 encryption key from security.encryption.key", e);
        }
    }

    @Override
    public String encrypt(String plainText) {
        if (plainText == null) {
            return null;
        }
        try {
            Cipher cipher = Cipher.getInstance(ALGORITHM);
            SecretKeySpec keySpec = new SecretKeySpec(this.keyBytes, "AES");
            byte[] iv = new byte[12];
            secureRandom.nextBytes(iv);
            GCMParameterSpec parameterSpec = new GCMParameterSpec(128, iv);
            
            cipher.init(Cipher.ENCRYPT_MODE, keySpec, parameterSpec);
            byte[] encryptedBytes = cipher.doFinal(plainText.getBytes(StandardCharsets.UTF_8));
            
            byte[] combined = new byte[iv.length + encryptedBytes.length];
            System.arraycopy(iv, 0, combined, 0, iv.length);
            System.arraycopy(encryptedBytes, 0, combined, iv.length, encryptedBytes.length);
            
            return Base64.getEncoder().encodeToString(combined);
        } catch (Exception e) {
            throw new IllegalStateException("Local AES Encryption failed", e);
        }
    }

    @Override
    public String decrypt(String cipherText) {
        if (cipherText == null) {
            return null;
        }
        try {
            byte[] combined = Base64.getDecoder().decode(cipherText);
            if (combined.length < 12) {
                throw new IllegalArgumentException("Invalid cipherText: too short to contain IV.");
            }
            byte[] iv = new byte[12];
            byte[] encryptedBytes = new byte[combined.length - 12];
            
            System.arraycopy(combined, 0, iv, 0, 12);
            System.arraycopy(combined, 12, encryptedBytes, 0, encryptedBytes.length);
            
            Cipher cipher = Cipher.getInstance(ALGORITHM);
            SecretKeySpec keySpec = new SecretKeySpec(this.keyBytes, "AES");
            GCMParameterSpec parameterSpec = new GCMParameterSpec(128, iv);
            
            cipher.init(Cipher.DECRYPT_MODE, keySpec, parameterSpec);
            byte[] decryptedBytes = cipher.doFinal(encryptedBytes);
            
            return new String(decryptedBytes, StandardCharsets.UTF_8);
        } catch (Exception e) {
            throw new IllegalStateException("Local AES Decryption failed", e);
        }
    }
}
