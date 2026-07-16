package com.eagleauctioner.repository;

import com.eagleauctioner.entity.BidderStateHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface BidderStateHistoryRepository extends JpaRepository<BidderStateHistory, UUID> {
    List<BidderStateHistory> findByBidderProfileIdOrderByTransitionedAtDesc(UUID bidderProfileId);
}
