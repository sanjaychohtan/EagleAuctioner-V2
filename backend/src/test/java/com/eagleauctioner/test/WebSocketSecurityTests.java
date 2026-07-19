package com.eagleauctioner.test;

import com.eagleauctioner.entity.*;
import com.eagleauctioner.repository.*;
import com.eagleauctioner.security.JwtChannelInterceptor;
import com.eagleauctioner.service.JwtService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.MessageDeliveryException;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.MessageBuilder;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;

import java.util.Collections;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
public class WebSocketSecurityTests {

    @Mock
    private JwtService jwtService;

    @Mock
    private UserDetailsService userDetailsService;

    @Mock
    private UserRepository userRepository;

    @Mock
    private BidderProfileRepository bidderProfileRepository;

    @Mock
    private BidderAuthorizationRepository bidderAuthorizationRepository;

    @Mock
    private AuctionLotRepository auctionLotRepository;

    @Mock
    private MessageChannel messageChannel;

    @InjectMocks
    private JwtChannelInterceptor jwtChannelInterceptor;

    private UserDetails userDetails;
    private User dbUser;
    private UUID testUserId;
    private UUID testBidderId;

    @BeforeEach
    void setUp() {
        testUserId = UUID.randomUUID();
        testBidderId = UUID.randomUUID();
        
        userDetails = new org.springframework.security.core.userdetails.User(
                "testuser@example.com", 
                "password", 
                true, true, true, true, 
                Collections.singletonList(new SimpleGrantedAuthority("ROLE_BIDDER"))
        );
        
        dbUser = User.builder().build();
        dbUser.setId(testUserId);
        dbUser.setEmail("testuser@example.com");
    }

    @Test
    void testConnectWithoutJwt() {
        StompHeaderAccessor accessor = StompHeaderAccessor.create(StompCommand.CONNECT);
        Message<?> message = MessageBuilder.createMessage(new byte[0], accessor.getMessageHeaders());

        Exception exception = assertThrows(MessageDeliveryException.class, () -> {
            jwtChannelInterceptor.preSend(message, messageChannel);
        });
        assertTrue(exception.getMessage().contains("Missing or invalid token"));
    }

    @Test
    void testConnectWithInvalidJwt() {
        StompHeaderAccessor accessor = StompHeaderAccessor.create(StompCommand.CONNECT);
        accessor.addNativeHeader("Authorization", "Bearer invalid-token");
        Message<?> message = MessageBuilder.createMessage(new byte[0], accessor.getMessageHeaders());

        when(jwtService.extractUsername("invalid-token")).thenThrow(new BadCredentialsException("Invalid token"));

        Exception exception = assertThrows(MessageDeliveryException.class, () -> {
            jwtChannelInterceptor.preSend(message, messageChannel);
        });
        assertTrue(exception.getMessage().contains("Unauthorized: Invalid token"));
    }

    @Test
    void testConnectWithValidJwt() {
        StompHeaderAccessor accessor = StompHeaderAccessor.create(StompCommand.CONNECT);
        accessor.setLeaveMutable(true);
        accessor.addNativeHeader("Authorization", "Bearer valid-token");
        Message<?> message = MessageBuilder.createMessage(new byte[0], accessor.getMessageHeaders());

        when(jwtService.extractUsername("valid-token")).thenReturn("testuser@example.com");
        when(userDetailsService.loadUserByUsername("testuser@example.com")).thenReturn(userDetails);
        when(jwtService.validateAccessToken(anyString(), any())).thenReturn(true);

        Message<?> result = jwtChannelInterceptor.preSend(message, messageChannel);
        assertNotNull(result);

        StompHeaderAccessor resultAccessor = StompHeaderAccessor.wrap(result);
        Authentication auth = (Authentication) resultAccessor.getUser();
        assertNotNull(auth);
        assertEquals("testuser@example.com", auth.getName());
    }

    @Test
    void testUnauthorizedSubscribe() {
        StompHeaderAccessor accessor = StompHeaderAccessor.create(StompCommand.SUBSCRIBE);
        accessor.setDestination("/user/queue/private");
        Message<?> message = MessageBuilder.createMessage(new byte[0], accessor.getMessageHeaders());

        Exception exception = assertThrows(MessageDeliveryException.class, () -> {
            jwtChannelInterceptor.preSend(message, messageChannel);
        });
        assertTrue(exception.getMessage().contains("authentication"));
    }

    @Test
    void testAuthorizedSubscribeToPublicTopic() {
        StompHeaderAccessor accessor = StompHeaderAccessor.create(StompCommand.SUBSCRIBE);
        accessor.setDestination("/topic/public");
        accessor.setUser(new UsernamePasswordAuthenticationToken(userDetails, null, userDetails.getAuthorities()));
        Message<?> message = MessageBuilder.createMessage(new byte[0], accessor.getMessageHeaders());

        Message<?> result = jwtChannelInterceptor.preSend(message, messageChannel);
        assertNotNull(result);
    }

    @Test
    void testSubscribeToUnauthorizedAuctionTopic() {
        UUID auctionId = UUID.randomUUID();
        StompHeaderAccessor accessor = StompHeaderAccessor.create(StompCommand.SUBSCRIBE);
        accessor.setDestination("/topic/auction/" + auctionId);
        accessor.setUser(new UsernamePasswordAuthenticationToken(userDetails, null, userDetails.getAuthorities()));
        Message<?> message = MessageBuilder.createMessage(new byte[0], accessor.getMessageHeaders());

        when(userRepository.findByEmailIgnoreCaseAndDeletedAtIsNull("testuser@example.com")).thenReturn(Optional.of(dbUser));
        when(bidderProfileRepository.findByUserId(testUserId)).thenReturn(Optional.empty());

        assertThrows(MessageDeliveryException.class, () -> {
            jwtChannelInterceptor.preSend(message, messageChannel);
        });
    }

    @Test
    void testSubscribeToAuthorizedAuctionTopic() {
        UUID auctionId = UUID.randomUUID();
        StompHeaderAccessor accessor = StompHeaderAccessor.create(StompCommand.SUBSCRIBE);
        accessor.setDestination("/topic/auction/" + auctionId);
        accessor.setUser(new UsernamePasswordAuthenticationToken(userDetails, null, userDetails.getAuthorities()));
        Message<?> message = MessageBuilder.createMessage(new byte[0], accessor.getMessageHeaders());

        BidderProfile bidder = BidderProfile.builder().build();
        bidder.setId(testBidderId);
        BidderAuthorization auth = BidderAuthorization.builder().isAuthorized(true).build();

        when(userRepository.findByEmailIgnoreCaseAndDeletedAtIsNull("testuser@example.com")).thenReturn(Optional.of(dbUser));
        when(bidderProfileRepository.findByUserId(testUserId)).thenReturn(Optional.of(bidder));
        when(bidderAuthorizationRepository.findByAuctionIdAndBidderProfileId(auctionId, testBidderId)).thenReturn(Optional.of(auth));

        Message<?> result = jwtChannelInterceptor.preSend(message, messageChannel);
        assertNotNull(result);
    }
}
