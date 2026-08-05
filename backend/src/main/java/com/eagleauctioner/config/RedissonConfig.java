package com.eagleauctioner.config;

import lombok.extern.slf4j.Slf4j;
import org.redisson.Redisson;
import org.redisson.api.RLock;
import org.redisson.api.RedissonClient;
import org.redisson.config.Config;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.lang.reflect.InvocationHandler;
import java.lang.reflect.Proxy;

/**
 * Configure Redisson connection factory settings with high availability.
 */
@Configuration
@Slf4j
public class RedissonConfig {

    @Value("${spring.redis.cluster.nodes:}")
    private String[] clusterNodes;

    @Value("${spring.redis.sentinel.master:}")
    private String sentinelMaster;

    @Value("${spring.redis.sentinel.nodes:}")
    private String[] sentinelNodes;

    @Value("${spring.data.redis.host:redis}")
    private String redisHost;

    @Value("${spring.data.redis.port:6379}")
    private int redisPort;

    @Value("${spring.data.redis.password:}")
    private String redisPassword;

    @Value("${spring.data.redis.timeout:3000}")
    private int timeout;

    @Value("${redisson.lock.watchdog.timeout:30000}")
    private long lockWatchdogTimeout;

    @Bean
    public RedissonClient redissonClient() {
        try {
            Config config = new Config();
            
            config.setLockWatchdogTimeout(lockWatchdogTimeout);

            String cleanPassword = (redisPassword != null && !redisPassword.isEmpty() && !redisPassword.startsWith("${")) 
                    ? redisPassword : null;

            if (clusterNodes != null && clusterNodes.length > 0 && !clusterNodes[0].isEmpty() && !clusterNodes[0].startsWith("${")) {
                config.useClusterServers()
                      .addNodeAddress(clusterNodes)
                      .setPassword(cleanPassword)
                      .setConnectTimeout(timeout)
                      .setRetryAttempts(3)
                      .setRetryInterval(1500)
                      .setPingConnectionInterval(2000);
            } else if (sentinelMaster != null && !sentinelMaster.isEmpty() && !sentinelMaster.startsWith("${")) {
                config.useSentinelServers()
                      .setMasterName(sentinelMaster)
                      .addSentinelAddress(sentinelNodes)
                      .setPassword(cleanPassword)
                      .setConnectTimeout(timeout)
                      .setRetryAttempts(3)
                      .setRetryInterval(1500)
                      .setPingConnectionInterval(2000);
            } else {
                String address = "redis://" + redisHost + ":" + redisPort;
                config.useSingleServer()
                      .setAddress(address)
                      .setPassword(cleanPassword)
                      .setConnectTimeout(timeout)
                      .setRetryAttempts(3)
                      .setRetryInterval(1500)
                      .setPingConnectionInterval(2000);
            }
            return Redisson.create(config);
        } catch (Exception e) {
            log.warn("Failed to initialize RedissonClient (Redis at {}:{} may be offline): {}. Using fallback RedissonClient proxy.", 
                    redisHost, redisPort, e.getMessage());
            return createFallbackRedissonClient();
        }
    }

    private RedissonClient createFallbackRedissonClient() {
        InvocationHandler handler = (proxy, method, args) -> {
            if ("getLock".equals(method.getName())) {
                return createFallbackRLock();
            }
            if ("equals".equals(method.getName())) {
                return proxy == (args != null && args.length > 0 ? args[0] : null);
            }
            if ("hashCode".equals(method.getName())) {
                return System.identityHashCode(proxy);
            }
            if ("toString".equals(method.getName())) {
                return "FallbackRedissonClientProxy";
            }
            log.warn("Redisson method {} called on fallback proxy (Redis connection was unavailable).", method.getName());
            return null;
        };
        return (RedissonClient) Proxy.newProxyInstance(
                RedissonClient.class.getClassLoader(),
                new Class<?>[]{RedissonClient.class},
                handler
        );
    }

    private RLock createFallbackRLock() {
        InvocationHandler handler = (proxy, method, args) -> {
            if ("tryLock".equals(method.getName())) {
                return false;
            }
            if ("isLocked".equals(method.getName()) || "isHeldByCurrentThread".equals(method.getName())) {
                return false;
            }
            if ("unlock".equals(method.getName())) {
                return null;
            }
            if ("equals".equals(method.getName())) {
                return proxy == (args != null && args.length > 0 ? args[0] : null);
            }
            if ("hashCode".equals(method.getName())) {
                return System.identityHashCode(proxy);
            }
            if ("toString".equals(method.getName())) {
                return "FallbackRLockProxy";
            }
            return null;
        };
        return (RLock) Proxy.newProxyInstance(
                RLock.class.getClassLoader(),
                new Class<?>[]{RLock.class},
                handler
        );
    }
}

