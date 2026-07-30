package com.eagleauctioner.security;

import com.eagleauctioner.entity.PolicyRule;
import com.eagleauctioner.repository.PolicyRuleRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.expression.Expression;
import org.springframework.expression.ExpressionParser;
import org.springframework.expression.spel.standard.SpelExpressionParser;
import org.springframework.expression.spel.support.StandardEvaluationContext;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
public class AbacPolicyEngine {

    private final PolicyRuleRepository policyRuleRepository;
    private final ExpressionParser parser = new SpelExpressionParser();

    public boolean evaluatePolicy(String actionKey, Object targetContext) {
        List<PolicyRule> activeRules = policyRuleRepository.findByActionKeyAndIsActiveTrue(actionKey);
        if (activeRules.isEmpty()) {
            return true; // No dynamic ABAC constraints defined
        }

        StandardEvaluationContext context = new StandardEvaluationContext(targetContext);

        for (PolicyRule rule : activeRules) {
            try {
                Expression expression = parser.parseExpression(rule.getExpression());
                Boolean result = expression.getValue(context, Boolean.class);

                if (result == null || !result) {
                    log.warn("ABAC Policy Rule violation: rule '{}' for action '{}' evaluated to false", rule.getRuleName(), actionKey);
                    return false;
                }
            } catch (Exception ex) {
                log.error("Error evaluating ABAC Policy Rule '{}': {}", rule.getRuleName(), ex.getMessage());
                return false;
            }
        }

        return true;
    }
}
