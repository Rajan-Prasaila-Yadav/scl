# Repair verification — 10 October 2026

## Changes

- Updated Next.js to 16.4.0; dependency audit returned zero known vulnerabilities.
- Removed destructive payment/payroll reseeding; seeded shared fixtures once without overwriting existing keys.
- Fixed object attendance persistence, removed random generation, added unmarked/future-date handling.
- Added storage error reporting, conflict protection, corrupted-record preservation and metadata backup.
- Connected settings persistence, shared layout, branding, emergency contacts and compliance/policy controls; removed fabricated compliance totals.
- Stored actual student/staff/policy attachment bytes in IndexedDB; replaced fake original-file downloads.
- Fixed shared mobile flex/table containment, dialog sizing, contrast, focus indicators and reduced motion.
- Added dialog semantics, focus containment, Escape closing and focus restoration; added field/icon labels and sidebar links.
- Corrected role export formats, linked users, rename reassignment, status/constraint preservation, empty-list persistence and pagination.
- Added missing route gates, blocked-role checks, action-handler guards and payroll Fees permission mapping. Scope constraints are identified as planning metadata.
- Added exam/marks/grade validation and incomplete results; checked routine date/time/class/room conflicts and timetable time overlap.
- Protected borrowed library stock and rejected past due dates.
- Added vehicle allocation, capacity checks, duplicate plates and assigned-stop/vehicle protection. Existing routes need an explicit vehicle choice before new allocations.
- Fixed batch eligibility, one-time duplication, period normalization, counts and identifiers; rejected unsupported frequencies in monthly generation.
- Protected linked records and monetary history from deletion.
- Fixed prior finance balance lookup and closed totals; snapshot new closed-day line items; reject closed-day payment history changes.
- Escaped shared HTML/CSV exports and protected custom print views from executable markup.
- Shared currency presentation; fixed titles/breadcrumbs, removed fake sidebar counts, consolidated dashboard code, and saved birthday wishes as local drafts.
- Updated setup documentation and added source checks, regression tests and environment-file ignores.

## Evidence

- Production build passed and generated all application routes.
- Eight regression tests passed: mark validation, exam boundaries, grade ranges, attendance, fee eligibility, 10,000 identifiers, print escaping, and persistence/conflict/corruption/closed-ledger behavior.
- Source parsing and unresolved-identifier checks passed.
- All 19 sidebar destinations rendered without application-error screens; see `fix-browser-routes.json`. Console inspection returned no errors during that pass.
- Settings motto survived save/reload; the original value was restored afterward.
- Mobile Classes: actual viewport 325 CSS pixels; main approximately 320 pixels, without page-level horizontal expansion.
- Mobile Library dialog: approximately 288 pixels wide; initial focus inside; Escape closed it and restored focus to Add New Book.

## Follow-up repairs and verification

- Student placement now rejects duplicate or fractional roll numbers, full classes, invalid calendar birth dates and future birth dates. Class capacity cannot drop below active enrollment.
- Staff forms reject invalid birth dates, joining dates before birth and invalid base salaries. Parent/staff identifiers no longer use a three-digit random suffix.
- Parent attendance cards use saved attendance for the current month, including an honest empty state, instead of fabricated attendance.
- Library availability is reconciled with active checkouts. Returned loans cannot increase stock twice. Issuing requires an active borrower, and date defaults use local dates.
- Fine balances retain previous payments as more overdue charges accrue; returned-loan fines stop accruing.
- Dialogs use their visible headings as accessible names, make the background inert, and protect unsaved edits with Keep editing / Discard changes. Browser verification confirmed text preservation, discard, background isolation and focus restoration, with no console errors. See `fixed-unsaved-dialog.png`.
- The expanded twelve-test regression suite, source checks and production build passed; see `followup-validation.log`.

## Remaining limits

These are targeted checks, not proof of every field combination, permission combination, browser or print layout. The original manual acceptance checklist remains useful.

Backend integration stays outside scope. Authentication, server permissions, campus/class scoping, session partitioning, message delivery and payment processing remain unconnected. Configuration-only fields and unsupported billing frequencies are documented in README. Legacy attachment bytes and historical line-item snapshots cannot be reconstructed. Backups currently contain metadata only.

React 18 produces a deprecation warning under Next 16. Node direct imports produce a module-type warning. Neither prevented validation. A React 19 migration and a broader automated UI suite remain maintenance work.

Additional browser checks: the school preview opens a real dialog; Senior Teacher is denied Settings; switching back to Super Admin restores access. Screenshots: fixed-settings.png and fixed-preview.png. The preview server is available at http://127.0.0.1:3100.
