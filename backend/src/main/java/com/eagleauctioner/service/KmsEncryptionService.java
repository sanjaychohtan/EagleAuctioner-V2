package com.eagleauctioner.service;

public interface KmsEncryptionService {
    String encrypt(String plainText);
    String decrypt(String cipherText);
}
