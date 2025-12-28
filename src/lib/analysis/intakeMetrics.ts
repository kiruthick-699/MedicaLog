// Server-side deterministic feature extraction for immutable intake logs
// Pure functions only: no side effects, no DB access, no client usage

import type { MedicationIntakeLog, MedicationSchedule, TimeSlot } from "@prisma/client";

// ---------------------------
// Helper: date utilities
// ---------------------------

export function toDateOnlyString(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function eachDayInclusive(start: Date, end: Date): string[] {
  const startUTC = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), start.getUTCDate()));
  const endUTC = new Date(Date.UTC(end.getUTCFullYear(), end.getUTCMonth(), end.getUTCDate()));
  const days: string[] = [];
  for (let d = startUTC; d <= endUTC; d = new Date(d.getTime() + 24 * 60 * 60 * 1000)) {
    days.push(toDateOnlyString(d));
  }
  return days;
}

// ---------------------------
// Helper: map TimeSlot to canonical time (UTC hours)
// ---------------------------

const TIME_SLOT_HOUR: Record<TimeSlot, number> = {
  MORNING: 9,
  AFTERNOON: 13,
  EVENING: 18,
  NIGHT: 22,
};

function canonicalSlotDateTime(dateString: string, slot: TimeSlot): Date {
  const [y, m, d] = dateString.split("-").map((s) => parseInt(s, 10));
  return new Date(Date.UTC(y, m - 1, d, TIME_SLOT_HOUR[slot], 0, 0));
}

function absMinutesDiff(a: Date, b: Date): number {
  return Math.abs(Math.round((a.getTime() - b.getTime()) / 60000));
}

// ---------------------------
// Types for outputs
// ---------------------------

export interface AdherenceRateMetric {
  medicationId: string;
  timeWindow: { start: string; end: string; days: number };
  expectedCount: number;
  takenCount: number;
  adherenceRate: number; // 0..1
}

export interface MissedStreakPerSchedule {
  scheduleId: string;
  longestMissedStreak: number;
  currentMissedStreak: number;
}

export interface MissedStreaksMetric {
  medicationId: string;
  timeWindow: { start: string; end: string; days: number };
  perSchedule: MissedStreakPerSchedule[];
}

export interface TimingVariancePerSchedule {
  scheduleId: string;
  samples: number;
  avgAbsMinutes: number | null; // null when no samples with actualTime
}

export interface TimingVarianceMetric {
  medicationId: string;
  perSchedule: TimingVariancePerSchedule[];
}

export interface ConsistencyPerSchedule {
  scheduleId: string;
  dailyTakenCounts: number[]; // sequence aligned with days in window; values 0..n per day (here 0 or 1)
  dailyMissedCounts: number[]; // 0..n per day (here 0 or 1)
  varianceTakenRatio: number | null; // null when insufficient data
}

export interface IntakeConsistencyMetric {
  medicationId: string;
  timeWindow: { start: string; end: string; days: number };
  perSchedule: ConsistencyPerSchedule[];
}

export interface ObservationFrequenciesMetric {
  medicationId: string;
  timeWindow: { start: string; end: string; days: number };
  frequencies: Record<string, number>;
}

export interface IntakeMetricsBundle {
  medicationId: string;
  timeWindow: { start: string; end: string; days: number };
  adherence: AdherenceRateMetric;
  missed: MissedStreaksMetric;
  timing: TimingVarianceMetric;
  consistency: IntakeConsistencyMetric;
  observations: ObservationFrequenciesMetric;
}

// ---------------------------
// Metric implementations
// ---------------------------

/**
 * Compute adherence rate = TAKEN / expected, where expected equals days * number of schedules that existed that day.
 * Schedules created after the window start count only from their creation day onward.
 */
export function computeAdherenceRate(
  medicationId: string,
  logs: MedicationIntakeLog[],
  schedules: MedicationSchedule[],
  windowStart: Date,
  windowEnd: Date
): AdherenceRateMetric {
  const days = eachDayInclusive(windowStart, windowEnd);
  let expected = 0;
  for (const day of days) {
    for (const s of schedules) {
      const createdDay = toDateOnlyString(s.createdAt);
      if (createdDay <= day) {
        expected += 1;
      }
    }
  }
  const takenCount = logs.filter((l) => l.medicationId === medicationId && l.status === "TAKEN" && days.includes(l.logDate)).length;
  const adherenceRate = expected === 0 ? 0 : takenCount / expected;
  return {
    medicationId,
    timeWindow: { start: toDateOnlyString(windowStart), end: toDateOnlyString(windowEnd), days: days.length },
    expectedCount: expected,
    takenCount,
    adherenceRate,
  };
}

/**
 * Compute missed dose streaks per schedule based solely on explicit MISSED logs.
 */
export function computeMissedStreaks(
  medicationId: string,
  logs: MedicationIntakeLog[],
  schedules: MedicationSchedule[],
  windowStart: Date,
  windowEnd: Date
): MissedStreaksMetric {
  const days = eachDayInclusive(windowStart, windowEnd);
  const perSchedule: MissedStreakPerSchedule[] = [];

  for (const s of schedules) {
    let longest = 0;
    let current = 0;
    for (const day of days) {
      const missed = logs.some((l) => l.scheduleId === s.id && l.logDate === day && l.status === "MISSED");
      if (missed) {
        current += 1;
        if (current > longest) longest = current;
      } else {
        current = 0;
      }
    }
    perSchedule.push({ scheduleId: s.id, longestMissedStreak: longest, currentMissedStreak: current });
  }

  return {
    medicationId,
    timeWindow: { start: toDateOnlyString(windowStart), end: toDateOnlyString(windowEnd), days: days.length },
    perSchedule,
  };
}

