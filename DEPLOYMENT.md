# Publish the prototype checkpoint

Release tag: `v0.1.0-prototype`. Frozen deployment branch: `release/prototype-v0.1.0`.

Documentation updates may exist on main after this checkpoint. Deploy the release branch for the exact prototype baseline. The original ZIP and tag deliberately retain the documentation as it existed at release time. Consult [current project status](PROJECT-STATUS.md) for subsequent clarifications.

Current status: origin is already configured as https://github.com/Rajan-Prasaila-Yadav/scl.git. The owner reports deployment; the URL, host settings and deployed commit remain unverified. The initial remote-add instructions below are for a fresh checkout without origin; do not repeat remote creation in this configured folder.

The local checkpoint includes application source, lockfile, documentation and validation workflow. Generated builds, dependencies, logs, local browser evidence, old downloaded HTML and release ZIPs stay outside Git. Existing local files are preserved. Git does not back up browser records or attachment bytes.

## Publish later to a NEW empty GitHub repository

Create an empty repository without an initial README or license. Replace the example URL with your actual repository URL, then run from this folder:

```powershell
git remote add origin https://github.com/YOUR_ACCOUNT/YOUR_REPOSITORY.git
git push -u origin main
git push origin release/prototype-v0.1.0
git push origin v0.1.0-prototype
```

If origin already exists, inspect `git remote -v` before changing it. If using your ORIGINAL repository with existing history, do not force-push this new local history over it. Clone that repository into another folder, copy the release source into a new branch there (excluding .git, dependencies, builds and local artifacts), validate, commit and merge through a pull request. The tag in this folder remains the local reference snapshot.

## Deploy this version on Vercel

Import the GitHub repository as a Next.js project. Root directory is the folder containing package.json; for this prepared repository that is `./`. Select Node.js 22.x. Set the Production Branch to `release/prototype-v0.1.0` and verify the selected deployment commit matches the local release tag before publishing. If the import deploys the default branch first, do not assume it matches the frozen release: main may contain later changes. Select/deploy the release branch before treating the public site as this baseline.

The committed vercel.json specifies `npm ci` and `npm run validate`. Keep the Next.js output directory default. No environment variables or database are required for this release. The build runs source checks, regression tests and Next.js compilation. GitHub Actions independently runs validation on pushes and pull requests.

After deployment, open all sidebar modules, check a form at phone width, and save/reload a demo record. A new hostname starts with separate browser data. Only use fictional records in this publicly accessible prototype. The role selector is a demonstration control, not login security.

Official deployment reference: https://vercel.com/docs/git/vercel-for-github

## Continue development without changing the published prototype

```powershell
git switch main
git switch -c feature/api-ready-frontend
```

Keep the release branch unchanged while developing. Feature branch pushes may create preview deployments; they must not be selected as the production branch. When a later version is accepted, validate it, create a new release tag/branch, and explicitly promote that release.

## Recover or inspect the baseline

```powershell
git show --no-patch v0.1.0-prototype
git diff v0.1.0-prototype --stat
git switch -c review/prototype-baseline v0.1.0-prototype
```

Commit or otherwise preserve ongoing work before switching branches. Do not use a destructive reset to recover a release. The local `releases/educore-v0.1.0-prototype.zip` is an additional source snapshot, not a database backup; install dependencies and build after extracting it.
