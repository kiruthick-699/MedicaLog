import type { AwarenessSummaryData, UserScheduleLogStatus, AwarenessSnapshotData } from "@/lib/data/persistence";
import { EmptyState } from "@/components/ui/EmptyState";
import QuickIntakeButton from "@/components/client/QuickIntakeButton";

type DashboardViewProps = {
  summary: AwarenessSummaryData;
  adherenceRate: number;
  awarenessFlag: "On track" | "Needs attention";
  quickSchedules: UserScheduleLogStatus[];
  intakeLogged: boolean;
  aiSnapshot: AwarenessSnapshotData | null;
};

export default function DashboardView({ summary, adherenceRate, awarenessFlag, quickSchedules, intakeLogged, aiSnapshot }: DashboardViewProps) {
  const hasMedications = summary.totalMedications > 0;
  const hasConditions = summary.totalConditions > 0;

  // Count AI awareness signals if snapshot exists and has sufficient data
  let aiSignalCount = 0;
  if (aiSnapshot && aiSnapshot.dataSufficiency) {
    try {
      const patterns = JSON.parse(aiSnapshot.medicationPatterns);
      const signals = JSON.parse(aiSnapshot.adherenceSignals);
      const associations = JSON.parse(aiSnapshot.observationAssociations);
      
      // Count non-empty findings
      aiSignalCount = [
        patterns?.findings?.length || 0,
        signals?.findings?.length || 0,
        associations?.findings?.length || 0,
      ].reduce((a, b) => a + b, 0);
    } catch {
      // If parsing fails, show 0 signals
      aiSignalCount = 0;
    }
  }

  return (
    <main className="min-h-screen bg-white" aria-labelledby="dashboard-title">
      <div className="max-w-6xl mx-auto px-4 py-12 space-y-12">
        <header className="space-y-3">
          <h1 id="dashboard-title" className="text-5xl font-bold text-black tracking-tight">Dashboard</h1>
          <p className="text-base text-black/70">Informational overview of your current data. No medical advice.</p>
          <div className="pt-3">
            <a href="/medications" className="inline-block border border-black px-3 py-2 text-sm font-medium">
              Manage Medications
            </a>
          </div>
        </header>

        {intakeLogged ? (
          <div className="border border-black/10 rounded-lg p-4 bg-white">
            <p className="text-sm text-black/80">Intake logged successfully.</p>
          </div>
        ) : null}

        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6" aria-label="Summary cards">
          <div className="border border-black/10 rounded-xl p-6 bg-white min-h-32 flex flex-col justify-between">
            <p className="text-xs font-semibold uppercase tracking-widest text-black/60">Medications</p>
            <p className="text-5xl font-bold text-black mt-3">{summary.totalMedications}</p>
            <p className="text-sm text-black/70 mt-3">Saved medications</p>
          </div>
          <div className="border border-black/10 rounded-xl p-6 bg-white min-h-32 flex flex-col justify-between">
            <p className="text-xs font-semibold uppercase tracking-widest text-black/60">Conditions</p>
            <p className="text-5xl font-bold text-black mt-3">{summary.totalConditions}</p>
            <p className="text-sm text-black/70 mt-3">Reference only</p>
          </div>
          <div className="border border-black/10 rounded-xl p-6 bg-white min-h-32 flex flex-col justify-between">
            <p className="text-xs font-semibold uppercase tracking-widest text-black/60">Schedules</p>
            <p className="text-5xl font-bold text-black mt-3">{summary.totalSchedules}</p>
            <p className="text-sm text-black/70 mt-3">Routine entries</p>
          </div>
          <div className="border border-black/10 rounded-xl p-6 bg-white min-h-32 flex flex-col justify-between">
            <p className="text-xs font-semibold uppercase tracking-widest text-black/60">Status</p>
            <p className="text-4xl font-bold text-black mt-3">{awarenessFlag}</p>
            <p className="text-sm text-black/70 mt-3">Indicator</p>
          </div>
        </section>

        {!hasMedications && (
          <EmptyState
            title="No medications saved"
            description="Add medications with schedules to see your summary."
          />
        )}

        {(hasMedications || hasConditions) && (
          <section className="border-t border-b border-black/10 bg-white py-10 px-6" aria-label="Awareness summary">
            <div className="max-w-full space-y-8">
              <div className="space-y-2">
                <h2 className="text-3xl font-bold text-black">Your Awareness Summary</h2>
                <p className="text-base text-black/75">
                  Based on your saved medications and schedules, here is your current monitoring state.
                </p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-widest text-black/60">Adherence rate</p>
                  <p className="text-6xl font-bold text-black">{adherenceRate}%</p>
                  <p className="text-sm text-black/70">
                    Derived from your scheduled entries per medication.
                  </p>
                </div>

                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-widest text-black/60">Awareness indicator</p>
                  <p className="text-4xl font-bold text-black">{awarenessFlag}</p>
                  <p className="text-sm text-black/70">
                    Neutral flag based on your adherence rate.
                  </p>
                </div>

                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-widest text-black/60">Data summary</p>
                  <div className="space-y-1 text-sm text-black/80">
                    <p><span className="font-semibold">{summary.totalMedications}</span> medications</p>
                    <p><span className="font-semibold">{summary.totalConditions}</span> conditions</p>
                    <p><span className="font-semibold">{summary.totalSchedules}</span> schedules</p>
                  </div>
                </div>
              </div>

              {aiSnapshot && (
                <div className="border-t border-black/10 pt-6 space-y-3">
                  <p className="text-xs font-semibold uppercase tracking-widest text-black/60">AI awareness signals</p>
                  {aiSnapshot.dataSufficiency ? (
                    <p className="text-lg text-black/80">
                      <span className="font-semibold">{aiSignalCount}</span> awareness signal{aiSignalCount === 1 ? '' : 's'} detected
                    </p>
                  ) : (
                    <p className="text-lg text-black/80">
                      Not enough data available yet to generate awareness insights.
                    </p>
                  )}
                  <p className="text-xs text-black/50">
                    <a href="/insights" className="underline hover:text-black">View detailed AI awareness »</a>
                  </p>
                </div>
              )}

              <div className="border-t border-black/10 pt-6">
                <p className="text-xs text-black/50">
                  Last updated {summary.lastUpdated.toLocaleString()} • All information is for awareness purposes only and not medical advice.
                </p>
              </div>
            </div>
          </section>
        )}

        {hasMedications && quickSchedules.length > 0 && (
          <section className="space-y-4" aria-label="Quick intake logging">
            <h2 className="text-2xl font-bold text-black">Quick intake logging (today)</h2>
            <p className="text-sm text-black/70">Mark taken or missed for each scheduled entry. No edits, no observations.</p>
            <div className="space-y-3">
              {quickSchedules.map((s) => (
                <div key={s.scheduleId} className="border border-black/10 rounded-lg p-4 flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-sm text-black/80"><span className="font-semibold">{s.medicationName}</span> — {s.timeSlot}</p>
                    <p className="text-xs text-black/60">{s.frequency} • {s.timing}</p>
                  </div>
                  <QuickIntakeButton medicationId={s.medicationId} scheduleId={s.scheduleId} alreadyLogged={s.alreadyLoggedToday} />
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
