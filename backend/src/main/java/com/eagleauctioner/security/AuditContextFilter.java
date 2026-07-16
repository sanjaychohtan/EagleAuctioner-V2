package com.eagleauctioner.security;

import com.eagleauctioner.context.AuditContext;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.UUID;

/**
 * Enterprise OncePerRequestFilter managing thread-bound AuditContext lifecycle.
 * Prevents thread reuse leaks and stale contexts by ensuring clear() is always called.
 */
@Component
public class AuditContextFilter extends OncePerRequestFilter {

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain
    ) throws ServletException, IOException {

        String requestId = request.getHeader("X-Request-ID");
        if (requestId == null || requestId.isEmpty()) {
            requestId = "REQ_" + UUID.randomUUID().toString();
        }

        String correlationId = request.getHeader("X-Correlation-ID");
        if (correlationId == null || correlationId.isEmpty()) {
            correlationId = "CORR_" + UUID.randomUUID().toString();
        }

        String ipAddress = request.getRemoteAddr();
        if (ipAddress == null) {
            ipAddress = "UNKNOWN_IP";
        }

        String userAgent = request.getHeader("User-Agent");
        if (userAgent == null) {
            userAgent = "UNKNOWN_UA";
        }

        // Extract authenticated principal if available
        UUID actorId = null;
        String executor = "ANONYMOUS";

        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.isAuthenticated()) {
            executor = authentication.getName();
            Object principal = authentication.getPrincipal();
            
            // Attempt to extract dynamic Actor UUID if UserDetails/Principal exposes it
            if (principal instanceof com.eagleauctioner.entity.User) {
                actorId = ((com.eagleauctioner.entity.User) principal).getId();
            } else {
                // Fallback: extract ID using reflection if a getUserId or getId method exists
                try {
                    java.lang.reflect.Method getIdMethod = principal.getClass().getMethod("getId");
                    Object idObj = getIdMethod.invoke(principal);
                    if (idObj instanceof UUID) {
                        actorId = (UUID) idObj;
                    } else if (idObj instanceof String) {
                        actorId = UUID.fromString((String) idObj);
                    }
                } catch (Exception ignored) {
                    // Generate stable UUID from name for tracking anonymous/system actors
                    actorId = UUID.nameUUIDFromBytes(executor.getBytes());
                }
            }
        } else {
            // Generate unique random UUID for guest requests to completely prevent collisions
            actorId = UUID.randomUUID();
        }

        AuditContext context = AuditContext.builder()
                .actorId(actorId)
                .correlationId(correlationId)
                .ipAddress(ipAddress)
                .userAgent(userAgent)
                .requestId(requestId)
                .executor(executor)
                .build();

        AuditContext.set(context);

        try {
            filterChain.doFilter(request, response);
        } finally {
            AuditContext.clear();
        }
    }
}
