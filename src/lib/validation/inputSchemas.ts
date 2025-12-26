/**
 * Input validation schemas for persistence layer
 * Pure TypeScript (no external libs, no Prisma/React imports)
 * No medical logic, no computed health recommendations
 */

// Result type for validators
export type ValidationResult<T> = { ok: true; value: T } | { ok: false; errors: string[] };

// Mirror of Prisma TimeSlot enum without importing it
export type TimeSlot = "MORNING" | "AFTERNOON" | "EVENING" | "NIGHT";

// -------------------------
// Persistence Input Types
// -------------------------

export interface DiagnosedConditionValidationInput {
  name: string;
  note?: string;
}

export interface MedicationValidationInput {
  name: string;
}

export interface MedicationScheduleValidationInput {
  timeSlot: TimeSlot;
  frequency: string;
  timing: string;
  note?: string;
}

// -------------------------
// Generic Helper Functions
// -------------------------

function isString(value: unknown): value is string {
  return typeof value === "string";
}

function trimString(value: unknown): string | undefined {
  if (!isString(value)) return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function isNonEmptyString(value: unknown, maxLength?: number): boolean {
  if (!isString(value)) return false;
  const trimmed = value.trim();
  if (trimmed.length === 0) return false;
  if (maxLength && trimmed.length > maxLength) return false;
  return true;
}

function validateLength(value: unknown, min: number, max: number): boolean {
  if (!isString(value)) return false;
  const len = value.length;
  return len >= min && len <= max;
}

// -------------------------
// TimeSlot Validator
// -------------------------

export function validateTimeSlot(value: unknown): value is TimeSlot {
  return value === "MORNING" || value === "AFTERNOON" || value === "EVENING" || value === "NIGHT";
}

// -------------------------
// Field-Level Validators
// -------------------------

/**
 * Validate diagnosed condition name
 * Required, trimmed, max 200 chars
 */
export function validateConditionName(value: unknown): ValidationResult<string> {
  if (!isNonEmptyString(value, 200)) {
    return {
      ok: false,
      errors: ["Condition name is required and must be 1-200 characters"],
    };
  }
  return { ok: true, value: (value as string).trim() };
}

/**
 * Validate medication name
 * Required, trimmed, max 200 chars
 */
export function validateMedicationName(value: unknown): ValidationResult<string> {
  if (!isNonEmptyString(value, 200)) {
    return {
      ok: false,
      errors: ["Medication name is required and must be 1-200 characters"],
    };
  }
  return { ok: true, value: (value as string).trim() };
}

/**
 * Validate optional note field
 * Optional, trimmed, max 500 chars
 */
export function validateNote(value: unknown, maxLength: number = 500): ValidationResult<string | undefined> {
  if (value == null) {
    return { ok: true, value: undefined };
  }
  if (!isString(value)) {
    return { ok: false, errors: ["Note must be a string if provided"] };
  }
  const trimmed = value.trim();
  if (trimmed.length === 0) {
    return { ok: true, value: undefined };
  }
  if (trimmed.length > maxLength) {
    return { ok: false, errors: [`Note must not exceed ${maxLength} characters`] };
  }
  return { ok: true, value: trimmed };
}

/**
 * Validate frequency string (user-entered)
 * Required, max 100 chars
 */
export function validateFrequency(value: unknown): ValidationResult<string> {
  if (!isNonEmptyString(value, 100)) {
    return {
      ok: false,
      errors: ["Frequency is required and must be 1-100 characters"],
    };
  }
  return { ok: true, value: (value as string).trim() };
}

/**
 * Validate timing string (user-entered notes about when to take medication)
 * Required, max 200 chars
 */
export function validateTiming(value: unknown): ValidationResult<string> {
  if (!isNonEmptyString(value, 200)) {
    return {
      ok: false,
      errors: ["Timing is required and must be 1-200 characters"],
    };
  }
  return { ok: true, value: (value as string).trim() };
}

/**
 * Validate email address
 * Basic format check, max 254 chars (RFC 5321)
 */
export function validateEmail(value: unknown): ValidationResult<string> {
  if (!isNonEmptyString(value, 254)) {
    return {
      ok: false,
      errors: ["Email is required and must be a valid address"],
    };
  }
  const trimmed = (value as string).trim();
  // Basic email pattern: at least one @ and a dot after it
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailPattern.test(trimmed)) {
    return {
      ok: false,
      errors: ["Email must be a valid email address"],
    };
  }
  return { ok: true, value: trimmed };
}

