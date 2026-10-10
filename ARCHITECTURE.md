# Architecture and backend preparation

Updated: 10 October 2026. The first section describes existing code. The migration section is a proposal, not implemented infrastructure.

## Current implementation

| Location | Responsibility |
| --- | --- |
| pages/ | Routes, page state, forms, calculations and record operations |
| pages/_app.js | Global CSS, theme restoration and demo seeding before page rendering |
| components/Layout.js and Sidebar.js | Shared shell, navigation and role preview |
| components/Dialog.js | Modal naming, focus handling and unsaved-edit protection |
| lib/academicData.js and examFixtures.js | Shared demo fixtures and data definitions |
| lib/seed.js | Seeds missing demo keys; preserves existing stored keys |
| lib/storage.js | Browser reads/writes, storage notices, conflict checks and metadata backup |
| lib/attachments.js | Browser-local attachment bytes in IndexedDB |
| lib/permissions.js | Client-side demo permissions; not server authorization |
| lib/validation.js and registryValidation.js | Selected academic and registry validations |
| lib/libraryData.js and attendanceSummary.js | Shared library/attendance calculations |
| lib/exportUtils.js and printDocument.js | CSV and browser-print helpers |
| styles/globals.css | Shared styling and responsive rules |
| tests/ and scripts/ | Regression tests and source checks |

Some fixtures, calculations and persistence effects still live in page files. Settings and permissions also read browser storage. There is no central API client, server session or query cache. The existing synchronous storage adapter cannot be replaced with network calls without adapting its callers.

## Page map

| Route | Data/workflow |
| --- | --- |
| / and /dashboard | Shared dashboard implementation and summaries |
| /students | Student records, class placement, related payments and attachments |
| /staff | Staff records, duties, salary history and attachments |
| /parents | Parent/student relationships and saved attendance summaries |
| /classes | Class definitions, capacity and student placement |
| /subjects | Subject catalog and academic associations |
| /timetable | Class/staff schedules and periods |
| /examinations | Exams, marks, grade schema and results |
| /exam-routine | Exam dates, rooms and session scheduling |
| /attendance | Student/staff attendance records |
| /library | Books, loans, returns and fine balances |
| /transport | Vehicles, routes, stops and allocations |
| /fees | Fee structures, billing and payment records |
| /salary | Payroll and salary payments |
| /finance | Daily accounting, expenses and closed-day snapshots |
| /birthdays | Birthday lists and local wish drafts |
| /timeline | School events feed |
| /roles | Demo roles, permissions and linked staff |
| /settings | School configuration, branding, contacts and compliance records |

## Proposed migration

Keep the UI and CSS. Introduce this dependency direction:

```text
Page/component -> feature hook -> service interface -> demo OR API implementation
```

Suggested additions: `features/<module>/` for hooks/forms, `services/` for stable asynchronous operations, `data/demo/` for fixtures and demo implementations, `data/api/` for backend implementations, and `lib/apiClient.js` for request/error handling.

1. Define contracts for IDs, relationships, dates, money, school/campus/academic-year ownership, pagination and validation errors. Replace generic settings field names with explicit names. Treat stored IDs consistently rather than mixing numeric and string comparisons.
2. Make both implementations asynchronous: list, get, create, update and archive operations. Keep transient form state in the UI; manage loading, empty, error and retry states in hooks.
3. Replace automatic whole-array persistence effects with explicit record mutations. Report success only after the operation succeeds. Handle duplicate submissions and stale-record conflicts.
4. Select demo or API mode explicitly. Seed only in demo mode. Never substitute demo records when an API fails, and never automatically upload browser demo records into a production database.
5. Connect authentication/settings first, then academic/people registries, dependent modules and financial workflows. Include dashboard summaries, exports and attachment downloads in migration scope.
6. Enforce authorization, tenant boundaries, uniqueness, capacity, stock, accounting locks and audit history on the server. Multi-record operations such as issuing books or recording payments require transactional consistency and duplicate-request protection.
7. Move attachment bytes to backend-managed storage with validated uploads and authorized downloads. Client-side checks remain useful feedback but do not grant access.
8. Test the same service behavior against demo and API implementations, then test complete browser flows including network errors, reloads and authorization failures.

The backend framework/database has not been selected. There are no API URLs, credentials or environment-variable requirements for the current prototype. Theme preferences may remain local after integration; school records should use the backend as the authoritative source.
