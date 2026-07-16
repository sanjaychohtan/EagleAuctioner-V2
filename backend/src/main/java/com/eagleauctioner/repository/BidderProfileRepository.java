package com.eagleauctioner.repository;

import com.eagleauctioner.entity.BidderProfile;
import com.eagleauctioner.enums.BidderState;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface BidderProfileRepository extends JpaRepository<BidderProfile, UUID> {
    
    Optional<BidderProfile> findByUserId(UUID userId);
    
    List<BidderProfile> findByState(BidderState state);
    
    boolean existsByAadhaarHash(String aadhaarHash);
    
    boolean existsByPanHash(String panHash);
    
    @Query("SELECT bp FROM BidderProfile bp JOIN FETCH bp.user u LEFT JOIN FETCH bp.organization o WHERE bp.id = :id")
    Optional<BidderProfile> findByIdWithDetails(@Param("id") UUID id);
}
