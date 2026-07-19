package com.eagleauctioner.service.impl;

import com.eagleauctioner.context.AuditContext;
import com.eagleauctioner.dto.KycReviewRequest;
import com.eagleauctioner.entity.*;
import com.eagleauctioner.enums.BidderState;
import com.eagleauctioner.enums.ReviewDecision;
import com.eagleauctioner.enums.SellerState;
import com.eagleauctioner.enums.VerificationStatus;
import com.eagleauctioner.repository.*;
import com.eagleauctioner.service.KycService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.Instant;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class KycServiceImpl implements KycService {

    private final BidderProfileRepository bidderProfileRepository;
    private final SellerProfileRepository sellerProfileRepository;
    private final UserRepository userRepository;
    private final KycReviewRepository kycReviewRepository;
    private final SellerReviewRepository sellerReviewRepository;
    private final BidderStateHistoryRepository bidderStateHistoryRepository;
    private final SellerStateHistoryRepository sellerStateHistoryRepository;

    @Override
    @Transactional
    public KycReview reviewBidderKyc(UUID profileId, UUID reviewerId, KycReviewRequest request) {
        Instant startTime = Instant.now();
        BidderProfile profile = bidderProfileRepository.findById(profileId)
                .orElseThrow(() -> new IllegalArgumentException("Bidder profile not found"));

        User reviewer = userRepository.findById(reviewerId)
                .orElseThrow(() -> new IllegalArgumentException("Reviewer not found"));

        validateReviewer(reviewer);

        if (profile.getState() != BidderState.UNDER_REVIEW) {
            throw new IllegalStateException("Profile is not under review");
        }

        ReviewDecision decision = ReviewDecision.valueOf(request.decision().toUpperCase());
        BidderState targetState = (decision == ReviewDecision.APPROVED) ? BidderState.APPROVED : BidderState.REJECTED;

        BidderState previousState = profile.getState();
        profile.setState(targetState);
        
        if (targetState == BidderState.REJECTED) {
            profile.setRejectionReason(request.reviewNotes());
        } else {
            profile.setPanVerificationStatus(VerificationStatus.VERIFIED);
            profile.setPanVerifiedAt(Instant.now());
            profile.setAadhaarVerificationStatus(VerificationStatus.VERIFIED);
            profile.setAadhaarVerifiedAt(Instant.now());
        }
        
        bidderProfileRepository.save(profile);

        KycReview review = KycReview.builder()
                .bidderProfile(profile)
                .reviewer(reviewer)
                .previousState(previousState)
                .newState(targetState)
                .decision(decision)
                .reviewNotes(request.reviewNotes())
                .reviewerIp(AuditContext.getOptional().map(AuditContext::getIpAddress).orElse(null))
                .reviewDurationMs(Duration.between(startTime, Instant.now()).toMillis())
                .reviewedAt(Instant.now())
                .build();
        
        logBidderHistory(profile, previousState, targetState, reviewer, request.reviewNotes());
        return kycReviewRepository.save(review);
    }

    @Override
    @Transactional
    public com.eagleauctioner.entity.SellerReview reviewSellerKyc(UUID profileId, UUID reviewerId, KycReviewRequest request) {
        Instant startTime = Instant.now();
        SellerProfile profile = sellerProfileRepository.findById(profileId)
                .orElseThrow(() -> new IllegalArgumentException("Seller profile not found"));

        User reviewer = userRepository.findById(reviewerId)
                .orElseThrow(() -> new IllegalArgumentException("Reviewer not found"));

        validateReviewer(reviewer);

        if (profile.getState() != SellerState.UNDER_REVIEW) {
            throw new IllegalStateException("Profile is not under review");
        }

        ReviewDecision decision = ReviewDecision.valueOf(request.decision().toUpperCase());
        SellerState targetState = (decision == ReviewDecision.APPROVED) ? SellerState.APPROVED : SellerState.REJECTED;

        SellerState previousState = profile.getState();
        profile.setState(targetState);
        
        if (targetState == SellerState.REJECTED) {
            profile.setRejectionReason(request.reviewNotes());
        } else {
            profile.setPanVerificationStatus(VerificationStatus.VERIFIED);
            profile.setPanVerifiedAt(Instant.now());
        }
        
        sellerProfileRepository.save(profile);

        SellerReview review = SellerReview.builder()
                .sellerProfile(profile)
                .reviewer(reviewer)
                .previousState(previousState)
                .newState(targetState)
                .decision(decision)
                .reviewNotes(request.reviewNotes())
                .reviewedAt(Instant.now())
                .build();
        
        logSellerHistory(profile, previousState, targetState, reviewer, request.reviewNotes());
        return sellerReviewRepository.save(review);
    }

    private void validateReviewer(User reviewer) {
        boolean isAuthorized = reviewer.getRoles().stream().anyMatch(role -> 
            "ADMIN".equals(role.getName()) || "OPS".equals(role.getName())
        );
        if (!isAuthorized) {
            throw new AccessDeniedException("Unauthorized to perform reviews");
        }
    }

    private void logBidderHistory(BidderProfile profile, BidderState from, BidderState to, User actor, String reason) {
        bidderStateHistoryRepository.save(BidderStateHistory.builder()
                .bidderProfile(profile).fromState(from).toState(to).changedBy(actor).reason(reason).transitionedAt(Instant.now()).build());
    }

    private void logSellerHistory(SellerProfile profile, SellerState from, SellerState to, User actor, String reason) {
        sellerStateHistoryRepository.save(SellerStateHistory.builder()
                .sellerProfile(profile).fromState(from).toState(to).changedBy(actor).reason(reason).transitionedAt(Instant.now()).build());
    }
}
