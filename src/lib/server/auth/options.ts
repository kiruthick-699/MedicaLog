/**
 * Server-only Auth configuration for NextAuth (Auth.js)
 * Shared between API route and server helpers.
 *
 * Dependencies: Prisma Adapter, server-only Prisma client.
 */
import "server-only";
import type { NextAuthOptions } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import prisma from "@/lib/data/prisma";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: "database",
  },
  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(_credentials) {
        // Stub only; implement real logic later.
        return null;
      },
    }),
  ],
  callbacks: {
    /**
     * Ensure `session.user.id` is present for server helpers, even with database sessions.
     */
    async session({ session, user }) {
      // `user` is available when using the Prisma Adapter with database sessions
      return {
        ...session,
        user: session.user
          ? { ...session.user, id: user?.id }
          : undefined,
      } as typeof session;
    },
  },
};
