package com.eagleauctioner.repository;

import com.eagleauctioner.entity.TaxConfiguration;
import com.eagleauctioner.enums.TaxType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface TaxConfigurationRepository extends JpaRepository<TaxConfiguration, UUID> {
    List<TaxConfiguration> findByRegionCodeAndIsActiveTrue(String regionCode);
    Optional<TaxConfiguration> findByRegionCodeAndTaxNameAndIsActiveTrue(String regionCode, TaxType taxName);
}
