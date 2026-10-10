> Historical baseline from 9 October 2026. Findings, source line numbers and checked audit steps below describe the original download, not the repaired release. See [current project status](../PROJECT-STATUS.md) and [repair verification](FIX-VERIFICATION.md). Unchecked acceptance items are test scenarios, not a current defect list. JSON, screenshots and scripts linked below are local evidence excluded from Git/release archives.

# EduCore — UI/UX and downloaded-project audit

Audit date: 9 October 2026. Scope: the downloaded folder at `C:\Users\rajan\Downloads\School-main\School-main`.

## Verdict

**This is a substantial, runnable frontend prototype, but the UI/UX phase is not complete.** The production build passes and all 20 application routes render. There are useful directories, forms, detail views, academic workflows, reports, and local demo persistence. However, several controls promise behavior they do not perform, some saved data changes on reload, permission previews are inconsistent, and narrow layouts clip major content.

The absent database, real login, server authorization, payment gateway, messaging delivery, and production file storage are **expected future-phase work**, not failures of this audit. The issues below concern what users can already see and do in the prototype. Demo operations should still be consistent, reversible where appropriate, and clearly labeled.

Do not interpret a successful build as functional or accessibility sign-off. Do not interpret this report as a claim that all combinations of 418 source field definitions and 425 button definitions were manually executed.

## Read these documents together

- [Setup and installation](SETUP.md): what is installed, what is needed, and how to run the folder.
- [Every source field, button, component, and function](FIELD-AND-COMPONENT-INVENTORY.md): line-by-line control inventory, including conditional forms.
- [UI acceptance checklist](UI-ACCEPTANCE-CHECKLIST.md): concrete completion criteria and test scenarios.
- [Browser route evidence](browser-routes.json): all routes, initial DOM observations, labels, and responsive measurements.
- [Primary form snapshots](browser-primary-forms.json) and [settings tab snapshots](browser-settings-tabs.json).
- [Persistence evidence](persistence-checks.json), [isolated behavior probes](behavior-probes.json), and [dependency audit](dependency-audit.json).
- [Verification summary](verification-summary.json) and [all 44 original files with hashes](original-file-manifest.json).

## Coverage and method

| Area | Work performed | Limit |
|---|---|---|
| Source inventory | Parsed all 31 JavaScript files in pages, components, and lib; 26,754 source lines | Parsing and inventory do not imply every line received equal manual scrutiny |
| Routes | Browser-loaded all 20 application routes in a production build | All role/route combinations were not exhaustively exercised |
| Fields and buttons | Cataloged 418 input/select/textarea definitions, 425 button definitions, 87 other click targets and 189 storage calls | Includes duplicated dashboards, unused SettingsTabs, and templates expanded at runtime |
| Forms | Opened primary forms in 15 modules; inspected all five settings tabs | Did not submit every form or upload personal documents |
| Interaction tests | Settings save/reload, attendance reload, role navigation/actions, modal Escape/focus, theme persistence | See exact results below |
| Responsive review | Measured all initial routes at a reported 1200 CSS-pixel width; selected routes and Classes at a reported 325 CSS-pixel width | Browser zoom/scale made requested 1440/390 overrides report 1200/325 CSS pixels; no physical-device claim |
| Source behavior probes | Exercised original helper/handler source in isolated VM stubs | These are focused reproductions, not full React/browser end-to-end tests |
| Build/dependencies | Clean locked installation, successful production build, npm registry audit | No dependency upgrade or app fix applied |
| Documentation/configuration | README, agent guidance, package/lock, Next/PostCSS/Vercel config, ignores, original HTML, old log and stray file | Live deployment/GitHub remote not inspected |

No application source or original README was changed. Dependencies and build artifacts were generated, and audit documentation/evidence was added. Browser tests used a local origin on port 3100. The role was restored to Super Admin and the theme to dark after checks.

## What already works or is well established

- The locked dependency installation completes and `next build` compiles and generates the routes successfully.
- All 20 application routes showed their expected primary heading. No console errors/warnings were captured during the initial route sweep.
- Native required/min/max validation is present in many conventional forms, although it is not sufficient in every workflow.
- Student and staff identifiers have duplicate checks; classes and subjects check duplicate names/combinations.
- Timetable has same-period class, teacher, and room conflict checks; period end-time validation exists.
- Library blocks deletion of books with active loans. Transport blocks duplicate student assignment and protects routes with assigned students.
- Many modules use hydration flags before persisting state, reducing initial empty-state overwrite problems.
- Theme changes persisted across navigation in the browser test.
- Shared CSS tokens, table patterns, status badges, search, filtering, detail views, and print layouts provide a useful starting foundation.
- First-load JS reported by the build is approximately 90–116 kB, depending on route. This is build output, not a Lighthouse performance score.

