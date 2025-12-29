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
- **Dashboard**: High-level view of current medications and conditions; displays AI awareness signal count
- **Insights & Awareness**: Detailed read-only view of AI-generated pattern analysis
  - Medication intake patterns and timing observations
  - Adherence signals (low/moderate severity)
  - Temporal associations between user observations and intake
  - Data sufficiency indicator (whether enough data exists for analysis)

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

## AI-Assisted Pattern Analysis

MedicaLog includes **AI pattern analysis as a core feature**—but with explicit ethical boundaries.

### How AI is Used

The system continuously analyzes medication intake after every relevant data change:

1. **Event-driven analysis**: Whenever the user logs an intake, updates a schedule, or adds observations, the system triggers AI analysis
2. **Structured input**: AI receives deterministically extracted features:
   - Medication intake timing (morning/afternoon/evening/night)
   - Intake regularity (how often logged vs. scheduled)
   - Temporal patterns (adherence over 7-day windows)
   - User observations (if provided: dietary notes, energy, mood)
3. **Constrained AI output**: AI generates a **"Awareness Snapshot"** containing:
   - **Medication Intake Patterns**: Neutral observations about timing and frequency
   - **Adherence Signals**: Low or moderate signals (no high-urgency alerts)
   - **Observation Associations**: Temporal correlations between user notes and intake events
4. **Persistent storage**: Snapshots are cached for quick retrieval; AI analysis runs once per analysis window (7-day default)
5. **Read-only rendering**: The Dashboard and Insights pages display awareness without edits, recommendations, or actionable alerts

### Why This Design

AI in healthcare must be trustworthy. MedicaLog avoids:
- **Hallucinations**: AI input is deterministic, not speculative
- **Unsafe medical claims**: AI output is framed as patterns, not diagnoses
- **Hidden decision-making**: Every AI analysis is visible and explainable
- **Urgency or alarm**: Signals are low/moderate only; no high-urgency flags
- **Behavioral manipulation**: No notifications or dark patterns

This design ensures AI remains a tool for **awareness**, not decision-making or behavioral control.

---

## Ethical and Safety Boundaries of AI

MedicaLog's AI explicitly **does not**:

- ❌ **Diagnose or recommend**: AI identifies patterns; diagnosis and recommendations require healthcare professionals
- ❌ **Generate clinical guidance**: No treatment suggestions, dosage advice, or medical instructions
- ❌ **Issue alerts or urgency**: No high-severity flags, emergency notifications, or time-critical warnings
- ❌ **Predict or score**: No risk assessments, health predictions, or severity ratings
- ❌ **Replace professional judgment**: AI is informational only; health decisions remain with qualified providers
- ❌ **Hallucinate or invent**: AI analysis is constrained to extracted features and explicit temporal relationships

Medical interpretation and clinical decision-making remain exclusively with healthcare professionals. The system is an informational tool only.

---

## What the Project Deliberately Avoids

To maintain ethical clarity and architectural simplicity:

- ❌ **No user behavior analytics**: No tracking of feature usage, engagement, or interaction patterns
- ❌ **No recommendations**: No health suggestions (these remain AI-free and professional-only)
- ❌ **No third-party integrations**: No syncing with health services, wearables, or external APIs
- ❌ **No dark patterns**: No notifications, push alerts, or engagement hooks
- ❌ **No soft deletes**: Deletions are permanent; no recovery or undo after confirmation
- ❌ **No preferences or themes**: No customization UI; system is intentionally minimal

These omissions are **intentional design choices**, not roadmap items.

---

## Engineering Highlights

### AI-Assisted Pattern Analysis Architecture

MedicaLog's AI system follows a **constrained, explainable pipeline**:

```
Intake Logs (Immutable)
         ↓
Deterministic Feature Extraction (Metrics: timing, frequency, adherence)
         ↓
Constrained AI Analysis (Pattern recognition within extracted metrics)
         ↓
Awareness Snapshot Storage (Persistent, cacheable analysis results)
         ↓
Read-Only UI Rendering (Dashboard & Insights pages display awareness)
```

