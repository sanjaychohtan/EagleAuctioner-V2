package com.eagleauctioner.test;

import com.eagleauctioner.controller.AuthController;
import com.eagleauctioner.service.AuthService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
public class AuctbizSecurityNegativeTests {

    @Mock
    private AuthService authService;

    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        AuthController authController = new AuthController(authService);
        mockMvc = MockMvcBuilders.standaloneSetup(authController).build();
    }

    @Test
    @DisplayName("Negative Security Test: Anonymous public registration cannot assign SELLER role")
    public void testPublicRegistrationBlocksSellerRoleAssignment() throws Exception {
        String payload = """
            {
                "email": "unauthorized-seller@eagle-auctioner.in",
                "mobile": "+919876543210",
                "password": "SecurePass@123",
                "userType": "SELLER"
            }
            """;

        mockMvc.perform(post("/api/v1/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(payload))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.message").value(org.hamcrest.Matchers.containsString("Public registration for requested role is disabled")));
    }

    @Test
    @DisplayName("Negative Security Test: Public seller self-registration endpoint returns HTTP 403 Forbidden")
    public void testPublicSellerEndpointIsDisabled() throws Exception {
        String payload = """
            {
                "email": "seller-self-reg@eagle-auctioner.in",
                "mobile": "+919876543211",
                "password": "SecurePass@123",
                "sellerDetails": {
                    "sellerType": "CORPORATE",
                    "panNumber": "ABCDE1234F"
                }
            }
            """;

        mockMvc.perform(post("/api/v1/auth/register-seller")
                .contentType(MediaType.APPLICATION_JSON)
                .content(payload))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.message").value(org.hamcrest.Matchers.containsString("Public Seller self-registration is disabled")));
    }

    @Test
    @DisplayName("Negative Security Test: Anonymous user cannot register SUPER_ADMIN or ADMIN role")
    public void testPublicRegistrationBlocksAdminRoleAssignment() throws Exception {
        String payload = """
            {
                "email": "malicious-admin@eagle-auctioner.in",
                "mobile": "+919876543212",
                "password": "SecurePass@123",
                "userType": "SUPER_ADMIN"
            }
            """;

        mockMvc.perform(post("/api/v1/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(payload))
                .andExpect(status().isForbidden());
    }
}
