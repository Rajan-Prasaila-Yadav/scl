# 04 — Security and recovery

Status: requirements for the backend phase, not protections already implemented. The current public prototype must continue using fictional data until the real-data release gates pass.

## Threats to design against

Prioritize one school's records leaking to another; staff accessing unassigned students; account takeover; over-broad exports; repeated financial submissions; leaked attachments; malicious uploads; and stale offline data on shared devices. Hiding navigation or deploying HTTPS does not enforce authorization.

OWASP identifies object-level authorization, property-level authorization and resource-consumption failures as important API risks. Tests must manipulate IDs and request fields, not merely verify which buttons are visible. [OWASP API Security Top 10](https://api-security.owasp.org/editions/2023/en/0x11-t10/).

## Identity and sessions

Use a maintained authentication provider and its verified server integration. Require MFA for privileged administrators and financial approvers; define secure account recovery and disable shared administrator accounts. Rate-limit login/reset flows and audit membership or role changes. Never grant access based on a submitted role string or the current prototype role picker.

Validate the session on the server and check current school membership. Choose token/session lifetime and revocation behavior explicitly; signature verification alone does not establish that access has not just been revoked. Apply HTTPS, suitable cookie scope and SameSite protections, CSRF defenses for cookie-authenticated mutations, session rotation and logout behavior. [OWASP session guidance](https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html).

Do not assume Supabase's normal browser/SSR integration makes all token cookies HttpOnly: its browser client needs access for session refresh. If HttpOnly-only token handling is a requirement, design a server-only session gateway and test refresh/revocation through it instead of mixing incompatible patterns. Authenticated responses and responses that refresh cookies must not enter shared CDN caches. [Supabase SSR details](https://supabase.com/docs/guides/auth/server-side/advanced-guide).

## Authorization and database boundary

For every request, verify action, school, campus/class assignment, ownership and allowed fields. Deny by default. A teacher editing attendance should not be able to change a fee balance by adding fields to the request. Exports, search suggestions, counts and file downloads need the same checks as detail views.

Enable and test row-level security for exposed school data. A user-scoped server client should carry the verified user identity. PostgreSQL owners and BYPASSRLS roles can bypass ordinary row policies; do not use an owner connection as if it were tenant-isolated. Privileged service/secret credentials are server-only and should be limited to controlled administration/jobs. [PostgreSQL row security](https://www.postgresql.org/docs/18/ddl-rowsecurity.html), [Supabase API keys](https://supabase.com/docs/guides/getting-started/api-keys).

RLS protects rows, not every business invariant. Restrict table writes so callers cannot bypass transactional payment/stock operations. Prefer security-invoker functions where feasible. Any necessary security-definer function requires explicit identity/authorization checks, a fixed safe search path, narrowly granted execution and review for privilege escalation. Verify direct API/database-function access, not just the Next.js route.

Minimum automated cases: anonymous denial; school A user cannot access B; guardian sees only linked children; teacher sees permitted classes; blocked membership fails; extra fields are rejected; expired/revoked sessions fail according to policy; direct writes cannot bypass accounting locks; and privileged jobs cannot select an unintended school.

## Inputs, uploads and application security

Use schema validation and parameterized queries. Allowlist sort columns and writable fields. Limit request size, pagination, expensive exports and login attempts with limits that work across server instances; process-local counters alone are insufficient. Escape rendered/exported data and review rich text separately.

Private attachment access requires authorization plus short-lived URLs. Validate file size, extension and actual type; use generated storage names and quarantine/scan risky documents. Do not execute uploads or render untrusted HTML inline on the application origin. Limit file retention, download access and logging of signed URLs.

Adopt a Content Security Policy incrementally in report-only mode before enforcement; existing inline styles and external fonts/icons require deliberate handling. Keep secrets out of NEXT_PUBLIC variables, Git, browser logs and frontend bundles. Separate development/staging/production credentials. Patch dependencies and use reviewed, reproducible builds. Redact personal information and tokens from telemetry while retaining request IDs and useful errors.

## Audit and financial controls

Record server-side actor, school, operation, affected record, timestamp and relevant change metadata. Restrict audit-log alteration; avoid copying entire sensitive records into logs. Sensitive exports and role changes should be auditable. Financial writes need transactions, unique document numbers, idempotency, locked-period enforcement and controlled reversals. Audit history is separate from a database backup.

## Backup and recovery

Supabase paid database backups do not include uploaded Storage object bytes. Plan separate object backups/version retention and test restoration of both records and files. Exported schema/migrations alone are not a data backup. [Supabase backup scope](https://supabase.com/docs/guides/platform/backups).

Before a pilot, agree on recovery point objective (maximum acceptable data loss) and recovery time objective (maximum acceptable downtime). Proposed discussion targets: at most one hour of data loss and four hours to restore a small pilot; these are not currently met or guaranteed. A daily snapshot alone can lose nearly a day, so meeting a shorter target needs appropriately configured recovery plus an object-storage plan and a measured restore drill.

Keep encrypted recovery copies under separate restricted access, define retention, record who can restore, and test quarterly and after major changes. Include identity configuration, secrets rotation procedures, database, storage objects and reconciliation checks. Test a deleted attachment and a mistaken migration in an isolated environment. Deleting the primary provider account/project must not also erase the only independent recovery copy.

## Before real school data

- [ ] Verified authentication, recovery and privileged MFA.
- [ ] Automated school/class/guardian isolation tests, including direct API bypass attempts.
- [ ] Financial concurrency, duplicate request and lock tests.
- [ ] Private file access and upload controls verified.
- [ ] Offline cache/device policy agreed and tested.
- [ ] Database and attachment recovery drill completed against agreed recovery targets.
- [ ] Monitoring, rate limits, alert owner and incident runbook assigned.
- [ ] School-approved retention, access and data-location requirements recorded; obtain applicable local privacy/legal advice where needed.

These are release gates for the real-data backend, not a statement that the current demo already provides them.
