/**
 * Validation schemas for chronic care monitoring system
 * Pure TypeScript validation utilities - no external dependencies
 */

import type {
  MedicationFrequency,
  TimeSlot,
  MedicationRoutine,
  DiagnosedCondition,
  PatientProfile,
  MedicationAdherenceEntry,
} from "./models";

/**
 * Validates a time slot
 */
export function validateTimeSlot(slot: unknown): slot is TimeSlot {
  if (typeof slot !== "object" || slot === null) return false;

  const s = slot as Record<string, unknown>;

  return (
    typeof s.hour === "number" &&
    s.hour >= 0 &&
    s.hour <= 23 &&
    typeof s.minute === "number" &&
    s.minute >= 0 &&
    s.minute <= 59 &&
    (s.label === undefined || typeof s.label === "string")
  );
}

/**
 * Validates medication frequency
 */
export function validateMedicationFrequency(
  value: unknown
): value is MedicationFrequency {
  const validFrequencies: MedicationFrequency[] = [
    "once-daily",
    "twice-daily",
    "three-times-daily",
    "four-times-daily",
    "every-12-hours",
    "every-8-hours",
    "every-6-hours",
    "as-needed",
  ];

  return typeof value === "string" && validFrequencies.includes(value as MedicationFrequency);
}

/**
 * Validates a medication routine
 */
export function validateMedicationRoutine(
  routine: unknown
): routine is MedicationRoutine {
  if (typeof routine !== "object" || routine === null) return false;

  const r = routine as Record<string, unknown>;

  return (
    typeof r.id === "string" &&
    r.id.length > 0 &&
    typeof r.name === "string" &&
    r.name.length > 0 &&
    validateMedicationFrequency(r.frequency) &&
    Array.isArray(r.timeSlots) &&
    r.timeSlots.every(validateTimeSlot) &&
    r.timeSlots.length > 0 &&
    typeof r.timing === "object" &&
    r.timing !== null &&
    r.createdAt instanceof Date &&
    r.updatedAt instanceof Date &&
    (r.note === undefined || typeof r.note === "string")
  );
}

/**
 * Validates a diagnosed condition
 */
export function validateDiagnosedCondition(
  condition: unknown
): condition is DiagnosedCondition {
  if (typeof condition !== "object" || condition === null) return false;

  const c = condition as Record<string, unknown>;

  return (
    typeof c.id === "string" &&
    c.id.length > 0 &&
    typeof c.name === "string" &&
    c.name.length > 0 &&
    c.dateOfDiagnosis instanceof Date &&
    (c.icdCode === undefined || typeof c.icdCode === "string") &&
    (c.notes === undefined || typeof c.notes === "string")
  );
}

/**
 * Validates a patient profile
 */
export function validatePatientProfile(
  profile: unknown
): profile is PatientProfile {
  if (typeof profile !== "object" || profile === null) return false;

  const p = profile as Record<string, unknown>;

  return (
    typeof p.id === "string" &&
    p.id.length > 0 &&
    typeof p.name === "string" &&
    p.name.length > 0 &&
    p.dateOfBirth instanceof Date &&
    Array.isArray(p.medications) &&
    p.medications.every(validateMedicationRoutine) &&
    (p.conditions === undefined ||
      (Array.isArray(p.conditions) &&
        p.conditions.every(validateDiagnosedCondition))) &&
    (p.emergencyContact === undefined ||
      (typeof p.emergencyContact === "object" &&
        p.emergencyContact !== null &&
        validateEmergencyContact(p.emergencyContact))) &&
    p.createdAt instanceof Date &&
    p.updatedAt instanceof Date
  );
}

/**
 * Validates an emergency contact
 */
function validateEmergencyContact(contact: unknown): boolean {
  if (typeof contact !== "object" || contact === null) return false;

  const c = contact as Record<string, unknown>;

  return (
    typeof c.name === "string" &&
    c.name.length > 0 &&
    typeof c.relationship === "string" &&
    c.relationship.length > 0 &&
    typeof c.phoneNumber === "string" &&
    c.phoneNumber.length > 0
  );
}

/**
 * Validates a medication adherence entry
 */
export function validateMedicationAdherenceEntry(
  entry: unknown
): entry is MedicationAdherenceEntry {
  if (typeof entry !== "object" || entry === null) return false;

  const e = entry as Record<string, unknown>;

  return (
    typeof e.id === "string" &&
    e.id.length > 0 &&
    typeof e.medicationRoutineId === "string" &&
    e.medicationRoutineId.length > 0 &&
    e.scheduledTime instanceof Date &&
    (e.actualTime === undefined || e.actualTime instanceof Date) &&
    typeof e.taken === "boolean" &&
    (e.notes === undefined || typeof e.notes === "string") &&
    e.createdAt instanceof Date
  );
}

/**
 * Validation error result
 */
export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

/**
 * Comprehensive validation for medication routine with detailed errors
 */
export function validateMedicationRoutineDetailed(
  routine: unknown
): ValidationResult {
  const errors: string[] = [];

  if (typeof routine !== "object" || routine === null) {
    return { valid: false, errors: ["Routine must be an object"] };
  }

  const r = routine as Record<string, unknown>;

  if (typeof r.id !== "string" || r.id.length === 0) {
    errors.push("id must be a non-empty string");
  }

  if (typeof r.name !== "string" || r.name.length === 0) {
    errors.push("name must be a non-empty string");
  }

  if (!validateMedicationFrequency(r.frequency)) {
    errors.push("frequency must be a valid MedicationFrequency");
  }

  if (!Array.isArray(r.timeSlots) || r.timeSlots.length === 0) {
    errors.push("timeSlots must be a non-empty array");
  } else if (!r.timeSlots.every(validateTimeSlot)) {
    errors.push("all timeSlots must be valid TimeSlot objects");
  }

  if (!(r.createdAt instanceof Date)) {
    errors.push("createdAt must be a Date");
  }

  if (!(r.updatedAt instanceof Date)) {
    errors.push("updatedAt must be a Date");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
