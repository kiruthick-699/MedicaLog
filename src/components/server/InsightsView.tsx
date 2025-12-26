import { generateMockPatientWithData, prepareDashboardAwareness } from "@/lib/data/preparation";
import { getAwarenessFlag } from "@/lib/logic/awareness";
import { EmptyState } from "@/components/ui/EmptyState";

export function InsightsView() {
  const patient = generateMockPatientWithData();
  const awareness = prepareDashboardAwareness(patient, 6, 8);
  const awarenessFlag = getAwarenessFlag(awareness.adherenceRate);

  return (
    <main className="min-h-screen bg-white" aria-labelledby="insights-title">
      <div className="max-w-4xl mx-auto px-4 py-12 space-y-10">
        <header className="space-y-3">
          <p className="text-sm font-semibold text-blue-700">Insights & Awareness</p>
          <h1 id="insights-title" className="text-4xl font-bold text-gray-900 tracking-tight">Overview</h1>
          <p className="text-base text-gray-700">
            Neutral, informational summary of your current setup. This is not medical advice, diagnosis, or treatment.
          </p>
        </header>

        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="border border-gray-200 rounded-xl p-4 bg-gray-50">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-600">Medications</p>
            <p className="text-3xl font-semibold text-gray-900 mt-1">{awareness.totalMedications}</p>
            <p className="text-[13px] text-gray-600 mt-2">Informational awareness only.</p>
          </div>
          <div className="border border-gray-200 rounded-xl p-4 bg-gray-50">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-600">Conditions (informational)</p>
            <p className="text-3xl font-semibold text-gray-900 mt-1">{awareness.totalConditions}</p>
            <p className="text-[13px] text-gray-600 mt-2">Not a diagnostic or recommendation system.</p>
          </div>
          {awareness.totalMedications === 0 && awareness.totalConditions === 0 && (
            <EmptyState
              title="No data yet"
              description="Add medications or conditions to see awareness summaries."
            />
          )}
            <div className="border border-gray-200 rounded-xl p-4 bg-gray-50">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-600">Adherence rate</p>
              <p className="text-3xl font-semibold text-gray-900 mt-1">{awareness.adherenceRate}%</p>
            <p className="text-[13px] text-gray-600 mt-2">For awareness; consult your healthcare professional.</p>
            </div>
            <div className="border border-gray-200 rounded-xl p-4 bg-gray-50">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-600">Awareness flag</p>
              <p className="text-xl font-semibold text-gray-900 mt-1">{awarenessFlag}</p>
            <p className="text-[13px] text-gray-600 mt-2">Neutral indicator, not clinical guidance.</p>
            </div>
        </section>

        <section className="border border-gray-200 rounded-xl p-6 bg-white space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">Upcoming doses</h2>
            <p className="text-sm text-gray-500">Next 4 hours</p>
          </div>
          {awareness.upcomingMedications.length === 0 ? (
            <p className="text-sm text-gray-600">No upcoming doses in this window.</p>
          ) : (
            <div className="space-y-3">
              {awareness.upcomingMedications.map((item) => (
                <div
                  key={`${item.medicationName}-${item.timeSlot}-${item.minutesUntil}`}
                  className="flex justify-between items-center border border-gray-200 rounded-lg p-3"
                >
                  <div>
                    <p className="font-medium text-gray-900">{item.medicationName}</p>
                    <p className="text-sm text-gray-600">{item.timeSlot}</p>
                  </div>
                  <p className="text-sm text-gray-700">In {item.minutesUntil} min</p>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="border border-amber-200 bg-amber-50 text-amber-900 rounded-xl p-4" aria-label="Informational notice">
          <p className="text-sm font-medium">Important</p>
          <p className="text-sm mt-1">
            Content shown here is for information only. Consult qualified healthcare professionals for medical decisions, diagnosis, or treatment.
          </p>
        </section>
      </div>
    </main>
  );
}
