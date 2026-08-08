package com.eagleauctioner.controller;

import com.eagleauctioner.dto.DashboardDTOs.ExecutiveDashboardData;
import com.eagleauctioner.service.DashboardService;
import com.eagleauctioner.repository.UserRepository;
import com.eagleauctioner.security.JwtAuthenticationFilter;
import com.eagleauctioner.security.RateLimitingFilter;
import com.eagleauctioner.security.CustomAuthenticationEntryPoint;
import com.eagleauctioner.security.CustomAccessDeniedHandler;
import com.eagleauctioner.filter.IdempotencyFilter;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(DashboardController.class)
public class DashboardControllerTest {

    @org.springframework.boot.test.context.TestConfiguration
    @org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity
    static class SecurityTestConfig {}

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private DashboardService dashboardService;

    @MockBean
    private UserRepository userRepository;

    @MockBean
    private JwtAuthenticationFilter jwtAuthenticationFilter;

    @MockBean
    private RateLimitingFilter rateLimitingFilter;

    @MockBean
    private CustomAuthenticationEntryPoint customAuthenticationEntryPoint;

    @MockBean
    private CustomAccessDeniedHandler customAccessDeniedHandler;

    @MockBean
    private IdempotencyFilter idempotencyFilter;

    @org.junit.jupiter.api.BeforeEach
    void setUpFilters() throws Exception {
        org.mockito.Mockito.doAnswer(invocation -> {
            jakarta.servlet.ServletRequest req = invocation.getArgument(0);
            jakarta.servlet.ServletResponse res = invocation.getArgument(1);
            jakarta.servlet.FilterChain chain = invocation.getArgument(2);
            chain.doFilter(req, res);
            return null;
        }).when(jwtAuthenticationFilter).doFilter(
            org.mockito.ArgumentMatchers.any(),
            org.mockito.ArgumentMatchers.any(),
            org.mockito.ArgumentMatchers.any()
        );

        org.mockito.Mockito.doAnswer(invocation -> {
            jakarta.servlet.ServletRequest req = invocation.getArgument(0);
            jakarta.servlet.ServletResponse res = invocation.getArgument(1);
            jakarta.servlet.FilterChain chain = invocation.getArgument(2);
            chain.doFilter(req, res);
            return null;
        }).when(rateLimitingFilter).doFilter(
            org.mockito.ArgumentMatchers.any(),
            org.mockito.ArgumentMatchers.any(),
            org.mockito.ArgumentMatchers.any()
        );

        org.mockito.Mockito.doAnswer(invocation -> {
            jakarta.servlet.ServletRequest req = invocation.getArgument(0);
            jakarta.servlet.ServletResponse res = invocation.getArgument(1);
            jakarta.servlet.FilterChain chain = invocation.getArgument(2);
            chain.doFilter(req, res);
            return null;
        }).when(idempotencyFilter).doFilter(
            org.mockito.ArgumentMatchers.any(),
            org.mockito.ArgumentMatchers.any(),
            org.mockito.ArgumentMatchers.any()
        );
    }

    @Test
    @WithMockUser(roles = "EXECUTIVE")
    void testGetExecutiveDashboard_Success() throws Exception {
        when(dashboardService.getExecutiveDashboard(any(UUID.class))).thenReturn(new ExecutiveDashboardData());

        mockMvc.perform(get("/api/v1/analytics/dashboard/executive"))
                .andExpect(status().isOk());
    }

    @Test
    @WithMockUser(roles = "BUYER")
    void testGetExecutiveDashboard_Forbidden() throws Exception {
        mockMvc.perform(get("/api/v1/analytics/dashboard/executive"))
                .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(roles = "OPS_HEAD")
    void testGetOperationsDashboard_OpsHead_Success() throws Exception {
        when(dashboardService.getOperationsDashboard(any(UUID.class))).thenReturn(new com.eagleauctioner.dto.DashboardDTOs.OperationsDashboardData());

        mockMvc.perform(get("/api/v1/analytics/dashboard/operations"))
                .andExpect(status().isOk());
    }

    @Test
    @WithMockUser(roles = "SELLER")
    void testGetOperationsDashboard_Seller_Forbidden() throws Exception {
        mockMvc.perform(get("/api/v1/analytics/dashboard/operations"))
                .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(roles = "BUYER")
    void testGetOperationsDashboard_Buyer_Forbidden() throws Exception {
        mockMvc.perform(get("/api/v1/analytics/dashboard/operations"))
                .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(roles = "FINANCE")
    void testGetOperationsDashboard_Finance_Forbidden() throws Exception {
        mockMvc.perform(get("/api/v1/analytics/dashboard/operations"))
                .andExpect(status().isForbidden());
    }
}
