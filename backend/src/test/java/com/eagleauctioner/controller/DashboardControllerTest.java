package com.eagleauctioner.controller;

import com.eagleauctioner.dto.DashboardDTOs.ExecutiveDashboardData;
import com.eagleauctioner.service.DashboardService;
import com.eagleauctioner.repository.UserRepository;
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

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private DashboardService dashboardService;

    @MockBean
    private UserRepository userRepository;

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
}
