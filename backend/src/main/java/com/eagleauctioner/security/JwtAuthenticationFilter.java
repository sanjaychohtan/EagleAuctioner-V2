package com.eagleauctioner.security;

import com.eagleauctioner.service.JwtService;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.lang.NonNull;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtService jwtService;
    private final UserDetailsService userDetailsService;

    public JwtAuthenticationFilter(JwtService jwtService, @org.springframework.context.annotation.Lazy UserDetailsService userDetailsService) {
        this.jwtService = jwtService;
        this.userDetailsService = userDetailsService;
    }

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        String path = request.getServletPath();
        String uri = request.getRequestURI();
        return path.startsWith("/swagger-ui") || uri.startsWith("/swagger-ui")
            || path.startsWith("/v3/api-docs") || uri.startsWith("/v3/api-docs")
            || path.startsWith("/swagger-resources") || uri.startsWith("/swagger-resources")
            || path.startsWith("/webjars") || uri.startsWith("/webjars")
            || path.equals("/swagger-ui.html") || uri.equals("/swagger-ui.html")
            || path.equals("/actuator/health") || uri.equals("/actuator/health")
            || path.equals("/error") || uri.equals("/error")
            || path.startsWith("/api/v1/auth") || uri.startsWith("/api/v1/auth");
    }

    @Override
    protected void doFilterInternal(
            @NonNull HttpServletRequest request,
            @NonNull HttpServletResponse response,
            @NonNull FilterChain filterChain
    ) throws ServletException, IOException {
        final String authHeader = request.getHeader("Authorization");
        final String jwt;
        final String userEmail;
        
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            filterChain.doFilter(request, response);
            return;
        }
        
        jwt = authHeader.substring(7);
        try {
            userEmail = jwtService.extractUsername(jwt);
            
            if (userEmail != null && SecurityContextHolder.getContext().getAuthentication() == null) {
                UserDetails userDetails = this.userDetailsService.loadUserByUsername(userEmail);
                
                if (!userDetails.isEnabled() || !userDetails.isAccountNonLocked() || !userDetails.isAccountNonExpired() || !userDetails.isCredentialsNonExpired()) {
                    response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                    response.setContentType("application/json");
                    response.getWriter().write("{\"success\":false,\"message\":\"Unauthorized: User account is suspended, locked or credentials expired\"}");
                    return;
                }

                if (jwtService.validateAccessToken(jwt, userDetails)) {
                    UsernamePasswordAuthenticationToken authToken = new UsernamePasswordAuthenticationToken(
                            userDetails,
                            null,
                            userDetails.getAuthorities()
                    );
                    authToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                    SecurityContextHolder.getContext().setAuthentication(authToken);
                    
                    request.setAttribute("userIp", request.getRemoteAddr());
                    request.setAttribute("userAgent", request.getHeader("User-Agent"));
                } else {
                    response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                    response.setContentType("application/json");
                    response.getWriter().write("{\"success\":false,\"message\":\"Unauthorized: Token validation failed\"}");
                    return;
                }
            }
        } catch (Exception ex) {
            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            response.setContentType("application/json");
            response.getWriter().write("{\"success\":false,\"message\":\"Unauthorized: Authentication failed: " + ex.getMessage().replace("\"", "\\\"") + "\"}");
            return;
        }
        
        filterChain.doFilter(request, response);
    }
}
