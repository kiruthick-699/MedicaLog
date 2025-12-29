/**
 * Data access layer: persistence functions for chronic care monitoring
 * Server-only, no React or UI imports
 * Returns plain JS/TS objects
 */

import { TimeSlot, IntakeStatus as PrismaIntakeStatus, type User, type DiagnosedCondition, type Medication, type MedicationSchedule, type MedicationIntakeLog } from "@prisma/client";
import prisma from "./prisma";
import { assertUserExists, assertMedicationBelongsToUser, assertAwarenessDataValid } from "@/lib/asserts";

// === User ===

export interface UserCreateInput {
  // Optional fields for future extensibility (currently minimal)
}

export interface UserData {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Create a new user
 */
export async function createUser(input: UserCreateInput = {}): Promise<UserData> {
  const user = await prisma.user.create({
    data: {},
  });
  return {
    id: user.id,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

/**
 * Create a user along with optional initial conditions and medications (and schedules).
 * All writes are performed inside a transaction to ensure all-or-nothing behavior.
 * The function is idempotent for nested items by checking for existing records within the transaction.
 */
export async function createUserWithInitialData(options: {
  user?: UserCreateInput;
  conditions?: DiagnosedConditionInput[];
  medications?: Array<{
    name: string;
    schedules?: MedicationScheduleInput[];
  }>;
} = {}): Promise<{
  user: UserData;
  conditions: DiagnosedConditionData[];
  medications: MedicationWithSchedules[];
}> {
  try {
    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({ data: {} });

      const createdConditions: DiagnosedConditionData[] = [];
      if (options.conditions && options.conditions.length > 0) {
        for (const c of options.conditions) {
          const existing = await tx.diagnosedCondition.findFirst({ where: { userId: user.id, name: c.name } });
          if (existing) {
            createdConditions.push({
              id: existing.id,
              userId: existing.userId,
              name: existing.name,
              note: existing.note,
              createdAt: existing.createdAt,
              updatedAt: existing.updatedAt,
            });
            continue;
          }
          const created = await tx.diagnosedCondition.create({ data: { userId: user.id, name: c.name, note: c.note || null } });
          createdConditions.push({
            id: created.id,
            userId: created.userId,
            name: created.name,
            note: created.note,
            createdAt: created.createdAt,
            updatedAt: created.updatedAt,
          });
        }
      }

      const createdMedications: MedicationWithSchedules[] = [];
      if (options.medications && options.medications.length > 0) {
        for (const m of options.medications) {
          // find or create medication
          let medication = await tx.medication.findFirst({ where: { userId: user.id, name: m.name } });
          if (!medication) {
            medication = await tx.medication.create({ data: { userId: user.id, name: m.name } });
          }

          const schedules: MedicationScheduleData[] = [];
          if (m.schedules && m.schedules.length > 0) {
            for (const s of m.schedules) {
              const existingSchedule = await tx.medicationSchedule.findFirst({
                where: {
                  medicationId: medication.id,
                  timeSlot: s.timeSlot,
                  frequency: s.frequency,
                  timing: s.timing,
                },
              });
              if (existingSchedule) {
                schedules.push({
                  id: existingSchedule.id,
                  medicationId: existingSchedule.medicationId,
                  timeSlot: existingSchedule.timeSlot,
                  frequency: existingSchedule.frequency,
                  timing: existingSchedule.timing,
                  note: existingSchedule.note,
                  createdAt: existingSchedule.createdAt,
                  updatedAt: existingSchedule.updatedAt,
                });
                continue;
              }
              const createdSchedule = await tx.medicationSchedule.create({
                data: {
                  medicationId: medication.id,
                  timeSlot: s.timeSlot,
                  frequency: s.frequency,
                  timing: s.timing,
                  note: s.note || null,
                },
              });
              schedules.push({
                id: createdSchedule.id,
                medicationId: createdSchedule.medicationId,
                timeSlot: createdSchedule.timeSlot,
                frequency: createdSchedule.frequency,
                timing: createdSchedule.timing,
                note: createdSchedule.note,
                createdAt: createdSchedule.createdAt,
                updatedAt: createdSchedule.updatedAt,
              });
            }
          }

          createdMedications.push({
            id: medication.id,
            userId: medication.userId,
            name: medication.name,
            schedules,
            createdAt: medication.createdAt,
            updatedAt: medication.updatedAt,
          });
        }
      }

      return {
        user: { id: user.id, createdAt: user.createdAt, updatedAt: user.updatedAt },
        conditions: createdConditions,
        medications: createdMedications,
      };
    });

    return result;
  } catch (err) {
    // Surface a clean server error
    // Log the full error server-side, but throw a safe DatabaseError to avoid leaking details
    // eslint-disable-next-line no-console
    console.error("createUserWithInitialData transaction failed:", err);
    const { DatabaseError } = await import("@/lib/errors");
    throw new DatabaseError("Failed to create user and initial data");
  }
}

// === Diagnosed Condition ===

export interface DiagnosedConditionInput {
  name: string;
  note?: string;
}

export interface DiagnosedConditionData {
  id: string;
  userId: string;
  name: string;
  note: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface DiagnosedConditionWithOwner extends DiagnosedConditionData {}

/**
 * Add a diagnosed condition for a user
 */
export async function addDiagnosedCondition(
  userId: string,
  input: DiagnosedConditionInput
): Promise<DiagnosedConditionData> {
  // Idempotent: return existing condition if one with same userId and name exists
  const existing = await prisma.diagnosedCondition.findFirst({
    where: {
      userId,
      name: input.name,
    },
  });

  if (existing) {
    return {
      id: existing.id,
      userId: existing.userId,
      name: existing.name,
      note: existing.note,
      createdAt: existing.createdAt,
      updatedAt: existing.updatedAt,
    };
  }

  const condition = await prisma.diagnosedCondition.create({
    data: {
      userId,
      name: input.name,
      note: input.note || null,
    },
  });
  return {
    id: condition.id,
    userId: condition.userId,
    name: condition.name,
    note: condition.note,
    createdAt: condition.createdAt,
    updatedAt: condition.updatedAt,
  };
}

export async function getDiagnosedConditionById(conditionId: string): Promise<DiagnosedConditionWithOwner | null> {
  if (!conditionId || conditionId.trim().length === 0) return null;

  const condition = await prisma.diagnosedCondition.findUnique({ where: { id: conditionId } });
  if (!condition) return null;

  return {
    id: condition.id,
    userId: condition.userId,
    name: condition.name,
    note: condition.note,
    createdAt: condition.createdAt,
    updatedAt: condition.updatedAt,
  };
}

export async function getDiagnosedConditionsForUser(userId: string): Promise<DiagnosedConditionData[]> {
  const conditions = await prisma.diagnosedCondition.findMany({ where: { userId }, orderBy: { createdAt: "asc" } });
  return conditions.map((c) => ({
    id: c.id,
    userId: c.userId,
    name: c.name,
    note: c.note,
    createdAt: c.createdAt,
    updatedAt: c.updatedAt,
  }));
}

export async function updateDiagnosedCondition(
  userId: string,
  conditionId: string,
  input: DiagnosedConditionInput
): Promise<DiagnosedConditionData> {
  if (!conditionId || conditionId.trim().length === 0) {
    const { ValidationError } = await import("@/lib/errors");
    throw new ValidationError(["Invalid condition identifier"]);
  }

  const condition = await prisma.diagnosedCondition.findUnique({ where: { id: conditionId } });
  if (!condition || condition.userId !== userId) {
    const { ValidationError } = await import("@/lib/errors");
    throw new ValidationError(["Condition not found or not accessible"]);
  }

  // Idempotency: if unchanged, return existing
  const unchanged =
    condition.name === input.name &&
    (condition.note || "") === (input.note || "");

  if (unchanged) {
    return {
      id: condition.id,
      userId: condition.userId,
      name: condition.name,
      note: condition.note,
      createdAt: condition.createdAt,
      updatedAt: condition.updatedAt,
    };
  }

  const updated = await prisma.diagnosedCondition.update({
    where: { id: conditionId },
    data: { name: input.name, note: input.note ?? null },
  });

  return {
    id: updated.id,
    userId: updated.userId,
    name: updated.name,
    note: updated.note,
    createdAt: updated.createdAt,
    updatedAt: updated.updatedAt,
  };
}

export async function deleteDiagnosedCondition(userId: string, conditionId: string): Promise<void> {
  if (!conditionId || conditionId.trim().length === 0) {
    const { ValidationError } = await import("@/lib/errors");
    throw new ValidationError(["Invalid condition identifier"]);
  }

  const condition = await prisma.diagnosedCondition.findUnique({ where: { id: conditionId } });
  if (!condition || condition.userId !== userId) {
    const { ValidationError } = await import("@/lib/errors");
    throw new ValidationError(["Condition not found or not accessible"]);
  }

  await prisma.diagnosedCondition.delete({ where: { id: conditionId } });
}

// === Medication ===

export interface MedicationInput {
  name: string;
}

export interface MedicationData {
  id: string;
  userId: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Add a medication for a user
 */
export async function addMedication(
  userId: string,
  input: MedicationInput
): Promise<MedicationData> {
  // Cheap assertion: ensure userId is present. In dev this will also verify user exists.
  await assertUserExists(userId);
  // Idempotent: try to find existing medication by user and name
  const existing = await prisma.medication.findFirst({
    where: {
      userId,
      name: input.name,
    },
  });

  if (existing) {
    return {
      id: existing.id,
      userId: existing.userId,
      name: existing.name,
      createdAt: existing.createdAt,
      updatedAt: existing.updatedAt,
    };
  }

  const medication = await prisma.medication.create({
    data: {
      userId,
      name: input.name,
    },
  });
  return {
    id: medication.id,
    userId: medication.userId,
    name: medication.name,
    createdAt: medication.createdAt,
    updatedAt: medication.updatedAt,
  };
}

/**
 * Update a medication's name (idempotent, enforces ownership and uniqueness per user)
 */
export async function updateMedicationName(
  userId: string,
  medicationId: string,
  newName: string
): Promise<MedicationData> {
  await assertUserExists(userId);
  await assertMedicationBelongsToUser(medicationId, userId);

  // If another medication with the same name exists for this user, prevent duplicates
  const existingSameName = await prisma.medication.findFirst({
    where: { userId, name: newName },
  });
  if (existingSameName && existingSameName.id !== medicationId) {
    const { ValidationError } = await import("@/lib/errors");
    throw new ValidationError(["A medication with this name already exists"]);
  }

  // Fetch current to check idempotency
  const current = await prisma.medication.findUnique({ where: { id: medicationId } });
  if (!current) {
    const { DatabaseError } = await import("@/lib/errors");
    throw new DatabaseError("Medication not found");
  }
  if (current.name === newName) {
    return {
      id: current.id,
      userId: current.userId,
      name: current.name,
      createdAt: current.createdAt,
      updatedAt: current.updatedAt,
    };
  }

  const updated = await prisma.medication.update({
    where: { id: medicationId },
    data: { name: newName },
  });
  return {
    id: updated.id,
    userId: updated.userId,
    name: updated.name,
    createdAt: updated.createdAt,
    updatedAt: updated.updatedAt,
  };
}

// === Medication Schedule ===

export interface MedicationScheduleInput {
  timeSlot: TimeSlot;
  frequency: string;
  timing: string;
  note?: string;
}

export interface MedicationScheduleData {
  id: string;
  medicationId: string;
  timeSlot: TimeSlot;
  frequency: string;
  timing: string;
  note: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface MedicationScheduleWithMedication extends MedicationScheduleData {
  medication: {
    id: string;
    userId: string;
    name: string;
  };
}

/**
 * Add a schedule entry for a medication
 */
export async function addMedicationSchedule(
  medicationId: string,
  input: MedicationScheduleInput
): Promise<MedicationScheduleData> {
  // Assert inputs are sane and in dev verify medication belongs to a user
  // We do not perform an extra DB call in production (assert helper is a no-op there)
  await assertMedicationBelongsToUser(medicationId, input && (input as any).userId ? (input as any).userId : "");
  // Idempotent: avoid duplicate schedules for the same medication with same timing
  const existing = await prisma.medicationSchedule.findFirst({
    where: {
      medicationId,
      timeSlot: input.timeSlot,
      frequency: input.frequency,
      timing: input.timing,
    },
  });

  if (existing) {
    return {
      id: existing.id,
      medicationId: existing.medicationId,
      timeSlot: existing.timeSlot,
      frequency: existing.frequency,
      timing: existing.timing,
      note: existing.note,
      createdAt: existing.createdAt,
      updatedAt: existing.updatedAt,
    };
  }

  const schedule = await prisma.medicationSchedule.create({
    data: {
      medicationId,
      timeSlot: input.timeSlot,
      frequency: input.frequency,
      timing: input.timing,
      note: input.note || null,
    },
  });
  return {
    id: schedule.id,
    medicationId: schedule.medicationId,
    timeSlot: schedule.timeSlot,
    frequency: schedule.frequency,
    timing: schedule.timing,
    note: schedule.note,
    createdAt: schedule.createdAt,
    updatedAt: schedule.updatedAt,
  };
}

/**
 * Get a schedule with its medication and user ownership for enforcement.
 */
export async function getMedicationScheduleWithOwnership(
  scheduleId: string
): Promise<MedicationScheduleWithMedication | null> {
  if (!scheduleId || scheduleId.trim().length === 0) return null;

  const schedule = await prisma.medicationSchedule.findUnique({
    where: { id: scheduleId },
    include: { medication: true },
  });

  if (!schedule) return null;

  return {
    id: schedule.id,
    medicationId: schedule.medicationId,
    timeSlot: schedule.timeSlot,
    frequency: schedule.frequency,
    timing: schedule.timing,
    note: schedule.note,
    createdAt: schedule.createdAt,
    updatedAt: schedule.updatedAt,
    medication: {
      id: schedule.medication.id,
      userId: schedule.medication.userId,
      name: schedule.medication.name,
    },
  };
}

/**
 * Update a medication schedule with ownership enforcement and idempotency.
 */
export async function updateMedicationSchedule(
  userId: string,
  medicationId: string,
  scheduleId: string,
  input: MedicationScheduleInput
): Promise<MedicationScheduleData> {
  if (!scheduleId || scheduleId.trim().length === 0) {
    const { ValidationError } = await import("@/lib/errors");
    throw new ValidationError(["Invalid schedule identifier"]);
  }

  const schedule = await prisma.medicationSchedule.findUnique({
    where: { id: scheduleId },
    include: { medication: true },
  });

  if (!schedule || schedule.medicationId !== medicationId || schedule.medication.userId !== userId) {
    const { ValidationError } = await import("@/lib/errors");
    throw new ValidationError(["Medication schedule not found or not accessible"]);
  }

  // Idempotency check
  const unchanged =
    schedule.timeSlot === input.timeSlot &&
    schedule.frequency === input.frequency &&
    schedule.timing === input.timing &&
    (schedule.note || "") === (input.note || "");

  if (unchanged) {
    return {
      id: schedule.id,
      medicationId: schedule.medicationId,
      timeSlot: schedule.timeSlot,
      frequency: schedule.frequency,
      timing: schedule.timing,
      note: schedule.note,
      createdAt: schedule.createdAt,
      updatedAt: schedule.updatedAt,
    };
  }

  const updated = await prisma.medicationSchedule.update({
    where: { id: scheduleId },
    data: {
      timeSlot: input.timeSlot,
      frequency: input.frequency,
      timing: input.timing,
      note: input.note || null,
    },
  });

  return {
    id: updated.id,
    medicationId: updated.medicationId,
    timeSlot: updated.timeSlot,
    frequency: updated.frequency,
    timing: updated.timing,
    note: updated.note,
    createdAt: updated.createdAt,
    updatedAt: updated.updatedAt,
  };
}

/**
 * Delete a medication schedule with ownership enforcement. Idempotent-safe: throws a controlled error if missing or unauthorized.
 */
export async function deleteMedicationSchedule(
  userId: string,
  medicationId: string,
  scheduleId: string
): Promise<void> {
  if (!scheduleId || scheduleId.trim().length === 0) {
    const { ValidationError } = await import("@/lib/errors");
    throw new ValidationError(["Invalid schedule identifier"]);
  }

  const schedule = await prisma.medicationSchedule.findUnique({
    where: { id: scheduleId },
    include: { medication: true },
  });

  if (!schedule || schedule.medicationId !== medicationId || schedule.medication.userId !== userId) {
    const { ValidationError } = await import("@/lib/errors");
    throw new ValidationError(["Medication schedule not found or not accessible"]);
  }

  await prisma.medicationSchedule.delete({ where: { id: scheduleId } });
}

/**
 * Create a medication with schedules inside a transaction for all-or-nothing behavior.
 * If the medication already exists (by userId and name), it is reused. Schedules are deduplicated.
 */
export async function createMedicationWithSchedules(
  userId: string,
  medication: MedicationInput,
  schedules: MedicationScheduleInput[] = []
): Promise<MedicationWithSchedules> {
  try {
    // In dev, assert that the user exists before proceeding; in production this is cheap check
    await assertUserExists(userId);
    const result = await prisma.$transaction(async (tx) => {
      // find or create medication
      let med = await tx.medication.findFirst({ where: { userId, name: medication.name } });
      if (!med) {
        med = await tx.medication.create({ data: { userId, name: medication.name } });
      }

      const createdSchedules: MedicationScheduleData[] = [];
      for (const s of schedules) {
        const existing = await tx.medicationSchedule.findFirst({
          where: { medicationId: med.id, timeSlot: s.timeSlot, frequency: s.frequency, timing: s.timing },
        });
        if (existing) {
          createdSchedules.push({
            id: existing.id,
            medicationId: existing.medicationId,
            timeSlot: existing.timeSlot,
            frequency: existing.frequency,
            timing: existing.timing,
            note: existing.note,
            createdAt: existing.createdAt,
            updatedAt: existing.updatedAt,
          });
          continue;
        }
        const created = await tx.medicationSchedule.create({
          data: {
            medicationId: med.id,
            timeSlot: s.timeSlot,
            frequency: s.frequency,
            timing: s.timing,
            note: s.note || null,
          },
        });
        createdSchedules.push({
          id: created.id,
          medicationId: created.medicationId,
          timeSlot: created.timeSlot,
          frequency: created.frequency,
          timing: created.timing,
          note: created.note,
          createdAt: created.createdAt,
          updatedAt: created.updatedAt,
        });
      }

      return {
        id: med.id,
        userId: med.userId,
        name: med.name,
        schedules: createdSchedules,
        createdAt: med.createdAt,
        updatedAt: med.updatedAt,
      };
    });

    return result;
  } catch (err) {
    // Log full error details on the server, return a safe error to the caller
    // eslint-disable-next-line no-console
    console.error("createMedicationWithSchedules transaction failed:", err);
    const { DatabaseError } = await import("@/lib/errors");
    throw new DatabaseError("Failed to create medication and schedules");
  }
}

// === Awareness Summary (neutral, no medical logic) ===

export interface AwarenessSummaryData {
  userId: string;
  totalConditions: number;
  totalMedications: number;
  totalSchedules: number;
  lastUpdated: Date;
}

/**
 * Get a neutral awareness summary (counts only, no medical recommendations)
 * Used by dashboards/views to display user's monitoring state
 */
export async function getAwarenessSummary(userId: string): Promise<AwarenessSummaryData> {
  const [conditionsCount, medicationsCount, schedulesCount] = await Promise.all([
    prisma.diagnosedCondition.count({ where: { userId } }),
    prisma.medication.count({ where: { userId } }),
    prisma.medicationSchedule.count({
      where: { medication: { userId } },
    }),
  ]);

  const summary = {
    userId,
    totalConditions: conditionsCount,
    totalMedications: medicationsCount,
    totalSchedules: schedulesCount,
    lastUpdated: new Date(),
  };

  // Assert summary data validity; in production this will only log if something odd appears
  assertAwarenessDataValid({ totalMedications: summary.totalMedications, totalSchedules: summary.totalSchedules });

  return {
    userId,
    totalConditions: conditionsCount,
    totalMedications: medicationsCount,
    totalSchedules: schedulesCount,
    lastUpdated: new Date(),
  };
}

// === Query functions for reading data ===

export interface UserWithRelations {
  id: string;
  conditions: DiagnosedConditionData[];
  medications: MedicationData[];
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Get user with all related conditions and medications
 */
export async function getUserWithRelations(userId: string): Promise<UserWithRelations | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      conditions: true,
      medications: true,
    },
  });

