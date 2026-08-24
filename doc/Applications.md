# Onboarded Applications

Index of documentation for every application currently onboarded into this
SailPoint IdentityIQ instance, per the documentation requirement in `CLAUDE.md`.
Source of truth for each app is its `config/Application/Application-<Name>.xml`
file — each linked doc summarizes connector, provisioning, and
identity-attribute-mapping details that aren't obvious from skimming the XML.

Identity attribute names referenced across these docs (`pid`, `location`,
`department`, `position`, `firstname`, `lastname`, `email`) come from
`config/ObjectConfig/ObjectConfig-Identity.xml`.

## Applications

- [Authoritative_SourceDelimitedFile](applications/Authoritative_SourceDelimitedFile.md) — authoritative HR source feed, read-only
- [OpenLDAP](applications/OpenLDAP.md) — fully mapped Create Account provisioning policy
- [Shared_DB Application](applications/Shared_DB_Application.md) — JDBC/MySQL target, Create + Update forms
- [Admins_Feed](applications/Admins_Feed.md) — SQLLoader/CSV target, Create + Disable forms
- [Mock Web Service](applications/Mock_Web_Service.md) — REST target, Create form
- [Collabportal](applications/Collabportal.md) — aggregation-only, no provisioning yet
- [ActiveDirectory](applications/ActiveDirectory.md) — Create Account policy in progress, includes the `Check AD CN Uniqueness` rule

## Cross-application rules referenced

`Move_LDAPAccount_to_OU`, `LDAP After Provisioning Welcome Email`,
`Generate OpenLDAP Password`, `Aggregate-AccountStatus-Shared_DB`,
`Shared_DB-Provisioning-Rule`, `SQLLoader-Status-Aggregation`,
`SQLLoader-Provisioning-Rule`, `globalRule`, `DisableAccount-BeforeRule`,
`EnableAccount-BeforeRule`, `Check AD CN Uniqueness` — all under `config/Rule/`.
