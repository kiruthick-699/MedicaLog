import "dotenv/config";
import { IntakeStatus as PrismaIntakeStatus, TimeSlot } from "@prisma/client";
import prisma from "@/lib/data/prisma";
import { wipeUserData, createMedicationWithSchedules } from "@/lib/data/persistence";
import { generateAwarenessSnapshot } from "@/lib/ai/generateAwarenessSnapshot";

const MOCK_EMAIL = "demo@mock.local";
const MOCK_PASSWORD = "demo1234";
const MOCK_PROVIDER = "mock"; // MUST match auth options

function assertNotProduction() {
  if (process.env.NODE_ENV === "production" || process.env.VERCEL === "1") {
    throw new Error("Refusing to run mock seed in production");
  }
}

function dateStringDaysAgo(daysAgo: number): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - daysAgo);
  return d.toISOString().slice(0, 10);
}

function actualTimeFromSlot(dateString: string, slot: TimeSlot, minutesOffset: number): Date {
  const [y, m, d] = dateString.split("-").map((s) => parseInt(s, 10));
  const base = new Date(Date.UTC(y, m - 1, d, slot === "MORNING" ? 9 : slot === "AFTERNOON" ? 13 : slot === "EVENING" ? 18 : 22, 0, 0));
  return new Date(base.getTime() + minutesOffset * 60000);
}

async function findOrCreateMockUser(): Promise<string> {
  // Try to find existing mock user
  const account = await prisma.account.findFirst({
    where: {
      provider: MOCK_PROVIDER,
      providerAccountId: MOCK_EMAIL,
    },
  });

  if (account) {
    // eslint-disable-next-line no-console
    console.log("[mock-seed] Found existing mock user account");
    return account.userId;
  }

  // Create new user and account
  // eslint-disable-next-line no-console
  console.log("[mock-seed] Mock user account not found, creating...");

  const user = await prisma.user.create({
    data: {},
  });

  await prisma.account.create({
    data: {
      userId: user.id,
      type: "credentials",
      provider: MOCK_PROVIDER,
      providerAccountId: MOCK_EMAIL,
    },
  });

  // eslint-disable-next-line no-console
  console.log(`[mock-seed] Created mock user with account`);
  return user.id;
}

async function clearUserData(userId: string) {
  await prisma.awarenessSnapshot.deleteMany({ where: { userId } });
  await prisma.medicationIntakeLog.deleteMany({ where: { userId } });
  await wipeUserData(userId);
}

async function seedMedications(userId: string) {
  const meds: Record<string, { id: string; schedules: Record<string, { id: string; slot: TimeSlot }> }> = {};

  const metformin = await createMedicationWithSchedules(userId, { name: "Metformin" }, [
    { timeSlot: "MORNING", frequency: "once-daily", timing: "08:00 with breakfast" },
    { timeSlot: "EVENING", frequency: "once-daily", timing: "20:00 with dinner" },
  ]);
  meds.metformin = {
    id: metformin.id,
    schedules: {
      morning: { id: metformin.schedules.find((s) => s.timeSlot === "MORNING")!.id, slot: "MORNING" },
      evening: { id: metformin.schedules.find((s) => s.timeSlot === "EVENING")!.id, slot: "EVENING" },
    },
  };

  const amlodipine = await createMedicationWithSchedules(userId, { name: "Amlodipine" }, [
    { timeSlot: "MORNING", frequency: "once-daily", timing: "09:00" },
  ]);
  meds.amlodipine = {
    id: amlodipine.id,
    schedules: {
      morning: { id: amlodipine.schedules[0].id, slot: amlodipine.schedules[0].timeSlot },
    },
  };

  const vitaminD = await createMedicationWithSchedules(userId, { name: "Vitamin D" }, [
    { timeSlot: "MORNING", frequency: "once-daily", timing: "10:00 with food" },
  ]);
  meds.vitaminD = {
    id: vitaminD.id,
    schedules: {
      morning: { id: vitaminD.schedules[0].id, slot: vitaminD.schedules[0].timeSlot },
    },
  };

  // eslint-disable-next-line no-console
  console.log("[mock-seed] Medications reset:", {
    metformin: ["MORNING 08:00", "EVENING 20:00"],
    amlodipine: ["MORNING 09:00"],
    vitaminD: ["MORNING 10:00"],
  });

  return meds;
}

