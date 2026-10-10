# 03 — Nepal performance and weak networks

Status: proposed design and test plan; no region benchmark or offline sync has been implemented.

## Region selection

Test a Mumbai API/database pair first, then a Singapore pair. This is a geographic starting hypothesis, not evidence that Mumbai is always faster from Nepal. ISP routing, mobile networks, congestion and provider load can change the result.

Supabase lists Mumbai (`ap-south-1`) and Singapore (`ap-southeast-1`). Vercel maps these to `bom1` and `sin1`. The current repository selects `iad1`, a US region. Before adding data-heavy APIs, colocate server functions with the primary database where possible. Static CDN delivery and database execution are different paths: a nearby CDN does not remove a distant API/database round trip. [Supabase regions](https://supabase.com/docs/guides/platform/regions), [Vercel regions](https://vercel.com/docs/regions).

Choose a specific region deliberately. Confirm allowable data locations and provider processing arrangements before storing real student information; a region setting alone is not a compliance assessment. No claim about Nepal's legal requirements is made here.

## Measure before selecting

Use temporary test environments with synthetic data and equivalent workloads. From a Nepal fixed connection and at least one actual mobile network, sample morning and busy-hour traffic over several days. Record median and p95 end-to-end duration, request errors, payload bytes and server/query duration separately. Include initial login, paginated students, Nepali name search, attendance save, file download and idle-start requests.

Do not select a provider from ping alone. TLS, DNS, server startup, database connections and multiple serial requests matter. Compare warm and idle conditions and record the device/network used. No external load test should hit the live school system without a controlled plan.

## Initial performance budgets

These are proposed acceptance targets to adjust after a baseline, not guarantees:

| Measurement | Starting target/test condition |
| --- | --- |
| Common read API | p95 under 500 ms from a representative Nepal connection, with the network profile recorded |
| Indexed database query | p95 under 100 ms on representative synthetic data and access policies |
| First-page list payload | Around 50 KB compressed or less, excluding lazily loaded images/files |
| Repeat navigation | Show eligible cached content immediately with freshness status |
| Slow connection | Test 400 Kbps down / 100 Kbps up / 400 ms added latency; no blank screen or lost draft |
| Interruption | Test 30-second loss and 30-minute offline sessions, refresh and browser restart |

A 500 ms target cannot be assumed achievable when the simulated network already adds similar latency. Report server and network time separately, and use a realistic slower budget for the degraded profile. Increase synthetic scale from 1,000 to 10,000 students and 25 to 100 active sessions to discover bottlenecks; these are test scenarios, not promised supported capacity.

Reduce initial JavaScript, paginate tables, lazy-load heavy views, compress responses and avoid fetching every module on startup. Self-host/subset required fonts and replace a whole icon font where appropriate after checking licensing. The current external font/icon requests are a weak-network dependency. Batch related API reads, use bounded queries and remove N+1 patterns before buying larger servers.

TanStack Query can manage server-state freshness, invalidation and retry settings. Set these deliberately per workflow; do not treat query caching as durable offline synchronization. [Query defaults](https://github.com/TanStack/query/blob/main/docs/framework/react/guides/important-defaults.md).

## Offline policy by workflow

| Workflow | Proposed disconnected behavior |
| --- | --- |
| Previously loaded timetable / limited class roster | Allow only on approved devices, clearly marked with last-sync time |
| Attendance | Save pending drafts for previously authorized sessions; reconcile on reconnect |
| Student/staff editing | Retain a minimal draft, but do not declare it saved to the school database |
| Search | Search only the permitted cached subset and label results incomplete |
| Payments, receipt issuance, payroll approval, day close | Require online server confirmation; never show a successful financial transaction from an offline draft |
| Role changes, new login, access grants | Online only |
| Large attachments | Wait for connection; resumable upload is a separate tested feature |

First use cannot download uncached school data without internet. Offline devices cannot learn immediately that access was revoked. Shared or untrusted devices should default to no persistent sensitive cache; approved-device caching needs an explicit expiry and a documented exposure trade-off. No browser encryption scheme with keys available to the same compromised page fully solves XSS or a compromised device.

## Synchronization protocol

Use a service worker for versioned public app assets and IndexedDB for narrowly scoped drafts/cache. Do not blindly cache authenticated API responses in a shared service-worker route. Partition every local record by school and user, and purge eligible caches on logout/account switch. Unsynced drafts need a clear warning before intentional removal.

Queued operations carry an operation ID, record ID, school/user context, expected record version, payload and state: pending, syncing, confirmed, conflict or failed. The server verifies current identity/permissions on every replay. It atomically records an idempotency key plus request fingerprint/result with the mutation; repeating a key with a different payload is rejected. A repeated network request must not create a second attendance record or payment.

Use server versions and a durable change cursor with tombstones for deleted records; client wall-clock time alone is not a reliable sync cursor. Reject stale updates with a conflict response and show the current record beside the draft. Never silently overwrite another teacher's attendance correction. Replay bounded batches with backoff/jitter, stop on authentication/permission failure, and retain actionable failure states. Recheck permissions when a blocked user reconnects.

Provide a visible Sync now action and sync while the application is open/on reconnect. Browser Background Sync has limited availability; correctness must not depend on it running when the app is closed. Browser storage can also be evicted, so an offline draft is not a server backup. [MDN Background Synchronization](https://developer.mozilla.org/en-US/docs/Web/API/Background_Synchronization_API).

Test two-device edits, duplicate retries, stale permissions, expired login, tab closure during submission, storage eviction, schema upgrades and switching schools. Users must always distinguish Pending on this device from Saved on server.
