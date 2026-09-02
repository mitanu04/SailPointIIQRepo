# Installing a Brand-New IdentityIQ Instance via SSB

This guide covers standing up a **new** IdentityIQ environment from scratch using
this repo's Services Standard Build (SSB) tooling — not updating an existing one
(see [Ongoing Updates](#ongoing-updates-after-the-initial-install) at the bottom
for that). For the full official reference, see
`doc/Services-Standard-Build-User-Guide.pdf`; this doc is the condensed,
environment-specific version based on how this repo is actually laid out.

> **Scope: IdentityIQ 8.5 only.** Every filename, path, and property value
> below (`identityiq-8.5.zip`, `identityiq-8.5p2.jar`, `IIQVersion=8.5`, etc.)
> is specific to installing **version 8.5**, matching what this repo is
> configured for. Installing a different IIQ version means different GA/patch
> filenames and possibly different property names — consult
> `doc/Services-Standard-Build-User-Guide.pdf` and SailPoint Community for
> that version's specifics rather than assuming this guide transfers as-is.

## 1. Get the SSB project (extract the zip)

This repo *is* the result of this step, already done — but if you're
starting completely fresh (a new machine, a new environment with no existing
checkout), this is genuinely your first action:

1. Obtain the SSB distribution zip from your SailPoint delivery/implementation
   team — it is **not** the same download as IdentityIQ itself; SSB is
   Services' Ant-based automation wrapper (`build.xml`, `scripts/`, `lib/`,
   the `base/{ga,patch,efix,ap}` folders, a starter `config/`, etc.), separate
   from the IIQ product binaries.
2. **Extract that zip** to a folder of your choice — e.g.
   `C:\SailPoint\ssb`. That extracted folder becomes your project root; every
   `ant` command in this guide is run from inside it.

This is the **only** zip you extract by hand. The IdentityIQ GA zip (and
patch, if used) get copied in *still zipped* in step 3 — Ant extracts those
automatically as part of the build. Don't extract the IIQ zip yourself; see
the note at the start of step 3 for why.

## 2. Prerequisites

- **JDK** matching the IIQ version's supported Java level (this repo uses
  `C:/Program Files/Java/jdk-17`, configured via `jdk.home.1.6` in
  `build.properties`).
- **Apache Tomcat** (this repo targets Tomcat 9.0) with `CATALINA_HOME` set.
- **A database server** — MySQL, Oracle, SQL Server, or DB2 (this repo uses
  local MySQL 8.0), installed, running, and reachable, with **admin-level
  credentials** to connect with (this repo uses `db.userid=root`). You do
  **not** need to pre-create the `identityiq` database/schema itself for
  MySQL or SQL Server — SSB's `createdb` target does that automatically
  (its script literally runs `CREATE DATABASE IF NOT EXISTS` /
  `CREATE DATABASE`, plus creates the DB user). Admin credentials are needed
  precisely because `createdb` issues those statements itself.
  **Oracle** is different: the tablespace/user creation in the shipped
  script is commented out by default (the datafile path is
  environment-specific) — either customize and uncomment it yourself, or set
  `db.oracle.createTableSpace=true` / `db.oracle.createUser=true` in
  `build.properties`. **DB2** expects bufferpool/tablespace setup ahead of
  time too (see the commented `db.db2.*` properties in `build.properties`).
