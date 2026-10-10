# 06 — Implementation roadmap

Status: proposed sequence. No task below is claimed implemented by creating these documents. Effort estimates wait until staffing, scope and offline requirements are agreed.

## Milestone 0 — Record the deployment and decisions

Obtain the live URL and inspect its deployed commit, host, region and production branch. The owner has reported deployment, but those details are unverified. Preserve the existing prototype release. Confirm scale assumptions, budget, data locations, recovery targets and offline-device policy from [the planning index](README.md).

Exit: a written decision record and development/staging/production boundaries; no accidental real records in demo fixtures.

## Milestone 1 — API-ready frontend

Create asynchronous service contracts and feature hooks for all 19 modules. Separate fixtures and demo implementations from page rendering; use explicit demo/API mode without failure fallback to sample data. Introduce TypeScript for new contracts, central request error handling and bounded query caching. Replace whole-array autosave effects with explicit mutations. No full router or CSS rewrite is required.

Exit: existing demo journeys still work through the new boundary; loading, empty, failure and retry states are verified; production demo data remains separate.

## Milestone 2 — Database and security foundation

Provision only after provider/budget decisions. Create isolated environments, version-controlled migrations, school memberships, authentication, row policies, audit records and private file access. Prototype the session flow and decide whether standard Supabase SSR or a server-only session gateway fits requirements. Define authorization tests before adding school records.

Exit: anonymous and cross-school access fail; migrations run from a clean database; schema types are generated/checked; secrets do not reach browser bundles; session and recovery flows pass tests.

## Milestone 3 — First complete vertical feature

Connect classes, enrollment and student registry end to end. Include create/edit/archive, search, pagination, permission checks and attachment access. Test two users editing the same record. Benchmark Mumbai versus Singapore from actual Nepal connections with synthetic datasets.

Exit: one useful workflow works in the browser against the database, with conflict/error behavior and measured performance. Select region from the evidence.

## Milestone 4 — Academic and operational modules

Migrate staff/parents/subjects, timetable, exams/results, attendance, library, transport, events and settings in dependency order. Preserve historical enrollment and distinguish draft from published results. Add transaction tests for stock, capacity and conflicting schedules. Replace browser-derived dashboards with authorized backend summaries.

Exit: complete workflow tests, including direct URL/API access and exports; no mock fallback in backend mode.

## Milestone 5 — Weak-network pilot

Implement the limited cache/draft policy and attendance outbox in [the network plan](03-nepal-performance-and-offline.md). Add conflict resolution, idempotency, sync status, tombstones, schema upgrade handling and user/school cache isolation. Test on an actual low-end phone as well as simulated throttling.

Exit: disconnect/reconnect cannot silently lose confirmed records or create duplicates; blocked users cannot replay changes; pending/confirmed state remains clear after reload; storage eviction and stale drafts have defined outcomes.

## Milestone 6 — Financial workflows

Implement fee structures, invoices, payments, payroll and accounting locks with reviewed financial rules, transactions, idempotency and traceable corrections. Add durable background jobs for operations too large for a single request. Approvals and financial confirmation remain online.

Exit: concurrent payment/day-close tests pass, duplicate requests return the original result, totals reconcile, and failed batches can resume without duplicate entries. The prototype's frontend calculations are not accepted as server enforcement.

## Milestone 7 — Real-data release

Complete [security gates](04-security-and-recovery.md), measured restore drills and load tests. Define production monitoring, alert routing, migration approval and rollback procedures. Validate the actual live environment, not only localhost. Train a limited pilot group and use a controlled import of approved records; never bulk-upload localStorage fixtures by default.

Exit: agreed acceptance evidence, accountable support owner, documented limits and a new release tag. Keep the old prototype baseline intact.

## Growth triggers

| Evidence | Consider next |
| --- | --- |
| Slow queries with large scans | Query/index improvements before bigger compute |
| Healthy queries but sustained CPU/connection pressure | More database compute and tuned pooling/concurrency |
| Large repeated reports | Precomputed summaries or a read replica, with explicit staleness rules |
| Export/email workloads exceed request lifetimes | Durable queue and worker with retries/dead-letter handling |
| PostgreSQL search cannot meet measured relevance/latency goals | Dedicated search index with tenant isolation and an indexing/reconciliation pipeline |
| Multiple teams need independent releases | Separate backend deployment/service boundaries |

Do not introduce an additional service solely because it is fashionable. Every new datastore needs ownership, access policies, monitoring, recovery and reconciliation.
