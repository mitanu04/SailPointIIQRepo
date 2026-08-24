# ActiveDirectory

- **File:** `config/Application/Application-ActiveDirectory.xml`
- **Connector:** `ADLDAPConnector` (type `Active Directory - Direct`), via IQService
  (`%%LDAP_HOST%%` / `%%AD_IQSERVICE_PORT%%`)
- **Correlation config:** `ActiveDirectory Correlation Config`
- **Features:** PROVISIONING, SYNC_PROVISIONING, AUTHENTICATE, MANAGER_LOOKUP,
  SEARCH, UNSTRUCTURED_TARGETS, UNLOCK, ENABLE, PASSWORD, CURRENT_PASSWORD
- **Owner:** `Admins`
- **Domain:** `DC=test,DC=local` (NetBIOS `TEST`), users under
  `OU=Employees,OU=Test,DC=test,DC=local`, groups under
  `OU=Groups,OU=Test,DC=test,DC=local`.
- **Create Account form** — sections: Account, User Details, General, Dial-in,
  Exchange, Skype for Business, gmsa (sections dynamically shown/hidden based on
  the selected `objectType`: User / Contact / msDS-GroupManagedServiceAccount /
  msDS-ManagedServiceAccount).

## Features (`featuresString`)

`PROVISIONING, SYNC_PROVISIONING, AUTHENTICATE, MANAGER_LOOKUP, SEARCH,
UNSTRUCTURED_TARGETS, UNLOCK, ENABLE, PASSWORD, CURRENT_PASSWORD`

| Feature | What it enables here |
|---|---|
| `PROVISIONING` / `SYNC_PROVISIONING` | Create/modify/delete supported, and executed synchronously (result known immediately, not queued) |
| `AUTHENTICATE` | Can be used for pass-through IIQ login authentication; `authSearchAttributes` covers `sAMAccountName`, `msDS-PrincipalName`, `mail` |
| `MANAGER_LOOKUP` | Can resolve manager references natively against AD |
| `SEARCH` | Supports arbitrary attribute search — this is what `Check AD CN Uniqueness` relies on for the `sAMAccountName` collision check via `iterateObjects` |
| `UNSTRUCTURED_TARGETS` | Supports unstructured/target permissions (e.g. file share ACLs tied to AD groups) |
| `UNLOCK` / `ENABLE` / `PASSWORD` / `CURRENT_PASSWORD` | Account unlock, enable/disable, password set, and current-password verification are all supported operations |

Notably **absent**: `DIRECT_PERMISSIONS` (no native AD permission objects pulled in
as entitlements) and `DISCOVER_SCHEMA` (schema below was defined manually/via
template rather than live-discovered from the directory).

## Account Schema

`identityAttribute="distinguishedName"` (the DN is what correlates/links the
account), `displayAttribute="sAMAccountName"`, `nativeObjectType="User"`.

| Group | Attributes |
|---|---|
| Standard LDAP/inetOrgPerson | `cn`, `givenName`, `sn`, `displayName`, `mail`, `title`, `department`, `departmentNumber`, `employeeNumber`, `employeeType`, `telephoneNumber`, `mobile`, `homePhone`, `facsimileTelephoneNumber`, `pager`, `l`, `st`, `street`, `streetAddress`, `postalAddress`, `postalCode`, `postOfficeBox`, `homePostalAddress`, `physicalDeliveryOfficeName`, `roomNumber`, `o`, `ou` (multi), `manager`, `secretary`, `seeAlso`, `initials`, `businessCategory`, `carLicense` (multi), `destinationIndicator`, `internationalISDNNumber`, `preferredDeliveryMethod`, `preferredLanguage`, `registeredAddress`, `teletexTerminalIdentifier`, `telexNumber`, `uid` |
| Identity/security | `distinguishedName`, `objectSid`, `objectguid`, `sAMAccountName`, `userPrincipalName`, `msDS-PrincipalName`, `objectType`, `accountFlags` (multi), `objectClass` (multi) |
| Group membership (entitlement) | `memberOf` — `entitlement="true" managed="true" multi="true"`, linked to the `group` schema — see Entitlements below |
| Exchange | `homeMDB`, `mailNickname`, `msExchHideFromAddressLists`, `externalEmailAddress` (internal name `targetAddress`), `msExchRecipientTypeDetails` |
| Skype for Business | `SipAddress`, `SipDomain`, `RegistrarPool`, `LyncPinSet`, `LyncPinLockedOut`, `DialPlan`, `msRTCSIP-UserEnabled` |
| Dial-in/RADIUS | `msNPAllowDialin`, `msNPCallingStationID`, `msRADIUSCallbackNumber`, `msRADIUSFramedRoute`, `msRADIUSFramedIPAddress` |
| Service accounts (gMSA/MSA) | `dNSHostName`, `msDS-ManagedPasswordInterval`, `msDS-SupportedEncryptionTypes` (multi), `msDS-GroupMSAMembership` (multi), `msDS-AllowedToActOnBehalfOfOtherIdentity` (multi), `servicePrincipalName` (multi) |
| Linked mailbox | `shadowAccountDN`, `shadowAccountGuid` |

## Entitlements Schema (Group)

A second `Schema` block, `objectType="group"`, `nativeObjectType="Group"`,
`identityAttribute="distinguishedName"`, `displayAttribute="msDS-PrincipalName"`,
`featuresString="PROVISIONING, GROUPS_HAVE_MEMBERS"`:

