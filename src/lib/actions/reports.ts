/**
 * Server action: Generate wellness awareness report for authenticated user
 */
"use server";

import { requireUser } from "@/lib/server/auth";
import { getUserWithRelations, getMedicationIntakeLogs, getMealLogsForDateRange } from "@/lib/data/persistence";
import { generateWellnessReport, WellnessReport } from "@/lib/reports/wellnessReport";
import { mapToSafeError } from "@/lib/errors";

export interface GenerateWellnessReportInput {
  daysBack?: number; // default 30 days
}

export interface GenerateWellnessReportResult {
  ok: boolean;
  data?: WellnessReport;
  errors?: string[];
}

export async function generateWellnessReportAction(
  input: GenerateWellnessReportInput = {}
): Promise<GenerateWellnessReportResult> {
  const user = await requireUser({ onFail: "throw" });

  try {
    const daysBack = input.daysBack || 30;
    const endDate = new Date();
    const startDate = new Date(endDate.getTime() - daysBack * 24 * 60 * 60 * 1000);

    // Fetch user data
    const userData = await getUserWithRelations(user.id);
    if (!userData) {
      return { ok: false, errors: ["User data not found"] };
    }

    // Fetch intake logs for date range
    const intakeLogs = await getMedicationIntakeLogs(user.id, startDate, endDate);

    // Fetch meal logs for date range
    const mealLogs = await getMealLogsForDateRange(user.id, startDate, endDate);

    // Generate report
    const report = generateWellnessReport({
      medications: userData.medications.map((m) => ({
        ...m,
        schedules: (m as any).schedules || [],
      })),
      intakeLogs,
      mealLogs,
      dateRange: { startDate, endDate },
    });

    return { ok: true, data: report };
  } catch (err) {
    const safe = mapToSafeError(err, "Failed to generate wellness report");
    return { ok: false, errors: [safe.message] };
  }
}
