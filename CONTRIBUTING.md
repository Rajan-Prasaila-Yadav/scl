# Development workflow

Read [project status](PROJECT-STATUS.md) and [architecture](ARCHITECTURE.md) before changing code.

- Use Node.js 22.x and install with `npm ci`. Commit package.json and package-lock.json together when dependencies change.
- Keep `v0.1.0-prototype` and `release/prototype-v0.1.0` unchanged. Start future work from main on a feature branch. See [publishing guide](DEPLOYMENT.md).
- Preserve existing browser records. Never rerun audit/migrations scripts: they are historical, non-idempotent repair scripts.
- Use fictional data for development and screenshots. Never commit secrets, environment files, browser-data exports or real school records.
- Keep passwords and server secrets out of `NEXT_PUBLIC_` variables; that prefix exposes values to browser code.
- Update relevant documentation when behavior, setup, limitations or release status changes. Label proposals and historical evidence explicitly.

## Verification

Run `npm run validate` for application/configuration changes: source checks, regression tests and production build. Add meaningful regression coverage when fixing behavior; use browser checks for forms, focus, layout and interactions. A passing build is not full UI acceptance.

For documentation-only changes, verify referenced files, commands and factual claims; a rebuild is unnecessary unless runtime configuration changes too. Do not mark manual checklist items complete without evidence. Record test scope and limitations in release notes or the repair report.

GitHub validation runs after pushes and pull requests once the repository is published. A public deployment is separate from a local build. Update project status only after a remote/deployment is actually verified.
