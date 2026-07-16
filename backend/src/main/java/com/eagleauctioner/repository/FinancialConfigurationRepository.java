package com.eagleauctioner.repository;

import com.eagleauctioner.entity.FinancialConfiguration;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface FinancialConfigurationRepository extends JpaRepository<FinancialConfiguration, String> {
}
