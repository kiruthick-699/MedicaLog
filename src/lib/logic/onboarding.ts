/**
 * Onboarding flow logic and utilities
 * Pure functions, no React imports
 */

import type { MedicationRoutine } from "@/lib/validation/models";
import { validateMedicationRoutineDetailed } from "@/lib/validation/schemas";

/**
 * Onboarding flow steps
 */
export type OnboardingStep =
  | "intro"
  | "conditions"
  | "medications"
  | "redirect";

/**
 * Get next step in onboarding flow
 */
export function getNextStep(currentStep: OnboardingStep): OnboardingStep {
  const flowSequence: Record<OnboardingStep, OnboardingStep> = {
    intro: "conditions",
    conditions: "medications",
    medications: "redirect",
    redirect: "redirect",
  };

  return flowSequence[currentStep];
}

/**
 * Get previous step in onboarding flow
 */
export function getPreviousStep(currentStep: OnboardingStep): OnboardingStep | null {
  const flowSequence: Record<OnboardingStep, OnboardingStep | null> = {
    intro: null,
    conditions: "intro",
    medications: "conditions",
    redirect: "medications",
  };

  return flowSequence[currentStep];
}

/**
 * Get step metadata
 */
export function getStepMetadata(step: OnboardingStep): {
  title: string;
  description: string;
  stepNumber: number;
  totalSteps: number;
  isOptional: boolean;
} {
  const metadata: Record<
    OnboardingStep,
    {
      title: string;
      description: string;
      stepNumber: number;
      totalSteps: number;
      isOptional: boolean;
    }
  > = {
    intro: {
      title: "Welcome",
      description: "Let's get started with your health tracking",
      stepNumber: 1,
      totalSteps: 3,
      isOptional: false,
    },
    conditions: {
      title: "Your Conditions",
      description: "Tell us about your diagnosed conditions (optional)",
      stepNumber: 2,
      totalSteps: 3,
      isOptional: true,
    },
    medications: {
      title: "Your Medications",
      description: "Set up your medication routine",
      stepNumber: 3,
      totalSteps: 3,
      isOptional: false,
    },
    redirect: {
      title: "Complete",
      description: "Redirecting to your dashboard",
      stepNumber: 4,
      totalSteps: 3,
      isOptional: false,
    },
  };

  return metadata[step];
}

/**
 * Validate medication routine for onboarding
 */
export function validateOnboardingMedication(
  medication: unknown
): {
  valid: boolean;
  medication?: MedicationRoutine;
  errors: string[];
} {
  const result = validateMedicationRoutineDetailed(medication);

  if (!result.valid) {
    return { valid: false, errors: result.errors };
  }

  return { valid: true, medication: medication as MedicationRoutine, errors: [] };
}

/**
 * Build redirect URL after onboarding completion
 */
export function buildOnboardingCompleteUrl(patientId: string): string {
  return `/dashboard?patient=${patientId}&onboarded=true`;
}