## Priorities

P1 means fix before calling the UI phase complete or presenting the affected workflow as functional. P2 means important usability/consistency work. P3 means maintainability or documentation polish. This is a frontend readiness priority scale, not a vulnerability scoring system.

| Priority | ID | Finding | Evidence level |
|---|---|---|---|
| P1 | F01 | Attendance regenerates after reload | Browser + source + probe |
| P1 | F27 | Opening a page can reset unrelated payment/salary edits to fixtures | Source + isolated probe |
| P1 | F02 | Settings success message does not mean settings were saved | Browser + source |
| P1 | F03 | Main content expands beyond viewport; important actions are clipped | Browser measurements + CSS |
| P1 | F04 | Permission-preview behavior disagrees with the configured matrix | Browser + source |
| P1 | F05 | Role PDF/XLSX exports are JSON with misleading extensions | Source |
| P1 | F06 | Marks save accepts out-of-range values and converts blanks to zero | Source + isolated probe |
| P1 | F07 | Batch billing ignores fee class eligibility | Source + isolated probe |
| P1 | F08 | Timestamp IDs collide in batch operations | Source + isolated probe |
| P1 | F09 | Upload controls report success while storing metadata only | Source |
| P1 | F10 | Navigation and major forms lack essential accessibility wiring | Browser + source |
| P2 | F11 | Modals do not implement keyboard/focus behavior | Browser + source |
| P2 | F12 | Muted text has low contrast in both themes | Token calculation + DOM |
| P2 | F13 | Deletes and renames leave cross-page relationships inconsistent | Source |
| P2 | F14 | Roles show synthetic users/audit entries and discard create options | Source |
| P2 | F15 | Currency, dates, school identity, and academic year are inconsistent | Browser + source |
| P2 | F16 | Scheduling/grade rules do not fully validate their relationships | Source |
| P2 | F17 | Library inventory can be set below outstanding loans | Source + isolated probe |
| P2 | F18 | Results depend on which page seeded storage first | Source |
| P2 | F19 | Print/CSV helpers do not safely encode all user-controlled values | Source + markup probe |
| P2 | F20 | Finance closure is not a consistent snapshot across modules | Source |
| P2 | F21 | Page context, badges, demo copy, and duplicate dashboard diverge | Browser + source |
| P2 | F22 | Storage error, synchronization, and recovery UX is missing | Source |
| P2 | F23 | Transport screens do not complete fleet-to-route operations | Source |
| Setup | F24 | Unsupported framework and npm vulnerability findings | Registry audit + official support policy |
| P3 | F25 | README overstates implemented behavior and has missing links | Source/documentation |
| P3 | F26 | No Git history, automated quality gates, or consistent component ownership | Filesystem/source |

## Detailed findings and corrections

### F27 — Automatic “upgrade” can overwrite payment and salary histories

Students (`pages/students.js:182`) and Fees (`pages/fees.js:123`) set a collection-wide needsUpgrade flag if any student lacks payments, has an empty list, or has a first payment without feesBreakdown. When true, every student whose ID matches a fixture gets the fixture's complete payment history again, including unrelated records with valid user changes.

Staff (`pages/staff.js:146`) and Payroll (`pages/salary.js:89`) do the same for salaryHistory, additions, and deductions. A history with zero or one entry can trigger this reset. Adding a new record with no history or deleting the last existing entries can therefore cause later navigation to restore fixtures over valid edits.

**Probes:** supplying one existing record with USER-EDIT history and an unrelated new record with empty history caused both original migration paths to replace the existing record's history with SEED-RECORD.

**Correct:** version migrations explicitly and apply transformations to individual records without replacing user histories. An empty history is a legitimate state. Seeding should happen only for absent datasets or an explicit reset, and migration must preserve existing payment/salary entries. Test navigation between Students/Fees and Staff/Payroll after adding a blank-history record.

### F01 — Saved attendance is discarded

`pages/attendance.js:179` and `:182` load attendance through `readStoredList`. `lib/academicData.js:763` returns the fallback unless parsed data is an array. Attendance is saved as a nested object at `pages/attendance.js:218`. On reload the helper therefore returns null, and the page generates fresh random records.

**Observed:** 24 of 93 visible student day entries changed after reload without editing a mark. The isolated helper probe also returned null for a valid stored attendance object.

**Correct:** use a schema-aware object reader, seed explicitly once, and distinguish unmarked/future days from Present. Keep fixture generation behind an explicit demo/reset action. The current generator fills an entire month, including future days, and missing records are treated as Present.

**Acceptance:** mark one student and one staff day, reload, switch month/class and return; both values remain unchanged. An unmarked future date must not improve attendance totals.

