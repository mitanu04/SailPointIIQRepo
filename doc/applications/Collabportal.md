# Collabportal

- **File:** `config/Application/Application-Collabportal.xml`
- **Connector:** `DelimitedFileConnector` (type `DelimitedFile`) — target file
  `CollabPortal_Target_Accounts.csv`
- **Correlation config:** `Collabportal Correlation Config`
- **Features:** DIRECT_PERMISSIONS, NO_RANDOM_ACCESS, DISCOVER_SCHEMA
- **Owner:** `Admins`
- **Status filters:** `disableAccountFilter` on `accountStatus = Disabled`,
  `lockAccountFilter` on `accountStatus = Locked`, `serviceAccountFilter` on
  `jobTitle = Service Account`.
- **No `ProvisioningForms`** — this app is aggregation/reporting only right now;
  no Create/Update policy has been defined, so nothing is provisioned to it yet.
- **Account schema** (`identityAttribute="accountId"`): `accountId, pid, firstName,
  lastName, displayName, email, department, jobTitle, accountStatus, licenseType,
  mfaEnabled, officeLocation, phone, createdDate, lastLogin`.
