**Overview**

This document describes the high-level architecture of the application (server-first Next.js App Router), the separation of concerns between layers, the primary data flows, and important operational invariants that reviewers should verify. The intent is technical clarity for maintainers and reviewers — not setup instructions or marketing.

**System Summary**

- **Platform**: Next.js App Router (server components by default).
- **Language**: TypeScript (strict).
- **Styling**: Tailwind CSS (stateless utility classes in UI components).
- **Auth**: NextAuth (Auth.js) with a Prisma adapter; sessions stored in the database.
- **Persistence**: Prisma ORM with SQLite in development (schema in `prisma/schema.prisma`).

**Key design decisions**

- Server-first rendering and server-only code paths are the default. Client components are minimized and used only where imperative browser interactions are required (for example, `src/components/client/LoginForm.tsx`).
- Validation and authorization occur on the server boundaries (server actions and server components) to ensure deterministic flows and eliminate client-side flicker.
- Persistence operations are idempotent where appropriate and multi-step writes are wrapped in transactions to ensure all-or-nothing behavior.
- Error handling is server-first: controlled error types, an application-level error boundary, and server-side logging for diagnostics.

**Separation of Layers**

**UI (Pure, Stateless)**

- **Purpose**: Render-only components that accept props and perform no side effects.
- **Characteristics**: No hooks, no local state beyond presentation, predictable and composable.
- **Location examples**: `src/components/ui/*` (e.g., `Input.tsx`, `Button.tsx`, `EmptyState.tsx`, `InfoBanner.tsx`).

**Client Interaction (Minimal)**

- **Purpose**: Small set of client boundaries that manage UI-only interactions (forms, transitions) and call server actions.
- **Characteristics**: Contain imperative browser code only when necessary; do not perform authentication checks or persistent state decisions.
- **Location examples**: `src/components/client/LoginForm.tsx`.

**Server Components**

- **Purpose**: All rendering, routing decisions, and server-side data retrieval occur here. Server components call server actions and persistence functions directly.
- **Characteristics**: Deterministic rendering, no client-side guards, server-side redirects using `requireUser()` and `next/navigation` when necessary.
- **Location examples**: `src/app/*` pages (e.g., `src/app/dashboard/page.tsx`, `src/app/onboarding/page.tsx`, `src/app/insights/page.tsx`).

**Auth (Identity Only)**

- **Purpose**: Provide identity and session information. Authentication is used to gate server-side routes and to attribute persisted records to a user.
- **Characteristics**: Server-only helpers to fetch the current user and to require authentication (`getCurrentUser()`, `requireUser()`). No client-side auth guards.
- **Location examples**: `src/lib/server/auth/*`, `src/app/api/auth/[...nextauth]/route.ts`.

**Persistence (Truth Layer)**

- **Purpose**: Single source of truth for data reads/writes. Implements idempotency, transactional helpers, and neutral data shaping for UI.
- **Characteristics**: Server-only Prisma client, thin domain-specific functions that return plain JS objects (no React types). All multi-step writes are wrapped in transactions.
- **Location examples**: `src/lib/data/persistence.ts`, `src/lib/data/prisma.ts`, `prisma/schema.prisma`.

**Primary Data Models (summary)**

- `User`: minimal identity (used purely for record attribution).
- `DiagnosedCondition`: user-scoped reference data.
- `Medication`: user-scoped medications.
- `MedicationSchedule`: schedules attached to a `Medication` (timeSlot enum, frequency, timing, note).

**Data Flow (textual diagram)**

- 1) Incoming HTTP request is routed by Next.js App Router to a server component in `src/app/*`.
- 2) Server component may call `getCurrentUser()` (server-side) to determine identity and guard or redirect deterministically using `requireUser()`.
- 3) Server components call server actions (e.g., `src/lib/actions/*`) for mutating operations. Server actions perform validation, then call persistence functions.
- 4) Persistence functions in `src/lib/data/persistence.ts` interact with the Prisma client to read/write data. Multi-step writes use transactions and return plain domain objects.
- 5) Persistence functions and server actions use centralized error types (`src/lib/errors.ts`) and assertion helpers (`src/lib/asserts.ts`) to enforce invariants and prevent leaks of sensitive information.
- 6) On success: server action either performs a server-side redirect (no client flicker) or returns a domain object for re-render.
- 7) On error: server actions throw mapped `ControlledError` subtypes or return controlled error objects; UI displays server-rendered error states or the global server error boundary (`src/app/error.tsx`) presents a safe message.

