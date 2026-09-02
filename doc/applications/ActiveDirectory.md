# ActiveDirectory

## What this application does

SailPoint **IdentityIQ** (**IIQ**) is an identity-governance product: it keeps track
of *who* should have *what* access across many connected systems. Each connected
system is represented in IIQ by an **Application** (also called a **source**). This
page documents one such Application, named **`ActiveDirectory`**, which connects IIQ
to a **Microsoft Active Directory** domain (here, a test domain called `test.local`).

With this Application in place, IIQ can:

- **Read** every user account and group out of AD — this scheduled read is called an
  **aggregation**.
- **Create and change** AD accounts on request — creating an account, setting its
  password, enabling/disabling it, adding it to groups. Making a change in a
  connected system is called **provisioning**.
- Let people **log in** to IIQ using their AD credentials (pass-through
  authentication).

IIQ does not talk to Active Directory directly for the write operations. Because AD
is a Windows technology, SailPoint ships a small Windows helper service called
**IQService** that sits next to AD and carries out the changes. So the path is:

```
  IIQ  ──(reads: search/aggregation)──────────────►  Active Directory
  IIQ  ──(writes: create/password/enable)──► IQService ──►  Active Directory
```

## Key terms (glossary)

You will see these words throughout the page:

| Term | Plain-English meaning |
|---|---|
| **Application / source** | IIQ's representation of one connected system (this file *is* the ActiveDirectory Application). |
| **Connector** | The driver IIQ uses to talk to a system. This one is `ADLDAPConnector`, type *Active Directory - Direct*. |
| **IQService** | A small SailPoint Windows service that performs AD writes on IIQ's behalf. |
| **Aggregation** | IIQ reading accounts/groups *from* the system (a scheduled sync into IIQ). |
| **Provisioning** | IIQ making a change *in* the system (create account, set password, add to group…). |
| **Account** | A user object in AD (e.g. the user `rkeane`). |
| **Group / Entitlement** | An AD group. In IIQ, group membership is an **entitlement** — a unit of access that can be requested, approved, and certified. |
| **Schema** | The list of attributes IIQ knows about for an object (account attributes, group attributes). |
| **Correlation** | Matching an AD account to the right person (Identity) in IIQ. |
| **Provisioning Policy / form** | The form that defines *how* a new account's fields are filled in when IIQ creates it. |
| **Bind / service account** | The AD login IIQ/IQService uses to connect to AD and make changes (here `administrator@test.local`). |
| **DN** (distinguished name) | An object's full path in the directory, e.g. `CN=Ryan Keane,OU=Employees,OU=Test,DC=test,DC=local`. |
| **OU** (organizational unit) | A folder inside AD that holds accounts or groups (e.g. `OU=Employees`). |
| **UPN** (user principal name) | A login in email form, e.g. `administrator@test.local`. |
| **LDAP / LDAPS** | The protocol used to talk to a directory. **LDAPS** is the encrypted (SSL/TLS) version — required for setting passwords. |
| **Trust store** | The list of certificate authorities a program is willing to trust for SSL. Java and Windows each have their own — see the troubleshooting section. |
| **SSB** | *Services Standard Build* — SailPoint's build tool that deploys these XML files into IIQ. |
| **`%%TOKEN%%`** | A placeholder in the XML that SSB replaces at build time with a value from a `*.target.properties` file (so the same XML works in dev, test, prod). |

---

## Technical quick reference

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

