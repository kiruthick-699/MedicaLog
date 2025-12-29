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

const DEMO_EMAIL = "kiruthickkannaa@gmail.com";
const DEMO_PASSWORD = "mkk@9116";
const MOCK_EMAIL = "demo@mock.local";
const MOCK_PASSWORD = "demo1234";

export const authOptions: NextAuthOptions = {
  // Ensure a secret is present for JWT encryption/decryption. In production
  // provide `NEXTAUTH_SECRET`. In development we use a stable fallback.
  secret: process.env.NEXTAUTH_SECRET ?? "dev_local_secret_change_me",
  // Use the Prisma adapter only in production where the schema matches typical
  // NextAuth user fields. In development we skip the adapter to avoid adapter
  // code attempting to upsert users by `email` (the project `User` model is
  // intentionally minimal and does not include `email`). Using no adapter in
  // dev keeps the credentials flow simple and avoids schema mismatches.
  adapter: process.env.NODE_ENV === "production" ? PrismaAdapter(prisma) : undefined,
  // Use database-backed sessions in production; use JWT sessions in development
  // so the Credentials provider works locally without additional setup.
  session: {
    strategy: process.env.NODE_ENV === "production" ? "database" : "jwt",
  },
  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" },
      },
        async authorize(credentials) {
          const email = (credentials as any)?.email as string | undefined;
          const password = (credentials as any)?.password as string | undefined;

          // If running in production, only allow the explicit demo credentials.
          if (process.env.NODE_ENV === "production") {
            if (email === DEMO_EMAIL && password === DEMO_PASSWORD) {
              // Persist a stable user by mapping through Account table so repeated logins
              // resolve to the same user ID.
              const provider = "demo";
              const providerAccountId = DEMO_EMAIL;

              const existingAccount = await prisma.account.findFirst({
                where: { provider, providerAccountId },
              });

              if (existingAccount) {
                // Return the linked user
                return { id: existingAccount.userId } as any;
              }

              // Create a new minimal user and link an Account for stable lookups
              const user = await prisma.user.create({ data: {} });
              await prisma.account.create({
                data: {
                  userId: user.id,
                  type: "credentials",
                  provider,
                  providerAccountId,
                },
              });

              return { id: user.id } as any;
            }

            // Reject non-demo credentials in production
            return null;
          }

          // Development: accept any credentials and create a minimal user each time,
          // but for the explicit demo credentials, persist a stable mapping like production
          if (email === DEMO_EMAIL && password === DEMO_PASSWORD) {
            const provider = "demo";
            const providerAccountId = DEMO_EMAIL;
            const existingAccount = await prisma.account.findFirst({
              where: { provider, providerAccountId },
            });
            if (existingAccount) {
              return { id: existingAccount.userId } as any;
            }
            const user = await prisma.user.create({ data: {} });
            await prisma.account.create({
              data: {
                userId: user.id,
                type: "credentials",
                provider,
                providerAccountId,
              },
            });
            return { id: user.id } as any;
          }

          // Development-only mock credential for review/validation
          if (email === MOCK_EMAIL && password === MOCK_PASSWORD) {
            const provider = "mock";
            const providerAccountId = MOCK_EMAIL;
            const existingAccount = await prisma.account.findFirst({
              where: { provider, providerAccountId },
            });
            if (existingAccount) {
              return { id: existingAccount.userId } as any;
            }
            const user = await prisma.user.create({ data: {} });
            await prisma.account.create({
              data: {
                userId: user.id,
                type: "credentials",
                provider,
                providerAccountId,
              },
            });
            return { id: user.id } as any;
          }

          // Fallback dev flow: create a fresh minimal user
          const user = await prisma.user.create({ data: {} });
          return { id: user.id } as any;
        },
    }),
  ],
  pages: {
    signIn: "/login",
  },
  callbacks: {
    /**
     * Populate the JWT token with user ID when using JWT sessions.
     */
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    /**
     * Ensure `session.user.id` is present for server helpers.
     */
    async session({ session, token, user }) {
      // In JWT mode use token.id; in database mode use user.id
      const userId = token?.id || user?.id;
      return {
        ...session,
        user: session.user
          ? { ...session.user, id: userId }
          : undefined,
      } as typeof session;
    },
  },
};
