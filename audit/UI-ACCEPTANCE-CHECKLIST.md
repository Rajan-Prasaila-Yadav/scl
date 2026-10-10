# UI/UX completion checklist

Use this after fixing the findings in [the audit](UI-UX-AUDIT.md). An unchecked box is a required or proposed acceptance test, not a claim that the feature is absent. Adapt optional workflows to the agreed school requirements. Use synthetic fixtures and retain a backup before testing delete/reset operations.

## Audit checks already performed

- [x] Install existing locked packages successfully.
- [x] Build production successfully on the detected Node runtime.
- [x] Render every application route (20).
- [x] Open primary forms in 15 modules and inspect all five Settings tabs.
- [x] Record source controls for every page/component/library JavaScript file.
- [x] Reproduce attendance reload changes and false Settings save success.
- [x] Check representative view-only role behavior and direct Finance/Settings access.
- [x] Check desktop and narrow-layout overflow.
- [x] Check theme persistence and representative dialog focus/Escape behavior.
- [x] Run isolated source probes for marks, billing eligibility, IDs, stock and print escaping.
- [x] Inspect dependencies, documentation and configuration.
- [x] Verify the unknown-route 404 fallback.
- [x] Reproduce fixture migrations overwriting unrelated valid payment/salary histories in isolated probes.

## Shared shell and navigation

- [ ] Every sidebar destination is a real link and works with keyboard, open-in-new-tab, and direct URL entry.
- [ ] Active page, topbar title, document title, and breadcrumb agree on all routes.
- [ ] Browser Back behaves predictably through list/detail/edit workflows; preserve filters where appropriate.
- [ ] Demo role selector is labeled as a preview; blocked roles and unavailable actions are explained.
- [ ] Empty storage gives the same seed data no matter which route opens first.
- [ ] Mobile drawer opens/closes by keyboard/touch, contains focus appropriately, and closes after navigation.
- [ ] Sidebar resize/collapse does not overlap content; its persistence behavior is intentional.
- [ ] Theme/accent persist and all text/background/focus combinations remain readable.
- [ ] Counts are derived from the same source across sidebar, dashboard, tables, and details.
- [ ] Unknown route provides useful 404 content and a working Home link.

## Every field: apply to each row in FIELD-AND-COMPONENT-INVENTORY.md

- [ ] Persistent label is associated with the control, and repeated controls have contextual names.
- [ ] Required marker, HTML constraint, and save-handler rule agree.
- [ ] Whitespace-only input is rejected where a meaningful value is required.
- [ ] Optional blank/null/zero values are intentional and not silently replaced by inappropriate defaults.
- [ ] Unicode names, apostrophes, ampersands, accents, and long values render and export correctly.
- [ ] Email/phone/URL/date/number controls have appropriate types, examples, and localized guidance.
- [ ] Minimum, maximum, precision, length, duplicate, and cross-field rules are validated on save.
- [ ] Dependent dropdowns clear or reconcile stale selections when the parent choice changes.
- [ ] Disabled/read-only state has a clear reason and cannot be edited through another visible path.
- [ ] Error text appears next to the field, remains visible, and is announced; first invalid field receives focus.
- [ ] Failed validation preserves all user-entered values.
- [ ] Save updates list/detail/summary consistently, and reload returns the same values.
- [ ] Adding a record with an empty history never resets another record's payments, salaries, additions or deductions to fixtures.
- [ ] Cancel/back/overlay/Escape/route-change behavior protects unsaved work according to one policy.
- [ ] Successful save is announced only after persistence succeeds.

## Modal, table, search, and bulk interaction

- [ ] Dialog has a name and semantic dialog role, initial focus, focus containment, Escape and focus restoration.
- [ ] Touch targets and close buttons are reachable at narrow widths and when a keyboard is open.
- [ ] Table headers, sort buttons, sort state, and row actions are accessible.
- [ ] Table overflow stays inside its container; the whole page does not expand to table width.
- [ ] Search has a name, clear/reset action, result count, and useful no-results state.
- [ ] Multiple filters combine correctly and can be reset together.
- [ ] Selection clearly distinguishes current-page selection from all matching rows.
- [ ] Bulk actions preview affected records and handle partial/ineligible selections.
- [ ] Pagination clamps after filtering/deletion; no empty last page with inaccessible records.
- [ ] Toasts are announced and do not obscure critical controls; repeated events do not race timers.

