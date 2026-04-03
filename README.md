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

- **Correctness over speed**: Transactional writes, ownership enforcement, and idempotent operations prevent data corruption

---

## Explicit Ethical Boundaries
- **Track behavior**: No analytics about how users interact with the system
- **Integrate external data**: No lab results, test scores, or third-party medical systems
- **Lock users in**: Users can always reset, delete, or export their account
## Recent Updates (2026)

- **Medication Intake Logging**: Log when medications are taken with timestamps and observations. MedicationIntakeLog model provides immutable per-schedule-per-day tracking. Supports status (TAKEN/MISSED) and optional notes.
- **Meal Logging & History**: Complete meal tracking system with quick-log UI, history view (last 7 days), and per-meal-type organization. Meal entries include type (Breakfast/Lunch/Dinner/Other), description, and timestamp. No nutritional calculations provided.
- **Meal Pattern Analysis**: Deterministic extraction of meal patterns including frequency counts, nutrient domain detection via ingredient keyword matching, meal type distribution, and diversity metrics. Used for awareness reporting.
- **Doctor Access System (Fully Implemented)**: 
  - Patients can view and manage doctor access requests
  - Doctors can request access to patient data via email
  - Patients approve/decline requests with explicit consent
  - Active access grants with revocation capability
  - Doctor portal to view consented patients and their medication/adherence logs
- **Medication and Lifestyle Awareness Report**: Non-clinical wellness insights based on medication, meal, and routine logs. Strict safety constraints: no medical advice, diagnosis, or treatment recommendations.
- **Navigation Improvements**: Dashboard and Insights pages link to Wellness Report; Doctor pages integrated in main navigation.
- **Bug Fixes**: Error handling for add/delete operations; frontend properly distinguishes redirect errors from real failures.
- **Linting & Build**: TypeScript and Tailwind CSS warnings resolved; build verified after all changes.


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
│  • Server actions validate input & enforce ownership    │
└─────────────────────────────────────────────────────────┘
              ↓ Validation & Business Logic ↓
┌─────────────────────────────────────────────────────────┐
│  • Validation schemas (email, name, frequency, etc.)    │
│  • Ownership checks before every mutation               │
│  • Transactional writes (Prisma $transaction)           │
│  • Idempotent operations (safe retries)                 │
└─────────────────────────────────────────────────────────┘
              ↓ ORM & SQL ↓
┌─────────────────────────────────────────────────────────┐

### Medication and Lifestyle Awareness Report Architecture

The wellness report generator uses deterministic, non-clinical analysis of medication, meal, and routine logs:

```
Medication/Meal Logs
  ↓
Feature Extraction (adherence, meal regularity, routine)
  ↓
Constrained AI Analysis (behavioral patterns only)
  ↓
Wellness Awareness Report (read-only, informational)
```

Safety constraints are enforced in code and prompt: no medical advice, diagnosis, or treatment recommendations. All suggestions are general awareness tips only.

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
## Key Features

### Medication Management
- **Add medications**: Create medications with optional condition reference
- **Manage schedules**: Add, edit, or delete individual time-slot entries per medication
- **Delete medications**: Cascading delete removes medication and all schedules
- **Log intake**: Record when medications are taken with timestamps and optional observations
- **View adherence**: See intake history and adherence patterns over time windows

**Schedule fields**: Time slot (Morning/Afternoon/Evening/Night), Frequency, Timing, optional Note

**Intake logging**: Status (TAKEN/MISSED), optional observation, automatically timestamped and dated

### Meal Logging
- **Quick log meals**: Log meals by type (Breakfast/Lunch/Dinner/Other) with description
- **View today's meals**: See meals organized by type with timestamps
- **Meal history**: View recent meals from last 7 days with full details
- **Edit/delete meals**: Update description or remove meal logs
- **Data sufficiency indicator**: System tracks whether enough data exists for pattern analysis

### Condition Tracking
- **Add diagnosed conditions**: Reference-only list with optional notes
- **Edit conditions**: Update name and notes
- **Delete conditions**: Remove from list
- **Link to medications**: Optionally associate medications with conditions
- **No medical interpretation**: Conditions are labels only; system provides no analysis

