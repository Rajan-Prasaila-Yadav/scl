# EduCore UI prototype

School administration frontend using Next.js 16.4.0, React 18.2.0 and CSS. This is the UI/UX phase: data stays in the browser, with no database or authentication service.

## Run

Use Node.js 22.x (tested: 22.20.0). No environment file or database installation is needed.

```powershell
npm.cmd ci
npm.cmd run dev -- --hostname 127.0.0.1 --port 3100
```

Open http://127.0.0.1:3100. On macOS/Linux use `npm` instead of `npm.cmd`.

For production preview, stop the development server, run `npm.cmd run validate`, then `npm.cmd run start -- --hostname 127.0.0.1 --port 3100`. Restart production preview after rebuilding.

## Data and UI behavior

- The 19 modules cover people, academics, attendance, library, transport, billing, payroll, finance, roles and settings. `/dashboard` shares the root dashboard implementation.
- Records use localStorage. New student/staff/policy attachments use IndexedDB (`educore-files`), maximum 10 MB per file. Legacy attachment metadata needs the original file uploaded before download. Branding images are limited to 250 KB each.
- Browser data belongs to the current origin. Another hostname, port or browser has separate data. Clearing browser data removes records and files. The error banner's JSON backup includes metadata, not attachment bytes.
- Attendance begins unmarked, persists and rejects future dates. Existing records are preserved.
- Settings save locally. Communication preferences do not deliver messages; birthday wishes save drafts.
- The role selector is a UI preview, not authentication. Scope constraints are labeled planning metadata and do not filter records by campus/class.
- Monthly batch invoices respect active students, classes, duplicate periods and one-time fees. Weekly/yearly/hourly structures are rejected by the monthly generator and need a separately defined billing workflow.
- Academic year is a display label, not a separate dataset. Currency changes presentation only. Default tax and bank settings are metadata; payment forms determine their own tax values.
- Closed finance summaries retain saved totals; newly closed days snapshot line items. Shared persistence rejects changes to closed-day payment history.
- CSV exports contain CSV. PDF actions open printable views for browser Save as PDF.
- Fonts/icons may require internet. No message delivery, payment gateway, cloud storage or database connection is configured.

## Checks

`npm run check` parses application source and detects unresolved identifiers. `npm test` runs twelve regression tests. `npm run build` builds production routes. `npm run validate` runs all three.

Next.js 16 currently warns about React 18 deprecation; the tested build supports it. Node's direct test imports produce a module-type warning.

The original audit in `audit/` describes the downloaded code. See [repair verification](audit/FIX-VERIFICATION.md) for updates. Scripts in `audit/migrations` are historical and non-idempotent; do not rerun them.

The downloaded ZIP originally had no Git metadata. A local Git release checkpoint now preserves the prototype; no GitHub remote is configured yet. See [publishing guide](DEPLOYMENT.md) and [release notes](CHANGELOG.md). The original MIT badge was removed because no license file was supplied; no licensing terms are asserted here.
