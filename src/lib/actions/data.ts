"use server";

import {
  validateDiagnosedConditionInput,
  validateMedicationInput,
  validateMedicationScheduleInput,
} from "@/lib/validation/inputSchemas";
import {
  addDiagnosedCondition,
  addMedication,
  addMedicationSchedule,
  createUserWithInitialData,
  createMedicationWithSchedules,
} from "@/lib/data/persistence";
import { ValidationError, mapToSafeError, ServiceError } from "@/lib/errors";

// Centralized server actions for data writes with validation

export async function createConditionAction(userId: string, payload: unknown) {
  const validation = validateDiagnosedConditionInput(payload);
  if (!validation.ok) {
    throw new ValidationError(validation.errors);
  }

  try {
    return await addDiagnosedCondition(userId, validation.value);
  } catch (err) {
    throw mapToSafeError(err, "Failed to create condition");
  }
}

export async function createMedicationAction(userId: string, payload: unknown) {
  const validation = validateMedicationInput(payload);
  if (!validation.ok) {
    throw new ValidationError(validation.errors);
  }

  try {
    return await addMedication(userId, validation.value);
  } catch (err) {
    throw mapToSafeError(err, "Failed to create medication");
  }
}

export async function createScheduleAction(medicationId: string, payload: unknown) {
  const validation = validateMedicationScheduleInput(payload);
  if (!validation.ok) {
    throw new ValidationError(validation.errors);
  }

  try {
    return await addMedicationSchedule(medicationId, validation.value);
  } catch (err) {
    throw mapToSafeError(err, "Failed to create schedule");
  }
}

export async function createUserWithInitialDataAction(options: unknown) {
  if (typeof options !== "object" || options === null) {
    throw new ValidationError(["options must be an object"]);
  }

  const opts = options as Record<string, unknown>;

  const conditionsRaw = Array.isArray(opts.conditions) ? opts.conditions : undefined;
  const medicationsRaw = Array.isArray(opts.medications) ? opts.medications : undefined;

  const validatedConditions = [] as Array<{ name: string; note?: string }>;
  if (conditionsRaw) {
    for (const c of conditionsRaw) {
      const v = validateDiagnosedConditionInput(c);
      if (!v.ok) throw new ValidationError(v.errors);
      validatedConditions.push(v.value);
    }
  }

  const validatedMedications: Array<{ name: string; schedules?: any[] }> = [];
  if (medicationsRaw) {
    for (const m of medicationsRaw) {
      const mv = validateMedicationInput(m);
      if (!mv.ok) throw new ValidationError(mv.errors);

      const schedulesRaw = Array.isArray((m as Record<string, unknown>).schedules)
        ? ((m as Record<string, unknown>).schedules as unknown[])
        : undefined;

      const validatedSchedules: Array<{
        timeSlot: any;
        frequency: string;
        timing: string;
        note?: string;
      }> = [];

      if (schedulesRaw) {
        for (const s of schedulesRaw) {
          const sv = validateMedicationScheduleInput(s);
          if (!sv.ok) throw new ValidationError(sv.errors);
          validatedSchedules.push(sv.value);
        }
      }

      validatedMedications.push({ name: mv.value.name, schedules: validatedSchedules });
    }
  }

  try {
    // Call persistence transactional helper
    return await createUserWithInitialData({
      user: undefined,
      conditions: validatedConditions,
      medications: validatedMedications.map((m) => ({ name: m.name, schedules: m.schedules })),
    });
  } catch (err) {
    throw mapToSafeError(err, "Failed to create user and initial data");
  }
}

export async function createMedicationWithSchedulesAction(userId: string, medication: unknown, schedules: unknown[]) {
  const mv = validateMedicationInput(medication);
  if (!mv.ok) throw new ValidationError(mv.errors);

  const validatedSchedules = [] as any[];
  for (const s of schedules ?? []) {
    const sv = validateMedicationScheduleInput(s);
    if (!sv.ok) throw new ValidationError(sv.errors);
    validatedSchedules.push(sv.value);
  }

  try {
    return await createMedicationWithSchedules(userId, mv.value, validatedSchedules);
  } catch (err) {
    throw mapToSafeError(err, "Failed to create medication and schedules");
  }
}
