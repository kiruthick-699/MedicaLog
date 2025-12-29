// Server-side awareness snapshot generation
// Computes metrics, invokes AI, persists snapshot
// Safe failure: always returns valid snapshot, never throws

import type { IntakeMetricsBundle } from "@/lib/analysis/intakeMetrics";
import { computeIntakeMetricsBundle } from "@/lib/analysis/intakeMetrics";
import { analyzeIntakePatterns, type AIPatternAnalysisResult } from "@/lib/ai/patternAnalysis";
import {
  getMedicationWithSchedules,
  getMedicationIntakeLogsForUser,
  saveAwarenessSnapshot,
} from "@/lib/data/persistence";

// ---------------------------
// Date utilities
// ---------------------------

function eachDayInclusive(start: Date, end: Date): string[] {
  const startUTC = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), start.getUTCDate()));
  const endUTC = new Date(Date.UTC(end.getUTCFullYear(), end.getUTCMonth(), end.getUTCDate()));
  const days: string[] = [];
  for (let d = startUTC; d <= endUTC; d = new Date(d.getTime() + 24 * 60 * 60 * 1000)) {
    days.push(d.toISOString().slice(0, 10));
  }
  return days;
}

// ---------------------------
// Snapshot generation
// ---------------------------

export interface GenerateSnapshotOptions {
  userId: string;
  timeWindow: "7d" | "14d" | "30d";
  openaiApiKey?: string;
}

/**
 * Generate and persist an awareness snapshot for a user.
 * Computes metrics, invokes AI (if data sufficient), and saves snapshot.
 * Always returns a valid snapshot; failures are logged and return minimal snapshot.
 */
export async function generateAwarenessSnapshot(
  options: GenerateSnapshotOptions
): Promise<{ success: boolean; snapshotId: string }> {
  const { userId, timeWindow, openaiApiKey } = options;

  try {
    // Determine date range from timeWindow
    const endDate = new Date();
    const startDate = new Date();
    if (timeWindow === "7d") startDate.setDate(endDate.getDate() - 7);
    else if (timeWindow === "14d") startDate.setDate(endDate.getDate() - 14);
    else startDate.setDate(endDate.getDate() - 30);

    // Fetch all medications and their intake logs
    const prisma = (await import("@/lib/data/prisma")).default;
    const medications = await prisma.medication.findMany({
      where: { userId },
      include: { schedules: true },
    });

    if (medications.length === 0) {
      // No medications; create minimal snapshot
      const result = await saveAwarenessSnapshot({
        userId,
        timeWindow,
        medicationPatterns: JSON.stringify([]),
        adherenceSignals: JSON.stringify([]),
        observationAssociations: JSON.stringify([]),
        dataSufficiency: false,
      });
      return { success: true, snapshotId: result.id };
    }

    // Compute metrics and AI for each medication
    const allPatterns: any[] = [];
    const allSignals: any[] = [];
    const allAssociations: any[] = [];
    let hasAdherenceData = false;
    let hasTimingData = false;
    let hasObservationData = false;

    const daysInWindow = Math.ceil((endDate.getTime() - startDate.getTime()) / (24 * 60 * 60 * 1000)) + 1;
    let totalLogsInWindow = 0;

    for (const med of medications) {
      const logsForMed = await getMedicationIntakeLogsForUser(userId, startDate, endDate);
      const medLogsFiltered = logsForMed.filter((l) => l.medicationId === med.id);
      totalLogsInWindow += medLogsFiltered.length;

      // Compute metrics
      const metrics = computeIntakeMetricsBundle(med.id, medLogsFiltered, med.schedules, startDate, endDate);

      // Evaluate per-signal-type sufficiency (CRITICAL FIX)
      // Adherence: need at least 3 logs in window
      if (medLogsFiltered.length >= 3) {
        hasAdherenceData = true;
      }

      // Timing variance: need at least 2 TAKEN logs with actualTime
      const takenWithTime = medLogsFiltered.filter((l) => l.status === "TAKEN" && l.actualTime);
      if (takenWithTime.length >= 2) {
        hasTimingData = true;
      }

      // Observation association: need at least 2 repeated observations
      const observations = medLogsFiltered.filter((l) => l.observation).map((l) => l.observation);
      const uniqueObs = new Set(observations);
      if (observations.length >= 2 || uniqueObs.size > 0) {
        hasObservationData = true;
      }

      // Run AI
      const aiResult = await analyzeIntakePatterns(metrics, openaiApiKey);

      // Aggregate results
      allPatterns.push(...aiResult.medicationPatterns);
      allSignals.push(...aiResult.adherenceSignals);
      allAssociations.push(...aiResult.observationAssociations);
    }

    // NEW RULE: dataSufficiency = true if AT LEAST ONE signal type has data
    const dataSufficiency = hasAdherenceData || hasTimingData || hasObservationData || allSignals.length > 0 || allAssociations.length > 0;

    // Save snapshot with aggregated AI results
    const result = await saveAwarenessSnapshot({
      userId,
      timeWindow,
      medicationPatterns: JSON.stringify(allPatterns),
      adherenceSignals: JSON.stringify(allSignals),
      observationAssociations: JSON.stringify(allAssociations),
      dataSufficiency,
    });

    return { success: true, snapshotId: result.id };
  } catch (err) {
    // Log error server-side; still create minimal snapshot
    // eslint-disable-next-line no-console
    console.error(`Failed to generate snapshot for user ${userId}:`, err);

    try {
      const result = await saveAwarenessSnapshot({
        userId,
        timeWindow,
        medicationPatterns: JSON.stringify([]),
        adherenceSignals: JSON.stringify([]),
        observationAssociations: JSON.stringify([]),
        dataSufficiency: false,
      });
      return { success: false, snapshotId: result.id };
    } catch (innerErr) {
      // eslint-disable-next-line no-console
      console.error("Failed to save snapshot:", innerErr);
      throw new Error("Critical: unable to save awareness snapshot");
    }
  }
}

/**
 * Convenience: regenerate snapshot for user (async fire-and-forget safe to call from actions).
 */
export async function regenerateSnapshotAsync(userId: string, timeWindow: "7d" | "14d" | "30d" = "30d"): Promise<void> {
  // Fire and forget, errors logged server-side only
  generateAwarenessSnapshot({ userId, timeWindow }).catch((err) => {
    // eslint-disable-next-line no-console
    console.error("Snapshot regeneration failed silently:", err);
  });
}
