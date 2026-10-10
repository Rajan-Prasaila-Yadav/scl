# Running the downloaded EduCore folder

Verified on 9 October 2026, Windows PowerShell.

## What is already installed

| Tool | Detected version | Result |
|---|---|---|
| Node.js | 22.20.0 | Production build passed on this runtime |
| npm | 11.6.1 via npm.cmd | Locked dependency installation succeeded |
| Git | 2.51.0.windows.1 | Installed; this folder itself is not a Git checkout |
| Next.js | 13.5.6 | Installed from package-lock; unsupported version, upgrade separately |
| React / React DOM | 18.2.0 / 18.2.0 | Installed from package-lock |

The missing node_modules folder was normal for a fresh GitHub download. It has now been installed. No additional application library was added to package.json.

## Start development

In PowerShell:

```powershell
Set-Location -LiteralPath 'C:\Users\rajan\Downloads\School-main\School-main'
npm.cmd run dev -- -H 127.0.0.1 -p 3000
```

Open [the local development page](http://127.0.0.1:3000). Keep that terminal running; Ctrl+C stops it. If port 3000 is occupied, use another port, for example `-p 3100`.

The audit production preview was started at [port 3100](http://127.0.0.1:3100). This is a local server, not a deployment. Do not start a second server on the same port. Development and production commands should not run simultaneously against the same .next directory.

## Install again on a new machine / fresh download

```powershell
Set-Location -LiteralPath 'C:\Users\rajan\Downloads\School-main\School-main'
node --version
npm.cmd --version
npm.cmd ci
```

Use npm ci with the committed lockfile for reproducible installation. The audit used `npm.cmd ci --ignore-scripts`; the existing locked packages then built successfully. npm.cmd was the verified Windows launcher in this session.

There are no required environment variables in this frontend. You do not need a database, Supabase account, Prisma, Firebase, Docker, Tailwind, Bootstrap, TypeScript, or a Vercel CLI installation to run the current code.

## Check a production build

Stop the development server first, then:

```powershell
npm.cmd run build
npm.cmd run start -- -H 127.0.0.1 -p 3100
```

The production build completed successfully during the audit. All 20 application routes were then loaded in the browser. The first-load JS figures reported approximately 90–116 kB per route.

## Dependencies: what needs attention

The current npm audit found four affected packages, with one critical and three high package-level severities. See [the saved JSON](dependency-audit.json). It includes exact advisory URLs and package ranges; it does not mean every advisory is reachable in this Pages Router app.

Next 13 is outside the official supported release lines. Plan an upgrade to a supported patched Next release and its compatible React/Node versions, then repeat build, role, form, print, and storage checks. Merely installing npm's proposed old 13.x patch is not a complete remediation plan. No forced dependency changes were made during this audit.

The README's Node 16 recommendation is obsolete. The installed Node 22 line is an LTS line, but keep its patch release current. For a fresh migration, select a currently supported Node LTS release that meets the selected Next version's requirements. Sources: [Node release table](https://nodejs.org/en/about/previous-releases), [Next support policy](https://nextjs.org/support-policy).

## Browser data and demo behavior

- Data is stored in the browser, per origin. `localhost:3000`, `127.0.0.1:3000`, and `127.0.0.1:3100` have separate storage. Changing the host/port can appear to reset records.
- Clearing site data removes local edits. There is no central database to restore them from.
- Some seed data lives in lib/academicData.js; exams, fees, finance records, and other fixtures also live in page files.
- Attendance has a confirmed reload defect. Most school Settings are not yet persisted. See F01/F02 in the main report before relying on saved demo values.
- Automatic fixture “upgrade” code can also overwrite unrelated payment/salary history when another record is empty. See F27 before relying on edited fee/payroll data.
- The user picker is a demo role selector, not real authentication.
- Uploads currently store file metadata, and several downloads are generated sample content.
- Fonts and icons are loaded from Google Fonts and cdnjs; network access affects those assets. Local storage alone does not make the full application offline-capable.

## Files that are missing versus optional

| Item | Needed to run now? | Purpose |
|---|---|---|
| .env / database connection | No | Future backend phase only |
| .git directory | No | Needed for ordinary Git history/remotes/commits |
| LICENSE | No | Missing document referenced by README; choose the intended license |
| CONTRIBUTING.md | No | Missing contributor instructions referenced by README |
| engines / Node-version file | No | Pin and document the supported development runtime |
| ESLint config and lint script | No | Catch JSX, hooks, accessibility and code-quality issues |
| Tests and test script | No | Regression coverage for storage, calculations, permissions and workflows |
| CI workflow | No | Automatically verify builds and chosen checks on commits |
| PWA / service worker | No | Optional offline app experience |
| Local file/blob store | No | Optional realistic frontend attachment handling |

Add quality tools deliberately as development dependencies in a follow-up implementation task; none is required merely to display this UI. No audit-specific runtime packages were installed.

## About the GitHub download

This folder has no .git directory, and Git reports “not a git repository.” The zero-byte file named git is unrelated to Git's metadata. A GitHub ZIP usually contains source files but not repository history or a configured remote.

To recover the normal Git workflow, clone your real repository into a separate folder using its actual URL, then copy any wanted changes from this archive. The README URL containing your-username is a placeholder. Do not initialize a new repository and assume it has the original history.

## Other root files

| File | Meaning |
|---|---|
| next.config.js | Enables React Strict Mode |
| postcss.config.js | Empty plugin map; valid for the current vanilla CSS setup |
| vercel.json | Vercel commands and response-header configuration; no deployment was performed |
| .eslintignore | Ignore patterns only; it does not install/configure a linter |
| .gitignore | Excludes dependencies/build output; add plain .env patterns before future secret use |
| .agents/AGENTS.md | Deployment guidance, with stale absolute links/checklist assertions to correct |
| deepseek_html_20260510_3e6779.html | Original standalone design prototype; not an active Next page |
| dev-server.log | Old spawn EPERM failure from a different path; not current build evidence |
| git | Empty stray file; not needed by the app |

## Optional sharing

The existing npm share command uses SSH/Pinggy and opens a public tunnel. It is not needed for local development, was not run in this audit, and should not be part of the default setup. Review dependencies and demo contents before deliberately sharing externally. SSH is only needed if you choose that optional command.

## Reproduce the local audit probes

After installing dependencies:

```powershell
node audit/inventory.cjs
node audit/behavior-probes.cjs
npm.cmd audit --json
```

The first command regenerates the source-control inventory. The second invokes selected original functions inside isolated stubs, writes behavior-probes.json, and does not modify application source or browser storage. These scripts are evidence collectors; they do not yet act as failing CI regression tests. Convert the expected results into assertions when fixing the underlying bugs.
