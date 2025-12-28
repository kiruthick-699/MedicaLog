// Server-side AI pattern analysis service
// Strictly constrained LLM integration with no medical advice, no diagnosis
// Pure functions: accepts only derived metrics, returns structured JSON

import type { IntakeMetricsBundle } from "@/lib/analysis/intakeMetrics";

// ---------------------------
// Output Schema Types
// ---------------------------

export interface MedicationPattern {
  type: "irregular_intake" | "timing_inconsistency" | "observation_cluster";
  medicationId: string;
  context: string; // e.g., "Evening schedule" — plain description only
  confidence: "low" | "moderate" | "high";
}

export interface AdherenceSignal {
  signal: "missed_streak" | "low_adherence" | "inconsistent_pattern";
  medicationId: string;
  severity: "low" | "moderate";
}

export interface ObservationAssociation {
  observation: string; // e.g., "dizziness" — a keyword from data
  temporalRelation: "within_24_hours" | "same_day" | "unclear";
  confidence: "low" | "moderate" | "high";
}

export interface AIPatternAnalysisResult {
  medicationPatterns: MedicationPattern[];
  adherenceSignals: AdherenceSignal[];
  observationAssociations: ObservationAssociation[];
  dataQuality: {
    logsInWindow: number;
    sufficiencyLevel: "insufficient" | "minimal" | "adequate" | "robust";
  };
}

// ---------------------------
// Data Sufficiency
// ---------------------------

function assessDataSufficiency(
  logsInWindow: number,
  numSchedules: number,
  daysInWindow: number
): "insufficient" | "minimal" | "adequate" | "robust" {
  const expectedLogs = numSchedules * daysInWindow;
  const coverage = logsInWindow / (expectedLogs || 1);

  if (coverage < 0.2) return "insufficient";
  if (coverage < 0.5) return "minimal";
  if (coverage < 0.8) return "adequate";
  return "robust";
}

function isSufficientForAnalysis(coverage: "insufficient" | "minimal" | "adequate" | "robust"): boolean {
  return coverage !== "insufficient" && coverage !== "minimal";
}

// ---------------------------
// Prompt Construction (Non-Negotiable)
// ---------------------------

function buildSystemPrompt(): string {
  return `You are a deterministic pattern recognition system for medication intake analysis.

CONSTRAINTS (MANDATORY):
- You MUST NOT provide medical advice, diagnoses, recommendations, or instructions.
- You MUST NOT use imperative language or urgency language.
- You MUST NOT infer causation or suggest interventions.
- You MUST output valid JSON only, with no additional text.
- You MUST assign confidence levels (low, moderate, high) based on data evidence.
- If data is sparse or insufficient, return empty arrays in the result.
- You MUST NOT guess or extrapolate beyond the data.

ROLE:
- Identify patterns in intake behavior (regularity, timing, consistency).
- Identify deviations from expected patterns.
- Identify temporal associations between observations and intake events (without causal claims).

OUTPUT FORMAT:
Always respond with valid JSON matching this exact structure (no additional prose):
{
  "medicationPatterns": [
    {
      "type": "irregular_intake" | "timing_inconsistency" | "observation_cluster",
      "medicationId": "...",
      "context": "plain description only, no recommendations",
      "confidence": "low" | "moderate" | "high"
    }
  ],
  "adherenceSignals": [
    {
      "signal": "missed_streak" | "low_adherence" | "inconsistent_pattern",
      "medicationId": "...",
      "severity": "low" | "moderate"
    }
  ],
  "observationAssociations": [
    {
      "observation": "keyword from data",
      "temporalRelation": "within_24_hours" | "same_day" | "unclear",
      "confidence": "low" | "moderate" | "high"
    }
  ]
}

EXAMPLES OF WHAT NOT TO DO:
- "Patient should reduce evening doses" ← FORBIDDEN (advice)
- "This indicates diabetes" ← FORBIDDEN (diagnosis)
- "High risk of adverse event" ← FORBIDDEN (urgency)
- "Likely caused by stress" ← FORBIDDEN (causation inference)

EXAMPLES OF WHAT TO DO:
- "Evening schedule shows 40% missed rate" ← OK (fact with metric)
- "Observation 'dizziness' appears on 3 days with morning dose" ← OK (association without claim)
- "Adherence varies 10-90% week-to-week" ← OK (pattern description)
`;
}

