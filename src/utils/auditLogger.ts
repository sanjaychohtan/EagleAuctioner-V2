/**
 * AUCTBIZ - Enterprise Security Audit Logger
 * Formats and records frontend security, authentication, and session events.
 */

export type AuditEventType = 
  | "LOGIN_ATTEMPT"
  | "LOGIN_SUCCESS"
  | "LOGIN_FAILED"
  | "LOGOUT"
  | "TOKEN_REFRESH_SUCCESS"
  | "TOKEN_REFRESH_FAILED"
  | "SESSION_EXPIRED"
  | "UNAUTHORIZED_ACCESS"
  | "CROSS_TAB_SYNC"
  | "IDLE_TIMEOUT"
  | "TENANT_SWITCH";

export interface AuditLogEntry {
  timestamp: string;
  eventType: AuditEventType;
  userId?: string;
  username?: string;
  tenantId?: string;
  details?: string;
}

export const auditLogger = {
  log(eventType: AuditEventType, payload?: { userId?: string; username?: string; tenantId?: string; details?: string }) {
    const entry: AuditLogEntry = {
      timestamp: new Date().toISOString(),
      eventType,
      userId: payload?.userId,
      username: payload?.username,
      tenantId: payload?.tenantId,
      details: payload?.details,
    };

    if (process.env.NODE_ENV !== "production" || (import.meta as any).env?.DEV) {
      console.info(`[SECURITY AUDIT LOG] [${entry.timestamp}] [${entry.eventType}]`, {
        user: entry.username || entry.userId || "anonymous",
        tenant: entry.tenantId || "default",
        details: entry.details || "",
      });
    }
    
    // Potential enterprise hook for remote audit ingestion
    return entry;
  }
};
