# MedicaLog

**Structured medication and condition tracking with transparent data control.**

![Next.js](https://img.shields.io/badge/Next.js-16-black?style=flat)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=flat)
![Server%20First](https://img.shields.io/badge/Architecture-Server%20First-222?style=flat)
![Status](https://img.shields.io/badge/Status-Functional-success?style=flat)

---

## Problem Statement

Existing health and medication tracking applications often:
- Collect unnecessary data and obscure how it is used
- Overwhelm users with recommendations and "insights" beyond their scope
- Provide no meaningful control: users cannot reset, correct, or fully delete their data
- Use client-heavy architectures that prioritize engagement metrics over correctness

These design choices erode trust and lock users into ecosystems they don't control.

---

## What This Project Solves

MedicaLog addresses these issues by providing:

- **Transparent data structure**: Users add and manage their own medications and conditions; the system stores them as-is without interpretation
- **Full user autonomy**: Edit any entry, delete individual items, reset all data, or permanently delete the account
- **Clear boundaries**: The system informs without recommending; it tracks without analyzing
- **Server-first reliability**: All business logic lives on the server; client code is minimal and isolated
- **Correctness over speed**: Transactional writes, ownership enforcement, and idempotent operations prevent data corruption

---

## Explicit Ethical Boundaries

This project **intentionally does not**:

- **Diagnose or recommend**: No algorithms suggest treatments or conditions
- **Analyze trends**: No charts, dashboards, or "insights" derived from user data
- **Track behavior**: No analytics about how users interact with the system
- **Predict or score**: No risk assessments, severity ratings, or health predictions
- **Integrate external data**: No lab results, test scores, or third-party medical systems
- **Lock users in**: Users can always reset, delete, or export their account

Medical interpretation remains with healthcare professionals. This system is an informational tool only.

---

## Architecture Overview

MedicaLog uses a **server-first architecture** where business logic, validation, and persistence live entirely on the server. Client boundaries are minimal and strictly isolated.

```
┌─────────────────────────────────────────────────────────┐
│                    Browser / Client                      │
├─────────────────────────────────────────────────────────┤
│  Minimal "use client" Boundaries:                        │
│  • Forms (LoginForm, AddMedicationForm, etc.)           │
│  • useFormStatus() for pending state only               │
│  • NO auth state, NO data caching, NO mutations         │
└─────────────────────────────────────────────────────────┘
              ↓ Server Actions & Fetch ↓
┌─────────────────────────────────────────────────────────┐
│                  Next.js App Router                      │
├─────────────────────────────────────────────────────────┤
│  Server Pages & Components:                             │
│  • Route handlers process all requests                  │
│  • Pages fetch and render at build/request time         │
│  • Server actions validate input & enforce ownership    │
└─────────────────────────────────────────────────────────┘
              ↓ Validation & Business Logic ↓
┌─────────────────────────────────────────────────────────┐
│              Data Access & Persistence                   │
├─────────────────────────────────────────────────────────┤
│  • Validation schemas (email, name, frequency, etc.)    │
│  • Ownership checks before every mutation               │
│  • Transactional writes (Prisma $transaction)           │
│  • Idempotent operations (safe retries)                 │
└─────────────────────────────────────────────────────────┘
              ↓ ORM & SQL ↓
┌─────────────────────────────────────────────────────────┐
│                 Prisma + SQLite                          │
├─────────────────────────────────────────────────────────┤
│  • Minimal schema: User, Medication, Condition, etc.    │
│  • Cascade deletes for data integrity                   │
│  • Indexes on frequently queried fields                 │
└─────────────────────────────────────────────────────────┘
```

### Key Design Principles

| Principle | Implementation |
|-----------|----------------|
| **Correctness** | All writes are transactional; ownership enforced before every mutation |
| **Reliability** | No client-side auth state; sessions managed by NextAuth only |
| **Performance** | Server-rendered pages + Turbopack compilation = fast TTI |
| **Clarity** | All data flows through server actions; no hidden HTTP calls |
| **User Control** | Reset data, delete account, edit/remove any entry at any time |

---

## Key Features

### Dashboard & Overview
- **Dashboard**: High-level view of current medications and conditions
- **Insights**: Read-only, informational awareness (no trends or predictions)

### Medication Management
- **Add medications**: Create entries with name validation
- **View medications**: See all tracked medications with schedule count
- **Edit medications**: Update medication names
- **Manage schedules**: Add, edit, or delete individual time-slot entries per medication
- **Delete medications**: Cascading delete removes medication and all schedules

**Schedule fields**: Time slot (Morning/Afternoon/Evening/Night), Frequency, Timing, optional Note

### Condition Tracking
- **Add diagnosed conditions**: Reference-only list with optional notes
- **Edit conditions**: Update name and notes
- **Delete conditions**: Remove from list
- **No medical interpretation**: Conditions are labels only; system provides no analysis

### Account Management
- **Settings page**: 
  - Read-only account information (User ID, creation date)
  - **Add medication** quick link
  - **Reset onboarding**: Wipe all data and return to initial setup
  - **Delete account**: Permanent deletion of account and all data
  - **Logout**: Sign out from current session

### Authentication
- **Credentials provider** (NextAuth.js)
- **Demo credentials**: `kiruthickkannaa@gmail.com` / `mkk@9116`
- **Session-based auth**: Server-side sessions via NextAuth
- **Stable user mapping**: Repeated logins resolve to the same user

---

## What the Project Deliberately Avoids

To maintain ethical clarity and architectural simplicity:

- ❌ **No analytics or metrics**: No tracking of user behavior, feature usage, or engagement
- ❌ **No AI or machine learning**: No trend prediction, anomaly detection, or pattern matching
- ❌ **No recommendations**: No suggestions about medications, conditions, or health decisions
- ❌ **No third-party integrations**: No syncing with health services, wearables, or external APIs
- ❌ **No dark patterns**: No notifications, push alerts, or engagement hooks
- ❌ **No soft deletes**: Deletions are permanent; no recovery or undo after confirmation
- ❌ **No preferences or themes**: No customization UI; system is intentionally minimal

These omissions are **intentional design choices**, not roadmap items.

---

## Engineering Highlights

### Server-First Architecture
- **All business logic on the server**: Validation, ownership checks, persistence
- **Minimal client code**: Forms only; no state management, no data fetching
- **Clear separation of concerns**: Server actions handle mutations; pages handle rendering

### Data Integrity
- **Transactional writes**: Medication deletion includes cascade delete of schedules
- **Ownership enforcement**: Every mutation checks `medication.userId === user.id`
- **Idempotent operations**: Retries are safe; duplicate inserts are avoided

### Developer Experience
- **Turbopack compiler**: Fast build times even as codebase grows
- **Type safety**: Full TypeScript with strict null checks
- **Clear error messages**: Validation errors are user-friendly, not technical
- **Test-friendly**: Server actions can be tested independently

### Performance
- **Server-rendered pages**: No client-side hydration overhead
- **Minimal JavaScript**: ~30KB gzipped for interactive features
- **Database indexes**: Queries are optimized for common access patterns
- **No client-side caching**: Each request is fresh; state is always current

### User Experience
- **Action feedback**: Every mutation displays a calm confirmation banner
- **Empty states**: Intentional messaging when no data exists
- **Accessible forms**: Proper labels, error alerts, ARIA attributes
- **No animations**: System is calm and straightforward

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Framework** | Next.js 16.1.1 (App Router, Turbopack) |
| **Language** | TypeScript 5 |
| **ORM** | Prisma 5 |
| **Database** | SQLite |
| **Authentication** | NextAuth.js 5 |
| **Form Handling** | React Server Actions + `useFormStatus()` |
| **Styling** | Tailwind CSS (black, white, gray only) |
| **Validation** | Custom schemas (no external validators) |

---

## Project Status

✅ **Fully functional**

### Completed Phases
- Phase 1–3: Core onboarding, medication CRUD, persistence
- Phase 4–7: Schedule & condition management, deletions, account control
- Phase 8: Settings page with reset and delete flows
- Phase 9: Action feedback, empty states, UX hardening

### What Works
- User authentication and session management
- Full medication and schedule lifecycle (create, read, update, delete)
- Condition tracking and management
- Account reset and deletion
- All routes compile and render without errors
- Dev server runs with no runtime warnings

### Known Scope
- Single-user per session (no sharing or collaboration)
- SQLite database (suitable for small deployments; upgrade to PostgreSQL for scaling)
- No mobile app (web-responsive but not mobile-optimized)
- No offline mode

---

## Ethical & Medical Disclaimer

**MedicaLog is an informational tool only.** It is not a medical device and does not provide medical advice, diagnosis, treatment, or recommendations.

- **Not for clinical use**: This system is designed for personal awareness, not clinical decision-making
- **Always consult professionals**: Medication and condition management decisions should be made with healthcare providers
- **No liability claim**: Users accept full responsibility for their health decisions
- **Data privacy**: User data is stored locally in SQLite; no cloud backup or third-party access

This project is suitable for:
- Faculty review of architecture and engineering practices
- Portfolio demonstration of server-first design patterns
- Educational context for understanding ethical software design

---

## Why This Project Matters

Chronic care is personal and ongoing. Patients accumulate data over months and years—medications, dosages, side effects, conditions, responses. Existing apps often:

1. **Collect without purpose**: Apps gather data to train models or improve engagement, not to serve users
2. **Lock users in**: Deleting data is hard or impossible; users become trapped
3. **Confuse tools with advice**: Apps recommend without disclaiming their limitations

MedicaLog takes a different approach: **be transparent about what you are, own what you control, and let users own their data.**

This matters because:
- **Trust is earned through honesty**: Users deserve to know exactly what an app does
- **Control is a human right**: People should always be able to correct, reset, or leave
- **Architecture shapes ethics**: Server-first design prevents data abuse by default

This project demonstrates that ethical software can be as reliable, performant, and well-engineered as anything else.

---

## Development Setup

### Prerequisites
- Node.js 18+ / npm 9+
- SQLite 3

### Installation

```bash
git clone <repo-url>
cd MedicaLog
npm install
```

### Environment

Create a `.env.local` file:

```env
DATABASE_URL="file:./dev.db"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secure-random-string-here"
```

### Running Locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

**Demo credentials:**
- Email: `kiruthickkannaa@gmail.com`
- Password: `mkk@9116`

### Building for Production

```bash
npm run build
npm run start
```

---

## Project Structure

```
src/
├── app/                              # Next.js App Router pages
│   ├── medications/                  # Medication CRUD + schedules
│   ├── conditions/                   # Condition management
│   ├── settings/                     # Account control
│   ├── dashboard/                    # Overview
│   ├── onboarding/                   # Initial setup
│   └── ...
├── lib/
│   ├── actions/                      # Server actions (medications, conditions, auth, account)
│   ├── data/                         # Persistence layer (Prisma operations)
│   ├── server/                       # Server-only auth helpers
│   ├── validation/                   # Input validation schemas
│   └── errors/                       # Custom error types
├── components/
│   ├── client/                       # Client components (forms, modals)
│   └── ui/                           # Shared UI components
└── prisma/
    └── schema.prisma                 # Database schema
```

---

## License

This project is provided as-is for educational, review, and portfolio purposes.

---

## Contact & Questions

For questions about architecture, design decisions, or ethical framing, see the project documentation or open an issue.


Validation
----------

Input validation utilities are in `src/lib/validation/` and are used by server actions and persistence layer. They are pure TypeScript validators with explicit error results.

Persistence (Prisma)
--------------------

- Schema: `prisma/schema.prisma`
- Local DB (development): `prisma/dev.db` (configured via `DATABASE_URL`)

Run migrations (development)
```
export DATABASE_URL="file:./prisma/dev.db"
npx prisma migrate dev
npx prisma generate
```

Notes and constraints
---------------------
- The app is informational only — it does not provide medical advice or recommendations.
- Server-first design: avoid adding client components unless necessary.
- No authentication UI hooks (no `useSession`) are used on the client; session handling is server-side.

Contributing
------------

Please open issues or PRs. Small, focused commits are preferred. If you make schema changes, include corresponding migrations and regenerate the Prisma client.

License
-------

MIT
