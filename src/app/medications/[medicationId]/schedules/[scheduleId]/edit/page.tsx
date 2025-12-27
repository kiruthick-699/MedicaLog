import { requireUser } from "@/lib/server/auth";
import { getMedicationWithSchedules, getMedicationScheduleWithOwnership } from "@/lib/data/persistence";
import { notFound } from "next/navigation";
import { EditScheduleForm } from "@/components/client/EditScheduleForm";

export default async function EditSchedulePage({
  params,
}: {
  params: Promise<{ medicationId: string; scheduleId: string }>;
}) {
  const user = await requireUser();
  const resolvedParams = await params;
  const medication = await getMedicationWithSchedules(resolvedParams.medicationId);

  if (!medication || medication.userId !== user.id) {
    notFound();
  }

  const schedule = await getMedicationScheduleWithOwnership(resolvedParams.scheduleId);
  if (!schedule || schedule.medicationId !== medication.id || schedule.medication.userId !== user.id) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-white" aria-labelledby="edit-schedule-title">
      <div className="max-w-4xl mx-auto px-4 py-12 space-y-8">
        <header className="space-y-2">
          <h1 id="edit-schedule-title" className="text-4xl font-bold text-black tracking-tight">Edit schedule</h1>
          <p className="text-sm text-black/70">Update the schedule for {medication.name}.</p>
        </header>

        <section className="border border-black/10 rounded-xl p-6 bg-white" aria-label="Edit schedule form">
          <EditScheduleForm
            medicationId={medication.id}
            scheduleId={schedule.id}
            initialTimeSlot={schedule.timeSlot}
            initialFrequency={schedule.frequency}
            initialTiming={schedule.timing}
            initialNote={schedule.note || ""}
          />
        </section>
      </div>
    </main>
  );
}
