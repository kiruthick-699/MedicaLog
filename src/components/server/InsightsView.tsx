import type { AwarenessSummaryData } from "@/lib/data/persistence";
import { EmptyState } from "@/components/ui/EmptyState";

type InsightsViewProps = {
  summary: AwarenessSummaryData;
  adherenceRate: number;
  awarenessFlag: "On track" | "Needs attention";
};

export function InsightsView({ summary, adherenceRate, awarenessFlag }: InsightsViewProps) {
  const hasMedications = summary.totalMedications > 0;
  const hasConditions = summary.totalConditions > 0;

  return (
    <main className="min-h-screen bg-white" aria-labelledby="insights-title">
      <div className="max-w-6xl mx-auto px-4 py-12 space-y-12">
        <header className="space-y-4">
          <p className="text-sm font-semibold text-black/70">Insights & Awareness</p>
          <h1 id="insights-title" className="text-5xl font-bold text-black tracking-tight">Your Insights</h1>
          <p className="text-lg text-black/75 leading-relaxed max-w-2xl">
            A neutral, informational view of your monitoring data. This page provides awareness only—no medical recommendations, diagnosis, or clinical guidance.
          </p>
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
            <p className="text-sm text-black/70 mt-3">Informational only</p>
          </div>
          <div className="border border-black/10 rounded-xl p-6 bg-white min-h-32 flex flex-col justify-between">
            <p className="text-xs font-semibold uppercase tracking-widest text-black/60">Schedules</p>
            <p className="text-5xl font-bold text-black mt-3">{summary.totalSchedules}</p>
            <p className="text-sm text-black/70 mt-3">Routine entries</p>
          </div>
          <div className="border border-black/10 rounded-xl p-6 bg-white min-h-32 flex flex-col justify-between">
            <p className="text-xs font-semibold uppercase tracking-widest text-black/60">Status</p>
            <p className="text-4xl font-bold text-black mt-3">{awarenessFlag}</p>
            <p className="text-sm text-black/70 mt-3">Awareness flag</p>
          </div>
        </section>

        {!hasMedications && !hasConditions && (
          <EmptyState
            title="No data yet"
            description="Add medications or conditions to see awareness summaries."
          />
        )}

        <section className="border-t border-black/10 bg-white py-8 px-6" aria-label="Disclaimer">
          <div className="max-w-3xl space-y-3">
            <h2 className="text-lg font-semibold text-black">Important Disclaimer</h2>
            <p className="text-sm text-black/70 leading-relaxed">
              All information displayed on this page is for awareness and monitoring purposes only. This is not a diagnostic system, does not provide medical advice, and does not generate treatment recommendations. These metrics reflect data organization only, not clinical status. Please consult qualified healthcare professionals for any medical decisions, diagnosis, or treatment guidance.
            </p>
            <p className="text-xs text-black/60">
              Last data update: {summary.lastUpdated.toLocaleString()}
            </p>
          </div>
        </section>

        {(hasMedications || hasConditions) && (
          <>
            <section className="border-t border-b border-black/10 bg-white py-10 px-6" aria-label="Awareness insights">
              <div className="max-w-full space-y-8">
                <div className="space-y-3">
                  <h2 className="text-3xl font-bold text-black">Awareness Insights</h2>
                  <p className="text-base text-black/75">
                    These metrics are derived from your saved medications and schedules. They reflect your current monitoring setup and routine coverage.
                  </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div className="space-y-3">
                    <h3 className="text-lg font-semibold text-black">Adherence Rate</h3>
                    <p className="text-6xl font-bold text-black">{adherenceRate}%</p>
                    <p className="text-sm text-black/70 leading-relaxed">
                      This percentage is calculated by dividing your total schedules by your medications. It represents coverage, not behavioral adherence. Scheduling alone does not predict actual intake.
                    </p>
                  </div>

                  <div className="space-y-3">
                    <h3 className="text-lg font-semibold text-black">Awareness Indicator</h3>
                    <p className="text-5xl font-bold text-black">{awarenessFlag}</p>
                    <p className="text-sm text-black/70 leading-relaxed">
                      A neutral flag determined by your adherence rate. "On track" means ≥80% schedule coverage; otherwise "Needs attention". This is informational only.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            <section className="border-t border-b border-black/10 bg-white py-10 px-6" aria-label="Data recap">
              <div className="space-y-4">
                <h2 className="text-2xl font-bold text-black">Your Data Overview</h2>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-center">
                  <div className="space-y-1">
                    <p className="text-4xl font-bold text-black">{summary.totalMedications}</p>
                    <p className="text-sm text-black/70">Medications</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-4xl font-bold text-black">{summary.totalConditions}</p>
                    <p className="text-sm text-black/70">Conditions</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-4xl font-bold text-black">{summary.totalSchedules}</p>
                    <p className="text-sm text-black/70">Schedules</p>
                  </div>
                </div>
              </div>
            </section>
          </>
        )}
      </div>
    </main>
  );
}
