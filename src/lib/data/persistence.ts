/**
 * Data access layer: persistence functions for chronic care monitoring
 * Server-only, no React or UI imports
 * Returns plain JS/TS objects
 */

import { TimeSlot, type User, type DiagnosedCondition, type Medication, type MedicationSchedule } from "@prisma/client";
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
