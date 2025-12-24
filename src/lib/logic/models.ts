/**
 * Domain models for chronic care monitoring system
 * Pure TypeScript types - no React imports
 */

/**
 * Frequency of medication routine
 */
export type MedicationFrequency =
  | "once-daily"
  | "twice-daily"
  | "three-times-daily"
  | "four-times-daily"
  | "every-12-hours"
  | "every-8-hours"
  | "every-6-hours"
  | "as-needed";

/**
 * Time slot for medication administration
 */
export interface TimeSlot {
  hour: number; // 0-23
  minute: number; // 0-59
  label?: string; // e.g., "morning", "noon", "evening"
}

/**
 * Medication routine configuration
 */
export interface MedicationRoutine {
  id: string;
  name: string;
  frequency: MedicationFrequency;
  timeSlots: TimeSlot[];
  timing: {
    withFood?: boolean;
    withWater?: boolean;
    beforeFood?: boolean;
    afterFood?: boolean;
  };
  note?: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Optional diagnosed condition reference
 * For informational purposes only - not for medical advice
 */
export interface DiagnosedCondition {
  id: string;
  name: string;
  icdCode?: string; // ICD-10 code for reference
  dateOfDiagnosis: Date;
  notes?: string;
}

/**
 * Patient profile for chronic care monitoring
 */
export interface PatientProfile {
  id: string;
  name: string;
  dateOfBirth: Date;
  medications: MedicationRoutine[];
  conditions?: DiagnosedCondition[];
  emergencyContact?: {
    name: string;
    relationship: string;
    phoneNumber: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Medication adherence log entry
 */
export interface MedicationAdherenceEntry {
  id: string;
  medicationRoutineId: string;
  scheduledTime: Date;
  actualTime?: Date;
  taken: boolean;
  notes?: string;
  createdAt: Date;
}