**Assertions & Invariants**

- Assertions are server-only and implemented in `src/lib/asserts.ts`.
- Behavior:
  - In development (`NODE_ENV !== 'production'`): assertions throw to fail loudly and catch issues early.
  - In production: assertions log issues but do not throw, avoiding a user-facing crash and minimizing performance impact.
- Critical invariants enforced (examples):
  - Medication schedules must belong to a medication (asserted in development).
  - Medications must belong to a user (asserted in development).
  - Awareness summary counts must be valid (non-negative) before consumption by views.

**Error handling policy**

- Use `ControlledError` subtypes defined in `src/lib/errors.ts` (e.g., `ValidationError`, `DatabaseError`, `AuthError`, `ServiceError`) for predictable programmatic handling.
- Map unexpected errors to a safe `ServiceError` via `mapToSafeError()`; log full stack/traces server-side for diagnostics only.
- UI surfaces only safe messages and does not display stack traces or DB error details.
- Global server error boundary lives at `src/app/error.tsx` and renders a generic safe message when the App Router catches an unhandled error.

**Redirect and Flow Determinism**

- All redirects are performed server-side using `next/navigation`'s `redirect()` inside server components or server actions.
- No client-side guards or redirects are used. This guarantees no visual flicker and deterministic routing decisions.
- Example flows:
  - Unauthenticated request to `/dashboard`: handled by `requireUser()` which performs a server-side redirect to the sign-in route.
  - Authenticated request to `/onboarding`: server component checks user relations and redirects to `/dashboard` when onboarding is already complete.

**Testing and Verification Points**

- Unit test targets:
  - Validators: `src/lib/validation/*` (field-level and object-level validation).
  - Persistence idempotency: test `addMedication`, `addDiagnosedCondition`, and transaction helpers produce stable outputs for repeated inputs.
  - Actions: test server actions validate inputs and map errors to `ValidationError`.
- Integration checks:
  - Verify `requireUser()` redirects happen server-side (no client flicker). Render a protected page and assert HTTP redirect behavior.
  - Verify that `createUserWithInitialData()` is transactional: partial data should not be persisted on any intermediate failure.

**Where to Look in the Codebase**

- Auth and server helpers: `src/lib/server/auth/*`
- Server actions (validation + persistence calls): `src/lib/actions/*`
- Persistence (Prisma client + DAL): `src/lib/data/prisma.ts`, `src/lib/data/persistence.ts`
- Validation: `src/lib/validation/*`
- Assertions and controlled errors: `src/lib/asserts.ts`, `src/lib/errors.ts`
- Global error boundary: `src/app/error.tsx`
- Prisma schema and migrations: `prisma/schema.prisma`, `prisma/migrations/*`

**Operational notes for reviewers**

- Confirm that all authorization checks occur server-side by inspecting uses of `requireUser()` and `getCurrentUser()` in `src/app/*` pages.
- Confirm that server actions perform validation by reviewing `src/lib/actions/*` and that persistence functions are idempotent and wrapped in transactions where necessary.
- Confirm that sensitive error details are not rendered by UI components; full errors should only appear in server logs.

**Appendix — Typical call example (textual)**

- Browser submits login form (client component) -> server action `loginAction(input)` -> validates input -> calls `signIn()` (NextAuth) -> on success `redirect('/dashboard')` server-side.

---

This document focuses on architecture and reviewable invariants. For operational or developer tasks (build, run, migration), consult the repository's top-level `README.md` and the code itself.

**Design Decisions & Tradeoffs**