### F02 — School settings are mostly a visual shell

`pages/settings.js:105` saves only accentColor and displays success. Of 47 source input/select/textarea definitions, 44 have no onChange. Board's handler only toggles the custom-board input. General school data, address, contact, currency/bank data, and compliance fields are not included in a saved settings model.

**Observed:** changing School Name to “Audit Test School,” clicking Save Changes, and reloading restored “Sunrise Public School.” The success toast appeared before the reload. Academic year and theme/accent have separate working persistence paths; they should not be conflated with the rest of the page.

The Preview action (`:183`) only produces a toast. Branding Change/Remove controls (`:393` onward), Add Emergency Contact (`:528`), Quick Actions (`:652`), compliance edit/download/upload (`:719`, `:738`, `:741`) have no operational handlers.

**Correct:** introduce one school-settings state object, field validation, dirty/cancel state, save/reload behavior, and shared consumers for header/receipts. Implement mock preview/upload behavior or label/disable unavailable actions. Do not claim “saved” for unsaved fields.

### F03 — Responsive layout clips content

`.main` is a flex child with no `min-width: 0` (`styles/globals.css:174`). Wide descendants can determine its minimum width. `body` hides horizontal overflow (`:103`). A table wrapper with overflow alone does not solve an expanding ancestor.

Measured desktop examples at 1200 CSS pixels: Classes document width 1698, Fees 1475, Staff 1440, Parents 1404, Timetable 1302. At 325 CSS pixels: Classes approximately 1422, Fees 1199, Staff 1164, Students 617, Settings 572. These are document/main overflow measurements, not merely acceptable scrolling inside a table.

![Observed narrow Classes layout](mobile-classes.png)

**Correct:** constrain the app/main/content flex chain, scope wide-table scrolling inside its card, stack toolbars/forms, and keep primary actions reachable. Provide a readable compact record view for phones where a wide table is impractical. Recheck 320/375/390, 768, 1024, 1280, and 1440 CSS pixels at normal zoom.

### F04 — Role preview is internally inconsistent

`components/Layout.js:6` maps routes to view permission only. Finance is missing from this map even though Sidebar maps Finance to Fees. Settings bypasses Layout entirely. Layout and Sidebar ignore a role's blocked status and its scope constraints.

**Observed:** selecting Rakesh Sharma / Senior Teacher left New Student, Edit, and Delete visible; New Student opened the form. The role's Student actions are only view/export. Direct Finance and Settings URLs rendered successfully despite those items being hidden from that role's sidebar.

Several CRUD pages have no action-specific permission checks. Library/Transport combine create/edit/delete into one hasEditPermission, granting the same action surface for any one of those permissions. Payroll uses Staff edit; the default Accountant role has Staff view only, so its intended payroll workflow is inconsistent. Timeline allows any staff member to post regardless of Announcements permissions.

**Correct for this phase:** one shared `can(module, action)` policy for the demo, explicit blocked-state behavior, a complete route map, and matching disabled/hidden controls. Rename “Logged In As” to “Preview as” or add a persistent demo-role badge. Real authorization remains a future backend concern.

### F05 — Role exports are not PDF or Excel

`components/RolesPage.js:134` creates an application/json Blob, names it roles.pdf or roles.xlsx, and reports export success. `components/RoleDetailModal.js:28` repeats this behavior.

**Correct:** offer honest JSON/CSV downloads now, or generate actual files. Browser print-to-PDF is acceptable if labeled “Print / Save PDF.” Test the generated bytes and open the file; filename extension alone is not a format.

### F06 — Marks entry can silently corrupt the displayed result

`pages/examinations.js:337` saves Number(raw) without validating range or finiteness. Blank input becomes zero. The inputs declare min/max, but Save Marks is a click handler rather than validated form submission, so those attributes are not sufficient enforcement.

**Probe:** original handler stored 999 with maxMarks 100; an empty mark became 0. The probe stubbed grading, so its arbitrary grade string is not evidence about the actual grading algorithm.

**Correct:** validate the entire marks grid before save, identify student/subject errors inline, preserve blank/unmarked and absent states, and confirm any intentional zero-fill. Keep unsaved changes when validation fails or the exam/class selector changes.

### F07 — Fee class scope is ignored during batch generation

Fee templates define classIds (`pages/fees.js:16`), but `handleRunBatchGenerate` (`:481`) maps all selected templates into every targeted student's invoice. It does not intersect template classIds with the student's class. The loop also does not filter inactive students.

**Probe:** a classId 2 student received a fee with classIds [3].

**Correct:** derive eligible fee rows for each active student, show a preview/count and exclusions, and confirm generation. Define how weekly, monthly, and one-time frequencies apply; the current batch path just sums selected template amounts. Use a structured period key instead of free-text billing-month strings for duplicate prevention.

