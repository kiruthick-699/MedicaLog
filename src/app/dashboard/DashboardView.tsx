import { generateMockPatientWithData, prepareDashboardAwareness } from "@/lib/data/preparation";
import { getAwarenessFlag } from "@/lib/logic/awareness";
import { EmptyState } from "@/components/ui/EmptyState";
import { InfoBanner } from "@/components/ui/InfoBanner";

export default function DashboardView() {
  const patient = generateMockPatientWithData();
  const awareness = prepareDashboardAwareness(patient, 6, 8);
  const awarenessFlag = getAwarenessFlag(awareness.adherenceRate);

  return (
    <main className="min-h-screen bg-white" aria-labelledby="dashboard-title">
      <div className="max-w-4xl mx-auto px-4 py-12 space-y-10">
        <header className="space-y-3">
          <h1 id="dashboard-title" className="text-4xl font-bold text-gray-900 tracking-tight">Dashboard</h1>
          <p className="text-base text-gray-700">Informational overview of your current data. No medical advice.</p>
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

        {awareness.totalMedications === 0 && (
          <EmptyState
            title="No medications added yet"
            description="Add medications to start tracking schedules and awareness indicators."
          />
        )}

        {awareness.totalMedications > 0 && awareness.upcomingMedications.length === 0 && (
          <InfoBanner>
            No upcoming doses right now. If schedules are not configured, timing will not appear.
          </InfoBanner>
        )}

        <section className="border border-gray-200 rounded-xl p-6 bg-white space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">Upcoming doses</h2>
            <p className="text-sm text-gray-500">Planned within the next 4 hours</p>
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

          {awareness.totalMedications === 0 && (
            <p className="text-xs text-gray-500 mt-3">
              Awareness indicators appear once medications and schedules are added.
            </p>
          )}
        </section>
      </div>
    </main>
  );
}