  if (!user) return null;

  return {
    id: user.id,
    conditions: user.conditions.map((c) => ({
      id: c.id,
      userId: c.userId,
      name: c.name,
      note: c.note,
      createdAt: c.createdAt,
      updatedAt: c.updatedAt,
    })),
    medications: user.medications.map((m) => ({
      id: m.id,
      userId: m.userId,
      name: m.name,
      createdAt: m.createdAt,
      updatedAt: m.updatedAt,
    })),
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

export interface MedicationWithSchedules {
  id: string;
  userId: string;
  name: string;
  schedules: MedicationScheduleData[];
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Get a single medication with all schedules
 */
export async function getMedicationWithSchedules(
  medicationId: string
): Promise<MedicationWithSchedules | null> {
  // Defensive guard: avoid Prisma validation error when id is undefined/empty
  if (!medicationId || typeof medicationId !== "string" || medicationId.trim().length === 0) {
    return null;
  }
  const medication = await prisma.medication.findUnique({
    where: { id: medicationId },
    include: { schedules: true },
  });

  if (!medication) return null;

  return {
    id: medication.id,
    userId: medication.userId,
    name: medication.name,
    schedules: medication.schedules.map((s) => ({
      id: s.id,
      medicationId: s.medicationId,
      timeSlot: s.timeSlot,
      frequency: s.frequency,
      timing: s.timing,
      note: s.note,
      createdAt: s.createdAt,
      updatedAt: s.updatedAt,
    })),
    createdAt: medication.createdAt,
    updatedAt: medication.updatedAt,
  };
}

/**
 * Delete a medication and all associated schedules in a single transaction.
 * Enforces ownership and returns the deleted medication name for confirmation messaging.
 */
export async function deleteMedicationAndSchedules(
  userId: string,
  medicationId: string
): Promise<string | null> {
  if (!medicationId || medicationId.trim().length === 0) {
    return null;
  }

  const med = await prisma.medication.findUnique({
    where: { id: medicationId },
    include: { schedules: true },
  });

  if (!med || med.userId !== userId) {
    // Idempotent safe failure: not found or unauthorized
    throw new Error("Medication not found or not accessible");
  }

  const deletedName = med.name;

  await prisma.$transaction(async (tx) => {
    await tx.medicationSchedule.deleteMany({ where: { medicationId: med.id } });
    await tx.medication.delete({ where: { id: med.id } });
  });

  return deletedName;
}

/**
 * Wipe all user data (medications, schedules, conditions) in a transaction.
 * Used for both reset and account deletion flows.
 * Enforces ownership and is idempotent.
 */
export async function wipeUserData(userId: string): Promise<void> {
  if (!userId || userId.trim().length === 0) {
    const { ValidationError } = await import("@/lib/errors");
    throw new ValidationError(["Invalid user identifier"]);
  }

  // Verify user exists
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    const { ValidationError } = await import("@/lib/errors");
    throw new ValidationError(["User not found"]);
  }

  // Delete all data in transaction (order matters for FK constraints)
  await prisma.$transaction(async (tx) => {
    // Delete all medication schedules first
    await tx.medicationSchedule.deleteMany({ where: { medication: { userId } } });
    // Delete all medications
    await tx.medication.deleteMany({ where: { userId } });
    // Delete all conditions
    await tx.diagnosedCondition.deleteMany({ where: { userId } });
  });
}

/**
 * Delete a user account entirely.
 * First wipes all user data, then deletes the user record.
 * Uses transaction for atomicity.
 */
export async function deleteUserAccount(userId: string): Promise<void> {
  if (!userId || userId.trim().length === 0) {
    const { ValidationError } = await import("@/lib/errors");
    throw new ValidationError(["Invalid user identifier"]);
  }

  // Verify user exists
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    const { ValidationError } = await import("@/lib/errors");
    throw new ValidationError(["User not found"]);
  }

  // Delete in transaction: data first, then user
  await prisma.$transaction(async (tx) => {
    // Delete all medication schedules first
    await tx.medicationSchedule.deleteMany({ where: { medication: { userId } } });
    // Delete all medications
    await tx.medication.deleteMany({ where: { userId } });
    // Delete all conditions
    await tx.diagnosedCondition.deleteMany({ where: { userId } });
    // Delete the user
    await tx.user.delete({ where: { id: userId } });
  });
}

// === Medication Intake (Immutable Logs) ===

export interface IntakeLogData {
  id: string;
  userId: string;
  medicationId: string;
  scheduleId: string;
  scheduledTime: TimeSlot;
  actualTime: Date | null;
  status: PrismaIntakeStatus;
  observation: string | null;
  logDate: string;
  createdAt: Date;
}

function todayDateStringUTC(): string {
  // YYYY-MM-DD derived from UTC ISO timestamp
  return new Date().toISOString().slice(0, 10);
}

/**
 * Check if an intake log exists for a schedule for today (UTC date string)
 */
export async function hasIntakeLogForToday(scheduleId: string, dateString: string = todayDateStringUTC()): Promise<boolean> {
  if (!scheduleId || scheduleId.trim().length === 0) return false;
  const existing = await prisma.medicationIntakeLog.findFirst({ where: { scheduleId, logDate: dateString } });
  return !!existing;
}

/**
 * Create an immutable intake log entry. Enforces ownership and per-day uniqueness.
 */
export async function createMedicationIntakeLog(options: {
  userId: string;
  medicationId: string;
  scheduleId: string;
  status: PrismaIntakeStatus;
  observation?: string;
  actualTime?: Date | null;
}): Promise<IntakeLogData> {
  const { userId, medicationId, scheduleId, status } = options;

  if (!userId || !medicationId || !scheduleId) {
    const { ValidationError } = await import("@/lib/errors");
    throw new ValidationError(["Missing identifiers for intake log creation"]);
  }

  // Fetch schedule with medication to enforce ownership and derive scheduledTime
  const schedule = await prisma.medicationSchedule.findUnique({
    where: { id: scheduleId },
    include: { medication: true },
  });

  if (!schedule || schedule.medicationId !== medicationId || schedule.medication.userId !== userId) {
    const { ValidationError } = await import("@/lib/errors");
    throw new ValidationError(["Schedule not found or not accessible"]);
  }

  const logDate = todayDateStringUTC();
  const existing = await prisma.medicationIntakeLog.findFirst({ where: { scheduleId, logDate } });
  if (existing) {
    const { ValidationError } = await import("@/lib/errors");
    throw new ValidationError(["Already logged today"]);
  }

  const created = await prisma.medicationIntakeLog.create({
    data: {
      userId,
      medicationId,
      scheduleId,
      scheduledTime: schedule.timeSlot,
      actualTime: options.actualTime ?? null,
      status,
      observation: options.observation?.trim() || null,
      logDate,
    },
  });

  return {
    id: created.id,
    userId: created.userId,
    medicationId: created.medicationId,
    scheduleId: created.scheduleId,
    scheduledTime: created.scheduledTime,
    actualTime: created.actualTime ?? null,
    status: created.status,
    observation: created.observation ?? null,
    logDate: created.logDate,
    createdAt: created.createdAt,
  };
}

export interface UserScheduleLogStatus {
  scheduleId: string;
  medicationId: string;
  medicationName: string;
  timeSlot: TimeSlot;
  frequency: string;
  timing: string;
  note: string | null;
  alreadyLoggedToday: boolean;
}

/**
 * Get all schedules for the user along with whether intake has been logged today.
 */
export async function getUserSchedulesWithLogStatus(userId: string): Promise<UserScheduleLogStatus[]> {
  if (!userId || userId.trim().length === 0) return [];

  const schedules = await prisma.medicationSchedule.findMany({
    where: { medication: { userId } },
    include: { medication: true },
    orderBy: { createdAt: "asc" },
  });

  const dateString = todayDateStringUTC();
  const results: UserScheduleLogStatus[] = [];
  for (const s of schedules) {
    const existing = await prisma.medicationIntakeLog.findFirst({ where: { scheduleId: s.id, logDate: dateString } });
    results.push({
      scheduleId: s.id,
      medicationId: s.medicationId,
      medicationName: s.medication.name,
      timeSlot: s.timeSlot,
      frequency: s.frequency,
      timing: s.timing,
      note: s.note ?? null,
      alreadyLoggedToday: !!existing,
    });
  }
  return results;
}

// === Awareness Snapshots (AI-derived) ===

export interface AwarenessSnapshotData {
  id: string;
  userId: string;
  timeWindow: string;
  medicationPatterns: string; // JSON string
  adherenceSignals: string; // JSON string
  observationAssociations: string; // JSON string
  dataSufficiency: boolean;
  generatedAt: Date;
  createdAt: Date;
}

/**
 * Save or replace an awareness snapshot for a user and time window.
 * Treats as derived state: entirely replaceable.
 */
export async function saveAwarenessSnapshot(options: {
  userId: string;
  timeWindow: string;
  medicationPatterns: string;
  adherenceSignals: string;
  observationAssociations: string;
  dataSufficiency: boolean;
}): Promise<AwarenessSnapshotData> {
  const { userId, timeWindow } = options;

  const existing = await prisma.awarenessSnapshot.findUnique({
    where: { userId_timeWindow: { userId, timeWindow } },
  });

  if (existing) {
    const updated = await prisma.awarenessSnapshot.update({
      where: { id: existing.id },
      data: {
        medicationPatterns: options.medicationPatterns,
        adherenceSignals: options.adherenceSignals,
        observationAssociations: options.observationAssociations,
        dataSufficiency: options.dataSufficiency,
        generatedAt: new Date(),
      },
    });
    return {
      id: updated.id,
      userId: updated.userId,
      timeWindow: updated.timeWindow,
      medicationPatterns: updated.medicationPatterns,
      adherenceSignals: updated.adherenceSignals,
      observationAssociations: updated.observationAssociations,
      dataSufficiency: updated.dataSufficiency,
      generatedAt: updated.generatedAt,
      createdAt: updated.createdAt,
    };
  }

  const created = await prisma.awarenessSnapshot.create({
    data: {
      userId,
      timeWindow,
      medicationPatterns: options.medicationPatterns,
      adherenceSignals: options.adherenceSignals,
      observationAssociations: options.observationAssociations,
      dataSufficiency: options.dataSufficiency,
    },
  });

  return {
    id: created.id,
    userId: created.userId,
    timeWindow: created.timeWindow,
    medicationPatterns: created.medicationPatterns,
    adherenceSignals: created.adherenceSignals,
    observationAssociations: created.observationAssociations,
    dataSufficiency: created.dataSufficiency,
    generatedAt: created.generatedAt,
    createdAt: created.createdAt,
  };
}

/**
 * Retrieve the latest awareness snapshot for a user and time window.
 */
export async function getLatestSnapshot(
  userId: string,
  timeWindow: string
): Promise<AwarenessSnapshotData | null> {
  const snapshot = await prisma.awarenessSnapshot.findUnique({
    where: { userId_timeWindow: { userId, timeWindow } },
  });

  if (!snapshot) return null;

  return {
    id: snapshot.id,
    userId: snapshot.userId,
    timeWindow: snapshot.timeWindow,
    medicationPatterns: snapshot.medicationPatterns,
    adherenceSignals: snapshot.adherenceSignals,
    observationAssociations: snapshot.observationAssociations,
    dataSufficiency: snapshot.dataSufficiency,
    generatedAt: snapshot.generatedAt,
    createdAt: snapshot.createdAt,
  };
}

/**
 * Get all intake logs for a user within a date range.
 */
export async function getMedicationIntakeLogsForUser(userId: string, startDate: Date, endDate: Date) {
  const startStr = startDate.toISOString().slice(0, 10);
  const endStr = endDate.toISOString().slice(0, 10);
  const logs = await prisma.medicationIntakeLog.findMany({
    where: { userId, logDate: { gte: startStr, lte: endStr } },
    orderBy: { logDate: "asc" },
  });
  return logs;
}

/**
 * Get all intake logs for a user within a date range.
 */
export async function getMedicationIntakeLogs(userId: string, startDate: Date, endDate: Date) {
  return getMedicationIntakeLogsForUser(userId, startDate, endDate);
}

/**
 * Delete all awareness snapshots for a user.
 */
export async function deleteSnapshotsForUser(userId: string): Promise<void> {
  await prisma.awarenessSnapshot.deleteMany({ where: { userId } });
}


