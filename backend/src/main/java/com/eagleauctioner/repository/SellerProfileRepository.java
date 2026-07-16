package com.eagleauctioner.repository;

import com.eagleauctioner.entity.SellerProfile;
import com.eagleauctioner.enums.SellerState;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface SellerProfileRepository extends JpaRepository<SellerProfile, UUID> {
    
    Optional<SellerProfile> findByUserId(UUID userId);
    
    List<SellerProfile> findByState(SellerState state);
    
    boolean existsByPanHash(String panHash);
    
    @Query("SELECT sp FROM SellerProfile sp JOIN FETCH sp.user u LEFT JOIN FETCH sp.company c WHERE sp.id = :id")
    Optional<SellerProfile> findByIdWithDetails(@Param("id") UUID id);

    @Query("SELECT sp FROM SellerProfile sp JOIN FETCH sp.user u LEFT JOIN FETCH sp.company c " +
           "WHERE (:state IS NULL OR sp.state = :state) " +
           "AND (:query IS NULL OR :query = '' " +
           "OR LOWER(c.companyName) LIKE LOWER(CONCAT('%', :query, '%')) " +
           "OR LOWER(c.registrationNumber) LIKE LOWER(CONCAT('%', :query, '%')) " +
           "OR LOWER(sp.panHash) = LOWER(:query))")
    List<SellerProfile> searchSellers(@Param("state") SellerState state, @Param("query") String query);
}
