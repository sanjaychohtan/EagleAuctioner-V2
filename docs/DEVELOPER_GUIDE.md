# Developer Integration Guide

## 1. Local Environment Setup
```bash
# Clone repository and start backend
cd backend
mvn spring-boot:run -Dspring-boot.run.profiles=dev

# Start frontend development server
npm install
npm run dev
```

## 2. Adding New Action Permissions
1. Create a new Flyway migration script (e.g. `V9__new_feature_permissions.sql`).
2. Insert permission record:
   ```sql
   INSERT INTO permissions (id, name, action_key, module, description, version) VALUES
   (gen_random_uuid(), 'My Action', 'my.action.key', 'MODULE', 'Description', 0);
   ```
3. Annotate REST controller method:
   ```java
   @PostMapping("/my-endpoint")
   @PreAuthorize("hasAuthority('my.action.key')")
   @EnforceDataScope(DataScopeType.COMPANY)
   public ResponseEntity<?> myMethod() { ... }
   ```
