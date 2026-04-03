import { requireUser } from "@/lib/server/auth";
import { getUserWithRelations, getMedicationIntakeLogs, getMealLogsForDateRange } from "@/lib/data/persistence";
import { generateWellnessReport } from "@/lib/reports/wellnessReport";
import { WellnessReportView } from "@/components/server/WellnessReportView";
import { WellnessReportActions } from "@/components/client/WellnessReportActions";
import { DateRangeSelector } from "@/components/client/DateRangeSelector";
import Link from "next/link";

interface SearchParams {
  days?: string;
}

export default async function WellnessReportPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const user = await requireUser();
  const resolvedParams = await searchParams;
  
  // Default to 30 days if not specified
  const daysBack = parseInt(resolvedParams.days || "30", 10);
  const endDate = new Date();
  const startDate = new Date(endDate.getTime() - daysBack * 24 * 60 * 60 * 1000);

  // Fetch user data
  const userData = await getUserWithRelations(user.id);
  if (!userData) {
    return (
      <main className="min-h-screen bg-white">
        <div className="max-w-4xl mx-auto px-4 py-12">
          <p className="text-black/70">Unable to load user data. Please try again.</p>
        </div>
      </main>
    );
  }

  // Fetch logs for the date range
  const intakeLogs = await getMedicationIntakeLogs(user.id, startDate, endDate);
  const mealLogs = await getMealLogsForDateRange(user.id, startDate, endDate);

  // Generate the wellness report
  const report = generateWellnessReport({
    medications: userData.medications.map((m) => ({
      ...m,
      schedules: (m as any).schedules || [],
    })),
    intakeLogs,
    mealLogs,
    dateRange: { startDate, endDate },
  });

  return (
    <main className="min-h-screen bg-white" aria-labelledby="report-title">
      <div className="max-w-4xl mx-auto px-4 py-12 space-y-8">
        <div className="flex items-center justify-between">
          <Link href="/dashboard" className="text-sm underline text-black/70 hover:text-black">
            ← Back to Dashboard
          </Link>
          <DateRangeSelector currentDays={daysBack} />
        </div>

        <hr className="border-black/10" />

        {/* Report Content */}
        <WellnessReportView report={report} />

        {/* Print/Export Actions */}
        <div className="border-t border-black/10 pt-6">
          <WellnessReportActions report={report} />
        </div>

        {/* Footer */}
        <div className="border-t border-black/10 pt-6 text-xs text-black/50 text-center">
          <p>
            This wellness report is generated for your personal awareness only. Always consult with a healthcare
            professional for medical guidance.
          </p>
        </div>
      </div>
    </main>
  );
}
