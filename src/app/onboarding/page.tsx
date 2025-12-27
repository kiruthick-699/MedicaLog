import { getCurrentUser } from "@/lib/server/auth";
import { getUserWithRelations } from "@/lib/data/persistence";
import { redirect } from "next/navigation";
import { OnboardingFlow } from "@/components/client/OnboardingFlow";

export default async function OnboardingPage({ searchParams }: { searchParams?: Promise<Record<string, string | string[] | undefined>> }) {
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

  const resolvedSearchParams = searchParams ? await searchParams : {};
  return (
    <main className="min-h-screen bg-white" aria-labelledby="onboarding-title">
      <div className="max-w-4xl mx-auto px-4 py-10 space-y-6">
        {(() => {
          const v = (resolvedSearchParams as any)?.reset;
          const reset = Array.isArray(v) ? v[0] : v;
          if (reset !== "1") return null;
          return (
            <div className="border border-black/10 rounded-lg p-4 bg-white">
              <p className="text-sm text-black/80">Your data has been reset. You can rebuild your medications and conditions at your own pace.</p>
            </div>
          );
        })()}
        <header className="space-y-2">
          <h1 id="onboarding-title" className="text-3xl font-bold text-black">Onboarding</h1>
          <p className="text-sm text-black">
            A short, informational setup to capture your conditions (optional) and a medication routine. This is informational only; no medical advice or recommendations.
          </p>
        </header>

        <OnboardingFlow />
      </div>
    </main>
  );
}
