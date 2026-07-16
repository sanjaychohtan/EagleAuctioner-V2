package com.eagleauctioner.repository;

import com.eagleauctioner.entity.AuctionSettings;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

/**
 * Repository interface for managing AuctionSettings entity persistence.
 */
@Repository
public interface AuctionSettingsRepository extends JpaRepository<AuctionSettings, UUID> {
    Optional<AuctionSettings> findByAuctionId(UUID auctionId);
}
