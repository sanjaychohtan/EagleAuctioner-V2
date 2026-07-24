package com.eagleauctioner.mapper;

import com.eagleauctioner.dto.AuctionDTOs.*;
import com.eagleauctioner.entity.Auction;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Component
public class AuctionMapper {

    public AuctionResponse mapToResponse(Auction auction) {
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
}
