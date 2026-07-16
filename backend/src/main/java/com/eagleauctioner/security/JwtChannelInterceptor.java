package com.eagleauctioner.security;

import com.eagleauctioner.service.JwtService;
import com.eagleauctioner.repository.UserRepository;
import com.eagleauctioner.repository.BidderProfileRepository;
import com.eagleauctioner.repository.BidderAuthorizationRepository;
import com.eagleauctioner.repository.AuctionLotRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.messaging.MessageDeliveryException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.stereotype.Component;

import java.security.Principal;
import java.util.UUID;

/**
 * Validates JWT tokens on WebSocket connections and enforces topic-level authorizations
 * by validating bidder profile and authorizations before allowing SUBSCRIBE operations.
 */
@Component
@Slf4j
@RequiredArgsConstructor
public class JwtChannelInterceptor implements ChannelInterceptor {

    private final JwtService jwtService;
    private final UserDetailsService userDetailsService;
    private final UserRepository userRepository;
    private final BidderProfileRepository bidderProfileRepository;
    private final BidderAuthorizationRepository bidderAuthorizationRepository;
    private final AuctionLotRepository auctionLotRepository;

    @Override
    public Message<?> preSend(Message<?> message, MessageChannel channel) {
        StompHeaderAccessor accessor = MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);
        
        if (accessor != null) {
            StompCommand command = accessor.getCommand();
            
            if (StompCommand.CONNECT.equals(command)) {
                String authHeader = accessor.getFirstNativeHeader("Authorization");
                if (authHeader == null || !authHeader.startsWith("Bearer ")) {
                    log.error("WebSocket connection rejected: Missing or invalid authorization header");
                    throw new MessageDeliveryException("Unauthorized: Missing or invalid token");
                }
                String jwt = authHeader.substring(7);
                
                try {
                    String username = jwtService.extractUsername(jwt);
                    if (username == null) {
                        log.error("WebSocket connection rejected: Invalid token signature");
                        throw new MessageDeliveryException("Unauthorized: Invalid token signature");
                    }
                    
                    UserDetails userDetails = userDetailsService.loadUserByUsername(username);
                    if (userDetails == null || !userDetails.isEnabled() || !userDetails.isAccountNonLocked() || !userDetails.isAccountNonExpired()) {
                        log.error("WebSocket connection rejected: User account is disabled or expired");
                        throw new MessageDeliveryException("Unauthorized: User account status is invalid");
                    }
                    
                    if (!jwtService.validateAccessToken(jwt, userDetails)) {
                        log.error("WebSocket connection rejected: Access token is invalid or expired");
                        throw new MessageDeliveryException("Unauthorized: Token validation failed");
                    }
                    
                    UsernamePasswordAuthenticationToken authentication = 
                            new UsernamePasswordAuthenticationToken(userDetails, null, userDetails.getAuthorities());
                    
                    accessor.setUser(authentication);
                    log.info("WebSocket connection successfully authenticated for user: {}", username);
                } catch (Exception e) {
                    log.error("WebSocket connection error during authentication: {}", e.getMessage());
                    throw new MessageDeliveryException("Unauthorized: " + e.getMessage());
                }
            } else if (StompCommand.SUBSCRIBE.equals(command)) {
                Principal principal = accessor.getUser();
                if (principal == null) {
                    log.error("Subscription rejected: User is not authenticated");
                    throw new MessageDeliveryException("Unauthorized: Subscription requires authentication");
                }
                
                String destination = accessor.getDestination();
                if (destination == null || destination.trim().isEmpty()) {
                    log.error("Subscription rejected: Destination is empty");
                    throw new MessageDeliveryException("Unauthorized: Destination is empty");
                }
                
                boolean isAllowedDestination = false;
                if ("/topic/public".equals(destination)) {
                    isAllowedDestination = true;
                } else if (destination.startsWith("/user/")) {
                    isAllowedDestination = true;
                } else if (destination.startsWith("/topic/auction/")) {
                    String idStr = destination.substring("/topic/auction/".length());
                    try {
                        UUID auctionId = UUID.fromString(idStr);
                        isAllowedDestination = true;
                        validateParticipantForAuction(principal.getName(), auctionId);
                    } catch (IllegalArgumentException e) {
                        log.error("Subscription rejected: Invalid auction UUID format: {}", idStr);
                        throw new MessageDeliveryException("Unauthorized: Invalid auction ID format");
                    }
                } else if (destination.startsWith("/topic/lot/")) {
                    String idStr = destination.substring("/topic/lot/".length());
                    try {
                        UUID lotId = UUID.fromString(idStr);
                        isAllowedDestination = true;
                        validateParticipantForLot(principal.getName(), lotId);
                    } catch (IllegalArgumentException e) {
                        log.error("Subscription rejected: Invalid lot UUID format: {}", idStr);
                        throw new MessageDeliveryException("Unauthorized: Invalid lot ID format");
                    }
                }
                
                if (!isAllowedDestination) {
                    log.error("Subscription rejected: Destination {} is unknown/not authorized by default", destination);
                    throw new MessageDeliveryException("Unauthorized: Destination not permitted by default");
                }
            } else if (StompCommand.SEND.equals(command)) {
                Principal principal = accessor.getUser();
                if (principal == null) {
                    log.error("Message send rejected: User is not authenticated");
                    throw new MessageDeliveryException("Unauthorized: Sending messages requires authentication");
                }
                
                String destination = accessor.getDestination();
                if (destination == null || destination.trim().isEmpty()) {
                    log.error("Send rejected: Destination is empty");
                    throw new MessageDeliveryException("Unauthorized: Destination is empty");
                }
                
                if (!destination.startsWith("/application/")) {
                    log.error("Send rejected: Destination {} does not start with application prefix", destination);
                    throw new MessageDeliveryException("Unauthorized: Invalid send destination prefix");
                }
            }
        }
        return message;
    }

    private void validateParticipantForAuction(String username, UUID auctionId) {
        com.eagleauctioner.entity.User user = userRepository.findByEmailIgnoreCaseAndDeletedAtIsNull(username)
                .orElseThrow(() -> new MessageDeliveryException("Unauthorized: User not found"));
                
        boolean isAdmin = user.getAuthorities().stream()
                .anyMatch(a -> "ROLE_ADMIN".equals(a.getAuthority()));
        if (isAdmin) {
            return;
        }
        
        com.eagleauctioner.entity.BidderProfile bidder = bidderProfileRepository.findByUserId(user.getId())
                .orElseThrow(() -> new MessageDeliveryException("Unauthorized: User has no bidder profile"));
                
        com.eagleauctioner.entity.BidderAuthorization authorization = bidderAuthorizationRepository
                .findByAuctionIdAndBidderProfileId(auctionId, bidder.getId())
                .orElseThrow(() -> new MessageDeliveryException("Unauthorized: Bidder has no authorization for this auction"));
                
        if (!Boolean.TRUE.equals(authorization.getIsAuthorized())) {
            throw new MessageDeliveryException("Unauthorized: Participant is not authorized for this auction");
        }
    }

    private void validateParticipantForLot(String username, UUID lotId) {
        com.eagleauctioner.entity.AuctionLot lot = auctionLotRepository.findById(lotId)
                .orElseThrow(() -> new MessageDeliveryException("Unauthorized: Lot not found"));
                
        if (lot.getAuction() == null) {
            throw new MessageDeliveryException("Unauthorized: Lot does not belong to any auction");
        }
        
        validateParticipantForAuction(username, lot.getAuction().getId());
    }
}
