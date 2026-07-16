package com.eagleauctioner.service;

import com.eagleauctioner.entity.BankAccount;

public interface BankVerificationProvider {
    BankVerificationResult verify(BankAccount account);
}
