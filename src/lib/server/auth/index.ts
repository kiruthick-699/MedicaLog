/**
 * Server-only authentication helpers.
 * - No React hooks
 * - No UI logic
 * - Depends only on Auth configuration and persistence layer
 */
import "server-only";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/server/auth/options";
import { getUserWithRelations } from "@/lib/data/persistence";

export type CurrentUser = {
  id: string;
  createdAt: Date;
  updatedAt: Date;
};

/**
 * Returns the current authenticated user or null.
 * Uses server-side session retrieval only.
 */
export async function getCurrentUser(): Promise<CurrentUser | null> {
  const session = await getServerSession(authOptions);
  // Ensure we can access the user id injected by callbacks
  const userId = (session as any)?.user?.id as string | undefined;
  if (!userId) return null;

  const user = await getUserWithRelations(userId);
  if (!user) return null;

  return {
    id: user.id,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

export interface RequireUserOptions {
  onFail?: "redirect" | "throw";
  redirectTo?: string;
}

/**
 * Ensures a user is authenticated.
 * Performs server-side redirect or throws; no client handling.
 */
export async function requireUser(options: RequireUserOptions = {}): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (user) return user;

  const onFail = options.onFail ?? "redirect";
  if (onFail === "redirect") {
    // Default to NextAuth built-in sign-in route
    redirect(options.redirectTo ?? "/api/auth/signin");
  }
  throw new Error("Unauthorized");
}
