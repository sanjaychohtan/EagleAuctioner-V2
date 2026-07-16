package com.eagleauctioner.service;

import com.eagleauctioner.entity.BankAccount;
import org.springframework.stereotype.Service;
import java.util.UUID;

@Service
public class SimulatedBankVerificationAdapter implements BankVerificationProvider {
    
    @Override
    public BankVerificationResult verify(BankAccount account) {
        // Simulate checking IFSC code pattern
        if (account.getIfscCode() == null || account.getIfscCode().length() != 11) {
            return new BankVerificationResult(
                false, 
                null, 
                "SimulatedBankProvider", 
                "FAILED", 
                "REF-ERR"
            );
        }
        
        String simulatedTxnId = "TXN-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
        return new BankVerificationResult(
            true, 
            simulatedTxnId, 
            "SimulatedBankProvider", 
            "SUCCESS", 
            "REF-" + System.currentTimeMillis()
        );
    }
}
