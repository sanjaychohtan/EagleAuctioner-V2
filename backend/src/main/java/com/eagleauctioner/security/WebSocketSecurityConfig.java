package com.eagleauctioner.security;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.Message;
import org.springframework.security.authorization.AuthorizationManager;
import org.springframework.security.config.annotation.web.socket.EnableWebSocketSecurity;
import org.springframework.security.messaging.access.intercept.MessageMatcherDelegatingAuthorizationManager;

/**
 * Enterprise spring security configuration for robust message and channel authorization.
 */
@Configuration
@EnableWebSocketSecurity
public class WebSocketSecurityConfig {

    @Bean
    public AuthorizationManager<Message<?>> messageAuthorizationManager(MessageMatcherDelegatingAuthorizationManager.Builder messages) {
        messages
            .simpDestMatchers("/ws/**").permitAll()
            .simpSubscribeDestMatchers("/topic/public").permitAll()
            .simpSubscribeDestMatchers("/topic/auction/**", "/topic/lot/**", "/user/**").authenticated()
            .simpDestMatchers("/application/**").authenticated()
            .simpTypeMatchers(
                org.springframework.messaging.simp.SimpMessageType.CONNECT, 
                org.springframework.messaging.simp.SimpMessageType.DISCONNECT, 
                org.springframework.messaging.simp.SimpMessageType.SUBSCRIBE, 
                org.springframework.messaging.simp.SimpMessageType.MESSAGE
            ).authenticated()
            .anyMessage().denyAll();
        return messages.build();
    }
}
