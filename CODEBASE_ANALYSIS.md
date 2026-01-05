# MEDICALOG CODEBASE ANALYSIS
## Factual Inventory of Implemented Features

**Analysis Date**: January 4, 2026  
**Codebase State**: Functional core with deferred doctor features  
**Database**: SQLite (Prisma ORM)  

---

## SECTION A — IMPLEMENTED FEATURES

### A.1 Authentication & Authorization

#### Feature: Credentials-Based Login
- **Who**: Patient / Public user (unauthenticated)
- **Where**: Frontend (LoginForm component) + Backend (server action `loginAction`)
- **Trigger**: User submits email + password form
- **Input Data Read**: 
  - Email (validated: non-empty, max 320 chars)
  - Password (validated: non-empty, 8-255 chars)
- **Data Written**: 
  - NextAuth session created (stored in Session table via Prisma adapter)
  - User record created on first login (if not exists)
  - Account record created for tracking provider/providerAccountId
- **Current Limitations**:
  - Demo mode: hard-coded credentials (`kiruthickkannaa@gmail.com`/`mkk@9116` or `demo@mock.local`/`demo1234`)
  - No multi-factor authentication
  - No OAuth integration (scaffold only)
  - JWT sessions in dev, database sessions in production
  - No rate limiting on login attempts
  - No "forgot password" flow
  - Credentials provider is singular (no multiple auth methods)

#### Feature: Session Management
- **Who**: Authenticated users
- **Where**: Backend only (`getCurrentUser`, `requireUser` in `src/lib/server/auth/index.ts`)
- **Trigger**: On every request requiring authentication
- **Data Read**: 
  - NextAuth session (via `getServerSession`)
  - User record from database
- **Data Written**: None (sessions already created by login)
- **Current Limitations**:
  - No explicit session timeout/refresh logic
  - No concurrent session limits
  - No device tracking

#### Feature: Logout
- **Who**: Authenticated users
- **Where**: Frontend button → Backend server action `logoutAction`
- **Trigger**: User clicks logout button
- **Data Read**: Cookies (session token)
- **Data Written**: Session invalidation via NextAuth signout endpoint
- **Current Limitations**:
  - Post-logout redirect is hardcoded to "/"
  - No session deletion confirmation

