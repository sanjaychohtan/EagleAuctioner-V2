package com.eagleauctioner.context;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Optional;
import java.util.UUID;

/**
 * Enterprise reusable context representing security trace, actor, request metadata, and correlation IDs.
 * Bypasses hardcoding and integrates with ThreadLocal for thread-safe contextual access.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AuditContext {

    private UUID actorId;
    private String correlationId;
    private String ipAddress;
    private String userAgent;
    private String requestId;
    private String executor;

    private static final ThreadLocal<AuditContext> CONTEXT_HOLDER = new ThreadLocal<>();

    /**
     * Store the audit context on the current executing thread.
     */
    public static void set(AuditContext context) {
        CONTEXT_HOLDER.set(context);
    }

    /**
     * Retrieve the current thread-bound AuditContext.
     * Throws MissingAuditContextException if not set, preventing illegal fallback values.
     */
    public static AuditContext get() {
        AuditContext ctx = CONTEXT_HOLDER.get();
        if (ctx == null) {
            throw new MissingAuditContextException("AuditContext is missing from the current thread.");
        }
        return ctx;
    }

    /**
     * Retrieve the current thread-bound AuditContext wrapped in an Optional.
     */
    public static Optional<AuditContext> getOptional() {
        return Optional.ofNullable(CONTEXT_HOLDER.get());
    }

    /**
     * Clear the context for thread-pool hygiene.
     */
    public static void clear() {
        CONTEXT_HOLDER.remove();
    }
}

class MissingAuditContextException extends RuntimeException {
    public MissingAuditContextException(String message) {
        super(message);
    }
}
