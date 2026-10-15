# Dynamic academics and fees

Updated: 15 October 2026. Implemented in the browser-local prototype on feature/dynamic-academics-and-fees. No backend or public deployment is included.

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

Collection supports installments against the calculated invoice total. Refunds, credit notes, automated collections and gateway verification are not implemented.

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

## Shared student collection workflow — 12 October 2026

Class details (Fees tab) and student details (Fees & Payments tab) now show saved invoice subtotals, collected amounts and statuses using a shared ledger component. Search, status filtering and sorting are available in both. Collect payment and View receipt links open the matching invoice in Fee Management; use Pay Fee or Print Receipt there. Context links return to the originating class/student. The standalone student payment-entry UI has been replaced by this common entry point.

Student details also show current class and student rates, using the same rate precedence as billing: student override, class override, then base rate. A blank override inherits; zero remains zero. Issued invoice amounts are snapshots and can differ from current configured rates. The invoice subtotal remains visible separately from the discounted/taxed collected total. There is no fabricated 4500 fallback for zero/unspecified invoice amounts.

Scope is browser-local records on the same origin. Returning to a page or reloading reads the saved values. Other already-open tabs may need refresh; cross-device real-time synchronization needs the backend. Generation remains the explicit Fee Management billing workflow; collection does not silently create another invoice. Partial payments are now implemented as described below; refunds remain unimplemented.

Verification: source checks, 21 tests, production build. Browser testing collected demo invoice SLIP-2026-215 with 10% discount, then verified subtotal 5150, collected 4635 and paid status in Fee Management, student details and class details. No real payment was processed.

## Partial payments — 12 October 2026

Collect now accepts a positive amount up to the remaining balance, with two decimal places. Blank settles the balance. A fully waived zero-total invoice can be settled with zero. First collection freezes the invoice total, discount and tax. Subsequent collections cannot change those terms. Invoice states are unpaid (pending/overdue), partial, and paid.

Each installment stores a unique receipt number, amount, payer name/relationship, date, method, collector and balance after payment. Expand Payment history in Fee Management to inspect or print each payment receipt. The existing full-invoice print action remains an aggregate invoice summary; individual installment receipts are available separately. Class/student ledgers display cumulative collected and remaining amounts. Overpayment, invalid decimals and collection against an already-paid invoice are rejected.

Daily Finance collections use each installment date and amount, rather than assigning the cumulative amount to the last payment date. Closed accounting-day checks protect individual receipt entries. Legacy paid invoices remain readable without creating synthetic installment records.

Verification: source checks, 22 tests and production build passed. Tests cover 5000 split into 2000 and 3000, overpayment/zero/decimal rejection, fixed terms, receipt retention, zero-total waivers and already-paid rejection. Browser verification split a demo 5150 invoice into 2000 and 3150, confirmed partial balance after refresh and disabled term controls, then confirmed paid status with two distinct receipt entries and zero balance.

## Invoice after each collection

Every successful partial or full collection automatically opens the printable Fee Invoice & Payment Summary. View invoice is available for unpaid, partial and paid invoices. It shows invoice total, cumulative collected, remaining balance, explicit payment status and installment receipt history. It updates the same invoice rather than generating a duplicate bill. Individual payment receipts remain available in Payment history.

Verified in the browser: paying 2000 against 5150 automatically opened PARTIALLY PAID with balance 3150; settling the remaining 3150 automatically opened PAID IN FULL with balance zero. Source checks, all 22 tests and production build passed.

## Individual invoice generation — 12 October 2026

- Generate Invoices defaults to Individual student; search by name, admission number or roll number and select the exact student. Labels include admission number and class to distinguish repeated names/roll numbers.
- Student links preselect that student. Class links preselect their class and retain Class batch mode; switching modes is explicit. Changing the class clears the student selection.
- Monthly quantity 1, 2, 3 or more creates one combined invoice for that student, using class rates and student overrides. Existing partial/full collection and receipt workflows apply to this invoice.
- Invalid, inactive or mismatched students cannot fall back to billing the class. Duplicate/overlapping charges retain existing skip rules.
- The generator has a bounded panel, internally scrolling body, responsive fields and a fixed header/footer within the panel.
- Verification: source check, all 24 regression tests and production build passed. On an isolated demo origin, browser testing saved one three-month invoice for Aarav (15000), confirmed batch mode skipped those charges, and visually checked panel containment and visible actions. No live deployment or backend changes.

