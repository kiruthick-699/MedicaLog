"use server";

import { requireUser } from "@/lib/server/auth";
import {
  getMedicationWithSchedules,
  getMedicationScheduleWithOwnership,
  updateMedicationName,
  updateMedicationSchedule,
  deleteMedicationSchedule,
  deleteMedicationAndSchedules,
  addMedication,
  addMedicationSchedule,
} from "@/lib/data/persistence";
import {
  TimeSlot,
  validateMedicationName,
  validateTimeSlot,
  validateFrequency,
  validateTiming,
  validateNote,
  validateIntakeStatus,
} from "@/lib/validation/inputSchemas";
import { mapToSafeError, ValidationError } from "@/lib/errors";
import { redirect } from "next/navigation";

export interface AddMedicationInput {
  name: string;
}

export interface AddMedicationResult {
  ok: boolean;
  errors?: string[];
}

/**
 * Add a new medication for the authenticated user
 */
export async function addMedicationAction(input: AddMedicationInput): Promise<AddMedicationResult> {
  const user = await requireUser({ onFail: "throw" });

  if (!input || typeof input !== "object") {
    return { ok: false, errors: ["Invalid input"] };
  }

  const nameValidation = validateMedicationName(input.name);
  if (!nameValidation.ok) {
    return { ok: false, errors: nameValidation.errors };
  }

  try {
    const medication = await addMedication(user.id, { name: nameValidation.value });
    
    // Success: redirect to the new medication detail page
    redirect(`/medications/${medication.id}?added=1`);
  } catch (err) {
    const safe = mapToSafeError(err, "Failed to add medication");
    return { ok: false, errors: [safe.message] };
  }
}

// === Intake Logging (Immutable) ===

export interface LogMedicationIntakeInput {
  medicationId: string;
  scheduleId: string;
  status: "TAKEN" | "MISSED";
  observation?: string;
  redirectTo?: string; // optional path to redirect after success
}

export interface LogMedicationIntakeResult {
  ok: boolean;
  errors?: string[];
}

import { createMedicationIntakeLog, getMedicationScheduleWithOwnership as getScheduleForOwnership, hasIntakeLogForToday } from "@/lib/data/persistence";

/**
 * Create an immutable intake log with ownership/uniqueness enforcement.
 */
export async function logMedicationIntakeAction(input: LogMedicationIntakeInput): Promise<LogMedicationIntakeResult> {
  const user = await requireUser({ onFail: "throw" });

  if (!input || typeof input !== "object") {
    return { ok: false, errors: ["Invalid input"] };
  }

  const errors: string[] = [];
  const statusValidation = validateIntakeStatus(input.status);
  if (!statusValidation.ok) {
    errors.push(...statusValidation.errors);
  }
  const observationValidation = validateNote(input.observation, 300);
  if (!observationValidation.ok) {
    errors.push(...observationValidation.errors);
  }

  if (!input.medicationId || input.medicationId.trim().length === 0) {
    errors.push("Medication identifier is required");
  }
  if (!input.scheduleId || input.scheduleId.trim().length === 0) {
    errors.push("Schedule identifier is required");
  }

  if (errors.length > 0) {
    return { ok: false, errors };
  }

  try {
    const schedule = await getScheduleForOwnership(input.scheduleId);
    if (!schedule || schedule.medicationId !== input.medicationId || schedule.medication.userId !== user.id) {
      return { ok: false, errors: ["Medication schedule not found or not accessible"] };
    }

    const already = await hasIntakeLogForToday(input.scheduleId);
    if (already) {
      return { ok: false, errors: ["Already logged today"] };
    }

    const statusVal = statusValidation.ok ? statusValidation.value : "TAKEN";
    await createMedicationIntakeLog({
      userId: user.id,
      medicationId: input.medicationId,
      scheduleId: input.scheduleId,
      status: statusVal,
      observation: observationValidation.ok ? observationValidation.value : undefined,
      actualTime: null,
    });

    const to = input.redirectTo || `/medications/${input.medicationId}?intakeLogged=1`;
    redirect(to);
  } catch (err) {
    const safe = mapToSafeError(err, "Failed to log intake");
    return { ok: false, errors: [safe.message] };
  }
}

