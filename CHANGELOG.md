# Release notes

## Unreleased — documentation follow-up

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
