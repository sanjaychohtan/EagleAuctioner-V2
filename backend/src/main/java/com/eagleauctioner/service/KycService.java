package com.eagleauctioner.service;

import com.eagleauctioner.dto.KycReviewRequest;
import com.eagleauctioner.entity.BidderProfile;
import com.eagleauctioner.entity.KycReview;
import com.eagleauctioner.entity.SellerReview;
import com.eagleauctioner.entity.SellerProfile;
import com.eagleauctioner.entity.User;
import com.eagleauctioner.enums.BidderState;
import com.eagleauctioner.enums.SellerState;
import java.util.UUID;

public interface KycService {
    KycReview reviewBidderKyc(UUID profileId, UUID reviewerId, KycReviewRequest request);
    SellerReview reviewSellerKyc(UUID profileId, UUID reviewerId, KycReviewRequest request);
}
