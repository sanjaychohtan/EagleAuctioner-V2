# EAGLE AUCTIONEER - AI AGENT CONSTITUTION

## 1. CORE DIRECTIVES & BOUNDARIES
- Business Logic: Preserved strictly. Zero silent feature dropping or behavioral changes.
- UI/UX Preservation: Never change design, layout, or user experience unless explicitly requested.
- API Compatibility: Retain 100% compatibility with Spring Boot APIs & contract signatures.
- DB Compatibility: Schema alignment mandatory. Amounts stored in BIGINT (paise only).
- Security: Enforce JWT authentication, RBAC, HTTPS, and sanitized input vectors.
- Performance: Zero regression tolerated; minimize bundle, memory footprint, and re-renders.

## 2. CODE QUALITY & ARCHITECTURE
- TypeScript Strict: Zero `any` types allowed; strict typing & interface enforcement.
- Architecture: Modular, clean enterprise architecture with separation of concerns.
- State & Realtime: Preserve Zustand selectors, React Query caching, Redis & WebSocket channels.
- Maintenance: Proactively remove dead, redundant, or duplicate code and unused imports.
- Backward Compatibility: Maintain seamless backward compatibility across releases.

## 3. EXECUTION WORKFLOW
1. Analyze: Inspect dependencies, bundle splits, rendering metrics, and error boundaries.
2. Fix: Apply surgical fixes without breaking existing contracts or user interfaces.
3. Verify: Validate TypeScript compilation, build target, runtime health, and assets.
4. Build: Run full production build (`npm run build`) ensuring zero errors.
5. Report: Standardized summary report with performance metrics & readiness score.
6. Stop: Halt immediately after task completion; do not perform unrequested actions.

## 4. REPORT FORMAT
- AI_AGENT_RULES.md Status
- Files Changed
- Performance Improvements
- Bundle Improvements
- Build Status
- Remaining Issues
- Production Readiness Score