### F08 — IDs are not unique in batch creation

`makeId` returns Date.now (`lib/academicData.js:782`). `pages/exam-routine.js:223` and `pages/timetable.js:473` call it repeatedly inside map loops. Multiple records can receive the same ID, causing ambiguous edit/delete matching and React key collisions.

**Probe:** 100 rapid calls produced one distinct ID. Fee/payroll slip identifiers also have only a three-digit random suffix and a hardcoded 2026 prefix (`pages/fees.js:535`, `pages/salary.js:346`).

**Correct:** a collision-resistant local ID strategy with consistent type handling, plus separate human-readable document numbers. If changing numeric IDs to UUID strings, remove affected Number(id) conversions throughout the app.

### F09 — Document uploads/downloads are misleading demos

Student upload handlers (`pages/students.js:896`) store only name/type/size/timestamp. Staff uses the same metadata pattern (`pages/staff.js:517`). Download handlers construct synthetic text rather than the selected file (`students.js:2242`, `staff.js:1997`); finance receipt upload is explicitly a metadata mock (`finance.js:313`).

**Correct:** label this “Attach sample document metadata” and make downloads clearly sample files, or use a local file/blob store appropriate for a frontend prototype. Show allowed size/type, file validation errors, preview, replace/remove state, and accurate upload status. A database is not required to make this UI honest.

### F10 — Keyboard navigation and form naming need a shared fix

Sidebar links are clickable divs without link/button semantics or keyboard handling (`components/Sidebar.js:178`). Theme and color controls are also divs. Many labels are separate visual labels with neither htmlFor/id association nor wrapping input semantics. Initial-route checks found no explicit associated labels on all four Students controls and all 18 General Settings controls; placeholder fallback names are not a substitute for persistent labels.

**Correct:** actual Next links for navigation, native buttons/switches for interactive controls, stable IDs and label association, explicit names for icon actions and selection checkboxes, aria-current for navigation, semantic table headers, and a skip-to-content target. Never rely on Font Awesome glyphs as accessible names.

### F11 — Modals are visual overlays, not complete dialogs

**Observed on Add New Book:** no semantic dialog element, focus remained on the launcher, and Escape left the modal open. Source does not provide a common focus trap/restoration or Escape handler. Overlay clicks close many forms without a dirty-state check.

**Correct:** shared dialog primitive with labeled title, initial focus, focus containment, background inertness, Escape/cancel rules, scroll locking, focus restoration, and unsaved-change handling. Keep keyboard focus indicators visible. Announce success/error toasts with appropriate live-region semantics.

### F12 — Muted text is too low contrast

