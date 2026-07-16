package com.eagleauctioner.repository;

import com.eagleauctioner.entity.RefreshToken;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface RefreshTokenRepository extends JpaRepository<RefreshToken, UUID> {
    Optional<RefreshToken> findByTokenHash(String tokenHash);
    
    @Modifying(clearAutomatically = true)
    @Transactional
    @Query("UPDATE RefreshToken r SET r.revokedAt = CURRENT_TIMESTAMP WHERE r.tokenFamilyId = :familyId")
    void revokeFamily(String familyId);
}
