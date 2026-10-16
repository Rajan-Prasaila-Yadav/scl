# 01 — Stack and database decision

Status: proposed architecture, 10 October 2026. See [assumptions](README.md).

## Why PostgreSQL fits this project

The application connects students, guardians, class enrollments, academic years, staff assignments, attendance, invoices, payments, books and transport. These relationships need consistent updates and reporting. PostgreSQL is the recommended primary store because we can model those relationships directly, enforce constraints and perform related changes in database transactions. Foreign keys and uniqueness should enforce correctness even when two people submit simultaneously. [PostgreSQL constraints](https://www.postgresql.org/docs/current/ddl-constraints.html).

Do not store the existing localStorage arrays as giant JSON documents. Use relational tables for important records; reserve JSONB for genuinely flexible metadata. A database is only one component of speed: query design, indexes, payload size and network distance can dominate user response time.

## Alternatives and decision

The fit assessments below are engineering judgments for this project, not benchmarks.

| Option | Useful strengths | Trade-off here | Decision |
| --- | --- | --- | --- |
| Managed PostgreSQL through Supabase | Database, identity and file storage in one platform | Policies, migrations, backups and sync still need engineering; provider-specific auth/storage integration | Recommended starting platform |
| Managed PostgreSQL through another provider, such as Neon or a cloud database service | Same relational foundation; separate infrastructure choices | Must evaluate identity, file storage, region, connection behavior and total operating cost together | Valid alternative if team/provider preferences justify it |
| MySQL with InnoDB | Mature relational transactions; familiar to many teams | No current MySQL investment makes it preferable to the proposed PostgreSQL tooling | Good alternative if the maintaining team knows it better |
| MongoDB | Flexible documents, embedding and multi-document transactions | Relationship-heavy school reports and consistency rules need deliberate modeling; it is not inherently unsuitable, just less direct here | Not the default for this application |
| Cloud Firestore | Client caching and synchronization can simplify disconnected workflows | Document-centric modeling and conflict behavior need care for school finance and cross-record invariants | Consider only if offline mobile document workflows become the main product |
| SQLite | Useful embedded database with simple local operation | A separate design is needed for shared multi-school server writes and replication | Useful for local tools, not the proposed shared primary database |

MySQL's InnoDB supports transactional ACID behavior; MongoDB also supports transactions, so this choice is not based on claiming either lacks them. [MySQL](https://www.mysql.com/products/standard/), [MongoDB transactions](https://www.mongodb.com/docs/manual/core/transactions/).

Firestore supports offline cached reads/writes and uses last-write-wins for multiple changes to the same document. That is useful, but it does not define the correct resolution for conflicting fee or attendance changes. [Firestore offline behavior](https://firebase.google.com/docs/firestore/manage-data/enable-offline).

## Proposed application stack

| Layer | Recommendation | Reason |
| --- | --- | --- |
| Frontend | Keep Next.js, React and existing CSS | Preserve the prototype investment |
| Language | Introduce TypeScript for new services/contracts, then migrate touched features | Make data shapes explicit without a complete rewrite |
| Backend | Next.js Node-runtime API routes under `pages/api/v1/` | Works with the current Pages Router; avoids a second deployment initially |
| Structure | Feature modules with handlers, services and repositories | Keep business rules out of large page files |
| Database platform | Supabase-managed PostgreSQL | Consolidates database, Auth and Storage |
| Identity | Supabase Auth with supported server integration | Avoid building password/reset machinery from scratch |
| Data access | Supabase server client using the verified user's identity; SQL migrations and reviewed transactional functions | Preserve RLS and transactions through clear interfaces |
| Validation | Zod at request boundaries plus database constraints | Shared input shapes with server enforcement |
| UI server-state | TanStack Query behind feature hooks | Central loading, cache invalidation, retries and cancellation |
| Attachments | Private Supabase Storage with authorized short-lived access | Keep bytes out of record rows and browser-only storage |
| Tests | Existing tests plus API/database isolation tests and browser journeys | Verify correctness across the full request path |

Next.js API routes can implement a backend alongside the existing Pages Router. Supabase provides the named database/Auth/Storage services. Zod provides schema validation; TanStack Query supplies configurable caching behavior. [Next.js API routes](https://nextjs.org/docs/pages/building-your-application/routing/api-routes), [Supabase platform](https://supabase.com/docs/guides/platform), [Zod](https://zod.dev/), [TanStack defaults](https://github.com/TanStack/query/blob/main/docs/framework/react/guides/important-defaults.md).

## Request boundary

```text
React page -> feature hook -> app service -> /api/v1 endpoint
                                               |
                         verify user + school membership + action
                                               |
                           repository / transactional SQL operation
                                               |
                             PostgreSQL constraints + row policies
```

Browsers do not receive database passwords or privileged API keys. Do not assume hiding a database endpoint makes it secure: every exposed table/function/storage route must enforce its own policy even if the UI normally goes through our API. Critical write paths must be impossible to bypass through direct table writes.

Use one migration authority: version-controlled SQL migrations. An ORM is not required for the initial Supabase path. Do not introduce Prisma and Drizzle together. If a later team prefers a direct SQL/ORM backend, document connection pooling, transaction-scoped user context and row-security behavior first. A direct owner connection does not automatically inherit the logged-in user's RLS policy.

Keep Supabase calls behind repositories to reduce replacement work later. PostgreSQL portability does not make identity, object storage or realtime behavior automatically portable; an exit plan must cover those too.

## Defer until measurements justify them

Do not add Redis, a dedicated search cluster, GraphQL, microservices or a separate NestJS backend initially. A separate worker is appropriate when reliable long-running exports, notifications or payroll batches exceed request lifetimes. Extract services when team ownership or workload actually requires independent deployment. Keep a modular monolith until then.
