package com.eagleauctioner.bootstrap;

import com.eagleauctioner.controller.AuctionController;
import com.eagleauctioner.controller.DemoDataController;
import com.eagleauctioner.dto.AuctionDTOs.PaginatedAuctionResponse;
import com.eagleauctioner.entity.User;
import com.eagleauctioner.enums.UserType;
import com.eagleauctioner.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.redisson.api.RedissonClient;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest(properties = {
    "eagle.demo-data.enabled=true"
})
@ActiveProfiles("test")
@Transactional
public class DemoDataGeneratorIntegrationTest {

    @MockBean
    private RedissonClient redissonClient;

    @MockBean
    private RedisConnectionFactory redisConnectionFactory;

    @MockBean
    private RedisTemplate<String, Object> redisTemplate;

    @MockBean
    private StringRedisTemplate stringRedisTemplate;

    @Autowired(required = false)
    private DemoDataController demoDataController;

    @Autowired
    private AuctionController auctionController;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Test
    void testDemoDataGenerationAndMarketplaceVisibility() {
        System.out.println("=== DEMO DATA GENERATION INTEGRATION TEST START ===");

        // Verify endpoint is enabled when eagle.demo-data.enabled=true
        assertNotNull(demoDataController, "DemoDataController bean must exist when eagle.demo-data.enabled=true");

        // Setup Super Admin context
        User superAdmin = userRepository.findByEmailIgnoreCaseAndDeletedAtIsNull("admin@eagleauctioner.com")
                .orElseGet(() -> userRepository.save(User.builder()
                        .email("admin@eagleauctioner.com")
                        .password(passwordEncoder.encode("Admin@123"))
                        .userType(UserType.ADMIN)
                        .isActive(true)
                        .emailVerified(true)
                        .build()));

        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(
                        superAdmin.getEmail(),
                        null,
                        List.of(new SimpleGrantedAuthority("ROLE_SUPER_ADMIN"))
                )
        );

        // Execute Demo Data Generation API (Initial Execution)
        ResponseEntity<Map<String, Object>> response = demoDataController.generateDemoData();
        assertEquals(200, response.getStatusCode().value());

        Map<String, Object> result = response.getBody();
        assertNotNull(result);
        assertEquals(true, result.get("success"));
        assertEquals("Demo data generated successfully", result.get("message"));

        @SuppressWarnings("unchecked")
        Map<String, Object> data = (Map<String, Object>) result.get("data");
        assertNotNull(data);
        int createdAuctions = (int) data.get("createdAuctions");
        assertTrue(createdAuctions > 0, "Initial run must create demo auctions");

        System.out.println("Demo Data Generation Response Summary: " + data);

        // Verify Idempotency: Re-running API must NOT duplicate auctions
        ResponseEntity<Map<String, Object>> secondResponse = demoDataController.generateDemoData();
        assertEquals(200, secondResponse.getStatusCode().value());
        Map<String, Object> secondResult = secondResponse.getBody();
        assertNotNull(secondResult);
        
        @SuppressWarnings("unchecked")
        Map<String, Object> secondData = (Map<String, Object>) secondResult.get("data");
        assertNotNull(secondData);
        assertEquals(0, secondData.get("createdAuctions"), "Second execution must be idempotent (0 new auctions created)");
        assertTrue((int) secondData.get("duplicatesSkipped") > 0, "Second execution must report duplicates skipped");

        // Verify Marketplace Visibility for LIVE auctions
        ResponseEntity<PaginatedAuctionResponse> liveAuctionsResponse = auctionController.listAuctions(0, 10, "createdAt", "desc", "LIVE", null);
        assertEquals(200, liveAuctionsResponse.getStatusCode().value());

        PaginatedAuctionResponse paginated = liveAuctionsResponse.getBody();
        assertNotNull(paginated);
        assertTrue(paginated.getContent().size() > 0, "LIVE auctions must be visible in marketplace query!");

        System.out.println("Marketplace LIVE Auction Query returned " + paginated.getContent().size() + " items (Total: " + paginated.getTotalElements() + ")");
        System.out.println("=== DEMO DATA GENERATION INTEGRATION TEST END ===");
    }
}
