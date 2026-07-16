package com.eagleauctioner.security;

import com.eagleauctioner.context.AuditContext;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

public class SecurityUtils {
    public static String getCurrentActor() {
        String actor = null;
        try {
            AuditContext auditCtx = AuditContext.get();
            if (auditCtx != null) {
                if (auditCtx.getExecutor() != null && !auditCtx.getExecutor().trim().isEmpty()) {
                    actor = auditCtx.getExecutor();
                } else if (auditCtx.getActorId() != null) {
                    actor = auditCtx.getActorId().toString();
                }
            }
        } catch (Exception e) {
            // Context missing fallback
        }
        if (actor == null || actor.trim().isEmpty()) {
            try {
                Authentication auth = SecurityContextHolder.getContext().getAuthentication();
                if (auth != null && auth.getName() != null) {
                    actor = auth.getName();
                }
            } catch (Exception e) {
                // Ignore
            }
        }
        if (actor == null || actor.trim().isEmpty()) {
            actor = "SYSTEM";
        }
        return actor;
    }
}
