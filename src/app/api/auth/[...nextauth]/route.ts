/**
 * Server-only NextAuth (Auth.js) route for App Router
 * - Prisma Adapter
 * - Credentials provider (stub)
 * - Session strategy: database
 *
 * No UI components, no client hooks, no route protection here.
 */

import NextAuth from "next-auth";
import { authOptions } from "@/lib/server/auth/options";

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