### Doctor/Healthcare Provider Access
- **Request patient monitoring** (Doctor side):
  - Search for patients by email
  - Send access requests to patient accounts
  - View pending request status
  - Access consented patient data
  - View patient medications, schedules, and adherence logs

- **Manage doctor access** (Patient side):
  - View pending doctor access requests
  - Approve or decline requests with explicit consent
  - View list of doctors with active access
  - Revoke doctor access at any time
  - Doctor can only see data after consent is granted or reinstated

**Safety**: All doctor access requires explicit patient consent; access can be revoked immediately; no automatic sharing

### Account Management
- **Settings page**: 
  - Read-only account information (User ID, creation date)
  - **Add medication** and **Log meal** quick links
  - **Reset onboarding**: Wipe all data and return to initial setup
  - **Delete account**: Permanent deletion of account and all data
  - **Logout**: Sign out from current session

- **Role Management**:
  - Patient role (default): Full medication and meal tracking
  - Doctor role (optional): Request access to patient data and view consented patients
  - Single account can have both roles; accessed via different navigation paths

### Authentication
- **Credentials provider** (NextAuth.js)
- **Demo credentials**: `kiruthickkannaa@gmail.com` / `mkk@9116`
- **Session-based auth**: Server-side sessions via NextAuth
- **Stable user mapping**: Repeated logins resolve to the same user

---

## AI-Assisted Pattern Analysis

MedicaLog includes **AI pattern analysis as a core feature**—but with explicit ethical boundaries.

### How AI is Used

The system continuously analyzes medication intake and meal patterns after every relevant data change:

1. **Event-driven analysis**: Whenever the user logs an intake, updates a schedule, logs a meal, or adds observations, the system triggers AI analysis
2. **Structured input**: AI receives deterministically extracted features:
   - **Medication patterns**:
     - Intake timing (morning/afternoon/evening/night)
     - Intake regularity (how often logged vs. scheduled)
     - Temporal patterns (adherence over 7-day windows)
     - User observations (if provided: dietary notes, energy, mood)
   - **Meal patterns**:
     - Meal type frequencies (breakfast, lunch, dinner, other)
     - Nutrient domain detection via ingredient keyword matching
     - Meal timing and regularity
     - Dietary diversity metrics
3. **Constrained AI output**: AI generates a **"Awareness Snapshot"** containing:
   - **Medication Intake Patterns**: Neutral observations about timing and frequency
   - **Adherence Signals**: Low or moderate signals (no high-urgency alerts)
   - **Observation Associations**: Temporal correlations between user notes and intake events
   - **Meal Awareness**: Frequency and diversity insights without nutritional claims
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
- ❌ **No nutritional calculations**: Meal logging is for awareness only; no calorie counts, macros, or dietary guidance
- ❌ **No third-party integrations**: No syncing with health services, wearables, or external APIs
- ❌ **No dark patterns**: No notifications, push alerts, or engagement hooks
- ❌ **No soft deletes**: Deletions are permanent; no recovery or undo after confirmation
- ❌ **No preferences or themes**: No customization UI; system is intentionally minimal
- ❌ **No automatic doctor assignment**: Doctors cannot access patient data without explicit request and patient consent

These omissions are **intentional design choices**, not roadmap items.

---

## Engineering Highlights

### AI-Assisted Pattern Analysis Architecture

MedicaLog's AI system follows a **constrained, explainable pipeline**:

```
Medication Intake Logs (Immutable)        Meal Logs (Immutable)
         ↓                                        ↓
Deterministic Feature Extraction          Meal Pattern Extraction
(Metrics: timing, frequency, adherence)   (Frequencies, domains, diversity)
         ↓                                        ↓
         └─────────────────→ Merge ←─────────────┘
                            ↓
         Constrained AI Analysis
    (Pattern recognition within extracted metrics)
                            ↓
         Awareness Snapshot Storage
      (Persistent, cacheable analysis results)
                            ↓
       Read-Only UI Rendering
   (Dashboard & Insights pages display awareness)
```

