# MedicaLog

A patient-centered, informational chronic care tracking app built with Next.js.

This repository is intentionally server-first: pages and components are Server Components by default, and client-side code is used only where necessary (for the single login form boundary).

Quick highlights
- Server-first App Router (Next.js 16)
- Prisma (SQLite) for local development
- NextAuth (Auth.js) with Prisma Adapter (server-only route)
- Single client boundary for login UI (`LoginForm`)

Getting started
---------------

Prerequisites
- Node.js 18+
- npm

Install
```
npm install
```

Run (development)
```
npm run dev
```

Build
```
npm run build
```

Useful project routes
- `/` — Welcome
- `/login` — Sign-in page (single client component for form state)
- `/onboarding` — Informational onboarding steps
- `/dashboard` — Protected dashboard (server-side auth guard)
- `/insights` — Insights & awareness (server-side)

Auth & server helpers
---------------------

- Server-only NextAuth route: `src/app/api/auth/[...nextauth]/route.ts` (uses shared server options)
- Server auth helpers: `src/lib/server/auth/index.ts`
    - `getCurrentUser()` — returns the authenticated user or `null` (server-side)
    - `requireUser()` — enforces authentication and performs a server-side redirect or throws
- Login server action: `src/lib/actions/auth.ts` (validates input, calls `signIn('credentials')`, redirects on success)
- Client boundary for the form: `src/components/client/LoginForm.tsx` (only form state, no auth logic)

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
