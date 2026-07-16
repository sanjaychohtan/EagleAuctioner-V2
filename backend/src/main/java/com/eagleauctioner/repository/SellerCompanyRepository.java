package com.eagleauctioner.repository;

import com.eagleauctioner.entity.SellerCompany;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface SellerCompanyRepository extends JpaRepository<SellerCompany, UUID> {
    Optional<SellerCompany> findBySellerProfileId(UUID sellerProfileId);
}
