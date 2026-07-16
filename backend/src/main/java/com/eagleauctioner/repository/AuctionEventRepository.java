package com.eagleauctioner.repository;

import com.eagleauctioner.entity.AuctionEvent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

/**
 * Repository interface for managing AuctionEvent entity persistence.
 */
@Repository
public interface AuctionEventRepository extends JpaRepository<AuctionEvent, UUID> {
    List<AuctionEvent> findByAuctionIdOrderByTimestampAsc(UUID auctionId);
    List<AuctionEvent> findByAuctionIdAndLotIdOrderByTimestampAsc(UUID auctionId, UUID lotId);
}
