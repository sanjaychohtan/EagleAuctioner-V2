package com.eagleauctioner.repository;

import com.eagleauctioner.entity.KycReview;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface KycReviewRepository extends JpaRepository<KycReview, UUID> {
    List<KycReview> findByBidderProfileIdOrderByReviewedAtDesc(UUID bidderProfileId);
}
