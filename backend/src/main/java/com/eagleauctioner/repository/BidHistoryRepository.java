package com.eagleauctioner.repository;

import com.eagleauctioner.entity.BidHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface BidHistoryRepository extends JpaRepository<BidHistory, UUID> {
    List<BidHistory> findByAuctionLotIdOrderByTimestampDesc(UUID lotId);
}