**Medication Feature Extraction**:
- Intake timing distribution (morning/afternoon/evening/night)
- Adherence rate (logs vs. scheduled frequency)
- Temporal pattern analysis (7-day windows)
- User observation associations

**Meal Feature Extraction**:
- Meal type frequencies
- Nutrient domain detection (protein, vegetables, grains, etc.)
- Ingredient keyword matching (deterministic, no hallucination)
- Dietary diversity metrics (unique domains detected)

This design ensures:
- **Traceability**: Every insight traces back to specific intake or meal data
- **Explainability**: AI receives only structured, deterministic input—no raw data or speculation
- **Safety**: Output is constrained to low/moderate signals; no medical claims or nutritional recommendations
- **Auditability**: Snapshots are versioned and persistent, allowing review of analysis over time

### Why Constrained AI for Healthcare

Healthcare applications require extraordinary care. MedicaLog's AI design prioritizes:

1. **Avoiding unsafe medical claims**: AI output is framed as patterns and associations, not diagnoses. This prevents users from making unsafe decisions based on algorithmic "insights."
2. **Ensuring explainability**: Every pattern analysis is grounded in specific, visible user data and rules—no black-box predictions.
3. **Maintaining user trust**: Transparent boundaries (what AI does and explicitly does not do) build confidence that the system will not make unexpected claims.
4. **Preventing hallucination**: AI input is deterministic and constrained; it cannot invent relationships or speculate beyond the data.
5. **Supporting long-term monitoring**: Persistent awareness snapshots allow users and healthcare providers to understand patterns over weeks and months.
6. **Meal awareness without nutrition claims**: Meal analysis detects patterns but explicitly avoids dietary recommendations or nutritional interpretations.

This architecture is deliberate, not a limitation. It trades off raw predictive power for trustworthiness and safety—which is the right trade-off for healthcare.

---

## Nutrition & Ingredient Mapping (Meal Awareness)

Meal logging includes **deterministic ingredient keyword matching** to extract nutrient domain frequencies without making nutritional claims.

### How It Works

1. **Keyword Extraction**: Meal descriptions are parsed for ingredient keywords (e.g., "apple", "spinach", "salmon")
2. **Domain Mapping**: Keywords are mapped to nutrient domains (Fruits, Vegetables, Proteins, Grains, Dairy, Fats)
3. **Frequency Aggregation**: Domains are counted across logs to show patterns over time
4. **Diversity Metrics**: System tracks unique domains detected and calculates dietary variety insights
5. **No Recommendations**: Results show what was logged, not what users should eat

### Extracted Metrics

**Nutrient Domain Frequencies**:
- Fruits: Count of logs mentioning fruit keywords
- Vegetables: Count of logs mentioning vegetable keywords
- Proteins: Count of logs mentioning protein keywords
- Grains: Count of logs mentioning grain keywords
- Dairy: Count of logs mentioning dairy keywords
- Fats: Count of logs with fat/oil ingredients

**Meal Pattern Metrics**:
- Daily meal counts (breakfast, lunch, dinner, other timing)
- Meal type frequencies over time windows
- Dietary diversity (unique domains detected per week/month)
- Ingredient keyword detection (what foods mentioned in descriptions)

### Safety Constraints

- ❌ **No nutritional recommendations**: System shows what was logged, not what should be eaten
- ❌ **No deficiency diagnosis**: Absence of a domain does not indicate a nutritional deficiency
- ❌ **No calorie or macro calculations**: No nutrition facts or portion guidance
- ❌ **No medical interpretation**: Meal patterns are informational only; healthcare professionals must interpret
- ❌ **No dietary guidance**: No suggestions for balanced meals, food combinations, or health benefits

**Appropriate Use**: Personal awareness of meal frequency and ingredient diversity for discussion with healthcare providers.

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
| **Database** | SQLite with async migrations |
| **Authentication** | NextAuth.js 5 (Credentials provider + session-based) |
| **Form Handling** | React Server Actions + `useFormStatus()` |
| **Styling** | Tailwind CSS (black, white, gray only) |
| **Validation** | Custom schemas (no external validators) |
| **AI Integration** | Constrained LLM analysis with deterministic feature extraction |
| **Pattern Analysis** | Deterministic meal pattern extraction + nutrient domain mapping |

