/**
 * Server-only account management actions
 * - Reset data (wipe medications, schedules, conditions)
 * - Delete account (wipe data and delete user)
 * - Authentication enforced
 * - Redirects on success
 */
"use server";

import { redirect } from "next/navigation";
import { wipeUserData, deleteUserAccount, deleteSnapshotsForUser } from "@/lib/data/persistence";
import { requireUser } from "@/lib/server/auth";
import { mapToSafeError } from "@/lib/errors";
import { cookies } from "next/headers";

export interface ResetDataResult {
  ok: boolean;
  errors?: string[];
}

/**
 * Server action: wipe all user data (medications, schedules, conditions)
 * User account remains; user returned to onboarding
 */
export async function resetDataAction(): Promise<ResetDataResult> {
  const user = await requireUser({ onFail: "throw" });

  try {
    await wipeUserData(user.id);
    
    // Clean up awareness snapshots
    await deleteSnapshotsForUser(user.id);
    
    redirect("/onboarding?reset=1");
  } catch (err) {
    const safe = mapToSafeError(err, "Failed to reset data");
    return { ok: false, errors: [safe.message] };
  }
}

export interface DeleteAccountResult {
  ok: boolean;
  errors?: string[];
}

/**
 * Server action: delete entire account and all data
 * Signs out user and redirects to landing page
 */
export async function deleteAccountAction(): Promise<DeleteAccountResult> {
  const user = await requireUser({ onFail: "throw" });

  try {
    // Delete user account and all associated data
    await deleteUserAccount(user.id);
    
    // Clean up awareness snapshots
    await deleteSnapshotsForUser(user.id);

    // Sign out by posting to NextAuth signout endpoint
    const cookieHeader = cookies().toString();
    await fetch("/api/auth/signout?callbackUrl=/login%3FaccountDeleted%3D1", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        ...(cookieHeader ? { Cookie: cookieHeader } : {}),
      },
      body: new URLSearchParams({ callbackUrl: "/login?accountDeleted=1" }).toString(),
      cache: "no-store",
    });

    // Redirect to login with confirmation after account deletion
    redirect("/login?accountDeleted=1");
  } catch (err) {
    const safe = mapToSafeError(err, "Failed to delete account");
    return { ok: false, errors: [safe.message] };
  }
}


