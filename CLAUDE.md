# SailPoint IdentityIQ Configuration Project

This repo holds the exported XML configuration ("Services Standard Build") for a
SailPoint IdentityIQ instance — Applications, Rules, Workflows, Forms, ObjectConfigs,
etc. under `config/<ObjectType>/`. Object files follow the pattern
`config/<ObjectType>/<ObjectType>-<Name>.xml` and are validated against `sailpoint.dtd`.

## Documentation requirement: application onboardings

Whenever work in this repo involves onboarding a new application (adding a new
`config/Application/Application-*.xml`, or substantially changing an existing one —
schemas, provisioning policies/forms, correlation config, aggregation settings),
document it. Specifically:

- Record what was configured and why: connector type, schema attributes added,
  provisioning policy fields and their source (identity attribute, static value,
  rule/script), correlation rules, any new supporting objects created
  (Rules, PasswordPolicy, CorrelationConfig, Forms).
- Note identity-attribute-to-target-attribute mappings explicitly (e.g. which
  `ObjectConfig-Identity.xml` attribute feeds which schema attribute), since these
  are not obvious from the XML alone once multiple apps are onboarded.
- Prefer putting this documentation in a per-application doc (e.g. under `doc/`) or
  as clear commit messages/PR descriptions — do not rely on XML comments, since the
  DTD-validated config files should stay close to what IdentityIQ itself exports.
- If asked to help onboard or modify an application, proactively point out what
  should be documented, even if the user does not ask for it directly.
- `doc/Applications.md` is an index into `doc/applications/<AppName>.md`, one file
  per onboarded application — these are the living reference and must be kept up
  to date. Whenever a provisioning policy field, schema attribute, correlation
  config, or supporting rule changes for an app, update its file in the same pass
  rather than leaving the doc stale. If a new application is onboarded, add a new
  file under `doc/applications/` and link it from the index.

## Working conventions

- Do not edit `config/Application/*.xml` (or other object XML) unless explicitly
  asked to — the user frequently wants to review/apply provisioning policy and
  schema changes themselves. When in doubt, provide the attribute mapping and XML
  snippet rather than editing the file directly.
- When mapping identity attributes into a target application's provisioning policy,
  check `config/ObjectConfig/ObjectConfig-Identity.xml` for the real attribute names
  (e.g. `pid`, `location`, `department`, `position`) rather than assuming names.
- Look at sibling `Application-*.xml` files (e.g. OpenLDAP) for established patterns
  before proposing new ones — provisioning form `<Script>`/`<RuleRef>` conventions,
  password generation rules, DN construction, etc. should stay consistent across apps.
