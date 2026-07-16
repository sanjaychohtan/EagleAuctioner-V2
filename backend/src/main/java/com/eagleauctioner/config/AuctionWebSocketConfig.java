package com.eagleauctioner.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.*;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.messaging.simp.config.ChannelRegistration;
import com.eagleauctioner.security.JwtChannelInterceptor;
import lombok.RequiredArgsConstructor;

/**
 * Configure secure WebSocket broker routing with heartbeat management, production origin validation,
 * and robust JWT message interceptor for channel security.
 */
@Configuration
@EnableWebSocketMessageBroker
@RequiredArgsConstructor
public class AuctionWebSocketConfig implements WebSocketMessageBrokerConfigurer {

    @Value("${auction.websocket.allowed-origins:https://app.eagleauctioner.com,https://admin.eagleauctioner.com}")
    private String[] allowedOrigins;

    private final JwtChannelInterceptor jwtChannelInterceptor;

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        registry.addEndpoint("/ws")
                .setAllowedOrigins(allowedOrigins)
                .withSockJS();
    }

    @Override
    public void configureMessageBroker(MessageBrokerRegistry registry) {
        registry.setApplicationDestinationPrefixes("/application");
        registry.enableSimpleBroker("/topic", "/queue")
                .setHeartbeatValue(new long[]{10000, 10000});
        registry.setUserDestinationPrefix("/user");
    }

    @Override
    public void configureWebSocketTransport(WebSocketTransportRegistration registration) {
        registration.setMessageSizeLimit(64 * 1024);
        registration.setSendTimeLimit(20 * 1000);
        registration.setSendBufferSizeLimit(512 * 1024);
    }

    public void configureClientInboundChannel(ChannelRegistration registration) {
        registration.interceptors(jwtChannelInterceptor);
    }
}
