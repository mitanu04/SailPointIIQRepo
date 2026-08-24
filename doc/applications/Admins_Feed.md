# Admins_Feed

- **File:** `config/Application/Application-Admins_Feed.xml`
- **Connector:** `JDBCConnector` (type `SQLLoader`, CSV via JDBC-CSV driver) —
  source `sqlloader_accounts.csv`
- **Correlation config:** `Admins_Feed Correlation Config`
- **Features:** DISCOVER_SCHEMA, PROVISIONING, SYNC_PROVISIONING, DIRECT_PERMISSIONS,
  ENABLE, PASSWORD
- **Rules:** `buildMapRule = SQLLoader-Status-Aggregation`,
  `jdbcProvisionRule = SQLLoader-Provisioning-Rule`, `provisionRule = globalRule`
- **Owner:** `Admins`
- **Create form:**

  | Identity source | Target attribute |
  |---|---|
  | `pid` | `pid` |
  | first initial of firstname + lastname, lowercased | `username` |
  | firstname + " " + lastname | `fullName` |
  | firstname + "." + lastname + "@example.com" | `email` |
  | `department` | `department` |
  | `position` | `title` |
  | static `"Active"` | `status` |
  | random 4-digit id, script-generated (`"SL" + 0000-9999`) | `accountId` |
  | static `"APP_USER"` | `systemRole` |

- **Disable form:** sets `status = "Inactive"`.
- **Account schema** (`identityAttribute="accountId"`): `accountId, pid, username,
  fullName, email, department, title, status, systemRole, lastAccess`.

## Cross-references

`config/Rule/Rule-SQLLoader-Status-Aggregation.xml`,
`config/Rule/Rule-SQLLoader-Provisioning-Rule.xml`. See [index](../Applications.md)
for the full rule list across all apps.
