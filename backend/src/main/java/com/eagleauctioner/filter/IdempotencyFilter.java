package com.eagleauctioner.filter;

import com.eagleauctioner.entity.IdempotencyRecord;
import com.eagleauctioner.repository.IdempotencyRecordRepository;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import java.util.HexFormat;
import org.springframework.web.filter.OncePerRequestFilter;
import org.springframework.web.util.ContentCachingRequestWrapper;
import org.springframework.web.util.ContentCachingResponseWrapper;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Optional;

@Component
@Order(Ordered.HIGHEST_PRECEDENCE + 1)
public class IdempotencyFilter extends OncePerRequestFilter {

    private final IdempotencyRecordRepository idempotencyRecordRepository;

    public IdempotencyFilter(IdempotencyRecordRepository idempotencyRecordRepository) {
        this.idempotencyRecordRepository = idempotencyRecordRepository;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {

        String idempotencyKey = request.getHeader("Idempotency-Key");

        if (idempotencyKey == null || idempotencyKey.isEmpty() || !request.getMethod().equals("POST")) {
            filterChain.doFilter(request, response);
            return;
        }

        ContentCachingRequestWrapper requestWrapper = new ContentCachingRequestWrapper(request);
        ContentCachingResponseWrapper responseWrapper = new ContentCachingResponseWrapper(response);

        // Read request to calculate hash
        requestWrapper.getParameterMap(); // Trigger body read for forms
        byte[] requestBody = requestWrapper.getContentAsByteArray();
        String requestHash;
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            requestHash = HexFormat.of().formatHex(digest.digest(requestBody));
        } catch (Exception e) {
            throw new RuntimeException("SHA-256 algorithm not available", e);
        }

        Optional<IdempotencyRecord> existingRecordOpt = idempotencyRecordRepository.findByIdempotencyKey(idempotencyKey);

        if (existingRecordOpt.isPresent()) {
            IdempotencyRecord record = existingRecordOpt.get();
            if (!record.getRequestHash().equals(requestHash)) {
                response.sendError(HttpServletResponse.SC_CONFLICT, "Idempotency key already used with different payload");
                return;
            }

            // Return cached response
            response.setStatus(record.getResponseStatus());
            
            // Set Headers
            if (record.getResponseHeaders() != null && !record.getResponseHeaders().isEmpty()) {
                String[] headers = record.getResponseHeaders().split(";");
                for (String header : headers) {
                    String[] parts = header.split(":", 2);
                    if (parts.length == 2) {
                        response.setHeader(parts[0], parts[1]);
                    }
                }
            }
            
            response.setContentType("application/json");
            response.getWriter().write(record.getResponseBody());
            response.getWriter().flush();
            return;
        }

        // Execute request
        filterChain.doFilter(requestWrapper, responseWrapper);

        // Cache response
        int status = responseWrapper.getStatus();
        if (status >= 200 && status < 400) {
            byte[] responseBodyBytes = responseWrapper.getContentAsByteArray();
            String responseBodyStr = new String(responseBodyBytes, StandardCharsets.UTF_8);
            
            StringBuilder headersStr = new StringBuilder();
            for (String headerName : responseWrapper.getHeaderNames()) {
                for (String headerValue : responseWrapper.getHeaders(headerName)) {
                    headersStr.append(headerName).append(":").append(headerValue).append(";");
                }
            }

            IdempotencyRecord record = IdempotencyRecord.builder()
                    .idempotencyKey(idempotencyKey)
                    .requestHash(requestHash)
                    .responseStatus(status)
                    .responseBody(responseBodyStr)
                    .responseHeaders(headersStr.toString())
                    .createdAt(Instant.now())
                    .expiresAt(Instant.now().plus(24, ChronoUnit.HOURS))
                    .build();

            idempotencyRecordRepository.save(record);
        }

        responseWrapper.copyBodyToResponse();
    }
}