/**
 * Validate password
 * Required, min 8 chars, max 100 chars (no complexity rules for now)
 */
export function validatePassword(value: unknown): ValidationResult<string> {
  if (!isString(value)) {
    return { ok: false, errors: ["Password is required"] };
  }
  if (!validateLength(value, 8, 100)) {
    return {
      ok: false,
      errors: ["Password must be between 8 and 100 characters"],
    };
  }
  return { ok: true, value: value as string };
}

// -------------------------
// Input-Level Validators (Object Shapes)
// -------------------------

/**
 * Validate DiagnosedCondition input
 * Reference-only, user-entered data, no inference
 */
export function validateDiagnosedConditionInput(
  payload: unknown
): ValidationResult<DiagnosedConditionValidationInput> {
  if (typeof payload !== "object" || payload === null) {
    return { ok: false, errors: ["Input must be an object"] };
  }

  const p = payload as Record<string, unknown>;
  const errors: string[] = [];

  // Validate name
  const nameValidation = validateConditionName(p.name);
  if (!nameValidation.ok) {
    errors.push(...nameValidation.errors);
  }

  // Validate optional note
  const noteValidation = validateNote(p.note);
  if (!noteValidation.ok) {
    errors.push(...noteValidation.errors);
  }

  if (errors.length > 0) {
    return { ok: false, errors };
  }

  // Safe to access .value after checking errors.length === 0
  return {
    ok: true,
    value: {
      name: nameValidation.ok ? nameValidation.value : "",
      note: noteValidation.ok ? noteValidation.value : undefined,
    },
  };
}

/**
 * Validate Medication input
 */
export function validateMedicationInput(
  payload: unknown
): ValidationResult<MedicationValidationInput> {
  if (typeof payload !== "object" || payload === null) {
    return { ok: false, errors: ["Input must be an object"] };
  }

  const p = payload as Record<string, unknown>;
  const errors: string[] = [];

  // Validate name
  const nameValidation = validateMedicationName(p.name);
  if (!nameValidation.ok) {
    errors.push(...nameValidation.errors);
  }

  if (errors.length > 0) {
    return { ok: false, errors };
  }

  // Safe to access .value after checking errors.length === 0
  return {
    ok: true,
    value: {
      name: nameValidation.ok ? nameValidation.value : "",
    },
  };
}

/**
 * Validate MedicationSchedule input
 */
export function validateMedicationScheduleInput(
  payload: unknown
): ValidationResult<MedicationScheduleValidationInput> {
  if (typeof payload !== "object" || payload === null) {
    return { ok: false, errors: ["Input must be an object"] };
  }

  const p = payload as Record<string, unknown>;
  const errors: string[] = [];

  // Validate timeSlot
  if (!validateTimeSlot(p.timeSlot)) {
    errors.push(
      "Time slot must be one of: MORNING, AFTERNOON, EVENING, NIGHT"
    );
  }

  // Validate frequency
  const frequencyValidation = validateFrequency(p.frequency);
  if (!frequencyValidation.ok) {
    errors.push(...frequencyValidation.errors);
  }

  // Validate timing
  const timingValidation = validateTiming(p.timing);
  if (!timingValidation.ok) {
    errors.push(...timingValidation.errors);
  }

  // Validate optional note
  const noteValidation = validateNote(p.note, 300);
  if (!noteValidation.ok) {
    errors.push(...noteValidation.errors);
  }

  if (errors.length > 0) {
    return { ok: false, errors };
  }

  // Safe to access .value after checking errors.length === 0
  return {
    ok: true,
    value: {
      timeSlot: p.timeSlot as TimeSlot,
      frequency: frequencyValidation.ok ? frequencyValidation.value : "",
      timing: timingValidation.ok ? timingValidation.value : "",
      note: noteValidation.ok ? noteValidation.value : undefined,
    },
  };
}
