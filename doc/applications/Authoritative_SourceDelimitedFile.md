# Authoritative_SourceDelimitedFile

- **File:** `config/Application/Application-Authoritative_SourceDelimitedFile.xml`
- **Connector:** `DelimitedFileConnector` (type `DelimitedFile`), `authoritative="true"`
- **Purpose:** The authoritative HR source feed for the whole instance — read-only,
  no provisioning forms defined.
- **Source file:** `%%AUTHORITATIVE_DELIMITED_FILE%%`, comma-delimited, has header.
- **Owner:** `spadmin`
- **Manager correlation:** `managerCorrelationFilter` matches on `displayName = UserName`.
- **Account schema** (`identityAttribute="PID"`, `displayAttribute="UserName"`):
  `UserName, FirstName, LastName, Manager, Location, Position, Department, Status,
  PID, Type, CostCenter (multi)`.
- **No correlation config, no provisioning forms** — this is the trust source that
  `pid`, `location`, `department`, `position` (used by every other onboarded app —
  see [OpenLDAP](OpenLDAP.md), [ActiveDirectory](ActiveDirectory.md), etc.) are
  ultimately derived from.
