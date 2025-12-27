import { requireUser } from "@/lib/server/auth";
import { AddMedicationForm } from "@/components/client/AddMedicationForm";

export default async function AddMedicationPage() {
  await requireUser();

  return (
    <main className="min-h-screen bg-white" aria-labelledby="add-medication-title">
      <div className="max-w-4xl mx-auto px-4 py-12 space-y-8">
        <div className="flex items-center justify-between">
          <a href="/medications" className="text-sm underline">Back to Manage Medications</a>
        </div>

        <header className="space-y-2">
          <h1 id="add-medication-title" className="text-4xl font-bold text-black tracking-tight">
            Add medication
          </h1>
          <p className="text-sm text-black/70">
            Enter the name of a medication you want to track. You can add schedules and other details after creating it.
          </p>
        </header>

        <section className="border border-black/10 rounded-xl p-6 bg-white" aria-label="Add medication form">
          <AddMedicationForm />
        </section>
      </div>
    </main>
  );
}