- **Attributes:** `cn`, `distinguishedName`, `owner`, `description`, `objectSid`,
  `objectguid`, `mailNickname`, `GroupType`, `GroupScope`, `sAMAccountName`,
  `msDS-PrincipalName`.
- **`memberOf`** — `entitlement="true" multi="true"`, `schemaObjectType="group"` —
  nested group membership (groups belonging to other groups) is itself modeled as
  an entitlement.
- **`groupMemberAttribute = member`** (in the schema's own `Attributes` map) — tells
  the connector which native attribute holds group membership.
- The account schema's `memberOf` (above) is what actually shows up as an
  entitlement/permission on the **account**, `managed="true"` so it's eligible for
  entitlement catalog management (access requests, certifications, etc.); this
  group schema is what backs those entitlement objects.

## Provisioning Policies (`ProvisioningForms`)

Three forms defined, all under `ProvisioningForms`:

1. **`Account` (`type="Create"`, `objectType="account"`)** — the policy documented
   below. Sections: Account, User Details, General, Dial-in, Exchange, Skype for
   Business, gmsa. A hidden-field Beanshell script on the `objectType` field
   dynamically removes/adjusts sections depending on whether you're creating a
   User, Contact, or a Group-Managed/Managed Service Account (Contact drops
   Dial-in/User Details required fields/Skype/gmsa; service accounts drop
   Dial-in/Skype/Exchange and repurpose the gmsa section for gMSA vs. MSA specific
   fields).
2. **`Create Group` (`type="Create"`, `objectType="group"`)** — just
   `distinguishedName` and `sAMAccountName`, both manual/required, no scripting.
3. **`Update Group` (`type="Update"`, `objectType="group"`)** — `GroupType`,
   `GroupScope`, `description`, `mailNickname`, all manual with `reviewRequired`.

**No Update/Delete/Enable/Disable forms exist for the account object type** — only
Create is currently defined; those operations rely on connector defaults rather
than a custom policy.

## Identity-to-AD attribute mapping (Create Account form)

Planned/in-progress mapping (to be applied directly by the app owner, not via this
doc/tooling):

| Identity source | AD attribute | Section | Already in AD Schema? |
|---|---|---|---|
| `identity.getFirstname()` | `givenName` | General | yes |
| `identity.getLastname()` | `sn` | General | yes |
| `identity.getAttribute("pid")` | `employeeNumber` | General | yes |
| `identity.getAttribute("location")` | `l` | General | yes |
| `identity.getAttribute("department")` | `department` | General | yes |
| `identity.getAttribute("position")` | `title` | General | yes |
| `identity.getEmail()` | `mail` | General | yes |
| `identity.getEmail()` | `userPrincipalName` | General | yes |
| `identity.getFirstname() + " " + identity.getLastname()`, under `OU=Employees,OU=Test,DC=test,DC=local` | `distinguishedName` | Account | yes |
| first initial of firstname + lastname, lowercased, truncated to 20 chars | `sAMAccountName` | User Details | yes |

Still open: `password` generation (no AD-specific `PasswordPolicy` or generator
`Rule` exists yet in this repo, unlike OpenLDAP's).

`mail` and `userPrincipalName` both source from `identity.getEmail()` but populate
two distinct AD attributes and are scripted independently — not one deriving from
the other — so they can diverge later if needed (e.g. a UPN suffix that differs
from the mail domain). Note AD only accepts a `userPrincipalName` whose domain
suffix is a registered UPN suffix in the forest; verify this against
`domainSettings`/`forestSettings` before assuming email and UPN domains always match.

## `distinguishedName` / `sAMAccountName` uniqueness

The form scripts above only build a *candidate* DN and `sAMAccountName` — they
don't check AD for collisions. Uniqueness is enforced live in AD by a
`beforeProvisioningRule`:

- **Rule:** `Check AD CN Uniqueness` (`config/Rule/Rule-Check AD CN Uniqueness.xml`,
  `type="BeforeProvisioning"`), wired via
  `<entry key="beforeProvisioningRule" value="Check AD CN Uniqueness"/>`.
- For each `Create` `AccountRequest` on this app, it uses
  `ConnectorFactory.getConnector(application, null)` (the app's own configured AD
  connector — no manual host/port/credential handling) to check whether the
  candidate `distinguishedName` already exists (`connector.getObject("account", dn,
  null)`, catching `ObjectNotFoundException`) and whether the candidate
  `sAMAccountName` already exists (`connector.iterateObjects("account",
  Filter.eq("sAMAccountName", sam), null)`, since `sAMAccountName` isn't AD's
  identity attribute and needs a search — relies on the app's `SEARCH` feature).
- Both checks share a single incrementing numeric suffix, so a collision produces
  a matched pair, e.g. `CN=John Smith 2,OU=Employees,...` with `sAMAccountName =
  jsmith2` — the two never drift apart.
- `sAMAccountName` stays truncated to AD's 20-character limit even after the
  suffix is appended.
- Only checks live AD (via the connector), not just IIQ's aggregated `Link` cache
  — catches accounts created outside IIQ too, at the cost of an extra AD
  round-trip per Create request.
- `userPrincipalName` uniqueness is **not yet** covered by this rule (only DN and
  `sAMAccountName` are checked) — extend the same suffix loop if that needs
  enforcing too.

Create/Update Group forms exist but are manual (no identity-derived fields).

## Cross-references

`config/Rule/Rule-Check AD CN Uniqueness.xml`. See [index](../Applications.md) for
the full rule list across all apps.