export interface EditMedicationNameInput {
  medicationId: string;
  name: string;
}

export interface EditMedicationNameResult {
  ok: boolean;
  errors?: string[];
}

export async function editMedicationNameAction(input: EditMedicationNameInput): Promise<EditMedicationNameResult> {
  const user = await requireUser({ onFail: "throw" });

  if (!input || typeof input !== "object") {
    return { ok: false, errors: ["Invalid input"] };
  }

  const nameValidation = validateMedicationName(input.name);
  if (!nameValidation.ok) {
    return { ok: false, errors: nameValidation.errors };
  }

  try {
    // Enforce ownership and existence via persistence
    const med = await getMedicationWithSchedules(input.medicationId);
    if (!med || med.userId !== user.id) {
      throw new ValidationError(["Medication not found or not accessible"]);
    }

    // Idempotency: if unchanged, redirect with confirmation
    if (med.name === nameValidation.value) {
      redirect(`/medications/${med.id}?updated=1`);
    }

    await updateMedicationName(user.id, med.id, nameValidation.value);

    // Success: redirect to detail view with confirmation
    redirect(`/medications/${med.id}?updated=1`);
  } catch (err) {
    const safe = mapToSafeError(err, "Failed to update medication name");
    return { ok: false, errors: [safe.message] };
  }
}

export interface DeleteMedicationInput {
  medicationId: string;
}

export interface DeleteMedicationResult {
  ok: boolean;
  errors?: string[];
}

export interface AddMedicationScheduleInput {
  medicationId: string;
  timeSlot: TimeSlot;
  frequency: string;
  timing: string;
  note?: string;
}

export interface AddMedicationScheduleResult {
  ok: boolean;
  errors?: string[];
}

/**
 * Add a medication schedule with validation and ownership enforcement
 */
export async function addMedicationScheduleAction(
  input: AddMedicationScheduleInput
): Promise<AddMedicationScheduleResult> {
    const user = await requireUser({ onFail: "throw" });

    if (!input || typeof input !== "object") {
      return { ok: false, errors: ["Invalid input"] };
    }

    const errors: string[] = [];

    if (!validateTimeSlot(input.timeSlot)) {
      errors.push("Time slot is required and must be one of Morning, Afternoon, Evening, or Night");
    }

    const frequencyValidation = validateFrequency(input.frequency);
    if (!frequencyValidation.ok) {
      errors.push(...frequencyValidation.errors);
    }

    const timingValidation = validateTiming(input.timing);
    if (!timingValidation.ok) {
      errors.push(...timingValidation.errors);
    }

    const noteValidation = validateNote(input.note);
    if (!noteValidation.ok) {
      errors.push(...noteValidation.errors);
    }

    if (errors.length > 0) {
      return { ok: false, errors };
    }

    try {
      const med = await getMedicationWithSchedules(input.medicationId);
      if (!med || med.userId !== user.id) {
        return { ok: false, errors: ["Medication not found or not accessible"] };
      }

      await addMedicationSchedule(input.medicationId, {
        timeSlot: input.timeSlot,
        frequency: frequencyValidation.ok ? frequencyValidation.value : input.frequency,
        timing: timingValidation.ok ? timingValidation.value : input.timing,
        note: noteValidation.ok ? noteValidation.value : undefined,
        // attach user id for ownership assertion helper in dev
        userId: user.id,
      } as any);

      redirect(`/medications/${input.medicationId}?scheduleAdded=1`);
    } catch (err) {
      const safe = mapToSafeError(err, "Failed to add schedule");
      return { ok: false, errors: [safe.message] };
    }
  }

/**
 * Delete a medication and its schedules (destructive). Enforces ownership, uses transaction, idempotent failure.
 */