- **Apache Ant** on your PATH.
- **A JavaScript engine available to Ant, if your JDK is 15+.** `createdb`
  and `extenddb` depend on `-init-db-properties`, which runs an Ant
  `<script language="javascript">` task. Nashorn (Java's built-in JS engine)
  was **removed in JDK 15**, so on JDK 17 (this repo's JDK) that task fails
  outright with `Unable to create javax script engine for javascript` —
  before it ever touches the database. Fix: download a standalone engine
  (Mozilla Rhino) and add it to Ant's classpath for the run:
  ```powershell
  mkdir C:\js-engine-lib
  curl -o C:\js-engine-lib\rhino.jar https://repo1.maven.org/maven2/org/mozilla/rhino/1.7.14/rhino-1.7.14.jar
  curl -o C:\js-engine-lib\rhino-engine.jar https://repo1.maven.org/maven2/org/mozilla/rhino-engine/1.7.14/rhino-engine-1.7.14.jar
  ant -lib C:\js-engine-lib createdb
  ```
  `-lib <dir>` only affects that one invocation — it doesn't install
  anything system-wide. You need this for **every** `ant createdb` /
  `ant extenddb` /`ant dropdb` call, not just the first.
- **IdentityIQ GA binaries** — download `identityiq-<version>.zip` from
  [SailPoint Community/Compass](https://community.sailpoint.com) for the
  version you're installing. **Do not extract it** — see step 3.
- **(Optional) A patch** — `identityiq-<version>p<N>.jar`, also from SailPoint
  Community, if you want to install on top of a specific patch level rather
  than bare GA.
- A valid IIQ **license file** (required for the app to run; consult your
  SailPoint license management process for this environment).

## 3. Lay down the binaries SSB expects

You don't extract anything yourself — just copy these files in, **still
zipped, exactly as downloaded**:

| What | Copy it to | Filename must be |
|---|---|---|
| GA release | `base/ga/` | `identityiq-<IIQVersion>.zip` (e.g. `identityiq-8.5.zip`) |
| Patch (optional) | `base/patch/` | `identityiq-<IIQVersion><IIQPatchLevel>.jar` (e.g. `identityiq-8.5p2.jar`) |
| eFixes (optional) | `base/efix/<IIQVersion><IIQPatchLevel>/` | as provided by SailPoint support |
| Accelerator Pack (optional) | `base/ap/` | per AP distribution, only if `deployAcceleratorPack=true` |

Those folders already exist in the repo (with `.keep` placeholders) — just
drop the files in. The `<IIQVersion>` / `<IIQPatchLevel>` parts must match
what you set in `build.properties` (step 4), e.g. version `8.5`, patch `p2`.

That's it for this step. When you later run the build, Ant extracts and
layers everything automatically into a working folder (`build/extract`) and
then deploys it to `IIQHome` — you never touch that part by hand. If you want
the mechanics of exactly how that unzip/overlay works, see the
[Appendix](#appendix-how-the-extraction-actually-works) at the end of this
doc.

## 4. Configure the required property files

A fresh SSB build needs **four** property files in place, not just
`build.properties` — the build fails outright at `init-properties` if the
last two are missing. Here's what each one is for and what you have to
create/edit:

| File | What it controls | Required? |
|---|---|---|
| `build.properties` | Build/deploy settings: version, patch, `IIQHome`, Tomcat paths, DB name used by the **Ant scripts** (`createdb`, etc.) | Always — edit the one at repo root |
| `servers.properties` | Maps your machine's hostname/`COMPUTERNAME` to an environment name (a "target", e.g. `dev`) | Always — must contain a line for your hostname |
| `<target>.iiq.properties` (e.g. `dev.iiq.properties`) | The **actual runtime** IIQ config — gets copied verbatim to `WEB-INF/classes/iiq.properties` in the deployed webapp. This is where the real JDBC connection string lives. | Always — must exist, named after your `target` |
| `<target>.target.properties` (e.g. `dev.target.properties`) | `%%TOKEN%%` substitution values applied to `config/` XML at import time (LDAP/AD credentials, delimited file paths, etc.) | Always exists (build fails without it), but its contents only matter if you import `config/` |

### 4a. `build.properties`

```properties
IIQVersion=8.5
IIQPatchLevel=p2                     # omit/comment out for bare GA
customer=YourCustomerName
jdk.home.1.6=C:/Program Files/Java/jdk-17

IIQHome=C:/Program Files/Apache Software Foundation/Tomcat 9.0/webapps/identityiq
application.server.host=localhost
application.server.port=8080
application.server.start=C:/Program Files/Apache Software Foundation/Tomcat 9.0/bin/startup.bat
application.server.stop=C:/Program Files/Apache Software Foundation/Tomcat 9.0/bin/shutdown.bat
tomcat.home=C:/Program Files/Apache Software Foundation/Tomcat 9.0

db.type=mysql
db.url=jdbc:mysql://localhost?useServerPrepStmts=true&tinyInt1isBit=true&characterEncoding=UTF-8&serverTimezone=UTC
db.name=identityiq
db.userid=root
db.password=<your-db-root-password>
db.userName=ssbuser
db.userPassword=ssbpass

console_user=spadmin
console_pass=<encrypted-password, see below>

usingLcm=true
usingRapidSetup=true
```

> **⚠️ Windows path gotcha — use forward slashes, not backslashes.**
> `build.properties` is loaded as a Java `.properties` file, where `\` is an
> escape character. A value like
> `C:\Program Files\Apache Software Foundation\Tomcat 9.0\webapps\identityiq`
> gets silently mangled — Java drops backslashes before letters it doesn't
> recognize as escapes (`\P`, `\A`, `\T`, `\w`, `\i`, etc.), and the resulting
> drive-relative path (`C:Program FilesApache...`) resolves relative to
> wherever Ant is running from — i.e. **into this repo**, not into Tomcat.
> Always write Windows paths in `build.properties` with `/` instead of `\`.

### Generating `console_pass`

`console_pass` must be an IIQ-encrypted string (starts with `1:`), not
plaintext. Encrypt it using the `iiq` console tool once GA binaries are
extracted (see step 5), or reuse the encryption utility from an existing IIQ
install:
```
iiq.bat encrypt <plaintext-password>
```

### 4b. `servers.properties`

One line mapping your machine's `COMPUTERNAME` (Windows) or `HOSTNAME`
(*nix) to a target/environment name. This repo already has:
```properties
DESKTOP-9ICGL95=dev
```
If you're on a different machine, add a line for it. Whatever name you pick
(`dev`, `sandbox`, `test`, ...) becomes `<target>` below. You can override it
per-run without editing this file by setting an `SPTARGET` environment
variable instead.

### 4c. `<target>.iiq.properties` — the file that actually matters for DB isolation

This is easy to overlook because `build.properties` also has DB settings —
**but they control different things**. `build.properties`'s `db.name` only
drives the offline Ant SQL scripts (`createdb`/`patchdb`). The **deployed
webapp's real datasource connection** comes entirely from `<target>.iiq.properties`
(e.g. `dev.iiq.properties`), whose active line looks like:

```properties
dataSource.url=jdbc:mysql://localhost/identityiq?useServerPrepStmts=true&tinyInt1isBit=true&characterEncoding=UTF-8&serverTimezone=UTC
```

If you're building a **second/parallel instance** with its own database, you
must edit the database name in **both** `build.properties` (`db.name=`) *and*
here (`dataSource.url=.../<newdbname>?...`) — otherwise the two instances
will silently end up pointing at the same database at runtime regardless of
what `build.properties` says. Also check `pluginsDataSource.url` and
`dataSourceAccessHistory.url` in the same file if you use plugins/Access
History.

### 4d. `<target>.target.properties`

Must exist (the build fails at `init-properties` without it), but its
`%%TOKEN%%` values only get applied when `config/` is imported
(`import-custom`). If you're doing a plain vanilla install and skipping
`import-custom` (see [Parallel/base install](#setting-up-a-second-parallel-instance)
below), the contents don't matter — just make sure the file exists.

## 5. Run the initial build

SSB provides a single target that does everything needed for a brand-new
environment, in the correct order (`build.xml`, target `initial-build`):

```
clean → cleanWeb → main → createdb → extenddb →
import-stock → import-lcm → patchdb → runUpgrade → import-custom → dist
```

Run it:

```powershell
cd C:\SailPoint\ssb
ant initial-build
```

What each stage does, briefly:

| Stage | Purpose |
|---|---|
| `clean` / `cleanWeb` | Wipes any prior `build/` output and (with confirmation) the existing `IIQHome` directory |
| `main` | Extracts GA, overlays the configured patch + efixes, applies SSB customizations |
| `createdb` | Creates the IIQ schema tables in your database (per `db.type`) |
| `extenddb` | Applies custom schema extensions, only if `usingDbSchemaExtensions=true` |
| `import-stock` | Imports IIQ's default/base configuration objects |
| `import-lcm` | Imports Lifecycle Manager objects, only if `usingLcm=true` |
| `patchdb` | Runs the patch's `upgrade_identityiq_tables-*.sql`, only if `IIQPatchLevel` is set |
| `runUpgrade` | Runs IIQ's own `patch` console command to reconcile system version metadata |
| `import-custom` | Imports **this repo's** `config/` tree — your Applications, Rules, Bundles, Workflows, etc. |
| `dist` | Copies the finished build into `IIQHome` |

This is the one target where `patchdb`/`runUpgrade` run automatically — that's
specific to a from-scratch build. On every *subsequent* `ant deploy` (see
below), those two steps are **not** re-run; only the code and `import-custom`
are refreshed.

## 6. Start Tomcat and verify

```powershell
& "C:\Program Files\Apache Software Foundation\Tomcat 9.0\bin\startup.bat"
```

Then check:

1. **Catalina log** — confirm a clean `Server startup in [N] milliseconds`
   with no `DatabaseVersionException` or other `SEVERE` context-init errors.
2. **Login page** — `http://localhost:8080/identityiq/login.jsf` should
   return HTTP 200 with the IdentityIQ login form.
3. **Log in** as `spadmin` (or whichever `console_user` you configured) and
   check **System Setup → About** — confirm the version/patch level matches
   what you configured (`IIQVersion` + `IIQPatchLevel`).
4. Spot-check that your onboarded applications from `config/` (see
   `doc/Applications.md`) show up correctly under **Applications**.

## Setting up a second/parallel instance

If you already have a working instance and want a second, independent one
(e.g. a plain vanilla GA install alongside it, without this repo's custom
`config/`), the setup is the same as above with these adjustments — plus
several gotchas below that only surface once you actually try it (found by
attempting exactly this once; corrected here, not left for you to rediscover).

1. **Get a separate copy of the SSB framework** — extract the original SSB
   distribution zip into a new folder, or (equivalent) copy this existing
   checkout, excluding `.git` and `build/`:
   ```powershell
   robocopy "C:\SailPoint\ssb" "C:\SailPoint85" /E /XD .git build
   ```
   (`robocopy` exit code `1` means success — it's a "files copied" count,
   not an error, unlike most Unix tools.)
2. **Copy the GA zip** into the new folder's `base/ga/` (skip `base/patch/`
   for a bare/vanilla install).
3. **Edit `build.properties`** in the new folder: different `IIQHome` (a new
   webapp folder name — Tomcat auto-hosts it as a separate context, e.g.
   `webapps/identityiq2` → `/identityiq2`), different `iiq.path`, different
   `db.name`. Leave `db.userName`/`db.userPassword` alone — you'll need their
   *values* in step 4, don't change them here.
4. **Edit `<target>.iiq.properties`** (e.g. `dev.iiq.properties`) in the new
   folder, changing **three** things together, not just one:
   - `dataSource.url` → the new database name (e.g. `.../identityiq2?...`).
   - `dataSource.username` and `dataSource.password` → **must match
     `build.properties`'s `db.userName`/`db.userPassword`** (e.g. `ssbuser`/
     `ssbpass`), *not* whatever stock value shipped in the template (often
     `identityiq`/an encrypted password for a different account). Why: the
     SQL `createdb` runs actually creates and grants access to the
     `db.userName` account from `build.properties` — if `iiq.properties`
     still names a different account, the app can authenticate to MySQL but
     get zero privileges on the new database, or fail to connect at all.
     A plaintext password is fine here for dev (the file's own comments say
     encryption is optional).
   - Do **all of this before step 5**, not after — see the gotcha immediately
     below.
5. **Run `ant main` only after step 4's edits are in place.** `main` copies
   `<target>.iiq.properties` to `build/extract/WEB-INF/classes/iiq.properties`
   — that copy, not the source file, is what the forked console process
   actually reads. Edit the source file *after* `main` has already run and
   you'll be editing a file nothing rereads; the stale copy keeps the old
   (wrong) values and every subsequent target fails against it silently. If
   you do edit out of order, either re-run `ant main` or hand-patch
   `build/extract/WEB-INF/classes/iiq.properties` directly to match.
6. **Add the JS-engine `-lib` flag to every `createdb`/`extenddb` call** — see
   [Prerequisites](#2-prerequisites) above. Skip this and you get
   `Unable to create javax script engine for javascript` before the database
   is touched at all.
7. **Know the Access History limitation before you hit it.** The shipped
   `create_identityiq_tables-<version>.<db.type>` script only parameterizes
   the *first few* Access History lines (`CREATE DATABASE`/`CREATE USER`) by
   `db.name` — and even that has a bug where the matching `GRANT` line keeps
   the *old* username. The actual `spt_hist_*` table definitions later in the
   same file (hundreds of statements) are **hardcoded to the literal database
   name `identityiqah`**, not parameterized at all. Consequences:
   - If an `identityiqah` database already exists (e.g. from your original
     instance), `createdb` fails partway through with
     `Table 'spt_hist_accounts' already exists` — harmless (everything
     before that point, including your main schema, already committed
     successfully; MySQL DDL isn't rolled back by the failure), but Access
     History for the new instance silently ends up half-configured.
   - Once any console command runs against this instance, IdentityIQ checks
     Access History's schema version **unconditionally at startup** (same
     `versionChecker` bean as the main DB check) — `AccessHistory expected
     system version [...] does not match current database value [...]`. This
     blocks the app even if you never intend to use Access History.
   - **The real fix**: after `ant main` extracts the raw script into
     `build/extract/WEB-INF/database/`, and *before* running `createdb`,
     open `create_identityiq_tables-<version>.<db.type>` and do a plain
     find-and-replace of every literal `identityiqah` → `<newname>ah` (e.g.
     `identityiq2ah`) across the **whole file**, not just the top section —
     the GA sample uses that one string uniformly for the database name,
     username, and password, so one bulk replace fixes db name, user, and
     grant together. The script's own header explicitly says it's "a SAMPLE
     and can be modified as appropriate by the customer" — this is exactly
     that. Then update `dataSourceAccessHistory.url`/`.username`/`.password`
     in `<target>.iiq.properties` (and its copy in
     `WEB-INF/classes/iiq.properties`, per the ordering gotcha in step 5) to
     match your new AH database/credentials before running `createdb`.
   - If you don't need Access History isolated, at minimum confirm the
     shared `identityiqah` database's version already matches what your new
     instance's patch level expects, or the app won't start.
8. **Run the build targets manually, skipping `import-custom`** (so you get
   IIQ's own stock objects only, not this repo's onboarded apps):
   ```powershell
   cd C:\SailPoint85
   ant clean
   ant main
   ant -lib C:\js-engine-lib createdb
   ant -lib C:\js-engine-lib extenddb
   ant import-stock
   ant import-lcm
   ant runUpgrade
   ant dist
   ```
   (This is `initial-build`'s sequence with `patchdb` and `import-custom`
   dropped.)
9. **Restart Tomcat** (a full stop/start is the reliable way to pick up a
   brand-new webapp folder) and verify at
   `http://localhost:8080/identityiq2/login.jsf`.

Your original instance's `IIQHome`, database, and `build.properties` are
untouched throughout — none of the above writes to them, **provided** you
give the new instance its own database name at every step above; nothing
here defends against reusing the original database name by mistake.

## Ongoing updates after the initial install

Once the instance exists, day-to-day config changes go through `ant deploy`
instead of `initial-build` — it rebuilds the code, redeploys to `IIQHome`, and
re-imports `config/` (`import-custom`), but does **not** touch the DB schema.

**Before every `ant deploy`**, export the live server's current state and
diff it against `config/` to catch any drift (manual UI changes not yet
captured in the repo) before the import silently overwrites it:

```
# from the IIQ console, per ExportScript.txt:
export -clean=id,created,modified exports/CurrentApplicationExported.xml Application
export -clean=id,created,modified exports/CurrentRuleExported.xml Rule
... (see ExportScript.txt for the full object-type list)
```

Compare the results against `config/` before proceeding with `ant deploy`.

**If you later move to a newer patch** (e.g. `p2` → `p3`), `ant deploy` alone
will overlay the new code but will **not** run that patch's database upgrade
script — run `ant patchdb` (and `ant runUpgrade`) separately first, or the
version checker will fail the same way it did when this environment's DB and
SSB checkout first fell out of sync.

## Common pitfalls (learned the hard way in this repo)

- **Backslashes in `build.properties`** — see the warning in step 4. This
  caused files to be deployed into a stray folder inside the repo instead of
  the real Tomcat webapps directory.
- **File locks during build** — antivirus or a running Tomcat holding a
  freshly-built jar open can fail `includeCustomJar`'s move step with
  "Unable to remove existing file". Stop Tomcat before building, and consider
  excluding `build/` from real-time AV scanning if it recurs.
- **Patch/DB version mismatch** — if a patch was ever applied directly to a
  live instance outside of SSB, this checkout won't know about it until
  `base/patch/` and `IIQPatchLevel` are updated to match. Symptom:
  `DatabaseVersionException: IdentityIQ expected system version [...] does not
  match current database value [...]`.
- **`build/` is disposable** — it's gitignored and untracked; `ant clean` is
  always safe.

## Appendix: how the extraction actually works

When you run `ant main` (or anything depending on it: `war`, `deploy`,
`initial-build`) and `build/extract` doesn't already exist yet,
`-expandGAreleaseAndPatches` in `scripts/build.filelayout.xml` does the
following automatically:

1. **Unzips the whole GA zip** into `build/extract/`. The GA zip's own
   top-level layout (as downloaded from SailPoint Community) is a full
   distribution bundle — `database/` (SQL scripts), `doc/`, `integration/`
   (ITIM/OIM/SAP connectors), and, critically, **`identityiq.war`** — the
   actual web application, nested inside the outer zip.
2. **Unzips that nested `identityiq.war`** into the *same* `build/extract/`
   folder, exploding the real webapp (`WEB-INF/`, JSPs, `WEB-INF/lib/*.jar`,
   `WEB-INF/classes/`, etc.) alongside what step 1 laid down.
3. **Deletes the now-redundant `identityiq.war`** file, since it's already
   exploded in place.
4. **If `IIQPatchLevel` is set**, unzips `base/patch/identityiq-<version><patch>.jar`
   directly on top of the same `build/extract/` folder — same overlay
   mechanism, just a smaller archive that overwrites/adds files.

`build/extract` is a disposable staging directory, not what Tomcat runs.
Later targets copy/rezip it into the real `IIQHome`: either `dist` (direct
copy) or `war` → `deploy` (rezips `build/extract` into
`build/deploy/identityiq.war`, then unzips *that* into `IIQHome` — the path
`ant deploy` uses).
