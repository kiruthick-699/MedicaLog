import { requireUser } from "@/lib/server/auth";
import { getMedicationWithSchedules } from "@/lib/data/persistence";
import { notFound } from "next/navigation";
import { EditMedicationForm } from "@/components/client/EditMedicationForm";

export default async function EditMedicationPage({ params }: { params: Promise<{ medicationId: string }> }) {
  const user = await requireUser();
  const resolvedParams = await params;
  const med = await getMedicationWithSchedules(resolvedParams.medicationId);
  if (!med || med.userId !== user.id) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-white" aria-labelledby="edit-medication-title">
      <div className="max-w-5xl mx-auto px-4 py-12 space-y-8">
        <header className="space-y-2">
          <h1 id="edit-medication-title" className="text-3xl font-bold text-black">Edit Medication</h1>
          <p className="text-sm text-black/70">Change the name of this medication. This does not modify schedules.</p>
        </header>

        <section className="border border-black/10 rounded-xl p-6 bg-white">
          <EditMedicationForm medicationId={med.id} initialName={med.name} />
        </section>

        <div className="pt-2">
          <a href={`/medications/${med.id}`} className="underline text-sm">Cancel and return to details</a>
        </div>
      </div>
    </main>
  );
}