export async function deleteMedicationAction(input: DeleteMedicationInput): Promise<DeleteMedicationResult> {
  const user = await requireUser({ onFail: "throw" });

  if (!input || typeof input !== "object" || !input.medicationId || input.medicationId.trim().length === 0) {
    return { ok: false, errors: ["Invalid input"] };
  }

  try {
    const med = await getMedicationWithSchedules(input.medicationId);
    if (!med || med.userId !== user.id) {
      // Idempotent-safe: missing or unauthorized
      return { ok: false, errors: ["Medication not found or not accessible"] };
    }

    const deletedName = await deleteMedicationAndSchedules(user.id, med.id);

    // Success: redirect to Manage Medications with a calm confirmation indicator
    const nameParam = encodeURIComponent(deletedName ?? "Medication");
    redirect(`/medications?deleted=1&name=${nameParam}`);
  } catch (err) {
    const safe = mapToSafeError(err, "Failed to delete medication");
    return { ok: false, errors: [safe.message] };
  }
}

export interface EditMedicationScheduleInput {
  medicationId: string;
  scheduleId: string;
  timeSlot: TimeSlot;
  frequency: string;
  timing: string;
  note?: string;
}

export interface EditMedicationScheduleResult {
  ok: boolean;
  errors?: string[];
}

/**
 * Update a medication schedule with full server-side validation and ownership enforcement.
 */
export async function editMedicationScheduleAction(
  input: EditMedicationScheduleInput
): Promise<EditMedicationScheduleResult> {
  const user = await requireUser({ onFail: "throw" });

  if (!input || typeof input !== "object") {
    return { ok: false, errors: ["Invalid input"] };
  }

  const errors: string[] = [];

  if (!validateTimeSlot(input.timeSlot)) {
    errors.push("Time slot is required and must be one of Morning, Afternoon, Evening, or Night");
  }

  const frequencyValidation = validateFrequency(input.frequency);
  if (!frequencyValidation.ok) {
    errors.push(...frequencyValidation.errors);
  }

  const timingValidation = validateTiming(input.timing);
  if (!timingValidation.ok) {
    errors.push(...timingValidation.errors);
  }

  const noteValidation = validateNote(input.note);
  if (!noteValidation.ok) {
    errors.push(...noteValidation.errors);
  }

  if (errors.length > 0) {
    return { ok: false, errors };
  }

  try {
    const schedule = await getMedicationScheduleWithOwnership(input.scheduleId);
    if (!schedule || schedule.medicationId !== input.medicationId || schedule.medication.userId !== user.id) {
      return { ok: false, errors: ["Medication schedule not found or not accessible"] };
    }

    await updateMedicationSchedule(user.id, input.medicationId, input.scheduleId, {
      timeSlot: input.timeSlot,
      frequency: frequencyValidation.ok ? frequencyValidation.value : input.frequency,
      timing: timingValidation.ok ? timingValidation.value : input.timing,
      note: noteValidation.ok ? noteValidation.value : undefined,
    });

    redirect(`/medications/${input.medicationId}?scheduleUpdated=1`);
  } catch (err) {
    const safe = mapToSafeError(err, "Failed to update schedule");
    return { ok: false, errors: [safe.message] };
  }
}

export interface DeleteMedicationScheduleInput {
  medicationId: string;
  scheduleId: string;
}

export interface DeleteMedicationScheduleResult {
  ok: boolean;
  errors?: string[];
}

/**
 * Delete a medication schedule (destructive) with ownership enforcement.
 */
export async function deleteMedicationScheduleAction(
  input: DeleteMedicationScheduleInput
): Promise<DeleteMedicationScheduleResult> {
  const user = await requireUser({ onFail: "throw" });

  if (!input || typeof input !== "object") {
    return { ok: false, errors: ["Invalid input"] };
  }

  try {
    const schedule = await getMedicationScheduleWithOwnership(input.scheduleId);
    if (!schedule || schedule.medicationId !== input.medicationId || schedule.medication.userId !== user.id) {
      return { ok: false, errors: ["Medication schedule not found or not accessible"] };
    }

    await deleteMedicationSchedule(user.id, input.medicationId, input.scheduleId);

    redirect(`/medications/${input.medicationId}?scheduleDeleted=1`);
  } catch (err) {
    const safe = mapToSafeError(err, "Failed to delete schedule");
    return { ok: false, errors: [safe.message] };
  }
}