## Mixed-frequency student bills — 12 October 2026

The generator now combines selected fees of different frequencies into one invoice per student. Each item has an independent start date and quantity; the preview and printed invoice retain its frequency, rate, quantity, covered period and amount. This replaces the single-frequency generator controls described in earlier sections.

Previously invoiced one-time charges disappear from New bill items. Recurring charges are excluded when their requested period overlaps an existing invoice. This applies to unpaid and partially paid invoices too: collect their balance through the existing ledger invoice instead of creating another charge. Excluded items remain available in a collapsed history section with invoice references and status; recurring items can be moved to a new period there. One-time means once per student per fee definition. Yearly periods currently mean calendar years, not academic years; a later non-overlapping year is eligible again. Legacy annual items without a determinable period are conservatively excluded for manual review. Partial overlaps skip the whole requested item rather than prorating uncovered days.

Daily/weekly/monthly/yearly quantities are whole units; hourly quantities may be fractional; one-time quantity is fixed at one. Rates still use student override, class rate, then base rate. New invoices remain unpaid until collection. No automatic recurring scheduler or backend was added.

Validation: source checks, 26 tests and production build passed. Browser testing on a separate demo origin saved a bill containing three months of tuition, one month of lab fees and one week of library fees (14150), checked printed line periods and confirmed those periods were excluded on reopening the generator. Automated tests cover mixed annual/one-time charges across pending, partial and paid states and renewal in a later year. Local only; not pushed or deployed.

## Dedicated bill workspace — 12 October 2026

Generate Invoices now opens `/fees?view=bill`, a dedicated page within the application shell. The ledger and fee configurator are absent while creating a bill. This replaces the generator popup and its class-batch selector with the requested class-first individual-student workflow.

1. Select a class. The student selector/search only contains active students from that class.
2. Select the student. Their active class-assigned fee definitions and effective student rates load; no fee items are shown before selection.
3. Select items and adjust each recurring period/quantity. Previously billed periods remain excluded as described above.
4. Review the itemized bill alongside the controls, then Generate student bill. The saved invoice opens automatically for review/printing, including admission number and class.

Student/class entry context is retained. Changing class clears the selected student; changing either resets draft item choices so one student's quantities are not carried into another student's bill. Existing outstanding balances are displayed separately and are not added again to the new invoice. The calculation helper still supports batch data, but this dedicated UI is for one student at a time. Browser refresh reloads saved records, not an unsaved draft.

Verification: source checks, 26 tests and production build passed. Browser checks confirmed class-filtered student choices, a three-month tuition preview, saving the bill, and automatic invoice display with the correct student admission number and class. Local prototype only; no push/deployment.

## Collect directly from the bill — 12 October 2026

The invoice preview now offers Collect payment for unpaid bills and Collect remaining balance for partial bills. Leave pending closes a new unpaid invoice without recording money. A fully paid bill has no collection action. Collection resolves the current ledger entry before opening the shared payment form, and repeat collections prefill the previous payer/relation when available. Each collection reopens the updated invoice summary and preserves its original invoice number and receipt history.

Verification: npm run validate passed (26 tests plus source checks and production build). An isolated browser demo generated a 5150 bill, collected 2000, verified partial status and 3150 balance, then collected 3150 through the bill's remaining-balance button. The same invoice showed two receipts, Paid in full and zero balance. No push/deployment.

## Short billing dates — 12 October 2026

Billing period displays now use dates only, for example `Monthly · 2026-10-01 → 2027-01-01 (3 units)`. This applies to the bill builder, printed invoice items, collection form, fee ledger, shared class/student ledger and ledger exports. Existing stored invoice labels are formatted when displayed, so old bills also lose the unnecessary clock portion without rewriting records. Exact stored period boundaries and hourly calculations remain unchanged; payment timestamps and receipt history retain their times.

Verification: source checks, all 26 tests and production build passed. A direct formatter check confirmed legacy labels lose clock times while an hourly 09:00–10:30 billing boundary remains unchanged in the underlying data. Local only; not deployed.

## Student fee statement — 12 October 2026