/**
 * Compute timing variance per schedule using absolute minutes between scheduled slot canonical time and actualTime.
 * Only logs with actualTime are considered; MISSED without actualTime are ignored.
 */
export function computeTimingVariance(
  medicationId: string,
  logs: MedicationIntakeLog[],
  schedules: MedicationSchedule[],
  windowStart: Date,
  windowEnd: Date
): TimingVarianceMetric {
  const days = new Set(eachDayInclusive(windowStart, windowEnd));
  const perSchedule: TimingVariancePerSchedule[] = [];

  for (const s of schedules) {
    const samples: number[] = [];
    for (const l of logs) {
      if (l.scheduleId !== s.id) continue;
      if (!days.has(l.logDate)) continue;
      if (!l.actualTime) continue;
      const slotTime = canonicalSlotDateTime(l.logDate, s.timeSlot);
      samples.push(absMinutesDiff(slotTime, l.actualTime));
    }
    const avg = samples.length === 0 ? null : samples.reduce((a, b) => a + b, 0) / samples.length;
    perSchedule.push({ scheduleId: s.id, samples: samples.length, avgAbsMinutes: avg });
  }

  return { medicationId, perSchedule };
}

/**
 * Intake consistency: distribution of TAKEN vs MISSED over time and variance of the daily taken ratio.
 */
export function computeIntakeConsistency(
  medicationId: string,
  logs: MedicationIntakeLog[],
  schedules: MedicationSchedule[],
  windowStart: Date,
  windowEnd: Date
): IntakeConsistencyMetric {
  const days = eachDayInclusive(windowStart, windowEnd);
  const perSchedule: ConsistencyPerSchedule[] = [];

  for (const s of schedules) {
    const dailyTaken: number[] = [];
    const dailyMissed: number[] = [];
    for (const day of days) {
      const taken = logs.some((l) => l.scheduleId === s.id && l.logDate === day && l.status === "TAKEN") ? 1 : 0;
      const missed = logs.some((l) => l.scheduleId === s.id && l.logDate === day && l.status === "MISSED") ? 1 : 0;
      dailyTaken.push(taken);
      dailyMissed.push(missed);
    }
    const ratios: number[] = days.map((_, i) => {
      const denom = dailyTaken[i] + dailyMissed[i];
      return denom === 0 ? 0 : dailyTaken[i] / denom;
    });
    const mean = ratios.length === 0 ? 0 : ratios.reduce((a, b) => a + b, 0) / ratios.length;
    const variance = ratios.length === 0 ? null : ratios.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / ratios.length;
    perSchedule.push({ scheduleId: s.id, dailyTakenCounts: dailyTaken, dailyMissedCounts: dailyMissed, varianceTakenRatio: variance });
  }

  return {
    medicationId,
    timeWindow: { start: toDateOnlyString(windowStart), end: toDateOnlyString(windowEnd), days: days.length },
    perSchedule,
  };
}

/**
 * Observation frequency: count keywords (>=3 chars, a-z0-9) in observations within window.
 */
export function computeObservationFrequencies(
  medicationId: string,
  logs: MedicationIntakeLog[],
  windowStart: Date,
  windowEnd: Date
): ObservationFrequenciesMetric {
  const days = new Set(eachDayInclusive(windowStart, windowEnd));
  const freq: Record<string, number> = {};
  for (const l of logs) {
    if (l.medicationId !== medicationId) continue;
    if (!days.has(l.logDate)) continue;
    const text = (l.observation || "").toLowerCase();
    if (!text) continue;
    const tokens = text.split(/[^a-z0-9]+/i).filter((t) => t.length >= 3);
    for (const t of tokens) {
      freq[t] = (freq[t] || 0) + 1;
    }
  }
  return {
    medicationId,
    timeWindow: { start: toDateOnlyString(windowStart), end: toDateOnlyString(windowEnd), days: Array.from(days).length },
    frequencies: freq,
  };
}

/**
 * Bundle all metrics for a single medication with provided logs and schedules.
 */
export function computeIntakeMetricsBundle(
  medicationId: string,
  logs: MedicationIntakeLog[],
  schedules: MedicationSchedule[],
  windowStart: Date,
  windowEnd: Date
): IntakeMetricsBundle {
  const adherence = computeAdherenceRate(medicationId, logs, schedules, windowStart, windowEnd);
  const missed = computeMissedStreaks(medicationId, logs, schedules, windowStart, windowEnd);
  const timing = computeTimingVariance(medicationId, logs, schedules, windowStart, windowEnd);
  const consistency = computeIntakeConsistency(medicationId, logs, schedules, windowStart, windowEnd);
  const observations = computeObservationFrequencies(medicationId, logs, windowStart, windowEnd);
  return {
    medicationId,
    timeWindow: adherence.timeWindow,
    adherence,
    missed,
    timing,
    consistency,
    observations,
  };
}