Default `--t3` against card background is approximately **2.32:1 in dark mode** (#484E78 on #111320) and **2.81:1 in light mode** (#9298C0 on white). These tokens are used for ordinary small text, labels, and breadcrumbs. Normal text generally needs 4.5:1; verify each rendered combination and exception rather than assuming all token usage has identical requirements.

**Correct:** accessible text tiers in both themes, visible keyboard focus, text/icons in addition to color-only status, and larger touch targets. Attendance cells currently use very small 8–10px text. Add reduced-motion handling for nonessential transitions/animations.

### F13 — Cross-page relationships can become stale

- Student deletion (`students.js:654`) does not reconcile parent studentIds, transport allocations, library loans, attendance, or class monitors.
- Class deletion (`classes.js:370`) does not block/reassign enrolled students or remove related schedules.
- Staff deletion (`staff.js:491`) can leave teacher assignments or other references behind.
- Subject deletion updates classes (`subjects.js:344`) but leaves timetable/routine records referencing that subject.
- Role lookup uses name, while role rename (`RolesPage.js:100`) does not update linked staff role strings.

**Correct:** define restrict/archive/reassign behavior for each relation. Show dependencies in the delete dialog. Use stable foreign IDs for role association and derive labels from the central entity. Do not silently delete unrelated history to hide inconsistency.

### F14 — Role details and creation do not reflect the selected data

RoleDetail uses DUMMY_USERS sliced by a count, not staff actually linked to the role (`RoleDetailModal.js:3`, `:25`), and shows the same static AUDIT_LOG for every role. View and Change Role have no handlers (`:125`). New role creation places status:'active' and constraints:[] after spreading submitted data (`RolesPage.js:104`), discarding the user's selected status/constraints. Persisting only non-empty role arrays (`:35`) also prevents a fully empty registry from persisting.

**Correct:** derive linked users, label sample audit events, implement/disable actions, preserve submitted creation values, and persist valid empty collections. Pagination should clamp after deletions; role detail data should refresh after status changes.

### F15 — Locale and school configuration are disconnected

Fees/payroll/finance use dollars; library/transport display Rs.; Settings shows an INR symbol and India defaults while forms and payment modes also include Nepal-specific examples. numberToWords returns dollars (`lib/academicData.js:804`). Receipts and school identity are hardcoded in several places. Academic year selection does not scope the stored student/class/fee collections, and examination defaults remain 2026–2027.

**Correct:** choose or configure locale, currency code/symbol, date display, timezone, school identity, and academic session centrally. Use ISO data internally and format at display boundaries. Make clear whether academic year is merely a label or a working data filter. Do not silently imply historical-year isolation.

### F16 — Related dates and grading rules are under-validated

- Exam form validates name/start/classes but not end >= start or passMark <= maxMarks (`examinations.js:256`).
- Exam routine validates required values but not date within exam, end > start, or room/class time overlap (`exam-routine.js:197`).
- Timetable conflict logic compares period IDs; separate periods with overlapping clock times can avoid the collision check (`timetable.js:383`).
- Grade thresholds can overlap or leave gaps; rules are edited and persisted without a validated save stage (`examinations.js:1236`).
- `getPassFail` uses gradeSchema pass flags (`examinations.js:145`), not the selected exam's passMark, so the visible pass-mark field can disagree with report results.

**Correct:** central academic validation, interval-based schedule checks, explicit grading/pass policy, and actionable inline errors. Include boundary cases such as 0, maximum, decimal marks, absent students, and tied ranks.

### F17 — Library stock and due-date rules are incomplete

Editing quantity clamps available to zero without checking outstanding copies (`library.js:201`). A stock of ten with two loans can be changed to one.

**Probe:** quantity became 1, available became 0, while the two loans were not changed. Loan due date has no minimum tied to issue date (`:939`).

**Correct:** quantity must be at least active borrowed copies; show borrowed/available/total separately. Validate due dates and define lost/damaged/renewal behavior if these are in scope. Validate ISBN/duplicate catalog policy without treating optional ISBN as mandatory.

### F18 — First-visit seed behavior is inconsistent

Exam Routine loads exams with [] fallback (`exam-routine.js:88`), while Examinations owns its seed array. A fresh browser opening Routine first therefore has no exam catalog. Sidebar reads raw storage with empty defaults (`Sidebar.js:21`) while Layout uses seed defaults. RolesPage staff defaults to [] (`RolesPage.js:32`); Subjects also uses an empty students fallback (`subjects.js:56`). This makes counts and navigation depend on visit order.

**Correct:** one versioned seed initialization path shared by every entry route. Test direct entry in fresh storage, not only navigation after opening Students/Staff/Examinations.

### F19 — Export encoding and failure feedback need correction

`lib/exportUtils.js:26` interpolates title/subtitle/header/row values into document.write without HTML escaping. A harmless strong-tag probe was emitted as actual markup instead of literal text. Other report/admit-card/attendance print templates use the same interpolation pattern. This can distort a printed document and creates a script-injection sink if untrusted data is later introduced.

CSV escapes delimiters/quotes in values but does not neutralize spreadsheet formula prefixes; headers are simply joined. Object URLs are not revoked. Popup-blocked print calls silently return.

**Correct:** escape all text placed into generated HTML, use an explicit policy for formula-like CSV cells, revoke object URLs, and report blocked popups/download failures. Keep sample exploit strings harmless during QA. This was not an exploit test or a claim that every framework advisory is reachable.

### F20 — “Closed and locked” finance data remains mutable elsewhere

Finance stores closed-day totals (`finance.js:199`) but current metrics are recomputed from mutable student payments and staff salary history (`:84`, `:116`, `:148`). Other modules can change those records without respecting audit closure. Backdated expense entry also does not reject a closed target day. closedBy/paidBy are often hardcoded Super Admin.

**Correct for the prototype:** choose whether closed days are snapshots or reopenable working data; enforce that choice across fee/payroll/expense interfaces and show adjustments/reopen state. Carry selected demo actor consistently. Opening-balance lookup should use the nearest earlier day, not simply the latest log when the selected date is absent.

### F21 — Context and demo behavior need cleanup

- Finance, Celebrations, and Events Feed display “Settings” in the topbar because their title mappings are absent (`Layout.js:89`).
- Breadcrumb always says System / School Settings (`Layout.js:135`). Browser title is always EduCore (`pages/_app.js:22`).
- Sidebar badges say 1.2k students / 32 staff while current fixtures are six / five (`Sidebar.js:68`).
- Birthday wish submission only shows a success toast (`birthdays.js:294`); use “Preview wish”/“Simulate send” until delivery exists.
- Dashboard and /dashboard duplicate code. The latter lacks dob guards at lines 88, 101, 108; clearing a relevant person's optional DOB can make .split fail there while / is guarded.
- Dashboard birthday simulation is on by default; keep that label clear and consistent with actual student detail data. The dashboard currently offers registry/birthday summaries, not the full executive fee/attendance/feed experience described by README.

**Correct:** route metadata shared by shell/navigation, truthful counts, descriptive tab titles, explicit demo banners, and one dashboard implementation.

### F22 — Local storage recovery and cross-tab behavior are unspecified

readStoredList catches JSON parse errors but getItem itself is outside the try block. writeStoredList has no exception handling (`academicData.js:763`, `:777`). Many pages write entire collections from a snapshot. There is no shared subscription/version/conflict strategy, and multiple tabs can overwrite newer changes. Most forms have no leave-with-unsaved-changes warning.

**Correct:** a small storage adapter with schema/version validation, safe read/write results, user-visible quota/unavailable-storage errors, one seed migration, and backup/reset/import UX. Decide whether multi-tab edits are supported; either synchronize them or warn/reload stale views. A local-storage prototype still needs a reliable save contract.

### F23 — Transport routes and fleet remain separate registries

Route records have title, origin/destination, stop strings, and fee. Vehicles have identifiers, driver and capacity. Student assignments point to a route and stop. The forms do not associate a vehicle/driver with a route, so the displayed seating capacity cannot enforce allocations. Stop times, driver-license details, and maintenance history claimed by README are not present in the form inventory.

**Correct:** either narrow the module to these three registries or add route-vehicle association, occupancy calculation, stop timing, duplicate plate/code validation, and reassignment flows. Keep these as UI/local-data work if fleet integration is deferred.

### F24 — Dependency baseline needs a planned upgrade

Installed dependencies are Next 13.5.6 and React/React DOM 18.2.0. `npm audit` reported four affected packages: Next critical, nanoid high, PostCSS high, source-map-js high. The saved JSON includes package ranges and advisory URLs. These are package-level findings; applicability differs by feature and deployment.

The official [Next.js support policy](https://nextjs.org/support-policy) lists 13.x as unsupported and 16.x/15.x as supported at audit time. The npm suggestion of 13.5.11 is not proof of comprehensive remediation. Plan a supported-version migration, check compatible React/Node requirements, rebuild, and rerun the UI checks. Do not apply an unreviewed `npm audit fix --force` to this downloaded copy.

Local inspection used a loopback-only server. Do not use the public share script as the default audit setup with this dependency baseline.

### F25 — Documentation should describe the prototype accurately

| README claim | Actual evidence | Documentation correction |
|---|---|---|
| Ironclad guards across every route/component | View-only map, missing route guard, inconsistent actions | Describe role simulation and its completion criteria |
| All modifications persist seamlessly | Attendance reload defect; most Settings fields not saved | List actual persisted models and known limitations |
| 100% responsive / pixel perfection | Measured document overflow | State tested viewports and unresolved issues |
| Complete CSV/PDF engine | Most CSV/print paths exist; Roles exports invalid formats | Distinguish CSV, actual PDF, browser print, and mock files |
| Real-time executive fees/attendance/activity | Dashboard mainly registry counts and birthdays | Separate implemented dashboard from planned KPIs/feed |
| Attendance Excused | Current cycle is Present/Absent/Late/Holiday | Align status vocabulary and requirements |
| Ten preconfigured roles including Super Admin | Ten stored roles include Sports Coordinator; Super Admin is a special bypass | Document actual role model; Transport Manager seed is blocked |
| Hostel/visitor/report capabilities through roles | No standalone Hostel/Visitors/Reports pages | Mark planned modules explicitly |
| MIT / contribution links | LICENSE and CONTRIBUTING.md missing | Add the actual intended license and contribution instructions |
| Clone your-username/educore-next | Placeholder remote | Replace with the actual repository URL |
| Node >=16.14 | Node 16 is end-of-life | Use a supported runtime and verified minimum for the chosen Next release |
| Current CSS token example | Several values differ from globals.css | Generate/reference actual tokens |
| Offline capable | Local records persist; fonts/icons are CDN-dependent; no service worker | Distinguish local persistence from offline app installation |

The agent guidance contains absolute `e:/user/Schools/...` links from another machine and prechecked build assertions. Replace those links and make the checklist a requirement to verify, not a pre-existing proof. `.gitignore` ignores .env*.local but not a plain .env; align ignore patterns with the stated secret-handling guidance before future backend work.

### F26 — Download/repository and maintenance gaps

This is a source archive, not a Git checkout: `git rev-parse --show-toplevel` fails and there is no .git directory. The zero-byte file named git is not Git history. Keep it intact until cleanup is chosen; clone the actual repository separately if normal commits/pulls are needed.

No lint/test scripts, ESLint configuration/dependency, test suite, CI workflow, Node engines declaration, or runtime version pin exists. Next's build-stage “Linting and checking validity of types” message is not proof of configured lint coverage or TypeScript checking; this project is JavaScript.

`SettingsTabs.js` is unreferenced by active pages and duplicates Settings logic. The original 93 kB HTML file is a standalone design prototype rather than a Next route. dev-server.log records an older path's spawn EPERM error; that is not the result of this successful build. Large page files—Students 3699 lines, Staff 2432, Fees 1771, Classes 1746—mix schema, calculations, forms, tables, detail views, and printing.

**Correct incrementally:** shared form fields, dialog, table toolbar/empty state, toast, school settings, permissions, locale/date/currency formatting, storage adapter, and export helpers. Add focused tests for the proven bugs first. `--radius-xs` is referenced in 20 locations but never defined; add the token or use an existing one. Avoid introducing a large UI library solely to fix these issues.

## Every page: what exists and what remains

Counts below are source definitions in that page file; shared Layout controls and mapped runtime repetitions are separate in the inventory.

| Route | Fields / buttons | Existing UI and field families | Main UI-phase work |
|---|---:|---|---|
| / | 1 / 1 | Registry KPIs, birthday cards, demo checkbox, celebration navigation | F21; real KPI/feed requirements if desired |
| /dashboard | 1 / 1 | Near-duplicate dashboard | Consolidate; missing-DOB case |
| /students | 60 / 45 | Search/class/status; identity, admission, class/roll, gender/DOB; guardian/contact; permanent/temporary addresses; documents; fees/receipts; exam history | F04/F09/F13; field names, DOB/roll/capacity validation, unsaved changes |
| /staff | 53 / 36 | Search/type/role/status; employee identity, department, designation/role, contacts/addresses; documents; salary rules/history; permissions view | Role links, salary/privacy preview scope, honest documents, deletion dependencies |
| /parents | 29 / 17 | Search/status; identity/phone/email/occupation/relation; student multi-link; both addresses; linked child detail | Attendance is an independent mock (`parents.js:49`), not Attendance records; guardian/student consistency |
| /classes | 23 / 26 | Search/status/teacher/capacity; name/section/code/teacher/monitor/room/capacity; subject and teacher mapping | Overflow, enrollment/deletion rules, capacity validation, blocked-state meaning |
| /subjects | 11 / 15 | Search/category/status/class; subject/category/textbook/publication/code references; class mappings; detail | Subject deletion/rename impact on schedules and name-keyed marks; honest CSV labeling |
| /timetable | 17 / 25 | Weekly class/teacher grid, period setup, weekday settings, schedule subject/teacher/room, multi-class breaks | F08/F16; clock overlap, keyboard grid, readable mobile view |
| /examinations | 26 / 22 | Exam schedule, marks grid, analytics/report cards, grade settings; academic year/date/class/max/pass fields | F06/F16; preserve unmarked and unsaved data; unify pass policy |
| /exam-routine | 13 / 16 | Routine slots, rules, class/subject/date/time/room, student selection, admit-card print | F08/F16/F18; date/room collisions, direct-entry seed, batch selection/print QA |
| /attendance | 5 / 12 | Student/staff calendar, class/month/year/search, individual/bulk marking, analytics/export | F01 first; future/unmarked/holiday semantics, readable cells, correct source in Parents |
| /library | 15 / 18 | Catalog, checkout log, fines; title/author/category/quantity/ISBN/publisher; member/type/due date | F11/F17; consistent actions/stock, due dates, modal behavior |
| /transport | 18 / 23 | Routes/stops/fee, vehicles/plate/capacity/driver/status, student allocations | F23; capacity and fleet relationships, stop/vehicle reassignment |
| /fees | 22 / 25 | Collection ledger, fee configurator, batch invoice dialog, payer/method/relationship/discount/tax, receipt preview | F07/F08/F15; eligible preview, period model, proper partial-payment design if in scope |
| /salary | 16 / 26 | Payroll ledger, staff salary configurator, batch run, pay-out dialog, payslip | Accountant permission, unique slips, nonnegative totals, month model, finance closure |
| /finance | 13 / 16 | Daily cash audit, fee reports, payroll dues, expense tracker; date/opening balance/category/amount/receipt metadata | F04/F20; closed-day contract, actor identity, cash/bank distinctions |
| /roles | 0 / 0 | Route delegates to RolesPage; filters, table/card, wizard, detail, permissions/users/audit, exports | F04/F05/F14; live staff association and complete permission preview |
| /settings | 47 / 25 | General, Branding, Contact, Finance, Compliance | F02; complete save model and remove deceptive inactive actions |
| /birthdays | 7 / 5 | Search/role/class/month, birthday demo mode, templates, custom wish | Simulated-send wording, age/leap-day policy, demo state consistency |
| /timeline | 11 / 14 | Feed, search/category/audience, calendar, likes/comments, announcement form | Permission matrix, audience behavior, date/time validation, mock broadcast wording |

Field-by-field source rows—including required/min/max/type/default/onChange information—are in the [control inventory](FIELD-AND-COMPONENT-INVENTORY.md). Use those rows to track fixes instead of assuming a page is finished because its primary form opens.

## Shared components, libraries, and framework files

| File | Role | Audit action |
|---|---|---|
| components/Layout.js | Theme, shell, topbar, preview user, view gate | Shared route metadata, complete permission policy, semantic landmarks and labels |
| components/Sidebar.js | Navigation, resize, collapse, mobile drawer | Links/keyboard, seed consistency, true counts, resize accessibility and persistence decision |
| components/RolesPage.js | Role registry and CRUD | Real format exports, correct create payload, empty-save/pagination, live counts |
| components/RoleFormModal.js | Four-step full-page role wizard despite filename | Field errors, status/constraint persistence, keyboard step navigation, unique role names |
| components/RoleDetailModal.js | Full-page role detail despite filename | Replace dummy users/audit, wire or disable actions, refresh active detail |
| components/SettingsTabs.js | Unused alternate settings implementation | Reconcile/delete only after choosing one owner; do not fix the unused copy by mistake |
| lib/academicData.js | Fixtures, storage keys/helpers, IDs, words | Typed storage reads, seed ownership, durable IDs, locale-aware formatting |
| lib/exportUtils.js | CSV and print-window generation | Encoding, honest formats, popup failure feedback, URL cleanup |
| pages/_app.js | CSS and repeated theme restore, generic title | Shared theme owner; per-route document titles |
| pages/_document.js | HTML lang, theme bootstrap, Google font/CDN icons | Retain lang; consider self-hosting critical fonts/icons for reliable offline demos |
| pages/_error.js | Error/404 fallback and Home action | Useful base; avoid relying on failing Layout/storage for all error recovery |
| styles/globals.css | Tokens, components, responsive and receipt print CSS | Constrain flex widths, contrast, focus/reduced-motion, missing radius token, scope print rules |

Global print CSS hides all content children except a receipt overlay (`globals.css:1551`). This is tailored to receipts; ordinary browser Print on other pages may be blank. Route-specific popup reports have their own templates. Verify each intended print path separately, including A4 pagination, long names, repeated headers, and page breaks.

## Setup / missing-item classification

| Item | Classification |
|---|---|
| Node/npm/Git | Already installed; verified versions in SETUP.md |
| node_modules | Was absent; installed from the existing lockfile during audit |
| Database / ORM / API keys / .env | Not required by the current frontend code |
| Next/React packages | Present after install; framework upgrade needed as a separate task |
| Tailwind / Bootstrap / UI kit | Not required; project uses vanilla CSS |
| TypeScript | Not used and not required to run; adoption is optional |
| ESLint + accessibility rules / focused tests | Missing quality tools, worth adding for this phase |
| PWA/service worker / local file store | Optional capabilities, not runtime prerequisites |
| LICENSE / CONTRIBUTING / real clone URL | Missing or placeholder documentation |
| .git history / remote | Not included in this ZIP-style copy |

## Recommended order to finish the UI phase

1. Repair attendance, destructive fixture migrations, and Settings save contracts, unique IDs, marks validation, and batch fee eligibility. Add focused regression checks.
2. Fix shared main/table overflow, navigation semantics, labels, dialogs, contrast, and mobile actions. These affect many screens at once.
3. Unify demo permissions, school configuration, locale, seed initialization, and cross-page relationships.
4. Replace misleading exports/uploads/send messages; explicitly label every remaining mock capability.
5. Complete page-specific boundary cases using the acceptance checklist, then test with fresh storage and larger fixtures.
6. Upgrade the framework through a separate reviewed migration; rerun the same checks. Rewrite README around verified behavior and documented limitations.

## Remaining validation before sign-off

Not completed in this audit: every form submission/field permutation; all roles and blocked/scoped combinations; physical-device/browser matrix; screen-reader session; 200%/400% zoom sweep; full axe/WCAG conformance audit; actual PDF/Excel opening and all print pagination; large-data performance; storage quota/private-mode failures; cross-tab conflict testing; live Vercel deployment/headers. No performance score or full accessibility certification is claimed.

The report provides full route/source-control coverage and reproducible high-impact findings. Completing the remaining matrix after fixes is necessary before declaring the UI/UX phase finished.
