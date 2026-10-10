# Setup and troubleshooting

Updated: 10 October 2026. Current setup instructions for the repaired prototype. See [project status](../PROJECT-STATUS.md) for milestone and deployment status.

## Requirements

- Node.js 22.x (locally tested on 22.20.0).
- npm (locally tested with npm.cmd on Windows).
- Git for version control; not required merely to run extracted source.
- A modern browser. External fonts/icons require network access.

Next.js 16.4.0 and React / React DOM 18.2.0 are installed through the lockfile. No database, environment file, Docker, authentication account or Vercel CLI is needed to run this version.

## Fresh installation and development

Run from the directory containing package.json:

```powershell
npm.cmd ci
npm.cmd run dev -- --hostname 127.0.0.1 --port 3100
```

Open http://127.0.0.1:3100. On macOS/Linux use npm instead of npm.cmd. Keep the terminal running; Ctrl+C stops the server.

## Production preview and validation

Stop any development/production server using this folder before rebuilding:

```powershell
npm.cmd run validate
npm.cmd run start -- --hostname 127.0.0.1 --port 3100
```

Validation runs source checks, twelve regression tests and the production build. Restart the production server after rebuilding. Do not run development and production processes simultaneously against the same .next directory. A local production preview is not a public deployment.

## Browser records

Demo seeding fills missing keys. Existing records are preserved. Records use localStorage; new student/staff/policy attachments use IndexedDB with a 10 MB limit per file. Branding images have a 250 KB limit. Legacy attachment metadata requires re-uploading original files.

Each hostname, port and browser profile has separate storage. Changing from 127.0.0.1 to localhost or publishing a new domain does not transfer local records. Clearing site data deletes browser records and attachments. The metadata backup excludes attachment bytes and there is no restore UI. Do not clear data as a first troubleshooting step.

## Troubleshooting

| Symptom | Check |
| --- | --- |
| npm blocked by PowerShell script policy | Use npm.cmd as shown above |
| Missing Next.js/dependencies | Run npm.cmd ci from the package.json directory |
| Port already in use | Stop the existing server or choose another port; data on that port will be separate |
| Old UI after source changes | Rebuild/restart production preview; then reload the browser |
| Missing records on another URL | Check hostname, port and browser profile |
| Storage conflict/error banner | Preserve unsaved inputs, export metadata if possible, and follow the banner; do not reset blindly |
| Original attachment cannot download | Legacy records may contain metadata without bytes; upload the original file |
| Missing icons/fonts | Check internet access to external asset providers |

React 18 deprecation and Node module-type warnings were observed during passing validation. They are documented maintenance items, not evidence of an unsuccessful build. The previous Next 13 dependency findings in the original audit are historical; consult the current lockfile and run npm.cmd audit for a fresh assessment.

## Version control and publishing

A local Git repository now preserves tag v0.1.0-prototype. It does not contain the original GitHub repository history and no remote is configured yet. Follow [DEPLOYMENT.md](../DEPLOYMENT.md) for either a new empty repository or an existing repository with history. Do not force-push over existing upstream history.

The optional npm share command starts an external SSH tunnel targeting port 3000; it is not part of this port-3100 setup or the release deployment workflow. Do not use it as a substitute for the documented deployment process.

## Historical evidence

Original audit scripts, JSON, screenshots, logs and migration scripts may exist locally but are excluded from the release source archive. The tracked audit Markdown describes historical work. Do not rerun audit/migrations scripts; they are non-idempotent. Current checks are npm run check, npm test and npm run build.
