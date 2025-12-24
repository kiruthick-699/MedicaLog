import { generateMockPatientWithData, prepareDashboardAwareness } from "@/lib/data/preparation";
import { getAwarenessFlag } from "@/lib/logic/awareness";

export function InsightsView() {
  const patient = generateMockPatientWithData();
  const awareness = prepareDashboardAwareness(patient, 6, 8);
  const awarenessFlag = getAwarenessFlag(awareness.adherenceRate);

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto px-4 py-10 space-y-8">
        <header className="space-y-2">
          <p className="text-sm font-semibold text-blue-700">Insights & Awareness</p>
          <h1 className="text-3xl font-bold text-gray-900">Overview</h1>
          <p className="text-gray-600">
            Informational summary based on current medication and condition data. This is not a diagnosis or treatment plan.
          </p>
        </header>

        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="border border-gray-200 rounded-xl p-4 bg-gray-50">
            <p className="text-sm text-gray-500">Medications</p>
            <p className="text-2xl font-semibold text-gray-900">{awareness.totalMedications}</p>
          </div>
          <div className="border border-gray-200 rounded-xl p-4 bg-gray-50">
            <p className="text-sm text-gray-500">Conditions (reference)</p>
            <p className="text-2xl font-semibold text-gray-900">{awareness.totalConditions}</p>
          </div>
          <div className="border border-gray-200 rounded-xl p-4 bg-gray-50">
            <p className="text-sm text-gray-500">Adherence rate</p>
            <p className="text-2xl font-semibold text-gray-900">{awareness.adherenceRate}%</p>
          </div>
          <div className="border border-gray-200 rounded-xl p-4 bg-gray-50">
            <p className="text-sm text-gray-500">Awareness flag</p>
            <p className="text-lg font-semibold text-gray-900">{awarenessFlag}</p>
          </div>
        </section>

        <section className="border border-gray-200 rounded-xl p-6 bg-white space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Upcoming doses</h2>
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

        <section className="border border-amber-200 bg-amber-50 text-amber-900 rounded-xl p-4">
          <p className="text-sm font-medium">Important</p>
          <p className="text-sm mt-1">
            This information is informational only. Always consult qualified healthcare professionals for medical decisions, diagnosis, or treatment.
          </p>
        </section>
      </div>
    </div>
  );
}
