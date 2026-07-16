package com.eagleauctioner.repository;

import com.eagleauctioner.entity.SellerReview;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface SellerReviewRepository extends JpaRepository<SellerReview, UUID> {
    List<SellerReview> findBySellerProfileIdOrderByReviewedAtDesc(UUID sellerProfileId);
}
