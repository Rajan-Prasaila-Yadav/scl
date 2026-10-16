<div align="center">

# 🏫 EduCore

### School Management · UI Prototype

**A school administration workspace with configurable academics, class fees, student billing and payment history.**

![Next.js](https://img.shields.io/badge/Next.js-16.4.0-black?style=for-the-badge&logo=nextdotjs)
![React](https://img.shields.io/badge/React-18.2.0-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![Node](https://img.shields.io/badge/Node.js-22.x-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)
![Stage](https://img.shields.io/badge/Stage-UI_Prototype-6366F1?style=for-the-badge)

[🚀 Setup](#setup) · [✨ Features](#features) · [💰 Fee workflow](#fee-workflow) · [📚 Documentation](#documentation) · [🛠️ Validation](#validation)

</div>

---

> [!IMPORTANT]
> **This is a browser-local prototype.** There is no connected database, authentication service, payment gateway or message delivery. Roles demonstrate UI permissions; they are not server-enforced security. Backend designs are proposals.

## 📍 Current milestone

Updated **16 October 2026**. Development includes dynamic subject/class/teacher assignments, a dedicated student bill builder, partial payments, concessions, overdue tracking, configurable AD/BS academic years, bulk class fee setup and repaired individual fee settings.

The owner has reported an earlier deployment. The current live deployment and its commit have not been independently verified. A GitHub push does not by itself confirm deployment.

<a id="features"></a>
## ✨ Feature map

| Area | Available prototype workflows |
| :--- | :--- |
| 📊 Overview | Dashboard, campus timeline and birthday/celebration views |
| 👥 People | Student, staff and parent directories with linked records |
| 🏫 Academics | Classes, subject curriculum, teacher assignments and timetable validation |
| 📝 Exams | Examinations, routines, marks and printable academic views |
| ✅ Attendance | Student/staff marking, saved records and future-date rejection |
| 💰 Fees | Heading configuration, individual/bulk class rates, concessions, invoices and collections |
| 🧾 Statements | Student fee history, partial/full payments, remaining balances and overdue labels |
| 📚 Library | Catalog, issue/return workflows and fines |
| 🚌 Transport | Route and transport administration screens |
| 💼 Finance | Payroll, finance summaries and closed-day payment-history protection |
| ⚙️ Settings | School details, appearance, academic years, billing calendars and role previews |

There are **19 sidebar modules**. `/dashboard` also exposes the root dashboard implementation. For page responsibilities and backend boundaries, see [Architecture](ARCHITECTURE.md).

<a id="fee-workflow"></a>
## 💰 Configure → Bill → Collect → Review

### 1. Set the academic year

In Settings, configure the year label, start/end dates and **AD or Nepali BS** calendar, then activate the intended year. Fee activation dates must stay inside that active year. Canonical dates are stored in AD; supported billing inputs and periods use the selected calendar.

### 2. Create fee headings

In **Fee Management → Fee Configurator**, create or edit the heading name, description, default amount, frequency and status. Supported frequencies: **Hourly, Daily, Weekly, Monthly, One-Time and Yearly**. Examination fees can be configured as a named heading with the appropriate supported frequency.

Heading edits save independently of class activation dates. A heading can exist before it is assigned to a class.

### 3. Apply amounts and dates to classes

| Individual setup | Bulk class fee setup |
| :--- | :--- |
| Choose a class and edit one heading's amount, start/end dates and status. | Choose a class, load active headings and edit multiple fee rows together. |
| Save only that heading's class settings. | Save the entire validated draft in one operation. |
| Reactivate or deactivate the class assignment. | Duplicate headings and invalid amounts/dates prevent the whole save. |

Class-specific rates override the default. Removing a saved bulk row or disabling an individual assignment stops future billing for that class/year while retaining history. Existing issued invoices keep their saved amounts.

### 4. Apply student concessions

Student fee customizations can inherit the class rate, specify a custom rate, apply a percentage/fixed concession or increase, or fully waive an item. These settings affect future bills. Invoice items retain the applied concession snapshot.

### 5. Build an individual student's bill

Choose academic year, class and student in the dedicated bill builder. Review applicable headings, rates, existing invoices and periods before generating. Combine different frequencies in one bill; recurring items use the selected quantity. One-time/yearly items use one unit.

Monthly coverage follows the configured calendar, includes whole billing months without day proration, and is bounded by the assignment end month and a twelve-month cap. Already-billed periods are protected against duplicate billing, including periods reserved by unpaid or partially paid invoices.

Bill discount, tax and penalty accept percentage or fixed values. Printed invoices include student/class/year details, fee periods, totals in figures and words, collected amount, balance and spaces for physical stamp/signature. No official signature or stamp is fabricated.

### 6. Collect and review

Collect all or part of an invoice balance. Record payer name, an explicit relationship, collector and payment method. Custom relationship names are reusable and manageable. Further payments reduce the same invoice balance; each collection retains its receipt/history.

Class detail, student statement and Fee Management use shared billing records. Due dates determine overdue timing separately from payment status, so a partially paid invoice may also be overdue. Payment timestamps retain time; fee periods use date-focused display.

> [!NOTE]
> Academic years support billing settings, invoice metadata and reporting, but there is no historical enrollment engine or versioned class-rate history. Review back-year rates explicitly. No automatic arrears migration, scheduled penalties or reminders are implemented.

<a id="setup"></a>
## 🚀 Setup

**Requirements:** Node.js **22.x**, npm and Git for cloning. No database, Docker or environment file is required for this prototype.

```powershell
git clone https://github.com/Rajan-Prasaila-Yadav/scl.git
cd scl
git switch feature/dynamic-academics-and-fees
npm.cmd ci
npm.cmd run dev -- --hostname 127.0.0.1 --port 3100
```

Open [the local app](http://127.0.0.1:3100). On macOS/Linux, use `npm` instead of `npm.cmd`.

For a production preview:

```powershell
npm.cmd run validate
npm.cmd run start -- --hostname 127.0.0.1 --port 3100
```

Stop any server already using that port first. **Restart the production server after rebuilding** so it serves matching HTML and JavaScript assets.

## 💾 Data, permissions and exports

- Records persist in localStorage. Attachments use IndexedDB (`educore-files`); new attachment files are limited to 10 MB each and branding images to 250 KB each.
- A different browser, hostname or port has separate data. Clearing browser storage removes local records and files. GitHub stores source files, not your browser records.
- The storage error banner's JSON backup covers metadata, not attachment bytes. Legacy attachment metadata needs the original file uploaded for download.
- Role switching is a demonstration. Campus/class scope metadata does not provide server authorization or tenant isolation.
- CSV actions export CSV; PDF actions use printable browser views and Save as PDF.
- Communication preferences and birthday drafts do not send messages. Fonts/icons may need internet; browser-local persistence is not a complete offline synchronization system.
- Currency changes presentation, not conversion. Default bank/tax settings are metadata; bill and collection forms determine their own adjustments.

## 🧰 Technology and structure

| Layer | Implementation |
| :--- | :--- |
| UI/routing | Next.js 16.4.0 Pages Router; React / React DOM 18.2.0 |
| Styling | Vanilla CSS, shared theme variables and responsive layouts |
| Calendar | `nepali-date-converter` 3.4.0; BS 2000–2090 conversion support |
| Persistence | Browser localStorage and IndexedDB |
| Tests | Node test runner, source checks and Next.js production build |
| Backend | Proposed architecture only; not connected |

```text
pages/       Application routes and page state
components/  Shared UI, billing forms, statements and class fee editors
lib/         Billing, calendars, validation, storage and fixture logic
styles/      Shared CSS and themes
public/      Static assets
scripts/     Source validation tooling
tests/       Regression tests
docs/        Feature workflows and proposed backend planning
audit/       Historical audits and local verification evidence
```

<a id="documentation"></a>
## 📚 Documentation hub

| Guide | What it covers |
| :--- | :--- |
| [Project status](PROJECT-STATUS.md) | Current milestone, boundaries and documentation index |
| [Dynamic academics and fees](docs/DYNAMIC-ACADEMICS-AND-FEES.md) | Detailed workflows, implementation history and verification |
| [Architecture](ARCHITECTURE.md) | Current modules and proposed backend migration |
| [Backend planning](docs/backend-planning/README.md) | Database, Nepal latency, weak networks, security and Docker decisions |
| [ERP diagrams](docs/backend-planning/diagrams/README.md) | Conceptual people, roles and school-module relationships |
| [Contributing](CONTRIBUTING.md) | Development rules and validation requirements |
| [Deployment](DEPLOYMENT.md) | Publishing and frozen baseline preservation |
| [Release notes](CHANGELOG.md) | Checkpoints and changes |
| [Repair verification](audit/FIX-VERIFICATION.md) | Earlier audit repairs and their verification scope |

<a id="validation"></a>
## 🛠️ Validation and release boundaries

```powershell
npm.cmd run check     # Parse source and detect unresolved identifiers
npm.cmd test          # Regression suite
npm.cmd run build     # Production build
npm.cmd run validate  # All three checks
```

Latest application verification on **16 October 2026** passed **41 regression tests**, source checks and the production build. Targeted browser checks confirmed heading saves and individual class status persistence after reload. This documentation refresh does not claim a new application test run or complete browser coverage.

The original `v0.1.0-prototype` tag and `release/prototype-v0.1.0` branch remain frozen at `d4cc547`. Current development is on `feature/dynamic-academics-and-fees`. Historical audit/migration scripts are not safe to rerun as a setup process.

Next.js currently warns about React 18 deprecation; the verified build uses the pinned versions above. Direct Node test imports may emit a module-type warning.

## 🗺️ Next phase

Backend planning proposes PostgreSQL, authenticated server-side permissions, school-scoped data, versioned financial records, managed attachments and recovery procedures. Offline synchronization, hosting-region measurements and production security verification remain future work. See the [staged roadmap](docs/backend-planning/06-implementation-roadmap.md).

## 📄 License

No project license file has been supplied. This README does not assert MIT or other licensing terms for the project; dependency licenses are separate.