## Students, staff, and parents

- [ ] Create/edit/reload each entity with minimal valid data and full optional data.
- [ ] Duplicate admission/employee/parent ID rules handle casing/spacing consistently.
- [ ] Student roll number uniqueness is defined per class/section/session.
- [ ] Future DOB and impossible dates are rejected; missing DOB does not crash either dashboard.
- [ ] Class allocation respects active/blocked status and agreed capacity policy.
- [ ] Changing a class handles monitor assignment, attendance/history, timetable and fee display coherently.
- [ ] Permanent/temporary address copy stays correct after toggling and subsequent edits.
- [ ] Parent-to-child mapping and student guardian information have a defined common source.
- [ ] Parent attendance displays actual prototype attendance or an explicit “sample” label.
- [ ] Deleting/archiving a record shows linked dependencies and preserves required history.
- [ ] Staff role rename/status changes preserve associations and update the preview behavior.
- [ ] Salary and document detail sections respect the same demo permissions as their dedicated pages.
- [ ] Attachment selection validates type/size and accurately distinguishes sample metadata from stored files.

## Classes, subjects, timetable

- [ ] Class name/section/code duplicates, capacity below enrollment, invalid monitor, and missing teacher are handled.
- [ ] Subject add/link/unlink updates both class and subject views.
- [ ] Renaming/deleting a subject does not orphan timetable, exam routine, or marks records.
- [ ] Scheduling checks teacher, class, and room overlap by real time intervals, including overlapping period definitions.
- [ ] Period end time is later than start; overnight behavior is explicit if supported.
- [ ] Multi-class breaks and routine creation generate unique IDs; deleting one leaves the others intact.
- [ ] Disabled weekdays and empty period/class sets have useful states.
- [ ] Teacher and class timetable views agree; print/export matches current filters.
- [ ] Editing period times revalidates existing assignments.

## Exams, routines, attendance

- [ ] Exam end >= start; pass mark is within max marks; classes are active and valid.
- [ ] Routine date falls in the exam range and its class/subject belongs to the selected exam setup.
- [ ] Routine start < end; duplicate slots and room/class overlaps are rejected.
- [ ] Mark values below zero, above max, NaN/nonfinite and invalid precision are rejected by the handler.
- [ ] Blank, absent, exempt, and zero have distinct agreed meanings.
- [ ] Saving marks does not silently turn unmarked students into failures.
- [ ] Changing exam/class/max marks warns about or preserves unsaved marks appropriately.
- [ ] Grade ranges cover the intended interval without overlaps/gaps; pass/fail uses one documented policy.
- [ ] Report card percentage, pass/fail, rank ties and subject totals agree with the entry grid.
- [ ] Admit-card selection is scoped to exam/class and printable output matches selected students.
- [ ] Student and staff attendance survive reload and month/class navigation.
- [ ] Future days and missing marks are not treated as present by default.
- [ ] Holidays/late/absent statuses produce agreed denominators and percentages.
- [ ] Bulk attendance previews affected students and date; results match calendar and analytics.

## Fees, payroll, finance

- [ ] Batch invoices apply only eligible active fees for each eligible active student/class.
- [ ] Weekly/monthly/one-time fees have defined period and quantity rules.
- [ ] Duplicate billing/payroll uses a canonical period, not just free-text spelling.
- [ ] Preview totals/counts match actual generated records, including skipped records.
- [ ] All IDs and printable slip numbers remain unique across large batches and different years.
- [ ] Amounts, discounts, taxes, additions and deductions have finite/nonnegative constraints and explicit rounding.
- [ ] Partial payment, overpayment, cancellation and refund are either implemented or clearly outside scope.
- [ ] Paid receipts show actual totals, correct currency, payer, method, collector and timestamp.
- [ ] Accountant preview can perform intended payroll actions without accidental Staff edit access.
- [ ] Staff-page salary edits and Payroll-page edits follow the same rules.
- [ ] Closing a day creates a stable snapshot or documented adjustment/reopen behavior across modules.
- [ ] Backdated expenses and edits to closed-day receipts do not silently invalidate the ledger.
- [ ] Opening balance uses the most recent earlier closed day.
- [ ] Cash versus bank/online totals are clearly distinguished where a physical cash audit is shown.

