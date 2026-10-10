# 05 — Docker, hosting and cost

Status: planning only. No Docker installation, paid account, region change or infrastructure deployment is part of this work.

## Do we need Docker now?

**No for the existing prototype. Optional for the first hosted backend; recommended when repeatable local database development is needed.**

| Situation | Decision |
| --- | --- |
| Run current Next.js prototype | Node.js + npm are enough |
| Develop against an isolated hosted Supabase development project | Docker not required for application requests; internet required |
| Run the standard full local Supabase stack on this Windows machine | Use Supabase CLI plus a Docker-compatible container runtime |
| Develop during unreliable internet | Local containers are useful after initial downloads; external email/storage services may still need network |
| Deploy Next.js on Vercel and use hosted Supabase | No application-managed production Docker required |
| Later move application/workers to a VPS or container host | Container packaging becomes useful; host operations remain your responsibility |

The standard `supabase start` workflow needs a Docker-compatible runtime. Supabase documents an experimental native process alternative for selected Linux/macOS systems, not a reason to assume the same Windows setup works without containers. [Supabase local development](https://supabase.com/docs/guides/local-development).

On Windows, check available RAM/disk and Docker Desktop/WSL prerequisites before choosing the full local stack. Bind local services to loopback and use fictional seed data. Keep migrations in Git, persist local database volumes intentionally, and never mistake a Docker image or container volume for an off-device backup. Docker does not itself provide security, high availability or end-user offline support.

## Hosting recommendation

For a small team, prefer managed application hosting plus managed PostgreSQL/Auth/Storage. Use separate development and production projects; add an isolated staging environment before the pilot. Preview deployments must not receive production database secrets by default. Keep the existing live demo separate from the future real-data application configuration.

Use a single-region primary database and nearby APIs initially. The current US function setting should be revisited after the Nepal region test, not changed merely because this document recommends a candidate. Managed services reduce infrastructure work but still require access policies, query tuning, restore tests, incident response and budget management.

If later using direct PostgreSQL connections from serverless handlers, use the provider's compatible pooler and bound concurrency. Transaction pooling has connection/session semantics to account for; never rely on persistent per-user session state leaking across reused connections. Copy connection endpoints from the provider dashboard rather than constructing them. [Supabase connection options](https://supabase.com/docs/guides/database/connecting-to-postgres).

Self-hosting may lower the invoice while increasing staff time, patching, monitoring and recovery risk. A single cheap VPS is not automatically cheaper after operational effort, nor inherently more secure. Re-evaluate only when there is an identified maintainer and measured reason. Kubernetes is unnecessary for the proposed initial architecture.

## Budget snapshot

Provider prices checked 10 October 2026, in USD; recheck checkout terms and account-specific limits. The user has not set a budget. These are starting components, not an all-inclusive quote or a capacity guarantee.

| Component | Published starting point | Extra costs to consider |
| --- | --- | --- |
| Supabase development | Free tier available | Limited resources; free projects may pause; not the assumed operational production setup |
| Supabase Pro | From $25/month | Extra projects/compute, storage, egress and add-ons |
| Vercel Pro | $20/month platform fee including one deploying seat | Usage over credits, extra seats and add-ons |
| Recovery | Scope-dependent | PITR, independent copies and attachment storage |
| Other services | Not yet selected | Email/SMS, domain renewal, monitoring, support and payment-provider fees |

Supabase lists Pro daily backups with seven-day retention, and PITR starting from $100/month; PITR also has compute requirements. Confirm the full quote if the agreed recovery target requires it. [Supabase pricing](https://supabase.com/pricing), [recovery requirements](https://supabase.com/docs/guides/platform/backups).

Vercel Pro pricing above includes a $20 usage credit; it does not make usage unlimited. Hobby is designated for personal, non-commercial use, so verify plan suitability for the actual school/business deployment. [Vercel Pro](https://vercel.com/docs/plans/pro-plan), [Hobby scope](https://vercel.com/docs/plans/hobby).

The two base paid services total roughly **$45/month before extra usage, taxes, additional environments, recovery add-ons and messaging**. This is arithmetic from the published starting prices, not the expected final bill. A first budgeting exercise could reserve $60–100/month excluding PITR and significant SMS usage; this is a planning allowance, not a provider price. If recovery requirements need PITR, that allowance is insufficient and must be recalculated.

For NPR, multiply the actual USD bill by the payment provider's applicable exchange rate, then add any applicable fees/taxes. No exchange rate is assumed here. Verify international payment availability for the owner's account before committing to a provider.

Set usage alerts and review what spend controls actually cover. Decide the response when approaching limits: stopping requests may control cost but interrupts school work. Track database size, uploaded bytes, egress, active sessions, expensive queries and message volume monthly.

## Maintenance ownership

Assign named owners for deployments/rollback, identity administration, restore testing, dependency updates, monitoring and billing. Maintain SQL migrations and change records. Prefer backward-compatible schema changes so application rollback does not require destructive database rollback. Make sure code, SQL schema, user identities and uploaded files have a documented export/migration path.
