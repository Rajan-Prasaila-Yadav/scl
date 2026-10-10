# Project status and documentation index

Updated: 10 October 2026. This document describes the repaired prototype, not the original ZIP.

## Current milestone

EduCore is ready for UI demonstrations and feedback. It is not a live school operations system. The current task sequence is: preserve prototype, publish that version when requested, then begin new features/backend preparation.

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
| GitHub remote | Not configured at this documentation update |
| Public deployment | Not performed in this session |
| Baseline | Tag v0.1.0-prototype, commit d4cc547, branch release/prototype-v0.1.0 |

The baseline tag and release branch must remain at their original commit. Documentation added afterward is on main; it does not rewrite the baseline or its ZIP. The ZIP is a source snapshot, not an installed application or browser-data backup.

## Documentation map

- [README](README.md): quick start and important prototype behavior.
- [Setup](audit/SETUP.md): installation, commands and troubleshooting.
- [Architecture and backend preparation](ARCHITECTURE.md): current code structure and proposed migration.
- [Publishing guide](DEPLOYMENT.md): GitHub options, deployment and future branch workflow.
- [Release notes](CHANGELOG.md): frozen milestone and subsequent documentation changes.
- [Contribution guide](CONTRIBUTING.md): development and verification rules.
- [Repair verification](audit/FIX-VERIFICATION.md): implemented repairs, checks and limits.
- [Original audit](audit/UI-UX-AUDIT.md): historical findings before repairs.
- [Original field inventory](audit/FIELD-AND-COMPONENT-INVENTORY.md): historical source references, not current line numbers.
- [Acceptance checklist](audit/UI-ACCEPTANCE-CHECKLIST.md): scenarios for continued manual testing; unchecked items do not automatically mean broken features.

## Verification and limits

The release passed source parsing/unresolved-identifier checks, twelve regression tests and a production build. Browser checks covered all 19 sidebar destinations plus selected forms, persistence, permission previews and narrow layouts. This is not exhaustive testing of every field, role combination, browser, printer or concurrent-user scenario. GitHub Actions is configured but has not run on GitHub yet; Vercel configuration has not been verified by a real deployment.

Known boundaries: academic year is a display label; role scopes are planning metadata; some settings are configuration only; unsupported billing frequencies require new workflows. Wishes save drafts rather than send messages. Currency changes presentation rather than exchange amounts. Backups contain metadata without attachment bytes or a restore UI. Browser data is separate for each origin and does not transfer when publishing.

React 18 emits a deprecation warning under Next 16. Direct test imports emit a module-type warning. The last dependency audit recorded no known vulnerabilities at the time checked; this is not an ongoing security guarantee. Check again before deployment.

## Next milestone

Publish the frozen prototype when the GitHub destination and hosting account are supplied. Develop the proposed asynchronous service layer on a feature branch after that milestone. No API-ready refactor or database integration has been implemented yet.
