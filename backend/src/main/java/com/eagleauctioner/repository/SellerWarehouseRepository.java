package com.eagleauctioner.repository;

import com.eagleauctioner.entity.SellerWarehouse;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface SellerWarehouseRepository extends JpaRepository<SellerWarehouse, UUID> {
    List<SellerWarehouse> findBySellerProfileId(UUID sellerProfileId);
    List<SellerWarehouse> findBySellerProfileIdAndIsPrimaryTrue(UUID sellerProfileId);
}
