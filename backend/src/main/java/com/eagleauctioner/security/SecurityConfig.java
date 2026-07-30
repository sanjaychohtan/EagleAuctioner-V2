package com.eagleauctioner.security;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.Arrays;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthFilter;
    private final RateLimitingFilter rateLimitingFilter;
    private final org.springframework.core.env.Environment env;
    private final CustomAuthenticationEntryPoint authenticationEntryPoint;
    private final CustomAccessDeniedHandler accessDeniedHandler;
    private final EnterprisePermissionEvaluator permissionEvaluator;
    private final com.eagleauctioner.repository.UserRepository userRepository;

    @Value("${application.cors.allowed-origins}")
    private String[] allowedOrigins;

    @Bean
    public org.springframework.security.access.expression.method.MethodSecurityExpressionHandler methodSecurityExpressionHandler() {
        org.springframework.security.access.expression.method.DefaultMethodSecurityExpressionHandler handler = new org.springframework.security.access.expression.method.DefaultMethodSecurityExpressionHandler();
        handler.setPermissionEvaluator(permissionEvaluator);
        return handler;
    }

    @Bean
    public org.springframework.security.core.userdetails.UserDetailsService userDetailsService() {
        return username -> userRepository.findByEmailIgnoreCaseAndDeletedAtIsNull(username)
                .orElseThrow(() -> new org.springframework.security.core.userdetails.UsernameNotFoundException("User not found"));
    }

    @Bean
    public AuthenticationProvider authenticationProvider() {
        org.springframework.security.authentication.dao.DaoAuthenticationProvider authProvider = new org.springframework.security.authentication.dao.DaoAuthenticationProvider();
        authProvider.setUserDetailsService(userDetailsService());
        authProvider.setPasswordEncoder(passwordEncoder());
        return authProvider;
    }

    @Bean
    public org.springframework.security.authentication.AuthenticationManager authenticationManager(org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration config) throws Exception {
        return config.getAuthenticationManager();
    }

    @Bean
    public org.springframework.security.crypto.password.PasswordEncoder passwordEncoder() {
        return new org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder();
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))
            .csrf(csrf -> csrf
                .csrfTokenRepository(org.springframework.security.web.csrf.CookieCsrfTokenRepository.withHttpOnlyFalse())
                .csrfTokenRequestHandler(new org.springframework.security.web.csrf.CsrfTokenRequestAttributeHandler())
                .ignoringRequestMatchers(
                    org.springframework.security.web.util.matcher.AntPathRequestMatcher.antMatcher("/api/v1/auth/**"),
                    org.springframework.security.web.util.matcher.AntPathRequestMatcher.antMatcher("/actuator/health"),
                    org.springframework.security.web.util.matcher.AntPathRequestMatcher.antMatcher("/ws/**"),
                    org.springframework.security.web.util.matcher.AntPathRequestMatcher.antMatcher("/v3/api-docs"),
                    org.springframework.security.web.util.matcher.AntPathRequestMatcher.antMatcher("/v3/api-docs/**"),
                    org.springframework.security.web.util.matcher.AntPathRequestMatcher.antMatcher("/swagger-ui.html"),
                    org.springframework.security.web.util.matcher.AntPathRequestMatcher.antMatcher("/swagger-ui/**"),
                    org.springframework.security.web.util.matcher.AntPathRequestMatcher.antMatcher("/swagger-resources"),
                    org.springframework.security.web.util.matcher.AntPathRequestMatcher.antMatcher("/swagger-resources/**"),
                    org.springframework.security.web.util.matcher.AntPathRequestMatcher.antMatcher("/webjars/**"),
                    org.springframework.security.web.util.matcher.AntPathRequestMatcher.antMatcher("/error")
                )
            )
            .headers(headers -> {
                headers.frameOptions(frame -> frame.deny());
                headers.xssProtection(xss -> xss.disable());
                String cspDirectives = env.acceptsProfiles(org.springframework.core.env.Profiles.of("prod"))
                        ? "default-src 'self'; frame-ancestors 'none'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self' data:; connect-src 'self'"
                        : "default-src 'self'; frame-ancestors 'none'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self' data:; connect-src 'self'";
                headers.contentSecurityPolicy(csp -> csp.policyDirectives(cspDirectives));
                headers.referrerPolicy(referrer -> referrer.policy(org.springframework.security.web.header.writers.ReferrerPolicyHeaderWriter.ReferrerPolicy.STRICT_ORIGIN_WHEN_CROSS_ORIGIN));
                headers.httpStrictTransportSecurity(hsts -> hsts.includeSubDomains(true).maxAgeInSeconds(31536000));
                headers.permissionsPolicy(permissions -> permissions.policy("geolocation=(), camera=(), microphone=()"));
                headers.addHeaderWriter(new org.springframework.security.web.header.writers.StaticHeadersWriter("X-Content-Type-Options", "nosniff"));
            })
            .exceptionHandling(exceptions -> exceptions
                .authenticationEntryPoint(authenticationEntryPoint)
                .accessDeniedHandler(accessDeniedHandler)
            )
            .authorizeHttpRequests(req -> {
                if (env.acceptsProfiles(org.springframework.core.env.Profiles.of("prod"))) {
                    req.requestMatchers(
                        org.springframework.security.web.util.matcher.AntPathRequestMatcher.antMatcher("/api/v1/auth/**"),
                        org.springframework.security.web.util.matcher.AntPathRequestMatcher.antMatcher("/actuator/health"),
                        org.springframework.security.web.util.matcher.AntPathRequestMatcher.antMatcher("/actuator/health/**"),
                        org.springframework.security.web.util.matcher.AntPathRequestMatcher.antMatcher("/ws/**"),
                        org.springframework.security.web.util.matcher.AntPathRequestMatcher.antMatcher("/error")
                    ).permitAll();
                    req.requestMatchers(
                        org.springframework.security.web.util.matcher.AntPathRequestMatcher.antMatcher("/actuator/prometheus"),
                        org.springframework.security.web.util.matcher.AntPathRequestMatcher.antMatcher("/actuator/metrics"),
                        org.springframework.security.web.util.matcher.AntPathRequestMatcher.antMatcher("/actuator/metrics/**"),
                        org.springframework.security.web.util.matcher.AntPathRequestMatcher.antMatcher("/actuator/info")
                    ).hasAnyAuthority("ROLE_ADMIN", "ADMIN");
                    req.requestMatchers(
                        org.springframework.security.web.util.matcher.AntPathRequestMatcher.antMatcher("/v3/api-docs"),
                        org.springframework.security.web.util.matcher.AntPathRequestMatcher.antMatcher("/v3/api-docs/**"),
                        org.springframework.security.web.util.matcher.AntPathRequestMatcher.antMatcher("/swagger-ui.html"),
                        org.springframework.security.web.util.matcher.AntPathRequestMatcher.antMatcher("/swagger-ui/**"),
                        org.springframework.security.web.util.matcher.AntPathRequestMatcher.antMatcher("/swagger-resources"),
                        org.springframework.security.web.util.matcher.AntPathRequestMatcher.antMatcher("/swagger-resources/**"),
                        org.springframework.security.web.util.matcher.AntPathRequestMatcher.antMatcher("/webjars/**")
                    ).denyAll();
                } else {
                    req.requestMatchers(
                        org.springframework.security.web.util.matcher.AntPathRequestMatcher.antMatcher("/api/v1/auth/**"),
                        org.springframework.security.web.util.matcher.AntPathRequestMatcher.antMatcher("/actuator/health"),
                        org.springframework.security.web.util.matcher.AntPathRequestMatcher.antMatcher("/actuator/health/**"),
                        org.springframework.security.web.util.matcher.AntPathRequestMatcher.antMatcher("/ws/**"),
                        org.springframework.security.web.util.matcher.AntPathRequestMatcher.antMatcher("/v3/api-docs"),
                        org.springframework.security.web.util.matcher.AntPathRequestMatcher.antMatcher("/v3/api-docs/**"),
                        org.springframework.security.web.util.matcher.AntPathRequestMatcher.antMatcher("/swagger-ui.html"),
                        org.springframework.security.web.util.matcher.AntPathRequestMatcher.antMatcher("/swagger-ui/**"),
                        org.springframework.security.web.util.matcher.AntPathRequestMatcher.antMatcher("/swagger-resources"),
                        org.springframework.security.web.util.matcher.AntPathRequestMatcher.antMatcher("/swagger-resources/**"),
                        org.springframework.security.web.util.matcher.AntPathRequestMatcher.antMatcher("/webjars/**"),
                        org.springframework.security.web.util.matcher.AntPathRequestMatcher.antMatcher("/error")
                    ).permitAll();
                    req.requestMatchers(
                        org.springframework.security.web.util.matcher.AntPathRequestMatcher.antMatcher("/actuator/prometheus"),
                        org.springframework.security.web.util.matcher.AntPathRequestMatcher.antMatcher("/actuator/metrics"),
                        org.springframework.security.web.util.matcher.AntPathRequestMatcher.antMatcher("/actuator/metrics/**"),
                        org.springframework.security.web.util.matcher.AntPathRequestMatcher.antMatcher("/actuator/info")
                    ).hasAnyAuthority("ROLE_ADMIN", "ADMIN");
                }

                req.anyRequest().authenticated();
            })
            .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authenticationProvider(authenticationProvider())
            .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class)
            .addFilterBefore(rateLimitingFilter, JwtAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        java.util.List<String> sanitizedOrigins = Arrays.stream(allowedOrigins)
                .map(String::trim)
                .filter(origin -> !origin.isEmpty() && !origin.equals("*"))
                .collect(java.util.stream.Collectors.toList());
        configuration.setAllowedOrigins(sanitizedOrigins);
        configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(Arrays.asList("Authorization", "Content-Type", "X-Requested-With", "Accept"));
        configuration.setAllowCredentials(true);
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
}