This design ensures:
- **Traceability**: Every insight can be traced back to specific intake data
- **Explainability**: AI receives only structured, deterministic input—no raw data or speculation
- **Safety**: Output is constrained to low/moderate signals; no medical claims or urgency
- **Auditability**: Snapshots are versioned and persistent, allowing review of analysis over time

### Why Constrained AI for Healthcare

Healthcare applications require extraordinary care. MedicaLog's AI design prioritizes:

1. **Avoiding unsafe medical claims**: AI output is framed as patterns and associations, not diagnoses. This prevents users from making unsafe decisions based on algorithmic "insights."
2. **Ensuring explainability**: Every pattern analysis is grounded in specific, visible user data and rules—no black-box predictions.
3. **Maintaining user trust**: Transparent boundaries (what AI does and explicitly does not do) build confidence that the system will not make unexpected claims.
4. **Preventing hallucination**: AI input is deterministic and constrained; it cannot invent relationships or speculate beyond the data.
5. **Supporting long-term monitoring**: Persistent awareness snapshots allow users and healthcare providers to understand patterns over weeks and months.

This architecture is deliberate, not a limitation. It trades off raw predictive power for trustworthiness and safety—which is the right trade-off for healthcare.

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

### Important Limitations

- **Not a medical system**: This system is designed for personal awareness and data organization, not clinical decision-making
- **Informational AI analysis**: AI-generated insights reflect patterns only; they are not diagnoses or clinical judgments
- **Always consult professionals**: Medication and condition management decisions must be made with qualified healthcare providers
- **No liability assumption**: Users accept full responsibility for their health decisions and outcomes
- **Data privacy**: User data is stored locally in SQLite; no cloud backup or third-party access

### AI-Specific Disclaimers

- AI analysis is for **awareness only** and should not be used for clinical decisions
- AI findings represent pattern associations, not causal relationships or medical explanations
- Low/moderate signals from AI indicate temporal patterns, not urgency or risk levels
- Healthcare professionals must validate any insights before they inform clinical decisions

### Appropriate Use Cases

This project is suitable for:
- Personal medication and condition tracking
- Discussion preparation for healthcare appointments (data organization)
- Faculty review of architecture and ethical AI design
- Portfolio demonstration of server-first patterns and responsible AI integration
- Educational context for understanding transparent, constrained AI systems

This project is **not** suitable for:
- Standalone medical decision-making
- Clinical environments without professional oversight
- Replacing consultation with healthcare providers
- Real-time patient monitoring or alerts

---

## Why This Project Matters

Chronic care is personal and ongoing. Patients accumulate data over months and years—medications, dosages, observations, patterns. Existing apps often:

1. **Collect without purpose**: Apps gather data to train models or improve engagement, not to serve users
2. **Lock users in**: Deleting data is hard or impossible; users become trapped
3. **Use AI recklessly**: Apps make medical claims or issue alerts without proper constraints or professional oversight
4. **Confuse tools with advice**: Apps recommend without disclaiming their limitations

MedicaLog takes a different approach: **be transparent about what you are, own what you control, include responsible AI, and let users own their data.**

### AI and Trust

Integrating AI into healthcare is high-risk. MedicaLog demonstrates that AI can be:
- **Trustworthy**: Constrained analysis + explicit boundaries = no hidden claims
- **Explainable**: Every insight traces back to specific user data and documented rules
- **Accountable**: Analysis is persistent and auditable; users and professionals can review findings
- **Safe**: Deterministic features and low/moderate signals prevent reckless medical claims

This matters because:
- **Trust is earned through honesty**: Users deserve to know exactly what an app and its AI do
- **AI transparency prevents harm**: Explicit boundaries prevent users from making unsafe decisions
- **Control is a human right**: People should always be able to correct, reset, or leave
- **Architecture shapes ethics**: Server-first + constrained AI design prevents abuse by default

This project demonstrates that responsible AI and ethical software engineering are not nice-to-haves—they are essential.

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
