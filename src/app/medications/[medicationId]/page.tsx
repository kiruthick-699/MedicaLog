import { requireUser } from "@/lib/server/auth";
import { getMedicationWithSchedules, hasIntakeLogForToday } from "@/lib/data/persistence";
import { notFound } from "next/navigation";
import { IntakeLogger } from "@/components/client/IntakeLogger";

export default async function MedicationDetailsPage({ params, searchParams }: { params: Promise<{ medicationId: string }>; searchParams?: Promise<Record<string, string | string[] | undefined>> }) {
  const user = await requireUser();
  const resolvedParams = await params;
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const med = await getMedicationWithSchedules(resolvedParams.medicationId);

  if (!med || med.userId !== user.id) {
    notFound();
  }

  const schedulesWithLogStatus = await Promise.all(
    med.schedules.map(async (s) => ({
      ...s,
      alreadyLogged: await hasIntakeLogForToday(s.id),
    }))
  );

  return (
    <main className="min-h-screen bg-white" aria-labelledby="medication-title">
      <div className="max-w-4xl mx-auto px-4 py-12 space-y-10">
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
          const intakeLogged = getParam("intakeLogged");
          const any = updated === "1" || scheduleUpdated === "1" || scheduleDeleted === "1" || added === "1" || scheduleAdded === "1" || intakeLogged === "1";
          if (!any) return null;
          const message = added === "1"
            ? "Medication has been added."
            : scheduleAdded === "1"
            ? "Schedule has been added."
            : updated === "1"
            ? "Medication details have been updated."
            : scheduleUpdated === "1"
            ? "Schedule has been updated."
            : intakeLogged === "1"
            ? "Intake logged successfully."
            : "Schedule has been removed.";
          return (
            <div className="border border-green-200 bg-green-50 rounded-lg p-4">
              <p className="text-sm text-green-800 font-medium">✓ {message}</p>
            </div>
          );
        })()}
        
        <div className="flex items-center justify-between">
          <a href="/medications" className="text-sm underline hover:text-black/70">← Back to Manage Medications</a>
        </div>

        <section className="border border-black/10 rounded-xl p-6 bg-white space-y-4" aria-label="Medication summary">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <h1 id="medication-title" className="text-3xl font-bold text-black">{med.name}</h1>
              <p className="text-sm text-black/60">
                Active since {med.createdAt.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </p>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <a href={`/medications/${med.id}/edit`} className="underline hover:text-black/70">Edit</a>
              <a href={`/medications/${med.id}/delete`} className="underline text-red-600 hover:text-red-700">Delete</a>
            </div>
          </div>
        </section>

        <section className="space-y-5" aria-label="Schedules">
          <h2 className="text-2xl font-bold text-black">Schedules & Intake Logging</h2>
          {schedulesWithLogStatus.length === 0 ? (
            <div className="border border-black/10 rounded-xl p-8 bg-white text-center space-y-3">
              <p className="text-sm text-black/70">No schedules added yet. Add a schedule to start tracking intake.</p>
              <a
                href={`/medications/${med.id}/schedules/add`}
                className="inline-block px-4 py-2 border border-black rounded-md bg-black text-white text-sm font-medium hover:bg-black/90"
              >
                Add Schedule
              </a>
            </div>
          ) : (
            <div className="space-y-3">
              {schedulesWithLogStatus.map((s) => (
                <div key={s.id} className="border border-black/10 rounded-xl p-5 bg-white space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <p className="text-base font-semibold text-black">
                        {s.timeSlot.charAt(0) + s.timeSlot.slice(1).toLowerCase()}
                      </p>
                      <p className="text-sm text-black/60">Frequency: {s.frequency}</p>
                      <p className="text-sm text-black/60">Timing: {s.timing}</p>
                      {s.note && <p className="text-sm text-black/50">Note: {s.note}</p>}
                    </div>
                    <div className="flex items-center gap-3 text-xs">
                      <a href={`/medications/${med.id}/schedules/${s.id}/edit`} className="underline hover:text-black/70">Edit</a>
                      <a href={`/medications/${med.id}/schedules/${s.id}/delete`} className="underline text-red-600 hover:text-red-700">Delete</a>
                    </div>
                  </div>
                  <div className="border-t border-black/10 pt-3">
                    <p className="text-xs font-semibold uppercase tracking-widest text-black/60 mb-2">Today's Intake</p>
                    <IntakeLogger
                      scheduleId={s.id}
                      medicationId={med.id}
                      timeSlot={s.timeSlot}
                      alreadyLogged={s.alreadyLogged}
                    />
                  </div>
                </div>
              ))}
              <div className="pt-2">
                <a
                  href={`/medications/${med.id}/schedules/add`}
                  className="inline-block px-4 py-2 border border-black/20 rounded-md text-sm font-medium hover:bg-black/5"
                >
                  Add Another Schedule
                </a>
              </div>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
