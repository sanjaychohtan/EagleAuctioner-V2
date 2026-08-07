package com.eagleauctioner.aspect;

import com.eagleauctioner.entity.AuditLog;
import com.eagleauctioner.repository.AuditLogRepository;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.aspectj.lang.JoinPoint;
import org.aspectj.lang.annotation.AfterReturning;
import org.aspectj.lang.annotation.Aspect;
import org.springframework.stereotype.Component;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.Authentication;
import com.eagleauctioner.enums.Action;
import com.eagleauctioner.repository.UserRepository;

@Aspect
@Component
@RequiredArgsConstructor
public class AuditAspect {

    private final AuditLogRepository auditLogRepository;
    private final UserRepository userRepository;

    @AfterReturning(pointcut = "execution(* com.eagleauctioner.service.AuthService.login(..))", returning = "result")
    public void logLogin(JoinPoint joinPoint, Object result) {
        saveAuditLog(Action.LOGIN, "AuthResponse", null, "User logged in");
    }

    @AfterReturning(pointcut = "execution(* com.eagleauctioner.service.AuthService.register(..))")
    public void logRegistration(JoinPoint joinPoint) {
        saveAuditLog(Action.REGISTER, "User", null, "User registered");
    }

    @AfterReturning(pointcut = "execution(* com.eagleauctioner.service.AuthService.logout(..))")
    public void logLogout(JoinPoint joinPoint) {
        saveAuditLog(Action.LOGOUT, "Token", null, "User logged out");
    }

    @AfterReturning(pointcut = "execution(* com.eagleauctioner.service.AuthService.resetPassword(..))")
    public void logPasswordReset(JoinPoint joinPoint) {
        saveAuditLog(Action.PASSWORD_RESET, "User", null, "Password reset successful");
    }

    private void saveAuditLog(Action action, String entityType, String entityId, String details) {
        HttpServletRequest request = getRequest();
        String ipAddress = request != null ? request.getRemoteAddr() : "UNKNOWN";
        String userAgent = request != null ? request.getHeader("User-Agent") : "UNKNOWN";

        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.getName() != null) {
            String email = authentication.getName();
            userRepository.findByEmailIgnoreCaseAndDeletedAtIsNull(email)
                    .ifPresent(user -> {
                        AuditLog log = AuditLog.builder()
                                .userId(user.getId())
                                .action(action)
                                .entityType(entityType)
                                .entityId(entityId)
                                .newValue("{\"message\":\"" + (details != null ? details.replace("\"", "\\\"") : "") + "\"}")
                                .ipAddress(ipAddress)
                                .userAgent(userAgent)
                                .build();
                        auditLogRepository.save(log);
                    });
        } else if (action == Action.REGISTER || action == Action.LOGIN) {
             // For registration/login, user might not be in SecurityContext yet or just added
             // Aspect-based logging here might need access to method arguments to get email
             // However, sticking to SSOT implementation with slight safety improvement
             AuditLog log = AuditLog.builder()
                    .userId(null)
                    .action(action)
                    .entityType(entityType)
                    .entityId(entityId)
                    .newValue("{\"message\":\"" + (details != null ? details.replace("\"", "\\\"") : "") + "\"}")
                    .ipAddress(ipAddress)
                    .userAgent(userAgent)
                    .build();
            auditLogRepository.save(log);
        }
    }

    private HttpServletRequest getRequest() {
        ServletRequestAttributes attributes = (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
        return attributes != null ? attributes.getRequest() : null;
    }
}