This project balances safety, determinism, and developer velocity. Below are key decisions and honest tradeoffs to help reviewers evaluate the architecture.

- Why server-first rendering was chosen
  - Rationale: Server-first rendering (Next.js App Router with Server Components) yields deterministic HTML, simplifies access to server-only resources (database, secrets, server auth flows), and eliminates client-side guard/flicker by performing routing and authorization on the server. It also reduces client bundle size and surface area for security-sensitive code.
  - Tradeoffs: Server rendering increases latency sensitivity for some interactive flows and places more load on the server for data fetching. It also limits certain highly interactive UI patterns unless a client component boundary is introduced. We chose server-first because the app is primarily data-driven, requires secure server-only validation and redirects, and benefits from minimized client complexity.

- Why client components are minimized
  - Rationale: Client components are used only when imperative browser APIs or local interaction state are necessary (for example, the login form that performs form state and transitions). Minimizing client components keeps the application simpler to reason about, reduces client bundle sizes, and pushes validation/authorization to the server.
  - Tradeoffs: Some interactive UX patterns may require more code to implement purely server-side or require carefully placed client boundaries. This can increase development friction when adding complex client behavior later. The current approach favors deterministic server behavior and a smaller, more secure client footprint.

- Why Prisma + SQLite was used initially
  - Rationale: Prisma provides a clear type-safe ORM, easy migrations, and a developer-friendly API. SQLite is pragmatic for local development and CI: zero-config, reproducible, and fast for small datasets. This combination accelerates iteration and reduces the ops burden for reviewers evaluating the code.
  - Tradeoffs: SQLite is not intended for highly-concurrent production workloads; moving to a server-grade RDBMS (Postgres, MySQL) would require configuration and possibly small schema/connection adaptations. Prisma adds an additional dependency layer and generated client, which increases build steps (client generation after migrations). We intentionally used this stack to maximize developer productivity while keeping the persistence layer portable to a production DB later.

- Why auth is intentionally minimal
  - Rationale: Authentication is focused on identity and session management only. The project uses NextAuth with a Prisma adapter for a minimal, auditable auth surface: server helpers (`getCurrentUser`, `requireUser`) and the NextAuth route. This keeps auth code straightforward and localizes session-to-user mapping in the server layer.
  - Tradeoffs: Minimal auth means there are fewer features out of the box (no multi-factor, no rich RBAC, limited session policies). That is deliberate: the goal is to keep the trust surface small and avoid embedding business-level authorization decisions into client code. In production, reviewers should evaluate whether additional controls (session expiry, MFA, role model) are needed for their threat model.

- Why barrel files and mixed logic were avoided
  - Rationale: The codebase avoids heavy use of barrel exports and mixing UI and server logic in the same files. This makes dependency graphs explicit, simplifies server-only vs. client-capable module boundaries, and reduces accidental imports of client-only libraries into server code (or vice versa). Files expose focused responsibilities (validation, persistence, server actions, UI primitives).
  - Tradeoffs: Avoiding barrels can make import lines longer and slightly more verbose. It also fragments exports which some developers find less ergonomic. The tradeoff favours clear module boundaries and fewer accidental cross-environment imports—important when the runtime semantics (server-only vs client) matter for correctness and security.

This section is intentionally candid: the architecture is pragmatic, not perfect. It favors predictable server-side behavior, small client bundles, and clear separation between concerns. If reviewers want, we can add a short migration guide describing how to switch the Prisma datasource to Postgres (or another production DB) or a checklist to harden auth policies for higher-risk deployments.

**Ethical & Safety Boundaries**

This system is designed to be a neutral awareness and data-capture tool. It intentionally avoids making clinical judgments or automated medical recommendations. Below is what the system explicitly does NOT do and how the architecture enforces those boundaries.

- What the system does NOT do
  - The system does NOT provide medical diagnoses.
  - The system does NOT prescribe medications or dosing instructions.
  - The system does NOT perform automated clinical decision-making (no alerts that recommend treatment, no automated triage logic).
  - The system does NOT replace medical professionals; it is informational-only.

