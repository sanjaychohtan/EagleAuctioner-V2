package com.eagleauctioner.test;

import com.eagleauctioner.dto.*;
import com.eagleauctioner.entity.*;
import com.eagleauctioner.enums.*;
import com.eagleauctioner.repository.*;
import com.eagleauctioner.service.BidderOnboardingService;
import com.eagleauctioner.service.SellerOnboardingService;
import com.eagleauctioner.service.KmsEncryptionService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.data.redis.core.RedisTemplate;
import org.redisson.api.RedissonClient;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Set;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
public class OnboardingIntegrationTest {

    @MockBean
    private RedissonClient redissonClient;

    @MockBean
    private RedisConnectionFactory redisConnectionFactory;

    @MockBean
    private RedisTemplate<String, Object> redisTemplate;

    @Autowired
    private BidderOnboardingService bidderOnboardingService;

    @Autowired
    private SellerOnboardingService sellerOnboardingService;

    @Autowired
    private BidderProfileRepository bidderProfileRepository;

    @Autowired
    private SellerProfileRepository sellerProfileRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    private User testBidder;
    private User testSeller;
    private User testAdmin;

    @BeforeEach
    void setUp() {
        Role adminRole = Role.builder().name("ROLE_ADMIN").build();
        roleRepository.save(adminRole);

        String encodedPassword = passwordEncoder.encode("hashedPwd");

        testBidder = User.builder()
                .email("bidder.test@eagle.com")
                .password(encodedPassword)
                .firstName("John")
                .lastName("Doe")
                .mobile("9876543210")
                .userType(UserType.BIDDER)
                .isActive(true)
                .build();
        userRepository.save(testBidder);

        testSeller = User.builder()
                .email("seller.test@eagle.com")
                .password(encodedPassword)
                .firstName("Jane")
                .lastName("Doe")
                .mobile("9876543211")
                .userType(UserType.SELLER)
                .isActive(true)
                .build();
        userRepository.save(testSeller);

        testAdmin = User.builder()
                .email("admin.test@eagle.com")
                .password(encodedPassword)
                .firstName("Admin")
                .lastName("User")
                .mobile("9000000001")
                .userType(UserType.ADMIN)
                .isActive(true)
                .roles(Set.of(adminRole))
                .build();
        userRepository.save(testAdmin);
    }

    @Test
    void testCompleteBidderOnboardingWorkflow() {
        // 1. Register Bidder Profile
        BidderRegistrationRequest registerRequest = new BidderRegistrationRequest(
                "INDIVIDUAL",
                "ABCDE1234F",
                "1234-5678-9012",
                null, null, null, null, // No organization for individual
                "John Doe",
                "10009988776655",
                "HDFC0000123",
                "HDFC Bank",
                "Mumbai Branch"
        );

        BidderProfileResponse profileResponse = bidderOnboardingService.registerBidder(testBidder.getId(), registerRequest);
        assertNotNull(profileResponse);
        assertEquals(BidderState.DRAFT, profileResponse.state());

        UUID profileId = profileResponse.id();

        // 2. Submit KYC Documents
        List<KycDocumentRequest> docs = List.of(
                new KycDocumentRequest("PAN", "/s3/pan.jpg", "hash_pan_file_123", 1024, "image/jpeg", false),
                new KycDocumentRequest("AADHAAR_FRONT", "/s3/aadhaar.jpg", "hash_aadhaar_file_123", 1024, "image/jpeg", false)
        );

        bidderOnboardingService.submitKycDocuments(profileId, testBidder.getId(), docs);
        
        BidderProfile profileAfterDocs = bidderProfileRepository.findById(profileId).orElseThrow();
        assertEquals(BidderState.UNDER_REVIEW, profileAfterDocs.getState());

        // 3. Verify Bank Account via simulated Penny Drop
        assertFalse(profileAfterDocs.getBankAccounts().get(0).isVerified());
        bidderOnboardingService.verifyBankAccountPennyDrop(profileId, testBidder.getId());
        
        BidderProfile profileAfterBank = bidderProfileRepository.findById(profileId).orElseThrow();
        assertTrue(profileAfterBank.getBankAccounts().get(0).isVerified());

        // 4. Admin KYC Review Approval
        KycReviewRequest reviewRequest = new KycReviewRequest("APPROVED", "All KYC documents verified successfully.");
        bidderOnboardingService.reviewKyc(profileId, testAdmin.getId(), reviewRequest);

        BidderProfile finalProfile = bidderProfileRepository.findById(profileId).orElseThrow();
        assertEquals(BidderState.APPROVED, finalProfile.getState());
        assertEquals(VerificationStatus.VERIFIED, finalProfile.getPanVerificationStatus());
        assertEquals(VerificationStatus.VERIFIED, finalProfile.getAadhaarVerificationStatus());
    }

    @Test
    void testCompleteSellerOnboardingWorkflow() {
        // 1. Register Seller Profile
        SellerRegistrationRequest registerRequest = new SellerRegistrationRequest(
                "CORPORATE",
                "ABCDE1234F",
                "Test Corp",
                "ORG123",
                "27ABCDE1234F1Z5",
                "123 Business St"
        );

        SellerProfileResponse profileResponse = sellerOnboardingService.registerSeller(testSeller.getId(), registerRequest);
        assertNotNull(profileResponse);
        assertEquals(SellerState.DRAFT, profileResponse.state());

        UUID profileId = profileResponse.id();

        // 2. Submit KYC Documents
        List<KycDocumentRequest> docs = List.of(
                new KycDocumentRequest("PAN", "/s3/pan.jpg", "hash_pan_file_123", 1024, "image/jpeg", false),
                new KycDocumentRequest("OTHER", "/s3/inc.jpg", "hash_inc_file_123", 1024, "image/jpeg", false)
        );

        sellerOnboardingService.submitDocuments(profileId, testSeller.getId(), docs);
        
        SellerProfile profileAfterDocs = sellerProfileRepository.findById(profileId).orElseThrow();
        assertEquals(SellerState.UNDER_REVIEW, profileAfterDocs.getState());

        // 3. Admin KYC Review Approval
        KycReviewRequest reviewRequest = new KycReviewRequest("APPROVED", "All KYC documents verified successfully.");
        sellerOnboardingService.reviewSeller(profileId, testAdmin.getId(), reviewRequest);

        SellerProfile finalProfile = sellerProfileRepository.findById(profileId).orElseThrow();
        assertEquals(SellerState.APPROVED, finalProfile.getState());
        assertEquals(VerificationStatus.VERIFIED, finalProfile.getPanVerificationStatus());
    }
}