function buildUserPrompt(metrics: IntakeMetricsBundle, locale: string = "en"): string {
  const adherence = metrics.adherence;
  const missed = metrics.missed;
  const timing = metrics.timing;
  const consistency = metrics.consistency;
  const observations = metrics.observations;

  const perScheduleSummaries = missed.perSchedule.map((m) => {
    const timingData = timing.perSchedule.find((t) => t.scheduleId === m.scheduleId);
    const consistencyData = consistency.perSchedule.find((c) => c.scheduleId === m.scheduleId);
    const variance = consistencyData?.varianceTakenRatio;
    return `Schedule ${m.scheduleId.slice(0, 8)}: ${m.longestMissedStreak} longest missed streak, variance ${variance ? (variance * 100).toFixed(1) : "N/A"}%`;
  }).join("\n");

  const observationSummary = Object.entries(observations.frequencies)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10)
    .map(([word, count]) => `"${word}" (${count}x)`)
    .join(", ");

  return `Analyze intake patterns for medication ${metrics.medicationId} (${metrics.timeWindow.days} days):

Adherence: ${(adherence.adherenceRate * 100).toFixed(1)}% (${adherence.takenCount}/${adherence.expectedCount})
Schedules in window: ${missed.perSchedule.length}

Per-Schedule Details:
${perScheduleSummaries}

Timing Variance:
${timing.perSchedule.map((t) => `${t.scheduleId.slice(0, 8)}: ${t.avgAbsMinutes !== null ? t.avgAbsMinutes.toFixed(1) : "no data"} min avg`).join("\n")}

Consistency (daily TAKEN/MISSED variance):
${consistency.perSchedule.map((c) => `${c.scheduleId.slice(0, 8)}: ${c.varianceTakenRatio !== null ? (c.varianceTakenRatio * 100).toFixed(1) : "N/A"}%`).join("\n")}

Observations (top keywords): ${observationSummary || "none"}

Identify patterns, deviations, and temporal associations without advice or diagnosis.`;
}

// ---------------------------
// Safe JSON Parsing
// ---------------------------

function parseAIResponse(text: string): AIPatternAnalysisResult | null {
  try {
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) return null;
    const json = JSON.parse(match[0]);
    
    // Validate structure
    if (!Array.isArray(json.medicationPatterns)) json.medicationPatterns = [];
    if (!Array.isArray(json.adherenceSignals)) json.adherenceSignals = [];
    if (!Array.isArray(json.observationAssociations)) json.observationAssociations = [];

    return {
      medicationPatterns: json.medicationPatterns || [],
      adherenceSignals: json.adherenceSignals || [],
      observationAssociations: json.observationAssociations || [],
      dataQuality: json.dataQuality || { logsInWindow: 0, sufficiencyLevel: "insufficient" },
    };
  } catch {
    return null;
  }
}

// ---------------------------
// Safe Invocation
// ---------------------------

/**
 * Analyze intake metrics via LLM with strict safety constraints.
 * Skips analysis if data is insufficient; returns empty result on failure.
 */
export async function analyzeIntakePatterns(
  metrics: IntakeMetricsBundle,
  openaiApiKey: string = process.env.OPENAI_API_KEY || ""
): Promise<AIPatternAnalysisResult> {
  // Compute log count from metrics for sufficiency check
  const logsInWindow = metrics.adherence.takenCount + (metrics.adherence.expectedCount - metrics.adherence.takenCount);
  const numSchedules = metrics.missed.perSchedule.length;
  const daysInWindow = metrics.timeWindow.days;

  const sufficiency = assessDataSufficiency(logsInWindow, numSchedules, daysInWindow);

  // Return empty result if insufficient data
  if (!isSufficientForAnalysis(sufficiency)) {
    return {
      medicationPatterns: [],
      adherenceSignals: [],
      observationAssociations: [],
      dataQuality: { logsInWindow, sufficiencyLevel: sufficiency },
    };
  }

  // Skip AI if no API key
  if (!openaiApiKey) {
    return {
      medicationPatterns: [],
      adherenceSignals: [],
      observationAssociations: [],
      dataQuality: { logsInWindow, sufficiencyLevel: sufficiency },
    };
  }

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${openaiApiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4-turbo",
        messages: [
          { role: "system", content: buildSystemPrompt() },
          { role: "user", content: buildUserPrompt(metrics) },
        ],
        temperature: 0.2, // Low temperature for deterministic, precise output
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      // Log error server-side but return safe fallback
      // eslint-disable-next-line no-console
      console.error("OpenAI API error:", response.status);
      return {
        medicationPatterns: [],
        adherenceSignals: [],
        observationAssociations: [],
        dataQuality: { logsInWindow, sufficiencyLevel: sufficiency },
      };
    }

    const data = (await response.json()) as { choices: Array<{ message: { content: string } }> };
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      return {
        medicationPatterns: [],
        adherenceSignals: [],
        observationAssociations: [],
        dataQuality: { logsInWindow, sufficiencyLevel: sufficiency },
      };
    }

    const parsed = parseAIResponse(content);
    if (!parsed) {
      // Malformed response; return safe fallback
      return {
        medicationPatterns: [],
        adherenceSignals: [],
        observationAssociations: [],
        dataQuality: { logsInWindow, sufficiencyLevel: sufficiency },
      };
    }

    // Attach data quality info
    parsed.dataQuality = { logsInWindow, sufficiencyLevel: sufficiency };
    return parsed;
  } catch (err) {
    // Network or parse error; return safe fallback
    // eslint-disable-next-line no-console
    console.error("Pattern analysis error:", err);
    return {
      medicationPatterns: [],
      adherenceSignals: [],
      observationAssociations: [],
      dataQuality: { logsInWindow, sufficiencyLevel: sufficiency },
    };
  }
}

/**
 * Analyze multiple medications at once (convenience wrapper).
 */
export async function analyzeMultipleMedications(
  metricsBundles: IntakeMetricsBundle[],
  openaiApiKey?: string
): Promise<Record<string, AIPatternAnalysisResult>> {
  const results: Record<string, AIPatternAnalysisResult> = {};
  for (const bundle of metricsBundles) {
    results[bundle.medicationId] = await analyzeIntakePatterns(bundle, openaiApiKey);
  }
  return results;
}
