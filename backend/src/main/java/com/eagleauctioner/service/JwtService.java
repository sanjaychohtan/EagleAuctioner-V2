package com.eagleauctioner.service;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;
import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;

import java.security.Key;
import java.security.SecureRandom;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.TimeUnit;
import java.util.function.Function;

@Service
public class JwtService {

    @Value("${application.security.jwt.secret-key:}")
    private String secretKeyStr;

    @Value("${application.security.jwt.expiration}")
    private long jwtExpiration;

    @Value("${application.security.jwt.refresh-token.expiration}")
    private long refreshExpiration;

    @Value("${application.security.jwt.issuer}")
    private String issuer;

    @Value("${application.security.jwt.audience}")
    private String audience;

    private Key signingKey;

    private final StringRedisTemplate redisTemplate;

    public JwtService(StringRedisTemplate redisTemplate) {
        this.redisTemplate = redisTemplate;
    }

    @PostConstruct
    public void init() throws Exception {
        if (secretKeyStr == null || secretKeyStr.trim().isEmpty()) {
            // Generate a secure 512-bit key by default (64 bytes)
            byte[] bytes = new byte[64];
            new SecureRandom().nextBytes(bytes);
            this.signingKey = Keys.hmacShaKeyFor(bytes);
        } else {
            byte[] keyBytes = secretKeyStr.getBytes(StandardCharsets.UTF_8);
            if (keyBytes.length < 64) {
                throw new IllegalArgumentException("JWT Secret key must be at least 64 bytes (512 bits) long for HS512");
            }
            this.signingKey = Keys.hmacShaKeyFor(keyBytes);
        }
    }

    public String extractUsername(String token) {
        return extractClaim(token, Claims::getSubject);
    }

    public String extractTokenType(String token) {
        return extractClaim(token, claims -> claims.get("tokenType", String.class));
    }

    public String extractTokenFamilyId(String token) {
        return extractClaim(token, claims -> claims.get("familyId", String.class));
    }

    public <T> T extractClaim(String token, Function<Claims, T> claimsResolver) {
        final Claims claims = extractAllClaims(token);
        return claimsResolver.apply(claims);
    }

    public String generateAccessToken(UserDetails userDetails, String familyId) {
        Map<String, Object> extraClaims = new HashMap<>();
        extraClaims.put("tokenType", "ACCESS");
        if (familyId != null) extraClaims.put("familyId", familyId);
        return buildToken(extraClaims, userDetails, jwtExpiration);
    }

    public String generateRefreshToken(UserDetails userDetails, String familyId) {
        Map<String, Object> extraClaims = new HashMap<>();
        extraClaims.put("tokenType", "REFRESH");
        if (familyId != null) extraClaims.put("familyId", familyId);
        return buildToken(extraClaims, userDetails, refreshExpiration);
    }

    private String buildToken(Map<String, Object> extraClaims, UserDetails userDetails, long expiration) {
        return Jwts.builder()
                .setClaims(extraClaims)
                .setSubject(userDetails.getUsername())
                .setIssuer(issuer)
                .setAudience(audience)
                .setId(UUID.randomUUID().toString()) // jti
                .setIssuedAt(Date.from(Instant.now()))
                .setExpiration(Date.from(Instant.now().plusMillis(expiration)))
                .signWith(this.signingKey, SignatureAlgorithm.HS512)
                .compact();
    }

    public boolean validateAccessToken(String token, UserDetails userDetails) {
        return validateToken(token, userDetails, "ACCESS");
    }

    public boolean validateRefreshToken(String token, UserDetails userDetails) {
        return validateToken(token, userDetails, "REFRESH");
    }

    private boolean validateToken(String token, UserDetails userDetails, String expectedType) {
        final String username = extractUsername(token);
        final String tokenType = extractTokenType(token);
        final String tokenIssuer = extractClaim(token, Claims::getIssuer);
        final String tokenAudience = extractClaim(token, Claims::getAudience);
        
        return (username.equals(userDetails.getUsername())) 
                && !isTokenExpired(token)
                && expectedType.equals(tokenType)
                && issuer.equals(tokenIssuer)
                && audience.equals(tokenAudience)
                && !isTokenRevoked(token);
    }

    private boolean isTokenExpired(String token) {
        return extractExpiration(token).before(Date.from(Instant.now()));
    }

    public Date extractExpiration(String token) {
        return extractClaim(token, Claims::getExpiration);
    }

    private Claims extractAllClaims(String token) {
        try {
            return Jwts.parserBuilder()
                    .setSigningKey(this.signingKey)
                    .build()
                    .parseClaimsJws(token)
                    .getBody();
        } catch (io.jsonwebtoken.ExpiredJwtException e) {
            return e.getClaims();
        }
    }

    public void revokeToken(String token) {
        Date expirationDate = extractExpiration(token);
        long ttl = expirationDate.getTime() - System.currentTimeMillis();
        if (ttl > 0) {
            String jti = extractClaim(token, Claims::getId);
            redisTemplate.opsForValue().set("blacklist:" + jti, "revoked", ttl, TimeUnit.MILLISECONDS);
        }
    }

    public void revokeTokenFamily(String familyId) {
        redisTemplate.opsForValue().set("blacklist_family:" + familyId, "revoked", refreshExpiration, TimeUnit.MILLISECONDS);
    }

    public boolean isTokenRevoked(String token) {
        String jti = extractClaim(token, Claims::getId);
        String familyId = extractTokenFamilyId(token);
        String email = extractUsername(token);
        
        boolean isJtiRevoked = Boolean.TRUE.equals(redisTemplate.hasKey("blacklist:" + jti));
        boolean isFamilyRevoked = familyId != null && Boolean.TRUE.equals(redisTemplate.hasKey("blacklist_family:" + familyId));
        
        String invalidatedAt = redisTemplate.opsForValue().get("session_invalidated:" + email);
        boolean isSessionInvalidated = false;
        if (invalidatedAt != null) {
            long invalidationTime = Long.parseLong(invalidatedAt);
            Date issuedAt = extractClaim(token, Claims::getIssuedAt);
            if (issuedAt.getTime() < invalidationTime) {
                isSessionInvalidated = true;
            }
        }
        
        return isJtiRevoked || isFamilyRevoked || isSessionInvalidated;
    }
}
