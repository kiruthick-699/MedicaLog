import type { AwarenessSummaryData } from "@/lib/data/persistence";
import { EmptyState } from "@/components/ui/EmptyState";

type DashboardViewProps = {
  summary: AwarenessSummaryData;
  adherenceRate: number;
  awarenessFlag: "On track" | "Needs attention";
};

export default function DashboardView({ summary, adherenceRate, awarenessFlag }: DashboardViewProps) {
  const hasMedications = summary.totalMedications > 0;
  const hasConditions = summary.totalConditions > 0;

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

              <div className="border-t border-black/10 pt-6">
                <p className="text-xs text-black/50">
                  Last updated {summary.lastUpdated.toLocaleString()} • All information is for awareness purposes only and not medical advice.
                </p>
              </div>
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