---

## Project Status

✅ **Fully functional**

### Completed Phases
- Phase 1–3: Core onboarding, medication CRUD, persistence
- Phase 4–7: Schedule & condition management, deletions, account control
- Phase 8: Settings page with reset and delete flows
- Phase 9: Action feedback, empty states, UX hardening
- Phase 10: Medication intake logging (TAKEN/MISSED status, observations)
- Phase 11: Meal logging with history and meal pattern analysis
- Phase 12: AI awareness snapshots with meal and medication pattern integration
- Phase 13: Doctor access system with request/approval/revocation flows
- Phase 14: Doctor portal with patient view and adherence logs

### What Works
- User authentication and session management with role support (patient, doctor, or both)
- Full medication and schedule lifecycle (create, read, update, delete)
- Medication intake logging with timestamps and observations
- Meal logging with categorization and full CRUD
- Meal history view with pattern analysis foundation
- Condition tracking and management
- AI-assisted awareness snapshots (medication and meal pattern analysis)
- Doctor access request workflow (request → pending → approve/decline → revoke)
- Doctor portal with patient list and adherence monitoring
- Account reset and deletion
- All routes compile and render without errors
- Dev server runs with no runtime warnings

### Known Scope
- Patient-doctor data sharing via explicit consent (not multi-user collaboration)
- SQLite database (suitable for small deployments; upgrade to PostgreSQL for scaling)
- No mobile app (web-responsive but not mobile-optimized)
- No offline mode
- No nutritional or dietary recommendations (meal logging is awareness-only)
- Doctor access does not include full patient account control (read-only data access)

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
│   ├── meals/                        # Meal logging + history + delete
│   ├── conditions/                   # Condition management
│   ├── doctor/                       # Doctor portal (patients, requests, patient detail)
│   ├── patient/                      # Patient-specific routes (doctor-access, meal-logs)
│   ├── settings/                     # Account control (reset, delete)
│   ├── dashboard/                    # Patient overview + links
│   ├── insights/                     # AI awareness + wellness report
│   ├── wellness-report/              # AI wellness insights (non-clinical)
│   ├── onboarding/                   # Initial setup flow
│   ├── login/                        # Authentication forms
│   ├── api/                          # API routes (auth, etc.)
│   ├── layout.tsx                    # Root layout + navigation
│   ├── page.tsx                      # Home/landing
│   ├── error.tsx                     # Error boundary
│   ├── globals.css                   # Global styles
│   └── mock-awareness-report/        # Mock AI report data
├── lib/
│   ├── actions/                      # Server actions (medications, meals, auth, doctor, patient-access)
│   ├── data/                         # Persistence layer (Prisma operations)
│   ├── server/                       # Server-only auth helpers + session management
│   ├── validation/                   # Input validation schemas
│   ├── errors/                       # Custom error types
│   ├── analysis/                     # Pattern extraction (meal patterns, adherence)
│   ├── ai/                           # AI integration + prompt engineering
│   ├── nutrition/                    # Ingredient mapping + nutrient domains
│   ├── reports/                      # Awareness snapshot generation
│   ├── logic/                        # Business logic (date windows, calculations)
│   ├── medication/                   # Medication-specific utilities
│   ├── dev/                          # Development utilities
│   ├── dayWindow.ts                  # Date window calculations
│   ├── sampleData.ts                 # Mock data for UI demos
│   ├── mockDoctors.ts                # Mock doctor identities
│   └── asserts.ts                    # Assertion utilities
├── components/
│   ├── client/                       # Client components (forms, modals)
│   ├── server/                       # Server components (data fetching)
│   └── ui/                           # Shared UI components
└── prisma/
    ├── schema.prisma                 # Database schema (User, Medication, Meal, Doctor, etc.)
    └── migrations/                   # Database migration history
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
