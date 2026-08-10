package com.eagleauctioner.service.impl;

import com.eagleauctioner.dto.OnboardingDTOs.*;
import com.eagleauctioner.entity.*;
import com.eagleauctioner.enums.*;
import com.eagleauctioner.repository.*;
import com.eagleauctioner.service.SellerOnboardingService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.Instant;
import java.util.HexFormat;
import java.util.List;
import java.util.Set;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class SellerOnboardingServiceImpl implements SellerOnboardingService {

    private final SellerProfileRepository sellerProfileRepository;
    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;
    private final SellerDocumentRepository sellerDocumentRepository;
    private final SellerStateHistoryRepository sellerStateHistoryRepository;
    private final SellerReviewRepository sellerReviewRepository;
    private final OutboxEventRepository outboxEventRepository;
    private final org.springframework.context.ApplicationEventPublisher eventPublisher;

    private static final SecureRandom RANDOM = new SecureRandom();

    @Override
    @Transactional
    public SellerProfileResponse registerSeller(UUID userId, SellerRegistrationRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        if (sellerProfileRepository.findByUserId(userId).isPresent()) {
            throw new IllegalStateException("Seller profile already exists");
        }

        String rawPan = (request.panNumber() != null && !request.panNumber().isBlank()) ? request.panNumber().toUpperCase().trim() : "PANSL" + RANDOM.nextInt(10000) + "X";
        String panHash = generateSha256Hash(rawPan);
        if (sellerProfileRepository.existsByPanHash(panHash)) {
            throw new IllegalStateException("PAN already registered");
        }

        String tempSellerId = "TMP-SELLER-" + String.format("%05d", RANDOM.nextInt(100000));

        SellerProfile profile = SellerProfile.builder()
                .user(user)
                .state(SellerState.DRAFT)
                .sellerType(SellerType.valueOf(request.sellerType().toUpperCase()))
                .tempSellerId(tempSellerId)
                .panNumber(rawPan)
                .panHash(panHash)
                .panVerificationStatus(VerificationStatus.PENDING)
                .build();

        if (SellerType.CORPORATE == profile.getSellerType() || request.companyName() != null) {
            SellerCompany company = SellerCompany.builder()
                    .sellerProfile(profile)
                    .companyName(request.companyName() != null ? request.companyName() : "Seller Company")
                    .registrationNumber(request.registrationNumber() != null ? request.registrationNumber() : ("REG-" + RANDOM.nextInt(10000)))
                    .gstin(request.gstin())
                    .registeredAddress(request.registeredAddress())
                    .build();
            profile.setCompany(company);
        }

        SellerProfile saved = sellerProfileRepository.save(profile);
        logHistory(saved, SellerState.DRAFT, SellerState.DRAFT, user, "Initial registration");

        com.eagleauctioner.event.SellerCreatedEvent createdEvent = 
                new com.eagleauctioner.event.SellerCreatedEvent(this, saved.getId(), userId, saved.getSellerType().name());
        eventPublisher.publishEvent(createdEvent);
        saveOutboxEvent(saved.getId(), "SellerProfile", "SellerCreatedEvent", createdEvent);

        return mapToResponse(saved);
    }

    @Override
    @Transactional
    public SellerProfileResponse createSellerInternal(UUID creatorId, InternalSellerCreateRequest request) {
        User creator = userRepository.findById(creatorId)
                .orElseThrow(() -> new IllegalArgumentException("Creator not found"));

        if (userRepository.findByEmail(request.email().trim().toLowerCase()).isPresent()) {
            throw new IllegalStateException("User with this email already exists");
        }

        Role sellerRole = roleRepository.findByName("SELLER")
                .orElseThrow(() -> new IllegalStateException("SELLER role not found in system"));

        User newUser = User.builder()
                .email(request.email().trim().toLowerCase())
                .mobile(request.mobile().trim())
                .password(passwordEncoder.encode("SellerTemp@" + RANDOM.nextInt(10000)))
                .userType(UserType.SELLER)
                .roles(Set.of(sellerRole))
                .isActive(true)
                .emailVerified(true)
                .mobileVerified(true)
                .createdBy(creator.getEmail())
                .build();
        User savedUser = userRepository.save(newUser);

        String tempSellerId = "TMP-SELLER-" + String.format("%05d", RANDOM.nextInt(100000));
        String rawPan = (request.panNumber() != null && !request.panNumber().isBlank()) ? request.panNumber().toUpperCase().trim() : "SLPAN" + String.format("%04d", RANDOM.nextInt(10000)) + "Z";
        String panHash = generateSha256Hash(rawPan);

        SellerProfile profile = SellerProfile.builder()
                .user(savedUser)
                .state(SellerState.DRAFT)
                .sellerType(SellerType.valueOf(request.sellerType().toUpperCase()))
                .tempSellerId(tempSellerId)
                .panNumber(rawPan)
                .panHash(panHash)
                .panVerificationStatus(VerificationStatus.PENDING)
                .build();

        SellerCompany company = SellerCompany.builder()
                .sellerProfile(profile)
                .companyName(request.companyName())
                .gstin(request.gstin())
                .registeredAddress(request.registeredAddress())
                .build();
        profile.setCompany(company);

        SellerProfile saved = sellerProfileRepository.save(profile);
        logHistory(saved, null, SellerState.DRAFT, creator, "Internal Seller Creation by AUCTBIZ staff");

        return mapToResponse(saved);
    }

    @Override
    @Transactional
    public void submitDocuments(UUID profileId, UUID userId, List<KycDocumentRequest> documents) {
        SellerProfile profile = sellerProfileRepository.findById(profileId)
                .orElseThrow(() -> new IllegalArgumentException("Seller profile not found"));

        if (!profile.getUser().getId().equals(userId)) {
            throw new AccessDeniedException("Access Denied");
        }

        SellerState oldState = profile.getState();

        for (KycDocumentRequest req : documents) {
            if (req.fileSize() <= 0 || req.fileSize() > 10 * 1024 * 1024) {
                throw new IllegalArgumentException("Invalid file size: must be positive and less than 10MB");
            }
            if (req.mimeType() == null || (!req.mimeType().startsWith("image/") && !req.mimeType().equals("application/pdf"))) {
                throw new IllegalArgumentException("Unsupported file format: only PDF and images are allowed");
            }
            if (req.malwareDetected()) {
                throw new IllegalArgumentException("Malware scanning detected a security threat in: " + req.documentType());
            }

            SellerDocument doc = SellerDocument.builder()
                    .sellerProfile(profile)
                    .documentType(SellerDocumentType.valueOf(req.documentType().toUpperCase()))
                    .storagePath(req.storagePath())
                    .documentHash(req.documentHash())
                    .verificationStatus(VerificationStatus.PENDING)
                    .mimeType(req.mimeType())
                    .fileSize(req.fileSize())
                    .build();
            sellerDocumentRepository.save(doc);
        }

        profile.setState(SellerState.UNDER_REVIEW);
        sellerProfileRepository.save(profile);
        logHistory(profile, oldState, SellerState.UNDER_REVIEW, profile.getUser(), "Documents submitted");

        com.eagleauctioner.event.SellerStateTransitionEvent stateEvent = 
                new com.eagleauctioner.event.SellerStateTransitionEvent(this, profile.getId(), profile.getUser().getId(), oldState, SellerState.UNDER_REVIEW, "Documents uploaded");
        eventPublisher.publishEvent(stateEvent);
        saveOutboxEvent(profile.getId(), "SellerProfile", "SellerStateTransitionEvent", stateEvent);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void reviewSeller(UUID profileId, UUID reviewerId, KycReviewRequest request) {
        SellerProfile profile = sellerProfileRepository.findById(profileId)
                .orElseThrow(() -> new IllegalArgumentException("Seller profile not found"));

        User reviewer = userRepository.findById(reviewerId)
                .orElseThrow(() -> new IllegalArgumentException("Reviewer not found"));

        ReviewDecision decision = ReviewDecision.valueOf(request.decision().toUpperCase());
        SellerState targetState = (decision == ReviewDecision.APPROVED) ? SellerState.APPROVED : SellerState.REJECTED;

        SellerState previousState = profile.getState();
        profile.setState(targetState);

        if (targetState == SellerState.REJECTED) {
            profile.setRejectionReason(request.reviewNotes());
            profile.setPanVerificationStatus(VerificationStatus.REJECTED);
        } else {
            profile.setRejectionReason(null);
            profile.setPanVerificationStatus(VerificationStatus.VERIFIED);
            profile.setPanVerifiedAt(Instant.now());
            profile.setOnboardedAt(Instant.now());
            if (profile.getSellerCode() == null) {
                profile.setSellerCode("AUC-CUST-" + String.format("%05d", RANDOM.nextInt(100000)));
            }
            if (profile.getCompany() != null) {
                profile.getCompany().setGstVerificationStatus(VerificationStatus.VERIFIED);
                profile.getCompany().setGstVerifiedAt(Instant.now());
            }
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
        sellerReviewRepository.save(review);

        logHistory(profile, previousState, targetState, reviewer, request.reviewNotes());

        if (targetState == SellerState.APPROVED) {
            com.eagleauctioner.event.SellerApprovedEvent approvedEvent = 
                    new com.eagleauctioner.event.SellerApprovedEvent(this, profile.getId(), profile.getUser().getId());
            eventPublisher.publishEvent(approvedEvent);
            saveOutboxEvent(profile.getId(), "SellerProfile", "SellerApprovedEvent", approvedEvent);
        }
    }

    @Override
    @Transactional(readOnly = true)
    public List<SellerProfileResponse> searchSellers(SellerState state, String query) {
        String trimmedQuery = (query != null) ? query.trim() : null;
        List<SellerProfile> results = sellerProfileRepository.searchSellers(state, trimmedQuery);
        return results.stream().map(this::mapToResponse).toList();
    }

    @Override
    @Transactional(readOnly = true)
    public SellerProfileResponse getSellerByUserId(UUID userId) {
        SellerProfile profile = sellerProfileRepository.findByUserId(userId)
                .orElseThrow(() -> new IllegalArgumentException("Seller profile not found for userId: " + userId));
        return mapToResponse(profile);
    }

    private void logHistory(SellerProfile profile, SellerState from, SellerState to, User actor, String reason) {
        sellerStateHistoryRepository.save(SellerStateHistory.builder()
                .sellerProfile(profile)
                .fromState(from)
                .toState(to)
                .changedBy(actor)
                .reason(reason)
                .transitionedAt(Instant.now())
                .build());
    }

    private void saveOutboxEvent(UUID aggregateId, String aggregateType, String eventType, Object payload) {
        try {
            String jsonPayload = String.format("{\"aggregateId\":\"%s\",\"eventType\":\"%s\",\"timestamp\":\"%s\"}", aggregateId, eventType, Instant.now());
            OutboxEvent outbox = OutboxEvent.builder()
                    .aggregateId(aggregateId)
                    .aggregateType(aggregateType)
                    .eventType(eventType)
                    .payload(jsonPayload)
                    .createdAt(Instant.now())
                    .processed(false)
                    .status("PENDING")
                    .retryCount(0)
                    .build();
            outboxEventRepository.save(outbox);
        } catch (Exception e) {
            log.error("Outbox logging failed: ", e);
        }
    }

    private String generateSha256Hash(String value) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hashBytes = digest.digest(value.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(hashBytes);
        } catch (NoSuchAlgorithmException e) {
            throw new RuntimeException(e);
        }
    }

    private SellerProfileResponse mapToResponse(SellerProfile p) {
        String maskedPan = "XXXXX";
        if (p.getPanNumber() != null && p.getPanNumber().length() >= 5) {
            maskedPan = "XXXXX" + p.getPanNumber().substring(p.getPanNumber().length() - 5);
        }
        String companyName = p.getCompany() != null ? p.getCompany().getCompanyName() : null;

        return new SellerProfileResponse(
                p.getId(),
                p.getUser().getId(),
                p.getState(),
                p.getSellerType().name(),
                p.getSellerCode(),
                p.getTempSellerId(),
                companyName,
                maskedPan,
                p.getOnboardedAt(),
                p.getCreatedAt()
        );
    }
}
