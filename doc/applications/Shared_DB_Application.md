# Shared_DB Application

- **File:** `config/Application/Application-Shared_DB Application.xml`
- **Connector:** `JDBCConnector` (type `JDBC`), backing store `shared_db_table` (MySQL)
- **Correlation config:** `Shared_DBApplication Correlation Config`
- **Features:** DISCOVER_SCHEMA, PROVISIONING, SYNC_PROVISIONING, DIRECT_PERMISSIONS,
  SEARCH, ENABLE, UNLOCK
- **Rules:** `buildMapRule = Aggregate-AccountStatus-Shared_DB`,
  `jdbcProvisionRule = Shared_DB-Provisioning-Rule`, `provisionRule = globalRule`
- **Owner:** `Admins`
- **Update form** (`Shared_DB_Table`): `location`, `department` mapped from identity
  attributes of the same name; `email` from `identity.getEmail()`.
- **Create form** (`Create`):

  | Identity source | Target attribute |
  |---|---|
  | `firstname` | `firstname` |
  | `lastname` | `lastname` |
  | `firstname` + `"."` + `lastname` + `"@example.com"` (`ValidationScript`) | `email` |
  | `department` | `department` |
  | `position` | `position` |
  | `location` | `location` |
  | static `"Active"` | `status` |
  | `pid` | `pid` |
  | first initial of firstname + lastname, lowercased | `username` |

  > **Known issue:** the `email` field's `ValidationScript` has a syntax bug — the
  > `lastname` string literal is missing its closing quote
  > (`identity.getAttribute("lastname)+ "@example.com"`). Flagging here since the
  > convention in this repo is not to edit `config/Application/*.xml` directly on
  > the app owner's behalf; worth fixing next time that file is touched.

- **Account schema** (`identityAttribute="username"`): `username, pid, first_name,
  last_name, email, department, groups (entitlement/group), position, location,
  status`. **Group schema:** `group_name, description`.

## Cross-references

`config/Rule/Rule-Aggregate-AccountStatus-Shared_DB.xml`,
`config/Rule/Rule-Shared_DB-Provisioning-Rule.xml`. See [index](../Applications.md)
for the full rule list across all apps.
