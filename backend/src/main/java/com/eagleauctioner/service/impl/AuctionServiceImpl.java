package com.eagleauctioner.service.impl;

import com.eagleauctioner.dto.AuctionDTOs.*;
import com.eagleauctioner.entity.Auction;
import com.eagleauctioner.entity.AuctionLot;
import com.eagleauctioner.entity.AuctionSettings;
import com.eagleauctioner.entity.SellerProfile;
import com.eagleauctioner.enums.*;
import com.eagleauctioner.repository.AuctionLotRepository;
import com.eagleauctioner.repository.AuctionRepository;
import com.eagleauctioner.repository.AuctionSettingsRepository;
import com.eagleauctioner.repository.SellerProfileRepository;
import com.eagleauctioner.service.AuctionService;
import com.eagleauctioner.service.AuctionValidationService;
import com.eagleauctioner.service.AuctionPublishService;
import com.eagleauctioner.service.DocumentNumberGeneratorService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuctionServiceImpl implements AuctionService {

    private final AuctionRepository auctionRepository;
    private final AuctionSettingsRepository auctionSettingsRepository;
    private final AuctionLotRepository auctionLotRepository;
    private final SellerProfileRepository sellerProfileRepository;
    private final DocumentNumberGeneratorService documentNumberGeneratorService;
    private final AuctionValidationService auctionValidationService;
    private final AuctionPublishService auctionPublishService;

    @Override
    @Transactional(rollbackFor = Exception.class)
    public AuctionResponse createAuction(CreateAuctionRequest request, UUID userId) {
        log.info("Creating auction with title: {}", request.getTitle());

        SellerProfile seller = sellerProfileRepository.findById(request.getSellerProfileId())
                .orElseThrow(() -> new IllegalArgumentException("Seller profile not found with ID: " + request.getSellerProfileId()));

        if (seller.getUser() != null && !seller.getUser().getId().equals(userId)) {
            throw new org.springframework.security.access.AccessDeniedException("Ownership verification failed: User does not own the specified seller profile");
        }

        String auctionNumber = documentNumberGeneratorService.generateNextNumber(DocumentType.AUCTION);

        Auction auction = Auction.builder()
                .auctionNumber(auctionNumber)
                .title(request.getTitle())
                .description(request.getDescription())
                .sellerProfile(seller)
                .state(AuctionState.DRAFT)
                .auctionType(request.getAuctionType())
                .visibility(request.getVisibility())
                .currency(request.getCurrency())
                .timezone(request.getTimezone())
                .registrationStart(request.getRegistrationStart())
                .registrationEnd(request.getRegistrationEnd())
                .inspectionStart(request.getInspectionStart())
                .inspectionEnd(request.getInspectionEnd())
                .auctionStart(request.getAuctionStart())
                .auctionEnd(request.getAuctionEnd())
                .reservePriceEnabled(request.getReservePriceEnabled() != null ? request.getReservePriceEnabled() : false)
                .autoExtensionEnabled(request.getAutoExtensionEnabled() != null ? request.getAutoExtensionEnabled() : false)
                .extensionMinutes(request.getExtensionMinutes())
                .lots(new ArrayList<>())
                .build();

        auction.validateSchedulingAndConfiguration();
        auctionValidationService.validateSellerOwnership(auction, request.getSellerProfileId(), userId);
        Auction savedAuction = auctionRepository.save(auction);

        AuctionSettings settings = AuctionSettings.builder()
                .auction(savedAuction)
                .anonymousBidding(false)
                .allowAutoExtension(savedAuction.isAutoExtensionEnabled())
                .extensionMinutes(savedAuction.getExtensionMinutes())
                .maxExtensions(5)
                .timezone(savedAuction.getTimezone())
                .reservePriceEnabled(savedAuction.isReservePriceEnabled())
                .allowProxyBid(false)
                .allowManualWinner(false)
                .allowSellerApproval(true)
                .allowBidWithdrawal(false)
                .allowRankDisplay(true)
                .showBidderNames(false)
                .registrationRequired(true)
                .emdRequired(false)
                .build();

        auctionSettingsRepository.save(settings);
        savedAuction.setSettings(settings);

        return mapToResponse(savedAuction);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public AuctionResponse updateAuction(UUID auctionId, UpdateAuctionRequest request, UUID sellerProfileId, UUID userId) {
        log.info("Updating auction draft ID: {}", auctionId);

        Auction auction = auctionRepository.findById(auctionId)
                .orElseThrow(() -> new IllegalArgumentException("Auction not found"));

        auctionValidationService.validateSellerOwnership(auction, sellerProfileId, userId);

        if (auction.getState() != AuctionState.DRAFT && auction.getState() != AuctionState.REJECTED) {
            throw new IllegalStateException("Only auctions in DRAFT or REJECTED state can be updated");
        }

        auction.setTitle(request.getTitle());
        auction.setDescription(request.getDescription());
        auction.setAuctionType(request.getAuctionType());
        auction.setVisibility(request.getVisibility());
        auction.setCurrency(request.getCurrency());
        auction.setTimezone(request.getTimezone());
        auction.setRegistrationStart(request.getRegistrationStart());
        auction.setRegistrationEnd(request.getRegistrationEnd());
        auction.setInspectionStart(request.getInspectionStart());
        auction.setInspectionEnd(request.getInspectionEnd());
        auction.setAuctionStart(request.getAuctionStart());
        auction.setAuctionEnd(request.getAuctionEnd());
        auction.setReservePriceEnabled(request.getReservePriceEnabled() != null ? request.getReservePriceEnabled() : false);
        auction.setAutoExtensionEnabled(request.getAutoExtensionEnabled() != null ? request.getAutoExtensionEnabled() : false);
        auction.setExtensionMinutes(request.getExtensionMinutes());

        auction.validateSchedulingAndConfiguration();
        Auction updated = auctionRepository.save(auction);

        return mapToResponse(updated);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public AuctionResponse updateSettings(UUID auctionId, UpdateSettingsRequest request, UUID sellerProfileId, UUID userId) {
        Auction auction = auctionRepository.findById(auctionId)
                .orElseThrow(() -> new IllegalArgumentException("Auction not found"));

        auctionValidationService.validateSellerOwnership(auction, sellerProfileId, userId);

        AuctionSettings settings = auctionSettingsRepository.findByAuctionId(auctionId)
                .orElseThrow(() -> new IllegalArgumentException("Auction settings not found"));

        settings.setAnonymousBidding(request.getAnonymousBidding() != null ? request.getAnonymousBidding() : settings.isAnonymousBidding());
        settings.setAllowAutoExtension(request.getAllowAutoExtension() != null ? request.getAllowAutoExtension() : settings.isAllowAutoExtension());
        settings.setExtensionMinutes(request.getExtensionMinutes() != null ? request.getExtensionMinutes() : settings.getExtensionMinutes());
        settings.setMaxExtensions(request.getMaxExtensions() != null ? request.getMaxExtensions() : settings.getMaxExtensions());
        settings.setBidIncrementType(request.getBidIncrementType() != null ? BidIncrementType.valueOf(request.getBidIncrementType()) : settings.getBidIncrementType());
        settings.setMinimumIncrement(request.getMinimumIncrement() != null ? request.getMinimumIncrement() : settings.getMinimumIncrement());
        settings.setReservePriceEnabled(request.getReservePriceEnabled() != null ? request.getReservePriceEnabled() : settings.isReservePriceEnabled());
        settings.setAllowProxyBid(request.getAllowProxyBid() != null ? request.getAllowProxyBid() : settings.isAllowProxyBid());
        settings.setAllowManualWinner(request.getAllowManualWinner() != null ? request.getAllowManualWinner() : settings.isAllowManualWinner());
        settings.setAllowSellerApproval(request.getAllowSellerApproval() != null ? request.getAllowSellerApproval() : settings.isAllowSellerApproval());
        settings.setAllowBidWithdrawal(request.getAllowBidWithdrawal() != null ? request.getAllowBidWithdrawal() : settings.isAllowBidWithdrawal());
        settings.setAllowRankDisplay(request.getAllowRankDisplay() != null ? request.getAllowRankDisplay() : settings.isAllowRankDisplay());
        settings.setShowBidderNames(request.getShowBidderNames() != null ? request.getShowBidderNames() : settings.isShowBidderNames());
        settings.setRegistrationRequired(request.getRegistrationRequired() != null ? request.getRegistrationRequired() : settings.isRegistrationRequired());
        settings.setEmdRequired(request.getEmdRequired() != null ? request.getEmdRequired() : settings.isEmdRequired());
        settings.setTimezone(request.getTimezone() != null ? request.getTimezone() : settings.getTimezone());

        auctionSettingsRepository.save(settings);
        return mapToResponse(auction);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public AuctionResponse submitForReview(UUID auctionId, UUID sellerProfileId, UUID userId) {
        Auction auction = auctionRepository.findById(auctionId)
                .orElseThrow(() -> new IllegalArgumentException("Auction not found"));

        auctionValidationService.validateSellerOwnership(auction, sellerProfileId, userId);
        auctionValidationService.validateStateTransition(auction.getState(), AuctionState.UNDER_REVIEW);
        auctionValidationService.validateForReview(auction);

        auction.setState(AuctionState.UNDER_REVIEW);
        Auction saved = auctionRepository.save(auction);
        return mapToResponse(saved);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public AuctionResponse approveAuction(UUID auctionId, String reviewerId) {
        Auction auction = auctionRepository.findById(auctionId)
                .orElseThrow(() -> new IllegalArgumentException("Auction not found"));

        auctionValidationService.validateStateTransition(auction.getState(), AuctionState.APPROVED);

        auction.setState(AuctionState.APPROVED);
        Auction saved = auctionRepository.save(auction);
        return mapToResponse(saved);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public AuctionResponse rejectAuction(UUID auctionId, String reviewerId) {
        Auction auction = auctionRepository.findById(auctionId)
                .orElseThrow(() -> new IllegalArgumentException("Auction not found"));

        auctionValidationService.validateStateTransition(auction.getState(), AuctionState.REJECTED);

        auction.setState(AuctionState.REJECTED);
        Auction saved = auctionRepository.save(auction);
        return mapToResponse(saved);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public AuctionResponse publishAuction(UUID auctionId, String publisherId) {
        return auctionPublishService.publish(auctionId, publisherId);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public AuctionResponse cancelAuction(UUID auctionId, String cancellerId) {
        Auction auction = auctionRepository.findById(auctionId)
                .orElseThrow(() -> new IllegalArgumentException("Auction not found"));

        auctionValidationService.validateStateTransition(auction.getState(), AuctionState.CANCELLED);

        auction.setState(AuctionState.CANCELLED);
        
        if (auction.getLots() != null) {
            for (AuctionLot lot : auction.getLots()) {
                lot.setLotStatus(AuctionLotStatus.CANCELLED);
            }
        }

        Auction saved = auctionRepository.save(auction);
        return mapToResponse(saved);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public AuctionResponse archiveAuction(UUID auctionId, String archiverId) {
        Auction auction = auctionRepository.findById(auctionId)
                .orElseThrow(() -> new IllegalArgumentException("Auction not found"));

        auctionValidationService.validateStateTransition(auction.getState(), AuctionState.ARCHIVED);

        auction.setState(AuctionState.ARCHIVED);
        Auction saved = auctionRepository.save(auction);
        return mapToResponse(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public AuctionResponse getAuctionDetails(UUID id) {
        Auction auction = auctionRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Auction not found"));
        return mapToResponse(auction);
    }

    private AuctionResponse mapToResponse(Auction auction) {
        AuctionSettingsResponse settingsDto = null;
        if (auction.getSettings() != null) {
            settingsDto = AuctionSettingsResponse.builder()
                    .id(auction.getSettings().getId())
                    .anonymousBidding(auction.getSettings().isAnonymousBidding())
                    .allowAutoExtension(auction.getSettings().isAllowAutoExtension())
                    .extensionMinutes(auction.getSettings().getExtensionMinutes() != null ? auction.getSettings().getExtensionMinutes() : 0)
                    .maxExtensions(auction.getSettings().getMaxExtensions() != null ? auction.getSettings().getMaxExtensions() : 0)
                    .bidIncrementType(auction.getSettings().getBidIncrementType() != null ? auction.getSettings().getBidIncrementType().name() : null)
                    .minimumIncrement(auction.getSettings().getMinimumIncrement())
                    .reservePriceEnabled(auction.getSettings().isReservePriceEnabled())
                    .allowProxyBid(auction.getSettings().isAllowProxyBid())
                    .allowManualWinner(auction.getSettings().isAllowManualWinner())
                    .allowSellerApproval(auction.getSettings().isAllowSellerApproval())
                    .allowBidWithdrawal(auction.getSettings().isAllowBidWithdrawal())
                    .allowRankDisplay(auction.getSettings().isAllowRankDisplay())
                    .showBidderNames(auction.getSettings().isShowBidderNames())
                    .registrationRequired(auction.getSettings().isRegistrationRequired())
                    .emdRequired(auction.getSettings().isEmdRequired())
                    .timezone(auction.getSettings().getTimezone())
                    .build();
        }

        List<AuctionLotResponse> lotsDto = new ArrayList<>();
        if (auction.getLots() != null) {
            lotsDto = auction.getLots().stream()
                    .map(lot -> AuctionLotResponse.builder()
                            .id(lot.getId())
                            .auctionId(auction.getId())
                            .lotNumber(lot.getLotNumber())
                            .title(lot.getTitle())
                            .description(lot.getDescription())
                            .materialCategory(lot.getMaterialCategory())
                            .quantity(lot.getQuantity() != null ? lot.getQuantity().longValue() : null)
                            .unitOfMeasure(lot.getUnitOfMeasure())
                            .startingPrice(lot.getStartingPrice())
                            .reservePrice(lot.getReservePrice())
                            .currentHighestBid(lot.getCurrentHighestBid())
                            .minimumIncrement(lot.getMinimumIncrement())
                            .currency(lot.getCurrency())
                            .lotStatus(lot.getLotStatus())
                            .winnerBidderId(lot.getWinnerBidder() != null ? lot.getWinnerBidder().getId() : null)
                            .displayOrder(lot.getDisplayOrder())
                            .build())
                    .collect(Collectors.toList());
        }

        return AuctionResponse.builder()
                .id(auction.getId())
                .auctionNumber(auction.getAuctionNumber())
                .title(auction.getTitle())
                .description(auction.getDescription())
                .sellerProfileId(auction.getSellerProfile() != null ? auction.getSellerProfile().getId() : null)
                .sellerCompanyName(auction.getSellerProfile() != null && auction.getSellerProfile().getCompany() != null ? auction.getSellerProfile().getCompany().getCompanyName() : null)
                .state(auction.getState())
                .auctionType(auction.getAuctionType())
                .visibility(auction.getVisibility())
                .currency(auction.getCurrency())
                .timezone(auction.getTimezone())
                .registrationStart(auction.getRegistrationStart())
                .registrationEnd(auction.getRegistrationEnd())
                .inspectionStart(auction.getInspectionStart())
                .inspectionEnd(auction.getInspectionEnd())
                .auctionStart(auction.getAuctionStart())
                .auctionEnd(auction.getAuctionEnd())
                .reservePriceEnabled(auction.isReservePriceEnabled())
                .autoExtensionEnabled(auction.isAutoExtensionEnabled())
                .extensionMinutes(auction.getExtensionMinutes())
                .settings(settingsDto)
                .lots(lotsDto)
                .createdAt(auction.getCreatedAt())
                .updatedAt(auction.getUpdatedAt())
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public PaginatedAuctionResponse listAuctions(int page, int size, String sortBy, String sortDir, String state, String type) {
        Sort sort = sortDir.equalsIgnoreCase("desc") ? Sort.by(sortBy).descending() : Sort.by(sortBy).ascending();
        Pageable pageable = PageRequest.of(page, size, sort);
        
        Page<Auction> auctionPage;
        
        if (state != null && !state.isEmpty() && type != null && !type.isEmpty()) {
            AuctionState auctionState = AuctionState.valueOf(state);
            AuctionType auctionType = AuctionType.valueOf(type);
            auctionPage = auctionRepository.findByStateAndAuctionType(auctionState, auctionType, pageable);
        } else if (state != null && !state.isEmpty()) {
            AuctionState auctionState = AuctionState.valueOf(state);
            auctionPage = auctionRepository.findByState(auctionState, pageable);
        } else if (type != null && !type.isEmpty()) {
            AuctionType auctionType = AuctionType.valueOf(type);
            auctionPage = auctionRepository.findByAuctionType(auctionType, pageable);
        } else {
            auctionPage = auctionRepository.findAll(pageable);
        }
        
        List<AuctionSummaryResponse> content = auctionPage.getContent().stream().map(auction -> 
            AuctionSummaryResponse.builder()
                .id(auction.getId())
                .auctionNumber(auction.getAuctionNumber())
                .title(auction.getTitle())
                .state(auction.getState())
                .auctionType(auction.getAuctionType())
                .visibility(auction.getVisibility())
                .auctionStart(auction.getAuctionStart())
                .auctionEnd(auction.getAuctionEnd())
                .lotCount(auction.getLots() != null ? auction.getLots().size() : 0)
                .build()
        ).collect(Collectors.toList());
        
        return PaginatedAuctionResponse.builder()
                .content(content)
                .pageNumber(auctionPage.getNumber())
                .pageSize(auctionPage.getSize())
                .totalElements(auctionPage.getTotalElements())
                .totalPages(auctionPage.getTotalPages())
                .last(auctionPage.isLast())
                .build();
    }
}