> **Setting this up / hitting connection or password errors?** Jump to
> [Deployment, Connectivity & Troubleshooting](#deployment-connectivity--troubleshooting)
> for the lab topology, the two trust stores, the exact connection settings, and a
> symptom → cause → fix log of every error seen bringing this app online.

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
| first initial + `.` + lastname, lowercased, truncated to 20 chars (e.g. *Mihai Mergea* → `m.mergea`) | `sAMAccountName` | User Details | yes |

Still open: `password` generation (no AD-specific `PasswordPolicy` or generator
`Rule` exists yet in this repo, unlike OpenLDAP's).

`mail` and `userPrincipalName` both source from `identity.getEmail()` but populate
two distinct AD attributes and are scripted independently — not one deriving from
the other — so they can diverge later if needed (e.g. a UPN suffix that differs
from the mail domain). Note AD only accepts a `userPrincipalName` whose domain
suffix is a registered UPN suffix in the forest; verify this against
`domainSettings`/`forestSettings` before assuming email and UPN domains always match.

## `distinguishedName` / `sAMAccountName` uniqueness

> **Current state: uniqueness checking is DISABLED.** The `beforeProvisioningRule` is
> unwired (`<entry key="beforeProvisioningRule"/>` is empty), so the DN and
> `sAMAccountName` come **straight from the provisioning-policy scripts** with no
> collision handling. If a computed DN or `sAMAccountName` already exists in AD, the
> Create **fails** with a duplicate/constraint error rather than auto-adjusting.
> Acceptable for controlled testing; re-enable the rule below before relying on this
> for real provisioning.

The provisioning-policy scripts only build a *candidate* DN and `sAMAccountName` —
they don't check AD for collisions. A `beforeProvisioningRule` exists to enforce
uniqueness live in AD, but is **not currently wired to the app**:

- **Rule:** `AD_CreateAccount` (`config/Rule/Rule-AD_CreateAccount.xml`,
  `type="BeforeProvisioning"`). *(This is the logic previously referred to as
  "Check AD CN Uniqueness"; the actual rule/file name is `AD_CreateAccount`.)*
- **To re-enable:** set
  `<entry key="beforeProvisioningRule" value="AD_CreateAccount"/>` in the app.
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
  j.smith2` — the two never drift apart.
- `sAMAccountName` stays truncated to AD's 20-character limit even after the
  suffix is appended.
- Only checks live AD (via the connector), not just IIQ's aggregated `Link` cache
  — catches accounts created outside IIQ too, at the cost of an extra AD
  round-trip per Create request.
- `userPrincipalName` uniqueness is **not** covered by this rule (only DN and
  `sAMAccountName` are checked) — extend the same suffix loop if that needs
  enforcing too.

> **Known robustness gap in the rule** (relevant if you re-enable it): the DN check
> at `connector.getObject(...)` catches only `ObjectNotFoundException`, so any other
> connector exception propagates and aborts the whole Create — while the
> `sAMAccountName` check swallows/logs its exceptions. Consider widening the
> `getObject` catch before relying on the rule in production.

Create/Update Group forms exist but are manual (no identity-derived fields).

## Deployment, Connectivity & Troubleshooting

**What this section is for:** getting the Application to actually *connect* to AD and
successfully create a user with a password. Reading accounts and writing them have
different requirements, and several settings must line up before a password can be
set. Read the "big picture" below, then follow the checklist in order — most
first-time failures come from doing these steps out of order or skipping one.

**The big picture (why this is fiddly):** setting an AD password only works when
**three** things are all true at once — (1) the connection is **encrypted (LDAPS,
port 636)**, because AD refuses to set a password over a plain connection; (2) the
program making the connection **trusts the AD server's certificate**; and (3) the
**bind account** IIQ logs in with has permission to reset passwords. Most of the
errors in the log below are just *one* of those three not being satisfied yet.

This app was brought online against a **local lab AD** (a Docker container) rather
than a real corporate domain. That environment shapes almost every setting and every
error below, so it is documented first.

### First-time setup checklist (do these in order)

1. **AD is running and reachable.** The `ad-test` container is up; the host can reach
   `dc1.test.local:636`.
2. **IIQ has its base config.** `ConnectorRegistry` exists (troubleshooting #2), and
   Tomcat has enough heap (#3).
3. **Trust the AD certificate in both places** — Windows *and* Java (host setup steps
   2–3). Both are required; trusting only one leaves half the operations failing.
4. **Make `dc1.test.local` resolve** via the hosts file (host setup step 4).
5. **Enter the connection settings** exactly as in the tables below — especially
   **Servers = host only**, **Port = 636**, **Use SSL = on**, and the bind account in
   **UPN** form.
6. **Test Connection** in the IIQ UI. Fix whatever it reports using the log below,
   then re-test until it passes.
7. **Aggregate** (reads accounts), then **create a test user** (writes + password).

### Lab topology

```
IIQ (Tomcat 9 on JDK 17)  --- LDAPS search / Test Connection --->  \
                                                                     dc1.test.local
IQService (.NET Windows svc) --- LDAPS provisioning / password --->  /   (Samba AD)
```

- **Directory:** the `ad-test` Docker container, image `nowsci/samba-domain` — a
  Samba-based Active Directory. Forest/domain **`test.local`**, NetBIOS **`TEST`**,
  DC **`dc1.test.local`**. The container publishes `389, 636, 3268, 3269, 88, 464`
  on the host.
- **Host:** a **workgroup** Windows 11 **Home** laptop — **not domain-joined**, and
  Home edition *cannot* join a domain. This is the single most important fact for
  the password-provisioning errors below.
- **IQService:** installed locally as the Windows service
  `IQService-IQService-ADTest`, listening on `5050`/`5051`.
- **IIQ:** Tomcat 9 running as the `Tomcat9` Windows service on
  `C:\Program Files\Java\jdk-17`.

> **Not to be confused with OpenLDAP.** A separate `openldap` container also runs in
> this lab. It originally collided with `ad-test` on host ports `389`/`636`, so
> OpenLDAP was remapped to **`3890`/`6360`** (see `docker-compose.yml` and
> [OpenLDAP.md](OpenLDAP.md)). AD keeps the standard `389`/`636`.

### The two trust stores (the concept that explains most SSL errors)

The AD connector opens LDAPS from **two different runtimes**, each with its **own**
trust store. The Samba DC uses a **self-signed** cert (CN `DC1.test.local`, issued
by Samba's autogenerated CA), so **both** stores must trust that CA — and they fail
independently, which is why the same "trust" problem can surface twice:

| Operation | Runtime | Trust store to import the CA into |
|---|---|---|
| **Test Connection, aggregation, search** | **IIQ / Java** (Tomcat JVM) | **`cacerts`** of `C:\Program Files\Java\jdk-17` |
| **Create / set password / enable / unlock** | **IQService / .NET** | **Windows** "Trusted Root Certification Authorities" (LocalMachine) |

### Token values (dev target)

Resolved from `dev.target.properties` (the active target — `sandbox` points at
`example.com`). After the fixes below:

| Token | Value | Feeds |
|---|---|---|
| `%%LDAP_HOST%%` | `localhost` | IQService host, GC server |
| `%%LDAP_PORT%%` | **`636`** (was `389`) | domain LDAP port |
| `%%AD_IQSERVICE_PORT%%` | `5051` | IQService port |
| `%%AD_DC%%` | `test.local` | forest name, UPN suffix |

### Required connection settings (correct values)

**IQService Configuration**

| Field | Value | Notes |
|---|---|---|
| IQService Host / Port | `localhost` / `5051` | |
| IQService User / Password | *blank* | Optional — only needed if IQService itself is configured to require authenticated/TLS clients. A plain local install does not; a stray value here does nothing for AD. |
| Use TLS (IQService) | off | This is the IIQ↔IQService channel, **separate** from AD SSL. |

**Domain Configuration**

| Field | Value | Notes |
|---|---|---|
| Domain DN | `DC=test,DC=local` | |
| NetBIOS | `TEST` | |
| **Servers** | **`dc1.test.local`** | **Host only — no port.** The Port field supplies the port; adding `:636` here produces `dc1.test.local:636:636`. Must be the cert-CN name, not `localhost`. |
| **Port** | **`636`** | |
| **Use SSL/TLS** | **on** | Mandatory — AD refuses to write `unicodePwd` over cleartext. |
| User / Password | `administrator@test.local` / *(lab)* `Passw0rd123!` | **UPN** or `TEST\administrator` — **never a DN**. |

**Forest Configuration**

| Field | Value | Notes |
|---|---|---|
| Forest Name | `test.local` | |
| Global Catalog | `localhost:3268` | Plaintext GC; no cert match needed, so `localhost` is fine here. |
| Use TLS (forest) | off | GC reads over plaintext `3268`. Consistent with GC port above. |
| User / Password | `administrator@test.local` / `Passw0rd123!` | |

### One-time host setup

1. **Export the Samba CA** from the container (already saved to
   `C:\SailPoint\ldap\samba-ca.crt`, CN `DC1.test.local`, valid to 2028):
   ```bash
   docker exec ad-test cat /var/lib/samba/private/tls/ca.pem > samba-ca.crt
   ```
2. **Trust it in Windows** (for IQService / .NET) — elevated:
   ```cmd
   certutil -addstore -f Root "C:\SailPoint\ldap\samba-ca.crt"
   ```
3. **Trust it in Java** (for IIQ / Tomcat) — elevated, then restart Tomcat:
   ```powershell
   & 'C:\Program Files\Java\jdk-17\bin\keytool.exe' -importcert -noprompt -trustcacerts `
     -alias samba-test-ca -file 'C:\SailPoint\ldap\samba-ca.crt' `
     -keystore 'C:\Program Files\Java\jdk-17\lib\security\cacerts' -storepass changeit
   Restart-Service Tomcat9
   ```
4. **Resolve the DC name** — the cert CN is `DC1.test.local`, so LDAPS must connect
   by that name. Add to `%windir%\System32\drivers\etc\hosts` (elevated):
   ```
   127.0.0.1   dc1.test.local
   ```
5. **Import `ConnectorRegistry`** if the IIQ database is fresh (see log below).

### SSB source fixes (so a redeploy doesn't revert the UI)

The deployed app was hand-fixed in the UI, but the SSB source shipped with SSL off /
port 389 / empty servers — a redeploy would overwrite the UI and break it again. The
source now carries the correct values:

- `dev.target.properties`: `%%LDAP_PORT%%=636` (was `389`).
- `Application-ActiveDirectory.xml` → `domainSettings`:
  ```xml
  <entry key="port" value="%%LDAP_PORT%%"/>
  <entry key="servers">
     <value><List><String>dc1.test.local</String></List></value>
  </entry>
  <entry key="useSSL"><value><Boolean>true</Boolean></value></entry>
  ```
  (`<Boolean/>` — an *empty* element — reads as **false**; `<Boolean>true</Boolean>`
  is "on". Optionally replace the literal `dc1.test.local` with an `%%AD_SERVER%%`
  token to keep it environment-driven.)
- Remove the stray **leading space** in the account search base
  (`" OU=Employees,OU=Test,DC=test,DC=local"`), which can invalidate the search DN.

### Troubleshooting log — symptom → cause → fix → why

Every error hit bringing this app online, in order:

1. **Docker: `Bind for 0.0.0.0:389 failed: port is already allocated`**
   - *Cause:* the `ad-test` AD container already owns host `389`/`636`; `openldap`
     tried to bind the same ports.
   - *Fix:* remap OpenLDAP to `3890`/`6360` in `docker-compose.yml`.
   - *Why:* only one process can bind a host port. AD keeps the standard ports;
     OpenLDAP moves.

2. **`Unable to find ConnectorRegistry configuration object`**
   - *Cause:* the IIQ database was missing the base `ConnectorRegistry` `Configuration`
     object (partial/failed init import).
   - *Fix:* `iiq console` → `import init.xml` (or
     `import WEB-INF/config/connectorRegistry.xml`); verify with
     `get Configuration ConnectorRegistry`.
   - *Why:* IIQ reads this object to know which connector types exist; without it the
     Applications page/connector list can't load.

3. **`Velocity is not initialized correctly` + `OutOfMemoryError: Java heap space`
   (BSF script) + failed welcome email**
   - *Cause:* the Tomcat service max heap was **256 MB** (`JvmMx`). Under real
     provisioning the JVM exhausted heap; class init then failed in random places —
     including Velocity, which broke email templating. Only one velocity jar exists,
     so it was **not** a jar conflict.
   - *Fix (elevated):* raise the service heap in the Procrun registry and restart:
     ```powershell
     $p='HKLM:\SOFTWARE\WOW6432Node\Apache Software Foundation\Procrun 2.0\Tomcat9\Parameters\Java'
     Set-ItemProperty $p JvmMs 1024; Set-ItemProperty $p JvmMx 4096
     Restart-Service Tomcat9
     ```
   - *Why:* `setenv.bat`/`CATALINA_OPTS` are **ignored** for a Windows service — heap
     comes only from the Procrun `JvmMs`/`JvmMx` values.

4. **`Service Account is configured in invalid format for Domain [dc=test,dc=local].
   Ensure ... msDS-PrincipalName or userPrincipalName format`**
   - *Cause:* the AD bind account was set as a **DN**
     (`CN=Administrator,CN=Users,...`).
   - *Fix:* use UPN `administrator@test.local` (or down-level `TEST\administrator`).
   - *Why:* the AD connector requires the service account as UPN or `DOMAIN\user`,
     not a DN.

5. **IQService: `HRESULT:[0x80070005]` "Error occurred while setting password"**
   - *Cause:* `0x80070005` = **access denied**. IQService ran as **LocalSystem** on a
     **workgroup** box, so the password op fell to the ADSI `SetPassword` path, which
     runs under the powerless machine/local identity.
   - *Fix:* don't chase the service logon — a workgroup box has no domain identity to
     grant. Force the **LDAPS `unicodePwd`** path instead: **Use SSL on, port 636, to
     `dc1.test.local`**, using the configured **`administrator@test.local`** bind
     account (which *does* have reset rights in the container).
   - *Why:* AD only writes passwords over a secure channel, and on a non-domain host
     the ADSI path can never authenticate — the connector's SSL bind credentials are
     what carry the authority.

6. **"Do I need an IQService User?"**
   - *Answer:* No, for this lab. That field authenticates **IIQ → IQService**, not to
     AD. It only matters if IQService is configured to require authenticated/TLS
     clients. Leave it blank; the **AD bind account** is the one that touches AD.

7. **`MalformedURLException: unsupported authority: dc1.test.local:636:636`**
   - *Cause:* the **Servers** field held `dc1.test.local:636` **and** the Port field
     was `636` — the connector appended the port again.
   - *Fix:* Servers = `dc1.test.local` (host only); Port = `636`.
   - *Why:* the Servers field is the host; the Port field supplies the port.

8. **`SSLHandshakeException: PKIX path building failed ... unable to find valid
   certification path to requested target`**
   - *Cause:* a **Java** trust error — Test Connection runs from **IIQ (Tomcat JVM)**,
     whose `cacerts` did not trust the Samba CA. (The Windows import from step 5 only
     covered IQService/.NET.)
   - *Fix:* import `samba-ca.crt` into `jdk-17`'s `cacerts` with `keytool` (see host
     setup step 3), then restart Tomcat.
   - *Why:* IIQ and IQService use **separate** trust stores; both must trust the
     self-signed CA. This is the two-trust-store point above, seen in practice.

## Cross-references

`config/Rule/Rule-Check AD CN Uniqueness.xml`. See [index](../Applications.md) for
the full rule list across all apps. Directory container / port layout:
`docker-compose.yml` and [OpenLDAP.md](OpenLDAP.md).
