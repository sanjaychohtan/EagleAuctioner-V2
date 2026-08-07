package com.eagleauctioner.service.impl;

import com.eagleauctioner.entity.*;
import com.eagleauctioner.enums.*;
import com.eagleauctioner.repository.*;
import com.eagleauctioner.service.DemoDataService;
import com.eagleauctioner.service.DocumentNumberGeneratorService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.*;

@Service
@Slf4j
@RequiredArgsConstructor
public class DemoDataServiceImpl implements DemoDataService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final SellerProfileRepository sellerProfileRepository;
    private final BidderProfileRepository bidderProfileRepository;
    private final AuctionRepository auctionRepository;
    private final AuctionLotRepository auctionLotRepository;
    private final BidRepository bidRepository;
    private final AuctionSettingsRepository auctionSettingsRepository;
    private final DocumentNumberGeneratorService documentNumberGeneratorService;
    private final PasswordEncoder passwordEncoder;

    @Override
    @Transactional
    public Map<String, Object> generateDemoData() {
        log.info("Executing Demo Data Generation requested by Super Admin...");

        int createdUsers = 0;
        int createdSellers = 0;
        int createdBuyers = 0;

        // 1. Seller User & Profile
        boolean sellerIsNew = userRepository.findByEmailIgnoreCaseAndDeletedAtIsNull("demo.seller@eagleauctioner.com").isEmpty();
        User sellerUser = getOrCreateDemoUser("demo.seller@eagleauctioner.com", "DemoSeller@123", UserType.SELLER, "Demo", "Seller", "ROLE_SELLER");
        if (sellerIsNew) createdUsers++;

        Optional<SellerProfile> existingSellerProfile = sellerProfileRepository.findByUserId(sellerUser.getId());
        SellerProfile sellerProfile;
        if (existingSellerProfile.isPresent()) {
            sellerProfile = existingSellerProfile.get();
        } else {
            sellerProfile = sellerProfileRepository.save(SellerProfile.builder()
                    .user(sellerUser)
                    .state(SellerState.APPROVED)
                    .sellerType(SellerType.CORPORATE)
                    .panNumber("ABCDE1234F")
                    .panHash("DEMOSELLERPANHASH123")
                    .panVerificationStatus(VerificationStatus.VERIFIED)
                    .onboardedAt(Instant.now())
                    .build());
            createdSellers++;
        }

        // 2. Buyer User & Profile
        boolean buyerIsNew = userRepository.findByEmailIgnoreCaseAndDeletedAtIsNull("demo.buyer@eagleauctioner.com").isEmpty();
        User buyerUser = getOrCreateDemoUser("demo.buyer@eagleauctioner.com", "DemoBuyer@123", UserType.BIDDER, "Demo", "Buyer", "ROLE_BIDDER");
        if (buyerIsNew) createdUsers++;

        Optional<BidderProfile> existingBidderProfile = bidderProfileRepository.findByUserId(buyerUser.getId());
        BidderProfile bidderProfile;
        if (existingBidderProfile.isPresent()) {
            bidderProfile = existingBidderProfile.get();
        } else {
            bidderProfile = bidderProfileRepository.save(BidderProfile.builder()
                    .user(buyerUser)
                    .state(BidderState.APPROVED)
                    .bidderType(BidderType.INDIVIDUAL)
                    .panNumber("FGHIJ5678K")
                    .panHash("DEMOBUYERPANHASH123")
                    .panVerificationStatus(VerificationStatus.VERIFIED)
                    .aadhaarVerificationStatus(VerificationStatus.VERIFIED)
                    .build());
            createdBuyers++;
        }

        // 3. Create Demo LIVE Auctions & Lots
        int createdAuctionsCount = 0;
        int createdLotsCount = 0;
        int createdBidsCount = 0;
        int duplicatesSkipped = 0;

        List<String> titles = List.of(
                "Industrial Machining Equipment & Heavy Duty Lathes",
                "Commercial Fleet Vehicles & Logistics Trucks",
                "High Precision Electronics & Testing Instruments"
        );

        for (int i = 0; i < titles.size(); i++) {
            String title = titles.get(i);
            String auctionNumber = "AUC-DEMO-" + (100 + i);

            Optional<Auction> existingOpt = auctionRepository.findByAuctionNumber(auctionNumber);
            if (existingOpt.isPresent()) {
                duplicatesSkipped++;
                continue;
            }

            Auction auction = Auction.builder()
                    .auctionNumber(auctionNumber)
                    .title(title)
                    .description("Live demo auction created for system demonstration.")
                    .sellerProfile(sellerProfile)
                    .state(AuctionState.LIVE)
                    .auctionType(AuctionType.FORWARD)
                    .visibility(AuctionVisibility.PUBLIC)
                    .currency("INR")
                    .timezone("Asia/Kolkata")
                    .registrationStart(Instant.now().minusSeconds(86400))
                    .registrationEnd(Instant.now().minusSeconds(7200))
                    .auctionStart(Instant.now().minusSeconds(3600))
                    .auctionEnd(Instant.now().plusSeconds(86400))
                    .reservePriceEnabled(false)
                    .autoExtensionEnabled(true)
                    .extensionMinutes(5)
                    .extensionCount(0)
                    .build();

            Auction savedAuction = auctionRepository.save(auction);
            createdAuctionsCount++;

            AuctionSettings settings = AuctionSettings.builder()
                    .auction(savedAuction)
                    .anonymousBidding(false)
                    .allowAutoExtension(true)
                    .extensionMinutes(5)
                    .maxExtensions(5)
                    .timezone("Asia/Kolkata")
                    .reservePriceEnabled(false)
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

            // Create Lots
            AuctionLot lot1 = AuctionLot.builder()
                    .auction(savedAuction)
                    .lotNumber("LOT-00" + ((i * 2) + 1))
                    .title(title + " - Primary Unit")
                    .description("High capacity primary unit in excellent working condition.")
                    .materialCategory("INDUSTRIAL")
                    .quantity(5L)
                    .unitOfMeasure("PCS")
                    .startingPrice(50000L)
                    .minimumIncrement(1000L)
                    .currency("INR")
                    .lotStatus(AuctionLotStatus.LIVE)
                    .currentHighestBid(52000L)
                    .winnerBidder(bidderProfile)
                    .build();

            AuctionLot lot2 = AuctionLot.builder()
                    .auction(savedAuction)
                    .lotNumber("LOT-00" + ((i * 2) + 2))
                    .title(title + " - Secondary Accessories")
                    .description("Complete set of secondary tooling and spare components.")
                    .materialCategory("ACCESSORIES")
                    .quantity(12L)
                    .unitOfMeasure("SETS")
                    .startingPrice(15000L)
                    .minimumIncrement(500L)
                    .currency("INR")
                    .lotStatus(AuctionLotStatus.LIVE)
                    .currentHighestBid(16000L)
                    .winnerBidder(bidderProfile)
                    .build();

            List<AuctionLot> savedLots = auctionLotRepository.saveAll(List.of(lot1, lot2));
            createdLotsCount += savedLots.size();

            // Place Demo Bids on saved lots
            Bid bid1 = Bid.builder()
                    .auctionLot(savedLots.get(0))
                    .bidderProfile(bidderProfile)
                    .bidAmount(52000L)
                    .bidTime(Instant.now().minusSeconds(1800))
                    .ipAddress("127.0.0.1")
                    .bidStatus(BidStatus.WINNING)
                    .build();

            Bid bid2 = Bid.builder()
                    .auctionLot(savedLots.get(1))
                    .bidderProfile(bidderProfile)
                    .bidAmount(16000L)
                    .bidTime(Instant.now().minusSeconds(1200))
                    .ipAddress("127.0.0.1")
                    .bidStatus(BidStatus.WINNING)
                    .build();

            bidRepository.saveAll(List.of(bid1, bid2));
            createdBidsCount += 2;
        }

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("status", "SUCCESS");
        response.put("message", "Demo data generated successfully");
        response.put("sellerEmail", sellerUser.getEmail());
        response.put("buyerEmail", buyerUser.getEmail());
        response.put("createdUsers", createdUsers);
        response.put("createdSellers", createdSellers);
        response.put("createdBuyers", createdBuyers);
        response.put("liveAuctionsCreated", createdAuctionsCount);
        response.put("lotsCreated", createdLotsCount);
        response.put("bidsCreated", createdBidsCount);
        response.put("duplicatesSkipped", duplicatesSkipped);

        log.info("Demo Data Generation complete: {}", response);
        return response;
    }

    private User getOrCreateDemoUser(String email, String defaultPassword, UserType userType, String firstName, String lastName, String roleName) {
        Role role = roleRepository.findByName(roleName)
                .orElseGet(() -> roleRepository.findByName(roleName.replace("ROLE_", "")).orElse(null));

        Optional<User> existingOpt = userRepository.findByEmailIgnoreCaseAndDeletedAtIsNull(email);
        if (existingOpt.isPresent()) {
            User user = existingOpt.get();
            if (role != null) {
                if (user.getRoles() == null) {
                    user.setRoles(new HashSet<>(Set.of(role)));
                    userRepository.save(user);
                } else if (!user.getRoles().contains(role)) {
                    user.getRoles().add(role);
                    userRepository.save(user);
                }
            }
            return user;
        }

        return userRepository.save(User.builder()
                .email(email)
                .password(passwordEncoder.encode(defaultPassword))
                .userType(userType)
                .isActive(true)
                .emailVerified(true)
                .isLocked(false)
                .failedLoginAttempts(0)
                .firstName(firstName)
                .lastName(lastName)
                .roles(role != null ? new HashSet<>(Set.of(role)) : new HashSet<>())
                .build());
    }
}
