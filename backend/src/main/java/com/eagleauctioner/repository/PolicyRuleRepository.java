package com.eagleauctioner.repository;

import com.eagleauctioner.entity.PolicyRule;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface PolicyRuleRepository extends JpaRepository<PolicyRule, UUID> {
    List<PolicyRule> findByActionKeyAndIsActiveTrue(String actionKey);
    List<PolicyRule> findByIsActiveTrue();
}
