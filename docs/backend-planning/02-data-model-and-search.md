# 02 — Data model and search

Status: design proposal; no tables or indexes have been created.

## Core schema

| Domain | Proposed records |
| --- | --- |
| Organization | schools, campuses, academic_years, school_settings |
| Identity/access | user_profiles, school_memberships, roles, permissions, role_permissions, staff_assignments |
| People | students, guardians, student_guardians, staff |
| Academics | class_sections, enrollments, subjects, subject_assignments, periods, timetable_entries |
| Assessment | exams, exam_sessions, marks, grade_schemas, published_results |
| Attendance | attendance_sessions, student_attendance, staff_attendance |
| Fees | fee_structures, invoices, invoice_lines, payments, payment_allocations, reversals |
| Payroll/finance | payroll_runs, payslips, expenses, accounting_days, ledger_entries |
| Library | books, book_copies or inventory_batches, loans, fine_charges, fine_payments |
| Transport | vehicles, routes, stops, student_transport_assignments |
| Other modules | events, wish_drafts, attachments, emergency_contacts, compliance_records |
| Operations | audit_events, idempotency_keys, background_jobs, sync_changes |

Finalize names and cardinality with real workflows. Model enrollment separately from a student's identity so promotions do not overwrite last year's class and roll number. Model parent-child links as many-to-many. Separate school membership from an authentication user so one account can hold different roles at different schools.

School-owned rows carry `school_id`; academic records also carry `academic_year_id` where meaningful. Verify these on the server and in row policies. Composite keys/foreign keys should prevent linking a row from school A to a student from school B. Never trust a client-supplied school ID as proof of access.

Suggested uniqueness rules include school + admission number; school + academic year + class + roll number for active enrollments; attendance session + student; exam + subject + enrollment; and school + document type + receipt number. Confirm actual school rules before implementing them. Record IDs should be server-generated UUIDs or another consistent identifier strategy, not array length or timestamp guesses.

## Data types for Nepal

- Use PostgreSQL `date` for birthdays, attendance dates and due dates; these are not UTC instants.
- Use timezone-aware timestamps for events such as payment creation; store instants consistently and display using `Asia/Kathmandu`.
- Store one canonical Gregorian date. If Bikram Sambat entry/display is needed, add a tested conversion boundary and preserve the user's calendar context where useful. Do not store ambiguous strings such as `10/11/26` as dates.
- Preserve Nepali Unicode names and English names without forcing transliteration. Keep phone numbers as text and normalize country codes; a phone number is not an arithmetic value.
- Use integer minor units or fixed-precision decimal for money, with an explicit currency. Do not use binary floating-point totals for accounting. Keep historical currency/tax values with transactions rather than deriving them from today's settings.
- Rename generic settings fields to explicit properties and validate updates against a schema.

## Critical transactional operations

Payment creation must atomically save payment, allocations, audit event and idempotency result. Invoice generation must enforce its period/fee uniqueness inside the database. Book issue must check stock and create the loan under appropriate locking. Closing an accounting day must not race with payment posting; both operations must observe the same lock/state rule. Corrections to posted finance entries should be traceable reversals, not silent history edits.

Capacity checks need a concurrency strategy, not just a query followed by an insert. Validate with simultaneous requests. Prefer database invariants over trusting a disabled UI button. Database constraints provide a second enforcement boundary. [PostgreSQL constraints](https://www.postgresql.org/docs/current/ddl-constraints.html).

## Search strategy

Start with PostgreSQL search; add a separate search system only after relevance or measured capacity demands it.

| Query | Initial approach |
| --- | --- |
| Admission number, receipt number, phone | Normalized exact match with B-tree indexes |
| Class/year/status lists | Tenant-leading composite indexes matching filters and sort order |
| Partial name or misspelling | Evaluate `pg_trgm` with a GIN/GiST index against real names |
| Library titles and longer descriptions | Evaluate PostgreSQL full-text search with GIN |
| Broad reports | Bounded queries and, when measured necessary, precomputed summaries |

`pg_trgm` supports similarity and indexed LIKE/ILIKE patterns. Very short queries may offer too few usable trigrams and require a separate prefix/exact path. GIN is the usual preferred full-text index. [Trigram documentation](https://www.postgresql.org/docs/current/pgtrgm.html), [text-search indexes](https://www.postgresql.org/docs/16/textsearch-indexes.html).

Test Devanagari and mixed-script names with the actual database collation/tokenization. Do not promise Nepali stemming or English-to-Nepali matching from default full-text settings. Start with Unicode normalization, exact/prefix matching and curated test cases; add aliases/transliteration only as a deliberate feature.

Every search must apply authorization before returning results, suggestions or counts. Index access-policy lookup columns too. Use bound parameters, allowlisted sort fields, bounded query lengths and pagination. Fetch 25–50 rows initially, not an entire school registry. Debounce live search around 300 ms and cancel obsolete requests; these are starting settings to tune.

Measure query plans using representative authorized roles and school sizes. A superuser benchmark can hide RLS-related work. Add indexes from actual query patterns; indexes consume storage and slow writes. Use stable cursor pagination for large ordered datasets and lazy-load record details/attachments. Do not claim a row-capacity ceiling until load tests establish it.