#### Feature: Server-Side Access Control
- **Who**: Authenticated users (via route guards)
- **Where**: Backend (all server components use `requireUser()`)
- **Trigger**: Access to protected route (e.g., `/dashboard`, `/medications`)
- **Data Read**: Current user identity from session
- **Data Written**: None (guard only)
- **Current Limitations**:
  - No granular permissions (all auth'd users access all routes except doctor routes)
  - No role-based access control (only Patient vs. Doctor distinction, not enforced)
  - No audit logging of access attempts

---

### A.2 Medication Management

#### Feature: Add Medication
- **Who**: Authenticated patient
- **Where**: Frontend (`AddMedicationForm`) → Backend (`addMedicationAction`)
- **Trigger**: User submits "Add medication" form
- **Data Read**: User ID, medication name (validated)
- **Data Written**: 
  - `Medication` record (name, userId)
  - Triggers async `generateAwarenessSnapshot` (30-day window)
- **Current Limitations**:
  - Medication name only (no dosage, strength, form)
  - No NDC/RxNorm integration
  - No medication interactions checking
  - Medication must be added before schedules
  - No duplicate detection (same medication can be added twice)

#### Feature: Edit Medication Name
- **Who**: Authenticated patient (owner only)
- **Where**: Frontend (`EditMedicationForm`) → Backend (`editMedicationNameAction`)
- **Trigger**: User updates medication name and submits form
- **Data Read**: Medication ID, new name, user ID (ownership check)
- **Data Written**: 
  - `Medication.name` updated
  - Triggers async snapshot regeneration
- **Current Limitations**:
  - Only name can be edited (immutable: creation date, scheduling)
  - Ownership enforced but no audit trail
  - No soft delete (permanent change)

#### Feature: Delete Medication
- **Who**: Authenticated patient (owner only)
- **Where**: Frontend (confirmation form) → Backend (`deleteMedicationAction`)
- **Trigger**: User confirms deletion
- **Data Read**: Medication ID, user ID (ownership check)
- **Data Written**: 
  - `Medication` deleted
  - Cascade deletes: `MedicationSchedule` and `MedicationIntakeLog` (via Prisma cascade)
  - Cascade deletes: related `AwarenessSnapshot` entries
- **Current Limitations**:
  - Hard delete (no soft delete, no undo)
  - No retention period
  - Attachments to conditions are NOT deleted, leading to orphaned condition references

#### Feature: View Medication List
- **Who**: Authenticated patient
- **Where**: Frontend (`/medications` page)
- **Trigger**: User navigates to /medications
- **Data Read**: 
  - All `Medication` records for user
  - Count of `MedicationSchedule` per medication
- **Data Written**: None (read-only)
- **Current Limitations**:
  - No filtering by condition
  - No search functionality
  - No sorting options
  - No pagination (all medications loaded)

#### Feature: View Medication Details
- **Who**: Authenticated patient (owner only)
- **Where**: Frontend (`/medications/[medicationId]` page)
- **Trigger**: User clicks "View details" on a medication
- **Data Read**: 
  - `Medication` with schedules
  - `MedicationSchedule` details
  - Today's `MedicationIntakeLog` entries
  - Related `DiagnosedCondition` records
- **Data Written**: None (read-only)
- **Current Limitations**:
  - Only shows today's intake logs
  - No historical view
  - No adherence chart/visualization

---

### A.3 Medication Scheduling

#### Feature: Add Medication Schedule
- **Who**: Authenticated patient
- **Where**: Frontend (`AddScheduleForm`) → Backend (`addMedicationScheduleAction`)
- **Trigger**: User adds a time slot for a medication
- **Data Read**: 
  - Medication ID (ownership check via medication.userId)
  - TimeSlot (MORNING | AFTERNOON | EVENING | NIGHT)
  - Frequency (user-entered string, validated for non-empty)
  - Timing (user-entered string, validated for non-empty)
  - Optional note (max 500 chars)
- **Data Written**: 
  - `MedicationSchedule` record
  - Triggers async snapshot regeneration
- **Current Limitations**:
  - No time-of-day specification (only enum slots)
  - Frequency is free-text (not standardized: "once-daily", "twice-daily", "as-needed", etc.)
  - No interval/repeat logic (user responsible for semantics)
  - No dosage tracking
  - Multiple schedules per medication allowed (overlapping is user's responsibility)
  - Unique constraint: `(medicationId, timeSlot, frequency, timing)` – prevents exact duplicates only

#### Feature: Edit Medication Schedule
- **Who**: Authenticated patient (via medication ownership)
- **Where**: Frontend (`EditScheduleForm`) → Backend (`editMedicationScheduleAction`)
- **Trigger**: User updates schedule details and submits
- **Data Read**: 
  - Schedule ID
  - User ID (indirectly via medication)
  - Ownership validation (schedule.medication.userId === user.id)
- **Data Written**: 
  - `MedicationSchedule` fields updated (timeSlot, frequency, timing, note)
  - Triggers async snapshot regeneration
- **Current Limitations**:
  - Cannot change medicationId (immutable foreign key)
  - If frequency/timing/timeSlot conflict with another schedule, no validation prevents it

#### Feature: Delete Medication Schedule
- **Who**: Authenticated patient
- **Where**: Frontend (confirmation) → Backend (`deleteMedicationScheduleAction`)
- **Trigger**: User confirms schedule deletion
- **Data Read**: Schedule ID, user ID (ownership)
- **Data Written**: 
  - `MedicationSchedule` deleted
  - Cascade deletes: related `MedicationIntakeLog` entries
  - Triggers async snapshot regeneration
- **Current Limitations**:
  - Hard delete only
  - Logs are permanently deleted (no archive)

---

### A.4 Medication Intake Logging

#### Feature: Log Medication Intake
- **Who**: Authenticated patient
- **Where**: Frontend (`LogIntakeForm` or `QuickIntakeButton`) → Backend (`logMedicationIntakeAction`)
- **Trigger**: User indicates took/missed a medication
- **Data Read**: 
  - Schedule ID
  - Medication ID
  - Status (TAKEN | MISSED)
  - Optional observation (max 300 chars)
  - User ID (ownership check)
- **Data Written**: 
  - `MedicationIntakeLog` record (immutable per day)
  - Unique constraint: `(scheduleId, logDate)` – enforces one log per schedule per day
  - Triggers async snapshot regeneration
- **Current Limitations**:
  - One log per schedule per day (cannot update; must delete & recreate)
  - No actual time of intake captured (only scheduled time)
  - No refusal reason or miss reason tracking
  - Observation field is free-text (no predefined list)
  - No medication refill tracking
  - No pharmacy integration
  - Logs cannot be edited after creation (immutable by design)

#### Feature: View Intake History
- **Who**: Authenticated patient
- **Where**: Frontend (Dashboard, Medication Details, Insights pages)
- **Trigger**: Page render
- **Data Read**: 
  - `MedicationIntakeLog` for user (filtered by date range)
  - Aggregated: adherence rate (schedules with logs / total schedules)
  - Latest logs for quick schedules display
- **Data Written**: None (read-only)
- **Current Limitations**:
  - Dashboard shows only today's quick schedules
  - Insights page shows aggregated data (7-day window)
  - No custom date range picker
  - No export of logs (CSV, PDF)

---

### A.5 Condition Tracking

#### Feature: Add Diagnosed Condition (Onboarding)
- **Who**: Authenticated patient
- **Where**: Frontend (`OnboardingFlow`) → Backend (`onboardingSubmit` action)
- **Trigger**: User adds a condition during initial setup
- **Data Read**: 
  - Condition name (validated)
  - Optional note
- **Data Written**: 
  - `DiagnosedCondition` record
  - Triggers async snapshot regeneration
- **Current Limitations**:
  - Conditions optional during onboarding (at least 1 medication required)
  - No medical terminology validation (ICD-10, SNOMED, etc.)
  - Condition-to-medication relationship is optional and user-managed
  - No severity or onset date tracking
  - Cannot reorder conditions

#### Feature: Edit Diagnosed Condition
- **Who**: Authenticated patient (owner only)
- **Where**: Frontend (`EditConditionForm`) → Backend (`editConditionAction`)
- **Trigger**: User updates condition details
- **Data Read**: 
  - Condition ID
  - New name, optional note
  - User ID (ownership)
- **Data Written**: 
  - `DiagnosedCondition.name` and `note` updated
  - Triggers async snapshot regeneration
- **Current Limitations**:
  - Only name and note editable
  - No medical validation
  - No audit of changes

#### Feature: Delete Diagnosed Condition
- **Who**: Authenticated patient
- **Where**: Frontend (confirmation) → Backend (`deleteConditionAction`)
- **Trigger**: User confirms deletion
- **Data Read**: Condition ID, user ID
- **Data Written**: 
  - `DiagnosedCondition` deleted
  - Medications linked to the condition are NOT deleted (orphan references)
- **Current Limitations**:
  - Hard delete
  - No cascade cleanup of linked medications
  - Cannot restore

#### Feature: View Conditions List
- **Who**: Authenticated patient
- **Where**: Frontend (`/conditions` page)
- **Trigger**: User navigates to conditions page
- **Data Read**: All `DiagnosedCondition` records for user
- **Data Written**: None
- **Current Limitations**:
  - No filtering or search
  - No sorting
  - No pagination
  - Display notes alongside condition name

---

### A.6 Onboarding Flow

#### Feature: Structured Onboarding
- **Who**: New authenticated users (no existing medications/conditions)
- **Where**: Frontend (`OnboardingFlow` component) → Backend (`onboardingSubmit` action)
- **Trigger**: User navigates to `/onboarding` and has no prior data
- **Data Read**: 
  - Optional conditions array
  - Required medications array (min 1) with schedules
- **Data Written**: 
  - Multiple `DiagnosedCondition` records (transaction)
  - Multiple `Medication` + `MedicationSchedule` records (transaction)
  - User redirected to dashboard on success
- **Current Limitations**:
  - Non-repeatable: redirect to dashboard if user already has data
  - No step-back functionality in form
  - No progress persistence (loses data on refresh)
  - All-or-nothing: if medications fail validation, entire onboarding fails
  - No explanation of time slots (MORNING, AFTERNOON, EVENING, NIGHT)

---

### A.7 Dashboard & Summary

#### Feature: Dashboard Overview
- **Who**: Authenticated patient
- **Where**: Frontend (`/dashboard` page)
- **Trigger**: User navigates to dashboard (default landing page)
- **Data Read**: 
  - Awareness summary: total medications, conditions, schedules
  - Quick schedules: today's medication schedules with log status
  - Latest AI awareness snapshot (7-day window)
  - Adherence rate (calculated: schedules with logs / total schedules)
- **Data Written**: None (read-only)
- **Current Limitations**:
  - Only shows today's schedules
  - Adherence rate calculation is simplistic (does not weight by frequency or importance)
  - No quick-add medication button
  - No real-time updates (page must be refreshed)
  - Dashboard is not customizable

#### Feature: Awareness Summary
- **Who**: Authenticated patient
- **Where**: Backend (`getAwarenessSummary` persistence function)
- **Trigger**: Page render (dashboard, insights)
- **Data Read**: 
  - Total medications for user
  - Total conditions for user
  - Total schedules across all medications
- **Data Written**: None (computed)
- **Current Limitations**:
  - Does not distinguish active vs. inactive medications
  - Does not track schedule frequency variations

---

### A.8 Insights & Awareness Snapshots

#### Feature: AI-Generated Awareness Snapshots
- **Who**: Authenticated patient (read-only)
- **Where**: 
  - Triggered by: medication/condition/intake mutations (via `regenerateSnapshotAsync`)
  - Stored in: `AwarenessSnapshot` table
  - Displayed in: Insights page (`InsightsView` component)
- **Trigger**: 
  - Async regeneration on medication add/edit
  - Async regeneration on condition add/edit/delete
  - Async regeneration on intake log creation
  - Manual fetch for 7-day window (current)
- **Data Read**: 
  - All `Medication` + `MedicationSchedule` for user
  - All `MedicationIntakeLog` for user (30-day window)
  - Computed metrics: adherence, timing inconsistencies, observation clusters
- **Data Written**: 
  - New `AwarenessSnapshot` record (replaces old via unique constraint on userId + timeWindow)
  - JSON fields: `medicationPatterns`, `adherenceSignals`, `observationAssociations`
- **Current Limitations**:
  - Snapshot generation is async and can fail silently (errors are caught and ignored)
  - Only 7-day window exposed in UI (30-day generation is internal)
  - No manual refresh button
  - Requires minimum data sufficiency (≥3 logs per medication) to generate AI analysis
  - AI constraints: no medical advice, no diagnosis, no treatment recommendations (enforced in system prompt)
  - Requires OpenAI API key (can fail if missing or rate-limited)
  - Results are non-deterministic (LLM-based)

#### Feature: Insights Page
- **Who**: Authenticated patient
- **Where**: Frontend (`/insights` page, `InsightsView` component)
- **Trigger**: User navigates to Insights
- **Data Read**: 
  - Awareness summary
  - Latest 7-day awareness snapshot
  - Adherence rate flag ("On track" / "Needs attention")
- **Data Written**: None (read-only)
- **Current Limitations**:
  - Cannot select custom time window
  - Cannot regenerate snapshot manually
  - Shows parsed JSON in structured boxes (no rich visualization)
  - "Needs attention" flag shows if adherence < 80% (hard-coded threshold)

---

### A.9 Account Management

#### Feature: Reset User Data
- **Who**: Authenticated patient
- **Where**: Frontend (confirmation form) → Backend (`resetDataAction`)
- **Trigger**: User confirms data wipe
- **Data Read**: User ID
- **Data Written**: 
  - Delete all `Medication`, `MedicationSchedule`, `MedicationIntakeLog` for user
  - Delete all `DiagnosedCondition` for user
  - Delete all `AwarenessSnapshot` for user
  - User account record remains
  - User redirected to onboarding
- **Current Limitations**:
  - Hard delete (no undo)
  - No retention period
  - No confirmation email
  - User remains logged in after reset

#### Feature: Delete Account
- **Who**: Authenticated patient
- **Where**: Frontend (confirmation form) → Backend (`deleteAccountAction`)
- **Trigger**: User confirms permanent deletion
- **Data Read**: User ID
- **Data Written**: 
  - Delete entire `User` record
  - Cascade deletes all related data (medications, conditions, logs, snapshots)
  - Delete all `Session` records for user (via cascade)
  - Delete all `Account` records (auth provider links, via cascade)
  - User signed out
  - Redirected to login with `accountDeleted=1` param
- **Current Limitations**:
  - Hard delete (no undo, no data recovery)
  - No grace period
  - No deletion confirmation email
  - No data export before deletion

#### Feature: Settings Page
- **Who**: Authenticated patient
- **Where**: Frontend (`/settings` page)
- **Trigger**: User navigates to settings
- **Data Read**: 
  - User ID
  - User creation date
- **Data Written**: None (read-only; buttons link to delete/reset confirmation pages)
- **Current Limitations**:
  - No profile editing (name, email, preferences)
  - No password change
  - No notification preferences
  - No data export

---

### A.10 Doctor Access (SCAFFOLDED, NOT FULLY IMPLEMENTED)

#### Feature: Doctor Access Request (Patient Side)
- **Who**: Authenticated patient
- **Where**: Frontend (`/patient/doctor-access` page)
- **Trigger**: User navigates to page
- **Data Read**: NOT IMPLEMENTED (TODO comment in code)
- **Data Written**: NOT IMPLEMENTED (TODO comment in code)
- **Status**: UI renders empty state; backend functions are stubs returning `[]`
- **Current Limitations**:
  - `getPendingRequests()` – TODO
  - `getActiveAccessGrants()` – TODO
  - `allowMonitoring()` – TODO
  - `declineRequest()` – TODO
  - `revokeAccess()` – TODO
  - No database schema for access grants/requests
  - Components render but have no behavior

#### Feature: Doctor Dashboard (NOT IMPLEMENTED)
- **Who**: Doctor user
- **Where**: Frontend (`/doctor/page.tsx`)
- **Trigger**: User navigates to /doctor
- **Status**: Stub rendering only ("Doctor Monitoring Dashboard" heading)
- **Current Limitations**:
  - No doctor authentication flow
  - No role-based redirect (all users see patient dashboard)
  - No consented patients list
  - No access requests UI
  - No patient monitoring view

#### Feature: Doctor Patient List (SCAFFOLDED)
- **Who**: Doctor
- **Where**: Frontend (`/doctor/patients` page)
- **Trigger**: User navigates to /doctor/patients
- **Status**: UI rendered with TODO in data-fetch function
- **Current Limitations**:
  - `getConsentedPatients()` – returns empty array (TODO)
  - No database query implemented
  - Table structure defined but no data

#### Feature: Doctor Access Requests (SCAFFOLDED)
- **Who**: Doctor
- **Where**: Frontend (`/doctor/requests` page)
- **Trigger**: User navigates to /doctor/requests
- **Status**: UI with form + TODO in server action
- **Current Limitations**:
  - `getAccessRequests()` – returns empty array (TODO)
  - `requestAccess()` – no backend implementation (TODO: POST to backend endpoint)
  - Form renders but no submission handler
  - No patient search/lookup

#### Feature: Doctor View Patient Logs (SCAFFOLDED)
- **Who**: Doctor
- **Where**: Frontend (`/doctor/patients/[patientId]/page.tsx`)
- **Trigger**: User navigates to patient detail
- **Status**: UI with permission check function (returns true stub) and TODO
- **Current Limitations**:
  - `validateDoctorAccess()` – always returns `{ hasAccess: true }` (TODO: real validation)
  - `getMedicationAdherenceLogs()` – returns empty array (TODO)
  - No data displayed
  - No audit logging of doctor access

---

## SECTION B — IMPLEMENTED DASHBOARDS & ROLES

### B.1 User Roles

**Implemented Role: Patient**
- Default role for authenticated users
- All routes under `/medications`, `/conditions`, `/dashboard`, `/insights`, `/settings` accessible
- Can create, read, update, delete own data
- Can view own awareness snapshots
- Can reset/delete own account

**NOT Implemented Role: Doctor**
- Scaffold only (routes exist but non-functional)
- Routes: `/doctor`, `/doctor/patients`, `/doctor/requests`, `/doctor/patients/[patientId]`
- No permission enforcement
- No authentication differentiation
- No role-based routing

**NOT Implemented Role: Admin**
- No admin dashboard
- No system-level operations
- No user management

### B.2 Patient Dashboard Capabilities

| Feature | View | Edit | Delete | Trigger |
|---------|------|------|--------|---------|
| Medications | ✅ | ✅ (name only) | ✅ | Manual |
| Medication Schedules | ✅ | ✅ | ✅ | Manual |
| Intake Logs | ✅ (today) | ❌ | ❌ | Manual log only |
| Conditions | ✅ | ✅ | ✅ | Manual |
| Dashboard Summary | ✅ | ❌ | ❌ | Auto (page load) |
| Insights/Snapshots | ✅ | ❌ | ❌ | Auto (async generation) |
| Settings | ✅ | ❌ | ✅ (reset/delete) | Manual |
| Doctor Access | ✅ (stub) | ❌ | ❌ | N/A (not implemented) |

### B.3 Doctor Dashboard Capabilities (NOT IMPLEMENTED)

| Feature | View | Edit | Delete |
|---------|------|------|--------|
| Patient List | ❌ TODO | N/A | N/A |
| Access Requests | ❌ TODO | ❌ TODO | ❌ TODO |
| Patient Adherence Logs | ❌ TODO | N/A | N/A |
| Patient Medications | ❌ TODO | N/A | N/A |

---

## SECTION C — IMPLEMENTED AI / LOGIC

### C.1 Awareness Snapshot Generation

**Module**: `src/lib/ai/generateAwarenessSnapshot.ts`

**When It Runs**:
- Triggered asynchronously on every medication/condition/intake mutation
- Manual fetch for 7-day window on dashboard/insights page load
- Called via `regenerateSnapshotAsync(userId, "30d")`

**What It Reads**:
- `Medication` and `MedicationSchedule` records for user
- `MedicationIntakeLog` for user within time window (7d, 14d, 30d)
- Computed via `computeIntakeMetricsBundle()`:
  - Adherence rates per medication
  - Timing inconsistencies
  - Observation clusters (free-text fields parsed for keywords)

**What It Outputs**:
- `AwarenessSnapshot` record with JSON fields:
  - `medicationPatterns`: array of `{ type, medicationId, context, confidence }`
  - `adherenceSignals`: array of `{ signal, medicationId, severity }`
  - `observationAssociations`: array of `{ observation, temporalRelation, confidence }`
  - `dataSufficiency`: boolean (true if AI was run; false if insufficient data)

**AI Component** (`src/lib/ai/patternAnalysis.ts`):
- Uses OpenAI API (gpt-4, configurable)
- System prompt enforces constraints:
  - **MUST NOT** provide medical advice, diagnoses, recommendations
  - **MUST NOT** use imperative or urgency language
  - **MUST NOT** infer causation or suggest interventions
  - Must output valid JSON only
  - Must assign confidence levels based on data evidence
  - Returns empty arrays if data sparse or insufficient
- Input: derived metrics (no raw user text)
- Output: structured pattern objects (JSON)

**Data Sufficiency Thresholds**:
- Adherence: ≥3 logs per medication
- Timing: ≥5 logs per medication
- Observations: ≥5 logs with observations
- Overall: `coverage < 0.5` = minimal/insufficient (AI not run)

**Safe Failure**:
- Catches all errors and returns minimal snapshot (no throw)
- Silently logs errors (not displayed to user)
- If OpenAI API fails or is missing, snapshot marked `dataSufficiency: false`

### C.2 Adherence Calculation

**Module**: `src/lib/logic/awareness.ts`

**Logic**:
```
adherenceRate = (total schedules with logs / total medications) * 100
flag = adherenceRate >= 80 ? "On track" : "Needs attention"
```

**Current Limitations**:
- Does not weight by frequency (twice-daily same as once-daily)
- Does not weight by recency (old logs same as recent)
- Does not account for intentional non-compliance
- Treats MISSED logs as partial adherence (still counts as "logged")

### C.3 Intake Metrics Computation

**Module**: `src/lib/analysis/intakeMetrics.ts`

**Computed Metrics**:
- Per-medication adherence: logs with status TAKEN / total logs
- Timing consistency: deviation from canonical slot time
- Observation clustering: keywords extracted from observation field
- Missing dates: days without logs when expected
- Streak analysis: consecutive days of adherence/non-adherence

**No Medical Logic**:
- No drug interactions
- No contraindications
- No disease modeling
- No risk scoring

---

## SECTION D — IMPLEMENTED SAFETY & CONSTRAINTS

### D.1 Explicit Non-Goals (Enforced in Code)

**Not a Diagnostic Tool**:
- No disease modeling or prediction
- No risk assessments
- No automated triage or severity scoring
- Enforced: validation schemas do not accept medical input

**Not a Treatment Recommender**:
- No medication suggestions
- No dosage adjustments
- No treatment plans
- Enforced: AI system prompt forbids imperative language

**Not a Replacement for Medical Professionals**:
- Login page disclaimer: "For clinical questions, consult your healthcare professional."
- Insights page shows neutral awareness signals only (no actionable recommendations)
- Conditions page disclaimer: "Reference-only list. No medical interpretation or advice."

**Not a Data Collector**:
- Minimal user schema (no email, phone, address)
- No behavioral analytics
- No external integrations (no lab results, test scores, vital signs)
- No location tracking
- No device tracking

**Not a Lock-In System**:
- Users can reset all data at any time (returns to onboarding)
- Users can delete entire account permanently
- No data export implemented (but can be added without breaking changes)
- No subscription or licensing gate

### D.2 Ownership Enforcement

**Pattern**: Every mutation checks `record.userId === currentUser.id`

**Examples**:
- `editConditionAction`: checks condition ownership before update
- `logMedicationIntakeAction`: checks schedule → medication → user chain
- `deleteMedicationAction`: checks medication ownership before cascade delete

**Enforcement Points**:
- Server action layer (user-facing)
- Persistence layer (database operations)
- No client-side permission checks (server-first architecture)

**Current Limitations**:
- Ownership checks are string comparisons (no encryption)
- No audit trail of who accessed what
- No concurrent request rate limiting

### D.3 Data Validation

**Input Validation Schema** (`src/lib/validation/inputSchemas.ts`):
- Medication name: non-empty, max 255 chars
- Condition name: non-empty, max 255 chars
- Frequency: non-empty, max 100 chars (user-entered)
- Timing: non-empty, max 100 chars (user-entered)
- Note: non-empty, max 500 chars
- Email: RFC compliant format
- Password: 8-255 chars
- TimeSlot: enum validation (MORNING | AFTERNOON | EVENING | NIGHT)
- IntakeStatus: enum validation (TAKEN | MISSED)
- Observation: max 300 chars

**No Medical Validation**:
- No ICD-10 validation for conditions
- No NDC/RxNorm validation for medications
- No dosage unit validation
- No frequency semantics checking (accepts any string)

### D.4 Invariant Enforcement (Development vs. Production)

**Module**: `src/lib/asserts.ts`

**Development (`NODE_ENV !== 'production'`)**:
- Assertions throw errors on violation
- Database lookups verify foreign key relationships
- Loud failures to catch issues early

**Production**:
- Assertions log issues but don't throw
- No database queries for assertions (performance)
- Errors are swallowed to prevent user-facing crashes

**Invariants Checked**:
- User exists (on operations)
- Medication belongs to user
- Schedule belongs to medication
- Awareness data is valid (non-negative counts)

### D.5 Error Handling

**Error Types** (`src/lib/errors.ts`):
- `ValidationError`: input validation failed (safe to show user)
- `NotFoundError`: resource not found (safe)
- `DatabaseError`: DB operation failed (mapped to safe message)
- `ServiceError`: unexpected error (generic safe message)
- `AuthError`: unauthorized access (safe)

**All errors mapped to `ControlledError`**:
- `safeMessage`: user-facing message (no technical details)
- `code`: error classification (internal)
- `details`: full error info (logged server-side only, not exposed to UI)

**Global Error Boundary** (`src/app/error.tsx`):
- Catches unhandled server errors
- Renders generic message: "Something went wrong"
- Offers "Retry" button
- No stack trace exposed

### D.6 Immutability Constraints

**Immutable Records**:
- `MedicationIntakeLog`: once created, cannot be edited; can only delete & recreate
- Unique constraint: `(scheduleId, logDate)` prevents duplicate logs

**Append-Only Snapshots**:
- `AwarenessSnapshot`: replaces previous via unique `(userId, timeWindow)` constraint
- No direct edits to snapshot data

**Audit Trail**: 
- Not implemented (no change history)
- Created/Updated timestamps tracked (Prisma defaults)

---

## SECTION E — DEFERRED / STUBBED / COMMENTED FEATURES

### E.1 TODO Items (Code Comments)

**Patient Doctor Access** (`src/app/patient/doctor-access/page.tsx`):
```
- getPendingRequests() → TODO: Fetch pending doctor access requests from database
- getActiveAccessGrants() → TODO: Fetch active consent grants from database
- allowMonitoring() → TODO: Grant consent for this doctor access request
- declineRequest() → TODO: Decline this doctor access request
- revokeAccess() → TODO: Revoke doctor access
```

**Doctor Patients List** (`src/app/doctor/patients/page.tsx`):
```
- getConsentedPatients() → TODO: Fetch patients with active consent grants from database
```

**Doctor Requests** (`src/app/doctor/requests/page.tsx`):
```
- getAccessRequests() → TODO: Fetch access requests from database
- requestAccess() → TODO: POST to backend endpoint
```

**Doctor Patient Logs** (`src/app/doctor/patients/[patientId]/page.tsx`):
```
- validateDoctorAccess() → TODO: Validate doctor has active consent from patient
- getMedicationAdherenceLogs() → TODO: Fetch medication adherence logs from database
```

### E.2 Non-Functional Doctor Routes

**Routes Exist But Are Stubs**:
- `GET /doctor` → renders "Doctor Monitoring Dashboard" header only
- `GET /doctor/layout.tsx` → basic layout structure
- `GET /doctor/patients` → table structure, no data
- `GET /doctor/requests` → form structure, no submission handler
- `GET /doctor/patients/[patientId]` → permission check stub (always `hasAccess: true`)

**Why Not Implemented**:
- Doctor-patient authorization model not designed
- Access grant/consent request schema not created
- No API endpoints for doctor requests

### E.3 Incomplete Features

**Doctor Authentication**:
- No way to differentiate doctor vs. patient on login
- All users route to patient dashboard
- No doctor-specific auth callback

**Access Control Model**:
- No database schema for `DoctorAccessRequest` or `DoctorAccessGrant`
- No enum for access statuses (PENDING, APPROVED, REVOKED)
- No expiration logic

**Notification System**:
- NOT IMPLEMENTED (no notifications for access requests, medication reminders, etc.)

**Data Export**:
- NOT IMPLEMENTED (no CSV, JSON, or PDF export)

**Medication Refill Tracking**:
- NOT IMPLEMENTED (no refill dates, pharmacy integration)

**Medication Interactions**:
- NOT IMPLEMENTED (no interaction checker, no contraindication warnings)

**Lab/Vital Integration**:
- NOT IMPLEMENTED (no external data source integration)

**Push Notifications / Reminders**:
- NOT IMPLEMENTED (no mobile push, email reminders, SMS)

**Multi-Device Sync**:
- NOT IMPLEMENTED (sessions are device-local only)

**Rate Limiting**:
- NOT IMPLEMENTED (no API rate limiting, no login attempt limits)

**Two-Factor Authentication**:
- NOT IMPLEMENTED

**Password Reset**:
- NOT IMPLEMENTED (no "Forgot Password" flow)

**Email Verification**:
- NOT IMPLEMENTED (no email confirmation on signup)

### E.4 Feature Flags / Environment Configs

**Auth Provider Selection**:
- Credentials provider hardcoded in `authOptions`
- OAuth providers commented out (scaffold only)
- No feature flag to enable/disable providers

**Database Adapter**:
- Conditional Prisma adapter: used only in production
- Development uses JWT sessions without adapter
- Production uses database-backed sessions with adapter

**Assertion Behavior**:
- Conditional on `NODE_ENV`: development throws, production logs
- No feature flag to override

### E.5 Commented / Scaffolded Components

**Doctor Access Components**:
- `PendingRequestItem.tsx` – renders props but no behavior
- `ActiveAccessItem.tsx` – renders props but no behavior
- Both expect parent to handle actions (stubs in page)

**Unused Imports/Types**:
- `Link` imported in some pages but not all nav is link-based
- Some types defined in schema but unused in UI

### E.6 Placeholder Data & Mock Data

**Mock Users** (in `authOptions`):
- `demo@mock.local` / `demo1234` (development only)
- Hard-coded credentials (not secure for production)
- Used for quick testing without DB setup

**Seeders** (`scripts/seedMockUser.ts`, `scripts/verifyMockData.ts`):
- Can populate database with test medications/conditions
- Intended for dev/staging validation
- Not used in production

### E.7 Incomplete Migrations

**Migrations Created**:
1. `20251224115142_init` – initial schema
2. `20251225162919_init_chronic_care_schema` – medication tracking
3. `20251225174905_add_auth_infrastructure` – NextAuth tables
4. `20251225180346_remove_optional_user_fields` – User schema tightening

**NOT Yet Migrated**:
- Doctor access grant/request schema
- Access token/secret storage for doctor-patient relationships
- Audit log table (for tracking access, mutations)
- Notification preferences table
- Device/session tracking table

---

## SECTION F — ARCHITECTURAL CONSTRAINTS & DECISIONS

### F.1 Server-First Architecture Enforced

**All Business Logic Server-Side**:
- Validation happens in server actions, not client forms
- Ownership checks on server only
- Database queries on server only
- Auth state never exposed to client

**Client Boundaries Minimal**:
- Forms only (`LoginForm`, `AddMedicationForm`, etc.)
- Local state for UI interactions only (form state, pending)
- No data caching, no mutations without server action

**No Client-Side Routing Guards**:
- Protected routes enforced by `requireUser()` in server components
- Redirect happens server-side (307 HTTP redirect, no flicker)
- No client-side redirect logic

### F.2 Transactional Writes

**All Multi-Step Operations in Transactions**:
- `createUserWithInitialData()` – wraps user + conditions + medications in `$transaction`
- `createMedicationWithSchedules()` – atomic medication + schedule creation
- Cascade deletes via Prisma (enforced in schema)

**Single-Record Writes**:
- Not explicitly transactional (implicit single-write safety)
- Can be wrapped in transaction if needed

### F.3 No Client-Side State Management

**No Redux, Zustand, Recoil, etc.**:
- Props drilled through components
- Fresh data fetch on every page navigation
- Session state managed by NextAuth only

**Trade-off**:
- Simpler architecture, fewer dependencies
- Higher latency on pages with many simultaneous fetches
- No offline support

### F.4 Minimal User Model

**User Record Contains Only**:
- `id` (CUID)
- `createdAt`, `updatedAt` (timestamps)

**No Profile Data**:
- No email field (stored in Account table by NextAuth)
- No name, phone, address
- No preferences/settings record

**Rationale**: Minimal data = minimal privacy risk

### F.5 Immutable Intake Logs

**Intake logs cannot be edited**:
- By design (enforced at schema level with unique constraint)
- User must delete & recreate to "change" a log
- Ensures audit trail integrity

**Trade-off**:
- Simpler model (no version history)
- User cannot correct a mistaken log without re-doing it

---

## SECTION G — DATA FLOW SUMMARY

### G.1 Patient Medication Add Flow

```
Client Form Submit (LogIntakeForm)
  ↓
Server Action: logMedicationIntakeAction()
  ├─ Validate input (status, observation)
  ├─ Check ownership (schedule → medication → user)
  ├─ Check uniqueness (no log for today)
  ├─ Persist: createMedicationIntakeLog()
  ├─ Async: regenerateSnapshotAsync()
  └─ Redirect: /medications/{id}?intakeLogged=1

UI: Dashboard/Medications page
  ├─ Fetch: getUserSchedulesWithLogStatus()
  ├─ Render: quick schedule list with today's logs
  └─ Show: "On track" / "Needs attention" flag
```

### G.2 Snapshot Generation Flow

```
Async Task: regenerateSnapshotAsync(userId, timeWindow)
  ├─ Fetch all medications + schedules
  ├─ Fetch all intake logs (date range)
  ├─ Compute metrics: adherence, timing, observations
  ├─ Check data sufficiency
  ├─ Call AI (if sufficient): analyzeIntakePatterns()
  │   ├─ Build OpenAI prompt (constraints enforced)
  │   ├─ Call OpenAI API
  │   ├─ Parse JSON response
  │   └─ Return: MedicationPattern[], AdherenceSignal[], ObservationAssociation[]
  ├─ Persist: saveAwarenessSnapshot()
  └─ Done (silently on error)

Page Load: Dashboard / Insights
  ├─ Fetch: getLatestSnapshot(userId, "7-day")
  ├─ Parse JSON fields
  └─ Render: InsightsView with findings
```

### G.3 Delete Account Flow

```
Client: /settings/delete (confirmation)
  ↓
Server Action: deleteAccountAction()
  ├─ Delete user (cascade: all relations)
  │  ├─ Delete medications
  │  ├─ Delete conditions
  │  ├─ Delete schedules
  │  ├─ Delete intake logs
  │  ├─ Delete snapshots
  │  ├─ Delete sessions
  │  └─ Delete accounts (auth provider links)
  ├─ Sign out (NextAuth signout API)
  └─ Redirect: /login?accountDeleted=1
```

---

## SECTION H — SUMMARY TABLE

| Capability | Status | Owner | Data Scope | Notes |
|------------|--------|-------|-----------|-------|
| **Authentication** | ✅ Complete | Patient | User + Session | Credentials only, no OAuth |
| **Authorization** | ✅ Complete | Patient | Per-user data | Ownership checks enforced |
| **Medication CRUD** | ✅ Complete | Patient | Per-user meds | Name only (no dosage) |
| **Schedule CRUD** | ✅ Complete | Patient | Per-med schedules | Free-text frequency |
| **Intake Logging** | ✅ Complete | Patient | Per-day logs | Immutable, one per schedule/day |
| **Condition CRUD** | ✅ Complete | Patient | Per-user conditions | No medical validation |
| **Onboarding** | ✅ Complete | Patient | Initial setup | Non-repeatable, all-or-nothing |
| **Dashboard** | ✅ Complete | Patient | Summary + today | Read-only |
| **Insights** | ✅ Partial | Patient | AI snapshots | 7-day window, no custom ranges |
| **AI Analysis** | ✅ Partial | System | Intake metrics | Pattern detection, no diagnosis |
| **Account Management** | ✅ Complete | Patient | Reset/Delete | Hard delete only |
| **Doctor Access** | ❌ Stubbed | Doctor | N/A | TODO: All functions |
| **Doctor Dashboard** | ❌ Stubbed | Doctor | N/A | TODO: Routes + views |
| **Notifications** | ❌ Not Started | System | N/A | No reminders, alerts |
| **Data Export** | ❌ Not Started | Patient | N/A | No CSV, JSON, PDF |
| **Rate Limiting** | ❌ Not Started | System | N/A | No API limits |
| **MFA** | ❌ Not Started | Patient | N/A | Credentials only |
| **Email Verification** | ❌ Not Started | Patient | N/A | Auto-created users |
| **Password Reset** | ❌ Not Started | Patient | N/A | No recovery flow |

---

## CONCLUSION

**MedicaLog is a functional, single-user medication tracking system with:**
- ✅ Complete patient-facing features (medications, schedules, intake logging, conditions)
- ✅ Server-first architecture with ownership enforcement
- ✅ Transactional data writes
- ✅ AI-powered awareness snapshots (constrained, non-medical)
- ✅ Account control (reset, delete)
- ❌ Doctor features entirely scaffolded (no implementation)
- ❌ No notifications, reminders, external integrations
- ❌ No audit logging or concurrent access controls
- ❌ Limited validation (no medical terminology checking)

**Key Design Principle**: Transparency and user autonomy over feature breadth. The system is intentionally constrained to avoid medical advice, diagnosis, or lock-in.

---

**Report Generated**: January 4, 2026  
**Codebase Analyzed**: All user-facing routes, server actions, persistence layer, and AI logic
