package com.eagleauctioner.config;

import com.eagleauctioner.context.AuditContext;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.AsyncConfigurer;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor;

import java.util.UUID;
import java.util.concurrent.Executor;
import java.util.concurrent.ThreadPoolExecutor;

@Configuration
@EnableAsync
public class AsyncConfig implements AsyncConfigurer {

    @Override
    public Executor getAsyncExecutor() {
        ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
        executor.setCorePoolSize(4);
        executor.setMaxPoolSize(10);
        executor.setQueueCapacity(100);
        executor.setThreadNamePrefix("EagleAsync-");
        executor.setRejectedExecutionHandler(new ThreadPoolExecutor.CallerRunsPolicy());
        executor.setWaitForTasksToCompleteOnShutdown(true);
        executor.setAwaitTerminationSeconds(30);
        
        executor.setTaskDecorator(runnable -> {
            AuditContext parentCtx = AuditContext.getOptional().orElse(
                AuditContext.builder()
                    .actorId(UUID.fromString("00000000-0000-0000-0000-000000000000"))
                    .ipAddress("SYSTEM")
                    .userAgent("ASYNC_THREAD")
                    .build()
            );

            return () -> {
                AuditContext.set(parentCtx);
                try {
                    runnable.run();
                } finally {
                    AuditContext.clear();
                }
            };
        });
        executor.initialize();
        return executor;
    }
}
