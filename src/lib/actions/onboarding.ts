"use server";

import { requireUser } from "@/lib/server/auth";
import {
  validateDiagnosedConditionInput,
  validateMedicationInput,
  validateMedicationScheduleInput,
  type MedicationValidationInput,
  type MedicationScheduleValidationInput,
} from "@/lib/validation/inputSchemas";
import { addDiagnosedCondition, createMedicationWithSchedules } from "@/lib/data/persistence";
import { ValidationError, mapToSafeError } from "@/lib/errors";

export interface OnboardingSubmitInput {
  conditions?: Array<{ name: string; note?: string }>;
  medications?: Array<{
    name: string;
    schedule: {
      timeSlot: any;
      frequency: string;
      timing: string;
      note?: string;
    };
  }>;
}

export async function onboardingSubmit(input: unknown) {
  const user = await requireUser({ onFail: "throw" });

  if (typeof input !== "object" || input === null) {
    throw new ValidationError(["Input must be an object"]);
  }

  const payload = input as OnboardingSubmitInput;

  // Validate optional conditions
  const validatedConditions: Array<{ name: string; note?: string }> = [];
  if (payload.conditions) {
    if (!Array.isArray(payload.conditions)) {
      throw new ValidationError(["conditions must be an array"]);
    }
    for (const cond of payload.conditions) {
      const v = validateDiagnosedConditionInput(cond);
      if (!v.ok) throw new ValidationError(v.errors);
      validatedConditions.push(v.value);
    }
  }

  // Validate medications + schedule(s) (at least one required)
  if (!payload.medications || !Array.isArray(payload.medications) || payload.medications.length === 0) {
    throw new ValidationError(["At least one medication is required"]);
  }

  const validatedMedications: Array<{
    medication: MedicationValidationInput;
    schedule: MedicationScheduleValidationInput;
  }> = [];

  for (const med of payload.medications) {
    const medValidation = validateMedicationInput(med);
    if (!medValidation.ok) throw new ValidationError(medValidation.errors);

    const scheduleValidation = validateMedicationScheduleInput(med?.schedule as unknown);
    if (!scheduleValidation.ok) throw new ValidationError(scheduleValidation.errors);

    validatedMedications.push({ medication: medValidation.value, schedule: scheduleValidation.value });
  }

  try {
    // Persist conditions (optional)
    for (const c of validatedConditions) {
      await addDiagnosedCondition(user.id, c);
    }

    // Persist medications with their schedules
    for (const item of validatedMedications) {
      await createMedicationWithSchedules(user.id, item.medication, [item.schedule]);
    }

    return { ok: true };
  } catch (err) {
    throw mapToSafeError(err, "Failed to save onboarding data");
  }
}