async function seedIntakeLogs(userId: string, meds: Awaited<ReturnType<typeof seedMedications>>) {
  const days = Array.from({ length: 14 }, (_, i) => i); // 0 = today, 13 = 13 days ago

  const entries: Array<{
    medId: string;
    ref: { id: string; slot: TimeSlot };
    dayOffset: number;
    status: PrismaIntakeStatus;
    minutesOffset?: number;
    observation?: string | null;
  }> = [];

  // Vitamin D: high adherence, minimal variance
  for (const dayOffset of days) {
    entries.push({
      medId: meds.vitaminD.id,
      ref: meds.vitaminD.schedules.morning,
      dayOffset,
      status: PrismaIntakeStatus.TAKEN,
      minutesOffset: 10, // slight consistent offset
    });
  }

  // Metformin morning: generally taken
  for (const dayOffset of days) {
    entries.push({
      medId: meds.metformin.id,
      ref: meds.metformin.schedules.morning,
      dayOffset,
      status: PrismaIntakeStatus.TAKEN,
      minutesOffset: 0,
    });
  }

  // Metformin evening: missed streak of 3, otherwise taken; observations on taken days
  const missedDays = new Set([3, 4, 5]); // consecutive missed
  for (const dayOffset of days) {
    const missed = missedDays.has(dayOffset);
    entries.push({
      medId: meds.metformin.id,
      ref: meds.metformin.schedules.evening,
      dayOffset,
      status: missed ? PrismaIntakeStatus.MISSED : PrismaIntakeStatus.TAKEN,
      minutesOffset: missed ? undefined : 0,
      observation: missed ? null : "dizziness",
    });
  }

  // Amlodipine morning: timing variability (late)
  const variableOffsets = [120, 90, 60, 30, 150, 80, 110, 70, 95, 130, 60, 45, 100, 85];
  days.forEach((dayOffset, idx) => {
    entries.push({
      medId: meds.amlodipine.id,
      ref: meds.amlodipine.schedules.morning,
      dayOffset,
      status: PrismaIntakeStatus.TAKEN,
      minutesOffset: variableOffsets[idx] ?? 90,
    });
  });

  // Upsert logs respecting uniqueness (scheduleId + logDate)
  let created = 0;
  for (const log of entries) {
    const logDate = dateStringDaysAgo(log.dayOffset);
    const data = {
      userId,
      medicationId: log.medId,
      scheduleId: log.ref.id,
      scheduledTime: log.ref.slot,
      actualTime:
        log.minutesOffset !== undefined
          ? actualTimeFromSlot(logDate, log.ref.slot, log.minutesOffset)
          : null,
      status: log.status,
      observation: log.observation ?? null,
      logDate,
    };

    try {
      await prisma.medicationIntakeLog.upsert({
        where: { scheduleId_logDate: { scheduleId: log.ref.id, logDate } },
        update: data,
        create: data,
      });
      created += 1;
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error("[mock-seed] Failed to upsert intake log", { logDate, scheduleId: log.ref.id }, err);
      throw err;
    }
  }

  // eslint-disable-next-line no-console
  console.log(`[mock-seed] Intake logs seeded/upserted: ${created} entries across 14 days`);
}

async function main() {
  assertNotProduction();
  // eslint-disable-next-line no-console
  console.log("[mock-seed] Starting mock user seeding...");

  let userId: string;
  try {
    userId = await findOrCreateMockUser();
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("[mock-seed] Error:", (error as Error).message);
    process.exit(1);
  }

  // eslint-disable-next-line no-console
  console.log(`[mock-seed] Using mock user: ${userId}`);
  // eslint-disable-next-line no-console
  console.log(`[mock-seed] Email: ${MOCK_EMAIL}`);
  // eslint-disable-next-line no-console
  console.log(`[mock-seed] Provider: ${MOCK_PROVIDER}`);

  await clearUserData(userId);
  // eslint-disable-next-line no-console
  console.log("[mock-seed] ✓ Cleared existing user data (meds, schedules, logs, snapshots)");

  const meds = await seedMedications(userId);
  // eslint-disable-next-line no-console
  console.log("[mock-seed] ✓ Medications seeded");

  await seedIntakeLogs(userId, meds);
  // eslint-disable-next-line no-console
  console.log("[mock-seed] ✓ Intake logs seeded (56 entries)");

  // Explicitly verify intake logs exist before generating snapshot
  const logCount = await prisma.medicationIntakeLog.count({ where: { userId } });
  if (logCount === 0) {
    throw new Error(`No intake logs created for user ${userId}`);
  }
  // eslint-disable-next-line no-console
  console.log(`[mock-seed] ✓ Verified: ${logCount} intake logs in database`);

  const snapshot = await generateAwarenessSnapshot({ userId, timeWindow: "14d" });
  // eslint-disable-next-line no-console
  console.log(`[mock-seed] ✓ AI snapshot generated: ${snapshot.snapshotId}`);

  // Verify snapshot was persisted with correct userId
  const savedSnapshot = await prisma.awarenessSnapshot.findUnique({
    where: { id: snapshot.snapshotId },
  });
  if (!savedSnapshot || savedSnapshot.userId !== userId) {
    throw new Error(`Snapshot userId mismatch: expected ${userId}, got ${savedSnapshot?.userId}`);
  }
  // eslint-disable-next-line no-console
  console.log("[mock-seed] ✓ Snapshot verified in database");

  // eslint-disable-next-line no-console
  console.log("\n[mock-seed] SUCCESS. Mock user is ready to log in.");
  // eslint-disable-next-line no-console
  console.log(`[mock-seed] Credentials: ${MOCK_EMAIL} / ${MOCK_PASSWORD}`);
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error("[mock-seed] Failed:", err);
  process.exit(1);
});

