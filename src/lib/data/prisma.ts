import { PrismaClient } from "@prisma/client";

// Ensure a single PrismaClient instance across the app (server-only usage).
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

// Use binary protocol for local development (avoids adapter requirement)
export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

export default prisma;
