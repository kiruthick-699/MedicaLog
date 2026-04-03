import { requireUser } from "@/lib/server/auth";
import { UnifiedMedicationForm } from "@/components/client/UnifiedMedicationForm";

export default async function AddMedicationPage() {
  await requireUser();

  return (
    <main className="min-h-screen bg-white" aria-labelledby="add-medication-title">
      <div className="max-w-3xl mx-auto px-4 py-12 space-y-8">
        <div className="flex items-center justify-between">
          <a href="/medications" className="text-sm underline hover:text-black/70">← Back to Manage Medications</a>
        </div>

        <header className="space-y-2">
          <h1 id="add-medication-title" className="text-4xl font-bold text-black tracking-tight">
            Add Medication
          </h1>
          <p className="text-sm text-black/70">
            Create a medication with its schedule in one step. This system does not provide medical advice.
          </p>
        </header>

        <section aria-label="Add medication form">
          <UnifiedMedicationForm />
        </section>
      </div>
    </main>
  );
}
