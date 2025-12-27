import { requireUser } from "@/lib/server/auth";
import { getMedicationWithSchedules } from "@/lib/data/persistence";
import { notFound, redirect } from "next/navigation";
import DeleteMedicationConfirm from "@/components/client/DeleteMedicationConfirm";
import { deleteMedicationAction } from "@/lib/actions/medications";

export default async function DeleteMedicationPage({ params }: { params: Promise<{ medicationId: string }> }) {
  const user = await requireUser();
  const resolvedParams = await params;
  const med = await getMedicationWithSchedules(resolvedParams.medicationId);

  if (!med || med.userId !== user.id) {
    notFound();
  }

  // Wrap the imported server action to accept FormData for <form action>
  const action = async (formData: FormData) => {
    "use server";
    const medicationId = String(formData.get("medicationId") || "");
    const result = await deleteMedicationAction({ medicationId });
    if (!result.ok) {
      // Calm failure: stay on page with a query indicator
      redirect(`/medications/${med.id}/delete?error=1`);
    }
  };

  return (
    <main className="min-h-screen bg-white" aria-labelledby="delete-title">
      <div className="max-w-5xl mx-auto px-4 py-12 space-y-10">
        <header className="space-y-2">
          <h1 id="delete-title" className="text-4xl font-bold text-black tracking-tight">Delete medication</h1>
          <p className="text-sm text-black/70">This will remove the medication and its schedules. This action cannot be undone.</p>
        </header>

        <section className="space-y-6 border border-black/10 rounded-xl p-6 bg-white" aria-label="Delete confirmation">
          <p className="text-xl font-semibold text-black">{med.name}</p>
          <div className="flex items-center gap-6">
            <DeleteMedicationConfirm action={action} medicationId={med.id} />
            <a href={`/medications/${med.id}`} className="underline">Cancel</a>
          </div>
        </section>
      </div>
    </main>
  );
}
