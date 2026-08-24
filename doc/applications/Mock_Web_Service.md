# Mock Web Service

- **File:** `config/Application/Application-Mock Web Service.xml`
- **Connector:** `WebServicesConnector` (type `Web Services`), REST base URL
  `http://localhost:8081/api/v1`
- **Correlation config:** `MockWebService Correlation Config`
- **Features:** PROVISIONING, ENABLE, PASSWORD, AUTHENTICATE, UNLOCK
- **Endpoints configured:** Test Connection (`GET /connection`), Account Aggregation
  (`GET /users`), Get Object (`GET /users/{id}`), Disable Account
  (`PATCH /users/{id}/disable`, `beforeRule = DisableAccount-BeforeRule`), Enable
  Account (`PATCH /users/{id}/enable`, `beforeRule = EnableAccount-BeforeRule`),
  Create Account (`POST /users`, JSON body built from the provisioning plan).
- **Owner:** `Admins`
- **Create form:**

  | Identity source | Target attribute |
  |---|---|
  | script: next sequential numeric id (queries existing `Link`s for this app, +1) | `id` |
  | `identity.name` | `userName` |
  | `identity.firstname` | `firstName` |
  | `identity.lastname` | `lastName` |
  | `identity.getEmail()` | `email` |
  | `position` | `position` |
  | `location` | `location` |
  | `department` | `department` |

- **Account schema** (`identityAttribute="id"`): `id, userName, firstName, lastName,
  email, active (boolean), position, location, status, department, phoneNumber`.
  Group schema exists but is empty (no group attributes defined yet).

## Cross-references

`config/Rule/Rule-DisableAccount-BeforeRule.xml`,
`config/Rule/Rule-EnableAccount-BeforeRule.xml`. See [index](../Applications.md)
for the full rule list across all apps.