## Library and transport

- [ ] Issue/return changes available copies exactly once; repeated returns cannot inflate stock.
- [ ] Quantity cannot be reduced below borrowed copies; delete is blocked while active loans exist.
- [ ] Due date, overdue/fine, fine settlement and return state are consistent after reload.
- [ ] Inactive/deleted members have an explicit loan-resolution path.
- [ ] Vehicle/plate identifiers and routes have duplicate policies.
- [ ] Route vehicle/driver mapping and seat capacity work, or the screen explicitly states it is registry-only.
- [ ] Route stop edits handle existing allocations; stop selection cannot reference a removed stop.
- [ ] Deleting a route/vehicle or student shows dependencies and a reassignment workflow.

## Roles, settings, celebrations, timeline

- [ ] Every role/action pair produces matching navigation, view, create/edit/delete/export/approve behavior.
- [ ] Blocked roles and selected scope constraints actually affect the prototype or are marked as display-only.
- [ ] New role preserves selected status and constraints; rename maintains staff association.
- [ ] Role linked-user list is the real local staff list; audit history is real or clearly sample.
- [ ] Empty role registry can persist; users cannot delete a linked role without reassignment.
- [ ] Each General/Contact/Finance/Compliance field saves, reloads, and updates consumers.
- [ ] Branding actions and preview work or are disabled with explanatory text.
- [ ] Academic-year creation validates chronological range and duplicate normalization.
- [ ] Currency/timezone/locale changes update screens and generated documents consistently.
- [ ] Birthday calculations handle upcoming age, missing DOB, leap day, and local date boundaries.
- [ ] Wish sending and announcement broadcast clearly state simulation until delivery exists.
- [ ] Announcement audience and create/delete rights match the permission preview.
- [ ] Likes/comments persist, show the intended actor, and behave consistently in development Strict Mode.

## Exports, printing, accessibility, resilience

- [ ] PDF/Excel/CSV/JSON content matches the advertised format and opens in a real reader.
- [ ] All generated HTML escapes user data; CSV handles quotes/newlines/formula-like text according to policy.
- [ ] Popup-blocked printing, cancelled downloads, and empty datasets have clear feedback.
- [ ] A4 receipts/admit cards/report cards do not clip totals, names or signatures across page breaks.
- [ ] Browser Print on non-receipt pages has intentional behavior; global print CSS does not blank expected output.
- [ ] Keyboard-only user can reach all actions and see focus without a mouse.
- [ ] Screen-reader pass covers navigation, forms, tables, dialogs, toasts and validation.
- [ ] Automated accessibility checks are followed by manual review; no unverified conformance claim.
- [ ] Both themes meet text/control contrast requirements; statuses do not depend on color alone.
- [ ] Reduced-motion preferences are respected.
- [ ] Viewport matrix covers 320/375/390/768/1024/1280/1440 CSS pixels and portrait/landscape.
- [ ] 200% and 400% zoom keep content and primary actions usable.
- [ ] Storage unavailable/full/corrupt data gives a recoverable message, not success or silent data loss.
- [ ] Cross-tab edits are synchronized or explicitly detected as stale.
- [ ] Large fixtures exercise search/table/attendance rendering; record measured performance rather than guessing.
- [ ] Offline asset failure leaves essential controls understandable.
- [ ] Dependency migration, configured lint checks, focused regression tests, and build pass before sharing.
- [ ] README links, setup commands, scope, mock features and limitations match the final UI.
