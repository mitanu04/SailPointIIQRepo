# OpenLDAP

- **File:** `config/Application/Application-OpenLDAP.xml`
- **Connector:** `LDAPConnector` (type `OpenLDAP - Direct`)
- **Correlation config:** `OpenLDAP Correlation Config`
- **Features:** AUTHENTICATE, PROVISIONING, SYNC_PROVISIONING, PASSWORD,
  MANAGER_LOOKUP, SEARCH
- **Owner:** `Admins`
- **Provisioning rules:** `beforeProvisioningRule = Move_LDAPAccount_to_OU`,
  `afterProvisioningRule = LDAP After Provisioning Welcome Email`
- **Password policy:** `LDAP Password Policy`, generated via
  `Rule-Generate OpenLDAP Password` (uses `PasswordGenerator` against that policy)
- **Create Account form** — fully mapped from the identity cube:

  | Identity source | LDAP attribute |
  |---|---|
  | `identity.getType()` (employee/contractor/other) + first/last name | `dn` (different OU per type) |
  | `Rule: Generate OpenLDAP Password` | `password` |
  | firstname + lastname | `cn` |
  | firstname | `givenName` |
  | lastname | `sn` |
  | `identity.getEmail()` (fallback `mock@example.com`) | `mail` |
  | `position` (fallback `Unknown`) | `title` |
  | `location` (fallback `Unknown`) | `l` |
  | `pid` (fallback `Unknown`) | `employeeNumber` |
  | `department` (fallback `Unknown`) | `physicalDeliveryOfficeName` |
  | static `"active"` | `employeeType` |
  | `identity.getName()` | `uid` |

- Group Create/Update forms exist but are manual (`dn`, `sAMAccountName`-equivalent
  fields not scripted).

## Cross-references

`config/Rule/Rule-Move_LDAPAccount_to_OU.xml`,
`config/Rule/Rule-Generate OpenLDAP Password.xml`. See [index](../Applications.md)
for the full rule list across all apps.
