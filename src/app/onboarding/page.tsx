import { getCurrentUser } from "@/lib/server/auth";
import { getUserWithRelations } from "@/lib/data/persistence";
import { redirect } from "next/navigation";

export default async function OnboardingPage() {
  // Server-side: if a user is authenticated, determine onboarding state and redirect
  const current = await getCurrentUser();
  if (current) {
    const user = await getUserWithRelations(current.id);
    // Deterministic rule: if the user already has any medications or conditions,
    // consider onboarding complete (or partially complete) and send them to dashboard.
    if (user && (user.medications.length > 0 || user.conditions.length > 0)) {
      redirect("/dashboard");
    }
    // Otherwise, allow the authenticated user to complete onboarding server-side.
  }

  return (
    <main className="min-h-screen bg-white" aria-labelledby="onboarding-title">
      <div className="max-w-3xl mx-auto px-4 py-12 space-y-10">
        <header className="space-y-3">
          <h1 id="onboarding-title" className="text-4xl font-bold text-gray-900 tracking-tight">Onboarding</h1>
          <p className="text-base text-gray-700">
            A short, informational setup to capture your profile, medications, and conditions. This is not medical advice. Consult your healthcare professional for guidance.
          </p>
        </header>

        <section className="space-y-4" aria-label="Onboarding steps">
          <div className="border border-gray-200 rounded-xl p-5 bg-gray-50">
            <h2 className="text-xl font-semibold text-gray-900">Welcome</h2>
            <p className="text-sm text-gray-600 mt-1">Introduction to the system and how data is organized.</p>
          </div>

          <div className="border border-gray-200 rounded-xl p-5 bg-gray-50">
            <h2 className="text-xl font-semibold text-gray-900">Your Profile</h2>
            <p className="text-sm text-gray-600 mt-1">Basic information to identify your records (no medical decisions).</p>
          </div>

          <div className="border border-gray-200 rounded-xl p-5 bg-gray-50">
            <h2 className="text-xl font-semibold text-gray-900">Medications</h2>
            <p className="text-sm text-gray-600 mt-1">Current routines and timing notes for awareness purposes only.</p>
          </div>

          <div className="border border-gray-200 rounded-xl p-5 bg-gray-50">
            <h2 className="text-xl font-semibold text-gray-900">Conditions (optional)</h2>
            <p className="text-sm text-gray-600 mt-1">Reference of diagnosed conditions to provide context to your data.</p>
          </div>

          <div className="border border-gray-200 rounded-xl p-5 bg-gray-50">
            <h2 className="text-xl font-semibold text-gray-900">Review</h2>
            <p className="text-sm text-gray-600 mt-1">Confirm entries for accuracy before proceeding.</p>
          </div>
        </section>

        <section className="border border-amber-200 bg-amber-50 text-amber-900 rounded-xl p-4" aria-label="Informational notice">
          <p className="text-sm font-medium">Important</p>
          <p className="text-sm mt-1">
            This setup collects information only. It does not provide medical advice, diagnosis, or treatment.
          </p>
        </section>
      </div>
    </main>
  );
}
