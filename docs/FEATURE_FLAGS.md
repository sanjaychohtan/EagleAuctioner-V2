# Feature Flags & System Configurations

## 1. Feature Flag Architecture
Feature flags are managed dynamically in the database (`feature_flags` table) and controlled via `AdminOperationsController`. Feature toggles can be updated at runtime without requiring application restarts.

## 2. Platform Feature Flags

| Flag Key | Default | Description |
| :--- | :---: | :--- |
| `FEATURE_PROXY_BIDDING` | `true` | Enables dynamic automated proxy bidding engine |
| `FEATURE_SEALED_BIDDING` | `true` | Enables cryptographic hash-based sealed bidding |
| `FEATURE_AUTO_EXTENSION` | `true` | Enables auto-extension on late bid submissions |
| `FEATURE_EMD_VERIFICATION` | `true` | Enforces Earnest Money Deposit verification before bidding |
| `FEATURE_WHATSAPP_NOTIFICATIONS` | `false` | Enables WhatsApp API notification delivery |
| `FEATURE_MAKER_CHECKER_REFUNDS` | `true` | Enforces Segregation of Duties on refund approvals |

## 3. Dynamic Configuration Keys

| Config Key | Default Value | Description |
| :--- | :--- | :--- |
| `CONF_MAX_AUTO_EXTENSIONS` | `5` | Maximum number of auto-extensions permitted per lot |
| `CONF_AUTO_EXTENSION_WINDOW_SEC` | `120` | Time window in seconds before end-time triggering auto-extension |
| `CONF_AUTO_EXTENSION_DURATION_MIN` | `5` | Duration added in minutes when auto-extension triggers |
| `CONF_REFUND_APPROVAL_THRESHOLD` | `10000` | Financial threshold in INR requiring dual-level refund approval |
