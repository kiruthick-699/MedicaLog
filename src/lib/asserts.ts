import prisma from "@/lib/data/prisma";

/**
 * Internal assertions for server-only invariants.
 * - In development: throw errors to fail loudly and catch issues early.
 * - In production: log the problem and continue with safe behavior (no thrown errors),
 *   to avoid crashing the user experience.
 */

const isDev = process.env.NODE_ENV !== "production";

export function assert(condition: unknown, message: string): asserts condition {
  if (condition) return;
  if (isDev) {
    throw new Error("Invariant failed: " + message);
  }
  // Production: log and continue
  // eslint-disable-next-line no-console
  console.error("Invariant (production-safe):", message);
}

export async function assertUserExists(userId: string) {
  if (!userId) {
    assert(false, "userId must be provided");
    return;
  }

  if (!isDev) return; // avoid DB lookup in production

  const user = await prisma.user.findUnique({ where: { id: userId } });
  assert(!!user, `User not found for id=${userId}`);
}

export async function assertMedicationBelongsToUser(medicationId: string, userId: string) {
  if (!medicationId || !userId) {
    assert(false, "medicationId and userId must be provided");
    return;
  }

  if (!isDev) return; // skip relational DB check in production for performance

  const med = await prisma.medication.findUnique({ where: { id: medicationId } });
  assert(!!med, `Medication not found for id=${medicationId}`);
  assert(med!.userId === userId, `Medication ${medicationId} does not belong to user ${userId}`);
}

export async function assertScheduleBelongsToMedication(scheduleId: string, medicationId: string) {
  if (!scheduleId || !medicationId) {
    assert(false, "scheduleId and medicationId must be provided");
    return;
  }

  if (!isDev) return;

  const sched = await prisma.medicationSchedule.findUnique({ where: { id: scheduleId } });
  assert(!!sched, `Schedule not found for id=${scheduleId}`);
  assert(sched!.medicationId === medicationId, `Schedule ${scheduleId} does not belong to medication ${medicationId}`);
}

export function assertAwarenessDataValid(summary: { totalMedications: number; totalSchedules: number } | null) {
  if (!summary) {
    assert(false, "Awareness summary data is null");
    return;
  }

  // counts must be non-negative
  assert(summary.totalMedications >= 0, "totalMedications must be >= 0");
  assert(summary.totalSchedules >= 0, "totalSchedules must be >= 0");
}
