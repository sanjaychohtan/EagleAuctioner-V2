# Enterprise Security Guide

## 1. Authentication & JWT Pipeline
* **Stateless Token Verification**: Handled by `JwtAuthenticationFilter` on every HTTP request.
* **Token Expiration**: Access token expires in 60 minutes; refresh token expires in 7 days.
* **WebSocket Interception**: Handled by `JwtChannelInterceptor` for STOMP CONNECT & SUBSCRIBE frames.

## 2. Authorization & Data Scope Engine
* **Method Security**: `@PreAuthorize("hasAuthority('action.key')")` evaluates fine-grained action permissions via `EnterprisePermissionEvaluator`.
* **Tenant Data Scopes**: `@EnforceDataScope(...)` filters records by `COMPANY`, `BUYER`, `SELLER`, `BRANCH`, etc., utilizing `SecurityUtils.getCurrentUserDataScopes()`.

## 3. Sensitive Data Masking & Audit Logging
* **Sensitive Data Masker**: `SensitiveDataMasker` masks bank account numbers (`XXXX-XXXX-1234`) and PAN/KYC identifiers before API serialization.
* **Audit Context Filter**: `AuditContextFilter` injects request trace metadata (client IP, correlation ID, user ID) into MDC context for structured logging.