Open Students → student detail → Fees & Payments for the full statement. It includes all invoices (pending, overdue, partial and paid), total billed after recorded adjustments, cumulative collections and remaining balance. Invoice search/status filters do not change the all-invoice summary. Current fee rates remain available in a collapsible section.

Billed periods list each issued fee item with frequency, quantity, period, invoice and invoice status. Being billed does not mean paid. Legacy quantities/dates absent from records are explicitly marked as not recorded instead of inferred. Payment history shows individual installment receipts without counting the invoice's cumulative amount twice; legacy fully paid records appear as Legacy payment.

Collect payment links to the existing invoice in Fee Management, where Pay Fee opens the shared collection form. Returning via Back to student reloads the saved amounts. Create bill preserves the student context. Print full statement creates a complete printable document independent of the on-screen filter; each payment also has a Print receipt action. Printable content uses escaped record values and the existing sanitized document writer, with school name from settings and a Nepal-time generation timestamp. Billing dates remain date-only; payment timestamps remain intact.

Verification: source checks, 28 tests and production build passed. New tests cover adjusted totals, partial-payment receipt counting, legacy records, date display and an empty statement. Browser checks verified invoice filtering, the collection link for SLIP-2026-215, a 2000 partial payment, and return to the statement with billed 16650, collected 13500 and balance 3150. The print action was exercised without console errors; external print-window layout and physical printer output were not verified in the in-app browser. Local prototype only; no push/deployment.

## Due dates and overdue tracking — 12 October 2026

New bills require a valid Payment due date, initially seven calendar days from today and editable before saving. Issue date and due date are stored separately from payment timestamps. Backdated due dates are accepted for recording existing obligations. Old invoices are not assigned guessed dates.

Timing uses the Nepal calendar date. An outstanding invoice becomes overdue the day after its due date; due today is not late. Timing is separate from payment status: partially paid invoices can also be overdue and match both filters. Fully settled invoices are never overdue. The ledger, collection dialog, invoice print view, class/student ledgers and statement printout display timing consistently. Ledger exports include the due date and timing. Views refresh their calendar day every minute and when the window regains focus.

Legacy overdue records without a deadline remain labeled Overdue (legacy; due date not recorded), without an invented day count. This feature does not add reminders, automatic late fees or post-issue due-date editing.

Verification: source checks, 31 tests and production build passed. Tests cover valid/leap dates, seven-day defaults across a year boundary, due-today behavior, late partial payments, settled balances and undated legacy invoices. Browser testing saved an invoice due 2026-09-10, collected 2000 of 5150, and verified that the overdue filter displayed both Partially paid and Overdue with 32 days overdue and 3150 balance on 2026-10-12. Default future due-date display was also checked. Local only; not pushed or deployed.

## Student concessions and academic-year billing — 15 October 2026

Use this workflow:

1. Fee Management → Fee Configurator: create fee definitions and frequencies, assign classes and set class-specific rates.
2. Students → edit student → Fee Customizations: inherit the class rate, set a custom rate, apply a percentage/fixed concession or increase, or fully waive a fee. An optional reason/reference is saved. The effective per-unit rate is shown before saving. These changes affect future bills, not issued invoices.
3. Fee Management: select academic year, class and student, then Generate Invoices. These selections carry into the dedicated bill builder. Choose the actual periods and quantities for each fee and review existing paid, pending and partially paid bills before generating.
4. Review bill discount, tax and penalty, each supporting percentage or fixed amounts. Student concessions are already reflected in item rates. Additional bill discount reduces the subtotal; percentage tax and penalty both use that discounted subtotal. Penalty is added after tax and is not itself taxed. Amounts round to two decimals.
5. Generate the invoice, then collect all or part of its balance. The shared collection form records payer name, an explicit relationship and collector identity. Custom relationships are saved for future choices and can be managed through the existing relationship editor; generic Other is not accepted as the recorded relationship.
6. Review the same invoices from fee management, class fee ledgers and student fee statements. Student statements include balances by academic year and individual payment history with collector names. Fee Management summary cards follow year/class/student filters.

Invoice line items snapshot the applicable concessions. Bill-level adjustments explicitly selected at issuance are frozen with the invoice. If no adjustment is selected when issuing, the existing first-collection adjustment flow remains available; after the first collection those terms are frozen for later installments. A zero-total invoice is settled without recording a fictitious money receipt. Already-billed one-time fees and overlapping recurring periods remain excluded from new bills, including when the academic-year label changes.

