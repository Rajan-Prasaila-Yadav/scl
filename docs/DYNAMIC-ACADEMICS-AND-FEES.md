# Dynamic academics and fees

Updated: 11 October 2026. Implemented in the browser-local prototype on feature/dynamic-academics-and-fees. No backend or public deployment is included.

## Subjects and timetable

Create or edit a subject in Subjects. Select the classes that teach it, then choose an active teaching staff member for each class. Timetable uses that assignment and rejects mismatched teachers or subjects not linked to the class. Existing class, teacher and room overlap checks remain.

Remove affected timetable/exam sessions before unlinking or deactivating a subject. Remove affected timetable sessions before changing its assigned teacher, then recreate them using the new assignment. Referenced records cannot be freely deleted. This prototype supports one assigned teacher per class/subject, not co-teaching or effective-dated staffing.

## Fee configuration and billing

In Fee Management, open Fee Configurator. Add/edit a fee name, positive base amount, frequency and applicable classes. Each selected class can override the base rate; leave the override blank to use the base. Zero class rates are allowed. Existing student-specific overrides take precedence over class rates, then the base rate.

Open Generate Invoices, choose frequency, class scope, start date/time and quantity. Select the fee structures and review student amounts before generating. Only active students and active applicable fees are billed. Each run uses one frequency; repeat for other frequencies.

- Hourly: explicitly entered hours; fractional hours are supported.
- Daily: calendar days, independent of attendance.
- Weekly: whole weeks starting Monday.
- Monthly: whole calendar months starting on day 1.
- Yearly: whole calendar years starting January 1, not academic-year anniversaries.
- One-Time: once per student per fee structure, across billing runs.

Start is included and end excluded. Dates are local wall-clock values. Overlapping existing charges for the same fee are skipped in full, not prorated. Separate fee structures can be billed in the same period. Legacy monthly records use their available month/name information for duplicate checks; historical records lack the full period metadata of new invoices.

Generated invoices snapshot fee name, rate, quantity and period. Editing/deleting a fee structure does not rewrite those invoices. Generation is manual: selecting Monthly does not schedule an automatic recurring job.

## Collections and payer relationships

Open Pay Fee on an unpaid invoice. Enter the actual payer name and a specific relationship to the student. Add a custom relationship by name; it becomes reusable in future dropdowns. Manage payer relationships adds, renames and removes future choices. Names are trimmed, duplicate names are rejected case-insensitively, and generic Other/custom are rejected. Existing receipts preserve their original relationship text. These are reusable relationship labels, not a verified registry of payer identities or guardian permissions.

Discount and tax accept a percentage or a fixed amount, including decimals. Discount applies first; percentage tax uses the discounted subtotal. Example: 300 minus 12.5% discount (37.50) plus fixed tax 5.55 gives 268.05. Discounts cannot exceed the subtotal; percentages must be 0–100. Totals are rounded to two decimals. Receipt words include paisa. Tax choices are configurable demo calculations, not a determination of applicable tax law.

Collection settles the full calculated total. Partial payments, refunds, credit notes, automated collections and gateway verification are not implemented.

## Persistence and backend migration

All data remains in this browser origin. Role checks are UI previews. No real payment is processed. Browser storage cannot provide database transactions or authoritative multi-user accounting. A backend must enforce school ownership, permissions, period uniqueness, immutable invoice snapshots, financial audit history and idempotent payment operations in transactions. Keep fee configuration separate from issued invoices and payer labels separate from people/guardian associations.

## Verification

`npm run validate` runs source checks, twenty regression tests and a production build. Tests cover six frequencies, invalid dates/quantities, rates, zero overrides, overlapping/one-time charges, decimal discount/tax, relationship names, academic assignment rules and receipt words.

Browser checks on an isolated local origin verified five weekly invoices totaling 1500, repeat generation skipping all five charges, a 300 payment preview with 12.5% discount and fixed 5.55 tax totaling 268.05, addition/reuse of Grandfather, and persistence of a paid demo invoice after reload. This is targeted verification, not exhaustive testing of every role/device or financial scenario.

Additional browser checks verified relationship rename to Grandparent while the historical receipt retained Grandfather, and creation/reopening of Prototype Robotics with Class 8 and Rakesh Sharma preserved.

## Manage fees from Classes

The Classes list shows an assigned fee count for each class. Click that count, or open a class and select Fees, to see fee names, frequencies, base rates, class rates and active/inactive status. Active totals are grouped by frequency rather than combined across incompatible billing units.

Manage class fees opens the class-scoped Fee Configurator, where inline controls assign/unassign existing fee structures and edit rates for this class only. A blank rate restores the shared base rate; zero is allowed. Other class assignments/rates and previously issued invoices are preserved. Fee editing requires the Fees edit permission in the role preview. Create new fee definitions or change shared names/frequencies in Fee Configurator, linked from this tab.

Verification: source checks, all 20 tests and production build passed. Browser testing saved Class 8 tuition at 4200.50, confirmed it after reload, and confirmed Class 9 remained at the 4500 base rate. No browser console errors were observed during these checks.

## Context-aware Fee Configurator

Manage class fees now navigates to `/fees?tab=configurator&classId=ID&fromClass=ID`; the former class popup has been removed. The selected class and originating class survive refresh. A return link opens the originating class Fees tab. Direct `/fees` navigation opens the ledger without a class scope; the configurator then shows all classes.

The configurator supports text search across fee names/descriptions and assigned class names, class selection, assigned/unassigned/all structures, status, frequency, and sorting by name or effective rate. Select a class to edit its assignment and rate inline, then Save class fee. Blank restores the base rate. Unassigned fees are available through the assignment filter. Each fee card lists all assigned classes with their rates. Shared Edit Config still edits the fee definition; its dialog is separate from class-specific inline changes. New fee creation preselects the current class.

Only navigation/class context is kept in the URL; search, status, frequency and sorting are session UI state and reset on reload. Existing invoices retain their snapshots. Browser verification covered class navigation, search, monthly filtering, descending effective-rate sorting, saving 4300 for Class 10 tuition, reload, return to Class 10 showing that rate, and direct entry showing the ledger and all-class configuration. Source checks, 20 tests and production build passed.
