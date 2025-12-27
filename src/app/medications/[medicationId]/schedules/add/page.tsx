import { requireUser } from "@/lib/server/auth";
import { getMedicationWithSchedules } from "@/lib/data/persistence";
import { notFound } from "next/navigation";
import { AddScheduleForm } from "@/components/client/AddScheduleForm";

export default async function AddSchedulePage({ params }: { params: Promise<{ medicationId: string }> }) {
  const resolvedParams = await params;
  const user = await requireUser();
  const med = await getMedicationWithSchedules(resolvedParams.medicationId);

  if (!med || med.userId !== user.id) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-white" aria-labelledby="add-schedule-title">
      <div className="max-w-4xl mx-auto px-4 py-12 space-y-8">
        <div className="flex items-center justify-between">
          <a href={`/medications/${med.id}`} className="text-sm underline">Back to medication</a>
        </div>

        <header className="space-y-2">
          <h1 id="add-schedule-title" className="text-4xl font-bold text-black tracking-tight">Add schedule</h1>
          <p className="text-sm text-black/70">Create a schedule for {med.name}. You can add more schedules later.</p>
        </header>

        <section className="border border-black/10 rounded-xl p-6 bg-white" aria-label="Add schedule form">
          <AddScheduleForm medicationId={med.id} />
        </section>
      </div>
    </main>
  );
}
