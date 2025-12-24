import { Suspense } from "react";
import { IntroCardsView } from "@/components/dashboard/onboarding/IntroCardsView";
import { ConditionsView } from "@/components/dashboard/onboarding/ConditionsView";
import { MedicationSetupView } from "@/components/dashboard/onboarding/MedicationSetupView";
import { getStepMetadata } from "@/lib/logic/onboarding";
import type { OnboardingStep } from "@/lib/logic/onboarding";

interface OnboardingPageProps {
  searchParams: Promise<{
    step?: string;
  }>;
}

export default async function OnboardingPage({
  searchParams,
}: OnboardingPageProps) {
  const params = await searchParams;
  const currentStep = (params.step || "intro") as OnboardingStep;
  const stepMetadata = getStepMetadata(currentStep);

  const renderStep = (step: OnboardingStep) => {
    switch (step) {
      case "intro":
        return <IntroCardsView />;
      case "conditions":
        return <ConditionsView />;
      case "medications":
        return <MedicationSetupView />;
      case "redirect":
        return (
          <div className="text-center space-y-4">
            <h1 className="text-2xl font-bold">Setup Complete!</h1>
            <p className="text-gray-600">Redirecting to your dashboard...</p>
          </div>
        );
      default:
        return <IntroCardsView />;
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Progress indicator */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h2 className="text-sm font-medium text-gray-600">
                Step {stepMetadata.stepNumber} of {stepMetadata.totalSteps}
              </h2>
              {stepMetadata.isOptional && (
                <span className="text-xs text-gray-500">(optional)</span>
              )}
            </div>
          </div>
          {/* Progress bar */}
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{
                width: `${(stepMetadata.stepNumber / stepMetadata.totalSteps) * 100}%`,
              }}
            />
          </div>
        </div>

        {/* Content */}
        <Suspense fallback={<div>Loading...</div>}>
          {renderStep(currentStep)}
        </Suspense>

        {/* Navigation buttons */}
        {currentStep !== "redirect" && (
          <div className="mt-8 flex gap-4 justify-between">
            {currentStep !== "intro" && (
              <a
                href={`/onboarding?step=${currentStep === "conditions" ? "intro" : "conditions"}`}
                className="px-6 py-2 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition"
              >
                Back
              </a>
            )}
            <a
              href={`/onboarding?step=${currentStep === "intro" ? "conditions" : currentStep === "conditions" ? "medications" : "redirect"}`}
              className="ml-auto px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition"
            >
              {currentStep === "medications" ? "Complete Setup" : "Next"}
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
