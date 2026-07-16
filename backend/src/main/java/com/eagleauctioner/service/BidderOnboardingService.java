package com.eagleauctioner.service;

import com.eagleauctioner.context.AuditContext;
import com.eagleauctioner.dto.*;
import com.eagleauctioner.entity.*;
import com.eagleauctioner.enums.*;
import com.eagleauctioner.event.*;
import com.eagleauctioner.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.retry.annotation.Retryable;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.HexFormat;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class BidderOnboardingService {

    private final BidderProfileRepository bidderProfileRepository;
    private final UserRepository userRepository;
    private final KycDocumentRepository kycDocumentRepository;
    private final KycReviewRepository kycReviewRepository;
    private final BidderStateHistoryRepository bidderStateHistoryRepository;
    private final OutboxEventRepository outboxEventRepository;
    private final BankVerificationProvider bankVerificationProvider;
    private final ApplicationEventPublisher eventPublisher;

    @Transactional(rollbackFor = Exception.class)
    @Retryable(
        retryFor = org.springframework.orm.ObjectOptimisticLockingFailureException.class,
        maxAttempts = 3
    )
    public BidderProfileResponse registerBidder(UUID userId, BidderRegistrationRequest request) {
        log.info("Starting bidder registration for userId: {}", userId);
        
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        if (bidderProfileRepository.findByUserId(userId).isPresent()) {
            throw new IllegalStateException("Bidder profile already exists for this user");
        }

        String panHash = generateSha256Hash(request.panNumber().toUpperCase().trim());
        String aadhaarHash = generateSha256Hash(request.rawAadhaar().replace("-", "").trim());

        if (bidderProfileRepository.existsByPanHash(panHash)) {
            throw new IllegalStateException("A bidder with this PAN is already registered");
        }
        if (bidderProfileRepository.existsByAadhaarHash(aadhaarHash)) {
            throw new IllegalStateException("A bidder with this Aadhaar is already registered");
        }

        BidderType profileType = BidderType.valueOf(request.bidderType().toUpperCase().trim());

        BidderProfile bidderProfile = BidderProfile.builder()
                .user(user)
                .state(BidderState.DRAFT)
                .bidderType(profileType)
                .panNumber(request.panNumber())
                .panHash(panHash)
                .panVerificationStatus(VerificationStatus.PENDING)
                .maskedAadhaar(maskAadhaar(request.rawAadhaar()))
                .aadhaarHash(aadhaarHash)
                .aadhaarVerificationStatus(VerificationStatus.PENDING)
                .bankAccounts(new ArrayList<>())
                .kycDocuments(new ArrayList<>())
                .kycReviews(new ArrayList<>())
                .build();

        if (BidderType.CORPORATE == profileType) {
            if (request.organizationName() == null || request.registrationNumber() == null) {
                throw new IllegalArgumentException("Organization details are required for corporate bidders");
            }
            Organization org = Organization.builder()
                    .bidderProfile(bidderProfile)
                    .organizationName(request.organizationName())
                    .organizationType(OrganizationType.PRIVATE_LIMITED) 
                    .registrationNumber(request.registrationNumber())
                    .gstin(request.gstin())
                    .gstVerificationStatus(VerificationStatus.PENDING)
                    .registeredAddress(request.registeredAddress())
                    .build();
            bidderProfile.setOrganization(org);
        }

        String accountHash = generateSha256Hash(request.accountNumber().trim());

        BankAccount bank = BankAccount.builder()
                .bidderProfile(bidderProfile)
                .accountHolderName(request.accountHolderName())
                .accountNumber(request.accountNumber())
                .accountHash(accountHash)
                .ifscCode(request.ifscCode().toUpperCase())
                .bankName(request.bankName())
                .branchName(request.branchName())
                .verificationStatus(VerificationStatus.PENDING)
                .bankAccountType(BankAccount.BankAccountType.SAVINGS)
                .isPrimary(true)
                .isVerified(false)
                .build();
        bidderProfile.getBankAccounts().add(bank);

        BidderProfile savedProfile = bidderProfileRepository.save(bidderProfile);
        
        logStateHistory(savedProfile, null, BidderState.DRAFT, user, "Initial profile creation");

        BidderCreatedEvent createdEvent = new BidderCreatedEvent(this, savedProfile.getId(), userId, savedProfile.getBidderType().name());
        eventPublisher.publishEvent(createdEvent);
        saveOutboxEvent(savedProfile.getId(), "BidderProfile", "BidderCreatedEvent", createdEvent);

        return mapToResponse(savedProfile);
    }

    @Transactional(rollbackFor = Exception.class)
    @Retryable(
        retryFor = org.springframework.orm.ObjectOptimisticLockingFailureException.class,
        maxAttempts = 3
    )
    public void submitKycDocuments(UUID profileId, UUID currentUserId, List<KycDocumentRequest> documentRequests) {
        BidderProfile bidderProfile = bidderProfileRepository.findById(profileId)
                .orElseThrow(() -> new IllegalArgumentException("Bidder profile not found"));

        if (!bidderProfile.getUser().getId().equals(currentUserId)) {
            throw new AccessDeniedException("IDOR Protection: Access Denied to profile resource");
        }

        validateStateTransition(bidderProfile.getState(), BidderState.KYC_PENDING);

        for (KycDocumentRequest req : documentRequests) {
            if (req.fileSize() <= 0 || req.fileSize() > 10 * 1024 * 1024) { 
                throw new IllegalArgumentException("Invalid file size: must be positive and less than 10MB");
            }
            if (req.mimeType() == null || (!req.mimeType().startsWith("image/") && !req.mimeType().equals("application/pdf"))) {
                throw new IllegalArgumentException("Unsupported file format: only PDF and images are allowed");
            }
            if (req.malwareDetected()) {
                throw new IllegalArgumentException("Malware scanning detected a security threat in: " + req.documentType());
            }

            if (kycDocumentRepository.existsByDocumentHash(req.documentHash())) {
                throw new IllegalStateException("Duplicate document detected: " + req.documentType());
            }

            KycDocument doc = KycDocument.builder()
                    .bidderProfile(bidderProfile)
                    .documentType(KycDocument.DocumentType.valueOf(req.documentType().toUpperCase()))
                    .storagePath(req.storagePath())
                    .documentHash(req.documentHash())
                    .verificationStatus(VerificationStatus.PENDING)
                    .mimeType(req.mimeType())
                    .fileSize(req.fileSize())
                    .build();
            kycDocumentRepository.save(doc);
        }

        BidderState previousState = bidderProfile.getState();
        bidderProfile.setState(BidderState.UNDER_REVIEW);
        bidderProfileRepository.save(bidderProfile);

        logStateHistory(bidderProfile, previousState, BidderState.UNDER_REVIEW, bidderProfile.getUser(), "KYC Documents submitted for review");
        
        KycSubmittedEvent kycEvent = new KycSubmittedEvent(this, bidderProfile.getId(), bidderProfile.getUser().getId());
        eventPublisher.publishEvent(kycEvent);
        saveOutboxEvent(bidderProfile.getId(), "BidderProfile", "KycSubmittedEvent", kycEvent);

        BidderStateTransitionEvent stateEvent = new BidderStateTransitionEvent(this, bidderProfile.getId(), bidderProfile.getUser().getId(), previousState, BidderState.UNDER_REVIEW, "Documents uploaded");
        eventPublisher.publishEvent(stateEvent);
        saveOutboxEvent(bidderProfile.getId(), "BidderProfile", "BidderStateTransitionEvent", stateEvent);
    }

    @Transactional(rollbackFor = Exception.class)
    @Retryable(
        retryFor = org.springframework.orm.ObjectOptimisticLockingFailureException.class,
        maxAttempts = 3
    )
    public void verifyBankAccountPennyDrop(UUID profileId, UUID currentUserId) {
        BidderProfile bidderProfile = bidderProfileRepository.findById(profileId)
                .orElseThrow(() -> new IllegalArgumentException("Bidder profile not found"));

        if (!bidderProfile.getUser().getId().equals(currentUserId)) {
            throw new AccessDeniedException("IDOR Protection: Access Denied to bank accounts resource");
        }

        List<BankAccount> bankAccounts = bidderProfile.getBankAccounts();
        if (bankAccounts == null || bankAccounts.isEmpty()) {
            throw new IllegalStateException("No bank account linked to this profile");
        }

        BankAccount primaryAccount = bankAccounts.stream()
                .filter(BankAccount::isPrimary)
                .findFirst()
                .orElse(bankAccounts.get(0));

        log.info("Requesting bank verification for Account: {} IFSC: {}", primaryAccount.getAccountNumber(), primaryAccount.getIfscCode());

        BankVerificationResult result = bankVerificationProvider.verify(primaryAccount);

        if (result.success()) {
            primaryAccount.setVerified(true);
            primaryAccount.setVerificationStatus(VerificationStatus.VERIFIED);
            primaryAccount.setVerifiedAt(Instant.now());
            primaryAccount.setVerificationProvider(result.providerName());
            primaryAccount.setPennyDropStatus(result.pennyDropStatus());
            primaryAccount.setPennyDropReference(result.referenceNumber());
            primaryAccount.setPennyDropTransactionId(result.transactionId());
            
            bidderProfileRepository.save(bidderProfile);

            BankAccountVerifiedEvent verifiedEvent = new BankAccountVerifiedEvent(this, bidderProfile.getId(), bidderProfile.getUser().getId(), maskAccountNumber(primaryAccount.getAccountNumber()), result.transactionId());
            eventPublisher.publishEvent(verifiedEvent);
            saveOutboxEvent(bidderProfile.getId(), "BidderProfile", "BankAccountVerifiedEvent", verifiedEvent);
        } else {
            primaryAccount.setVerificationStatus(VerificationStatus.FAILED);
            primaryAccount.setPennyDropStatus(result.pennyDropStatus());
            primaryAccount.setPennyDropReference(result.referenceNumber());
            bidderProfileRepository.save(bidderProfile);
            throw new IllegalStateException("Penny drop bank verification failed: " + result.pennyDropStatus());
        }
    }

    @Transactional(rollbackFor = Exception.class)
    @Retryable(
        retryFor = org.springframework.orm.ObjectOptimisticLockingFailureException.class,
        maxAttempts = 3
    )
    public void reviewKyc(UUID profileId, UUID reviewerId, KycReviewRequest request) {
        Instant startTime = Instant.now();
        BidderProfile bidderProfile = bidderProfileRepository.findById(profileId)
                .orElseThrow(() -> new IllegalArgumentException("Bidder profile not found"));

        User reviewer = userRepository.findById(reviewerId)
                .orElseThrow(() -> new IllegalArgumentException("Reviewer not found"));

        boolean isAuthorizedReviewer = reviewer.getRoles().stream().anyMatch(role -> 
            "ADMIN".equals(role.getName()) || "OPS".equals(role.getName()) ||
            "ROLE_ADMIN".equals(role.getName()) || "ROLE_OPS".equals(role.getName())
        );
        if (!isAuthorizedReviewer) {
            throw new AccessDeniedException("Access Denied: Only users with ROLE_ADMIN or ROLE_OPS can review KYC");
        }

        if (bidderProfile.getState() != BidderState.UNDER_REVIEW) {
            throw new IllegalStateException("Profile is not under review. Current state: " + bidderProfile.getState());
        }

        ReviewDecision decision = ReviewDecision.valueOf(request.decision().toUpperCase());
        BidderState targetState = (decision == ReviewDecision.APPROVED) ? BidderState.APPROVED : BidderState.REJECTED;
        
        validateStateTransition(bidderProfile.getState(), targetState);

        BidderState previousState = bidderProfile.getState();
        bidderProfile.setState(targetState);
        
        if (targetState == BidderState.REJECTED) {
            bidderProfile.setRejectionReason(request.reviewNotes());
            bidderProfile.setPanVerificationStatus(VerificationStatus.REJECTED);
            bidderProfile.setAadhaarVerificationStatus(VerificationStatus.REJECTED);
        } else {
            bidderProfile.setRejectionReason(null);
            bidderProfile.setPanVerificationStatus(VerificationStatus.VERIFIED);
            bidderProfile.setPanVerifiedAt(Instant.now());
            bidderProfile.setAadhaarVerificationStatus(VerificationStatus.VERIFIED);
            bidderProfile.setAadhaarVerifiedAt(Instant.now());
            if (bidderProfile.getOrganization() != null) {
                bidderProfile.getOrganization().setGstVerificationStatus(VerificationStatus.VERIFIED);
                bidderProfile.getOrganization().setGstVerifiedAt(Instant.now());
            }
        }
        
        bidderProfileRepository.save(bidderProfile);

        KycReview review = KycReview.builder()
                .bidderProfile(bidderProfile)
                .reviewer(reviewer)
                .previousState(previousState)
                .newState(targetState)
                .decision(decision)
                .reviewNotes(request.reviewNotes())
                .rejectionCode(targetState == BidderState.REJECTED ? "KYC_DOCS_UNSATISFACTORY" : null)
                .reviewerIp(AuditContext.get() != null ? AuditContext.get().getIpAddress() : null)
                .reviewDurationMs(Duration.between(startTime, Instant.now()).toMillis())
                .reviewedAt(Instant.now())
                .build();
        kycReviewRepository.save(review);

        logStateHistory(bidderProfile, previousState, targetState, reviewer, request.reviewNotes());

        BidderStateTransitionEvent stateTransitionEvent = new BidderStateTransitionEvent(this, bidderProfile.getId(), bidderProfile.getUser().getId(), previousState, targetState, request.reviewNotes());
        eventPublisher.publishEvent(stateTransitionEvent);
        saveOutboxEvent(bidderProfile.getId(), "BidderProfile", "BidderStateTransitionEvent", stateTransitionEvent);
        
        if (targetState == BidderState.APPROVED) {
            BidderApprovedEvent approvedEvent = new BidderApprovedEvent(this, bidderProfile.getId(), bidderProfile.getUser().getId());
            eventPublisher.publishEvent(approvedEvent);
            saveOutboxEvent(bidderProfile.getId(), "BidderProfile", "BidderApprovedEvent", approvedEvent);

            MembershipPendingEvent membershipEvent = new MembershipPendingEvent(this, bidderProfile.getId(), bidderProfile.getUser().getId());
            eventPublisher.publishEvent(membershipEvent);
            saveOutboxEvent(bidderProfile.getId(), "BidderProfile", "MembershipPendingEvent", membershipEvent);
        } else {
            BidderRejectedEvent rejectedEvent = new BidderRejectedEvent(this, bidderProfile.getId(), bidderProfile.getUser().getId(), request.reviewNotes());
            eventPublisher.publishEvent(rejectedEvent);
            saveOutboxEvent(bidderProfile.getId(), "BidderProfile", "BidderRejectedEvent", rejectedEvent);
        }
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

    private void validateStateTransition(BidderState current, BidderState target) {
        if (!current.canTransitionTo(target)) {
            throw new IllegalStateException(String.format("Invalid state transition from %s to %s", current, target));
        }
    }

    private void logStateHistory(BidderProfile profile, BidderState from, BidderState to, User actor, String reason) {
        BidderStateHistory history = BidderStateHistory.builder()
                .bidderProfile(profile)
                .fromState(from != null ? from : BidderState.DRAFT)
                .toState(to)
                .changedBy(actor)
                .reason(reason)
                .transitionedAt(Instant.now())
                .build();
        bidderStateHistoryRepository.save(history);
    }

    private String generateSha256Hash(String value) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hashBytes = digest.digest(value.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(hashBytes);
        } catch (NoSuchAlgorithmException e) {
            throw new RuntimeException("SHA-256 algorithm missing", e);
        }
    }

    private String maskAadhaar(String aadhaar) {
        if (aadhaar == null || aadhaar.length() < 4) return "XXXX-XXXX-XXXX";
        String digits = aadhaar.replace("-", "");
        return "XXXX-XXXX-" + digits.substring(digits.length() - 4);
    }

    private String maskAccountNumber(String accountNo) {
        if (accountNo == null || accountNo.length() < 4) return "XXXX";
        return "XXXX-XXXX-" + accountNo.substring(accountNo.length() - 4);
    }

    private BidderProfileResponse mapToResponse(BidderProfile bp) {
        BankAccount firstBank = bp.getBankAccounts().isEmpty() ? null : bp.getBankAccounts().get(0);
        return new BidderProfileResponse(
                bp.getId(),
                bp.getUser().getId(),
                bp.getUser().getEmail(),
                bp.getState(),
                bp.getBidderType().name(),
                "XXXXX" + bp.getPanNumber().substring(bp.getPanNumber().length() - 5),
                bp.getMaskedAadhaar(),
                bp.getPanVerificationStatus().name(),
                bp.getAadhaarVerificationStatus().name(),
                bp.getOrganization() != null ? new OrganizationDto(
                        bp.getOrganization().getId(),
                        bp.getOrganization().getOrganizationName(),
                        bp.getOrganization().getRegistrationNumber(),
                        bp.getOrganization().getGstin(),
                        bp.getOrganization().getRegisteredAddress()
                ) : null,
                firstBank != null ? new BankAccountDto(
                        firstBank.getId(),
                        firstBank.getAccountHolderName(),
                        maskAccountNumber(firstBank.getAccountNumber()),
                        firstBank.getIfscCode(),
                        firstBank.getBankName(),
                        firstBank.getBranchName(),
                        firstBank.isVerified(),
                        firstBank.getPennyDropTransactionId()
                ) : null,
                List.of(),
                bp.getRejectionReason(),
                bp.getCreatedAt(),
                bp.getUpdatedAt()
        );
    }
}
