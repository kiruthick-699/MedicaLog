import { requireUser } from "@/lib/server/auth";
import { getMedicationWithSchedules, getMedicationScheduleWithOwnership } from "@/lib/data/persistence";
import { deleteMedicationScheduleAction } from "@/lib/actions/medications";
import { notFound, redirect } from "next/navigation";
import DeleteScheduleConfirm from "@/components/client/DeleteScheduleConfirm";

export default async function DeleteSchedulePage({
  params,
}: {
  params: Promise<{ medicationId: string; scheduleId: string }>;
}) {
  const resolvedParams = await params;
  const user = await requireUser();
  const medication = await getMedicationWithSchedules(resolvedParams.medicationId);

  if (!medication || medication.userId !== user.id) {
    notFound();
  }

  const schedule = await getMedicationScheduleWithOwnership(resolvedParams.scheduleId);
  if (!schedule || schedule.medicationId !== medication.id || schedule.medication.userId !== user.id) {
    notFound();
  }

  const action = async (formData: FormData) => {
    "use server";
    const medicationId = String(formData.get("medicationId") || "");
    const scheduleId = String(formData.get("scheduleId") || "");
    const result = await deleteMedicationScheduleAction({ medicationId, scheduleId });
    if (!result.ok) {
      redirect(`/medications/${medication.id}/schedules/${schedule.id}/delete?error=1`);
    }
  };

  return (
    <main className="min-h-screen bg-white" aria-labelledby="delete-schedule-title">
      <div className="max-w-4xl mx-auto px-4 py-12 space-y-8">
        <header className="space-y-2">
          <h1 id="delete-schedule-title" className="text-4xl font-bold text-black tracking-tight">Delete schedule</h1>
          <p className="text-sm text-black/70">This will remove only this schedule. The medication will remain.</p>
        </header>

        <section className="border border-black/10 rounded-xl p-6 bg-white space-y-4" aria-label="Delete schedule confirmation">
          <div className="space-y-1">
            <p className="text-sm text-black/70">Time slot</p>
            <p className="text-lg font-semibold text-black">{schedule.timeSlot}</p>
          </div>
          <div className="space-y-1">
            <p className="text-sm text-black/70">Timing / frequency</p>
            <p className="text-sm text-black/80">{schedule.timing} · {schedule.frequency}</p>
          </div>

          <div className="flex items-center gap-6 pt-2">
            <DeleteScheduleConfirm action={action} medicationId={medication.id} scheduleId={schedule.id} />
            <a href={`/medications/${medication.id}`} className="underline">Cancel</a>
          </div>
        </section>
      </div>
    </main>
  );
}
