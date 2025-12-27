import { requireUser } from "@/lib/server/auth";
import { getMedicationWithSchedules } from "@/lib/data/persistence";
import { notFound } from "next/navigation";

export default async function MedicationDetailsPage({ params, searchParams }: { params: Promise<{ medicationId: string }>; searchParams?: Promise<Record<string, string | string[] | undefined>> }) {
  const user = await requireUser();
  const resolvedParams = await params;
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const med = await getMedicationWithSchedules(resolvedParams.medicationId);

  if (!med || med.userId !== user.id) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-white" aria-labelledby="medication-title">
      <div className="max-w-6xl mx-auto px-4 py-12 space-y-12">
        {(() => {
          const getParam = (key: string) => {
            const v = (resolvedSearchParams as any)?.[key];
            return Array.isArray(v) ? v[0] : v;
          };
          const updated = getParam("updated");
          const scheduleUpdated = getParam("scheduleUpdated");
          const scheduleDeleted = getParam("scheduleDeleted");
          const added = getParam("added");
          const scheduleAdded = getParam("scheduleAdded");
          const any = updated === "1" || scheduleUpdated === "1" || scheduleDeleted === "1" || added === "1" || scheduleAdded === "1";
          if (!any) return null;
          const message = added === "1"
            ? "Medication has been added."
            : scheduleAdded === "1"
            ? "Schedule has been added."
            : updated === "1"
            ? "Medication details have been updated."
            : scheduleUpdated === "1"
            ? "Schedule has been updated."
            : "Schedule has been removed.";
          return (
            <div className="border border-black/10 rounded-lg p-4 bg-white">
              <p className="text-sm text-black/80">{message}</p>
            </div>
          );
        })()}
        <div className="flex items-center justify-between">
          <a href="/medications" className="text-sm underline">Back to Manage Medications</a>
          <a href={`/medications/${med.id}/schedules/add`} className="text-sm underline">Add schedule</a>
        </div>

        <section className="space-y-4 border border-black/10 rounded-xl p-6 bg-white" aria-label="Medication summary">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <h1 id="medication-title" className="text-4xl font-bold text-black">{med.name}</h1>
              <p className="text-sm text-black/70">Read-only view of this medication and its schedules.</p>
            </div>
            <div className="flex items-center gap-4 text-sm">
              <a href={`/medications/${med.id}/edit`} className="underline">Edit medication</a>
              <a href={`/medications/${med.id}/delete`} className="underline">Delete medication</a>
            </div>
          </div>
        </section>

        <section className="space-y-5 border-t border-b border-black/10 py-8" aria-label="Schedules">
          <h2 className="text-2xl font-bold text-black">Schedules</h2>
          {med.schedules.length === 0 ? (
            <div className="space-y-3">
              <p className="text-sm text-black/70">This medication does not have any schedules yet. You can keep it without schedules or add them later to track timing.</p>
              <a
                href={`/medications/${med.id}/schedules/add`}
                className="inline-block px-4 py-2 border border-black rounded-md bg-black text-white text-sm font-medium"
              >
                Add a schedule
              </a>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex justify-end">
                <a
                  href={`/medications/${med.id}/schedules/add`}
                  className="inline-block px-3 py-2 border border-black rounded-md bg-black text-white text-sm font-medium"
                >
                  Add schedule
                </a>
              </div>
              {med.schedules.map((s) => (
                <div key={s.id} className="border border-black/10 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <p className="text-sm text-black/80">Time slot: {s.timeSlot}</p>
                      <p className="text-sm text-black/80">Frequency: {s.frequency}</p>
                      <p className="text-sm text-black/80">Timing: {s.timing}</p>
                      {s.note ? <p className="text-sm text-black/60">Note: {s.note}</p> : null}
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                      <a href={`/medications/${med.id}/schedules/${s.id}/edit`} className="underline">Edit schedule</a>
                      <a href={`/medications/${med.id}/schedules/${s.id}/delete`} className="underline">Delete schedule</a>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
