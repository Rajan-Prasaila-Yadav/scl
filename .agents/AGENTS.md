# Repository guidance

This is the EduCore UI prototype. Read [project status](../PROJECT-STATUS.md), [architecture](../ARCHITECTURE.md), [contribution guide](../CONTRIBUTING.md) and [deployment guide](../DEPLOYMENT.md) before making changes.

## Release preservation

- Preserve tag v0.1.0-prototype and branch release/prototype-v0.1.0 at their existing commit. Do not move them when updating documentation or adding features.
- Keep future development on feature branches. Do not assume a local build has been deployed or a configured workflow has run remotely.
- Do not rerun historical audit/migrations scripts or overwrite existing browser records with fixtures.

## Configuration and data

- Use Node.js 22.x and npm ci with the committed lockfile.
- Run npm run validate for application/configuration changes. For documentation-only changes, check facts and links; do not claim tests were rerun if they were not.
- Keep environment files and secrets out of Git. NEXT_PUBLIC_ is only for values intentionally exposed to browsers, never secrets.
- Preserve the security headers configured in [vercel.json](../vercel.json). They do not replace authentication, authorization or server validation.
- Current roles are client-side previews, and data is browser-local. Backend architecture in ARCHITECTURE.md is proposed, not implemented.
- Keep dependencies deliberate and document material warnings and limitations.

## Documentation

Use repository-relative links, distinguish historical audit findings from current state, and record only verification actually performed. Never mark all workflows or security requirements complete solely because the build passes.
