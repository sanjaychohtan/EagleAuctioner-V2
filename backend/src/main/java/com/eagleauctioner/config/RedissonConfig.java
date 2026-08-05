package com.eagleauctioner.config;

import org.redisson.Redisson;
import org.redisson.api.RedissonClient;
import org.redisson.config.Config;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Lazy;

/**
 * Configure Redisson connection factory settings with high availability.
 */
@Configuration
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
    @Lazy
    public RedissonClient redissonClient() {
        Config config = new Config();
        
        config.setLockWatchdogTimeout(lockWatchdogTimeout);

        if (clusterNodes != null && clusterNodes.length > 0 && !clusterNodes[0].isEmpty()) {
            config.useClusterServers()
                  .addNodeAddress(clusterNodes)
                  .setPassword(redisPassword != null && !redisPassword.isEmpty() ? redisPassword : null)
                  .setConnectTimeout(timeout)
                  .setRetryAttempts(3)
                  .setRetryInterval(1500)
                  .setPingConnectionInterval(2000);
        } else if (sentinelMaster != null && !sentinelMaster.isEmpty()) {
            config.useSentinelServers()
                  .setMasterName(sentinelMaster)
                  .addSentinelAddress(sentinelNodes)
                  .setPassword(redisPassword != null && !redisPassword.isEmpty() ? redisPassword : null)
                  .setConnectTimeout(timeout)
                  .setRetryAttempts(3)
                  .setRetryInterval(1500)
                  .setPingConnectionInterval(2000);
        } else {
            String address = "redis://" + redisHost + ":" + redisPort;
            config.useSingleServer()
                  .setAddress(address)
                  .setPassword(redisPassword != null && !redisPassword.isEmpty() ? redisPassword : null)
                  .setConnectTimeout(timeout)
                  .setRetryAttempts(3)
                  .setRetryInterval(1500)
                  .setPingConnectionInterval(2000);
        }
                return Redisson.create(config);
    }
}
