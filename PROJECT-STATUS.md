# Project status and documentation index

Updated: 16 October 2026. This document describes the repaired prototype, not the original ZIP.

## Current milestone

EduCore is ready for UI demonstrations and feedback. It is not a live school operations system. The owner has reported deploying the prototype. Dynamic academics and billing are implemented on `feature/dynamic-academics-and-fees`; the live URL, hosting settings and deployed commit still need verification.

| Item | Current state |
| --- | --- |
| Framework | Next.js 16.4.0 Pages Router, React / React DOM 18.2.0 |
| Runtime | Node.js 22.x; tested locally on 22.20.0 |
| Styling | Vanilla CSS in styles/globals.css, with inline styles in components/pages |
| Records | Browser localStorage, seeded demo fixtures |
| Attachments | IndexedDB; branding images stored with settings |
| Authentication | None; role selector is a UI preview |
| Backend/database | Not connected |
| Git | Local repository initialized; original upstream history was not recovered |
| GitHub remote | origin points to https://github.com/Rajan-Prasaila-Yadav/scl.git; verified locally |
| Public deployment | Reported by owner; live URL/host/commit not supplied or independently verified |
| Baseline | Tag v0.1.0-prototype, commit d4cc547, branch release/prototype-v0.1.0 |

The baseline tag and release branch must remain at their original commit. Documentation added afterward is on main; it does not rewrite the baseline or its ZIP. The ZIP is a source snapshot, not an installed application or browser-data backup.

## Documentation map

- [README](README.md): quick start and important prototype behavior.
- [Setup](audit/SETUP.md): installation, commands and troubleshooting.
- [Architecture and backend preparation](ARCHITECTURE.md): current code structure and proposed migration.
- [Backend planning folder](docs/backend-planning/README.md): researched database/stack recommendation, Nepal networking, offline behavior, security, Docker, cost and implementation milestones.
- [Publishing guide](DEPLOYMENT.md): GitHub options, deployment and future branch workflow.
- [Release notes](CHANGELOG.md): frozen milestone and subsequent documentation changes.
- [Contribution guide](CONTRIBUTING.md): development and verification rules.
- [Repair verification](audit/FIX-VERIFICATION.md): implemented repairs, checks and limits.
- [Original audit](audit/UI-UX-AUDIT.md): historical findings before repairs.
- [Original field inventory](audit/FIELD-AND-COMPONENT-INVENTORY.md): historical source references, not current line numbers.
- [Acceptance checklist](audit/UI-ACCEPTANCE-CHECKLIST.md): scenarios for continued manual testing; unchecked items do not automatically mean broken features.

## Verification and limits

The release passed source parsing/unresolved-identifier checks, twelve regression tests and a production build. Browser checks covered all 19 sidebar destinations plus selected forms, persistence, permission previews and narrow layouts. This is not exhaustive testing of every field, role combination, browser, printer or concurrent-user scenario. GitHub Actions is configured but has not run on GitHub yet; Vercel configuration has not been verified by a real deployment.

Known boundaries: new fee invoices record academic year and support year-based ledger filtering; historical enrollment and rate versions are not reconstructed, and other academic records are not partitioned by year. Role scopes are planning metadata; some settings are configuration only; billing runs are manual and support six frequencies; automatic scheduling remains future work; partial payments retain individual receipt history. Wishes save drafts rather than send messages. Currency changes presentation rather than exchange amounts. Backups contain metadata without attachment bytes or a restore UI. Browser data is separate for each origin and does not transfer when publishing.

React 18 emits a deprecation warning under Next 16. Direct test imports emit a module-type warning. The last dependency audit recorded no known vulnerabilities at the time checked; this is not an ongoing security guarantee. Check again before deployment.

## Next milestone

Verify the reported deployment when its URL is supplied. Review the backend planning recommendation: managed PostgreSQL through Supabase, existing Next.js with modular TypeScript services, measured regional placement and explicit weak-network behavior. School/user counts and budget remain undecided; one school initially is the planning assumption. No API-ready refactor, database integration, Docker installation or provider purchase has been implemented.

## Local feature update

See [dynamic academics and fees](docs/DYNAMIC-ACADEMICS-AND-FEES.md) for class/teacher assignment, billing rules and payer relationship management. These changes have not been pushed or deployed. The frozen release remains unchanged.

Academic-calendar update (16 October 2026): academic-year settings and fee billing now support AD and Nepali BS calendars with custom boundaries. BS monthly/yearly arithmetic and invoice period snapshots are implemented locally. Unrelated modules are not yet converted to calendar-aware inputs. See the dynamic academics and fees guide for supported years, migration behavior and verification.