- Why these boundaries exist
  - Safety: automated medical decisions carry high risk and legal/ethical implications. Keeping the system focused on awareness reduces the potential for harm.
  - Clarity: users must not mistake the system for clinical advice; limiting functionality reduces ambiguity around responsibilities.
  - Auditability: neutral data capture with explicit server-side validation is easier to audit and test.

- How the architecture enforces them
  - Server-first validation: all inputs are validated server-side using `src/lib/validation/*` before persistence; there is no client-side-only validation that could be bypassed.
  - Separation of concerns: UI components are stateless and do not contain business or medical logic. Any logic that might influence user safety lives only server-side (in `src/lib/*`), where it is auditable and testable.
  - Controlled errors and logging: unexpected conditions are mapped to safe server-side errors and logged; internal details are not exposed in the UI.
  - Assertions and invariants: `src/lib/asserts.ts` enforces relational and data invariants (development failures) to catch incorrect flows early.

**UX & Scope Choices (safety-first framing)**

These UX decisions are shaped by user safety and clarity rather than feature breadth.

- Why onboarding is structured progressively
  - Progressive onboarding reduces cognitive load and the risk of incorrect or rushed entries. It encourages users to provide minimal, accurate information step-by-step rather than overwhelming them with a single massive form.
  - From a safety perspective, progressive steps allow server-side validation and sanitization between steps, limiting the chance that incomplete or malformed data is persisted.

- Why nutrition is secondary and optional
  - Nutrition information is often noisy and optional for meaningful awareness; making it secondary reduces the burden of collecting sensitive or error-prone nutritional data.
  - Keeping nutrition optional reduces the surface area for user confusion and avoids implying any dietary guidance or therapy.

- Why the dashboard shows only neutral awareness signals
  - The dashboard focuses on counts and neutral signals (e.g., number of medications, last update) to provide situational awareness without implying clinical action.
  - Neutral signals avoid causing incidental alarm; any interpretation is left to a clinician or the user’s trusted caregiver.

- Why detailed information is isolated in Insights & Awareness
  - Deeper, contextual information is provided in dedicated sections (Insights & Awareness) where the UI can present more context and explanatory copy to avoid misinterpretation.
  - Isolation reduces accidental exposure of sensitive details on the main dashboard and supports safer progressive disclosure when users intentionally seek detail.

**Hard Constraints & Guardrails**

The architecture codifies a few hard constraints to improve maintainability and safety. These are non-negotiable guardrails reviewers and contributors should observe:

- Server-first by default
  - All routing, auth checks, redirects, and final validation occur on the server. This prevents client-side race conditions and visual flicker, and ensures decision logic is auditable.

- Minimal client boundaries
  - Client components are used sparingly and only for local interaction; they do not implement business or authorization logic.

- No business logic in components
  - Presentation components remain pure; any business rules, validation, or medical-related logic live in server-only modules.

- Validation before persistence
  - All server actions must validate using `src/lib/validation/*` before calling persistence helpers. Validation failures should be represented using `ValidationError`.

- Idempotent server writes
  - Persistence functions attempt to be idempotent (find-or-create patterns) and multi-step writes are wrapped in transactions where appropriate to avoid partial writes.

- Fast compile-time as a design goal
  - Avoid heavy build-time code generation or complex runtime initialization that would slow down developer feedback loops; keep changes verifiable with fast TypeScript builds.

How these constraints improve maintainability and safety

- Predictability: server-first and validated state transitions make behavior deterministic and easier to test.
- Security: minimizing client logic reduces the attack surface and accidental leaks of sensitive flows into client bundles.
- Audibility: server-side logic, centralized validation, and controlled errors make it straightforward to trace decisions in logs and tests.
- Resilience: idempotent writes and transactions reduce the risk of inconsistent data after retries or partial failures.

These guardrails are pragmatic: they prioritize user safety, auditability, and developer productivity. They do not eliminate all risk — rather, they create a conservative baseline for further hardening as the application moves toward higher-risk or production deployments.

