/**
 * Server-side data preparation functions
 * Pure functions with no side effects, no React imports
 */

import type {
  PatientProfile,
  MedicationRoutine,
  DiagnosedCondition,
} from "@/lib/validation/models";

/**
 * Mock patient data generator for onboarding
 */
function createMockPatient(id: string, name: string): PatientProfile {
  return {
    id,
    name,
    dateOfBirth: new Date("1970-01-15"),
    medications: [],
    conditions: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

/**
 * Mock medication generator
 */
function createMockMedication(
  id: string,
  name: string,
  frequency: MedicationRoutine["frequency"]
): MedicationRoutine {
  const timeSlots =
    frequency === "once-daily"
      ? [{ hour: 8, minute: 0, label: "morning" }]
      : frequency === "twice-daily"
        ? [
            { hour: 8, minute: 0, label: "morning" },
            { hour: 20, minute: 0, label: "evening" },
          ]
        : frequency === "three-times-daily"
          ? [
              { hour: 8, minute: 0, label: "morning" },
              { hour: 13, minute: 0, label: "afternoon" },
              { hour: 20, minute: 0, label: "evening" },
            ]
          : [{ hour: 8, minute: 0 }];

  return {
    id,
    name,
    frequency,
    timeSlots,
    timing: {},
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

/**
 * Mock condition generator
 */
function createMockCondition(
  id: string,
  name: string,
  icdCode?: string
): DiagnosedCondition {
  return {
    id,
    name,
    icdCode,
    dateOfDiagnosis: new Date("2023-01-01"),
  };
}

/**
 * Onboarding data structure
 */
export interface OnboardingData {
  patientId: string;
  patientName: string;
  step: "welcome" | "profile" | "medications" | "conditions" | "review";
  completedSteps: string[];
  estimatedTimeMinutes: number;
}

/**
 * Prepare onboarding data for new patients
 */
export function prepareOnboardingData(
  patientId: string,
  patientName: string
): OnboardingData {
  return {
    patientId,
    patientName,
    step: "welcome",
    completedSteps: [],
    estimatedTimeMinutes: 10,
  };
}

/**
 * Get onboarding steps
 */
export function getOnboardingSteps(): Array<{
  id: string;
  title: string;
  description: string;
  order: number;
}> {
  return [
    {
      id: "welcome",
      title: "Welcome",
      description: "Introduction to the system",
      order: 1,
    },
    {
      id: "profile",
      title: "Your Profile",
      description: "Basic patient information",
      order: 2,
    },
    {
      id: "medications",
      title: "Medications",
      description: "Current medication routines",
      order: 3,
    },
    {
      id: "conditions",
      title: "Conditions",
      description: "Diagnosed conditions (optional)",
      order: 4,
    },
    {
      id: "review",
      title: "Review",
      description: "Confirm your information",
      order: 5,
    },
  ];
}

/**
 * Dashboard awareness summary
 */
export interface DashboardAwareness {
  totalMedications: number;
  totalConditions: number;
  adherenceRate: number;
  upcomingMedications: Array<{
    medicationName: string;
    timeSlot: string;
    minutesUntil: number;
  }>;
  lastUpdated: Date;
}

/**
 * Prepare dashboard awareness summary
 * Shows patient overview without personal details
 */
export function prepareDashboardAwareness(
  patient: PatientProfile,
  adheredMedications: number,
  totalScheduledMedications: number
): DashboardAwareness {
  const currentTime = new Date();
  const totalMedications = patient.medications.length;
  const totalConditions = patient.conditions?.length ?? 0;

  // Calculate adherence rate
  const adherenceRate =
    totalScheduledMedications > 0
      ? Math.round((adheredMedications / totalScheduledMedications) * 100)
      : 0;

  // Find upcoming medications for next 4 hours
  const upcomingMedications = getUpcomingMedications(
    patient.medications,
    currentTime,
    4 // hours
  );

  return {
    totalMedications,
    totalConditions,
    adherenceRate,
    upcomingMedications,
    lastUpdated: currentTime,
  };
}

/**
 * Get upcoming medications within specified hours
 */
function getUpcomingMedications(
  medications: MedicationRoutine[],
  fromTime: Date,
  hoursAhead: number
): Array<{
  medicationName: string;
  timeSlot: string;
  minutesUntil: number;
}> {
  const upcoming: Array<{
    medicationName: string;
    timeSlot: string;
    minutesUntil: number;
  }> = [];

  const currentHour = fromTime.getHours();
  const currentMinute = fromTime.getMinutes();
  const endHour = (currentHour + hoursAhead) % 24;

  medications.forEach((med) => {
    med.timeSlots.forEach((slot) => {
      const isUpcoming =
        hoursAhead >= 24
          ? true // If checking 24+ hours, all slots are upcoming
          : slot.hour > currentHour ||
            (slot.hour === currentHour && slot.minute > currentMinute);

      if (isUpcoming) {
        const minutesDiff =
          (slot.hour - currentHour + 24) % 24 === 0
            ? slot.minute - currentMinute
            : (slot.hour - currentHour + 24) % 24 * 60 + (slot.minute - currentMinute);

        if (minutesDiff >= 0 && minutesDiff <= hoursAhead * 60) {
          upcoming.push({
            medicationName: med.name,
            timeSlot: formatTimeSlot(slot),
            minutesUntil: minutesDiff,
          });
        }
      }
    });
  });

  // Sort by minutes until
  return upcoming.sort((a, b) => a.minutesUntil - b.minutesUntil);
}

/**
 * Format time slot for display
 */
function formatTimeSlot(slot: {
  hour: number;
  minute: number;
  label?: string;
}): string {
  const hour = slot.hour.toString().padStart(2, "0");
  const minute = slot.minute.toString().padStart(2, "0");
  const time = `${hour}:${minute}`;

  return slot.label ? `${slot.label} (${time})` : time;
}

/**
 * Mock data generator for testing
 */
export function generateMockPatientWithData(
  patientId: string = "patient-1",
  patientName: string = "John Doe"
): PatientProfile {
  const patient = createMockPatient(patientId, patientName);

  patient.medications = [
    createMockMedication("med-1", "Lisinopril", "once-daily"),
    createMockMedication("med-2", "Metformin", "twice-daily"),
    createMockMedication("med-3", "Atorvastatin", "once-daily"),
  ];

  patient.conditions = [
    createMockCondition("cond-1", "Type 2 Diabetes", "E11"),
    createMockCondition("cond-2", "Hypertension", "I10"),
    createMockCondition("cond-3", "Hyperlipidemia", "E78.5"),
  ];

  patient.emergencyContact = {
    name: "Jane Doe",
    relationship: "Spouse",
    phoneNumber: "+1-555-0123",
  };

  return patient;
}
