package com.eagleauctioner.test;

import com.eagleauctioner.entity.PolicyRule;
import com.eagleauctioner.repository.PolicyRuleRepository;
import com.eagleauctioner.security.AbacPolicyEngine;
import com.eagleauctioner.security.SensitiveDataMasker;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Collections;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class EnterpriseSecurityHardeningTest {

    @Mock
    private PolicyRuleRepository policyRuleRepository;

    @InjectMocks
    private AbacPolicyEngine abacPolicyEngine;

    private SensitiveDataMasker masker;

    @BeforeEach
    void setUp() {
        masker = new SensitiveDataMasker();
    }

    @Test
    @DisplayName("ABAC Policy Engine should allow action when no active rules exist")
    void testAbacAllowsWhenNoRulesExist() {
        when(policyRuleRepository.findByActionKeyAndIsActiveTrue("auction.create")).thenReturn(Collections.emptyList());

        boolean allowed = abacPolicyEngine.evaluatePolicy("auction.create", null);

        assertTrue(allowed);
    }

    @Test
    @DisplayName("ABAC Policy Engine should evaluate SpEL rules correctly")
    void testAbacEvaluatesSpelRules() {
        PolicyRule rule = PolicyRule.builder()
                .ruleName("ALWAYS_TRUE")
                .actionKey("auction.create")
                .expression("1 == 1")
                .isActive(true)
                .build();

        when(policyRuleRepository.findByActionKeyAndIsActiveTrue("auction.create")).thenReturn(Collections.singletonList(rule));

        boolean allowed = abacPolicyEngine.evaluatePolicy("auction.create", null);

        assertTrue(allowed);
    }

    @Test
    @DisplayName("SensitiveDataMasker should mask email and mobile correctly")
    void testSensitiveDataMasker() {
        assertEquals("ad****@eagle.com", masker.maskEmail("admin@eagle.com"));
        assertEquals("987****10", masker.maskMobile("9876543210"));
        assertEquals("₹ ***,***.00", masker.maskFinancialValue("500000"));
    }
}