The invoice includes student/admission/class details, academic year, date-only fee periods, issue/due dates, subtotal, discount, tax, penalty, totals in figures/words, collected amount and balance. Issue/payment timestamps retain their times. School contact details come from Settings. Blank official stamp/seal and fee collector signature spaces support physical signing; no official stamp or digital signature is fabricated.

Academic years come from Settings. Existing invoices without year metadata are shown as Unassigned legacy. The year selector is invoice metadata and reporting scope, not a historical enrollment engine: new bills still use the student's current class and current fee configuration. For back-year obligations, select the intended year and actual fee periods and review rates explicitly. Yearly frequency still uses calendar-year boundaries. No automated arrears migration, enrollment history reconstruction, reminders, backend authorization or scheduled penalties are implemented.

Verification: npm run validate passed source checks, all 34 regression tests and the production build. New tests cover concession/increase/waiver calculations, penalty calculation and installment freezing, preserved invoice class snapshots, concession line snapshots and zero-payment receipt suppression. In an isolated browser demo, a 25% tuition concession and full lab waiver produced a 3525 subtotal; 13% tax and a fixed 100 penalty produced 4083.25. Collecting 1000 retained the terms and showed a 3083.25 balance. The final build also retained selected year/class/student when opening the bill builder. Physical printing and every role/device combination were not exhaustively tested. Changes are local; not pushed or deployed.

## Monthly class activation and coverage limits — 15 October 2026

Fee Configurator now stores class activation dates separately for each academic year. Select a class and set its rate, academic year and activation date, then save. The full fee editor also exposes activation dates for assigned classes in the active academic year. Existing monthly assignments have no inferred activation date: configure one before including them in a new student bill.

Monthly activation rounds to the first of its calendar month and covers exactly 12 months. For example, 2026-02-02 starts February 2026 and ends after January 2027. Six units covers February through July at rate × 6, without daily proration regardless of month length. The next bill starts at the earliest unbilled month. Paid months and reserved months on unpaid/partial invoices are counted separately. Existing reserved periods must be collected from their original invoices. When history has gaps, only the consecutive unbilled months before the next reserved period can be included in one line.

The builder shows paid, billed-but-not-fully-paid, remaining and consecutive available month counts. A request beyond the available window is blocked with an explanation; it cannot silently roll into the next class/year. New year activation must be configured explicitly. This is a billing window, not automatic class promotion. Current class rates and student concessions still determine new bill amounts, while issued bills remain unchanged.

One-time and yearly quantities are fixed at 1 in both validation and the UI. Other frequencies retain their units. The twelve-month activation window applies to Monthly fees; yearly fees retain calendar-year duplicate protection, and one-time fees remain once per student per fee definition. Academic year defaults to the active year unless arriving with an explicit year selection.

Verification: source checks, 36 tests and production build passed. Regression tests verify a 500 rate × 6 months = 3000, six remaining months after full payment, rejection of ten additional months, unpaid-period reservations, leap February and yearly quantity rejection. Browser testing saved a class rate of 500 and activation 2026-02-02, confirmed the active-year student builder read it, displayed existing demo invoice coverage, and disabled generation for an excessive quantity. No push or deployment performed.

## Active-year activation restriction — 15 October 2026

Class fee activation now uses a read-only active academic year. Changing academic year remains a Settings operation. Both the class rate editor and full fee editor validate dates at save time, including rejecting an editor opened before the active year changed. Existing dates for other years are preserved.

Settings → General now provides explicit Gregorian start/end dates for each academic year, saved with Save academic year dates. A year label alone cannot establish the school's term boundaries, so no dates are guessed. Activation accepts the start and end dates inclusively and rejects invalid, earlier and later dates. Monthly activation requires the range to be configured first. Date inputs expose the same minimum/maximum bounds. This restricts activation dates; the previously documented twelve-month monthly coverage rule is unchanged.

Verification: source checks, 37 regression tests and production build passed. Tests cover both inclusive boundaries, invalid dates, dates outside the range, missing settings and changed active year. Browser inspection confirmed the Settings date fields, read-only activation year and missing-range guidance. Actual school term dates are awaiting the owner's input; none were invented. Local only, not deployed.
