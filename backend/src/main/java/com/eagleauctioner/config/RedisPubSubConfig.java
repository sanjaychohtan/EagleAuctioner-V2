package com.eagleauctioner.config;

import com.eagleauctioner.service.impl.WebSocketMessageDistributor;
import org.springframework.boot.autoconfigure.condition.ConditionalOnBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.data.redis.listener.ChannelTopic;
import org.springframework.data.redis.listener.RedisMessageListenerContainer;
import org.springframework.data.redis.listener.adapter.MessageListenerAdapter;

/**
 * Configure Redis Message Listener Container and Topic definitions for WebSocket distribution.
 * Conditional on RedisConnectionFactory to prevent context failures when Redis is excluded (e.g. in unit tests).
 */
@Configuration
@ConditionalOnBean(RedisConnectionFactory.class)
public class RedisPubSubConfig {

    public static final String WEBSOCKET_TOPIC = "websocket-broadcasts";

    @Bean
    public RedisMessageListenerContainer redisContainer(RedisConnectionFactory connectionFactory,
                                                         MessageListenerAdapter listenerAdapter) {
        RedisMessageListenerContainer container = new RedisMessageListenerContainer();
        container.setConnectionFactory(connectionFactory);
        container.addMessageListener(listenerAdapter, new ChannelTopic(WEBSOCKET_TOPIC));
        return container;
    }

    @Bean
    public MessageListenerAdapter listenerAdapter(WebSocketMessageDistributor receiver) {
        return new MessageListenerAdapter(receiver, "receiveMessage");
    }
}
