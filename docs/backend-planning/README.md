# Backend planning for EduCore

Prepared: 10 October 2026. Status: recommendation for discussion; not implemented or purchased.

## Recommendation

Use **PostgreSQL as the main database**, initially managed through **Supabase**, with the existing **Next.js frontend and a modular TypeScript backend in the same repository**. Start with one application and one primary database. Test Mumbai first and compare Singapore from real Nepal networks. Build weak-network support as a separate, explicit feature.

Docker is **not required for the deployed prototype or a hosted Supabase integration**. It becomes useful for repeatable local database testing, especially when development internet is unreliable. Do not add Kubernetes or microservices at this stage.

This is an engineering recommendation based on the current relational school workflows and a small-team assumption, not a claim that one stack is universally fastest or most secure. No Nepal latency measurements, load tests or hosting-account inspection have been performed.

## Assumptions and known facts

- The owner is in Nepal and has not decided school count, student count, concurrency or budget.
- Plan for one school first, with school-scoped records so more schools can be added safely.
- Existing stack: Next.js 16.4.0, React 18.2.0, JavaScript, vanilla CSS and browser-local fixtures.
- Existing deployment configuration selects `iad1` (US); no region change was made in this planning task.
- The owner reports the prototype is deployed. Its live URL, host settings and deployed commit have not been supplied/verified.
- Git origin now points to https://github.com/Rajan-Prasaila-Yadav/scl.git; that does not prove the current local documents have been pushed.
- The frozen prototype tag/branch and ZIP remain unchanged. These plans belong to subsequent development.

## Reading order

Start visually with the [current ERP relationship diagram](diagrams/README.md), revised on 11 October 2026 to cover people, multiple roles, scoped access and school modules. Roll numbers are enrollment references, not permanent global identities.

| Document | Answers |
| --- | --- |
| [01 — Stack and database decision](01-stack-and-database-decision.md) | PostgreSQL versus alternatives; backend and library choices |
| [02 — Data model and search](02-data-model-and-search.md) | Tables, financial integrity, fast search and Nepal-specific data |
| [03 — Nepal performance and weak networks](03-nepal-performance-and-offline.md) | Region choice, latency tests, caching and safe synchronization |
| [04 — Security and recovery](04-security-and-recovery.md) | Login, permissions, tenant isolation, attachments, backups and release gates |
| [05 — Docker, hosting and cost](05-docker-hosting-and-cost.md) | What to install now/later, operating responsibilities and budget model |
| [06 — Implementation roadmap](06-implementation-roadmap.md) | Ordered milestones and measurable acceptance criteria |

Official references are linked beside the relevant claims. Prices/regions/features are a research snapshot, not a purchase quote; recheck before provisioning. Performance figures in these documents are proposed targets, not measured results.

## Decisions still needed before a real-data pilot

Confirm expected schools/users, affordable monthly budget, who maintains operations, allowed data locations, which devices may retain offline student information, acceptable data loss/downtime, and whether attendance must work through a full-day outage. These affect provisioning and policy; they do not prevent preparing the service layer now.
