# Release notes

## Feature branch — 2026-10-16

- Dynamic subject/class/teacher assignments and class-aware fee configuration.
- Dedicated student bill builder, mixed frequencies, duplicate-period protection and monthly remaining coverage.
- Partial/full collections, individual receipts, student statements, due dates and overdue tracking.
- Student concessions, custom rates and waivers; bill discounts, taxes and penalties.
- Configurable AD/BS academic years and activation-date boundaries.
- Bulk class fee setup plus repaired individual heading and class settings.
- Refreshed README with verified versions, setup steps, feature workflows and explicit prototype boundaries; included conceptual ERP diagrams.
- Latest application checks: 41 tests, source checks and production build passed. Browser checks covered heading saves and individual class status persistence. This documentation update did not rerun application checks.
- These changes do not modify the frozen prototype release. Publishing source does not verify a live deployment.

## Earlier documentation follow-up

- Added docs/backend-planning with database/stack comparison, Nepal region measurements, search design, offline synchronization policy, security/recovery gates, Docker guidance, cost snapshot and staged implementation roadmap.
- Recorded the configured GitHub remote and owner-reported deployment, explicitly distinguishing them from unverified live hosting details.

- Added current project status, documentation index, page/module architecture and backend preparation plan.
- Updated setup and repository guidance to reflect the repaired runtime, local Git checkpoint and actual verification limits.
- Labeled original audits/inventory as historical and added contributor instructions.
- Documentation-only changes on main; the v0.1.0-prototype tag, release branch and original ZIP remain unchanged.

## v0.1.0-prototype — 2026-10-10

UI/UX demonstration checkpoint covering all 19 sidebar modules and the shared dashboard alias.

- Repaired browser persistence, forms, linked records, attendance, library inventory/fines, academic validation, finance protections, settings and exports.
- Improved mobile layouts, accessible labels, dialog focus handling and unsaved-edit protection.
- Twelve regression tests, source checks and production build verified locally.
- Demo records remain browser-local. There is no real authentication, backend, payment processing or message delivery.
- Scope and remaining limitations are in README.md and audit/FIX-VERIFICATION.md.

This tag is the baseline to publish before backend work. Do not move or overwrite the tag. Make future changes on feature branches and publish a new version after validation.
