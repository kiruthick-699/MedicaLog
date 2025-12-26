/**
 * Data access layer: persistence functions for chronic care monitoring
 * Server-only, no React or UI imports
 * Returns plain JS/TS objects
 */

import { TimeSlot, type User, type DiagnosedCondition, type Medication, type MedicationSchedule } from "@prisma/client";
import prisma from "./prisma";

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
